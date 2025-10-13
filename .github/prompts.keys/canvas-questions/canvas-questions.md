# Key: canvas-questions

## Metadata
- **Status**: in-progress
- **Created**: 2025-10-13T11:02:00Z
- **Last Updated**: 2025-10-13T12:05:00Z
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

### Commit: d17cbfceaec7c40b595c452838c55c887016438d
**Date**: 2025-10-13T12:05:00Z
**Message**: style(canvas-questions): Reposition upvote section to bottom-right with smaller size and add 4px left border

**Summary**: Reorganized question card layout per user request - moved upvote section to bottom-right corner, made it smaller, gave question text full width, and added prominent 4px left border for better visual hierarchy.

**Layout Changes**:
1. **Vote Section Repositioning**:
   - Changed from inline left-side placement to absolute positioning at bottom-right
   - CSS: `position: absolute; bottom: 0.5rem; right: 0.5rem;`
   - Removed `margin-right: 1rem` (no longer needed)

2. **Vote Section Size Reduction**:
   - Button icon: `1.5rem` → `1.125rem` (25% smaller)
   - Badge padding: `0.25rem 0.625rem` → `0.1875rem 0.5rem`
   - Badge font-size: `0.875rem` → `0.75rem`
   - Badge min-width: `1.75rem` → `1.5rem`
   - Gap between icon and badge: `0.5rem` → `0.375rem`

3. **Question Content Full Width**:
   - Added `width: 100%` to `.canvas-question-content`
   - Content now spans entire card width (no space reserved for vote section)

4. **Border Enhancement**:
   - Card border changed from `1px` to `2px` on all sides
   - Left border specifically set to `4px` via `border-left-width: 4px`
   - Creates stronger visual anchor for question cards

5. **Card Padding Adjustment**:
   - Added `padding-bottom: 2.5rem` to `.canvas-question-item`
   - Prevents vote section from overlapping question content
   - Original padding: `1rem` all sides

