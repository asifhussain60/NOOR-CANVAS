# FAB Button Injection - Debug Logging Implementation

**Date:** 2025-11-02  
**Workitem:** hcp-fab-button  
**Issue:** FAB button wrapper not visible in participant view despite clicks working  
**Fix:** Added comprehensive debug logging to track injection flow

## Problem Statement

During testing, the clicks were working correctly all the way to session loading, and the asset content was visible. However, the FAB button wrapper div was not visible in the participant view, indicating the injection logic was not working.

## Solution Overview

Added extensive debug logging at both server and client levels to diagnose the FAB button wrapper injection issue:

1. **Server-Side Logging** - Enhanced `UnifiedHtmlTransformService.cs`
2. **Client-Side Logging** - New `participant-fab-injection.js` script
3. **Blazor Integration** - Updated `SessionCanvas.razor` with injection calls

## Files Modified

### 1. Server-Side: UnifiedHtmlTransformService.cs

**Location:** `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs`

**Changes:**
- Enhanced `TransformForParticipant()` method with detailed logging
- Added logging prefix `[PARTICIPANT-TRANSFORM]` for easy filtering
- Logs input HTML preview (first 200 chars)
- Logs transformation stages and results
- Logs output HTML preview

**Log Format:**
```
[PARTICIPANT-TRANSFORM] ════════ PARTICIPANT TRANSFORMATION STARTED ════════
[PARTICIPANT-TRANSFORM] Input HTML Length: {length}
[PARTICIPANT-TRANSFORM] First 200 chars: {preview}
[PARTICIPANT-TRANSFORM] Invoking HtmlParsingService.ParseHtml...
[PARTICIPANT-TRANSFORM] ✅ Parsing successful - Output Length: {length}
[PARTICIPANT-TRANSFORM] Output preview (first 200 chars): {preview}
[PARTICIPANT-TRANSFORM] ════════ TRANSFORMATION COMPLETE ════════
```

### 2. Client-Side: participant-fab-injection.js

**Location:** `SPA/NoorCanvas/wwwroot/js/participant-fab-injection.js`

**Purpose:**
- Inject FAB button wrapper around shared assets in participant view
- Provide visual indicator when content is shared
- Read-only display (participants cannot interact with FAB button)

**Key Features:**
- Comprehensive console logging at every step
- Detailed DOM inspection and verification
- Error handling with stack traces
- Post-injection verification with dimensions and positioning

**Log Prefix:** `[PARTICIPANT-FAB-INJECT]`

**Injection Process:**
1. Locate asset content container (`.canvas-asset-content`)
2. Create wrapper div with class `fab-button-wrapper participant-view`
3. Create FAB button (40×40px circular, forest green)
4. Insert wrapper and button into DOM
5. Verify injection with dimensions and visibility checks

**Log Flow:**
```javascript
[PARTICIPANT-FAB-INJECT] ════════ Script loaded ════════
[PARTICIPANT-FAB-INJECT] ════════ INJECTION STARTED ════════
[PARTICIPANT-FAB-INJECT] ✅ Asset content container found
[PARTICIPANT-FAB-INJECT] Container classes: {classes}
[PARTICIPANT-FAB-INJECT] Container innerHTML length: {length}
[PARTICIPANT-FAB-INJECT] Created wrapper div with classes: fab-button-wrapper participant-view
[PARTICIPANT-FAB-INJECT] Created FAB button
[PARTICIPANT-FAB-INJECT] Button position: absolute top:10px right:10px
[PARTICIPANT-FAB-INJECT] Button size: 40x40px circular
[PARTICIPANT-FAB-INJECT] ✅ Wrapper injected successfully
[PARTICIPANT-FAB-INJECT] ════════ INJECTION COMPLETE ════════
[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: Wrapper is in DOM
[PARTICIPANT-FAB-INJECT] Wrapper visible: {true/false}
[PARTICIPANT-FAB-INJECT] Wrapper dimensions: {width} x {height}
[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: FAB button is in DOM
[PARTICIPANT-FAB-INJECT] Button visible: {true/false}
[PARTICIPANT-FAB-INJECT] Button dimensions: {width} x {height}
```

### 3. Blazor Integration: SessionCanvas.razor

**Location:** `SPA/NoorCanvas/Pages/SessionCanvas.razor`

**Changes:**

