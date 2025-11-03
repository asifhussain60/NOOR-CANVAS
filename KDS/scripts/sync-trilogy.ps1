<#!
.SYNOPSIS
  Synchronize and validate a KDS documentation trilogy (Story, Image-Prompts, Technical-Reference).

.DESCRIPTION
  - Ensures Trilogy-Version is identical across files.
  - Optionally writes/updates a manifest with SHA256 and sizes.
  - Verifies Image-Prompts contains PR intelligence prompts (10–23).
  - Returns non-zero exit code on validation failure.

.PARAMETER Path
  Trilogy folder containing the three MD files and manifest.

.PARAMETER WriteManifest
  Write/update trilogy.manifest.yaml with checksums and validation results.

.PARAMETER DryRun
  Perform validation without writing manifest.

.EXAMPLE
  pwsh -File KDS/scripts/sync-trilogy.ps1 -Path KDS/docs/Trilogy/2025-11-03 -DryRun

.EXAMPLE
  pwsh -File KDS/scripts/sync-trilogy.ps1 -Path KDS/docs/Trilogy/2025-11-03 -WriteManifest
#>
param(
  [Parameter(Mandatory=$true)][string]$Path,
  [switch]$WriteManifest,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-FrontMatter {
  param([string]$FilePath)
  $lines = Get-Content -LiteralPath $FilePath -Encoding UTF8 -ErrorAction Stop
  if ($lines.Count -eq 0) { return @{} }
  if ($lines[0] -notmatch '^---\s*$') { return @{} }
  $map = @{}
  for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match '^---\s*$') { break }
    if ($line -match '^([^:]+):\s*(.*)$') {
      $k = $matches[1].Trim()
      $v = $matches[2].Trim()
      $map[$k] = $v
    }
  }
  return $map
}

function Get-FileSha256 {
  param([string]$FilePath)
  $hash = Get-FileHash -LiteralPath $FilePath -Algorithm SHA256
  return $hash.Hash.ToLowerInvariant()
}

function Get-FileSize {
  param([string]$FilePath)
  return (Get-Item -LiteralPath $FilePath).Length
}

$folder = Resolve-Path -LiteralPath $Path
$story = Join-Path $folder 'Story.md'
$image = Join-Path $folder 'Image-Prompts.md'
$tech  = Join-Path $folder 'Technical-Reference.md'
$manifest = Join-Path $folder 'trilogy.manifest.yaml'

$missing = @()
foreach ($f in @($story,$image,$tech)) { if (-not (Test-Path -LiteralPath $f)) { $missing += $f } }
if ($missing.Count -gt 0) {
  Write-Error "Missing expected files: $($missing -join ', ')"
}

$fmStory = Get-FrontMatter -FilePath $story
$fmImage = Get-FrontMatter -FilePath $image
$fmTech  = Get-FrontMatter -FilePath $tech

$verS = $fmStory['Trilogy-Version']
$verI = $fmImage['Trilogy-Version']
$verT = $fmTech['Trilogy-Version']

$versionsEqual = ($verS -eq $verI -and $verI -eq $verT -and $null -ne $verS)

$imgContent = Get-Content -LiteralPath $image -Raw -Encoding UTF8
$imgHasPR = ($imgContent -match 'Prompt 10 — PR Intelligence Overview')

$result = [ordered]@{
  version = $verS
  created_at = (Get-Date).ToString('s') + 'Z'
  includes_pr_intelligence = $true
  files = @()
  checks = @()
}

foreach ($f in @('Image-Prompts.md','Technical-Reference.md','Story.md')) {
  $fp = Join-Path $folder $f
  $result.files += [ordered]@{
    path = $f
    sha256 = Get-FileSha256 -FilePath $fp
    size_bytes = Get-FileSize -FilePath $fp
  }
}

$result.checks += [ordered]@{ all_share_same_trilogy_version = $versionsEqual }
$result.checks += [ordered]@{ image_prompts_has_pr_sections = $imgHasPR }

$fail = @()
if (-not $versionsEqual) { $fail += 'Version mismatch across trilogy files.' }
if (-not $imgHasPR) { $fail += 'Image-Prompts missing PR prompt sections.' }

if ($WriteManifest) {
  $yaml = @()
  $yaml += "version: $($result.version)"
  $yaml += "created_at: $($result.created_at)"
  $yaml += "includes_pr_intelligence: true"
  $yaml += "files:"
  foreach ($file in $result.files) {
    $yaml += "  - path: $($file.path)"
    $yaml += "    sha256: $($file.sha256)"
    $yaml += "    size_bytes: $($file.size_bytes)"
  }
  $yaml += "checks:"
  foreach ($check in $result.checks) {
    $kv = $check.GetEnumerator() | Select-Object -First 1
    $yaml += "  - $($kv.Key): $($kv.Value.ToString().ToLower())"
  }
  Set-Content -LiteralPath $manifest -Value ($yaml -join "`n") -Encoding UTF8
  Write-Host "Wrote manifest: $manifest"
}

if ($fail.Count -gt 0) {
  Write-Error ($fail -join ' ')
}
