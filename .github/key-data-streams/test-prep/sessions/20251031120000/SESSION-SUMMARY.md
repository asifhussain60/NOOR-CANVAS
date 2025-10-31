# Test-Prep Session 20251031120000

**Session ID**: `20251031120000`  
**Date**: October 31, 2025 12:00:00 UTC  
**Status**: ✅ **MARKERS INJECTED - READY FOR TESTING**

---

## 📋 Executive Summary

This test-prep session prepares three core Razor components for comprehensive UI interaction logging:

1. **HostControlPanel** (with child components) - Host session management
2. **SessionCanvas** - Participant interactive canvas
3. **TranscriptCanvas** - Participant transcript viewer

**Total Markers Injected**: 18 across 6 files

---

## 🎯 Component Breakdown

### 1. HostControlPanel Components

#### HostControlPanelSidebar.razor
- **Markers**: 1
- `20251031120000-HostControlPanel-StartSession` - Button to initiate new session

#### HostControlPanelContent.razor
- **Markers**: 3
- `20251031120000-HostControlPanel-QAToggle` - Toggle Q&A panel visibility
- `20251031120000-HostControlPanel-BroadcastTranscript` - FAB to broadcast transcript
- `20251031120000-HostControlPanel-EndSession` - Button to terminate active session

#### QuestionCard.razor
- **Markers**: 3
- `20251031120000-HostControlPanel-ShareQuestion` - Click handler to share question as asset
- `20251031120000-HostControlPanel-MarkAnswered` - Approve button
- `20251031120000-HostControlPanel-DeleteQuestion` - Delete button

**Subtotal**: 7 markers

---

### 2. SessionCanvas.razor
- **Markers**: 7
- `20251031120000-SessionCanvas-QuestionInput` - Textarea for typing questions
- `20251031120000-SessionCanvas-QuestionSubmit` - Submit button
- `20251031120000-SessionCanvas-TabQA` - Switch to Q&A tab
- `20251031120000-SessionCanvas-TabParticipants` - Switch to Participants tab
- `20251031120000-SessionCanvas-EditQuestion` - Edit own question icon
- `20251031120000-SessionCanvas-DeleteQuestion` - Delete own question icon
- `20251031120000-SessionCanvas-VoteQuestion` - Upvote button for other users' questions

**Subtotal**: 7 markers

---

### 3. TranscriptCanvas.razor
- **Markers**: 4
- `20251031120000-TranscriptCanvas-QuestionModalToggle` - FAB to open question modal
- `20251031120000-TranscriptCanvas-QuestionInput` - Textarea in modal
- `20251031120000-TranscriptCanvas-QuestionSubmit` - Submit button in modal
- `20251031120000-TranscriptCanvas-QuestionCancel` - Cancel button in modal

**Subtotal**: 4 markers

---

## 🧪 Test Scenarios

### Scenario A: Host Broadcast Flow
**URL**: `https://localhost:9091/host/control-panel/{HOST_TOKEN}`

**Steps**:
1. Click **Start Session** button → Logs `StartSession` marker
2. Wait for session activation (SignalR updates)
3. Click **Q&A toggle** button → Logs `QAToggle` marker
4. Click **question card** → Logs `ShareQuestion` marker
5. Click **Mark Answered** on a question → Logs `MarkAnswered` marker
6. Click **FAB Broadcast Transcript** → Logs `BroadcastTranscript` marker
7. Click **End Session** → Logs `EndSession` marker

**Expected Markers**: 6 logs in `playwright-interaction-logs.txt`

---

### Scenario B: Participant Q&A (SessionCanvas)
**URL**: `https://localhost:9091/session/canvas/{USER_TOKEN}`

**Steps**:
1. Type question in textarea → Logs `QuestionInput` marker
2. Click **Submit** → Logs `QuestionSubmit` marker
3. Click **Q&A tab** → Logs `TabQA` marker
4. Click **Participants tab** → Logs `TabParticipants` marker
5. Click **Vote button** on another user's question → Logs `VoteQuestion` marker
6. Click **Edit icon** on own question → Logs `EditQuestion` marker
7. Click **Delete icon** on own question → Logs `DeleteQuestion` marker

**Expected Markers**: 7 logs in `playwright-interaction-logs.txt`

---

### Scenario C: Participant Q&A (TranscriptCanvas)
**URL**: `https://localhost:9091/transcript/canvas/{USER_TOKEN}`

**Steps**:
1. Click **FAB question button** → Logs `QuestionModalToggle` marker
2. Type question in modal textarea → Logs `QuestionInput` marker
3. Click **Submit** → Logs `QuestionSubmit` marker
4. Re-open modal and click **Cancel** → Logs `QuestionCancel` marker

**Expected Markers**: 4 logs in `playwright-interaction-logs.txt`

---

## 📁 Logging Infrastructure

