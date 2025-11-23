<#
.SYNOPSIS
    Run share button injection tests with intelligent process reuse

.DESCRIPTION
    This script:
    1. Checks if NoorCanvas is already running and healthy
    2. Reuses existing process if healthy (no rebuild needed)
    3. Only rebuilds and relaunches if ForceRebuild specified
    4. Launches in external PowerShell window (not terminal)
    5. Waits 20 seconds for Norton AntiVirus if new launch
    6. Performs health check before running tests
    7. Runs Playwright tests in headed mode (external browser)
    8. Cleans up app process after tests (unless KeepAppRunning)

.PARAMETER KeepAppRunning
    Keep application running after tests for manual verification

.PARAMETER HeadlessTests
    Run Playwright tests in headless mode (default is headed)

.PARAMETER ForceRebuild
    Force rebuild and relaunch even if app is already running

.EXAMPLE
    .\run-share-button-tests.ps1
    
    Reuses running app if healthy, runs tests in headed mode.

.EXAMPLE
    .\run-share-button-tests.ps1 -ForceRebuild
    
    Kills existing app, rebuilds, relaunches in new window.

.EXAMPLE
    .\run-share-button-tests.ps1 -KeepAppRunning
    
    Keeps application running after tests for debugging.

.NOTES
    Author: CORTEX (GitHub Copilot)
    Date: 2025-11-23
    Version: 2.0.0 (Intelligent process reuse)
    
    Requirements:
    - nc.ps1 script in Workspaces/Global/
    - Playwright installed (npx playwright install)
    - .NET 8.0 SDK
    - Norton AntiVirus (20-second validation wait for new launches)
#>

[CmdletBinding()]
param(
    [switch]$KeepAppRunning,
    [switch]$HeadlessTests,
    [switch]$ForceRebuild
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Configuration
$ScriptRoot = Split-Path -Parent $PSCommandPath
$WorkspaceRoot = Split-Path -Parent $ScriptRoot
$NcScriptPath = Join-Path $WorkspaceRoot "Workspaces\Global\nc.ps1"
$AppUrl = "https://localhost:9091"
$HealthCheckEndpoint = "$AppUrl/health"
$MaxHealthCheckAttempts = 15
$HealthCheckIntervalSeconds = 2
$NortonValidationWaitSeconds = 20
$TestPattern = "Tests/UI/verify-share-button-injection.spec.ts"

# Database Configuration (for token expiration extension)
$DbServer = "AHHOME"
$DbName = "KSESSIONS_DEV"
$DbUser = "sa"
$SessionId = 212
$SessionToken = "PQ9N5YWW"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "NOOR Canvas - Share Button Injection Tests (Smart Launch)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Session: $SessionId | Token: $SessionToken" -ForegroundColor Gray
Write-Host ""

# Step 1: Check if app is already running
Write-Host "[1/7] Checking for existing NoorCanvas instance..." -ForegroundColor Yellow
Write-Host ""

$existingProcess = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
$appIsHealthy = $false
$shouldLaunchNewInstance = $false
$appProcess = $null
$psProcess = $null  # External PowerShell window process (for cleanup)

if ($existingProcess -and -not $ForceRebuild) {
    Write-Host "   Found existing NoorCanvas process (PID: $($existingProcess.Id))" -ForegroundColor Gray
    Write-Host "   Checking if process is healthy..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $HealthCheckEndpoint `
            -Method Get `
            -UseBasicParsing `
            -SkipCertificateCheck `
            -TimeoutSec 3 `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $appIsHealthy = $true
            $appProcess = $existingProcess
            Write-Host "✓ Existing instance is healthy (HTTP 200)" -ForegroundColor Green
            Write-Host "✓ Reusing existing process (no rebuild needed)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ Existing instance not responding to health check" -ForegroundColor Yellow
        $shouldLaunchNewInstance = $true
    }
}
elseif ($ForceRebuild) {
    Write-Host "   ForceRebuild specified - will kill existing and rebuild" -ForegroundColor Yellow
    $shouldLaunchNewInstance = $true
}
else {
    Write-Host "   No existing NoorCanvas process found" -ForegroundColor Gray
    $shouldLaunchNewInstance = $true
}

Write-Host ""

