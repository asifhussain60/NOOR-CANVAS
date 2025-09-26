# Test CreateSession API endpoint
Write-Host "Testing CreateSession API endpoint..." -ForegroundColor Yellow

$requestBody = @{
    hostGuid = "test-host-guid-123456"
    sessionId = 1
    albumId = 1
    categoryId = 1
    maxParticipants = 10
} | ConvertTo-Json

Write-Host "Request body:" -ForegroundColor Cyan
Write-Host $requestBody

try {
    $response = Invoke-RestMethod -Uri "https://localhost:9091/api/host/session/create" `
                                 -Method POST `
                                 -Headers @{"Content-Type"="application/json"} `
                                 -Body $requestBody `
                                 -UseBasicParsing `
                                 -SkipCertificateCheck
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "FAILURE!" -ForegroundColor Red
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get response body
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}