<#
.SYNOPSIS
    KDS Route Sensor - Scans Controllers for API endpoints

.DESCRIPTION
    Scans all ASP.NET Core controllers for API routes and generates routes.json
    Part of KDS v5.0 Brain System (Week 1 MVP)

.PARAMETER ControllersPath
    Path to Controllers directory (default: SPA/NoorCanvas/Controllers)

.PARAMETER OutputPath
    Path to output routes.json (default: KDS/context/routes.json)

.PARAMETER Mode
    Scan mode: Full or Incremental (default: Incremental)

.EXAMPLE
    KDS/scripts/sensors/scan-routes.ps1
    # Incremental scan (only changed files)

.EXAMPLE
    KDS/scripts/sensors/scan-routes.ps1 -Mode Full
    # Full scan (all controllers)

.NOTES
    Version: 1.0.0
    Created: 2025-11-02
    Part of: KDS v5.0 Brain System
    Rule #18 Compliant: Zero external dependencies (PowerShell only)
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ControllersPath = "SPA/NoorCanvas/Controllers",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "KDS/context/routes.json",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Full", "Incremental")]
    [string]$Mode = "Incremental"
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$SensorVersion = "1.0.0"

# Determine workspace root (go up 3 levels from KDS/scripts/sensors)
$WorkspaceRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-SensorLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch($Level) {
        "INFO" { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host "[$timestamp] [ROUTE-SENSOR] $Message" -ForegroundColor $color
}

function Get-LastScanTimestamp {
    param([string]$OutputPath)
    
    $fullPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $WorkspaceRoot $OutputPath }
    
    if (Test-Path $fullPath) {
        try {
            $existingData = Get-Content $fullPath -Raw | ConvertFrom-Json
            return [DateTime]::Parse($existingData.last_scan)
        } catch {
            Write-SensorLog "Could not parse last_scan from existing routes.json" "WARNING"
            return $null
        }
    }
    return $null
}

function Get-ChangedFiles {
    param([string]$ControllersPath, [Nullable[DateTime]]$Since)
    
    $absolutePath = Join-Path $WorkspaceRoot $ControllersPath
    $allFiles = Get-ChildItem -Path $absolutePath -Filter "*.cs" -Recurse
    
    if ($null -eq $Since) {
        return $allFiles
    }
    
    $changedFiles = $allFiles | Where-Object { $_.LastWriteTime -gt $Since }
    return $changedFiles
}

function Parse-HttpMethod {
    param([string]$Line)
    
    if ($Line -match '\[Http(Get|Post|Put|Delete|Patch)\]|\[HttpMethod\(.*?"(GET|POST|PUT|DELETE|PATCH)".*?\)\]') {
        return $Matches[1].ToUpper()
    }
    return $null
}

function Parse-RouteAttribute {
    param([string]$Line)
    
    # Match [Route("/api/...")] or [Route("api/...")]
    if ($Line -match '\[Route\("([^"]+)"\)\]') {
        return $Matches[1]
    }
    return $null
}

function Parse-ActionMethod {
    param([string]$Line)
    
    # Match: public async Task<IActionResult> Save(CanvasDto dto)
    if ($Line -match 'public\s+(?:async\s+)?(?:Task<)?(?:IActionResult|ActionResult|OkResult)(?:>)?\s+(\w+)\s*\(([^)]*)\)') {
        return @{
            ActionName = $Matches[1]
            ParametersString = $Matches[2]
        }
    }
    return $null
}

function Parse-Parameters {
    param([string]$ParametersString)
    
    if ([string]::IsNullOrWhiteSpace($ParametersString)) {
        return @()
    }
    
    $params = @()
    $paramParts = $ParametersString -split ','
    
    foreach ($part in $paramParts) {
        $part = $part.Trim()
        
        # Match: [FromBody] CanvasDto dto
        if ($part -match '(\[From(\w+)\])?\s*([A-Za-z<>]+)\s+(\w+)') {
            $fromAttribute = $Matches[2]
            $paramType = $Matches[3]
            $paramName = $Matches[4]
            
            $params += @{
                name = $paramName
                type = $paramType
                fromBody = ($fromAttribute -eq "Body")
                fromRoute = ($fromAttribute -eq "Route")
            }
        }
    }
    
    return $params
}

