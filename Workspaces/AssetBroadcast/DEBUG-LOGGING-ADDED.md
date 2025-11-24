# Debug Logging Added for Asset Broadcasting

**Date**: 2025-11-24  
**Purpose**: Track complete broadcast flow from host to participants  
**Status**: ✅ COMPLETE - Build successful with 0 errors

---

## Changes Summary

Comprehensive debug logging added to 5 key files in the asset broadcasting flow:

### 1. HostControlPanel.razor - Host Initiation
**Location**: Lines ~1742-1762  
**Logs Added**:
- Entry point with unique broadcast ID
- Session and asset details
- HubConnection state
- ShareAssetAsync result

**Log Pattern**:
```
[DEBUG-BROADCAST:{BroadcastId}] ════════════════════════════════════════
[DEBUG-BROADCAST:{BroadcastId}] HOST: ShareAsset called
[DEBUG-BROADCAST:{BroadcastId}] HOST: SessionId={SessionId}, shareId={ShareId}, assetType={AssetType}, instance={Instance}
[DEBUG-BROADCAST:{BroadcastId}] HOST: HubConnection.State={State}
[DEBUG-BROADCAST:{BroadcastId}] HOST: ShareAssetAsync returned success={Success}
[DEBUG-BROADCAST:{BroadcastId}] ════════════════════════════════════════
```

### 2. SessionHub.cs - Server Broadcast
**Location**: Lines 234-262  
**Logs Added**:
- Hub method invocation tracking
- Group name and connection details
- Pre-broadcast state
- SendAsync execution status
- Success/failure with exception details

**Log Pattern**:
```
[DEBUG-BROADCAST:{HubTrackingId}] ════════════════════════════════════════
[DEBUG-BROADCAST:{HubTrackingId}] HUB: PublishAssetContent invoked
[DEBUG-BROADCAST:{HubTrackingId}] HUB: sessionId={SessionId}, groupName={GroupName}, contentLength={ContentLength}
[DEBUG-BROADCAST:{HubTrackingId}] HUB: ConnectionId={ConnectionId}
[DEBUG-BROADCAST:{HubTrackingId}] HUB: Caller UserIdentifier={UserIdentifier}
[DEBUG-BROADCAST:{HubTrackingId}] HUB: Sending 'AssetContentReceived' to group '{GroupName}'...
[DEBUG-BROADCAST:{HubTrackingId}] HUB: ✅ SendAsync completed successfully
[DEBUG-BROADCAST:{HubTrackingId}] HUB: Broadcast sent to all connections in group {GroupName}
[DEBUG-BROADCAST:{HubTrackingId}] ════════════════════════════════════════
```

### 3. SessionCanvasSignalRService.cs - Service Handler
**Location**: Lines 265-315  
**Logs Added**:
- Event reception tracking
- Content length verification
- Callback availability check
- Callback invocation timing
- Latency measurement
- Exception details

**Log Pattern**:
```
[DEBUG-BROADCAST:{TrackingId}] ════════════════════════════════════════
[DEBUG-BROADCAST:{TrackingId}] SERVICE: HandleAssetContentReceivedAsync called
[DEBUG-BROADCAST:{TrackingId}] SERVICE: receiveTime={ReceiveTime}ms, htmlLength={Length}
[DEBUG-BROADCAST:{TrackingId}] SERVICE: onAssetReceived callback is {Status}
[DEBUG-BROADCAST:{TrackingId}] SERVICE: Invoking onAssetReceived callback...
[DEBUG-BROADCAST:{TrackingId}] SERVICE: ✅ Callback invoked successfully
[DEBUG-BROADCAST:{TrackingId}] SERVICE: displayTime={DisplayTime}ms, latency={Latency}ms
[DEBUG-BROADCAST:{TrackingId}] ════════════════════════════════════════
```

### 4. SessionCanvas.razor - Participant Reception (Canvas View)
**Location**: Lines 2862-2875  
**Logs Added**:
- Handler registration confirmation
- Event firing notification
- Content length check
- Service method invocation
- Completion status

