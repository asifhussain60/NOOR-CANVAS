# Production Setup Guide

Complete guide for deploying NOOR Canvas to production environment.

## Production Architecture

### Server Requirements
- **Operating System**: Windows Server 2019/2022
- **IIS**: Version 10.0 or later with ASP.NET Core hosting bundle
- **Database**: SQL Server 2019/2022 (AHHOME server)
- **.NET Runtime**: .NET 8.0 hosting bundle
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Database Setup

#### Production Databases
```sql
-- Primary application database
Server: AHHOME
Database: KSESSIONS_DEV (development)
Schema: canvas (NOOR Canvas tables)

-- Cross-application integration  
Database: KQUR (production)
Schema: dbo (Beautiful Islam integration)
```

#### Connection Strings
```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=[SECURE];Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;",
    "KSessionsDb": "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=[SECURE];Connection Timeout=3600;TrustServerCertificate=True;Encrypt=False;"
  }
}
```

## IIS Configuration

### Application Pool Setup
```xml
<!-- Application Pool Configuration -->
<applicationPool name="NoorCanvasPool">
    <processModel 
        identityType="ApplicationPoolIdentity"
        idleTimeout="00:00:00"
        maxProcesses="1" />
    <recycling>
        <periodicRestart time="1.00:00:00" />
    </recycling>
</applicationPool>
```

### Site Configuration
```xml
<!-- IIS Site Configuration -->
<site name="NOOR Canvas Production" id="1">
    <application path="/" applicationPool="NoorCanvasPool">
        <virtualDirectory path="/" physicalPath="C:\inetpub\wwwroot\NoorCanvas" />
    </application>
    <bindings>
        <binding protocol="https" bindingInformation="*:443:" sslFlags="0" />
        <binding protocol="http" bindingInformation="*:80:" />
    </bindings>
</site>
```

## Deployment Process

### 1. Build for Production
```powershell
# Clean and build for production
dotnet clean
dotnet publish -c Release -r win-x64 --self-contained false -o "./publish"
```

### 2. Database Migration
```powershell
# Run Entity Framework migrations
dotnet ef database update --context CanvasDbContext --connection "Server=AHHOME;Database=KSESSIONS;..."
```

### 3. File Deployment
```powershell
# Copy files to production server
Copy-Item "publish/*" -Destination "\\ProductionServer\C$\inetpub\wwwroot\NoorCanvas\" -Recurse -Force
```

### 4. IIS Setup Commands
```powershell
# Import IIS module and configure
Import-Module IISAdministration

# Create application pool
New-IISAppPool -Name "NoorCanvasPool"
Set-IISAppPool -Name "NoorCanvasPool" -ProcessModel @{identityType="ApplicationPoolIdentity"}

# Create website
New-IISSite -Name "NOOR Canvas Production" -PhysicalPath "C:\inetpub\wwwroot\NoorCanvas" -Port 80 -Protocol http
```

## Security Configuration

### SSL Certificate Setup
```powershell
# Install SSL certificate
Import-PfxCertificate -FilePath "certificate.pfx" -CertStoreLocation Cert:\LocalMachine\My -Password $securePassword

# Bind certificate to site
New-IISSiteBinding -Name "NOOR Canvas Production" -Protocol https -Port 443 -CertificateThumbprint $thumbprint
```

