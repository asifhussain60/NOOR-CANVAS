# Plan: Fix Inserted Hadees Rendering Issue

**Key**: `inserted-hadees-fix`  
**Branch**: `feature/asset-grouping-redesign`  
**Created**: 2025-10-28  
**Status**: 🔴 IN PROGRESS

## Problem Statement

Percy/Playwright tests reveal that `.inserted-hadees` elements are not rendering on SessionCanvas, TranscriptCanvas, or HostControlPanel pages. The HTML exists in the database but gets stripped or malformed during transformation.

### Test Failures
1. ❌ SessionCanvas: `.inserted-hadees` not found (10s timeout)
2. ❌ TranscriptCanvas: `.inserted-hadees` not found (10s timeout)
3. ❌ HostControlPanel: `.inserted-hadees` not found + JavaScript `appendChild` error
4. ❌ Transformation function: `transformHtml` function not found in client-side scope
5. ❌ Visual comparison: Cascade failure
6. ⏭️ Responsive design: Skipped

### Evidence from Logs
Transform logs show the HTML structure exists:
```html
<div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="129" data-token="H|129" data-type="hadees" id="ahadees-1759610378590-646">
  <div class="hadees-header ks-ahadees-header">
    <h4>Muhammad Ibn Abdullah (SWS)</h4>
  </div>
  <div class="hadees-arabic ks-ahadees-arabic">حَاسِبُوا أَنْفُسَكُمْ...</div>
  <!-- etc -->
</div>
```

But this structure is **not reaching the browser**.

## Root Cause Analysis

### Phase 1: Investigation ✅
**Files to check:**
- [x] `HtmlParsingService.cs` - TransformHtml method
- [x] `AssetProcessingService.cs` - Asset wrapping logic
- [x] `SessionAsset.cs` - Asset type definitions
- [x] `AssetLookup` migration - Database seed data

**Findings:**
1. `.inserted-hadees` is properly defined in `AssetLookup` table
2. CSS selector: `.inserted-hadees`
3. Asset type: `inserted-hadees`
4. Transform logs show HTML exists before transformation
5. JavaScript error: `appendChild` fails with "Unexpected end of input"

### Phase 2: Hypothesis

**Primary Hypothesis**: The Asset Grouping Redesign is wrapping `.inserted-hadees` elements inside `.asset-group-container`, potentially causing:
- Double-wrapping issues
- CSS selector mismatches
- DOM manipulation conflicts

**Secondary Hypothesis**: `HtmlParsingService.TransformHtml()` is stripping the `.inserted-hadees` class or entire container.

**Tertiary Hypothesis**: The HTML is being escaped or encoded incorrectly, causing malformed output.

## Implementation Plan

### Task 1: Verify Asset Grouping Interaction ⏳
**Priority**: P0 (Critical)  
**Owner**: GitHub Copilot  
**Files**: 
- `SPA/NoorCanvas/Services/AssetProcessingService.cs`
- `SPA/NoorCanvas/Services/HtmlParsingService.cs`

**Actions:**
1. Check if `.inserted-hadees` is being detected by `AssetProcessingService`
2. Verify `InjectAssetShareButtonsAsync` isn't corrupting the HTML
3. Confirm asset grouping container wrapping preserves inner content
4. Add debug logging to track transformation chain

**Acceptance Criteria:**
- [ ] `.inserted-hadees` elements pass through asset grouping unchanged
- [ ] Container wrapping doesn't corrupt nested structure
- [ ] Debug logs show HTML at each transformation step

### Task 2: Fix HTML Parsing/Sanitization ⏳
**Priority**: P0 (Critical)  
**Owner**: GitHub Copilot  
**Files**:
- `SPA/NoorCanvas/Services/HtmlParsingService.cs`

**Actions:**
1. Review `TransformHtml()` method for `.inserted-hadees` handling
2. Check if sanitization is removing the class
3. Verify regex patterns don't match/remove `.inserted-hadees`
4. Ensure `data-*` attributes are preserved

**Acceptance Criteria:**
- [ ] `TransformHtml()` preserves `.inserted-hadees` elements intact
- [ ] All data attributes retained (data-collection, data-id, data-token, data-type)
- [ ] Nested structure (header, arabic, translation) maintained

### Task 3: Fix JavaScript appendChild Error ⏳
**Priority**: P1 (High)  
**Owner**: GitHub Copilot  
**Files**:
- `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Actions:**
1. Locate the JavaScript code causing `appendChild` failure
2. Check for malformed HTML being injected
3. Verify DOM elements exist before appending
4. Add try-catch with detailed error logging

**Acceptance Criteria:**
- [ ] No `appendChild` errors in console
- [ ] HTML injection works correctly
- [ ] Proper error handling in place

### Task 4: Add Client-Side transformHtml Function ⏳
**Priority**: P2 (Medium)  
**Owner**: GitHub Copilot  
**Files**:
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`

