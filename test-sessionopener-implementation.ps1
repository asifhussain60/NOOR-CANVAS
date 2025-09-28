#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test script for Issue sessionopener implementation - verifies Host Session Opener scheduling data flows to SessionWaiting.razor
    
.DESCRIPTION
    This script tests the complete implementation:
    1. Host creates session with custom scheduling data (Date: 09/28/2025, Time: 6:00 AM, Duration: 60)
    2. Verifies the scheduling data is stored in the database
    3. Verifies the participant validation API returns the scheduling data
    4. Confirms SessionWaiting.razor can access the host form data
#>

param(
    [string]$BaseUrl = "https://localhost:9091"
)

Write-Host "🔧 Testing Issue sessionopener implementation..." -ForegroundColor Cyan
Write-Host "📍 Application URL: $BaseUrl" -ForegroundColor Yellow

# Test data matching the pasted image requirements
$testData = @{
    HostGuid = "PQ9N5YWW"
    SessionId = 215
    AlbumId = 3 
    CategoryId = 18
    SessionDate = "2025-09-28"    # Date: 09/28/2025 from image
    SessionTime = "6:00 AM"       # Time: 6:00 AM from image
    SessionDuration = "60"        # Duration: 60 minutes from image
}

Write-Host "📋 Test Data:" -ForegroundColor Green
Write-Host "   Host Token: $($testData.HostGuid)" -ForegroundColor White
Write-Host "   Session ID: $($testData.SessionId)" -ForegroundColor White
Write-Host "   Scheduled Date: $($testData.SessionDate)" -ForegroundColor Magenta
Write-Host "   Scheduled Time: $($testData.SessionTime)" -ForegroundColor Magenta
Write-Host "   Scheduled Duration: $($testData.SessionDuration) minutes" -ForegroundColor Magenta

try {
    # Step 1: Create session with scheduling data (simulating Host-SessionOpener.razor)
    Write-Host "`n🎯 Step 1: Testing session creation with scheduling data..." -ForegroundColor Cyan
    
    $createSessionBody = @{
        HostGuid = $testData.HostGuid
        SessionId = $testData.SessionId
        AlbumId = $testData.AlbumId
        CategoryId = $testData.CategoryId
        SessionDate = $testData.SessionDate
        SessionTime = $testData.SessionTime  
        SessionDuration = $testData.SessionDuration
        Title = "Test Session"
        Description = "Test session for sessionopener implementation"
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Uri "$BaseUrl/api/host/session/create" -Method POST -Body $createSessionBody -ContentType "application/json" -SkipCertificateCheck

    if ($createResponse.Status -eq "Success") {
        Write-Host "   ✅ Session created successfully!" -ForegroundColor Green
        Write-Host "   📊 Session ID: $($createResponse.SessionId)" -ForegroundColor White
        Write-Host "   🔗 Join Link: $($createResponse.JoinLink)" -ForegroundColor White
        
        # Extract UserToken from JoinLink
        $userToken = ($createResponse.JoinLink -split "/")[-1]
        Write-Host "   🎫 User Token: $userToken" -ForegroundColor Yellow
        
        # Step 2: Test participant validation to verify scheduling data (simulating SessionWaiting.razor)
        Write-Host "`n🎯 Step 2: Testing participant validation for scheduling data..." -ForegroundColor Cyan
        
        $validateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/participant/session/$userToken/validate" -Method GET -SkipCertificateCheck
        
        if ($validateResponse.Valid) {
            Write-Host "   ✅ Token validation successful!" -ForegroundColor Green
            Write-Host "   📋 Session Title: $($validateResponse.Session.Title)" -ForegroundColor White
            Write-Host "   📋 Session Status: $($validateResponse.Session.Status)" -ForegroundColor White
            
            # Check if scheduling data is present
            Write-Host "`n🔍 Verification: Host Session Opener scheduling data availability..." -ForegroundColor Cyan
            
            if ($validateResponse.Session.ScheduledDate) {
                Write-Host "   ✅ Scheduled Date: $($validateResponse.Session.ScheduledDate)" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Scheduled Date: MISSING" -ForegroundColor Red
            }
            
            if ($validateResponse.Session.ScheduledTime) {
                Write-Host "   ✅ Scheduled Time: $($validateResponse.Session.ScheduledTime)" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Scheduled Time: MISSING" -ForegroundColor Red
            }
            
            if ($validateResponse.Session.ScheduledDuration) {
                Write-Host "   ✅ Scheduled Duration: $($validateResponse.Session.ScheduledDuration) minutes" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Scheduled Duration: MISSING" -ForegroundColor Red
            }
            
            # Verify data matches input
            $dataMatches = (
                $validateResponse.Session.ScheduledDate -eq $testData.SessionDate -and
                $validateResponse.Session.ScheduledTime -eq $testData.SessionTime -and  
                $validateResponse.Session.ScheduledDuration -eq $testData.SessionDuration
            )
            
            Write-Host "`n📊 Implementation Status:" -ForegroundColor Cyan
            if ($dataMatches) {
                Write-Host "   🎉 SUCCESS: Host Session Opener scheduling data is now accessible to SessionWaiting.razor!" -ForegroundColor Green
                Write-Host "   ✅ Data flow verification: Host form → Database → Participant API → SessionWaiting.razor" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  PARTIAL: Scheduling data flow implemented but data mismatch detected" -ForegroundColor Yellow
                Write-Host "   📝 Expected: Date=$($testData.SessionDate), Time=$($testData.SessionTime), Duration=$($testData.SessionDuration)" -ForegroundColor White
                Write-Host "   📝 Received: Date=$($validateResponse.Session.ScheduledDate), Time=$($validateResponse.Session.ScheduledTime), Duration=$($validateResponse.Session.ScheduledDuration)" -ForegroundColor White
            }
            
        } else {
            Write-Host "   ❌ Token validation failed!" -ForegroundColor Red
            Write-Host "   📝 Response: $($validateResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "   ❌ Session creation failed!" -ForegroundColor Red
        Write-Host "   📝 Response: $($createResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Test failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📝 Error Details: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
}

Write-Host "`n🏁 Test completed!" -ForegroundColor Cyan