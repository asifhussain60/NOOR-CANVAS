# Pre-Flight Check Script for Playwright Testing
# This script validates that all prerequisites are met before running Playwright tests

param(
    [switch]$Detailed,
    [switch]$Fix
)

Write-Host "🚀 NOOR Canvas Playwright Pre-Flight Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$allChecksPass = $true
$failureReasons = @()

# Function to log check results
function Write-CheckResult {
    param($Description, $Success, $Details = "")
    if ($Success) {
        Write-Host "✅ $Description" -ForegroundColor Green
        if ($Detailed -and $Details) {
            Write-Host "   $Details" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ $Description" -ForegroundColor Red
        if ($Details) {
            Write-Host "   $Details" -ForegroundColor Yellow
        }
        $script:allChecksPass = $false
        $script:failureReasons += $Description
    }
}

Write-Host "`n🔍 Step 1: Application Status Check" -ForegroundColor Yellow

# Check if dotnet processes are running
$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
if ($dotnetProcesses) {
    Write-CheckResult "NoorCanvas application processes found" $true "Found $($dotnetProcesses.Count) dotnet process(es)"
} else {
    Write-CheckResult "NoorCanvas application processes" $false "No dotnet processes running"
}

# Check port availability
Write-Host "`n🔍 Step 2: Port Connectivity Check" -ForegroundColor Yellow

$port9090 = Test-NetConnection -ComputerName localhost -Port 9090 -InformationLevel Quiet -ErrorAction SilentlyContinue
Write-CheckResult "Port 9090 (HTTP) accessible" $port9090 "HTTP endpoint for NoorCanvas"

$port9091 = Test-NetConnection -ComputerName localhost -Port 9091 -InformationLevel Quiet -ErrorAction SilentlyContinue
Write-CheckResult "Port 9091 (HTTPS) accessible" $port9091 "HTTPS endpoint for NoorCanvas"

# Check API endpoints
Write-Host "`n🔍 Step 3: API Endpoint Validation" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-CheckResult "HTTPS endpoint responding" $true "Status: $($response.StatusCode)"
} catch {
    Write-CheckResult "HTTPS endpoint responding" $false "Error: $($_.Exception.Message)"
}

# Test token validation endpoints
try {
    $userTokenResponse = Invoke-WebRequest -Uri "https://localhost:9091/api/participant/session/V37KMP9P/validate" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $isValidJson = $userTokenResponse.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    Write-CheckResult "User token validation endpoint" ($userTokenResponse.StatusCode -eq 200 -and $isValidJson) "Status: $($userTokenResponse.StatusCode)"
} catch {
    Write-CheckResult "User token validation endpoint" $false "Error: $($_.Exception.Message)"
}

try {
    $hostTokenResponse = Invoke-WebRequest -Uri "https://localhost:9091/api/host/token/ADMIN123/validate" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-CheckResult "Host token validation endpoint" ($hostTokenResponse.StatusCode -in @(200, 404)) "Status: $($hostTokenResponse.StatusCode) (200 or 404 expected)"
} catch {
    Write-CheckResult "Host token validation endpoint" $false "Error: $($_.Exception.Message)"
}

# Check Playwright installation
Write-Host "`n🔍 Step 4: Playwright Framework Check" -ForegroundColor Yellow

try {
    $playwrightVersion = npx playwright --version 2>$null
    if ($playwrightVersion) {
        Write-CheckResult "Playwright CLI available" $true "Version: $playwrightVersion"
    } else {
        Write-CheckResult "Playwright CLI available" $false "npx playwright command not found"
    }
} catch {
    Write-CheckResult "Playwright CLI available" $false "Error executing playwright command"
}

# Check config file
$configExists = Test-Path "PlayWright\config\playwright.config.js"
Write-CheckResult "Playwright configuration file" $configExists "PlayWright\config\playwright.config.js"

# Check if browsers are installed
try {
    $browserCheck = npx playwright install --dry-run 2>&1
    $browsersInstalled = $browserCheck -notmatch "needs to be installed"
    Write-CheckResult "Playwright browsers installed" $browsersInstalled "Browser binaries status"
} catch {
    Write-CheckResult "Playwright browsers installed" $false "Error checking browser installation"
}

# Final assessment
Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
if ($allChecksPass) {
    Write-Host "🎉 ALL CHECKS PASSED - SAFE TO RUN PLAYWRIGHT TESTS!" -ForegroundColor Green
    Write-Host "`n✅ You can now run:" -ForegroundColor Green
    Write-Host "   npx playwright test auto-validation-flows.spec.ts --headed" -ForegroundColor White
    exit 0
} else {
    Write-Host "⛔ CHECKS FAILED - DO NOT RUN PLAYWRIGHT TESTS!" -ForegroundColor Red
    Write-Host "`n❌ Failed checks:" -ForegroundColor Red
    foreach ($reason in $failureReasons) {
        Write-Host "   - $reason" -ForegroundColor Yellow
    }
    
    if ($Fix) {
        Write-Host "`n🔧 Attempting automatic fixes..." -ForegroundColor Cyan
        
        # Try to start the application if it's not running
        if (-not $dotnetProcesses -or -not $port9091) {
            Write-Host "🚀 Starting NoorCanvas application..." -ForegroundColor Yellow
            try {
                Set-Location "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
                Start-Process powershell -ArgumentList "-Command", "dotnet run" -WindowStyle Hidden
                Write-Host "⏳ Waiting 30 seconds for application startup..." -ForegroundColor Yellow
                Start-Sleep 30
                Write-Host "✅ Application start initiated. Please re-run this check." -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start application: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Try to install Playwright if missing
        if (-not $playwrightVersion -or -not $browsersInstalled) {
            Write-Host "📦 Installing Playwright and browsers..." -ForegroundColor Yellow
            try {
                npm install @playwright/test
                npx playwright install
                Write-Host "✅ Playwright installation completed. Please re-run this check." -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install Playwright: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`n💡 To attempt automatic fixes, run:" -ForegroundColor Cyan
        Write-Host "   .\Scripts\Validation\pre-flight-check.ps1 -Fix" -ForegroundColor White
    }
    
    exit 1
}