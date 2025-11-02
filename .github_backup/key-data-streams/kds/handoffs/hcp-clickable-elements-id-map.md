# Host Control Panel - Clickable Elements ID Map

**Route Key**: `hcp-id`  
**File**: `#file:MANDATORY.md`  
**Generated**: November 1, 2025  
**Purpose**: Comprehensive mapping of all clickable elements with unique, simple IDs

---

## Design Principles

1. **Simple IDs**: Short, descriptive, no GUIDs or complex patterns
2. **Unique Across View**: Each ID is unique across the entire HostControlPanel and nested components
3. **Hierarchical Naming**: Use component prefix to avoid conflicts
4. **Accessibility**: Support ARIA attributes and keyboard navigation
5. **Test-Friendly**: IDs suitable for Playwright/automated testing

---

## ID Naming Convention

```
{component}-{element-type}-{specific-name}[-{index}]

Examples:
- hcp-start-session-btn
- hcp-qa-card-0
- sidebar-asset-canvas-btn
```

### Component Prefixes
- `hcp-` = HostControlPanel (main page)
- `header-` = HostControlPanelHeader
- `sidebar-` = HostControlPanelSidebar
- `content-` = HostControlPanelContent
- `modal-` = HostControlPanelModal
- `qa-` = QuestionCard component
- `reg-` = UserRegistrationLink component
- `debug-` = DebugPanel component

---

## Complete Element Inventory

### 1. HostControlPanel.razor (Main Page)

#### Security Alert Modal
| Element | ID | Type | Event |
|---------|----|----|-------|
| Dismiss button (if exists) | `hcp-security-dismiss-btn` | button | onclick |

#### Message Toast
| Element | ID | Type | Event |
|---------|----|----|-------|
| Toast container | `hcp-message-toast` | div | N/A (display only) |

#### Root Level
| Element | ID | Type | Event |
|---------|----|----|-------|
| Error panel container | `hcp-error-panel` | div | N/A |
| Error details toggle | `hcp-error-details-toggle` | button | onclick |

---

### 2. HostControlPanelHeader.razor

**No clickable elements** - Header is purely informational (logo, title, description)

---

### 3. HostControlPanelSidebar.razor

#### Session Controls Panel
| Element | ID | Type | Event |
|---------|----|----|-------|
| Start Session button | `sidebar-start-session-btn` | button | @onclick |

#### UserRegistrationLink Component (nested)
| Element | ID | Type | Event |
|---------|----|----|-------|
| Asset Canvas button | `reg-asset-canvas-btn` | button | @onclick |
| Transcript Canvas button | `reg-transcript-canvas-btn` | button | @onclick |

**Note**: SignalR status indicator is visual only (no click handler)

---

### 4. HostControlPanelContent.razor

#### Session Title Header (Sticky)
| Element | ID | Type | Event |
|---------|----|----|-------|
| Q&A Toggle button | `content-qa-toggle-btn` | button | @onclick, @onkeydown |

#### Transcript Panel
| Element | ID | Type | Event |
|---------|----|----|-------|
| FAB Share Transcript button | `content-fab-share-btn` | button | @onclick |
| End Session button | `content-end-session-btn` | button | @onclick |
| Transcript container | `content-transcript-container` | div | N/A (scroll container) |

#### Q&A Panel (Right Side)
| Element | ID | Type | Event |
|---------|----|----|-------|
| Q&A panel container | `content-qa-panel` | div | N/A (container) |
| Question cards | See QuestionCard section | - | - |

---

### 5. QuestionCard.razor (Nested in Q&A Panel)

**Dynamic IDs** - Each question gets index-based ID

| Element | ID Pattern | Type | Event |
|---------|-----------|------|-------|
| Question card container | `qa-card-{index}` | div | @onclick |
| Mark Answered button | `qa-answered-{index}` | button | @onclick |
| Delete button | `qa-delete-{index}` | button | @onclick |
| Vote count badge | `qa-votes-{index}` | div | N/A (display only) |

