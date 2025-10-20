# User Landing Registration Guard & localStorage - Implementation Checklist

**Branch:** `user-landing`  
**Key:** `userlanding`  
**Session:** 212 (Host: PQ9N5YWW, User: KJAHA99L)

## 🔄 Phase Execution Workflow

**CRITICAL: Each phase MUST follow the complete task.prompt.md workflow before moving to the next phase.**

### Phase Execution Steps (per task.prompt.md)

1. **Step 0:** Verify on `development` branch (`git branch --show-current`)
2. **Step 1:** Create checkpoint commit (`git commit -m "checkpoint: pre-task userlanding-phase{N}"`)
3. **Step 2:** Context gathering
   - Read `.github/prompts.keys/userlanding/userlanding.md` (key data stream)
   - Record user request in key data stream (succinct summary)
   - Detect high-priority constraints (ALL CAPS emphasis)
   - Load file mappings for referenced files
4. **Step 3:** Plan implementation for specific phase
5. **Step 4:** User approval (MANDATORY - wait for explicit "proceed" before execution)
6. **Step 5:** Execute phase implementation
7. **Step 6:** Validate
   - Build passes (zero errors, zero warnings)
   - Lint validation passes (all modified files)
   - Create Playwright tests (automatic for UI changes)
   - Run Playwright tests via orchestration script
8. **Step 7:** Confirm phase completion to user
9. **Step 8:** Update key data stream
   - Record user request (if not already done in Step 2.2.1)
   - Document work completed
   - Record git commit SHA
10. **Step 8.4:** Create checkpoint commit and git tag
    - Commit: `[userlanding] {Phase description}`
    - Tag: `checkpoint/userlanding/{timestamp}`
11. **User Approval:** Get explicit approval to move to next phase

### Commit Message Examples

- Phase 1: `[userlanding] Add registration guard to SessionWaiting - Prevent unregistered users from accessing waiting room`
- Phase 2: `[userlanding] Add registration guard to SessionCanvas - Prevent unregistered users from accessing active session canvas`
- Phase 3: `[userlanding] Add registration guard to TranscriptCanvas - Prevent unregistered users from accessing transcript view`
- Phase 4: `[userlanding] Add sessionStorage bypass flag to UserLanding - Set bypass flag after successful registration`

### Phase Completion Checklist

Before moving to next phase, verify:
- [ ] Implementation complete
- [ ] Build passes (zero errors, zero warnings)
- [ ] Lint validation passes (all modified files)
- [ ] Playwright tests created and passing
- [ ] Key data stream updated
- [ ] Checkpoint commit and tag created
- [ ] User approves moving to next phase

---

## ⚠️ CRITICAL PLAYWRIGHT TESTING GUIDELINES

**Lessons learned from Phase 3 implementation - READ BEFORE CREATING ANY TESTS:**

1. **URL Patterns & Port Redirection**
   - App redirects HTTP port 9090 → HTTPS port 9091
   - NEVER hardcode full URLs like `http://localhost:9090/user/landing/KJAHA99L`
   - ALWAYS use patterns: `**/user/landing/**`, `**/session/canvas/**`, etc.
   - Pattern matching works across HTTP/HTTPS and different ports

2. **Server-side vs Browser-side Logging**
   - `Logger.LogInformation()`, `Logger.LogWarning()`, `Logger.LogError()` = **SERVER-SIDE ONLY**
   - Server-side logs (with debug markers like `[DEBUG-WORKITEM:userlanding:*]`) **DO NOT** appear in browser console
   - Only client-side JavaScript (JSInterop calls, console.log) appears in browser console
   - **Don't test for server log markers in browser console - IT WILL ALWAYS FAIL**

3. **Behavioral Testing Focus**
   - Verify functionality through BEHAVIOR, not log messages:
     - Did the redirect happen? → Check `page.url()` or `page.waitForURL(pattern)`
     - Is sessionStorage flag set/cleared? → Use `page.evaluate(() => sessionStorage.getItem(...))`
     - Are form fields populated? → Use `page.locator('input').inputValue()`
     - Is localStorage data correct? → Use `page.evaluate(() => localStorage.getItem(...))`
   - If behavior is correct, the implementation is working (regardless of logs)

