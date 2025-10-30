# canvas-receivers.plan.md

**Key**: `canvas-receivers`  
**Branch**: `development`  
**Created**: 2025-10-21  
**Status**: Implementation In Progress

---

## User Request

> When SessionCanvas.razor and TranscriptCanvas.razor are viewed on mobile phones, if the phone is held in portrait mode, display a beautiful message (following the same color theme and best UI standards) requesting user to rotate the phone to landscape for better readability. I want these views to work ONLY in landscape mode on phones. Desktop and iPads should work as-is.

**Clarifications**:
1. ✅ Tablets (iPads) should also enforce landscape mode
2. ✅ Canvas content should NOT display in portrait - only the orientation message
3. ✅ Overlay should be persistent (non-dismissible) until device rotated to landscape

---

## Technology Stack

- **Framework**: ASP.NET Core 8.0 Blazor Server
- **UI Components**: Razor Components (.razor files)
- **Styling**: Component-scoped CSS with @media queries
- **Theme Colors**: 
  - Background: #F8F5F1 (beige)
  - Primary: #006400 (green)
  - Accent: #D4AF37 (gold)
  - White: #FFFFFF
- **Fonts**: Poppins (headings), Inter (body)
- **Testing**: Playwright + Percy visual regression
- **Device Detection**: CSS `@media (max-width: 1024px) and (orientation: portrait)`

---

## Architecture Layers Affected

### UI Layer
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Add portrait orientation overlay
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` - Add portrait orientation overlay

### Testing Layer
- New Playwright test: Portrait orientation blocking validation
- Percy snapshots: Portrait (blocked) vs Landscape (working)

---

## Implementation Strategy

### Pure CSS Solution (No JavaScript Required)

**Advantages**:
- No C# code changes needed
- No Blazor lifecycle management
- No JavaScript interop overhead
- Works immediately on page load
- Zero performance impact
- Automatically responsive to device rotation

**Approach**:
1. Add overlay `<div>` element with orientation message
2. Use CSS media query to show/hide overlay based on orientation
3. Hide main canvas content when overlay visible

---

## Phase 1: Portrait Overlay Styling

### Objective
Add beautiful, persistent orientation message overlay to SessionCanvas.razor and TranscriptCanvas.razor that displays ONLY on phones/tablets in portrait mode.

### Target Devices
- **Phones**: ≤ 767px width (iPhone SE, iPhone 14 Pro, Android)
- **Tablets**: 768px - 1024px width (iPad, iPad Pro)
- **Portrait Detection**: `(max-width: 1024px) and (orientation: portrait)`

### Design Specifications

**Overlay Container**:
- Full viewport coverage (100vw × 100vh)
- Fixed positioning (stays on screen during scroll)
- Z-index: 9999 (above all content)
- Background: #F8F5F1 (NOOR Canvas beige)
- Centered content (flexbox)

**Message Card**:
- White background (#FFFFFF)
- Border radius: 1.5rem
- Box shadow: Elegant elevation
- Padding: 2rem
- Max-width: 90% viewport
- Gold border: 2px solid #D4AF37

**Icon**:
- Phone rotation icon (Font Awesome `fa-mobile-screen-button` + `fa-rotate-90`)
- Size: 4rem
- Color: #D4AF37 (gold)
- Margin bottom: 1.5rem

**Typography**:
- Heading: "Landscape Mode Required"
  - Font: Poppins, 1.75rem, weight 700
  - Color: #006400 (green)
- Body: "Please rotate your device to landscape orientation for the best viewing experience."
  - Font: Inter, 1rem, weight 400
  - Color: #4A5568 (gray)
  - Line height: 1.6

**Animation** (Enhancement D):
- Fade-in: 0.3s ease-in
- Icon pulse: Subtle 2s infinite animation

### CSS Implementation

```css
/* Portrait Orientation Overlay - Mobile & Tablet Only */
.canvas-portrait-overlay {
    display: none; /* Hidden by default (landscape/desktop) */
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #F8F5F1;
    z-index: 9999;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-in;
}

@media (max-width: 1024px) and (orientation: portrait) {
    .canvas-portrait-overlay {
        display: flex !important; /* Show overlay in portrait */
    }
    
    .session-canvas-container,
    .canvas-main-grid,
    .canvas-area-container,
    .canvas-sidebar {
        display: none !important; /* Hide all canvas content */
    }
}

.canvas-portrait-message-card {
    background-color: #FFFFFF;
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 90%;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    border: 2px solid #D4AF37;
}

