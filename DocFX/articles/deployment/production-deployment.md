# Production Deployment

## Overview

This guide covers the complete production deployment process for NOOR Canvas, including server preparation, application deployment, database migration, and post-deployment verification. The deployment follows a staged approach to minimize downtime and ensure system reliability.

## Deployment Architecture

### Production Environment Requirements

- **Web Server**: Windows Server 2019/2022 with IIS 10.0+
- **Application Framework**: ASP.NET Core 8.0 Runtime + Hosting Bundle
- **Database Server**: SQL Server 2019+ (Standard or Enterprise Edition)
- **Load Balancer**: Optional (for high availability scenarios)
- **SSL Certificate**: Valid CA-issued certificate for HTTPS

### Network Architecture

```
Internet → Load Balancer (Optional) → IIS Web Server → SQL Server Database
                                   ↓
                            Application Files + Logs
```

### Server Specifications

#### Minimum Requirements (Small Scale: <100 concurrent users)

- **CPU**: 4 cores @ 2.4 GHz
- **RAM**: 8 GB
- **Storage**: 100 GB SSD (OS + Application + Logs)
- **Network**: 100 Mbps

#### Recommended Requirements (Medium Scale: 100-500 concurrent users)

- **CPU**: 8 cores @ 3.0 GHz
- **RAM**: 16 GB
- **Storage**: 500 GB SSD (OS + Application + Logs)
- **Network**: 1 Gbps

#### High Availability Requirements (Large Scale: 500+ concurrent users)

- **CPU**: 16+ cores @ 3.2 GHz
- **RAM**: 32+ GB
- **Storage**: 1 TB SSD (OS), 500 GB SSD (Application), 1 TB SSD (Logs)
- **Network**: 10 Gbps
- **Redundancy**: Multiple web servers behind load balancer

## Pre-Deployment Checklist

### Infrastructure Preparation

- [ ] Windows Server 2019/2022 installed and updated
- [ ] IIS role installed with required features
- [ ] .NET 8.0 Runtime and ASP.NET Core Hosting Bundle installed
- [ ] SQL Server 2019+ installed and configured
- [ ] SSL certificate obtained and verified
- [ ] Firewall rules configured (ports 80, 443, 1433)
- [ ] DNS records configured
- [ ] Backup strategy implemented

### Application Preparation

- [ ] Code repository tagged with release version
- [ ] Build artifacts generated and tested
- [ ] Database scripts validated
- [ ] Configuration files prepared for production
- [ ] Deployment scripts tested in staging environment
- [ ] Performance baseline established
- [ ] Security scan completed
- [ ] Documentation updated

## Deployment Process

### Phase 1: Database Deployment

#### 1. Create Production Databases

```powershell
# Connect to production SQL Server as sysadmin
# Execute database creation scripts
Invoke-Sqlcmd -ServerInstance "PROD-SQL-01" -Query @"
CREATE DATABASE [KSESSIONS]
ON
( NAME = N'KSESSIONS',
  FILENAME = N'E:\Data\KSESSIONS.mdf',
  SIZE = 500MB,
  MAXSIZE = 10GB,
  FILEGROWTH = 50MB )
LOG ON
( NAME = N'KSESSIONS_Log',
  FILENAME = N'F:\Logs\KSESSIONS_Log.ldf',
  SIZE = 50MB,
  MAXSIZE = 1GB,
  FILEGROWTH = 10MB );

CREATE DATABASE [KQUR]
ON
( NAME = N'KQUR',
  FILENAME = N'E:\Data\KQUR.mdf',
  SIZE = 1GB,
  MAXSIZE = 20GB,
  FILEGROWTH = 100MB )
LOG ON
( NAME = N'KQUR_Log',
  FILENAME = N'F:\Logs\KQUR_Log.ldf',
  SIZE = 100MB,
  MAXSIZE = 2GB,
  FILEGROWTH = 20MB );
"@
```

#### 2. Create Service Accounts

