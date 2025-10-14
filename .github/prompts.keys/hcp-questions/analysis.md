# HCP Questions - Debug & Fix

**Key**: `hcp-questions`  
**Debug Level**: `trace`  
**Verbosity**: `concise`  
**Created**: 2025-01-14  
**Status**: `in-progress`

---

## Task Overview

Fix three critical issues with Q&A functionality on Host Control Panel:

1. **Question Duplication**: Questions broadcasted from SessionCanvas appear twice on HostControlPanel
2. **Checkbox Functionality**: Host clicking checkbox should remove question from both host and all participants + show toast to original asker
3. **Delete Button**: Should remove from all lists + notify original asker

---

## Architecture Analysis

### SignalR Event Flow (Current State)

```
QuestionController.SubmitQuestion()
  ↓
  Broadcasts TWO events:
  1. QuestionReceived → session_{sessionId} group (ALL participants INCLUDING host)
  2. HostQuestionAlert → Host_{sessionId} group (host only)
  
HostControlPanel.razor subscribes to BOTH:
  - hubConnection.On<object>("HostQuestionAlert", ...) 
  - hubConnection.On<object>("QuestionReceived", ...)
  
Result: Same question added TWICE to Model.Questions list
```

### Current Handlers

**SessionCanvas.razor** (Lines 2410-2453):
- ✅ `QuestionReceived` - Adds questions to participant view
- ✅ `QuestionUpdated` - Updates question text
- ✅ `QuestionVoteUpdate` - Updates vote counts
- ✅ `QuestionDeleted` - Removes from participant list

**HostControlPanel.razor** (Lines 220-600):
- ❌ **DUPLICATE**: `HostQuestionAlert` (lines 220-300) 
- ❌ **DUPLICATE**: `QuestionReceived` (lines 330-435)
- ✅ `HostQuestionUpdated` - Updates question text
- ✅ `HostQuestionDeleted` - Removes from host list
- ⚠️ **INCOMPLETE**: `MarkQuestionAnswered` exists but doesn't remove/broadcast

---

## Issue #1: Question Duplication

### Root Cause
Both `HostQuestionAlert` and `QuestionReceived` handlers add the same question to `Model.Questions`.

### Evidence
```csharp
// Handler 1: HostQuestionAlert (line 220)
hubConnection.On<object>("HostQuestionAlert", async (questionData) => {
    Model?.Questions?.Add(newQuestion); // Adds question
});

// Handler 2: QuestionReceived (line 330)  
hubConnection.On<object>("QuestionReceived", async (questionData) => {
    Model.Questions.Add(newQuestion); // Adds SAME question again!
});
```

### Fix Strategy
**Option A** (Recommended): Remove `HostQuestionAlert` handler entirely
- Keep `QuestionReceived` for consistency with SessionCanvas
- Use toast notifications via `showQuestionToast` for host alerts

**Option B**: Keep `HostQuestionAlert`, remove `QuestionReceived`
- Requires host to NOT be in `session_{sessionId}` group
- Less consistent with participant behavior

### Implementation (Option A)
1. Remove lines 220-300 (`HostQuestionAlert` handler)
2. Move toast notification to `QuestionReceived` handler
3. Add duplicate check: `if (!Model.Questions.Any(q => q.Id.ToString() == questionId))`

---

## Issue #2: Checkbox (Mark Answered) Not Working

### Current State
- Checkbox calls `MarkQuestionAnswered(Guid questionId)` (line 1762)
- Method exists but only logs, doesn't remove or broadcast

### Required Behavior
1. Remove question from `Model.Questions` on host
2. Broadcast `QuestionAnswered` event to all participants via SignalR
3. SessionCanvas receives event, removes question from participant view
4. Show toast to original asker: "Your question has been answered by the host"

### Implementation

