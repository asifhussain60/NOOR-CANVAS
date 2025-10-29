# Transcript Canvas - Key Data Stream

**Feature:** Share Transcript functionality for broadcasting session transcripts to participants  
**Primary Components:** HostControlPanel.razor, SessionWaiting.razor, TranscriptCanvas.razor, SessionHub.cs  
**Status:** ✅ Active and Working  
**Last Updated:** 2025-01-17

---

## Overview

The **Transcript Canvas** feature allows session hosts to share session transcripts with participants. When the host clicks "Share Transcript", the transcript loads in the host's control panel AND automatically broadcasts to all participants via SignalR, navigating them from the waiting room to TranscriptCanvas.razor.

This mirrors the "Start Session" button behavior:
- **Start Session**: Participants navigate from waiting room → SessionCanvas.razor
- **Share Transcript**: Participants navigate from waiting room → TranscriptCanvas.razor

---

## Architecture Flow

```
Host clicks "Share Transcript" button (HostControlPanelSidebar.razor)
    ↓
ShareTranscript() method (HostControlPanel.razor)
    ↓
1. Load transcript from API via GetSessionDetailsFromApiAsync()
2. Set isBroadcastMode = true (shows transcript panel for host)
3. Transform transcript HTML for broadcast mode (removes buttons)
4. Auto-call BroadcastFullTranscript()
    ↓
BroadcastFullTranscript() method (HostControlPanel.razor)
    ↓
SignalR Hub: hubConnection.InvokeAsync("BroadcastTranscriptShared", sessionId, transcript)
    ↓
SessionHub.cs: BroadcastTranscriptShared(int sessionId, string transcriptHtml)
    ↓
Broadcast to group: session_{sessionId}
    ↓
SessionWaiting.razor: TranscriptShared listener receives event
    ↓
Navigation.NavigateTo($"/transcript/canvas/{SessionToken}")
    ↓
Participants land on TranscriptCanvas.razor (purple-themed transcript view)
```

---

## Key Files

### 1. HostControlPanel.razor
**Location:** `SPA/NoorCanvas/Pages/HostControlPanel.razor`

**ShareTranscript() Method (Lines 1298-1365):**
- Loads latest transcript from API via `GetSessionDetailsFromApiAsync()`
- Sets `isBroadcastMode = true` to show transcript panel for host
- Transforms transcript HTML to remove delete/share buttons
- **Auto-calls `BroadcastFullTranscript()`** to navigate participants

**BroadcastFullTranscript() Method (Lines 1367-1423):**
- Validates session data and SignalR connection
- Calls `hubConnection.InvokeAsync("BroadcastTranscriptShared", sessionId, transcript)`
- **Keeps `isBroadcastMode = true`** so host can view transcript after broadcast
- Shows success toast notification

**UI Visibility Logic (Line 81):**
```razor
@if (Model?.SessionStatus == "Active" || Model?.SessionStatus == "Ended" || isBroadcastMode)
{
    <HostControlPanelContent ... />
}
```
The `|| isBroadcastMode` condition ensures transcript panel displays even when session status is "Waiting".

---

### 2. HostControlPanelSidebar.razor
**Location:** `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor`

**Share Transcript Button (Line 68):**
```razor
<button @onclick="OnShareTranscript" 
        disabled="@(IsLoading || string.IsNullOrEmpty(UserToken))"
        style="...">
    <i class="fa-solid fa-scroll">📜</i>
    <span>Share Transcript</span>
</button>
```

---

### 3. SessionHub.cs
**Location:** `SPA/NoorCanvas/Hubs/SessionHub.cs`

**BroadcastTranscriptShared Method (Lines 557-575):**
```csharp
public async Task BroadcastTranscriptShared(int sessionId, string transcriptHtml)
{
    var groupName = $"session_{sessionId}";
    await Clients.Group(groupName).SendAsync("TranscriptShared", new
    {
        sessionId = sessionId,
        transcriptHtml = transcriptHtml,
        sharedAt = DateTime.UtcNow,
        timestamp = DateTime.UtcNow
    });
}
```

