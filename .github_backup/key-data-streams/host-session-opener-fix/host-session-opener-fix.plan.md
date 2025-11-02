# Technical Plan: host-session-opener-fix

**Key:** `host-session-opener-fix`  
**Created:** 2025-10-27  
**Status:** Planning  
**Complexity:** High (Multi-layer: UI + API + Service + Database)

---

## Executive Summary

Host-SessionOpener.razor has two critical failures requiring full-stack investigation and fixes:

1. **Dropdown Cascade Loading Failure** - Albums → Categories → Sessions cascade not working
2. **Valid Token Rejection** - System reports valid, non-expired tokens as invalid

Both issues require tracing from Blazor UI through API controllers to database queries.

---

## Problem Analysis

### Issue 1: Dropdown Cascade Loading Failure

**Expected Behavior:**
```
User navigates to /host/session-opener
  → Albums dropdown auto-loads from KSESSIONS.dbo.Groups
  → User selects Album
    → Categories dropdown loads for that GroupId from KSESSIONS.dbo.Categories
    → User selects Category
      → Sessions dropdown loads for that CategoryId from KSESSIONS.dbo.Sessions
```

**Current Failure:**
- One or more steps in the cascade chain are failing
- Dropdowns not populating or not triggering dependent loading

**Code Flow to Trace:**
```
Host-SessionOpener.razor
  └─ OnInitializedAsync()
       └─ LoadAlbumsAsync()
            └─ HostService.LoadAlbumsAsync(token)
                 └─ HTTP GET /api/Host/albums?guid={token}
                      └─ HostController.GetAlbums(guid)
                           └─ _kSessionsContext.Groups
                                └─ SQL: SELECT * FROM KSESSIONS.dbo.Groups

Similar cascade for:
  - Categories: LoadCategoriesAsync(albumId)
  - Sessions: LoadSessionsAsync(categoryId)
```

**Potential Root Causes:**
1. **Database Connectivity** - Connection to KSESSIONS database failing
2. **Stored Procedures Missing** - Archived work mentioned `dbo.GetAllGroups` stored procedure
3. **API Endpoint Issues** - HTTP errors or CORS blocking API calls
4. **Blazor Binding Issues** - `@bind:after` events not firing cascade
5. **Token Parameter Issues** - GUID token not being passed correctly
6. **Entity Framework Issues** - Query generation or model mapping errors

### Issue 2: Valid Token Reported as Invalid

**Expected Behavior:**
```
User has HostToken (8-char alphanumeric) stored in canvas.Sessions.HostToken
Token has valid Status (not 'Expired')
Token has valid ExpiresAt (> DateTime.Now)
  → System validates token successfully
  → Returns session details from canvas.Sessions JOIN KSESSIONS.dbo.Sessions
```

**Current Failure:**
- Valid tokens being rejected by validation endpoint
- User cannot authenticate with existing, non-expired tokens

**Code Flow to Trace:**
```
Host-SessionOpener.razor (with /host/session-opener/{token})
  └─ AutoPopulateDropdownsFromToken()
       └─ HostService.ValidateHostTokenAsync(token)
            └─ HTTP GET /api/Host/token/{token}/validate
                 └─ HostController.ValidateHostToken(friendlyToken)
                      └─ _simplifiedTokenService.ValidateTokenAsync(friendlyToken, isHostToken: true)
                           └─ SQL: SELECT * FROM canvas.Sessions WHERE HostToken = @token
                                └─ Check Status != 'Expired'
                                └─ Check ExpiresAt > GETDATE()
                                └─ JOIN KSESSIONS.dbo.Sessions ON SessionId
```

**Potential Root Causes:**
1. **Token Format Validation** - Overly strict validation rejecting valid tokens
2. **Database Schema Mismatch** - HostToken column missing or wrong type
3. **Status Value Issues** - Status enum/string mismatch
4. **ExpiresAt Logic** - DateTime comparison issues or timezone problems
5. **Case Sensitivity** - Token comparison case-sensitive when should be case-insensitive
6. **Service Injection Issues** - `SimplifiedTokenService` not properly injected or configured

---

## Architecture Context

### Database Schema

**KSESSIONS Database (Read-only Islamic content):**
```
dbo.Groups (Albums)
  ├─ GroupId (PK)
  ├─ GroupName
  └─ IsActive

dbo.Categories
  ├─ CategoryId (PK)
  ├─ GroupId (FK → Groups.GroupId)
  ├─ CategoryName
  └─ IsActive

dbo.Sessions
  ├─ SessionId (PK)
  ├─ GroupId (FK → Groups.GroupId)
  ├─ CategoryId (FK → Categories.CategoryId)
  ├─ SessionName
  ├─ Description
  └─ IsActive
```

