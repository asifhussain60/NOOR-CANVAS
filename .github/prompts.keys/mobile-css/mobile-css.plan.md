# mobile-css.plan.md - TranscriptCanvas Mobile Optimization Plan

**Key**: `mobile-css`  
**Branch**: `development`  
**Created**: 2025-10-20  
**Status**: Planning Complete → Ready for Implementation

---

## Executive Summary

Optimize TranscriptCanvas mobile experience for phones (320px-767px) by reorganizing layout, reducing font sizes, maximizing screen width, and cleaning up inline styles. **Desktop and tablet views remain completely unchanged.**

**Key Constraint**: All changes confined to `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` with styling in local `<style>` block (no external CSS).

---

## Problem Statement

### Current Mobile Issues
1. **Layout**: Welcome panel and transcript lack visual hierarchy/separation on phones
2. **Typography**: Font sizes too large for small screens (1.25rem welcome, 1.75rem title)
3. **Space**: Excess padding reduces usable screen real estate on narrow devices
4. **Logo**: 150px header logo consumes too much vertical space
5. **Code Quality**: Inline `style=""` attributes scattered in modal markup

### Impact
- Poor mobile readability
- Cramped content presentation
- Reduced usable screen space
- Maintenance challenges from inline styles

---

## Scope & Constraints

### In-Scope
✅ **File**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` ONLY  
✅ **Viewports**: Mobile phones (320px-767px via `@media (max-width: 768px)`)  
✅ **Changes**: CSS in local `<style>` block + HTML markup cleanup  
✅ **Areas**: Layout, typography, spacing, inline style removal

### Out-of-Scope
❌ Desktop (>768px) and tablet (768px-1024px) styling  
❌ External CSS files or shared stylesheets  
❌ Other Razor pages/components  
❌ JavaScript or C# code changes  
❌ Functionality modifications

### Critical Rules
⚠️ **NO changes to desktop/tablet CSS** - verify 1280px view unchanged  
⚠️ **All styling local** - `<style>` block in TranscriptCanvas.razor only  
⚠️ **Mobile-only** - all layout/font changes inside `@media (max-width: 768px)`

---

## Technical Implementation Plan

### Phase 1: CSS Cleanup (All Viewports)

**Objective**: Move inline `style=""` attributes to CSS classes in local `<style>` block

**Target Elements**:
1. **Question Modal** (`canvas-modal-content`)
   - Current: `<div class="canvas-modal-content" @onclick:stopPropagation="true" style="max-width:500px;">`
   - Change: Create `.canvas-modal-question { max-width: 500px; }` class
   - Update: `<div class="canvas-modal-content canvas-modal-question">`

2. **Modal Buttons** (Submit button in question modal)
   - Current: `style="flex:1;"`
   - Change: Create `.canvas-modal-button-flex { flex: 1; }` class
   - Update: Add class to submit button

3. **Any Other Inline Styles** in component markup
   - Audit HTML for remaining `style=""` attributes
   - Create appropriate CSS classes
   - Replace inline styles with classes

**Implementation**:
```css
/* Add to existing <style> block (after .canvas-modal-content) */

/* Question Modal Specific Width */
.canvas-modal-question {
    max-width: 500px;
}