**Example**: For 3rd question (index=2):
- Card: `qa-card-2`
- Answered: `qa-answered-2`
- Delete: `qa-delete-2`
- Votes: `qa-votes-2`

---

### 6. HostControlPanelModal.razor

| Element | ID | Type | Event |
|---------|----|----|-------|
| Modal overlay | `modal-overlay` | div | N/A |
| Modal container | `modal-container` | div | N/A |
| Cancel button | `modal-cancel-btn` | button | @onclick |
| Confirm Delete button | `modal-confirm-btn` | button | @onclick |

---

### 7. UserRegistrationLink.razor (Standalone)

| Element | ID | Type | Event |
|---------|----|----|-------|
| Asset Canvas button | `reg-asset-canvas-btn` | button | @onclick |
| Transcript Canvas button | `reg-transcript-canvas-btn` | button | @onclick |
| Component container | `reg-link-container` | div | N/A |

**State Indicators**:
- `aria-pressed="true"` when selected
- Visual border/background change (no separate ID needed)

---

### 8. DebugPanel.razor (Development Only)

| Element | ID | Type | Event |
|---------|----|----|-------|
| Toggle button (floating) | `debug-toggle-btn` | button | @onclick |
| System info toggle | `debug-sysinfo-toggle` | button | @onclick |
| Debug action buttons | `debug-action-{index}` | button | @onclick |
| Panel container | `debug-panel-container` | div | N/A |

**Example Debug Actions** (index-based):
- `debug-action-0` = First debug action
- `debug-action-1` = Second debug action
- `debug-action-2` = Third debug action

---

## Implementation Guide

### Adding IDs to Components

#### 1. HostControlPanel.razor
```razor
<!-- Security Alert -->
<button id="hcp-security-dismiss-btn" type="button" @onclick="DismissAlert">
    Close
</button>

<!-- Message Toast -->
<div id="hcp-message-toast" class="hcp-message-toast">
    @messageText
</div>
```

#### 2. HostControlPanelSidebar.razor
```razor
<!-- Start Session Button -->
<button id="sidebar-start-session-btn" 
        type="button" 
        @onclick="OnStartSession">
    Start Session
</button>
```

#### 3. HostControlPanelContent.razor
```razor
<!-- Q&A Toggle -->
<button id="content-qa-toggle-btn"
        type="button"
        @onclick="OnToggleQAPanel"
        aria-controls="content-qa-panel">
    <i class="fa-solid fa-question"></i>
</button>

<!-- FAB Share Button -->
<button id="content-fab-share-btn"
        type="button"
        @onclick="OnBroadcastTranscript">
    <i class="fa-solid fa-share-nodes"></i>
</button>

<!-- End Session -->
<button id="content-end-session-btn"
        type="button"
        @onclick="OnEndSession">
    End Session
</button>

<!-- Transcript Container -->
<div id="content-transcript-container" 
     style="flex:1;overflow-y:auto;">
    @((MarkupString)OnRenderSafeHtml(Model?.TransformedTranscript ?? ""))
</div>

<!-- Q&A Panel -->
<div id="content-qa-panel" class="host-qa-panel">
    <!-- Question cards render here -->
</div>
```

#### 4. QuestionCard.razor
```razor
<!-- Question Card with Dynamic ID -->
<div id="qa-card-@Index" 
     @onclick="HandleQuestionClick">
    
    <!-- Vote Badge -->
    <div id="qa-votes-@Index">
        @Question.VoteCount
    </div>
    
    <!-- Mark Answered -->
    <button id="qa-answered-@Index"
            type="button"
            @onclick="HandleApproveClick">
        <i class="fa-solid fa-check"></i>
    </button>
    
    <!-- Delete -->
    <button id="qa-delete-@Index"
            type="button"
            @onclick="HandleDeleteClick">
        <i class="fa-solid fa-trash-can"></i>
    </button>
</div>
```

#### 5. HostControlPanelModal.razor
```razor
<div id="modal-overlay">
    <div id="modal-container">
        <button id="modal-cancel-btn" 
                type="button" 
                @onclick="OnCancelDelete">
            Cancel
        </button>
        <button id="modal-confirm-btn" 
                type="button" 
                @onclick="OnConfirmDelete">
            Delete
        </button>
    </div>
</div>
```