.canvas-portrait-icon {
    font-size: 4rem;
    color: #D4AF37;
    margin-bottom: 1.5rem;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.canvas-portrait-heading {
    font-family: 'Poppins', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #006400;
    margin-bottom: 1rem;
}

.canvas-portrait-text {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    color: #4A5568;
    line-height: 1.6;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .6; }
}
```

### HTML Markup

```razor
<!-- Portrait Orientation Overlay (Mobile/Tablet Only) -->
<div class="canvas-portrait-overlay">
    <div class="canvas-portrait-message-card">
        <i class="fas fa-mobile-screen-button fa-rotate-90 canvas-portrait-icon"></i>
        <h2 class="canvas-portrait-heading">Landscape Mode Required</h2>
        <p class="canvas-portrait-text">
            Please rotate your device to landscape orientation for the best viewing experience.
        </p>
    </div>
</div>
```

### Files to Modify

1. **SessionCanvas.razor**:
   - Location: Line ~50 (after opening `<style>` tag)
   - Add: Portrait overlay CSS rules
   - Location: Line ~1050 (after `<PageTitle>` and `<HeadContent>`)
   - Add: Portrait overlay HTML markup

2. **TranscriptCanvas.razor**:
   - Location: Line ~50 (after opening `<style>` tag)
   - Add: Portrait overlay CSS rules
   - Location: Line ~1050 (after `<PageTitle>` and `<HeadContent>`)
   - Add: Portrait overlay HTML markup

---

## Phase 2: Testing & Validation

### Objective
Verify portrait orientation blocking works correctly across devices and doesn't affect desktop/landscape views.

### Test Scenarios

#### Test 1: Portrait Mode - Overlay Displayed
**Devices**: iPhone SE (375×667), iPhone 14 Pro (390×844), iPad (768×1024)
**Orientation**: Portrait
**Expected**:
- ✅ Overlay visible with rotation message
- ✅ Canvas content hidden (not visible)
- ✅ Icon animated (pulse effect)
- ✅ Text readable and properly styled

#### Test 2: Landscape Mode - Normal Operation
**Devices**: iPhone SE (667×375), iPhone 14 Pro (844×390), iPad (1024×768)
**Orientation**: Landscape
**Expected**:
- ✅ Overlay hidden
- ✅ Canvas content fully visible and functional
- ✅ No layout issues
- ✅ All interactions work normally

#### Test 3: Desktop - Unaffected
**Devices**: Desktop (1280×720), Desktop Large (1920×1080)
**Expected**:
- ✅ Overlay never displayed
- ✅ Canvas works normally
- ✅ No performance impact
- ✅ No visual regression

### Percy Visual Regression Tests

**Test File**: `Tests/UI/canvas-portrait-orientation-blocking.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const BASE_URL = 'https://localhost:9091';
const VALID_SESSION_TOKEN = 'KJAHA99L'; // Session 212
const VALID_TRANSCRIPT_TOKEN = 'VALID_TRANSCRIPT_TOKEN';

