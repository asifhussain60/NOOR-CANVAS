# test-prep.prompt.md - Examples Reference

This file contains TypeScript test template and PowerShell command extracted from `test-prep.prompt.md` for Rule #1 compliance (no code blocks in user-facing sections).

**JSON schemas preserved inline** (data structure exception per KDS Review Handoff JSON).

---

## Example 1: Run Application Command (PowerShell)

**Source:** Action: prep - Next Steps

**Purpose:** Run NoorCanvas application in headed mode for manual testing

```powershell
dotnet run --project SPA/NoorCanvas
```

**Usage Context:**
- Execute AFTER test prep completion (markers injected)
- Headed mode allows DevTools access for console log capture
- Keep running while performing manual test scenarios
- Stop after logging complete (Ctrl+C)

**References:**
- Test Prep Workflow: test-prep.prompt.md Action: prep
- Manual Testing: Perform 5-10 minutes of component interactions

---

## Example 2: Playwright Test Template (TypeScript)

**Source:** Action: generate - Step 4: Generate Playwright Test

**Purpose:** Template for auto-generated tests from interaction logs

```typescript
import { test, expect } from '@playwright/test';

test.describe('{key} - {feature}', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup from session context
    await page.goto('/host/control-panel/212');
  });
  
  test('{feature} - {interaction description}', async ({ page }) => {
    // Generated from client logs
    await page.getByTestId('share-asset-btn').click();
    
    // Generated from server logs (assertions)
    await expect(page.locator('.asset-shared')).toContainText('ABC123');
    await expect(page.locator('.asset-type')).toContainText('Image');
  });
  
});
```

**Template Variables:**
- `{key}`: Key identifier from session context
- `{feature}`: Feature name extracted from user request
- `{interaction description}`: Generated from client log action
- Selectors: Prefer `data-testid` (extracted from client logs)
- Assertions: Generated from server log events (within 2s timestamp window)

**Usage Context:**
- Auto-populated during `action=generate`
- Saved to `Tests/UI/{key}-{feature}.spec.ts`
- Run via: `npx playwright test {key}-{feature}.spec.ts`

**References:**
- Test Generation: test-prep.prompt.md Action: generate
- Quality Scoring: `.github/prompts/shared/test-quality-scoring.md` Algorithm 9
- Orchestration: `.github/prompts/shared/test-orchestration-patterns.md`

---
