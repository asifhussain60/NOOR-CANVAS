<#
.SYNOPSIS
    Validates required NOOR Canvas development environment configuration files
    
.DESCRIPTION
    Checks that all required configuration files exist before running the application.
    Prevents dangerous scenarios like development environment connecting to production database.
    
    Critical validations:
    - appsettings.Development.json exists with KSESSIONS_DEV database
    - No appsettings.local.json overrides pointing to production
    - appsettings.Production.json has KSESSIONS database
    
.PARAMETER Fix
    Automatically create missing files from templates
    
.EXAMPLE
    .\Scripts\validate-dev-setup.ps1
    Validates configuration and reports issues
    
.EXAMPLE
    .\Scripts\validate-dev-setup.ps1 -Fix
    Validates and automatically fixes missing configuration files
    
.NOTES
    Created: 2025-10-27
    Purpose: Prevent database environment mismatches (localhost → production)
    Related: database-environment-safeguards key
#>

param(
    [switch]$Fix
)

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path $PSScriptRoot -Parent
$hasErrors = $false

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NOOR Canvas Development Environment Validation" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Validation 1: appsettings.Development.json exists
# ═══════════════════════════════════════════════════════════════
Write-Host "Validation 1: Development Configuration" -ForegroundColor Yellow
$devAppsettingsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Development.json"
$templatePath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Development.json.template"

if (Test-Path $devAppsettingsPath) {
    Write-Host "  ✅ appsettings.Development.json exists" -ForegroundColor Green
    
    # Validate it has KSESSIONS_DEV
    $content = Get-Content $devAppsettingsPath -Raw
    if ($content -match "Database=KSESSIONS_DEV" -or $content -match "Initial Catalog=KSESSIONS_DEV") {
        Write-Host "     Points to KSESSIONS_DEV database ✓" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  WARNING: Does not contain KSESSIONS_DEV!" -ForegroundColor Yellow
        Write-Host "     This may cause development to connect to production database" -ForegroundColor Yellow
        $hasErrors = $true
    }
} else {
    Write-Host "  ❌ appsettings.Development.json MISSING" -ForegroundColor Red
    Write-Host "     Without this file, development uses Production settings!" -ForegroundColor Red
    
    if ($Fix) {
        if (Test-Path $templatePath) {
            Write-Host "     Creating from template..." -ForegroundColor Yellow
            
            # Read template and replace placeholders
            $templateContent = Get-Content $templatePath -Raw
            $configContent = $templateContent `
                -replace "YOUR_SERVER", "AHHOME" `
                -replace "YOUR_PASSWORD", "adf4961glo"
            
            Set-Content -Path $devAppsettingsPath -Value $configContent
            Write-Host "  ✅ Created appsettings.Development.json" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Template file not found: $templatePath" -ForegroundColor Red
            $hasErrors = $true
        }
    } else {
        Write-Host "     Run with -Fix to create from template" -ForegroundColor Yellow
        $hasErrors = $true
    }
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Validation 2: No dangerous appsettings.local.json overrides
# ═══════════════════════════════════════════════════════════════
Write-Host "Validation 2: Local Configuration Overrides" -ForegroundColor Yellow
$localConfigPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.local.json"

if (Test-Path $localConfigPath) {
    Write-Host "  ⚠️  appsettings.local.json found (may override Development)" -ForegroundColor Yellow
    
    $content = Get-Content $localConfigPath -Raw
    
    # Check if it contains production database
    if ($content -match "Database=KSESSIONS[^_]" -or $content -match "Initial Catalog=KSESSIONS[^_]") {
        Write-Host "  🚨 DANGER: Contains KSESSIONS (production) connection!" -ForegroundColor Red
        Write-Host "     This will override Development settings and connect to PRODUCTION!" -ForegroundColor Red
        Write-Host "     Action: Rename or remove this file immediately" -ForegroundColor Yellow
        $hasErrors = $true
    } else {
        Write-Host "     Appears safe (does not contain KSESSIONS production database)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✅ No appsettings.local.json override file" -ForegroundColor Green
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Validation 3: Production configuration has KSESSIONS
# ═══════════════════════════════════════════════════════════════
Write-Host "Validation 3: Production Configuration" -ForegroundColor Yellow
$prodAppsettingsPath = Join-Path $workspaceRoot "SPA\NoorCanvas\appsettings.Production.json"

if (Test-Path $prodAppsettingsPath) {
    $content = Get-Content $prodAppsettingsPath -Raw
    
    if ($content -match "Database=KSESSIONS[^_]" -or $content -match "Initial Catalog=KSESSIONS[^_]") {
        Write-Host "  ✅ appsettings.Production.json → KSESSIONS (production)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  appsettings.Production.json may not have KSESSIONS" -ForegroundColor Yellow
        Write-Host "     Production should connect to KSESSIONS database" -ForegroundColor Yellow
        $hasErrors = $true
    }
} else {
    Write-Host "  ⚠️  appsettings.Production.json not found" -ForegroundColor Yellow
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════
# Validation 4: .gitignore protects environment configs
# ═══════════════════════════════════════════════════════════════
Write-Host "Validation 4: Git Protection" -ForegroundColor Yellow
$gitignorePath = Join-Path $workspaceRoot ".gitignore"

if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    
    if ($gitignoreContent -match "\*\*/appsettings\.Development\.json" -or 
        $gitignoreContent -match "appsettings\.Development\.json") {
        Write-Host "  ✅ .gitignore protects appsettings.Development.json" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .gitignore missing environment config protection" -ForegroundColor Yellow
        
        if ($Fix) {
            Write-Host "     Adding protection to .gitignore..." -ForegroundColor Yellow
            Add-Content $gitignorePath "`n# Environment-specific appsettings (NEVER commit)`n**/appsettings.Development.json`n**/appsettings.*.local.json"
            Write-Host "  ✅ Updated .gitignore" -ForegroundColor Green
        } else {
            Write-Host "     Run with -Fix to update .gitignore" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
if ($hasErrors) {
    Write-Host "  ⚠️  VALIDATION FAILED - Issues found" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $Fix) {
        Write-Host "Run with -Fix to automatically resolve issues:" -ForegroundColor Yellow
        Write-Host "  .\Scripts\validate-dev-setup.ps1 -Fix" -ForegroundColor White
        Write-Host ""
    }
    
    exit 1
} else {
    Write-Host "  ✅ VALIDATION PASSED - Environment ready" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Build: cd SPA\NoorCanvas ; dotnet build" -ForegroundColor White
    Write-Host "  2. Run: dotnet run" -ForegroundColor White
    Write-Host "  3. Verify startup logs show: Database: KSESSIONS_DEV" -ForegroundColor White
    Write-Host ""
    
    exit 0
}
