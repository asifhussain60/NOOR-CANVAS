# COPILOT-DEBUG: Session Token Recovery Tool
# Fix Issue: nosessiondesc - JMX5EWJ8 token not found in database

Write-Host "=== COPILOT-DEBUG: Session Token Recovery ===" -ForegroundColor Green
Write-Host "Issue: nosessiondesc - Token JMX5EWJ8 not found in database" -ForegroundColor Yellow
Write-Host ""

# The issue is that JMX5EWJ8 token doesn't exist in canvas.Sessions table
# We need to either:
# 1. Generate a new session with proper description from KSESSIONS
# 2. Or use Host Provisioner to create a session for testing

Write-Host "1. Problem Analysis..." -ForegroundColor Cyan
Write-Host "   ❌ Token JMX5EWJ8 not found in canvas.Sessions table" -ForegroundColor Red
Write-Host "   ❌ This explains why SessionWaiting.razor shows error state" -ForegroundColor Red
Write-Host ""

Write-Host "2. Solution Options..." -ForegroundColor Cyan
Write-Host "   Option A: Use Host Provisioner to create session 215" -ForegroundColor Yellow
Write-Host "   Option B: Insert session record directly into database" -ForegroundColor Yellow
Write-Host ""

Write-Host "3. Testing Host Provisioner..." -ForegroundColor Cyan
try {
    $provisionerPath = "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
    if (Test-Path $provisionerPath) {
        Write-Host "   ✅ Host Provisioner found at: $provisionerPath" -ForegroundColor Green
        Write-Host "   Command to run: dotnet run -- create --session-id 215 --created-by 'GitHub Copilot Fix' --dry-run false" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Host Provisioner not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking Host Provisioner: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Expected Session Data (from KSESSIONS_DEV)..." -ForegroundColor Cyan
Write-Host "   SessionId: 212" -ForegroundColor White
Write-Host "   Title: Need For Messengers" -ForegroundColor White
Write-Host "   Description: We look at the purpose of sending messengers, and their role in our spiritual awakening." -ForegroundColor White
Write-Host ""

Write-Host "5. Next Steps:" -ForegroundColor Cyan
Write-Host "   • Run Host Provisioner to create session 215 (maps to KSESSIONS 212)" -ForegroundColor White
Write-Host "   • This will generate proper user/host tokens" -ForegroundColor White
Write-Host "   • Session description will be pulled from KSESSIONS_DEV automatically" -ForegroundColor White
Write-Host "   • Test with the newly generated user token" -ForegroundColor White