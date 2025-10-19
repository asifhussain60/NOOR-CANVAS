# User Landing Local Storage Implementation Plan

**Work Item Key:** `userlanding`  
**Scope:** Full-stack (Client-side localStorage + Auto-navigation)  
**Created:** October 19, 2025  
**Status:** Ready for Implementation

---

## 🎯 Quick Summary

**What:** Implement persistent user registration data (name, email, country) using browser localStorage with 2-day expiration and 24-hour rolling extension.

**Why:** Improve returning user experience by auto-populating registration forms and auto-navigating to appropriate session views based on session status.

**How:** 7 implementation phases across ~2.5 hours:

1. **Phase 1** (30 min) - Build localStorage infrastructure: data model, save/load methods, expiration checking
2. **Phase 2** (15 min) - Add 24-hour rolling extension logic on each access
3. **Phase 3** (20 min) - Validate saved data: email format, country code, non-empty fields
4. **Phase 4** (15 min) - Save data after successful registration (on "Join Waiting Room" click)
5. **Phase 5** (25 min) - Auto-load data after token validation + auto-navigate by session status (created→waiting, active→canvas, ended→ended)
6. **Phase 6** (15 min) - Add debug panel "Clear Local Storage" button (dev mode only)
7. **Phase 7** (30 min) - Test 11 scenarios including expiration, validation, isolation, edge cases

**Key Features:**
- ✅ Token-specific storage keys for isolation (`noor_user_registration_{token}`)
- ✅ 2-day expiration with +24h extension on each valid access (rolling window)
- ✅ Auto-navigation based on session status when data valid
- ✅ Data validation with auto-clear if invalid/corrupted
- ✅ Graceful degradation if localStorage unavailable

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor` (all phases)

---

## 📋 Executive Summary

Implement persistent user registration data using browser localStorage to improve user experience on the UserLanding page. When users return with a valid token, their registration information (name, email, country) will be automatically loaded and validated. If data is valid, the system will auto-navigate to the appropriate session view based on session status.

---

## 🎯 Goals and Success Criteria

### Primary Goals
1. Save user registration data to localStorage after successful registration
2. Auto-load and validate saved data when returning user enters valid token
3. Auto-navigate to appropriate view based on session status when data is valid
4. Provide debug panel tool to clear local storage for testing
5. Implement 2-day expiration with 24-hour rolling extension

### Success Criteria
- ✅ Registration data persists across browser sessions for valid tokens
- ✅ Data expires after 2 days of inactivity
- ✅ Each access within 2-day window extends expiration by 24 hours
- ✅ Pre-populated data is validated (email format, country code exists)
- ✅ Invalid/corrupted data is automatically cleared
- ✅ Auto-navigation works: created→waiting, active→canvas, ended→ended
- ✅ Each token has independent localStorage key and expiration
- ✅ Debug panel can manually clear storage (development mode only)
- ✅ Graceful degradation if localStorage unavailable

---

## 📦 Technology Stack

**Framework:** ASP.NET Core 8.0 (Blazor Server)  
**UI Library:** MudBlazor 8.13.0  
**JavaScript Interop:** IJSRuntime (localStorage API)  
**Logging:** Serilog with structured logging  
**Testing:** Manual validation

**Browser APIs:**
- `localStorage.setItem(key, value)` - Save data
- `localStorage.getItem(key)` - Retrieve data
- `localStorage.removeItem(key)` - Clear data

---

## 🔍 Requirements Clarification (CONFIRMED)

| Requirement | Clarification | Status |
|-------------|---------------|--------|
| **Expiration Extension** | Extend by 24h EACH time user accesses within 2-day window (rolling extension) | ✅ Confirmed |
| **Token Isolation** | Each token has independent expiration - data persists as long as token is valid | ✅ Confirmed |
| **Data Validation** | Validate pre-populated data (email format, country code) - clear if invalid | ✅ Confirmed |
| **Debug Panel Visibility** | Only visible in development mode | ✅ Confirmed |
| **Visual Indicator** | NO icon/text for pre-filled fields | ✅ Confirmed |
| **Auto-Navigation** | If token valid + data valid: navigate based on session status | ✅ Confirmed |

---

## 🏗️ Architecture Design

### Data Model

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

### Storage Strategy

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

### Integration Points

1. **Save Location:** `HandleUserRegistration()` method
   - Trigger: After successful API registration, before navigation
   - Sets 2-day expiration from current time

2. **Load Location:** `LoadSessionInfoAsync()` method
   - Trigger: After successful token validation
   - Validates data format and expiration
   - Extends expiration by 24 hours if valid

3. **Auto-Navigation Logic:** After successful data load and validation
   - Session Status = "created" → Navigate to `/session/waiting/{token}`
   - Session Status = "active" or "started" → Navigate to appropriate canvas
   - Session Status = "ended" → Navigate to `/session/ended/{sessionId}`

4. **Debug Panel:** `GetUserLandingDebugActions()` method
   - Add "Clear Local Storage" button
   - Visible only in development mode

---

## 🔄 Implementation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User arrives at /user/landing/{token}                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Token validation via API                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  Token Valid? ───NO──→ Show error
                            │
                           YES
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ LoadRegistrationDataAsync()                                     │
│ - Retrieve from localStorage                                    │
│ - Check expiration (within 2 days?)                            │
│ - Validate data format                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┴─────────────┐
              │                           │
         Data Valid?                  Data Invalid/Expired?
              │                           │
             YES                          NO
              │                           │
              ↓                           ↓
┌──────────────────────────┐    ┌──────────────────────┐
│ Pre-populate form fields │    │ Clear stale data     │
│ Extend expiration +24h   │    │ Show empty form      │
└──────────────────────────┘    └──────────────────────┘
              │                           │
              ↓                           ↓
┌──────────────────────────┐    ┌──────────────────────┐
│ Check Session Status:    │    │ User fills form      │
│ - created → waiting room │    │ Clicks "Join"        │
│ - active → canvas        │    │                      │
│ - ended → ended page     │    └──────────────────────┘
└──────────────────────────┘              │
              │                           ↓
              │                 ┌──────────────────────┐
              │                 │ Registration API     │
              │                 │ SaveRegistrationData │
              │                 │ (2-day expiration)   │
              │                 └──────────────────────┘
              │                           │
              └───────────────────────────┘
                            ↓
              Navigate to appropriate view
```

