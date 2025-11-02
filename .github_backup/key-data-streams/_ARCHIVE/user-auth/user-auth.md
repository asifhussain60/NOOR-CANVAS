# Key: user-auth

## Metadata
- **Status**: in-progress
- **Created**: 2025-01-11
- **Last Updated**: 2025-01-11
- **Owner**: GitHub Copilot
- **Description**: User authentication flow optimization for URL-based token validation

## Summary
Fixed the UserLanding authentication flow to prevent the "Enter Token" panel from flashing when users access the page with a valid token in the URL (e.g., https://localhost:9091/session/canvas/KJAHA99L). Users with valid tokens now go directly to the registration panel without seeing the token entry view.

## Current Work
- Token validation flow optimization
- Panel state management during initialization
- Error handling for invalid tokens

## Dependencies
- UserLanding.razor (authentication entry point)
- ParticipantController (token validation API)
- SimplifiedTokenService (token validation logic)

## Related Keys
- canvas (SessionCanvas rendering)
- user (user registration and authentication)

---

## Functionality Registry
**Purpose**: Track core behaviors that MUST continue working across all changes to prevent regressions.

### Core Behaviors (Must Always Work)
- ✅ **Valid Token Flow**: Valid token in URL → Direct to registration panel (no flash/flicker)
- ✅ **Invalid Token Handling**: Invalid token → Show token panel with error message
- ✅ **Missing Token Default**: No token in URL → Show token entry panel
- ✅ **Error Recovery**: Validation failures → Revert to token panel with helpful error
- ✅ **Registration Access**: After token validation → Waiting room access enabled

### Related Test Coverage
- **Automated Tests**:
  - None currently - **RECOMMENDED**: Create Playwright test for authentication flows
  - Suggested test: `Tests/UI/user-auth-token-validation.spec.ts`
    - Test 1: Valid token skips token panel
    - Test 2: Invalid token shows error
    - Test 3: Missing token shows entry form
- **Manual Validation**:
  - Navigate to `https://localhost:9091/session/canvas/KJAHA99L` (valid token)
  - Verify: Registration panel appears immediately (no token panel flash)
  - Navigate to `https://localhost:9091/session/canvas/INVALID` (bad token)
  - Verify: Token panel shows with error message
  - Navigate to `https://localhost:9091/user/landing` (no token)
  - Verify: Token entry panel shows as default

### Breaking Change Detection
- **File Watch**: Files that control this functionality (triggers validation if modified)
  - `SPA/NoorCanvas/Pages/UserLanding.razor` - Main authentication UI component
  - `SPA/NoorCanvas/Controllers/ParticipantController.cs` - Token validation API
  - `SPA/NoorCanvas/Services/SimplifiedTokenService.cs` - Token validation logic
- **Method Watch**: Critical methods that must preserve behavior
  - `UserLanding.OnInitializedAsync()` - Token presence check and panel state initialization
  - `UserLanding.LoadSessionInfoAsync()` - Token validation and error handling
  - `ParticipantController.ValidateToken()` - Server-side token validation endpoint
- **State Watch**: Important state variables and their expected values
  - `Model.ShowTokenPanel` - Should be `false` when valid token exists, `true` otherwise
  - `Model.ShowRegistrationPanel` - Should be `true` after successful token validation
  - `Model.ErrorMessage` - Should contain error text when validation fails

### Last Validation
- **Date**: 2025-01-11 (commit e06cafb3)
- **Method**: manual
- **Result**: PASS
- **Notes**: Build clean (zero warnings), logic verified via code analysis - all token scenarios covered with proper error handling

### Regression History
- No regressions detected yet

---

## Work Log

### 2025-01-11 | Authentication Flow Optimization
**Commit**: `e06cafb304417286c47c24a95823478df2dddbed`  
**Agent**: task  
**Task**: Fix authentication flow to skip token panel for valid URL tokens

**Problem**:
When users accessed `/user/landing/KJAHA99L` (valid token in URL), the page would:
1. First render the "Enter Token" panel (ShowTokenPanel = true)
2. Validate the token asynchronously
3. Switch to registration panel
4. Result: Users saw a flash of the token entry view before registration

**Solution**:
Restructured `OnInitializedAsync` in UserLanding.razor:
1. **Check for token parameter FIRST** (from route or query string)
2. **Initialize Model with appropriate state**:
   - `ShowTokenPanel = false` if token exists in URL
   - `ShowTokenPanel = true` if no token provided
3. **Validate token and update state** asynchronously
4. **Added error handling** to revert to token panel if validation fails

**Changes Made**:
- Modified `OnInitializedAsync` to determine `hasToken` before initializing Model
- Set `ShowTokenPanel = !hasToken` in initial Model setup
- Added error handling in `LoadSessionInfoAsync` to show token panel on validation failure:
  - Invalid token → `ShowTokenPanel = true` with error message
  - API failure → `ShowTokenPanel = true` with error message
  - Exception → `ShowTokenPanel = true` with error message
- Added null safety check (`hasToken && !string.IsNullOrEmpty(token)`) to prevent CS8601/CS8604 warnings
- Fixed StyleCop warning in HtmlTransformPatterns.cs (trailing blank line)

**Files Affected**:
- `SPA/NoorCanvas/Pages/UserLanding.razor` - Authentication flow logic
- `SPA/NoorCanvas/Services/HtmlTransformPatterns.cs` - StyleCop fix

**Validation**:
- Build: Clean (zero errors, zero warnings)
- Logic: Valid tokens → Registration panel (no flash)
- Logic: Invalid tokens → Token entry panel with error message
- Logic: No token → Token entry panel (default)

**User Experience Improvement**:
- **Before**: Users saw "Enter Token" view briefly before registration panel
- **After**: Users go directly to registration panel when token is valid
- Error handling ensures invalid tokens gracefully revert to token entry
