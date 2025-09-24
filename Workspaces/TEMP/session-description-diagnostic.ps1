# COPILOT-DEBUG: Session Description Diagnostic Tool
# Fix Issue: nosessiondesc - SessionWaiting.razor showing Album/Category instead of description

Write-Host "=== COPILOT-DEBUG: Session Description Diagnostic ===" -ForegroundColor Green
Write-Host "Issue: nosessiondesc - SessionWaiting.razor showing album/category instead of session description" -ForegroundColor Yellow
Write-Host ""

# Test the API endpoint directly
Write-Host "1. Testing API Endpoint..." -ForegroundColor Cyan
$uri = "http://localhost:9090/api/participant/session/JMX5EWJ8/validate"

try {
    # Use System.Net.WebClient for better compatibility with PowerShell 5.1
    $webClient = New-Object System.Net.WebClient
    $jsonResponse = $webClient.DownloadString($uri)
    $data = $jsonResponse | ConvertFrom-Json
    
    Write-Host "✅ API Response Success" -ForegroundColor Green
    Write-Host "   Session ID: $($data.Session.SessionId)" -ForegroundColor White
    Write-Host "   Session Title: $($data.Session.Title)" -ForegroundColor White
    Write-Host "   Session Description: $($data.Session.Description)" -ForegroundColor White
    
    # Check if description contains Album/Category format
    if ($data.Session.Description -like "*Album:*Category:*") {
        Write-Host "❌ ISSUE FOUND: Description contains Album/Category format!" -ForegroundColor Red
        Write-Host "   Current Description: $($data.Session.Description)" -ForegroundColor Red
        Write-Host "   Expected: Proper session description from KSESSIONS_DEV" -ForegroundColor Yellow
        
        # Generate SQL to fix the issue
        Write-Host ""
        Write-Host "2. Database Fix Required..." -ForegroundColor Cyan
        Write-Host "   SQL to execute in SSMS on KSESSIONS_DEV:" -ForegroundColor Yellow
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
Write-Host "3. Next Steps:" -ForegroundColor Cyan
Write-Host "   • If Album/Category format found, execute the SQL above" -ForegroundColor White
Write-Host "   • Restart the application after database fix" -ForegroundColor White
Write-Host "   • Test SessionWaiting page again" -ForegroundColor White