```powershell
# Create dedicated Windows service account
New-LocalUser -Name "noor-canvas-svc" -Description "NOOR Canvas Application Service Account" -NoPassword
Add-LocalGroupMember -Group "IIS_IUSRS" -Member "noor-canvas-svc"

# Create SQL Server login and permissions
Invoke-Sqlcmd -ServerInstance "PROD-SQL-01" -Query @"
CREATE LOGIN [SERVER\noor-canvas-svc] FROM WINDOWS;

USE [KSESSIONS];
CREATE USER [SERVER\noor-canvas-svc] FOR LOGIN [SERVER\noor-canvas-svc];
ALTER ROLE [db_owner] ADD MEMBER [SERVER\noor-canvas-svc];

USE [KQUR];
CREATE USER [SERVER\noor-canvas-svc] FOR LOGIN [SERVER\noor-canvas-svc];
ALTER ROLE [db_datareader] ADD MEMBER [SERVER\noor-canvas-svc];
"@
```

#### 3. Deploy Database Schema

```powershell
# Deploy Entity Framework migrations to production
cd "C:\Deployment\NoorCanvas"
dotnet ef database update --context CanvasDbContext --connection "Data Source=PROD-SQL-01;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;"
```

### Phase 2: Application Server Preparation

#### 1. Configure IIS Application Pool

```powershell
# Import IIS module
Import-Module WebAdministration

# Create dedicated application pool
New-WebAppPool -Name "NoorCanvasPool"
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.identityType -Value SpecificUser
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.userName -Value "SERVER\noor-canvas-svc"
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.password -Value "SERVICE-ACCOUNT-PASSWORD"
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name managedRuntimeVersion -Value ""
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name enable32BitAppOnWin64 -Value $false
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.idleTimeout -Value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name recycling.periodicRestart.time -Value "00:00:00"
```

#### 2. Create IIS Website

```powershell
# Remove default website if exists
Remove-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

# Create application directory
$appPath = "C:\inetpub\wwwroot\NoorCanvas"
New-Item -ItemType Directory -Path $appPath -Force
New-Item -ItemType Directory -Path "$appPath\logs" -Force

# Set permissions
$acl = Get-Acl $appPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("SERVER\noor-canvas-svc", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl -Path $appPath -AclObject $acl

# Create website
New-Website -Name "NoorCanvas" -Port 80 -PhysicalPath $appPath -ApplicationPool "NoorCanvasPool"
```

#### 3. Configure SSL Certificate

```powershell
# Import production SSL certificate
$certPath = "C:\Certificates\noorcanvas-prod.pfx"
$certPassword = ConvertTo-SecureString "CERTIFICATE-PASSWORD" -AsPlainText -Force
$cert = Import-PfxCertificate -FilePath $certPath -CertStoreLocation "cert:\LocalMachine\My" -Password $certPassword

# Create HTTPS binding
New-WebBinding -Name "NoorCanvas" -Protocol https -Port 443 -SslFlags 1
$binding = Get-WebBinding -Name "NoorCanvas" -Protocol https
$binding.AddSslCertificate($cert.Thumbprint, "my")

# Configure HTTP to HTTPS redirection
# (This will be handled by web.config in the application)
```

### Phase 3: Application Deployment

#### 1. Stop Application Pool

```powershell
# Gracefully stop application pool
Stop-WebAppPool -Name "NoorCanvasPool"
Start-Sleep -Seconds 30  # Allow existing connections to complete
```

#### 2. Deploy Application Files

```powershell
# Backup existing application (if updating)
$backupPath = "C:\Backups\NoorCanvas-$(Get-Date -Format 'yyyyMMdd-HHmm')"
if (Test-Path "C:\inetpub\wwwroot\NoorCanvas") {
    Copy-Item "C:\inetpub\wwwroot\NoorCanvas" $backupPath -Recurse
}

# Deploy new application files
$sourcePath = "C:\Deployment\NoorCanvas\publish"
$targetPath = "C:\inetpub\wwwroot\NoorCanvas"

# Clear existing files (preserve logs directory)
Get-ChildItem $targetPath -Exclude "logs" | Remove-Item -Recurse -Force

# Copy new files
Copy-Item "$sourcePath\*" $targetPath -Recurse -Force
```

#### 3. Configure Production Settings

