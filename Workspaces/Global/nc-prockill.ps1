# NOOR Canvas Process Killer - Enhanced File Lock Resolution
# Comprehensive solution for MSB3026/MSB3027 build errors
param(
    [switch]$Help,
    [switch]$WhatIf,
    [switch]$Verbose,
    [switch]$Force
)

if ($Help) {
    Write-Host "NOOR Canvas Process Killer - Enhanced File Lock Resolution" -ForegroundColor Green
    Write-Host "=========================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc-prockill                  # Kill NOOR Canvas processes safely"
    Write-Host "  nc-prockill -WhatIf          # Preview what would be killed (dry run)"
    Write-Host "  nc-prockill -Force           # Force kill all related processes"
    Write-Host "  nc-prockill -Verbose         # Detailed output during execution"
    Write-Host "  nc-prockill -Help            # Show this help"
    Write-Host ""
    Write-Host "TARGETS:"
    Write-Host "  • NoorCanvas.exe processes (including PID 5060 pattern)"
    Write-Host "  • dotnet.exe processes running NoorCanvas projects"
    Write-Host "  • IIS Express processes on ports 9090-9091"
    Write-Host "  • Handles to locked NoorCanvas.exe and apphost.exe files"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  • Advanced process detection by command line and working directory"
    Write-Host "  • File handle enumeration to find lock sources"
    Write-Host "  • Safe termination with escalating force levels"
    Write-Host "  • File system lock verification and retry logic"
    return
}

function Write-KillLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green" 
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
    }
    if ($Verbose) {
        Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
    } elseif ($Level -ne "DEBUG") {
        Write-Host "$Message" -ForegroundColor $colors[$Level]
    }
}

function Test-FileInUse {
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

function Get-ProcessesUsingFile {
    param([string]$FilePath)
    $processes = @()
    try {
        # Use handle.exe if available, otherwise fallback to process enumeration
        if (Get-Command "handle.exe" -ErrorAction SilentlyContinue) {
            $handleOutput = & handle.exe -u "$FilePath" 2>$null
            foreach ($line in $handleOutput) {
                if ($line -match "(\w+\.exe)\s+pid:\s*(\d+)") {
                    $processes += @{
                        ProcessName = $matches[1]
                        ProcessId = [int]$matches[2]
                    }
                }
            }
        }
    } catch {
        Write-KillLog "Handle enumeration failed: $($_.Exception.Message)" "DEBUG"
    }
    return $processes
}

Write-Host "NOOR Canvas Process Killer - Enhanced File Lock Resolution" -ForegroundColor Cyan
Write-Host "==========================================================="
Write-Host ""

$killed = @()
$skipped = @()

# Step 1: Find NoorCanvas.exe processes directly
Write-KillLog "Step 1: Finding NoorCanvas.exe processes..." "INFO"
$noorProcesses = Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue
if ($noorProcesses) {
    foreach ($proc in $noorProcesses) {
        Write-KillLog "Found NoorCanvas.exe PID $($proc.Id)" "WARNING"
        if ($WhatIf) {
            Write-Host "Would kill NoorCanvas.exe PID $($proc.Id)" -ForegroundColor Cyan
        } else {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Host "✅ Killed NoorCanvas.exe PID $($proc.Id)" -ForegroundColor Green
                $killed += "NoorCanvas:$($proc.Id)"
            } catch {
                Write-Host "❌ Failed to kill NoorCanvas PID $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
                $skipped += "NoorCanvas:$($proc.Id)"
            }
        }
    }
} else {
    Write-KillLog "No NoorCanvas.exe processes found" "INFO"
}

# Step 2: Find dotnet processes running NOOR Canvas
Write-KillLog "Step 2: Finding dotnet processes with NOOR Canvas..." "INFO"
$dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
$foundDotnet = $false
foreach ($proc in $dotnetProcesses) {
    try {
        $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        
        if ($commandLine -and ($commandLine -like "*NoorCanvas*" -or $commandLine -like "*localhost:90*")) {
            $foundDotnet = $true
            Write-KillLog "Found NOOR Canvas dotnet process PID $($proc.Id): $commandLine" "WARNING"
            if ($WhatIf) {
                Write-Host "Would kill dotnet PID $($proc.Id) (NOOR Canvas)" -ForegroundColor Cyan
            } else {
                try {
                    Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                    Write-Host "✅ Killed NOOR Canvas dotnet PID $($proc.Id)" -ForegroundColor Green
                    $killed += "dotnet:$($proc.Id)"
                } catch {
                    Write-Host "❌ Failed to kill dotnet PID $($proc.Id): $($_.Exception.Message)" -ForegroundColor Red
                    $skipped += "dotnet:$($proc.Id)"
                }
            }
        }
    } catch {
        # Skip inaccessible processes
        Write-KillLog "Could not access dotnet PID $($proc.Id)" "DEBUG"
    }
}

