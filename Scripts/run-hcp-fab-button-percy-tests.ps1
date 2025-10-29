# HCP FAB Button Percy Visual Regression Test Runner
# Orchestrates app lifecycle and Percy snapshot testing
# Key: hcp-fab-button

param(
    [switch]$KeepAppRunning = $false,
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$workspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$appPath = "$workspaceRoot\SPA\NoorCanvas"
$testPath = "$workspaceRoot\Tests\UI"
$appUrl = "http://localhost:9090"

Write-Host "🎯 HCP FAB Button Percy Visual Regression Test" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PERCY_TOKEN is set
if (-not $env:PERCY_TOKEN) {
    Write-Host "⚠️  PERCY_TOKEN not set - Percy snapshots will be skipped" -ForegroundColor Yellow
    Write-Host "   Set PERCY_TOKEN environment variable to enable visual regression testing" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Build app (unless skipped)
if (-not $SkipBuild) {
    Write-Host "📦 Step 1: Building application..." -ForegroundColor Green
    Push-Location $appPath
    try {
        $buildOutput = dotnet build --configuration Release 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            Write-Host $buildOutput
            exit 1
        }
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping build (--SkipBuild flag set)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 2: Start application in background
Write-Host "🚀 Step 2: Starting application..." -ForegroundColor Green

# Kill any existing process on port 9090
$existingProcess = Get-NetTCPConnection -LocalPort 9090 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port 9090 in use - attempting to free it..." -ForegroundColor Yellow
    $processId = $existingProcess.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start app with direct dotnet.exe launch (v3.0 pattern)
$appJob = Start-Process -FilePath "dotnet" `
    -ArgumentList "run", "--urls", $appUrl `
    -WorkingDirectory $appPath `
    -PassThru `
    -WindowStyle Normal

Write-Host "✅ Application started (PID: $($appJob.Id))" -ForegroundColor Green
Write-Host "⏳ Waiting for app to be ready..." -ForegroundColor Yellow

# Wait for app to respond
$maxAttempts = 30
$attempt = 0
$appReady = $false

while ($attempt -lt $maxAttempts -and -not $appReady) {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri $appUrl -Method Head -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "✅ Application is ready!" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
    }
}

Write-Host ""

if (-not $appReady) {
    Write-Host "❌ Application failed to start within timeout" -ForegroundColor Red
    Stop-Process -Id $appJob.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""

# Step 3: Run Percy visual regression tests
Write-Host "📸 Step 3: Running Percy visual regression tests..." -ForegroundColor Green
Push-Location $testPath

try {
    # Run Playwright test with Percy
    if ($env:PERCY_TOKEN) {
        Write-Host "🎨 Running with Percy snapshots enabled..." -ForegroundColor Cyan
        $testCommand = "npx percy exec -- npx playwright test hcp-fab-button-visual.spec.ts --headed"
    } else {
        Write-Host "🧪 Running without Percy (PERCY_TOKEN not set)..." -ForegroundColor Yellow
        $testCommand = "npx playwright test hcp-fab-button-visual.spec.ts --headed"
    }
    
    Write-Host "Command: $testCommand" -ForegroundColor Gray
    Write-Host ""
    
    Invoke-Expression $testCommand
    
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Tests failed with exit code: $testExitCode" -ForegroundColor Red
    }
}
finally {
    Pop-Location
}

Write-Host ""

# Step 4: Cleanup
if (-not $KeepAppRunning) {
    Write-Host "🧹 Step 4: Stopping application..." -ForegroundColor Green
    Stop-Process -Id $appJob.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Application stopped" -ForegroundColor Green
} else {
    Write-Host "🔄 Application kept running (--KeepAppRunning flag set)" -ForegroundColor Yellow
    Write-Host "   PID: $($appJob.Id)" -ForegroundColor Yellow
    Write-Host "   URL: $appUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎯 Test execution completed" -ForegroundColor Cyan

# Exit with test result code
exit $testExitCode
