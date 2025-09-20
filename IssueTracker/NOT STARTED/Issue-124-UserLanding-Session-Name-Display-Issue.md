# Issue-124: UserLanding.razor Session Name Display Issue - Shows "Unknown Session" Instead of Actual Title

**Priority**: HIGH - Core Functionality - Data Display Issue  
**Status**: NOT STARTED  
**Report Date**: September 20, 2025  
**Assigned**: GitHub Copilot  

---

## Problem Description

UserLanding.razor is not displaying the correct session name from API responses. Despite the `/api/participant/session/{token}/validate` API returning the correct session title (e.g., "Need For Messengers"), the Blazor component displays "Unknown Session" to users instead of the actual session name.

---

## Root Cause Analysis

### Evidence from Application Logs

**✅ API Layer Working Correctly:**
```
[07:41:19 INF] NoorCanvas.Controllers.ParticipantController Session found: 1, Title: Need For Messengers
```

**✅ API Response Structure:**
```json
{
  "valid": true,
  "sessionId": 1,
  "token": "5TSJAUC8",
  "session": {
    "sessionId": 1,
    "title": "Need For Messengers",
    "description": "Album: 14, Category: 52", 
    "status": "Configured"
  }
}
```

**❌ UserLanding.razor Parsing Issue:**
```
[07:41:20 INF] NoorCanvas.Pages.UserLanding Session validation successful - SessionID: 1, Title: null
[07:41:20 INF] NoorCanvas.Pages.UserLanding Updated Model.SessionName to: Unknown Session
```

### Root Cause Identified

The `SessionValidationResponse` class structure doesn't match the actual API response format:

**Expected by C# Model:**
```csharp
public class SessionValidationResponse
{
    public string? Title { get; set; }      // Expects at root level
    public string? Status { get; set; }     // Expects at root level  
}
```

**Actual API Response:**
- `session.title` (nested inside session object)
- `session.status` (nested inside session object)

---

## Implementation Strategy

### 1. Update SessionValidationResponse Class Structure

**Current Structure (Incorrect):**
```csharp
public class SessionValidationResponse
{
    public long SessionId { get; set; }
    public string? Title { get; set; }      // ❌ Wrong - expects root level
    public string? Status { get; set; }     // ❌ Wrong - expects root level
    public string? Token { get; set; }
    public bool Valid { get; set; }
    public string? Message { get; set; }
}
```

**Required Structure (Correct):**
```csharp
public class SessionValidationResponse
{
    public long SessionId { get; set; }
    public string? Token { get; set; }
    public bool Valid { get; set; }
    public string? Message { get; set; }
    public SessionInfo? Session { get; set; }    // ✅ Add nested session object
}

public class SessionInfo
{
    public long SessionId { get; set; }
    public string? Title { get; set; }           // ✅ Nested title
    public string? Status { get; set; }          // ✅ Nested status
    public string? Description { get; set; }
}
```

### 2. Update UserLanding.razor Parsing Logic

**Current Logic (Incorrect):**
```csharp
Model.SessionName = validationResult.Title ?? "Unknown Session";
Model.SessionDescription = $"Status: {validationResult.Status ?? "Unknown"}";
```

**Required Logic (Correct):**
```csharp
Model.SessionName = validationResult.Session?.Title ?? "Unknown Session";
Model.SessionDescription = $"Status: {validationResult.Session?.Status ?? "Unknown"}";
```

### 3. Error Handling Improvements

- Add proper null checking for nested session object
- Provide meaningful error messages for invalid API responses
- Log diagnostic information for debugging

---

## Acceptance Criteria

- [ ] **Session Name Display**: Shows actual session title from API (e.g., "Need For Messengers")
- [ ] **Session Description**: Shows proper status information from API
- [ ] **Null Handling**: Gracefully handles missing or null session data
- [ ] **Error Cases**: Displays appropriate error messages for invalid tokens
- [ ] **No Hardcoded Fallbacks**: Eliminates "Unknown Session" when valid data exists
- [ ] **Logging**: Maintains diagnostic logging for debugging

---

## Test Scenarios

### Positive Tests
1. **Valid Token**: Returns and displays correct session name and status
2. **Complete Response**: All session fields populated correctly
3. **UI Update**: Session information updates in real-time after token validation

### Negative Tests  
1. **Invalid Token**: Shows appropriate error message (not "Unknown Session")
2. **Missing Session Data**: Handles null session object gracefully
3. **API Failure**: Proper error handling for network/server issues

### Boundary Tests
1. **Empty Session Title**: Handles empty/null session title appropriately
2. **Long Session Names**: UI handles lengthy session titles without breaking
3. **Special Characters**: Supports Arabic text and special characters in session names

---

## Files to Modify

1. **`SPA/NoorCanvas/Pages/UserLanding.razor`** (Lines 565-576)
   - Update SessionValidationResponse class structure
   - Add SessionInfo nested class
   - Update parsing logic to use nested session properties

2. **`Tests/UI/issue-124-session-name-display.spec.ts`** (New File)
   - Create comprehensive Playwright test
   - Validate session name display functionality
   - Test both positive and negative scenarios

---

## Implementation Notes

- **Consistency Check**: Verify other components using SessionValidationResponse are updated accordingly
- **API Verification**: Confirm API response structure hasn't changed
- **Debugging**: Keep diagnostic logs during implementation for troubleshooting
- **Testing**: Test with real tokens like "5TSJAUC8" that return valid session data

---

## Related Issues

- **Issue-121**: Session Transcript Empty - Similar API response parsing issue
- **Issue-114**: Countries Dropdown Loading - Related to UserLanding.razor flow

---

## Completion Checklist

- [ ] SessionValidationResponse class updated with nested structure
- [ ] UserLanding.razor parsing logic updated  
- [ ] Error handling improved
- [ ] Playwright test created and passing
- [ ] Manual testing completed with valid tokens
- [ ] Documentation updated
- [ ] Code review completed