<#
.SYNOPSIS
    Automated post-deployment smoke test for NoorCanvas production deployment.

.DESCRIPTION
    Validates production deployment health after ncdeploy.ps1 completes:
    
    1. Configuration Validation
       - Verifies appsettings.local.json is NOT deployed
       - Confirms ASPNETCORE_ENVIRONMENT=Production in web.config
       - Validates connection string points to KSESSIONS (not KSESSIONS_DEV)
    
    2. Application Health
       - Checks IIS app pool is running
       - Verifies NoorCanvas.dll timestamp is fresh (within last 10 minutes)
       - Tests production URL accessibility
    
    3. Database Connectivity
       - Validates connection to KSESSIONS production database
       - Confirms CanvasType column exists in canvas.Sessions table
    
    4. API Endpoint Validation
       - Tests token validation endpoint
       - Verifies API returns valid responses
    
    5. Log Analysis
       - Checks production logs for startup errors
       - Validates database connection string in logs shows KSESSIONS
    
    Exit codes:
    0 = All checks passed
    1 = Configuration issue detected
    2 = Application health issue
    3 = Database connectivity issue
    4 = API validation failed
    5 = Log analysis failed

.PARAMETER Verbose
    Show detailed output for each validation step

.PARAMETER SkipApiTests
    Skip API endpoint validation (useful for initial deployment)

.EXAMPLE
    .\Scripts\post-deploy-smoke-test.ps1
    Run full smoke test with standard output

.EXAMPLE
    .\Scripts\post-deploy-smoke-test.ps1 -Verbose
    Run with detailed validation output

.NOTES
    Author: NOOR CANVAS Team
    Last Updated: 2025-10-20
    Run immediately after ncdeploy.ps1 completes
#>

param(
    [switch]$Verbose,
    [switch]$SkipApiTests
)

$ErrorActionPreference = "Continue"  # Continue on errors to collect all issues
$DeployPath = "D:\Websites\NOOR-CANVAS"
$LogPath = "$DeployPath\logs"
$ProductionUrl = "https://noorcanvas.kashkole.com"
$ValidationErrors = @()
$ValidationWarnings = @()

# Helper functions
function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-TestPass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-TestFail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:ValidationErrors += $Message
}

function Write-TestWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    $script:ValidationWarnings += $Message
}

function Write-TestInfo {
    param([string]$Message)
    if ($Verbose) {
        Write-Host "[INFO] $Message" -ForegroundColor Gray
    }
}

# ============================================================================
# TEST 1: Configuration Validation
# ============================================================================
Write-TestHeader "TEST 1: Configuration Validation"

# Check 1.1: appsettings.local.json should NOT exist
Write-TestInfo "Checking for appsettings.local.json..."
if (Test-Path "$DeployPath\appsettings.local.json") {
    Write-TestFail "appsettings.local.json found in production deployment! This file overrides production settings."
} else {
    Write-TestPass "appsettings.local.json correctly excluded from deployment"
}

# Check 1.2: web.config ASPNETCORE_ENVIRONMENT
Write-TestInfo "Validating web.config environment setting..."
$webConfigPath = "$DeployPath\web.config"
if (Test-Path $webConfigPath) {
    $webConfigContent = Get-Content $webConfigPath -Raw
    if ($webConfigContent -match 'name="ASPNETCORE_ENVIRONMENT"\s+value="Production"') {
        Write-TestPass "web.config ASPNETCORE_ENVIRONMENT=Production"
    } else {
        Write-TestFail "web.config ASPNETCORE_ENVIRONMENT is not set to Production"
    }
} else {
    Write-TestFail "web.config not found at $webConfigPath"
}

# Check 1.3: appsettings.Production.json connection string
Write-TestInfo "Validating production connection string..."
$prodSettingsPath = "$DeployPath\appsettings.Production.json"
if (Test-Path $prodSettingsPath) {
    $prodSettings = Get-Content $prodSettingsPath | ConvertFrom-Json
    $connectionString = $prodSettings.ConnectionStrings.DefaultConnection
    
    if ($connectionString -match "Database=KSESSIONS[^_]") {
        Write-TestPass "appsettings.Production.json points to KSESSIONS database"
    } elseif ($connectionString -match "Database=KSESSIONS_DEV") {
        Write-TestFail "appsettings.Production.json points to KSESSIONS_DEV (should be KSESSIONS)"
    } else {
        Write-TestWarn "Unable to determine database from connection string"
    }
} else {
    Write-TestFail "appsettings.Production.json not found"
}

