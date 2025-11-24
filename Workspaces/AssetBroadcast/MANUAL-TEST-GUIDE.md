# Asset Broadcasting Fix - Manual Verification Guide

**Purpose**: Verify the SignalR AssetContentReceived fix works end-to-end  
**Duration**: 10-15 minutes  
**Status**: Ready for execution

---

## Pre-Requisites

✅ App built successfully (0 errors)  
✅ App running on https://localhost:9091  
✅ Code changes complete (SessionCanvas + TranscriptCanvas cleaned)  

---

## Test Procedure

### Step 1: Create a Test Session

1. Open browser: https://localhost:9091/admin
2. Fill in session details:
   - Session Title: "Asset Broadcast Manual Test"
   - Admin Email: "test@example.com"
   - Admin Name: "Test Admin"
3. Click **Create Session**
4. You should be redirected to Host Control Panel
5. **Copy the session URL from the address bar**

### Step 2: Open Participant Views

1. **Open SessionCanvas (Participant 1)**:
   - Open a **new browser tab** (or incognito window)
   - Navigate to the session URL (participant view)
   - If prompted, enter name: "Participant 1"
   - Click "Join Session"
   - **Open Browser DevTools** (F12)
   - Go to **Console** tab

2. **Open TranscriptCanvas (Participant 2)**:
   - Open **another new browser tab**
   - Navigate to the session URL again
   - If prompted, enter name: "Participant 2"  
   - Click "Join Session"
   - **Open Browser DevTools** (F12)
   - Go to **Console** tab

### Step 3: Share an Asset from Host

1. Switch back to **Host Control Panel** tab
2. Scroll to find an Ayah card with a **Share** button
3. Click **Share** button
4. **Expected**: See success toast: "Asset shared successfully"

### Step 4: Verify Reception on Participants

#### Check Participant 1 (SessionCanvas)

1. Switch to **Participant 1** browser tab
2. **Check Console** for logs:
   - ✅ Look for: `[ASSET-RECEIVED-TRACE] AssetContentReceived event fired`
   - ✅ Look for: SignalR event processing logs
   - ❌ Should NOT see duplicate logs (same event fired twice)
   - ❌ Should NOT see JavaScript errors

3. **Check Visual Display**:
   - ✅ Asset should appear in the canvas content area
   - ✅ Asset should be styled/formatted correctly
   - ✅ Asset should match what was shared from host

#### Check Participant 2 (TranscriptCanvas)

1. Switch to **Participant 2** browser tab
2. **Check Console** for logs:
   - ✅ Look for: `[ASSET-RECEIVED-TRACE] AssetContentReceived event fired`
   - ✅ Look for: SignalR event processing logs
   - ❌ Should NOT see duplicate logs
   - ❌ Should NOT see JavaScript errors

3. **Check Visual Display**:
   - ✅ Asset should appear in the transcript view
   - ✅ Asset should be styled/formatted correctly

---

## Success Criteria

### ✅ PASS Conditions

1. **Host Side**:
   - Share button click triggers success toast
   - No JavaScript errors in console

2. **Participant 1 (SessionCanvas)**:
   - `AssetContentReceived` event received in console
   - Asset renders visually in canvas
   - Single event firing (no duplicates)
   - No JavaScript errors

3. **Participant 2 (TranscriptCanvas)**:
   - `AssetContentReceived` event received in console
   - Asset renders visually in transcript
   - Single event firing (no duplicates)
   - No JavaScript errors

4. **Latency**:
   - Asset appears on participant views within 1-2 seconds of host sharing

### ❌ FAIL Conditions

1. Host share button clicked but **participants see nothing**
2. **Duplicate events** in participant consoles (same event logged 2+ times)
3. JavaScript errors or exceptions in any browser console
4. Asset doesn't render visually despite event firing
5. Latency >5 seconds between host share and participant display

---

## Troubleshooting

### Problem: Participants Don't See Asset

**Diagnosis Steps**:

1. Check participant console for `AssetContentReceived` logs
   - If NO logs → SignalR connection or broadcast issue
   - If YES logs but no visual → rendering issue

2. Check SignalR connection state:
   ```javascript
   // Run in participant browser console
   window.hubConnectionState
   // Should return "Connected"
   ```

3. Check if participant joined session successfully:
   ```javascript
   // Run in participant browser console
   localStorage.getItem('session_active')
   // Should return session data
   ```

### Problem: Duplicate Event Logs