```powershell
# Create production configuration
$prodConfig = @{
    "ConnectionStrings" = @{
        "DefaultConnection" = "Data Source=PROD-SQL-01;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=True;"
        "KSessionsDb" = "Data Source=PROD-SQL-01;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=True;"
    }
    "Serilog" = @{
        "MinimumLevel" = "Information"
        "WriteTo" = @(
            @{
                "Name" = "File"
                "Args" = @{
                    "path" = "C:\inetpub\wwwroot\NoorCanvas\logs\noor-canvas-.txt"
                    "rollingInterval" = "Day"
                    "retainedFileCountLimit" = 30
                }
            }
            @{
                "Name" = "EventLog"
                "Args" = @{
                    "source" = "NOOR Canvas"
                    "logName" = "Application"
                }
            }
        )
    }
    "AllowedHosts" = "noorcanvas.yourdomain.com"
}

$prodConfigJson = $prodConfig | ConvertTo-Json -Depth 10
Set-Content -Path "C:\inetpub\wwwroot\NoorCanvas\appsettings.Production.json" -Value $prodConfigJson
```

#### 4. Configure Web.config

```xml
<!-- Create optimized web.config for production -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet"
                  arguments=".\NoorCanvas.dll"
                  stdoutLogEnabled="false"
                  stdoutLogFile=".\logs\stdout"
                  hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
        </environmentVariables>
      </aspNetCore>

      <!-- Security Headers -->
      <httpProtocol>
        <customHeaders>
          <add name="X-Content-Type-Options" value="nosniff" />
          <add name="X-Frame-Options" value="DENY" />
          <add name="X-XSS-Protection" value="1; mode=block" />
          <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
          <remove name="Server" />
        </customHeaders>
      </httpProtocol>

      <!-- HTTP to HTTPS Redirection -->
      <rewrite>
        <rules>
          <rule name="Redirect HTTP to HTTPS" stopProcessing="true">
            <match url="(.*)" />
            <conditions>
              <add input="{HTTPS}" pattern="off" ignoreCase="true" />
            </conditions>
            <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
          </rule>
        </rules>
      </rewrite>

      <!-- Response Compression -->
      <urlCompression doStaticCompression="true" doDynamicCompression="true" />
      <httpCompression>
        <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
        <dynamicTypes>
          <add mimeType="application/json" enabled="true" />
          <add mimeType="application/javascript" enabled="true" />
        </dynamicTypes>
      </httpCompression>

      <!-- Static Content Caching -->
      <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
      </staticContent>

      <!-- WebSocket Support for SignalR -->
      <webSocket enabled="true" />

      <!-- Application Initialization -->
      <applicationInitialization doAppInitAfterRestart="true">
        <add initializationPage="/health" />
      </applicationInitialization>
    </system.webServer>
  </location>
</configuration>
```

### Phase 4: Service Startup and Validation

#### 1. Start Application Pool

```powershell
# Start application pool
Start-WebAppPool -Name "NoorCanvasPool"

# Wait for startup
Start-Sleep -Seconds 60

# Verify application pool status
$poolStatus = Get-WebAppPoolState -Name "NoorCanvasPool"
Write-Host "Application Pool Status: $($poolStatus.Value)"
```

#### 2. Health Check Validation

```powershell
# Test HTTP health endpoint (should redirect to HTTPS)
try {
    $httpResponse = Invoke-WebRequest -Uri "http://noorcanvas.yourdomain.com/health" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    Write-Host "HTTP Redirect Status: $($httpResponse.StatusCode)" # Should be 301/302
} catch {
    Write-Host "HTTP redirect working (expected redirect error)"
}

# Test HTTPS health endpoint
$httpsResponse = Invoke-WebRequest -Uri "https://noorcanvas.yourdomain.com/health"
Write-Host "HTTPS Health Check Status: $($httpsResponse.StatusCode)" # Should be 200
Write-Host "Health Check Response: $($httpsResponse.Content)"
```

#### 3. Database Connectivity Test

