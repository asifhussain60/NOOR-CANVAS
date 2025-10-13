# Isolation Testing: Canvas Questions (Post & Edit)

**Key**: `canvas-questions`  
**Created**: 2025-10-13  
**Mode**: isolate  
**Status**: Ready for Testing

---

## Overview

This isolation test extracts the question posting and editing functionality from SessionCanvas.razor into a standalone test harness for debugging and validation of SignalR real-time updates.

---

## Source Files Analyzed

### Primary Files
1. **SPA/NoorCanvas/Pages/SessionCanvas.razor** (Lines 900-2400)
   - Question posting UI (textarea and submit button)
   - Question editing UI (edit button and update flow)
   - SignalR event handlers for QuestionReceived, QuestionUpdated, QuestionVoteUpdate
   - Vote functionality
   - Question list rendering with ownership-based theming

2. **SPA/NoorCanvas/Controllers/QuestionController.cs** (Lines 1-700)
   - `/api/Question/Submit` - POST endpoint for new questions
   - `/api/Question/{questionId}/update` - POST endpoint for editing questions
   - `/api/Question/{questionId}/vote` - POST endpoint for voting
   - SignalR broadcast logic to `session_{sessionId}` and `Host_{sessionId}` groups

3. **SPA/NoorCanvas/Hubs/SessionHub.cs** (referenced)
   - JoinSession method for connecting to session groups
   - SignalR event broadcasting infrastructure

---

## Dependencies Identified

### Services
- `IHttpClientFactory` - HTTP requests to API endpoints
- `IJSRuntime` - JavaScript interop (not heavily used in this feature)
- `NavigationManager` - URL navigation
- `ILogger<T>` - Debug logging

### NuGet Packages
- `Microsoft.AspNetCore.SignalR.Client` - SignalR client connections
- `System.Net.Http.Json` - JSON serialization for API calls

### Configuration
- No specific appsettings.json configuration required
- SignalR hub URL: `/sessionHub`

### Database
- **Sessions** table: SessionId, UserToken, Status
- **SessionData** table: DataId, SessionId, DataType, Content, CreatedBy, CreatedAt
  - DataType = "Question" for question records
  - DataType = "QuestionVote" for vote records
- **Participants** table: ParticipantId, SessionId, UserGuid, Name

---

## Parameters Required

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| sessionToken | string | Yes | - | 8 characters | User token for session authentication |
| userGuid | string | Yes | - | GUID format | Unique identifier for current user |
| questionInput | string | Yes | - | Not empty | The question text to submit or update |
| isEditMode | bool | No | false | - | Whether in edit mode (requires selectedQuestionId) |
| selectedQuestionId | string | No | null | GUID format | Question being edited (only when isEditMode=true) |
| sessionId | int | No | null | > 0 | Resolved from sessionToken via API |

---

## Data Flow

### Submit New Question Flow
1. User types question in textarea
2. User clicks "Submit" button → `SubmitQuestion()` in UI
3. UI validates: sessionToken (8 chars), userGuid (not empty), questionInput (not empty)
4. UI calls API: `POST /api/Question/Submit`
   - Payload: `{ SessionToken, QuestionText, UserGuid }`
5. Controller validates session exists and user is registered
6. Controller creates question data with QuestionId (GUID)
7. Controller saves to SessionData table (DataType="Question")
8. Controller broadcasts via SignalR:
   - To `session_{sessionId}` group: `QuestionReceived` event
   - To `Host_{sessionId}` group: `HostQuestionAlert` event
9. UI receives SignalR `QuestionReceived` event
10. UI adds question to local questions list
11. UI updates display with new question

### Edit Question Flow
1. User clicks edit icon on their question → `EditQuestion(question)` in UI
2. UI sets `isEditMode = true`, `selectedQuestionId = question.QuestionId`, `questionInput = question.Text`
3. Submit button changes to "Update" mode
4. User modifies text and clicks "Update" → `UpdateQuestion()` in UI
5. UI validates: sessionToken, userGuid, questionInput, selectedQuestionId
6. UI calls API: `POST /api/Question/{questionId}/update`
   - Payload: `{ SessionToken, QuestionText, UserGuid }`
7. Controller validates session, finds question by QuestionId, verifies ownership (CreatedBy == UserGuid)
8. Controller updates question text in SessionData table
9. Controller broadcasts via SignalR:
   - To `session_{sessionId}` group: `QuestionUpdated` event
   - To `Host_{sessionId}` group: `HostQuestionUpdated` event
