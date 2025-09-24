# COPILOT-DEBUG: Session Description Fix - Final Validation
# Fix Issue: nosessiondesc - Apply database fix for Album/Category display

Write-Host "=== COPILOT-DEBUG: Session Description Fix - Final Validation ===" -ForegroundColor Green
Write-Host "Issue: nosessiondesc - Database still shows 'Album: 14, Category: 52'" -ForegroundColor Yellow
Write-Host "Tokens from screenshot: Host=ZENIXXH2, User=3SVQYLWC" -ForegroundColor Cyan
Write-Host ""

# Test the API with the correct user token
Write-Host "1. Testing API with User Token: 3SVQYLWC..." -ForegroundColor Cyan
$uri = "http://localhost:9090/api/participant/session/3SVQYLWC/validate"

try {
    $webClient = New-Object System.Net.WebClient
    $jsonResponse = $webClient.DownloadString($uri)
    $data = $jsonResponse | ConvertFrom-Json
    
    Write-Host "✅ API Response Success" -ForegroundColor Green
    Write-Host "   Session ID: $($data.Session.SessionId)" -ForegroundColor White
    Write-Host "   Session Title: $($data.Session.Title)" -ForegroundColor White
    Write-Host "   Session Description: $($data.Session.Description)" -ForegroundColor White
    
    # Check if description still contains Album/Category format
    if ($data.Session.Description -like "*Album:*Category:*") {
        Write-Host "❌ CONFIRMED: Description still contains Album/Category format!" -ForegroundColor Red
        Write-Host "   Current Description: $($data.Session.Description)" -ForegroundColor Red
        
        Write-Host ""
        Write-Host "2. Database Fix Required..." -ForegroundColor Cyan
        Write-Host "   The Host Provisioner created the session but didn't sync the description" -ForegroundColor Yellow
        Write-Host "   Need to update canvas.Sessions.Description from KSESSIONS_DEV source" -ForegroundColor Yellow
        
        # Show the SQL fix needed
        Write-Host ""
        Write-Host "3. SQL Fix (run in SSMS on KSESSIONS_DEV):" -ForegroundColor Cyan
        Write-Host "   UPDATE canvas.Sessions" -ForegroundColor Yellow
        Write-Host "   SET Description = (SELECT TOP 1 Description FROM dbo.Sessions WHERE SessionId = $($data.Session.SessionId))" -ForegroundColor Yellow
        Write-Host "   WHERE SessionId = $($data.Session.SessionId)" -ForegroundColor Yellow
        
    } else {
        Write-Host "✅ Description format looks correct" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ API Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Expected Fix Result:" -ForegroundColor Cyan
Write-Host "   From: 'Album: 14, Category: 52'" -ForegroundColor Red
Write-Host "   To:   'we look at the purpose of sending messengers, and their role in our spiritual awakening.'" -ForegroundColor Green