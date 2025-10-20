# UserLanding Registration Guard - Work Log

**Key:** userlanding  
**Status:** finalized  
**Date:** 2025-10-19T00:00:00Z  
**Scope:** full-stack  
**Context:** Enforce mandatory participant registration before session access

---

## Goals

1. **Security Enforcement:** Prevent unregistered users from accessing SessionWaiting, SessionCanvas, and TranscriptCanvas
2. **Architectural Compliance:** Ensure UserLanding is the ONLY entry point for participants
3. **Session Flow Integrity:** Maintain correct routing based on session status (created → waiting, active → canvas, ended → ended)
4. **Zero Breaking Changes:** Preserve all existing features (Q&A, annotations, SignalR, host workflows)

---

## Success Criteria

- ✅ Direct URL access to `/session/waiting/{token}` without registration → redirects to `/user/landing/{token}`
- ✅ Direct URL access to `/session/canvas/{token}` without registration → redirects to `/user/landing/{token}`
- ✅ Direct URL access to `/transcript/canvas/{token}` without registration → redirects to `/user/landing/{token}`
- ✅ Registered users access session pages normally (no disruption)
- ✅ Post-registration navigation works without redirect loops
- ✅ Ended sessions redirect to `/session/ended/{sessionId}`
- ✅ E2E test validates registration enforcement

---

## Architecture Summary

**Vulnerability:** Session pages (SessionWaiting, SessionCanvas, TranscriptCanvas) currently allow unregistered users to load pages by validating token only, without verifying participant registration status.

**Root Cause:** `LoadCurrentParticipantFromApiAsync()` uses fallback token-only participant lookup instead of rejecting unregistered users.

**Fix Strategy:**
1. Add registration guard in `OnInitializedAsync()` of all session pages
2. Verify participant exists via `/api/participant/session/{token}/me?userGuid={guid}` API
3. Use sessionStorage bypass flag to prevent redirect loops after registration
4. Fail-secure: redirect to UserLanding if verification fails

---

## Phases

### Phase 1: Add Registration Guard to SessionWaiting.razor
**Outcome:** Unregistered users redirected to UserLanding  
**Debug:** `[DEBUG-WORKITEM:userlanding:guard:waiting];CLEANUP_OK`  
**Files:** `SPA/NoorCanvas/Pages/SessionWaiting.razor`

**Changes:**
- Add `CheckParticipantRegistration()` method (copied from UserLanding.razor)
- Add registration verification in `OnInitializedAsync()` before loading session data
- Check sessionStorage `noor_registration_complete` flag to bypass redirect after registration
- Clear bypass flag after successful verification

---

### Phase 2: Add Registration Guard to SessionCanvas.razor
**Outcome:** Unregistered users redirected to UserLanding  
**Debug:** `[DEBUG-WORKITEM:userlanding:guard:canvas];CLEANUP_OK`  
**Files:** `SPA/NoorCanvas/Pages/SessionCanvas.razor`

**Changes:**
- Add `CheckParticipantRegistration()` method
- Add registration verification in `OnInitializedAsync()`
- Check sessionStorage bypass flag
- Clear bypass flag after verification

---

