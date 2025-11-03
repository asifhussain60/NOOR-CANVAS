<#!
.SYNOPSIS
  Run KDS docs maintenance: trilogy sync + redundant files cleanup (delete by default).

.PARAMETER TrilogyPath
  Path to a trilogy folder (default: latest under KDS/docs/Trilogy).

.PARAMETER Archive
  Apply cleanup (delete). If omitted, runs DryRun only.

.PARAMETER Quiet
  Suppress non-error output.

.EXAMPLE
  pwsh -File KDS/scripts/run-maintenance.ps1

.EXAMPLE
  pwsh -File KDS/scripts/run-maintenance.ps1 -Archive
#>
[CmdletBinding()]
param(
  [string]$TrilogyPath,
  [switch]$Archive,
  [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RecentTrilogyFolder {
  $root = Join-Path $PSScriptRoot '..' | Resolve-Path
  $triRoot = Join-Path $root 'docs/Trilogy'
  $dirs = Get-ChildItem -LiteralPath $triRoot -Directory | Sort-Object Name -Descending
  return ($dirs | Select-Object -First 1).FullName
}

if (-not $TrilogyPath -or -not (Test-Path -LiteralPath $TrilogyPath)) {
  $TrilogyPath = Get-RecentTrilogyFolder
}

# 1) Sync Trilogy (validate + write manifest)
$sync = Join-Path $PSScriptRoot 'sync-trilogy.ps1'
& pwsh -NoProfile -ExecutionPolicy Bypass -File $sync -Path $TrilogyPath -WriteManifest

# 2) Cleanup (dry-run or archive)
$clean = Join-Path $PSScriptRoot 'clean-redundant-files.ps1'
if ($Archive) {
  # Delete instead of archive to comply with Rule #3 (Delete Over Archive)
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $clean -Root (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'KDS') -Delete
} else {
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $clean -Root (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'KDS') -DryRun
}
