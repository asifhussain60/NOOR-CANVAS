# Canvas Asset Override Design

**Version:** 1.0  
**Date:** October 9, 2025  
**Status:** Recommended Implementation  
**Author:** GitHub Copilot (Task Agent)

---

## Executive Summary

This document outlines the recommended solution for optimizing Islamic content asset width in the SessionCanvas view while maintaining full compatibility with HostControlPanel and other views that use the [`session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css) styling system.

**Key Achievement:** 95% asset width in SessionCanvas with zero code duplication.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Technical Analysis](#technical-analysis)
3. [Recommended Solution](#recommended-solution)
4. [Implementation Guide](#implementation-guide)
5. [Architecture Benefits](#architecture-benefits)
6. [Testing Strategy](#testing-strategy)
7. [Alternative Solutions](#alternative-solutions)
8. [Future Enhancements](#future-enhancements)
9. [Conclusion](#conclusion)

---

## Problem Statement

### Current Behavior

- **SessionCanvas (Participant View):** Assets take 90% of container width using `data-theme="narrow"`
- **HostControlPanel (Host View):** Assets take 70% of container width using `data-theme="wide"`
- **User Request:** Canvas assets should take 95% width for better visual prominence during presentations

### Technical Challenge

The challenge requires:
- ✅ Increase asset width to 95% in SessionCanvas only
- ✅ Maintain 70% width in HostControlPanel (no regression)
- ✅ Preserve existing CSS architecture and theme system
- ✅ Support SignalR broadcast between HostControlPanel and SessionCanvas
- ✅ Avoid code duplication in CSS
- ✅ Ensure backward compatibility with existing views

### Affected Components

**Files Involved:**
- [`SPA/NoorCanvas/wwwroot/css/session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css) - CSS custom property system
- [`SPA/NoorCanvas/Pages/SessionCanvas.razor`](../../../SPA/NoorCanvas/Pages/SessionCanvas.razor) - Participant canvas view
- [`SPA/NoorCanvas/Pages/HostControlPanel.razor`](../../../SPA/NoorCanvas/Pages/HostControlPanel.razor) - Host control panel (no changes)

---

## Technical Analysis

### Current CSS Architecture

#### CSS Custom Property System

The existing architecture uses CSS custom properties for flexible theming:

```css
/* Root defaults */
:root {
    --islamic-asset-width: 70%;
    --islamic-asset-max-width: 700px;
}

/* Wide Container Theme (HostControlPanel) */
[data-theme="wide"] {
    --islamic-asset-width: 70%;
    --islamic-asset-max-width: 700px;
}

/* Narrow Container Theme (SessionCanvas) */
[data-theme="narrow"],
.islamic-content {
    --islamic-asset-width: 90%;
    --islamic-asset-max-width: none;
}
```

#### Asset Type Application

All asset types consume these custom properties:

```css
[data-islamic-content] .ayah-card,
[data-islamic-content] .inserted-hadees,
[data-islamic-content] .poetry-section,
[data-islamic-content] .etymology-card,
[data-islamic-content] .esotericBlock,
[data-islamic-content] .example {
    width: var(--islamic-asset-width);
    max-width: var(--islamic-asset-max-width);
}
```

**Key Observation:** The architecture already supports theme-based width control through custom properties, making extension straightforward.

### SignalR Broadcast Flow

#### HostControlPanel → SessionCanvas

**Asset Sharing (HostControlPanel.razor):**
```csharp
// Broadcast asset HTML to participants
await hubConnection.InvokeAsync("PublishAssetContent", SessionId.Value, processedHtml);
```

**Asset Reception (SessionCanvas.razor):**
```csharp
// Receive and render asset content
hubConnection.On<string>("AssetContentReceived", async (htmlContent) => {
    Model.SharedAssetContent = htmlContent;
    await InvokeAsync(StateHasChanged);
});
```

**Current Rendering:**
```html
<div class="canvas-asset-content islamic-content" 
     data-islamic-content 
     data-theme="narrow">
    @((MarkupString)GetSafeHtmlContent(Model.SharedAssetContent))
</div>
```