**Log Pattern**:
```
[DEBUG-BROADCAST] SESSIONCANVAS: Registering AssetContentReceived handler
[DEBUG-BROADCAST:{EventId}] ════════════════════════════════════════
[DEBUG-BROADCAST:{EventId}] SESSIONCANVAS: AssetContentReceived EVENT FIRED
[DEBUG-BROADCAST:{EventId}] SESSIONCANVAS: htmlContent length={Length}
[DEBUG-BROADCAST:{EventId}] SESSIONCANVAS: Calling SignalREventService.HandleAssetContentReceivedAsync...
[DEBUG-BROADCAST:{EventId}] SESSIONCANVAS: ✅ Handler completed
[DEBUG-BROADCAST:{EventId}] ════════════════════════════════════════
```

### 5. TranscriptCanvas.razor - Participant Reception (Transcript View)
**Location**: Lines 3037-3050  
**Logs Added**:
- Handler registration confirmation
- Event firing notification
- Content length check
- Service method invocation
- Completion status

**Log Pattern**:
```
[DEBUG-BROADCAST] TRANSCRIPTCANVAS: Registering AssetContentReceived handler
[DEBUG-BROADCAST:{EventId}] ════════════════════════════════════════
[DEBUG-BROADCAST:{EventId}] TRANSCRIPTCANVAS: AssetContentReceived EVENT FIRED
[DEBUG-BROADCAST:{EventId}] TRANSCRIPTCANVAS: htmlContent length={Length}
[DEBUG-BROADCAST:{EventId}] TRANSCRIPTCANVAS: Calling SignalREventService.HandleAssetContentReceivedAsync...
[DEBUG-BROADCAST:{EventId}] TRANSCRIPTCANVAS: ✅ Handler completed
[DEBUG-BROADCAST:{EventId}] ════════════════════════════════════════
```

---

## Complete Flow Tracking

When an asset is shared, the logs will show the complete journey:

```
1. [DEBUG-BROADCAST:abc12345] HOST: ShareAsset called
   └─ Host clicks share button
   
2. [DEBUG-BROADCAST:abc12345] HOST: ShareAssetAsync returned success=True
   └─ AssetSharingService processes the request
   
3. [DEBUG-BROADCAST:def67890] HUB: PublishAssetContent invoked
   └─ SessionHub receives the broadcast request
   
4. [DEBUG-BROADCAST:def67890] HUB: ✅ SendAsync completed successfully
   └─ Hub sends to SignalR group
   
5. [DEBUG-BROADCAST] SESSIONCANVAS: Registering AssetContentReceived handler
   └─ Participant 1 canvas registers handler (startup)
   
6. [DEBUG-BROADCAST:ghi34567] SESSIONCANVAS: AssetContentReceived EVENT FIRED
   └─ Participant 1 receives the event
   
7. [DEBUG-BROADCAST:ghi34567] SERVICE: HandleAssetContentReceivedAsync called
   └─ Service layer processes event
   
8. [DEBUG-BROADCAST:ghi34567] SERVICE: ✅ Callback invoked successfully
   └─ Asset displayed in canvas
   
9. [DEBUG-BROADCAST] TRANSCRIPTCANVAS: Registering AssetContentReceived handler
   └─ Participant 2 transcript registers handler (startup)
   
10. [DEBUG-BROADCAST:jkl89012] TRANSCRIPTCANVAS: AssetContentReceived EVENT FIRED
    └─ Participant 2 receives the event
    
11. [DEBUG-BROADCAST:jkl89012] SERVICE: HandleAssetContentReceivedAsync called
    └─ Service layer processes event
    
12. [DEBUG-BROADCAST:jkl89012] SERVICE: ✅ Callback invoked successfully
    └─ Asset displayed in transcript
```

---

## Diagnostic Scenarios

### Scenario 1: Host Can't Send
**Expected Logs**:
```
[DEBUG-BROADCAST:xxx] HOST: ShareAsset called
[DEBUG-BROADCAST:xxx] HOST: HubConnection.State=Connected
[DEBUG-BROADCAST:xxx] HOST: ShareAssetAsync returned success=False
```

