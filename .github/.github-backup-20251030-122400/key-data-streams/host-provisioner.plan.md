# host-provisioner: Canvas Table Cleanup Enhancement

## 🧠 Analysis
- **Key**: host-provisioner
- **Work**: Update HostProvisioner to clear canvas tables (Participants, SessionData, Annotations) for sessionId
- **Routing**: task, test-generation
- **Phases**: 3 (Implementation, Testing, Documentation)
- **Assumptions**: Clearing data ensures fresh session state; no cascade delete constraints block cleanup

## 📋 Context
- **Current State**: HostProvisioner creates/regenerates tokens but doesn't clean session data
- **Problem**: Existing participants, questions, and annotations persist when session is re-provisioned
- **Solution**: Add cleanup logic to clear `canvas.Participants`, `canvas.SessionData`, `canvas.Annotations` before token generation
- **Pattern**: Follow existing `canvas.CleanCanvas.sql` approach but scoped to specific sessionId

## Phase 1: Implementation - Add Canvas Cleanup Logic

### Context Files
- `Tools/HostProvisioner/HostProvisioner/Program.cs` (CreateHostGuidWithDatabase method, lines 380-550)
- `SPA/NoorCanvas/Models/Simplified/Participant.cs`
- `SPA/NoorCanvas/Models/Simplified/SessionData.cs`
- `SPA/NoorCanvas/Models/Annotation.cs`
- `Scripts/canvas.CleanCanvas.sql` (reference pattern)

### @task Prompt
```
Update HostProvisioner to clear canvas tables for specific sessionId:

1. In Program.cs CreateHostGuidWithDatabase method, add cleanup AFTER session validation (line ~440) BEFORE token generation (line ~520):
   - Delete from canvas.Participants WHERE SessionId = @sessionId
   - Delete from canvas.SessionData WHERE SessionId = @sessionId  
   - Delete from canvas.Annotations WHERE SessionId = @sessionId
   
2. Implementation details:
   - Add after "Session has {TranscriptCount} transcripts available" log (line ~438)
   - Use context.Participants.Where(...).ExecuteDeleteAsync()
   - Use context.SessionData.Where(...).ExecuteDeleteAsync()
   - Use context.Annotations.Where(...).ExecuteDeleteAsync()
   - Log deletion counts: "PROVISIONER: Cleared {count} participants, {count} session data, {count} annotations"
   
3. Error handling:
   - Wrap in try/catch with meaningful errors
   - Log warnings if deletion fails (non-blocking)
   - Continue with token generation even if cleanup fails

4. Preserve existing behavior:
   - Don't modify session creation/update logic
   - Don't change token generation
   - Keep existing validation checks
```

### @test-generation Prompt
```
Create manual test procedure for canvas cleanup in HostProvisioner:

1. Setup: Create test data for session (e.g., 212)
   - Add 3 participants via ParticipantController
   - Submit 2 questions via SessionCanvas
   - Create 5 annotations via AnnotationHub
   
2. Execute: Run HostProvisioner with --session-id 212
   
3. Verify cleanup:
   - Check console logs show deletion counts
   - Query canvas.Participants WHERE SessionId=212 (expect 0 rows)
   - Query canvas.SessionData WHERE SessionId=212 (expect 0 rows)
   - Query canvas.Annotations WHERE SessionId=212 (expect 0 rows)
   
4. Verify tokens generated:
   - Verify HostToken and UserToken in output
   - Verify canvas.Sessions record updated
   - Test host/user URLs work correctly

Document test results in Workspaces/Copilot/host-provisioner-cleanup-test-results.md
```

### Exit Criteria
- ✅ Three ExecuteDeleteAsync calls added to Program.cs
- ✅ Deletion counts logged with PROVISIONER prefix
- ✅ Error handling implemented (non-blocking)
- ✅ No changes to token generation logic

## Phase 2: Testing and Validation

### Context Files
- `Tools/HostProvisioner/HostProvisioner/Program.cs` (modified)
- Test session data in KSESSIONS_DEV database