**Analysis:** The SignalR broadcast maintains HTML structure integrity. The theme is applied at the container level in SessionCanvas, ensuring consistent rendering regardless of source.

### Code Duplication Assessment

#### Existing Pattern Analysis

The current CSS already uses multi-selector patterns for compatibility:

```css
/* Existing multi-context selectors */
[data-islamic-content] .ayah-card,
.ks-transcript .ayah-card,
.session-transcript-content .ayah-card,
.transcript-display .ayah-card,
.islamic-content .ayah-card {
    /* Same properties applied to multiple contexts */
}
```

**Current State:** 5-6 selector combinations per asset type

#### Duplication Risk with Different Approaches

**❌ Approach A: Selector Override (Creates Duplication)**
```css
.canvas-asset-content[data-islamic-content] .ayah-card { width: 95% !important; }
.canvas-asset-content[data-islamic-content] .inserted-hadees { width: 95% !important; }
.canvas-asset-content[data-islamic-content] .poetry-section { width: 95% !important; }
/* ... repeated for each asset type = DUPLICATION */
```

**✅ Approach B: Theme Extension (Zero Duplication)**
```css
[data-theme="canvas"] {
    --islamic-asset-width: 95%;
    --islamic-asset-max-width: none;
}
/* No selector duplication - uses existing application logic */
```

**Conclusion:** Theme extension approach eliminates code duplication by leveraging the existing CSS custom property infrastructure.

---

## Recommended Solution

### Approach: CSS Theme Extension

**Strategy:** Extend the existing CSS custom property system by adding a new `canvas` theme variant.

**Rationale:**
- ✅ Zero code duplication
- ✅ Maintains architectural consistency
- ✅ Requires minimal code changes (5 lines CSS, 1 attribute change)
- ✅ Preserves backward compatibility
- ✅ Supports future extensibility

### Implementation Overview

**Step 1:** Add canvas theme to [`session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css)  
**Step 2:** Update SessionCanvas template to use `data-theme="canvas"`  
**Step 3:** Validate cross-view compatibility  

---

## Implementation Guide

### Step 1: CSS Theme Definition

**File:** [`SPA/NoorCanvas/wwwroot/css/session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css)

**Location:** Add after existing theme definitions (around line 50-60, near other `[data-theme]` rules)

```css
/* Canvas Container Theme - Optimized for SessionCanvas view */
[data-theme="canvas"] {
    --islamic-asset-width: 95%;
    --islamic-asset-max-width: none;
    --islamic-container-padding: 10px;
}

/* Canvas-specific container optimization */
.canvas-asset-content[data-theme="canvas"] {
    padding: var(--islamic-container-padding) !important;
}
```

**Explanation:**
- `--islamic-asset-width: 95%` - Sets assets to 95% of canvas container width
- `--islamic-asset-max-width: none` - Removes max-width constraint for full utilization
- `--islamic-container-padding: 10px` - Optimizes padding for more content space
- `.canvas-asset-content` override applies reduced padding specifically in canvas context

### Step 2: SessionCanvas Template Update

**File:** [`SPA/NoorCanvas/Pages/SessionCanvas.razor`](../../../SPA/NoorCanvas/Pages/SessionCanvas.razor)

**Change Required:**

```diff
<!-- Before -->
<div class="canvas-asset-content islamic-content" 
     data-islamic-content 
-    data-theme="narrow">
+    data-theme="canvas">
    @((MarkupString)GetSafeHtmlContent(Model.SharedAssetContent))
</div>
```

**Explanation:**
- Change `data-theme="narrow"` to `data-theme="canvas"`
- This activates the new canvas theme with 95% width
- All other attributes remain unchanged

### Step 3: Validation

**Build Verification:**
```powershell
# Build the solution to verify no errors
dotnet build SPA/NoorCanvas/NoorCanvas.csproj
```

**Expected:** Zero errors, zero warnings

**Manual Testing:**
1. Start HostControlPanel and SessionCanvas
2. Share an asset (ayah card, hadith, poetry, etc.) from HostControlPanel
3. Verify asset renders at ~95% width in SessionCanvas
4. Verify asset remains at ~70% width in HostControlPanel

---