**canvas Schema (App runtime data):**
```
canvas.Sessions
  ├─ SessionId (PK, FK → dbo.Sessions.SessionId)
  ├─ AlbumId (Guid - formerly GroupId)
  ├─ HostToken (varchar(8), unique)
  ├─ UserToken (varchar(8), unique)
  ├─ Status (varchar - 'Active', 'Expired', etc.)
  ├─ ExpiresAt (datetime2)
  ├─ CreatedAt (datetime2)
  └─ (other columns)
```

### Service Architecture

**Frontend (Blazor):**
- `Host-SessionOpener.razor` - UI component with dropdown cascade logic

**Services:**
- `HostSessionService` - Frontend HTTP client for API calls
- `SimplifiedTokenService` - Token validation logic against canvas.Sessions

**API Controllers:**
- `HostController` - Endpoints for dropdowns and token validation
  - `GET /api/Host/albums?guid={token}`
  - `GET /api/Host/categories/{albumId}?guid={token}`
  - `GET /api/Host/sessions/{categoryId}?guid={token}`
  - `GET /api/Host/token/{token}/validate`

**Database Contexts:**
- `KSessionsDbContext` - Read-only access to KSESSIONS (Groups, Categories, Sessions)
- `SimplifiedCanvasDbContext` - Read/Write access to canvas schema (Sessions, Participants, etc.)

---

## Investigation & Fix Strategy

### Phase 1: Diagnostic Logging & Data Collection

**Objectives:**
- Add comprehensive logging at every layer
- Identify exact failure point in cascade and token validation
- Collect actual database state vs expected state

**Tasks:**

1.1. **Add Diagnostic Logging to Dropdown Cascade**
   - File: `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`
   - Add debug logs in:
     - `LoadAlbumsAsync()` - Log count returned, errors
     - `LoadCategoriesAsync(albumId)` - Log albumId parameter, count returned
     - `LoadSessionsAsync(categoryId)` - Log categoryId parameter, count returned
     - `@bind:after` event handlers - Log when cascade triggers
   
1.2. **Add Diagnostic Logging to HostSessionService**
   - File: `SPA/NoorCanvas/Services/HostSessionService.cs`
   - Add debug logs in:
     - `LoadAlbumsAsync()` - Log HTTP request URL, response status, JSON length
     - `LoadCategoriesAsync()` - Log HTTP request URL, response status
     - `LoadSessionsAsync()` - Log HTTP request URL, response status

1.3. **Add Diagnostic Logging to HostController**
   - File: `SPA/NoorCanvas/Controllers/HostController.cs`
   - Add debug logs in:
     - `GetAlbums()` - Log database name, query, result count
     - `GetCategories()` - Log GroupId parameter, query, result count
     - `GetSessions()` - Log CategoryId parameter, query, result count
     - `ValidateHostToken()` - Log token format, database lookup, validation steps

1.4. **Add Diagnostic Logging to SimplifiedTokenService**
   - File: `SPA/NoorCanvas/Services/SimplifiedTokenService.cs`
   - Add debug logs in:
     - `ValidateTokenAsync()` - Log token, query parameters, result, validation logic

1.5. **Database Connectivity Test**
   - Verify KSessionsDbContext can connect to KSESSIONS database
   - Verify SimplifiedCanvasDbContext can connect to canvas schema
   - Test basic queries: `SELECT COUNT(*) FROM dbo.Groups`, etc.

**Acceptance Criteria:**
- Complete trace from UI → Service → API → Database logged
- Exact failure point identified
- Database connectivity confirmed

---

### Phase 2: Fix Dropdown Cascade Loading

**Objectives:**
- Restore Albums → Categories → Sessions cascade functionality
- Ensure proper data loading from KSESSIONS database

**Tasks:**

2.1. **Fix Albums Loading**
   - **Investigation:**
     - Check if `dbo.Groups` table has data (`SELECT COUNT(*) FROM KSESSIONS.dbo.Groups WHERE IsActive = 1`)
     - Verify EF query generation for Groups
     - Check HTTP response in browser DevTools
   - **Potential Fixes:**
     - Fix EF model mapping if incorrect
     - Fix API endpoint if 404/500 error
     - Fix CORS if cross-origin issue
     - Fix database connection string if connection failure

2.2. **Fix Categories Loading**
   - **Investigation:**
     - Verify `LoadCategoriesAsync(albumId)` receives correct albumId from dropdown selection
     - Check if `dbo.Categories` query filters by GroupId correctly
     - Verify `@bind:after="OnAlbumChanged"` triggers
   - **Potential Fixes:**
     - Fix albumId parameter binding in Blazor
     - Fix GroupId foreign key query in HostController
     - Fix `@bind:after` event handler if not firing

