# Test Script for KSESSIONS Database Connectivity
# This will help diagnose Issue-60 HostSessionManager problems

Write-Host "NOOR Canvas - KSESSIONS Database Connectivity Test" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Test 1: Basic server response
Write-Host "`n[TEST 1] Basic server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:9090/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Server is responding: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Host authentication (using common test GUID)
Write-Host "`n[TEST 2] Host authentication..." -ForegroundColor Yellow
$testGuid = "12345678-1234-1234-1234-123456789012"
$authPayload = @{ HostGuid = $testGuid } | ConvertTo-Json
$headers = @{ "Content-Type" = "application/json" }

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:9090/api/host/authenticate" -Method Post -Body $authPayload -Headers $headers -TimeoutSec 10
    Write-Host "✅ Host authentication successful" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-Host "⚠️  Authentication failed (expected for test GUID): $($_.Exception.Message)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Authentication error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Albums API (this is where Issue-60 likely fails)
Write-Host "`n[TEST 3] Albums API endpoint..." -ForegroundColor Yellow
try {
    $albumsUrl = "http://localhost:9090/api/host/albums?guid=$testGuid"
    $albumsResponse = Invoke-RestMethod -Uri $albumsUrl -Method Get -TimeoutSec 10
    
    if ($albumsResponse -and $albumsResponse.Count -gt 0) {
        Write-Host "✅ Albums API working - Found $($albumsResponse.Count) albums:" -ForegroundColor Green
        $albumsResponse | ForEach-Object { Write-Host "   - $($_.GroupName) (ID: $($_.GroupId))" -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  Albums API returned empty result (no albums found)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Albums API failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is likely the root cause of Issue-60!" -ForegroundColor Red
}

# Test 4: Database connectivity test endpoint (if available)
Write-Host "`n[TEST 4] Database connectivity..." -ForegroundColor Yellow
try {
    $dbTestUrl = "http://localhost:9090/api/host/test-connectivity"
    $dbResponse = Invoke-RestMethod -Uri $dbTestUrl -Method Get -TimeoutSec 10
    Write-Host "✅ Database connectivity: $($dbResponse.Status)" -ForegroundColor Green
    Write-Host "   Albums: $($dbResponse.Albums), Categories: $($dbResponse.Categories), Sessions: $($dbResponse.Sessions)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq "NotFound") {
        Write-Host "⚠️  Database test endpoint not implemented yet" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Database connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "Test completed. Check results above for Issue-60 diagnosis." -ForegroundColor Cyan
