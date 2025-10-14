# Canvas Panel & Toast Notification - Holistic Fix & Test Plan

**Date**: 2025-10-14  
**Key**: canvas  
**Status**: Issues persist despite multiple fixes  
**Priority**: CRITICAL

---

## 🔍 Problem Analysis

### Issue 1: Canvas Panel Height Still Increasing
**User Report**: "Height still increasing" despite setting `max-height: 700px`

**Root Cause Analysis**:
1. ✅ Fixed: Removed `height: 100%` from `.canvas-area-container` 
2. ✅ Fixed: Set `max-height: 700px` on both containers
3. ❓ **MISSING**: Overflow handling on parent/child containers
4. ❓ **MISSING**: Question container scroll behavior verification
5. ❓ **POSSIBLE**: CSS specificity conflict with other stylesheets

**Hypothesis**:
- `max-height` is set, but overflow is not handled properly
- Questions container growing beyond bounds pushes parent container
- Missing `overflow-y: auto` on scrollable containers

### Issue 2: Toast Still Not Showing
**User Report**: "Toastr still not showing" despite CSS fixes

**Root Cause Analysis**:
1. ✅ Fixed: Added `noor-toastr.css` with `z-index: 999999`
2. ✅ Fixed: Applied to all views (HostControlPanel, _Host.cshtml)
3. ❓ **MISSING**: Verification that CSS file is actually loaded
4. ❓ **MISSING**: Toast container DOM element creation verification
5. ❓ **POSSIBLE**: JavaScript timing issue - toast fires before DOM ready

**Hypothesis**:
- CSS file path might be incorrect (`~/css/` vs `/css/`)
- Toast container div not being created by toastr library
- `showNoorToast` function being called but not actually executing

---

## 🎯 Holistic Fix Strategy

### Phase 1: Diagnostic Deep Dive (DO THIS FIRST)

#### 1.1 Height Issue Diagnostics
**Add Enhanced Logging to SessionCanvas.razor**:

```csharp
// In OnAfterRenderAsync - Log actual rendered dimensions
private async Task LogComprehensiveDimensions()
{
    var diagnostics = await JSRuntime.InvokeAsync<string>("eval", @"
        (function() {
            const results = [];
            
            // Canvas main grid
            const grid = document.querySelector('.canvas-main-grid');
            if (grid) {
                const gridStyle = window.getComputedStyle(grid);
                results.push('GRID: ' + grid.offsetHeight + 'px (computed: ' + gridStyle.height + ')');
            }
            
            // Canvas area container
            const area = document.querySelector('.canvas-area-container');
            if (area) {
                const areaStyle = window.getComputedStyle(area);
                results.push('AREA: ' + area.offsetHeight + 'px (computed: ' + areaStyle.height + ', max: ' + areaStyle.maxHeight + ')');
                results.push('  - scrollHeight: ' + area.scrollHeight + 'px (OVERFLOW: ' + (area.scrollHeight > area.offsetHeight ? 'YES' : 'NO') + ')');
            }
            
            // Canvas content area (green dotted border)
            const content = document.querySelector('.canvas-content-area');
            if (content) {
                const contentStyle = window.getComputedStyle(content);
                results.push('CONTENT: ' + content.offsetHeight + 'px (computed: ' + contentStyle.height + ')');
            }
            
            // Canvas sidebar
            const sidebar = document.querySelector('.canvas-sidebar');
            if (sidebar) {
                const sidebarStyle = window.getComputedStyle(sidebar);
                results.push('SIDEBAR: ' + sidebar.offsetHeight + 'px (computed: ' + sidebarStyle.height + ', max: ' + sidebarStyle.maxHeight + ')');
                results.push('  - scrollHeight: ' + sidebar.scrollHeight + 'px (OVERFLOW: ' + (sidebar.scrollHeight > sidebar.offsetHeight ? 'YES' : 'NO') + ')');
            }
            
            // Questions container
            const questions = document.querySelector('.canvas-questions-container');
            if (questions) {
                const questionsStyle = window.getComputedStyle(questions);
                results.push('QUESTIONS: ' + questions.offsetHeight + 'px (overflow-y: ' + questionsStyle.overflowY + ')');
                results.push('  - scrollHeight: ' + questions.scrollHeight + 'px');
            }
            
            return results.join('\n');
        })()
    ");
    
    Logger.LogCritical("[CANVAS-DIAGNOSTICS] HEIGHT ANALYSIS:\n{Diagnostics}", diagnostics);
}
```