### Client-Side Logging
- **Script**: `wwwroot/js/PlaywrightLogger.js`
- **Log File**: `playwright-interaction-logs.txt` (auto-created in app root)
- **Endpoint**: `POST /api/playwright-logs`
- **Auto-Save**: Every 5 seconds OR when 10 events buffered
- **Format**: JSON structured logs with timestamp, marker ID, element type

### Server-Side Logging
- **Config**: `appsettings.Development.json` (Serilog section)
- **Log File**: `playwright-server-logs.txt`
- **Provider**: Serilog File Sink
- **Scope**: SignalR broadcasts, API calls, Blazor component lifecycle

---

## 🚀 Running Manual Tests

### 1. Start Application
```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run
```

**Expected Output**:
```
Now listening on: https://localhost:9091
Application started. Press Ctrl+C to shut down.
```

---

### 2. Get Test Tokens

**Option A**: Use existing tokens from previous sessions:
- Check `.github/key-data-streams/test-prep/sessions/*/SESSION-*.md` files

**Option B**: Generate new tokens via HostProvisioner:
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
dotnet run -- create --session-id 999 --created-by "Manual Test Session" --dry-run false
```

**Tokens will be displayed in console output**:
```
Host Token: ABC12345
User Token: XYZ67890
```

---

### 3. Test Navigation

| Role        | URL Pattern                                         | Example                                           |
|-------------|-----------------------------------------------------|---------------------------------------------------|
| Host        | `/host/control-panel/{HOST_TOKEN}`                 | `/host/control-panel/ABC12345`                   |
| Participant | `/session/canvas/{USER_TOKEN}`                     | `/session/canvas/XYZ67890`                       |
| Participant | `/transcript/canvas/{USER_TOKEN}`                  | `/transcript/canvas/XYZ67890`                    |

---

### 4. Verify Logs

#### Check Client Logs (Interaction Events)
```powershell
Get-Content "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\playwright-interaction-logs.txt" -Tail 50
```

**Expected Format**:
```json
{
  "timestamp": "2025-10-31T12:15:30.123Z",
  "markerId": "20251031120000-HostControlPanel-StartSession",
  "elementType": "button",
  "action": "click",
  "url": "https://localhost:9091/host/control-panel/ABC12345"
}
```

#### Check Server Logs (Blazor/SignalR Events)
```powershell
Get-Content "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\playwright-server-logs.txt" -Tail 50
```

**Expected Format**:
```
[12:15:30 INF] SignalR: Broadcasting transcript to session 999
[12:15:31 INF] SignalR: Question submitted by user XYZ67890
```

---

## 🧹 Cleanup After Testing

### Remove All Markers (Session 20251031120000)
```powershell
# Search for markers
Get-ChildItem -Path "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas" -Recurse -Filter "*.razor" | 
    Select-String -Pattern "20251031120000" | 
    Select-Object -ExpandProperty Path -Unique

# Manual cleanup: Edit each file and remove data-playwright-log-marker attributes
```

**Automated Cleanup Script** (Future Enhancement):
```powershell
# .github/key-data-streams/test-prep/cleanup-markers.ps1
param([string]$SessionId)
# Remove all markers matching session ID pattern
```

---

## 📊 Success Criteria

✅ **All 18 markers injected successfully**  
✅ **No old session markers remaining** (`20251031150000`, `20251031150100`, `20251031150200` cleaned)  
✅ **Session tracking file created** (`injected-files.json`)  
✅ **Logging infrastructure verified** (PlaywrightLogger.js, appsettings.Development.json)  
✅ **Test scenarios documented** (3 scenarios with 17 total expected events)

---

## 📝 Notes

1. **Session ID Format**: `YYYYMMDDHHmmss` (ISO 8601 compact)
   - Example: `20251031120000` = October 31, 2025, 12:00:00 UTC

2. **Marker Naming Convention**: `{SessionId}-{Component}-{Action}`
   - Example: `20251031120000-HostControlPanel-StartSession`

3. **Auto-Save Behavior**: Client logger writes to file automatically—**no manual export needed**

4. **Browser Console**: Optional—logs are visible in F12 DevTools but auto-save independently

5. **Production Safety**: These markers are for **development testing only**—must be removed before deployment

---

## 🔗 Related Files

- **Session Tracking**: `.github/key-data-streams/test-prep/sessions/20251031120000/injected-files.json`
- **Client Logger**: `SPA/NoorCanvas/wwwroot/js/PlaywrightLogger.js`
- **Server Config**: `SPA/NoorCanvas/appsettings.Development.json`
- **Test-Prep Workflow**: `.github/key-data-streams/test-prep/test-prep.prompt.md`

---

## ✅ Next Steps

1. **Run application**: `dotnet run` in `SPA/NoorCanvas`
2. **Navigate to test URLs** with valid tokens
3. **Execute test scenarios** (A, B, C above)
4. **Verify logs** in both client and server log files
5. **Report findings** or proceed with automated Playwright tests
6. **Clean up markers** before committing code changes

---

**Session Status**: 🟢 **READY FOR TESTING**  
**Last Updated**: October 31, 2025 12:00:00 UTC
