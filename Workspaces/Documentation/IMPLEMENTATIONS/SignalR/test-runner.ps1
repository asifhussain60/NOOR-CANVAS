# SignalR Working Implementation Test Runner
Write-Host "NOOR Canvas SignalR Working Implementation Test" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Test environment
Write-Host "Test Environment:" -ForegroundColor Yellow
Write-Host "  Session ID: 218" -ForegroundColor White
Write-Host "  Host Token: LY7PQX4C" -ForegroundColor White  
Write-Host "  User Token: E9LCN7YQ" -ForegroundColor White
Write-Host "  Database: KSESSIONS_DEV" -ForegroundColor White

# Check if application is running
Write-Host "Checking if NoorCanvas application is running..." -ForegroundColor Yellow
$dotnetProcess = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue

if (-not $dotnetProcess) {
    Write-Host "ERROR: No dotnet processes found!" -ForegroundColor Red
    Write-Host "Please start the application first:" -ForegroundColor Red
    Write-Host "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'" -ForegroundColor Gray
    Write-Host "dotnet run" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "SUCCESS: Dotnet application is running" -ForegroundColor Green
}

# Check connectivity
Write-Host "Testing application connectivity..." -ForegroundColor Yellow
try {
    # Skip certificate check for localhost
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
    
    $response = Invoke-WebRequest -Uri "https://localhost:9091" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "SUCCESS: Application is responding" -ForegroundColor Green
} catch {
    Write-Host "WARNING: HTTPS connection failed, trying basic connectivity..." -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    # Continue with tests anyway as the application might be running
}

# Run Playwright tests
Write-Host "Running Playwright tests..." -ForegroundColor Yellow
Set-Location "D:\PROJECTS\NOOR CANVAS"

$testFile = "Workspaces/Documentation/IMPLEMENTATIONS/SignalR/signalr-working-test.spec.ts"
Write-Host "Test file: $testFile" -ForegroundColor Cyan

try {
    npx playwright test $testFile --headed --timeout=60000 --reporter=line
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "SUCCESS: All SignalR tests passed!" -ForegroundColor Green
        Write-Host "Screenshots saved to Documentation/IMPLEMENTATIONS/SignalR/" -ForegroundColor Cyan
    } else {
        Write-Host "ERROR: Some tests failed (Exit code: $exitCode)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

exit $exitCode