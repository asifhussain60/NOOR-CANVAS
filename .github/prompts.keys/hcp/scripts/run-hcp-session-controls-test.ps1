#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Orchestration script for HCP Session Controls visual regression test
.DESCRIPTION
    Runs Playwright Percy test against running NoorCanvas instance
.NOTES
    Prerequisites: NoorCanvas app must be running on http://localhost:5000
    Start app with: cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"; dotnet run
#>

param()

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

try {
    Write-Status "Starting HCP Session Controls Visual Test" "Info"
    
    # Step 1: Verify app is running
    Write-Status "Checking if NoorCanvas app is running..." "Info"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 5 -UseBasicParsing
        Write-Status "App is running (Status: $($response.StatusCode))" "Success"
    }
    catch {
        Write-Status "App is not running on port 9090!" "Error"
        Write-Status "Please start the app first:" "Warning"
        Write-Status '  cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"' "Warning"
        Write-Status "  dotnet run" "Warning"
        exit 1
    }
    
    # Step 2: Run Playwright test with Percy
    Write-Status "Running Playwright test with Percy snapshots..." "Info"
    Set-Location "D:\PROJECTS\NOOR CANVAS"
    
    if (-not $env:PERCY_TOKEN) {
        Write-Status "Percy token not set - running without Percy snapshots" "Warning"
    }
    
    npx playwright test .github/prompts.keys/hcp/tests/hcp-session-controls-visual.spec.ts --headed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Test completed successfully!" "Success"
    }
    else {
        Write-Status "Test failed with exit code $LASTEXITCODE" "Error"
        exit 1
    }
}
catch {
    Write-Status "Error: $_" "Error"
    exit 1
}