**Diagnosis**:
- If you see the SAME event logged 2+ times → Duplicate handlers still exist
- Check which file has the problem:
  - SessionCanvas.razor line 2862 (should be only AssetContentReceived handler)
  - TranscriptCanvas.razor line 3037 (should be only AssetContentReceived handler)

**Fix**:
```bash
# Search for remaining duplicates
grep -n "hubConnection\.On.*AssetContentReceived" SPA/NoorCanvas/Pages/SessionCanvas.razor
# Should show exactly 1 match at line 2862
```

### Problem: Assets Don't Render Visually

**Diagnosis**:
- Events fire correctly but nothing appears on screen
- Check if `OnAssetShared` callback is wired up
- Check if DOM selector `.canvas-content-area` exists

**Fix**: Check service handler implementation:
```csharp
// File: SPA/NoorCanvas/Services/SessionCanvasSignalRService.cs
// Line ~130: HandleAssetContentReceivedAsync should invoke onAssetReceived?.Invoke(htmlContent)
```

---

## Logging Reference

### Expected Console Logs (Good ✅)

**Host Console** (after clicking Share):
```
[20:45:12.345 INFO] Asset shared successfully
[ASSET-SHARING] Broadcast initiated for session_123
```

**Participant Console** (after receiving):
```
[ASSET-RECEIVED-TRACE] ════════════════════════════════════════
[ASSET-RECEIVED-TRACE] AssetContentReceived event fired
[ASSET-RECEIVED-TRACE] Tracking ID: abc12345
[ASSET-RECEIVED-TRACE] Receive timestamp: 1732474512345
[ASSET-RECEIVED-TRACE] HTML content length: 2048 characters
[ASSET-RECEIVED-TRACE] ════════════════════════════════════════
[SignalR] HandleAssetContentReceivedAsync processing complete
```

### Problematic Logs (Bad ❌)

**Duplicate Event Firing**:
```
[ASSET-RECEIVED-TRACE] AssetContentReceived event fired  ← First firing
[ASSET-RECEIVED-TRACE] AssetContentReceived event fired  ← Duplicate!
```

**JavaScript Errors**:
```
Uncaught TypeError: Cannot read property 'OnAssetShared' of null
hubConnection.On is not a function
```

---

## Results Documentation

### Test Execution Record

| Step | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| 1. Session Created | Host Control Panel loaded | | |
| 2. Participant 1 Joined | "Participant 1" connected | | |
| 3. Participant 2 Joined | "Participant 2" connected | | |
| 4. Host Shares Asset | Success toast shown | | |
| 5. P1 Console Logs | AssetContentReceived logged | | |
| 6. P1 Visual Display | Asset rendered | | |
| 7. P2 Console Logs | AssetContentReceived logged | | |
| 8. P2 Visual Display | Asset rendered | | |
| 9. No Duplicates | Single event firing | | |
| 10. No Errors | Clean console logs | | |

**Overall Result**: [ ] PASS / [ ] FAIL

**Notes**:
(Add any observations, screenshots, or additional details here)

---

## Next Actions

### If Tests PASS ✅
1. Mark Phase 5 as complete (manual verification)
2. Proceed to Phase 7 (cleanup obsolete logging)
3. Document the fix in ASSET-BROADCAST-FIX-COMPLETE.md
4. Create git commit with all changes
5. Close the original GitHub issue

### If Tests FAIL ❌
1. Document failure symptoms in PHASE-5-TEST-RESULTS.md
2. Review server-side logs for SignalR broadcasts:
   ```bash
   grep "AssetContentReceived" logs/noorcanvas.log
   ```
3. Check SessionHub.cs `PublishAssetContent` method
4. Verify participant group membership:
   ```csharp
   // Check if participants are in session group
   await Clients.Group($"session_{sessionId}").SendAsync(...)
   ```
5. Consider rollback if unfixable:
   ```bash
   git reset --hard HEAD~1
   ```

---

## Conclusion

This manual test validates the complete asset broadcasting flow:

1. **Host** clicks Share → AssetSharingService.ShareAssetAsync
2. **Server** SessionHub.PublishAssetContent → SignalR broadcast
3. **Participants** receive AssetContentReceived event
4. **Service** SessionCanvasSignalRService.HandleAssetContentReceivedAsync
5. **Callback** OnAssetShared invoked
6. **DOM** Asset rendered in canvas content area

**The fix is complete when all steps execute without duplicates or errors.**
