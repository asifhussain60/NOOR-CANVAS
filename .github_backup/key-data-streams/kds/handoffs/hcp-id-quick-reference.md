# Host Control Panel - ID Quick Reference

**For Developers & Testers**

---

## Static Element IDs

### Main Page
```typescript
'hcp-security-alert-overlay'  // Security alert backdrop
'hcp-security-alert-card'     // Security alert content
'hcp-message-toast'            // Success/info message
```

### Sidebar
```typescript
'sidebar-start-session-btn'    // Start Session button
```

### User Registration
```typescript
'reg-link-container'           // Container
'reg-asset-canvas-btn'         // Asset Canvas button (Q&A)
'reg-transcript-canvas-btn'    // Transcript Canvas button
```

### Content Panel
```typescript
'content-qa-toggle-btn'        // Q&A panel toggle (circular button)
'content-fab-share-btn'        // FAB broadcast transcript button
'content-transcript-container' // Transcript scroll container
'content-end-session-btn'      // End Session button
'content-qa-panel'             // Q&A panel container
```

### Modal
```typescript
'modal-overlay'                // Backdrop
'modal-container'              // Content box
'modal-cancel-btn'             // Cancel button
'modal-confirm-btn'            // Confirm Delete button
```

### Debug Panel (Dev Only)
```typescript
'debug-panel-container'        // Panel wrapper
'debug-toggle-btn'             // Floating toggle button
'debug-sysinfo-toggle'         // System info collapse
'debug-action-{index}'         // Action buttons (0, 1, 2...)
```

---

## Dynamic Element IDs

### Question Cards
```typescript
`qa-card-${index}`             // Question card (0, 1, 2...)
`qa-votes-${index}`            // Vote badge
`qa-answered-${index}`         // Mark Answered button
`qa-delete-${index}`           // Delete button
```

**Example**: 3rd question (index=2)
```html
<div id="qa-card-2">
  <div id="qa-votes-2">5</div>
  <button id="qa-answered-2">✓</button>
  <button id="qa-delete-2">🗑</button>
</div>
```

---

## Playwright Examples

### Basic Actions
```typescript
// Start session
await page.locator('#sidebar-start-session-btn').click();

// Select canvas type
await page.locator('#reg-asset-canvas-btn').click();

// Toggle Q&A panel
await page.locator('#content-qa-toggle-btn').click();

// Broadcast transcript
await page.locator('#content-fab-share-btn').click();

// End session
await page.locator('#content-end-session-btn').click();
```

### Question Actions
```typescript
// Click first question card
await page.locator('#qa-card-0').click();

// Mark second question answered
await page.locator('#qa-answered-1').click();

// Delete third question
await page.locator('#qa-delete-2').click();

// Confirm deletion in modal
await page.locator('#modal-confirm-btn').click();
```

### Accessibility Checks
```typescript
// Check Q&A button state
const qaBtn = page.locator('#content-qa-toggle-btn');
await expect(qaBtn).toHaveAttribute('aria-expanded', 'false');
await expect(qaBtn).toHaveAttribute('aria-controls', 'content-qa-panel');

// Check canvas selection
const assetBtn = page.locator('#reg-asset-canvas-btn');
await expect(assetBtn).toHaveAttribute('aria-pressed', 'true');
```

---

## Component Hierarchy

```
HostControlPanel.razor
├── hcp-security-alert-overlay (conditional)
├── hcp-message-toast (conditional)
├── HostControlPanelHeader (no IDs)
├── HostControlPanelSidebar
│   ├── sidebar-start-session-btn
│   └── UserRegistrationLink
│       ├── reg-link-container
│       ├── reg-asset-canvas-btn
│       └── reg-transcript-canvas-btn
├── HostControlPanelContent
│   ├── content-qa-toggle-btn
│   ├── content-fab-share-btn
│   ├── content-transcript-container
│   ├── content-end-session-btn
│   └── content-qa-panel
│       └── QuestionCard (multiple)
│           ├── qa-card-{index}
│           ├── qa-votes-{index}
│           ├── qa-answered-{index}
│           └── qa-delete-{index}
├── HostControlPanelModal
│   ├── modal-overlay
│   ├── modal-container
│   ├── modal-cancel-btn
│   └── modal-confirm-btn
└── DebugPanel
    ├── debug-panel-container
    ├── debug-toggle-btn
    ├── debug-sysinfo-toggle
    └── debug-action-{index} (multiple)
```

---

## Common Patterns

### Wait for Element
```typescript
await page.waitForSelector('#sidebar-start-session-btn');
```

### Check Visibility
```typescript
await expect(page.locator('#content-qa-panel')).toBeVisible();
```

### Get Count
```typescript
const questionCount = await page.locator('[id^="qa-card-"]').count();
```

### Iterate Questions
```typescript
for (let i = 0; i < 5; i++) {
  await page.locator(`#qa-card-${i}`).click();
}
```

---

## Notes

- All IDs are **lowercase with hyphens**
- Dynamic IDs use **zero-based indexing**
- Component prefixes: `hcp-`, `sidebar-`, `content-`, `modal-`, `qa-`, `reg-`, `debug-`
- Session transcript share buttons excluded (JavaScript-injected)

---

**Quick Access**: `#file:hcp-clickable-elements-id-map.md` for full documentation
