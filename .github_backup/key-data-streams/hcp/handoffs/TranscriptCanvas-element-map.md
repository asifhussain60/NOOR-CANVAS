# TranscriptCanvas - Clickable Elements Map

**Component**: TranscriptCanvas.razor  
**File**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`  
**Generated**: 2025-11-01  
**Key**: `transcript`

---

## Summary

**Total Elements**: 9  
**Components Analyzed**: 1 (TranscriptCanvas)  
**IDs Required**: 9 (all need IDs added)  
**IDs Existing**: 0

---

## Element Inventory

### Header Section

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `transcript-home-btn` | button | @onclick | - | Return Home button (error state) |
| Button | - | `transcript-retry-signalr-btn` | button | @onclick | - | Retry SignalR connection button |

### Question Modal Toggle

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `transcript-question-modal-toggle-btn` | button | @onclick | title | Open question modal button (purple, circular, 40px) |

### Question Modal (Popup)

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Textarea | - | `transcript-question-input` | textarea | @bind | placeholder | Question text input (4 rows, modal context) |
| Button | - | `transcript-question-submit-btn` | button | @onclick | - | Submit question button (golden, in modal) |
| Button | - | `transcript-question-cancel-btn` | button | @onclick | - | Cancel/close modal button (gray) |
| Div | - | `transcript-modal-overlay` | div | @onclick | - | Modal overlay (closes on click) |

### Confirmation Modal

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `transcript-modal-delete-btn` | button | @onclick | - | Confirm deletion button (red) |
| Button | - | `transcript-modal-cancel-delete-btn` | button | @onclick | - | Cancel deletion button (gray) |

---

## Implementation Guide

### Adding IDs to Header Buttons

**File**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

```razor
<!-- Error State Home Button -->
<button id="transcript-home-btn" 
        @onclick="NavigateHome" 
        class="canvas-home-button">
    <i class="fa-solid fa-home canvas-home-button-icon"></i>
    Return Home
</button>

<!-- SignalR Retry Button -->
<button id="transcript-retry-signalr-btn" 
        @onclick="RetrySignalRConnection" 
        class="canvas-retry-button">
    <i class="fa-solid fa-arrow-rotate-right canvas-retry-icon"></i>
    Retry Connection
</button>
```

### Adding IDs to Question Modal Toggle

```razor
<!-- Question Modal Toggle Button (Purple FAB) -->
<button id="transcript-question-modal-toggle-btn"
        @onclick="OpenQuestionModal" 
        class="canvas-sidebar-toggle"
        title="Ask a Question">
    <i class="fa-solid fa-comment-dots canvas-sidebar-toggle-icon"></i>
</button>
```

### Adding IDs to Question Modal Elements

```razor
<!-- Modal Overlay -->
<div id="transcript-modal-overlay" 
     class="canvas-modal-overlay" 
     @onclick="CloseQuestionModal">
    
    <div class="canvas-modal-content canvas-modal-question" 
         @onclick:stopPropagation="true">
        
        <h4 class="canvas-modal-title">Ask a Question</h4>
        
        <!-- Question Input -->
        <textarea id="transcript-question-input"
                  @bind="QuestionInput" 
                  class="canvas-form-textarea"
                  placeholder="Type your question here..."
                  rows="4"></textarea>
        
        <!-- Modal Buttons -->
        <div class="canvas-modal-buttons">
            <button id="transcript-question-submit-btn"
                    @onclick="SubmitQuestionFromModal" 
                    type="button"
                    class="canvas-form-submit-button">
                <i class="fa-solid fa-paper-plane canvas-form-submit-icon"></i>
                <span class="canvas-form-submit-text">Submit</span>
            </button>
            
            <button id="transcript-question-cancel-btn"
                    @onclick="CloseQuestionModal" 
                    type="button"
                    class="canvas-modal-button canvas-modal-button-cancel">
                Cancel
            </button>
        </div>
    </div>
</div>
```

### Adding IDs to Deletion Confirmation Modal

```razor
<!-- Confirmation Modal (Delete Question) -->
<div class="canvas-modal-overlay">
    <div class="canvas-modal-content">
        <h4 class="canvas-modal-title">Confirm Deletion</h4>
        <p class="canvas-modal-message">Are you sure you want to delete this question?</p>
        
        <div class="canvas-modal-buttons">
            <button id="transcript-modal-delete-btn" 
                    @onclick="DeleteConfirmed" 
                    class="canvas-modal-button canvas-modal-button-delete">
                Delete
            </button>
            
            <button id="transcript-modal-cancel-delete-btn" 
                    @onclick="CancelDelete" 
                    class="canvas-modal-button canvas-modal-button-cancel">
                Cancel
            </button>
        </div>
    </div>
</div>
```

---

## Playwright Selectors

```typescript
// Navigation
await page.locator('#transcript-home-btn').click();
await page.locator('#transcript-retry-signalr-btn').click();

// Question Modal Workflow
await page.locator('#transcript-question-modal-toggle-btn').click(); // Open modal
await page.locator('#transcript-question-input').fill('My question'); // Type question
await page.locator('#transcript-question-submit-btn').click(); // Submit
await page.locator('#transcript-question-cancel-btn').click(); // Or cancel

// Alternative: Close via overlay
await page.locator('#transcript-modal-overlay').click(); // Click outside to close

// Deletion Confirmation
await page.locator('#transcript-modal-delete-btn').click();
await page.locator('#transcript-modal-cancel-delete-btn').click();

// Assertions
await expect(page.locator('#transcript-question-modal-toggle-btn')).toBeVisible();
await expect(page.locator('#transcript-modal-overlay')).toHaveClass(/visible/);
```

---

## Related Files

- **Component**: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`
- **Tests**: `.github/key-data-streams/transcript/tests/`
- **CSS**: `SPA/NoorCanvas/wwwroot/css/session-transcript.css`

---

**Notes**:
- TranscriptCanvas uses **purple theme** (#8B5CF6) to distinguish from SessionCanvas (green)
- Question modal is **centered popup** (not sidebar like SessionCanvas)
- Modal overlay has `@onclick:stopPropagation` on content to prevent close on content clicks

---

**Generated by**: ui-map.prompt.md v1.0.0  
**KDS Compliance**: Rule #2 (Document First), Rule #2b (Test Metadata)