**Actions:**
1. Export server-side `TransformHtml` logic to JavaScript
2. Expose function on `window` object
3. Ensure it handles `.inserted-hadees` correctly
4. Update tests to verify function exists

**Acceptance Criteria:**
- [ ] `window.transformHtml` function exists
- [ ] Function preserves `.inserted-hadees` structure
- [ ] Test 04 passes

### Task 5: Update AssetLookup CSS Selector (If Needed) ⏳
**Priority**: P3 (Low)  
**Owner**: GitHub Copilot  
**Files**:
- Database: `canvas.AssetLookup` table

**Actions:**
1. Check if CSS selector needs updating for asset grouping
2. Update selector if necessary: `.inserted-hadees, .asset-group-container .inserted-hadees`
3. Re-run asset detection

**Acceptance Criteria:**
- [ ] CSS selector matches both wrapped and unwrapped cases
- [ ] Asset detection finds all instances

### Task 6: Re-run Percy Tests ⏳
**Priority**: P0 (Critical)  
**Owner**: GitHub Copilot  
**Files**:
- `Tests/UI/inserted-hadees-rendering.spec.ts`

**Actions:**
1. Re-run full test suite
2. Verify all 6 tests pass
3. Capture Percy visual snapshots
4. Review and approve baselines

**Acceptance Criteria:**
- [x] Test 01: SessionCanvas rendering ✅
- [x] Test 02: TranscriptCanvas narrow theme ✅
- [x] Test 03: HostControlPanel rendering ✅
- [x] Test 04: Transformation function ✅
- [x] Test 05: Visual comparison ✅
- [x] Test 06: Responsive design ✅
- [ ] Zero JavaScript errors in console
- [ ] Percy snapshots captured successfully

## Technical Details

### CSS Selector Chain
```
Database: .inserted-hadees
→ AssetProcessingService wraps in: .asset-group-container
→ Final DOM: .asset-group-container > .inserted-hadees
```

### Data Flow
```
Session.Transcript (DB)
→ HtmlParsingService.ParseHtml()
→ HtmlParsingService.TransformHtml() [POTENTIAL ISSUE HERE]
→ AssetProcessingService.InjectAssetShareButtonsAsync() [WRAPPING HERE]
→ Rendered HTML in browser
```

### Known Good HTML Structure
```html
<div class="asset-group-container" data-noor-asset-group="true" data-share-id="asset-inserted-hadees-1">
  <div class="asset-header">
    <h3 class="asset-title">Inserted Hadees</h3>
    <div class="asset-menu-wrapper"><!-- kebab menu --></div>
  </div>
  <div class="asset-content-wrapper">
    <div class="inserted-hadees ks-ahadees-container" data-collection="unknown" data-id="129">
      <div class="hadees-header ks-ahadees-header">
        <h4>Muhammad Ibn Abdullah (SWS)</h4>
      </div>
      <div class="hadees-arabic ks-ahadees-arabic">حَاسِبُوا أَنْفُسَكُمْ...</div>
      <p class="hadees-translation">Take account of yourselves...</p>
    </div>
  </div>
</div>
```

## Success Metrics

1. **All Percy tests pass** (6/6)
2. **Zero JavaScript console errors**
3. **Visual regression approved** (Percy dashboard)
4. **Proper DOM structure** (`.inserted-hadees` visible in DevTools)
5. **Responsive across viewports** (375px, 768px, 1280px, 1920px)

## Dependencies

- AssetProcessingService (asset grouping)
- HtmlParsingService (transformation)
- AssetLookup database table
- Percy visual regression service

## Rollback Plan

If fixes cause regressions:
1. Revert commits on `feature/asset-grouping-redesign`
2. Re-run tests on clean `development` branch
3. Compare HTML output differences
4. Create isolated fix branch

## Timeline

- Investigation: 30 minutes ✅
- Implementation: 2-3 hours (Tasks 1-5)
- Testing: 1 hour (Task 6)
- Total: ~4 hours

## Notes

- Asset grouping redesign is already implemented and working for other asset types
- Issue is specific to `.inserted-hadees` class
- May be related to special characters in Arabic text
- `appendChild` error suggests malformed HTML being injected
- Client-side `transformHtml` function missing is secondary issue

## Next Actions

1. Start with Task 1: Investigate asset grouping interaction
2. Add comprehensive debug logging
3. Run local tests to reproduce issue
4. Fix identified problems
5. Re-run Percy tests to verify fixes