# Step 2: Launch new instance if needed
if ($shouldLaunchNewInstance) {
    Write-Host "[2/7] Launching new NoorCanvas instance..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Path $NcScriptPath)) {
        Write-Host "ERROR: nc.ps1 not found at $NcScriptPath" -ForegroundColor Red
        exit 1
    }
    
    # Kill existing processes if ForceRebuild
    if ($ForceRebuild) {
        Write-Host "   Killing existing NoorCanvas processes..." -ForegroundColor Gray
        Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Launch nc.ps1 in separate external PowerShell window (not minimized - needs to stay visible)
    Write-Host "   Launching in external PowerShell window (NOT terminal)..." -ForegroundColor Gray
    $psProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "cd '$WorkspaceRoot'; & '$NcScriptPath'; Read-Host 'Press Enter to close window'" `
        -PassThru `
        -WindowStyle Normal
    
    Write-Host "✓ External PowerShell window opened (PID: $($psProcess.Id))" -ForegroundColor Green
    Write-Host "   (Window must stay open for tests to access app)" -ForegroundColor Gray
    Write-Host ""
    
    # Step 3: Norton AntiVirus validation wait (only for new launches)
    Write-Host "[3/7] Waiting $NortonValidationWaitSeconds seconds for Norton AntiVirus..." -ForegroundColor Yellow
    Write-Host "      (First run after build requires security scan)" -ForegroundColor Gray
    Write-Host ""
    
    for ($i = 1; $i -le $NortonValidationWaitSeconds; $i++) {
        Write-Progress -Activity "Norton Security Validation" `
            -Status "Waiting for security scan..." `
            -PercentComplete (($i / $NortonValidationWaitSeconds) * 100)
        Start-Sleep -Seconds 1
    }
    
    Write-Progress -Activity "Norton Security Validation" -Completed
    Write-Host "✓ Norton validation wait complete" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host "[2/7] Skipping launch - reusing healthy instance" -ForegroundColor Green
    Write-Host "[3/7] Skipping Norton wait - using existing process" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Health check (verify existing or new instance is ready)
Write-Host "[4/7] Verifying application health..." -ForegroundColor Yellow
Write-Host ""

$healthCheckSuccess = $appIsHealthy  # Already checked if reusing
$attempt = 0

if (-not $healthCheckSuccess) {
    while (-not $healthCheckSuccess -and $attempt -lt $MaxHealthCheckAttempts) {
        $attempt++
        Write-Progress -Activity "Health Check" `
            -Status "Attempt $attempt of $MaxHealthCheckAttempts" `
            -PercentComplete (($attempt / $MaxHealthCheckAttempts) * 100)
        
        try {
            $response = Invoke-WebRequest -Uri $HealthCheckEndpoint `
                -Method Get `
                -UseBasicParsing `
                -SkipCertificateCheck `
                -TimeoutSec 5 `
                -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                $healthCheckSuccess = $true
                Write-Host "✓ Health check passed (HTTP 200)" -ForegroundColor Green
                Write-Host ""
            }
        }
        catch {
            if ($attempt -lt $MaxHealthCheckAttempts) {
                Write-Host "." -NoNewline -ForegroundColor Gray
                Start-Sleep -Seconds $HealthCheckIntervalSeconds
            }
        }
    }
    
    Write-Progress -Activity "Health Check" -Completed
}
else {
    Write-Host "✓ Application already verified healthy" -ForegroundColor Green
    Write-Host ""
}

if (-not $healthCheckSuccess) {
    Write-Host "✗ Health check failed after $MaxHealthCheckAttempts attempts" -ForegroundColor Red
    Write-Host ""
    if ($shouldLaunchNewInstance -and $appProcess) {
        Write-Host "Stopping application process..." -ForegroundColor Yellow
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit 1
}

# Step 5: Extend token expiration (Database)
Write-Host "[5/7] Extending token expiration for session $SessionId..." -ForegroundColor Yellow
Write-Host ""

try {
    # Read database password from config
    $configPath = Join-Path $WorkspaceRoot "config\sharedsettings.local.json"
    if (-not (Test-Path $configPath)) {
        $configPath = Join-Path $WorkspaceRoot "config\sharedsettings.json"
    }
    
    $config = Get-Content $configPath | ConvertFrom-Json
    $connectionString = $config.ConnectionStrings.Development
    
    # Extract database name for validation
    if ($connectionString -match "Database=([^;]+)") {
        $detectedDbName = $matches[1]
        
        # CRITICAL: Prevent tests from running against production
        if ($detectedDbName -eq "KSESSIONS") {
            Write-Host ""
            Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
            Write-Host "⛔ PRODUCTION DATABASE DETECTED - ABORTING TESTS" -ForegroundColor Red
            Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
            Write-Host ""
            Write-Host "ERROR: Connection string points to KSESSIONS (PRODUCTION)" -ForegroundColor Red
            Write-Host "       Tests can only run against KSESSIONS_DEV" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "       Current: $detectedDbName" -ForegroundColor Red
            Write-Host "       Expected: KSESSIONS_DEV" -ForegroundColor Green
            Write-Host ""
            exit 1
        }
        
        if ($detectedDbName -ne $DbName) {
            Write-Host "   ⚠ Database mismatch: Config=$detectedDbName, Expected=$DbName" -ForegroundColor Yellow
            Write-Host "   Using config value: $detectedDbName" -ForegroundColor Gray
            $DbName = $detectedDbName
        }
    }
    
    # Extract password from connection string
    if ($connectionString -match "Password=([^;]+)") {
        $DbPassword = $matches[1]
    }
    else {
        throw "Could not extract password from connection string"
    }
    
    Write-Host "   Connecting to $DbServer.$DbName..." -ForegroundColor Gray
    
    # Build SQL command to execute stored procedure
    $sqlQuery = "EXEC canvas.CleanCanvas;"
    
    $sqlCmd = "sqlcmd -S $DbServer -d $DbName -U $DbUser -P `"$DbPassword`" -Q `"$sqlQuery`" -b"
    
    $output = Invoke-Expression $sqlCmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Stored procedure canvas.CleanCanvas executed successfully" -ForegroundColor Green
        Write-Host "✓ Token expiration extended for all active sessions" -ForegroundColor Green
        
        # Validate token is actually valid now
        Write-Host ""
        Write-Host "   Validating token $SessionToken..." -ForegroundColor Gray
        
        $validateQuery = "SELECT Expiration FROM canvas.Sessions WHERE HostToken = '$SessionToken';"
        $validateCmd = "sqlcmd -S $DbServer -d $DbName -U $DbUser -P `"$DbPassword`" -Q `"$validateQuery`" -h -1 -W"
        
        $expiration = Invoke-Expression $validateCmd 2>&1 | Where-Object { $_ -match '^\d{4}-\d{2}-\d{2}' }
        
        if ($expiration) {
            $expirationDate = [DateTime]::Parse($expiration.Trim())
            $now = Get-Date
            $timeUntilExpiry = $expirationDate - $now
            
            if ($expirationDate -lt $now) {
                Write-Host "   ✗ Token EXPIRED on $($expirationDate.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Red
                Write-Host ""
                Write-Host "ERROR: Cannot run tests with expired token" -ForegroundColor Red
                exit 1
            }
            elseif ($timeUntilExpiry.TotalMinutes -lt 10) {
                Write-Host "   ⚠ Token expires in $([int]$timeUntilExpiry.TotalMinutes) minutes at $($expirationDate.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
            }
            else {
                Write-Host "   ✓ Token valid until $($expirationDate.ToString('yyyy-MM-dd HH:mm:ss')) ($([int]$timeUntilExpiry.TotalHours) hours)" -ForegroundColor Green
            }
        }
        else {
            Write-Host "   ⚠ Could not verify token expiration" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "✗ Failed to execute stored procedure (Exit Code: $LASTEXITCODE)" -ForegroundColor Yellow
        Write-Host "   Output: $output" -ForegroundColor Gray
        Write-Host "   Continuing with tests (token may expire during execution)..." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Database connection failed: $_" -ForegroundColor Yellow
    Write-Host "   Continuing with tests (token may expire during execution)..." -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Run Playwright tests in external browser window
Write-Host "[6/7] Running Playwright tests (external browser window)..." -ForegroundColor Yellow
Write-Host ""

$testArgs = @(
    "playwright",
    "test",
    $TestPattern
)

if (-not $HeadlessTests) {
    $testArgs += "--headed"
}

Write-Host "Test command: npx $($testArgs -join ' ')" -ForegroundColor Gray
Write-Host "Working directory: $WorkspaceRoot" -ForegroundColor Gray
Write-Host "Browser will launch in separate window" -ForegroundColor Gray
Write-Host ""

try {
    Push-Location $WorkspaceRoot
    & npx @testArgs
    $testExitCode = $LASTEXITCODE
    Pop-Location
}
catch {
    Write-Host "ERROR: Failed to run Playwright tests: $_" -ForegroundColor Red
    $testExitCode = 1
    Pop-Location
}

Write-Host ""

# Step 7: Cleanup
if (-not $KeepAppRunning -and $shouldLaunchNewInstance) {
    Write-Host "[7/7] Stopping application..." -ForegroundColor Yellow
    
    # Kill all NoorCanvas processes (launched from external PowerShell)
    $noorProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    if ($noorProcesses) {
        $noorProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✓ NoorCanvas processes stopped" -ForegroundColor Green
    }
    
    # Kill the PowerShell window
    if ($psProcess) {
        Stop-Process -Id $psProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✓ External PowerShell window closed" -ForegroundColor Green
    }
}
elseif ($KeepAppRunning) {
    Write-Host "[7/7] Application still running in external window" -ForegroundColor Cyan
    Write-Host "      Access at: $AppUrl" -ForegroundColor Cyan
    Write-Host "      Close PowerShell window manually to stop" -ForegroundColor Gray
}
else {
    Write-Host "[7/7] Leaving existing application running" -ForegroundColor Cyan
    Write-Host "      (Use -ForceRebuild to restart)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
}
else {
    Write-Host "✗ TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

exit $testExitCode
