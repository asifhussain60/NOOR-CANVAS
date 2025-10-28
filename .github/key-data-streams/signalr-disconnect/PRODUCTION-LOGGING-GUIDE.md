# SignalR Diagnostic Logging - Production Guide

## Overview
Comprehensive diagnostic logging has been deployed to production for tracking SignalR activity across all components.

**Deployment Date:** 2025-10-25  
**Deployment Time:** 06:49:22  
**Production URL:** https://noorcanvas.kashkole.com

## Log Location

```powershell
# Daily log files
D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-YYYYMMDD.txt

# Today's log
D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt
```

## Logging Configuration

The production `appsettings.Production.json` is configured with:
- **NoorCanvas**: `Debug` level (captures all diagnostic logs)
- **Microsoft.AspNetCore.SignalR**: `Warning` level
- **Rolling Interval**: Daily
- **Retention**: 30 days

## Filtering SignalR Logs

### View All SignalR Activity
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR"
```

### View Only Diagnostic Logs
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG"
```

### View Last 50 Diagnostic Entries
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG" | Select-Object -Last 50
```

### Monitor Live Diagnostic Activity
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 20 | Select-String -Pattern "SIGNALR-DIAG"
```

### Search by Diagnostic ID (for correlation)
```powershell
# Example: Track all activity for a specific diagnostic ID
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "DiagId=abc12345"
```

## Log Patterns

### Connection Lifecycle
- `SIGNALR-DIAG: [SessionHub-OnConnectedAsync] START`
- `SIGNALR-DIAG: [SessionHub-OnConnectedAsync] COMPLETE`
- `SIGNALR-DIAG: [SessionHub-OnDisconnectedAsync] START`

### Client Initialization
- `SIGNALR-DIAG: [HostControlPanel-InitializeSignalRAsync] START`
- `SIGNALR-DIAG: [SessionWaiting-InitializeSignalRConnection] START`
- `SIGNALR-DIAG: [SessionCanvas-InitializeSignalRAsync] START`
- `SIGNALR-DIAG: [TranscriptCanvas-InitializeSignalRAsync] START`

### Group Operations
- `SIGNALR-DIAG: [SessionHub-JoinSession] START`
- `SIGNALR-DIAG: [SessionHub-JoinGroup] START`
- `SIGNALR-DIAG: [HostControlPanel-JoinSignalRGroupsAsync] START`

### Event Handlers
- `SIGNALR-DIAG: [HostControlPanel-OnQuestionReceived] START`
- `SIGNALR-DIAG: [SessionCanvas-OnQuestionReceived] START`
- `SIGNALR-DIAG: [SessionWaiting-OnSessionBegan] START`

### Connection State Changes
- `SIGNALR-DIAG: [SessionCanvas-OnConnectionClosed] START`
- `SIGNALR-DIAG: [SessionCanvas-OnConnectionReconnecting] START`
- `SIGNALR-DIAG: [SessionCanvas-OnConnectionReconnected] START`

## Diagnostic ID Correlation

Each diagnostic operation generates a unique 8-character ID for correlation across components:

```powershell
# Example: Find all logs related to a specific operation
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "DiagId=abc12345"
```

This allows tracking:
- Host → Hub → Participant flow
- Connection lifecycle across reconnections
- Event propagation from hub to multiple clients

## Components Instrumented

1. **SessionHub.cs** (Server)
   - `OnConnectedAsync` / `OnDisconnectedAsync`
   - `JoinSession` / `LeaveSession`
   - `JoinGroup`
   - `BroadcastQuestion`

2. **HostControlPanel.razor** (Host UI)
   - `InitializeSignalRAsync`
   - `JoinSignalRGroupsAsync`
   - All event handlers (QuestionReceived, TranscriptUpdated, VoteUpdateReceived, etc.)

3. **SessionWaiting.razor** (Waiting Room)
   - `InitializeSignalRConnection`
   - All event handlers (UserJoined, UserLeft, ParticipantJoined, SessionBegan, etc.)

4. **SessionCanvas.razor** (Live Session)
   - `InitializeSignalRAsync`
   - `RetrySignalRConnection`
   - Connection state handlers
   - All event handlers

5. **TranscriptCanvas.razor** (Transcript View)
   - `InitializeSignalRAsync`
   - `RetrySignalRConnection`
   - Connection state handlers
   - All event handlers

## Troubleshooting

### No SIGNALR-DIAG logs appearing
- **Check log level**: Ensure `appsettings.Production.json` has `"NoorCanvas": "Debug"`
- **Activity required**: Logs only appear when users connect to sessions
- **Verify deployment**: Check deployment timestamp matches current production

### Finding specific issues
```powershell
# Look for errors
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG.*ERROR"

# Look for connection problems
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG.*Disconnect|Closed|Failed"

# Look for reconnection activity
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG.*Reconnect"
```

## Next Steps

When investigating SignalR issues:

1. **Reproduce the issue** in production
2. **Note the timestamp** when issue occurred
3. **Filter logs** to that timeframe:
   ```powershell
   Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "2025-10-25 14:3[0-5]" | Select-String -Pattern "SIGNALR"
   ```
4. **Extract diagnostic IDs** from initial connection logs
5. **Trace entire flow** using those diagnostic IDs
6. **Look for ERROR or exception messages** in the correlated logs

## Log Analysis Scripts

### Count Connections Today
```powershell
(Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG.*OnConnectedAsync.*COMPLETE").Count
```

### Count Disconnections Today
```powershell
(Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "SIGNALR-DIAG.*OnDisconnectedAsync").Count
```

### Find Active Diagnostic IDs
```powershell
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-$(Get-Date -Format 'yyyyMMdd').txt" | Select-String -Pattern "DiagId=([a-f0-9]{8})" | ForEach-Object { $_.Matches.Groups[1].Value } | Select-Object -Unique
```

## Production Deployment Details

- **Deployment Script**: `ncdeploy.ps1`
- **Backup Location**: `D:\Websites\NOOR-CANVAS-Backups\backup-2025-10-25_06-49-22`
- **Published From**: `master` branch
- **Smoke Tests**: All passed ✓
- **Database**: KSESSIONS (production)