test.describe('Canvas Portrait Orientation Blocking', () => {
    
    test('SessionCanvas - iPhone SE Portrait - Overlay Visible', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Verify overlay is visible
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).toBeVisible();
        
        // Verify canvas content is hidden
        const canvasContainer = page.locator('.session-canvas-container');
        await expect(canvasContainer).not.toBeVisible();
        
        // Verify message content
        await expect(page.locator('.canvas-portrait-heading')).toContainText('Landscape Mode Required');
        
        await percySnapshot(page, 'SessionCanvas - iPhone SE Portrait - Blocked', {
            widths: [375]
        });
    });
    
    test('SessionCanvas - iPhone SE Landscape - Normal Operation', async ({ page }) => {
        await page.setViewportSize({ width: 667, height: 375 });
        await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Verify overlay is hidden
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).not.toBeVisible();
        
        // Verify canvas content is visible
        const canvasContainer = page.locator('.session-canvas-container');
        await expect(canvasContainer).toBeVisible();
        
        await percySnapshot(page, 'SessionCanvas - iPhone SE Landscape - Working', {
            widths: [667]
        });
    });
    
    test('SessionCanvas - iPad Portrait - Overlay Visible', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).toBeVisible();
        
        await percySnapshot(page, 'SessionCanvas - iPad Portrait - Blocked', {
            widths: [768]
        });
    });
    
    test('SessionCanvas - iPad Landscape - Normal Operation', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).not.toBeVisible();
        
        const canvasContainer = page.locator('.session-canvas-container');
        await expect(canvasContainer).toBeVisible();
        
        await percySnapshot(page, 'SessionCanvas - iPad Landscape - Working', {
            widths: [1024]
        });
    });
    
    test('SessionCanvas - Desktop - Unaffected', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(`${BASE_URL}/session/canvas/${VALID_SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Verify overlay never appears on desktop
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).not.toBeVisible();
        
        const canvasContainer = page.locator('.session-canvas-container');
        await expect(canvasContainer).toBeVisible();
        
        await percySnapshot(page, 'SessionCanvas - Desktop - Unaffected', {
            widths: [1280]
        });
    });
    
    // Repeat all tests for TranscriptCanvas
    test('TranscriptCanvas - iPhone SE Portrait - Overlay Visible', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).toBeVisible();
        
        await percySnapshot(page, 'TranscriptCanvas - iPhone SE Portrait - Blocked', {
            widths: [375]
        });
    });
    
    test('TranscriptCanvas - iPhone SE Landscape - Normal Operation', async ({ page }) => {
        await page.setViewportSize({ width: 667, height: 375 });
        await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TRANSCRIPT_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        const overlay = page.locator('.canvas-portrait-overlay');
        await expect(overlay).not.toBeVisible();
        
        await percySnapshot(page, 'TranscriptCanvas - iPhone SE Landscape - Working', {
            widths: [667]
        });
    });
});
```

### Manual Testing Checklist

- [ ] iPhone SE (375×667 portrait) - Overlay visible, content hidden
- [ ] iPhone SE (667×375 landscape) - Overlay hidden, content visible
- [ ] iPhone 14 Pro (390×844 portrait) - Overlay visible
- [ ] iPhone 14 Pro (844×390 landscape) - Overlay hidden
- [ ] iPad (768×1024 portrait) - Overlay visible
- [ ] iPad (1024×768 landscape) - Overlay hidden
- [ ] Desktop 1280×720 - Overlay never appears
- [ ] Desktop 1920×1080 - Overlay never appears
- [ ] Rotate physical device - Overlay appears/disappears smoothly

---

## Success Criteria

1. ✅ Portrait mode on phones (≤767px) shows overlay, hides canvas content
2. ✅ Portrait mode on tablets (768-1024px) shows overlay, hides canvas content
3. ✅ Landscape mode on phones/tablets shows normal canvas, hides overlay
4. ✅ Desktop (>1024px) never shows overlay, always shows canvas
5. ✅ Overlay follows NOOR Canvas design system (colors, fonts, spacing)
6. ✅ Message is clear, professional, and helpful
7. ✅ No JavaScript required - pure CSS solution
8. ✅ No performance impact on any device
9. ✅ Percy visual regression tests pass
10. ✅ Manual testing on all target devices successful

---

## Risks & Mitigation

### Risk 1: Desktop Layout Regression
**Severity**: LOW  
**Probability**: VERY LOW  
**Mitigation**: Media query specifically targets ≤1024px + portrait orientation

### Risk 2: Overlay Z-Index Conflicts
**Severity**: LOW  
**Probability**: LOW  
**Mitigation**: Z-index 9999 should be above all existing content

### Risk 3: Font Awesome Icon Missing
**Severity**: LOW  
**Probability**: VERY LOW  
**Mitigation**: Font Awesome already loaded in both SessionCanvas and TranscriptCanvas

### Risk 4: Tablet Edge Cases (exactly 768px or 1024px)
**Severity**: MEDIUM  
**Probability**: MEDIUM  
**Mitigation**: Test at exact breakpoint boundaries (768×1024, 1024×768)

---

## Rollback Plan

If issues arise:
1. Git revert commit
2. Remove CSS rules and HTML markup
3. Rebuild and redeploy
4. Estimated rollback time: < 5 minutes

---

## Dependencies

- **Font Awesome**: Already loaded in both views (verified in `<HeadContent>`)
- **CSS Media Queries**: Native browser support (IE11+)
- **Flexbox**: Native browser support (all modern browsers)

---

## Timeline Estimate

- **Phase 1**: 45 minutes (CSS + HTML markup for both files)
- **Phase 2**: 60 minutes (Playwright tests + Percy snapshots + manual testing)
- **Total**: 1.75-2 hours

---

## Commit Strategy

**Single Commit**:
```
feat(canvas): Enforce landscape orientation on mobile/tablet devices

- Added portrait orientation overlay to SessionCanvas.razor
- Added portrait orientation overlay to TranscriptCanvas.razor
- Overlay displays ONLY on devices ≤1024px in portrait mode
- Canvas content hidden in portrait, visible in landscape
- Pure CSS solution (no JavaScript required)
- Follows NOOR Canvas design system (beige, gold, green theme)
- Persistent overlay until device rotated to landscape
- Desktop and landscape mode unaffected

Devices Affected:
- Phones (≤767px): Portrait blocked, landscape works
- Tablets (768-1024px): Portrait blocked, landscape works
- Desktop (>1024px): Always works (overlay never shown)

Testing:
- Percy visual regression: Portrait vs landscape states
- Manual testing: iPhone SE, iPhone 14 Pro, iPad, Desktop
- No layout regression on desktop or landscape views

Closes: #canvas-receivers
```

---

## Notes

- **Pure CSS Solution**: No Blazor component, no C# code, no JavaScript interop
- **Performance**: Zero runtime overhead, CSS-only solution
- **Maintainability**: Self-contained in each view, easy to modify
- **Accessibility**: Clear message, semantic HTML, screen reader friendly
- **User Experience**: Immediate feedback, beautiful design, non-intrusive in landscape

---

**Status**: Ready for Phase 1 implementation  
**Next Step**: Add portrait overlay CSS and HTML to SessionCanvas.razor