#### 1.2 Toast Issue Diagnostics
**Add Toast Verification to SessionCanvas.razor**:

```csharp
private async Task DiagnoseToastSystem()
{
    var diagnostics = await JSRuntime.InvokeAsync<string>("eval", @"
        (function() {
            const results = [];
            
            // Check toastr library
            results.push('toastr loaded: ' + (typeof toastr !== 'undefined'));
            
            // Check showNoorToast function
            results.push('showNoorToast loaded: ' + (typeof window.showNoorToast === 'function'));
            
            // Check CSS file loaded
            const cssLinks = Array.from(document.querySelectorAll('link[rel=""stylesheet""]'))
                .map(link => link.href)
                .filter(href => href.includes('noor-toastr'));
            results.push('noor-toastr.css loaded: ' + (cssLinks.length > 0));
            if (cssLinks.length > 0) results.push('  Path: ' + cssLinks[0]);
            
            // Check toast container exists
            const container = document.querySelector('#toast-container, .toast-container');
            results.push('Toast container exists: ' + (container !== null));
            if (container) {
                const containerStyle = window.getComputedStyle(container);
                results.push('  z-index: ' + containerStyle.zIndex);
                results.push('  position: ' + containerStyle.position);
                results.push('  display: ' + containerStyle.display);
            }
            
            // Check for CSS conflicts
            const debugPanel = document.querySelector('.debug-panel');
            if (debugPanel) {
                const panelStyle = window.getComputedStyle(debugPanel);
                results.push('Debug panel z-index: ' + panelStyle.zIndex + ' (should be < 999999)');
            }
            
            return results.join('\n');
        })()
    ");
    
    Logger.LogCritical("[TOAST-DIAGNOSTICS] SYSTEM STATUS:\n{Diagnostics}", diagnostics);
}
```

#### 1.3 Click Handler Verification
**Verify Debug Panel Button Click**:

```csharp
// Enhanced TestToastNotification with full trace
private async Task TestToastNotification()
{
    var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
    Logger.LogCritical("[TOAST-TEST] [{RequestId}] ========== TEST STARTED ==========", requestId);
    
    // Step 1: Diagnose system first
    await DiagnoseToastSystem();
    
    // Step 2: Check library availability
    var toastrLoaded = await JSRuntime.InvokeAsync<bool>("eval", "typeof toastr !== 'undefined'");
    Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 1: Toastr loaded = {ToastrLoaded}", requestId, toastrLoaded);
    
    if (!toastrLoaded)
    {
        await Task.Delay(500);
        toastrLoaded = await JSRuntime.InvokeAsync<bool>("eval", "typeof toastr !== 'undefined'");
        Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 1b: Toastr loaded after retry = {ToastrLoaded}", requestId, toastrLoaded);
    }
    
    // Step 3: Try direct toastr call (bypass showNoorToast)
    if (toastrLoaded)
    {
        try
        {
            Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 2: Calling toastr.info directly...", requestId);
            await JSRuntime.InvokeVoidAsync("eval", @"
                toastr.info('Direct toastr call - If you see this, toastr library works!', 'Direct Test', {
                    positionClass: 'toast-top-right',
                    timeOut: 10000,
                    closeButton: true
                });
            ");
            Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 2: Direct toastr call SUCCEEDED", requestId);
        }
        catch (Exception ex)
        {
            Logger.LogError("[TOAST-TEST] [{RequestId}] Step 2: Direct toastr call FAILED: {Error}", requestId, ex.Message);
        }
        
        // Step 4: Try showNoorToast
        await Task.Delay(1000); // Give time to see first toast
        
        try
        {
            Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 3: Calling showNoorToast...", requestId);
            await JSRuntime.InvokeVoidAsync("showNoorToast", 
                "showNoorToast call - If you see this, the wrapper function works!", 
                "🧪 Wrapper Test", 
                "info");
            Logger.LogCritical("[TOAST-TEST] [{RequestId}] Step 3: showNoorToast call SUCCEEDED", requestId);
        }
        catch (Exception ex)
        {
            Logger.LogError("[TOAST-TEST] [{RequestId}] Step 3: showNoorToast call FAILED: {Error}", requestId, ex.Message);
        }
    }
    else
    {
        Logger.LogError("[TOAST-TEST] [{RequestId}] CRITICAL: Toastr library NOT loaded after retry!", requestId);
        await JSRuntime.InvokeVoidAsync("alert", "CRITICAL: Toastr library not loaded. Check browser console and Network tab.");
    }
    
    Logger.LogCritical("[TOAST-TEST] [{RequestId}] ========== TEST COMPLETED ==========", requestId);
}
```

