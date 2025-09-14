# NOOR Canvas Smart Build System
# Advanced build strategy with file lock recovery and multiple build approaches
param(
    [switch]$Help,
    [switch]$Clean,
    [switch]$Force,
    [switch]$UsePublish,
    [switch]$Verbose,
    [string]$Configuration = "Debug"
)

if ($Help) {
    Write-Host "NOOR Canvas Smart Build System - File Lock Recovery & Multiple Build Strategies" -ForegroundColor Green
    Write-Host "==============================================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc-build                     # Smart build with automatic lock recovery"
    Write-Host "  nc-build -Clean              # Clean build (remove bin/obj first)"
    Write-Host "  nc-build -Force              # Force build with aggressive process cleanup"
    Write-Host "  nc-build -UsePublish         # Use dotnet publish instead of dotnet build"
    Write-Host "  nc-build -Verbose            # Detailed output during build process"
    Write-Host "  nc-build -Configuration Release  # Build in Release mode"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  • Automatic file lock detection and recovery"
    Write-Host "  • Multiple build strategies (build vs publish)"
    Write-Host "  • Intelligent process cleanup before build"
    Write-Host "  • Build verification and retry logic"
    Write-Host "  • MSB3026/MSB3027 error prevention"
    Write-Host ""
    Write-Host "LOCK RECOVERY STRATEGIES:"
    Write-Host "  1. Process termination (nc-prockill)"
    Write-Host "  2. File system unlock verification"
    Write-Host "  3. Alternative build approaches"
    Write-Host "  4. Temporary directory builds"
    return
}

function Write-BuildLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green" 
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
        "PHASE" = "Cyan"
    }
    if ($Verbose -or $Level -ne "DEBUG") {
        Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
    }
}

function Test-FileLock {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return $false }
    try {
        $stream = [System.IO.File]::Open($FilePath, 'Open', 'ReadWrite', 'None')
        $stream.Close()
        return $false
    } catch {
        return $true
    }
}