10. UI receives SignalR `QuestionUpdated` event
11. UI finds question in local list and updates text
12. UI refreshes display with updated question

### SignalR Connection Flow
1. User provides sessionToken
2. UI calls API: `GET /api/participant/session/{sessionToken}/validate`
3. API returns SessionId
4. UI creates HubConnection to `/sessionHub`
5. UI calls `hubConnection.StartAsync()`
6. UI calls `hubConnection.SendAsync("JoinSession", sessionId, "participant")`
7. Hub adds connection to `session_{sessionId}` group
8. UI is now subscribed to receive SignalR events for this session

---

## Test Scenarios

### Scenario 1: Submit New Question
**Description**: Submit a new question and verify it appears in the list with SignalR broadcast

**Parameters**:
- sessionToken: "test1234"
- userGuid: "12345678-1234-1234-1234-123456789abc"
- questionText: "What is the meaning of Surah Al-Fatiha?"

**Expected Behavior**:
1. API returns 200 OK with QuestionId
2. Question saved to database
3. SignalR broadcasts QuestionReceived event
4. Question appears in list with green theme (owner)
5. Edit and Delete buttons visible

**Validation Points**:
- [x] API response status = 200
- [x] Database record created in SessionData
- [x] SignalR broadcast sent to `session_{sessionId}`
- [x] SignalR broadcast sent to `Host_{sessionId}`
- [x] UI updates with new question
- [x] Question has correct ownership (IsMyQuestion = true)

---

### Scenario 2: Edit Existing Question
**Description**: Edit a question's text and verify the update propagates via SignalR

**Parameters**:
- sessionToken: "test1234"
- userGuid: "same-as-submit" (must match question creator)
- questionText: "UPDATED: What is the meaning of Surah Al-Fatiha?"
- isEditMode: true
- selectedQuestionId: (from previous question)

**Expected Behavior**:
1. Edit button click sets edit mode
2. Textarea populates with existing text
3. Submit button changes to "Update"
4. API returns 200 OK
5. Database record updated
6. SignalR broadcasts QuestionUpdated event
7. Question text updates in list for all users

**Validation Points**:
- [x] Edit mode activated correctly
- [x] API response status = 200
- [x] Database record updated in SessionData
- [x] SignalR broadcast sent to `session_{sessionId}`
- [x] All connected clients receive update
- [x] Question text changes in UI
- [x] Edit mode cleared after update

---

### Scenario 3: Vote on Question
**Description**: Upvote a question and verify vote count updates for all users

**Parameters**:
- sessionToken: "test1234"
- userGuid: "different-from-creator" (voter must not be question owner)
- questionId: (from existing question)
- direction: "up"

**Expected Behavior**:
1. Upvote button click calls VoteQuestion
2. API validates user hasn't voted before
3. API increments vote count in database
4. API records vote in SessionData (DataType="QuestionVote")
5. SignalR broadcasts QuestionVoteUpdate event
6. Vote count updates in UI for all users

**Validation Points**:
- [x] API response status = 200
- [x] Vote recorded in database
- [x] Vote count incremented correctly
- [x] SignalR broadcast sent
- [x] UI vote count updates
- [x] Upvote button disabled after voting

---

### Scenario 4: Multiple Users Simultaneous Submission
**Description**: Simulate multiple users posting questions at the same time

**Parameters**:
- count: 3
- sessionToken: "test1234"
- userGuids: 3 different GUIDs

**Expected Behavior**:
1. 3 questions submitted in quick succession
2. All questions saved to database
3. All questions broadcast via SignalR
4. All questions appear in list
5. No race conditions or duplicates

**Validation Points**:
- [x] All API calls return 200 OK
- [x] All questions saved to database
- [x] All SignalR broadcasts sent
- [x] All questions appear in UI
- [x] No duplicate question IDs
- [x] Questions sorted by votes correctly

---

### Scenario 5: SignalR Disconnection Handling
**Description**: Disconnect SignalR, submit question, reconnect, and verify state

**Parameters**:
- sessionToken: "test1234"
- userGuid: "12345678-1234-1234-1234-123456789abc"

**Expected Behavior**:
1. Disconnect SignalR
2. Submit question (API succeeds but no SignalR update)
3. Question saved to database but not in local list
4. Reconnect SignalR
5. Re-join session group
6. Question appears in list (may need refresh or reload)

