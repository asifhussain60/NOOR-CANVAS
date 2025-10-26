# Production Detailed Logging Deployment Guide
**Date**: October 26, 2025  
**Target**: noorcanvas.kashkole.com  
**Purpose**: Enable comprehensive production logging to track live interactions, diagnose issues, and monitor system health

## Overview
This deployment enables detailed production logging for the NoorCanvas application to provide visibility into:
- Real-time user interactions
- SignalR hub connections and message flows
- Database queries and performance
- HTTP request routing
- Error tracking and diagnostics

## Changes Made

### 1. Enhanced Log Levels (`appsettings.Production.json`)

**Previous Configuration:**
- SignalR: Information
- Entity Framework: Information
- Most components: Warning or Information

**New Configuration:**
```json
"Override": {
  "NoorCanvas": "Debug",
  "Microsoft.EntityFrameworkCore.Database.Command": "Debug",  // SQL queries
  "Microsoft.AspNetCore.SignalR": "Debug",                     // SignalR details
  "Microsoft.AspNetCore.Http.Connections": "Debug",            // Connection lifecycle
  "Microsoft.AspNetCore.Routing": "Debug",                     // HTTP routing
  "NoorCanvas.Hubs": "Debug",                                  // All hub activity
  "NoorCanvas.Hubs.AnnotationHub": "Debug",                   // Annotation interactions
  "NoorCanvas.Hubs.QAHub": "Debug",                           // Q&A interactions
  "NoorCanvas.Hubs.TestHub": "Debug",                         // Test hub activity
  "NoorCanvas.Services": "Debug",                              // Service layer
  "NoorCanvas.Controllers": "Debug",                           // API controllers
  "System.Net.Http.HttpClient": "Debug"                        // HTTP client calls
}
```

### 2. Enhanced Log Files Structure

**New log file organization:**

1. **Main Application Log**: `logs/noor-canvas-prod-YYYYMMDD.txt`
   - All application activity
   - 30-day retention
   - 50MB file size limit with rollover
   - Includes source context for easier filtering

2. **SignalR-Specific Log**: `logs/noor-canvas-signalr-YYYYMMDD.txt`
   - Dedicated SignalR hub activity tracking
   - Connection lifecycle events
   - Message broadcasting details
   - 14-day retention
   - 50MB file size limit with rollover

3. **Error-Only Log**: `logs/noor-canvas-errors-YYYYMMDD.txt`
   - Warnings and errors only
   - 90-day retention for compliance
   - Critical for issue tracking

### 3. Enhanced Output Template

**New template includes:**
- Millisecond-precision timestamps
- Timezone information
- Source context (logger category name)
- Structured properties
- Full exception details

Example log entry:
```
[2025-10-26 14:23:45.123 +03:00 DBG] NoorCanvas.Hubs.AnnotationHub User 12345 joining session 67890 - ConnectionId: abc123xyz ;CLEANUP_OK
```

## Deployment Instructions

### Option 1: Full Deployment (Recommended)
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\ncdeploy.ps1
```
This will:
- Build NoorCanvas in Release mode
- Deploy to D:\Websites\NOOR-CANVAS
- Include updated `appsettings.Production.json`
- Restart IIS application pool
- Merge changes to master branch

### Option 2: Config-Only Update (Quick)
If you only want to update the logging configuration without a full rebuild:

```powershell
# Stop the application pool
Stop-WebAppPool -Name "NoorCanvas"

# Copy updated config
Copy-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json" `
          -Destination "D:\Websites\NOOR-CANVAS\appsettings.Production.json" `
          -Force

# Ensure logs directory exists
New-Item -Path "D:\Websites\NOOR-CANVAS\logs" -ItemType Directory -Force

# Start the application pool
Start-WebAppPool -Name "NoorCanvas"

# Verify it's running
Get-WebAppPoolState -Name "NoorCanvas"
```

### Option 3: Using IIS Reset
```powershell
# Copy config file
Copy-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json" `
          -Destination "D:\Websites\NOOR-CANVAS\appsettings.Production.json" `
          -Force

# IIS Reset (picks up new config)
iisreset /noforce
```

## Monitoring and Log Analysis

### Real-Time Log Monitoring

**Watch main application log:**
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50
```

**Watch SignalR activity:**
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50
```

**Watch errors only:**
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 20
```

### Key Log Patterns to Monitor

#### 1. SignalR Connection Events
```
[DBG] Microsoft.AspNetCore.SignalR Client connected: {ConnectionId}
[DBG] Microsoft.AspNetCore.Http.Connections Connection {ConnectionId} started
[DBG] NoorCanvas.Hubs.AnnotationHub User {UserId} joining session {SessionId}
```

#### 2. User Interactions
```
[INF] NoorCanvas.Hubs.AnnotationHub [TRACE-ANNOTATION:join] User {UserId} joining session {SessionId}
[INF] NOOR-QA: Question submitted for session {SessionId}: {Question}
[DBG] NoorCanvas.Hubs.TestHub BroadcastHtml called: SessionId {SessionId}
```

#### 3. Database Activity
```
[DBG] Microsoft.EntityFrameworkCore.Database.Command Executed DbCommand
```

#### 4. HTTP Requests
```
[DBG] Microsoft.AspNetCore.Routing Endpoint '{EndpointName}' matched
```

#### 5. Errors and Warnings
```
[WRN] NoorCanvas.Hubs Connection {ConnectionId} disconnected with error
[ERR] NoorCanvas.Services Error processing request: {ErrorMessage}
```

### Useful PowerShell Analysis Scripts

**Count connections per hour:**
```powershell
$logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Select-String -Path $logFile -Pattern "Client connected" | 
    ForEach-Object { ($_ -split '\[')[1].Substring(0,13) } | 
    Group-Object | 
    Sort-Object Name | 
    Format-Table Name, Count -AutoSize
