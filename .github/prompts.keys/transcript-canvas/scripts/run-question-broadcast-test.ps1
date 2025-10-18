# run-question-broadcast-test.ps1
# Orchestration script for question submission and SignalR broadcast E2E test
# Tests fix for "Session not found or inactive" error with Created status sessions

[CmdletBinding()]
param(
    [switch]$Headed = $false,
    [switch]$SkipBuild = $false,
    [switch]$KeepAppRunning = $false
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Item $scriptDir).Parent.Parent.Parent.Parent.FullName
$testFile = Join-Path $projectRoot ".github\prompts.keys\transcript-canvas\tests\question-submission-broadcast.spec.ts"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Question Submission Broadcast E2E Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Use centralized test framework
$frameworkScript = Join-Path $projectRoot "Scripts\Test-Framework\Invoke-PlaywrightTest.ps1"

if (-not (Test-Path $frameworkScript)) {
    Write-Host "❌ Test framework not found: $frameworkScript" -ForegroundColor Red
    Write-Host "Please ensure Scripts/Test-Framework/Invoke-PlaywrightTest.ps1 exists" -ForegroundColor Yellow
    exit 1
}

# Build parameter array
$params = @{
    TestFile = $testFile
    Headed = $Headed
    SkipBuild = $SkipBuild
    KeepAppRunning = $KeepAppRunning
}

# Execute test via framework
Write-Host "Invoking test framework..." -ForegroundColor Cyan
& $frameworkScript @params

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Question broadcast test completed successfully" -ForegroundColor Green
} else {
    Write-Host "`n❌ Question broadcast test failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}
