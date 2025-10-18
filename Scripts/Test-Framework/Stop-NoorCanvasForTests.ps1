<#
.SYNOPSIS
    Graceful shutdown for NoorCanvas test instances.

.DESCRIPTION
    Properly stops NoorCanvas processes with validation and cleanup.
    
    Can operate in two modes:
    1. Target specific process ID (from Start-NoorCanvasForTests.ps1)
    2. Kill all NoorCanvas processes (cleanup mode)

.PARAMETER ProcessId
    Specific process ID to stop. If not provided, stops ALL NoorCanvas processes.

.PARAMETER Force
    Use Force to kill process immediately without graceful shutdown.

.PARAMETER CleanupTempFiles
    Remove temporary startup scripts from TEMP directory.

.EXAMPLE
    Stop-NoorCanvasForTests.ps1 -ProcessId 12345

.EXAMPLE
    Stop-NoorCanvasForTests.ps1 -Force -CleanupTempFiles
#>

[CmdletBinding()]
param(
    [int]$ProcessId,
    [switch]$Force,
    [switch]$CleanupTempFiles
)

$ErrorActionPreference = "Continue"

function Write-TestLog {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level = 'Info'
    )
    
    $timestamp = Get-Date -Format 'HH:mm:ss.fff'
    $prefix = switch ($Level) {
        'Info'    { "[INFO]" }
        'Success' { "[OK]" }
        'Warning' { "[WARN]" }
        'Error'   { "[ERROR]" }
    }
    
    $color = switch ($Level) {
        'Info'    { 'Cyan' }
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
    }
    
    Write-Host "[$timestamp] $prefix $Message" -ForegroundColor $color
}

Write-Host ""
Write-TestLog "Stopping NoorCanvas test instance(s)..." -Level Info

# Determine target processes
if ($ProcessId) {
    Write-TestLog "Targeting specific process: PID $ProcessId" -Level Info
    $processes = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    
    if (-not $processes) {
        Write-TestLog "Process $ProcessId not found (may have already exited)" -Level Warning
        return
    }
}
else {
    Write-TestLog "Targeting ALL NoorCanvas processes" -Level Warning
    $processes = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
    
    if (-not $processes) {
        Write-TestLog "No NoorCanvas processes found" -Level Info
        return
    }
}

# Stop processes
$stoppedCount = 0
foreach ($proc in $processes) {
    try {
        Write-TestLog "Stopping PID $($proc.Id)..." -Level Info
        
        if ($Force) {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
        }
        else {
            Stop-Process -Id $proc.Id -ErrorAction Stop
        }
        
        $stoppedCount++
        Write-TestLog "Stopped PID $($proc.Id)" -Level Success
    }
    catch {
        Write-TestLog "Failed to stop PID $($proc.Id): $_" -Level Error
    }
}

# Wait for processes to exit
Start-Sleep -Seconds 2

# Verify cleanup
$remainingProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($remainingProcesses) {
    Write-TestLog "Warning: $($remainingProcesses.Count) process(es) still running" -Level Warning
    $remainingProcesses | ForEach-Object {
        Write-Host "  PID $($_.Id)" -ForegroundColor Yellow
    }
}
else {
    Write-TestLog "All processes stopped successfully" -Level Success
}

# Cleanup temp files
if ($CleanupTempFiles) {
    Write-TestLog "Cleaning up temporary startup scripts..." -Level Info
    
    $tempScripts = Get-ChildItem -Path $env:TEMP -Filter "noorcanvas-test-startup-*.ps1" -ErrorAction SilentlyContinue
    
    if ($tempScripts) {
        $tempScripts | ForEach-Object {
            try {
                Remove-Item -Path $_.FullName -Force -ErrorAction Stop
                Write-TestLog "Removed: $($_.Name)" -Level Info
            }
            catch {
                Write-TestLog "Failed to remove $($_.Name): $_" -Level Warning
            }
        }
    }
    else {
        Write-TestLog "No temporary scripts found" -Level Info
    }
}

Write-Host ""
Write-TestLog "Shutdown complete ($stoppedCount process(es) stopped)" -Level Success
Write-Host ""
