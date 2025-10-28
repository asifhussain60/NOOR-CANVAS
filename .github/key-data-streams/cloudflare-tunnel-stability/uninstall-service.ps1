# Cloudflared Windows Service Uninstallation Script
# Removes the cloudflared Windows Service

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🗑️ Cloudflared Windows Service Uninstallation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if service exists
$service = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "ℹ️ Cloudflared service is not installed" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "Service Information:" -ForegroundColor Yellow
Write-Host "  Name:   $($service.Name)" -ForegroundColor Gray
Write-Host "  Status: $($service.Status)" -ForegroundColor Gray
Write-Host ""

# Confirm uninstallation
if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to uninstall the cloudflared service? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Uninstallation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Stop service if running
if ($service.Status -eq "Running") {
    Write-Host "⏸️ Stopping service..." -ForegroundColor Yellow
    Stop-Service -Name "cloudflared" -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Service stopped" -ForegroundColor Green
}

# Remove service
Write-Host "🗑️ Removing service..." -ForegroundColor Yellow
& sc.exe delete cloudflared | Out-Null
Start-Sleep -Seconds 2

# Verify removal
$serviceAfter = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue

if ($serviceAfter) {
    Write-Host "❌ Service removal failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Service removed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Config and credentials files were not deleted:" -ForegroundColor Gray
Write-Host "  - C:\Users\asifh\.cloudflared\config.yml" -ForegroundColor DarkGray
Write-Host "  - C:\Users\asifh\.cloudflared\93650d38-60af-4dc7-a5ec-f8347fc57514.json" -ForegroundColor DarkGray
Write-Host ""

exit 0
