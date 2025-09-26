
param([ValidateSet('dev','qa','prod')][string]$Env='dev')
$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot\.."
# Load env
$setEnv = Join-Path $root "ops\tasks\set-env.ps1"
if (Test-Path $setEnv) { & $setEnv -Env $Env }

Write-Host "Launching Noor Canvas via nc.ps1 (env=$Env)"
# Insert your actual build+run here, e.g. dotnet build + run IISExpress/your host
# This script is the only sanctioned launcher for Copilot.
