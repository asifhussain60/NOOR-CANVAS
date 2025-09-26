# Silent API Test for CreateSession Endpoint
# Test the API silently and capture detailed error information

param(
    [string]$Url = "https://localhost:9091/api/host/session/create",
    [int]$SessionId = 1,
    [int]$AlbumId = 1,
    [int]$CategoryId = 1
)

Write-Host "🧪 Silent API Test for CreateSession" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test request payload
$testPayload = @{
    hostGuid = "test-host-guid-123456"
    sessionId = $SessionId
    albumId = $AlbumId  
    categoryId = $CategoryId
    maxParticipants = 10
} | ConvertTo-Json -Compress

Write-Host "📤 Request URL: $Url" -ForegroundColor Yellow
Write-Host "📤 Payload: $testPayload" -ForegroundColor Yellow

# Capture start time
$startTime = Get-Date

try {
    # Make the API call
    $response = Invoke-RestMethod -Uri $Url `
                                 -Method POST `
                                 -Headers @{"Content-Type"="application/json"} `
                                 -Body $testPayload `
                                 -UseBasicParsing `
                                 -ErrorAction Stop
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "⏱️  Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Green
    Write-Host "📥 Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor White
    
} catch {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "⏱️  Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Red
    Write-Host "🔢 HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "📋 Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to capture detailed response
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "📥 Response Body: $responseBody" -ForegroundColor Yellow
            $reader.Close()
            $stream.Close()
        } catch {
            Write-Host "⚠️  Could not read response body: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Additional error details
    Write-Host "🔍 Exception Type: $($_.Exception.GetType().Name)" -ForegroundColor Magenta
    if ($_.Exception.InnerException) {
        Write-Host "🔍 Inner Exception: $($_.Exception.InnerException.Message)" -ForegroundColor Magenta
    }
}

Write-Host "`n🎯 Test completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan