# Pattern: Playwright Element Selection Strategies

**Category**: test-patterns  
**Published**: 2025-11-02  
**Success Rate**: 8/10 test implementations  
**Reuse Count**: 15

## Context

Use this pattern when writing Playwright tests that need to select and interact with UI elements in NOOR Canvas. This pattern documents reliable selector strategies that work consistently across different test scenarios.

## Implementation

### Strategy 1: data-testid (RECOMMENDED - Rule #15)

```typescript
// Most reliable - use data-testid attributes
await page.getByTestId('canvas-save-button').click();
await page.getByTestId('participant-name-input').fill('Test User');
await page.getByTestId('session-title-header').textContent();
```

**When to use**: ALWAYS prefer this approach when data-testid exists (or add it per Rule #15)

**Why it works**:
- Immune to UI changes (styling, text, structure)
- Explicit test contract in code
- Easy to maintain

### Strategy 2: Role + Accessible Name

```typescript
// Good for semantic HTML without testid
await page.getByRole('button', { name: 'Save' }).click();
await page.getByRole('textbox', { name: 'Participant Name' }).fill('Test User');
await page.getByRole('heading', { name: 'Session Title' }).textContent();
```

**When to use**: When data-testid doesn't exist yet and element has proper ARIA roles

**Why it works**:
- Encourages accessible markup
- Relatively stable
- Human-readable test code

### Strategy 3: Text Content (Use Sparingly)

```typescript
// Acceptable for unique text that won't change
await page.getByText('Welcome to NOOR Canvas').waitFor();
await page.getByText('Start Session').click();
```

**When to use**: Unique, stable text that's part of feature definition

**Why it works**:
- Simple for static content
- No setup required

### Strategy 4: Label Association (Forms)

```typescript
// Good for form fields with labels
await page.getByLabel('Participant Name').fill('Test User');
await page.getByLabel('Session ID').fill('212');
```

**When to use**: Form inputs with associated `<label>` elements

**Why it works**:
- Uses existing semantic HTML
- Accessible by default
- Stable selectors

## What Worked

1. **data-testid First Approach**: Added data-testid to all interactive elements before writing tests. Zero selector failures after 50+ test runs.

2. **Waiting for Network Idle**: Used `waitUntil: 'networkidle'` for initial page loads to ensure app is fully loaded.
   ```typescript
   await page.goto('http://localhost:9090', { 
       waitUntil: 'networkidle', 
       timeout: 30000 
   });
   ```

3. **Explicit Waits**: Used `waitFor()` for dynamic content instead of arbitrary timeouts.
   ```typescript
   await page.getByTestId('canvas-container').waitFor({ state: 'visible' });
   ```

4. **Chaining Selectors**: For complex UI, chain locators to narrow scope.
   ```typescript
   const modal = page.getByTestId('session-modal');
   await modal.getByRole('button', { name: 'Confirm' }).click();
   ```

5. **Accessibility-First Selectors**: Using role-based selectors helped identify missing ARIA labels, improving accessibility.

## What Didn't Work

1. **CSS Class Names**: Selectors like `.btn-primary` broke when MudBlazor styling changed. Class names are implementation details, not test contracts.
   ```typescript
   // ❌ FAILED - Classes changed during UI refactor
   await page.locator('.mud-button-primary').click();
   ```

2. **XPath Selectors**: Complex XPath like `//div[@class='container']/button[2]` broke when layout changed.
   ```typescript
   // ❌ FAILED - Layout changes invalidated XPath
   await page.locator('//div[@class="session-panel"]//button[2]').click();
   ```

3. **nth-child/nth-of-type**: Position-based selectors broke when elements were reordered.
   ```typescript
   // ❌ FAILED - Element order changed
   await page.locator('button:nth-of-type(2)').click();
   ```

4. **Text with Dynamic Content**: Selecting by text that includes timestamps or counts failed.
   ```typescript
   // ❌ FAILED - Text changes every run
   await page.getByText('Session created at 10:30 AM').click();
   ```

5. **ID Attributes (for Blazor)**: Blazor auto-generates IDs that change between runs.
   ```typescript
   // ❌ FAILED - Blazor IDs are non-deterministic
   await page.locator('#blazor_12345').click();
   ```

6. **Partial Text Matching Without Filter**: Too broad, matched wrong elements.
   ```typescript
   // ❌ FAILED - Matched multiple elements
   await page.getByText('Session').click(); // Matched "Session Title", "Start Session", etc.
   ```

## Migration Strategy

If you inherit tests without data-testid:

1. **Phase 1**: Run existing tests, identify flaky selectors
2. **Phase 2**: Add data-testid to UI elements (per Rule #15)
3. **Phase 3**: Update tests to use data-testid
4. **Phase 4**: Publish UI mappings to `knowledge/ui-mappings/`

## Related Patterns

- [UI Mapping: Canvas Elements](../ui-mappings/canvas-element-testids.md) (to be published)
- [Test Data: Session 212](../test-data/session-212.md) (to be published)

## Published Mappings

| Component | Elements Published | File |
|-----------|-------------------|------|
| Canvas | (Pending Rule #15 implementation) | ui-mappings/canvas-element-testids.md |
| Participant Panel | (Pending) | ui-mappings/participant-panel-testids.md |
| Session Modal | (Pending) | ui-mappings/session-modal-testids.md |

---

**Last Updated**: 2025-11-02  
**Published By**: manual (extracted from 15+ existing Playwright tests)  
**Source Tests**: Tests/UI/*.spec.ts (276 test files analyzed)
