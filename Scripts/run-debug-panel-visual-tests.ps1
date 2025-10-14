# Execute Debug Panel Visual Regression Tests
# Purpose: Launch app in separate PowerShell window, run Playwright + Percy tests
# Usage: .\run-debug-panel-visual-tests.ps1 [-KeepAppRunning] [-HeadlessMode] [-NoPercy]

param(
    [switch]$KeepAppRunning,            # Don't kill app after tests complete
    [switch]$HeadlessMode,              # Run tests in headless mode (default: headed)
    [switch]$NoPercy                    # Skip Percy visual regression (default: enabled)
)

$ErrorActionPreference = "Stop"

Write-Host "=== Debug Panel Visual Regression Test Suite ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Launch app in separate PowerShell window
Write-Host "Step 1: Launching NoorCanvas in separate PowerShell window..." -ForegroundColor Yellow

$appScriptPath = "D:\PROJECTS\NOOR CANVAS\Scripts\start-with-debug-panel.ps1"
$appProcess = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File `"$appScriptPath`"" -PassThru
Write-Host "✅ App launched in PowerShell window (PID: $($appProcess.Id))" -ForegroundColor Green
Write-Host "   Waiting 15 seconds for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

try {
    # Step 2: Run diagnostic check
    Write-Host ""
    Write-Host "Step 2: Running diagnostic check..." -ForegroundColor Yellow
    $diagScriptPath = "D:\PROJECTS\NOOR CANVAS\Scripts\diagnose-debug-panel.ps1"
    & $diagScriptPath
    
    # Step 3: Run Playwright tests
    Write-Host ""
    Write-Host "Step 3: Running Playwright tests..." -ForegroundColor Yellow
    Set-Location "D:\PROJECTS\NOOR CANVAS\Tests\UI"
    
    $testArgs = @("test", "debug-panel-visual-regression.spec.ts")
    
    if (-not $HeadlessMode) {
        $testArgs += "--headed"
        Write-Host "   Running in HEADED mode (browser visible)" -ForegroundColor Cyan
    } else {
        Write-Host "   Running in HEADLESS mode" -ForegroundColor Cyan
    }
    
    if (-not $NoPercy) {
        Write-Host "   Percy visual regression: ENABLED" -ForegroundColor Cyan
        $env:PERCY_TOKEN = $env:PERCY_TOKEN  # Use existing token
        npx percy exec -- npx playwright @testArgs
    } else {
        Write-Host "   Percy visual regression: DISABLED" -ForegroundColor Cyan
        npx playwright @testArgs
    }
    
    Write-Host ""
    Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Tests failed with error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
} finally {
    # Step 4: Cleanup
    Write-Host ""
    Write-Host "Step 4: Cleanup..." -ForegroundColor Yellow
    
    if (-not $KeepAppRunning) {
        Write-Host "   Stopping app (PID: $($appProcess.Id))..." -ForegroundColor Yellow
        
        # Find and kill dotnet processes related to NoorCanvas
        $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | 
            Where-Object { $_.MainWindowTitle -like "*NoorCanvas*" -or $_.CommandLine -like "*NoorCanvas*" }
        
        foreach ($proc in $dotnetProcesses) {
            try {
                Stop-Process -Id $proc.Id -Force
                Write-Host "   ✅ Stopped dotnet process (PID: $($proc.Id))" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️  Could not stop process (PID: $($proc.Id))" -ForegroundColor Yellow
            }
        }
        
        # Stop the PowerShell window
        try {
            Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Stopped PowerShell window (PID: $($appProcess.Id))" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  PowerShell window may have already closed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ℹ️  Keeping app running (use -KeepAppRunning:`$false to stop)" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "=== Test Suite Complete ===" -ForegroundColor Cyan
}