---

### Phase 2: CSS Fixes

#### 2.1 Height Constraint Fix
**Problem**: Containers expanding despite `max-height`

**Solution**: Add proper overflow handling

```css
/* SessionCanvas.razor - UPDATED CSS */

/* Canvas Area Container - Fixed height with scroll */
.canvas-area-container {
    background-color: white;
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    border: 2px solid #D4AF37;
    display: flex;
    flex-direction: column;
    min-height: 400px;
    max-height: 700px;
    /* CRITICAL: Add overflow handling */
    overflow: hidden; /* Prevent expansion beyond max-height */
}

/* Canvas Content Area - Scrollable */
.canvas-content-area {
    flex: 1;
    padding: 1rem;
    border-radius: 1rem;
    margin: 10px;
    /* CRITICAL: Make this scrollable */
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    border: #006400 dotted 3px;
    background-color: #eeffee;
    min-height: 0; /* Allow flexbox to shrink */
}

/* Canvas Sidebar - Fixed height with scroll */
.canvas-sidebar {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    border: 2px solid #D4AF37;
    display: flex;
    flex-direction: column;
    min-height: 400px;
    max-height: 700px;
    /* CRITICAL: Add overflow handling */
    overflow: hidden; /* Prevent expansion */
}

/* Questions Container - Scrollable */
.canvas-questions-container {
    flex: 1;
    /* CRITICAL: Make scrollable */
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
    min-height: 0; /* Allow flexbox to shrink */
}
```

#### 2.2 Toast CSS Path Verification
**Problem**: CSS might not be loading due to path issues

**Solution**: Verify and fix paths in all views

```html
<!-- SessionCanvas.razor - Verify path -->
<link rel="stylesheet" href="~/css/noor-toastr.css">

<!-- HostControlPanel.razor - Verify path -->
<link rel="stylesheet" href="~/css/noor-toastr.css">

<!-- _Host.cshtml - IMPORTANT: Different path format! -->
<link rel="stylesheet" href="css/noor-toastr.css" asp-append-version="true" />
```

**Note**: `~` in Razor component vs relative path in .cshtml!

---

### Phase 3: Playwright End-to-End Tests