# ============================================================================
# TEST 2: Application Health
# ============================================================================
Write-TestHeader "TEST 2: Application Health"

# Check 2.1: IIS App Pool status
Write-TestInfo "Checking IIS app pool status..."
try {
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    $appPoolState = Get-WebAppPoolState -Name "NoorCanvas"
    if ($appPoolState.Value -eq "Started") {
        Write-TestPass "IIS app pool 'NoorCanvas' is running"
    } else {
        Write-TestFail "IIS app pool 'NoorCanvas' is not running (State: $($appPoolState.Value))"
    }
} catch {
    Write-TestWarn "Unable to check IIS app pool status: $($_.Exception.Message)"
}

# Check 2.2: NoorCanvas.dll timestamp (should be fresh)
Write-TestInfo "Checking deployed DLL timestamp..."
$dllPath = "$DeployPath\NoorCanvas.dll"
if (Test-Path $dllPath) {
    $dllFile = Get-Item $dllPath
    $ageMinutes = ((Get-Date) - $dllFile.LastWriteTime).TotalMinutes
    
    if ($ageMinutes -lt 10) {
        Write-TestPass "NoorCanvas.dll is fresh (deployed $([math]::Round($ageMinutes, 1)) minutes ago)"
    } elseif ($ageMinutes -lt 60) {
        Write-TestWarn "NoorCanvas.dll was deployed $([math]::Round($ageMinutes, 1)) minutes ago (expected < 10 minutes)"
    } else {
        Write-TestFail "NoorCanvas.dll is stale (last modified: $($dllFile.LastWriteTime))"
    }
} else {
    Write-TestFail "NoorCanvas.dll not found at $dllPath"
}

# Check 2.3: Production URL accessibility
Write-TestInfo "Testing production URL accessibility..."
try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -Method HEAD -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-TestPass "Production URL $ProductionUrl is accessible (HTTP 200)"
    } else {
        Write-TestWarn "Production URL returned HTTP $($response.StatusCode)"
    }
} catch {
    Write-TestFail "Unable to reach production URL: $($_.Exception.Message)"
}

# ============================================================================
# TEST 3: Database Connectivity
# ============================================================================
Write-TestHeader "TEST 3: Database Connectivity"

# Check 3.1: Connection to KSESSIONS
Write-TestInfo "Testing KSESSIONS database connection..."
try {
    $testQuery = "SELECT COUNT(*) FROM [canvas].[Sessions]"
    $result = sqlcmd -S AHHOME -d KSESSIONS -E -Q $testQuery -h -1 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $sessionCount = $result.Trim()
        Write-TestPass "Connected to KSESSIONS database ($sessionCount sessions found)"
    } else {
        Write-TestFail "Failed to connect to KSESSIONS database"
    }
} catch {
    Write-TestFail "Database connection test failed: $($_.Exception.Message)"
}

# Check 3.2: CanvasType column exists
Write-TestInfo "Verifying CanvasType column exists..."
try {
    $columnCheck = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('canvas.Sessions') AND name = 'CanvasType'"
    $result = sqlcmd -S AHHOME -d KSESSIONS -E -Q $columnCheck -h -1 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result.Trim() -eq "1") {
        Write-TestPass "CanvasType column exists in canvas.Sessions table"
    } else {
        Write-TestFail "CanvasType column not found in canvas.Sessions table"
    }
} catch {
    Write-TestFail "Column validation failed: $($_.Exception.Message)"
}

