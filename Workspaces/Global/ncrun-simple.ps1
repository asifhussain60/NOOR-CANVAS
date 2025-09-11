param([switch]$Help)

if ($Help) {
    Write-Host "NOOR Canvas Run Command" -ForegroundColor Cyan
    return
}

Write-Host "Starting NOOR Canvas..." -ForegroundColor Green
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
$targetDir = Join-Path $rootDir "SPA\NoorCanvas"

if (Test-Path $targetDir) {
    Set-Location $targetDir
    Write-Host "Changed to: $targetDir" -ForegroundColor Green
    dotnet run --urls "http://localhost:9090"
} else {
    Write-Error "Target not found: $targetDir"
}
