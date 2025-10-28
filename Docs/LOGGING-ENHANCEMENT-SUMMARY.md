# Production Logging Enhancement - Summary
**Date**: October 26, 2025  
**Status**: ✅ Ready for Deployment  
**Target**: noorcanvas.kashkole.com (D:\Websites\NOOR-CANVAS)

## What Was Changed

### Modified Files
1. ✅ `SPA/NoorCanvas/appsettings.Production.json` - Enhanced logging configuration

### Created Files
1. ✅ `Docs/PRODUCTION-LOGGING-DEPLOYMENT-20251026.md` - Full deployment guide
2. ✅ `Docs/PROD-LOGS-QUICK-REF.md` - Quick reference card
3. ✅ `Scripts/deploy-production-logging.ps1` - Automated deployment script

## Key Configuration Changes

### Enhanced Log Levels (Debug)
Now logging at Debug level for:
- ✅ All NoorCanvas components
- ✅ SignalR hubs (connections, messages, lifecycle)
- ✅ HTTP request routing
- ✅ Database commands (SQL queries)
- ✅ HTTP client requests
- ✅ Individual hub components (AnnotationHub, QAHub, TestHub)

### New Log Files
Three separate log files for better organization:

1. **Main Application Log** (`logs/noor-canvas-prod-YYYYMMDD.txt`)
   - All application activity
   - 30-day retention
   - 50MB max file size with rollover

2. **SignalR-Specific Log** (`logs/noor-canvas-signalr-YYYYMMDD.txt`)
   - SignalR hub activity only
   - 14-day retention
   - 50MB max file size with rollover

3. **Errors-Only Log** (`logs/noor-canvas-errors-YYYYMMDD.txt`)
   - Warnings and errors only
   - 90-day retention
   - No size limit

### Enhanced Log Format
New output includes:
- Millisecond precision timestamps
- Timezone information
- Source context (logger category)
- Structured properties
- Full exception details

**Before:**
```
[14:23:45 INF] User joining session {Properties}
```

**After:**
```
[2025-10-26 14:23:45.123 +03:00 DBG] NoorCanvas.Hubs.AnnotationHub User 12345 joining session 67890 - ConnectionId: abc123xyz {Properties}
```

## What You'll Be Able to Track

### User Interactions
- ✅ Session joins and leaves
- ✅ Annotation tool usage
- ✅ Q&A submissions and voting
- ✅ Content broadcasts
- ✅ Connection lifecycle

### System Performance
- ✅ Database query execution times
- ✅ SignalR message latency
- ✅ HTTP request processing
- ✅ Connection pool utilization

### Troubleshooting
- ✅ Connection failures with details
- ✅ Database errors with SQL
- ✅ SignalR protocol issues
- ✅ Authentication problems
- ✅ Full stack traces for errors

## Deployment Options

### Option 1: Automated Script (Recommended) ⭐
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\deploy-production-logging.ps1
```
**What it does:**
- ✅ Validates configuration
- ✅ Backs up existing config
- ✅ Stops IIS app pool
- ✅ Deploys new config
- ✅ Creates logs directory
- ✅ Sets permissions
- ✅ Starts app pool
- ✅ Verifies deployment

**Time:** ~30 seconds

### Option 2: Verify First, Deploy Later
```powershell
# Verify configuration is ready
.\deploy-production-logging.ps1 -Verify

# Deploy when ready
.\deploy-production-logging.ps1
```

### Option 3: Full Build and Deploy
```powershell
# Use existing deployment script (includes logging config)
.\ncdeploy.ps1
```
**Time:** ~5-10 minutes (full rebuild)

### Option 4: Manual Deployment
```powershell
Stop-WebAppPool -Name "NoorCanvas"
Copy-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json" `
          "D:\Websites\NOOR-CANVAS\appsettings.Production.json" -Force
New-Item -Path "D:\Websites\NOOR-CANVAS\logs" -ItemType Directory -Force
Start-WebAppPool -Name "NoorCanvas"
```

## Post-Deployment Verification

### Step 1: Wait for Application Start
Wait 1-2 minutes for the application to fully initialize.

### Step 2: Verify Logs Directory
```powershell
Get-ChildItem "D:\Websites\NOOR-CANVAS\logs" | Sort-Object LastWriteTime -Descending
```
**Expected:** Should see new log files created with today's date.

### Step 3: Check Main Log File
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Tail 20
```
**Expected:** Should see application startup messages with Debug-level detail.

### Step 4: Verify Live Logging
```powershell
# Open real-time tail
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50

# In another window, access the site
Start-Process "https://noorcanvas.kashkole.com"
```
**Expected:** Should see HTTP requests, SignalR connections, etc. in real-time.

### Step 5: Test Session Activity
1. Create or join a session on noorcanvas.kashkole.com
2. Monitor SignalR log:
   ```powershell
   Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt" -Wait
   ```