---

## 📋 Implementation Phases

### **Phase 1: Add localStorage Infrastructure with Expiration Model**

**Objective:** Create data model and core localStorage save/load methods

**Tasks:**
1. Add `RegistrationStorageData` class to UserLanding.razor code section
   - Properties: Name, Email, Country, ExpiresAt, LastAccessedAt
   - Location: Near other private classes/models

2. Implement `SaveRegistrationDataAsync(string name, string email, string country)`:
   ```csharp
   private async Task SaveRegistrationDataAsync(string name, string email, string country)
   {
       try
       {
           var data = new RegistrationStorageData
           {
               Name = name,
               Email = email,
               Country = country,
               ExpiresAt = DateTime.UtcNow.AddDays(2),
               LastAccessedAt = DateTime.UtcNow
           };
           
           var json = System.Text.Json.JsonSerializer.Serialize(data);
           var key = $"noor_user_registration_{SessionToken}";
           
           await JSRuntime.InvokeVoidAsync("localStorage.setItem", key, json);
           
           Logger.LogInformation(
               "COPILOT-DEBUG: [localStorage] Data saved with 2-day expiration - Token: {Token}, ExpiresAt: {ExpiresAt}",
               SessionToken, data.ExpiresAt);
       }
       catch (Exception ex)
       {
           Logger.LogError(ex, "COPILOT-DEBUG: [localStorage] Failed to save registration data - Token: {Token}", SessionToken);
       }
   }
   ```