2.3. **Fix Sessions Loading**
   - **Investigation:**
     - Verify `LoadSessionsAsync(categoryId)` receives correct categoryId
     - Check if `dbo.Sessions` query filters by CategoryId correctly
     - Verify `@bind:after="OnCategoryChanged"` triggers
   - **Potential Fixes:**
     - Fix categoryId parameter binding
     - Fix CategoryId foreign key query
     - Fix session model mapping

2.4. **End-to-End Cascade Test**
   - Manual test: Navigate to `/host/session-opener`
   - Verify Albums dropdown populates
   - Select an album → Verify Categories dropdown populates
   - Select a category → Verify Sessions dropdown populates
   - Log complete trace showing all three levels loading successfully

**Acceptance Criteria:**
- Albums dropdown loads on page init
- Selecting album triggers categories load
- Selecting category triggers sessions load
- All three dropdowns cascade correctly

---

### Phase 3: Fix Token Validation

**Objectives:**
- Fix valid token rejection issue
- Ensure tokens with valid Status and ExpiresAt are accepted

**Tasks:**

3.1. **Database State Verification**
   - Query to find test token in database:
     ```sql
     SELECT TOP 1 
       SessionId, 
       HostToken, 
       UserToken, 
       Status, 
       ExpiresAt, 
       CreatedAt,
       CASE WHEN ExpiresAt > GETDATE() THEN 'Valid' ELSE 'Expired' END AS TokenStatus
     FROM canvas.Sessions
     WHERE HostToken IS NOT NULL
     ORDER BY CreatedAt DESC
     ```
   - Identify a known-good token for testing
   - Verify Status and ExpiresAt values are correct

3.2. **Fix Token Format Validation**
   - File: `SPA/NoorCanvas/Controllers/HostController.cs` → `ValidateHostToken()`
   - **Investigation:**
     - Check if token format validation is too strict (line ~165)
     - Verify 8-character alphanumeric check logic
   - **Potential Fixes:**
     - Remove whitespace trimming if causing issues
     - Fix regex pattern if incorrect
     - Log exact validation failure reason

3.3. **Fix Token Lookup Query**
   - File: `SPA/NoorCanvas/Services/SimplifiedTokenService.cs` → `ValidateTokenAsync()`
   - **Investigation:**
     - Check if query uses correct column (HostToken vs UserToken)
     - Verify case sensitivity (should be case-insensitive for alphanumeric tokens)
     - Check if Status comparison is correct ('Active' vs enum)
   - **Potential Fixes:**
     - Use case-insensitive comparison: `WHERE LOWER(HostToken) = LOWER(@token)`
     - Fix Status check logic
     - Fix ExpiresAt comparison (timezone-aware)

3.4. **Fix Session Details Join**
   - **Investigation:**
     - After token validation, verify JOIN to KSESSIONS.dbo.Sessions
     - Check if SessionId FK reference is correct
     - Verify session details (Title, Description) are returned
   - **Potential Fixes:**
     - Fix JOIN query if incorrect
     - Fix session details mapping

3.5. **Token Validation End-to-End Test**
   - Test with known-good token from database
   - Navigate to `/host/session-opener/{valid-token}`
   - Verify token validation succeeds
   - Verify dropdowns auto-populate with session's album/category/session
   - Log complete validation trace

**Acceptance Criteria:**
- Valid tokens (Status != 'Expired', ExpiresAt > Now) are accepted
- Token validation returns session details
- Auto-population of dropdowns works when token is valid

---

### Phase 4: Auto-Population from Token

**Objectives:**
- Fix auto-population of dropdowns when user navigates with token
- Ensure session details correctly populate Album → Category → Session

**Tasks:**

4.1. **Fix AutoPopulateDropdownsFromToken()**
   - File: `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`
   - **Investigation:**
     - Verify `AutoPopulateDropdownsFromToken()` is called on init with token
     - Check if `GetSessionDetailsAsync(sessionId, token)` returns correct GroupId, CategoryId, SessionId
     - Verify `AutoPopulateSequence()` sets dropdown values correctly
   - **Potential Fixes:**
     - Fix session details query if incorrect
     - Fix dropdown value binding (`SelectedAlbum`, `SelectedCategory`, `SelectedSession`)
     - Fix cascade triggering after programmatic selection

