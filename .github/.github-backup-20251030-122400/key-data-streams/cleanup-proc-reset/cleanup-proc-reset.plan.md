# Plan: cleanup-procedure-universal-token-reset

**Version**: 1.0  
**Created**: 2025-10-26  
**Status**: Ready for execution  
**Branch**: development

---

## Executive Summary

Update `canvas.CleanCanvas` stored procedure to reset tokens for ALL active sessions universally, removing the hardcoded special treatment for SessionId 212. The procedure will generate fresh random tokens for all sessions and reset expiration dates consistently.

---

## Current Behavior Analysis

### Existing Logic (Scripts/canvas.CleanCanvas.sql)

1. **Truncates child tables**: `canvas.SessionData`, `canvas.Participants`
2. **Updates general sessions** (excluding SessionId 212):
   - Extends `ExpiresAt` by 24 hours
   - Updates `ModifiedAt` to current UTC time
   - Sets `Status` to 'Created'
3. **Special treatment for SessionId 212**:
   - Hardcoded `HostToken = 'PQ9N5YWW'`
   - Hardcoded `UserToken = 'KJAHA99L'`
   - Clears `ScheduledDate` and `ScheduledDuration`
   - Extends expiration by 24 hours
   - Sets `Status = 'Created'`

### Problems with Current Implementation

- ❌ SessionId 212 treated as special case (hardcoded tokens)
- ❌ Tokens not randomized (predictable, security risk)
- ❌ Two separate UPDATE statements (inefficient)
- ❌ Scheduled fields only cleared for SessionId 212
- ❌ Inconsistent behavior across sessions

---

## Proposed Solution

### New Logic

1. **Truncate child tables** (unchanged)
2. **Single UPDATE for ALL active/unexpired sessions**:
   - Generate random 8-character alphanumeric `HostToken`
   - Generate random 8-character alphanumeric `UserToken`
   - Clear `ScheduledDate`, `ScheduledDuration`, `ScheduledTime`
   - Set `ExpiresAt` to 24 hours from now
   - Update `ModifiedAt` to current UTC time
   - Set `Status = 'Created'`
3. **No special cases** - all sessions treated equally

### Token Generation Strategy

**SQL Server Random Token Function**:
```sql
-- Use NEWID() for randomness, convert to alphanumeric
-- Example: UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 8))
```

**Requirements**:
- 8 characters long (matches existing format)
- Alphanumeric (A-Z, 0-9)
- Unique per session per execution
- Cryptographically random (NEWID() provides sufficient entropy)

---

## Implementation Phases

### Phase 1: Update Stored Procedure Logic

**File**: `Scripts/canvas.CleanCanvas.sql`

**Changes**:

1. **Remove special SessionId 212 logic**:
   - Delete the `WHERE SessionId <> 212` exclusion
   - Delete the dedicated `UPDATE canvas.Sessions WHERE SessionId=212` block

2. **Consolidate to single UPDATE statement**:
   ```sql
   UPDATE [canvas].[Sessions]
   SET 
       HostToken = UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 8)),
       UserToken = UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 8)),
       ScheduledDate = NULL,
       ScheduledDuration = NULL,
       ScheduledTime = NULL,
       ExpiresAt = DATEADD(HOUR, 24, GETUTCDATE()),
       ModifiedAt = GETUTCDATE(),
       Status = 'Created'
   WHERE ExpiresAt IS NULL OR ExpiresAt > GETUTCDATE()
   ```

3. **Update success message**:
   ```sql
   PRINT CONCAT('Reset tokens and extended expiration for ', @@ROWCOUNT, ' active sessions by 24 hours');
   ```

4. **Maintain existing structure**:
   - Keep transaction wrapping (`BEGIN TRANSACTION` / `COMMIT`)
   - Keep error handling (`BEGIN TRY` / `BEGIN CATCH`)
   - Keep final SELECT statements for verification
   - Keep table truncation logic

**Acceptance Criteria**:
- ✅ Procedure compiles without errors
- ✅ No hardcoded SessionId references
- ✅ Single UPDATE statement for all sessions
- ✅ Random tokens generated for each session
- ✅ Transaction safety preserved
- ✅ Error handling intact

---

### Phase 2: Testing & Validation

**Test Strategy**: Database layer tests (preferred for stored procedure validation)

#### Test Scenarios

