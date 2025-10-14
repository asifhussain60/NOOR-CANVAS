# Diagnostic System - Quick Reference

## 🚀 Quick Start

### Using in Any Blazor Component

```csharp
// 1. Add using directive
@using NoorCanvas.Components.Diagnostics

// 2. Add component reference
<DiagnosticLogger @ref="diagnosticLogger" />

// 3. Declare field
@code {
    private DiagnosticLogger? diagnosticLogger;
}

// 4. Run diagnostics
private async Task MyDiagnosticMethod()
{
    if (diagnosticLogger != null)
    {
        // Toast diagnostics
        await diagnosticLogger.DiagnoseToastSystem();
        
        // Layout diagnostics
        await diagnosticLogger.DiagnoseLayoutHeights();
        
        // All diagnostics
        var results = await diagnosticLogger.RunAllDiagnostics();
    }
}
```

---

## 📋 Available Diagnostic Methods

### 1. DiagnoseToastSystem()
**Use When**: Toast notifications not appearing

**Checks**:
- ✅ toastr library loaded
- ✅ showNoorToast function exists
- ✅ noor-toastr.css loaded
- ✅ Toast container in DOM
- ✅ Z-index hierarchy
- ✅ Toastr configuration

**Example Output**:
```
=== LIBRARY STATUS ===
toastr loaded: true
showNoorToast loaded: true

=== CSS FILES ===
noor-toastr.css loaded: true
  Path: http://localhost:5000/css/noor-toastr.css

=== DOM CONTAINERS ===
Toast container exists: true
  z-index: 999999
  position: fixed

✓ Toast container z-index > all other elements
```

---

### 2. DiagnoseLayoutHeights()
**Use When**: Layout height constraints violated

**Checks**:
- ✅ Grid container dimensions
- ✅ Canvas area rendered vs scroll height
- ✅ Max-height constraint validation
- ✅ Overflow detection and handling
- ✅ Sidebar height matching
- ✅ Questions container scroll behavior

**Example Output**:
```
=== CANVAS-AREA-CONTAINER ===
Rendered height: 700px
Scroll height: 1200px
Max-height: 700px
⚠️ OVERFLOW DETECTED
❌ PROBLEM: overflow is visible - content will expand!

=== HEIGHT COMPARISON ===
Canvas area: 700px
Sidebar: 700px
Difference: 0px
✓ Heights are aligned
```

---

### 3. RunAllDiagnostics()
**Use When**: Full system check needed

**Returns**: `List<DiagnosticResult>`

```csharp
var results = await diagnosticLogger.RunAllDiagnostics();
foreach (var result in results)
{
    Logger.LogInformation("Diagnostic: {Type}, Success: {Success}", 
        result.DiagnosticType, result.Success);
}
```

---

## 🏷️ Diagnostic Marker Patterns

### Cleanup-Safe Markers
All markers include `;CLEANUP_OK` suffix:

```csharp
// Method documentation
[DIAGNOSTIC-METHOD:scope:context] Description ;CLEANUP_OK

// Component documentation
[DIAGNOSTIC-COMPONENT] Description ;CLEANUP_OK

// Inline diagnostics
[DIAGNOSTIC:scope] Description ;CLEANUP_OK

// Log messages
Logger.LogCritical("[DIAGNOSTIC:scope] Message");
```

---

## 🎯 Task Prompt Usage

### Enable Diagnostic Mode

```bash
@workspace /task key=canvas debug-level=diagnostic tasks="Fix height issue"
```

**What Happens**:
1. Agent creates or uses `DiagnosticLogger` component
2. Inserts comprehensive diagnostic logging
3. Uses `CRITICAL` log level for visibility
4. Adds correlation IDs for tracing
5. Tags all code with `;CLEANUP_OK` markers

### Cleanup After Fix

```bash
@workspace /task key=canvas debug-level=cleanup
```

**What Happens**:
1. Agent searches for all `;CLEANUP_OK` markers
2. Removes diagnostic code
3. Leaves production-ready code

---

## 📊 Reading Diagnostic Output

### Success Indicators
- ✅ `✓` prefix = Check passed
- ✅ All values as expected
- ✅ No warnings/errors