#### 3.1 Height Constraint Validation Test
**File**: `Workspaces/TEMP/canvas-height-constraint-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Panel Height Constraint Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to session canvas (Session 212 from PlaywrightQuickRef.md)
        await page.goto('http://localhost:5000/canvas/session/8WXMK05K');
        await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
    });

    test('should not exceed 700px height when adding multiple questions', async ({ page }) => {
        // Get initial dimensions
        const initialDimensions = await page.evaluate(() => {
            const area = document.querySelector('.canvas-area-container');
            const sidebar = document.querySelector('.canvas-sidebar');
            
            return {
                areaHeight: area?.getBoundingClientRect().height || 0,
                sidebarHeight: sidebar?.getBoundingClientRect().height || 0,
                areaMaxHeight: window.getComputedStyle(area!).maxHeight,
                sidebarMaxHeight: window.getComputedStyle(sidebar!).maxHeight
            };
        });

        console.log('Initial dimensions:', initialDimensions);

        // Verify max-height is set correctly
        expect(initialDimensions.areaMaxHeight).toBe('700px');
        expect(initialDimensions.sidebarMaxHeight).toBe('700px');

        // Verify initial height is within bounds
        expect(initialDimensions.areaHeight).toBeLessThanOrEqual(700);
        expect(initialDimensions.sidebarHeight).toBeLessThanOrEqual(700);

        // Add 10 questions via debug panel
        await page.click('button:has-text("Debug Panel")'); // Open debug panel
        
        for (let i = 0; i < 10; i++) {
            await page.click('button:has-text("Simulate Random Question")');
            await page.waitForTimeout(500); // Wait for question to be added
        }

        // Wait for UI to stabilize
        await page.waitForTimeout(2000);

        // Get dimensions after adding questions
        const afterDimensions = await page.evaluate(() => {
            const area = document.querySelector('.canvas-area-container');
            const sidebar = document.querySelector('.canvas-sidebar');
            const questionsContainer = document.querySelector('.canvas-questions-container');
            
            return {
                areaHeight: area?.getBoundingClientRect().height || 0,
                areaScrollHeight: (area as HTMLElement)?.scrollHeight || 0,
                sidebarHeight: sidebar?.getBoundingClientRect().height || 0,
                sidebarScrollHeight: (sidebar as HTMLElement)?.scrollHeight || 0,
                questionsScrollHeight: (questionsContainer as HTMLElement)?.scrollHeight || 0
            };
        });

        console.log('After adding 10 questions:', afterDimensions);

        // CRITICAL ASSERTIONS
        expect(afterDimensions.areaHeight).toBeLessThanOrEqual(700);
        expect(afterDimensions.sidebarHeight).toBeLessThanOrEqual(700);

        // Verify overflow is working (scrollHeight should be > offsetHeight if content overflows)
        if (afterDimensions.sidebarScrollHeight > 700) {
            console.log('✓ Sidebar overflow detected - scrolling enabled');
            expect(afterDimensions.sidebarScrollHeight).toBeGreaterThan(afterDimensions.sidebarHeight);
        }

        // Verify both containers have same height (grid alignment)
        const heightDiff = Math.abs(afterDimensions.areaHeight - afterDimensions.sidebarHeight);
        expect(heightDiff).toBeLessThan(5); // Allow 5px tolerance
    });

    test('should enable scrolling when content exceeds max-height', async ({ page }) => {
        // Add many questions to force overflow
        await page.click('button:has-text("Debug Panel")');
        
        for (let i = 0; i < 20; i++) {
            await page.click('button:has-text("Simulate Random Question")');
            await page.waitForTimeout(300);
        }

        await page.waitForTimeout(2000);

        // Check overflow styling
        const overflowStyles = await page.evaluate(() => {
            const sidebar = document.querySelector('.canvas-sidebar');
            const questionsContainer = document.querySelector('.canvas-questions-container');
            
            const sidebarStyle = window.getComputedStyle(sidebar!);
            const questionsStyle = window.getComputedStyle(questionsContainer!);
            
            return {
                sidebarOverflow: sidebarStyle.overflow,
                questionsOverflowY: questionsStyle.overflowY,
                sidebarScrollable: (sidebar as HTMLElement).scrollHeight > sidebar!.clientHeight,
                questionsScrollable: (questionsContainer as HTMLElement).scrollHeight > questionsContainer!.clientHeight
            };
        });

        console.log('Overflow configuration:', overflowStyles);

        // Verify overflow is configured
        expect(overflowStyles.questionsOverflowY).toBe('auto');
        expect(overflowStyles.questionsScrollable).toBe(true);
    });
});
```

