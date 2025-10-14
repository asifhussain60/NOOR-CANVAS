# Automated Browser Diagnostics System

**Purpose**: Eliminate user intervention in UI bug diagnosis by automatically capturing browser state, console logs, network requests, and DOM analysis.

**Created**: 2025-10-14  
**Status**: Production Ready  

---

## 📁 File Organization (Clean Structure)

```
NOOR CANVAS/
├── Tests/
│   └── UI/
│       └── diagnostics/                          ← Diagnostic test location
│           └── auto-browser-diagnostics.spec.ts  ← Playwright diagnostic test
│
├── SPA/
│   └── NoorCanvas/
│       ├── Controllers/
│       │   └── DiagnosticsController.cs          ← API endpoint (optional)
│       │
│       └── wwwroot/
│           └── js/
│               └── diagnostics/                  ← Client-side diagnostics
│                   └── auto-diagnostics.js       ← Auto-reporting JS module
│
└── Workspaces/
    └── TEMP/
        └── diagnostics/                          ← Output directory
            ├── diagnostic-report-{timestamp}.json
            ├── screenshot-{timestamp}.png
            └── toast-test-{timestamp}.png
```

**✅ Clean Organization**:
- Test code in `Tests/UI/diagnostics/`
- Server code in `SPA/NoorCanvas/Controllers/`
- Client code in `SPA/NoorCanvas/wwwroot/js/diagnostics/`
- Output in `Workspaces/TEMP/diagnostics/`
- **No root pollution** - all files in proper subdirectories

---

## 🚀 Quick Start

### Option 1: Automated Playwright Diagnostics (Recommended)

**Run automated diagnostic test**:
```bash
# From project root
npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts
```

**Output**:
```
📊 DIAGNOSTIC REPORT SAVED: Workspaces/TEMP/diagnostics/diagnostic-report-1697234567890.json

🔍 AUTOMATED ANALYSIS:
{
  "criticalIssues": [],
  "warnings": [],
  "suggestions": [],
  "issueCategory": "no-issue",
  "recommendedFix": "No issues detected"
}

🎯 ISSUE CATEGORY: no-issue
🛠️  RECOMMENDED FIX: No issues detected
```

**View diagnostic report**:
```powershell
cat Workspaces/TEMP/diagnostics/diagnostic-report-*.json | Select-Object -Last 1
```

---

### Option 2: Client-Side Auto-Reporting (Optional)

**Enable auto-reporting on page load**:
```
https://localhost:9091/Canvas/212/KJAHA99L?debug=auto
```

**Manual trigger** (browser console):
```javascript
// Get diagnostic report
window.noorDiagnostics.getReport()

// Send report to server
window.noorDiagnostics.sendReport()

// Re-check libraries
window.noorDiagnostics.checkLibraries()
```

**View server logs**:
```
[DIAGNOSTIC:client-report] [a3b4c5d6] ========== CLIENT DIAGNOSTIC REPORT ==========
[DIAGNOSTIC:client-report] [a3b4c5d6] URL: https://localhost:9091/Canvas/212/KJAHA99L
[DIAGNOSTIC:client-report] [a3b4c5d6] LIBRARIES:
[DIAGNOSTIC:client-report] [a3b4c5d6]   toastr: ✅ LOADED
[DIAGNOSTIC:client-report] [a3b4c5d6]   jQuery: ✅ LOADED
```

---

## 🔍 What Gets Captured

### 1. Console Logs
```json
{
  "consoleLogs": [
    {
      "type": "error",
      "message": "toastr is not defined",
      "timestamp": 1697234567890
    }
  ]
}
```

### 2. Network Requests
```json
{
  "networkRequests": [
    {
      "url": "https://localhost:9091/css/noor-toastr.css",
      "method": "GET",
      "status": 404,
      "type": "stylesheet",
      "failed": true
    }
  ]
}
```

### 3. DOM State
```json
{
  "domState": {
    "elementExists": {
      "#toast-container": false
    },
    "elementVisible": {},
    "elementCount": {
      "#toast-container": 0
    }
  }
}
```

### 4. Computed Styles
```json
{
  "computedStyles": {
    "#toast-container": {
      "display": "block",
      "zIndex": "999999",
      "position": "fixed",
      "top": "12px",
      "right": "12px"
    },
    "__libraries__": {
      "jQuery": true,
      "toastr": false,
      "Blazor": true,
      "signalR": true
    }
  }
}
```

### 5. Automated Analysis
```json
{
  "analysis": {
    "criticalIssues": [
      "toastr library not loaded",
      "CSS files failed to load (404): noor-toastr.css"
    ],
    "warnings": [
      "Element not found in DOM: #toast-container"
    ],
    "suggestions": [
      "#canvas-sidebar has low z-index (0)"
    ],
    "issueCategory": "library-missing",
    "recommendedFix": "Add toastr library to _Layout.cshtml or page"
  }
}
```