6. **HTML Restructure**:
   - Moved `<div class="canvas-question-vote-section">` to END of card (after content)
   - Content renders first, vote section overlays at bottom-right
   - Maintains same conditional logic (own questions vs others' questions)

**Files Modified**:
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
  - **Lines 582-615**: Updated `.canvas-question-vote-section`, `.canvas-question-vote-button`, `.canvas-question-vote-count` CSS
  - **Lines 572-580**: Updated `.canvas-question-item` CSS (border, padding, position)
  - **Lines 620-625**: Updated `.canvas-question-content` CSS (width)
  - **Lines 950-1010**: Restructured HTML (moved vote section after content div)

**Visual Impact**:
- Cleaner, more balanced card appearance
- Upvote badge less prominent but remains fully functional
- Stronger left-side emphasis with 4px border (matches green/orange color coding)
- Question text has more breathing room without vote section on left
- Bottom-right placement follows common UI pattern for secondary actions

**Trace Logging Updates**:
- Updated log messages to indicate "bottom-right" positioning
- Helps distinguish new layout in debug output

**Design Rationale**:
- **Bottom-right placement**: Secondary action (upvoting) doesn't compete with primary content (question text)
- **Smaller size**: Reduces visual weight while maintaining touch-target accessibility
- **4px left border**: Reinforces green (own) vs orange (others') distinction
- **Full-width content**: Maximizes readability, especially for longer questions

### Commit: 737be47efeb1c088b603336193c9a42b31974656
**Date**: 2025-10-13T11:35:00Z
**Message**: style(canvas-questions): Apply HTML mockup styles - thumbs-up icon with red badge

**Summary**: Applied visual styles from HTML mockup reference (ContextCopilot.txt) to match the modern design. Changed upvote icon from arrow-up to thumbs-up and redesigned the vote count as a red notification badge displayed horizontally next to the icon.

**Visual Changes**:
1. **Icon Change**: `fa-arrow-up` → `fa-thumbs-up`
   - More intuitive and friendly icon
   - Matches social media conventions
   
2. **Badge Redesign**: Gold/brown badge → Red notification badge
   - Background: `#DC2626` (Red-600)
   - Text: `#FFFFFF` (White)
   - Added subtle shadow for depth
   - More prominent and attention-grabbing

3. **Layout Change**: Vertical stack → Horizontal row
   - Icon and count now side-by-side
   - Better visual balance
   - Cleaner, more compact design

**Files Modified**:
1. `SPA/NoorCanvas/Pages/SessionCanvas.razor`
   - **Lines 582-615**: Updated CSS classes
     - `.canvas-question-vote-section`: Changed `flex-direction: column` → default row
     - `.canvas-question-vote-count`: New red badge styling with shadow
     - Adjusted spacing and alignment
   
   - **Lines 945-978**: Updated HTML markup
     - Changed icon: `<i class="fa-solid fa-arrow-up">` → `<i class="fa-solid fa-thumbs-up">`
     - Removed inline `style="color:@upvoteColor"` from vote count span
     - Added tooltips for better UX:
       - "Upvote this question" (clickable state)
       - "Already voted" (disabled after voting)
       - "You cannot vote on your own question" (own questions)

**CSS Before & After**:
```css
/* BEFORE */
.canvas-question-vote-section {
    display: flex;
    flex-direction: column;  /* Vertical */
    align-items: center;
    gap: 0.25rem;
}

.canvas-question-vote-count {
    background-color: #C5B358;  /* Gold */
    color: #4B3C2B;             /* Brown */
}

/* AFTER */
.canvas-question-vote-section {
    display: flex;               /* Horizontal by default */
    align-items: center;
    gap: 0.5rem;                /* Increased spacing */
}

.canvas-question-vote-count {
    background-color: #DC2626;  /* Red */
    color: #FFFFFF;             /* White */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

**UX Improvements**:
- More intuitive thumbs-up gesture
- High-contrast red badge for better visibility
- Tooltips provide clear feedback on interaction state
- Horizontal layout reduces vertical space usage

**Design Reference**: HTML mockup from `Workspaces/Data/ContextCopilot.txt` lines 156-175 (orange question cards with upvote section)

### Commit: c84f796155e7230368a79af96db3ed767903b1d3
**Date**: 2025-10-13T11:28:00Z
**Message**: feat(canvas-questions): Show upvote count on both green and orange question cards with trace logging

**Summary**: Modified question rendering to display upvote counts for ALL questions (both own questions with green background and others' questions with orange background). Previously, only orange cards (others' questions) showed the upvote count, while green cards (own questions) had a hidden spacer. Now both show the actual vote count, with own questions displaying a disabled, non-interactive button.

**Files Modified**:
1. `SPA/NoorCanvas/Pages/SessionCanvas.razor`
   - **Lines 943-977**: Updated question rendering logic
     - Moved vote section outside conditional to show for ALL questions
     - For others' questions (`!isMyQuestion`): Clickable upvote button (disabled if already voted)
     - For own questions (`isMyQuestion`): Disabled upvote button with actual vote count (not hidden)
     - Changed `preventDefault` and `stopPropagation` to `true` for better event handling
     - Added trace logging for upvote button rendering (differentiates clickable vs non-clickable)
   
   - **Lines 1980-1988**: Added click event trace logging
     - Logs when user clicks upvote button (before validation)
     - Helps track user interaction flow
   
   - **Lines 2281-2310**: Enhanced QuestionVoteUpdated SignalR handler
     - Added trace logs for SignalR reception of vote updates
     - Logs old vote count vs new vote count
     - Logs UI refresh confirmation
   
   - **Lines 2322-2360**: Enhanced QuestionVoteUpdate SignalR handler (API format)
     - Added trace logs for alternative vote update event format
     - Logs vote count changes and UI refresh
     - Added better error logging

2. `SPA/NoorCanvas/Controllers/QuestionController.cs`
   - **Lines 289-295**: Added vote calculation trace logging
     - Logs current vote count before increment/decrement
     - Logs new vote count calculation
     - Logs vote direction (up/down)
   
   - **Lines 332-340**: Added SignalR broadcast trace logging
     - Logs before broadcasting vote update to session group
     - Logs after broadcast completes
     - Shows session ID, question ID, and new vote count

**Trace Logging Coverage**:
- ✅ Upvote button rendering (own vs others' questions)
- ✅ Upvote button click events
- ✅ Vote processing in API (current → new votes)
- ✅ SignalR vote update broadcasts
- ✅ SignalR vote update reception
- ✅ UI refresh after vote count changes

**Key Behavior Changes**:
- **BEFORE**: Own questions showed hidden spacer with "0" vote count
- **AFTER**: Own questions show ACTUAL vote count with disabled button
- **BEFORE**: `preventDefault="false"` and `stopPropagation="false"`
- **AFTER**: `preventDefault="true"` and `stopPropagation="true"`

**Testing Requirements**:
1. Open two browsers to Session 212 (SESS0212)
2. User A submits question → Verify green card shows vote count "0" with disabled button
3. User B sees question → Verify orange card shows vote count "0" with clickable button
4. User B clicks upvote → Verify both cards update to show "1"
5. User A refreshes → Verify green card still shows "1" with disabled button
6. Check logs for complete trace of vote flow from click → API → SignalR → UI

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
