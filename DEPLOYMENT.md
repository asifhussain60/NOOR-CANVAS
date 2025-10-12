# NoorCanvas Deployment Guide

This guide covers the deployment process for the NoorCanvas application to the production environment.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Prerequisites

### System Requirements

- **Operating System**: Windows Server 2016+ or Windows 10/11
- **IIS**: Version 10.0 or higher
- **.NET Runtime**: .NET 8.0 Runtime (ASP.NET Core)
- **Database**: SQL Server (configured connection string)
- **PowerShell**: Version 5.1 or higher
- **Permissions**: Administrator access for IIS configuration

### Required IIS Features

Ensure the following IIS features are installed:

```powershell
# Check if WebSocket feature is installed
Get-WindowsOptionalFeature -Online -FeatureName "IIS-WebSockets"

# Install if needed
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
```

### ASP.NET Core Hosting Bundle

Download and install from: https://dotnet.microsoft.com/download/dotnet/8.0

---

## Initial Setup

### 1. Configure IIS

Run the IIS setup script with administrator privileges:

```powershell
# Standard setup (default port 80)
.\setup-iis.ps1

# Custom configuration
.\setup-iis.ps1 -Port 8080 -HostName "noorcanvas.local"

# Remove and recreate existing configuration
.\setup-iis.ps1 -RemoveExisting
```

#### Script Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-SiteName` | IIS website name | "NoorCanvas" |
| `-AppPoolName` | Application pool name | "NoorCanvas" |
| `-Port` | HTTP port | 80 |
| `-HostName` | Host header (optional) | "" |
| `-PhysicalPath` | Application physical path | "D:\Websites\NOOR-CANVAS" |
| `-RemoveExisting` | Remove existing config | false |

### 2. Verify Configuration

After running the setup script, verify:

1. **Application Pool** exists and is running
2. **Website** is created and started
3. **Physical path** exists: `D:\Websites\NOOR-CANVAS`
4. **Backup directory** exists: `D:\Websites\NOOR-CANVAS-Backups`

### 3. Configure Production Settings

Edit `appsettings.Production.json` in the deployment directory:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=PRODUCTION_SERVER;Database=KSESSIONS_PROD;...",
    "KSessionsDb": "Server=PRODUCTION_SERVER;Database=KSESSIONS_PROD;...",
    "KQurDb": "Server=PRODUCTION_SERVER;Database=KQUR_PROD;..."
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Warning"
    }
  }
}
```

---

## Deployment Process

### Standard Deployment

```powershell
# Full deployment (recommended)
.\ncdeploy.ps1
```

This will:
1. ✅ Build the application in Release mode
2. ✅ Stop the IIS application pool
3. ✅ Create a timestamped backup
4. ✅ Deploy new files to `D:\Websites\NOOR-CANVAS`
5. ✅ **Automatically clean production wwwroot** (removes test/dev files)
6. ✅ Start the IIS application pool
7. ✅ Verify the deployment

### Deployment Options

```powershell
# Deploy without creating a backup (not recommended for production)
.\ncdeploy.ps1 -SkipBackup

# Deploy without IIS operations (for Kestrel standalone)
.\ncdeploy.ps1 -SkipIIS

# Quick redeploy without rebuilding (use existing publish output)
.\ncdeploy.ps1 -SkipBuild

# Custom app pool name
.\ncdeploy.ps1 -AppPool "MyCustomAppPool"

# Combined options
.\ncdeploy.ps1 -SkipBackup -AppPool "CustomPool"
```

### What Gets Deployed

The deployment script copies all published files **except**:

- `appsettings.Production.json` (preserved to keep production settings)
- `logs/` directory (existing logs are retained)

### Files Automatically Excluded from Production

The following development/test files are **never deployed** to production:

**wwwroot files excluded**:
- `FONT-SYSTEM-SUMMARY.md`
- `session-transcript-redirect.html`
- `session-transcript-styling.html`
- `session-transcript-viewer.html`
- `test-css.html`
- `test-fonts.html`
- `test-harness-demo.html`
- `test-issue-106.html`
- `testing/` folder

These files are automatically filtered during deployment and removed from production wwwroot if they exist.

### Backup Management

- Backups are stored in: `D:\Websites\NOOR-CANVAS-Backups\backup-[timestamp]`
- Only the **5 most recent backups** are kept
- Older backups are automatically deleted during deployment

---

## Database Management

### Fresh Start with Canvas Sessions

To clear all canvas session data in production without affecting legacy content:

```powershell
# Execute the truncation script
sqlcmd -S AHHOME -d KSESSIONS -i "Scripts\TruncateCanvasSessions.sql"

