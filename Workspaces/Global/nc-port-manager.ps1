# NOOR Canvas Port Manager
# Comprehensive port conflict resolution and application launcher
param(
    [switch]$Help,
    [switch]$SkipTokenGeneration,
    [switch]$ForceKill,
    [int]$PreferredHttpPort = 9090,
    [int]$PreferredHttpsPort = 9091
)

if ($Help) {
    Write-Host "NOOR Canvas Port Manager - Automatic Port Conflict Resolution" -ForegroundColor Green
    Write-Host "============================================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  nc                           # Full workflow with port cleanup"
    Write-Host "  nc -ForceKill                # Kill all blocking processes"
    Write-Host "  nc -PreferredHttpPort 8080   # Use alternative HTTP port"
    Write-Host "  nc -PreferredHttpsPort 8443  # Use alternative HTTPS port"
    Write-Host "  nc -SkipTokenGeneration      # Skip token generation step"
    Write-Host "  nc -Help                     # Show this help"
    Write-Host ""
    Write-Host "FEATURES:"
    Write-Host "  • Automatic port conflict detection and resolution"
    Write-Host "  • Cleanup of orphaned IIS Express and dotnet processes"
    Write-Host "  • Dynamic port selection if preferred ports are blocked"
    Write-Host "  • Enhanced error handling and reporting"
    return
}

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $colors = @{
        "INFO" = "White"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
}

function Stop-ProcessesByPorts {
    param([int[]]$Ports)
    
    Write-LogMessage "Checking for processes using ports: $($Ports -join ', ')" "INFO"
    
    foreach ($port in $Ports) {
        $connections = netstat -ano | Select-String ":$port\s"
        foreach ($connection in $connections) {
            $parts = $connection.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
            if ($parts.Count -ge 5) {
                $processId = $parts[4]
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-LogMessage "Stopping process $($process.ProcessName) (PID: $processId) using port $port" "WARNING"
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Start-Sleep -Milliseconds 500
                    }
                } catch {
                    Write-LogMessage "Could not stop process PID $processId" "DEBUG"
                }
            }
        }
    }
}