4. **JavaScript Error Handling**
   - Unrelated JavaScript errors (DOM manipulation, redirect timing issues) should be **warnings**, not test failures
   - Only fail on errors directly related to the feature being tested
   - Example: `"Failed to execute 'appendChild' on 'Node'"` during redirect is a timing issue, not a guard failure

5. **Test Structure Best Practices**
   - Use `page.on('console')` to capture logs for debugging, not for assertions
   - Use `page.on('pageerror')` to monitor errors, warn about them, don't auto-fail unless relevant
   - Always verify behavior first (redirects, data, state), logs second
   - Comment why certain checks are skipped (e.g., "server-side logs won't appear in browser")

6. **Session 212 Data Verification**
   - Before running tests, verify Session 212 exists in database:
     ```sql
     SELECT SessionId, UserToken, HostToken, Status, ExpiresAt 
     FROM canvas.Sessions 
     WHERE SessionId = 212
     ```
   - Expected values: SessionId=212, UserToken=KJAHA99L, HostToken=PQ9N5YWW, Status=Created
   - If session doesn't exist or is expired, tests will fail with token validation errors
   - Check app logs for "Sessions matching token 'KJAHA99L': 0" - indicates session not found

7. **UserLanding Form Visibility & Selectors**
   - The registration form is **hidden until token validation completes**
   - ALWAYS wait for form elements to be visible: `await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 })`
   - Form uses Blazor InputText/InputSelect components, not standard HTML form elements
   - Correct selectors:
     - Name: `#name-input` or `input.user-landing-input` (first input)
     - Email: `input.user-landing-input[placeholder="Enter your email"]`
     - Country: `select.user-landing-select`
     - Submit button: `button.user-landing-button`
   - DON'T use `input[name="..."]` or `button[type="submit"]` - Blazor components don't use name/type attributes
   - Wait for navigation completion, then add 1 second delay for registration guards to execute and clear bypass flags

## Progress Tracker

- [x] **Phase 1:** SessionWaiting Registration Guard ✅ (Commit: ef449b10)
  - [x] Test: Playwright E2E test with browser log validation ✅
- [x] **Phase 2:** SessionCanvas Registration Guard ✅
  - [x] Test: Playwright E2E test with browser log validation ✅
- [x] **Phase 3:** TranscriptCanvas Registration Guard ✅
  - [x] Test: Playwright E2E test with browser log validation ✅
- [x] **Phase 4:** UserLanding Post-Registration Navigation ✅
  - [x] Test: Playwright E2E test with browser log validation ✅
- [x] **Phase 5:** Session Ended Handling ✅
  - [x] Test: Playwright E2E test with browser log validation ✅
- [ ] **Phase 6:** localStorage Infrastructure
  - [ ] Test: Playwright E2E test with browser log validation
- [ ] **Phase 7:** Expiration Extension Logic
  - [ ] Test: Playwright E2E test with browser log validation
- [ ] **Phase 8:** Data Validation
  - [ ] Test: Playwright E2E test with browser log validation
- [ ] **Phase 9:** Save/Load Integration & Auto-Navigation
  - [ ] Test: Playwright E2E test with Percy visual regression
- [ ] **Phase 10:** Debug Panel Clear Button
  - [ ] Test: Playwright E2E test with Percy visual regression
- [ ] **Phase 11:** E2E Testing Complete Suite
  - [ ] Test: Comprehensive Playwright test suite execution

---

## 📋 Individual Task Prompts

### Phase 1: SessionWaiting Registration Guard ✅ COMPLETED

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to SessionWaiting.razor - Copy CheckParticipantRegistration() method from UserLanding.razor lines 1145-1194 - Add registration verification in OnInitializedAsync() BEFORE loading session data - Check sessionStorage noor_registration_complete flag to bypass redirect after registration - Clear bypass flag after verification - Add logging for security monitoring" 

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to SessionWaiting - Prevent unregistered users from accessing waiting room - Check sessionStorage bypass flag for post-registration navigation - Redirect to UserLanding if not registered
Debug: [DEBUG-WORKITEM:userlanding:guard:waiting];CLEANUP_OK
Test: Manual verification - navigate to /session/waiting/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L

