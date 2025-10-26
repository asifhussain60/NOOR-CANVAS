# Production Logs - Quick Reference
**noorcanvas.kashkole.com** | Updated: October 26, 2025

## Quick Access

### Tail Logs (Real-Time)
```powershell
# Main application log
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50

# SignalR only
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50

# Errors only
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 20
```

### Today's Errors
```powershell
Select-String -Path "D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-$(Get-Date -Format 'yyyyMMdd').txt" -Pattern "\[ERR\]"
```

### Track Specific Session
```powershell
$sessionId = "YOUR_SESSION_ID"
Select-String -Path "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Pattern "session $sessionId"
```

### Connection Stats
```powershell
$log = "D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-$(Get-Date -Format 'yyyyMMdd').txt"
$connects = (Select-String -Path $log -Pattern "Client connected").Count
$disconnects = (Select-String -Path $log -Pattern "Client disconnected").Count
Write-Host "Connects: $connects | Disconnects: $disconnects | Active: $($connects - $disconnects)"
```

### Disk Space
```powershell
$size = (Get-ChildItem "D:\Websites\NOOR-CANVAS\logs" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Logs: $([math]::Round($size, 2)) MB"
```

## Log File Locations
- **Main**: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-YYYYMMDD.txt`
- **SignalR**: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-signalr-YYYYMMDD.txt`
- **Errors**: `D:\Websites\NOOR-CANVAS\logs\noor-canvas-errors-YYYYMMDD.txt`

## What's Logged (Debug Level)
✅ SignalR hub connections & disconnections  
✅ User session joins  
✅ Annotation broadcasts  
✅ Q&A submissions  
✅ Database queries (SQL)  
✅ HTTP routing decisions  
✅ Service method calls  
✅ Controller actions  
✅ Error stack traces  

## Performance
- 📊 50MB file size limit per file (auto-rollover)
- 📅 Retention: 30d (main), 14d (SignalR), 90d (errors)
- ⚡ Asynchronous writes (no performance impact)

## Quick Deploy Update
```powershell
# Full deployment
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\ncdeploy.ps1

# Config-only update
Stop-WebAppPool -Name "NoorCanvas"
Copy-Item "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\appsettings.Production.json" `
          "D:\Websites\NOOR-CANVAS\appsettings.Production.json" -Force
Start-WebAppPool -Name "NoorCanvas"
```

## Full Documentation
See: `Docs/PRODUCTION-LOGGING-DEPLOYMENT-20251026.md`
