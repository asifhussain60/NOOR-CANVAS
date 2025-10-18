#requires -Version 5.1
<#!
.SYNOPSIS
  Audits .github prompt and instruction files for cohesion, drift risks, and guardrail compliance.

.DESCRIPTION
  Scans:
    - .github/prompts/*.md (excludes shared/)
    - .github/prompts/shared/*.md (existence check)
    - .github/instructions/*.md
    - .github/instructions/Links/*.MD

  Validates per-prompt:
    - YAML frontmatter presence and basic fields (mode, purpose, inputs, outputs)
    - mode: agent (if present) and Role section
    - Presence/coverage of key parameter (frontmatter inputs includes 'key' OR body mentions 'key')
    - References to critical links files exist
    - Mentions SelfAwareness guardrails where required

  Outputs:
    - Markdown report: .github/reports/prompt-cohesion-audit-<timestamp>.md
    - JSON index:      .github/reports/prompt-index.json

.PARAMETER OutDir
  Output directory for reports. Default: .github/reports

.PARAMETER FailOnError
  If set, exits with code 1 when critical issues are found.

.EXAMPLE
  pwsh -File .github/scripts/run-prompt-cohesion-audit.ps1

.EXAMPLE
  pwsh -File .github/scripts/run-prompt-cohesion-audit.ps1 -OutDir ".github/reports" -FailOnError
#>
param(
  [string]$OutDir = ".github/reports",
  [switch]$FailOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-ReportBuilder {
  $obj = [pscustomobject]@{
    Lines = New-Object System.Collections.Generic.List[string]
  }
  $null = $obj | Add-Member -MemberType ScriptMethod -Name Add -Value {
    param([string]$line)
    $this.Lines.Add($line) | Out-Null
  }
  $null = $obj | Add-Member -MemberType ScriptMethod -Name Text -Value {
    $this.Lines -join "`n"
  }
  return $obj
}

function Get-FrontMatter {
  param([string]$Content)
  $lines = $Content -split "`n"
  $start = -1; $end = -1
  for ($i = 0; $i -lt [Math]::Min($lines.Length, 60); $i++) {
    if ($lines[$i].Trim() -eq '---') { $start = $i; break }
  }
  if ($start -lt 0) { return $null }
  for ($j = $start + 1; $j -lt $lines.Length; $j++) {
    if ($lines[$j].Trim() -eq '---') { $end = $j; break }
  }
  if ($end -lt 0) { return $null }
  $blockLines = $lines[($start + 1)..($end - 1)]
  $dict = @{}
  foreach ($line in $blockLines) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*$') { continue }
    $parts = $line -split ":", 2
    if ($parts.Length -eq 2) {
      $k = ($parts[0]).Trim()
      $v = ($parts[1]).Trim()
      $dict[$k] = $v
    }
  }
  $block = ($blockLines -join "`n")
  return [pscustomobject]@{ Raw=$block; Map=$dict }
}

function Get-InputsFromFrontMatter {
  param([hashtable]$Map)
  if (-not $Map.ContainsKey('inputs')) { return @() }
  return @($Map['inputs'] -split ',\s*' | Where-Object { $_ -ne '' })
}

function Test-HasRoleSection {
  param([string]$Content)
  return [regex]::IsMatch($Content, '(?m)^##\s+Role\b')
}

function Test-MentionsSelfAwareness {
  param([string]$Content)
  return $Content -match 'SelfAwareness\.instructions\.md'
}

function Get-ReferencedLinksFiles {
  param([string]$Content)
  $pattern = '(AnalyzerConfig\.MD|API-Contract-Validation\.md|Architecture\.md|FunctionalityRegistry\.md|HtmlServiceResponsibilities\.md|InfrastructureQuickRef\.md|PlaywrightConfig\.MD|PlaywrightQuickRef\.md|PlaywrightTestPaths\.MD|SystemIndex\.md|ValidationFramework\.md)'
  [regex]::Matches($Content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase) | ForEach-Object { $_.Value } | Select-Object -Unique
}

function Test-KeyCoverage {
  param([string[]]$Inputs, [string]$Content)
  if ($Inputs -contains 'key') { return $true }
  if ($Content -match '(?im)^###\s*key\b' -or $Content -match '\bkey data stream\b') { return $true }
  return $false
}

# Prepare environment
$root = (Resolve-Path .).Path
$promptsDir = Join-Path $root ".github/prompts"
$sharedDir  = Join-Path $promptsDir "shared"
$instrDir   = Join-Path $root ".github/instructions"
$linksDir   = Join-Path $instrDir "Links"

$null = New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$promptFiles = Get-ChildItem -Path $promptsDir -Filter '*.prompt.md' -File | Where-Object { $_.DirectoryName -ne $sharedDir -and $_.Name -notlike '*.backup.*' }
$sharedFiles = @()
if (Test-Path $sharedDir) { $sharedFiles = Get-ChildItem -Path $sharedDir -Filter '*.md' -File -ErrorAction SilentlyContinue }

$linksFiles  = @()
if (Test-Path $linksDir) {
  $linksFiles += Get-ChildItem -Path $linksDir -Filter '*.md' -File -ErrorAction SilentlyContinue
  $linksFiles += Get-ChildItem -Path $linksDir -Filter '*.MD' -File -ErrorAction SilentlyContinue
}

$linksIndex = @{}
foreach ($lf in $linksFiles) { $linksIndex[$lf.Name.ToLowerInvariant()] = $true }

$rb = New-ReportBuilder
$issues = New-Object System.Collections.Generic.List[object]
$index  = New-Object System.Collections.Generic.List[object]

$rb.Add("# Prompt Cohesion Audit Report")
$rb.Add("")
$rb.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')")
$rb.Add("Repository Root: $root")
$rb.Add("")

$criticalCount = 0
$warnCount = 0

function Get-RelativePath {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )
  try {
    $baseUri = New-Object System.Uri((Join-Path $BasePath '.'))
    $targetUri = New-Object System.Uri($TargetPath)
    $rel = $baseUri.MakeRelativeUri($targetUri).ToString()
    if ($rel -match '^[a-zA-Z]:') { return $TargetPath }
    return ($rel -replace '/', '\\')
  } catch {
    return $TargetPath
  }
}

foreach ($pf in $promptFiles) {
  $content = Get-Content -Raw -Path $pf.FullName
  $fm = Get-FrontMatter -Content $content
  $fmMap = if ($fm) { $fm.Map } else { @{} }
  $inputs = @()
  if ($fm) { $inputs = Get-InputsFromFrontMatter -Map $fmMap }

  $fileIssues = @()
  $isCritical = $false

  if (-not $fm) {
    $fileIssues += "CRITICAL: Missing YAML frontmatter (--- ... ---)"
    $isCritical = $true
  }
  else {
    if (-not $fmMap.ContainsKey('mode')) { $fileIssues += "CRITICAL: Frontmatter missing 'mode'"; $isCritical = $true }
    else {
      $modeVal2 = $fmMap['mode']
      if ($modeVal2 -ne 'agent') { $fileIssues += ("WARN: mode is '" + $modeVal2 + "', expected 'agent' for agents") }
    }

    if (-not $fmMap.ContainsKey('purpose')) { $fileIssues += "WARN: Frontmatter missing 'purpose'" }
    if (-not $fmMap.ContainsKey('inputs')) { $fileIssues += "WARN: Frontmatter missing 'inputs'" }
    if (-not $fmMap.ContainsKey('outputs')) { $fileIssues += "WARN: Frontmatter missing 'outputs'" }
  }

  if (-not (Test-HasRoleSection -Content $content)) { $fileIssues += "WARN: Missing '## Role' section" }

  $hasKey = Test-KeyCoverage -Inputs $inputs -Content $content
  if (-not $hasKey) { $fileIssues += "WARN: No explicit 'key' parameter found in inputs or body (consider adding for key data stream continuity)" }

  $mentionsSA = Test-MentionsSelfAwareness -Content $content
  if (-not $mentionsSA) { $fileIssues += "INFO: Does not mention SelfAwareness guardrails (optional but recommended)" }

  $refs = Get-ReferencedLinksFiles -Content $content
  foreach ($r in $refs) {
    $name = $r
    $key = $name.ToLowerInvariant()
    if (-not $linksIndex.ContainsKey($key)) {
      $fileIssues += "WARN: References '$name' but file not found in .github/instructions/Links/"
    }
  }

  $modeForIndex = if ($fmMap.ContainsKey('mode')) { $fmMap['mode'] } else { '' }
  $purposeForIndex = if ($fmMap.ContainsKey('purpose')) { $fmMap['purpose'] } else { '' }
  $index.Add([pscustomobject]@{
    file = (Get-RelativePath -BasePath $root -TargetPath $pf.FullName)
    mode = $modeForIndex
    purpose = $purposeForIndex
    inputs = $inputs -join ', '
    outputs = if ($fmMap.ContainsKey('outputs')) { $fmMap['outputs'] } else { '' }
    hasRole = Test-HasRoleSection -Content $content
    hasKeyParam = $hasKey
    references = ($refs -join ', ')
  }) | Out-Null

  $rb.Add("## " + (Get-RelativePath -BasePath $root -TargetPath $pf.FullName))
  if ($fm) {
    $modeVal = if ($fmMap.ContainsKey('mode')) { $fmMap['mode'] } else { '' }
    $outputsVal = if ($fmMap.ContainsKey('outputs')) { $fmMap['outputs'] } else { '' }
    $rb.Add("- mode: " + $modeVal)
    $rb.Add("- inputs: " + ($inputs -join ', '))
    $rb.Add("- outputs: " + $outputsVal)
  } else {
    $rb.Add("- mode: (missing frontmatter)")
  }
  if ($fileIssues.Count -eq 0) {
    $rb.Add("- Status: PASS")
  } else {
    $rb.Add("- Issues:")
    foreach ($i in $fileIssues) { $rb.Add("  - $i") }
  }
  $rb.Add("")

  foreach ($i in $fileIssues) {
    $severity = if ($i -like 'CRITICAL*') { 'critical' } elseif ($i -like 'WARN*') { 'warn' } else { 'info' }
    $issues.Add([pscustomobject]@{ file=$pf.FullName; issue=$i; severity=$severity }) | Out-Null
    if ($severity -eq 'critical') { $criticalCount++ }
    elseif ($severity -eq 'warn') { $warnCount++ }
  }
}

# Shared files presence summary
$rb.Add("---")
$rb.Add("## Shared and Links Files Summary")
$rb.Add("- Shared files found: " + ($sharedFiles.Count))
$rb.Add("- Links files found:  " + ($linksFiles.Count))
$rb.Add("")

# Global recommendations (static + data-driven)
$rb.Add("---")
$rb.Add("## Recommendations")
$rb.Add("- Standardize frontmatter: require mode, purpose, inputs (include 'key'), outputs, lastUpdated")
$rb.Add("- Ensure every agent that writes to key data stream documents 'key' parameter in inputs or parameters section")
$rb.Add("- Reference SelfAwareness.instructions.md in all agent prompts to reinforce guardrails")
$rb.Add("- Avoid duplicating global rules across prompts; centralize in .github/prompts/shared and link")
$rb.Add("- Keep README_AI.md synchronized: verify each prompt is listed with purpose and invocation examples")
$rb.Add("- Add version tags to prompts and record changes in Enhancements_v1_to_v7.md")
$rb.Add("")

$rb.Add("---")
$rb.Add("## Summary")
$rb.Add("- Files scanned: " + $promptFiles.Count)
$rb.Add("- Critical issues: $criticalCount")
$rb.Add("- Warnings: $warnCount")
$rb.Add("- Infos: " + ($issues | Where-Object severity -eq 'info' | Measure-Object | Select-Object -ExpandProperty Count))
$rb.Add("")

# Write outputs
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $OutDir "prompt-cohesion-audit-$timestamp.md"
$indexPath  = Join-Path $OutDir "prompt-index.json"

$rb.Text() | Out-File -FilePath $reportPath -Encoding UTF8
$index | ConvertTo-Json -Depth 5 | Out-File -FilePath $indexPath -Encoding UTF8

Write-Host "[OK] Audit complete: $reportPath" -ForegroundColor Green
Write-Host "[OK] Index written: $indexPath" -ForegroundColor Green

if ($FailOnError -and $criticalCount -gt 0) {
  Write-Host "[FAIL] Critical issues found: $criticalCount" -ForegroundColor Red
  exit 1
}

exit 0