4.2. **Test Auto-Population**
   - Navigate to `/host/session-opener/{valid-token}`
   - Verify dropdowns auto-populate:
     - Album = session's GroupId
     - Category = session's CategoryId
     - Session = session's SessionId
   - Verify form validation passes with auto-populated values

**Acceptance Criteria:**
- Navigating with token auto-populates all three dropdowns
- Form validation recognizes auto-populated values
- User can modify selections if needed

---

### Phase 5: End-to-End Testing

**Objectives:**
- Create comprehensive Playwright tests
- Validate both manual and token-based workflows

**Tasks:**

5.1. **Create Playwright Test: Manual Cascade**
   - File: `PlayWright/Tests/host-session-opener-cascade.spec.ts`
   - **Test Scenario:**
     ```typescript
     test('Manual dropdown cascade loading', async ({ page }) => {
       // 1. Navigate to session opener
       await page.goto('/host/session-opener');
       
       // 2. Verify albums dropdown populates
       await expect(page.locator('#album-select option')).toHaveCount(greaterThan(1));
       
       // 3. Select first album
       await page.selectOption('#album-select', { index: 1 });
       
       // 4. Verify categories dropdown populates
       await expect(page.locator('#category-select option')).toHaveCount(greaterThan(1));
       
       // 5. Select first category
       await page.selectOption('#category-select', { index: 1 });
       
       // 6. Verify sessions dropdown populates
       await expect(page.locator('#session-select option')).toHaveCount(greaterThan(1));
     });
     ```

5.2. **Create Playwright Test: Token Validation**
   - File: `PlayWright/Tests/host-session-opener-token-validation.spec.ts`
   - **Test Scenario:**
     ```typescript
     test('Token validation and auto-population', async ({ page }) => {
       // 1. Get valid token from database (or use known test token)
       const validToken = 'ABCD1234'; // Replace with actual test token
       
       // 2. Navigate with token
       await page.goto(`/host/session-opener/${validToken}`);
       
       // 3. Verify dropdowns auto-populate
       await expect(page.locator('#album-select')).toHaveValue(/\d+/);
       await expect(page.locator('#category-select')).toHaveValue(/\d+/);
       await expect(page.locator('#session-select')).toHaveValue(/\d+/);
       
       // 4. Verify form is valid
       await expect(page.locator('#openSessionBtn')).not.toBeDisabled();
     });
     ```

5.3. **Create Playwright Test: Invalid Token**
   - **Test Scenario:**
     ```typescript
     test('Invalid token handling', async ({ page }) => {
       // 1. Navigate with invalid token
       await page.goto('/host/session-opener/INVALID');
       
       // 2. Verify form loads empty (no auto-population)
       await expect(page.locator('#album-select')).toHaveValue('');
       
       // 3. Verify user can manually select
       // (Cascade still works, just no auto-population)
     });
     ```

5.4. **Create Playwright Test: Token Generation**
   - File: `PlayWright/Tests/host-session-opener-token-generation.spec.ts`
   - **Test Scenario:**
     ```typescript
     test('Session creation and token generation', async ({ page }) => {
       // 1. Navigate to session opener
       await page.goto('/host/session-opener');
       
       // 2. Fill form via cascade
       await page.selectOption('#album-select', { index: 1 });
       await page.waitForTimeout(500);
       await page.selectOption('#category-select', { index: 1 });
       await page.waitForTimeout(500);
       await page.selectOption('#session-select', { index: 1 });
       
       // 3. Fill other fields (date, time, duration)
       await page.fill('#session-date', '2025-12-01');
       await page.selectOption('#session-time', { index: 1 });
       await page.fill('#session-duration', '60');
       
       // 4. Submit form
       await page.click('#openSessionBtn');
       
       // 5. Verify token generation
       await expect(page.locator('.host-opener-url-panel')).toBeVisible();
       await expect(page.locator('#session-url')).toHaveValue(/\/host\/control-panel\/[A-Z0-9]{8}/);
       await expect(page.locator('#user-landing-url')).toHaveValue(/\/user\/landing\/[A-Z0-9]{8}/);
     });
     ```

**Acceptance Criteria:**
- All Playwright tests pass
- Manual cascade workflow works
- Token validation workflow works
- Token generation workflow works

---

### Phase 6: Cleanup & Documentation

**Objectives:**
- Remove diagnostic logging markers
- Update work log with findings and fixes
- Document any database schema or configuration changes

**Tasks:**

6.1. **Remove Debug Markers**
   - Search for all `[DEBUG-WORKITEM:host-session-opener-fix:*]` markers
   - Remove or convert to standard logging
   - Ensure production log levels are appropriate

6.2. **Update Work Log**
   - Document root cause of dropdown cascade failure
   - Document root cause of token validation failure
   - Document all files modified
   - Document testing results

