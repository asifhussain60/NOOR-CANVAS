---
# Metadata
key: canvas-questions
debug-level: trace
verbosity: detailed
status: in-progress
last-updated: 2025-01-12 13:56 UTC
commit-sha: 3abf4f7f
phase: diagnostic-trace-logging
---

# Comprehensive Vote and Edit Flow Trace Logging

## Current Issues Being Debugged
1. **Upvote counter not incrementing**: Vote API succeeds, database updates, SignalR broadcast sent, but client UI doesn't update
2. **Question edit not propagating**: Edit API succeeds, database updates, SignalR broadcast sent, but other users/host don't see updated text

## Trace Logging Added (Commit 3abf4f7f)

### 1. Vote Flow - UI (SessionCanvas.razor)
**VoteQuestion Method**:
- `════════ VOTE FLOW START ════════` - Shows QuestionId, UserGuid, SessionToken, HubConnection state
- `BEFORE API CALL` - Current vote count before API call
- `WAITING FOR SIGNALR` - After successful API response, waiting for SignalR update
- `AFTER 100ms` - Vote count after waiting for SignalR (checks if changed)

**SignalR Handler (QuestionVoteUpdate)**:
- `════════ SIGNALR RECEIVED QuestionVoteUpdate ════════` - Event reception confirmation
- `SignalR payload` - Full JSON payload received
- `Parsed - QuestionId, NewVotes` - Extracted values
- `Searching for question in Model.Questions` - Total questions count
- `UPDATING VOTE COUNT` - Old vs new vote values
- `Calling StateHasChanged` - UI refresh trigger
- `✅ UI UPDATED` - Confirmation with new vote count
- `❌ QUESTION NOT FOUND` - If question missing, logs all available QuestionIds

### 2. Vote Flow - API (QuestionController.cs)
**VoteQuestion Endpoint**:
- `════════ API VOTE REQUEST RECEIVED ════════` - Shows QuestionId, RequestId, SessionToken, UserGuid, Direction
- `Database session lookup` - SessionId and Status from database
- `Saving to database` - Old vs new vote counts
- `✅ DATABASE SAVE COMPLETE` - Confirmation with new vote count
- `════════ BROADCASTING TO SIGNALR ════════` - Before broadcast
- `SignalR Group, Event, Payload` - Exact broadcast details (Group=Session_{id}, Event=QuestionVoteUpdate)
- `✅ SIGNALR BROADCAST SENT` - Confirmation after SendAsync completes

### 3. SignalR Group Joining (SessionHub.cs)
**JoinSession Method**:
- `════════ CLIENT JOINING SESSION ════════` - ConnectionId, SessionId, GroupName, Role
- `✅ CLIENT ADDED TO GROUP` - Confirmation with total connections count

### 4. SignalR Initialization (SessionCanvas.razor)
**InitializeSignalRAsync Method**:
- `════════ INITIALIZING SIGNALR ════════` - SessionId and UserGuid
- `SignalR connection created, State` - Connection state after builder
- `════════ REGISTERING SIGNALR HANDLERS ════════` - Before registering handlers
- `Handlers registered` - List of all registered event names
- `✅ SIGNALR CONNECTED` - State and ConnectionId after StartAsync
- `════════ JOINING SIGNALR GROUP ════════` - Before JoinSession call with SessionId and GroupName
- `✅ JoinSession CALL COMPLETE` - After SendAsync("JoinSession")

## Testing Instructions
1. Open two browser windows (User A and User B) on Session 212
2. User A: Click upvote button on a question
3. **Expected Log Sequence**:
   ```
   [User A] ════════ VOTE FLOW START ════════
   [User A] BEFORE API CALL - Current vote count=0
   [API]    ════════ API VOTE REQUEST RECEIVED ════════
   [API]    Database session lookup
   [API]    ✅ DATABASE SAVE COMPLETE - NewVotes=1
   [API]    ════════ BROADCASTING TO SIGNALR ════════
   [API]    SignalR Group=Session_212, Event=QuestionVoteUpdate, Payload={questionId=..., votes=1}
   [API]    ✅ SIGNALR BROADCAST SENT
   [User A] ════════ SIGNALR RECEIVED QuestionVoteUpdate ════════
   [User A] Parsed - QuestionId=..., NewVotes=1
   [User A] UPDATING VOTE COUNT - OldVotes=0, NewVotes=1
   [User A] ✅ UI UPDATED - Question ... now shows 1 votes
   [User B] ════════ SIGNALR RECEIVED QuestionVoteUpdate ════════
   [User B] ✅ UI UPDATED - Question ... now shows 1 votes
   ```

4. **If User B doesn't receive event**, look for:
   - `❌ Model.Questions is null` - Model not initialized
   - `❌ QUESTION NOT FOUND` - Question ID mismatch
   - Missing `════════ SIGNALR RECEIVED` log - Client not in group

5. **If broadcast not sent**, look for:
   - API logs stopping before `════════ BROADCASTING TO SIGNALR`
   - Exception logs in API vote processing

## Key Diagnostic Points
1. **Is client in SignalR group?**: Check `✅ CLIENT ADDED TO GROUP` in SessionHub logs
2. **Is broadcast being sent?**: Check `✅ SIGNALR BROADCAST SENT` in API logs
3. **Is client receiving broadcast?**: Check `════════ SIGNALR RECEIVED QuestionVoteUpdate` in client logs
4. **Is question found in Model?**: Check for `QUESTION NOT FOUND` warnings
5. **Is UI updating?**: Check `✅ UI UPDATED` confirmation

## SignalR Group Name Critical Detail
- **API broadcasts to**: `Session_{sessionId}` (e.g., `Session_212`)
- **Client joins**: Via `JoinSession(sessionId, "participant")` which creates group `session_{sessionId}` (lowercase!)
- **⚠️ POTENTIAL BUG**: Case sensitivity mismatch between broadcast group name and join group name

## Next Steps
1. Run application with trace logging enabled
2. Perform upvote test with two users
3. Collect complete log sequence from both clients and API
4. Verify SignalR group membership and broadcast reception
5. If group name case mismatch found, fix to use consistent casing

---
