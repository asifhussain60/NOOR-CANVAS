# Visual Regression (Percy) Test Template

**Purpose**: TypeScript template for generating Percy visual regression tests.

**When to Load**: During Step 4 (Visual Regression Test Generation).

**Integration Point**: Called by test-generation.prompt.md when Percy tests required.

---

## Plan Integration Logic

### If Plan Exists

Check plan's "Playwright Test Specification" → Percy: Yes/No

**Percy: Yes**:
1. Use plan's visual change rationale
2. Capture specified screens/flows from plan
3. Follow viewport specifications from plan (or default to 375/768/1280)
4. Use plan's percyCSS hiding rules (if specified)

**Percy: No**:
1. Skip Percy snapshots (functional test only)
2. Generate functional E2E test instead (use functional-e2e-template.md)

### If No Plan

1. Use decision matrix (from PlaywrightQuickRef.md)
2. Infer from change type:
   - **CSS/styling changes** → Percy required
   - **Behavioral changes** → Functional test only

---

## Core Template Structure

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Visual Regression Test: {Feature Name}
 * 
 * Purpose: Verify visual consistency across viewports
 * Baseline: Percy dashboard stores approved snapshots
 * 
 * Prerequisites:
 * - Percy token configured: PERCY_TOKEN env variable
 * - Session 212 exists in database
 * - Run with: npm run test:percy:visual -- path/to/test.spec.ts
 * 
 * Configuration:
 * - Viewports: 375px (mobile), 768px (tablet), 1280px (desktop)
 * - See .percy.yml for full config
 * 
 * References:
 * - PlaywrightQuickRef.md: Decision matrix for when to use Percy
 * - VISUAL_REGRESSION_TESTING.md: Percy setup and workflows
 */

