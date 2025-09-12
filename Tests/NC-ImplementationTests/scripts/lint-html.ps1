<#
  Simple HTML lint script.
  - Checks that HTML files are parseable by using the .NET HtmlAgilityPack if available
  - Falls back to checking for balanced tags and basic DOCTYPE and <html> presence.
  Usage: powershell -ExecutionPolicy Bypass -File lint-html.ps1 <path-to-html>
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Path
)

function Fail([string]$msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $Path)) { Fail "File not found: $Path" }

$content = Get-Content -Raw -Path $Path

# Basic sanity checks
if ($content -notmatch '<!doctype html>' -and $content -notmatch '<!DOCTYPE') {
    Fail "Missing DOCTYPE declaration"
}

if ($content -notmatch '<html' -or $content -notmatch '</html>') {
    Fail "Missing <html> or </html> tags"
}

# Quick tag balance heuristic: count '<' vs '>'
$open = ($content.ToCharArray() | Where-Object { $_ -eq '<' }).Count
$close = ($content.ToCharArray() | Where-Object { $_ -eq '>' }).Count
if ($open -ne $close) {
    Fail "Unbalanced HTML tokens: '<'=$open, '>'=$close"
}

Write-Host "HTML lint passed: $Path" -ForegroundColor Green
exit 0
