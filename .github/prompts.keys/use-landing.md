# use-landing

**Key Type:** Bug Investigation & Fix
**Status:** In Progress
**Created:** 2025-10-14
**Last Updated:** 2025-10-14

---

## Summary

Investigation of third participant bug where SessionCanvas participants panel shows only 2 participants instead of 3 when users register via UserLanding page in separate browser tabs.

**Issue:** Third registered participant consistently missing from participants panel display.

---

## Work Log

### 2025-10-14T17:30:00 - Initial Investigation Phase

**Status**: In Progress
**Commit**: 2fc513e67d44a5918b03b5e99885b240fa8c2ac3

**Changes Made**:
1. **Added TRACE Logging** - ParticipantController
   - Database query results (`GetSessionParticipants`)
   - Individual participant records logged with index
   - API transformation validation
   - Lines: 491-506, 512-523

2. **Added TRACE Logging** - SessionCanvas.razor
   - Client-side API response participant count
   - Client-side transformation validation
   - Display participant verification
   - Lines: 1570-1595

3. **Added TRACE Logging** - UserLanding.razor
   - Country loading start/success/failure tracking
   - Lines: 1213-1235

4. **Created Protocol-Compliant Orchestration Script**
   - Launches app in SEPARATE PowerShell window (per task.prompt.md Step 6.1)
   - Manages test lifecycle (build, launch, test, cleanup)
   - Location: `Scripts/run-third-participant-bug-test.ps1`

5. **Created Headed Playwright Test**
   - Tests 3 concurrent participant registrations
   - Percy integration ready
   - Validates participants panel display
   - Location: `Workspaces/TEMP/third-participant-bug.spec.ts`

**Files Modified**: 4 files
- `SPA/NoorCanvas/Controllers/ParticipantController.cs` - Trace logging
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Trace logging
- `SPA/NoorCanvas/Pages/UserLanding.razor` - Trace logging
- `Scripts/run-third-participant-bug-test.ps1` - Orchestration script (NEW)
- `Workspaces/TEMP/third-participant-bug.spec.ts` - Test file (NEW)

**Test Results**: Test infrastructure working, but test times out during registration

**Discovered Issues**:
1. ✅ **RESOLVED**: Playwright test using wrong selector (`select[name="country"]` instead of `select.user-landing-select`)
2. ⚠️ **ACTIVE**: Test times out during form filling - suggests possible blocking operation or infinite loop
3. ⚠️ **PENDING**: Need to analyze application logs from separate window to see trace output

**Next Steps**:
1. Debug test timeout issue - determine why form filling hangs
2. Analyze application logs for TRACE markers
3. Verify 3 participants actually register in database
4. Investigate participants panel rendering logic
5. Apply fix once root cause identified

**Protocol Compliance**:
- ✅ Orchestration script follows task.prompt.md Step 6.1
- ✅ App launched in separate PowerShell window
- ✅ Headed Playwright test created
- ✅ Percy integration ready
- ✅ TRACE logging inserted per debug-level parameter

---

## Technical Notes

**Database Schema**: `canvas.Participants` table
**API Endpoint**: `GET /api/participant/session/{token}/participants`
**Client Component**: `SessionCanvas.razor` - Participants tab panel
**Test Data**: Session 212 (User Token: KJAHA99L, Host Token: PQ9N5YWW)

**Hypothesis**:
- Database query may have implicit LIMIT
- SignalR broadcast may not fire for third participant
- Client-side filter may exclude third participant
- Race condition during concurrent registrations

---

## References

- Task Prompt: `.github/prompts/task.prompt.md`
- Playwright Protocol: `.github/instructions/Links/PlaywrightQuickRef.md`
- Test orchestration pattern: Step 6.1 - Orchestration scripts ONLY