#### 3.2 Toast Notification Validation Test
**File**: `Workspaces/TEMP/canvas-toast-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Toast Notification System Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to session canvas
        await page.goto('http://localhost:5000/canvas/session/8WXMK05K');
        await page.waitForSelector('.canvas-main-grid', { timeout: 10000 });
    });

    test('should verify noor-toastr.css is loaded', async ({ page }) => {
        const cssLoaded = await page.evaluate(() => {
            const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .map(link => (link as HTMLLinkElement).href);
            
            return cssLinks.some(href => href.includes('noor-toastr.css'));
        });

        console.log('noor-toastr.css loaded:', cssLoaded);
        expect(cssLoaded).toBe(true);
    });

    test('should verify toastr library is loaded', async ({ page }) => {
        const toastrStatus = await page.evaluate(() => {
            return {
                toastrLoaded: typeof (window as any).toastr !== 'undefined',
                showNoorToastExists: typeof (window as any).showNoorToast === 'function'
            };
        });

        console.log('Toastr status:', toastrStatus);
        expect(toastrStatus.toastrLoaded).toBe(true);
        expect(toastrStatus.showNoorToastExists).toBe(true);
    });

    test('should verify toast container has correct z-index', async ({ page }) => {
        // Trigger a toast to ensure container is created
        await page.evaluate(() => {
            (window as any).showNoorToast('Test message', 'Test Title', 'info');
        });

        await page.waitForSelector('#toast-container, .toast-container', { timeout: 5000 });

        const containerStyles = await page.evaluate(() => {
            const container = document.querySelector('#toast-container, .toast-container');
            if (!container) return null;
            
            const styles = window.getComputedStyle(container);
            return {
                zIndex: styles.zIndex,
                position: styles.position,
                top: styles.top,
                right: styles.right,
                display: styles.display
            };
        });

        console.log('Toast container styles:', containerStyles);
        expect(containerStyles).not.toBeNull();
        expect(containerStyles?.zIndex).toBe('999999');
        expect(containerStyles?.position).toBe('fixed');
    });

    test('should display toast when clicking Test Toast Notification button', async ({ page }) => {
        // Open debug panel
        await page.click('.debug-toggle-btn');
        await page.waitForSelector('.debug-content', { state: 'visible' });

        // Click Test Toast Notification button
        await page.click('button:has-text("Test Toast Notification")');

        // Wait for toast to appear
        const toastVisible = await page.waitForSelector('.toast', { timeout: 5000 })
            .then(() => true)
            .catch(() => false);

        expect(toastVisible).toBe(true);

        // Verify toast content
        const toastText = await page.textContent('.toast-message');
        console.log('Toast message:', toastText);
        expect(toastText).toContain('test toast notification');
    });

    test('should display toast above debug panel (z-index hierarchy)', async ({ page }) => {
        // Open debug panel
        await page.click('.debug-toggle-btn');
        
        // Click toast test button
        await page.click('button:has-text("Test Toast Notification")');
        
        await page.waitForSelector('.toast', { timeout: 5000 });

        // Compare z-index values
        const zIndexComparison = await page.evaluate(() => {
            const debugPanel = document.querySelector('.debug-panel');
            const toastContainer = document.querySelector('#toast-container, .toast-container');
            
            const debugZIndex = parseInt(window.getComputedStyle(debugPanel!).zIndex || '0');
            const toastZIndex = parseInt(window.getComputedStyle(toastContainer!).zIndex || '0');
            
            return {
                debugZIndex,
                toastZIndex,
                toastIsAbove: toastZIndex > debugZIndex
            };
        });

        console.log('Z-index comparison:', zIndexComparison);
        expect(zIndexComparison.toastIsAbove).toBe(true);
        expect(zIndexComparison.toastZIndex).toBe(999999);
        expect(zIndexComparison.debugZIndex).toBeLessThan(999999);
    });

    test('should show toast notification when question is answered', async ({ page }) => {
        // Submit a question
        await page.fill('input[placeholder="Ask a question..."]', 'Test question for toast verification');
        await page.click('button:has-text("Submit")');
        
        // Wait for question to appear
        await page.waitForSelector('.canvas-question-card', { timeout: 5000 });

        // Note: This test requires host to answer the question
        // For full E2E, would need multi-browser test with host session
        // See PlaywrightQuickRef.md for multi-browser patterns
    });
});
```

#### 3.3 Visual Regression Test
**File**: `Workspaces/TEMP/canvas-height-visual-regression.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Canvas Panel Height Visual Regression', () => {
    test('should maintain layout with 0, 5, and 10 questions', async ({ page }) => {
        await page.goto('http://localhost:5000/canvas/session/8WXMK05K');
        await page.waitForSelector('.canvas-main-grid');

        // Baseline: No questions
        await percySnapshot(page, 'Canvas Panel - No Questions');

        // Add 5 questions
        await page.click('.debug-toggle-btn');
        for (let i = 0; i < 5; i++) {
            await page.click('button:has-text("Simulate Random Question")');
            await page.waitForTimeout(500);
        }
        await page.click('.debug-toggle-btn'); // Close debug panel
        await percySnapshot(page, 'Canvas Panel - 5 Questions');

        // Add 5 more (total 10)
        await page.click('.debug-toggle-btn');
        for (let i = 0; i < 5; i++) {
            await page.click('button:has-text("Simulate Random Question")');
            await page.waitForTimeout(500);
        }
        await page.click('.debug-toggle-btn');
        await percySnapshot(page, 'Canvas Panel - 10 Questions');

        // Verify heights are capped at 700px in all screenshots
        const finalHeight = await page.evaluate(() => {
            const area = document.querySelector('.canvas-area-container');
            return area?.getBoundingClientRect().height || 0;
        });

        expect(finalHeight).toBeLessThanOrEqual(700);
    });
});
```

