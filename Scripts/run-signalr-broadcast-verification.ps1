<#
.SYNOPSIS
    Runs headless Playwright tests to verify SignalR broadcast flow

.DESCRIPTION
    Launches app, runs diagnostic tests to verify event handler registration timing
    and broadcast delivery from HostControlPanel to SessionCanvas/TranscriptCanvas

.PARAMETER KeepAppRunning
    Don't kill app after tests (for manual debugging)

.PARAMETER Debug
    Run tests in debug mode with inspector

.EXAMPLE
    .\run-signalr-broadcast-verification.ps1
    .\run-signalr-broadcast-verification.ps1 -KeepAppRunning
    .\run-signalr-broadcast-verification.ps1 -Debug
#>

param(
    [switch]$KeepAppRunning,
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 SignalR Broadcast Verification Test Runner" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

# Get project paths
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$appProject = Join-Path $projectRoot "SPA\NoorCanvas\NoorCanvas.csproj"

Write-Host "`n📦 Step 1: Cleaning up existing processes..." -ForegroundColor Yellow

# Kill existing processes
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*NoorCanvas*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill processes on ports 9090/9091
$ports = @(9090, 9091)
foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port" | findstr "LISTENING"
    foreach ($connection in $connections) {
        if ($connection -match '\s+(\d+)$') {
            $processId = $matches[1]
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process -and $process.ProcessName -ne "System") {
                    Write-Host "  Killing process $($process.ProcessName) (PID: $processId) on port $port" -ForegroundColor Gray
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Process already terminated
            }
        }
    }
}

Start-Sleep -Seconds 2

Write-Host "`n📦 Step 2: Launching application..." -ForegroundColor Yellow

$appProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectRoot' ; dotnet run --project '$appProject'"
) -WindowStyle Minimized -PassThru

Write-Host "  App launched (PID: $($appProcess.Id))" -ForegroundColor Gray

Write-Host "`n⏳ Step 3: Waiting for application health check..." -ForegroundColor Yellow

$maxRetries = 30
$retryCount = 0
$appReady = $false

while ($retryCount -lt $maxRetries -and -not $appReady) {
    Start-Sleep -Seconds 1
    $retryCount++
    
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" -UseBasicParsing -SkipCertificateCheck -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $appReady = $true
            Write-Host "  ✅ App ready after $retryCount seconds" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
    }
}

if (-not $appReady) {
    Write-Host "`n  ❌ App failed to start within 30 seconds" -ForegroundColor Red
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "`n🧪 Step 4: Running SignalR broadcast verification tests..." -ForegroundColor Yellow

Push-Location (Join-Path $projectRoot "Tests\UI")

try {
    $playwrightArgs = @(
        "playwright",
        "test",
        "signalr-broadcast-verification.spec.ts",
        "--reporter=list"
    )
    
    if ($Debug) {
        $playwrightArgs += "--debug"
    }
    
    Write-Host "  Running: npx $($playwrightArgs -join ' ')" -ForegroundColor Gray
    Write-Host ""
    
    & npx @playwrightArgs
    
    $testExitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ All tests PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests FAILED (Exit Code: $testExitCode)" -ForegroundColor Red
    }
    
} finally {
    Pop-Location
}

Write-Host "`n🧹 Step 5: Cleanup..." -ForegroundColor Yellow

if ($KeepAppRunning) {
    Write-Host "  ⚠️ App kept running (PID: $($appProcess.Id))" -ForegroundColor Yellow
    Write-Host "  Kill manually: Stop-Process -Id $($appProcess.Id)" -ForegroundColor Gray
} else {
    Write-Host "  Stopping application..." -ForegroundColor Gray
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✅ Cleanup complete" -ForegroundColor Green
}

Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏁 Verification complete" -ForegroundColor Cyan

exit $testExitCode