function Parse-ControllerFile {
    param([System.IO.FileInfo]$File)
    
    Write-SensorLog "Parsing $($File.Name)..." "INFO"
    
    $content = Get-Content $File.FullName -Raw
    $lines = $content -split "`n"
    
    $routes = @()
    $controllerName = $File.BaseName
    $currentRoute = $null
    $currentMethod = $null
    $currentAuthorize = $false
    $lineNumber = 0
    
    # Extract controller-level [Route] attribute
    $controllerRoute = ""
    foreach ($line in $lines) {
        if ($line -match '\[Route\("([^"]+)"\)\]') {
            $controllerRoute = $Matches[1]
            break
        }
    }
    
    foreach ($line in $lines) {
        $lineNumber++
        $trimmedLine = $line.Trim()
        
        # Check for [HttpGet], [HttpPost], etc.
        $httpMethod = Parse-HttpMethod -Line $trimmedLine
        if ($httpMethod) {
            $currentMethod = $httpMethod
            
            # Check for inline route: [HttpPost("Save")]
            if ($trimmedLine -match '\[Http\w+\("([^"]+)"\)\]') {
                $currentRoute = $Matches[1]
            }
        }
        
        # Check for [Route] attribute (action-level)
        $routeAttr = Parse-RouteAttribute -Line $trimmedLine
        if ($routeAttr) {
            $currentRoute = $routeAttr
        }
        
        # Check for [Authorize]
        if ($trimmedLine -match '\[Authorize.*?\]') {
            $currentAuthorize = $true
        }
        
        # Check for action method
        $actionMethod = Parse-ActionMethod -Line $trimmedLine
        if ($actionMethod) {
            $actionName = $actionMethod.ActionName
            $parametersString = $actionMethod.ParametersString
            
            # Build full route pattern
            $fullRoute = ""
            if ($controllerRoute) {
                $fullRoute = $controllerRoute
            }
            if ($currentRoute) {
                if ($fullRoute) {
                    $fullRoute += "/" + $currentRoute
                } else {
                    $fullRoute = $currentRoute
                }
            }
            
            # Default route if none specified
            if ([string]::IsNullOrEmpty($fullRoute)) {
                $fullRoute = "/api/$($controllerName -replace 'Controller$', '')/$actionName"
            }
            
            # Ensure route starts with /
            if (-not $fullRoute.StartsWith("/")) {
                $fullRoute = "/" + $fullRoute
            }
            
            $routes += @{
                pattern = $fullRoute
                method = if ($currentMethod) { $currentMethod } else { "GET" }
                controller = $controllerName
                action = $actionName
                parameters = Parse-Parameters -ParametersString $parametersString
                auth_required = $currentAuthorize
                file = $File.FullName.Replace($WorkspaceRoot.Path + "\", "").Replace("\", "/")
                line = $lineNumber
                confidence = 1.0
            }
            
            # Reset for next action
            $currentRoute = $null
            $currentMethod = $null
            $currentAuthorize = $false
        }
    }
    
    Write-SensorLog "  Found $($routes.Count) routes in $($File.Name)" "SUCCESS"
    return $routes
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-SensorLog "Starting Route Sensor v$SensorVersion" "INFO"
Write-SensorLog "Mode: $Mode" "INFO"

$startTime = Get-Date

# Determine files to scan
$lastScanTime = Get-LastScanTimestamp -OutputPath $OutputPath
$filesToScan = @()

if ($Mode -eq "Full" -or $null -eq $lastScanTime) {
    Write-SensorLog "Full scan mode" "INFO"
    $filesToScan = Get-ChangedFiles -ControllersPath $ControllersPath -Since $null
} else {
    Write-SensorLog "Incremental scan mode (since $lastScanTime)" "INFO"
    $filesToScan = Get-ChangedFiles -ControllersPath $ControllersPath -Since $lastScanTime
}

Write-SensorLog "Files to scan: $($filesToScan.Count)" "INFO"

if ($filesToScan.Count -eq 0) {
    Write-SensorLog "No changes detected since last scan" "SUCCESS"
    exit 0
}

# Parse all files
$allRoutes = @()
foreach ($file in $filesToScan) {
    $routes = Parse-ControllerFile -File $file
    $allRoutes += $routes
}

# Load existing routes (for incremental merge)
$existingRoutes = @()
if (($Mode -eq "Incremental") -and (Test-Path $OutputPath)) {
    try {
        $existingData = Get-Content $OutputPath -Raw | ConvertFrom-Json
        $existingRoutes = $existingData.routes
        
        # Remove routes from changed files (will be replaced with new scans)
        $changedFileNames = $filesToScan | ForEach-Object { $_.FullName.Replace($WorkspaceRoot.Path + "\", "").Replace("\", "/") }
        $existingRoutes = $existingRoutes | Where-Object { $changedFileNames -notcontains $_.file }
        
        Write-SensorLog "Merged with $($existingRoutes.Count) existing routes" "INFO"
    } catch {
        Write-SensorLog "Could not load existing routes, starting fresh" "WARNING"
    }
}

# Combine existing + new routes
$allRoutes += $existingRoutes

# Build output JSON
$output = @{
    last_scan = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    scan_duration_ms = [int]((Get-Date) - $startTime).TotalMilliseconds
    scanned_files = $filesToScan.Count
    total_routes = $allRoutes.Count
    routes = $allRoutes
    scan_metadata = @{
        sensor_version = $SensorVersion
        scan_mode = $Mode.ToLower()
        changed_files = @($filesToScan | ForEach-Object { $_.FullName.Replace($WorkspaceRoot.Path + "\", "").Replace("\", "/") })
    }
}

# Ensure output directory exists
$fullOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $WorkspaceRoot $OutputPath }
$outputDir = Split-Path $fullOutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Write output
$output | ConvertTo-Json -Depth 10 | Set-Content -Path $fullOutputPath -Encoding UTF8

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalMilliseconds

Write-SensorLog "Scan complete!" "SUCCESS"
Write-SensorLog "  Duration: $([int]$duration)ms" "SUCCESS"
Write-SensorLog "  Files scanned: $($filesToScan.Count)" "SUCCESS"
Write-SensorLog "  Routes discovered: $($allRoutes.Count)" "SUCCESS"
Write-SensorLog "  Output: $OutputPath" "SUCCESS"
