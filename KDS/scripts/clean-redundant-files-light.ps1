<#!
.SYNOPSIS
  Fast pre-commit scan for redundant/stale artifacts in staged KDS files.

.DESCRIPTION
  Runs ONLY against staged files for the current commit. Designed to be quick
  and fail-fast in a pre-commit hook. Checks for:
    - Forbidden archive/deprecated patterns (Rule #3)
    - Temp file patterns (*.tmp, *.bak, *.old, *~, .DS_Store)
    - Version suffix anti-patterns (*_v1, *_v2)
    - Empty files (0 bytes)

  Exits with non-zero code if any violation is found. Prints a concise report
  with suggested fixes. No filesystem mutations are performed.

.NOTES
  Local-first, zero external dependencies. Uses git to read staged file list.
  Scope intentionally limited for speed.

.EXAMPLE
  pwsh -NoProfile -ExecutionPolicy Bypass -File KDS/scripts/clean-redundant-files-light.ps1
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Header {
  param([string]$Text)
  Write-Host "[$Text]" -ForegroundColor Cyan
}

function Get-RepoRoot {
  $p = & git rev-parse --show-toplevel 2>$null
  if (-not $p) { throw "Not a git repository (cannot determine root)." }
  return [IO.Path]::GetFullPath($p)
}

function Get-StagedFiles {
  $list = & git diff --cached --name-only
  return @($list | Where-Object { $_ -and ($_ -like 'KDS/*' -or $_ -like 'KDS\\*') })
}

function Test-MatchAny {
  param(
    [string]$Value,
    [string[]]$Globs
  )
  foreach ($g in $Globs) {
    if ($Value -like $g) { return $true }
  }
  return $false
}

$repoRoot = Get-RepoRoot
$staged = Get-StagedFiles

if (-not $staged -or $staged.Count -eq 0) {
  # Nothing under KDS staged; nothing to validate here.
  exit 0
}

$forbiddenDirGlobs = @(
  'KDS/archive/*',
  'KDS/deprecated/*'
)

$forbiddenFileGlobs = @(
  '*.old', '*.backup',
  '*_v1', '*_v2', '*_v3'
)

$tempFileGlobs = @(
  '*.tmp', '*.temp', '*~', '.DS_Store'
)

$violations = New-Object System.Collections.Generic.List[object]

foreach ($rel in $staged) {
  $path = Join-Path $repoRoot $rel
  # Directory pattern checks (by relative path text)
  if (Test-MatchAny -Value $rel -Globs $forbiddenDirGlobs) {
    $violations.Add([pscustomobject]@{
      type = 'forbidden_dir'; rule = 'Rule #3'; path = $rel; reason = 'Archive/Deprecated folder is forbidden'
    })
    continue
  }

  # File-level checks
  if (Test-MatchAny -Value $rel -Globs $forbiddenFileGlobs) {
    $violations.Add([pscustomobject]@{
      type = 'forbidden_file_pattern'; rule = 'Rule #3'; path = $rel; reason = 'Forbidden suffix (old/backup/versioned)'
    })
  }

  if (Test-MatchAny -Value $rel -Globs $tempFileGlobs) {
    $violations.Add([pscustomobject]@{
      type = 'temp_file'; rule = 'Rule #3'; path = $rel; reason = 'Temporary file pattern'
    })
  }

  if (Test-Path -LiteralPath $path) {
    $item = Get-Item -LiteralPath $path -ErrorAction SilentlyContinue
    if ($item -and -not $item.PSIsContainer) {
      if ($item.Length -eq 0) {
        $violations.Add([pscustomobject]@{
          type = 'empty_file'; rule = 'Rule #19 thresholds'; path = $rel; reason = 'Empty file (0 bytes)'
        })
      }
    }
  }
}

if ($violations.Count -eq 0) {
  Write-Header 'KDS Light Checks'
  Write-Host '✅ Passed (no redundant artifacts detected in staged KDS files)'
  exit 0
}

Write-Header 'KDS Light Checks'
Write-Host "❌ Violations detected: $($violations.Count)" -ForegroundColor Red
foreach ($v in $violations) {
  Write-Host (" - [{0}] {1} :: {2}" -f $v.rule, $v.type, $v.path) -ForegroundColor Yellow
  if ($v.type -eq 'forbidden_dir') { Write-Host '   Fix: Remove or move contents; delete folder. Rule #3 forbids archive/deprecated.' }
  elseif ($v.type -eq 'forbidden_file_pattern') { Write-Host '   Fix: Remove the file; trust git history instead of suffixes.' }
  elseif ($v.type -eq 'temp_file') { Write-Host '   Fix: Delete temp files before committing.' }
  elseif ($v.type -eq 'empty_file') { Write-Host '   Fix: Add content or delete the empty file.' }
}

exit 1
