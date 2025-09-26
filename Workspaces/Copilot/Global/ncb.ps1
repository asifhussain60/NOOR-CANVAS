
param([ValidateSet('dev','qa','prod')][string]$Env='dev')
$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot\.."
Write-Host "Clean + Build + Launch (env=$Env) via ncb.ps1"
# Example cleanup/build steps:
# dotnet clean
# dotnet build
# then delegate to nc.ps1
& (Join-Path $PSScriptRoot 'nc.ps1') -Env $Env
