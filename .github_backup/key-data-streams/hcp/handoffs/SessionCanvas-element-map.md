# SessionCanvas - Clickable Elements Map

**Component**: SessionCanvas.razor  
**File**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`  
**Generated**: 2025-11-01  
**Key**: `canvas`

---

## Summary

**Total Elements**: 12  
**Components Analyzed**: 1 (SessionCanvas)  
**IDs Required**: 12 (all need IDs added)  
**IDs Existing**: 0

---

## Element Inventory

### Header Section

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `canvas-home-btn` | button | @onclick | - | Return Home button (error state) |
| Button | - | `canvas-retry-signalr-btn` | button | @onclick | - | Retry SignalR connection button |

### Q&A Panel (Ask Question)

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Textarea | - | `canvas-question-input` | textarea | @bind, @onkeydown | placeholder | Question text input (3 rows, word-wrap) |
| Button | - | `canvas-question-submit-btn` | button | @onclick | - | Submit/Update question button (golden gradient) |

### Sidebar Tabs

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `canvas-tab-qa-btn` | button | @onclick | - | Switch to Q&A tab |
| Button | - | `canvas-tab-participants-btn` | button | @onclick | - | Switch to Participants tab |

### Question Cards (Dynamic)

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `canvas-question-edit-{index}` | span | @onclick | - | Edit question button (own questions only) |
| Button | - | `canvas-question-delete-{index}` | span | @onclick | - | Delete question button (own questions only) |
| Button | - | `canvas-question-vote-{questionId}` | button | @onclick | data-question-id | Vote/upvote button (sienna theme) |

### Confirmation Modal

| Element | Current ID | Suggested ID | Type | Event | ARIA | Description |
|---------|-----------|--------------|------|-------|------|-------------|
| Button | - | `canvas-modal-delete-btn` | button | @onclick | - | Confirm deletion button (red) |
| Button | - | `canvas-modal-cancel-btn` | button | @onclick | - | Cancel deletion button (gray) |

---

## Implementation Guide

### Adding IDs to Main Elements

**File**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`

```razor
<!-- Error State Home Button -->
<button id="canvas-home-btn" 
        @onclick="NavigateHome" 
        class="canvas-home-button">
    <i class="fa-solid fa-home canvas-home-button-icon"></i>
    Return Home
</button>

<!-- SignalR Retry Button -->
<button id="canvas-retry-signalr-btn" 
        @onclick="RetrySignalRConnection" 
        class="canvas-retry-button">
    <i class="fa-solid fa-arrow-rotate-right canvas-retry-icon"></i>
    Retry Connection
</button>
```

### Adding IDs to Q&A Form

```razor
<!-- Question Input -->
<textarea id="canvas-question-input"
          rows="3"
          @bind="QuestionInput" 
          @onkeydown="HandleQuestionKeyDown"
          class="canvas-form-textarea"
          placeholder="Ask a question..."></textarea>

<!-- Submit Button -->
<button id="canvas-question-submit-btn"
        @onclick="SubmitQuestion" 
        type="button"
        class="canvas-form-submit-button shadow-golden">
    <i class="fa-solid fa-paper-plane canvas-form-submit-icon"></i>
    <span class="canvas-form-submit-text">Submit</span>
</button>
```

### Adding IDs to Tab Buttons

```razor
<!-- Q&A Tab -->
<button id="canvas-tab-qa-btn"
        @onclick="() => ActiveTab = Tab.QA" 
        class="canvas-tab-button canvas-tab-button-left">
    <i class="fa-solid fa-question-circle canvas-tab-icon"></i>
    Q&A
</button>

<!-- Participants Tab -->
<button id="canvas-tab-participants-btn"
        @onclick="() => ActiveTab = Tab.Participants" 
        class="canvas-tab-button canvas-tab-button-right">
    <i class="fa-solid fa-users canvas-tab-icon"></i>
    Participants
</button>
```

### Adding IDs to Question Card Actions

```razor
<!-- Edit Button (Own Questions) -->
<span id="canvas-question-edit-@index" 
      @onclick="() => EditQuestion(index)" 
      class="canvas-question-edit-button">
    <i class="fa-solid fa-pen"></i>
</span>

<!-- Delete Button (Own Questions) -->
<span id="canvas-question-delete-@index" 
      @onclick="() => ShowDeleteModal(index)" 
      class="canvas-question-delete-button">
    <i class="fa-solid fa-trash-can"></i>
</span>

<!-- Vote Button (Other's Questions) -->
<button id="canvas-question-vote-@question.QuestionId"
        @onclick="async () => await VoteQuestion(question.QuestionId)" 
        data-question-id="@question.QuestionId"
        class="canvas-question-vote-button">
    <i class="fa-solid fa-thumbs-up"></i>
</button>
```

### Adding IDs to Modal Buttons

```razor
<!-- Delete Confirmation Modal -->
<button id="canvas-modal-delete-btn" 
        @onclick="DeleteConfirmed" 
        class="canvas-modal-button canvas-modal-button-delete">
    Delete
</button>

<button id="canvas-modal-cancel-btn" 
        @onclick="CancelDelete" 
        class="canvas-modal-button canvas-modal-button-cancel">
    Cancel
</button>
```

---

## Playwright Selectors

```typescript
// Navigation
await page.locator('#canvas-home-btn').click();
await page.locator('#canvas-retry-signalr-btn').click();

// Q&A Interaction
await page.locator('#canvas-question-input').fill('My question');
await page.locator('#canvas-question-submit-btn').click();

// Tab Navigation
await page.locator('#canvas-tab-qa-btn').click();
await page.locator('#canvas-tab-participants-btn').click();

// Question Actions (Dynamic)
await page.locator('#canvas-question-edit-0').click();
await page.locator('#canvas-question-delete-1').click();
await page.locator('#canvas-question-vote-abc123').click();

// Modal Interaction
await page.locator('#canvas-modal-delete-btn').click();
await page.locator('#canvas-modal-cancel-btn').click();

// Advanced Selectors
await page.locator('[data-question-id="abc123"]').click(); // Vote button by data attribute
await page.locator('#canvas-question-input').press('Enter'); // Submit via keyboard
```

---

## Related Files

- **Component**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- **Tests**: `.github/key-data-streams/canvas/tests/`
- **CSS**: `SPA/NoorCanvas/wwwroot/css/session-transcript.css`

---

**Generated by**: ui-map.prompt.md v1.0.0  
**KDS Compliance**: Rule #2 (Document First), Rule #2b (Test Metadata)
