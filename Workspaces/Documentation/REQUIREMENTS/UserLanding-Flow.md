# User Landing Flow - Comprehensive Implementation Plan

**Work Item Key:** `userlanding`  
**Scope:** Full-stack (Client-side localStorage + Registration Guard + Session Status Validation)  
**Created:** October 19, 2025  
**Status:** Ready for Implementation  
**Plan Version:** 2.0 (Consolidated)

---

## 🎯 Quick Executive Summary

### What
Comprehensive fix for user landing page flow including:
1. **Registration Guard Enforcement** - Prevent unregistered users from bypassing UserLanding
2. **Local Storage Implementation** - Persistent registration data with 2-day expiration
3. **Session Status-based Validation** - Correct routing based on session state (created/active/ended)

### Why
- **Security:** Close critical vulnerability where users can access session pages without registration
- **User Experience:** Auto-populate registration forms for returning users
- **Business Rules:** Enforce mandatory registration before session participation

### How
**11 Implementation Phases** across ~4 hours:

1. **Phase 1** (25 min) - Add registration guard to SessionWaiting.razor
2. **Phase 2** (25 min) - Add registration guard to SessionCanvas.razor
3. **Phase 3** (25 min) - Add registration guard to TranscriptCanvas.razor
4. **Phase 4** (15 min) - Update UserLanding.razor bypass flag
5. **Phase 5** (20 min) - Add session ended handling
6. **Phase 6** (30 min) - localStorage Infrastructure (data model, save/load)
7. **Phase 7** (15 min) - Expiration extension logic
8. **Phase 8** (20 min) - Data validation
9. **Phase 9** (15 min) - Save on registration + auto-load integration
10. **Phase 10** (15 min) - Debug panel clear button
11. **Phase 11** (45 min) - E2E testing (registration guard + localStorage)

### Key Features
- ✅ Registration guard on all session pages (waiting/canvas/transcript)
- ✅ SessionStorage bypass flag to prevent redirect loops
- ✅ Session ended automatic redirect
- ✅ Token-specific localStorage: `noor_user_registration_{token}`
- ✅ 2-day expiration with +24h rolling extension
- ✅ Auto-navigation: created→waiting, active→canvas, ended→ended
- ✅ Data validation with auto-clear if invalid
- ✅ Debug panel tools for testing

### Files Modified
- `SPA/NoorCanvas/Pages/UserLanding.razor`
- `SPA/NoorCanvas/Pages/SessionWaiting.razor`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`
- `Tests/UI/registration-guard-enforcement.spec.ts` (new)
- `Scripts/run-registration-guard-test.ps1` (new)

---

## 📦 Technology Stack Detected

**Framework:** ASP.NET Core 8.0 (Blazor Server)  
**Key Libraries:**
- SignalR: 8.0.0
- Entity Framework Core: 8.0.0
- MudBlazor: 8.13.0
- Playwright: 1.55.0 (E2E Testing)
- HtmlAgilityPack: 1.12.3

**Build:** dotnet CLI  
**Testing:** Playwright (E2E), Percy (Visual Regression)  
**JavaScript Interop:** IJSRuntime (localStorage, sessionStorage)  
**Logging:** Serilog with structured logging

✅ Ready to plan with technology-aware recommendations

---

## 🔍 ARCHITECTURE ANALYSIS - Registration Bypass Vulnerability

### Current Critical Violation

**Security Gap:** Participants can reach `SessionWaiting.razor`, `SessionCanvas.razor`, and `TranscriptCanvas.razor` **without completing registration** by directly navigating to URLs with valid tokens.

### Root Cause Analysis

#### ❌ **Current Flawed Flow**

**UserLanding.razor** (Entry Point):
- ✅ Token validation works (`/api/participant/session/{token}/validate`)
- ✅ Registration gate exists (`CheckParticipantRegistrationAsync()`)
- ✅ Atomic navigation logic implemented

**BUT Session Pages Have NO Registration Guard:**

**SessionWaiting.razor**:
- ✅ Calls `LoadCurrentParticipantFromApiAsync()` 
- ❌ **NO registration verification** - only looks up UserGuid from localStorage
- ❌ **If UserGuid is empty, continues anyway** (fallback behavior)
- ❌ **Uses token-only participant lookup** instead of rejecting unregistered users

**SessionCanvas.razor & TranscriptCanvas.razor**:
- ❌ **Same vulnerability** - fallback token-only lookup
- ❌ **Allows page load without registered participant**
- ❌ **No registration gate check**

### 🚨 Exploitation Scenario

```
User receives token: KJAHA99L
→ User directly navigates to: https://localhost:9091/session/canvas/KJAHA99L
→ SessionCanvas loads, validates token via SimplifiedTokenService
→ LoadCurrentParticipantFromApiAsync() finds no participant (UserGuid = null)
→ Page loads anyway with empty CurrentUserGuid
→ ✅ User can view session content without registration
→ ❌ User CANNOT submit questions (Q&A requires UserGuid)
→ BUT VIOLATION: "Participants MUST register before session access"
```

---

## 🛡️ COMPREHENSIVE ARCHITECTURAL FIX

### Design Principles

1. **Single Source of Truth:** UserLanding is the ONLY entry point for participants
2. **Defense in Depth:** Multiple validation layers (client-side redirect + API verification + session check)
3. **Fail-Secure:** Default to redirect to UserLanding unless registration is proven
4. **Zero Trust:** Never trust localStorage/sessionStorage alone - always verify with API
5. **User Experience:** Persist registration data to minimize re-entry friction

---

## 📋 Goals and Success Criteria

### Primary Goals

1. **Enforce mandatory registration** for ALL participant session access
2. **Implement persistent registration data** using localStorage
3. **Auto-navigate based on session status** (created/active/ended)
4. **Provide debug tools** for testing and troubleshooting

### Success Criteria

#### Registration Guard
- ✅ Direct navigation to `/session/waiting/{token}` without registration redirects to `/user/landing/{token}`
- ✅ Direct navigation to `/session/canvas/{token}` without registration redirects to `/user/landing/{token}`
- ✅ Direct navigation to `/transcript/canvas/{token}` without registration redirects to `/user/landing/{token}`
- ✅ Registered users can access session pages normally
- ✅ No redirect loops after successful registration

#### Local Storage
- ✅ Registration data persists across browser sessions for valid tokens
- ✅ Data expires after 2 days of inactivity
- ✅ Each access within 2-day window extends expiration by 24 hours
- ✅ Pre-populated data is validated (email format, country code exists)
- ✅ Invalid/corrupted data is automatically cleared
- ✅ Each token has independent localStorage key and expiration

#### Session Status Handling
- ✅ Session status = "created" → Navigate to waiting room
- ✅ Session status = "active/started" → Navigate to session canvas
- ✅ Session status = "ended" → Navigate to session ended page
- ✅ Expired tokens handled gracefully

#### Testing & Debug
- ✅ Debug panel can manually clear storage (development mode only)
- ✅ E2E tests verify registration enforcement
- ✅ Graceful degradation if localStorage unavailable

---

## 🏗️ Proposed Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      UserLanding.razor                          │
│  - Token Validation                                             │
│  - Registration Form                                            │
│  - localStorage Save/Load                                       │
│  - Session Status Check                                         │
│  - Sets sessionStorage bypass flag                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┴─────────────┐
              │                           │
              ↓                           ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│  SessionWaiting.razor    │    │   SessionCanvas.razor    │
│  + Registration Guard    │    │   + Registration Guard   │
│  + Bypass Check          │    │   + Bypass Check         │
│  + Session Status Check  │    │   + Session Status Check │
└──────────────────────────┘    └──────────────────────────┘
              ↓                           ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│ TranscriptCanvas.razor   │    │   SessionEnded.razor     │
│ + Registration Guard     │    │   (End state)            │
│ + Bypass Check           │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

### Registration Guard Flow (Reusable Pattern)

```csharp
protected override async Task OnInitializedAsync()
{
    var requestId = Guid.NewGuid().ToString("N")[..8];
    
    // STEP 1: Check bypass flag (post-registration navigation)
    var bypassFlag = await JSRuntime.InvokeAsync<string?>(
        "sessionStorage.getItem", "noor_registration_complete");
    
    if (bypassFlag == "true")
    {
        // Clear flag and proceed
        await JSRuntime.InvokeVoidAsync(
            "sessionStorage.removeItem", "noor_registration_complete");
    }
    else
    {
        // STEP 2: Validate token
        var isValidToken = await ValidateSessionToken(SessionToken, requestId);
        if (!isValidToken)
        {
            Navigation.NavigateTo("/", forceLoad: true);
            return;
        }
        
        // STEP 3: Check registration status
        var isRegistered = await CheckParticipantRegistration(SessionToken, requestId);
        if (!isRegistered)
        {
            Logger.LogWarning(
                "[REGISTRATION-GUARD] Unregistered access attempt - redirecting");
            Navigation.NavigateTo($"/user/landing/{SessionToken}", forceLoad: true);
            return;
        }
    }
    
    // STEP 4: Proceed with normal page initialization
    await InitializeSessionAsync(requestId);
}
```

### Local Storage Data Model

```csharp
// Internal model for localStorage JSON serialization
private class RegistrationStorageData
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Country { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime LastAccessedAt { get; set; }
}
```

**Storage Key Pattern:** `noor_user_registration_{token}`  
**Data Format:** JSON serialized object  
**Expiration:** 2 days from creation, +24h on each access within window  
**Isolation:** Each token has separate localStorage entry

**Example localStorage Entry:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "country": "US",
  "expiresAt": "2025-10-21T10:30:00Z",
  "lastAccessedAt": "2025-10-19T10:30:00Z"
}
```

