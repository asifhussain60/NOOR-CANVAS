# SignalR Working Implementation Test Runner
# Tests the restored working SignalR functionality from commit c362e29184f7395701a73a6d023bd2be52b79b2c

Write-Host "NOOR Canvas SignalR Working Implementation Test" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Test environment validation
Write-Host "Test Environment:" -ForegroundColor Yellow
Write-Host "   • Session ID: 218" -ForegroundColor White
Write-Host "   • Host Token: LY7PQX4C" -ForegroundColor White  
Write-Host "   • User Token: E9LCN7YQ" -ForegroundColor White
Write-Host "   • Database: KSESSIONS_DEV" -ForegroundColor White
Write-Host "   • Git Commit: c362e29184f7395701a73a6d023bd2be52b79b2c" -ForegroundColor White
Write-Host ""

# Check if application is running
Write-Host "Checking if NoorCanvas application is running..." -ForegroundColor Yellow
$noorCanvasProcess = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue

if (-not $noorCanvasProcess) {
    Write-Host "ERROR: NoorCanvas application is not running!" -ForegroundColor Red
    Write-Host "   Please start the application first:" -ForegroundColor Red
    Write-Host "   cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'" -ForegroundColor Gray
    Write-Host "   dotnet run" -ForegroundColor Gray
    Write-Host ""
    exit 1
} else {
    Write-Host "SUCCESS: NoorCanvas application is running (PID: $($noorCanvasProcess.Id))" -ForegroundColor Green
}

# Check if application is responsive
Write-Host "Testing application connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -TimeoutSec 10 -ErrorAction Stop
    Write-Host "SUCCESS: Application is responding on https://localhost:9091" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Application is not responding on https://localhost:9091" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Run Playwright tests
Write-Host "🎭 Running Playwright tests..." -ForegroundColor Yellow
Write-Host ""

# Change to project root for Playwright
Set-Location "D:\PROJECTS\NOOR CANVAS"

# Run the specific SignalR test
$testFile = "Workspaces/Documentation/IMPLEMENTATIONS/SignalR/signalr-working-test.spec.ts"

Write-Host "📂 Test file: $testFile" -ForegroundColor Cyan
Write-Host ""

try {
    # Run tests with verbose output
    npx playwright test $testFile --headed --timeout=60000 --reporter=line
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ All SignalR tests passed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📸 Screenshots saved to:" -ForegroundColor Cyan
        Write-Host "   • host-panel-test-share-button.png" -ForegroundColor White
        Write-Host "   • session-canvas-layout.png" -ForegroundColor White
        Write-Host "   • host-after-share.png" -ForegroundColor White
        Write-Host "   • user-received-content.png" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Test Results Summary:" -ForegroundColor Green
        Write-Host "   ✅ Host Control Panel loads with TestShareAsset button" -ForegroundColor White
        Write-Host "   ✅ SessionCanvas displays single-column vertical layout" -ForegroundColor White
        Write-Host "   ✅ SignalR asset sharing flow works end-to-end" -ForegroundColor White
        Write-Host "   ✅ No appendChild JavaScript errors detected" -ForegroundColor White
        Write-Host "   ✅ Content renders properly without DOM manipulation issues" -ForegroundColor White
        
    } else {
        Write-Host "❌ Some tests failed (Exit code: $exitCode)" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Common issues to check:" -ForegroundColor Yellow
        Write-Host "   • Ensure session 218 exists in KSESSIONS_DEV database" -ForegroundColor White
        Write-Host "   • Verify SignalR hub is properly configured" -ForegroundColor White
        Write-Host "   • Check if TestShareAsset button appears after starting session" -ForegroundColor White
        Write-Host "   • Confirm no appendChild errors in browser console" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error running Playwright tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 For detailed analysis, check the working implementation files:" -ForegroundColor Cyan
Write-Host "   • HostControlPanel-WORKING.razor" -ForegroundColor White
Write-Host "   • SessionCanvas-WORKING.razor" -ForegroundColor White  
Write-Host "   • SessionHub-WORKING.cs" -ForegroundColor White
Write-Host "   • SIGNALR-WORKING.MD (documentation)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next steps if tests pass:" -ForegroundColor Green
Write-Host "   1. Backup current implementation" -ForegroundColor White
Write-Host "   2. Apply working SignalR pattern to current code" -ForegroundColor White
Write-Host "   3. Remove complex database broadcast system" -ForegroundColor White
Write-Host "   4. Implement simple TestShareAsset functionality" -ForegroundColor White
Write-Host ""

exit $exitCode