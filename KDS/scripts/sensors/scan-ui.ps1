<#
.SYNOPSIS
    KDS UI Component Sensor - Scans Blazor .razor files for components, routes, and test IDs

.DESCRIPTION
    Extracts UI components, @page routes, data-testid attributes, component hierarchy,
    and API call patterns from Blazor .razor files.
    
    Part of KDS v5.0 Brain System - Week 2: UI Component Sensor

.PARAMETER Mode
    Scan mode: 'Full' (all files) or 'Incremental' (only changed files since last scan)

.PARAMETER OutputPath
    Path to output ui-components.json file (default: KDS/context/ui-components.json)

.EXAMPLE
    .\scan-ui.ps1 -Mode Incremental
    .\scan-ui.ps1 -Mode Full

.NOTES
    Version: 1.0.0
    Author: KDS Brain System
    Created: 2025-11-02 (Week 2)
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('Full', 'Incremental')]
    [string]$Mode = 'Incremental',

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = 'KDS/context/ui-components.json'
)

$ErrorActionPreference = 'Stop'
$startTime = Get-Date

Write-Host "🧠 KDS UI Component Sensor v1.0.0" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Gray
Write-Host ""

# ===========================
# STEP 1: Load Existing Data
# ===========================

$lastScan = $null
$existingData = @{
    components = @()
    pages = @()
}

$fullOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $PSScriptRoot "..\..\..\$OutputPath" }

if (Test-Path $fullOutputPath) {
    try {
        $existing = Get-Content $fullOutputPath -Raw | ConvertFrom-Json
        $lastScan = $existing.last_scan
        if ($existing.components) { $existingData.components = $existing.components }
        if ($existing.pages) { $existingData.pages = $existing.pages }
        Write-Host "✅ Loaded existing ui-components.json (last scan: $lastScan)" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Could not parse existing ui-components.json, starting fresh" -ForegroundColor Yellow
    }
}

# ===========================
# STEP 2: Find .razor Files
# ===========================

Write-Host "🔍 Discovering Blazor components..." -ForegroundColor Cyan

# Determine workspace root (go up 3 levels from KDS/scripts/sensors)
$workspaceRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
Write-Host "   Workspace: $workspaceRoot" -ForegroundColor Gray

$razorFiles = Get-ChildItem -Path "$workspaceRoot\SPA\NoorCanvas" -Filter "*.razor" -Recurse -ErrorAction SilentlyContinue

if ($razorFiles.Count -eq 0) {
    Write-Host "❌ No .razor files found!" -ForegroundColor Red
    exit 1
}

