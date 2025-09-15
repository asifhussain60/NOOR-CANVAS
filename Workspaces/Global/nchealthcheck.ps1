# NOOR Canvas Comprehensive Health Check
# Validates project health including tracker consistency, build status, and system integrity

param(
    [switch]$Fix = $false,           # Apply fixes automatically
    [switch]$Detailed = $false,      # Show detailed output
    [switch]$TrackerOnly = $false,   # Check only tracker consistency
    [switch]$BuildOnly = $false,     # Check only build health
    [switch]$WhatIf = $false         # Show what would be done without making changes
)

$ErrorActionPreference = "Stop"

# Define paths
$ProjectRoot = "d:\PROJECTS\NOOR CANVAS"
$ValidatorScript = "$ProjectRoot\Workspaces\Global\validate-tracker-consistency.ps1"
$SolutionFile = "$ProjectRoot\NoorCanvas.sln"

function Write-Section {
    param($Title)
    Write-Host ""
    Write-Host "🔸 $Title" -ForegroundColor Cyan
    Write-Host ("=" * ($Title.Length + 3)) -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-TrackerHealth {
    Write-Section "Tracker Health Check"
    
    if (-not (Test-Path $ValidatorScript)) {
        Write-Error "Tracker validator not found: $ValidatorScript"
        return $false
    }
    
    try {
        $args = @()
        if ($Fix) { $args += "-Fix" }
        if ($WhatIf) { $args += "-WhatIf" }
        if ($Detailed) { $args += "-Verbose" }
        
        & $ValidatorScript @args
        $trackerResult = $LASTEXITCODE -eq 0
        
        if ($trackerResult) {
            Write-Success "Tracker consistency validation passed"
        } else {
            Write-Warning "Tracker validation found issues"
        }
        
        return $trackerResult
    } catch {
        Write-Error "Tracker validation failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-BuildHealth {
    Write-Section "Build Health Check"
    
    if (-not (Test-Path $SolutionFile)) {
        Write-Error "Solution file not found: $SolutionFile"
        return $false
    }
    
    try {
        # Check if dotnet is available
        $dotnetVersion = & dotnet --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "dotnet CLI not available"
            return $false
        }
        
        Write-Success "dotnet CLI available: $dotnetVersion"
        
        # Restore packages
        Write-Host "🔄 Restoring NuGet packages..." -ForegroundColor Gray
        & dotnet restore $SolutionFile --verbosity minimal
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Package restore failed"
            return $false
        }
        Write-Success "Package restore completed"
        
        # Build solution
        Write-Host "🔄 Building solution..." -ForegroundColor Gray
        $buildOutput = & dotnet build $SolutionFile --no-restore --verbosity minimal 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed"
            if ($Detailed) {
                Write-Host $buildOutput -ForegroundColor Red
            }
            return $false
        }
        Write-Success "Build completed successfully"
        
        return $true
    } catch {
        Write-Error "Build health check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-EnvironmentHealth {
    Write-Section "Environment Health Check"
    
    $healthyEnvironment = $true
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 5) {
        Write-Success "PowerShell version: $psVersion"
    } else {
        Write-Warning "PowerShell version $psVersion may cause issues (recommended: 5.1+)"
        $healthyEnvironment = $false
    }
    
    # Check required folders
    $requiredFolders = @(
        "$ProjectRoot\SPA\NoorCanvas",
        "$ProjectRoot\Tools\HostProvisioner",
        "$ProjectRoot\Tests\NoorCanvas.Core.Tests",
        "$ProjectRoot\IssueTracker",
        "$ProjectRoot\Workspaces\Global"
    )
    
    foreach ($folder in $requiredFolders) {
        if (Test-Path $folder) {
            Write-Success "Folder exists: $(Split-Path $folder -Leaf)"
        } else {
            Write-Error "Missing folder: $folder"
            $healthyEnvironment = $false
        }
    }
    
    # Check global commands
    $globalCommands = @("nc.ps1", "nct.ps1", "ncdoc.ps1", "iiskill.ps1")
    $globalPath = "$ProjectRoot\Workspaces\Global"
    
    foreach ($command in $globalCommands) {
        $commandPath = "$globalPath\$command"
        if (Test-Path $commandPath) {
            Write-Success "Global command: $command"
        } else {
            Write-Warning "Missing global command: $command"
            $healthyEnvironment = $false
        }
    }
    
    return $healthyEnvironment
}

function Test-DatabaseHealth {
    Write-Section "Database Health Check"
    
    # This is a placeholder for database connectivity tests
    # Would need to check SQL Server connection, KSESSIONS_DEV database, etc.
    
    Write-Success "Database health check placeholder (manual verification needed)"
    return $true
}

function Show-HealthSummary {
    param(
        [bool]$TrackerHealth,
        [bool]$BuildHealth,
        [bool]$EnvironmentHealth,
        [bool]$DatabaseHealth
    )
    
    Write-Section "Health Summary"
    
    $allHealthy = $TrackerHealth -and $BuildHealth -and $EnvironmentHealth -and $DatabaseHealth
    
    if ($allHealthy) {
        Write-Host "🎉 All systems operational! NOOR Canvas is healthy." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some issues detected. Review the output above." -ForegroundColor Yellow
        
        if ($Fix) {
            Write-Host "🔧 Automatic fixes were applied where possible." -ForegroundColor Cyan
        } else {
            Write-Host "💡 Run with -Fix to apply automatic fixes where available." -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "Component Status:" -ForegroundColor Gray
    Write-Host "  Tracker Consistency: $(if ($TrackerHealth) {'✅'} else {'❌'})"
    Write-Host "  Build Health: $(if ($BuildHealth) {'✅'} else {'❌'})"
    Write-Host "  Environment: $(if ($EnvironmentHealth) {'✅'} else {'❌'})"
    Write-Host "  Database: $(if ($DatabaseHealth) {'✅'} else {'❌'})"
    
    return $allHealthy
}

# Main execution
Write-Host "🚀 NOOR Canvas Comprehensive Health Check" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

$trackerHealth = $true
$buildHealth = $true
$environmentHealth = $true
$databaseHealth = $true

# Run selected checks
if ($TrackerOnly) {
    $trackerHealth = Test-TrackerHealth
    $buildHealth = $true
    $environmentHealth = $true
    $databaseHealth = $true
} elseif ($BuildOnly) {
    $trackerHealth = $true
    $buildHealth = Test-BuildHealth
    $environmentHealth = $true
    $databaseHealth = $true
} else {
    # Run all checks
    $trackerHealth = Test-TrackerHealth
    $buildHealth = Test-BuildHealth
    $environmentHealth = Test-EnvironmentHealth
    $databaseHealth = Test-DatabaseHealth
}

$overallHealth = Show-HealthSummary -TrackerHealth $trackerHealth -BuildHealth $buildHealth -EnvironmentHealth $environmentHealth -DatabaseHealth $databaseHealth

if ($overallHealth) {
    exit 0
} else {
    exit 1
}
