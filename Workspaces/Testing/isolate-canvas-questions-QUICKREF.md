# Quick Reference: Canvas Questions Isolation Test

## 🎯 Purpose
Test question posting and editing with SignalR real-time propagation to participants and host.

## 🔗 Access
```
Route: /isolated/canvas-questions
URL: https://localhost:5001/isolated/canvas-questions
```

## ⚡ Quick Start

### 1. Prerequisites
- Running NoorCanvas application
- Valid session in database (Status = "Active" or "Configured")
- Test participant registered for that session

### 2. Required Parameters
```
sessionToken: [8-char token]    e.g., "abc12345"
userGuid: [participant GUID]    e.g., "12345678-1234-1234-1234-123456789abc"
questionText: [any text]        e.g., "What is the meaning of Surah Al-Fatiha?"
```

### 3. Test Flow
```
1. Enter parameters
2. Click "Connect SignalR"
3. Click "Submit Question"
4. Watch debug logs
5. See question in Live Preview
```

## 📊 What to Observe

### Success Indicators ✅
- API returns 200 OK
- Question appears in Live Preview
- Debug logs show "QuestionReceived" event
- SignalR status badge = "Connected"
- Test result card shows "PASS"

### Failure Indicators ❌
- API returns 4xx/5xx
- Question does NOT appear
- Debug logs show errors
- Test result card shows "FAIL"

## 🔍 Key Debug Logs to Watch

```
[DEBUG-WORKITEM:isolate-canvas-questions:ui:*] Validation passed
[DEBUG-WORKITEM:isolate-canvas-questions:api:*] API Response - StatusCode: 200
[DEBUG-WORKITEM:isolate-canvas-questions:signalr:*] QuestionReceived event triggered
[DEBUG-WORKITEM:isolate-canvas-questions:signalr:*] Question added to list
```

## 🎨 Visual Cues

### Question Cards
- **Green border** = Your question (edit/delete buttons visible)
- **Sienna border** = Other user's question (upvote button visible)

### Status Badges
- **Green** = Connected
- **Yellow** = Connecting/Reconnecting
- **Red** = Disconnected

## 🧪 Test Scenarios

1. **Submit New Question** - Basic post flow
2. **Edit Existing Question** - Update flow
3. **Vote on Question** - Upvote flow
4. **Multiple Users** - Race condition test
5. **SignalR Disconnect** - Resilience test

## 🐛 Common Issues

### "Session not found"
- Check sessionToken is correct (8 chars)
- Verify session exists in database
- Ensure session Status = "Active" or "Configured"

### "User not registered"
- Check userGuid matches participant in database
- Verify participant.SessionId matches session

### "SignalR not receiving events"
- Check SignalR status badge = "Connected"
- Verify SessionId resolved from token
- Check group name casing (must be lowercase: `session_123`)

## 📁 Files

### Created
- `SPA/NoorCanvas/Pages/Isolated/CanvasQuestionsIsolation.razor`
- `Workspaces/Testing/isolate-canvas-questions.md` (full documentation)
- `Workspaces/Testing/isolate-canvas-questions-SUMMARY.md` (summary)

### Related
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` (source)
- `SPA/NoorCanvas/Controllers/QuestionController.cs` (API)

## 🔧 Troubleshooting

### Build Issues
```powershell
cd "D:\PROJECTS\NOOR CANVAS"
dotnet build SPA/NoorCanvas/NoorCanvas.csproj
```

### Runtime Issues
```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run
```

### Database Check
```sql
-- Check session
SELECT SessionId, UserToken, Status FROM Sessions WHERE UserToken = 'abc12345';

-- Check participant
SELECT ParticipantId, SessionId, UserGuid, Name FROM Participants WHERE UserGuid = '...';
```

## 📞 Need Help?

1. Check **Debug Log Viewer** section (bottom of page)
2. Check **Test Results** section (shows pass/fail)
3. Check browser console (F12) for JavaScript errors
4. Review full documentation: `Workspaces/Testing/isolate-canvas-questions.md`

---

**Status**: Ready for Testing  
**Last Updated**: 2025-10-13  
**Key**: canvas-questions
