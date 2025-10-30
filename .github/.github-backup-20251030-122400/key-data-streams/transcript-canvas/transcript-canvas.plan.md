# transcript-canvas.plan.md

---
**Key**: transcript-canvas  
**Branch**: development  
**Created**: 2025-10-21  
**Status**: Ready for Implementation  
**Plan Version**: v1.0 (Final)
---

## Executive Summary

**Objective**: Update TranscriptCanvas.razor desktop and iPad views to ensure top panel (header with logo) and bottom panel (main content grid) have identical widths, and add 20px bottom margin to the logo container div.

**Scope**: CSS-only changes to TranscriptCanvas.razor component

**Impact**: UI Layer only - visual alignment improvements

**Estimated Effort**: 1-2 hours (including visual testing)

---

## Technology Context

### Framework & Libraries
- **Framework**: ASP.NET Core 8.0 (Blazor Server)
- **CSS Strategy**: Inline styles in .razor `<style>` block
- **Testing**: Playwright (E2E) + Percy (Visual Regression)
- **Build**: dotnet CLI

### Current Architecture
- **Component**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`
- **Styling**: All CSS contained within component `<style>` block (no external CSS files)
- **Layout Structure**:
  ```
  .session-canvas-root (min-height: 100vh, padding: 1.5rem)
    └── .session-canvas-container (max-width: 85rem, width: 95%)
          ├── .canvas-content-wrapper (max-width: 80rem)
          │     └── .canvas-header
          │           └── .canvas-header-logo (contains logo image)
          └── .canvas-main-grid (content grid below header)
  ```

### Cross-Key Intelligence
- **Previous Work**: Key `mobile-css` modified TranscriptCanvas.razor for responsive styling
- **Pattern**: All styling changes must remain in TranscriptCanvas.razor `<style>` block (no external CSS files)
- **Consistency**: Follows established pattern of component-scoped styling

---

## Current State Analysis

### Width Constraints (Desktop/iPad)

**Container Hierarchy**:
1. `.session-canvas-container`: `max-width: 85rem` (1360px), `width: 95%`
2. `.canvas-content-wrapper`: `max-width: 80rem` (1280px), `width: 100%`
3. `.canvas-header`: No explicit max-width, inherits from `.canvas-content-wrapper`
4. `.canvas-main-grid`: No explicit max-width, inherits from parent

**Identified Issue**: 
- Both `.canvas-header` and `.canvas-main-grid` should use same width constraint
- Currently both inherit from `.canvas-content-wrapper` (80rem max-width)
- **Hypothesis**: Visual misalignment may be due to different padding/margin values or viewport-specific overrides

### Logo Container (Current State)

```css
.canvas-header-logo {
    flex-shrink: 0;
    margin: 0 auto;
    display: block;
}
```

**Missing**: No `margin-bottom` - needs 20px added

### Responsive Breakpoints

- **Desktop**: > 1024px (default styles)
- **iPad/Tablet**: 768px - 1024px (landscape considerations)
- **Mobile**: ≤ 768px (single column layout)

---

## Implementation Plan

### Phase 1: CSS Width Alignment

**Objective**: Ensure `.canvas-header` and `.canvas-main-grid` have identical width constraints for desktop and iPad views

**Files Modified**:
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Changes**:

1. **Verify Current Width Inheritance** (Lines ~170-310):
   - Both `.canvas-header` and `.canvas-main-grid` are children of `.canvas-content-wrapper`
   - Both should already inherit `max-width: 80rem` constraint
   - **Investigation needed**: Check for conflicting width rules in responsive breakpoints

2. **Add Explicit Width Constraints** (if needed):
   ```css
   .canvas-header {
       background-color: white;
       border-radius: 1rem;
       padding: 10px;
       margin-bottom: 0.75rem;
       box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
       border: 2px solid #D4AF37;
       position: relative;
       /* ADD: Explicit width constraint for alignment */
       max-width: 100%;
       width: 100%;
       box-sizing: border-box;
   }

   .canvas-main-grid {
       display: grid;
       grid-template-columns: 1fr 0;
       gap: 1.5rem;
       height: auto;
       align-items: stretch;
       max-width: 100%;
       overflow: hidden;
       min-width: 0;
       /* ADD: Ensure consistent width with header */
       width: 100%;
       box-sizing: border-box;
   }
   ```

3. **Responsive Breakpoint Verification**:
   - Check `@media (max-width: 768px)` rules (Lines ~826-997)
   - Check `@media (max-width: 1024px) and (orientation: landscape)` rules (Lines ~999-1007)
   - Ensure no conflicting width overrides

**Validation**:
- Desktop (1280px viewport): Header and content grid visually aligned
- iPad Portrait (768px viewport): Header and content grid visually aligned
- iPad Landscape (1024px viewport): Header and content grid visually aligned

**Test Scenarios**:
1. Load TranscriptCanvas in desktop viewport (1280px) - measure header width vs content width
2. Load TranscriptCanvas in iPad portrait (768px) - verify alignment maintained
3. Load TranscriptCanvas in iPad landscape (1024px) - verify alignment maintained

---

### Phase 2: Logo Margin Addition

**Objective**: Add 20px bottom margin to `.canvas-header-logo` div containing the logo image

**Files Modified**:
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Changes**:

1. **Update `.canvas-header-logo` CSS** (Lines ~189-193):
   ```css
   /* BEFORE */
   .canvas-header-logo {
       flex-shrink: 0;
       margin: 0 auto;
       display: block;
   }

   /* AFTER */
   .canvas-header-logo {
       flex-shrink: 0;
       margin: 0 auto 20px auto; /* Added 20px bottom margin */
       display: block;
   }
   ```

2. **Responsive Verification**:
   - Check mobile styles (Lines ~879-882) for `.canvas-header-logo-img`
   - Ensure 20px margin doesn't create excessive spacing on mobile
   - Mobile already reduces logo size (120px x 120px), margin should scale proportionally

**Validation**:
- Desktop: 20px spacing visible between logo and session title
- iPad: 20px spacing maintained
- Mobile: Spacing appropriate for condensed layout (consider reducing to 10px if excessive)

**Test Scenarios**:
1. Measure pixel distance between logo bottom edge and session title top edge (should be 20px)
2. Verify spacing doesn't cause layout shift or overflow
3. Check mobile view for appropriate spacing (may need adjustment)

---

## Enhancement Plan

### Enhancement A: Percy Visual Regression Tests

**Purpose**: Capture baseline visual snapshots to detect unintended layout changes

**Implementation**:

1. **Create Test File**: `Tests/UI/transcript-canvas-width-alignment.spec.ts`

2. **Test Scenarios**:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { percySnapshot } from '@percy/playwright';

   const BASE_URL = process.env.BASE_URL || 'https://localhost:9091';
   const VALID_TOKEN = 'test-session-token-123'; // Replace with valid test token

   test.describe('TranscriptCanvas Width Alignment', () => {
     
     test('Desktop view - header and content grid aligned', async ({ page }) => {
       await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
       await page.waitForSelector('.canvas-header', { state: 'visible', timeout: 15000 });
       
       // Capture desktop baseline
       await percySnapshot(page, 'transcript-canvas-desktop-alignment', {
         widths: [1280],
         minHeight: 1024,
         percyCSS: '.canvas-signalr-indicator { visibility: hidden; }' // Hide dynamic status
       });
     });

     test('iPad Portrait - header and content grid aligned', async ({ page }) => {
       await page.setViewportSize({ width: 768, height: 1024 });
       await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
       await page.waitForSelector('.canvas-header', { state: 'visible', timeout: 15000 });
       
       // Capture iPad portrait baseline
       await percySnapshot(page, 'transcript-canvas-ipad-portrait-alignment', {
         widths: [768],
         minHeight: 1024
       });
     });

     test('iPad Landscape - header and content grid aligned', async ({ page }) => {
       await page.setViewportSize({ width: 1024, height: 768 });
       await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
       await page.waitForSelector('.canvas-header', { state: 'visible', timeout: 15000 });
       
       // Capture iPad landscape baseline
       await percySnapshot(page, 'transcript-canvas-ipad-landscape-alignment', {
         widths: [1024],
         minHeight: 768
       });
     });

     test('Logo margin spacing verification', async ({ page }) => {
       await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
       await page.waitForSelector('.canvas-header-logo', { state: 'visible', timeout: 15000 });
       
       // Measure spacing
       const logoMargin = await page.evaluate(() => {
         const logo = document.querySelector('.canvas-header-logo');
         if (!logo) return null;
         const styles = window.getComputedStyle(logo);
         return styles.marginBottom;
       });
       
       expect(logoMargin).toBe('20px');
     });

   });
   ```

