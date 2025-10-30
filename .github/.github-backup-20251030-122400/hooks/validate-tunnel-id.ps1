# Workspace-level Cloudflare Tunnel ID Validation
# Can be run manually or in CI/CD pipelines

param(
    [string]$ConfigPath = "C:\Users\asifh\.cloudflared\config.yml",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Canonical tunnel ID (from DNS records - MUST NOT change)
$CANONICAL_ID = "93650d38-60af-4dc7-a5ec-f8347fc57514"

if ($Verbose) {
    Write-Host "🔍 Validating Cloudflare Tunnel ID..." -ForegroundColor Cyan
    Write-Host "   Config: $ConfigPath" -ForegroundColor Gray
    Write-Host "   Expected: $CANONICAL_ID" -ForegroundColor Gray
    Write-Host ""
}

if (-not (Test-Path $ConfigPath)) {
    if ($Verbose) {
        Write-Host "⚠️ Config file not found: $ConfigPath" -ForegroundColor Yellow
        Write-Host "   This is OK if cloudflared is not installed" -ForegroundColor Gray
    }
    exit 0  # Skip if config doesn't exist
}

$content = Get-Content $ConfigPath -Raw

if ($content -match "tunnel:\s*([a-f0-9\-]{36})") {
    $foundId = $matches[1]
    
    if ($foundId -ne $CANONICAL_ID) {
        Write-Host "" -ForegroundColor Red
        Write-Host "❌ Tunnel ID mismatch detected!" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "   Expected: $CANONICAL_ID" -ForegroundColor Yellow
        Write-Host "   Found:    $foundId" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "   DNS CNAME records point to $CANONICAL_ID" -ForegroundColor Yellow
        Write-Host "   Changing tunnel ID will break production URLs:" -ForegroundColor Red
        Write-Host "     - noorcanvas.kashkole.com" -ForegroundColor Red
        Write-Host "     - resources.kashkole.com" -ForegroundColor Red
        Write-Host "     - session.kashkole.com" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "   To fix: Revert $ConfigPath to use canonical tunnel ID" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor Red
        exit 1
    }
    
    if ($Verbose) {
        Write-Host "✅ Tunnel ID is correct: $CANONICAL_ID" -ForegroundColor Green
    }
    exit 0
} else {
    if ($Verbose) {
        Write-Host "⚠️ Could not extract tunnel ID from config" -ForegroundColor Yellow
        Write-Host "   Config file may be malformed" -ForegroundColor Gray
    }
    exit 1
}