### Warning Indicators
- ⚠️ `⚠️` prefix = Potential issue
- ⚠️ Values outside expected range
- ⚠️ "OVERFLOW DETECTED"

### Error Indicators
- ❌ `❌` prefix = Definite problem
- ❌ "NOT FOUND"
- ❌ "PROBLEM:"
- ❌ "CONSTRAINT VIOLATION"

---

## 🔍 Common Diagnostic Scenarios

### Scenario 1: Toast Not Showing

**Run**:
```csharp
await diagnosticLogger.DiagnoseToastSystem();
```

**Check For**:
- `toastr loaded: false` → Library not loading
- `noor-toastr.css loaded: false` → CSS file missing
- `Toast container exists: false` → Container not created
- `z-index: auto` → Z-index not set

**Fix Examples**:
```html
<!-- Wrong path format -->
<link rel="stylesheet" href="~/css/noor-toastr.css">

<!-- Correct for .cshtml -->
<link rel="stylesheet" href="css/noor-toastr.css">
```

---

### Scenario 2: Height Expanding

**Run**:
```csharp
await diagnosticLogger.DiagnoseLayoutHeights();
```

**Check For**:
- `CONSTRAINT VIOLATION` → Height exceeds max-height
- `overflow is visible` → Content pushing container
- `Significant height difference` → Grid misalignment

**Fix Examples**:
```css
/* Parent container - prevent expansion */
.canvas-area-container {
    overflow: hidden;
}

/* Child container - enable scroll */
.canvas-content-area {
    overflow-y: auto;
    min-height: 0; /* Allow flex shrinking */
}
```

---

### Scenario 3: Z-Index Issues

**Run**:
```csharp
await diagnosticLogger.DiagnoseToastSystem();
```

**Check Output**:
```
=== Z-INDEX HIERARCHY ===
Debug Panel: z-index=9999, position=fixed
Toast Container: z-index=999, position=fixed
⚠️ WARNING: Toast container z-index <= max other element
```

**Fix**:
```css
#toast-container {
    z-index: 999999 !important; /* Above all elements */
}
```

---

## 🧪 Testing Workflow

### 1. Run Application
```bash
cd SPA/NoorCanvas
dotnet run
```

### 2. Navigate to View
```
http://localhost:5000/canvas/session/8WXMK05K
```

### 3. Trigger Diagnostic
- Click "Test Toast Notification" (SessionCanvas debug panel)
- Click "Log Dimensions" (SessionCanvas debug panel)
- Or call method programmatically

### 4. Review Logs
**Server Console**:
```
[DIAGNOSTIC:toast-system] [abc12345] RESULTS:
=== LIBRARY STATUS ===
toastr loaded: true
...
```

**Browser Console** (F12):
- Check for JavaScript errors
- Verify library loading
- Inspect DOM elements

### 5. Apply Fixes
Based on diagnostic output, apply targeted CSS/HTML/JavaScript fixes

### 6. Validate
Re-run diagnostics to confirm fix

---

## 📁 File Locations

**Component**: `SPA/NoorCanvas/Components/Diagnostics/DiagnosticLogger.razor`  
**Integrated In**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`  
**Task Prompt**: `.github/prompts/task.prompt.md`  
**Holistic Plan**: `Workspaces/TEMP/canvas-holistic-fix-plan.md`  
**Summary**: `Workspaces/TEMP/diagnostic-system-implementation-summary.md`  

---

## 💡 Pro Tips

1. **Run diagnostics BEFORE applying fixes** - understand root cause first
2. **Use correlation IDs** - track diagnostic output across async operations
3. **Check browser AND server logs** - issues often span both layers
4. **Look for patterns** - multiple ❌ indicators reveal systemic issues
5. **Validate after fixes** - re-run diagnostics to confirm resolution
6. **Clean up when done** - use `debug-level=cleanup` to remove markers
7. **Reuse component** - add `DiagnosticLogger` to other views as needed

---

**Version**: 1.0  
**Last Updated**: 2025-10-14  
**Author**: GitHub Copilot (Task Executor Agent)