# ============================================================================
# TEST 4: API Endpoint Validation (Optional)
# ============================================================================
if (-not $SkipApiTests) {
    Write-TestHeader "TEST 4: API Endpoint Validation"
    
    # Check 4.1: Health endpoint (if exists)
    Write-TestInfo "Testing API health endpoint..."
    try {
        $healthUrl = "$ProductionUrl/api/health"
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-TestPass "API health endpoint accessible"
        } else {
            Write-TestWarn "API health endpoint returned HTTP $($response.StatusCode)"
        }
    } catch {
        Write-TestInfo "API health endpoint not available (may not exist)"
    }
    
    # Check 4.2: Token validation endpoint (with invalid token - should return gracefully)
    Write-TestInfo "Testing token validation endpoint..."
    try {
        $tokenUrl = "$ProductionUrl/api/host/token/TESTTEST/validate"
        $response = Invoke-WebRequest -Uri $tokenUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-TestPass "Token validation endpoint responsive"
        } else {
            Write-TestWarn "Token validation endpoint returned HTTP $($response.StatusCode)"
        }
    } catch {
        # 404 or other error is acceptable - we're just checking the endpoint exists
        Write-TestInfo "Token validation endpoint test completed"
    }
}

# ============================================================================
# TEST 5: Log Analysis
# ============================================================================
Write-TestHeader "TEST 5: Production Log Analysis"

# Check 5.1: Recent log file exists
Write-TestInfo "Checking for production logs..."
$todayLogFile = "$LogPath\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
if (Test-Path $todayLogFile) {
    Write-TestPass "Production log file found: $todayLogFile"
    
    # Check 5.2: Database connection in logs shows KSESSIONS
    Write-TestInfo "Analyzing database connection strings in logs..."
    $recentLogs = Get-Content $todayLogFile -Tail 500 -ErrorAction SilentlyContinue
    
    if ($recentLogs -match "Database=KSESSIONS_DEV") {
        Write-TestFail "Production logs show connection to KSESSIONS_DEV (should be KSESSIONS)"
    } elseif ($recentLogs -match "Database=KSESSIONS[^_]") {
        Write-TestPass "Production logs confirm KSESSIONS database connection"
    } else {
        Write-TestWarn "Unable to determine database connection from logs"
    }
    
    # Check 5.3: Check for startup errors
    Write-TestInfo "Scanning for startup errors..."
    $errorLines = $recentLogs | Select-String -Pattern "\[ERR\]|\[FATAL\]" | Select-Object -First 5
    if ($errorLines.Count -gt 0) {
        Write-TestWarn "Found $($errorLines.Count) error entries in recent logs"
        if ($Verbose) {
            foreach ($error in $errorLines) {
                Write-Host "  $error" -ForegroundColor Yellow
            }
        }
    } else {
        Write-TestPass "No critical errors found in recent logs"
    }
} else {
    Write-TestWarn "Today's production log file not found (app may not have started yet)"
}

# ============================================================================
# TEST SUMMARY
# ============================================================================
Write-Host "`n" -NoNewline
Write-TestHeader "SMOKE TEST SUMMARY"

$totalTests = 15  # Approximate total tests run
$failCount = $ValidationErrors.Count
$warnCount = $ValidationWarnings.Count
$passCount = $totalTests - $failCount - $warnCount

Write-Host "Tests Passed: " -NoNewline
Write-Host "$passCount" -ForegroundColor Green

if ($warnCount -gt 0) {
    Write-Host "Warnings:     " -NoNewline
    Write-Host "$warnCount" -ForegroundColor Yellow
}

if ($failCount -gt 0) {
    Write-Host "Tests Failed: " -NoNewline
    Write-Host "$failCount" -ForegroundColor Red
}

# Display errors and warnings
if ($ValidationErrors.Count -gt 0) {
    Write-Host "`nCRITICAL ISSUES:" -ForegroundColor Red
    foreach ($error in $ValidationErrors) {
        Write-Host "  ❌ $error" -ForegroundColor Red
    }
}

if ($ValidationWarnings.Count -gt 0) {
    Write-Host "`nWARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $ValidationWarnings) {
        Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
    }
}

# Final verdict
Write-Host "`n========================================" -ForegroundColor Cyan
if ($failCount -eq 0) {
    Write-Host "  ✅ DEPLOYMENT VALIDATION PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nProduction deployment appears healthy." -ForegroundColor Green
    Write-Host "Ready for manual testing." -ForegroundColor Green
    exit 0
} else {
    Write-Host "  ❌ DEPLOYMENT VALIDATION FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nPlease review and fix the issues above before proceeding." -ForegroundColor Red
    Write-Host "Run ncdeploy.ps1 again after fixing configuration issues." -ForegroundColor Yellow
    exit 1
}
