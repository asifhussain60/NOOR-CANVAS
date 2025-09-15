# Quick test of the improved ncdoc functionality
Write-Host "Testing improved ncdoc script..." -ForegroundColor Green

# Test the main script
$scriptPath = ".\Workspaces\Global\ncdoc.ps1"
if (Test-Path $scriptPath) {
    Write-Host "Found ncdoc script at: $scriptPath" -ForegroundColor Cyan
    
    # Test help function
    Write-Host "Testing help output..." -ForegroundColor Yellow
    & $scriptPath -Help
    
    Write-Host "`n--- Script test complete ---" -ForegroundColor Green
} else {
    Write-Host "ncdoc script not found!" -ForegroundColor Red
}
