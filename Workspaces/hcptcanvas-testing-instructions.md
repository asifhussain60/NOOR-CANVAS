# H2 Section Share Buttons - Manual Testing Instructions

## Commit
**Latest**: `49bdaace` - Comprehensive diagnostic logging added

## What Changed
1. **JavaScript logging** (transcript-section-parser.js):
   - Colored console output for easy identification
   - Step-by-step container waiting and h2 detection
   - Button creation and injection verification
   - Final DOM verification with button count

2. **C# logging** (HostControlPanel.razor):
   - ShareTranscript method: Full transcript preview and flow tracking
   - HandleTranscriptRendered callback: Complete button injection lifecycle
   - Exception details with stack traces

## Testing Steps

### 1. Start the Application
```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run
```

Wait for: `Now listening on: https://localhost:9091`

### 2. Open Browser with Dev Tools
1. Navigate to: `https://localhost:9091/host/control-panel/PQ9N5YWW`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Filter console to show only: `hcp-tcanvas`

### 3. Perform Test Action
1. Click the **"Share Transcript"** button (gold button with scroll icon)
2. Wait for transcript to load (should take 2-3 seconds)

### 4. What to Look For

#### Browser Console Logs (Look for these colored sections):
```
🟢 [TRACE:hcp-tcanvas:inject] ════════ BUTTON INJECTION START ════════
   - Timestamp and ready state
   - Waiting for container...
   
🟡 [TRACE:hcp-tcanvas:wait] Waiting for container: transcript-content-container
   - Attempt 1/20, 2/20, etc.
   - ✅ Container found after X attempts
   
🟢 [TRACE:hcp-tcanvas:inject] ✅ Container found!
   - Container innerHTML length: XXXXX chars
   - Found X h2 elements
   
🟡 [TRACE:hcp-tcanvas:inject] ━━━ Processing h2[0] ━━━
   - h2 text: "..."
   - Section 0 contains X elements
   - Created share button
   - ✅ Inserted share button above h2[0]
   - ✅ Wrapped section content
   (Repeat for each h2)
   
🟢 [TRACE:hcp-tcanvas:inject] ✅ SUCCESS! Processed X sections
   - Final verification - buttons in DOM: X
   - Button[0]: text, visible, dimensions
   
🟢 [TRACE:hcp-tcanvas:inject] ════════ BUTTON INJECTION COMPLETE ════════
```

#### Server Logs (In terminal where dotnet run is running):
```
[DIAGNOSTIC:transcript-canvas:share:ENTRY] ════════ SHARE TRANSCRIPT FLOW START ════════
[DIAGNOSTIC:transcript-canvas:share:STEP-3] ✅ API returned transcript: XXXXX chars
[DIAGNOSTIC:transcript-canvas:share:STEP-5] Transformed transcript: XXXXX chars
[DIAGNOSTIC:transcript-canvas:share:STEP-6] StateHasChanged called

[TRACE:hcp-tcanvas:inject] ════════ HANDLE TRANSCRIPT RENDERED ════════
[TRACE:hcp-tcanvas:inject] Model.TransformedTranscript length: XXXXX chars
[TRACE:hcp-tcanvas:inject] Calling JSRuntime.InvokeAsync
[TRACE:hcp-tcanvas:inject] JavaScript injection call returned
[TRACE:hcp-tcanvas:inject] Result - Success: True, Sections: X
[TRACE:hcp-tcanvas:inject] ✅ Share buttons injected successfully: X sections
```

#### Visual Verification:
1. **Buttons should appear** above each H2 heading
2. **Button text** should say: "Share [H2 heading text]"
3. **Button styling**: Gold (#D4AF37) background, white text
4. **H2 headings** should be left-justified
5. **Hover effect**: Button turns lighter gold and lifts slightly

### 5. Test Button Click (If buttons appear)
1. Click on any "Share [section]" button
2. Look for console log:
   ```
   🟡 [TRACE:hcp-tcanvas:share-section] ════════ SHARE SECTION CLICK ════════
      Button clicked: Share [section name]
      Section ID: transcript-section-X
      Calling C# method: ShareTranscriptSection
   ```

## Expected Outcomes

### ✅ SUCCESS Case:
- Browser console shows 6+ h2 elements found
- Browser console shows "SUCCESS! Processed X sections"
- Browser console shows "Final verification - buttons in DOM: X"
- Visual: Gold share buttons visible above each H2
- Server logs show "✅ Share buttons injected successfully: X sections"

### ❌ FAILURE Cases & What They Mean:

#### Case 1: Container not found
```
❌ Container NOT FOUND after timeout: transcript-content-container
```
**Means**: DOM rendering timing issue - container exists but Blazor hasn't rendered it yet
**Next step**: Increase wait time or check OnAfterRenderAsync callback

#### Case 2: Container empty
```
Container innerHTML length: 0 chars
```
**Means**: Container rendered but TransformedTranscript is empty
**Next step**: Check ShareTranscript method - API call or transformation failing

#### Case 3: No H2 elements
```
⚠️ NO h2 elements found in transcript
All headings (h1-h6): 0
```
**Means**: Transcript HTML doesn't contain H2 tags
**Next step**: Check TransformTranscriptForBroadcastAsync - might be stripping H2s

#### Case 4: Buttons not visible
```
Final verification - buttons in DOM: X
Button[0]: visible: false
```
**Means**: Buttons created but CSS display:none or visibility:hidden
**Next step**: Check CSS rules or parent container display

## What to Report Back

Please copy and paste:

1. **Full browser console output** (filtered for `hcp-tcanvas`)
2. **Server log output** (from "SHARE TRANSCRIPT FLOW START" to "HANDLE TRANSCRIPT RENDERED COMPLETE")
3. **Screenshot** of the Host Control Panel showing the transcript area
4. **Outcome**: Buttons visible? If yes, how many? If no, which failure case?

## Quick Commands

### Stop app:
```powershell
Stop-Process -Name "NoorCanvas" -Force
```

### Rebuild and restart:
```powershell
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet build
dotnet run
```

### Check commit:
```powershell
git log -1 --oneline
# Should show: 49bdaace feat(hcptcanvas): add comprehensive diagnostic logging
```

---

**Ready to test!** Start the app, open the browser, click "Share Transcript", and let me know what you see in the console and server logs.
