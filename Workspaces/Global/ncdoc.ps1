param(
    [switch]$Help,
    [switch]$Build,
    [switch]$NoBrowser,
    [switch]$Stop,
    [int]$Port = 9093
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
    Write-Host "USAGE:"
    Write-Host "  ncdoc               # Serve documentation and open browser"
    Write-Host "  ncdoc -Build        # Rebuild documentation first"
    Write-Host "  ncdoc -NoBrowser    # Don't open browser"
    Write-Host "  ncdoc -Stop         # Stop documentation server"
    Write-Host "  ncdoc -Port <port>  # Serve on alternative port"
    return
}

$root = Get-WorkspaceRoot
$docRoot = Join-Path $root "DocFX\_site"
if (-not (Test-Path $docRoot)) {
    # fallback to DocFX output default location
    $docRoot = Join-Path $root "DocFX\_site"
}

$docUrl = "http://localhost:$Port"
$pidFile = Join-Path $root "Workspaces\Global\ncdoc.pid"

if ($Stop) {
    if (Test-Path $pidFile) {
        $pid = Get-Content $pidFile | Select-Object -First 1
        Write-Host "Stopping documentation server (PID $pid)..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $pid -ErrorAction Stop
            Remove-Item $pidFile -ErrorAction SilentlyContinue
            Write-Host "Documentation server stopped." -ForegroundColor Green
        } catch {
            Write-Host "Failed to stop process with PID ${pid}: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "No running documentation server found (no PID file)." -ForegroundColor Yellow
    }
    return
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

Write-Host "Starting documentation server on port $Port..." -ForegroundColor Yellow

# Launch python http.server in a new PowerShell window so closing the current terminal won't stop it
$pythonExe = "python"
$startInfo = @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    "& { Set-Location -Path '$docRoot'; Start-Process -FilePath '$pythonExe' -ArgumentList '-m', 'http.server', '$Port' -NoNewWindow -PassThru | Out-String }"
)

# Use Start-Process to create a detached window
$psExe = (Get-Command powershell).Source
$command = "Set-Location -Path '$docRoot'; & '$pythonExe' -m http.server $Port"
$args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', $command)

$proc = Start-Process -FilePath $psExe -ArgumentList $args -WindowStyle Minimized -PassThru

if ($proc -and $proc.Id) {
    # The PID we saved is the PowerShell wrapper; find the child python process if possible
    Start-Sleep -Milliseconds 600
    $child = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $proc.Id -and $_.Name -match 'python' } | Select-Object -First 1
    if ($child) {
        $savedPid = $child.ProcessId
    } else {
        # fallback to wrapper PID
        $savedPid = $proc.Id
    }
    Set-Content -Path $pidFile -Value $savedPid
    Write-Host "Documentation server launched (PID $savedPid). URL: $docUrl" -ForegroundColor Green
    if (-not $NoBrowser) {
        Start-Process $docUrl
    }
} else {
    Write-Host "Failed to start documentation server." -ForegroundColor Red
}