3. Implement `LoadRegistrationDataAsync()`:
   ```csharp
   private async Task<RegistrationStorageData?> LoadRegistrationDataAsync()
   {
       try
       {
           var key = $"noor_user_registration_{SessionToken}";
           var json = await JSRuntime.InvokeAsync<string?>("localStorage.getItem", key);
           
           if (string.IsNullOrEmpty(json))
           {
               Logger.LogInformation("COPILOT-DEBUG: [localStorage] No data found for token: {Token}", SessionToken);
               return null;
           }
           
           var data = System.Text.Json.JsonSerializer.Deserialize<RegistrationStorageData>(json);
           
           if (data == null)
           {
               Logger.LogWarning("COPILOT-DEBUG: [localStorage] Invalid JSON data - clearing");
               await ClearLocalStorageAsync();
               return null;
           }
           
           // Check expiration (2-day window)
           if (DateTime.UtcNow > data.ExpiresAt)
           {
               Logger.LogInformation(
                   "COPILOT-DEBUG: [localStorage] Data expired - Token: {Token}, ExpiredAt: {ExpiresAt}",
                   SessionToken, data.ExpiresAt);
               await ClearLocalStorageAsync();
               return null;
           }
           
           Logger.LogInformation(
               "COPILOT-DEBUG: [localStorage] Data loaded successfully - Token: {Token}, ExpiresAt: {ExpiresAt}",
               SessionToken, data.ExpiresAt);
           
           return data;
       }
       catch (Exception ex)
       {
           Logger.LogError(ex, "COPILOT-DEBUG: [localStorage] Failed to load registration data - Token: {Token}", SessionToken);
           return null;
       }
   }
   ```

**Deliverables:**
- ✅ `RegistrationStorageData` class defined
- ✅ `SaveRegistrationDataAsync()` implemented
- ✅ `LoadRegistrationDataAsync()` implemented with expiration check
- ✅ Error handling and logging in place

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 2: Implement Expiration Extension Logic**

**Objective:** Add 24-hour rolling extension when user accesses within 2-day window

**Tasks:**
1. Implement `ExtendExpirationAsync(RegistrationStorageData data)`:
   ```csharp
   private async Task ExtendExpirationAsync(RegistrationStorageData data)
   {
       try
       {
           var now = DateTime.UtcNow;
           var newExpiresAt = data.ExpiresAt.AddHours(24);
           data.ExpiresAt = newExpiresAt;
           data.LastAccessedAt = now;
           
           var json = System.Text.Json.JsonSerializer.Serialize(data);
           var key = $"noor_user_registration_{SessionToken}";
           
           await JSRuntime.InvokeVoidAsync("localStorage.setItem", key, json);
           
           Logger.LogInformation(
               "COPILOT-DEBUG: [localStorage] Expiration extended by 24h - Token: {Token}, NewExpiresAt: {NewExpiresAt}",
               SessionToken, newExpiresAt);
       }
       catch (Exception ex)
       {
           Logger.LogError(ex, "COPILOT-DEBUG: [localStorage] Failed to extend expiration - Token: {Token}", SessionToken);
       }
   }
   ```

2. Update `LoadRegistrationDataAsync()` to call extension:
   - After successful load and validation
   - Before returning data

**Deliverables:**
- ✅ `ExtendExpirationAsync()` implemented
- ✅ Extension called on every successful load
- ✅ Timestamps properly updated

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 3: Add Data Validation Logic**

**Objective:** Validate pre-populated data format before use

**Tasks:**
1. Implement `ValidateRegistrationDataAsync(RegistrationStorageData data)`:
   ```csharp
   private async Task<bool> ValidateRegistrationDataAsync(RegistrationStorageData data)
   {
       // Validate email format
       if (!string.IsNullOrWhiteSpace(data.Email))
       {
           var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
           if (!emailRegex.IsMatch(data.Email))
           {
               Logger.LogWarning(
                   "COPILOT-DEBUG: [localStorage:validation] Invalid email format - clearing data");
               await ClearLocalStorageAsync();
               return false;
           }
       }
       
       // Validate country code exists in dropdown options
       // Note: Countries list should be available in component
       if (!string.IsNullOrWhiteSpace(data.Country))
       {
           // Add validation against Countries collection if available
           // For now, basic non-empty check
       }
       
       // Validate name is not empty
       if (string.IsNullOrWhiteSpace(data.Name))
       {
           Logger.LogWarning(
               "COPILOT-DEBUG: [localStorage:validation] Empty name field - clearing data");
           await ClearLocalStorageAsync();
           return false;
       }
       
       Logger.LogInformation("COPILOT-DEBUG: [localStorage:validation] Data validated successfully");
       return true;
   }
   ```

2. Call validation in load flow before using data

**Deliverables:**
- ✅ Email format validation
- ✅ Name non-empty validation
- ✅ Country code validation
- ✅ Invalid data automatically cleared

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 4: Integrate Save on Successful Registration**

**Objective:** Save registration data when user clicks "Join Waiting Room" and registration succeeds

**Tasks:**
1. Locate `HandleUserRegistration()` method in UserLanding.razor
   - Current location: Around line 1000-1100