function Stop-OrphanedProcesses {
    Write-LogMessage "Cleaning up orphaned processes..." "INFO"
    
    # Stop orphaned IIS Express processes
    $iisProcesses = Get-Process -Name "iisexpress*" -ErrorAction SilentlyContinue
    foreach ($proc in $iisProcesses) {
        Write-LogMessage "Stopping orphaned IIS Express process (PID: $($proc.Id))" "WARNING"
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Stop orphaned dotnet processes (excluding VS and system processes)
    $dotnetProcesses = Get-Process -Name "dotnet*" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -eq "" -and $_.ProcessName -ne "dotnet" -or
        $_.CommandLine -like "*NoorCanvas*" -or
        $_.CommandLine -like "*localhost:90*"
    }
    foreach ($proc in $dotnetProcesses) {
        try {
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
            if ($commandLine -and ($commandLine -like "*NoorCanvas*" -or $commandLine -like "*localhost:90*")) {
                Write-LogMessage "Stopping orphaned dotnet process: $commandLine (PID: $($proc.Id))" "WARNING"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # If we can't get command line, just check if it's a web server process
            if ($proc.WorkingSet -gt 50MB) {
                Write-LogMessage "Stopping potential orphaned dotnet process (PID: $($proc.Id))" "DEBUG"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    Start-Sleep -Seconds 2
}

function Test-PortAvailable {
    param([int]$Port)
    $connection = netstat -ano | Select-String ":$Port\s"
    return $connection.Count -eq 0
}

function Find-AvailablePort {
    param([int]$StartPort = 8080)
    
    for ($port = $StartPort; $port -lt $StartPort + 50; $port++) {
        if (Test-PortAvailable -Port $port) {
            return $port
        }
    }
    throw "Could not find an available port starting from $StartPort"
}

function Update-LaunchSettings {
    param([int]$HttpPort, [int]$HttpsPort, [string]$ProjectPath)
    
    $launchSettingsPath = Join-Path $ProjectPath "Properties\launchSettings.json"
    if (Test-Path $launchSettingsPath) {
        Write-LogMessage "Updating launch settings for ports HTTP:$HttpPort, HTTPS:$HttpsPort" "INFO"
        
        $content = Get-Content $launchSettingsPath -Raw | ConvertFrom-Json
        
        # Update IIS Express settings
        $content.iisSettings.iisExpress.applicationUrl = "http://localhost:$HttpPort"
        $content.iisSettings.iisExpress.sslPort = $HttpsPort
        
        # Update NoorCanvas profile
        $content.profiles.NoorCanvas.applicationUrl = "https://localhost:$HttpsPort;http://localhost:$HttpPort"
        
        # Backup original
        $backupPath = "$launchSettingsPath.backup"
        if (-not (Test-Path $backupPath)) {
            Copy-Item $launchSettingsPath $backupPath
        }
        
        # Save updated settings
        $content | ConvertTo-Json -Depth 10 | Set-Content $launchSettingsPath
        Write-LogMessage "Launch settings updated successfully" "SUCCESS"
    }
}

# Main execution
Write-LogMessage "NOOR Canvas Port Manager Starting..." "INFO"
Write-LogMessage "====================================" "INFO"

# Get project directory
$root = Split-Path $MyInvocation.MyCommand.Path -Parent
$root = Split-Path $root -Parent
$root = Split-Path $root -Parent
$project = Join-Path $root "SPA\NoorCanvas"

# Step 1: Port Cleanup
Write-LogMessage "Step 1: Port Conflict Resolution" "INFO"

if ($ForceKill) {
    Write-LogMessage "Force kill mode enabled - stopping all related processes" "WARNING"
    Stop-OrphanedProcesses
}

# Check port availability and find alternatives if needed
$httpPort = $PreferredHttpPort
$httpsPort = $PreferredHttpsPort

if (-not (Test-PortAvailable -Port $httpPort)) {
    Write-LogMessage "HTTP port $httpPort is in use, attempting cleanup..." "WARNING"
    Stop-ProcessesByPorts -Ports @($httpPort)
    Start-Sleep -Seconds 2
    
    if (-not (Test-PortAvailable -Port $httpPort)) {
        $httpPort = Find-AvailablePort -StartPort 8080
        Write-LogMessage "Using alternative HTTP port: $httpPort" "INFO"
    }
}

if (-not (Test-PortAvailable -Port $httpsPort)) {
    Write-LogMessage "HTTPS port $httpsPort is in use, attempting cleanup..." "WARNING"
    Stop-ProcessesByPorts -Ports @($httpsPort)
    Start-Sleep -Seconds 2
    
    if (-not (Test-PortAvailable -Port $httpsPort)) {
        $httpsPort = Find-AvailablePort -StartPort 8443
        Write-LogMessage "Using alternative HTTPS port: $httpsPort" "INFO"
    }
}

# Update launch settings with confirmed ports
Update-LaunchSettings -HttpPort $httpPort -HttpsPort $httpsPort -ProjectPath $project

# Step 2: Host Token Generation
if (-not $SkipTokenGeneration) {
    Write-LogMessage "Step 2: Host Token Generation" "INFO"
    
    $nctPath = Join-Path $root "Workspaces\Global\nct.ps1"
    & $nctPath
    
    Write-LogMessage "Host token generation completed" "SUCCESS"
    Write-Host ""
    Write-Host "Automatically continuing to build..." -ForegroundColor Green
    Write-Host ""
}

# Step 3: Build
Write-LogMessage "Step 3: Building Project" "INFO"
Set-Location $project
Write-LogMessage "Building NOOR Canvas..." "INFO"

dotnet build --no-restore --verbosity minimal

if ($LASTEXITCODE -ne 0) {
    Write-LogMessage "Build failed - cannot proceed" "ERROR"
    return
}

Write-LogMessage "Build successful" "SUCCESS"

# Step 4: Start Application
Write-LogMessage "Step 4: Starting NOOR Canvas Application" "INFO"

$httpUrl = "http://localhost:$httpPort"
$httpsUrl = "https://localhost:$httpsPort"

Write-LogMessage "Starting application on:" "INFO"
Write-LogMessage "  HTTP:  $httpUrl" "INFO"  
Write-LogMessage "  HTTPS: $httpsUrl" "INFO"

# Use dotnet run with specific URLs to avoid launch settings conflicts
$env:ASPNETCORE_URLS = "$httpsUrl;$httpUrl"
dotnet run

Write-LogMessage "Application started successfully" "SUCCESS"
Write-LogMessage "Application available at: $httpsUrl" "SUCCESS"