test.describe('Visual Regression: {Feature Name}', () => {
  test('should render {component} correctly across viewports', async ({ page }) => {
    // Step 1: Navigate to component
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    
    // Step 2: Wait for component to fully load
    await page.waitForSelector('[data-testid="component-root"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Step 3: Take baseline snapshot (tests all configured viewports)
    await percySnapshot(page, '{Component Name} - Initial State', {
      widths: [375, 768, 1280],  // Mobile, tablet, desktop
      minHeight: 1024,
      percyCSS: `
        /* Hide dynamic elements that change between test runs */
        .timestamp { display: none; }
        .user-avatar { display: none; }
      `
    });
    
    // Step 4: Interact with component (if testing state changes)
    await page.click('[data-testid="toggle-button"]');
    await page.waitForTimeout(500);  // Wait for CSS transitions
    
    // Step 5: Take snapshot of changed state
    await percySnapshot(page, '{Component Name} - Active State');
    
    // Step 6: Test different states/variants (optional)
    await page.click('[data-testid="secondary-action"]');
    await percySnapshot(page, '{Component Name} - Secondary State');
  });

  test('should render {component} in different themes', async ({ page }) => {
    // Test visual consistency across theme variations
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    await page.waitForSelector('.canvas-question-card-orange');
    
    // Orange theme
    await percySnapshot(page, '{Component} - Orange Theme');
    
    // Green theme (if applicable)
    await page.click('[data-testid="vote-up"]');
    await page.waitForSelector('.canvas-question-card-green');
    await percySnapshot(page, '{Component} - Green Theme');
  });
});
```

---

## Percy Test Execution Commands

```bash
# Run single visual test (headed mode)
npm run test:percy:headed -- Tests/UI/feature-visual.spec.ts

# Run all visual tests (headless)
npm run test:percy

# Run visual test without Percy (for debugging)
npx playwright test Tests/UI/feature-visual.spec.ts --headed
```

---

## Percy Snapshot Best Practices

### 1. Naming Convention

Use descriptive names that clearly indicate component and state.

**Good Examples**:
- `"Question Card - Orange Theme - Voted State"`
- `"Share Button - Initial State - Desktop"`
- `"Debug Panel - Expanded State - Mobile"`

**Bad Examples**:
- `"Test 1"` (not descriptive)
- `"Snapshot"` (no context)
- `"Desktop"` (missing component/state info)

### 2. Viewport Strategy

Always test mobile (375px), tablet (768px), desktop (1280px) unless plan specifies otherwise:

```typescript
await percySnapshot(page, 'Component Name - State', {
  widths: [375, 768, 1280],  // Default viewports
  minHeight: 1024
});
```

Use `.percy.yml` defaults unless specific viewport needed for feature.

### 3. Dynamic Content Handling

Use `percyCSS` to hide elements that change between test runs:

```typescript
await percySnapshot(page, 'Component - State', {
  percyCSS: `
    /* Hide timestamps */
    .timestamp { display: none; }
    
    /* Hide user avatars */
    .user-avatar { display: none; }
    
    /* Hide random IDs */
    [data-session-id] { display: none; }
    
    /* Hide loading spinners */
    .loading-spinner { display: none; }
  `
});
```

**Common Elements to Hide**:
- Timestamps (`Created: 2 minutes ago`)
- User avatars (vary by session)
- Session IDs/tokens
- Loading indicators
- Animations/transitions (use `waitForTimeout()` instead)

### 4. Ensure Data Stability

Use **Session 212** canonical data for consistent snapshots:

| Role | Token | URL |
|------|-------|-----|
| Participant | KJAHA99L | `https://localhost:9091/session/canvas/KJAHA99L` |
| Host | PQ9N5YWW | `https://localhost:9091/host/control-panel/PQ9N5YWW` |

Session 212 provides:
- Predictable questions/answers
- Known color states (orange/green)
- Consistent participant data
- Stable vote counts

### 5. Wait for Animations/Transitions

Always wait for CSS transitions before taking snapshots:

```typescript
// Click to trigger state change
await page.click('[data-testid="expand-button"]');

// Wait for transition (300ms CSS transition + 200ms buffer)
await page.waitForTimeout(500);

// Take snapshot after transition completes
await percySnapshot(page, 'Component - Expanded State');
```

---

## Decision Matrix (When to Use Percy)

From `PlaywrightQuickRef.md`:

| Change Type | Percy Required? | Reason |
|-------------|----------------|--------|
| CSS/styling changes | ✅ Yes | Visual appearance changed |
| Layout modifications | ✅ Yes | Component positioning changed |
| Color scheme updates | ✅ Yes | Visual theme changed |
| Responsive design | ✅ Yes | Multi-viewport verification needed |
| Functional behavior | ❌ No | Use functional E2E test |
| API logic | ❌ No | Use functional E2E test |
| Performance optimization | ❌ No | Use functional E2E test |

**Exception**: If functional change affects UI (e.g., button state change), use **both** functional + Percy tests.

---

## Multi-State Snapshot Pattern

For components with multiple visual states:

```typescript
test('should render button in all states', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  await page.waitForLoadState('networkidle');
  
  // State 1: Default
  await percySnapshot(page, 'Button - Default State');
  
  // State 2: Hover (simulate via CSS class)
  await page.evaluate(() => {
    document.querySelector('.my-button').classList.add('hover');
  });
  await percySnapshot(page, 'Button - Hover State');
  
  // State 3: Active
  await page.click('.my-button');
  await page.waitForTimeout(300);
  await percySnapshot(page, 'Button - Active State');
  
  // State 4: Disabled
  await page.evaluate(() => {
    document.querySelector('.my-button').setAttribute('disabled', 'true');
  });
  await percySnapshot(page, 'Button - Disabled State');
});
```

---

## Theme Variation Pattern

For testing multiple themes (orange/green cards):

```typescript
test('should render question card in all theme colors', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  await page.waitForSelector('.canvas-question-card-orange');
  
  // Orange theme (default)
  await percySnapshot(page, 'Question Card - Orange Theme', {
    widths: [375, 768, 1280]
  });
  
  // Vote up to change to green theme
  await page.click('[data-testid="vote-up-button"]');
  await page.waitForSelector('.canvas-question-card-green');
  await page.waitForTimeout(300);  // Wait for color transition
  
  await percySnapshot(page, 'Question Card - Green Theme', {
    widths: [375, 768, 1280]
  });
  
  // Vote down to change to red theme (if applicable)
  await page.click('[data-testid="vote-down-button"]');
  await page.waitForSelector('.canvas-question-card-red');
  await page.waitForTimeout(300);
  
  await percySnapshot(page, 'Question Card - Red Theme', {
    widths: [375, 768, 1280]
  });
});
```

---

## Template Variables

When generating from this template, replace:

| Placeholder | Replace With | Example |
|-------------|-------------|---------|
| `{Feature Name}` | Primary feature being tested | "Share Button" |
| `{Component Name}` | Specific component | "Share Button Icon" |
| `{component}` | Component in lowercase | "share button" |
| `[data-testid="component-root"]` | Actual test ID selector | `[data-testid="share-button"]` |
| `[data-testid="toggle-button"]` | Action trigger selector | `[data-testid="expand-panel"]` |

---

## Percy Configuration Reference

**Default viewports** (from `.percy.yml`):
```yaml
widths:
  - 375   # Mobile
  - 768   # Tablet
  - 1280  # Desktop
```

**Environment variables**:
- `PERCY_TOKEN` - Percy API token (required)
- `PERCY_BRANCH` - Git branch name (auto-detected)

**Package.json scripts**:
```json
{
  "test:percy": "percy exec -- playwright test Tests/UI/*-visual.spec.ts",
  "test:percy:headed": "percy exec -- playwright test --headed"
}
```

---

## Reference

- See VISUAL_REGRESSION_TESTING.md for Percy setup guide
- See PlaywrightQuickRef.md for decision matrix
- See functional-e2e-template.md for functional tests
- See test-generation.prompt.md for main execution flow