# Or use PowerShell
Invoke-Sqlcmd -ServerInstance "AHHOME" -Database "KSESSIONS" -InputFile "Scripts\TruncateCanvasSessions.sql" -Verbose
```

**What gets truncated**:
- ✅ `canvas.Sessions` - All canvas sessions
- ✅ `canvas.Participants` - All session participants  
- ✅ `canvas.SessionData` - All session data

**What gets preserved**:
- ✅ `canvas.AssetLookup` - Asset mapping reference
- ✅ **ALL `dbo.*` tables** - Legacy Islamic content (Sessions, Groups, Categories, etc.)

**Safety features**:
- Database validation (must be KSESSIONS)
- CASCADE DELETE verification
- dbo schema isolation check
- Transaction-safe with rollback on error
- Comprehensive before/after reporting

See [Scripts/README_TruncateCanvasSessions.md](Scripts/README_TruncateCanvasSessions.md) for detailed documentation.

---

## Rollback Procedure

### List Available Backups

```powershell
# Show all available backups
.\ncrollback.ps1
```

Output example:
```
Available Backups:
================================================================================
  1. backup-2025-10-12_15-30-45 (125.43 MB, Created: 10/12/2025 3:30:45 PM)
  2. backup-2025-10-12_14-15-20 (124.98 MB, Created: 10/12/2025 2:15:20 PM)
  3. backup-2025-10-12_10-05-10 (124.67 MB, Created: 10/12/2025 10:05:10 AM)
================================================================================
```

### Restore from Backup

```powershell
# Restore from most recent backup (with confirmation)
.\ncrollback.ps1 -Latest

# Restore from specific backup
.\ncrollback.ps1 -BackupName "backup-2025-10-12_14-15-20"

# Quick rollback without confirmation (use with caution!)
.\ncrollback.ps1 -Latest -Force

# Rollback without IIS operations
.\ncrollback.ps1 -Latest -SkipIIS
```

### Rollback Process

When you rollback:

1. ✅ Verifies backup integrity
2. ✅ Stops the IIS application pool
3. ✅ Creates a safety backup of current state (`pre-rollback-[timestamp]`)
4. ✅ Restores files from selected backup
5. ✅ Starts the IIS application pool
6. ✅ Verifies restoration

---

## Troubleshooting

### Common Issues

#### 1. Application Pool Won't Start

**Symptoms**: Pool starts then immediately stops

**Solutions**:
```powershell
# Check Event Viewer for errors
eventvwr.msc

# Check application logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-*.txt" -Tail 50

# Verify .NET runtime is installed
dotnet --list-runtimes

# Check web.config is valid
Test-Path "D:\Websites\NOOR-CANVAS\web.config"
```

#### 2. 502 Bad Gateway Error

**Causes**:
- Application crash on startup
- Incorrect `web.config` settings
- Database connection issues

**Solutions**:
```powershell
# Enable stdout logging in web.config
# Set stdoutLogEnabled="true"

# Check stdout logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\stdout*.log" -Tail 50

# Test database connection
# Verify connection strings in appsettings.Production.json
```

#### 3. Files Locked During Deployment

**Error**: "The process cannot access the file..."

**Solution**:
```powershell
# Manually stop the app pool
Stop-WebAppPool -Name "NoorCanvas"

# Wait a few seconds
Start-Sleep -Seconds 5