### Firewall Configuration
```powershell
# Configure Windows Firewall
New-NetFirewallRule -DisplayName "NOOR Canvas HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "NOOR Canvas HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## Environment Configuration

### Production Settings
```json
// appsettings.Production.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "SessionSettings": {
    "DefaultExpirationMinutes": 60,
    "MaxParticipants": 100,
    "RequireHostAuthentication": true
  },
  "SignalR": {
    "MaxBufferSize": 32768,
    "KeepAliveInterval": "00:00:30"
  }
}
```

### Environment Variables
```powershell
# Set production environment
[Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production", "Machine")
[Environment]::SetEnvironmentVariable("NOOR_CANVAS_ENV", "Production", "Machine")
```

## Performance Optimization

### IIS Optimization
```xml
<!-- web.config optimizations -->
<system.webServer>
    <httpCompression directory="%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files">
        <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" />
    </httpCompression>
    <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="30.00:00:00" />
    </staticContent>
</system.webServer>
```

### Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX IX_Sessions_CreatedAt ON canvas.Sessions (created_at DESC);
CREATE INDEX IX_Annotations_SessionId ON canvas.Annotations (session_id);
CREATE INDEX IX_Questions_SessionId ON canvas.Questions (session_id);
```

## Monitoring and Maintenance

### Health Monitoring
```csharp
// Health check endpoint configuration
app.MapHealthChecks("/healthz", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

### Log Management
```json
// Serilog configuration for production
{
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      {
        "Name": "File",
        "Args": {
          "path": "C:\\Logs\\NoorCanvas\\log-.txt",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ]
  }
}
```

### Backup Strategy
```powershell
# Automated backup script
$backupPath = "C:\Backups\NoorCanvas\$(Get-Date -Format 'yyyy-MM-dd')"
sqlcmd -S AHHOME -Q "BACKUP DATABASE KSESSIONS TO DISK = '$backupPath\KSESSIONS.bak'"
```

## Troubleshooting Production Issues

### Common Issues

#### "Application won't start"
1. Check Event Logs: `eventvwr.msc`
2. Verify .NET hosting bundle installation
3. Check application pool identity permissions
4. Validate connection strings

#### "Database connection issues"
1. Test connection from server: `sqlcmd -S AHHOME -U sa`
2. Check firewall rules for SQL Server
3. Verify sa account password
4. Test network connectivity

#### "SSL certificate problems"
1. Verify certificate installation: `Get-ChildItem Cert:\LocalMachine\My`
2. Check certificate binding: `netsh http show sslcert`
3. Validate certificate chain and expiration

### Performance Issues
1. **High CPU**: Check application pool recycling settings
2. **High Memory**: Monitor memory leaks and optimize garbage collection
3. **Slow Database**: Analyze query performance and add indexes
4. **Network Latency**: Optimize SignalR settings and connection management

## Deployment Checklist

### Pre-Deployment
- [ ] Build tests pass in Release configuration
- [ ] Database migration scripts prepared
- [ ] SSL certificates obtained and validated
- [ ] Production server prepared with IIS and .NET hosting bundle
- [ ] Backup of existing production database (if applicable)

### Deployment Steps
- [ ] Stop existing application pool
- [ ] Deploy application files
- [ ] Run database migrations
- [ ] Update configuration files
- [ ] Configure IIS bindings and certificates
- [ ] Start application pool
- [ ] Verify application health endpoint

### Post-Deployment
- [ ] Functional testing on production environment
- [ ] SSL certificate validation
- [ ] Performance monitoring setup
- [ ] Log monitoring configuration
- [ ] Backup verification
- [ ] Documentation updates

## Rollback Procedures

### Application Rollback
```powershell
# Stop current version
Stop-IISSite -Name "NOOR Canvas Production"

# Restore previous version
Copy-Item "\\BackupServer\NoorCanvas\Previous\*" -Destination "C:\inetpub\wwwroot\NoorCanvas\" -Recurse -Force

# Start application
Start-IISSite -Name "NOOR Canvas Production"
```

### Database Rollback
```sql
-- Restore previous database backup
RESTORE DATABASE KSESSIONS FROM DISK = 'C:\Backups\Previous\KSESSIONS.bak' WITH REPLACE;
```

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Check application logs for errors
- **Monthly**: Review performance metrics and optimization opportunities  
- **Quarterly**: Update SSL certificates and security patches
- **Annually**: Review and update backup and disaster recovery procedures

### Emergency Contacts
- **Database Admin**: [Contact information]
- **Network Admin**: [Contact information] 
- **Security Team**: [Contact information]
- **Development Team**: [Contact information]

*This production setup guide is maintained as deployment procedures evolve and improve.*