```

**Find all errors today:**
```powershell
$logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Select-String -Path $logFile -Pattern "\[ERR\]" | 
    Select-Object -ExpandProperty Line
```

**Track specific session activity:**
```powershell
$sessionId = "67890"
$logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
Select-String -Path $logFile -Pattern "session $sessionId" | 
    Select-Object -ExpandProperty Line
```

**SignalR connection statistics:**
```powershell
$logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt"
$connects = (Select-String -Path $logFile -Pattern "Client connected").Count
$disconnects = (Select-String -Path $logFile -Pattern "Client disconnected").Count
Write-Host "Connections: $connects | Disconnections: $disconnects | Active: $($connects - $disconnects)"
```

## Performance Considerations

### Disk Space Monitoring
With detailed logging enabled, monitor disk space:

```powershell
# Check logs directory size
$logsPath = "D:\Websites\NOOR-CANVAS\logs"
$logsSizeMB = (Get-ChildItem -Path $logsPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Logs directory: $([math]::Round($logsSizeMB, 2)) MB"

# List log files by size
Get-ChildItem -Path $logsPath -Filter "*.txt" | 
    Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length / 1MB, 2)}} | 
    Sort-Object 'Size(MB)' -Descending
```

**Expected log volume (approximate):**
- Low traffic: 50-100 MB/day
- Medium traffic: 100-500 MB/day
- High traffic: 500+ MB/day

**Retention policy:**
- Main logs: 30 days (~15-45 GB max)
- SignalR logs: 14 days (~7-21 GB max)
- Error logs: 90 days (typically < 5 GB)

### Performance Impact
- **Minimal**: Debug-level logging in production has negligible performance impact
- **Asynchronous writes**: Serilog writes logs asynchronously
- **File rollover**: Automatic at 50MB prevents individual files from becoming unwieldy

## Reverting to Standard Logging

If detailed logging needs to be disabled:

```json
"Override": {
  "NoorCanvas": "Information",
  "Microsoft.AspNetCore.SignalR": "Information",
  "Microsoft.AspNetCore.Http.Connections": "Information",
  "NoorCanvas.Hubs": "Information"
}
```

And remove the additional log sinks (keep only the main file sink).

## Troubleshooting

### Logs not appearing
1. **Check logs directory exists:**
   ```powershell
   Test-Path "D:\Websites\NOOR-CANVAS\logs"
   ```

2. **Check write permissions:**
   ```powershell
   icacls "D:\Websites\NOOR-CANVAS\logs"
   ```
   Should show IIS AppPool\NoorCanvas with modify permissions

3. **Check application is using Production environment:**
   ```powershell
   # Check web.config
   Select-String -Path "D:\Websites\NOOR-CANVAS\web.config" -Pattern "ASPNETCORE_ENVIRONMENT"
   ```
   Should show: `value="Production"`

### Logs growing too fast
1. Check for chatty components:
   ```powershell
   $logFile = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt"
   Get-Content $logFile | 
       ForEach-Object { ($_ -split '\]')[2] } | 
       Where-Object { $_ } |
       ForEach-Object { ($_ -split ' ')[0] } | 
       Group-Object | 
       Sort-Object Count -Descending | 
       Select-Object -First 10
   ```

2. Reduce specific component verbosity in `appsettings.Production.json`

## Next Steps After Deployment

1. **Immediate verification:**
   ```powershell
   # Check newest log file exists and is being written to
   Get-ChildItem "D:\Websites\NOOR-CANVAS\logs" -Filter "noor-canvas-prod-*.txt" | 
       Sort-Object LastWriteTime -Descending | 
       Select-Object -First 1 -ExpandProperty FullName
   ```

2. **Monitor for 1 hour** to ensure logs are capturing expected activity

3. **Review error log** for any startup issues:
   ```powershell
   Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt"
   ```

4. **Set up scheduled monitoring** (optional):
   - Create scheduled task to check log file sizes
   - Create scheduled task to archive old logs
   - Set up alerts for error count thresholds

## Contact and Support
For issues or questions about production logging:
- Review logs first: Check error log for immediate issues
- Check IIS: Verify application pool is running
- Verify config: Ensure `appsettings.Production.json` deployed correctly

## Related Documentation
- `Scripts/ncdeploy.ps1` - Full deployment script
- `SPA/NoorCanvas/appsettings.Production.json` - Production logging configuration
- `Docs/DEPLOYMENT-VALIDATION-CHECKLIST.md` - General deployment checklist