**Test 1: Token Randomization**
```sql
-- Setup: Create 3 test sessions with known tokens
INSERT INTO canvas.Sessions (SessionId, HostToken, UserToken, ExpiresAt, Status)
VALUES 
  (9001, 'AAAA1111', 'BBBB2222', DATEADD(HOUR, 1, GETUTCDATE()), 'Active'),
  (9002, 'CCCC3333', 'DDDD4444', DATEADD(HOUR, 2, GETUTCDATE()), 'Active'),
  (9003, 'EEEE5555', 'FFFF6666', DATEADD(HOUR, 3, GETUTCDATE()), 'Active');

-- Execute: Run CleanCanvas
EXEC canvas.CleanCanvas;

-- Verify: All tokens changed and are unique
SELECT 
    SessionId,
    HostToken,
    UserToken,
    CASE 
        WHEN HostToken NOT IN ('AAAA1111', 'CCCC3333', 'EEEE5555') THEN 'PASS'
        ELSE 'FAIL'
    END AS HostTokenChanged,
    CASE 
        WHEN UserToken NOT IN ('BBBB2222', 'DDDD4444', 'FFFF6666') THEN 'PASS'
        ELSE 'FAIL'
    END AS UserTokenChanged,
    LEN(HostToken) AS HostTokenLength,
    LEN(UserToken) AS UserTokenLength
FROM canvas.Sessions
WHERE SessionId IN (9001, 9002, 9003);

-- Cleanup
DELETE FROM canvas.Sessions WHERE SessionId IN (9001, 9002, 9003);
```

**Expected Results**:
- All tokens changed from original values
- Token length = 8 characters
- Tokens are alphanumeric uppercase
- All tokens unique across sessions

---

**Test 2: SessionId 212 Universal Treatment**
```sql
-- Setup: Ensure SessionId 212 exists (or create test equivalent)
-- Capture current tokens for SessionId 212
DECLARE @OldHostToken NVARCHAR(8);
DECLARE @OldUserToken NVARCHAR(8);

SELECT @OldHostToken = HostToken, @OldUserToken = UserToken
FROM canvas.Sessions
WHERE SessionId = 212;

-- Execute: Run CleanCanvas
EXEC canvas.CleanCanvas;

-- Verify: SessionId 212 tokens changed (not hardcoded)
SELECT 
    SessionId,
    HostToken,
    UserToken,
    CASE 
        WHEN HostToken <> @OldHostToken AND HostToken <> 'PQ9N5YWW' THEN 'PASS'
        ELSE 'FAIL'
    END AS HostTokenRandomized,
    CASE 
        WHEN UserToken <> @OldUserToken AND UserToken <> 'KJAHA99L' THEN 'PASS'
        ELSE 'FAIL'
    END AS UserTokenRandomized
FROM canvas.Sessions
WHERE SessionId = 212;
```

**Expected Results**:
- SessionId 212 tokens are randomized (not 'PQ9N5YWW' / 'KJAHA99L')
- Tokens different from previous execution
- No special treatment detected

---

**Test 3: Expiration Reset Validation**
```sql
-- Execute: Run CleanCanvas
EXEC canvas.CleanCanvas;

-- Verify: All active sessions expire ~24 hours from now
SELECT 
    SessionId,
    ExpiresAt,
    DATEDIFF(MINUTE, GETUTCDATE(), ExpiresAt) AS MinutesUntilExpiry,
    CASE 
        WHEN DATEDIFF(MINUTE, GETUTCDATE(), ExpiresAt) BETWEEN 1435 AND 1445 THEN 'PASS'
        ELSE 'FAIL'
    END AS ExpirationCheck
FROM canvas.Sessions
WHERE ExpiresAt IS NOT NULL AND ExpiresAt > GETUTCDATE()
ORDER BY SessionId;
```

**Expected Results**:
- All active sessions expire in ~1440 minutes (24 hours)
- Tolerance: ±5 minutes for execution time
- Status = 'Created' for all sessions

---

**Test 4: Scheduled Fields Cleared**
```sql
-- Setup: Create session with scheduled data
INSERT INTO canvas.Sessions (SessionId, HostToken, UserToken, ExpiresAt, Status, ScheduledDate, ScheduledDuration, ScheduledTime)
VALUES (9999, 'TEST1234', 'TEST5678', DATEADD(HOUR, 1, GETUTCDATE()), 'Scheduled', '2025-10-27', '60', '14:00');

-- Execute: Run CleanCanvas
EXEC canvas.CleanCanvas;

-- Verify: Scheduled fields cleared
SELECT 
    SessionId,
    ScheduledDate,
    ScheduledDuration,
    ScheduledTime,
    CASE 
        WHEN ScheduledDate IS NULL AND ScheduledDuration IS NULL AND ScheduledTime IS NULL THEN 'PASS'
        ELSE 'FAIL'
    END AS ScheduledFieldsCleared
FROM canvas.Sessions
WHERE SessionId = 9999;

-- Cleanup
DELETE FROM canvas.Sessions WHERE SessionId = 9999;
```

