# Run Annotation Laser Pointer Functional Test
# This script launches the app, waits for it to be ready, runs the test, and cleans up

param(
    [switch]$KeepAppRunning,
    [switch]$Headed
)

$ErrorActionPreference = "Continue"

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Annotation Laser Pointer Test Runner" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

# Step 1: Kill any existing NoorCanvas processes
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Launch app in separate PowerShell window
Write-Host "Step 2: Launching NoorCanvas application..." -ForegroundColor Yellow
$startupScript = @"
cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host 'Starting NoorCanvas for Annotation Laser Test...' -ForegroundColor Green
dotnet run
"@

$startupScript | Out-File "$env:TEMP\noorcanvas-annotation-laser-startup.ps1" -Encoding UTF8
$appProcess = Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$env:TEMP\noorcanvas-annotation-laser-startup.ps1" -PassThru

Write-Host "  App launched in separate window (PID: $($appProcess.Id))" -ForegroundColor Green

# Step 3: Health check with retry
Write-Host "`nStep 3: Waiting for application to be ready..." -ForegroundColor Yellow
$healthCheckRetries = 15
$healthCheckDelay = 3
$appReady = $false

for ($i = 1; $i -le $healthCheckRetries; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "https://localhost:9091" -Method HEAD -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✓ App is ready!" -ForegroundColor Green
        $appReady = $true
        break
    }
    catch {
        Write-Host "  Attempt $i/$healthCheckRetries - App not ready yet..." -ForegroundColor Gray
        Start-Sleep -Seconds $healthCheckDelay
    }
}

if (-not $appReady) {
    Write-Host "`n  ✗ ERROR: Application failed to start within $($healthCheckRetries * $healthCheckDelay) seconds" -ForegroundColor Red
    Write-Host "  Cleaning up..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Step 4: Run Playwright test
Write-Host "`nStep 4: Running Playwright test..." -ForegroundColor Yellow

$testArgs = @(
    "playwright",
    "test",
    "Workspaces/TEMP/annotation-laser-pointer-functional.spec.ts",
    "--reporter=list"
)

if ($Headed) {
    $testArgs += "--headed"
    Write-Host "  Running in headed mode (browser visible)" -ForegroundColor Cyan
}

Set-Location "d:\PROJECTS\NOOR CANVAS"
Write-Host "  Test command: npx $($testArgs -join ' ')" -ForegroundColor Gray
npx @testArgs

$testExitCode = $LASTEXITCODE

# Step 5: Display results
Write-Host "`n=================================" -ForegroundColor Cyan
if ($testExitCode -eq 0) {
    Write-Host "✓ TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ TESTS FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
}
Write-Host "=================================`n" -ForegroundColor Cyan

# Step 6: Cleanup
if ($KeepAppRunning) {
    Write-Host "KeepAppRunning flag set - Application remains running" -ForegroundColor Yellow
    Write-Host "  App URL: https://localhost:9091/annotation-demo.html" -ForegroundColor Cyan
    Write-Host "  Process ID: $($appProcess.Id)" -ForegroundColor Gray
    Write-Host "  To stop: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Gray
} else {
    Write-Host "Step 6: Cleaning up..." -ForegroundColor Yellow
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Application stopped" -ForegroundColor Green
}

Write-Host "`nTest run complete.`n" -ForegroundColor Cyan
exit $testExitCode
