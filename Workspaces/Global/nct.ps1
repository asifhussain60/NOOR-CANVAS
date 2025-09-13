param(
    [switch]$Help
)

Clear-Host

if ($Help) {
    Write-Host "NOOR Canvas Token (nct) - Interactive Host Provisioner" -ForegroundColor Cyan
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "DESCRIPTION:"
    Write-Host "  Interactive tool to generate Host GUIDs for NOOR Canvas sessions"
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nct                    # Launch interactive Host Provisioner"
    Write-Host "  nct -Help              # Show this help"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  Interactive session ID input"
    Write-Host "  Automatic GUID generation with HMAC-SHA256 hashing"
    Write-Host "  Complete hash token display"
    Write-Host "  Ready-to-use Host GUIDs for authentication"
    Write-Host ""
    Write-Host "EXAMPLE OUTPUT:"
    Write-Host "  Session ID: 123"
    Write-Host "  Host GUID: 12345678-1234-1234-1234-123456789abc"
    Write-Host "  Complete Hash: YJVp4W4h6jfmoZnUvr0kbdtmPVW4LFcGWChKJIDlkxY="
    return
}

Write-Host "NOOR Canvas Token (nct) - Host GUID Generator" -ForegroundColor Green
Write-Host "============================================="
Write-Host ""
Write-Host "Launching Interactive Host Provisioner..." -ForegroundColor Yellow
Write-Host ""

$originalLocation = Get-Location
try {
    Set-Location "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
    & dotnet run
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Host Provisioner failed to start" -ForegroundColor Red
        Write-Host "Try building the project first"
    }
}
finally {
    Set-Location $originalLocation
}

Write-Host ""
Write-Host "Tip: Use 'nct -Help' to see all available options" -ForegroundColor Cyan