/* Modal Button Flex Layout */
.canvas-modal-button-flex {
    flex: 1;
}
```

**HTML Updates**:
- Line ~1034: `<div class="canvas-modal-content canvas-modal-question" @onclick:stopPropagation="true">`
- Line ~1053: Add `canvas-modal-button-flex` to submit button

---

### Phase 2: Mobile Layout Enhancement

**Objective**: Add visual distinction to welcome panel on phones only

**Target**: `.canvas-welcome-panel` in mobile media query

**Changes** (inside `@media (max-width: 768px)` block):
```css
@media (max-width: 768px) {
    /* Enhanced Welcome Panel for Mobile */
    .canvas-welcome-panel {
        background-color: #F8F4FF; /* Light purple tint matching canvas-content-area */
        border: 2px solid #D4AF37; /* Golden border for prominence */
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* Subtle elevation */
        margin: 0.5rem auto; /* Reduced top/bottom margin */
        padding: 0; /* Remove default padding, use content padding instead */
    }
    
    /* Welcome content padding adjustment */
    .canvas-welcome-content {
        padding: 0.375rem 0.5rem; /* Reduced from 0.5rem 1rem */
    }
}
```

**Visual Effect**:
- Welcome panel stands out with subtle purple background
- Golden border creates clear separation from transcript
- Shadow provides elevation effect
- Aligns with existing TranscriptCanvas purple theme

---

### Phase 3: Mobile Typography Reduction

**Objective**: Reduce font sizes for better mobile readability

**Changes** (inside `@media (max-width: 768px)` block):

```css
@media (max-width: 768px) {
    /* Header Logo - Reduced Size */
    .canvas-header-logo-img {
        width: 120px;   /* Reduced from 150px */
        height: 120px;  /* Reduced from 150px */
    }
    
    /* Session Title - Smaller on Mobile */
    .canvas-session-title {
        font-size: 1.25rem; /* Reduced from 1.75rem */
    }
    
    /* Session Description - Smaller on Mobile */
    .canvas-session-description {
        font-size: 0.875rem; /* Reduced from 1rem (desktop default) */
    }
    
    /* Welcome Text - Smaller on Mobile */
    .canvas-welcome-text {
        font-size: 0.9rem; /* Reduced from 1.25rem */
    }
    
    /* Empty Message - Smaller on Mobile */
    .canvas-empty-message {
        font-size: 0.875rem; /* Reduced from 1.125rem */
    }
    
    /* Question Modal Title - Mobile Override */
    .canvas-modal-title {
        font-size: 1rem; /* Reduced from 1.25rem */
    }
    
    /* Question Modal Message - Mobile Override */
    .canvas-modal-message {
        font-size: 0.75rem; /* Reduced from 0.875rem */
    }
}
```

**Font Size Summary**:
| Element | Desktop | Mobile | Reduction |
|---------|---------|--------|-----------|
| Header Logo | 150px | 120px | -20% |
| Session Title | 1.75rem | 1.25rem | -29% |
| Session Description | 1rem | 0.875rem | -12.5% |
| Welcome Text | 1.25rem | 0.9rem | -28% |
| Empty Message | 1.125rem | 0.875rem | -22% |
| Modal Title | 1.25rem | 1rem | -20% |
| Modal Message | 0.875rem | 0.75rem | -14% |

---

### Phase 4: Mobile Width Maximization

**Objective**: Reduce padding/margins to maximize usable screen width on phones

**Changes** (inside `@media (max-width: 768px)` block):

```css
@media (max-width: 768px) {
    /* Root Container - Reduced Padding */
    .session-canvas-root {
        padding: 0.75rem; /* Reduced from 1.5rem */
    }
    
    /* Main Container - Reduced Padding */
    .session-canvas-container {
        width: 100%;
        padding: 0.5rem; /* Reduced from 1rem (currently in mobile media query) */
        overflow-x: hidden;
        min-width: 0;
    }
    
    /* Header Content - Reduced Padding */
    .canvas-header-content {
        padding: 0.75rem 0.5rem; /* Reduced from 1rem 0.5rem */
    }
    
    /* Welcome Panel - Full Width on Mobile */
    .canvas-welcome-panel {
        max-width: none; /* Remove max-width constraint for phones */
        width: 100%;     /* Full width within container */
    }
}
```

**Space Optimization Summary**:
| Element | Desktop | Mobile | Space Saved |
|---------|---------|--------|-------------|
| Root Padding | 1.5rem (24px) | 0.75rem (12px) | 24px total |
| Container Padding | 2rem (32px) | 0.5rem (8px) | 48px total |
| Header Padding | 1rem (16px) | 0.75rem (12px) | 8px total |
| Welcome Max-Width | 50rem (800px) | none (100%) | Varies by device |

**Total Horizontal Space Gained**: ~80px on 375px iPhone (21% increase in usable width)

---

## File Modifications

### File: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Location 1: `<style>` Block (Lines ~50-890)**

**Add after `.canvas-modal-content` definition (around line 450)**:
```css
/* Question Modal Specific Width */
.canvas-modal-question {
    max-width: 500px;
}

