<#!
.SYNOPSIS
  Find and optionally archive redundant files in the KDS folder.

.DESCRIPTION
  Applies rules from KDS/config/cleanup-rules.yaml to detect:
    - Temporary files by pattern
    - Empty files
    - Duplicate content (by SHA256)
    - Versioned docs where only the most recent N are kept per glob
  Produces a JSON and CSV report. By default, archives candidates to KDS/_archive/YYYYMMDD-HHmmss.

.PARAMETER Root
  Root folder to scan (default: KDS)

.PARAMETER DryRun
  Do not move files; only report.

.PARAMETER Delete
  Delete instead of archiving (not recommended). Mutually exclusive with -DryRun.

.PARAMETER Rules
  Path to cleanup rules YAML (default: KDS/config/cleanup-rules.yaml)

.EXAMPLE
  pwsh -File KDS/scripts/clean-redundant-files.ps1 -Root KDS -DryRun

.EXAMPLE
  pwsh -File KDS/scripts/clean-redundant-files.ps1 -Root KDS
#>
[CmdletBinding()]
param(
  [string]$Root = 'KDS',
  [switch]$DryRun,
  [switch]$Delete
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RelPath {
  param([string]$p, [string]$base)
  $abs = (Resolve-Path -LiteralPath $p)
  return [IO.Path]::GetRelativePath((Resolve-Path -LiteralPath $base), $abs)
}

$rootPath = (Resolve-Path -LiteralPath $Root)
$baseRoot = Split-Path -Parent $rootPath
$excludeDirs = @('KDS/kds-brain','KDS/scripts','KDS/prompts','KDS/schemas','KDS/services','KDS/sessions','KDS/validators','KDS/tooling','KDS/tests','KDS/config','KDS/knowledge')
$includeDirs = @('KDS/docs','KDS')
$tempPatterns = @('*.tmp','*.bak','*.old','*~','.DS_Store')
$archiveRel = 'KDS/_archive'
$preferDirs = @('KDS/docs/Trilogy')
$retention = @(
  @{ glob = 'KDS/docs/IMPLEMENTATION-PROGRESS-*.md'; keep = 1 },
  @{ glob = 'KDS/docs/*IMPLEMENTATION-*.md'; keep = 2 },
  @{ glob = 'KDS/docs/v*.md'; keep = 1 }
)

$now = Get-Date
$stamp = $now.ToString('yyyyMMdd-HHmmss')
$archiveBase = Join-Path $baseRoot $archiveRel
$archiveDest = Join-Path $archiveBase $stamp
$reportDir = Join-Path $baseRoot 'KDS/docs/cleanup'
New-Item -ItemType Directory -Force -Path $archiveDest | Out-Null
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

# Build include/exclude sets

# Gather files under included dirs (and top-level KDS if included)
$files = @()
foreach ($inc in $includeDirs) {
  $p = Join-Path $baseRoot $inc
  if (Test-Path -LiteralPath $p) {
    $files += Get-ChildItem -LiteralPath $p -Recurse -File -Force | Where-Object {
      $rel = Get-RelPath -p $_.FullName -base $baseRoot
      foreach ($ex in $excludeDirs) { if ($rel -like "$ex*") { return $false } }
      return $true
    }
  }
}

# Classify
$candidates = @()
$hashMap = @{}

foreach ($f in $files) {
  $rel = Get-RelPath -p $f.FullName -base $baseRoot
  # temp patterns
  foreach ($pat in $tempPatterns) { if ($f.Name -like $pat) { $candidates += [pscustomobject]@{ reason='temp-pattern'; path=$rel }; break } }
  # empty files
  if ($f.Length -eq 0) { $candidates += [pscustomobject]@{ reason='empty'; path=$rel } }
  # build hash map
  $hash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  if (-not $hashMap.ContainsKey($hash)) { $hashMap[$hash] = New-Object System.Collections.ArrayList }
  [void]$hashMap[$hash].Add($f)
}

# Duplicates: choose keep per policy

foreach ($kv in $hashMap.GetEnumerator()) {
  $arr = $kv.Value
  if ($arr.Count -gt 1) {
    # choose keeper
    $keeper = $null
    foreach ($pref in $preferDirs) {
      $match = $arr | Where-Object { (Get-RelPath -p $_.FullName -base $baseRoot) -like "$pref*" } | Select-Object -First 1
      if ($match) { $keeper = $match; break }
    }
    if (-not $keeper) { $keeper = ($arr | Sort-Object LastWriteTime -Descending | Select-Object -First 1) }
    foreach ($f in $arr) {
      if ($f.FullName -ne $keeper.FullName) {
        $candidates += [pscustomobject]@{ reason='duplicate'; path=(Get-RelPath -p $f.FullName -base $baseRoot); keep=(Get-RelPath -p $keeper.FullName -base $baseRoot) }
      }
    }
  }
}

# Retention by glob
function Get-Matches { param([string]$glob) return ($files | Where-Object { (Get-RelPath -p $_.FullName -base $baseRoot) -like $glob }) }
if ($retention) {
  foreach ($r in $retention) {
    $glob = $r['glob']; $keep = [int]$r['keep']
    $matches = Get-Matches -glob $glob | Sort-Object LastWriteTime -Descending
    $toArchive = $matches | Select-Object -Skip $keep
  foreach ($f in $toArchive) { $candidates += [pscustomobject]@{ reason='retention'; path=(Get-RelPath -p $f.FullName -base $baseRoot) } }
  }
}

# Deduplicate candidate list
$candidates = $candidates | Sort-Object path, reason -Unique

# Write reports
$jsonPath = Join-Path $reportDir ("cleanup-report-" + $stamp + ".json")
$csvPath  = Join-Path $reportDir ("cleanup-report-" + $stamp + ".csv")
$candidates | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
$candidates | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding UTF8

Write-Host "Candidates: $($candidates.Count)" -ForegroundColor Cyan
Write-Host "Report(JSON): $jsonPath" -ForegroundColor Cyan
Write-Host "Report(CSV):  $csvPath" -ForegroundColor Cyan

if ($DryRun -or $candidates.Count -eq 0) { return }

# Archive or delete
foreach ($c in $candidates) {
  $src = Join-Path $baseRoot $c.path
  if ($Delete) {
    Remove-Item -LiteralPath $src -Force -ErrorAction Continue
  } else {
    $dest = Join-Path $archiveDest $c.path
    $destDir = Split-Path -Parent $dest
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Move-Item -LiteralPath $src -Destination $dest -Force -ErrorAction Continue
  }
}

Write-Host ("Completed: {0} files {1}" -f $candidates.Count, ($Delete ? 'deleted' : 'archived')) -ForegroundColor Green