---

## 🎯 Issue Categories

| Category | Description | Recommended Fix |
|----------|-------------|-----------------|
| `library-missing` | JavaScript library not loaded (404 or not defined) | Add `<script>` tag or fix path |
| `css-failed` | CSS file failed to load (404) | Create CSS file or fix path |
| `element-hidden` | Element has `display:none` or `visibility:hidden` | Remove hiding CSS or adjust condition |
| `z-index` | Element has low z-index (auto, 0, < 1000) | Set `z-index: 999999 !important` |
| `ux-timing` | Feature works but UX issue (duration, position) | Adjust timeOut, positionClass config |
| `no-issue` | No issues detected | User-specific or already fixed |
| `unknown` | Inconclusive | Escalate to trace/diagnostic logging |

---

## 🔄 Integration with task.prompt.md

**Step 2.4: Automated Evidence Gathering**

When user reports UI bug:
1. **Agent automatically runs**: `npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts`
2. **Agent reads report**: `Workspaces/TEMP/diagnostics/diagnostic-report-{latest}.json`
3. **Agent analyzes**: Check `analysis.issueCategory` and `analysis.recommendedFix`
4. **Agent applies fix**: Based on issue category
5. **Agent validates**: Re-run diagnostic, compare before/after

**No user intervention required!**

---

## 📊 Example Workflow

### Scenario: Toast Notifications Not Showing

**User reports**: "Toast notifications not showing"

**Agent runs**:
```bash
npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts
```

**Diagnostic report shows**:
```json
{
  "consoleLogs": [
    { "type": "error", "message": "toastr is not defined" }
  ],
  "networkRequests": [
    { "url": "/lib/toastr/toastr.min.js", "status": 404, "failed": true }
  ],
  "analysis": {
    "criticalIssues": ["toastr library not loaded"],
    "issueCategory": "library-missing",
    "recommendedFix": "Add toastr library: <script src=\"/lib/toastr/toastr.min.js\"></script>"
  }
}
```

**Agent fixes**:
- Adds `<script src="/lib/toastr/toastr.min.js"></script>` to `_Layout.cshtml`

**Agent validates**:
```bash
npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts
```

**New diagnostic report shows**:
```json
{
  "networkRequests": [
    { "url": "/lib/toastr/toastr.min.js", "status": 200, "failed": false }
  ],
  "computedStyles": {
    "__libraries__": { "toastr": true }
  },
  "analysis": {
    "criticalIssues": [],
    "issueCategory": "no-issue",
    "recommendedFix": "No issues detected"
  }
}
```

**✅ Fixed in 1 attempt, 90 seconds, zero user intervention!**

---

## 🛠️ Maintenance

### Clean Up Old Diagnostic Reports
```powershell
# Keep only last 10 reports
Get-ChildItem "Workspaces/TEMP/diagnostics/diagnostic-report-*.json" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -Skip 10 | 
  Remove-Item
```

### View Latest Diagnostic Report
```powershell
# PowerShell
Get-Content (Get-ChildItem "Workspaces/TEMP/diagnostics/diagnostic-report-*.json" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1).FullName | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Disable Auto-Reporting
Remove `?debug=auto` from URL or comment out auto-diagnostics.js script reference.

---

## 🔧 Configuration

### Add to _Layout.cshtml (Optional - for client-side reporting)
```html
<!-- Auto-diagnostics (optional - only in development) -->
@if (env.IsDevelopment())
{
    <script src="~/js/diagnostics/auto-diagnostics.js"></script>
}
```

### Customize Critical Selectors
Edit `auto-browser-diagnostics.spec.ts`:
```typescript
const criticalSelectors = [
  '#toast-container',        // Toast container
  '.canvas-area-container',  // Canvas area
  '.your-custom-selector',   // Add your selectors
];
```

---

## ✅ Success Criteria

- ✅ **Zero user intervention** - fully automated diagnostic capture
- ✅ **1-2 minute runtime** - fast diagnostic execution
- ✅ **Automated analysis** - categorizes issue type automatically
- ✅ **Targeted fixes** - no more guessing
- ✅ **Auto-validation** - confirms fix worked
- ✅ **Clean file organization** - no root pollution

---

## 📚 Related Documentation

- **Implementation Plan**: `Workspaces/TEMP/automated-diagnostics-plan.md`
- **Efficiency Improvements**: `Workspaces/TEMP/debugging-efficiency-improvements.md`
- **Task Prompt**: `.github/prompts/task.prompt.md` (Step 2.4)
- **Playwright Config**: `playwright.config.ts`

---

**Next Steps**: Run your first automated diagnostic test!

```bash
npx playwright test Tests/UI/diagnostics/auto-browser-diagnostics.spec.ts --headed
```