**Playwright Test:**
Create Tests/UI/phase1-session-waiting-guard.spec.ts - Test unregistered user redirect from SessionWaiting to UserLanding. IMPORTANT: Use URL pattern '**/user/landing/**' for redirect verification (app redirects HTTP port 9090 to HTTPS port 9091). Verify redirect behavior (test bypass flag mechanism by setting sessionStorage flag and confirming no redirect). NOTE: [DEBUG-WORKITEM:userlanding:guard:waiting] markers are server-side logs (Logger.LogWarning/LogInformation) and won't appear in browser console - redirect behavior proves guard is working. JavaScript errors unrelated to guard functionality should be warnings, not failures.
Create Scripts/run-phase1-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase1-session-waiting-guard.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 2: SessionCanvas Registration Guard

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to SessionCanvas.razor - Add CheckParticipantRegistration() method (same implementation as Phase 1) - Add registration verification in OnInitializedAsync() before loading session - Check sessionStorage bypass flag - Clear bypass flag after verification - Add security logging"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to SessionCanvas - Prevent unregistered users from accessing active session canvas - Check sessionStorage bypass flag - Redirect to UserLanding if not registered
Debug: [DEBUG-WORKITEM:userlanding:guard:canvas];CLEANUP_OK
Test: Manual verification - navigate to /session/canvas/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L

**Playwright Test:**
Create Tests/UI/phase2-session-canvas-guard.spec.ts - Test unregistered user redirect from SessionCanvas to UserLanding. IMPORTANT: Use URL pattern '**/user/landing/**' for redirect verification (app redirects HTTP port 9090 to HTTPS port 9091). Verify redirect behavior (test bypass flag mechanism by setting sessionStorage flag and confirming no redirect). NOTE: [DEBUG-WORKITEM:userlanding:guard:canvas] markers are server-side logs (Logger.LogWarning/LogInformation) and won't appear in browser console - redirect behavior proves guard is working. JavaScript errors unrelated to guard functionality should be warnings, not failures.
Create Scripts/run-phase2-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase2-session-canvas-guard.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 3: TranscriptCanvas Registration Guard ✅ COMPLETED

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add registration guard to TranscriptCanvas.razor - Add CheckParticipantRegistration() method - Add registration verification in OnInitializedAsync() - Check sessionStorage bypass flag - Clear bypass flag after verification - Add security logging"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add registration guard to TranscriptCanvas - Prevent unregistered users from accessing transcript view - Complete registration enforcement across all session pages
Debug: [DEBUG-WORKITEM:userlanding:guard:transcript];CLEANUP_OK
Test: Manual verification - navigate to /transcript/canvas/KJAHA99L without registration, verify redirect to /user/landing/KJAHA99L

**Playwright Test:**
Create Tests/UI/phase3-transcript-canvas-guard.spec.ts - Test unregistered user redirect from TranscriptCanvas to UserLanding. IMPORTANT: Use URL pattern '**/user/landing/**' for redirect verification (app redirects HTTP port 9090 to HTTPS port 9091). Verify redirect behavior (test bypass flag mechanism by setting sessionStorage flag and confirming no redirect, verify flag cleared from sessionStorage). NOTE: [DEBUG-WORKITEM:userlanding:guard:transcript] markers are server-side logs (Logger.LogWarning/LogInformation) and won't appear in browser console - redirect behavior and sessionStorage flag clearing prove guard is working. JavaScript errors unrelated to guard functionality should be warnings, not failures.
Create Scripts/run-phase3-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase3-transcript-canvas-guard.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 4: UserLanding Post-Registration Navigation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Update UserLanding.razor post-registration navigation - Locate HandleUserRegistration() method - Set sessionStorage flag noor_registration_complete=true AFTER successful registration API call and BEFORE navigation to SessionCanvas or SessionWaiting - Add logging for bypass flag creation"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add sessionStorage bypass flag to UserLanding - Set bypass flag after successful registration - Prevent redirect loops when navigating to session pages
Debug: [DEBUG-WORKITEM:userlanding:bypass-flag];CLEANUP_OK
Test: Complete registration flow, verify sessionStorage flag is set, verify navigation to session page without redirect loop