```powershell
# Test database connections using application context
$testScript = @"
using System;
using System.Data.SqlClient;

string connectionString = "Data Source=PROD-SQL-01;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;";

try
{
    using (var connection = new SqlConnection(connectionString))
    {
        connection.Open();
        using (var command = new SqlCommand("SELECT COUNT(*) FROM canvas.Sessions", connection))
        {
            var result = command.ExecuteScalar();
            Console.WriteLine($"Database connectivity successful. Sessions count: {result}");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database connectivity failed: {ex.Message}");
    Environment.Exit(1);
}
"@

# Execute database test
dotnet-script eval "$testScript"
```

### Phase 5: Performance and Load Testing

#### 1. Performance Baseline

```powershell
# Use Apache Bench for initial load testing
# Install: choco install apache-httpd (if not available, use alternatives)

# Test static content performance
ab -n 1000 -c 10 https://noorcanvas.yourdomain.com/

# Test health endpoint performance
ab -n 1000 -c 10 https://noorcanvas.yourdomain.com/health

# Test SignalR connection establishment (requires custom script)
```

#### 2. SignalR Load Testing

```csharp
// Create SignalR load test script (simplified example)
using Microsoft.AspNetCore.SignalR.Client;

var connection = new HubConnectionBuilder()
    .WithUrl("https://noorcanvas.yourdomain.com/hub/session")
    .Build();

await connection.StartAsync();
Console.WriteLine("SignalR connection established successfully");

// Test basic hub connectivity
await connection.InvokeAsync("JoinSession", "test-session-guid");
Console.WriteLine("SignalR method invocation successful");

await connection.DisposeAsync();
```

## Post-Deployment Configuration

### Monitoring Setup

#### 1. Windows Event Log Configuration

```powershell
# Create custom event log source for NOOR Canvas
New-EventLog -LogName Application -Source "NOOR Canvas"
```

#### 2. Performance Counter Monitoring

```powershell
# Monitor key performance counters
$counters = @(
    "\Processor(_Total)\% Processor Time",
    "\Memory\Available MBytes",
    "\Web Service(NoorCanvas)\Current Connections",
    "\ASP.NET Apps v4.0.30319(_LM_W3SVC_1_ROOT)\Requests/Sec"
)

# Create baseline performance report
Get-Counter -Counter $counters -SampleInterval 5 -MaxSamples 12 | Export-Counter -Path "C:\Monitoring\baseline-performance.csv"
```

#### 3. Log Rotation Configuration

```powershell
# Schedule log cleanup task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-Command ""Get-ChildItem 'C:\inetpub\wwwroot\NoorCanvas\logs\*.txt' | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item -Force"""
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "NoorCanvas-LogCleanup" -Action $action -Trigger $trigger -Principal $principal
```

### Security Hardening

#### 1. Firewall Configuration

```powershell
# Configure Windows Firewall rules
New-NetFirewallRule -DisplayName "NoorCanvas HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "NoorCanvas HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Restrict SQL Server access to application server only
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -RemoteAddress "APP-SERVER-IP" -Action Allow
```

#### 2. SQL Server Security

```sql
-- Disable unnecessary SQL Server features
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 0;
EXEC sp_configure 'Ole Automation Procedures', 0;
RECONFIGURE;

-- Enable SQL Server Audit (if required)
CREATE SERVER AUDIT NoorCanvas_Audit
TO FILE (FILEPATH = 'F:\Audit\', MAXSIZE = 100MB, MAX_FILES = 10);
ALTER SERVER AUDIT NoorCanvas_Audit WITH (STATE = ON);
```

## Backup and Disaster Recovery

### Automated Backup Strategy

```powershell
# Database backup script
$backupScript = @"
BACKUP DATABASE [KSESSIONS]
TO DISK = 'F:\Backups\KSESSIONS_Full.bak'
WITH FORMAT, INIT, COMPRESSION,
NAME = 'KSESSIONS Production Full Backup - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')';

BACKUP LOG [KSESSIONS]
TO DISK = 'F:\Backups\KSESSIONS_Log.trn'
WITH FORMAT, INIT,
NAME = 'KSESSIONS Transaction Log Backup - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')';
"@

# Schedule daily full backup
$action = New-ScheduledTaskAction -Execute "sqlcmd.exe" -Argument "-S PROD-SQL-01 -Q ""$backupScript"""
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "NoorCanvas-DatabaseBackup" -Action $action -Trigger $trigger
```