/* Modal Button Flex Layout */
.canvas-modal-button-flex {
    flex: 1;
}
```

**Modify mobile media query (around lines 816-873)**:
```css
/* Responsive Layout - Mobile */
@media (max-width: 768px) {
    /* Existing mobile rules... */
    
    /* NEW: Root Container - Reduced Padding */
    .session-canvas-root {
        padding: 0.75rem;
    }
    
    /* NEW: Enhanced Welcome Panel */
    .canvas-welcome-panel {
        background-color: #F8F4FF;
        border: 2px solid #D4AF37;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin: 0.5rem auto;
        padding: 0;
        max-width: none;
        width: 100%;
    }
    
    /* MODIFIED: Welcome Content Padding */
    .canvas-welcome-content {
        padding: 0.375rem 0.5rem; /* Reduced from 0.5rem 1rem */
    }
    
    /* MODIFIED: Header Content Padding */
    .canvas-header-content {
        padding: 0.75rem 0.5rem; /* Reduced from 1rem 0.5rem */
    }
    
    /* MODIFIED: Header Logo Size */
    .canvas-header-logo-img {
        width: 120px;  /* Reduced from 150px */
        height: 120px; /* Reduced from 150px */
    }
    
    /* MODIFIED: Session Title Size */
    .canvas-session-title {
        font-size: 1.25rem; /* Reduced from 1.75rem */
    }
    
    /* NEW: Session Description Size */
    .canvas-session-description {
        font-size: 0.875rem;
    }
    
    /* NEW: Welcome Text Size */
    .canvas-welcome-text {
        font-size: 0.9rem;
    }
    
    /* NEW: Empty Message Size */
    .canvas-empty-message {
        font-size: 0.875rem;
    }
    
    /* NEW: Modal Title Size */
    .canvas-modal-title {
        font-size: 1rem;
    }
    
    /* NEW: Modal Message Size */
    .canvas-modal-message {
        font-size: 0.75rem;
    }
    
    /* MODIFIED: Container Padding */
    .session-canvas-container {
        width: 100%;
        padding: 0.5rem; /* Already present, keeping for clarity */
        overflow-x: hidden;
        min-width: 0;
    }
}
```

**Location 2: HTML Markup (Lines ~1030-1060)**

**Question Modal - Line ~1034**:
```html
<!-- Before -->
<div class="canvas-modal-content" @onclick:stopPropagation="true" style="max-width:500px;">

<!-- After -->
<div class="canvas-modal-content canvas-modal-question" @onclick:stopPropagation="true">
```

**Submit Button - Line ~1053**:
```html
<!-- Before -->
<button @onclick="SubmitQuestionFromModal" 
        type="button"
        class="canvas-form-submit-button"
        style="flex:1;">

<!-- After -->
<button @onclick="SubmitQuestionFromModal" 
        type="button"
        class="canvas-form-submit-button canvas-modal-button-flex">