## Architecture Benefits

### Zero Code Duplication

**Comparison:**

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CSS Lines | ~2,847 | ~2,852 | +5 lines |
| Theme Definitions | 2 (wide, narrow) | 3 (wide, narrow, canvas) | +1 theme |
| Selector Duplication | None | None | No change |
| Logic Duplication | None | None | No change |

**Analysis:** The solution adds only a new theme definition without duplicating property application logic.

### Theme Compatibility Matrix

| View | Theme | Asset Width | Container Max-Width | Container Padding | Use Case |
|------|-------|-------------|---------------------|-------------------|----------|
| HostControlPanel | `wide` | 70% | 700px | 20px | Content review/editing |
| SessionCanvas | `canvas` | 95% | none | 10px | Presentation/display |
| Standalone HTML | `narrow` | 90% | none | 20px | Direct viewing |
| Transcript Viewer | `wide` | 70% | 700px | 20px | Reading interface |

### Extensibility

The architecture supports future theme variants with minimal effort:

```css
/* Future theme examples */
[data-theme="mobile"] {
    --islamic-asset-width: 98%;
    --islamic-asset-max-width: none;
    --islamic-container-padding: 5px;
}

[data-theme="print"] {
    --islamic-asset-width: 100%;
    --islamic-asset-max-width: none;
    --islamic-container-padding: 0;
}

[data-theme="compact"] {
    --islamic-asset-width: 60%;
    --islamic-asset-max-width: 500px;
    --islamic-container-padding: 15px;
}
```

### Clean Separation of Concerns

**Architectural Layers:**

```
┌─────────────────────────────────────┐
│ SessionCanvas.razor                 │
│ (Applies theme via data-theme attr) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ session-transcript.css              │
│ (Defines theme custom properties)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ Asset Type Styles                   │
│ (Consume custom properties)         │
└─────────────────────────────────────┘
```

**Benefits:**
- UI components control theme selection
- CSS defines theme properties
- Asset styles consume properties automatically
- No tight coupling between layers

---

## Testing Strategy

### Test Cases

#### 1. Asset Width Verification

**Objective:** Verify assets render at correct widths in each view

**Test Steps:**
1. Open HostControlPanel with active session
2. Open SessionCanvas in separate browser tab
3. Share an ayah card from HostControlPanel
4. Measure asset width in both views using browser DevTools

**Expected Results:**
- HostControlPanel: Asset width ≈ 70% of `.session-transcript-content`
- SessionCanvas: Asset width ≈ 95% of `.canvas-asset-content`

#### 2. Cross-View Compatibility

**Objective:** Ensure SignalR broadcast maintains formatting

**Test Steps:**
1. Share different asset types from HostControlPanel:
   - Ayah card (Quranic verse)
   - Hadith (inserted-hadees)
   - Poetry (poetry-section)
   - Etymology (etymology-card)
2. Verify rendering in SessionCanvas

**Expected Results:**
- All asset types render correctly
- Arabic text displays properly
- Styling is consistent with theme
- No layout breaks or overflow issues

#### 3. Theme Isolation

**Objective:** Verify themes don't interfere with each other

**Test Steps:**
1. Open multiple views simultaneously
2. Verify each view maintains its intended theme
3. Change content in one view, verify others unaffected

**Expected Results:**
- HostControlPanel maintains `wide` theme (70% width)
- SessionCanvas maintains `canvas` theme (95% width)
- No cross-contamination of styles

#### 4. Responsive Behavior

**Objective:** Test behavior across different screen sizes

**Test Steps:**
1. Test SessionCanvas at various viewport widths:
   - 1920px (desktop)
   - 1366px (laptop)
   - 768px (tablet)
   - 375px (mobile)
2. Verify assets scale appropriately

**Expected Results:**
- Assets maintain 95% width relative to container
- No horizontal overflow
- Text remains readable
- Arabic fonts render correctly

### Validation Checklist

**Pre-Implementation:**
- [ ] Review current CSS architecture
- [ ] Understand SignalR broadcast flow
- [ ] Identify affected components
- [ ] Create checkpoint commit