### Application File Backup

```powershell
# Application files backup script
$appBackupScript = {
    $backupPath = "D:\Backups\NoorCanvas-$(Get-Date -Format 'yyyyMMdd')"
    Copy-Item "C:\inetpub\wwwroot\NoorCanvas" $backupPath -Recurse -Exclude "logs"

    # Compress backup
    Compress-Archive -Path $backupPath -DestinationPath "$backupPath.zip"
    Remove-Item $backupPath -Recurse -Force

    # Clean old backups (keep 7 days)
    Get-ChildItem "D:\Backups\NoorCanvas-*.zip" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
}

# Schedule weekly application backup
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-Command ""& {$($appBackupScript.ToString())}"""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM
Register-ScheduledTask -TaskName "NoorCanvas-AppBackup" -Action $action -Trigger $trigger
```

## Rollback Procedures

### Emergency Rollback Plan

```powershell
# Stop application
Stop-WebAppPool -Name "NoorCanvasPool"

# Restore previous version from backup
$rollbackSource = "C:\Backups\NoorCanvas-YYYYMMDD-HHMM"  # Replace with actual backup
$targetPath = "C:\inetpub\wwwroot\NoorCanvas"

# Clear current version (preserve logs)
Get-ChildItem $targetPath -Exclude "logs" | Remove-Item -Recurse -Force

# Restore backup
Copy-Item "$rollbackSource\*" $targetPath -Recurse -Force

# Rollback database if needed (point-in-time recovery)
# NOTE: This requires careful consideration and should be tested in staging

# Start application
Start-WebAppPool -Name "NoorCanvasPool"

# Verify rollback
Start-Sleep -Seconds 60
Invoke-WebRequest -Uri "https://noorcanvas.yourdomain.com/health"
```

## Production Maintenance

### Regular Maintenance Tasks

1. **Daily**: Review application logs for errors
2. **Weekly**: Check performance counters and resource utilization
3. **Monthly**: Update SSL certificates if needed, review security logs
4. **Quarterly**: Update .NET runtime and security patches
5. **Annually**: Review and update disaster recovery procedures

### Health Monitoring Dashboard

```powershell
# Create monitoring script for operational dashboard
$monitoringScript = {
    $report = @{
        Timestamp = Get-Date
        AppPoolStatus = (Get-WebAppPoolState -Name "NoorCanvasPool").Value
        WebsiteStatus = (Get-Website -Name "NoorCanvas").State
        DatabaseConnectivity = "Unknown"
        CertificateExpiry = "Unknown"
    }

    # Test database connectivity
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection("Data Source=PROD-SQL-01;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=10;")
        $connection.Open()
        $connection.Close()
        $report.DatabaseConnectivity = "Success"
    } catch {
        $report.DatabaseConnectivity = "Failed: $($_.Exception.Message)"
    }

    # Check SSL certificate expiry
    try {
        $cert = Get-ChildItem "cert:\LocalMachine\My" | Where-Object {$_.Subject -like "*noorcanvas*"}
        $daysUntilExpiry = ($cert.NotAfter - (Get-Date)).Days
        $report.CertificateExpiry = "$daysUntilExpiry days"
    } catch {
        $report.CertificateExpiry = "Error checking certificate"
    }

    $report | ConvertTo-Json | Out-File "C:\Monitoring\health-report-$(Get-Date -Format 'yyyyMMdd-HHmm').json"
}

# Schedule monitoring every 15 minutes
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-Command ""& {$($monitoringScript.ToString())}"""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName "NoorCanvas-HealthMonitoring" -Action $action -Trigger $trigger
```

For detailed IIS configuration steps, see the [IIS Configuration Guide](iis-configuration.md).
For database-specific deployment procedures, see the [Database Setup Guide](database-setup.md).

## Support and Troubleshooting

Contact the development team for production support issues:

- **Email**: support@noorcanvas.com
- **Documentation**: See technical documentation in DocFX site
- **Issue Tracking**: Use GitHub issues for non-critical problems
- **Emergency**: Follow escalation procedures in operations manual
