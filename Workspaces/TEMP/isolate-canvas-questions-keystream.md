# Key Data Stream: isolate-canvas-questions

**Created**: 2025-10-13  
**Purpose**: Isolate question posting and editing functionality from SessionCanvas.razor with SignalR real-time propagation to participants and hosts  
**Status**: ON HOLD - Completing isolate.prompt.md first

---

## Status Update (2025-10-13)

**Decision**: Pausing the canvas-questions isolation task to complete the `isolate.prompt.md` file first.

**Reason**: The prompt file needs to be finalized before performing actual isolation tasks. This ensures consistent methodology across all future isolation workflows.

**Changes Made to isolate.prompt.md**:
1. ✅ Added `mode` parameter with `isolate` and `integrate` options
2. ✅ Added comprehensive CDN and external resource management section
3. ✅ Added styling isolation best practices
4. ✅ Added mode-based execution flow documentation
5. ✅ Removed large HTML/CSS code blocks in favor of structural guidance
6. ✅ Kept template structure references instead of full code
7. ✅ Emphasized case-by-case evaluation of what code to isolate

**Next Steps**:
1. Review and validate `isolate.prompt.md` is complete
2. Once prompt is finalized, resume canvas-questions isolation with `mode=isolate`
3. Apply the standardized isolation workflow to question posting functionality

---

## Analysis Results (PRESERVED FOR REFERENCE)

### Source Files Analyzed

1. **SessionCanvas.razor** (Lines 1890-2050)
   - Purpose: User-facing question submission and editing UI
   - Key Components:
     - `SubmitQuestion()` - Creates new question or routes to update
     - `UpdateQuestion()` - Updates existing question with ownership validation
     - `EditQuestion(int index)` - Enters edit mode
     - `DeleteConfirmed()` - Deletes question with confirmation
     - SignalR event handlers: `QuestionReceived`, `QuestionUpdated`, `QuestionDeleted`, `QuestionVoteUpdate`

2. **QuestionController.cs** (Lines 1-750)
   - Purpose: API endpoints for question CRUD operations
   - Key Components:
     - `POST /api/Question/submit` - Submit new question
     - `POST /api/Question/{questionId}/update` - Update existing question
     - `POST /api/Question/{questionId}/delete` - Delete question
     - `POST /api/Question/{questionId}/vote` - Vote on question
     - `GET /api/Question/session/{sessionToken}` - Get all questions
   - All endpoints use user token (8-char) for authentication
   - Broadcasts via SignalR to `session_{sessionId}` and `Host_{sessionId}` groups

3. **SessionHub.cs** (Lines 1-200)
   - Purpose: SignalR hub for real-time communication
   - Key Components:
     - `JoinSession(int sessionId, string role)` - Joins `session_{sessionId}` group
     - `JoinHostGroup(string sessionId)` - Joins `Host_{sessionId}` group
     - Connection tracking with role and timestamp
   - Broadcast events sent from API controller, not hub methods

4. **HostControlPanel.razor** (Lines 200-450)
   - Purpose: Host view of questions with real-time updates
   - Key Components:
     - SignalR event handlers: `HostQuestionAlert`, `HostQuestionUpdated`, `HostQuestionDeleted`, `VoteUpdateReceived`
     - Displays questions with participant name and vote count
     - Toast notifications for new questions and vote updates

### Dependencies Identified

**Services**:
- `IHttpClientFactory` - HTTP client for API calls
- `ILogger<T>` - Logging infrastructure
- `NavigationManager` - Navigation for redirects
- `IJSRuntime` - JavaScript interop
- `IHubContext<SessionHub>` - SignalR hub context (server-side)
- `SimplifiedTokenService` - Token validation
- `SimplifiedCanvasDbContext` - Database access

**Packages**:
- Microsoft.AspNetCore.SignalR.Client (client-side)
- Microsoft.AspNetCore.SignalR (server-side)
- Microsoft.EntityFrameworkCore
- System.Text.Json

**Configuration**:
- No specific appsettings required
- SignalR hub URL: `/hub/session`

**Database**:
- **Sessions** table: SessionId, UserToken (8-char), HostToken (8-char), Status
- **Participants** table: ParticipantId, SessionId, UserGuid, Name
- **SessionData** table: DataId, SessionId, DataType, Content (JSON), CreatedBy, CreatedAt
  - DataType = "Question" for questions
  - DataType = "QuestionVote" for vote tracking

### Parameters Required

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| SessionToken | string | Yes | - | 8 characters |
| UserGuid | string | Yes | - | GUID format |
| QuestionText | string | Yes | - | Not empty/whitespace |
| QuestionId | Guid | Yes (for update/delete) | - | Valid GUID |
| Direction | string | Yes (for vote) | - | "up" or "down" |

### Data Flow