# Incremental filtering
$filesToScan = $razorFiles
if ($Mode -eq 'Incremental' -and $lastScan) {
    $lastScanDate = [DateTime]::Parse($lastScan)
    $filesToScan = $razorFiles | Where-Object { $_.LastWriteTime -gt $lastScanDate }
    
    if ($filesToScan.Count -eq 0) {
        Write-Host "✅ No .razor files changed since last scan. Using cached data." -ForegroundColor Green
        
        # Return existing data with updated timestamp
        $output = @{
            last_scan = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            scan_metadata = @{
                sensor_version = "1.0.0"
                scan_mode = $Mode
                changed_files = @()
            }
            total_components = $existingData.components.Count
            total_pages = $existingData.pages.Count
            components = $existingData.components
            pages = $existingData.pages
            scan_duration_ms = ((Get-Date) - $startTime).TotalMilliseconds
        }
        
        $output | ConvertTo-Json -Depth 10 | Out-File $fullOutputPath -Encoding UTF8
        Write-Host "✅ UI component sensor complete (no changes)" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "📝 Incremental mode: Scanning $($filesToScan.Count) changed file(s)" -ForegroundColor Yellow
}
else {
    Write-Host "📝 Full scan mode: Scanning $($filesToScan.Count) file(s)" -ForegroundColor Yellow
}

# ===========================
# STEP 3: Extract Components
# ===========================

Write-Host "🎨 Extracting UI components..." -ForegroundColor Cyan

$components = @()
$pages = @()

foreach ($file in $filesToScan) {
    try {
        $content = Get-Content $file.FullName -Raw
        $componentName = $file.BaseName
        $relativePath = $file.FullName.Replace("$PWD\", "").Replace("\", "/")
        
        # Check if this is a page (@page directive)
        $pageRouteMatch = [regex]::Match($content, '@page\s+"([^"]+)"')
        $isPage = $pageRouteMatch.Success
        $pageRoute = if ($isPage) { $pageRouteMatch.Groups[1].Value } else { $null }
        
        # Extract data-testid attributes
        $testIds = @()
        $testIdMatches = [regex]::Matches($content, 'data-testid="([^"]+)"')
        foreach ($match in $testIdMatches) {
            $testIds += $match.Groups[1].Value
        }
        
        # Extract child component references (simplified)
        $children = @()
        $componentMatches = [regex]::Matches($content, '<([A-Z][a-zA-Z0-9]+)[>\s]')
        foreach ($match in $componentMatches) {
            $childName = $match.Groups[1].Value
            # Filter out HTML tags and Blazor built-ins
            if ($childName -notin @('Router', 'RouteView', 'FocusOnNavigate', 'PageTitle', 'HeadContent', 'CascadingValue')) {
                $children += $childName
            }
        }
        $children = $children | Select-Object -Unique
        
        # Extract API calls (HTTP client calls)
        $apiCalls = @()
        
        # Pattern 1: HttpClient.PostAsJsonAsync, GetFromJsonAsync, etc.
        $httpMatches = [regex]::Matches($content, 'Http\.(Post|Get|Put|Delete).*Async.*?"(/api/[^"]+)"')
        foreach ($match in $httpMatches) {
            $method = $match.Groups[1].Value.ToUpper()
            $endpoint = $match.Groups[2].Value
            $apiCalls += "$method $endpoint"
        }
        
        # Pattern 2: Literal API endpoints in strings
        $apiLiteralMatches = [regex]::Matches($content, '"/api/[^"]+/[^"]+"')
        foreach ($match in $apiLiteralMatches) {
            $endpoint = $match.Value.Trim('"')
            if ($endpoint -notin $apiCalls) {
                $apiCalls += $endpoint
            }
        }
        
        $apiCalls = $apiCalls | Select-Object -Unique
        
        # Extract parameters from @page directive
        $parameters = @()
        if ($pageRoute) {
            $paramMatches = [regex]::Matches($pageRoute, '\{([^}:]+)(?::([^}]+))?\}')
            foreach ($match in $paramMatches) {
                $paramName = $match.Groups[1].Value
                $paramType = if ($match.Groups[2].Value) { $match.Groups[2].Value } else { "string" }
                $parameters += @{
                    name = $paramName
                    type = $paramType
                }
            }
        }
        
        # Build component object
        $componentObj = @{
            name = $componentName
            file = $relativePath
            route = $pageRoute
            test_ids = $testIds
            children = $children
            api_calls = $apiCalls
            confidence = 1.0
        }
        
        if ($isPage) {
            # This is a page (routable component)
            $pageObj = @{
                route = $pageRoute
                component = $componentName
                file = $relativePath
                parameters = $parameters
                test_ids = $testIds
                confidence = 1.0
            }
            $pages += $pageObj
        }
        
        $components += $componentObj
    }
    catch {
        Write-Host "⚠️  Error parsing $($file.Name): $_" -ForegroundColor Yellow
    }
}

Write-Host "✅ Found $($components.Count) component(s), $($pages.Count) page(s)" -ForegroundColor Green

# ===========================
# STEP 4: Build Output
# ===========================

Write-Host "📦 Building ui-components.json..." -ForegroundColor Cyan

$changedFiles = $filesToScan | ForEach-Object { $_.FullName.Replace("$workspaceRoot\", "").Replace("\", "/") }

$output = @{
    last_scan = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    scan_metadata = @{
        sensor_version = "1.0.0"
        scan_mode = $Mode
        changed_files = $changedFiles
    }
    total_components = $components.Count
    total_pages = $pages.Count
    total_test_ids = ($components | ForEach-Object { $_.test_ids.Count } | Measure-Object -Sum).Sum
    components = $components
    pages = $pages
    scan_duration_ms = ((Get-Date) - $startTime).TotalMilliseconds
}

# ===========================
# STEP 5: Save Output
# ===========================

$fullOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $workspaceRoot $OutputPath }
$outputDir = Split-Path $fullOutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$output | ConvertTo-Json -Depth 10 | Out-File $fullOutputPath -Encoding UTF8

Write-Host ""
Write-Host "✅ UI component sensor complete!" -ForegroundColor Green
Write-Host "   Components: $($components.Count)" -ForegroundColor Gray
Write-Host "   Pages: $($pages.Count)" -ForegroundColor Gray
Write-Host "   Test IDs: $($output.total_test_ids)" -ForegroundColor Gray
Write-Host "   Duration: $([math]::Round($output.scan_duration_ms, 0))ms" -ForegroundColor Gray
Write-Host "   Output: $fullOutputPath" -ForegroundColor Gray
Write-Host ""
