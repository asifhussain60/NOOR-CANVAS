# User Landing Registration Guard & localStorage - Implementation Checklist

**Branch:** `user-landing`  
**Key:** `userlanding`  
**Session:** 212 (Host: PQ9N5YWW, User: KJAHA99L)

## Progress Tracker

- [x] **Phase 1:** SessionWaiting Registration Guard ✅ (Commit: ef449b10)
- [ ] **Phase 2:** SessionCanvas Registration Guard
- [ ] **Phase 3:** TranscriptCanvas Registration Guard
- [ ] **Phase 4:** UserLanding Post-Registration Navigation
- [ ] **Phase 5:** Session Ended Handling
- [ ] **Phase 6:** localStorage Infrastructure
- [ ] **Phase 7:** Expiration Extension Logic
- [ ] **Phase 8:** Data Validation
- [ ] **Phase 9:** Save/Load Integration & Auto-Navigation
- [ ] **Phase 10:** Debug Panel Clear Button
- [ ] **Phase 11:** E2E Testing Complete Suite

---

## 📋 Individual Task Prompts

### Phase 1: SessionWaiting Registration Guard ✅ COMPLETED

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to SessionWaiting.razor - Copy CheckParticipantRegistration() method from UserLanding.razor lines 1145-1194 - Add registration verification in OnInitializedAsync() BEFORE loading session data - Check sessionStorage noor_registration_complete flag to bypass redirect after registration - Clear bypass flag after verification - Add logging for security monitoring" 

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to SessionWaiting - Prevent unregistered users from accessing waiting room - Check sessionStorage bypass flag for post-registration navigation - Redirect to UserLanding if not registered
Debug: [DEBUG-WORKITEM:userlanding:guard:waiting];CLEANUP_OK
Test: Manual verification - navigate to /session/waiting/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L
```

---

### Phase 2: SessionCanvas Registration Guard

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to SessionCanvas.razor - Add CheckParticipantRegistration() method (same implementation as Phase 1) - Add registration verification in OnInitializedAsync() before loading session - Check sessionStorage bypass flag - Clear bypass flag after verification - Add security logging"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to SessionCanvas - Prevent unregistered users from accessing active session canvas - Check sessionStorage bypass flag - Redirect to UserLanding if not registered
Debug: [DEBUG-WORKITEM:userlanding:guard:canvas];CLEANUP_OK
Test: Manual verification - navigate to /session/canvas/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L
```

---

### Phase 3: TranscriptCanvas Registration Guard

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to TranscriptCanvas.razor - Add CheckParticipantRegistration() method - Add registration verification in OnInitializedAsync() - Check sessionStorage bypass flag - Clear bypass flag after verification - Add security logging"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to TranscriptCanvas - Prevent unregistered users from accessing transcript view - Complete registration enforcement across all session pages
Debug: [DEBUG-WORKITEM:userlanding:guard:transcript];CLEANUP_OK
Test: Manual verification - navigate to /transcript/canvas/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L
```

---

### Phase 4: UserLanding Post-Registration Navigation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Update UserLanding.razor post-registration navigation - Locate HandleUserRegistration() method - Set sessionStorage flag noor_registration_complete=true AFTER successful registration API call and BEFORE navigation to SessionCanvas or SessionWaiting - Add logging for bypass flag creation"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add sessionStorage bypass flag to UserLanding - Set bypass flag after successful registration - Prevent redirect loops when navigating to session pages
Debug: [DEBUG-WORKITEM:userlanding:bypass-flag];CLEANUP_OK
Test: Complete registration flow, verify sessionStorage flag is set, verify navigation to session page without redirect loop
```

---

### Phase 5: Session Ended Handling

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add session ended handling - Update registration guard in SessionWaiting, SessionCanvas, TranscriptCanvas to check session status BEFORE registration verification - Add session status check using validation endpoint - If status equals ended redirect to /session/ended/{sessionId} - Add logging for session status transitions"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add session ended handling - Check session status in registration guard - Redirect to SessionEnded page if status = ended
Debug: [DEBUG-WORKITEM:userlanding:session-ended];CLEANUP_OK
Test: Simulate ended session (manually set session status or use test session), verify redirect to SessionEnded page
```

---

### Phase 6: localStorage Infrastructure

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add localStorage infrastructure to UserLanding.razor - Add RegistrationStorageData class with properties Name, Email, Country, ExpiresAt, LastAccessedAt - Implement SaveRegistrationDataAsync() with 2-day expiration (DateTime.UtcNow.AddDays(2)), JSON serialization using System.Text.Json, error handling with try-catch - Implement LoadRegistrationDataAsync() with expiration check (if DateTime.UtcNow > ExpiresAt), JSON deserialization, auto-clear if expired - Storage key pattern: noor_user_registration_{token} - Add logging: COPILOT-DEBUG [localStorage] Data saved/loaded"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage infrastructure - Implement RegistrationStorageData model - Add SaveRegistrationDataAsync and LoadRegistrationDataAsync - 2-day expiration with auto-clear
Debug: [DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK
Test: Use browser DevTools to verify localStorage entry after registration, verify data structure matches RegistrationStorageData model
```

