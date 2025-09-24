#!/usr/bin/env pwsh
# PowerShell wrapper script for cleaning canvas schema

param(
    [string]$Server = "AHHOME",
    [string]$Database = "KSESSIONS_DEV",
    [switch]$Confirm = $false
)

Write-Host "Canvas Schema Cleaner" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Cyan
Write-Host "Database: $Database" -ForegroundColor Cyan
Write-Host ""

if (-not $Confirm) {
    Write-Host "This will clean the canvas schema by:" -ForegroundColor Yellow
    Write-Host "  • Truncating canvas.SessionData (all questions will be removed)" -ForegroundColor Yellow
    Write-Host "  • Truncating canvas.Participants (all participant data will be removed)" -ForegroundColor Yellow
    Write-Host "  • Extending session token expiration by 24 hours" -ForegroundColor Yellow
    Write-Host "  • Preserving canvas.Sessions table data" -ForegroundColor Green
    Write-Host ""
    
    $response = Read-Host "Are you sure you want to proceed? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y' -and $response -ne 'yes') {
        Write-Host "Operation cancelled." -ForegroundColor Red
        exit 0
    }
}

Write-Host "Executing canvas.CleanCanvas stored procedure..." -ForegroundColor Green

try {
    # Execute the stored procedure
    $result = sqlcmd -S $Server -d $Database -E -Q "EXEC canvas.CleanCanvas" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Canvas schema cleaned successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Results:" -ForegroundColor Cyan
        Write-Host $result
    } else {
        Write-Host "❌ Error executing stored procedure:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Canvas is now ready for fresh testing! 🚀" -ForegroundColor Green