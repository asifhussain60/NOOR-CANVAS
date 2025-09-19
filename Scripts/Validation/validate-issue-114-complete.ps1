# Issue-114 Complete Validation Script
# This script starts the application and runs the validation test

Write-Host "🧪 Issue-114 Complete Validation Starting..." -ForegroundColor Green

# Step 1: Kill any existing processes
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "dotnet" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Start the application in background
Write-Host "Step 2: Starting NoorCanvas application..." -ForegroundColor Yellow
$appDir = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
$job = Start-Job -ScriptBlock {
    Set-Location $using:appDir
    dotnet run
}

# Wait for application to start
Write-Host "Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 3: Check if application is running
Write-Host "Step 3: Checking application status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Application is running and responding" -ForegroundColor Green
} catch {
    Write-Host "❌ Application not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Job Status: $($job.State)" -ForegroundColor Yellow
    if ($job.State -eq "Running") {
        Write-Host "Application job is running, proceeding with test..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Application job failed" -ForegroundColor Red
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        exit 1
    }
}

# Step 4: Run the validation test
Write-Host "Step 4: Running Issue-114 validation test..." -ForegroundColor Yellow
try {
    Set-Location "D:\PROJECTS\NOOR CANVAS"
    $testResult = node validate-issue-114-with-valid-token.js
    Write-Host "Test Output:" -ForegroundColor Cyan
    Write-Host $testResult
} catch {
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Cleanup
Write-Host "Step 5: Cleaning up..." -ForegroundColor Yellow
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue

Write-Host "🏁 Issue-114 validation complete!" -ForegroundColor Green