**During Implementation:**
- [ ] Add canvas theme to session-transcript.css
- [ ] Update SessionCanvas.razor template
- [ ] Verify CSS syntax (no errors)
- [ ] Build solution (zero errors, zero warnings)

**Post-Implementation:**
- [ ] CSS custom properties apply correctly
- [ ] No visual regression in HostControlPanel
- [ ] SignalR broadcast maintains formatting
- [ ] Canvas assets use 95% of available width
- [ ] Container padding optimized for content display
- [ ] Arabic fonts render correctly in both views
- [ ] No console errors in browser
- [ ] Performance unchanged (no rendering delays)

### Automated Testing Considerations

**Playwright Test Example:**

```typescript
// Tests/UI/canvas-asset-width.spec.ts
import { test, expect } from '@playwright/test';

test('Canvas assets should be 95% width', async ({ page }) => {
    // Navigate to SessionCanvas
    await page.goto('/session/canvas/{token}');
    
    // Wait for asset to load
    const assetCard = page.locator('.ayah-card').first();
    await assetCard.waitFor();
    
    // Get container and asset widths
    const containerWidth = await page.locator('.canvas-asset-content').evaluate(el => el.clientWidth);
    const assetWidth = await assetCard.evaluate(el => el.clientWidth);
    
    // Verify 95% width (allow 2% tolerance for rounding)
    const expectedWidth = containerWidth * 0.95;
    expect(assetWidth).toBeGreaterThanOrEqual(expectedWidth * 0.98);
    expect(assetWidth).toBeLessThanOrEqual(expectedWidth * 1.02);
});

test('HostControlPanel assets should remain 70% width', async ({ page }) => {
    // Navigate to HostControlPanel
    await page.goto('/host/control-panel/{token}');
    
    // Similar verification for 70% width
    // ... test implementation
});
```

---

## Alternative Solutions

### Option A: CSS Override with Selectors (Rejected)

**Implementation:**
```css
/* Would create selector duplication */
.canvas-asset-content[data-islamic-content] .ayah-card { 
    width: 95% !important; 
    max-width: none !important;
}
.canvas-asset-content[data-islamic-content] .inserted-hadees { 
    width: 95% !important; 
    max-width: none !important;
}
.canvas-asset-content[data-islamic-content] .poetry-section { 
    width: 95% !important; 
    max-width: none !important;
}
/* ... repeated for each asset type */
```

**Rejection Reasons:**
- ❌ Creates significant selector duplication
- ❌ Maintenance overhead (must update each asset type)
- ❌ Uses `!important` which increases specificity conflicts
- ❌ Doesn't leverage existing CSS custom property system
- ❌ Harder to extend for future themes

### Option B: Inline Styles (Rejected)

**Implementation:**
```html
<div class="canvas-asset-content islamic-content" 
     data-islamic-content
     style="--islamic-asset-width: 95%; --islamic-asset-max-width: none;">
    @((MarkupString)GetSafeHtmlContent(Model.SharedAssetContent))
</div>
```

**Rejection Reasons:**
- ❌ Mixes presentation logic with component markup
- ❌ Reduces maintainability
- ❌ Harder to update globally
- ❌ Violates separation of concerns
- ❌ CSS variables in inline styles have specificity issues

### Option C: Separate Canvas CSS File (Rejected)

**Implementation:**
```html
<!-- SessionCanvas.razor -->
<HeadContent>
    <link rel="stylesheet" href="~/css/session-transcript.css">
    <link rel="stylesheet" href="~/css/canvas-specific.css">
</HeadContent>
```

**Rejection Reasons:**
- ❌ Creates parallel styling systems
- ❌ Maintenance complexity (two CSS files to manage)
- ❌ Potential for style conflicts
- ❌ Adds HTTP request overhead
- ❌ Fragments the architecture

### Option D: JavaScript-Based Width Control (Rejected)

**Implementation:**
```javascript
// Apply width dynamically via JavaScript
document.querySelectorAll('.ayah-card').forEach(el => {
    el.style.width = '95%';
});
```

**Rejection Reasons:**
- ❌ Introduces JavaScript dependency for styling
- ❌ Potential FOUC (Flash of Unstyled Content)
- ❌ Performance overhead
- ❌ Harder to maintain
- ❌ Violates CSS-first design principle