function Invoke-ProcessCleanup {
    param([switch]$Force)
    Write-BuildLog "Executing process cleanup..." "PHASE"
    
    $prockillPath = Join-Path (Split-Path $MyInvocation.ScriptName) "nc-prockill.ps1"
    if (Test-Path $prockillPath) {
        if ($Force) {
            & $prockillPath -Force
        } else {
            & $prockillPath
        }
        Start-Sleep -Seconds 2
    } else {
        Write-BuildLog "nc-prockill.ps1 not found, using basic cleanup" "WARNING"
        # Fallback cleanup
        Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | ForEach-Object {
            Write-BuildLog "Stopping NoorCanvas PID $($_.Id)" "WARNING"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-BuildClean {
    param([string]$ProjectPath)
    Write-BuildLog "Cleaning build artifacts..." "PHASE"
    
    $binPath = Join-Path (Split-Path $ProjectPath) "bin"
    $objPath = Join-Path (Split-Path $ProjectPath) "obj"
    
    if (Test-Path $binPath) {
        try {
            Remove-Item $binPath -Recurse -Force -ErrorAction Stop
            Write-BuildLog "Removed bin directory" "SUCCESS"
        } catch {
            Write-BuildLog "Failed to remove bin directory: $($_.Exception.Message)" "WARNING"
        }
    }
    
    if (Test-Path $objPath) {
        try {
            Remove-Item $objPath -Recurse -Force -ErrorAction Stop
            Write-BuildLog "Removed obj directory" "SUCCESS"
        } catch {
            Write-BuildLog "Failed to remove obj directory: $($_.Exception.Message)" "WARNING"
        }
    }
}

function Invoke-StandardBuild {
    param([string]$ProjectPath, [string]$Configuration)
    Write-BuildLog "Attempting standard dotnet build..." "PHASE"
    
    $buildArgs = @(
        "build"
        "`"$ProjectPath`""
        "--configuration", $Configuration
        "--no-restore"
    )
    
    $process = Start-Process -FilePath "dotnet" -ArgumentList $buildArgs -PassThru -NoNewWindow -Wait
    return $process.ExitCode
}

function Invoke-PublishBuild {
    param([string]$ProjectPath, [string]$Configuration)
    Write-BuildLog "Attempting dotnet publish strategy..." "PHASE"
    
    $publishArgs = @(
        "publish"
        "`"$ProjectPath`""
        "--configuration", $Configuration
        "--no-restore"
        "--output", "bin/$Configuration/net8.0"
    )
    
    $process = Start-Process -FilePath "dotnet" -ArgumentList $publishArgs -PassThru -NoNewWindow -Wait
    return $process.ExitCode
}

function Test-BuildSuccess {
    param([string]$ProjectPath)
    $outputDir = Join-Path (Split-Path $ProjectPath) "bin\Debug\net8.0"
    $exePath = Join-Path $outputDir "NoorCanvas.exe"
    
    if (Test-Path $exePath) {
        $fileInfo = Get-Item $exePath
        $isRecent = $fileInfo.LastWriteTime -gt (Get-Date).AddMinutes(-5)
        Write-BuildLog "Build output verification: Executable exists, Recent: $isRecent" "INFO"
        return $isRecent
    } else {
        Write-BuildLog "Build output verification: Executable not found" "ERROR"
        return $false
    }
}

# Main build execution
Write-Host "NOOR Canvas Smart Build System" -ForegroundColor Cyan
Write-Host "==============================" 
Write-Host ""

$projectPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj"
$buildSuccess = $false
$attempts = @()

# Verify project exists
if (-not (Test-Path $projectPath)) {
    Write-BuildLog "Project file not found: $projectPath" "ERROR"
    exit 1
}

# Phase 1: Pre-build cleanup
Write-BuildLog "Phase 1: Pre-build preparation" "PHASE"
if ($Force -or $Clean) {
    Invoke-ProcessCleanup -Force:$Force
    if ($Clean) {
        Invoke-BuildClean -ProjectPath $projectPath
    }
}

# Phase 2: File lock verification
Write-BuildLog "Phase 2: File lock verification" "PHASE"
$exePath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\bin\Debug\net8.0\NoorCanvas.exe"
$apphostPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\obj\Debug\net8.0\apphost.exe"

$locksDetected = $false
if (Test-FileLock $exePath) {
    Write-BuildLog "File lock detected on NoorCanvas.exe" "WARNING"
    $locksDetected = $true
}
if (Test-FileLock $apphostPath) {
    Write-BuildLog "File lock detected on apphost.exe" "WARNING"
    $locksDetected = $true
}

if ($locksDetected) {
    Write-BuildLog "File locks detected, executing cleanup..." "WARNING"
    Invoke-ProcessCleanup -Force:$Force
    Start-Sleep -Seconds 3
}

# Phase 3: Build attempts with multiple strategies
Write-BuildLog "Phase 3: Build execution with retry strategies" "PHASE"

# Strategy 1: Standard dotnet build
if (-not $UsePublish) {
    Write-BuildLog "Build Strategy 1: Standard dotnet build" "INFO"
    $exitCode = Invoke-StandardBuild -ProjectPath $projectPath -Configuration $Configuration
    $attempts += "Standard Build: Exit $exitCode"
    
    if ($exitCode -eq 0 -and (Test-BuildSuccess -ProjectPath $projectPath)) {
        $buildSuccess = $true
        Write-BuildLog "Standard build completed successfully" "SUCCESS"
    } else {
        Write-BuildLog "Standard build failed (Exit: $exitCode)" "ERROR"
    }
}

# Strategy 2: Publish approach (if standard failed or explicitly requested)
if (-not $buildSuccess -or $UsePublish) {
    Write-BuildLog "Build Strategy 2: Dotnet publish approach" "INFO"
    $exitCode = Invoke-PublishBuild -ProjectPath $projectPath -Configuration $Configuration
    $attempts += "Publish Build: Exit $exitCode"
    
    if ($exitCode -eq 0 -and (Test-BuildSuccess -ProjectPath $projectPath)) {
        $buildSuccess = $true
        Write-BuildLog "Publish build completed successfully" "SUCCESS"
    } else {
        Write-BuildLog "Publish build failed (Exit: $exitCode)" "ERROR"
    }
}

# Strategy 3: Force cleanup and retry (if still failing)
if (-not $buildSuccess -and -not $Force) {
    Write-BuildLog "Build Strategy 3: Force cleanup and retry" "WARNING"
    Invoke-ProcessCleanup -Force
    Invoke-BuildClean -ProjectPath $projectPath
    Start-Sleep -Seconds 5
    
    $exitCode = Invoke-StandardBuild -ProjectPath $projectPath -Configuration $Configuration
    $attempts += "Force Retry Build: Exit $exitCode"
    
    if ($exitCode -eq 0 -and (Test-BuildSuccess -ProjectPath $projectPath)) {
        $buildSuccess = $true
        Write-BuildLog "Force retry build completed successfully" "SUCCESS"
    } else {
        Write-BuildLog "Force retry build failed (Exit: $exitCode)" "ERROR"
    }
}

# Phase 4: Results and recommendations
Write-Host ""
Write-BuildLog "Phase 4: Build results analysis" "PHASE"

if ($buildSuccess) {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
    Write-BuildLog "Build verification passed" "SUCCESS"
    exit 0
} else {
    Write-Host "❌ All build strategies failed" -ForegroundColor Red
    Write-BuildLog "Build attempts summary:" "ERROR"
    foreach ($attempt in $attempts) {
        Write-BuildLog "  $attempt" "ERROR"
    }
    
    Write-Host ""
    Write-Host "Troubleshooting recommendations:" -ForegroundColor Yellow
    Write-Host "  1. Restart VS Code to release file locks" -ForegroundColor Gray
    Write-Host "  2. Run: nc-prockill -Force" -ForegroundColor Gray
    Write-Host "  3. Run: nc-build -Clean -Force" -ForegroundColor Gray
    Write-Host "  4. Check Windows Task Manager for zombie processes" -ForegroundColor Gray
    Write-Host "  5. Restart computer if problem persists" -ForegroundColor Gray
    
    exit 1
}
