# Host Control Panel Q&A Issues - Implementation Summary

**Work Item:** `hcp-questions`  
**Completed:** 2024-01-XX  
**Debug Level:** trace (with cleanup markers)

---

## Issues Fixed

### Issue #1: Question Duplication on HostControlPanel
**Problem:** Questions broadcasted from SessionCanvas appeared twice on HostControlPanel Q&A Panel

**Root Cause:**  
- HostControlPanel subscribed to BOTH `HostQuestionAlert` and `QuestionReceived` events
- When a question was submitted, QuestionController broadcasted to both events
- Each handler added the question to the UI, causing duplicates

**Solution:**
1. **Removed** `HostQuestionAlert` event handler entirely from HostControlPanel.razor (lines 210-300)
2. **Consolidated** to single `QuestionReceived` handler with duplicate prevention:
   ```csharp
   var existingQuestion = Model.Questions.FirstOrDefault(q => q.Id.ToString() == questionId);
   if (existingQuestion != null) return;  // Prevent duplicates from race conditions
   ```
3. **Moved** toast notification from HostQuestionAlert to QuestionReceived handler

**Files Modified:**
- `HostControlPanel.razor` (lines 210-350)

---

### Issue #2: Checkbox Not Removing Questions + Missing Toast Notifications
**Problem:**  
- Clicking checkbox on HostControlPanel only toggled UI flag, didn't remove question
- No SignalR broadcast to participants
- Original asker not notified their question was answered

**Solution Implemented:**

#### 2.1 HostControlPanel.razor (lines 1686-1730)
Updated `MarkQuestionAnswered` method:
```csharp
private async Task MarkQuestionAnswered(Guid questionId)
{
    var question = Model.Questions.FirstOrDefault(q => q.Id == questionId);
    if (question != null)
    {
        var originalAskerGuid = question.UserGuid;  // Capture before removal
        Model.Questions.Remove(question);  // Remove from UI
        await InvokeAsync(StateHasChanged);
        
        // Broadcast to all participants via SignalR
        await hubConnection.InvokeAsync("BroadcastQuestionAnswered", 
            SessionId.Value, 
            questionId.ToString(), 
            originalAskerGuid);
    }
}
```

#### 2.2 SessionHub.cs (lines 337-360)
Created new hub method:
```csharp
public async Task BroadcastQuestionAnswered(int sessionId, string questionId, string originalAskerGuid)
{
    var sessionGroup = $"session_{sessionId}";
    await Clients.Group(sessionGroup)
        .SendAsync("QuestionAnswered", new 
        { 
            QuestionId = questionId, 
            OriginalAskerGuid = originalAskerGuid,
            AnsweredAt = DateTime.UtcNow,
            SessionId = sessionId
        });
}
```

#### 2.3 SessionCanvas.razor (lines 2644-2695)
Added `QuestionAnswered` event handler:
```csharp
hubConnection.On<object>("QuestionAnswered", async (answerData) =>
{
    // Parse payload (camelCase from SignalR)
    var questionId = root.GetProperty("questionId").GetString();
    var originalAskerGuid = root.GetProperty("originalAskerGuid").GetString();
    
    // Remove from participant list
    var question = Model.Questions.FirstOrDefault(q => q.Id.ToString() == questionId);
    if (question != null)
    {
        Model.Questions.Remove(question);
        
        // Show toast ONLY to original asker
        if (!string.IsNullOrEmpty(CurrentUserGuid) && CurrentUserGuid == originalAskerGuid)
        {
            await JSRuntime.InvokeVoidAsync("showNoorToast", 
                "The host has addressed your question during the session.", 
                "Question Answered", 
                "success");
        }
        
        await InvokeAsync(StateHasChanged);
    }
});
```

**Files Modified:**
- `HostControlPanel.razor` (lines 1686-1730)
- `SessionHub.cs` (lines 318-360)
- `SessionCanvas.razor` (lines 2644-2695)

---

### Issue #3: Delete Button Not Broadcasting + Missing Toast Notifications
**Problem:**  
- Delete button removed question but didn't inform original asker
- QuestionDeleted broadcast didn't include `originalAskerGuid` for toast targeting

**Solution Implemented:**

#### 3.1 QuestionController.cs (lines 845-865)
Updated `QuestionDeleted` broadcast to include targeting data:
```csharp
await _sessionHub.Clients.Group(sessionGroup)
    .SendAsync("QuestionDeleted", new 
    { 
        QuestionId = questionId, 
        SessionId = session.SessionId, 
        OriginalAskerGuid = request.UserGuid,  // [FIX-ISSUE-3] For toast targeting
        DeletedBy = "host"  // [FIX-ISSUE-3] Indicate host deletion vs self-delete
    });
```

#### 3.2 SessionCanvas.razor (lines 2730-2760)
Updated `QuestionDeleted` event handler to show toast:
```csharp
hubConnection.On<object>("QuestionDeleted", async (deleteData) =>
{
    // Parse payload
    var questionId = root.GetProperty("questionId").GetString();
    var originalAskerGuid = root.TryGetProperty("originalAskerGuid", out var askerProp) 
        ? askerProp.GetString() : null;
    
    // Remove question
    var question = Model.Questions.FirstOrDefault(q => q.QuestionId == questionId);
    if (question != null)
    {
        Model.Questions.Remove(question);
        
        // Show toast ONLY to original asker
        if (!string.IsNullOrEmpty(CurrentUserGuid) && CurrentUserGuid == originalAskerGuid)
        {
            await JSRuntime.InvokeVoidAsync("showNoorToast", 
                "The host has removed your question. It may be addressed differently or outside this Q&A session.", 
                "Question Removed", 
                "info");
        }
        
        await InvokeAsync(StateHasChanged);
    }
});
```