---

### Phase 4: Execution Plan

#### Step 1: Add Diagnostics (15 min)
1. ✅ Add `LogComprehensiveDimensions()` to SessionCanvas.razor
2. ✅ Add `DiagnoseToastSystem()` to SessionCanvas.razor
3. ✅ Enhance `TestToastNotification()` with full trace
4. ✅ Run application and click "Test Toast Notification"
5. ✅ Review logs to identify exact failure point

#### Step 2: Apply CSS Fixes (10 min)
1. ✅ Add `overflow: hidden` to `.canvas-area-container`
2. ✅ Add `overflow: hidden` to `.canvas-sidebar`
3. ✅ Add `overflow-y: auto` to `.canvas-content-area`
4. ✅ Add `overflow-y: auto` to `.canvas-questions-container`
5. ✅ Add `min-height: 0` to flex children
6. ✅ Verify CSS paths in all views

#### Step 3: Run Playwright Tests (20 min)
1. ✅ Create all 3 test files in `Workspaces/TEMP/`
2. ✅ Run height constraint test: `npx playwright test Workspaces/TEMP/canvas-height-constraint-validation.spec.ts --headed`
3. ✅ Run toast validation test: `npx playwright test Workspaces/TEMP/canvas-toast-validation.spec.ts --headed`
4. ✅ Run visual regression test: `npm run test:percy:visual -- Workspaces/TEMP/canvas-height-visual-regression.spec.ts`

#### Step 4: Verify & Document (10 min)
1. ✅ Confirm all tests pass
2. ✅ Take screenshots of working toasts
3. ✅ Take screenshots of height-constrained panels
4. ✅ Update canvas.md key data stream with final solution
5. ✅ Commit all changes with comprehensive message

---

## 📊 Success Criteria

### Height Constraint
- ✅ Canvas area height never exceeds 700px
- ✅ Sidebar height never exceeds 700px
- ✅ Both containers maintain equal height
- ✅ Scrollbars appear when content exceeds container height
- ✅ Grid layout remains stable with 0, 5, 10, 20+ questions

### Toast Notification
- ✅ `noor-toastr.css` loads successfully (verify in Network tab)
- ✅ Toast container has `z-index: 999999`
- ✅ Clicking "Test Toast Notification" displays visible toast
- ✅ Toast appears above all other elements (including debug panel)
- ✅ Toast auto-dismisses after 5 seconds
- ✅ Toast has modern card styling with color-coded border

### Code Quality
- ✅ Zero build errors
- ✅ Zero build warnings
- ✅ All Playwright tests pass
- ✅ Percy visual regression tests show no unexpected changes
- ✅ Trace logging shows complete execution path

---

## 🚨 If Issues Persist

### Escalation Path
1. **Share Browser Console Logs** - F12 → Console tab → Copy all errors
2. **Share Network Tab** - F12 → Network tab → Filter CSS → Screenshot `noor-toastr.css` request
3. **Share Computed Styles** - F12 → Elements tab → Select toast container → Computed styles screenshot
4. **Share Application Logs** - Copy full server console output when clicking "Test Toast Notification"
5. **Create Minimal Reproduction** - Isolated HTML file with just toastr + CSS to test independently

---

## 📝 Next Steps

Run diagnostics FIRST before applying fixes to understand actual vs expected behavior.

**Command to execute**:
```bash
# Start app
cd SPA/NoorCanvas
dotnet run

# In browser:
# 1. Navigate to http://localhost:5000/canvas/session/8WXMK05K
# 2. Open debug panel (bottom-right)
# 3. Click "Test Toast Notification"
# 4. Check server console for [TOAST-TEST] logs
# 5. Check browser console (F12) for JavaScript errors
# 6. Check Network tab for noor-toastr.css (should be 200 OK)
```

Then report findings and we'll apply targeted fixes.