2. Add call to `SaveRegistrationDataAsync()`:
   - **AFTER** successful API registration (`/api/participant/register`)
   - **BEFORE** navigation to SessionWaiting/SessionCanvas
   - Pass `Model.Name`, `Model.Email`, `Model.CountryCode`

3. Add to existing code:
   ```csharp
   // After successful registration API call
   await SaveRegistrationDataAsync(Model.Name, Model.Email, Model.CountryCode);
   
   // Then existing navigation logic...
   ```

4. Ensure error handling doesn't block navigation if save fails

**Deliverables:**
- ✅ Registration data saved after successful registration
- ✅ Save happens before navigation
- ✅ Navigation not blocked if save fails

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 5: Integrate Auto-Load and Auto-Navigation**

**Objective:** Pre-populate form and auto-navigate when returning user has valid data

**Tasks:**
1. Locate `LoadSessionInfoAsync()` method
   - Called after successful token validation
   - Current location: Around line 900-1000

2. Add load and validation flow after token validation:
   ```csharp
   // After successful token validation
   var savedData = await LoadRegistrationDataAsync();
   
   if (savedData != null)
   {
       // Validate data
       var isValid = await ValidateRegistrationDataAsync(savedData);
       
       if (isValid)
       {
           // Extend expiration
           await ExtendExpirationAsync(savedData);
           
           // Pre-populate form
           Model.Name = savedData.Name;
           Model.Email = savedData.Email;
           Model.CountryCode = savedData.Country;
           
           Logger.LogInformation(
               "COPILOT-DEBUG: [localStorage:auto-load] Form pre-populated for returning user");
           
           // Auto-navigate based on session status
           var sessionStatus = SessionInfo?.Status?.ToLowerInvariant() ?? "";
           
           if (sessionStatus == "created")
           {
               Logger.LogInformation(
                   "COPILOT-DEBUG: [localStorage:auto-nav] Navigating to waiting room");
               Navigation.NavigateTo($"/session/waiting/{SessionToken}");
               return;
           }
           else if (sessionStatus == "active" || sessionStatus == "started")
           {
               Logger.LogInformation(
                   "COPILOT-DEBUG: [localStorage:auto-nav] Navigating to session canvas");
               Navigation.NavigateTo($"/session/canvas/{SessionToken}");
               return;
           }
           else if (sessionStatus == "ended")
           {
               Logger.LogInformation(
                   "COPILOT-DEBUG: [localStorage:auto-nav] Navigating to session ended");
               Navigation.NavigateTo($"/session/ended/{SessionInfo.SessionId}");
               return;
           }
           
           // If status unknown, show form with pre-populated data
           await InvokeAsync(StateHasChanged);
       }
   }
   ```

**Deliverables:**
- ✅ Form auto-populates with saved data
- ✅ Data validation before use
- ✅ Expiration extended automatically
- ✅ Auto-navigation based on session status
- ✅ Falls back to manual registration if data invalid

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 6: Add Debug Panel Clear Button**

**Objective:** Add "Clear Local Storage" button to debug panel for testing

