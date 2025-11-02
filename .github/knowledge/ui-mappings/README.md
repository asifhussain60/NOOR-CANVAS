# UI Mappings

This folder contains UI element to data-testid mappings for Playwright selectors.

## Published Mappings

(Empty - to be populated as UI elements are added per Rule #15)

## Mapping Template

```markdown
# UI Mapping: {Component/Page Name}

**Category**: ui-mappings
**Published**: {YYYY-MM-DD}
**Component**: {Component name}
**Page**: {Page/Route}

## Element Mappings

| Element Description | data-testid | Selector | Notes |
|---------------------|-------------|----------|-------|
| Save button | canvas-save-button | `page.getByTestId('canvas-save-button')` | Primary action |
| Name input | participant-name-input | `page.getByTestId('participant-name-input')` | Required field |

## Usage Example

```typescript
// Select save button
await page.getByTestId('canvas-save-button').click();

// Fill participant name
await page.getByTestId('participant-name-input').fill('Test User');
```

## Related Tests
Links to Playwright tests using these selectors

## Screenshot
(Optional: Include screenshot with element highlights)
```

---

**Governed By**: Rule #15 (UI Test Identifiers)