**Step 1**: Update `HostControlPanel.MarkQuestionAnswered`
```csharp
private async Task MarkQuestionAnswered(Guid questionId)
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    Logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] [{RequestId}] Marking question {QuestionId} as answered ;CLEANUP_OK", requestId, questionId);
    
    if (Model?.Questions == null || hubConnection?.State != HubConnectionState.Connected)
    {
        Logger.LogWarning("[DEBUG-WORKITEM:hcp-questions:answered] Cannot mark answered - Model.Questions or SignalR unavailable ;CLEANUP_OK");
        return;
    }
    
    // Find and remove question from host list
    var question = Model.Questions.FirstOrDefault(q => q.Id == questionId);
    if (question == null)
    {
        Logger.LogWarning("[DEBUG-WORKITEM:hcp-questions:answered] Question {QuestionId} not found in host list ;CLEANUP_OK", questionId);
        return;
    }
    
    var questionText = question.Text;
    var originalAsker = question.CreatedBy; // UserGuid of person who asked
    
    // Remove from host UI immediately
    Model.Questions.Remove(question);
    await InvokeAsync(StateHasChanged);
    
    Logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] Removed from host UI, broadcasting to participants ;CLEANUP_OK");
    
    // Broadcast to all participants
    try
    {
        await hubConnection.InvokeAsync("BroadcastQuestionAnswered", SessionId, questionId, originalAsker);
        Logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] Broadcast successful ;CLEANUP_OK");
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[DEBUG-WORKITEM:hcp-questions:answered] Broadcast failed: {Message} ;CLEANUP_OK", ex.Message);
    }
}
```

**Step 2**: Add `SessionHub.BroadcastQuestionAnswered` method
```csharp
/// <summary>
/// Broadcast that host answered a question - removes from all participants and shows toast to asker
/// </summary>
public async Task BroadcastQuestionAnswered(int sessionId, Guid questionId, string originalAskerGuid)
{
    var sessionGroupName = $"session_{sessionId}";
    
    _logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] Broadcasting QuestionAnswered to {Group} ;CLEANUP_OK", sessionGroupName);
    
    await Clients.Group(sessionGroupName).SendAsync("QuestionAnswered", new
    {
        questionId = questionId.ToString(),
        originalAskerGuid = originalAskerGuid,
        answeredAt = DateTime.UtcNow
    });
}
```

**Step 3**: Add `SessionCanvas.razor` handler for `QuestionAnswered`
```csharp
hubConnection.On<object>("QuestionAnswered", async (answerData) =>
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    Logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] [{RequestId}] QuestionAnswered event received ;CLEANUP_OK", requestId);
    
    try
    {
        var jsonString = System.Text.Json.JsonSerializer.Serialize(answerData);
        using var jsonDoc = System.Text.Json.JsonDocument.Parse(jsonString);
        var root = jsonDoc.RootElement;
        
        var questionId = root.TryGetProperty("questionId", out var qIdProp) ? qIdProp.GetString() : null;
        var originalAskerGuid = root.TryGetProperty("originalAskerGuid", out var askerProp) ? askerProp.GetString() : null;
        
        if (Model?.Questions != null && questionId != null)
        {
            var question = Model.Questions.FirstOrDefault(q => q.QuestionId == questionId);
            if (question != null)
            {
                // Remove from participant list
                Model.Questions.Remove(question);
                
                // Show toast if THIS user asked the question
                if (!string.IsNullOrEmpty(CurrentUserGuid) && CurrentUserGuid == originalAskerGuid)
                {
                    await JSRuntime.InvokeVoidAsync("showNoorToast", 
                        "The host has addressed your question during the session.", 
                        "Question Answered", 
                        "success");
                }
                
                await InvokeAsync(StateHasChanged);
                Logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:answered] [{RequestId}] Question {QuestionId} removed from participant view ;CLEANUP_OK", requestId, questionId);
            }
        }
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "[DEBUG-WORKITEM:hcp-questions:answered] [{RequestId}] Error processing QuestionAnswered: {Message} ;CLEANUP_OK", requestId, ex.Message);
    }
});
```

---

## Issue #3: Delete Button Not Broadcasting

### Current State
- Delete button shows modal, calls `DeleteConfirmed` (line 1817)
- Calls API `/api/Question/{questionId}/delete`
- API doesn't broadcast removal to participants

### Required Behavior
1. Delete from database
2. Broadcast removal to ALL participants (not just host)
3. Show toast to original asker: "The host chose not to address your question at this time"

### Implementation