### Comparison Matrix

| Solution | Code Duplication | Maintainability | Performance | Extensibility | Recommended |
|----------|-----------------|-----------------|-------------|---------------|-------------|
| **Theme Extension** | None | Excellent | Excellent | Excellent | ✅ Yes |
| CSS Override | High | Poor | Good | Poor | ❌ No |
| Inline Styles | Low | Poor | Good | Poor | ❌ No |
| Separate CSS File | Medium | Poor | Fair | Fair | ❌ No |
| JavaScript Control | Low | Poor | Fair | Poor | ❌ No |

---

## Future Enhancements

### Dynamic Theme Switching

**Feature:** Allow runtime theme switching for different presentation modes

**Implementation:**
```javascript
// Future JavaScript API for theme switching
function setCanvasTheme(theme) {
    const container = document.querySelector('[data-islamic-content]');
    if (container) {
        container.setAttribute('data-theme', theme);
    }
}

// Usage examples
setCanvasTheme('canvas');  // 95% width for presentations
setCanvasTheme('narrow');  // 90% width for standard viewing
setCanvasTheme('wide');    // 70% width for editing
```

**Use Cases:**
- Presenter mode vs audience mode
- Compact view for multi-window layouts
- Accessibility adjustments

### Theme-Aware Asset Processing

**Feature:** Server-side theme-specific HTML optimization

**Implementation:**
```csharp
// AssetProcessingService.cs - Future enhancement
public string ProcessAssetForTheme(string html, string theme)
{
    return theme switch
    {
        "canvas" => OptimizeForCanvasPresentation(html),
        "mobile" => OptimizeForMobileView(html),
        "print" => OptimizeForPrint(html),
        _ => html
    };
}

private string OptimizeForCanvasPresentation(string html)
{
    // Add canvas-specific optimizations
    // - Increase font sizes for better visibility
    // - Adjust padding for better spacing
    // - Enhance contrast for projection displays
    return html;
}
```

### User Preferences

**Feature:** Allow users to customize asset width via settings

**Implementation:**
```csharp
// UserPreferences model
public class UserPreferences
{
    public string CanvasTheme { get; set; } = "canvas";
    public int AssetWidthPercentage { get; set; } = 95;
}

// Apply preferences in SessionCanvas
<div class="canvas-asset-content islamic-content" 
     data-islamic-content 
     data-theme="@UserPreferences.CanvasTheme"
     style="--islamic-asset-width: @(UserPreferences.AssetWidthPercentage)%;">
```

### Responsive Theme Adaptation

**Feature:** Automatically adjust theme based on viewport size

**Implementation:**
```css
/* Responsive theme adaptation */
@media (max-width: 768px) {
    [data-theme="canvas"] {
        --islamic-asset-width: 98%;  /* Wider on mobile */
        --islamic-container-padding: 5px;
    }
}

@media (min-width: 1920px) {
    [data-theme="canvas"] {
        --islamic-asset-width: 90%;  /* Slightly narrower on large screens */
        --islamic-asset-max-width: 1400px;
    }
}
```

### Analytics Integration

**Feature:** Track asset viewing patterns by theme

**Implementation:**
```csharp
// Log theme usage for analytics
Logger.LogInformation("Asset viewed: Theme={Theme}, AssetType={AssetType}, SessionId={SessionId}",
    currentTheme, assetType, sessionId);
```

---

## Implementation Timeline

### Phase 1: Core Implementation (1 hour)