---

## 📋 Implementation Phases (Detailed)

### **PART A: Registration Guard Implementation**

---

#### **Phase 1: Add Registration Guard to SessionWaiting.razor**

**Objective:** Prevent unregistered users from accessing waiting room directly

**Tasks:**
1. Add `CheckParticipantRegistration()` method (copy pattern from UserLanding.razor)
   ```csharp
   private async Task<bool> CheckParticipantRegistration(string token, string requestId)
   {
       var userGuid = await JSRuntime.InvokeAsync<string?>(
           "localStorage.getItem", $"noor_user_guid_{token}");
       
       if (string.IsNullOrEmpty(userGuid))
       {
           Logger.LogWarning("[REGISTRATION-GUARD] No UserGuid found for token: {Token}", token);
           return false;
       }
       
       var apiUrl = $"/api/participant/session/{token}/me?userGuid={userGuid}";
       var response = await Http.GetAsync(apiUrl);
       
       if (!response.IsSuccessStatusCode)
       {
           Logger.LogWarning("[REGISTRATION-GUARD] Participant not found in database");
           return false;
       }
       
       return true;
   }
   ```

2. Add registration check in `OnInitializedAsync()` BEFORE loading session data
3. Check sessionStorage `noor_registration_complete` flag to bypass redirect after registration
4. Clear bypass flag after successful verification
5. Add logging for security monitoring

**Deliverables:**
- ✅ Unregistered users redirected to `/user/landing/{token}`
- ✅ Registered users proceed normally
- ✅ No redirect loops after registration
- ✅ Security logging enabled

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:guard:waiting];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/SessionWaiting.razor`

---

#### **Phase 2: Add Registration Guard to SessionCanvas.razor**

**Objective:** Prevent unregistered users from accessing active session canvas

**Tasks:**
1. Add `CheckParticipantRegistration()` method (same implementation as Phase 1)
2. Add registration verification in `OnInitializedAsync()` before loading session
3. Check sessionStorage bypass flag for post-registration navigation
4. Clear bypass flag after verification
5. Add logging for bypass attempts

**Deliverables:**
- ✅ Unregistered users redirected to `/user/landing/{token}`
- ✅ Registered users can access canvas normally
- ✅ Bypass flag prevents redirect loops

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:guard:canvas];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/SessionCanvas.razor`

---

#### **Phase 3: Add Registration Guard to TranscriptCanvas.razor**

**Objective:** Prevent unregistered users from accessing transcript view

**Tasks:**
1. Add `CheckParticipantRegistration()` method
2. Add registration verification in `OnInitializedAsync()`
3. Check sessionStorage bypass flag
4. Clear bypass flag after verification
5. Add security logging

**Deliverables:**
- ✅ Unregistered users redirected to `/user/landing/{token}`
- ✅ Complete registration enforcement across all session pages

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:guard:transcript];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

---

#### **Phase 4: Update UserLanding.razor Post-Registration Navigation**

**Objective:** Set bypass flag to prevent redirect loops after successful registration

**Tasks:**
1. Locate `HandleUserRegistration()` method
2. Add sessionStorage flag AFTER successful registration, BEFORE navigation:
   ```csharp
   // After successful API registration...
   await JSRuntime.InvokeVoidAsync(
       "sessionStorage.setItem", "noor_registration_complete", "true");
   
   // Then navigate based on session status
   if (sessionStatus == "active" || sessionStatus == "started")
   {
       Navigation.NavigateTo($"/session/canvas/{Model.TokenInput}");
   }
   else if (sessionStatus == "created")
   {
       Navigation.NavigateTo($"/session/waiting/{Model.TokenInput}");
   }
   ```

3. Add logging for bypass flag creation

**Deliverables:**
- ✅ SessionStorage flag prevents redirect loops
- ✅ Seamless user experience after registration

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:bypass-flag];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

#### **Phase 5: Add Session Ended Handling**

**Objective:** Redirect users to SessionEnded page when session has ended

**Tasks:**
1. Update registration guard in all session pages to check session status
2. Add session status check BEFORE registration verification:
   ```csharp
   // Get session info from validation endpoint
   var validation = await Http.GetFromJsonAsync<SessionValidationResponse>(
       $"/api/participant/session/{token}/validate");
   
   if (validation?.Session?.Status?.ToLowerInvariant() == "ended")
   {
       Logger.LogInformation("[SESSION-STATUS] Session ended - redirecting");
       Navigation.NavigateTo($"/session/ended/{validation.Session.SessionId}", forceLoad: true);
       return;
   }
   ```

3. Apply to SessionWaiting, SessionCanvas, TranscriptCanvas
4. Add logging for session status transitions