3. **Orchestration Script**: `Scripts/run-transcript-canvas-alignment-tests.ps1`
   ```powershell
   #!/usr/bin/env pwsh
   # run-transcript-canvas-alignment-tests.ps1
   # Orchestrate TranscriptCanvas width alignment visual tests

   [CmdletBinding()]
   param(
       [switch]$KeepAppRunning
   )

   $ErrorActionPreference = "Stop"

   Write-Host "=== TranscriptCanvas Width Alignment Tests ===" -ForegroundColor Cyan
   Write-Host "Starting NoorCanvas application..." -ForegroundColor Yellow

   # Start app in background
   $appJob = Start-Job -ScriptBlock {
       Set-Location "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
       dotnet run
   }

   Write-Host "Waiting for application startup (20 seconds)..." -ForegroundColor Yellow
   Start-Sleep -Seconds 20

   try {
       Write-Host "Running Percy visual regression tests..." -ForegroundColor Green
       
       Set-Location "D:\PROJECTS\NOOR CANVAS"
       $env:PERCY_TOKEN = $env:PERCY_TOKEN_TRANSCRIPT_CANVAS
       
       npx percy exec -- npx playwright test Tests/UI/transcript-canvas-width-alignment.spec.ts --headed
       
       if ($LASTEXITCODE -eq 0) {
           Write-Host "✅ Tests passed!" -ForegroundColor Green
       } else {
           Write-Host "❌ Tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
       }
   }
   finally {
       if (-not $KeepAppRunning) {
           Write-Host "Stopping application..." -ForegroundColor Yellow
           Stop-Job -Job $appJob
           Remove-Job -Job $appJob
       } else {
           Write-Host "Application still running (Job ID: $($appJob.Id))" -ForegroundColor Cyan
           Write-Host "Run 'Stop-Job -Id $($appJob.Id); Remove-Job -Id $($appJob.Id)' to stop" -ForegroundColor Cyan
       }
   }

   Write-Host "=== Test Run Complete ===" -ForegroundColor Cyan
   ```

