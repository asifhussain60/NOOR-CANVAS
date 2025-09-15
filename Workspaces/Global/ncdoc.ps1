param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [switch]$Stop,
    [switch]$Force,
    [int]$Port = 8050
)

function Get-WorkspaceRoot {
    # Assume this script lives in Workspaces/Global
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = $PSScriptRoot
    }
    if (-not $scriptPath) {
        # Fallback - use current directory and navigate up
        $scriptPath = (Get-Location).Path
    }
    
    $parent = Split-Path $scriptPath -Parent
    if ($parent) {
        return Split-Path $parent -Parent
    }
    return $null
}

if ($Help) {
    Write-Host "NOOR Canvas Documentation (ncdoc)" -ForegroundColor Green
    Write-Host "Enhanced with background job management - no more orphaned windows!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ncdoc               # Serve documentation (reuse if running on port 8050)"
    Write-Host "  ncdoc -Force        # Kill existing servers and start fresh"
    Write-Host "  ncdoc -Build        # Rebuild documentation first"
    Write-Host "  ncdoc -NoBrowser    # Don't open browser"
    Write-Host "  ncdoc -Stop         # Stop documentation server"
    Write-Host "  ncdoc -Port <port>  # Serve on alternative port (default: 8050)"
    Write-Host ""
    Write-Host "IMPROVEMENTS:"
    Write-Host "  • Uses DocFX background jobs instead of separate windows"
    Write-Host "  • No more orphaned PowerShell windows"
    Write-Host "  • Better process management and cleanup"
    Write-Host "  • Intelligent server detection and reuse"
    Write-Host ""
    Write-Host "PORT POLICY:"
    Write-Host "  Default: 8050 (avoids 808* Beautiful Islam and 909* NOOR Canvas ranges)"
    Write-Host "  Reserved: 8080 (Beautiful Islam), 9090-9091 (NOOR Canvas HTTP/HTTPS)"
    return
}

$root = Get-WorkspaceRoot
$docRoot = Join-Path $root "DocFX\_site"
if (-not (Test-Path $docRoot)) {
    # fallback to DocFX output default location
    $docRoot = Join-Path $root "DocFX\_site"
}

$docUrl = "http://localhost:$Port"
$pidFile = Join-Path $root "Workspaces\Global\ncdoc-$Port.pid"

