<#
.SYNOPSIS
    Configure IIS for NoorCanvas application.

.DESCRIPTION
    This script sets up IIS Application Pool and Website for NoorCanvas.
    It configures:
    - Application Pool with .NET Core settings
    - Website binding and physical path
    - WebSocket support
    - Request limits and timeouts
    - HTTPS redirect (optional)

.PARAMETER SiteName
    Name of the IIS website. Default: "NoorCanvas"

.PARAMETER AppPoolName
    Name of the IIS Application Pool. Default: "NoorCanvas"

.PARAMETER Port
    HTTP port for the website. Default: 80

.PARAMETER HostName
    Host name for the website. Leave empty for all host names.

.PARAMETER PhysicalPath
    Physical path to the application. Default: "D:\Websites\NOOR-CANVAS"

.PARAMETER RemoveExisting
    Remove existing site and app pool if they exist.

.EXAMPLE
    .\setup-iis.ps1
    Setup with default settings

.EXAMPLE
    .\setup-iis.ps1 -Port 8080 -HostName "noorcanvas.local"
    Setup with custom port and hostname

.EXAMPLE
    .\setup-iis.ps1 -RemoveExisting
    Remove and recreate existing configuration
#>

param(
    [string]$SiteName = "NoorCanvas",
    [string]$AppPoolName = "NoorCanvas",
    [int]$Port = 80,
    [string]$HostName = "",
    [string]$PhysicalPath = "D:\Websites\NOOR-CANVAS",
    [switch]$RemoveExisting
)