# Retry deployment
.\ncdeploy.ps1 -SkipIIS
```

#### 4. WebSocket Connection Fails

**Symptoms**: SignalR connections failing

**Solutions**:
```powershell
# Verify WebSocket feature is enabled
Get-WindowsOptionalFeature -Online -FeatureName "IIS-WebSockets"

# Enable if needed
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets

# Verify web.config has WebSocket enabled
# <webSocket enabled="true" />
```

### Log Locations

| Log Type | Location |
|----------|----------|
| Application Logs | `D:\Websites\NOOR-CANVAS\logs\noor-canvas-*.txt` |
| IIS Stdout Logs | `D:\Websites\NOOR-CANVAS\logs\stdout*.log` |
| Windows Event Logs | Event Viewer → Application |
| IIS Logs | `C:\inetpub\logs\LogFiles\W3SVC*` |

---

## Best Practices

### Pre-Deployment Checklist

- [ ] **Test locally** in Release configuration
- [ ] **Update database** schema if needed (run migrations)
- [ ] **Review changes** since last deployment
- [ ] **Backup database** (if schema changes)
- [ ] **Notify users** of scheduled downtime (if applicable)
- [ ] **Have rollback plan** ready

### During Deployment

- [ ] **Monitor logs** in real-time during deployment
- [ ] **Verify backup** was created successfully
- [ ] **Test critical features** immediately after deployment
- [ ] **Check database connections**
- [ ] **Verify SignalR connections** working

### Post-Deployment

- [ ] **Monitor application** for 15-30 minutes
- [ ] **Check error logs** for any new issues
- [ ] **Verify user sessions** are working
- [ ] **Test key workflows** (login, canvas operations, etc.)
- [ ] **Document** any issues encountered

### Deployment Schedule

**Recommended times**:
- **Weekdays**: After business hours (6 PM - 8 PM)
- **Weekends**: Saturday morning (low traffic)
- **Avoid**: Peak usage times, end of month, critical business periods

### Backup Retention

Current policy (configured in `ncdeploy.ps1`):
- **Keep last 5 backups** automatically
- **Manual backups** for major releases should be moved to long-term storage
- **Database backups** should be coordinated with deployments

---

## Quick Reference

### Essential Commands

```powershell
# Initial IIS setup
.\setup-iis.ps1

# Standard deployment
.\ncdeploy.ps1

# View backups
.\ncrollback.ps1

# Emergency rollback
.\ncrollback.ps1 -Latest -Force

# Truncate canvas sessions (fresh start)
Invoke-Sqlcmd -ServerInstance "AHHOME" -Database "KSESSIONS" -InputFile "Scripts\TruncateCanvasSessions.sql" -Verbose

# Restart app pool
Restart-WebAppPool -Name "NoorCanvas"

# View recent logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-*.txt" -Tail 100
```

### Database Quick Reference

**Production Database**: `KSESSIONS`
- **Server**: AHHOME
- **canvas schema**: Canvas sessions (READ-WRITE)
- **dbo schema**: Legacy Islamic content (READ-ONLY - never modify)

**Development Database**: `KSESSIONS_DEV`
- **Server**: AHHOME
- **canvas schema**: Canvas sessions (READ-WRITE)
- **dbo schema**: Legacy Islamic content copy (READ-ONLY)

### Directory Structure

```
D:\Websites\
├── NOOR-CANVAS\                    # Live deployment
│   ├── NoorCanvas.dll
│   ├── web.config
│   ├── appsettings.json
│   ├── appsettings.Production.json
│   ├── logs\                       # Application logs
│   └── wwwroot\                    # Static files (cleaned automatically)
│
└── NOOR-CANVAS-Backups\            # Automatic backups
    ├── backup-2025-10-12_15-30-45\
    ├── backup-2025-10-12_14-15-20\
    └── ...
```

---

## Support

For deployment issues:

1. **Check logs** first (see [Log Locations](#log-locations))
2. **Review** this troubleshooting guide
3. **Check** Event Viewer for system errors
4. **Contact** system administrator if issue persists

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-12 | Initial deployment documentation |

---

**Last Updated**: October 12, 2025