6.3. **Update Architecture Documentation**
   - If any database changes were made, update schema docs
   - If any API changes were made, update API docs

**Acceptance Criteria:**
- All debug markers removed
- Work log complete with findings
- Documentation updated

---

## Rollback Strategy

### Checkpoint Commits

Each phase will create a git commit for rollback:

1. **After Phase 1 (Diagnostics):** `feat(host-session-opener-fix): Add diagnostic logging`
2. **After Phase 2 (Dropdown Fix):** `fix(host-session-opener-fix): Fix dropdown cascade loading`
3. **After Phase 3 (Token Fix):** `fix(host-session-opener-fix): Fix token validation`
4. **After Phase 4 (Auto-Population):** `fix(host-session-opener-fix): Fix auto-population from token`
5. **After Phase 5 (Tests):** `test(host-session-opener-fix): Add E2E Playwright tests`
6. **After Phase 6 (Cleanup):** `chore(host-session-opener-fix): Remove debug markers and update docs`

### Rollback Procedure

If issues are introduced, rollback to previous checkpoint:
```powershell
git log --oneline | Select-String "host-session-opener-fix"
git reset --hard <commit-sha>
```

---

## Files to Modify

### Investigation Phase
- `SPA/NoorCanvas/Pages/Host-SessionOpener.razor` (add diagnostics)
- `SPA/NoorCanvas/Services/HostSessionService.cs` (add diagnostics)
- `SPA/NoorCanvas/Controllers/HostController.cs` (add diagnostics)
- `SPA/NoorCanvas/Services/SimplifiedTokenService.cs` (add diagnostics)

### Fix Phase
- Same files as above (apply fixes based on findings)
- Potentially: `SPA/NoorCanvas/appsettings.json` or `appsettings.Production.json` (logging config)
- Potentially: Database migration if schema issue found

### Testing Phase
- `PlayWright/Tests/host-session-opener-cascade.spec.ts` (new)
- `PlayWright/Tests/host-session-opener-token-validation.spec.ts` (new)
- `PlayWright/Tests/host-session-opener-token-generation.spec.ts` (new)

---

## Success Criteria

### Functional Requirements
- ✅ Albums dropdown loads on page initialization
- ✅ Selecting album triggers categories dropdown load
- ✅ Selecting category triggers sessions dropdown load
- ✅ Valid tokens (non-expired, Status = 'Active') are accepted by validation endpoint
- ✅ Token validation returns session details (Title, Description)
- ✅ Navigating with valid token auto-populates dropdowns
- ✅ Session creation generates valid HostToken and UserToken

### Technical Requirements
- ✅ Complete trace logging from UI → Service → API → Database
- ✅ Database connectivity verified (KSESSIONS and canvas)
- ✅ All Playwright tests pass
- ✅ No console errors in browser DevTools
- ✅ API endpoints return 200 OK with correct data

### Non-Functional Requirements
- ✅ Page load time < 3 seconds
- ✅ Dropdown cascade < 1 second per level
- ✅ No breaking changes to existing functionality
- ✅ Code follows existing patterns and conventions

---

## Related Work

- **Archived Key:** `session-opener` - Previous fix for similar issues (may have regressed)
- **Related Components:**
  - `HostLanding.razor` - Uses token validation endpoint
  - `HostControlPanel.razor` - Consumes generated HostToken
  - `UserLanding.razor` - Consumes generated UserToken

---

## Risk Assessment

### High Risk
- Database schema mismatch (KSESSIONS vs canvas)
- Breaking changes to token validation affecting other components

### Medium Risk
- Stored procedure dependencies (from archived work)
- CORS configuration changes required
- Entity Framework query generation issues

### Low Risk
- Logging configuration changes
- Blazor binding fixes
- UI-only changes

---

## Timeline Estimate

- **Phase 1 (Diagnostics):** 2-3 hours
- **Phase 2 (Dropdown Fix):** 3-4 hours
- **Phase 3 (Token Fix):** 2-3 hours
- **Phase 4 (Auto-Population):** 1-2 hours
- **Phase 5 (E2E Tests):** 3-4 hours
- **Phase 6 (Cleanup):** 1 hour

**Total:** 12-17 hours

---

## Next Steps

1. **Review and Approve Plan** - User confirms plan is comprehensive
2. **Handoff to Task Agent** - Execute Phase 1 (Diagnostics)
3. **Iterate Through Phases** - Fix issues as root causes are identified
4. **Validate with Tests** - Run Playwright tests
5. **Deploy and Monitor** - Push to production and monitor logs
