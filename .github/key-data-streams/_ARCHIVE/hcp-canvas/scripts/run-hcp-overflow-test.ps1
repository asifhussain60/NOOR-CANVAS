# Run Host Control Panel Overflow Visual Test
param(
    [switch]$KeepAppRunning = $false
)

$ErrorActionPreference = "Stop"

$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$AppProjectPath = "$WorkspaceRoot\SPA\NoorCanvas"
$KeyTestPath = "$WorkspaceRoot\.github\prompts.keys\hcp-canvas\tests\hcp-overflow-visual.spec.ts"
$PlaywrightDir = "$WorkspaceRoot\PlayWright"
$TestsDir = "$PlaywrightDir\tests"
$TempName = "hcp-overflow-visual.temp.spec.ts"
$TempPath = Join-Path $TestsDir $TempName
$AppUrl = "https://localhost:9091"

function Write-Step($m){ Write-Host "`n[STEP] $m" -ForegroundColor Cyan }
function Write-Success($m){ Write-Host "[SUCCESS] $m" -ForegroundColor Green }
function Write-Failure($m){ Write-Host "[FAILURE] $m" -ForegroundColor Red }
function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Gray }

Write-Step "Verify test file exists"
if (-not (Test-Path $KeyTestPath)) { Write-Failure "Missing: $KeyTestPath"; exit 1 }

Write-Step "Start app"
$job = Start-Job -ScriptBlock { param($p) Set-Location $p; dotnet run } -ArgumentList $AppProjectPath
Write-Info "Job: $($job.Id)"

Write-Step "Wait for app"
$Resolved = $null
for($i=0;$i -lt 30;$i++){
  try{ $r=Invoke-WebRequest -Uri $AppUrl -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue; if($r){ $Resolved=$AppUrl; break } }catch{}
  if(-not $Resolved){ try{ $h=($AppUrl -replace 'https://','http://') -replace ':9091',':9090'; $r2=Invoke-WebRequest -Uri $h -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue; if($r2){ $Resolved=$h; break } }catch{} }
  Start-Sleep 2; Write-Host "." -NoNewline
}
if(-not $Resolved){ Write-Failure "App not ready"; Stop-Job $job; Remove-Job $job; exit 1 }
Write-Success "App ready at $Resolved"

Write-Step "Prepare test"
if(Test-Path $TempPath){ Remove-Item $TempPath -Force }
Copy-Item $KeyTestPath $TempPath -Force
Set-Location $PlaywrightDir
$env:CANVAS_BASE_URL = $Resolved
$env:CANVAS_HOST_TOKEN = 'PQ9N5YWW'
if(-not $env:PERCY_TOKEN){ $env:PERCY='false' }

Write-Step "Run Playwright"
$cmd = if($env:PERCY_TOKEN){ "npx percy exec -- npx playwright test `"tests/$TempName`" --headed" } else { "npx playwright test `"tests/$TempName`" --headed" }
Write-Info "Command: $cmd"
Invoke-Expression $cmd
$code = $LASTEXITCODE

Write-Step "Cleanup"
if(Test-Path $TempPath){ Remove-Item $TempPath -Force }
if(-not $KeepAppRunning){ Stop-Job $job; Remove-Job $job; Write-Info "App stopped" } else { Write-Info "App left running (Job $($job.Id))" }

if($code -ne 0){ Write-Failure "Test failed (exit $code)"; exit $code }
Write-Success "Test passed"