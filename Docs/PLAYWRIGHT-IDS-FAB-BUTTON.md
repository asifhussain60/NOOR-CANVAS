# Playwright Test IDs - Purple FAB Button Testing

**Component:** `HostControlPanelContent.razor`  
**Date:** 2025-11-02  
**Purpose:** Enable Playwright testing for the purple FAB (Floating Action Button) and related Host Control Panel elements

## Overview

Added comprehensive `id` and `data-testid` attributes to all interactive elements in the Host Control Panel Content component to enable robust, ID-based Playwright testing. This follows CORTEX best practices for test automation.

## Why ID-Based Selectors?

✅ **10x faster** - `getElementById` vs DOM text search  
✅ **Immune to text changes** - i18n, wording updates, HTML restructuring  
✅ **Explicit intent** - `#fab-share-btn` is clearer than `button:has-text("Share")`  
✅ **No false positives** - Unique ID vs multiple matching texts  

**WRONG (FRAGILE):**
```typescript
// ❌ BREAKS when text changes, slow DOM search, ambiguous
const button = page.locator('button:has-text("Share Transcript")').first();
```

**CORRECT (ROBUST):**
```typescript
// ✅ Fast, reliable, explicit, future-proof
const button = page.locator('#content-fab-share-btn');
```

## Component IDs Added

### Main Container
| Element | ID | Purpose |
|---------|-----|---------|
| Main container | `hcp-content-main-container` | Root container for all content |
| Transcript panel | `hcp-content-transcript-panel` | Left panel containing transcript |
| Transcript area | `hcp-content-transcript-area` | Inner transcript content area |
| Q&A panel | `content-qa-panel` | Right panel for questions (when visible) |

### Session Header
| Element | ID | Purpose |
|---------|-----|---------|
| Session header | `hcp-content-session-header` | Sticky header with session info |
| Session title | `hcp-content-session-title` | Session name display |
| Timer container | `hcp-content-timer-container` | Container for elapsed time |
| Timer display | `hcp-content-timer-display` | Timer display wrapper |
| Timer value | `hcp-content-timer-value` | Actual timer text (M:SS or H:MM) |
| Canvas type | `hcp-content-canvas-type` | Shows "Transcript Canvas" or "Asset Canvas" |

### Purple FAB Button (PRIMARY TEST TARGET)
| Element | ID | data-testid | Purpose |
|---------|-----|-------------|---------|
| FAB share button | `content-fab-share-btn` | `fab-share-btn` | **Primary purple FAB button for broadcast** |
| FAB share icon | `hcp-fab-share-icon` | - | Share icon (fa-share-nodes) |
| FAB spinner icon | `hcp-fab-spinner-icon` | - | Loading spinner when processing |

**Additional FAB Button Attributes:**
- `data-has-transcript` - Boolean indicating if transcript is loaded
- `data-is-loading` - Boolean indicating loading state
- `data-session-status` - Current session status
- `aria-label` - "Broadcast transcript to participants"
- `data-playwright-log-marker` - Timestamped log marker for debugging

### Q&A Toggle Button
| Element | ID | data-testid | Purpose |
|---------|-----|-------------|---------|
| Q&A toggle button | `content-qa-toggle-btn` | `qa-toggle-btn` | Green circular button to show/hide questions |
| Question count badge | `hcp-content-question-badge` | `question-count-badge` | Red badge showing question count |

### End Session Button
| Element | ID | data-testid | Purpose |
|---------|-----|-------------|---------|
| End session container | `hcp-content-end-session-container` | - | Container for end session button |
| End session button | `content-end-session-btn` | `end-session-btn` | Red button to end the session |
| End session icon | `hcp-end-session-icon` | - | Stop icon |
| End session spinner | `hcp-end-session-spinner` | - | Loading spinner |

### Content States
| Element | ID | data-testid | Purpose |
|---------|-----|-------------|---------|
| Loading state | `hcp-content-loading-state` | - | Shown while loading transcript |
| Transcript container | `content-transcript-container` | `transcript-container` | Container for rendered transcript HTML |
| Empty state | `hcp-content-empty-state` | - | Shown when no transcript available |

### Q&A Panel Elements
| Element | ID | data-testid | Purpose |
|---------|-----|-------------|---------|
| Q&A header | `hcp-content-qa-header` | - | Panel header with "Questions" title |
| Q&A title | `hcp-content-qa-title` | - | "Questions" heading text |
| Questions list | `hcp-content-questions-list` | `questions-list` | Scrollable container for question cards |
| Questions empty state | `hcp-content-questions-empty` | `questions-empty-state` | Shown when no questions exist |

## Playwright Test Examples

### Test Purple FAB Button Visibility
```typescript
import { test, expect } from '@playwright/test';

test('purple FAB button is visible when transcript is loaded', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  // Wait for session to load
  await page.waitForSelector('#hcp-content-session-title');
  
  // Check FAB button is visible
  const fabButton = page.locator('#content-fab-share-btn');
  await expect(fabButton).toBeVisible();
  
  // Verify button is enabled (has transcript)
  const hasTranscript = await fabButton.getAttribute('data-has-transcript');
  expect(hasTranscript).toBe('true');
});
```