**Deliverables:**
- ✅ Ended sessions automatically redirect to SessionEnded page
- ✅ Users cannot access ended sessions via direct navigation

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:session-ended];CLEANUP_OK`

**Files Modified:** 
- `SPA/NoorCanvas/Pages/SessionWaiting.razor`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

---

### **PART B: Local Storage Implementation**

---

#### **Phase 6: Add localStorage Infrastructure with Expiration Model**

**Objective:** Create data model and core localStorage save/load methods

**Tasks:**
1. Add `RegistrationStorageData` class to UserLanding.razor:
   ```csharp
   private class RegistrationStorageData
   {
       public string Name { get; set; } = "";
       public string Email { get; set; } = "";
       public string Country { get; set; } = "";
       public DateTime ExpiresAt { get; set; }
       public DateTime LastAccessedAt { get; set; }
   }
   ```

2. Implement `SaveRegistrationDataAsync()`:
   - Sets `ExpiresAt = DateTime.UtcNow.AddDays(2)`
   - Sets `LastAccessedAt = DateTime.UtcNow`
   - Serializes to JSON using `System.Text.Json`
   - Saves to localStorage with key: `noor_user_registration_{token}`
   - Includes try-catch for graceful degradation
   - Logs: `COPILOT-DEBUG: [localStorage] Data saved with 2-day expiration`

3. Implement `LoadRegistrationDataAsync()`:
   - Retrieves data from localStorage
   - Deserializes JSON
   - Checks if expired (> 2 days from `ExpiresAt`)
   - If expired: clears stale data, returns null
   - If valid: returns data
   - Logs: `COPILOT-DEBUG: [localStorage] Data loaded` or `Data expired and cleared`

**Deliverables:**
- ✅ Data model defined
- ✅ Save/Load methods implemented
- ✅ Expiration validation logic working

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

#### **Phase 7: Implement Expiration Extension Logic**

**Objective:** Add 24-hour rolling extension on each access within 2-day window

**Tasks:**
1. Implement `ExtendExpirationAsync()`:
   ```csharp
   private async Task ExtendExpirationAsync(RegistrationStorageData data)
   {
       var now = DateTime.UtcNow;
       var newExpiresAt = data.ExpiresAt.AddHours(24);
       data.ExpiresAt = newExpiresAt;
       data.LastAccessedAt = now;
       
       var json = System.Text.Json.JsonSerializer.Serialize(data);
       var key = $"noor_user_registration_{SessionToken}";
       
       await JSRuntime.InvokeVoidAsync("localStorage.setItem", key, json);
       
       Logger.LogInformation(
           "COPILOT-DEBUG: [localStorage] Expiration extended by 24h - NewExpiresAt: {ExpiresAt}",
           newExpiresAt);
   }
   ```

2. Update `LoadRegistrationDataAsync()` to call extension after successful load
3. Update `LastAccessedAt` timestamp

**Deliverables:**
- ✅ Extension logic implemented
- ✅ Timestamps properly updated
- ✅ Daily access keeps data fresh indefinitely

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

#### **Phase 8: Add Data Validation Logic**

**Objective:** Validate pre-populated data format before use

**Tasks:**
1. Implement `ValidateRegistrationDataAsync()`:
   ```csharp
   private async Task<bool> ValidateRegistrationDataAsync(RegistrationStorageData data)
   {
       // Validate email format
       var emailRegex = new System.Text.RegularExpressions.Regex(
           @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
       
       if (!string.IsNullOrWhiteSpace(data.Email) && !emailRegex.IsMatch(data.Email))
       {
           Logger.LogWarning("[localStorage:validation] Invalid email format - clearing");
           await ClearLocalStorageAsync();
           return false;
       }
       
       // Validate name is not empty
       if (string.IsNullOrWhiteSpace(data.Name))
       {
           Logger.LogWarning("[localStorage:validation] Empty name field - clearing");
           await ClearLocalStorageAsync();
           return false;
       }
       
       return true;
   }
   ```

2. Call validation in load flow before using data
3. Auto-clear localStorage if validation fails

**Deliverables:**
- ✅ Email format validation
- ✅ Name non-empty validation
- ✅ Country code validation
- ✅ Invalid data automatically cleared

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

#### **Phase 9: Integrate Save on Registration & Auto-Load**

**Objective:** Save data after successful registration and auto-load on token validation

**Tasks:**
1. **Save Integration:** Locate `HandleUserRegistration()` method
   - Add `SaveRegistrationDataAsync()` call AFTER successful API registration
   - Add call BEFORE navigation to SessionWaiting/SessionCanvas
   - Pass `Model.Name`, `Model.Email`, `Model.CountryCode`
   - Wrap in try-catch - don't block navigation if save fails

2. **Auto-Load Integration:** Locate `LoadSessionInfoAsync()` method
   - Add `LoadRegistrationDataAsync()` call AFTER successful token validation
   - If data valid:
     - Call `ValidateRegistrationDataAsync()`
     - Call `ExtendExpirationAsync()`
     - Populate form fields: `Model.Name`, `Model.Email`, `Model.CountryCode`
     - Call `StateHasChanged()` to update UI
   - If data invalid or expired: leave form empty

3. **Auto-Navigate:** After successful data load and validation:
   ```csharp
   var sessionStatus = SessionInfo?.Status?.ToLowerInvariant() ?? "";
   
   if (sessionStatus == "created")
   {
       await JSRuntime.InvokeVoidAsync(
           "sessionStorage.setItem", "noor_registration_complete", "true");
       Navigation.NavigateTo($"/session/waiting/{SessionToken}");
   }
   else if (sessionStatus == "active" || sessionStatus == "started")
   {
       await JSRuntime.InvokeVoidAsync(
           "sessionStorage.setItem", "noor_registration_complete", "true");
       Navigation.NavigateTo($"/session/canvas/{SessionToken}");
   }
   else if (sessionStatus == "ended")
   {
       Navigation.NavigateTo($"/session/ended/{SessionInfo.SessionId}");
   }
   ```

**Deliverables:**
- ✅ Registration data persists after successful registration
- ✅ Form auto-populates for returning users
- ✅ Expiration extends automatically on access
- ✅ Auto-navigation based on session status
- ✅ Graceful degradation if localStorage fails

**Debug Markers:** 
- `[DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

#### **Phase 10: Add Debug Panel Clear Button**

**Objective:** Add "Clear Local Storage" button to debug panel for testing

**Tasks:**
1. Locate `GetUserLandingDebugActions()` method
2. Implement `ClearLocalStorageAsync()`:
   ```csharp
   private async Task ClearLocalStorageAsync()
   {
       try
       {
           var key = $"noor_user_registration_{SessionToken}";
           await JSRuntime.InvokeVoidAsync("localStorage.removeItem", key);
           
           // Clear form fields
           Model.Name = "";
           Model.Email = "";
           Model.CountryCode = "";
           
           await InvokeAsync(StateHasChanged);
           
           Logger.LogInformation(
               "NOOR-DEBUG-PANEL: Local storage cleared for token: {Token}", SessionToken);
       }
       catch (Exception ex)
       {
           Logger.LogError(ex, "NOOR-DEBUG-PANEL: Failed to clear local storage");
       }
   }
   ```

3. Add debug action:
   ```csharp
   new DebugAction
   {
       Label = "Clear Local Storage",
       Icon = "fa-solid fa-trash-can",
       Action = async () => await ClearLocalStorageAsync()
   }
   ```

**Deliverables:**
- ✅ Debug panel button functional
- ✅ Storage and form cleared on click
- ✅ Logging confirmation (no toast per debug panel pattern)

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **PART C: Testing & Validation**

---

#### **Phase 11: Create E2E Test for Registration Enforcement & localStorage**

**Objective:** Automated testing of registration guard and localStorage functionality

**Tasks:**

**1. Create E2E Test File:** `Tests/UI/registration-guard-enforcement.spec.ts`

**Test Scenarios:**

**Scenario 1: Unregistered User Redirect from SessionWaiting**
```typescript
test('Unregistered user redirected from SessionWaiting to UserLanding', async ({ page }) => {
  // GIVEN: User has valid token but is NOT registered
  await page.goto('https://localhost:9091/session/waiting/KJAHA99L');
  
  // THEN: Should redirect to UserLanding
  await expect(page).toHaveURL(/\/user\/landing\/KJAHA99L/);
  
  // AND: Registration form should be visible
  await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
});
```

**Scenario 2: Unregistered User Redirect from SessionCanvas**
```typescript
test('Unregistered user redirected from SessionCanvas to UserLanding', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  await expect(page).toHaveURL(/\/user\/landing\/KJAHA99L/);
});
```

**Scenario 3: Registered User Can Access SessionCanvas**
```typescript
test('Registered user can access SessionCanvas directly', async ({ page }) => {
  // GIVEN: User is registered
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  await page.fill('input[placeholder*="name"]', 'Test User');
  await page.fill('input[placeholder*="email"]', 'test@example.com');
  await page.selectOption('select', 'BH');
  await page.click('button:has-text("Join Waiting Room")');
  
  // WHEN: User directly navigates to SessionCanvas
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  
  // THEN: Page loads without redirect
  await expect(page).toHaveURL(/\/session\/canvas\/KJAHA99L/);
});
```

**Scenario 4: Ended Session Redirects to SessionEnded**
```typescript
test('Ended session redirects to SessionEnded page', async ({ page }) => {
  // Note: Requires test session with status = "ended"
  await page.goto('https://localhost:9091/session/canvas/ENDEDTOKEN');
  await expect(page).toHaveURL(/\/session\/ended\/\d+/);
});
```

**Scenario 5: localStorage Save and Auto-Load**
```typescript
test('Registration data persists and auto-loads', async ({ page }) => {
  // GIVEN: User registers
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  await page.fill('input[placeholder*="name"]', 'John Doe');
  await page.fill('input[placeholder*="email"]', 'john@example.com');
  await page.selectOption('select', 'US');
  await page.click('button:has-text("Join Waiting Room")');
  
  // WHEN: User returns with same token
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  
  // THEN: Form should be pre-populated
  await expect(page.locator('input[placeholder*="name"]')).toHaveValue('John Doe');
  await expect(page.locator('input[placeholder*="email"]')).toHaveValue('john@example.com');
  await expect(page.locator('select')).toHaveValue('US');
});
```

**Scenario 6: localStorage Expiration After 2 Days**
```typescript
test('Expired localStorage data is cleared', async ({ page }) => {
  // GIVEN: User has localStorage data from 3 days ago
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  
  // Manually set expired data
  await page.evaluate(() => {
    const expiredData = {
      name: "Old User",
      email: "old@example.com",
      country: "US",
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('noor_user_registration_KJAHA99L', JSON.stringify(expiredData));
  });
  
  // WHEN: User returns
  await page.reload();
  
  // THEN: Form should be empty (expired data cleared)
  await expect(page.locator('input[placeholder*="name"]')).toHaveValue('');
  await expect(page.locator('input[placeholder*="email"]')).toHaveValue('');
});
```

**Scenario 7: Token Isolation**
```typescript
test('Each token has independent localStorage', async ({ page }) => {
  // Save data for TOKEN1
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  await page.fill('input[placeholder*="name"]', 'User One');
  await page.click('button:has-text("Join Waiting Room")');
  
  // Navigate to TOKEN2
  await page.goto('https://localhost:9091/user/landing/PQ9N5YWW');
  
  // THEN: Form should be empty (different token)
  await expect(page.locator('input[placeholder*="name"]')).toHaveValue('');
  
  // Return to TOKEN1
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  
  // THEN: Data should still be there
  await expect(page.locator('input[placeholder*="name"]')).toHaveValue('User One');
});
```

**Scenario 8: Debug Panel Clear localStorage**
```typescript
test('Debug panel clears localStorage', async ({ page }) => {
  // GIVEN: User has saved data
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  await page.fill('input[placeholder*="name"]', 'Test User');
  await page.click('button:has-text("Join Waiting Room")');
  
  // WHEN: User opens debug panel and clears storage
  await page.goto('https://localhost:9091/user/landing/KJAHA99L');
  await page.keyboard.press('Control+D'); // Open debug panel
  await page.click('button:has-text("Clear Local Storage")');
  
  // THEN: Form should be cleared
  await expect(page.locator('input[placeholder*="name"]')).toHaveValue('');
  
  // AND: localStorage should be empty
  const storageData = await page.evaluate(() => 
    localStorage.getItem('noor_user_registration_KJAHA99L')
  );
  expect(storageData).toBeNull();
});
```

**2. Create PowerShell Orchestration Script:** `Scripts/run-registration-guard-test.ps1`

```powershell
# Launch app in background
$app = Start-Process powershell -ArgumentList "cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run" -PassThru -WindowStyle Minimized

# Wait for app to be ready (health check)
Start-Sleep -Seconds 15

# Run Playwright tests
cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test registration-guard-enforcement.spec.ts --headed

# Stop app
Stop-Process -Id $app.Id -Force
```

**Deliverables:**
- ✅ 8 E2E test scenarios implemented
- ✅ PowerShell orchestration script created
- ✅ All test scenarios pass
- ✅ Coverage for registration guard + localStorage

**Debug Markers:** N/A (test file)

**Files Created:**
- `Tests/UI/registration-guard-enforcement.spec.ts`
- `Scripts/run-registration-guard-test.ps1`

---

## 🔄 Complete User Flow Diagrams

### Flow 1: New User Registration (Session Created)

```
User navigates to /user/landing/KJAHA99L
    ↓
Token validated via API
    ↓
Check localStorage for token → NOT FOUND
    ↓
Show registration form (empty)
    ↓
User fills: Name, Email, Country → Clicks "Join Waiting Room"
    ↓
API POST /api/participant/register → SUCCESS
    ↓
Save to localStorage (2-day expiration) → Set sessionStorage bypass flag
    ↓
Navigate to /session/waiting/KJAHA99L
    ↓
SessionWaiting checks bypass flag → FOUND → Clears flag → Proceeds normally
```

### Flow 2: Returning User (Session Active, Data Valid)

```
User navigates to /user/landing/KJAHA99L
    ↓
Token validated via API → Session status = "active"
    ↓
Load localStorage for token → FOUND & NOT EXPIRED
    ↓
Validate data (email format, name not empty) → VALID
    ↓
Pre-populate form fields → Extend expiration by 24h
    ↓
Check session status → "active"
    ↓
Set sessionStorage bypass flag → Auto-navigate to /session/canvas/KJAHA99L
    ↓
SessionCanvas checks bypass flag → FOUND → Clears flag → Proceeds normally
```

### Flow 3: Direct Navigation (Unregistered User - BLOCKED)

```
User directly navigates to /session/canvas/KJAHA99L
    ↓
OnInitializedAsync() → Check sessionStorage bypass flag → NOT FOUND
    ↓
Validate token via API → VALID
    ↓
Check registration (UserGuid in localStorage + API verification) → NOT REGISTERED
    ↓
Log security warning: "Unregistered access attempt"
    ↓
Redirect to /user/landing/KJAHA99L
    ↓
Show registration form
```

### Flow 4: Direct Navigation (Registered User - ALLOWED)

```
User directly navigates to /session/canvas/KJAHA99L
    ↓
OnInitializedAsync() → Check sessionStorage bypass flag → NOT FOUND
    ↓
Validate token via API → VALID
    ↓
Check registration (UserGuid in localStorage + API verification) → REGISTERED
    ↓
Proceed to load session normally
```

### Flow 5: Session Ended

```
User navigates to /user/landing/KJAHA99L OR /session/canvas/KJAHA99L
    ↓
Token validated via API → Session status = "ended"
    ↓
Redirect to /session/ended/{sessionId}
    ↓
Show "Session has ended" message
```

---

## 📊 Effort Estimate

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| **PART A: Registration Guard** | | |
| Phase 1 | SessionWaiting guard | 25 minutes |
| Phase 2 | SessionCanvas guard | 25 minutes |
| Phase 3 | TranscriptCanvas guard | 25 minutes |
| Phase 4 | UserLanding bypass flag | 15 minutes |
| Phase 5 | Session ended handling | 20 minutes |
| **PART B: localStorage** | | |
| Phase 6 | Infrastructure | 30 minutes |
| Phase 7 | Expiration extension | 15 minutes |
| Phase 8 | Data validation | 20 minutes |
| Phase 9 | Save/Load integration | 15 minutes |
| Phase 10 | Debug panel button | 15 minutes |
| **PART C: Testing** | | |
| Phase 11 | E2E tests | 45 minutes |
| **Total** | | **~4 hours** |

---

## 🧪 Test Plan Summary

### Functional E2E Tests

**Test Suite:** `registration-guard-enforcement.spec.ts`  
**Orchestration:** `run-registration-guard-test.ps1`  
**Session Fixtures:** Session 212 (Host: PQ9N5YWW, User: KJAHA99L)

**Coverage:**
1. ✅ Unregistered user redirect from SessionWaiting
2. ✅ Unregistered user redirect from SessionCanvas
3. ✅ Registered user can access SessionCanvas
4. ✅ Ended session redirect
5. ✅ localStorage save and auto-load
6. ✅ localStorage expiration (2 days)
7. ✅ Token isolation (independent storage)
8. ✅ Debug panel clear functionality

### Manual Test Scenarios

**Scenario 1: Save on Registration**
- Enter token → Fill form → Click "Join Waiting Room"
- Verify localStorage contains data with 2-day expiration

**Scenario 2: Auto-Load within 2 Days**
- Return with same token within 2 days
- Verify form pre-populated + expiration extended by 24h

**Scenario 3: Expired Data Cleared**
- Manually modify `expiresAt` to past date
- Reload page → Verify form empty, localStorage cleared

**Scenario 4: Invalid Email Format**
- Manually edit localStorage email to invalid format
- Reload page → Verify form empty, localStorage cleared

**Scenario 5: Edge Cases**
- Test with localStorage disabled (private browsing)
- Test with corrupted JSON data
- Verify graceful degradation

---

## 📚 Dependencies and References

### Existing Code References
- `UserLanding.razor` - Registration guard pattern (lines 1145-1194)
- `DebugPanel.razor` - Debug action infrastructure
- Existing localStorage pattern: `noor_user_guid_{token}` (line 1070)

### API Endpoints
- `GET /api/participant/session/{token}/validate` - Token validation
- `GET /api/participant/session/{token}/me?userGuid={guid}` - Participant verification
- `POST /api/participant/register` - Registration submission

### Database Tables (READ-ONLY)
- `canvas.Participants` - Participant registration records
- `canvas.CanvasSessions` - Session status information

### Technology Documentation
- [Blazor JavaScript Interop](https://learn.microsoft.com/en-us/aspnet/core/blazor/javascript-interoperability/)
- [Browser localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Browser sessionStorage API](https://developer.mozilla.org/en-us/docs/Web/API/Window/sessionStorage)
- [System.Text.Json Serialization](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/)

### Best Practices Applied
- ✅ Try-catch for all localStorage/sessionStorage operations
- ✅ Namespace keys to prevent conflicts
- ✅ JSON serialization for structured data
- ✅ Graceful degradation if browser storage unavailable
- ✅ Token-specific storage keys for isolation
- ✅ Structured logging with debug markers
- ✅ Validation before using stored data
- ✅ Defense in depth (multiple validation layers)
- ✅ Fail-secure defaults (redirect to UserLanding on doubt)

---

## 📋 Assumptions and Risks

### Assumptions
1. `/api/participant/session/{token}/me?userGuid={guid}` API reliably identifies registered participants
2. UserGuid is stored in localStorage after registration (existing pattern)
3. Token validation via `SimplifiedTokenService` is secure and reliable
4. Session status values are normalized (lowercase: "created", "active", "started", "ended")
5. SessionStorage persists across page navigations within same browser tab

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Redirect loops (UserLanding ↔ SessionCanvas) | Medium | Use sessionStorage bypass flag |
| Breaking existing Playwright tests | Medium | Update tests to simulate full registration flow |
| Race condition between registration and navigation | Low | Reuse existing semaphore pattern |
| localStorage unavailable (private browsing) | Low | Graceful degradation - registration still works |
| Corrupted localStorage JSON data | Low | Try-catch with auto-clear on parse error |
| Session status desynchronization | Low | Always verify with API, don't trust client-side cache |

---

## 💡 Optional Enhancements (Pending Decision)

### Enhancement 1: Centralized Registration Guard Service
**Benefit:** Eliminates code duplication across 3 Razor pages

**Implementation:**
```csharp
// File: Services/ParticipantRegistrationGuardService.cs
public class ParticipantRegistrationGuardService
{
    public async Task<RegistrationGuardResult> VerifyRegistration(string token)
    {
        // Centralized logic
        // Returns: Registered, NotRegistered, SessionEnded, InvalidToken
    }
}
```

**Decision:** ❓ Include? (Pros: DRY, easier maintenance | Cons: New service class)

---

### Enhancement 2: Rate Limiting for Registration Checks
**Benefit:** Prevents abuse of registration verification API

**Implementation:** ASP.NET Core 8.0 built-in rate limiting on `/api/participant/session/{token}/me`

**Decision:** ❓ Include? (Pros: Security hardening | Cons: Additional config, minimal risk for internal app)

---

### Enhancement 3: Telemetry for Registration Bypass Attempts
**Benefit:** Security monitoring and anomaly detection

**Implementation:**
```csharp
_logger.LogWarning("[SECURITY-ALERT] Registration bypass attempt - Token: {Token}, IP: {IP}",
    token, HttpContext.Connection.RemoteIpAddress);
```

**Decision:** ❓ Include? (Pros: Security visibility, audit trail | Cons: Minimal code, already using structured logging)

---

## 🎯 Final Handoff Commands

### ✅ Copy-Paste Ready Implementation Command

```
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Phase 1: Add Registration Guard to SessionWaiting.razor — Add CheckParticipantRegistration() method copied from UserLanding.razor, add registration verification in OnInitializedAsync() before loading session data, check sessionStorage noor_registration_complete flag to bypass redirect after registration, clear bypass flag after verification; Debug: [DEBUG-WORKITEM:userlanding:guard:waiting];CLEANUP_OK
---
Phase 2: Add Registration Guard to SessionCanvas.razor — Add CheckParticipantRegistration() method, add registration verification in OnInitializedAsync(), check sessionStorage bypass flag, clear bypass flag after verification; Debug: [DEBUG-WORKITEM:userlanding:guard:canvas];CLEANUP_OK
---
Phase 3: Add Registration Guard to TranscriptCanvas.razor — Add CheckParticipantRegistration() method, add registration verification in OnInitializedAsync(), check sessionStorage bypass flag, clear bypass flag after verification; Debug: [DEBUG-WORKITEM:userlanding:guard:transcript];CLEANUP_OK
---
Phase 4: Update UserLanding.razor Post-Registration Navigation — Set noor_registration_complete sessionStorage flag after successful registration before navigation to SessionCanvas or SessionWaiting; Debug: [DEBUG-WORKITEM:userlanding:bypass-flag];CLEANUP_OK
---
Phase 5: Add Session Ended Handling — Check session status in registration guard for all session pages, redirect to /session/ended/{sessionId} if status equals ended; Debug: [DEBUG-WORKITEM:userlanding:session-ended];CLEANUP_OK
---
Phase 6: localStorage Infrastructure — Add RegistrationStorageData class with Name, Email, Country, ExpiresAt, LastAccessedAt properties; Implement SaveRegistrationDataAsync() with 2-day expiration, JSON serialization, error handling; Implement LoadRegistrationDataAsync() with expiration check, JSON deserialization, auto-clear if expired; Debug: [DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK
---
Phase 7: Expiration Extension Logic — Implement ExtendExpirationAsync() to add 24 hours to ExpiresAt timestamp; Update LoadRegistrationDataAsync() to call ExtendExpirationAsync() after successful load; Update LastAccessedAt timestamp; Debug: [DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK
---
Phase 8: Data Validation — Implement ValidateRegistrationDataAsync() with email regex validation, name non-empty check, country code validation; Call validation in load flow before using data; Auto-clear localStorage if validation fails; Debug: [DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK
---
Phase 9: Save/Load Integration — Locate HandleUserRegistration() method in UserLanding.razor; Add SaveRegistrationDataAsync() call AFTER successful API registration, BEFORE navigation; Pass Model.Name, Model.Email, Model.CountryCode; Locate LoadSessionInfoAsync() method; Add LoadRegistrationDataAsync() call after token validation; If data valid: validate, extend expiration, pre-populate form, auto-navigate based on session status (created→/session/waiting/{token}, active/started→/session/canvas/{token}, ended→/session/ended/{sessionId}); Debug: [DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK and [DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK
---
Phase 10: Debug Panel Clear Button — Locate GetUserLandingDebugActions() method; Implement ClearLocalStorageAsync() to remove localStorage entry, clear form fields (Name, Email, CountryCode), call StateHasChanged(); Add debug action with Label='Clear Local Storage', Icon='fa-solid fa-trash-can', Action=ClearLocalStorageAsync(); Debug: [DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK
---
Phase 11: E2E Testing — Create Tests/UI/registration-guard-enforcement.spec.ts with 8 test scenarios (unregistered user redirect from waiting/canvas, registered user access, ended session redirect, localStorage save/load, expiration, token isolation, debug panel clear); Create Scripts/run-registration-guard-test.ps1 PowerShell orchestration script using Session 212 fixtures (Host: PQ9N5YWW, User: KJAHA99L)"
```

---

### 📝 Post-Implementation Steps

1. **Run the E2E test:**
   ```powershell
   .\Scripts\run-registration-guard-test.ps1
   ```

2. **Manual validation:**
   - Test all flows in browser (new user, returning user, direct navigation)
   - Verify localStorage in DevTools
   - Test debug panel clear functionality

3. **Build verification:**
   ```powershell
   dotnet build
   ```

4. **When ready to finalize:**
   ```
   @workspace /task key=userlanding tasks="mark complete"
   ```
   This will clean up debug markers and promote to production.

---

## 📊 Success Metrics

### Security
- ✅ Zero unregistered users can access session pages
- ✅ All bypass attempts logged for security monitoring
- ✅ Session status transitions handled correctly

### User Experience
- ✅ Returning users: form pre-populated in <1 second
- ✅ New users: smooth registration flow
- ✅ Zero redirect loops or navigation errors

### Data Integrity
- ✅ localStorage data persists for 2 days minimum
- ✅ Daily access extends expiration indefinitely
- ✅ Corrupted/invalid data auto-clears without errors

### Testing
- ✅ 100% E2E test pass rate
- ✅ All 8 scenarios automated
- ✅ Build passes with zero warnings

---

## 🛑 Important Reminders

- **Current Branch:** `development` (verified ✅)
- **No Breaking Changes:** All existing features remain functional
- **Debug Markers:** All phases include cleanup-ready markers
- **Logging:** COPILOT-DEBUG and NOOR-DEBUG-PANEL patterns used throughout
- **Graceful Degradation:** Works even if localStorage disabled

---

**Plan Status:** ✅ **Ready for Implementation**  
**Approval Required:** User confirmation  
**Estimated Completion:** ~4 hours  
**Risk Level:** Low (defensive coding, comprehensive testing)

---

**END OF COMPREHENSIVE PLAN**

---

## **🎯 Phased Implementation Approach**

### **Phase 1: Add localStorage Infrastructure with Expiration Model**

**Objective:** Create the data model and core localStorage save/load methods

**Tasks:**
1. Add `RegistrationStorageData` class with properties:
   - `Name`, `Email`, `Country`
   - `ExpiresAt` (2-day window from creation)
   - `LastAccessedAt` (for extension logic)

2. Add `SaveRegistrationDataAsync()` method:
   - Accepts registration data
   - Sets `ExpiresAt = DateTime.UtcNow.AddDays(2)`
   - Sets `LastAccessedAt = DateTime.UtcNow`
   - Serializes to JSON
   - Saves to localStorage with key: `noor_user_registration_{token}`
   - Includes try-catch for graceful degradation
   - Logs: `COPILOT-DEBUG: [localStorage] Data saved with 2-day expiration`

3. Add `LoadRegistrationDataAsync()` method:
   - Retrieves data from localStorage
   - Deserializes JSON
   - Checks if expired (> 2 days from `ExpiresAt`)
   - If expired: clears stale data, returns null
   - If valid: returns data
   - Logs: `COPILOT-DEBUG: [localStorage] Data loaded` or `Data expired and cleared`

**Deliverables:**
- ✅ Data model defined
- ✅ Save/Load methods implemented
- ✅ Expiration validation logic

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`

---

### **Phase 2: Extend Expiration Logic**

**Objective:** Add 24-hour extension when user accesses within 2-day window

**Tasks:**
1. Add `ExtendExpirationAsync()` method:
   - Checks if current time is within 2-day window
   - If yes: adds 24 hours to `ExpiresAt`
   - Updates `LastAccessedAt`
   - Saves updated data back to localStorage
   - Logs: `COPILOT-DEBUG: [localStorage] Expiration extended by 24h - New expiry: {date}`

2. Call `ExtendExpirationAsync()` from `LoadRegistrationDataAsync()`:
   - After successful load and validation
   - Before returning data

**Deliverables:**
- ✅ Extension logic implemented
- ✅ Timestamps properly updated

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK`

---

### **Phase 3: Integrate Save on Successful Registration**

**Objective:** Save registration data when user clicks "Join Waiting Room" and registration succeeds

**Tasks:**
1. Locate `HandleUserRegistration()` method in UserLanding.razor
2. Add call to `SaveRegistrationDataAsync()`:
   - **AFTER** successful API registration call
   - **BEFORE** navigation to SessionWaiting/SessionCanvas
   - Pass `Model.Name`, `Model.Email`, `Model.CountryCode`
   
3. Add error handling:
   - Wrap in try-catch
   - Log errors but don't block navigation
   - Graceful degradation if localStorage fails

**Deliverables:**
- ✅ Registration data persists after successful registration
- ✅ No blocking errors if localStorage unavailable

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK`

---

### **Phase 4: Integrate Auto-Load on Token Validation**

**Objective:** Pre-populate form fields with saved data when returning user validates token

**Tasks:**
1. Locate `LoadSessionInfoAsync()` method (called after token validation)
2. Add call to `LoadRegistrationDataAsync()`:
   - **AFTER** successful token validation
   - **BEFORE** showing registration panel
   
3. If data returned:
   - Populate `Model.Name = data.Name`
   - Populate `Model.Email = data.Email`
   - Populate `Model.CountryCode = data.Country`
   - Call `StateHasChanged()` to update UI
   - Call `ExtendExpirationAsync()` (already integrated in Phase 2)

4. If no data or expired:
   - Leave form fields empty (default behavior)

**Deliverables:**
- ✅ Form auto-populates for returning users
- ✅ Expiration extends automatically on access

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:auto-load];CLEANUP_OK`

---

### **Phase 5: Add Debug Panel Clear Button**

**Objective:** Add "Clear Local Storage" button to debug panel

**Tasks:**
1. Locate `GetUserLandingDebugActions()` method
2. Add new debug action:
   - **Label:** "Clear Local Storage"
   - **Icon:** `fa-solid fa-trash-can`
   - **Action:** Call `ClearLocalStorageAsync()`

3. Implement `ClearLocalStorageAsync()`:
   - Removes localStorage item: `noor_user_registration_{token}`
   - Clears `Model.Name`, `Model.Email`, `Model.CountryCode`
   - Calls `StateHasChanged()`
   - Logs: `NOOR-DEBUG-PANEL: Local storage cleared for token: {token}`
   - **NO toast** (per existing debug panel pattern)

**Deliverables:**
- ✅ Debug panel button functional
- ✅ Storage and form cleared on click
- ✅ Logging confirmation

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK`

---

### **Phase 6: Testing & Validation**

**Objective:** Manual testing of all scenarios

**Test Scenarios:**
1. **Save on Registration**
   - Enter token → Fill form → Click "Join Waiting Room"
   - Verify localStorage contains data with proper expiration

2. **Auto-Load within 2 Days**
   - Return with same token within 2 days
   - Verify form pre-populated
   - Check localStorage: verify expiration extended by 24 hours

3. **Expired Data**
   - Manually modify localStorage `expiresAt` to past date
   - Reload page with token
   - Verify form empty, stale data cleared

4. **Token Isolation**
   - Save data for TOKEN1
   - Switch to TOKEN2
   - Verify TOKEN2 has empty form
   - Return to TOKEN1, verify data still present

5. **Debug Panel Clear**
   - Save data → Open debug panel → Click "Clear Local Storage"
   - Verify form cleared, localStorage empty

6. **Edge Cases**
   - Test with localStorage disabled (private browsing)
   - Test with corrupted JSON data
   - Verify graceful degradation

**Deliverables:**
- ✅ All test scenarios pass
- ✅ Edge cases handled gracefully

**Debug Markers:** N/A (testing phase)

---

## **🔄 Implementation Flow Diagram**

```
User arrives at landing page
    ↓
Enters token → Validates token
    ↓
LoadRegistrationDataAsync() called
    ↓
Data exists & not expired? → YES → Pre-populate form + Extend expiration by 24h
    ↓ NO
Form remains empty
    ↓
User fills form → Clicks "Join Waiting Room"
    ↓
Registration API call succeeds? → NO → Show error
    ↓ YES
SaveRegistrationDataAsync() (2-day expiration)
    ↓
Navigate to SessionWaiting/SessionCanvas
```

---

## **❓ Clarification Questions**

Before proceeding with implementation, I need clarification on a few points:

1. **Expiration Extension Logic:**
   - You mentioned "adding 24 hours if logged within 2 days"
   - Should this be: **"extend by 24 hours EACH time user accesses within the 2-day window"**?
   - Or: **"extend ONCE to 3 days total if accessed within initial 2-day window"**?
   - **My assumption:** Extend by 24h each time (so accessing daily keeps data fresh indefinitely)

2. **Multiple Token Access:**
   - If a user has data for TOKEN1 (expires Oct 21) and accesses TOKEN2, should TOKEN1's data remain unchanged until its expiration?
   - **My assumption:** Yes, each token has independent expiration

3. **Form Validation:**
   - Should we validate that pre-populated data still matches expected formats (e.g., email format, country code exists)?
   - **My assumption:** Yes, perform basic validation and clear if invalid

4. **Debug Panel Visibility:**
   - Debug panel is only visible in development mode - is this correct?
   - **My assumption:** Yes (based on DebugPanel.razor implementation)

5. **Optional Enhancement - Visual Indicator:**
   - Would you like a small icon or text next to pre-filled fields to indicate they were loaded from storage?
   - Example: "ⓘ Loaded from previous session"
   - **Decision needed:** Include this or skip?

---

## **📊 Effort Estimate**

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Infrastructure | 30 minutes |
| Phase 2: Extension Logic | 15 minutes |
| Phase 3: Save Integration | 15 minutes |
| Phase 4: Auto-Load Integration | 20 minutes |
| Phase 5: Debug Panel Button | 15 minutes |
| Phase 6: Testing | 25 minutes |
| **Total** | **~2 hours** |

---

## **📝 Next Steps**

Please review the plan above and:

1. **Answer the clarification questions** (especially question #1 about expiration extension logic)
2. **Confirm optional enhancements** (visual indicator for pre-filled fields?)
3. **Approve the phased approach** or request modifications

Once confirmed, I'll be ready to proceed with implementation. Just say **"begin implementation"** or ask any questions you have! 🚀

asifhussain60: Expiration Extension Logic:

You mentioned "adding 24 hours if logged within 2 days"
My assumption: Extend by 24h each time (so accessing daily keeps data fresh indefinitely)


If a user has data for TOKEN1 (expires Oct 21) and accesses TOKEN2, should TOKEN1's data remain unchanged until its expiration?
My assumption: Yes, each token has independent expiration - CORRECT. Should be able to connect as long as token is valid and not expired.

Should we validate that pre-populated data still matches expected formats (e.g., email format, country code exists)?
My assumption: Yes, perform basic validation and clear if invalid - CORRECT

Debug panel is only visible in development mode - is this correct? YES


Would you like a small icon or text next to pre-filled fields to indicate they were loaded from storage? NO

If user token is valid, registration fields filled from local storage and data validated, then
IF session status = created then waiting room
If status = active then appropriate canvas view
If status = ended then session ended view.

Update plan and document it under workspaces

GitHub Copilot: I'll update the implementation plan with all your confirmed requirements and document it in the workspace. 

Updated todo list

Created [](file:///d%3A/PROJECTS/NOOR%20CANVAS/Workspaces/Plans/UserLanding-LocalStorage-Implementation-Plan.md)

Completed (1/2) *Update implementation plan based on user feedback*

Perfect! I've created a comprehensive implementation plan and saved it to the workspace. Here's what I've documented:

## 📋 Summary of Updated Plan

**Location:** `d:\PROJECTS\NOOR CANVAS\Workspaces\Plans\UserLanding-LocalStorage-Implementation-Plan.md`

### ✅ Key Requirements Incorporated:

1. **Expiration Extension Logic:** 24-hour rolling extension on each access (keeps data fresh indefinitely with daily use)

2. **Token Isolation:** Each token has independent localStorage entry - data persists as long as token is valid

3. **Data Validation:** Pre-populated data validated for email format, country code, and non-empty name - automatically cleared if invalid

4. **Auto-Navigation:** After successful data load and validation:
   - Session Status = "created" → Navigate to waiting room
   - Session Status = "active/started" → Navigate to session canvas
   - Session Status = "ended" → Navigate to session ended page

5. **Debug Panel:** Clear localStorage button (development mode only) - no visual indicator for pre-filled fields

### 📦 Plan Includes:

- **7 Implementation Phases** with detailed code examples
- **11 Test Scenarios** covering all edge cases
- **Architecture diagrams** showing complete flow
- **Data model** and storage strategy
- **Debug markers** for all phases
- **Effort estimates** (~2.5 hours total)

### 🎯 Ready for Implementation

The plan is now documented and ready. When you're ready to proceed, I can generate the implementation command. 

**Would you like me to:**
1. **Generate the implementation command** to execute all phases?
2. **Review specific sections** of the plan?
3. **Make any adjustments** before proceeding?

Just let me know how you'd like to proceed! 🚀

Made changes.

asifhussain60: Add a succint summary at the top of the document reflecting the phases and the work

GitHub Copilot: I'll add a succinct summary at the top of the document that reflects the phases and work to be done. 

Using "Replace String in File"


```

```
Perfect! I've added a succinct summary at the top of the document that includes:

✅ **Quick Summary section** with:
- **What** - Brief description of the feature
- **Why** - The business value
- **How** - All 7 phases with time estimates
- **Key Features** - Bullet-point highlights of main functionality
- **Files Modified** - What will be changed

The summary provides a quick 30-second overview before diving into the detailed implementation plan. This makes it easy to understand the scope and effort at a glance.

Is there anything else you'd like me to adjust in the plan?

Made changes.

asifhussain60: Follow instructions in [task.prompt.md](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/prompts/task.prompt.md).
key: userlanding debug-level: simple verbosity: concise annotate: none tasks:  
Generate the implementation command to execute all phases?

GitHub Copilot: I'll generate the implementation command to execute all 7 phases of the User Landing local storage feature. 

Searched for files matching `**/.github/key-data-streams/**/userlanding*`, 1 match

Read [](file:///d%3A/PROJECTS/NOOR%20CANVAS/.github/key-data-streams/userlanding/work-log.md#1-1), lines 1 to 50

Perfect! I can see there's already a key data stream for `userlanding` with the registration guard work. Now I'll create the implementation command for the **localStorage** feature based on the plan we just created.

## 🎯 Implementation Command

Based on the comprehensive plan in UserLanding-LocalStorage-Implementation-Plan.md, here's your ready-to-execute command:

```
@workspace /task key=userlanding debug-level=simple verbosity=concise tasks="Phase 1: localStorage Infrastructure — Add RegistrationStorageData class with Name, Email, Country, ExpiresAt, LastAccessedAt properties; Implement SaveRegistrationDataAsync() with 2-day expiration, JSON serialization, error handling; Implement LoadRegistrationDataAsync() with expiration check (within 2 days), JSON deserialization, auto-clear if expired; Debug: [DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK
---
Phase 2: Expiration Extension Logic — Implement ExtendExpirationAsync() to add 24 hours to ExpiresAt timestamp; Update LoadRegistrationDataAsync() to call ExtendExpirationAsync() after successful load; Update LastAccessedAt timestamp; Debug: [DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK
---
Phase 3: Data Validation — Implement ValidateRegistrationDataAsync() with email regex validation, name non-empty check, country code validation; Call validation in load flow before using data; Auto-clear localStorage if validation fails; Debug: [DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK
---
Phase 4: Save on Registration — Locate HandleUserRegistration() method in UserLanding.razor; Add SaveRegistrationDataAsync() call AFTER successful API registration, BEFORE navigation; Pass Model.Name, Model.Email, Model.CountryCode; Error handling does not block navigation; Debug: [DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK
---
Phase 5: Auto-Load and Auto-Navigate — Locate LoadSessionInfoAsync() method; Add LoadRegistrationDataAsync() call after token validation; If data valid: validate, extend expiration, pre-populate form (Model.Name, Model.Email, Model.CountryCode); Auto-navigate based on session status: created→/session/waiting/{token}, active/started→/session/canvas/{token}, ended→/session/ended/{sessionId}; If data invalid: show empty form; Debug: [DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK
---
Phase 6: Debug Panel Clear Button — Locate GetUserLandingDebugActions() method; Implement ClearLocalStorageAsync() to remove localStorage entry, clear form fields (Name, Email, CountryCode), call StateHasChanged(); Add debug action with Label='Clear Local Storage', Icon='fa-solid fa-trash-can', Action=ClearLocalStorageAsync(); Debug: [DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK
---
Phase 7: Manual Testing — Test save on registration (verify localStorage after Join Waiting Room); Test auto-load with session created/active/ended (verify auto-navigation); Test expiration after 2 days (manually edit expiresAt); Test invalid email format (verify auto-clear); Test token isolation (multiple tokens); Test debug panel clear; Test edge cases (localStorage disabled, corrupted JSON); Test rolling expiration (24h extension on each visit); Document all test results"
```

---

## 📋 What This Command Will Do

The task agent will execute **7 sequential phases** to implement the localStorage feature:

1. ✅ **Phase 1** (30 min) - Build data model and core save/load methods
2. ✅ **Phase 2** (15 min) - Add 24-hour rolling extension logic
3. ✅ **Phase 3** (20 min) - Add validation for email, name, country
4. ✅ **Phase 4** (15 min) - Hook save after successful registration
5. ✅ **Phase 5** (25 min) - Hook auto-load and implement auto-navigation
6. ✅ **Phase 6** (15 min) - Add debug panel clear button
7. ✅ **Phase 7** (30 min) - Execute manual testing checklist

**Total Time:** ~2.5 hours

---

## 🎯 Key Features Being Implemented

- 📦 Token-specific storage: `noor_user_registration_{token}`
- ⏱️ 2-day expiration with +24h rolling extension
- 🔄 Auto-navigation: created→waiting, active→canvas, ended→ended
- ✅ Data validation with auto-clear if invalid
- 🛡️ Graceful degradation if localStorage unavailable
- 🧪 Debug panel tool for testing

---

## 📝 After Execution

Once complete, you'll need to:

1. **Test manually** (Phase 7 checklist)
2. **Verify debug markers** inserted correctly
3. **Run build** to ensure zero errors/warnings
4. **Test edge cases** (private browsing, corrupted data)

Later, when ready to finalize:
```
@workspace /task key=userlanding tasks="mark complete"
```
This will clean up debug markers and promote tests to production.

---

**Ready to proceed?** Just copy the command above and paste it into the chat! 🚀