### Phase 3: Add Registration Guard to TranscriptCanvas.razor
**Outcome:** Unregistered users redirected to UserLanding  
**Debug:** `[DEBUG-WORKITEM:userlanding:guard:transcript];CLEANUP_OK`  
**Files:** `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Changes:**
- Add `CheckParticipantRegistration()` method
- Add registration verification in `OnInitializedAsync()`
- Check sessionStorage bypass flag
- Clear bypass flag after verification

---

### Phase 4: Update UserLanding.razor Post-Registration Navigation
**Outcome:** SessionStorage bypass flag prevents redirect loops  
**Debug:** `[DEBUG-WORKITEM:userlanding:bypass-flag];CLEANUP_OK`  
**Files:** `SPA/NoorCanvas/Pages/UserLanding.razor`

**Changes:**
- Set `noor_registration_complete` sessionStorage flag after successful registration (before navigation)
- Flag is set in both registration flows (active session → canvas, created session → waiting)

---

### Phase 5: Add Session Ended Handling ✅ COMPLETED
**Outcome:** Ended sessions redirect to SessionEnded page  
**Debug:** `[DEBUG-WORKITEM:userlanding:session-ended];CLEANUP_OK`  
**Files:** 
- `SPA/NoorCanvas/Pages/SessionWaiting.razor`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Changes:**
- Added `CheckSessionStatusAsync()` method to all three session pages
- Calls `/api/participant/session/{token}/validate` endpoint to retrieve session status
- Checks `Session.Status == "Ended"` BEFORE registration verification
- Redirects to `/session/ended/{sessionId}` if session has ended
- Session status check takes priority over registration guard (fail-secure pattern)

**Testing:**
- Created `Tests/UI/phase5-session-ended-redirect.spec.ts` with 4 test scenarios
- Created `Scripts/run-phase5-test.ps1` orchestration script
- Build: ✅ Zero errors, zero warnings
- Lint: ✅ All files pass validation
- Test prerequisites: Session 212 must have Status='Ended' in database

**Date Completed:** 2025-10-19  
**Commit:** cdd7b0cc  
**Tag:** checkpoint/userlanding/20251019-200414

---

### Phase 6: localStorage Infrastructure ✅ IN PROGRESS
**Outcome:** localStorage save/load with 2-day expiration and auto-clear  
**Debug:** `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`  
**Files:** `SPA/NoorCanvas/Pages/UserLanding.razor`

**User Request (Phase 6):**
Add localStorage infrastructure to UserLanding.razor - Add RegistrationStorageData class with properties Name, Email, Country, ExpiresAt, LastAccessedAt - Implement SaveRegistrationDataAsync() with 2-day expiration (DateTime.UtcNow.AddDays(2)), JSON serialization using System.Text.Json, error handling with try-catch - Implement LoadRegistrationDataAsync() with expiration check (if DateTime.UtcNow > ExpiresAt), JSON deserialization, auto-clear if expired - Storage key pattern: noor_user_registration_{token} - Add logging: COPILOT-DEBUG [localStorage] Data saved/loaded

**Changes:**
- Add `RegistrationStorageData` class (Name, Email, Country, ExpiresAt, LastAccessedAt properties)
- Add `SaveRegistrationDataAsync(string name, string email, string country)` method
  - 2-day expiration: `DateTime.UtcNow.AddDays(2)`
  - JSON serialization with System.Text.Json
  - Storage key: `noor_user_registration_{token}`
  - Error handling with try-catch (non-blocking)
- Add `LoadRegistrationDataAsync()` method
  - Expiration check: `if (DateTime.UtcNow > data.ExpiresAt)`
  - JSON deserialization
  - Auto-clear if expired
  - Returns bool success indicator
- Add logging: `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`

**Testing:**
- Created `Tests/UI/phase6-localstorage-infrastructure.spec.ts` - localStorage save/load verification
- Created `Scripts/run-phase6-test.ps1` - Test orchestration
- Build: Pending
- Lint: Pending
- Test: Pending

**Date Started:** 2025-10-19  
**Status:** In Progress

---

## Test Plan

**Functional E2E Test:**
- **Script:** `Tests/UI/registration-guard-enforcement.spec.ts`
- **Orchestrator:** `Scripts/run-registration-guard-test.ps1`
- **Fixtures:** Session 212, Host Token: PQ9N5YWW, User Token: KJAHA99L
- **Approach:** PowerShell orchestration (DevMode required for SignalR testing)

**Visual Regression:** Not applicable (no UI changes)

---

## Decisions

**Enhancements:**
- ❌ **Centralized Registration Guard Service:** Deferred (DRY principle vs. implementation complexity)
- ❌ **Rate Limiting:** Deferred (low risk for internal app)
- ❌ **Telemetry for Bypass Attempts:** Deferred (optional security enhancement)

**Token Expiration Handling:** Redirect to UserLanding with error message (fail-secure)

**Multi-Tab Behavior:** No change needed (localStorage shared across tabs)

**API Failure Handling:** Fail-secure → redirect to UserLanding on API error

---

## References

- `.github/instructions/Links/PlaywrightQuickRef.md` (E2E test patterns)
- `.github/instructions/Links/PlaywrightTestPaths.MD` (test organization)
- `.github/instructions/Links/InfrastructureQuickRef.md` (API endpoints, database schema)
- `SPA/NoorCanvas/Pages/UserLanding.razor` (lines 1145-1194: `CheckParticipantRegistrationAsync()` reference implementation)

---

## Git Summary

**Commit Message:**
```
[userlanding] Enforce mandatory registration guard for session pages

- Add registration verification to SessionWaiting, SessionCanvas, TranscriptCanvas
- Prevent unregistered users from bypassing UserLanding entry point
- Implement sessionStorage bypass flag to prevent redirect loops
- Add session ended handling for expired sessions
- Create E2E test for registration enforcement

Fixes: Registration bypass vulnerability allowing unregistered access
Debug: [DEBUG-WORKITEM:userlanding:guard:{waiting|canvas|transcript}];CLEANUP_OK
```

---

**Plan Finalized:** 2025-10-19  
**Ready for Execution:** ✅
