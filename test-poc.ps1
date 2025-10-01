# PowerShell script to test Asset Share POC Implementation
Write-Host "🚀 Testing Asset Share POC Implementation" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Test Basic Broadcasting
Write-Host "`n📋 Test 1: Basic Asset Broadcasting" -ForegroundColor Yellow

try {
    $body = @{
        sessionId = 212
        content = "Test asset content from POC - PowerShell Test at $(Get-Date -Format 'HH:mm:ss')"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://localhost:9091/api/AssetShareTest/test-broadcast" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -SkipCertificateCheck

    Write-Host "✅ Basic broadcast test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Basic broadcast test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Session 212 Content
Write-Host "`n📋 Test 2: Session 212 Content Test (NO FALLBACKS - Real Data Only)" -ForegroundColor Yellow

try {
    $body = @{
        sessionId = 212
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://localhost:9091/api/AssetShareTest/test-with-session212" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -SkipCertificateCheck

    Write-Host "✅ Session 212 test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    Write-Host "Original Transcript Length: $($response.OriginalTranscriptLength) characters" -ForegroundColor Magenta
    Write-Host "Content Length: $($response.ContentLength) characters" -ForegroundColor Magenta
} catch {
    Write-Host "❌ Session 212 test failed with detailed error:" -ForegroundColor Red
    Write-Host "   Error Type: $($_.Exception.GetType().Name)" -ForegroundColor Yellow
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetail) {
            Write-Host "   API Error Details: $($errorDetail.error)" -ForegroundColor Cyan
            Write-Host "   Test ID: $($errorDetail.testId)" -ForegroundColor Cyan
        }
    }
    
    Write-Host "`n🔍 This error will help us identify the exact issue with Session 212 data retrieval." -ForegroundColor Magenta
}

# Test API availability
Write-Host "`n🔍 Testing API Endpoint Availability" -ForegroundColor Yellow

try {
    $healthCheck = Invoke-WebRequest -Uri "https://localhost:9091/api/AssetShareTest" -Method GET -SkipCertificateCheck
    Write-Host "✅ AssetShareTest controller is accessible (Status: $($healthCheck.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ AssetShareTest controller test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 POC Test Results Summary (No Fallback Mode):" -ForegroundColor Green
Write-Host "- Tests real Session 212 transcript data only - NO MOCK/SAMPLE DATA" -ForegroundColor White
Write-Host "- All failures throw clear, specific error messages for debugging" -ForegroundColor White
Write-Host "- KSESSIONS-style broadcasting approach with real content validation" -ForegroundColor White  
Write-Host "- Errors help identify exact issues: API failures, missing ayah-cards, empty content" -ForegroundColor White

Write-Host "`n✨ Error-Driven Development Approach:" -ForegroundColor Cyan
Write-Host "1. 🚨 Session 212 API not found → Fix session endpoint availability" -ForegroundColor White
Write-Host "2. 🚨 Empty transcript → Check Session 212 data integrity" -ForegroundColor White
Write-Host "3. 🚨 No ayah-cards found → Verify transcript HTML structure" -ForegroundColor White
Write-Host "4. ✅ Success → Real data extraction and broadcasting working" -ForegroundColor Green