3. **Expected:** Should see connection establishment, group joins, etc.

## Monitoring Commands

### Real-Time Monitoring
```powershell
# Main log
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50

# SignalR only
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50

# Errors only
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 20
```

### Quick Checks
```powershell
# Connection stats
$log = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt"
$connects = (Select-String -Path $log -Pattern "Client connected").Count
$disconnects = (Select-String -Path $log -Pattern "Client disconnected").Count
Write-Host "Active connections: $($connects - $disconnects)"

# Today's errors
Select-String -Path "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt" -Pattern "\[ERR\]"

# Disk usage
$size = (Get-ChildItem "D:\Websites\NOOR-CANVAS\logs" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Logs: $([math]::Round($size, 2)) MB"
```

## Performance Impact

### Expected Impact
- ✅ **Minimal** - Debug logging has negligible performance overhead
- ✅ **Asynchronous** - Logs written asynchronously (non-blocking)
- ✅ **Controlled** - File size limits prevent runaway growth
- ✅ **Managed** - Automatic retention policy

### Expected Log Volume
- **Low traffic** (10-50 users): ~50-100 MB/day
- **Medium traffic** (50-200 users): ~100-500 MB/day
- **High traffic** (200+ users): ~500+ MB/day

### Disk Space Allocation
- **Main logs**: 30 days × ~200 MB/day = ~6 GB max
- **SignalR logs**: 14 days × ~100 MB/day = ~1.4 GB max
- **Error logs**: 90 days × ~10 MB/day = ~900 MB max
- **Total**: ~8-10 GB max

## Troubleshooting

### If logs don't appear:
1. Check logs directory exists: `Test-Path "D:\Websites\NOOR-CANVAS\logs"`
2. Check permissions: `icacls "D:\Websites\NOOR-CANVAS\logs"`
3. Check app pool is running: `Get-WebAppPoolState -Name "NoorCanvas"`
4. Check web.config has `ASPNETCORE_ENVIRONMENT=Production`

### If logs grow too fast:
1. Check what's being logged: See "Quick Checks" above
2. Reduce verbosity for specific components in `appsettings.Production.json`
3. Monitor disk space daily until pattern stabilizes

## Documentation

### Full Documentation
📄 **Deployment Guide**: `Docs/PRODUCTION-LOGGING-DEPLOYMENT-20251026.md`
- Complete deployment instructions
- Detailed monitoring examples
- PowerShell analysis scripts
- Performance considerations

### Quick Reference
📋 **Quick Ref**: `Docs/PROD-LOGS-QUICK-REF.md`
- Common monitoring commands
- Log file locations
- Quick troubleshooting

### Deployment Script
🔧 **Script**: `Scripts/deploy-production-logging.ps1`
- Automated deployment
- Validation mode
- Built-in verification

## Rollback Plan

If issues occur after deployment:

### Quick Rollback
```powershell
Stop-WebAppPool -Name "NoorCanvas"

# Find backup file (created during deployment)
$backup = Get-ChildItem "D:\Websites\NOOR-CANVAS" -Filter "appsettings.Production.json.backup-*" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

# Restore
Copy-Item $backup.FullName "D:\Websites\NOOR-CANVAS\appsettings.Production.json" -Force

Start-WebAppPool -Name "NoorCanvas"
```

### Or Reduce Logging Level
Edit `D:\Websites\NOOR-CANVAS\appsettings.Production.json`:
```json
"Override": {
  "NoorCanvas": "Information",  // Change from Debug
  "Microsoft.AspNetCore.SignalR": "Information",  // Change from Debug
  // ... etc
}
```

Then restart app pool.

## Next Steps

### Immediate (After Deployment)
1. ✅ Deploy using automated script
2. ✅ Verify logs are being created
3. ✅ Test with live session to confirm logging
4. ✅ Monitor for 1 hour to ensure stability

### Short-term (First Week)
1. Monitor disk space daily
2. Review error log for recurring issues
3. Analyze connection patterns
4. Identify any chatty components

### Long-term (Ongoing)
1. Set up scheduled disk space monitoring
2. Create alerts for error count thresholds
3. Archive old logs if needed
4. Adjust retention policies based on usage

## Status Checklist

- [x] Configuration updated in source
- [x] Deployment script created
- [x] Documentation written
- [x] Quick reference created
- [ ] **Deployed to production** ← Next step
- [ ] **Verified logs working**
- [ ] **Monitored for 1 hour**

## Deploy Now

Ready to deploy? Run:
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\deploy-production-logging.ps1
```

Or verify first:
```powershell
.\deploy-production-logging.ps1 -Verify
```

---
**Questions?** See full documentation in `Docs/PRODUCTION-LOGGING-DEPLOYMENT-20251026.md`
