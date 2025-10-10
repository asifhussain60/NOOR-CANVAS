
param([ValidateSet('dev','qa','prod')][string]$Env='dev')
$root = Resolve-Path "$PSScriptRoot\..\.."
$envFile = Join-Path $root "config\environments\$Env\.env.$Env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^\s*$') { return }
    $name, $value = $_.Split('=',2)
    [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), "Process")
  }
} else {
  Write-Warning "No .env file found at $envFile"
}
Write-Host "APP_URL=$env:APP_URL"
Write-Host "API_URL=$env:API_URL"
Write-Host "DB_SERVER=$env:DB_SERVER DB_NAME=$env:DB_NAME"
Write-Host "KSESSIONS_DB_SERVER=$env:KSESSIONS_DB_SERVER KSESSIONS_DB_NAME=$env:KSESSIONS_DB_NAME"
