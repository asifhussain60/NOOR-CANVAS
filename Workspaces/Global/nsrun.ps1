# DEPRECATED: nsrun command has been removed
# Use 'nc' command instead

Write-Host "⚠️  DEPRECATED: nsrun command has been removed" -ForegroundColor Yellow
Write-Host "🔄 Use 'nc' command instead:" -ForegroundColor Cyan
Write-Host "   nc           # Start NOOR Canvas"
Write-Host "   nc -Test     # Start with Testing Suite"  
Write-Host "   nc -Help     # Show all options"
Write-Host ""

# Redirect to nc command
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ncPath = Join-Path $scriptDir "nc.ps1"

if (Test-Path $ncPath) {
    Write-Host "🔄 Redirecting to nc command..." -ForegroundColor Gray
    & $ncPath @args
} else {
    Write-Error "❌ nc.ps1 not found. Please use the nc command directly."
}
