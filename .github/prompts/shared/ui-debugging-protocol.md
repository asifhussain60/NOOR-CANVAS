# UI Debugging Protocol

## Purpose
Systematic approach to diagnose and fix UI/browser-related issues efficiently.

---

## When to Apply
- User reports UI not displaying/working (toasts, panels, buttons, modals)
- CSS layout issues (height, width, overflow, alignment, z-index)
- JavaScript errors or library loading issues
- SignalR real-time updates not reflecting visually
- Browser-specific rendering problems
- Any issue mentioning "not showing", "not appearing", "not visible", "too fast", "too slow"

---

## Phase 1: Automated Evidence Gathering (PREFERRED)

### Automated Diagnostic Workflow (ZERO user intervention required)

1. **Launch Automated Diagnostic Test** (30 seconds):
   ```bash
   cd "D:\PROJECTS\NOOR CANVAS\Tests\UI\diagnostics"
   npx playwright test auto-browser-diagnostics.spec.ts --headed --reporter=list
   ```

2. **Read Diagnostic Report** (instant):
   - **Location**: `Tests/UI/diagnostics/reports/latest-diagnostic.json`
   - **Contents**:
     ```json
     {
       "timestamp": "2025-10-14T10:30:00Z",
       "url": "https://localhost:9091",
       "domInspection": {
         "element": "#toast-container",
         "exists": true,
         "visible": false,
         "computedStyles": {
           "display": "none",
           "z-index": "0"
         }
       },
       "console": [
         "ERROR: toastr is not defined",
         "WARNING: noor-toastr.css failed to load (404)"
       ],
       "network": [
         { "url": "/css/noor-toastr.css", "status": 404 }
       ],
       "screenshots": {
         "before": "diagnostics/screenshots/before-test.png",
         "after": "diagnostics/screenshots/after-test.png"
       }
     }
     ```

3. **Automated Analysis** (instant):
   - **JavaScript Errors**: Check `console` array for undefined libraries
   - **Network Failures**: Check `network` array for 404s
   - **DOM Issues**: Check `domInspection.exists` and `visible`
   - **CSS Problems**: Check `computedStyles` for z-index, display, position

4. **Decision Gate** (Automated issue categorization):
   ```
   IF console shows "library is not defined":
     → Issue: JavaScript library not loaded
     → Fix: Verify <script> tag in _Host.cshtml, check wwwroot path
     → Confidence: HIGH
   
   ELSE IF network shows "404 for CSS file":
     → Issue: CSS file missing or wrong path
     → Fix: Check wwwroot structure, verify link tag
     → Confidence: HIGH
   
   ELSE IF element exists but z-index=0 or display=none:
     → Issue: CSS styling problem
     → Fix: Inspect CSS rules, check z-index hierarchy
     → Confidence: MEDIUM
   
   ELSE IF element doesn't exist in DOM:
     → Issue: Component not rendering
     → Fix: Check Razor component lifecycle, @inject dependencies
     → Confidence: HIGH
   
   ELSE IF all checks pass but user reports issue:
     → Issue: Timing/race condition or browser-specific
     → Action: Add trace logging, request user test with different browser
     → Confidence: LOW
   ```

5. **Apply Targeted Fix** based on automated analysis (no guessing!)

6. **Validate Fix Automatically** (30 seconds):
   ```bash
   # Re-run diagnostic test
   npx playwright test auto-browser-diagnostics.spec.ts --headed --reporter=list
   
   # Compare before/after reports
   # If issue resolved: console clean, element visible, network 200 OK
   ```

---

## Phase 2: User Collaboration Protocol (FALLBACK)

**Use ONLY if automated diagnostics fail or unavailable**

### Agent Message Template:
```
"To fix this efficiently, I need to see what's happening in your browser:

1. **Open DevTools** (Press F12)
2. **Go to Console tab**
3. **Click [Test Toast / Trigger Issue]**
4. **Copy ALL console output** and paste here
5. **(Optional) Screenshot Network tab** showing noor-*.css files

This will help me diagnose in 1 attempt instead of 3-5."
```

### Evidence Collection Steps:

1. **Browser Console Analysis** (30 seconds):
   - Open DevTools → Console tab
   - Trigger the issue
   - Look for:
     - JavaScript errors (`Uncaught ReferenceError: toastr is not defined`)
     - Library loading errors (`Failed to load resource`)
     - Warnings about missing dependencies

2. **Network Tab Analysis** (30 seconds):
   - Open DevTools → Network tab
   - Refresh page
   - Filter for CSS/JS files
   - Check status codes:
     - ✅ 200 OK - File loaded successfully
     - ❌ 404 Not Found - File missing or wrong path
     - ❌ 500 Internal Server Error - Server-side issue
   - Check file content (Preview tab) to verify correct content

3. **DOM Inspection** (1-2 minutes):
   - Open DevTools → Elements tab
   - Search for element (Ctrl+F in Elements): `#toast-container`
   - **Check existence**: Is element in DOM?
   - **Check visibility**: Is `display: none` or `visibility: hidden`?
   - **Check z-index**: Compare with other elements (should be >1000 for toasts)
   - **Check position**: Is element positioned off-screen?
   - **Computed Styles**: Right-click element → Inspect → Computed tab

4. **Visual Observation** (Critical for UX vs Technical Issues):
   - Does element **appear briefly then disappear**? (Timing issue - too brief)
   - Does element **never appear at all**? (Technical issue - not rendered)
   - Does element **appear behind other content**? (z-index issue)
   - Does element **appear but wrong styling**? (CSS specificity issue)
   
   **This distinction is critical:**
   - "Too brief" → Increase toast duration (UX fix)
   - "Never appears" → Fix technical issue (library loading, DOM rendering)

5. **Server Console Logs** (1 minute):
   - Check terminal where `dotnet run` is executing
   - Look for:
     - Build warnings (CSS/JS bundling issues)
     - Runtime errors (Blazor component exceptions)
     - SignalR connection errors

6. **Build Verification** (30 seconds):
   - Ensure clean build: `dotnet build` shows 0 errors, 0 warnings
   - Check wwwroot folder structure matches expected paths
   - Verify static files are being served (check launchSettings.json)

### Decision Gate After Evidence Gathering:

```
IF browser console shows "toast displayed successfully" AND user says "too brief":
  → Issue: UX timing problem (not technical)
  → Fix: Increase timeOut value in toastr options
  → No library issues, pure configuration change

ELSE IF browser console shows "toastr is not defined":
  → Issue: JavaScript library not loaded
  → Fix: Add <script src="~/lib/toastr/toastr.min.js"></script> to _Host.cshtml
  → Verify file exists in wwwroot/lib/toastr/

ELSE IF Network tab shows "404 for noor-toastr.css":
  → Issue: CSS file missing or incorrect path
  → Fix: Check wwwroot/css/ folder, verify filename matches link tag
  → May need to move file or update path

ELSE IF element exists, CSS loaded, but z-index=0:
  → Issue: CSS specificity or z-index hierarchy
  → Fix: Inspect CSS rules, increase z-index value or add !important
  → Check for conflicting styles

ELSE IF inconclusive from browser logs:
  → Issue: Requires deeper investigation
  → Action: Add trace logging, request user test again
```

---

## Efficiency Benefits

**Without Evidence (Blind Fixes)**:
- 5+ attempts
- 2+ hours
- Guess → Test → Fail → Repeat

**With Automated Diagnostics**:
- 1-2 attempts
- 1-2 minutes
- Auto-diagnose → Targeted Fix → Auto-validate

**With User Evidence**:
- 1-2 attempts
- 15-30 minutes
- Diagnose → Targeted Fix → User Validates

---

## Verbosity Control

**If `verbosity=concise`**:
- One-line progress: `"Running automated diagnostics..."`, `"Issue detected: library-missing"`

**If `verbosity=detailed`**:
- Show full diagnostic report with before/after comparison
- Display all console logs, network traces, DOM inspection results

---

## References
- **Diagnostic Test**: `Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts`
- **Documentation**: `Tests/UI/diagnostics/README.md`
- **API Endpoint**: `Controllers/DiagnosticsController.cs` (optional client-side reporting)