**Step 1**: Update `QuestionController.DeleteQuestion`
```csharp
[HttpPost("{questionId}/delete")]
public async Task<IActionResult> DeleteQuestion(Guid questionId, [FromBody] DeleteQuestionRequest request)
{
    // ... existing validation code ...
    
    // After successful database delete, broadcast to ALL participants
    var questionData = JsonSerializer.Deserialize<JsonElement>(sessionData.Content);
    var originalAsker = questionData.TryGetProperty("userId", out var userProp) ? userProp.GetString() : null;
    
    try
    {
        var sessionGroup = $"session_{session.SessionId}";
        
        await _sessionHub.Clients.Group(sessionGroup).SendAsync("QuestionDeleted", new
        {
            questionId = questionId.ToString(),
            sessionId = session.SessionId,
            originalAskerGuid = originalAsker,
            deletedBy = "host"
        });
        
        _logger.LogInformation("[DEBUG-WORKITEM:hcp-questions:delete] Broadcasted QuestionDeleted to {Group} ;CLEANUP_OK", sessionGroup);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "[DEBUG-WORKITEM:hcp-questions:delete] SignalR broadcast failed ;CLEANUP_OK");
    }
    
    return Ok(new { Success = true, QuestionId = questionId });
}
```

**Step 2**: Update `SessionCanvas.razor` `QuestionDeleted` handler
```csharp
hubConnection.On<object>("QuestionDeleted", async (deleteData) =>
{
    // ... existing parsing code ...
    
    var originalAskerGuid = root.TryGetProperty("originalAskerGuid", out var askerProp) ? askerProp.GetString() : null;
    var deletedBy = root.TryGetProperty("deletedBy", out var deletedByProp) ? deletedByProp.GetString() : null;
    
    if (questionId != null)
    {
        var question = Model.Questions.FirstOrDefault(q => q.QuestionId == questionId);
        if (question != null)
        {
            Model.Questions.Remove(question);
            
            // Show toast if THIS user asked the question AND it was deleted by host
            if (!string.IsNullOrEmpty(CurrentUserGuid) && 
                CurrentUserGuid == originalAskerGuid && 
                deletedBy == "host")
            {
                await JSRuntime.InvokeVoidAsync("showNoorToast", 
                    "The host has removed your question. It may be addressed differently or outside this Q&A session.", 
                    "Question Removed", 
                    "info");
            }
            
            await InvokeAsync(StateHasChanged);
        }
    }
});
```

---

## Files Modified

1. **HostControlPanel.razor**
   - Remove `HostQuestionAlert` handler (lines ~220-300)
   - Update `MarkQuestionAnswered` method (line ~1762)
   - Add duplicate check to `QuestionReceived` handler

2. **SessionHub.cs**
   - Add `BroadcastQuestionAnswered` method
   - No changes needed for delete (handled by controller)

3. **QuestionController.cs**
   - Update `DeleteQuestion` to include `originalAskerGuid` in broadcast

4. **SessionCanvas.razor**
   - Add `QuestionAnswered` event handler
   - Update `QuestionDeleted` handler to show toast

---

## Testing Checklist

### Issue #1: Duplication
- [ ] Submit question from SessionCanvas
- [ ] Verify it appears ONCE on HostControlPanel (not twice)
- [ ] Verify toast shows on host
- [ ] Check browser console for duplicate logs

### Issue #2: Mark Answered
- [ ] Host clicks checkbox next to question
- [ ] Question disappears from host panel
- [ ] Question disappears from ALL participant panels
- [ ] Original asker sees toast: "Question Answered"
- [ ] Other participants don't see toast

### Issue #3: Delete Button
- [ ] Host clicks delete, confirms modal
- [ ] Question disappears from host panel
- [ ] Question disappears from ALL participant panels
- [ ] Original asker sees toast: "Question Removed"
- [ ] Other participants don't see toast

---

## Implementation Order

1. ✅ Analysis complete
2. ⏳ Fix Issue #1 (duplication) - Remove HostQuestionAlert handler
3. ⏳ Fix Issue #2 (checkbox) - Implement MarkQuestionAnswered flow
4. ⏳ Fix Issue #3 (delete) - Update delete broadcast
5. ⏳ Test all three issues
6. ⏳ Remove debug logs (debug-level: cleanup)

---

## Notes

- All fixes use existing `hubConnection` and SignalR infrastructure
- Toast notifications use existing `showNoorToast` JavaScript function
- `CurrentUserGuid` already tracked in SessionCanvas for ownership checks
- Checkbox/delete only work when host is authenticated (has SessionId)

