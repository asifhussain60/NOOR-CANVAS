
param([ValidateSet('dev','qa','prod')][string]$Env='dev')
$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot\.."
# Load env
$setEnv = Join-Path $root "ops\tasks\set-env.ps1"
if (Test-Path $setEnv) { & $setEnv -Env $Env }

Write-Host "Launching Noor Canvas via nc.ps1 (env=$Env)"

# DEBUG LOG: Implementation of nc.ps1 launcher
Write-Host "[DEBUG-WORKITEM:hub:continue] Implementing nc.ps1 application launcher ;CLEANUP_OK"

# Navigate to SPA directory and start application
$spaPath = Join-Path $root "..\..\SPA\NoorCanvas"
if (-not (Test-Path $spaPath)) {
    throw "SPA directory not found at: $spaPath"
}

Write-Host "[DEBUG-WORKITEM:hub:continue] Starting application from: $spaPath ;CLEANUP_OK"
Set-Location $spaPath
dotnet run
