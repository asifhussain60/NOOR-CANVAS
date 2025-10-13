# Key: canvas-questions

## Metadata
- **Status**: in-progress
- **Created**: 2025-10-13T11:02:00Z
- **Last Updated**: 2025-10-13T11:02:00Z
- **Agent**: task
- **Priority**: high
- **Category**: bug-fix

## Issue Summary
Questions from other users are displaying as "Your Question" with edit/delete buttons instead of showing in orange without action buttons. Additionally, the upvote button and count are not visible on the left side of questions from other users.

## Expected Behavior
- **Own Questions**: Green background (#ECFDF5), "Your Question" label, edit/delete buttons visible, upvote section HIDDEN
- **Others' Questions**: Orange background (#FFF7ED), NO label, NO buttons, upvote section VISIBLE on left

## Investigation Status

### Trace Logging Added (Commit: 160b8b7c)
Comprehensive trace-level debug logging added to track ownership detection flow:

1. **CurrentUserGuid Initialization** (`SessionCanvas.razor:1457`)
   - Logs when UserGuid is set from participant API

2. **Question Submission** (`SessionCanvas.razor:1845`, `QuestionController.cs:136`)
   - Logs CurrentUserGuid being sent to API
   - Logs participant lookup and userId assignment

3. **SignalR Broadcast** (`QuestionController.cs:180`)
   - Logs question broadcast with userId

4. **SignalR Reception** (`SessionCanvas.razor:2150`)
   - Logs incoming userId vs CurrentUserGuid comparison
   - Logs IsMyQuestion calculation

5. **Question Rendering** (`SessionCanvas.razor:939`)
   - Logs ownership determination
   - Logs background color selection

### Playwright Test Created
**File**: `Tests/UI/canvas-questions-ownership-bug.spec.ts`
**Purpose**: Multi-user ownership verification test
**Scenario**:
- Two isolated browser contexts (User A, User B)
- User A submits question → verifies green background, "Your Question" label, edit/delete buttons, hidden upvote
- User B views question → verifies orange background, NO label, NO buttons, visible upvote
- User B upvotes → verifies vote count increments
- User A verifies cannot upvote own question

### Root Cause Hypothesis
All users in the same session may be receiving/storing the SAME `CurrentUserGuid`, causing everyone to think they own all questions. Possible causes:
1. **Shared browser storage** - Multiple tabs/browsers reading same localStorage value
2. **API returning wrong UserGuid** - `/api/participant/session/{token}/me` may return consistent GUID across browsers
3. **UserGuid initialization race condition** - CurrentUserGuid being overwritten during SignalR processing

### Code Flow Analysis

#### Database Schema (`canvas.Participants`)
```sql
- ParticipantId (INT IDENTITY, PK)
- SessionId (INT, FK → canvas.Sessions)
- UserGuid (NVARCHAR(256), NULLABLE)  ← Used for ownership tracking
- Name (NVARCHAR(100))
- Email (NVARCHAR(255))
- Country (NVARCHAR(100))
- JoinedAt (DATETIME2)
- UserToken (VARCHAR(8))
```

#### API Flow (`QuestionController.cs`)
```csharp
// Line 122: Lookup participant by UserGuid
var participant = await _context.Participants
    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserGuid == request.UserGuid);

// Line 133: Create question data with participant's UserGuid
var questionData = new {
    questionId = Guid.NewGuid(),
    text = request.QuestionText,
    userName = participant.Name ?? "Anonymous",
    userId = participant.UserGuid,  ← KEY: This is broadcast via SignalR
    submittedAt = DateTime.UtcNow,
    votes = 0,
    isAnswered = false
};

// Line 180: Broadcast to all session participants
await _sessionHub.Clients.Group(sessionGroup)
    .SendAsync("QuestionReceived", questionData);
```

#### SignalR Reception (`SessionCanvas.razor`)
```csharp
// Line 2125: QuestionReceived handler
hubConnection.On<object>("QuestionReceived", async (questionData) => {
    var question = new QuestionData {
        CreatedBy = root.TryGetProperty("userId", out var userIdProp) ? userIdProp.GetString() ?? "" : "",
        IsMyQuestion = root.TryGetProperty("userId", out var myUserIdProp) ? 
            (myUserIdProp.GetString() == CurrentUserGuid) : false  ← KEY COMPARISON
    };
});
```

#### Rendering Logic (`SessionCanvas.razor`)
```csharp
// Line 933: Render loop
var isMyQuestion = question.IsMyQuestion;
var bgColor = isMyQuestion ? "#ECFDF5" : "#FFF7ED";  // Green : Orange
var borderColor = isMyQuestion ? "#006400" : "#CC5500";

// Line 944: Conditional upvote section
@if (!isMyQuestion) {
    <div class="canvas-question-vote-section">
        <button>Upvote</button>
        <span>@question.Votes</span>
    </div>
}

// Line 976: "Your Question" label
@if (isMyQuestion) {
    <span class="canvas-question-owner-label">Your Question</span>
}
```

## File Mappings
### Primary Files
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - UI ownership rendering logic
- `SPA/NoorCanvas/Controllers/QuestionController.cs` - API question submission
- `Tests/UI/canvas-questions-ownership-bug.spec.ts` - Multi-user ownership test

### Supporting Files
- `SPA/NoorCanvas/Models/Simplified/SessionData.cs` - Question storage model
- `Workspaces/Scripts/KSESSIONS_Canvas_Migration_Script.sql` - Database schema

## Changes Made

### Commit: 160b8b7cad534a98011838d8e98cc3a41fba48ec
**Date**: 2025-10-13T11:02:00Z
**Message**: Add trace-level debug logging for canvas questions ownership bug investigation

**Files Modified**:
1. `SPA/NoorCanvas/Pages/SessionCanvas.razor`
   - Added `[DEBUG-WORKITEM:canvas-questions:ownership]` log on CurrentUserGuid initialization (line 1457)
   - Added ownership tracking log in SubmitQuestion (line 1845)
   - Added ownership comparison log in QuestionReceived handler (line 2150)
   - Added rendering ownership log in question loop (line 939)

2. `SPA/NoorCanvas/Controllers/QuestionController.cs`
   - Added ownership tracking log in question creation (line 136)
   - Added SignalR broadcast log with userId (line 180)

3. `Tests/UI/canvas-questions-ownership-bug.spec.ts`
   - Created comprehensive multi-user ownership verification test
   - Tests User A (owner) sees green + edit/delete + no upvote
   - Tests User B (viewer) sees orange + no buttons + upvote visible
   - Tests voting functionality

## Next Steps

### Investigation Phase
1. **Run application with trace logging enabled**
2. **Open two different browsers** (Chrome, Firefox) or incognito windows
3. **Both users join Session 212** (token: SESS0212)
4. **User A submits a question**
5. **Analyze logs** to verify:
   - User A and User B have DIFFERENT `CurrentUserGuid` values
   - SignalR broadcasts correct `userId` (User A's GUID)
   - User B's comparison correctly identifies NOT their question
6. **Run Playwright test** to reproduce bug automatically

### Expected Findings
The logs will reveal one of these issues:
- **Scenario A**: Both users have SAME CurrentUserGuid → Fix participant API
- **Scenario B**: SignalR broadcasts wrong userId → Fix broadcast logic
- **Scenario C**: Comparison logic broken → Fix IsMyQuestion calculation
- **Scenario D**: Storage collision → Fix sessionStorage key scoping

### Fix Implementation (Pending Investigation Results)
Once root cause is confirmed, implement fix in appropriate layer:
- **API Layer**: Fix `/api/participant/session/{token}/me` endpoint
- **Storage Layer**: Fix UserGuid persistence in sessionStorage/localStorage
- **SignalR Layer**: Fix question broadcast userId propagation
- **UI Layer**: Fix IsMyQuestion comparison logic

## Test Strategy

### Manual Testing
1. Start application: `dotnet run` (in `SPA/NoorCanvas`)
2. Open Chrome: Navigate to `http://localhost:9090/user/landing/SESS0212`
3. Register as "User A" from "United States"
4. Open Firefox: Navigate to `http://localhost:9090/user/landing/SESS0212`
5. Register as "User B" from "Canada"
6. User A submits: "What is Tawheed?"
7. Check User A sees: Green background, "Your Question", edit/delete buttons, no upvote
8. Check User B sees: Orange background, no label, no buttons, upvote button visible
9. User B clicks upvote → verify count = 1
10. Review console logs for ownership tracking

### Automated Testing
```bash
# Run Playwright test
npx playwright test Tests/UI/canvas-questions-ownership-bug.spec.ts --headed
```

## Debug Log Search Patterns
Use these grep patterns to extract relevant logs:

```bash
# Track UserGuid initialization
grep "canvas-questions:ownership.*CurrentUserGuid SET"

# Track question submissions
grep "canvas-questions:ownership.*Submitting question"

# Track API question creation
grep "canvas-questions:ownership.*Question created in API"

# Track SignalR broadcasts
grep "canvas-questions:ownership.*Broadcasting QuestionReceived"

# Track SignalR reception
grep "canvas-questions:ownership.*QuestionReceived.*IncomingUserId"

# Track rendering
grep "canvas-questions:ownership.*Rendering question"
```

## Related Issues
- Upvote button visibility (related to same ownership detection bug)
- Question styling (green vs orange background)
- Edit/delete button visibility

## Dependencies
- SignalR (Microsoft.AspNetCore.SignalR)
- Playwright (testing)
- Entity Framework Core (database access)
- Session 212 (SESS0212) test data

## Notes
- Application runs on `http://localhost:9090` (port 9090) per launchSettings.json
- Session 212 is canonical test session from `PlaywrightTestPaths.MD`
- UserGuid is stored in sessionStorage key: `noor_user_guid_{SessionToken}`
- Ownership detection happens in real-time via SignalR, not on page load
