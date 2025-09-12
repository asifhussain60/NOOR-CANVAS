param(
    [switch]$Help,
    [switch]$NoBrowser,
    [switch]$Https,
    [int]$Port = 9090
)

if ($Help) {
    Write-Host "🌙 NOOR Canvas Command (nc)"
    Write-Host "  nc           # Start app + browser"  
    Write-Host "  nc -NoBrowser # Start without browser"
    Write-Host "  nc -Https    # Use HTTPS port 9091"
    Write-Host "  nc -Help     # Show help"
    return
}

# Get to project directory  
$root = Split-Path $MyInvocation.MyCommand.Path -Parent  # Global
$root = Split-Path $root -Parent                        # Workspaces  
$root = Split-Path $root -Parent                        # NOOR CANVAS
$project = Join-Path $root "SPA\NoorCanvas"
Set-Location $project

# Check target port
$targetPort = if ($Https) { 9091 } else { $Port }

# Check if already running
$running = netstat -ano | findstr ":$targetPort "
if ($running) {
    Write-Host "✅ Already running on port $targetPort"
    if (-not $NoBrowser) {
        Start-Process "http://localhost:$targetPort"
    }
    return
}

# Start app
$url = if ($Https) { "https://localhost:9091" } else { "http://localhost:$Port" }
Write-Host "🚀 Starting on $url"

# Browser job
if (-not $NoBrowser) {
    Start-Job { 
        param($u) 
        Start-Sleep 3
        Start-Process $u 
    } -ArgumentList $url | Out-Null
}

# Run
dotnet run --urls $url