#### 3.1 Script Reference (HeadContent)
```html
<!-- [WORKITEM:hcp-fab-button] Participant FAB button wrapper injection -->
<script src="~/js/participant-fab-injection.js" asp-append-version="true"></script>
```

#### 3.2 SignalR Event Handlers (3 locations)

**Location 1:** `AssetShared` event handler
```csharp
// [WORKITEM:hcp-fab-button] Inject FAB button wrapper after content is rendered
Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{TrackingId}] Invoking JavaScript injection after asset render", trackingId);
try
{
    await JSRuntime.InvokeVoidAsync("injectParticipantFabWrapper");
    Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{TrackingId}] ✅ JavaScript injection called successfully", trackingId);
}
catch (Exception jsEx)
{
    Logger.LogError(jsEx, "[PARTICIPANT-FAB-INJECT] [{TrackingId}] ❌ Error invoking JavaScript injection", trackingId);
}
```

**Location 2:** `AssetContentReceived` event handler (POC pattern)
```csharp
// [WORKITEM:hcp-fab-button] Inject FAB button wrapper after content is rendered
Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{TrackingId}] Invoking JavaScript injection after POC asset render", trackingId);
```

**Location 3:** `HtmlContentReceived` event handler
```csharp
// [WORKITEM:hcp-fab-button] Inject FAB button wrapper after content is rendered
Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{TrackingId}] Invoking JavaScript injection after HTML content render", trackingId);
```

#### 3.3 OnAfterRenderAsync (First Render)
```csharp
// [WORKITEM:hcp-fab-button] Check if content is already present and inject FAB wrapper
if (!string.IsNullOrEmpty(Model?.SharedAssetContent))
{
    Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{RequestId}] Content already present on first render, injecting FAB wrapper", requestId);
    try
    {
        // Small delay to ensure DOM is fully rendered
        await Task.Delay(100);
        await JSRuntime.InvokeVoidAsync("injectParticipantFabWrapper");
        Logger.LogInformation("[PARTICIPANT-FAB-INJECT] [{RequestId}] ✅ FAB wrapper injection called for existing content", requestId);
    }
    catch (Exception jsEx)
    {
        Logger.LogError(jsEx, "[PARTICIPANT-FAB-INJECT] [{RequestId}] ❌ Error injecting FAB wrapper on first render", requestId);
    }
}
```

## Debugging Guide

### Server Logs (Console/File)

Filter for these prefixes:
- `[PARTICIPANT-TRANSFORM]` - HTML transformation for participant view
- `[PARTICIPANT-FAB-INJECT]` - Blazor-side injection calls

### Browser Console

Filter for:
- `[PARTICIPANT-FAB-INJECT]` - Client-side injection flow

### Key Checkpoints

1. **Content Reception**
   ```
   [PARTICIPANT-TRANSFORM] ════════ PARTICIPANT TRANSFORMATION STARTED ════════
   ```

2. **Content Rendered**
   ```
   [PARTICIPANT-FAB-INJECT] Invoking JavaScript injection after asset render
   ```

3. **Injection Executed**
   ```
   [PARTICIPANT-FAB-INJECT] ════════ INJECTION STARTED ════════
   ```

4. **Container Found**
   ```
   [PARTICIPANT-FAB-INJECT] ✅ Asset content container found
   ```

5. **Wrapper Created**
   ```
   [PARTICIPANT-FAB-INJECT] ✅ Wrapper injected successfully
   ```

6. **Verification Complete**
   ```
   [PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: Wrapper is in DOM
   [PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: FAB button is in DOM
   ```

## Expected Behavior

### Successful Injection

**Server logs:**
```
[PARTICIPANT-TRANSFORM] ════════ PARTICIPANT TRANSFORMATION STARTED ════════
[PARTICIPANT-TRANSFORM] Input HTML Length: 1234
[PARTICIPANT-TRANSFORM] ✅ Parsing successful - Output Length: 1234
[PARTICIPANT-TRANSFORM] ════════ TRANSFORMATION COMPLETE ════════
[PARTICIPANT-FAB-INJECT] Invoking JavaScript injection after asset render
[PARTICIPANT-FAB-INJECT] ✅ JavaScript injection called successfully
```

