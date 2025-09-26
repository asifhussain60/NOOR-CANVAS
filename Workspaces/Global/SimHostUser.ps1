# SimHostUser.ps1 - NOOR Canvas Host & User Experience Simulator Launcher
# 
# This script launches the NOOR Canvas simulation tool that allows you to:
# - Generate host and user tokens
# - Create multiple user session instances
# - Test SignalR functionality across multiple views
# - Export and import configurations
#
# Usage:
#   .\SimHostUser.ps1              # Launch with default browser
#   .\SimHostUser.ps1 -Browser     # Specify browser (chrome, firefox, edge)
#   .\SimHostUser.ps1 -Port 8080   # Launch on custom port (default: 8090)

param(
    [string]$Browser = "default",
    [int]$Port = 8090,
    [switch]$Help
)

# Show help information
if ($Help) {
    Write-Host "NOOR Canvas - Host & User Experience Simulator" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This tool provides a web-based interface to simulate both host and user experiences"
    Write-Host "in NOOR Canvas with multiple simultaneous user instances for testing SignalR functionality."
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\SimHostUser.ps1                    # Launch with default browser on port 8090"
    Write-Host "  .\SimHostUser.ps1 -Browser chrome    # Launch with Chrome"
    Write-Host "  .\SimHostUser.ps1 -Port 8080         # Launch on port 8080"
    Write-Host "  .\SimHostUser.ps1 -Help              # Show this help"
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Green
    Write-Host "  • Host Token Generation & URL Creation"
    Write-Host "  • User Token Generation & URL Creation"
    Write-Host "  • Multiple User Instance Simulation (1-8 instances)"
    Write-Host "  • Live iframe views of host and user interfaces"
    Write-Host "  • Configuration export/import"
    Write-Host "  • Quick demo setup"
    Write-Host "  • Real-time SignalR testing"
    Write-Host ""
    Write-Host "Supported Browsers:" -ForegroundColor Magenta
    Write-Host "  chrome, firefox, edge, default"
    Write-Host ""
    exit 0
}

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HtmlFile = Join-Path $ScriptDir "SimHostUser.html"

# Check if HTML file exists
if (-not (Test-Path $HtmlFile)) {
    Write-Host "ERROR: SimHostUser.html not found in $ScriptDir" -ForegroundColor Red
    Write-Host "Please ensure the HTML file is in the same directory as this script." -ForegroundColor Yellow
    exit 1
}

# Function to find available port
function Find-AvailablePort {
    param([int]$StartPort = 8090)
    
    $port = $StartPort
    while ((Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue)) {
        $port++
        if ($port -gt 65535) {
            throw "No available ports found"
        }
    }
    return $port
}

# Function to start HTTP server
function Start-HttpServer {
    param(
        [string]$Path,
        [int]$Port
    )
    
    try {
        # Try to find an available port if the specified one is in use
        $actualPort = Find-AvailablePort -StartPort $Port
        if ($actualPort -ne $Port) {
            Write-Host "Port $Port is in use, using port $actualPort instead" -ForegroundColor Yellow
        }
        
        $url = "http://localhost:$actualPort"
        
        Write-Host "Starting NOOR Canvas Simulator..." -ForegroundColor Cyan
        Write-Host "Server URL: $url" -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        # Start Python HTTP server in background
        $serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", $actualPort -WorkingDirectory $Path -PassThru -WindowStyle Hidden
        
        # Wait a moment for server to start
        Start-Sleep -Seconds 2
        
        # Open browser
        Open-Browser -Url $url -Browser $Browser
        
        # Keep server running until Ctrl+C
        try {
            Write-Host "Server is running. Access the simulator at: $url" -ForegroundColor Green
            Write-Host "Features available:" -ForegroundColor Cyan
            Write-Host "  • Host Control Panel simulation" -ForegroundColor White
            Write-Host "  • Multiple User Session instances" -ForegroundColor White
            Write-Host "  • Real-time SignalR testing" -ForegroundColor White
            Write-Host "  • Configuration management" -ForegroundColor White
            Write-Host ""
            Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow
            
            # Wait for Ctrl+C
            while ($true) {
                Start-Sleep -Seconds 1
            }
        }
        finally {
            # Clean up server process
            if ($serverProcess -and !$serverProcess.HasExited) {
                Write-Host "`nShutting down server..." -ForegroundColor Yellow
                Stop-Process -Process $serverProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        Write-Host "Failed to start HTTP server: $($_.Exception.Message)" -ForegroundColor Red
        
        # Fallback: try to open file directly
        Write-Host "Attempting to open file directly in browser..." -ForegroundColor Yellow
        Open-Browser -Url "file:///$($HtmlFile.Replace('\', '/'))" -Browser $Browser
    }
}

# Function to open browser
function Open-Browser {
    param(
        [string]$Url,
        [string]$Browser
    )
    
    try {
        switch ($Browser.ToLower()) {
            "chrome" {
                Start-Process "chrome.exe" -ArgumentList $Url -ErrorAction Stop
            }
            "firefox" {
                Start-Process "firefox.exe" -ArgumentList $Url -ErrorAction Stop
            }
            "edge" {
                Start-Process "msedge.exe" -ArgumentList $Url -ErrorAction Stop
            }
            default {
                Start-Process $Url
            }
        }
        Write-Host "Browser opened successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to open browser: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please manually navigate to: $Url" -ForegroundColor Yellow
    }
}

# Function to check Python availability
function Test-PythonAvailable {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Python detected: $pythonVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        # Python not found
    }
    return $false
}

# Main execution
try {
    Write-Host "NOOR Canvas - Host & User Experience Simulator" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Python is available for HTTP server
    if (Test-PythonAvailable) {
        Start-HttpServer -Path $ScriptDir -Port $Port
    }
    else {
        Write-Host "Python not found. Opening HTML file directly..." -ForegroundColor Yellow
        Open-Browser -Url "file:///$($HtmlFile.Replace('\', '/'))" -Browser $Browser
        
        Write-Host ""
        Write-Host "NOTE: For full functionality, install Python to enable local HTTP server." -ForegroundColor Yellow
        Write-Host "Direct file access may have limitations with some browser security policies." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}