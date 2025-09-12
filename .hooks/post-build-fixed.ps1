#!/usr/bin/env pwsh
# ====================================================================
# NOOR Canvas Build Hook with Automatic Test Execution
# Runs after every successful build
# ====================================================================

param(
    [string]$Configuration = "Debug",
    [switch]$SkipTests,
    [switch]$Verbose
)

# Script configuration
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Paths
$WorkspaceRoot = "D:\PROJECTS\NOOR CANVAS"
$TestProject = "$WorkspaceRoot\Tests\NoorCanvas.Core.Tests"
$MainProject = "$WorkspaceRoot\SPA\NoorCanvas"
$BuildCacheDir = "$WorkspaceRoot\.build-cache"
$LastBuildHash = "$BuildCacheDir\last-build-hash.txt"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "▶ $Title" -ForegroundColor $Yellow
}

function Get-BuildHash {
    # Calculate hash of build output to detect if build actually changed
    $buildFiles = @()
    
    $binPath = "$MainProject\bin\$Configuration"
    
    if (Test-Path $binPath) {
        $buildFiles += Get-ChildItem "$binPath\*.dll" -Recurse -File -ErrorAction SilentlyContinue
        $buildFiles += Get-ChildItem "$binPath\*.exe" -Recurse -File -ErrorAction SilentlyContinue
    }
    
    if ($buildFiles.Count -eq 0) {
        return $null
    }
    
    $hashBuilder = [System.Text.StringBuilder]::new()
    foreach ($file in ($buildFiles | Sort-Object FullName)) {
        $hash = Get-FileHash $file.FullName -Algorithm SHA256 -ErrorAction SilentlyContinue
        if ($hash) {
            [void]$hashBuilder.AppendLine("$($file.FullName):$($hash.Hash)")
        }
    }
    
    if ($hashBuilder.Length -eq 0) {
        return $null
    }
    
    $combinedHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($hashBuilder.ToString()))
    return [System.BitConverter]::ToString($combinedHash).Replace("-", "")
}

function Test-BuildChanged {
    if (-not (Test-Path $LastBuildHash)) {
        return $true
    }
    
    $lastHash = Get-Content $LastBuildHash -Raw -ErrorAction SilentlyContinue
    $currentHash = Get-BuildHash
    
    if (-not $currentHash) {
        return $true  # No build artifacts found, assume changed
    }
    
    return $lastHash.Trim() -ne $currentHash.Trim()
}

function Update-BuildCache {
    if (-not (Test-Path $BuildCacheDir)) {
        New-Item -ItemType Directory -Path $BuildCacheDir -Force | Out-Null
    }
    
    $currentHash = Get-BuildHash
    if ($currentHash) {
        Set-Content -Path $LastBuildHash -Value $currentHash -NoNewline
    }
}

# Main execution
Write-Section "NOOR Canvas Post-Build Hook"

try {
    # Skip tests if explicitly requested
    if ($SkipTests) {
        Write-Host "⏭️ Tests skipped (SkipTests flag set)" -ForegroundColor $Yellow
        exit 0
    }
    
    # Check if build actually changed
    if (-not (Test-BuildChanged)) {
        Write-Host "⏭️ Build output unchanged - skipping tests" -ForegroundColor $Yellow
        exit 0
    }
    
    Write-Host "🔨 Build output changed - running tests automatically" -ForegroundColor $Cyan
    
    # Ensure we're in the test project directory
    Set-Location $TestProject
    
    # Run tests
    Write-Section "Running automated test suite"
    
    $testArgs = @(
        "test"
        "--configuration", $Configuration
        "--logger", "console;verbosity=minimal"
        "--nologo"
    )
    
    if ($Verbose) {
        $testArgs += "--verbosity", "normal"
    }
    
    Write-Host "Executing tests for $Configuration build..." -ForegroundColor $Yellow
    $testResult = & dotnet @testArgs 2>&1
    $testExitCode = $LASTEXITCODE
    
    # Display results
    Write-Host ""
    if ($testExitCode -eq 0) {
        Write-Host "✅ All automated tests passed!" -ForegroundColor $Green
        if ($Verbose) {
            Write-Host $testResult -ForegroundColor $Green
        }
        Update-BuildCache
    } else {
        Write-Host "⚠️ Some tests failed in automated run:" -ForegroundColor $Red
        Write-Host $testResult -ForegroundColor $Red
        Write-Host ""
        Write-Host "ℹ️ Build succeeded but tests failed - check test output above" -ForegroundColor $Yellow
        # Don't update cache if tests failed
    }
    
} catch {
    Write-Host "⚠️ Post-build test runner failed: $($_.Exception.Message)" -ForegroundColor $Red
    # Don't fail the build because of test runner issues
} finally {
    Set-Location $WorkspaceRoot
}

# Always exit 0 - don't fail the build because of test issues
exit 0