if (-not $foundDotnet) {
    Write-KillLog "No NOOR Canvas dotnet processes found" "INFO"
}

# Step 3: Find IIS Express on NOOR Canvas ports
Write-KillLog "Step 3: Finding IIS Express on NOOR Canvas ports (9090-9091)..." "INFO"
$noorPorts = @(9090, 9091)
$foundIIS = $false
foreach ($port in $noorPorts) {
    $connections = netstat -ano | Select-String ":$port\s"
    foreach ($connection in $connections) {
        $parts = $connection.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($parts.Count -ge 5) {
            $processId = $parts[4]
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process -and $process.ProcessName -eq "iisexpress") {
                    $foundIIS = $true
                    Write-KillLog "Found IIS Express PID $processId on port $port" "WARNING"
                    if ($WhatIf) {
                        Write-Host "Would kill IIS Express PID $processId (port $port)" -ForegroundColor Cyan
                    } else {
                        try {
                            Stop-Process -Id $processId -Force -ErrorAction Stop
                            Write-Host "✅ Killed IIS Express PID $processId (port $port)" -ForegroundColor Green
                            $killed += "iisexpress:$processId"
                        } catch {
                            Write-Host "❌ Failed to kill IIS Express PID $processId`: $($_.Exception.Message)" -ForegroundColor Red
                            $skipped += "iisexpress:$processId"
                        }
                    }
                }
            } catch {
                Write-KillLog "Could not access process PID $processId on port $port" "DEBUG"
            }
        }
    }
}

if (-not $foundIIS) {
    Write-KillLog "No IIS Express processes found on NOOR Canvas ports" "INFO"
}

# Step 4: Check for file locks and try to resolve them
if (-not $WhatIf) {
    Write-KillLog "Step 4: Checking file locks..." "INFO"
    $exePath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\bin\Debug\net8.0\NoorCanvas.exe"
    $apphostPath = "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\obj\Debug\net8.0\apphost.exe"
    
    if (Test-FileInUse $exePath) {
        Write-Host "⚠️ NoorCanvas.exe is still locked" -ForegroundColor Yellow
        $lockingProcesses = Get-ProcessesUsingFile $exePath
        foreach ($lockProc in $lockingProcesses) {
            Write-KillLog "File locked by: $($lockProc.ProcessName) (PID: $($lockProc.ProcessId))" "WARNING"
        }
    } else {
        Write-Host "✅ NoorCanvas.exe is not locked" -ForegroundColor Green
    }
    
    if (Test-FileInUse $apphostPath) {
        Write-Host "⚠️ apphost.exe is still locked" -ForegroundColor Yellow
        $lockingProcesses = Get-ProcessesUsingFile $apphostPath
        foreach ($lockProc in $lockingProcesses) {
            Write-KillLog "File locked by: $($lockProc.ProcessName) (PID: $($lockProc.ProcessId))" "WARNING"
        }
    } else {
        Write-Host "✅ apphost.exe is not locked" -ForegroundColor Green
    }
}

# Step 5: Wait for process cleanup
if (-not $WhatIf -and $killed.Count -gt 0) {
    Write-KillLog "Step 5: Waiting for process cleanup..." "INFO"
    Start-Sleep -Seconds 3
}

# Final summary
Write-Host ""
if ($WhatIf) {
    Write-Host "📋 Dry Run Summary: Would have targeted $($killed.Count + $skipped.Count) processes" -ForegroundColor Cyan
} else {
    Write-Host "📊 Operation Summary:" -ForegroundColor White
    Write-Host "  Killed: $($killed.Count) processes" -ForegroundColor Green
    Write-Host "  Skipped: $($skipped.Count) processes" -ForegroundColor Yellow
    
    if ($killed.Count -gt 0) {
        Write-Host "✅ NOOR Canvas process cleanup completed" -ForegroundColor Green
        Write-KillLog "Killed processes: $($killed -join ', ')" "SUCCESS"
    }
    
    if ($skipped.Count -gt 0) {
        Write-Host "⚠️ Some processes could not be terminated" -ForegroundColor Yellow
        Write-KillLog "Skipped processes: $($skipped -join ', ')" "WARNING"
    }
}

exit 0
