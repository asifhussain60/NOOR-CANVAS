# run-transcript-section-broadcast-test.ps1
# Orchestration script for testing H2 section broadcast from host to participant
# Uses Session 212 with tokens: KJAHA99L (participant) / PQ9N5YWW (host)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Transcript Section Broadcast Test (Session 212)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any existing processes
Write-Host "[1/5] Cleaning up existing processes..." -ForegroundColor Yellow
Stop-Process -Name "NoorCanvas","dotnet","pwsh","powershell" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Build the application
Write-Host "[2/5] Building NoorCanvas..." -ForegroundColor Yellow
cd "d:\PROJECTS\NOOR CANVAS"
dotnet build "SPA\NoorCanvas\NoorCanvas.csproj" --nologo --verbosity quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build succeeded" -ForegroundColor Green
Write-Host ""

# Step 3: Start the application in background
Write-Host "[3/5] Starting NoorCanvas app in background..." -ForegroundColor Yellow
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run --no-build" `
    -PassThru `
    -WindowStyle Minimized

Write-Host "✅ App started (PID: $($app.Id))" -ForegroundColor Green
Write-Host "   Waiting 10 seconds for startup..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

# Step 4: Run the Playwright test
Write-Host "[4/5] Running Playwright broadcast test..." -ForegroundColor Yellow
Write-Host "   Test file: test-transcript-section-broadcast.spec.ts" -ForegroundColor Gray
Write-Host "   Session: 212" -ForegroundColor Gray
Write-Host "   Host Token: PQ9N5YWW" -ForegroundColor Gray
Write-Host "   Participant Token: KJAHA99L" -ForegroundColor Gray
Write-Host ""

try {
    cd ".github\prompts.keys\hcp-tcanvas\tests"
    npx playwright test test-transcript-section-broadcast.spec.ts --headed --reporter=list --timeout=120000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Test PASSED!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Test FAILED!" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Test execution error: $_" -ForegroundColor Red
} finally {
    # Step 5: Stop the application
    Write-Host ""
    Write-Host "[5/5] Stopping NoorCanvas app (PID: $($app.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ App stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Test orchestration complete!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