**Browser console:**
```
[PARTICIPANT-FAB-INJECT] ════════ INJECTION STARTED ════════
[PARTICIPANT-FAB-INJECT] ✅ Asset content container found
[PARTICIPANT-FAB-INJECT] Container classes: canvas-asset-content islamic-content
[PARTICIPANT-FAB-INJECT] Container innerHTML length: 1234
[PARTICIPANT-FAB-INJECT] Created wrapper div with classes: fab-button-wrapper participant-view
[PARTICIPANT-FAB-INJECT] Created FAB button
[PARTICIPANT-FAB-INJECT] ✅ Wrapper injected successfully
[PARTICIPANT-FAB-INJECT] ════════ INJECTION COMPLETE ════════
[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: Wrapper is in DOM
[PARTICIPANT-FAB-INJECT] Wrapper visible: true
[PARTICIPANT-FAB-INJECT] Wrapper dimensions: 800 x 600
[PARTICIPANT-FAB-INJECT] ✅ VERIFICATION: FAB button is in DOM
[PARTICIPANT-FAB-INJECT] Button visible: true
[PARTICIPANT-FAB-INJECT] Button dimensions: 40 x 40
```

### Failed Injection - Container Not Found

**Browser console:**
```
[PARTICIPANT-FAB-INJECT] ════════ INJECTION STARTED ════════
[PARTICIPANT-FAB-INJECT] ⚠️ Asset content container not found (.canvas-asset-content)
[PARTICIPANT-FAB-INJECT] Searching for alternative selectors...
[PARTICIPANT-FAB-INJECT] ❌ No suitable container found for injection
```

**Diagnosis:** Content container CSS class changed or not rendered

### Failed Injection - Already Wrapped

**Browser console:**
```
[PARTICIPANT-FAB-INJECT] ⚠️ Element already wrapped, skipping
```

**Diagnosis:** Injection called multiple times (expected on re-render)

### Failed Injection - JavaScript Error

**Browser console:**
```
[PARTICIPANT-FAB-INJECT] ❌ Exception during injection: TypeError: Cannot read property 'appendChild' of null
[PARTICIPANT-FAB-INJECT] Stack trace: ...
```

**Server log:**
```
[PARTICIPANT-FAB-INJECT] ❌ Error invoking JavaScript injection
```

**Diagnosis:** DOM structure issue, check element parents

## Testing Instructions

1. **Start Application**
   ```powershell
   cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
   dotnet run
   ```

2. **Open Browser Console** (F12)
   - Enable all log levels
   - Filter for `[PARTICIPANT-FAB-INJECT]`

3. **Run Test**
   ```powershell
   cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"
   npx playwright test hcp-fab-button-verification.spec.ts --headed
   ```

4. **Monitor Logs**
   - Server console: Watch for transformation and injection calls
   - Browser console: Watch for injection flow and verification

5. **Verify Wrapper**
   - Open DevTools Elements tab
   - Search for `.fab-button-wrapper.participant-view`
   - Verify FAB button is child of wrapper
   - Verify button is positioned top-right (absolute positioning)

## Troubleshooting

### Wrapper Not Visible

**Check:**
1. Container selector - Is `.canvas-asset-content` the correct class?
2. DOM timing - Is injection called too early?
3. CSS conflicts - Is wrapper being hidden by other styles?
4. JavaScript errors - Check browser console for exceptions

**Solutions:**
1. Update selectors in `participant-fab-injection.js`
2. Increase delay in `OnAfterRenderAsync` (currently 100ms)
3. Add `!important` to wrapper styles
4. Fix JavaScript errors based on stack trace

### Multiple Wrappers

**Cause:** Injection called multiple times without checking for existing wrapper

**Fix:** Already implemented - checks for `.fab-button-wrapper` parent before injecting

### Button Not Interactive

**Expected:** Button is read-only for participants (`disabled = true`)

**If host needs interaction:** Remove `disabled` attribute in host view (different file)

## Related Files

- `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs` - Server-side transformation
- `SPA/NoorCanvas/wwwroot/js/participant-fab-injection.js` - Client-side injection
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Blazor participant view
- `Tests/UI/hcp-fab-button-verification.spec.ts` - Playwright test

## Next Steps

1. Run tests with new logging to identify exact failure point
2. Verify container selector is correct
3. Check DOM timing (may need longer delay)
4. Verify CSS classes match between host and participant views
5. Check for JavaScript errors in browser console

## Notes

- All logging uses consistent prefixes for easy filtering
- Server logs include tracking IDs for correlation
- Client logs include DOM inspection details
- Verification happens 100ms after injection to ensure rendering complete
- FAB button is green (forest green) to match NOOR Canvas theme
- Button is 40×40px circular, positioned absolute top-right
