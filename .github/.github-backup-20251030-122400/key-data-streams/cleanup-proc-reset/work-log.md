# Work Log: cleanup-procedure-universal-token-reset

**Key**: cleanup-procedure-universal-token-reset  
**Created**: 2025-10-26  
**Status**: Planning Complete - Ready for Execution

---

## Timeline

### 2025-10-26 - Planning Phase

**Request**: Update canvas.CleanCanvas stored procedure to reset all tokens in the table and make them unexpired (not just SessionId 212)

**Analysis**:
- Current procedure has special hardcoded treatment for SessionId 212
- Tokens set to 'PQ9N5YWW' and 'KJAHA99L' for session 212
- Other sessions excluded from token reset (only expiration extended)
- Security concern: predictable tokens

**Proposed Solution**:
- Remove SessionId 212 special case
- Generate random 8-character tokens for ALL active sessions
- Consolidate two UPDATE statements into one
- Clear scheduled fields for all sessions
- Maintain transaction safety

**Phases Planned**:
1. Phase 1: Update Stored Procedure Logic (15 min)
2. Phase 2: Testing & Validation (20 min)

**Total Estimated Effort**: 35 minutes

---

## Assumptions Validated

✅ `Scripts/canvas.CleanCanvas.sql` exists  
✅ Sessions table structure confirmed (HostToken, UserToken, ExpiresAt, etc.)  
✅ Current behavior analyzed (two separate UPDATEs)  
✅ Test strategy: Database layer tests (preferred for stored procedures)  
✅ No UI/API dependencies - pure database change  

---

## Open Questions

None - straightforward refactoring

---

## Enhancements Considered

**User Selected**: None (proceed with base plan)

**Available Enhancements**:
- A. Add logging table to track cleanup executions (audit trail) - Medium effort
- B. Add parameter to control expiration hours (default 24) - Low effort
- C. Create backup/restore mechanism for accidental cleanups - Medium effort

---

## Test Strategy

**Database Tests** (6 scenarios):
1. Token Randomization
2. SessionId 212 Universal Treatment
3. Expiration Reset Validation
4. Scheduled Fields Cleared
5. Transaction Rollback on Error
6. Expired Sessions Unchanged

**Execution Time**: ~30 seconds total

**Why Database Tests Only**:
- Stored procedure change (no UI/API impact)
- Direct SQL validation fastest and most reliable
- No need for higher-layer tests

---

## Risk Assessment

**Risk Level**: Low

**Mitigations**:
- Backup procedure before modification
- Comprehensive test suite (6 test scenarios)
- Transaction safety preserved
- Rollback plan documented

---

## Next Steps

1. User says "proceed" to begin Phase 1
2. Execute Phase 1: Update stored procedure
3. Execute Phase 2: Run database tests
4. Verify all tests pass
5. Mark plan complete

---

## Commits Planned

1. `plan(cleanup-procedure-universal-token-reset): Create plan for universal token reset`
2. `feat(cleanup-procedure-universal-token-reset): Phase 1 - Update CleanCanvas procedure`
3. `test(cleanup-procedure-universal-token-reset): Phase 2 - Database validation tests`

---

## Notes

- Token generation uses SQL Server NEWID() for randomness
- 8-character format preserved for compatibility
- Democratic cleanup: all sessions treated equally
- Security improvement: no predictable tokens
