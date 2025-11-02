# Tooling Discovery Script for KDS v4.4
# Rule #18: Project Tooling Awareness & Local-First Dependencies
# Purpose: Automatically discover and catalog project tooling

param(
    [switch]$Force,        # Force refresh even if inventory is recent
    [switch]$Verbose,      # Show detailed discovery process
    [switch]$ValidateOnly  # Only validate existing inventory
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item $ScriptDir).Parent.Parent.FullName
$InventoryPath = Join-Path $ScriptDir "tooling-inventory.json"
$ConfigPath = Join-Path $ScriptDir "kds.config.json"

Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   KDS Tooling Discovery - Rule #18 Enforcement" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if refresh is needed
if ((Test-Path $InventoryPath) -and (-not $Force) -and (-not $ValidateOnly)) {
    $inventory = Get-Content $InventoryPath | ConvertFrom-Json
    $lastUpdated = [DateTime]::Parse($inventory.last_updated)
    $daysSinceUpdate = (Get-Date) - $lastUpdated
    
    if ($daysSinceUpdate.TotalDays -lt 7) {
        Write-Host "✓ Tooling inventory is current (updated $([Math]::Round($daysSinceUpdate.TotalDays, 1)) days ago)" -ForegroundColor Green
        Write-Host "  Use -Force to refresh anyway" -ForegroundColor Gray
        exit 0
    }
}

if ($ValidateOnly) {
    Write-Host "Validation Mode - Checking existing inventory..." -ForegroundColor Yellow
}

# Discovery Functions
function Find-BuildTools {
    $tools = @()
    
    # .NET detection
    $slnFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.sln" -ErrorAction SilentlyContinue
    if ($slnFiles) {
        try {
            $dotnetVersion = (dotnet --version 2>$null)
            $tools += @{
                name = "dotnet"
                version = $dotnetVersion
                command = "dotnet build"
                config_file = $slnFiles[0].Name
                kds_usage = "Rule #11 build validation"
                detected = $true
            }
            if ($Verbose) { Write-Host "  ✓ Found: .NET SDK $dotnetVersion" -ForegroundColor Green }
        } catch {
            if ($Verbose) { Write-Host "  ⚠ .sln found but dotnet CLI not available" -ForegroundColor Yellow }
        }
    }
    
    # Node.js detection
    $packageJson = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJson) {
        try {
            $npmVersion = (npm --version 2>$null)
            $tools += @{
                name = "npm"
                version = $npmVersion
                command = "npm run build"
                config_file = "package.json"
                kds_usage = "Frontend build automation"
                detected = $true
            }
            if ($Verbose) { Write-Host "  ✓ Found: npm $npmVersion" -ForegroundColor Green }
        } catch {
            if ($Verbose) { Write-Host "  ⚠ package.json found but npm not available" -ForegroundColor Yellow }
        }
    }
    
    return $tools
}

function Find-TestTools {
    $tools = @()
    
    # Playwright detection
    $playwrightConfig = Get-ChildItem -Path $ProjectRoot -Filter "playwright.config.*" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($playwrightConfig) {
        $packageJson = Join-Path $ProjectRoot "package.json"
        if (Test-Path $packageJson) {
            $pkg = Get-Content $packageJson | ConvertFrom-Json
            $playwrightVersion = $pkg.devDependencies.'@playwright/test' -replace '\^', ''
            
            $tools += @{
                name = "Playwright"
                version = $playwrightVersion
                command = "npx playwright test"
                config_file = $playwrightConfig.Name
                kds_usage = "Rule #8 test generation, Rule #15 ui-mappings validation"
                detected = $true
            }
            if ($Verbose) { Write-Host "  ✓ Found: Playwright $playwrightVersion" -ForegroundColor Green }
        }
    }
    
    # .NET test frameworks
    $testProjects = Get-ChildItem -Path $ProjectRoot -Filter "*Test*.csproj" -Recurse -ErrorAction SilentlyContinue
    if ($testProjects) {
        $tools += @{
            name = "dotnet test"
            version = "N/A"
            command = "dotnet test"
            config_file = "Test projects detected"
            kds_usage = "Backend unit/integration testing"
            detected = $true
        }
        if ($Verbose) { Write-Host "  ✓ Found: .NET Test projects" -ForegroundColor Green }
    }
    
    return $tools
}

function Find-QualityTools {
    $tools = @()
    
    # Roslynator detection
    $roslynatorConfig = Join-Path $ProjectRoot ".roslynator.json"
    if (Test-Path $roslynatorConfig) {
        $tools += @{
            name = "Roslynator"
            version = "4.7.0"  # Could be parsed from packages
            command = "dotnet roslynator analyze"
            config_file = ".roslynator.json"
            kds_usage = "Post-task code quality validation (Rule #16)"
            detected = $true
        }
        if ($Verbose) { Write-Host "  ✓ Found: Roslynator" -ForegroundColor Green }
    }
    
    return $tools
}