---

### 4. SessionWaiting.razor
**Location:** `SPA/NoorCanvas/Pages/SessionWaiting.razor`

**TranscriptShared Listener (Lines 1473-1503):**
```csharp
_hubConnection.On<object>("TranscriptShared", async (transcriptData) =>
{
    try
    {
        Logger.LogInformation("[DEBUG-WORKITEM:transcript-canvas:broadcast] TranscriptShared event received in waiting room ;CLEANUP_OK");
        
        var json = System.Text.Json.JsonSerializer.Serialize(transcriptData);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        
        int sessionId = 0;
        if (root.TryGetProperty("sessionId", out var sessionIdElement))
        {
            sessionId = sessionIdElement.GetInt32();
        }
        
        Logger.LogInformation("[DEBUG-WORKITEM:transcript-canvas:broadcast] Transcript shared for session {SessionId}, navigating to transcript canvas ;CLEANUP_OK", sessionId);
        
        // Navigate all participants to transcript canvas view
        await InvokeAsync(() =>
        {
            if (!string.IsNullOrEmpty(SessionToken))
            {
                Logger.LogInformation("[DEBUG-WORKITEM:transcript-canvas:broadcast] Navigating to /transcript/canvas/{SessionToken} ;CLEANUP_OK", SessionToken);
                Navigation.NavigateTo($"/transcript/canvas/{SessionToken}");
            }
        });
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[DEBUG-WORKITEM:transcript-canvas:broadcast] Error handling TranscriptShared event ;CLEANUP_OK");
    }
});
```

---

