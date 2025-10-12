# Production Host Provisioner Token Generator
# Usage: .\create-token-prod.ps1 -SessionId <ID> [-CreatedBy <NAME>]

param(
    [Parameter(Mandatory=$true)]
    [int]$SessionId,
    
    [Parameter(Mandatory=$false)]
    [string]$CreatedBy = "Production User"
)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " NOOR Canvas Host Provisioner - PRODUCTION" -ForegroundColor Cyan
Write-Host " Database: KSESSIONS" -ForegroundColor Green
Write-Host " Session ID: $SessionId" -ForegroundColor Yellow
Write-Host " Created By: $CreatedBy" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variable for this process
$env:ASPNETCORE_ENVIRONMENT = "Production"

# Run the HostProvisioner
& .\HostProvisioner.exe create --session-id $SessionId --created-by $CreatedBy --dry-run false