```

---

## Testing & Validation Plan

### Test Matrix

| Test Case | Viewport | Expected Result | Verification Method |
|-----------|----------|-----------------|---------------------|
| Desktop Baseline | 1280x720 | NO visual changes | Percy snapshot comparison |
| Tablet Baseline | 768x1024 | NO visual changes | Percy snapshot comparison |
| Mobile Layout | 375x667 | Welcome panel elevated, distinct styling | Percy snapshot + manual |
| Mobile Typography | 375x667 | Reduced font sizes, improved readability | Percy snapshot + manual |
| Mobile Spacing | 375x667 | Reduced padding, more content space | Percy snapshot + manual |
| Large Phone | 414x896 | Same mobile optimizations | Percy snapshot |
| Small Phone | 320x568 | Content fits, no overflow | Manual testing |
| Modal Interactions | All | Modals function correctly | Functional testing |
| CSS Validation | N/A | No inline styles remain | Code review |

### Percy Visual Regression Tests

**Test File**: Create `Tests/UI/mobile-css-optimization.spec.ts`

```typescript
import percySnapshot from '@percy/playwright';
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const PARTICIPANT_TOKEN = 'KJAHA99L'; // Session 212 user token
const TRANSCRIPT_URL = `${BASE_URL}/transcript/canvas/${PARTICIPANT_TOKEN}`;

