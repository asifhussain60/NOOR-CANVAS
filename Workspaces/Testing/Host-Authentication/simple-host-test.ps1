# Simple Host Authentication Test
Write-Host "=== NOOR Canvas Host Authentication Test ===" -ForegroundColor Green
Write-Host "Testing friendly token: JHINFLXN" -ForegroundColor Yellow

# Skip SSL validation for localhost testing
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$friendlyToken = "JHINFLXN"
$baseUrl = "https://localhost:9091"

# Test 1: Albums API
Write-Host "`nStep 1: Testing Albums API..." -ForegroundColor Cyan
$albumsUrl = "$baseUrl/api/host/albums?guid=$friendlyToken"
try {
    $albumsResponse = Invoke-RestMethod -Uri $albumsUrl -Method Get -TimeoutSec 10
    Write-Host "✓ Albums API Success!" -ForegroundColor Green
    Write-Host "Albums Count: $($albumsResponse.Count)" -ForegroundColor White
} catch {
    Write-Host "✗ Albums API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Categories API
Write-Host "`nStep 2: Testing Categories API..." -ForegroundColor Cyan
$categoriesUrl = "$baseUrl/api/host/categories?guid=$friendlyToken"
try {
    $categoriesResponse = Invoke-RestMethod -Uri $categoriesUrl -Method Get -TimeoutSec 10
    Write-Host "✓ Categories API Success!" -ForegroundColor Green
    Write-Host "Categories Count: $($categoriesResponse.Count)" -ForegroundColor White
} catch {
    Write-Host "✗ Categories API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Sessions API
Write-Host "`nStep 3: Testing Sessions API..." -ForegroundColor Cyan
$sessionsUrl = "$baseUrl/api/host/sessions?guid=$friendlyToken"
try {
    $sessionsResponse = Invoke-RestMethod -Uri $sessionsUrl -Method Get -TimeoutSec 10
    Write-Host "✓ Sessions API Success!" -ForegroundColor Green
    Write-Host "Sessions Count: $($sessionsResponse.Count)" -ForegroundColor White
} catch {
    Write-Host "✗ Sessions API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Open Host-SessionOpener in browser
Write-Host "`nStep 4: Opening Host-SessionOpener with friendly token..." -ForegroundColor Cyan
$hostPageUrl = "$baseUrl/Host-SessionOpener?guid=$friendlyToken"
try {
    Start-Process $hostPageUrl
    Write-Host "✓ Browser launched with Host-SessionOpener!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to launch browser: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Host Authentication Test Complete ===" -ForegroundColor Green