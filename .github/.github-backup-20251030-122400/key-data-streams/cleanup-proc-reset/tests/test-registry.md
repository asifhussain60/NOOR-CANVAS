# Test Registry: cleanup-procedure-universal-token-reset

Last Updated: 2025-10-26

## Test Suites

### Phase 2: Testing & Validation
| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| test-1-token-randomization.sql | Verify tokens randomized for all active sessions | Database | ⏳ Pending | - | - |
| test-2-session-212-universal.sql | Verify SessionId 212 receives random tokens (not hardcoded) | Database | ⏳ Pending | - | - |
| test-3-expiration-reset.sql | Verify all sessions expire 24 hours from execution | Database | ⏳ Pending | - | - |
| test-4-scheduled-fields-cleared.sql | Verify ScheduledDate/Duration/Time cleared | Database | ⏳ Pending | - | - |
| test-5-transaction-rollback.sql | Verify transaction rolls back on error | Database | ⏳ Pending | - | - |
| test-6-expired-sessions.sql | Verify expired sessions remain unchanged | Database | ⏳ Pending | - | - |

## Test Execution Commands

### Run All Tests (Sequential)
```powershell
# Execute all database tests in order
.\\.github\\key-data-streams\\cleanup-procedure-universal-token-reset\\tests\\run-all-tests.ps1
```

### Run Individual Tests
```powershell
# Test 1: Token Randomization
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-1-token-randomization.sql"

# Test 2: SessionId 212 Universal Treatment
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-2-session-212-universal.sql"

# Test 3: Expiration Reset
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-3-expiration-reset.sql"

# Test 4: Scheduled Fields Cleared
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-4-scheduled-fields-cleared.sql"

# Test 5: Transaction Rollback
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-5-transaction-rollback.sql"

# Test 6: Expired Sessions Unchanged
sqlcmd -S localhost -d KSESSIONS -i ".github/key-data-streams/cleanup-procedure-universal-token-reset/tests/test-6-expired-sessions.sql"
```

## Test Coverage

- [x] Database tests (stored procedure validation)
- [ ] Unit tests (N/A - stored procedure change)
- [ ] Integration tests (N/A - isolated database change)
- [ ] E2E tests (N/A - no UI impact)
- [ ] Visual regression tests (N/A - no UI impact)
- [ ] Accessibility tests (N/A - no UI impact)

## Test Strategy

**Why Database Tests Only**:
- Stored procedure refactoring (pure SQL logic)
- No API/backend dependencies
- No UI changes
- Direct SQL validation is fastest and most reliable
- Lower-layer testing sufficient for scope

**Execution Time**: ~30 seconds total (all 6 tests)

## Test Results Summary

*(Results will be populated after test execution)*

**Total Tests**: 6  
**Passed**: -  
**Failed**: -  
**Skipped**: -  

## Notes

- All tests use transactional cleanup (no persistent test data)
- Tests can be run multiple times safely
- Each test is independent (no cross-test dependencies)
- Test execution order: Sequential (1 → 6)