**Validation**:
- Percy dashboard shows 3 baseline snapshots (desktop, iPad portrait, iPad landscape)
- No visual regressions detected in width alignment
- Logo margin spacing correctly applied

---

### Enhancement B: Responsive Breakpoint Verification

**Purpose**: Ensure CSS changes don't break mobile layout (≤ 768px)

**Implementation**:

1. **Add Mobile Viewport Test**:
   ```typescript
   test('Mobile view - no layout breakage', async ({ page }) => {
     await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
     await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
     await page.waitForSelector('.canvas-header', { state: 'visible', timeout: 15000 });
     
     // Verify mobile-specific styles applied
     const gridColumns = await page.evaluate(() => {
       const grid = document.querySelector('.canvas-main-grid');
       if (!grid) return null;
       return window.getComputedStyle(grid).gridTemplateColumns;
     });
     
     // Mobile should use single column layout
     expect(gridColumns).toContain('1fr');
     
     // Percy snapshot
     await percySnapshot(page, 'transcript-canvas-mobile-no-breakage', {
       widths: [375],
       minHeight: 667
     });
   });
   ```

**Validation**:
- Mobile layout remains single-column
- No horizontal scrolling introduced
- Logo margin doesn't cause excessive spacing on mobile

---

### Enhancement C: CSS Audit Comments

**Purpose**: Document width constraints for future maintenance

**Implementation**:

Add diagnostic comments to CSS:

