# Issue 15: New Session API Integration Gap

**Status:** Not Started  
**Priority:** Medium  
**Category:** Enhancement  
**Created:** September 11, 2025  
**Component:** Host Dashboard Session Creation  

## Problem Description
The "New Session" button in the Host Dashboard currently uses mock implementation instead of calling the actual backend API endpoint. While the API endpoint exists and is functional (`POST /api/host/session/create`), the frontend is not integrated with it.

## Current State
- ✅ **Backend API**: `POST /api/host/session/create` endpoint is fully implemented in `HostController.cs`
- ✅ **Database Models**: Session, SessionLink models are complete
- ✅ **Frontend UI**: Modal form and button handlers are working
- ❌ **Integration**: Frontend uses `Task.Delay(1000)` mock instead of HTTP call

## Root Cause Analysis
The Host Dashboard `CreateSession()` method contains:
```csharp
// TODO: Call actual API to create session
await Task.Delay(1000); // Simulate API call

// Mock successful creation
var newSessionSummary = new SessionSummary { ... };
```

But should be calling:
```csharp
var response = await Http.PostAsJsonAsync("/api/host/session/create", newSession);
```

## Impact Assessment
- **Functional**: New sessions are not persisted to database
- **User Experience**: Users see sessions in UI that don't actually exist
- **Testing**: Cannot perform end-to-end session creation testing
- **Data Integrity**: No real session links are generated for participants

## Technical Requirements
1. **Replace Mock Implementation**: Remove `Task.Delay` and mock object creation
2. **Add HTTP Client Call**: Integrate with existing `POST /api/host/session/create` endpoint
3. **Handle API Response**: Process `SessionResponse` object from backend
4. **Error Handling**: Implement proper error handling for network failures
5. **UI Updates**: Update dashboard with real session data from API response

## Implementation Steps
1. Remove mock `SessionSummary` creation in `HostDashboard.razor`
2. Add HTTP POST call to `/api/host/session/create` endpoint
3. Parse `SessionResponse` and update dashboard state
4. Add error handling for API failures
5. Test end-to-end session creation flow

## Acceptance Criteria
- [ ] New Session button creates real database entries
- [ ] Generated session links work for participant registration
- [ ] Error handling shows user-friendly messages for API failures
- [ ] Created sessions appear correctly in dashboard with real data
- [ ] Session expiry (3h default) is properly configured

## Dependencies
- **Backend API**: Already implemented and ready ✅
- **Models**: `CreateSessionRequest` and `SessionResponse` exist ✅
- **Frontend Infrastructure**: HttpClient injection is already configured ✅

## Priority Justification
**Medium Priority** - This is core functionality but system is operational with mock data. Should be addressed in current development phase to enable proper testing and user workflows.

## Related Use Cases (Design Document)
- **UC-H1 Create Session**: "Host creates session → system generates SessionId + Host GUID + public GUID link"
- Frontend should match the documented API contract for session creation workflow

## Testing Notes
Once implemented, verify:
1. Session creation persists to `canvas.Sessions` table
2. SessionLink generation creates working participant URLs
3. Host dashboard displays accurate session metadata
4. Error scenarios (network issues, validation failures) are handled gracefully