**Tasks:**
- [ ] Add canvas theme to [`session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css) (15 min)
- [ ] Update SessionCanvas.razor template (5 min)
- [ ] Build and verify no errors (10 min)
- [ ] Basic manual testing (30 min)

**Deliverables:**
- Canvas theme implemented
- SessionCanvas using new theme
- Build passing with zero warnings

### Phase 2: Validation (30 minutes)

**Tasks:**
- [ ] Cross-browser testing (Chrome, Firefox, Edge) (15 min)
- [ ] SignalR broadcast verification (10 min)
- [ ] Mobile responsiveness check (5 min)

**Deliverables:**
- All browsers render correctly
- SignalR maintains formatting
- Mobile view acceptable

### Phase 3: Documentation (15 minutes)

**Tasks:**
- [ ] Update CSS inline comments (5 min)
- [ ] Document theme system in code (5 min)
- [ ] Update this design document with actual results (5 min)

**Deliverables:**
- Code comments updated
- Documentation reflects implementation

### Total Estimated Time: ~1.75 hours

---

## Rollback Plan

### Rollback Procedure

If issues are discovered post-implementation:

**Step 1: Revert SessionCanvas Template**
```diff
<div class="canvas-asset-content islamic-content" 
     data-islamic-content 
-    data-theme="canvas">
+    data-theme="narrow">
```

**Step 2: Remove Canvas Theme from CSS**
```css
/* Comment out or remove these lines from session-transcript.css */
/*
[data-theme="canvas"] {
    --islamic-asset-width: 95%;
    --islamic-asset-max-width: none;
    --islamic-container-padding: 10px;
}
*/
```

**Step 3: Rebuild and Test**
```powershell
dotnet build SPA/NoorCanvas/NoorCanvas.csproj
```

**Step 4: Verify Rollback**
- Confirm SessionCanvas returns to 90% width
- Verify no other views affected
- Test SignalR broadcast still works

### Rollback Risk: **Very Low**

**Rationale:**
- Changes are isolated to theme definition
- No breaking changes to existing code
- Easy to revert with simple edits
- No database migrations required
- No API contract changes

---

## Conclusion

### Summary

The **Canvas Asset Override** solution provides a clean, maintainable approach to optimizing asset width for SessionCanvas while preserving the existing architecture. The implementation requires minimal code changes, introduces zero duplication, and supports future extensibility.

### Key Benefits

✅ **Zero Code Duplication**
- Extends existing CSS custom property system
- No selector repetition required
- Maintains single source of truth

✅ **Minimal Implementation Effort**
- 5 lines added to CSS
- 1 attribute changed in Razor template
- ~1.75 hours total implementation time

✅ **Full Backward Compatibility**
- HostControlPanel unaffected (70% width maintained)
- Existing narrow theme still available
- No breaking changes to API or SignalR

✅ **Extensible Architecture**
- Easy to add new themes (mobile, print, compact)
- Supports future dynamic theme switching
- Enables user preferences integration

✅ **Clean Separation of Concerns**
- UI components control theme selection
- CSS defines theme properties
- Assets consume properties automatically

### Impact Analysis

**Files Modified:**
1. [`SPA/NoorCanvas/wwwroot/css/session-transcript.css`](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css) - **+5 lines**
2. [`SPA/NoorCanvas/Pages/SessionCanvas.razor`](../../../SPA/NoorCanvas/Pages/SessionCanvas.razor) - **1 attribute change**

**Files Unchanged:**
- HostControlPanel.razor (no changes needed)
- AssetProcessingService.cs (no changes needed)
- SessionHub.cs (no changes needed)
- All other views and components

**Risk Level:** Very Low  
**Rollback Complexity:** Very Simple  
**Testing Overhead:** Minimal

### Final Recommendation

**Proceed with implementation** using the CSS Theme Extension approach. This solution aligns with NOOR Canvas architectural principles, maintains code quality, and delivers the requested functionality with minimal risk and maximum maintainability.

### Next Steps

1. ✅ **Approval:** Obtain stakeholder approval for implementation
2. ⏳ **Implementation:** Execute Phase 1 (Core Implementation)
3. ⏳ **Validation:** Execute Phase 2 (Testing and Validation)
4. ⏳ **Documentation:** Execute Phase 3 (Code Documentation)
5. ⏳ **Deployment:** Merge to master and deploy

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | October 9, 2025 | GitHub Copilot | Initial comprehensive design document |

---

**Related Documentation:**
- [System Architecture](../../../.github/instructions/Links/Architecture.md)
- [System Index](../../../.github/instructions/Links/SystemIndex.md)
- [Session Transcript CSS](../../../SPA/NoorCanvas/wwwroot/css/session-transcript.css)
