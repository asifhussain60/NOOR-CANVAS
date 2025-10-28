Param(
  [string]$Token = "KJAHA99L",
  [switch]$Headed
)

# Orchestration script for Transcript Canvas modal submit console test
# ASCII ONLY. Launches app on https://localhost:9091, waits for readiness, runs Playwright test, then cleans up.

Write-Host "[INFO] Stopping any existing NoorCanvas processes..."
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

$startupScript = @"
cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'https://localhost:9091'
dotnet run
"@

$tempPath = Join-Path $env:TEMP "noorcanvas-startup.ps1"
$startupScript | Out-File $tempPath -Encoding ASCII

Write-Host "[INFO] Launching NoorCanvas in a separate window..."
Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","$tempPath" -Verb RunAs

# Health check loop
$healthCheckRetries = 10
for ($i = 1; $i -le $healthCheckRetries; $i++) {
  try {
    Invoke-WebRequest -Uri "https://localhost:9091" -Method HEAD -SkipCertificateCheck -TimeoutSec 5 | Out-Null
    Write-Host "[OK] App Ready"
    break
  } catch {
    Write-Host "[INFO] Waiting for app ($i/$healthCheckRetries)..."
    Start-Sleep -Seconds 3
  }
  if ($i -eq $healthCheckRetries) {
    Write-Host "[ERROR] App failed to start on https://localhost:9091"
    exit 1
  }
}

$env:PW_SESSION_TOKEN = $Token
$headedFlag = $false
if ($Headed) { $headedFlag = $true }

Write-Host "[INFO] Running Playwright test..."
$testPath = ".github/prompts.keys/transcript-canvas/tests/transcript-modal-submit-console.spec.ts"
$pwArgs = @("playwright","test",$testPath,"--reporter=list")
if ($headedFlag) { $pwArgs += "--headed" }

try {
  npx @pwArgs
  $exitCode = $LASTEXITCODE
} catch {
  $exitCode = 1
}

Write-Host "[INFO] Cleaning up NoorCanvas process..."
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

if ($exitCode -ne 0) {
  Write-Host "[ERROR] Playwright test failed with exit code $exitCode"
  exit $exitCode
}

Write-Host "[PASS] Playwright test completed successfully"
exit 0
