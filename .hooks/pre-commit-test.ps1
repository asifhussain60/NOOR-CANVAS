#!/usr/bin/env pwsh
# ====================================================================
# NOOR Canvas Pre-Commit Test Hook
# Runs tests only if code has changed since last successful test run
# ====================================================================

param(
    [switch]$Force,           # Force test run regardless of cache
    [switch]$Verbose,         # Verbose output
    [switch]$SkipBuild       # Skip build step (tests only)
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Paths
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$TestProject = "$WorkspaceRoot\Tests\NoorCanvas.Core.Tests"
$MainProject = "$WorkspaceRoot\SPA\NoorCanvas"
$CacheDir = "$WorkspaceRoot\.test-cache"
$LastTestHash = "$CacheDir\last-test-hash.txt"
$LastTestResult = "$CacheDir\last-test-result.txt"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "═" * 80 -ForegroundColor $Cyan
    Write-Host " $Title" -ForegroundColor $Cyan
    Write-Host "═" * 80 -ForegroundColor $Cyan
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "▶ $Title" -ForegroundColor $Yellow
}

function Get-CodeHash {
    # Calculate hash of all source files to detect changes
    $sourceFiles = @(
        Get-ChildItem "$MainProject\*.cs" -Recurse -File
        Get-ChildItem "$MainProject\*.cshtml" -Recurse -File
        Get-ChildItem "$MainProject\*.razor" -Recurse -File
        Get-ChildItem "$TestProject\*.cs" -Recurse -File
    ) | Where-Object { $_.FullName -notmatch "\\(bin|obj)\\" }
    
    $hashBuilder = [System.Text.StringBuilder]::new()
    foreach ($file in ($sourceFiles | Sort-Object FullName)) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($content))
            $hashString = [System.BitConverter]::ToString($hash).Replace("-", "")
            [void]$hashBuilder.AppendLine("$($file.FullName):$hashString")
        }
    }
    
    $combinedHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($hashBuilder.ToString()))
    return [System.BitConverter]::ToString($combinedHash).Replace("-", "")
}

function Test-CacheValid {
    if (-not (Test-Path $LastTestHash) -or -not (Test-Path $LastTestResult)) {
        return $false
    }
    
    $lastHash = Get-Content $LastTestHash -Raw -ErrorAction SilentlyContinue
    $currentHash = Get-CodeHash
    
    if ($lastHash.Trim() -eq $currentHash.Trim()) {
        $lastResult = Get-Content $LastTestResult -Raw -ErrorAction SilentlyContinue
        if ($lastResult.Trim() -eq "PASS") {
            return $true
        }
    }
    
    return $false
}

function Update-Cache {
    param([string]$Result)
    
    if (-not (Test-Path $CacheDir)) {
        New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null
    }
    
    $currentHash = Get-CodeHash
    Set-Content -Path $LastTestHash -Value $currentHash -NoNewline
    Set-Content -Path $LastTestResult -Value $Result -NoNewline
}

# Main execution
Write-Header "NOOR Canvas Pre-Commit Test Runner"

try {
    # Check if tests are needed
    if (-not $Force -and (Test-CacheValid)) {
        Write-Host "✅ No code changes detected since last successful test run" -ForegroundColor $Green
        Write-Host "   Use -Force to run tests anyway" -ForegroundColor $Yellow
        exit 0
    }
    
    Write-Section "Code changes detected - running tests"
    
    # Ensure we're in the correct directory
    Set-Location $WorkspaceRoot
    
    # Build the application first (unless skipped)
    if (-not $SkipBuild) {
        Write-Section "Building application"
        Set-Location $MainProject
        
        Write-Host "Restoring packages..." -ForegroundColor $Yellow
        $restoreResult = & dotnet restore --verbosity quiet 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Package restore failed:" -ForegroundColor $Red
            Write-Host $restoreResult -ForegroundColor $Red
            Update-Cache "FAIL"
            exit 1
        }
        
        Write-Host "Building project..." -ForegroundColor $Yellow
        $buildResult = & dotnet build --no-restore --configuration Release --verbosity quiet 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed:" -ForegroundColor $Red
            Write-Host $buildResult -ForegroundColor $Red
            Update-Cache "FAIL"
            exit 1
        }
        
        Write-Host "✅ Build successful" -ForegroundColor $Green
    }
    
    # Run tests
    Write-Section "Running test suite"
    Set-Location $TestProject
    
    $testArgs = @(
        "test"
        "--configuration", "Release"
        "--logger", "console;verbosity=normal"
        "--logger", "trx;LogFileName=PreCommitTestResults.trx"
    )
    
    if (-not $SkipBuild) {
        $testArgs += "--no-build"
    }
    
    if ($Verbose) {
        $testArgs += "--verbosity", "detailed"
    }
    
    Write-Host "Executing tests..." -ForegroundColor $Yellow
    $testResult = & dotnet @testArgs 2>&1
    $testExitCode = $LASTEXITCODE
    
    # Display results
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ All tests passed successfully!" -ForegroundColor $Green
        Write-Host $testResult -ForegroundColor $Green
        Update-Cache "PASS"
        
        Write-Section "Pre-commit validation complete"
        Write-Host "✅ Code is ready for commit" -ForegroundColor $Green
    } else {
        Write-Host "❌ Test failures detected:" -ForegroundColor $Red
        Write-Host $testResult -ForegroundColor $Red
        Update-Cache "FAIL"
        
        Write-Host ""
        Write-Host "❌ Cannot commit code with failing tests" -ForegroundColor $Red
        Write-Host "   Fix test failures before committing" -ForegroundColor $Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Pre-commit test runner failed: $($_.Exception.Message)" -ForegroundColor $Red
    Update-Cache "FAIL"
    exit 1
} finally {
    Set-Location $WorkspaceRoot
}
