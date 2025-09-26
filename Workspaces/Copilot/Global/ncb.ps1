
param([ValidateSet('dev','qa','prod')][string]$Env='dev')
$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot\.."
Write-Host "Clean + Build + Launch (env=$Env) via ncb.ps1"

# DEBUG LOG: Implementation of ncb.ps1 clean-build-launch  
Write-Host "[DEBUG-WORKITEM:hub:continue] Implementing ncb.ps1 clean-build-launch ;CLEANUP_OK"

# Navigate to SPA directory for clean and build
$spaPath = Join-Path (Join-Path (Join-Path $root "..") "SPA") "NoorCanvas"
if (-not (Test-Path $spaPath)) {
    throw "SPA directory not found at: $spaPath"
}

Write-Host "[DEBUG-WORKITEM:hub:continue] Cleaning and building application at: $spaPath ;CLEANUP_OK"
Set-Location $spaPath

# Clean and build
dotnet clean
dotnet build

# Delegate to nc.ps1 for launch
& (Join-Path $PSScriptRoot 'nc.ps1') -Env $Env
