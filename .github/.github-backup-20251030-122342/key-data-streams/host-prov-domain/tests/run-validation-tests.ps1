# Run All Validation Tests
# Part of host-provisioner-domain-fix test suite

$ErrorActionPreference = "Stop"

Write-Host "🧪 Running Host Provisioner Validation Test Suite..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Validate Production URLs
Write-Host "Test 1: Production URL Validation" -ForegroundColor Yellow
& "$PSScriptRoot\Validate-Production-URLs.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Test suite failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
exit 0
