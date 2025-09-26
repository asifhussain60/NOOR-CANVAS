# Test Session Creation API
# Test the fixed CreateSession endpoint with explicit SessionId values

Write-Host "Testing Session Creation API Fix..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Test data
$testSessionId = 299  # Use a different SessionId to avoid conflicts
$testData = @{
    HostGuid = "PQ9N5YWW"
    SessionId = $testSessionId
    AlbumId = 14
    CategoryId = 52
    Title = "Test Session - API Fix"
    Description = "Testing explicit SessionId assignment"
}

$body = $testData | ConvertTo-Json
$url = "https://localhost:9091/api/host/session/create"

Write-Host "Request URL: $url" -ForegroundColor Cyan
Write-Host "Request Body: $body" -ForegroundColor Cyan
Write-Host ""

try {
    # Make the API call
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS: Session created!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
} catch {
    Write-Host "❌ FAILED: Session creation failed" -ForegroundColor Red
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Green