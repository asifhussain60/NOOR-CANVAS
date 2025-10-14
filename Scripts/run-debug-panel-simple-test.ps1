# Run Debug Panel Simple Visibility Test
# 
# Purpose: Quick verification that debug panel shows when environment is correctly set
# 
# Prerequisites:
# - App MUST be running manually with: $env:ASPNETCORE_ENVIRONMENT = 'Development'; dotnet run
# - Run from SPA/NoorCanvas directory
# 
# Usage:
#   .\Scripts\run-debug-panel-simple-test.ps1
# 
# Created: 2025-10-14 22:50
# Key: debug-panel

param()

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Debug Panel Simple Visibility Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Step 1: Verify app is running
Write-Host "🔍 Verifying app is running at https://localhost:9091..." -ForegroundColor Yellow

# PowerShell 5.1 compatible SSL certificate bypass
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

try {
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ App is running (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ App is NOT running" -ForegroundColor Red
    Write-Host "`nPlease start the app with:" -ForegroundColor Yellow
    Write-Host "  cd SPA\NoorCanvas" -ForegroundColor Cyan
    Write-Host "  `$env:ASPNETCORE_ENVIRONMENT = 'Development'" -ForegroundColor Cyan
    Write-Host "  dotnet run`n" -ForegroundColor Cyan
    exit 1
}

# Step 2: Run Playwright test
Write-Host "`n🧪 Running Playwright test (HEADED mode)..." -ForegroundColor Yellow

Set-Location "D:\PROJECTS\NOOR CANVAS\Tests\UI"

npx playwright test debug-panel-simple-visibility.spec.ts --headed --reporter=list

$testExitCode = $LASTEXITCODE

# Step 3: Display results
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "✅✅✅ TEST PASSED - Debug Panel Is Visible!" -ForegroundColor Green
    Write-Host "`nScreenshots saved:" -ForegroundColor Cyan
    Write-Host "  - Workspaces/TEMP/debug-panel-simple-test-collapsed.png" -ForegroundColor Gray
    Write-Host "  - Workspaces/TEMP/debug-panel-simple-test-expanded.png" -ForegroundColor Gray
} else {
    Write-Host "❌ TEST FAILED" -ForegroundColor Red
    Write-Host "`nCheck test output above for details" -ForegroundColor Yellow
}

Write-Host "`n═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

exit $testExitCode