#### 6. UserRegistrationLink.razor
```razor
<div id="reg-link-container">
    <!-- Asset Canvas -->
    <button id="reg-asset-canvas-btn"
            type="button"
            @onclick="CopyAssetCanvasLink"
            aria-pressed="@(selectedCanvas == "asset")">
        <i class="fa-solid fa-comments"></i>
    </button>
    
    <!-- Transcript Canvas -->
    <button id="reg-transcript-canvas-btn"
            type="button"
            @onclick="CopyTranscriptCanvasLink"
            aria-pressed="@(selectedCanvas == "transcript")">
        <i class="fa-solid fa-scroll"></i>
    </button>
</div>
```

#### 7. DebugPanel.razor
```razor
<!-- Toggle Button -->
<button id="debug-toggle-btn" 
        @onclick="TogglePanel">
    <i class="fas fa-bug"></i>
</button>

<!-- System Info Toggle -->
<button id="debug-sysinfo-toggle" 
        @onclick="ToggleDetails">
    System Info
</button>

<!-- Debug Actions (Dynamic) -->
@foreach (var action in DebugActions.Select((a, i) => new { Action = a, Index = i }))
{
    <button id="debug-action-@action.Index" 
            @onclick="@(() => HandleDebugAction(action.Action))">
        @action.Action.Name
    </button>
}
```

---

## Testing Support

### Playwright Selectors

```typescript
// Direct ID selection
await page.locator('#sidebar-start-session-btn').click();

// Question card by index
await page.locator('#qa-card-0').click();

// Canvas selection
await page.locator('#reg-asset-canvas-btn').click();

// Modal actions
await page.locator('#modal-confirm-btn').click();
```

### Accessibility Testing

```typescript
// Check ARIA attributes
const qaToggle = page.locator('#content-qa-toggle-btn');
await expect(qaToggle).toHaveAttribute('aria-controls', 'content-qa-panel');

// Check button pressed state
const assetBtn = page.locator('#reg-asset-canvas-btn');
await expect(assetBtn).toHaveAttribute('aria-pressed', 'true');
```

---

## ID Summary by Component

### Total Interactive Elements: **20+ base elements + dynamic question cards**

| Component | Element Count | ID Prefix |
|-----------|---------------|-----------|
| HostControlPanel | 3 | `hcp-` |
| HostControlPanelHeader | 0 | `header-` |
| HostControlPanelSidebar | 1 | `sidebar-` |
| HostControlPanelContent | 4 | `content-` |
| QuestionCard | 3 per card | `qa-` |
| HostControlPanelModal | 2 | `modal-` |
| UserRegistrationLink | 2 | `reg-` |
| DebugPanel | 3 + N actions | `debug-` |

---

## JavaScript Interop Elements

**Note**: Elements injected via JavaScript (share buttons in transcript) use separate ID scheme:

```javascript
// Share asset buttons (injected dynamically)
<button id="share-asset-{assetId}-{instanceNumber}">Share</button>

// Transcript section share buttons
<button id="share-section-{sectionId}">Share Section</button>
```

**Excluded from this map** as per user request to ignore session transcript-related elements.

---

## Validation Checklist

- [x] All IDs are simple (no GUIDs, no complex escaping)
- [x] All IDs are unique across the entire view
- [x] Dynamic IDs use index-based patterns
- [x] Component prefixes prevent naming conflicts
- [x] ARIA attributes included where appropriate
- [x] IDs support automated testing
- [x] IDs work with keyboard navigation
- [x] Session transcript elements excluded

---

## Next Steps

1. **Apply IDs**: Update each component file with corresponding IDs
2. **Test**: Verify no duplicate IDs using browser DevTools
3. **Document**: Update component documentation with ID references
4. **Playwright**: Create test suite using these selectors
5. **Accessibility**: Run axe-core validation on ID attributes

---

**End of ID Map**