```css
/* [DIAGNOSTIC:transcript-canvas:width-alignment] Phase 1: Ensure header and content use same width constraint ;CLEANUP_OK */
.canvas-header {
    /* ... existing styles ... */
    max-width: 100%; /* Matches .canvas-main-grid width */
    width: 100%;
    box-sizing: border-box;
}

/* [DIAGNOSTIC:transcript-canvas:width-alignment] Phase 1: Ensure content grid matches header width ;CLEANUP_OK */
.canvas-main-grid {
    /* ... existing styles ... */
    width: 100%; /* Matches .canvas-header width */
    box-sizing: border-box;
}

/* [DIAGNOSTIC:transcript-canvas:logo-margin] Phase 2: Added 20px bottom margin per user request ;CLEANUP_OK */
.canvas-header-logo {
    flex-shrink: 0;
    margin: 0 auto 20px auto; /* 20px bottom spacing */
    display: block;
}
```

**Validation**:
- Comments follow established DIAGNOSTIC pattern
- Future developers understand intent of width constraints

---

## Testing Strategy

### Functional Testing (Playwright)

**Test Type**: Functional E2E  
**Mode**: headed (visual verification required)  
**File**: `Tests/UI/transcript-canvas-width-alignment.spec.ts`

**Scenarios**:
1. ✅ Desktop (1280px): Header and content grid widths match
2. ✅ iPad Portrait (768px): Layout maintains alignment
3. ✅ iPad Landscape (1024px): Layout maintains alignment
4. ✅ Mobile (375px): No layout breakage
5. ✅ Logo margin: 20px spacing applied

**Selectors**:
- `.canvas-header` (header container)
- `.canvas-main-grid` (content grid)
- `.canvas-header-logo` (logo container)
- `.canvas-header-logo-img` (logo image)

**Wait Strategy**:
- `waitForSelector` with `state: 'visible'`, `timeout: 15000ms`

### Visual Regression Testing (Percy)

**Test Type**: Percy Visual  
**Mode**: headed  
**Baselines**: 4 snapshots

1. **Desktop Alignment** (`transcript-canvas-desktop-alignment`)
   - Width: 1280px
   - Validates: Header and content grid visual alignment

2. **iPad Portrait Alignment** (`transcript-canvas-ipad-portrait-alignment`)
   - Width: 768px
   - Validates: Responsive alignment maintained

3. **iPad Landscape Alignment** (`transcript-canvas-ipad-landscape-alignment`)
   - Width: 1024px
   - Validates: Landscape orientation alignment

4. **Mobile No Breakage** (`transcript-canvas-mobile-no-breakage`)
   - Width: 375px
   - Validates: Mobile layout unaffected

**Percy Configuration**:
- Hide dynamic elements: `.canvas-signalr-indicator { visibility: hidden; }`
- Min height: 1024px (desktop/iPad), 667px (mobile)
- Compare against baseline after CSS changes

---

## Deployment Plan

### Pre-Deployment Checklist

- [ ] Phase 1 complete: Width alignment CSS applied
- [ ] Phase 2 complete: Logo margin added
- [ ] Functional tests pass (all viewports)
- [ ] Percy baselines created and approved
- [ ] Mobile layout verified (no breakage)
- [ ] Code review completed
- [ ] Diagnostic comments added

### Deployment Steps

1. **Development Branch**:
   ```bash
   git checkout development
   git add SPA/NoorCanvas/Pages/TranscriptCanvas.razor
   git add Tests/UI/transcript-canvas-width-alignment.spec.ts
   git add Scripts/run-transcript-canvas-alignment-tests.ps1
   git commit -m "[transcript-canvas] Phase 1+2: Width alignment and logo margin"
   git push origin development
   ```

2. **Testing**:
   ```powershell
   # Run functional tests
   npx playwright test Tests/UI/transcript-canvas-width-alignment.spec.ts --headed

   # Run Percy visual tests
   .\Scripts\run-transcript-canvas-alignment-tests.ps1
   ```

3. **Production Deployment**:
   ```bash
   # After testing in development
   git checkout master
   git merge development
   git push origin master
   
   # Deploy to production
   .\ncdeploy.ps1
   ```

### Rollback Plan

**If alignment issues detected**:

1. **Revert CSS Changes**:
   ```bash
   git revert <commit-hash>
   git push origin development
   ```