**Issue**: Problem in AssetSharingService (check service logs)

### Scenario 2: Hub Can't Broadcast
**Expected Logs**:
```
[DEBUG-BROADCAST:xxx] HUB: PublishAssetContent invoked
[DEBUG-BROADCAST:xxx] HUB: Sending 'AssetContentReceived' to group 'session_123'...
[DEBUG-BROADCAST:xxx] HUB: ❌ EXCEPTION during SendAsync
```

**Issue**: SignalR group membership or connection problem

### Scenario 3: Participant Not Receiving
**Expected Logs**:
```
[DEBUG-BROADCAST] SESSIONCANVAS: Registering AssetContentReceived handler
[DEBUG-BROADCAST:xxx] HUB: ✅ SendAsync completed successfully
// BUT NO: [DEBUG-BROADCAST:xxx] SESSIONCANVAS: AssetContentReceived EVENT FIRED
```

**Issue**: 
- Participant not in SignalR group
- Handler not registered properly
- Connection state issue

### Scenario 4: Service Handler Not Invoked
**Expected Logs**:
```
[DEBUG-BROADCAST:xxx] SESSIONCANVAS: AssetContentReceived EVENT FIRED
[DEBUG-BROADCAST:xxx] SESSIONCANVAS: Calling SignalREventService.HandleAssetContentReceivedAsync...
// BUT NO: [DEBUG-BROADCAST:xxx] SERVICE: HandleAssetContentReceivedAsync called
```

**Issue**: Service dependency injection or method invocation problem

### Scenario 5: Callback Not Invoked
**Expected Logs**:
```
[DEBUG-BROADCAST:xxx] SERVICE: HandleAssetContentReceivedAsync called
[DEBUG-BROADCAST:xxx] SERVICE: onAssetReceived callback is NULL
[DEBUG-BROADCAST:xxx] SERVICE: ⚠️ onAssetReceived callback is NULL
```

**Issue**: OnAssetShared callback not wired up in canvas component

---

## How to Use These Logs

### 1. Reproduce the Issue
- Start the app: `dotnet run`
- Open host view: https://localhost:9091/admin
- Open participant views (SessionCanvas + TranscriptCanvas)
- Click "Share" on an asset

### 2. Check Logs
```bash
# View logs in real-time
Get-Content logs/noorcanvas-*.log -Wait | Select-String "DEBUG-BROADCAST"

# Or check console output (if running in terminal)
# Look for [DEBUG-BROADCAST:xxx] lines
```

### 3. Trace the Flow
Each unique ID (e.g., `abc12345`, `def67890`) represents one point in the flow:
- **BroadcastId** from Host
- **HubTrackingId** from SessionHub
- **TrackingId** from Service
- **EventId** from Canvas components

### 4. Identify Gaps
If logs stop at any point, that's where the issue is:
- Stops after HOST → Check AssetSharingService
- Stops after HUB → Check SignalR group membership
- Stops before SESSIONCANVAS/TRANSCRIPTCANVAS → Check participant connection
- Stops before SERVICE → Check service registration
- Stops before Callback → Check OnAssetShared wiring

---

## Performance Impact

**Log Volume**: ~15-20 log lines per asset broadcast  
**Impact**: Negligible for development/debugging  
**Cleanup**: Search for `[DEBUG-BROADCAST` to remove when done

---

## Build Status

✅ **Compilation**: SUCCESS  
✅ **Errors**: 0  
⚠️ **Warnings**: 31 (pre-existing, unrelated to changes)  

---

## Next Steps

1. **Run the app** with debug logging
2. **Perform manual test** (share an asset)
3. **Review logs** to identify where the flow breaks
4. **Compare logs** between working and non-working scenarios
5. **Update fix** based on diagnostic findings

The logs now provide complete visibility into the broadcast flow, making it easy to pinpoint exactly where participants are not receiving broadcasts.
