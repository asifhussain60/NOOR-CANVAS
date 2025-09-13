param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [int]$Port = 9093
)

if ($Help) {
    Write-Host "NOOR Canvas Documentation (ncdoc)" -ForegroundColor Green
    Write-Host "================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncdoc           # Open documentation in browser"
    Write-Host "  ncdoc -Build    # Rebuild documentation first"
    Write-Host "  ncdoc -NoBrowser # Don't open browser"
    Write-Host ""
    Write-Host "Documentation will be served on http://localhost:9093"
    return
}

$docUrl = "http://localhost:$Port"

if ($Build) {
    Write-Host "Building documentation..." -ForegroundColor Yellow
    $root = Split-Path $MyInvocation.MyCommand.Path -Parent | Split-Path -Parent | Split-Path -Parent
    Set-Location (Join-Path $root "DocFX")
    docfx build
}

Write-Host "?? NOOR Canvas Documentation" -ForegroundColor Cyan
Write-Host "Documentation URL: $docUrl" -ForegroundColor White

if (-not $NoBrowser) {
    Start-Process $docUrl
}