### @task Prompt
```
Execute manual test procedure:

1. Build HostProvisioner:
   cd Tools/HostProvisioner/HostProvisioner
   dotnet build
   
2. Create test data via SQL:
   INSERT INTO canvas.Participants (SessionId, UserToken, Name) VALUES (212, 'TESTUSER', 'Test User')
   INSERT INTO canvas.SessionData (SessionId, DataType, Content) VALUES (212, 'Question', '{"text":"test"}')
   INSERT INTO canvas.Annotations (SessionId, CreatedBy, AnnotationData) VALUES (212, 'testuser', '{"type":"highlight"}')
   
3. Run HostProvisioner:
   dotnet run -- create --session-id 212 --created-by "Copilot Test" --dry-run false
   
4. Verify in console output:
   - Look for "PROVISIONER: Cleared N participants, N session data, N annotations"
   - Verify tokens generated successfully
   
5. Verify in database:
   SELECT COUNT(*) FROM canvas.Participants WHERE SessionId=212  -- expect 0
   SELECT COUNT(*) FROM canvas.SessionData WHERE SessionId=212   -- expect 0
   SELECT COUNT(*) FROM canvas.Annotations WHERE SessionId=212   -- expect 0
```

### Exit Criteria
- ✅ Test data successfully cleared
- ✅ Deletion counts appear in logs
- ✅ Tokens generated after cleanup
- ✅ No errors in console output

## Phase 3: Documentation and Completion

### @task Prompt
```
Document the canvas cleanup enhancement:

1. Add section to Tools/HostProvisioner/README.md (create if doesn't exist):
   ```markdown
   ## Canvas Cleanup Behavior
   
   When provisioning a session, HostProvisioner automatically clears existing canvas data:
   - **Participants**: All participant registrations removed
   - **SessionData**: Questions, votes, and other session data deleted
   - **Annotations**: All user annotations cleared
   
   This ensures a fresh session state when re-provisioning tokens.
   ```

2. Update Workspaces/Copilot/host-provisioner-cleanup-test-results.md with:
   - Test execution date
   - Deletion counts observed
   - Any issues encountered
   - Verification screenshots/logs
```

### Exit Criteria
- ✅ README.md updated with cleanup documentation
- ✅ Test results documented
- ✅ Work-log entry created

## Phase 4: Self-Review (Max 3 Iterations)

### Design Review
- ✅ Cleanup happens at correct point in workflow (after validation, before token gen)
- ✅ Uses EF Core ExecuteDeleteAsync for efficient bulk deletion
- ✅ Follows existing logging patterns (PROVISIONER prefix)

### Functionality Review
- ✅ All three canvas tables cleared
- ✅ Scoped to specific sessionId only
- ✅ Non-blocking (failures logged as warnings)
- ✅ Token generation unaffected

### Code Quality Review
- ✅ No dead code introduced
- ✅ Error handling in place
- ✅ Logging comprehensive
- ✅ No hardcoded values

### Test Coverage Review
- ✅ Manual test procedure documented
- ✅ Verification steps clear
- ✅ Database queries provided

### Documentation Review
- ✅ README.md updated
- ✅ Inline comments added
- ✅ Test results captured

## Phase 5: Final Healthcheck

### Validation Steps
1. Build succeeds: `dotnet build Tools/HostProvisioner/HostProvisioner/HostProvisioner.csproj`
2. No compiler warnings
3. Manual test passes (all tables cleared, tokens generated)
4. No regressions in existing functionality
5. Logs clear and informative

### Completion Metrics
- **Files Modified**: 1 (Program.cs)
- **Files Created**: 2 (README.md, test-results.md)
- **Lines Added**: ~30
- **Tests Executed**: 1 manual test
- **Build Status**: Success
- **Errors**: 0

## Error Remediation
- **Category**: Implementation
- **Approach**: 
  - Build errors: Fix syntax/type issues immediately
  - Runtime errors: Add try/catch, log warnings, continue execution
  - Test failures: Investigate deletion logic, verify database permissions
- **Priority**: Critical errors block completion; warnings documented for future work

## Success Criteria Summary
1. ✅ canvas.Participants cleared for sessionId
2. ✅ canvas.SessionData cleared for sessionId
3. ✅ canvas.Annotations cleared for sessionId
4. ✅ Deletion counts logged
5. ✅ Tokens still generated successfully
6. ✅ No build errors or warnings
7. ✅ Documentation complete
8. ✅ Manual test validated

---

**Auto-execute after 5 seconds unless "review" or "cancel"**