---

### Phase 7: Expiration Extension Logic

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Implement localStorage expiration extension - Implement ExtendExpirationAsync() method to add 24 hours to ExpiresAt timestamp (data.ExpiresAt.AddHours(24)), update LastAccessedAt to DateTime.UtcNow, save updated data back to localStorage using JSON serialization - Update LoadRegistrationDataAsync() to call ExtendExpirationAsync() after successful load and before returning data - Add logging: COPILOT-DEBUG [localStorage] Expiration extended by 24h - NewExpiresAt: {date}"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage expiration extension - Implement 24-hour rolling extension on each access - Update LastAccessedAt timestamp
Debug: [DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK
Test: Load registration data, check localStorage expiresAt before and after, verify 24 hours added
```

---

### Phase 8: Data Validation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Implement localStorage data validation - Implement ValidateRegistrationDataAsync() method with email regex validation (pattern: ^[^@\s]+@[^@\s]+\.[^@\s]+$), name non-empty check (string.IsNullOrWhiteSpace), country code validation - Call validation in LoadRegistrationDataAsync() before using data - If validation fails call ClearLocalStorageAsync() and return false - Add logging: COPILOT-DEBUG [localStorage:validation] Invalid data - clearing"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage data validation - Validate email format, name non-empty, country code - Auto-clear if validation fails
Debug: [DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK
Test: Manually corrupt localStorage with invalid email, reload page, verify data cleared and form empty
```

---

### Phase 9: Save/Load Integration and Auto-Navigation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Integrate localStorage save/load and auto-navigation - Locate HandleUserRegistration() method, add SaveRegistrationDataAsync(Model.Name, Model.Email, Model.CountryCode) call AFTER successful API registration and BEFORE navigation, wrap in try-catch (don't block navigation if save fails) - Locate LoadSessionInfoAsync() method, add LoadRegistrationDataAsync() call AFTER successful token validation - If data valid: call ValidateRegistrationDataAsync(), call ExtendExpirationAsync(), populate Model.Name/Email/CountryCode, call StateHasChanged() - Auto-navigate based on session status: if created set bypass flag and navigate to /session/waiting/{token}, if active/started set bypass flag and navigate to /session/canvas/{token}, if ended navigate to /session/ended/{sessionId} - Add logging for auto-load and auto-navigation"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Integrate localStorage save/load and auto-navigation - Save on successful registration - Auto-load and validate on token validation - Auto-navigate based on session status (created/active/ended)
Debug: [DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK and [DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK
Test: Complete registration, close browser, reopen /user/landing/{token}, verify form pre-populated and auto-navigation occurs
```

---

### Phase 10: Debug Panel Clear Button

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add debug panel clear localStorage button - Locate GetUserLandingDebugActions() method - Implement ClearLocalStorageAsync() to remove localStorage item noor_user_registration_{token}, clear Model.Name/Email/CountryCode to empty strings, call StateHasChanged(), add logging NOOR-DEBUG-PANEL: Local storage cleared - Add debug action with Label=Clear Local Storage, Icon=fa-solid fa-trash-can, Action=async () => await ClearLocalStorageAsync()"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add debug panel clear localStorage button - Implement ClearLocalStorageAsync - Add debug action to clear storage and form fields
Debug: [DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK
Test: Open debug panel (Ctrl+D), click Clear Local Storage button, verify form fields cleared and localStorage empty in DevTools
```

---

### Phase 11: E2E Testing Complete Suite

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Create E2E testing suite - Create Tests/UI/registration-guard-enforcement.spec.ts with 8 test scenarios: 1) Unregistered user redirect from SessionWaiting, 2) Unregistered user redirect from SessionCanvas, 3) Registered user can access SessionCanvas, 4) Ended session redirect, 5) localStorage save and auto-load, 6) localStorage expiration after 2 days, 7) Token isolation (independent storage), 8) Debug panel clear localStorage - Create Scripts/run-registration-guard-test.ps1 PowerShell orchestration script to launch app (dotnet run), wait for readiness (15 seconds), run Playwright test (npx playwright test registration-guard-enforcement.spec.ts --headed), stop app - Use Session 212 fixtures (Host: PQ9N5YWW, User: KJAHA99L)"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add E2E tests for registration guard and localStorage - 8 test scenarios covering all flows - PowerShell orchestration script - Registration guard + localStorage validation
Test: Run orchestration script, verify all 8 scenarios pass
```

---

## 📝 Notes

- All work is performed on the `user-landing` branch
- Each phase should be committed separately for clean git history
- Manual testing should be performed after each phase before moving to the next
- Debug markers use `;CLEANUP_OK` suffix for easy removal later
- Session 212 tokens are used for testing (Host: PQ9N5YWW, User: KJAHA99L)