if ($Stop) {
    if (Test-Path $pidFile) {
        $savedInfo = Get-Content $pidFile | Select-Object -First 1
        Write-Host "Stopping documentation server ($savedInfo)..." -ForegroundColor Yellow
        try {
            if ($savedInfo.StartsWith("JOB:")) {
                # Handle background job
                $jobId = $savedInfo.Replace("JOB:", "")
                $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
                if ($job) {
                    Stop-Job -Job $job -ErrorAction SilentlyContinue
                    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
                    Write-Host "Documentation server job stopped." -ForegroundColor Green
                } else {
                    Write-Host "Job $jobId not found (may have already ended)." -ForegroundColor Yellow
                }
            } else {
                # Handle legacy PID
                $processId = [int]$savedInfo
                Stop-Process -Id $processId -ErrorAction Stop
                Write-Host "Documentation server process stopped." -ForegroundColor Green
            }
            Remove-Item $pidFile -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Failed to stop server ($savedInfo): $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "No running documentation server found (no PID file)." -ForegroundColor Yellow
    }
    return
}

if ($Force) {
    Write-Host "Force restart requested - cleaning existing servers..." -ForegroundColor Yellow
    
    # Stop any existing background jobs for DocFX
    $docJobs = Get-Job | Where-Object { $_.Command -match "docfx" } -ErrorAction SilentlyContinue
    if ($docJobs) {
        Write-Host "Found $($docJobs.Count) existing DocFX job(s). Stopping..." -ForegroundColor Cyan
        $docJobs | Stop-Job -ErrorAction SilentlyContinue
        $docJobs | Remove-Job -Force -ErrorAction SilentlyContinue
    }
    
    # Kill any existing DocFX processes (legacy cleanup)
    $docProcesses = Get-Process | Where-Object { 
        $_.ProcessName -match "docfx"
    } -ErrorAction SilentlyContinue
    
    if ($docProcesses) {
        Write-Host "Found $($docProcesses.Count) existing DocFX process(es). Stopping..." -ForegroundColor Cyan
        $docProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    # Clean up PID files for this port and common ports
    $commonPorts = @(8050, 9093, 8080)
    foreach ($commonPort in $commonPorts) {
        $commonPidFile = Join-Path $root "Workspaces\Global\ncdoc-$commonPort.pid"
        if (Test-Path $commonPidFile) {
            Remove-Item $commonPidFile -ErrorAction SilentlyContinue
            Write-Host "Cleaned PID file for port $commonPort" -ForegroundColor Gray
        }
    }
    
    Write-Host "Cleanup complete. Starting fresh server..." -ForegroundColor Green
}

if ($Build) {
    Write-Host "Building documentation..." -ForegroundColor Yellow
    $docfxRoot = Join-Path $root "DocFX"
    if (Test-Path $docfxRoot) {
        Push-Location $docfxRoot
        & docfx build
        Pop-Location
    } else {
        Write-Host "DocFX folder not found at $docfxRoot" -ForegroundColor Red
    }
}

if (-not (Test-Path $docRoot)) {
    Write-Host "Documentation folder not found: $docRoot" -ForegroundColor Red
    return
}

# Check if server already running on target port (unless Force was used)
if (-not $Force) {
    try {
        # Use netstat to check if port is in use - match various formats
        $portCheck = netstat -an | Select-String "LISTENING" | Select-String ":$Port"
        if ($portCheck) {
            Write-Host "Documentation server already running on port $Port" -ForegroundColor Green
            Write-Host "URL: $docUrl" -ForegroundColor Cyan
            Write-Host "Use 'ncdoc -Force' to restart or 'ncdoc -Stop' to stop" -ForegroundColor Gray
            
            if (-not $NoBrowser) {
                Write-Host "Opening browser..." -ForegroundColor Yellow
                Start-Process $docUrl
            }
            return
        }
    } catch {
        # If netstat fails, continue with startup
        Write-Host "Could not check port status. Proceeding with startup..." -ForegroundColor Gray
    }
}

Write-Host "Starting documentation server on port $Port..." -ForegroundColor Yellow

# Use DocFX serve as primary method - more reliable and no orphaned windows
$docfxRoot = Join-Path $root "DocFX"
if (-not (Test-Path $docfxRoot)) {
    Write-Host "DocFX folder not found at $docfxRoot. Cannot start documentation server." -ForegroundColor Red
    return
}

Write-Host "Starting DocFX documentation server..." -ForegroundColor Cyan

try {
    # Start DocFX serve as a background job to avoid orphaned windows
    $job = Start-Job -ScriptBlock {
        param($docfxPath, $port)
        Set-Location $docfxPath
        & docfx serve _site --port $port
    } -ArgumentList $docfxRoot, $Port
    
    if ($job) {
        # Wait a moment for the job to start
        Start-Sleep -Milliseconds 1500
        
        # Check if the job is running
        $jobState = Get-Job -Id $job.Id | Select-Object -ExpandProperty State
        
        if ($jobState -eq "Running") {
            # Save job ID instead of PID for better process management
            Set-Content -Path $pidFile -Value "JOB:$($job.Id)"
            Write-Host "Documentation server launched (Job ID $($job.Id)). URL: $docUrl" -ForegroundColor Green
            Write-Host "Server is running in background. Use 'ncdoc -Stop' to stop." -ForegroundColor Gray
            
            if (-not $NoBrowser) {
                Write-Host "Opening browser..." -ForegroundColor Yellow
                Start-Process $docUrl
            }
        } else {
            Write-Host "DocFX server failed to start. Job state: $jobState" -ForegroundColor Red
            $jobOutput = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($jobOutput) {
                Write-Host "Job output: $jobOutput" -ForegroundColor Yellow
            }
            Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "Failed to create DocFX background job." -ForegroundColor Red
    }
} catch {
    Write-Host "Error starting DocFX server: $($_.Exception.Message)" -ForegroundColor Red
}
