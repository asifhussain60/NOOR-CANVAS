# IIS Configuration

## Overview

NOOR Canvas is designed for deployment on Internet Information Services (IIS) with ASP.NET Core hosting. This document covers the complete IIS configuration process for both development and production environments.

## Prerequisites

### Required Components

- **IIS 10.0** or later (Windows Server 2016/Windows 10 or newer)
- **ASP.NET Core Runtime** 8.0 or later
- **ASP.NET Core Hosting Bundle** for IIS integration
- **SQL Server** (or SQL Server Express) for database connectivity

### IIS Features Required

Enable these Windows Features:

- Internet Information Services
- World Wide Web Services
- Application Development Features
  - .NET Extensibility 4.8
  - ASP.NET 4.8
  - ISAPI Extensions
  - ISAPI Filters
- Common HTTP Features (all)
- HTTP Errors
- HTTP Logging
- HTTP Redirection
- Request Filtering
- Static Content

```powershell
# Enable required Windows features via PowerShell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ApplicationDevelopment, IIS-NetFx45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-ASPNET45
```

## Application Pool Configuration

### Create Dedicated Application Pool

```powershell
# Create new application pool for NOOR Canvas
New-WebAppPool -Name "NoorCanvasPool"

# Configure application pool settings
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name managedRuntimeVersion -Value ""  # No Managed Code for .NET Core
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name enable32BitAppOnWin64 -Value $false
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name processModel.idleTimeout -Value "00:00:00"  # Never idle
Set-ItemProperty -Path "IIS:\AppPools\NoorCanvasPool" -Name recycling.periodicRestart.time -Value "00:00:00"  # Never recycle
```

### Application Pool Identity Configuration

```powershell
# Grant file system permissions to application pool identity
$appPoolIdentity = "IIS AppPool\NoorCanvasPool"
$sitePath = "C:\inetpub\wwwroot\NoorCanvas"

# Grant full control to application files
icacls $sitePath /grant "${appPoolIdentity}:(OI)(CI)F" /T
```

## Web Site Configuration

### Create IIS Website

```powershell
# Remove default website if exists
Remove-Website -Name "Default Web Site" -ErrorAction SilentlyContinue

# Create NOOR Canvas website
New-Website -Name "NoorCanvas" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\NoorCanvas" -ApplicationPool "NoorCanvasPool"

# Add HTTPS binding
New-WebBinding -Name "NoorCanvas" -Protocol https -Port 443 -SslFlags 1
```

### Directory Structure Setup

```powershell
# Create application directory structure
$appRoot = "C:\inetpub\wwwroot\NoorCanvas"
New-Item -ItemType Directory -Path $appRoot -Force
New-Item -ItemType Directory -Path "$appRoot\logs" -Force
New-Item -ItemType Directory -Path "$appRoot\temp" -Force

# Set permissions
icacls "$appRoot\logs" /grant "${appPoolIdentity}:(OI)(CI)F" /T
icacls "$appRoot\temp" /grant "${appPoolIdentity}:(OI)(CI)F" /T
```

## SSL Certificate Configuration

### Development Environment (Self-Signed)

```powershell
# Create self-signed certificate for development
$cert = New-SelfSignedCertificate -DnsName "localhost", "noorcanvas.local" -CertStoreLocation "cert:\LocalMachine\My"

# Bind certificate to IIS site
New-WebBinding -Name "NoorCanvas" -Protocol https -Port 443
$binding = Get-WebBinding -Name "NoorCanvas" -Protocol https
$binding.AddSslCertificate($cert.GetCertHashString(), "my")
```

### Production Environment (CA Certificate)

```powershell
# Import purchased SSL certificate
$certPath = "C:\certificates\noorcanvas.pfx"
$certPassword = ConvertTo-SecureString "your-certificate-password" -AsPlainText -Force
Import-PfxCertificate -FilePath $certPath -CertStoreLocation "cert:\LocalMachine\My" -Password $certPassword

# Bind certificate (use actual thumbprint)
$certThumbprint = "YOUR-CERTIFICATE-THUMBPRINT"
New-WebBinding -Name "NoorCanvas" -Protocol https -Port 443 -SslFlags 1
netsh http add sslcert ipport=0.0.0.0:443 certhash=$certThumbprint appid="{YOUR-APP-GUID}"
```

## URL Rewrite Configuration

### HTTP to HTTPS Redirection

```xml
<!-- Add to web.config -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Redirect HTTP to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
            <add input="{HTTP_HOST}" pattern="localhost" negate="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### SignalR WebSocket Configuration

```xml
<!-- Enable WebSocket support in web.config -->
<configuration>
  <system.webServer>
    <webSocket enabled="true" />
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\NoorCanvas.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
      </environmentVariables>
    </aspNetCore>
  </system.webServer>
</configuration>
```

## Performance Configuration

### Compression Settings

```xml
<!-- Enable response compression -->
<configuration>
  <system.webServer>
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
    <httpCompression>
      <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
      <dynamicTypes>
        <add mimeType="application/json" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="text/css" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