#### Submit New Question
1. User enters text in SessionCanvas question input
2. User clicks Submit → `SubmitQuestion()` called
3. SessionCanvas sends POST to `/api/Question/submit` with SessionToken, QuestionText, UserGuid
4. QuestionController validates token and user registration
5. Controller creates question JSON and stores in SessionData table
6. Controller broadcasts `QuestionReceived` to `session_{sessionId}` group
7. Controller broadcasts `HostQuestionAlert` to `Host_{sessionId}` group
8. All SessionCanvas clients receive `QuestionReceived` and add to UI
9. HostControlPanel receives `HostQuestionAlert` and shows toast + adds to list

#### Update Existing Question
1. User clicks edit button → `EditQuestion(index)` called
2. Question text loaded into input, EditingQuestionIndex set
3. User modifies text and clicks Submit → `SubmitQuestion()` detects edit mode → calls `UpdateQuestion()`
4. SessionCanvas sends POST to `/api/Question/{questionId}/update` with SessionToken, QuestionText, UserGuid
5. QuestionController validates ownership (CreatedBy must match UserGuid)
6. Controller updates question JSON in SessionData table
7. Controller broadcasts `QuestionUpdated` to `session_{sessionId}` group
8. Controller broadcasts `HostQuestionUpdated` to `Host_{sessionId}` group
9. All SessionCanvas clients receive `QuestionUpdated` and update UI
10. HostControlPanel receives `HostQuestionUpdated` and updates list

#### Delete Question
1. User clicks delete button → `ShowDeleteModal(index)` called
2. Confirmation modal displayed
3. User confirms → `DeleteConfirmed()` called
4. SessionCanvas sends POST to `/api/Question/{questionId}/delete` with SessionToken, UserGuid
5. QuestionController validates ownership
6. Controller removes SessionData record
7. Controller broadcasts `QuestionDeleted` to `session_{sessionId}` group
8. Controller broadcasts `HostQuestionDeleted` to `Host_{sessionId}` group
9. All SessionCanvas clients receive `QuestionDeleted` and remove from UI
10. HostControlPanel receives `HostQuestionDeleted` and removes from list

---

## Test Scenarios

### Scenario 1: Happy Path - Submit New Question
**Description**: User submits a new question and it propagates to all connected clients

**Parameters**:
- SessionToken: "abc12345" (valid 8-char token)
- UserGuid: "550e8400-e29b-41d4-a716-446655440000" (registered participant)
- QuestionText: "What are the five pillars of Islam?"

**Expected Behavior**:
1. API validates token and user registration
2. Question saved to SessionData with DataType="Question"
3. SignalR broadcasts `QuestionReceived` to session group
4. SignalR broadcasts `HostQuestionAlert` to host group
5. UI updates immediately with new question
6. Host receives toast notification

**Validation Points**:
- [ ] API response status = 200
- [ ] SessionData record created with correct JSON
- [ ] SignalR broadcast sent to `session_{sessionId}`
- [ ] SignalR broadcast sent to `Host_{sessionId}`
- [ ] SessionCanvas UI shows new question
- [ ] HostControlPanel UI shows new question
- [ ] Host receives toast notification

### Scenario 2: Happy Path - Update Own Question
**Description**: User edits their own question and update propagates

**Parameters**:
- SessionToken: "abc12345"
- UserGuid: "550e8400-e29b-41d4-a716-446655440000" (question owner)
- QuestionId: "123e4567-e89b-12d3-a456-426614174000"
- QuestionText: "What are the five pillars of Islam? (Updated)"

**Expected Behavior**:
1. API validates ownership (CreatedBy matches UserGuid)
2. Question text updated in SessionData
3. SignalR broadcasts `QuestionUpdated` to session group
4. SignalR broadcasts `HostQuestionUpdated` to host group
5. UI updates for all connected clients

**Validation Points**:
- [ ] API response status = 200
- [ ] SessionData Content field updated
- [ ] SignalR broadcasts sent
- [ ] All SessionCanvas clients show updated text
- [ ] HostControlPanel shows updated text

### Scenario 3: Edge Case - Empty Question Text
**Description**: User tries to submit empty question

**Parameters**:
- SessionToken: "abc12345"
- UserGuid: "550e8400-e29b-41d4-a716-446655440000"
- QuestionText: "" (empty)

**Expected Behavior**:
1. Client-side validation prevents submission
2. No API call made

**Validation Points**:
- [ ] Submit button disabled or validation message shown
- [ ] No API call logged
- [ ] UI shows validation feedback

### Scenario 4: Edge Case - Invalid Session Token
**Description**: User with invalid token tries to submit

**Parameters**:
- SessionToken: "invalid" (not 8 chars)
- UserGuid: "550e8400-e29b-41d4-a716-446655440000"
- QuestionText: "Test question"