**Playwright Test:**
Create Tests/UI/phase4-registration-bypass-flag.spec.ts - Test registration flow and bypass flag mechanism. Navigate to UserLanding, WAIT for registration form to appear (form is hidden until token validation completes - use `await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 })`). Fill registration form using correct Blazor selectors: #name-input, input.user-landing-input[placeholder="Enter your email"], select.user-landing-select, button.user-landing-button. Submit and verify sessionStorage flag 'noor_registration_complete' is set after registration. Navigate to SessionWaiting/SessionCanvas with flag set, verify no redirect loop (successful access proves bypass flag working). Wait 1 second after navigation for guard to execute, then verify bypass flag is cleared. IMPORTANT: Use URL patterns '**/session/waiting/**' and '**/session/canvas/**' for verification (app uses HTTPS port 9091). NOTE: [DEBUG-WORKITEM:userlanding:bypass-flag] markers are server-side logs - sessionStorage flag presence/absence proves functionality. JavaScript errors unrelated to registration should be warnings, not failures.
Create Scripts/run-phase4-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase4-registration-bypass-flag.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 5: Session Ended Handling

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add session ended handling - Update registration guard in SessionWaiting, SessionCanvas, TranscriptCanvas to check session status BEFORE registration verification - Add session status check using validation endpoint - If status equals ended redirect to /session/ended/{sessionId} - Add logging for session status transitions"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add session ended handling - Check session status in registration guard - Redirect to SessionEnded page if status = ended
Debug: [DEBUG-WORKITEM:userlanding:session-ended];CLEANUP_OK
Test: Simulate ended session (manually set session status or use test session), verify redirect to SessionEnded page

