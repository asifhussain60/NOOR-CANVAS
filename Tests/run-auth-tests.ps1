#!/usr/bin/env pwsh
<#
.SYNOPSIS
    NOOR Canvas Authentication Flow Test Runner
    
.DESCRIPTION
    Runs comprehensive Playwright tests for host authentication and session management
    in the simplified 3-table architecture. Tests validate that the authentication
    service is no longer "unavailable" after fixing HostController dependencies.
    
.PARAMETER TestType
    Type of test to run: 'auth', 'session', 'all', or 'debug'
    
.PARAMETER Headed
    Run tests in headed mode (visible browser)
    
.PARAMETER Debug
    Run tests in debug mode with breakpoints
    
.EXAMPLE
    .\run-auth-tests.ps1 -TestType auth
    .\run-auth-tests.ps1 -TestType all -Headed
    .\run-auth-tests.ps1 -TestType debug -Debug
    
Created: September 20, 2025
Purpose: Validate simplified architecture authentication fixes
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('auth', 'session', 'all', 'debug')]
    [string]$TestType = 'all',
    
    [Parameter(Mandatory=$false)]
    [switch]$Headed,
    
    [Parameter(Mandatory=$false)] 
    [switch]$Debug,
    
    [Parameter(Mandatory=$false)]
    [switch]$StartApp
)

# Configuration
$WorkspaceRoot = "d:\PROJECTS\NOOR CANVAS"
$AppPath = "$WorkspaceRoot\SPA\NoorCanvas"
$TestHostToken = "VIS68UW4"
$AppUrl = "https://localhost:9091"
$AppUrlHttp = "http://localhost:9090"

Write-Host "🚀 NOOR Canvas Authentication Flow Test Runner" -ForegroundColor Cyan
Write-Host "Testing simplified 3-table architecture authentication..." -ForegroundColor Yellow

# Change to workspace directory
Set-Location $WorkspaceRoot

# Function to check if app is running
function Test-AppRunning {
    try {
        $response = Invoke-WebRequest -Uri "$AppUrlHttp/api/host/token/$TestHostToken/validate" -TimeoutSec 5 -UseBasicParsing
        return $true
    }
    catch {
        return $false
    }
}

# Function to start the application
function Start-NoorCanvasApp {
    Write-Host "🔧 Starting NOOR Canvas application..." -ForegroundColor Yellow
    
    # Kill any existing dotnet processes
    Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Start the application in background
    $job = Start-Job -ScriptBlock {
        param($AppPath)
        Set-Location $AppPath
        dotnet run
    } -ArgumentList $AppPath
    
    Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
    
    # Wait for app to start (max 60 seconds)
    $timeout = 60
    $elapsed = 0
    
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        
        if (Test-AppRunning) {
            Write-Host "✅ Application started successfully!" -ForegroundColor Green
            return $job
        }
        
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "❌ Application failed to start within $timeout seconds" -ForegroundColor Red
    return $null
}

# Check if application is running
$appRunning = Test-AppRunning
$appJob = $null

if (-not $appRunning -and $StartApp) {
    $appJob = Start-NoorCanvasApp
    $appRunning = Test-AppRunning
}

if (-not $appRunning) {
    Write-Host "⚠️ NOOR Canvas application is not running!" -ForegroundColor Yellow
    Write-Host "Please start the application manually or use -StartApp parameter" -ForegroundColor Yellow
    Write-Host "Expected URL: $AppUrl" -ForegroundColor Gray
    Write-Host ""
}

# Build test command based on parameters
$testCommand = "npm run"
$testArgs = @()

switch ($TestType) {
    'auth' {
        $testCommand += " test:auth-flow"
        Write-Host "🧪 Running Host Authentication Flow Tests" -ForegroundColor Green
    }
    'session' {
        $testCommand += " test:session-opener"  
        Write-Host "🧪 Running Session Opener & User Auth Tests" -ForegroundColor Green
    }
    'all' {
        $testCommand += " test:simplified-auth"
        Write-Host "🧪 Running Complete Authentication Test Suite" -ForegroundColor Green
    }
    'debug' {
        $testCommand += " test:auth-flow-debug"
        Write-Host "🐛 Running Authentication Tests in Debug Mode" -ForegroundColor Green
    }
}

if ($Headed -and $TestType -ne 'debug') {
    # Add headed flag if not already in debug mode
    $testCommand += " --headed"
}

if ($Debug -and $TestType -ne 'debug') {
    $testCommand += " --debug"
}

Write-Host "Command: $testCommand" -ForegroundColor Gray
Write-Host "Host Token: $TestHostToken" -ForegroundColor Gray
Write-Host "App URL: $AppUrl" -ForegroundColor Gray
Write-Host ""

# Pre-flight checks
Write-Host "🔍 Pre-flight Checks:" -ForegroundColor Cyan

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if playwright is installed
try {
    $playwrightVersion = npx playwright --version
    Write-Host "✅ Playwright version: $playwrightVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Playwright is not installed" -ForegroundColor Red
    Write-Host "Installing Playwright..." -ForegroundColor Yellow
    npm run test:install
}

# Check if test files exist
$authTestFile = "$WorkspaceRoot\Tests\UI\host-authentication-flow-e2e.spec.ts"
$sessionTestFile = "$WorkspaceRoot\Tests\UI\session-opener-user-auth-flow.spec.ts"

if (Test-Path $authTestFile) {
    Write-Host "✅ Authentication test file found" -ForegroundColor Green
} else {
    Write-Host "❌ Authentication test file not found: $authTestFile" -ForegroundColor Red
}

if (Test-Path $sessionTestFile) {
    Write-Host "✅ Session opener test file found" -ForegroundColor Green
} else {
    Write-Host "❌ Session opener test file not found: $sessionTestFile" -ForegroundColor Red
}

Write-Host ""

# Run the tests
Write-Host "🎯 Executing Tests..." -ForegroundColor Cyan
Write-Host "Expected Outcome: No 'Authentication service unavailable' errors" -ForegroundColor Yellow
Write-Host ""

try {
    # Execute the test command
    Invoke-Expression $testCommand
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ All tests passed successfully!" -ForegroundColor Green
        Write-Host "🎉 Authentication service is working with simplified architecture!" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Some tests failed (exit code: $exitCode)" -ForegroundColor Red
        Write-Host "Check the test output above for details" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error running tests: $($_.Exception.Message)" -ForegroundColor Red
}

# Show test report
Write-Host ""
Write-Host "📊 View detailed test report:" -ForegroundColor Cyan
Write-Host "npm run test:report" -ForegroundColor Gray

# Cleanup
if ($appJob) {
    Write-Host ""
    Write-Host "🛑 Stopping application..." -ForegroundColor Yellow
    Stop-Job $appJob -Force
    Remove-Job $appJob -Force
}

Write-Host ""
Write-Host "🏁 Test run completed!" -ForegroundColor Cyan