# Requires Administrator privileges
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n[STEP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  NoorCanvas IIS Setup Script" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    # Import WebAdministration module
    Write-Step "Loading IIS modules..."
    Import-Module WebAdministration
    Write-Success "IIS modules loaded"

    # Verify physical path exists
    Write-Step "Verifying physical path..."
    if (-not (Test-Path $PhysicalPath)) {
        Write-Warning "Physical path does not exist: $PhysicalPath"
        $create = Read-Host "Create directory? (Y/N)"
        if ($create -eq "Y" -or $create -eq "y") {
            New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null
            Write-Success "Created directory: $PhysicalPath"
        } else {
            throw "Physical path must exist before continuing"
        }
    } else {
        Write-Success "Physical path exists: $PhysicalPath"
    }

    # Remove existing configuration if requested
    if ($RemoveExisting) {
        Write-Step "Removing existing configuration..."
        
        # Remove website
        if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
            Remove-Website -Name $SiteName
            Write-Success "Removed existing website: $SiteName"
        }
        
        # Remove app pool
        if (Test-Path "IIS:\AppPools\$AppPoolName") {
            Remove-WebAppPool -Name $AppPoolName
            Write-Success "Removed existing app pool: $AppPoolName"
        }
        
        Start-Sleep -Seconds 2
    }

    # Create Application Pool
    Write-Step "Configuring Application Pool: $AppPoolName..."
    
    if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
        New-WebAppPool -Name $AppPoolName
        Write-Success "Created application pool"
    } else {
        Write-Warning "Application pool already exists, updating configuration..."
    }

    # Configure App Pool settings
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "managedPipelineMode" -Value "Integrated"
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "startMode" -Value "AlwaysRunning"
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "processModel.idleTimeout" -Value ([TimeSpan]::FromMinutes(20))
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "recycling.periodicRestart.time" -Value ([TimeSpan]::Zero)
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "recycling.periodicRestart.requests" -Value 0
    
    # Enable 32-bit applications (set to False for 64-bit only)
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "enable32BitAppOnWin64" -Value $false
    
    Write-Success "Configured application pool settings:"
    Write-Host "  - No Managed Code (ASP.NET Core)" -ForegroundColor Gray
    Write-Host "  - Integrated Pipeline" -ForegroundColor Gray
    Write-Host "  - Always Running" -ForegroundColor Gray
    Write-Host "  - 20 minute idle timeout" -ForegroundColor Gray
    Write-Host "  - No periodic recycling" -ForegroundColor Gray

    # Create Website
    Write-Step "Configuring Website: $SiteName..."
    
    if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) {
        $bindingInfo = if ($HostName) {
            @{
                name = $SiteName
                physicalPath = $PhysicalPath
                applicationPool = $AppPoolName
                port = $Port
                hostHeader = $HostName
            }
        } else {
            @{
                name = $SiteName
                physicalPath = $PhysicalPath
                applicationPool = $AppPoolName
                port = $Port
            }
        }
        
        New-Website @bindingInfo
        Write-Success "Created website"
    } else {
        Write-Warning "Website already exists, updating configuration..."
        Set-ItemProperty -Path "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $PhysicalPath
        Set-ItemProperty -Path "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
    }

    # Configure Website settings
    Set-ItemProperty -Path "IIS:\Sites\$SiteName" -Name "serverAutoStart" -Value $true
    
    Write-Success "Configured website settings"

    # Enable WebSocket support
    Write-Step "Enabling WebSocket support..."
    
    $webSocketFeature = Get-WindowsOptionalFeature -Online -FeatureName "IIS-WebSockets" -ErrorAction SilentlyContinue
    if ($webSocketFeature -and $webSocketFeature.State -eq "Enabled") {
        Write-Success "WebSocket feature is enabled"
    } else {
        Write-Warning "WebSocket feature is not enabled. SignalR may not work properly."
        Write-Host "  Run: Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets" -ForegroundColor Yellow
    }

    # Set request limits
    Write-Step "Configuring request limits..."
    
    try {
        Set-WebConfigurationProperty -PSPath "IIS:\Sites\$SiteName" `
            -Filter "system.webServer/security/requestFiltering/requestLimits" `
            -Name "maxAllowedContentLength" -Value 104857600  # 100MB
        
        Write-Success "Set max request size to 100MB"
    } catch {
        Write-Warning "Could not configure request limits. This can be set manually in web.config if needed."
    }

    # Configure ASP.NET Core Module
    Write-Step "Configuring ASP.NET Core Module..."
    
    # Ensure web.config exists
    $webConfigPath = Join-Path $PhysicalPath "web.config"
    if (-not (Test-Path $webConfigPath)) {
        Write-Warning "web.config not found. Creating default configuration..."
        
        $defaultWebConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <webSocket enabled="true" />
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" 
                  arguments=".\NoorCanvas.dll" 
                  stdoutLogEnabled="true" 
                  stdoutLogFile=".\logs\stdout" 
                  hostingModel="InProcess" />
    </system.webServer>
  </location>
</configuration>
"@
        
        $defaultWebConfig | Out-File -FilePath $webConfigPath -Encoding UTF8
        Write-Success "Created default web.config"
    } else {
        Write-Success "web.config already exists"
    }

    # Start the website and app pool
    Write-Step "Starting website and application pool..."
    
    try {
        Start-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
    } catch {
        # Already started
    }
    
    try {
        Start-Website -Name $SiteName -ErrorAction SilentlyContinue
    } catch {
        # Already started
    }
    
    Start-Sleep -Seconds 2
    
    $poolState = (Get-WebAppPoolState -Name $AppPoolName).Value
    $siteState = (Get-Website -Name $SiteName).State
    
    Write-Success "Application pool state: $poolState"
    Write-Success "Website state: $siteState"

    # Configure hosts file (optional)
    if ($HostName -and $HostName -ne "localhost") {
        Write-Step "Hosts file configuration..."
        $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
        $hostsContent = Get-Content $hostsPath
        $hostEntry = "127.0.0.1    $HostName"
        
        if ($hostsContent -notcontains $hostEntry) {
            Write-Warning "To access the site via hostname, add to hosts file:"
            Write-Host "  $hostEntry" -ForegroundColor Yellow
            Write-Host "  File: $hostsPath" -ForegroundColor Gray
        } else {
            Write-Success "Hosts file entry already exists"
        }
    }

    # Summary
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  IIS SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Magenta
    
    Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
    Write-Host "  Site Name: $SiteName" -ForegroundColor White
    Write-Host "  App Pool: $AppPoolName" -ForegroundColor White
    Write-Host "  Physical Path: $PhysicalPath" -ForegroundColor White
    Write-Host "  Port: $Port" -ForegroundColor White
    if ($HostName) {
        Write-Host "  Host Name: $HostName" -ForegroundColor White
        Write-Host "  URL: http://${HostName}:$Port" -ForegroundColor White
    } else {
        Write-Host "  URL: http://localhost:$Port" -ForegroundColor White
    }
    
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Deploy the application using: .\ncdeploy.ps1" -ForegroundColor Gray
    Write-Host "  2. Verify the website is accessible" -ForegroundColor Gray
    Write-Host "  3. Check application logs for any errors" -ForegroundColor Gray
    Write-Host "  4. Configure SSL certificate if needed" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  IIS SETUP FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Error $_.Exception.Message
    Write-Host "`nError Details:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