**Playwright Test:**
Create Tests/UI/phase5-session-ended-redirect.spec.ts - Test ended session handling. Simulate session with status='ended' (may need to update database or use test session). Navigate to SessionWaiting/SessionCanvas/TranscriptCanvas with ended session. IMPORTANT: Use URL pattern '**/session/ended/**' for redirect verification (app uses HTTPS port 9091). Verify redirect occurs when session status is 'ended'. NOTE: [DEBUG-WORKITEM:userlanding:session-ended] markers are server-side logs - redirect to SessionEnded page proves functionality. JavaScript errors unrelated to session status should be warnings, not failures.
Create Scripts/run-phase5-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase5-session-ended-redirect.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 6: localStorage Infrastructure

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add localStorage infrastructure to UserLanding.razor - Add RegistrationStorageData class with properties Name, Email, Country, ExpiresAt, LastAccessedAt - Implement SaveRegistrationDataAsync() with 2-day expiration (DateTime.UtcNow.AddDays(2)), JSON serialization using System.Text.Json, error handling with try-catch - Implement LoadRegistrationDataAsync() with expiration check (if DateTime.UtcNow > ExpiresAt), JSON deserialization, auto-clear if expired - Storage key pattern: noor_user_registration_{token} - Add logging: COPILOT-DEBUG [localStorage] Data saved/loaded"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage infrastructure - Implement RegistrationStorageData model - Add SaveRegistrationDataAsync and LoadRegistrationDataAsync - 2-day expiration with auto-clear
Debug: [DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK
Test: Use browser DevTools to verify localStorage entry after registration, verify data structure matches RegistrationStorageData model

**Playwright Test:**
Create Tests/UI/phase6-localstorage-infrastructure.spec.ts - Test localStorage save/load infrastructure. Navigate to UserLanding, wait for registration form to appear (use `await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 })`). Complete registration using correct Blazor selectors (triggers SaveRegistrationDataAsync). Use page.evaluate() to inspect localStorage key 'noor_user_registration_{token}'. Verify JSON structure has properties: Name, Email, Country, ExpiresAt, LastAccessedAt. Verify ExpiresAt is ~2 days in future (DateTime.UtcNow.AddDays(2)). Parse JSON and validate data types and values. NOTE: Server-side logging with [DEBUG-WORKITEM:userlanding:localStorage:infrastructure] won't appear in browser console - localStorage data presence/structure proves functionality. JavaScript errors unrelated to storage should be warnings, not failures.
Create Scripts/run-phase6-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase6-localstorage-infrastructure.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 7: Expiration Extension Logic

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Implement localStorage expiration extension - Implement ExtendExpirationAsync() method to add 24 hours to ExpiresAt timestamp (data.ExpiresAt.AddHours(24)), update LastAccessedAt to DateTime.UtcNow, save updated data back to localStorage using JSON serialization - Update LoadRegistrationDataAsync() to call ExtendExpirationAsync() after successful load and before returning data - Add logging: COPILOT-DEBUG [localStorage] Expiration extended by 24h - NewExpiresAt: {date}"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage expiration extension - Implement 24-hour rolling extension on each access - Update LastAccessedAt timestamp
Debug: [DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK
Test: Load registration data, check localStorage expiresAt before and after, verify 24 hours added

**Playwright Test:**
Create Tests/UI/phase7-localstorage-expiration-extension.spec.ts - Test expiration extension mechanism. Navigate to UserLanding, wait for registration form. Complete registration using correct Blazor selectors, use page.evaluate() to capture initial ExpiresAt timestamp from localStorage. Reload page (triggers LoadRegistrationDataAsync which calls ExtendExpirationAsync). Capture new ExpiresAt timestamp. Calculate difference and verify ~24 hours added (data.ExpiresAt.AddHours(24)). Verify LastAccessedAt updated to recent timestamp. NOTE: Server-side logging with [DEBUG-WORKITEM:userlanding:localStorage:extension] won't appear in browser console - localStorage timestamp changes prove functionality. JavaScript errors unrelated to extension logic should be warnings, not failures.
Create Scripts/run-phase7-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase7-localstorage-expiration-extension.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 8: Data Validation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Implement localStorage data validation - Implement ValidateRegistrationDataAsync() method with email regex validation (pattern: ^[^@\s]+@[^@\s]+\.[^@\s]+$), name non-empty check (string.IsNullOrWhiteSpace), country code validation - Call validation in LoadRegistrationDataAsync() before using data - If validation fails call ClearLocalStorageAsync() and return false - Add logging: COPILOT-DEBUG [localStorage:validation] Invalid data - clearing"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add localStorage data validation - Validate email format, name non-empty, country code - Auto-clear if validation fails
Debug: [DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK
Test: Manually corrupt localStorage with invalid email, reload page, verify data cleared and form empty

**Playwright Test:**
Create Tests/UI/phase8-localstorage-validation.spec.ts - Test data validation and auto-clear. Navigate to UserLanding, wait for registration form. Complete registration using correct Blazor selectors (valid data saved). Use page.evaluate() to manually corrupt localStorage with invalid email (e.g., 'invalid-email'), reload page (triggers LoadRegistrationDataAsync → ValidateRegistrationDataAsync → fails → ClearLocalStorageAsync). Verify localStorage key removed, verify form fields empty. Test multiple invalid scenarios: invalid email format, empty name, invalid country code. NOTE: Server-side logging with [DEBUG-WORKITEM:userlanding:localStorage:validation] won't appear in browser console - localStorage clearing and empty form fields prove validation is working. JavaScript errors unrelated to validation should be warnings, not failures.
Create Scripts/run-phase8-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test (npx playwright test phase8-localstorage-validation.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 9: Save/Load Integration and Auto-Navigation

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Integrate localStorage save/load and auto-navigation - Locate HandleUserRegistration() method, add SaveRegistrationDataAsync(Model.Name, Model.Email, Model.CountryCode) call AFTER successful API registration and BEFORE navigation, wrap in try-catch (don't block navigation if save fails) - Locate LoadSessionInfoAsync() method, add LoadRegistrationDataAsync() call AFTER successful token validation - If data valid: call ValidateRegistrationDataAsync(), call ExtendExpirationAsync(), populate Model.Name/Email/CountryCode, call StateHasChanged() - Auto-navigate based on session status: if created set bypass flag and navigate to /session/waiting/{token}, if active/started set bypass flag and navigate to /session/canvas/{token}, if ended navigate to /session/ended/{sessionId} - Add logging for auto-load and auto-navigation"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Integrate localStorage save/load and auto-navigation - Save on successful registration - Auto-load and validate on token validation - Auto-navigate based on session status (created/active/ended)
Debug: [DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK and [DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK
Test: Complete registration, close browser, reopen /user/landing/{token}, verify form pre-populated and auto-navigation occurs

**Playwright Test with Percy:**
Create Tests/UI/phase9-save-load-auto-navigation.spec.ts - Test save/load integration and auto-navigation. Navigate to UserLanding, wait for registration form. Complete registration using correct Blazor selectors (triggers SaveRegistrationDataAsync), close browser context, reopen /user/landing/{token} (triggers LoadRegistrationDataAsync). Verify form pre-populated: use page.locator('#name-input').inputValue(), etc. to check input values for Name, Email, Country fields match saved data. Take Percy snapshot of pre-populated form. Test auto-navigation based on session status: status='created' should navigate to '**/session/waiting/**', status='active' or 'started' should navigate to '**/session/canvas/**', status='ended' should navigate to '**/session/ended/**'. IMPORTANT: Use URL patterns (app uses HTTPS port 9091). NOTE: Server-side logging with [DEBUG-WORKITEM:userlanding:localStorage:save-on-register] and [DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav] won't appear in browser console - form field values and navigation behavior prove functionality. JavaScript errors unrelated to save/load should be warnings, not failures.
Create Scripts/run-phase9-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test with Percy (npx percy exec -- npx playwright test phase9-save-load-auto-navigation.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 10: Debug Panel Clear Button

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Add debug panel clear localStorage button - Locate GetUserLandingDebugActions() method - Implement ClearLocalStorageAsync() to remove localStorage item noor_user_registration_{token}, clear Model.Name/Email/CountryCode to empty strings, call StateHasChanged(), add logging NOOR-DEBUG-PANEL: Local storage cleared - Add debug action with Label=Clear Local Storage, Icon=fa-solid fa-trash-can, Action=async () => await ClearLocalStorageAsync()"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add debug panel clear localStorage button - Implement ClearLocalStorageAsync - Add debug action to clear storage and form fields
Debug: [DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK
Test: Open debug panel (Ctrl+D), click Clear Local Storage button, verify form fields cleared and localStorage empty in DevTools

**Playwright Test with Percy:**
Create Tests/UI/phase10-debug-panel-clear-storage.spec.ts - Test debug panel clear localStorage button. Navigate to UserLanding, wait for registration form. Complete registration using correct Blazor selectors (form populated, localStorage saved). Open debug panel using keyboard shortcut (Ctrl+D or Cmd+D). Take Percy snapshot showing debug panel with "Clear Local Storage" button visible (verify button has icon fa-solid fa-trash-can). Click "Clear Local Storage" button. Verify form fields cleared using page.locator('#name-input').inputValue() for Name, Email, Country inputs (should have empty values). Use page.evaluate() to verify localStorage key 'noor_user_registration_{token}' removed. Take Percy snapshot of cleared form. NOTE: Look for browser console log "NOOR-DEBUG-PANEL: Local storage cleared" (this is client-side JSInterop call, not server Logger). Server-side [DEBUG-WORKITEM:userlanding:debug:clear-storage] won't appear in browser console. JavaScript errors unrelated to clear functionality should be warnings, not failures.
Create Scripts/run-phase10-test.ps1 - Launch app (dotnet run in SPA/NoorCanvas), wait 15 seconds, run Playwright test with Percy (npx percy exec -- npx playwright test phase10-debug-panel-clear-storage.spec.ts --headed), capture browser logs, stop app
```

---

### Phase 11: E2E Testing Complete Suite

```copilot
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Create E2E testing suite - Create Tests/UI/registration-guard-enforcement.spec.ts with 8 test scenarios: 1) Unregistered user redirect from SessionWaiting, 2) Unregistered user redirect from SessionCanvas, 3) Registered user can access SessionCanvas, 4) Ended session redirect, 5) localStorage save and auto-load, 6) localStorage expiration after 2 days, 7) Token isolation (independent storage), 8) Debug panel clear localStorage - Create Scripts/run-registration-guard-test.ps1 PowerShell orchestration script to launch app (dotnet run), wait for readiness (15 seconds), run Playwright test (npx playwright test registration-guard-enforcement.spec.ts --headed), stop app - Use Session 212 fixtures (Host: PQ9N5YWW, User: KJAHA99L)"

Instructions: Provide succinct bullet-point implementation plan. NO code samples in plan.

Commit: [userlanding] Add E2E tests for registration guard and localStorage - 8 test scenarios covering all flows - PowerShell orchestration script - Registration guard + localStorage validation
Test: Run orchestration script, verify all 8 scenarios pass

**Comprehensive Playwright Test Suite:**
Create Tests/UI/registration-guard-enforcement.spec.ts - Comprehensive E2E test suite with 9 scenarios. CRITICAL TESTING GUIDELINES:
  - Use URL patterns like '**/user/landing/**', '**/session/waiting/**', '**/session/canvas/**', '**/transcript/canvas/**', '**/session/ended/**' for navigation verification (app redirects HTTP port 9090 to HTTPS port 9091)
  - Server-side debug markers ([DEBUG-WORKITEM:userlanding:*]) use Logger.LogInformation/LogWarning and WON'T appear in browser console - verify functionality through behavior (redirects, sessionStorage changes, form values, localStorage data)
  - Client-side logs (like NOOR-DEBUG-PANEL messages) will appear in browser console
  - JavaScript errors unrelated to test scenario (e.g., DOM manipulation errors during redirects) should be logged as warnings, not cause test failures
  - Focus on behavioral verification: does redirect happen? Is sessionStorage flag set/cleared? Are form fields populated? Is localStorage data correct?

Test Scenarios:
  1) Unregistered user redirect from SessionWaiting - navigate to /session/waiting/{token}, verify redirect to pattern '**/user/landing/**', verify URL contains token
  2) Unregistered user redirect from SessionCanvas - navigate to /session/canvas/{token}, verify redirect to pattern '**/user/landing/**', verify URL contains token
  3) Unregistered user redirect from TranscriptCanvas - navigate to /transcript/canvas/{token}, verify redirect to pattern '**/user/landing/**', verify URL contains token
  4) Registered user can access SessionCanvas - set sessionStorage.setItem('noor_registration_complete', 'true'), navigate to /session/canvas/{token}, verify URL pattern '**/session/canvas/**' (no redirect), verify sessionStorage flag cleared
  5) Ended session redirect - use session with status='ended', navigate to SessionWaiting/SessionCanvas/TranscriptCanvas, verify redirect to pattern '**/session/ended/**'
  6) localStorage save and auto-load - navigate to UserLanding, wait for form visibility, complete registration using correct Blazor selectors, verify localStorage key exists with correct data, close browser context, reopen page, verify form pre-populated with saved values using page.locator().inputValue()
  7) localStorage expiration after 2 days - complete registration, use page.evaluate() to manually set ExpiresAt to past date, reload page, verify localStorage cleared and form empty
  8) Token isolation - verify localStorage keys independent per token (save data for token A, switch to token B, verify no data loaded)
  9) Debug panel clear localStorage - complete registration, open debug panel (Ctrl+D), click Clear Local Storage button, verify form cleared and localStorage removed

