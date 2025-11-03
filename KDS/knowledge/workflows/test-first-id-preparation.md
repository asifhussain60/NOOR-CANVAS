# Workflow: Test-First ID Preparation

**Category:** workflows  
**Published:** 2025-11-03  
**Success Rate:** 100% (When followed)  
**Reuse Count:** 3+  
**Pattern Type:** Development Workflow

---

## Context

When to use this workflow: **Before writing any Playwright test** for a UI component.

**Problem Solved:**
- Tests written without IDs require refactoring later (wasted effort)
- Developers forget to add IDs, tests become fragile
- ID naming is inconsistent across components
- Missing documentation makes IDs hard to discover

**Solution:**
Prepare UI components for testing BEFORE writing tests. Add IDs, document them, then write tests that never break.

---

## Workflow Steps

### Step 1: Identify Testable Elements (5 min)

**Before touching code, list what needs testing:**

```markdown
Feature: Host Control Panel Session Start

Testable Elements:
1. Start Session button (sidebar)
2. Transcript Canvas selection button
3. Asset Canvas selection button
4. Registration link container
5. Session status indicator (future)
```

**Decision Point:** Which elements need IDs?
- ✅ Interactive elements (buttons, links, inputs)
- ✅ Containers with dynamic content
- ✅ Status indicators (changed by JavaScript)
- ❌ Static text (headings, labels)
- ❌ Decorative elements (icons, backgrounds)

---

### Step 2: Add IDs to Component (10 min)

**Open UI component file, add IDs following convention:**

**File:** `SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor`

```diff
- <button @onclick="StartSession">Start Session</button>
+ <button id="sidebar-start-session-btn" @onclick="StartSession">
+     Start Session
+ </button>
```

**Naming Convention:**
```
{feature}-{element}-{action|type}

Examples:
✅ sidebar-start-session-btn
✅ reg-transcript-canvas-btn
✅ canvas-mode-container
✅ session-status-indicator

❌ startButton (not descriptive enough)
❌ button1 (meaningless)
❌ StartSessionButton (wrong case)
```

**Add Comment:**
```razor
<!-- [REFACTOR:component-id] Added for Playwright testing -->
<button id="sidebar-start-session-btn" @onclick="StartSession">
```

---

### Step 3: Document IDs in UI Mappings (5 min)

**Create/update:** `KDS/knowledge/ui-mappings/{component-name}.md`

```markdown
| Element | ID | Type | Purpose | Playwright Selector |
|---------|-----|------|---------|---------------------|
| Start Session Button | `sidebar-start-session-btn` | button | Initiate session | `#sidebar-start-session-btn` |
```

**Why document?**
- Developers can discover existing IDs (avoid duplicates)
- Tests reference documentation (self-documenting)
- Future refactoring knows which IDs to preserve

---

### Step 4: Verify IDs in Browser (2 min)

**Run app, open browser DevTools:**

```bash
dotnet run
# Navigate to https://localhost:9091/host/control-panel/PQ9N5YWW
# Press F12, Console:
document.getElementById('sidebar-start-session-btn')
```

**Expected:** Element found ✅  
**If null:** ID not applied, check component syntax

---

### Step 5: Write Playwright Test (10 min)

**File:** `Tests/UI/host-control-panel.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Host Control Panel - Session Start', () => {
    test('should start session when Start button clicked', async ({ page }) => {
        // Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        
        // Wait for element (ID-based, fast)
        const startButton = page.locator('#sidebar-start-session-btn');
        await expect(startButton).toBeVisible();
        
        // Click
        await startButton.click();
        
        // Verify result
        // (Add assertions)
    });
});
```

**Key Points:**
- ✅ Use `#id` selector (fast, reliable)
- ✅ Wait for visibility before interaction
- ✅ Clear test names
- ✅ One assertion per test (focused)

---

### Step 6: Run Test & Document Success (5 min)

```bash
npx playwright test host-control-panel.spec.ts --headed
```

**Expected:** ✅ Test passes  
**If fails:** Debug using Playwright Inspector

**Document in session log:**
```markdown
✅ Session Start Flow Test - PASS
   - IDs added: sidebar-start-session-btn, reg-transcript-canvas-btn
   - Tests created: 2
   - Pass rate: 100%
```

---

### Step 7: Publish Pattern (Optional, 3 min)

**If workflow succeeded, publish pattern:**

```markdown
#file:KDS/prompts/shared/publish.md

Pattern: Test-First ID Preparation
Category: workflows
Success Rate: 100%
Reuse Count: 1
```

**What to publish:**
- Successful test strategies
- ID naming conventions that worked
- Common mistakes to avoid

---

## What Worked

✅ **Preparation First:** Adding IDs BEFORE tests saves refactoring later  
✅ **Naming Convention:** Consistent kebab-case makes IDs predictable  
✅ **Documentation:** UI mappings help future developers  
✅ **Verification:** Browser DevTools catch ID typos early  
✅ **Test-Driven:** Writing tests after IDs ensures they're usable  

**Time Savings:**
- Refactoring text-based tests to IDs: **2-3 hours**
- Test-first ID preparation: **30 minutes**
- **Net savings: 1.5-2.5 hours per feature**

---

## What Didn't Work

❌ **Skipping Documentation:** Tests worked but IDs were rediscovered later  
❌ **Inconsistent Naming:** Mixed camelCase/kebab-case caused confusion  
❌ **Adding IDs Last:** Required component changes after tests written  
❌ **No Browser Verification:** Typos in IDs caused test failures  

**Lessons Learned:**
- Documentation is NOT optional (saves time long-term)
- Enforce naming convention in code review
- Never write tests before IDs exist
- Always verify IDs in browser before test

---

## Workflow Diagram

```
Identify Elements → Add IDs → Document → Verify → Write Tests → Run Tests
     (5 min)         (10 min)   (5 min)   (2 min)    (10 min)     (5 min)
     
Total: ~37 minutes per component

Compared to:
Write Tests → Tests Fail → Add IDs → Refactor Tests → Debug → Fix
   (10 min)     (5 min)   (10 min)     (15 min)     (20 min)  (10 min)
   
Total: ~70 minutes per component (TWICE AS LONG)
```

---

## Success Metrics

**When this workflow succeeds:**
- ✅ Tests pass on first run (no refactoring)
- ✅ Zero text-based selectors (all ID-based)
- ✅ IDs discoverable (documented in ui-mappings/)
- ✅ Naming consistent (kebab-case)
- ✅ Future tests reuse IDs (no duplication)

**When this workflow fails:**
- ❌ Tests need refactoring (IDs added late)
- ❌ Multiple selectors for same element (no documentation)
- ❌ Mixed naming styles (no convention)
- ❌ Developers ask "what IDs exist?" (no mapping)

---

## Related Patterns

- [ID-Based Playwright Selectors](../test-patterns/id-based-playwright-selectors.md) - Technical implementation
- [HostControlPanel UI Mappings](../ui-mappings/host-control-panel.md) - Example documentation
- [Playwright Element Selection](../test-patterns/playwright-element-selection.md) - Broader strategies

---

## Checklist

**Before writing ANY Playwright test:**

```
✓ Identified testable elements?
✓ Added IDs to component (kebab-case)?
✓ Documented IDs in ui-mappings/?
✓ Verified IDs in browser DevTools?
✓ Written test using ID selectors?
✓ Test passes on first run?
✓ Published pattern if reusable?
```

---

**Workflow Status:** ✅ Production-ready  
**Recommended:** Use for all Playwright test development  
**Time Investment:** 37 min/component  
**ROI:** 2x faster than test-last approach