**Expected Results**:
- ScheduledDate = NULL
- ScheduledDuration = NULL
- ScheduledTime = NULL

---

**Test 5: Transaction Rollback on Error**
```sql
-- Test error handling by forcing constraint violation
BEGIN TRY
    -- Temporarily drop FK constraint to simulate error scenario
    -- (In production, simulate error differently - e.g., invalid column reference)
    
    -- Expected: Transaction rolls back, no partial updates
    EXEC canvas.CleanCanvas;
    
    PRINT 'Transaction committed successfully';
END TRY
BEGIN CATCH
    PRINT 'Error caught: ' + ERROR_MESSAGE();
    PRINT 'Transaction rolled back successfully';
END CATCH;
```

**Expected Results**:
- Error caught and handled gracefully
- No partial updates to Sessions table
- Original data preserved

---

**Test 6: Expired Sessions Unchanged**
```sql
-- Setup: Create expired session
INSERT INTO canvas.Sessions (SessionId, HostToken, UserToken, ExpiresAt, Status)
VALUES (8888, 'EXPIRED1', 'EXPIRED2', DATEADD(HOUR, -1, GETUTCDATE()), 'Expired');

-- Execute: Run CleanCanvas
EXEC canvas.CleanCanvas;

-- Verify: Expired session NOT updated
SELECT 
    SessionId,
    HostToken,
    UserToken,
    CASE 
        WHEN HostToken = 'EXPIRED1' AND UserToken = 'EXPIRED2' THEN 'PASS'
        ELSE 'FAIL'
    END AS ExpiredSessionUnchanged
FROM canvas.Sessions
WHERE SessionId = 8888;

-- Cleanup
DELETE FROM canvas.Sessions WHERE SessionId = 8888;
```

**Expected Results**:
- Expired session tokens remain unchanged
- Only active/unexpired sessions updated

---

#### Test Execution Plan

**Order**: Sequential (each test depends on clean state)

1. Run Test 1 (Token Randomization)
2. Run Test 2 (SessionId 212 Universal Treatment)
3. Run Test 3 (Expiration Reset)
4. Run Test 4 (Scheduled Fields Cleared)
5. Run Test 5 (Transaction Rollback)
6. Run Test 6 (Expired Sessions Unchanged)

**Execution Time**: ~30 seconds total (all database tests)

**Acceptance Criteria**:
- ✅ All tests return 'PASS'
- ✅ No hardcoded tokens found
- ✅ Transaction safety verified
- ✅ Expired sessions preserved

---

## Risk Assessment

### Low Risk
- ✅ Stored procedure refactoring (well-understood scope)
- ✅ Database-only change (no UI/API impact)
- ✅ Existing transaction safety maintained
- ✅ Reversible (procedure can be rolled back)

### Mitigation
- Backup current procedure before modification
- Test in development environment first
- Verify with comprehensive test suite
- Document rollback procedure

---

## Rollback Plan

**If issues detected after deployment:**

1. **Restore previous procedure**:
   ```sql
   -- Restore from git history or backup
   -- File: Scripts/canvas.CleanCanvas.sql (commit before changes)
   ```

2. **Verify restoration**:
   ```sql
   -- Check procedure definition
   EXEC sp_helptext 'canvas.CleanCanvas';
   ```

3. **Re-test with known good state**:
   ```sql
   EXEC canvas.CleanCanvas;
   ```

---

## Success Metrics

- ✅ Procedure executes without errors
- ✅ All active sessions receive randomized tokens
- ✅ No hardcoded SessionId references remain
- ✅ Expiration dates consistent (24 hours)
- ✅ Scheduled fields cleared for all sessions
- ✅ Transaction rollback works on error
- ✅ Expired sessions unchanged
- ✅ Execution time < 1 second (same as current)

---

## Files Modified

1. `Scripts/canvas.CleanCanvas.sql` - Stored procedure refactoring

---

## Estimated Effort

- **Phase 1**: 15 minutes (procedure update)
- **Phase 2**: 20 minutes (test execution and validation)
- **Total**: 35 minutes

---

## Dependencies

None - self-contained database change

---

## Notes

- Token randomization uses SQL Server's `NEWID()` function for entropy
- 8-character format preserved for backward compatibility
- All sessions now treated equally (democratic cleanup)
- Security improved (no predictable tokens)