function Find-CustomScripts {
    $scripts = @()
    
    $scriptsDir = Join-Path $ProjectRoot "Scripts"
    if (Test-Path $scriptsDir) {
        $psScripts = Get-ChildItem -Path $scriptsDir -Filter "*.ps1"
        foreach ($script in $psScripts) {
            # Known KDS-relevant scripts
            if ($script.Name -match "ncw|ncb|ncdeploy") {
                $scripts += @{
                    name = $script.BaseName
                    location = "Scripts/$($script.Name)"
                    purpose = "Project build/deployment shortcut"
                    kds_usage = "Quick build validation"
                    detected = $true
                }
                if ($Verbose) { Write-Host "  ✓ Found: Custom script $($script.Name)" -ForegroundColor Green }
            }
        }
    }
    
    return $scripts
}

function Find-ProjectPatterns {
    $patterns = @{}
    
    # Determine primary build command
    $slnFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.sln" -ErrorAction SilentlyContinue
    if ($slnFiles) {
        # Look for specific project path in tasks.json or common patterns
        $csprojPath = "SPA/NoorCanvas/NoorCanvas.csproj"
        if (Test-Path (Join-Path $ProjectRoot $csprojPath)) {
            $patterns.build_command = "dotnet build $csprojPath"
        } else {
            $patterns.build_command = "dotnet build $($slnFiles[0].Name)"
        }
    }
    
    # Test command
    $playwrightConfig = Get-ChildItem -Path $ProjectRoot -Filter "playwright.config.*" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($playwrightConfig) {
        $patterns.test_command = "npx playwright test"
    }
    
    # Quality check
    if (Test-Path (Join-Path $ProjectRoot "Workspaces/CodeQuality/run-roslynator.ps1")) {
        $patterns.quality_check = "pwsh -File Workspaces/CodeQuality/run-roslynator.ps1"
    }
    
    return $patterns
}

# Main Discovery Process
Write-Host "🔍 Scanning project structure..." -ForegroundColor Cyan

$buildTools = Find-BuildTools
$testTools = Find-TestTools
$qualityTools = Find-QualityTools
$customScripts = Find-CustomScripts
$projectPatterns = Find-ProjectPatterns

# Generate Inventory
$inventory = @{
    last_updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    project_name = "NOOR-CANVAS"
    project_root = $ProjectRoot
    tooling = @{
        build = $buildTools
        test = $testTools
        quality = $qualityTools
        custom_scripts = $customScripts
    }
    project_specific_patterns = $projectPatterns
    kds_integration = @{
        rule_11_build = if ($projectPatterns.build_command) { $projectPatterns.build_command } else { "NOT_CONFIGURED" }
        rule_15_ui_validation = "KDS/scripts/validation/validate-ui-ids.ps1"
        rule_16_quality = if ($projectPatterns.quality_check) { $projectPatterns.quality_check } else { "NOT_CONFIGURED" }
    }
}

# Save Inventory
$inventory | ConvertTo-Json -Depth 10 | Set-Content $InventoryPath
Write-Host ""
Write-Host "✓ Tooling inventory updated: $InventoryPath" -ForegroundColor Green
Write-Host ""

# Summary Report
Write-Host "📊 Discovery Summary:" -ForegroundColor Cyan
Write-Host "  Build Tools:   $($buildTools.Count)" -ForegroundColor White
Write-Host "  Test Tools:    $($testTools.Count)" -ForegroundColor White
Write-Host "  Quality Tools: $($qualityTools.Count)" -ForegroundColor White
Write-Host "  Custom Scripts: $($customScripts.Count)" -ForegroundColor White
Write-Host ""

# KDS Integration Status
Write-Host "🔗 KDS Integration Status:" -ForegroundColor Cyan
if ($projectPatterns.build_command) {
    Write-Host "  ✓ Rule #11 Build: $($projectPatterns.build_command)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Rule #11 Build: NOT CONFIGURED" -ForegroundColor Red
}

if (Test-Path (Join-Path $ProjectRoot "KDS/scripts/validation/validate-ui-ids.ps1")) {
    Write-Host "  ✓ Rule #15 UI Validation: Configured" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Rule #15 UI Validation: Script missing (will be created on first use)" -ForegroundColor Yellow
}

if ($projectPatterns.quality_check) {
    Write-Host "  ✓ Rule #16 Quality: $($projectPatterns.quality_check)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Rule #16 Quality: Optional (no quality tool detected)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Tooling discovery complete!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