**Tasks:**
1. Locate `GetUserLandingDebugActions()` method
   - Returns list of debug actions for DebugPanel component
   - Current location: Around line 1300-1400

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
           Logger.LogError(ex, 
               "NOOR-DEBUG-PANEL: Failed to clear local storage - Token: {Token}", SessionToken);
       }
   }
   ```

3. Add debug action to `GetUserLandingDebugActions()`:
   ```csharp
   new DebugAction
   {
       Label = "Clear Local Storage",
       Icon = "fa-solid fa-trash-can",
       Action = async () => await ClearLocalStorageAsync()
   }
   ```

**Deliverables:**
- ✅ `ClearLocalStorageAsync()` implemented
- ✅ Debug panel button added
- ✅ Storage and form cleared on click
- ✅ Logging confirmation (no toast per debug panel pattern)

**Debug Markers:** `[DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK`

**Files Modified:** `SPA/NoorCanvas/Pages/UserLanding.razor`

---

### **Phase 7: Testing & Validation**

**Objective:** Manual testing of all scenarios

**Test Scenarios:**

#### Test 1: Save on Successful Registration
**Steps:**
1. Navigate to `/user/landing/KJAHA99L`
2. Enter valid token, wait for validation
3. Fill registration form (Name: "Test User", Email: "test@example.com", Country: "BH")
4. Click "Join Waiting Room"
5. Open browser DevTools → Application → Local Storage
6. Verify key `noor_user_registration_KJAHA99L` exists
7. Verify JSON contains correct data and `expiresAt` is ~2 days in future

**Expected Result:** ✅ Data saved to localStorage with 2-day expiration

---

#### Test 2: Auto-Load and Auto-Navigate (Session Created)
**Prerequisites:** Session 212 status = "created", localStorage has valid data

**Steps:**
1. Clear browser navigation history
2. Navigate to `/user/landing/KJAHA99L`
3. Wait for token validation

**Expected Result:** 
- ✅ Form pre-populated with saved data
- ✅ Auto-navigate to `/session/waiting/KJAHA99L`
- ✅ Check localStorage: `expiresAt` extended by 24 hours
- ✅ Console log: "Expiration extended by 24h"

---

#### Test 3: Auto-Load and Auto-Navigate (Session Active)
**Prerequisites:** Session 212 status = "active", localStorage has valid data

**Steps:**
1. Update session status to "active" in database
2. Navigate to `/user/landing/KJAHA99L`

**Expected Result:** 
- ✅ Auto-navigate to `/session/canvas/KJAHA99L`
- ✅ Expiration extended by 24 hours

---

#### Test 4: Auto-Navigate to Ended Session
**Prerequisites:** Session status = "ended", localStorage has valid data

**Steps:**
1. Update session status to "ended"
2. Navigate to `/user/landing/KJAHA99L`

**Expected Result:** 
- ✅ Auto-navigate to `/session/ended/{sessionId}`

---

#### Test 5: Expired Data Cleared
**Steps:**
1. Manually edit localStorage `expiresAt` to past date
   ```json
   {"expiresAt": "2025-10-17T10:00:00Z", ...}
   ```
2. Navigate to `/user/landing/KJAHA99L`

**Expected Result:** 
- ✅ Form is empty
- ✅ localStorage entry removed
- ✅ Console log: "Data expired - clearing"

---

#### Test 6: Invalid Email Format
**Steps:**
1. Manually edit localStorage email to invalid format
   ```json
   {"email": "invalid-email", ...}
   ```
2. Navigate to `/user/landing/KJAHA99L`

**Expected Result:** 
- ✅ Form is empty
- ✅ localStorage entry removed
- ✅ Console log: "Invalid email format - clearing data"

---

#### Test 7: Token Isolation
**Steps:**
1. Save data for TOKEN1: `KJAHA99L`
2. Navigate to `/user/landing/TOKEN2` (different token)
3. Verify form is empty
4. Save data for TOKEN2
5. Navigate back to `/user/landing/KJAHA99L`
6. Verify TOKEN1 data is still present

**Expected Result:** 
- ✅ Each token has independent localStorage entry
- ✅ Data does not cross-contaminate between tokens

---

#### Test 8: Debug Panel Clear
**Prerequisites:** Development mode enabled, localStorage has data

**Steps:**
1. Navigate to `/user/landing/KJAHA99L` with saved data
2. Open Debug Panel (Ctrl+D or similar)
3. Click "Clear Local Storage" button
4. Check form fields and localStorage

**Expected Result:** 
- ✅ Form fields cleared
- ✅ localStorage entry removed
- ✅ Console log: "Local storage cleared for token: KJAHA99L"
- ✅ No toast shown (debug panel pattern)

---

#### Test 9: Edge Case - localStorage Disabled (Private Browsing)
**Steps:**
1. Open browser in private/incognito mode
2. Navigate to `/user/landing/KJAHA99L`
3. Complete registration

**Expected Result:** 
- ✅ Registration completes normally
- ✅ Save fails silently (logged but doesn't block)
- ✅ Next visit shows empty form (graceful degradation)

---

#### Test 10: Edge Case - Corrupted JSON
**Steps:**
1. Manually edit localStorage to invalid JSON
   ```
   localStorage.setItem('noor_user_registration_KJAHA99L', '{invalid json}');
   ```
2. Navigate to `/user/landing/KJAHA99L`

**Expected Result:** 
- ✅ Form is empty
- ✅ Corrupted data cleared
- ✅ Console log: "Invalid JSON data - clearing"

---

#### Test 11: Rolling Expiration (24h Extension)
**Steps:**
1. Day 1 (Oct 19): Register → expiresAt = Oct 21, 10:00 AM
2. Day 2 (Oct 20, 9:00 AM): Visit landing → expiresAt = Oct 22, 10:00 AM
3. Day 3 (Oct 21, 9:00 AM): Visit landing → expiresAt = Oct 23, 10:00 AM
4. Check localStorage after each visit

**Expected Result:** 
- ✅ Each visit extends expiration by 24 hours
- ✅ Data remains fresh with daily access
- ✅ Console logs show new expiration after each extension

---

**Test Completion Checklist:**
- [ ] All 11 test scenarios executed
- [ ] All expected results verified
- [ ] Edge cases handled gracefully
- [ ] Logging confirms expected behavior
- [ ] No errors in browser console
- [ ] Performance acceptable (no lag on load/save)

**Deliverables:**
- ✅ All test scenarios pass
- ✅ Edge cases handled gracefully
- ✅ No breaking changes to existing flows

**Debug Markers:** N/A (testing phase)

**Files Modified:** None (testing only)

---

## 📊 Dependencies and References

### Existing Code References
- `UserLanding.razor` (lines 1-1476) - Main implementation file
- `DebugPanel.razor` - Debug action infrastructure
- Existing localStorage pattern: `noor_user_guid_{token}` (line 1070)

### API Endpoints
- `GET /api/participant/session/{token}/validate` - Token validation
- `POST /api/participant/register` - Registration submission

### Technology Documentation
- [Blazor JavaScript Interop](https://learn.microsoft.com/en-us/aspnet/core/blazor/javascript-interoperability/)
- [Browser localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [System.Text.Json Serialization](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/)

### Best Practices Applied
- ✅ Try-catch for all localStorage operations
- ✅ Namespace keys to prevent conflicts (`noor_user_registration_`)
- ✅ JSON serialization for structured data
- ✅ Graceful degradation if localStorage unavailable
- ✅ Token-specific storage keys for isolation
- ✅ Structured logging with COPILOT-DEBUG markers
- ✅ Validation before using stored data

---

## 🎯 Implementation Summary

### Files Modified
- `SPA/NoorCanvas/Pages/UserLanding.razor` (all phases)

### New Code Sections
1. `RegistrationStorageData` class (data model)
2. `SaveRegistrationDataAsync()` method
3. `LoadRegistrationDataAsync()` method
4. `ExtendExpirationAsync()` method
5. `ValidateRegistrationDataAsync()` method
6. `ClearLocalStorageAsync()` method
7. Integration in `HandleUserRegistration()`
8. Integration in `LoadSessionInfoAsync()`
9. Debug action in `GetUserLandingDebugActions()`

### Estimated Effort
| Phase | Time Estimate |
|-------|---------------|
| Phase 1: Infrastructure | 30 minutes |
| Phase 2: Extension Logic | 15 minutes |
| Phase 3: Validation | 20 minutes |
| Phase 4: Save Integration | 15 minutes |
| Phase 5: Auto-Load & Nav | 25 minutes |
| Phase 6: Debug Panel | 15 minutes |
| Phase 7: Testing | 30 minutes |
| **Total** | **~2.5 hours** |

---

## 🚀 Ready for Implementation

### Prerequisites Checklist
- ✅ All requirements clarified
- ✅ Architecture designed
- ✅ Phases defined with clear deliverables
- ✅ Test plan documented
- ✅ Debug markers identified
- ✅ No breaking changes to existing functionality

### Next Steps
1. Review this plan for final approval
2. Execute phases sequentially
3. Test after each phase
4. Document any deviations from plan
5. Final integration testing (Phase 7)

---

**Plan Status:** ✅ Ready for Implementation  
**Approval Required:** Yes  
**Implementation Command:** Ready to generate on approval

---

## 📝 Appendix: Debug Markers for Cleanup

All debug markers follow pattern: `[DEBUG-WORKITEM:userlanding:*];CLEANUP_OK`

- `[DEBUG-WORKITEM:userlanding:localStorage:infrastructure];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:localStorage:extension];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:localStorage:validation];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:localStorage:save-on-register];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:localStorage:auto-load-nav];CLEANUP_OK`
- `[DEBUG-WORKITEM:userlanding:debug:clear-storage];CLEANUP_OK`

---

**End of Implementation Plan**