### Test FAB Button Click
```typescript
test('purple FAB button broadcasts transcript when clicked', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  // Wait for button to be ready
  const fabButton = page.locator('#content-fab-share-btn');
  await fabButton.waitFor({ state: 'visible' });
  
  // Click the button
  await fabButton.click();
  
  // Verify toast notification appears
  await expect(page.locator('text=FAB button clicked successfully!')).toBeVisible();
});
```

### Test FAB Button States
```typescript
test('purple FAB button shows correct states', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  const fabButton = page.locator('#content-fab-share-btn');
  
  // Check loading state
  if (await fabButton.getAttribute('data-is-loading') === 'true') {
    // Should show spinner icon
    await expect(page.locator('#hcp-fab-spinner-icon')).toBeVisible();
  } else {
    // Should show share icon
    await expect(page.locator('#hcp-fab-share-icon')).toBeVisible();
  }
});
```

### Test Q&A Toggle Button
```typescript
test('Q&A toggle button opens/closes questions panel', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  const qaToggleBtn = page.locator('#content-qa-toggle-btn');
  const qaPanel = page.locator('#content-qa-panel');
  
  // Click to open
  await qaToggleBtn.click();
  await expect(qaPanel).toBeVisible();
  
  // Verify aria-expanded
  const expanded = await qaToggleBtn.getAttribute('aria-expanded');
  expect(expanded).toBe('true');
  
  // Click to close
  await qaToggleBtn.click();
  await expect(qaPanel).not.toBeVisible();
});
```

### Test Session Timer
```typescript
test('session timer displays correctly', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  // Wait for active session
  await page.waitForSelector('#hcp-content-timer-value');
  
  const timerValue = page.locator('#hcp-content-timer-value');
  const timerText = await timerValue.textContent();
  
  // Should match M:SS or H:MM format
  expect(timerText).toMatch(/^\d+:\d{2}$/);
});
```

### Test End Session Button
```typescript
test('end session button ends the session', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  const endSessionBtn = page.locator('#content-end-session-btn');
  await expect(endSessionBtn).toBeVisible();
  
  // Click end session (with confirmation if modal exists)
  await endSessionBtn.click();
  
  // Verify session status changes
  // (actual verification depends on your session end flow)
});
```

## Visual Regression Testing with Percy

```typescript
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('purple FAB button visual regression', async ({ page }) => {
  await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
  
  // Wait for FAB button to be visible
  await page.locator('#content-fab-share-btn').waitFor({ state: 'visible' });
  
  // Take Percy snapshot
  await percySnapshot(page, 'Host Control Panel - FAB Button');
  
  // Hover state
  await page.locator('#content-fab-share-btn').hover();
  await percySnapshot(page, 'Host Control Panel - FAB Button Hover');
});
```

## Component Hierarchy

```
hcp-content-main-container
├── hcp-content-transcript-panel
│   ├── hcp-content-session-header
│   │   ├── hcp-content-session-title
│   │   ├── hcp-content-timer-container (when active)
│   │   │   ├── hcp-content-timer-display
│   │   │   │   └── hcp-content-timer-value
│   │   │   └── hcp-content-canvas-type
│   │   └── content-qa-toggle-btn
│   │       └── hcp-content-question-badge
│   ├── hcp-content-transcript-area
│   │   ├── content-fab-share-btn ⭐ PURPLE FAB BUTTON
│   │   │   ├── hcp-fab-share-icon (normal)
│   │   │   └── hcp-fab-spinner-icon (loading)
│   │   ├── hcp-content-loading-state (loading)
│   │   ├── content-transcript-container (loaded)
│   │   └── hcp-content-empty-state (no transcript)
│   └── hcp-content-end-session-container
│       └── content-end-session-btn
└── content-qa-panel (when QAPanelOpen)
    ├── hcp-content-qa-header
    │   └── hcp-content-qa-title
    ├── hcp-content-questions-list
    └── hcp-content-questions-empty (when no questions)
```

## CORTEX Compliance

This implementation follows CORTEX Playwright Testing Protocol:

✅ **Component ID-Based Selectors** - All elements use unique IDs  
✅ **TDD Requirement** - IDs added before writing tests  
✅ **Explicit Intent** - Clear, semantic ID names  
✅ **Future-Proof** - Independent of text content or HTML structure  

## Next Steps

1. ✅ IDs added to component
2. ⏳ Create Playwright test spec file
3. ⏳ Create PowerShell test runner script (following CORTEX protocol)
4. ⏳ Add Percy visual regression tests
5. ⏳ Document in test suite

## Related Files

- Component: `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor`
- Page: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- Test Script Template: `Scripts/run-debug-panel-percy-tests.ps1` (reference)
- CORTEX Reference: `.github/prompts/CORTEX.prompt.md` (Playwright Testing Protocol section)
