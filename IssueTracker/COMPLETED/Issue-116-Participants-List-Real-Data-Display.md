# Issue-116: Participants List Not Showing User Sign-in Information in Waiting Room

**Created**: September 18, 2025  
**Status**: NOT STARTED  
**Priority**: Medium  
**Component**: SessionWaiting.razor Participants Display  
**Reporter**: User Feedback  

## Problem Description

The participants list in the SessionWaiting.razor (waiting room) component is not displaying the actual user information that was provided during sign-in. According to user feedback, terminal data shows participant information that should be displayed in the participants list, but it's not appearing correctly.

### Current Issue
- Participants list shows mock/demo data instead of real user information
- User sign-in data from terminal is not being displayed
- API response data might not be properly parsed or displayed

### Expected vs Actual
- **Expected**: Show actual participant data from sign-in process
- **Actual**: Shows only mock participants or empty list

## Expected Behavior

The participants list should display:

1. **Real User Data**: Names, countries, and flags from actual sign-in information
2. **Live Updates**: Participants added in real-time as they join
3. **Accurate Count**: Correct participant count matching actual data
4. **Proper Formatting**: Name and country display with appropriate flag icons

## Root Cause Analysis Required

Need to investigate:

1. **API Integration**: Verify `/api/participant/session/{token}/participants` endpoint
2. **Data Mapping**: Check ParticipantApiData → ParticipantData conversion
3. **State Management**: Ensure participant data updates trigger UI refresh
4. **Error Handling**: Check for API failures falling back to mock data

## Technical Investigation Points

### API Response Structure
Expected format from `/api/participant/session/{token}/participants`:
```json
{
    "sessionId": 220,
    "token": "TXZ25W6K",
    "participantCount": 1,
    "participants": [
        {
            "userId": "user123",
            "displayName": "John Doe",
            "joinedAt": "2025-09-18T17:00:00Z",
            "role": "participant",
            "city": "Toronto",
            "country": "Canada"
        }
    ],
    "requestId": "abc123"
}
```

### Data Flow Analysis
1. **Sign-in Process**: User enters name/country in registration form
2. **API Storage**: Data stored via registration API
3. **Participants API**: Should return stored participant data
4. **UI Display**: Convert API data to display format with flags

## Acceptance Criteria

✅ **AC1**: Participants list shows real user sign-in data  
✅ **AC2**: User information includes name, country, and correct flag  
✅ **AC3**: Participant count matches actual number of signed-in users  
✅ **AC4**: Real-time updates when new participants join  
✅ **AC5**: Proper error handling when API fails  
✅ **AC6**: Fallback behavior clearly indicates demo vs real data  

## Files to Investigate

### Primary Files
- `SPA/NoorCanvas/Pages/SessionWaiting.razor` - Participants display logic
- `SPA/NoorCanvas/Controllers/ParticipantController.cs` - API endpoint implementation  

### Supporting Files  
- `SPA/NoorCanvas/Pages/UserLanding.razor` - Registration data submission
- API response logs in application logs
- Terminal output showing expected participant data

## Investigation Steps

### Step 1: API Endpoint Testing
```powershell
# Test participants API directly
$response = Invoke-WebRequest -Uri "https://localhost:9091/api/participant/session/TXZ25W6K/participants"
Write-Host $response.Content
```

### Step 2: Log Analysis
- Check application logs for participant API calls
- Verify API response data structure
- Look for error messages or fallback triggers

### Step 3: Code Review
- Review `LoadParticipantsAsync()` method in SessionWaiting.razor
- Check data mapping from `ParticipantApiData` to `ParticipantData`
- Verify `SeedDemoParticipants()` fallback conditions

## Debugging Information

### Current Code Locations
- **LoadParticipantsAsync()**: Lines 381-440 in SessionWaiting.razor
- **Participants Display**: Lines 162-177 in SessionWaiting.razor  
- **Demo Data Fallback**: Lines 492+ in SessionWaiting.razor

### Key Logging Points
- `NOOR-DEBUG: [RequestId] Participants API response: {Content}` 
- `NOOR-DEBUG: [RequestId] Loaded {Count} participants from API`
- `NOOR-DEBUG: [RequestId] Failed to load participants: {StatusCode}`

## Testing Requirements

### Playwright Test Plan
Create `issue-116-participants-list-real-data.spec.ts` with:

1. **Registration Flow**: Complete user sign-in with real data
2. **API Verification**: Verify participant data stored correctly  
3. **Waiting Room Check**: Confirm participant appears in list
4. **Data Accuracy**: Validate name, country, flag display
5. **Multi-user Test**: Test multiple participants joining
6. **Error Scenarios**: Test API failures and fallback behavior

### Manual Testing Workflow
1. Complete user registration with specific name/country
2. Navigate to waiting room
3. Verify participant appears with correct information
4. Test with multiple users in different browsers
5. Verify real-time updates

## Risk Assessment

**Risk Level**: Medium  
**Impact**: Core functionality - participants visibility  
**Complexity**: Requires API and UI coordination  

### Data Sources to Check
- Registration form submission data
- Participants API response data  
- Database participant storage
- Terminal output mentioned by user

## Definition of Done

- [ ] Root cause identified and documented
- [ ] Real participant data displays correctly in waiting room
- [ ] API integration working properly
- [ ] Fallback behavior clearly distinguished from real data
- [ ] Comprehensive testing completed
- [ ] Terminal data issue resolved

---

**Related Issues**: Issue-114 (Countries dropdown), Issue-113 (SessionWaiting blank page)  
**Dependencies**: Functioning registration flow, participants API  
**Estimated Effort**: 4-6 hours including investigation  