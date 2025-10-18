<#
.SYNOPSIS
    Run debug panel Percy visual regression tests using the new testing framework.

.DESCRIPTION
    This script uses the centralized Test-Framework to run debug panel visual tests.
    
    Migrated from legacy orchestration pattern to unified framework:
    - ✅ Robust app lifecycle management
    - ✅ Proper error handling
    - ✅ Clean PowerShell syntax
    - ✅ Automatic cleanup

.PARAMETER Headed
    Run tests in headed mode (visible browser).

.PARAMETER SkipBuild
    Skip building the application.

.PARAMETER KeepAppRunning
    Keep application running after tests.

.EXAMPLE
    .\run-debug-panel-percy-tests.ps1

.EXAMPLE
    .\run-debug-panel-percy-tests.ps1 -Headed -KeepAppRunning
#>

[CmdletBinding()]
param(
    [switch]$Headed,
    [switch]$SkipBuild,
    [switch]$KeepAppRunning
)

$testFile = "Tests/UI/debug-panel-user-landing-visual.spec.ts"
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
