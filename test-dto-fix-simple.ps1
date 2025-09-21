# Test script to validate DTO binding fixes for Issue-124
# This script tests the API directly to verify data flow

Write-Host "Testing DTO binding fixes for Session Data Display (Issue-124)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Start the application
Write-Host "Starting NoorCanvas application..." -ForegroundColor Yellow
Set-Location "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"

# Start the app in background
$job = Start-Job -ScriptBlock { 
    Set-Location "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
    dotnet run 2>&1
}

# Wait for startup
Write-Host "Waiting for application startup..." -ForegroundColor Yellow
Start-Sleep 15

# Check if app is running
try {
    $health = Invoke-WebRequest -Uri "https://localhost:9091" -Method HEAD -TimeoutSec 10
    Write-Host "SUCCESS: Application is running (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Application failed to start: $($_.Exception.Message)" -ForegroundColor Red
    Get-Job | Receive-Job
    Get-Job | Stop-Job | Remove-Job
    exit 1
}

# Test the API with real KSESSIONS token
$testToken = "Z5GFJ2GR"  # Session 215 "A Model For Success"
Write-Host "Testing with real KSESSIONS token: $testToken" -ForegroundColor Yellow

try {
    $apiResponse = Invoke-RestMethod -Uri "https://localhost:9091/api/participant/session/$testToken/validate" `
        -Method GET

    Write-Host "SUCCESS: API Response received" -ForegroundColor Green
    Write-Host "Response Structure Analysis:" -ForegroundColor Cyan
    
    # Check if we have the nested Session object
    if ($apiResponse.Session) {
        Write-Host "  SUCCESS: Session object found" -ForegroundColor Green
        Write-Host "  Session Title: '$($apiResponse.Session.Title)'" -ForegroundColor White
        Write-Host "  Session Status: '$($apiResponse.Session.Status)'" -ForegroundColor White
        Write-Host "  Instructor: '$($apiResponse.Session.InstructorName)'" -ForegroundColor White
        Write-Host "  Start Time: '$($apiResponse.Session.StartTime)'" -ForegroundColor White
        Write-Host "  Duration: '$($apiResponse.Session.Duration)'" -ForegroundColor White
        
        # Check for real data vs mock/null data
        if ($apiResponse.Session.Title -and $apiResponse.Session.Title -ne "Mock Session Title") {
            Write-Host "  SUCCESS: REAL SESSION DATA DETECTED!" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Mock or missing session title" -ForegroundColor Yellow
        }
        
        if ($apiResponse.Session.InstructorName -and $apiResponse.Session.InstructorName -ne "Mock Instructor") {
            Write-Host "  SUCCESS: REAL INSTRUCTOR DATA DETECTED!" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Mock or missing instructor name" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ERROR: Session object missing from API response" -ForegroundColor Red
    }
    
    # Display full response for debugging
    Write-Host ""
    Write-Host "Full API Response:" -ForegroundColor Cyan
    $apiResponse | ConvertTo-Json -Depth 4 | Write-Host -ForegroundColor White
    
} catch {
    Write-Host "ERROR: API Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

# Cleanup
Write-Host ""
Write-Host "Cleaning up..." -ForegroundColor Yellow
Get-Job | Stop-Job | Remove-Job

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green