2. **Restore Previous Width Constraints**:
   - Remove explicit `width: 100%` from `.canvas-header` and `.canvas-main-grid`
   - Remove `box-sizing: border-box` if causing issues

3. **Restore Logo Margin**:
   ```css
   .canvas-header-logo {
       margin: 0 auto; /* Remove 20px bottom */
   }
   ```

---

## Risk Assessment

### Low Risk
- ✅ CSS-only changes (no logic modifications)
- ✅ Component-scoped styling (no global impact)
- ✅ Reversible changes (simple git revert)

### Medium Risk
- ⚠️ **Responsive breakpoints**: Changes may affect mobile layout
  - **Mitigation**: Enhancement B (mobile verification tests)

### Monitoring
- Percy visual diffs (automated regression detection)
- User feedback (visual alignment issues)
- Browser console (no CSS errors)

---

## Success Criteria

### Phase 1 Success
- ✅ Desktop (1280px): Header and content grid have identical widths (measured in DevTools)
- ✅ iPad Portrait (768px): Alignment maintained across viewport
- ✅ iPad Landscape (1024px): Alignment maintained across viewport
- ✅ No horizontal scrollbars introduced

### Phase 2 Success
- ✅ Logo container has 20px margin-bottom (measured in DevTools)
- ✅ Spacing visually appropriate on all viewports
- ✅ No layout shift or overflow issues

### Overall Success
- ✅ All Playwright tests pass
- ✅ Percy baselines approved (no unintended regressions)
- ✅ Mobile layout unaffected
- ✅ User confirms visual alignment improvement

---

## Open Questions & Decisions

### Question 1: Mobile Width Alignment
**Q**: Should the width alignment apply to mobile views as well, or only desktop/iPad?  
**A**: **USER INPUT NEEDED** - Plan assumes desktop/iPad focus, mobile verification for breakage only

### Question 2: Additional Alignment Targets
**Q**: Are there other sections that need similar width alignment?  
**A**: **USER INPUT NEEDED** - Plan focuses on header and main grid per request

### Question 3: Logo Margin Responsive Scaling
**Q**: Should the 20px margin scale down on mobile (e.g., 10px)?  
**A**: **DECISION DEFERRED** - Will evaluate during Phase 2 testing, adjust if spacing excessive

---

## File Modifications Summary

### Modified Files

1. **SPA/NoorCanvas/Pages/TranscriptCanvas.razor**
   - Section: `<style>` block
   - Lines: ~172-310 (CSS rules for `.canvas-header`, `.canvas-main-grid`, `.canvas-header-logo`)
   - Changes:
     - Add explicit width constraints to `.canvas-header` and `.canvas-main-grid`
     - Update `.canvas-header-logo` margin to include 20px bottom spacing
     - Add diagnostic comments

### New Files

2. **Tests/UI/transcript-canvas-width-alignment.spec.ts**
   - Purpose: Playwright + Percy visual regression tests
   - Test scenarios: Desktop, iPad portrait/landscape, mobile, logo margin

3. **Scripts/run-transcript-canvas-alignment-tests.ps1**
   - Purpose: Orchestration script for Percy visual tests
   - Functionality: Start app, run tests, stop app (with keep-alive option)

---

## Handoff Information

### For Task Execution Agent

**Key**: `transcript-canvas`  
**Branch**: `development`  
**Phases**: 2 (CSS Width Alignment, Logo Margin Addition)  
**Files**: 1 modified (TranscriptCanvas.razor), 2 new (test + script)  
**Testing**: Playwright (functional) + Percy (visual)

### For Test Generation Agent

**Feature**: TranscriptCanvas width alignment and logo margin  
**Scenarios**: Desktop/iPad alignment, mobile verification, logo spacing  
**Endpoints**: `/transcript/canvas/{sessionToken}`  
**Tokens**: Valid test session token required  
**Percy**: Yes (4 baseline snapshots)  
**Mode**: headed (visual verification)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2025-10-21 | GitHub Copilot | Initial plan - width alignment + logo margin |

---

**Plan Status**: ✅ Ready for Implementation  
**Next Step**: Execute task handoff command to begin Phase 1