**Files Modified:**
- `QuestionController.cs` (lines 845-865)
- `SessionCanvas.razor` (lines 2730-2760)

---

## Technical Architecture

### SignalR Event Flow

#### Question Answered Flow:
```
HostControlPanel.MarkQuestionAnswered()
    ↓ Remove from local UI
    ↓ Call hubConnection.InvokeAsync("BroadcastQuestionAnswered")
    ↓
SessionHub.BroadcastQuestionAnswered()
    ↓ Clients.Group(session_{sessionId}).SendAsync("QuestionAnswered", payload)
    ↓
SessionCanvas QuestionAnswered handler
    ↓ Remove from local UI
    ↓ Check: CurrentUserGuid == originalAskerGuid?
    ↓ YES: Show success toast "Question Answered"
    ↓ NO: Silent removal
```

#### Question Deleted Flow:
```
QuestionController.DeleteQuestion()
    ↓ Remove from database
    ↓ _sessionHub.Clients.Group().SendAsync("QuestionDeleted", payload)
    ↓
SessionCanvas QuestionDeleted handler
    ↓ Remove from local UI
    ↓ Check: CurrentUserGuid == originalAskerGuid?
    ↓ YES: Show info toast "Question Removed"
    ↓ NO: Silent removal
```

### Key Design Patterns

1. **Toast Targeting:**
   - Broadcast includes `OriginalAskerGuid` in payload
   - Each client compares `CurrentUserGuid == originalAskerGuid`
   - Only matching user sees toast notification

2. **Duplicate Prevention:**
   - Before adding question, check: `if (Model.Questions.Any(q => q.Id == questionId)) return;`
   - Handles SignalR race conditions and reconnection scenarios

3. **Logging Strategy:**
   - All changes use `[DEBUG-WORKITEM:hcp-questions:*]` markers
   - Suffixed with `;CLEANUP_OK` for easy removal after testing
   - Trace level logs include: payload parsing, user matching, toast decisions

---

## Testing Checklist

### Issue #1: Duplication
- [ ] Submit question from SessionCanvas
- [ ] Verify question appears **ONCE** on HostControlPanel
- [ ] Verify question appears **ONCE** on SessionCanvas participant view
- [ ] Check logs: Should see `QuestionReceived` handler firing, no `HostQuestionAlert`

### Issue #2: Checkbox + Toast
- [ ] Host clicks checkbox next to question on HostControlPanel
- [ ] Verify question disappears from HostControlPanel immediately
- [ ] Verify question disappears from all participant SessionCanvas views
- [ ] Verify **ONLY** original asker sees success toast: "The host has addressed your question during the session."
- [ ] Verify other participants don't see any toast
- [ ] Check logs: `[hcp-questions:answered]` should show user match decision

### Issue #3: Delete + Toast
- [ ] Host clicks delete button next to question on HostControlPanel
- [ ] Verify question disappears from HostControlPanel immediately
- [ ] Verify question disappears from all participant SessionCanvas views
- [ ] Verify **ONLY** original asker sees info toast: "The host has removed your question..."
- [ ] Verify other participants don't see any toast
- [ ] Check logs: `[hcp-questions:delete]` should show user match decision

---

## Debug Log Cleanup

After successful testing, run cleanup to remove debug markers:

```powershell
# Pattern to search for:
\[DEBUG-WORKITEM:hcp-questions:.*?\] .*? ;CLEANUP_OK

# Files to clean:
- HostControlPanel.razor
- SessionCanvas.razor
- SessionHub.cs
- QuestionController.cs
```

**Note:** Keep structural changes (removed handlers, new methods), only remove verbose logging statements.

---

## Files Modified Summary

| File | Lines Modified | Changes |
|------|---------------|---------|
| `HostControlPanel.razor` | 210-350, 1686-1730 | Removed HostQuestionAlert handler, updated MarkQuestionAnswered |
| `SessionHub.cs` | 318-360 | Added BroadcastQuestionAnswered method |
| `SessionCanvas.razor` | 2644-2695, 2730-2760 | Added QuestionAnswered handler, updated QuestionDeleted handler |
| `QuestionController.cs` | 845-865 | Added OriginalAskerGuid to QuestionDeleted broadcast |

---

## Implementation Notes

1. **Backward Compatibility:**  
   - QuestionDeleted event now includes extra fields (`originalAskerGuid`, `deletedBy`)
   - Older clients ignore unknown fields (JSON deserialization tolerance)
   - No breaking changes to existing behavior

2. **Error Handling:**  
   - All handlers wrapped in try-catch with detailed logging
   - Null checks for `CurrentUserGuid`, `originalAskerGuid`, payload properties
   - Graceful degradation: missing data = no toast (silent failure)

3. **Performance:**  
   - Duplicate check uses LINQ `Any()` - O(n) but n is small (typical session has <50 questions)
   - Toast shown asynchronously, doesn't block UI updates
   - SignalR broadcasts fire-and-forget (non-blocking)

4. **Future Enhancements:**  
   - Consider database flag for "answered" vs "deleted" status (currently removed immediately)
   - Add question history/archive feature for hosts
   - Implement undo functionality for accidental deletions

---

**Status:** ✅ All three issues implemented and ready for testing  
**Next Step:** Run integration tests with multiple participants to verify toast targeting