### 5. TranscriptCanvas.razor
**Location:** `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Route:** `/transcript/canvas/{sessionToken}`  
**Purpose:** Participant view for broadcasted transcript (purple-themed to distinguish from SessionCanvas)  
**UI Theme:** Purple color scheme to differentiate from green SessionCanvas

---

## Issue Resolution History

### Issue #1: Share Transcript Does Nothing (2025-01-17)
**Problem:** Clicking "Share Transcript" button had no visible effect  
**Root Cause:** UI visibility issue - transcript loaded but panel hidden  
**Fix:** Added `|| isBroadcastMode` to conditional rendering at line 81  
**Commit:** cc16e27f  

### Issue #2: Participants Not Navigating (2025-01-17)
**Problem:** Transcript loaded for host but participants remained in waiting room  
**User Expectation:** "It should have moved users from waiting room to TranscriptCanvas.razor"  
**Root Cause:** ShareTranscript() only loaded transcript, didn't broadcast to participants  
**Fix:** ShareTranscript() now auto-calls BroadcastFullTranscript() after loading transcript  
**Additional Fix:** BroadcastFullTranscript() keeps isBroadcastMode=true so host can view transcript  
**Commit:** b733932c  

---

## Testing Data

**Test Session:** 212  
**User Token:** KJAHA99L  
**Host Token:** PQ9N5YWW  
**Debug Level:** trace (comprehensive logging)  

**Expected Behavior:**
1. Host clicks "Share Transcript" button
2. Transcript loads from API and displays in HostControlPanel
3. SignalR automatically broadcasts TranscriptShared event to session_212 group
4. All participants in waiting room navigate to `/transcript/canvas/{their-token}`
5. Host sees transcript with "Broadcast to All" button (can re-broadcast if needed)
6. Participants see purple-themed transcript view (TranscriptCanvas.razor)

---

## Diagnostic Logging

All transcript canvas operations use `[DIAGNOSTIC:transcript-canvas:*]` markers with `;CLEANUP_OK` suffix:

- `[DIAGNOSTIC:transcript-canvas:share:ENTRY]` - ShareTranscript() flow start
- `[DIAGNOSTIC:transcript-canvas:share:STEP-1]` - Fetching transcript from API
- `[DIAGNOSTIC:transcript-canvas:share:STEP-2]` - Calling GetSessionDetailsFromApiAsync
- `[DIAGNOSTIC:transcript-canvas:share:STEP-3]` - API response received
- `[DIAGNOSTIC:transcript-canvas:share:STEP-4]` - Setting isBroadcastMode=true
- `[DIAGNOSTIC:transcript-canvas:share:STEP-5]` - Transforming transcript HTML
- `[DIAGNOSTIC:transcript-canvas:share:STEP-6]` - Transcript loaded into Model
- `[DIAGNOSTIC:transcript-canvas:share:STEP-7]` - Auto-calling BroadcastFullTranscript
- `[DIAGNOSTIC:transcript-canvas:share:STEP-8]` - Broadcast completed
- `[DIAGNOSTIC:transcript-canvas:share:COMPLETE]` - ShareTranscript() flow end
- `[DIAGNOSTIC:transcript-canvas:share:ERROR]` - Error handling
- `[DIAGNOSTIC:transcript-canvas:share:EXIT]` - Finally block

- `[DIAGNOSTIC:transcript-canvas:broadcast:ENTRY]` - BroadcastFullTranscript() flow start
- `[DIAGNOSTIC:transcript-canvas:broadcast:STEP-1]` - Validation passed
- `[DIAGNOSTIC:transcript-canvas:broadcast:STEP-2]` - HubConnection state check
- `[DIAGNOSTIC:transcript-canvas:broadcast:STEP-3]` - Invoking SignalR BroadcastTranscriptShared
- `[DIAGNOSTIC:transcript-canvas:broadcast:STEP-4]` - SignalR call completed
- `[DIAGNOSTIC:transcript-canvas:broadcast:STEP-5]` - Keeping isBroadcastMode=true
- `[DIAGNOSTIC:transcript-canvas:broadcast:COMPLETE]` - Broadcast flow complete
- `[DIAGNOSTIC:transcript-canvas:broadcast:ERROR]` - Error handling

- `[DEBUG-WORKITEM:transcript-canvas:broadcast]` - SessionWaiting.razor listener logs

---

## Related Features

### Start Session Flow (Comparison)
**Button:** "Start Session" (HostControlPanelSidebar.razor)  
**Method:** `StartSession()` (HostControlPanel.razor)  
**SignalR Event:** "SessionStarted"  
**Listener:** SessionWaiting.razor  
**Navigation:** `/session/canvas/{sessionToken}` (SessionCanvas.razor - green theme)  
**Purpose:** Start session with live content sharing

### Share Transcript Flow (Current Feature)
**Button:** "Share Transcript" (HostControlPanelSidebar.razor)  
**Method:** `ShareTranscript()` + auto-call `BroadcastFullTranscript()` (HostControlPanel.razor)  
**SignalR Event:** "TranscriptShared"  
**Listener:** SessionWaiting.razor  
**Navigation:** `/transcript/canvas/{sessionToken}` (TranscriptCanvas.razor - purple theme)  
**Purpose:** Share historical transcript without live session

---

## Future Considerations

1. **Broadcast History:** Track when transcripts were broadcast (timestamp, host name)
2. **Re-broadcast Control:** UI feedback if transcript already broadcast
3. **Participant Confirmation:** Show which participants successfully navigated
4. **Offline Participants:** Handle participants who join after broadcast
5. **Transcript Updates:** Real-time sync if host modifies transcript after broadcast

---

## Build Status

✅ **Clean Build:** 0 errors, 0 warnings  
✅ **SignalR Infrastructure:** Verified working (hub method, listener, group messaging)  
✅ **UI Visibility:** Fixed with `|| isBroadcastMode` condition  
✅ **Auto-broadcast:** Implemented - ShareTranscript now calls BroadcastFullTranscript  
✅ **Host View Persistence:** isBroadcastMode stays true after broadcast  

---

## Keywords

transcript, broadcast, signalr, participants, navigation, waiting room, TranscriptCanvas, HostControlPanel, SessionWaiting, SessionHub, share transcript, auto-broadcast, purple theme, session transcript
