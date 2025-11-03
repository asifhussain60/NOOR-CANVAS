# HostControlPanel UI Element IDs

**Component:** HostControlPanel.razor + HostControlPanelContent.razor  
**Published:** 2025-11-03  
**Last Updated:** 2025-11-03  
**Purpose:** Playwright test selector reference

---

## Component Structure

```
HostControlPanel.razor (Page)
└── HostControlPanelContent.razor (Main Content)
    ├── HostControlPanelSidebar.razor (Sidebar)
    └── UserRegistrationLink.razor (Canvas Selection)
```

---

## Element IDs

### HostControlPanelSidebar.razor

| Element | ID | Type | Purpose | Playwright Selector |
|---------|-----|------|---------|---------------------|
| Start Session Button | `sidebar-start-session-btn` | button | Initiate session | `#sidebar-start-session-btn` |

**Example Usage:**
```typescript
// Click Start Session button
const startButton = page.locator('#sidebar-start-session-btn');
await startButton.click();
```

---

### UserRegistrationLink.razor

| Element | ID | Type | Purpose | Playwright Selector |
|---------|-----|------|---------|---------------------|
| Transcript Canvas Button | `reg-transcript-canvas-btn` | button | Select transcript canvas mode | `#reg-transcript-canvas-btn` |
| Asset Canvas Button | `reg-asset-canvas-btn` | button | Select asset canvas mode | `#reg-asset-canvas-btn` |
| Registration Link Container | `reg-link-container` | div | Parent container for canvas buttons | `#reg-link-container` |

**Example Usage:**
```typescript
// Select transcript canvas mode
const transcriptBtn = page.locator('#reg-transcript-canvas-btn');
await transcriptBtn.click();

// Select asset canvas mode  
const assetBtn = page.locator('#reg-asset-canvas-btn');
await assetBtn.click();

// Access link container
const container = page.locator('#reg-link-container');
const link = container.locator('a');  // Registration link inside
```

---

## Test Scenarios

### Scenario 1: Start Session Flow

```typescript
test('should start session successfully', async ({ page }) => {
    // 1. Navigate to host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
    
    // 2. Wait for sidebar to load
    await page.waitForSelector('#sidebar-start-session-btn');
    
    // 3. Click start session
    const startButton = page.locator('#sidebar-start-session-btn');
    await startButton.click();
    
    // 4. Verify session started
    // (Add assertions here)
});
```

### Scenario 2: Canvas Mode Selection

```typescript
test('should select transcript canvas mode', async ({ page }) => {
    // 1. Navigate to host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
    
    // 2. Select transcript canvas
    const transcriptBtn = page.locator('#reg-transcript-canvas-btn');
    await transcriptBtn.click();
    
    // 3. Verify selection
    await expect(transcriptBtn).toHaveClass(/active/);
});

test('should select asset canvas mode', async ({ page }) => {
    // 1. Navigate to host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
    
    // 2. Select asset canvas
    const assetBtn = page.locator('#reg-asset-canvas-btn');
    await assetBtn.click();
    
    // 3. Verify selection
    await expect(assetBtn).toHaveClass(/active/);
});
```

---

## Component File Locations

```
SPA/NoorCanvas/
├── Pages/
│   └── HostControlPanel.razor           # Main page
└── Components/
    └── Host/
        ├── HostControlPanelContent.razor   # Main content
        ├── HostControlPanelSidebar.razor   # Sidebar with Start button
        └── UserRegistrationLink.razor      # Canvas mode selection
```

---

## Test File Locations

```
Tests/UI/
├── host-control-panel.spec.ts          # Main HCP tests
├── canvas-mode-selection.spec.ts       # Canvas mode tests
└── session-start-flow.spec.ts          # Session start tests
```

---

## Related Documentation

- [Playwright IDs FAB Button](../../../Docs/PLAYWRIGHT-IDS-FAB-BUTTON.md) - Comprehensive ID documentation
- [Start Session Button Flow](../../../KDS/docs/flows/start-session-button-flow.md) - Complete execution flow
- [ID-Based Selectors Pattern](../test-patterns/id-based-playwright-selectors.md) - Why use IDs

---

## Future Additions

**When adding new UI elements to HostControlPanel:**

1. Add unique ID to element
2. Follow naming convention: `{feature}-{element}-{type}`
3. Update this document with new ID
4. Create Playwright test using the ID
5. Verify test passes

**Example:**
```diff
+ | Stop Session Button | `sidebar-stop-session-btn` | button | Stop active session | `#sidebar-stop-session-btn` |
```

---

**Last Verified:** 2025-11-03  
**Component Version:** Current (features/kds branch)  
**Playwright Version:** Latest  
**Status:** ✅ All IDs verified working
