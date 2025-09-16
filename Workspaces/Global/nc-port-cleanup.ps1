# NOOR Canvas Port Cleanup Utility
# Quick cleanup for stuck processes and port conflicts
param(
    [switch]$Help,
    [switch]$Aggressive
)

if ($Help) {
    Write-Host "NOOR Canvas Port Cleanup - Quick Port Conflict Resolution" -ForegroundColor Green
    Write-Host "========================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc-cleanup              # Standard cleanup of NOOR Canvas processes"
    Write-Host "  nc-cleanup -Aggressive  # Aggressive cleanup of all web-related processes"
    Write-Host "  nc-cleanup -Help        # Show this help"
    Write-Host ""
    Write-Host "ACTIONS:"
    Write-Host "  • Stops IIS Express processes"
    Write-Host "  • Stops dotnet processes related to NOOR Canvas"
    Write-Host "  • Frees up ports 9090-9100"
    Write-Host "  • Reports freed ports"
    return
}

function Write-CleanupMessage {
    param([string]$Message, [string]$Level = "INFO")
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green" 
        "WARNING" = "Yellow"
        "ERROR" = "Red"
    }
    Write-Host "[CLEANUP] $Message" -ForegroundColor $colors[$Level]
}

Write-CleanupMessage "Starting NOOR Canvas port cleanup..." "INFO"

# Clean up IIS Express processes
$iisProcesses = Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue
if ($iisProcesses) {
    Write-CleanupMessage "Found $($iisProcesses.Count) IIS Express process(es)" "INFO"
    foreach ($proc in $iisProcesses) {
        Write-CleanupMessage "Stopping IIS Express PID $($proc.Id)" "WARNING"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-CleanupMessage "No IIS Express processes found" "INFO"
}

# Clean up dotnet processes
$dotnetProcesses = Get-Process -Name "dotnet*" -ErrorAction SilentlyContinue
$stopped = 0
foreach ($proc in $dotnetProcesses) {
    try {
        $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($commandLine -and ($commandLine -like "*NoorCanvas*" -or $commandLine -like "*localhost:90*")) {
            Write-CleanupMessage "Stopping NOOR Canvas dotnet process PID $($proc.Id)" "WARNING"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stopped++
        } elseif ($Aggressive -and $proc.MainWindowTitle -eq "" -and $proc.WorkingSet -gt 50MB) {
            Write-CleanupMessage "Stopping suspicious dotnet process PID $($proc.Id) (Aggressive mode)" "WARNING"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stopped++
        }
    } catch {
        # Skip processes we can't access
    }
}

if ($stopped -gt 0) {
    Write-CleanupMessage "Stopped $stopped dotnet process(es)" "SUCCESS"
} else {
    Write-CleanupMessage "No NOOR Canvas dotnet processes found" "INFO"
}

# Wait for processes to fully terminate
Start-Sleep -Seconds 2

# Check freed ports
Write-CleanupMessage "Checking port status..." "INFO"
$portsToCheck = 9090..9100
$freePorts = @()
$busyPorts = @()

foreach ($port in $portsToCheck) {
    $connection = netstat -ano | Select-String ":$port\s"
    if ($connection.Count -eq 0) {
        $freePorts += $port
    } else {
        $busyPorts += $port
    }
}

if ($freePorts.Count -gt 0) {
    Write-CleanupMessage "Freed ports: $($freePorts -join ', ')" "SUCCESS"
}

if ($busyPorts.Count -gt 0) {
    Write-CleanupMessage "Still busy ports: $($busyPorts -join ', ') (may be system reserved)" "WARNING"
}

Write-CleanupMessage "Port cleanup completed successfully" "SUCCESS"

# Optional: Show detailed port usage
if ($busyPorts.Count -gt 0) {
    Write-Host ""
    Write-CleanupMessage "Detailed port usage for busy ports:" "INFO"
    foreach ($port in $busyPorts) {
        $connections = netstat -ano | Select-String ":$port\s"
        foreach ($conn in $connections) {
            $parts = $conn.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
            if ($parts.Count -ge 5) {
                $processId = $parts[4]
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "  Port $port -> $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
                    } else {
                        Write-Host "  Port $port -> Unknown process (PID: $processId)" -ForegroundColor Gray
                    }
                } catch {
                    Write-Host "  Port $port -> System process (PID: $processId)" -ForegroundColor Gray
                }
            }
        }
    }
}
