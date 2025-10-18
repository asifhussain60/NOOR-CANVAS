<#
.SYNOPSIS
    Run transcript canvas Percy visual regression tests using the new testing framework.

.DESCRIPTION
    Runs visual regression tests for TranscriptCanvas component with Percy integration.

.PARAMETER Headed
    Run tests in headed mode (visible browser).

.PARAMETER SkipBuild
    Skip building the application.

.PARAMETER KeepAppRunning
    Keep application running after tests.

.EXAMPLE
    .\run-transcript-canvas-percy-tests-v2.ps1 -Headed
#>

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning
)

$testFile = "Tests/UI/transcript-canvas-visual.spec.ts"
$testRunnerPath = Join-Path $PSScriptRoot "Test-Framework\Invoke-PlaywrightTest.ps1"

$params = @{
    TestFile = $testFile
    Percy = $true
    Headed = $Headed
    SkipBuild = $SkipBuild
    KeepAppRunning = $KeepAppRunning
}

& $testRunnerPath @params
exit $LASTEXITCODE