```

### Caching Configuration

```xml
<!-- Static content caching -->
<configuration>
  <system.webServer>
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
```

## Security Configuration

### Request Filtering

```xml
<!-- Security settings in web.config -->
<configuration>
  <system.webServer>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" /> <!-- 50MB max request -->
        <fileExtensions>
          <remove fileExtension=".config" />
          <add fileExtension=".config" allowed="false" />
        </fileExtensions>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### Custom Headers

```xml
<!-- Security headers -->
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
        <remove name="Server" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

## Database Connection Configuration

### Connection String Security

```xml
<!-- Secure connection strings in web.config -->
<configuration>
  <connectionStrings>
    <add name="DefaultConnection"
         connectionString="Data Source=YOUR-SQL-SERVER;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"
         providerName="System.Data.SqlClient" />
    <add name="KSessionsDb"
         connectionString="Data Source=YOUR-SQL-SERVER;Initial Catalog=KSESSIONS;Integrated Security=true;Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"
         providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>
```

### SQL Server Permissions

```sql
-- Create dedicated IIS application pool login
USE [master]
CREATE LOGIN [IIS AppPool\NoorCanvasPool] FROM WINDOWS
GO

-- Grant database access
USE [KSESSIONS]
CREATE USER [IIS AppPool\NoorCanvasPool] FOR LOGIN [IIS AppPool\NoorCanvasPool]
ALTER ROLE [db_datareader] ADD MEMBER [IIS AppPool\NoorCanvasPool]
ALTER ROLE [db_datawriter] ADD MEMBER [IIS AppPool\NoorCanvasPool]
GO

-- Grant canvas schema permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::canvas TO [IIS AppPool\NoorCanvasPool]
GO
```

## Monitoring and Logging

### IIS Logging Configuration

```powershell
# Enable detailed IIS logging
Set-WebConfigurationProperty -Filter "system.webServer/httpLogging" -Name enabled -Value $true
Set-WebConfigurationProperty -Filter "system.webServer/httpLogging" -Name logExtFileFlags -Value "Date,Time,ClientIP,UserName,SiteName,ComputerName,ServerIP,Method,UriStem,UriQuery,HttpStatus,Win32Status,BytesSent,BytesRecv,TimeTaken,ServerPort,UserAgent,Cookie,Referer,ProtocolVersion,Host,HttpSubStatus"
```

### Application Logging

```json
// Configure structured logging in appsettings.Production.json
{
  "Serilog": {
    "Using": ["Serilog.Sinks.File", "Serilog.Sinks.EventLog"],
    "MinimumLevel": "Information",
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "C:\\inetpub\\wwwroot\\NoorCanvas\\logs\\noor-canvas-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      },
      {
        "Name": "EventLog",
        "Args": {
          "source": "NOOR Canvas",
          "logName": "Application"
        }
      }
    ]
  }
}
```

## Health Monitoring

### Application Health Checks

```csharp
// Configure health checks in Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<CanvasDbContext>()
    .AddDbContextCheck<KSessionsDbContext>()
    .AddSignalRHub<SessionHub>();

// Map health check endpoint
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### IIS Application Initialization

```xml
<!-- Warm up application on startup -->
<configuration>
  <system.webServer>
    <applicationInitialization doAppInitAfterRestart="true">
      <add initializationPage="/health" />
    </applicationInitialization>
  </system.webServer>
</configuration>
```

## Troubleshooting Common Issues

### Application Pool Crashes

```powershell
# Check Windows Event Log
Get-WinEvent -LogName System | Where-Object {$_.LevelDisplayName -eq "Error" -and $_.TimeCreated -gt (Get-Date).AddHours(-1)}

# Check IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-String "500"
```

### Performance Issues

```powershell
# Monitor application pool performance
Get-Counter "\Process(w3wp*)\% Processor Time"
Get-Counter "\Process(w3wp*)\Working Set"
Get-Counter "\Process(w3wp*)\Handle Count"
```

### Database Connection Issues

```csharp
// Test database connectivity
using var connection = new SqlConnection(connectionString);
try
{
    await connection.OpenAsync();
    Console.WriteLine("Database connection successful");
}
catch (Exception ex)
{
    Console.WriteLine($"Database connection failed: {ex.Message}");
}
```

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Log Rotation**: Archive and clean old log files
2. **Certificate Renewal**: Update SSL certificates before expiration
3. **Security Updates**: Apply Windows and IIS updates
4. **Performance Monitoring**: Review performance metrics regularly

### Backup and Recovery

```powershell
# Backup IIS configuration
Backup-WebConfiguration -Name "NoorCanvas-$(Get-Date -Format 'yyyyMMdd')"

# Backup application files
Copy-Item "C:\inetpub\wwwroot\NoorCanvas" "C:\Backups\NoorCanvas-$(Get-Date -Format 'yyyyMMdd')" -Recurse
```

For database-specific deployment procedures, see the [Database Setup Guide](database-setup.md).
For complete production deployment procedures, see the [Production Deployment Guide](production-deployment.md).
