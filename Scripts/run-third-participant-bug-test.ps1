# Orchestration Script: Third Participant Bug Investigation
# PROTOCOL: Launch app in SEPARATE POWERSHELL WINDOW (per task.prompt.md Step 6.1)
# Purpose: Maintain proper environment isolation and visual consistency for headed Playwright tests

param(
    [switch]$KeepAppRunning = $false,
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$testFile = "Workspaces/TEMP/third-participant-bug.spec.ts"

Write-Host "" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Third Participant Bug Investigation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build application (unless skipped)
if (-not $SkipBuild) {
    Write-Host "[STEP 1] Building application..." -ForegroundColor Yellow
    Set-Location -Path "$workspaceRoot\SPA\NoorCanvas"
    dotnet build --configuration Debug
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed! Exiting..." -ForegroundColor Red
        exit 1
    }
    Write-Host "[SUCCESS] Build completed" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Launch app in SEPARATE PowerShell window (per protocol)
Write-Host "[STEP 2] Launching application in SEPARATE PowerShell window..." -ForegroundColor Yellow
Write-Host "  Protocol: task.prompt.md Step 6.1 - Orchestration script requirement" -ForegroundColor Gray

# Create launch script for separate window
$launchScript = @"
Set-Location -Path '$workspaceRoot\SPA\NoorCanvas'
Write-Host 'NoorCanvas Application Starting...' -ForegroundColor Cyan
Write-Host 'Close this window to stop the application' -ForegroundColor Yellow
Write-Host ''
dotnet run --urls 'https://localhost:9091'
"@

$launchScriptPath = "$env:TEMP\noorcanvas-launch-temp.ps1"
$launchScript | Out-File -FilePath $launchScriptPath -Encoding UTF8

# Launch in NEW PowerShell window (not background job)
$appProcess = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $launchScriptPath -PassThru -WindowStyle Normal

Write-Host "[SUCCESS] Application launched in separate window (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host "  Waiting 20 seconds for application startup..." -ForegroundColor Gray
Start-Sleep -Seconds 20
Write-Host ""

try {
    # Step 3: Run Playwright test (headed mode with Percy)
    Write-Host "[STEP 3] Running Playwright test (headed mode with Percy)..." -ForegroundColor Yellow
    Set-Location -Path "$workspaceRoot"
    
    # Execute test via npx (as per PlaywrightQuickRef.md)
    npx playwright test $testFile --headed
    
    $testExitCode = $LASTEXITCODE
    Write-Host ""
    
    if ($testExitCode -eq 0) {
        Write-Host "[SUCCESS] Test completed successfully" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Test failed or encountered issues (Exit Code: $testExitCode)" -ForegroundColor Yellow
        Write-Host "  Check playwright-report/ for details" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Step 4: Log Analysis Instructions
    Write-Host "[STEP 4] Log Analysis Instructions" -ForegroundColor Cyan
    Write-Host "  Check application window logs for:" -ForegroundColor White
    Write-Host "    - [DEBUG-WORKITEM:use-landing:trace] Database query results" -ForegroundColor Gray
    Write-Host "    - [DEBUG-WORKITEM:use-landing:trace] Participant count mismatches" -ForegroundColor Gray
    Write-Host "    - [DEBUG-WORKITEM:use-landing:trace] API transformation issues" -ForegroundColor Gray
    Write-Host ""
    
} finally {
    # Step 5: Cleanup
    if (-not $KeepAppRunning) {
        Write-Host "[STEP 5] Stopping application..." -ForegroundColor Yellow
        
        if ($appProcess -and -not $appProcess.HasExited) {
            $appProcess.Kill()
            Write-Host "[SUCCESS] Application stopped (PID: $($appProcess.Id))" -ForegroundColor Green
        }
        
        # Cleanup temp launch script
        if (Test-Path $launchScriptPath) {
            Remove-Item $launchScriptPath -Force
        }
    } else {
        Write-Host "[INFO] Application still running (PID: $($appProcess.Id))" -ForegroundColor Yellow
        Write-Host "  Close the PowerShell window manually to stop" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Investigation Complete" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Results:" -ForegroundColor White
Write-Host "  - Test report: playwright-report/" -ForegroundColor Gray
Write-Host "  - Percy snapshots: https://percy.io (if configured)" -ForegroundColor Gray
Write-Host "  - Application logs: Check separate PowerShell window" -ForegroundColor Gray
Write-Host ""

