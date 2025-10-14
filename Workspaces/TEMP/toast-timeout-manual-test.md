# Toast Timeout Manual Test - Evidence Gathering

## Purpose
Validate that toasts auto-close after 3 seconds and close button works

## Prerequisites
1. Application running on `https://localhost:9091`
2. Browser DevTools open (F12)
3. Console tab visible

## Test Steps

### Test 1: Auto-Close Timeout (Host View)

1. **Navigate** to `https://localhost:9091/host/session-opener/PQ9N5YWW`

2. **Open Debug Panel**:
   - Click "Debug Panel" button (if collapsed)
   
3. **Open Browser Console** (F12 → Console tab)

4. **Click "Clean Canvas" button**

5. **Observe Console Logs** - You should see:
   ```
   [DEBUG-WORKITEM:toastr:timeout:trace] 🎯 showNoorToast CALLED ;CLEANUP_OK
   [DEBUG-WORKITEM:toastr:timeout:trace] ⏱️ Configured timeout: 3000ms (3 seconds) ;CLEANUP_OK
   [DEBUG-WORKITEM:toastr:timeout:trace] 🕐 Toast display start time: [timestamp]
   [DEBUG-WORKITEM:toastr:timeout:trace] 🎉 SUCCESS toast displayed at [timestamp]
   [DEBUG-WORKITEM:toastr:timeout:trace] ⏱️ Toast still visible after 1xxx ms
   [DEBUG-WORKITEM:toastr:timeout:trace] ⏱️ Toast still visible after 2xxx ms
   [DEBUG-WORKITEM:toastr:timeout:trace] ⏱️ Toast should be closing around 3xxx ms
   [DEBUG-WORKITEM:toastr:timeout:trace] ⏱️ 4s check - elapsed: 4xxx ms, visible toasts: 0
   ```

6. **Visual Observation**:
   - Toast appears in bottom-right corner
   - Progress bar animates across bottom of toast
   - Toast **fades out automatically after ~3 seconds**
   - No toast visible after 4 seconds

7. **✅ PASS Criteria**: 
   - Console shows "Configured timeout: 3000ms"
   - Console shows "visible toasts: 0" at 4s check
   - Toast disappeared visually after 3-4 seconds

8. **❌ FAIL Criteria**:
   - Toast still visible after 4+ seconds
   - Console shows "visible toasts: 1" at 4s check
   - No console logs appear

---

### Test 2: Manual Close Button (Host View)

1. **Navigate** to `https://localhost:9091/host/session-opener/PQ9N5YWW`

2. **Click "Clean Canvas" button** to trigger toast

3. **Immediately click the X button** on the toast (top-right corner of toast)

4. **Visual Observation**:
   - Toast disappears immediately when X is clicked
   - No delay before disappearing

5. **✅ PASS Criteria**:
   - Toast closes instantly when X clicked
   - Cursor shows pointer (hand) when hovering over X

6. **❌ FAIL Criteria**:
   - Clicking X does nothing
   - Toast remains visible after clicking X
   - Cursor doesn't change when hovering over X

---

### Test 3: Auto-Close Timeout (Participant View)

1. **Navigate** to `https://localhost:9091/session/KJAHA99L`

2. **Find any action** that triggers a toast (e.g., upvoting a question, submitting a question)

3. **Trigger the toast** and observe:
   - Toast appears in **top-right corner** (different from host view)
   - Toast auto-closes after ~3 seconds
   - Console logs show 3000ms timeout

4. **✅ PASS Criteria**:
   - Toast positioned in top-right (not bottom-right)
   - Auto-closes after 3 seconds
   - Same behavior as host view

---

## Evidence to Capture

### Screenshot 1: Console Logs
- Take screenshot of browser console showing:
  - `Configured timeout: 3000ms` log
  - `visible toasts: 0` at 4s check
  - Full sequence of lifecycle logs (1s, 2s, 3s, 4s)

### Screenshot 2: Toast Visible
- Take screenshot showing:
  - Toast visible in bottom-right corner
  - Progress bar at bottom of toast
  - Timestamp from screenshot shows it's within 0-3 seconds of clicking

### Screenshot 3: Toast Gone
- Take screenshot showing:
  - No toast visible
  - Timestamp from screenshot shows it's 4+ seconds after clicking
  - Console shows "visible toasts: 0"

### Screenshot 4: Close Button Hover
- Take screenshot showing:
  - Mouse hovering over X button
  - Cursor changed to pointer (hand)
  - X button highlighted (lighter background)

---

## Current Known Issues

**Issue 1: Toasts not auto-closing**
- **Expected**: Toast disappears after 3 seconds
- **Actual (reported)**: Toasts stay visible indefinitely
- **Evidence Needed**: Screenshots + console logs showing timeout not working

**Issue 2: Close button not working**
- **Expected**: Clicking X closes toast immediately
- **Actual (reported)**: Clicking X does nothing
- **Evidence Needed**: Screen recording showing X click with no effect

---

## Technical Details

### Configuration (HostControlPanel.razor & SessionCanvas.razor)
```javascript
const options = {
    timeOut: 3000,              // ← Changed from 10000ms to 3000ms
    extendedTimeOut: 1000,      // ← Changed from 2000ms to 1000ms
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-bottom-right',  // Host view
    // positionClass: 'toast-top-right',   // Participant view
    ...
};
```

### CSS (noor-toastr.css)
```css
.toast-close-button {
    pointer-events: auto !important; /* CRITICAL: Enable clicks despite container pointer-events:none */
    cursor: pointer !important;
    ...
}
```

---

## Next Steps If Tests FAIL

### If Auto-Close Fails:
1. Check console for errors preventing timeout
2. Verify `timeOut: 3000` in browser console logs
3. Check if user interaction is preventing timeout
4. Inspect toast element for inline styles overriding timeout

### If Close Button Fails:
1. Inspect X button element in DevTools
2. Check computed CSS for `pointer-events` value
3. Verify `cursor: pointer` is applied
4. Check for overlaying elements blocking clicks
5. Test clicking directly on button vs nearby area

---

## Files Modified
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Changed timeout 10s → 3s
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Changed timeout 10s → 3s
- `SPA/NoorCanvas/wwwroot/css/noor-toastr.css` - Close button pointer-events fix

## Commit
- **SHA**: 45cede86
- **Message**: "fix(toastr): Change toast timeout from 10s to 3s with comprehensive trace logging"
