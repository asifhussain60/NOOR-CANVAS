# Run Host Provisioner Percy Visual Regression Tests
# Launches the Host Provisioner WinForms application and runs Percy tests

param(
    [switch]$KeepAppRunning
)

$ErrorActionPreference = "Stop"

$AppPath = "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms\bin\Debug\net8.0-windows\HostProvisioner.WinForms.exe"
$ProjectPath = "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner.WinForms"
$TestSpec = "Tests/UI/host-provisioner-visual-regression.spec.ts"
$ScreenshotDir = "D:\PROJECTS\NOOR CANVAS\Workspaces\PercyScreenshots\HostProvisioner"

Write-Host "Host Provisioner Percy Visual Regression Tests" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $ScreenshotDir)) {
    Write-Host "Creating screenshot directory..." -ForegroundColor Yellow
    New-Item -Path $ScreenshotDir -ItemType Directory -Force | Out-Null
}

Write-Host "Building Host Provisioner WinForms..." -ForegroundColor Cyan
Push-Location $ProjectPath
try {
    dotnet build --configuration Debug
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "Build successful" -ForegroundColor Green
}
finally {
    Pop-Location
}

Write-Host ""

if (-not (Test-Path $AppPath)) {
    Write-Host "Host Provisioner executable not found at: $AppPath" -ForegroundColor Red
    exit 1
}

Write-Host "Launching Host Provisioner application..." -ForegroundColor Cyan
$AppProcess = Start-Process -FilePath $AppPath -PassThru -WindowStyle Normal

Write-Host "Host Provisioner launched (PID: $($AppProcess.Id))" -ForegroundColor Green
Write-Host "Waiting 5 seconds for initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Running Percy visual regression tests..." -ForegroundColor Cyan
Write-Host ""

Push-Location "D:\PROJECTS\NOOR CANVAS"
try {
    npm run test:percy $TestSpec -- --headed
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tests completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
    else {
        Write-Host "All tests passed" -ForegroundColor Green
    }
}
catch {
    Write-Host "Test execution failed: $_" -ForegroundColor Red
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Screenshot Documentation:" -ForegroundColor Cyan
if (Test-Path $ScreenshotDir) {
    $htmlFiles = Get-ChildItem -Path $ScreenshotDir -Filter "*.html" -ErrorAction SilentlyContinue
    if ($htmlFiles) {
        Write-Host "Generated HTML documentation files:" -ForegroundColor Gray
        foreach ($file in $htmlFiles) {
            Write-Host "  $($file.Name)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Location: $ScreenshotDir" -ForegroundColor Gray
    }
}

Write-Host ""

if ($KeepAppRunning) {
    Write-Host "Host Provisioner is still running (PID: $($AppProcess.Id))" -ForegroundColor Green
    Write-Host "Close the application window when finished" -ForegroundColor Yellow
}
else {
    Write-Host "Stopping Host Provisioner application..." -ForegroundColor Yellow
    try {
        if (-not $AppProcess.HasExited) {
            Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Host "Application stopped" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Could not stop application: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Test Execution Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review Percy snapshots at: https://percy.io" -ForegroundColor White
Write-Host "2. Check HTML documentation in: Workspaces\PercyScreenshots\HostProvisioner" -ForegroundColor White
Write-Host "3. Manually test dragging the header bar" -ForegroundColor White
Write-Host "4. Test token generation with Session ID 212" -ForegroundColor White
Write-Host ""
