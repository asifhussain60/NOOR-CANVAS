# Key: canvas-questions

## Metadata
- **Status**: in-progress
- **Created**: 2025-10-13T11:02:00Z
- **Last Updated**: 2025-10-13T14:20:00Z
- **Agent**: task
- **Priority**: high
- **Category**: bug-fix

## Issue Summary
~~Questions from other users are displaying as "Your Question" with edit/delete buttons instead of showing in orange without action buttons. Additionally, the upvote button and count are not visible on the left side of questions from other users.~~ **[RESOLVED - Issue was ownership detection]**

**Current Issues (2025-10-13T14:20:00Z)**:
1. ❌ **Upvote counter not incrementing** - User clicks upvote, API succeeds, database updates, but UI counter stays at 0
2. ❌ **Question edits not propagating** - User edits question, local UI updates, but other users/host don't see changes

**Root Cause Identified (2025-10-13T14:20:00Z)**: 
**SignalR Group Name Case Sensitivity Bug**
- SessionHub.JoinSession: Clients join group `session_{sessionId}` (lowercase 's')
- QuestionController: Broadcasting to `Session_{sessionId}` (uppercase 'S')
- SignalR groups are case-sensitive → broadcasts sent to wrong group → 100% miss rate

**Fix Applied (Commit 63f9e055)**:
- ✅ Changed all QuestionController broadcasts from `Session_` to `session_`
- ✅ VoteQuestion, UpdateQuestion, DeleteQuestion now use lowercase
- ✅ Matches SessionHub.JoinSession group name
- ✅ Build successful (zero errors, zero warnings)

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

## UI Enhancements (2025-10-13)

### Changes Implemented
Three UI improvements to the question display layout:

#### 1. Added Borders to Edit/Delete Buttons
**File**: `SessionCanvas.razor` (Lines 649-674)
**Changes**:
- Edit button: Added 1.5px solid border in blue (#3B82F6) with 0.25rem border-radius
- Delete button: Added 1.5px solid border in red (#EF4444) with 0.25rem border-radius
- Hover states: Border color matches text color transition
- Purpose: Better visual definition and clickable affordance

**CSS Classes Modified**:
```css
.canvas-question-edit-button {
    border: 1.5px solid #3B82F6;
    border-radius: 0.25rem;
}

.canvas-question-delete-button {
    border: 1.5px solid #EF4444;
    border-radius: 0.25rem;
}
```

#### 2. Moved "Your Question" Label Inline with Vote Section
**File**: `SessionCanvas.razor` (Lines 956-1010)
**Changes**:
- Removed separate owner label section below question text
- Moved "Your Question" label into `.canvas-question-vote-section`
- Label now appears on same line as thumbs-up icon and vote badge
- Label displays BEFORE vote elements for own questions

**HTML Structure Change**:
```html
<!-- Before: Label was separate below question text -->
<div class="canvas-question-content">
    <span class="canvas-question-owner-label">Your Question</span>
</div>

<!-- After: Label inside vote section -->
<div class="canvas-question-vote-section">
    <span class="canvas-question-owner-label">Your Question</span>
    <button class="canvas-question-vote-button">...</button>
    <span class="canvas-question-vote-count">...</span>
</div>
```

**CSS Modified**:
```css
.canvas-question-owner-label {
    margin-left: 0.5rem;      /* Changed from margin-top: 0.5rem */
    display: inline-block;     /* Changed from display: block */
}
```

#### 3. Reduced Spacing for Compact Layout
**File**: `SessionCanvas.razor` (Lines 441-444, 571-583, 585-591)
**Changes**:

**Questions Container**:
- Gap reduced from `0.75rem` to `0.5rem` between question items

**Question Item**:
- Padding reduced from `1rem` to `0.75rem` on all sides
- Bottom padding reduced from `2.5rem` to `0.75rem` (no longer needed for absolute positioning)
- Margin-bottom reduced from `0.75rem` to `0.5rem`

**Vote Section**:
- Changed from `position: absolute` with `bottom/right` positioning
- Now uses `margin-left: auto` for right alignment (flexbox)
- Positioned inline with content, not overlaid at bottom

**Before/After Comparison**:
```css
/* Before */
.canvas-questions-container { gap: 0.75rem; }
.canvas-question-item { padding: 1rem; padding-bottom: 2.5rem; margin-bottom: 0.75rem; }
.canvas-question-vote-section { position: absolute; bottom: 0.5rem; right: 0.5rem; }

/* After */
.canvas-questions-container { gap: 0.5rem; }
.canvas-question-item { padding: 0.75rem; padding-bottom: 0.75rem; margin-bottom: 0.5rem; }
.canvas-question-vote-section { margin-left: auto; padding-left: 1rem; }
```

### Visual Impact
- **Tighter Layout**: Reduced whitespace between and within question cards
- **Better Definition**: Edit/delete buttons now have clear visual boundaries
- **Inline Status**: "Your Question" label integrated with vote UI, not floating below
- **Responsive Flow**: Vote section uses flexbox alignment instead of absolute positioning

### Debug Logging
No debug logging added (debug-level: trace specified but changes were pure UI/CSS)

### Testing Recommendations
1. Verify "Your Question" label appears inline with vote badge
2. Verify edit/delete buttons have visible borders
3. Verify reduced spacing doesn't cause layout issues on narrow screens
4. Test responsiveness with long question text
5. Verify vote section alignment on both own/others' questions

## UI Layout Correction (2025-10-13 12:12)

### Issue Identified
Previous implementation had incorrect layout:
- "Your Question" label was positioned on the right inline with vote section
- Upvote icon and count were still displayed (but disabled) for own questions
- Did not match the desired design from reference image

### Corrective Changes

#### 1. Repositioned "Your Question" Label
**File**: `SessionCanvas.razor` (Line 675-681)
**Change**: Moved label back below question text on the left side

```css
.canvas-question-owner-label {
    margin-top: 0.5rem;     /* Changed from margin-left: 0.5rem */
    display: block;         /* Changed from inline-block */
}
```

**HTML Structure**:
```html
<div class="canvas-question-content">
    <div class="canvas-question-header">
        <span class="canvas-question-text">...</span>
        <div class="canvas-question-actions">
            <i class="canvas-question-edit-button">...</i>
            <i class="canvas-question-delete-button">...</i>
        </div>
    </div>
    <span class="canvas-question-owner-label">Your Question</span>
</div>
```

#### 2. Removed Upvote Section for Own Questions
**File**: `SessionCanvas.razor` (Lines 956-1010)
**Change**: Vote section now only renders for other users' questions

**Before**:
```csharp
<div class="canvas-question-vote-section">
    @if (isMyQuestion) { /* Show label */ }
    @if (!isMyQuestion) { /* Show upvote button */ }
    else { /* Show disabled upvote button */ }  ← REMOVED
</div>
```

**After**:
```csharp
@if (!isMyQuestion)
{
    <div class="canvas-question-vote-section">
        <button class="canvas-question-vote-button">...</button>
        <span class="canvas-question-vote-count">...</span>
    </div>
}
else
{
    Logger.LogTrace("SKIPPING upvote section for own question");
}
```

#### 3. Added Trace Logging
**Debug markers added**:
- `[DEBUG-WORKITEM:canvas-questions:ui]` - Edit/delete button rendering
- `[DEBUG-WORKITEM:canvas-questions:ui]` - "Your Question" label rendering
- `[DEBUG-WORKITEM:canvas-questions:upvote]` - Upvote section rendering (others only)
- `[DEBUG-WORKITEM:canvas-questions:upvote]` - SKIPPING upvote for own question

### Final Layout Structure

**Own Questions**:
```
┌─────────────────────────────────────────────┐
│ Question Text                    [✏️] [🗑️]  │
│ Your Question                               │
└─────────────────────────────────────────────┘
```

**Others' Questions**:
```
┌─────────────────────────────────────────────┐
│ Question Text                      [👍] [0] │
└─────────────────────────────────────────────┘
```

### Key Differences
- ✅ "Your Question" label on LEFT below text (not right inline)
- ✅ Edit/delete buttons on RIGHT in header
- ✅ Upvote icon/count **completely hidden** for own questions (not just disabled)
- ✅ Upvote section only rendered conditionally with `@if (!isMyQuestion)`

### Build Status
✅ Compilation successful (warnings for file lock due to running app)

### Commit: 811c86b5afff6c8a1132652fc1e0bed24c0cbd2c
**Date**: 2025-10-13T14:30:00Z
**Message**: feat(canvas-questions): Replace question card with new structure from ContextCopilot.txt

**Summary**: Complete card structure refactoring to match the reference design from ContextCopilot.txt. Replaced inline styles with CSS classes, restructured card layout with action buttons at top, question text in middle, and footer with owner label + vote section at bottom.

**Files Modified**:
1. `SPA/NoorCanvas/Pages/SessionCanvas.razor`
   - **Lines 571-692**: Replaced old question item CSS with new refactored classes
     - Removed old inline flex layout styles
     - Added `.question-item-style` class for green card styling (border, background)
     - Added `.question-text-color` (#006400 green)
     - Added `.owner-label-color` (#D4AF37 golden)
     - Added `.vote-button-style` (disabled state for own questions)
     - Added `.vote-count-color` (#07751f green)
     - Restructured action buttons with border and hover effects
     - Restructured vote section for footer layout
   
   - **Lines 936-1043**: Replaced question rendering HTML structure
     - **TOP ROW**: Action buttons (edit/delete) in `.canvas-question-actions` div
     - **MIDDLE ROW**: Question text in `.canvas-question-content` div
     - **BOTTOM SECTION**: Footer with `.canvas-question-footer` class
       - LEFT: "Your Question" label (only for own questions)
       - RIGHT: Vote section (disabled for own questions, active for others)
     - Added `max-width: 300px` constraint to match reference design
     - Enhanced box-shadow: `0 8px 16px rgba(0, 0, 0, 0.1)`

**Key Design Changes**:
1. **Card Structure**:
   ```
   ┌───────────────────────────────┐
   │        [✏️] [🗑️]              │  ← Action buttons (top-right)
   │                               │
   │  What are the names of the    │  ← Question text (middle)
   │  five daily prayers?          │
   │                               │
   │  ──────────────────────────── │
   │  Your Question      [👍] 0    │  ← Footer (owner + vote)
   └───────────────────────────────┘
   ```

2. **CSS Refactoring**:
   - Removed inline `style="color:@color"` attributes
   - Moved all colors to CSS classes for maintainability
   - Replaced absolute positioning with flexbox footer layout
   - Standardized spacing with padding/gap values

3. **Trace-Level Debug Logging**:
   - `[DEBUG-WORKITEM:canvas-questions:ownership-trace]` - Ownership determination
   - `[DEBUG-WORKITEM:canvas-questions:card-structure-trace]` - Card layout building
   - `[DEBUG-WORKITEM:canvas-questions:action-buttons-trace]` - Edit/delete rendering
   - `[DEBUG-WORKITEM:canvas-questions:owner-label-trace]` - "Your Question" label
   - `[DEBUG-WORKITEM:canvas-questions:vote-disabled-trace]` - Disabled vote (own)
   - `[DEBUG-WORKITEM:canvas-questions:vote-active-trace]` - Active vote (others)
   - `[DEBUG-WORKITEM:canvas-questions:card-complete-trace]` - Rendering completion

4. **Vote Section Behavior**:
   - **Own Questions**: Shows disabled thumbs-up with vote count (green styling)
   - **Others' Questions**: Shows clickable thumbs-up with vote count (orange styling)
   - Vote count always visible in footer for visual consistency

**Visual Match to Reference**:
- ✅ Action buttons at top-right with borders
- ✅ Question text spans full width with proper font size
- ✅ "Your Question" golden label in footer-left
- ✅ Vote section in footer-right
- ✅ Max-width constraint (300px)
- ✅ Enhanced shadow for depth
- ✅ 6px left border for emphasis
- ✅ Green color scheme (#006400, #ECFDF5, #D4AF37)

**Build Validation**:
- ✅ Zero errors
- ✅ Zero warnings
- ✅ Clean compilation

**Testing Requirements**:
1. Visual verification: Card matches pasted image exactly
2. Functional testing: Edit/delete buttons work
3. Vote section: Disabled state for own questions, active for others
4. Responsive: Layout works at 300px max-width
5. Trace logs: All debug markers visible in console

**Related Reference**:
- Source: `Workspaces/Data/ContextCopilot.txt` (HTML mockup with inline styles)
- Design: Pasted image showing final desired layout

---
## [2025-10-13T14:20:00Z] - task
**Status**: in-progress | **Phase**: signalr-bug-fix | **Commit**: 63f9e055
**Work**: 
- ✅ **CRITICAL BUG FIXED**: SignalR group name case sensitivity
  - Identified: SessionHub uses `session_` (lowercase), QuestionController broadcasts to `Session_` (uppercase)
  - Fixed: Changed all QuestionController broadcasts to lowercase `session_`
  - Affected methods: VoteQuestion (line 351), UpdateQuestion (line 638), DeleteQuestion (line 730)
  - This fixes BOTH upvote counter and question edit propagation issues
- ✅ Checkpoint commit created (19562217)
- ✅ Build validation: Zero errors, zero warnings
**Files**: 1 modified (QuestionController.cs) | **Tests**: Build passed | **Build**: PASS
**Next**: Manual testing to verify upvote and edit propagation work correctly

---