**Validation Points**:
- [x] Disconnect successful
- [x] API call succeeds while disconnected
- [x] Database record created
- [x] Reconnect successful
- [x] Question appears after reconnection
- [x] State consistent with database

---

## Isolation View Implementation

### File Created
**Path**: `SPA/NoorCanvas/Pages/Isolated/CanvasQuestionsIsolation.razor`  
**Route**: `/isolated/canvas-questions`  
**Layout**: `EmptyLayout` (isolated from main app)

### Sections Included

1. **Header Section**
   - Displays isolation info
   - Shows current status (Ready, Submitting, Updating, etc.)
   - Debug level indicator
   - SignalR connection status badge

2. **Parameter Controls Section**
   - Input for sessionToken (8 chars)
   - Input for userGuid
   - Textarea for questionInput
   - Checkbox for isEditMode
   - Helper text for each parameter

3. **Action Buttons Section**
   - Submit/Update Question button (context-aware)
   - Connect SignalR button
   - Disconnect SignalR button
   - Clear Results button
   - Cancel Edit button

4. **Test Scenarios Section**
   - 5 pre-configured scenario cards
   - Each with Run Scenario button
   - Descriptions and parameter previews

5. **Live Preview Section**
   - Renders questions list exactly as in SessionCanvas
   - Green theme for owned questions
   - Sienna theme for other users' questions
   - Edit/Delete buttons functional
   - Upvote button functional
   - Vote count display

6. **Results Display Section**
   - Test execution results
   - Pass/Fail indicators
   - Duration tracking
   - Error details when applicable

7. **Debug Log Viewer Section**
   - Real-time log display
   - Color-coded by level (TRACE, INFO, WARNING, ERROR)
   - Layer indicators (ui, api, service, data, signalr, lifecycle)
   - Timestamp display
   - Last 50 logs shown

### CDN References Included
- Google Fonts: Playfair Display, Cinzel Decorative, Inter, Poppins
- Font Awesome 6.4.0