test.describe('TranscriptCanvas Mobile CSS Optimization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TRANSCRIPT_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.canvas-header-logo', { timeout: 10000 });
        await page.waitForTimeout(500); // Allow animations to complete
    });

    test('Desktop (1280x720) - NO visual changes baseline', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(500);
        
        await percySnapshot(page, 'Mobile CSS - Desktop Baseline (Unchanged)', {
            widths: [1280]
        });
        
        console.log('✅ Desktop baseline captured - should match pre-optimization');
    });

    test('Tablet (768x1024) - NO visual changes baseline', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        
        await percySnapshot(page, 'Mobile CSS - Tablet Baseline (Unchanged)', {
            widths: [768]
        });
        
        console.log('✅ Tablet baseline captured - should match pre-optimization');
    });

    test('Mobile iPhone SE (375x667) - Optimized layout', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Verify welcome panel has mobile styling
        const welcomePanel = page.locator('.canvas-welcome-panel');
        await expect(welcomePanel).toBeVisible();
        
        const backgroundColor = await welcomePanel.evaluate(el => 
            window.getComputedStyle(el).backgroundColor
        );
        console.log(`Welcome panel background: ${backgroundColor}`);
        
        await percySnapshot(page, 'Mobile CSS - iPhone SE Optimized', {
            widths: [375]
        });
        
        console.log('✅ iPhone SE mobile optimizations captured');
    });

    test('Mobile iPhone Pro Max (414x896) - Optimized layout', async ({ page }) => {
        await page.setViewportSize({ width: 414, height: 896 });
        await page.waitForTimeout(500);
        
        await percySnapshot(page, 'Mobile CSS - iPhone Pro Max Optimized', {
            widths: [414]
        });
        
        console.log('✅ iPhone Pro Max mobile optimizations captured');
    });

    test('Mobile Small Phone (320x568) - Content fits', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 });
        await page.waitForTimeout(500);
        
        // Verify no horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => 
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
        
        await percySnapshot(page, 'Mobile CSS - Small Phone (320px)', {
            widths: [320]
        });
        
        console.log('✅ Small phone view - no horizontal overflow');
    });

    test('Question Modal - Mobile styling', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Open question modal
        const toggleButton = page.locator('.canvas-sidebar-toggle');
        await toggleButton.click();
        await page.waitForTimeout(300);
        
        // Verify modal visible
        const modal = page.locator('.canvas-modal-overlay');
        await expect(modal).toBeVisible();
        
        // Verify no inline styles
        const modalContent = page.locator('.canvas-modal-question');
        await expect(modalContent).toBeVisible();
        
        await percySnapshot(page, 'Mobile CSS - Question Modal Mobile', {
            widths: [375]
        });
        
        console.log('✅ Question modal mobile styling captured');
    });
});
```

### Manual Testing Checklist

**Mobile Testing (375px, 414px, 320px)**:
- [ ] Welcome panel has light purple background (#F8F4FF)
- [ ] Welcome panel has golden border (2px solid #D4AF37)
- [ ] Welcome panel has subtle shadow
- [ ] Font sizes reduced (measure with dev tools)
- [ ] Padding reduced (measure spacing)
- [ ] Content uses full width (no excessive margins)
- [ ] Header logo is 120x120px
- [ ] Session title is 1.25rem
- [ ] No horizontal scrollbar
- [ ] Modal opens and closes correctly
- [ ] Submit button works in modal

**Desktop Testing (1280px)**:
- [ ] Welcome panel looks EXACTLY the same as before
- [ ] Font sizes unchanged from original
- [ ] Padding/margins unchanged from original
- [ ] Layout identical to pre-optimization
- [ ] No regression in functionality

**CSS Validation**:
- [ ] No inline `style=""` attributes in modal markup
- [ ] All styles in local `<style>` block
- [ ] No external CSS files created
- [ ] Mobile styles inside `@media (max-width: 768px)` only

### Acceptance Criteria

**Must Pass**:
1. ✅ Desktop Percy snapshot shows ZERO visual differences
2. ✅ Tablet Percy snapshot shows ZERO visual differences
3. ✅ Mobile Percy snapshots show intended optimizations
4. ✅ No inline styles remain in component markup
5. ✅ All functionality works on mobile and desktop
6. ✅ No horizontal scroll on any mobile viewport (320px-767px)
7. ✅ Build completes without errors or warnings

**Should Pass**:
1. ✅ Mobile font sizes 15-30% smaller than desktop
2. ✅ Mobile padding 25-50% reduced from desktop
3. ✅ Welcome panel visually elevated on mobile
4. ✅ ~20% more usable width on 375px iPhone

---

## Risk Assessment & Mitigation

### Risk 1: Desktop/Tablet Regression
**Severity**: HIGH  
**Probability**: MEDIUM  
**Mitigation**:
- All mobile changes inside `@media (max-width: 768px)` block
- Percy baseline snapshots for 1280px and 768px
- Manual verification on desktop before commit
- Git branch allows easy rollback if needed

### Risk 2: Font Size Too Small
**Severity**: MEDIUM  
**Probability**: LOW  
**Mitigation**:
- Font size reductions conservative (0.9rem minimum for body text)
- Test on physical devices if available
- User feedback collection post-deployment
- Easy to adjust via CSS if needed

### Risk 3: Layout Breaking on Small Phones
**Severity**: MEDIUM  
**Probability**: LOW  
**Mitigation**:
- Test at 320px viewport (smallest common phone)
- Verify no horizontal overflow
- Use flexible units (rem, %) instead of fixed pixels where possible

### Risk 4: Inline Style Removal Causes Issues
**Severity**: LOW  
**Probability**: LOW  
**Mitigation**:
- New CSS classes use identical values to inline styles
- Test modal functionality after changes
- Visual regression tests catch any differences

---

## Rollback Plan

### If Issues Arise During Implementation:

**Immediate Rollback** (within same session):
```powershell
# Discard uncommitted changes
git checkout -- SPA/NoorCanvas/Pages/TranscriptCanvas.razor
```

**Post-Commit Rollback** (if issues found after commit):
```powershell
# Revert specific commit
git log --oneline -5  # Find commit hash
git revert <commit-hash>
git push origin development
```

**Selective Rollback** (if only part of change problematic):
- Use git to extract previous version of mobile media query
- Keep inline style cleanup, revert mobile optimizations
- Or vice versa (both phases are independent)

---

## Success Metrics

### Quantitative Metrics:
1. **Space Efficiency**: 20%+ increase in usable width on 375px iPhone
2. **Font Reduction**: 15-30% smaller fonts on mobile
3. **Padding Reduction**: 25-50% less padding on mobile
4. **Code Quality**: 0 inline styles in component markup
5. **Visual Regression**: 0 unintended changes on desktop/tablet

### Qualitative Metrics:
1. **Readability**: Improved text legibility on phones (subjective)
2. **Visual Hierarchy**: Clear separation between welcome and transcript (subjective)
3. **Professional Appearance**: Enhanced mobile UI polish (subjective)
4. **Maintainability**: Cleaner code structure (developer experience)

---

## Implementation Timeline

### Estimated Duration: 2-3 hours

**Phase 1** - CSS Cleanup (30 min):
- Move inline styles to CSS classes
- Update HTML markup
- Test modal functionality

**Phase 2** - Mobile Layout (30 min):
- Add welcome panel styling to mobile media query
- Verify visual distinction

**Phase 3** - Mobile Typography (30 min):
- Add font size overrides to mobile media query
- Verify readability

**Phase 4** - Mobile Spacing (30 min):
- Add padding/margin reductions to mobile media query
- Verify space optimization

**Testing & Validation** (30-60 min):
- Run Percy visual regression tests
- Manual testing on mobile viewports
- Desktop/tablet regression verification
- Git commit and push

---

## Post-Implementation

### Documentation Updates:
- [ ] Update `work-log.md` with implementation details
- [ ] Add Percy test results to documentation
- [ ] Document any deviations from plan

### Code Review Checklist:
- [ ] All inline styles removed
- [ ] Mobile styles inside media query only
- [ ] Desktop/tablet unchanged (Percy verification)
- [ ] No build errors or warnings
- [ ] Comments added for mobile-specific rules

### Deployment Notes:
- Changes are CSS-only, no backend impact
- Safe to deploy to production after testing
- No database migrations required
- No configuration changes required

---

## Appendix

### A. CSS Class Inventory

**New Classes Added**:
- `.canvas-modal-question` - Max-width constraint for question modal
- `.canvas-modal-button-flex` - Flex layout for modal buttons

**Modified Classes** (mobile media query only):
- `.session-canvas-root` - Reduced padding
- `.session-canvas-container` - Reduced padding
- `.canvas-welcome-panel` - Enhanced styling, full width
- `.canvas-welcome-content` - Reduced padding
- `.canvas-header-content` - Reduced padding
- `.canvas-header-logo-img` - Smaller logo
- `.canvas-session-title` - Smaller font
- `.canvas-session-description` - Smaller font
- `.canvas-welcome-text` - Smaller font
- `.canvas-empty-message` - Smaller font
- `.canvas-modal-title` - Smaller font
- `.canvas-modal-message` - Smaller font

### B. Viewport Breakpoints

| Breakpoint | Range | Target Devices | Optimization Applied |
|------------|-------|----------------|---------------------|
| Desktop | >768px | Laptops, desktops | None (unchanged) |
| Tablet | 768px-1024px | iPads, tablets | None (unchanged) |
| Mobile | <768px | Phones | All optimizations |
| Small Mobile | 320px-375px | iPhone SE, small phones | Extra spacing care |
| Large Mobile | 375px-414px | iPhone 12/13/14 | Standard mobile |
| X-Large Mobile | 414px-767px | iPhone Pro Max, large phones | Standard mobile |

### C. Color Palette (Mobile Enhancement)

| Element | Color | Purpose |
|---------|-------|---------|
| Welcome Panel BG | #F8F4FF | Light purple (matches canvas-content-area) |
| Welcome Panel Border | #D4AF37 | Golden (existing brand color) |
| Panel Shadow | rgba(0,0,0,0.1) | Subtle elevation |

### D. Related Files

**Modified**:
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` (CSS + HTML)

**Testing**:
- `Tests/UI/mobile-css-optimization.spec.ts` (new file)

**Documentation**:
- `.github/prompts.keys/mobile-css/mobile-css.plan.md` (this file)
- `.github/prompts.keys/mobile-css/work-log.md` (implementation tracking)
- `.github/prompts.keys/mobile-css/mobile-css.plan.json` (metadata)

---

**Plan Status**: ✅ Complete - Ready for Implementation  
**Next Step**: Invoke `task.prompt.md` to begin Phase 1 execution