**Expected Behavior**:
1. API returns 400 Bad Request
2. Error message displayed to user

**Validation Points**:
- [ ] API response status = 400
- [ ] Error message: "Invalid session token format"
- [ ] UI shows error feedback

### Scenario 5: Error Case - Unauthorized User (Not Registered)
**Description**: User not registered for session tries to submit

**Parameters**:
- SessionToken: "abc12345" (valid session)
- UserGuid: "999e9999-e99b-99d9-a999-999999999999" (not registered)
- QuestionText: "Unauthorized question"

**Expected Behavior**:
1. API returns 401 Unauthorized
2. User redirected to landing page

**Validation Points**:
- [ ] API response status = 401
- [ ] Error message: "User not registered for this session"
- [ ] Navigation to `/user/landing/{SessionToken}`

### Scenario 6: Error Case - Update Question Not Owned
**Description**: User tries to update another user's question

**Parameters**:
- SessionToken: "abc12345"
- UserGuid: "550e8400-e29b-41d4-a716-446655440000" (not owner)
- QuestionId: "123e4567-e89b-12d3-a456-426614174000" (owned by different user)
- QuestionText: "Malicious edit attempt"

**Expected Behavior**:
1. API validates ownership fails
2. API returns 404 Not Found
3. Error message displayed

**Validation Points**:
- [ ] API response status = 404
- [ ] Error message: "Question not found or you are not authorized to update it"
- [ ] Original question unchanged

### Scenario 7: Race Condition - Simultaneous Question Submissions
**Description**: Multiple users submit questions at the same time

**Parameters**:
- User A: SessionToken="abc12345", UserGuid="550e8400-e29b-41d4-a716-446655440000"
- User B: SessionToken="abc12345", UserGuid="660e9500-e39c-52e5-b827-557766551111"
- Both submit questions within 100ms

**Expected Behavior**:
1. Both questions saved to database independently
2. SignalR broadcasts both `QuestionReceived` events
3. All clients receive both questions in order
4. No data loss or corruption

**Validation Points**:
- [ ] Two SessionData records created
- [ ] Both questions appear in all client UIs
- [ ] Questions displayed in chronological order
- [ ] No exceptions in server logs

### Scenario 8: SignalR Disconnection During Submit
**Description**: User submits question but SignalR is disconnected

**Parameters**:
- SessionToken: "abc12345"
- UserGuid: "550e8400-e29b-41d4-a716-446655440000"
- QuestionText: "Test question during disconnect"
- SignalR: Disconnected before broadcast

**Expected Behavior**:
1. Question saved to database successfully
2. API returns success even if SignalR broadcast fails
3. Question appears after SignalR reconnects and page refreshes

**Validation Points**:
- [ ] API response status = 200
- [ ] SessionData record created
- [ ] Server log shows SignalR broadcast failure (non-fatal)
- [ ] Question visible after reconnect

---

## Implementation Plan

### Phase 1: Create Isolation View
1. Create `SPA/NoorCanvas/Pages/Isolated/CanvasQuestionsIsolation.razor`
2. Route: `/isolated/canvas-questions`
3. Layout: `EmptyLayout` (isolated from main app)
4. Extract all styling from SessionCanvas and HostControlPanel

### Phase 2: Build Test Harness UI
1. Session setup section with SessionToken and UserGuid inputs
2. Question submission form
3. Question list display (simulating SessionCanvas)
4. Host view display (simulating HostControlPanel)
5. SignalR connection status indicator
6. Test scenario selector dropdown
7. Debug log viewer with layer filtering

### Phase 3: Inject Debug Logging
1. UI layer: Component lifecycle and event handlers
2. API layer: Controller entry/exit and validation
3. Service layer: Token validation
4. Data layer: Database queries
5. SignalR layer: Hub broadcasts and client handlers

### Phase 4: Build and Test
1. Compile and fix errors
2. Navigate to isolation view
3. Run happy path scenarios
4. Document results

### Phase 5: Debug and Fix
1. Identify issues from debug logs
2. Apply fixes in isolation view
3. Retest all scenarios

### Phase 6: Reintegration
1. Port fixes back to original files
2. Remove test harness code
3. Test in main application
4. Clean up debug logs if needed

---

## Notes

- SignalR group names are case-sensitive: `session_{sessionId}` (lowercase) vs `Session_{sessionId}` (uppercase)
- Recent bug fix: Changed controller broadcasts from `Session_` to `session_` to match hub
- UserGuid is critical for ownership validation on updates/deletes
- SessionToken is the 8-character user token, not the host token
- Questions stored as JSON in SessionData.Content field
- DataType field distinguishes Questions from QuestionVotes

---

## Version History

- **v1.0** (2025-10-13): Initial analysis phase complete