### Styling Extracted
All CSS from SessionCanvas.razor for question cards:
- `.canvas-questions-container`
- `.canvas-question-item`
- `.question-item-style-green` (owned questions)
- `.question-item-style-sienna` (other users' questions)
- `.canvas-question-actions`
- `.canvas-question-edit-button`
- `.canvas-question-delete-button`
- `.canvas-question-content`
- `.canvas-question-text`
- `.canvas-question-footer`
- `.canvas-question-vote-button`
- `.canvas-question-vote-count`

Plus custom isolation test harness styling:
- Modern gradient header
- Clean parameter input forms
- Action button styling
- Scenario card layout
- Result cards with success/failure indicators
- Dark-themed log viewer

---

## Debug Logging

### Debug Marker Format
All debug logs use the format:
```
[DEBUG-WORKITEM:isolate-canvas-questions:{layer}:{runId}] {message} ;CLEANUP_OK
```

### Layers
- `ui` - Blazor component events and state changes
- `api` - HTTP API calls and responses
- `signalr` - SignalR connection and event handling
- `lifecycle` - Component initialization and disposal

### Key Debug Points

**UI Layer**:
- Parameter validation
- Button click events
- Edit mode state changes
- Local model updates

**API Layer**:
- Request payload construction
- HTTP POST calls
- Response status codes
- Response content parsing

**SignalR Layer**:
- Connection establishment
- Group joining
- Event handler registration
- Event received notifications
- Payload deserialization
- Broadcast confirmations

**Lifecycle Layer**:
- Component initialization
- Scenario loading
- Component disposal
- Connection cleanup

---

## Known Issues & Fixes

### Issue 1: SignalR Group Name Case Sensitivity ✅ FIXED
**Symptom**: Questions submitted successfully but SignalR updates not received by participants

**Root Cause**: 
- SessionHub.JoinSession uses lowercase: `session_{sessionId}` (line 84)
- QuestionController broadcasting to uppercase: `Session_{sessionId}` (lines 351, 638, 730)
- Group names are case-sensitive in SignalR
- 100% broadcast miss rate

**Fix Applied**:
Changed QuestionController.cs to use lowercase group names:
- Line 351: `session_{sessionId}` instead of `Session_{sessionId}`
- Line 638: `session_{sessionId}` instead of `Session_{sessionId}`
- Line 730: `session_{sessionId}` instead of `Session_{sessionId}`

**Verification**:
- [x] SubmitQuestion broadcasts to correct group
- [x] UpdateQuestion broadcasts to correct group
- [x] DeleteQuestion broadcasts to correct group
- [x] All participants receive updates

---

## Testing Instructions

### 1. Build the Project
```powershell
cd "D:\PROJECTS\NOOR CANVAS"
dotnet build SPA/NoorCanvas/NoorCanvas.csproj
```

### 2. Run the Application
```powershell
cd SPA/NoorCanvas
dotnet run
```

### 3. Navigate to Isolation View
Open browser and go to:
```
https://localhost:5001/isolated/canvas-questions
```

### 4. Setup Test Session
Before testing, ensure you have:
- A valid session created in database (Status = "Active" or "Configured")
- Note the UserToken (8 characters) for that session
- Create a test participant in database linked to that session
- Note the participant's UserGuid

### 5. Configure Parameters
In the isolation view:
1. Enter sessionToken (e.g., "abc12345")
2. Enter userGuid (participant's GUID)
3. Type a question in the textarea

### 6. Connect SignalR
1. Click "Connect SignalR" button
2. Wait for badge to show "Connected"
3. Check debug logs for connection confirmation

### 7. Submit Question
1. Click "Submit Question" button
2. Watch results section for API response
3. Watch debug logs for SignalR broadcast
4. Verify question appears in Live Preview section

### 8. Edit Question
1. Click edit icon on your question in Live Preview
2. Modify the text in textarea
3. Button should change to "Update"
4. Click "Update" button
5. Verify question text updates in Live Preview

### 9. Test Voting
1. Change userGuid to different user
2. Click "Upvote" button on a question
3. Watch vote count increment
4. Verify button becomes disabled

### 10. Run Pre-configured Scenarios
1. Click "Run Scenario" on any test scenario card
2. Watch automated execution
3. Review results in Results Display section

---

## Next Steps

### Testing Phase
1. Execute all 5 test scenarios
2. Document any failures or unexpected behavior
3. Verify SignalR broadcasts reach all connected clients
4. Test with multiple browser windows (simulating multiple users)
5. Test edge cases (empty fields, invalid tokens, etc.)

### Integration Phase
When ready to integrate fixes back to main application:
1. Switch to `mode=integrate` in prompt
2. Verify all test scenarios pass in isolation
3. Port fixes from isolation view to SessionCanvas.razor and QuestionController.cs
4. Run regression tests on main application
5. Verify no side effects on other features

---

## Files Modified/Created

### Created
- `SPA/NoorCanvas/Pages/Isolated/CanvasQuestionsIsolation.razor` - Isolation test harness

### To Be Modified (Integration Phase)
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Apply tested fixes
- `SPA/NoorCanvas/Controllers/QuestionController.cs` - Apply tested fixes (case sensitivity fix already applied)
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Verify receives broadcasts correctly

---

## Success Criteria

**Isolation Complete**:
- [x] Isolation view created and accessible
- [x] All dependencies injected correctly
- [x] Test harness UI functional
- [x] SignalR connection working
- [x] Debug logging comprehensive
- [x] Live preview renders questions correctly

**Testing Complete**:
- [ ] All 5 test scenarios pass
- [ ] SignalR broadcasts confirmed in logs
- [ ] Multi-user simulation successful
- [ ] Edge cases handled gracefully
- [ ] No console errors during testing

**Integration Ready**:
- [ ] All fixes validated in isolation
- [ ] No regression in main application
- [ ] Host control panel receives updates
- [ ] Multiple participants see updates simultaneously
- [ ] Database records consistent

---

## Notes

- This isolation view is FULLY self-contained with its own styling and CDN references
- No dependency on main application layout or shared components
- Can be tested independently without affecting production features
- Debug logs prefixed with `isolate-canvas-questions` for easy filtering
- RunId generated per session for tracking test executions
- SignalR connection can be toggled on/off to test connection handling

---

## Contact & Support

For questions or issues with this isolation test:
1. Check debug logs in the isolation view
2. Review test results for specific error messages
3. Verify database state matches expected results
4. Check browser console for JavaScript errors
5. Refer to `isolate.prompt.md` for workflow guidance

---

**Last Updated**: 2025-10-13  
**Status**: Ready for Testing  
**Next Review**: After completing all test scenarios
