#!/usr/bin/env pwsh
# Quick validation script for NoorCanvas UI fixes

Write-Host "🔍 NoorCanvas UI Fix Validation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Start application
Write-Host "🚀 Starting NoorCanvas application..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" -PassThru

# Wait for app to start
Write-Host "⏳ Waiting for application to start (15 seconds)..." -ForegroundColor Yellow
Start-Sleep 15

# Check if app is running
try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -Method HEAD -TimeoutSec 10
    Write-Host "✅ Application is running on https://localhost:9091" -ForegroundColor Green
    
    # Run the User Experience test
    Write-Host "🧪 Running User Experience tests..." -ForegroundColor Yellow
    
    $testResult = & npx playwright test Tests/UI/user-experience.spec.ts --reporter=list
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All User Experience tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Some tests failed. Check output above." -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Application is not responding. Check startup logs." -ForegroundColor Red
} finally {
    # Cleanup
    Write-Host "🧹 Stopping application..." -ForegroundColor Yellow
    if ($appProcess -and !$appProcess.HasExited) {
        $appProcess.Kill()
    }
    taskkill /F /IM dotnet.exe 2>$null
}

Write-Host "🏁 Validation complete!" -ForegroundColor Cyan