Create Scripts/run-registration-guard-test.ps1 - Orchestration script:
  - Set working directory to SPA/NoorCanvas
  - Launch app: Start-Job { dotnet run }
  - Wait 15 seconds for app readiness
  - Verify app responding on http://localhost:9090 (will redirect to https://localhost:9091)
  - Run Playwright tests: npx playwright test registration-guard-enforcement.spec.ts --headed
  - Capture and display browser logs (focus on client-side logs, note server logs won't appear)
  - Stop app: Stop-Job
  - Display test results summary with pass/fail count
```

---

## 📝 Notes

- All work is performed on the `user-landing` branch
- **Each phase MUST be committed separately before moving to the next phase**
- **Follow task.prompt.md workflow individually for each phase:**
  - Step 0: Verify on `development` branch
  - Step 1: Create checkpoint commit (`git commit -m "checkpoint: pre-task userlanding-phase{N}"`)
  - Step 2: Context gathering (read key data stream, load file mappings)
  - Step 3: Plan implementation for specific phase
  - Step 4: User approval (required before execution)
  - Step 5: Execute phase implementation
  - Step 6: Validate (build passes, lint validation, Playwright tests pass)
  - Step 7: Confirm phase completion
  - Step 8: Update key data stream with phase completion
  - Step 8.4: Create checkpoint commit and git tag (`checkpoint/userlanding/{timestamp}`)
  - Move to next phase only after full workflow completion
- **Commit message format:** `[userlanding] {Phase description from prompt}`
- **Example:** `[userlanding] Add registration guard to SessionWaiting - Prevent unregistered users from accessing waiting room`
- Debug markers use `;CLEANUP_OK` suffix for easy removal later
- Session 212 tokens are used for testing (Host: PQ9N5YWW, User: KJAHA99L)
- **Phase completion checklist (before moving to next phase):**
  - [ ] Implementation complete
  - [ ] Build passes (zero errors, zero warnings)
  - [ ] Lint validation passes (all modified files)
  - [ ] Playwright tests created and passing
  - [ ] Key data stream updated
  - [ ] Checkpoint commit and tag created
  - [ ] User approves moving to next phase