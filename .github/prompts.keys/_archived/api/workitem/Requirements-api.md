# Requirements for API Migration (key: api)

## Objective
Migrate all direct database access to use APIs with proper DTOs, ensuring proper separation of concerns and architectural boundaries.

## Current State Analysis
Based on the KSESSIONS Direct Database Access Analysis, the application has:
- 19 direct database access points across 4 controllers + 1 Razor page
- 6 KSESSIONS tables being accessed directly: Groups, Categories, Sessions, SessionTranscripts, Countries, Speakers
- Critical architecture violation: UI layer (HostControlPanel.razor) directly accessing database

## Implementation Scope

### Phase 1: Fix Critical Architecture Violation (High Priority)
**Target**: HostControlPanel.razor direct database access
- **File**: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- **Current Issue**: Lines 935-940 use direct `KSessionsDb.Sessions` and `KSessionsDb.SessionTranscripts`
- **Solution**: Replace with HTTP API calls using existing session details endpoint

### Phase 2: Create Missing KSESSIONS APIs (Medium Priority)
**Target**: Controllers missing API endpoints for their internal operations
- **SessionTranscripts API**: `GET /api/ksessions/session/{sessionId}/transcript`
- **Session Details API**: `GET /api/ksessions/session/{sessionId}` (enhanced)
- **Country Flags API**: `GET /api/ksessions/countries/flags`
- **Admin Statistics API**: `GET /api/ksessions/admin/statistics`

### Phase 3: Refactor Internal Controller Access (Medium Priority) 
**Target**: Controllers that bypass their own APIs
- **HostController.cs**: Use internal service calls instead of direct DB
- **ParticipantController.cs**: Abstract KSESSIONS lookups to service layer
- **SessionController.cs**: Use centralized session validation
- **AdminController.cs**: Use statistics API

## DTOs Required

### KSESSIONS DTOs
```csharp
public class KSessionDto
{
    public int SessionId { get; set; }
    public string SessionName { get; set; }
    public string Description { get; set; }
    public int GroupId { get; set; }
    public int CategoryId { get; set; }
    public DateTime? SessionDate { get; set; }
    public bool IsActive { get; set; }
}

public class KSessionTranscriptDto
{
    public int TranscriptId { get; set; }
    public int SessionId { get; set; }
    public string Transcript { get; set; }
    public DateTime? CreatedDate { get; set; }
}

public class CountryFlagDto
{
    public string ISO2 { get; set; }
    public string CountryName { get; set; }
    public string FlagCode { get; set; }
    public bool IsActive { get; set; }
}
```

## Architecture Goals
1. **Separation of Concerns**: UI → API → Service → Database
2. **Consistent Data Access**: All KSESSIONS access through APIs
3. **Centralized Logic**: KSESSIONS operations in dedicated service
4. **Testability**: Mock API responses for testing
5. **Performance**: Enable caching at API layer

## Success Criteria
- [ ] Zero direct database access from UI layer
- [ ] All KSESSIONS operations use APIs or services  
- [ ] Proper DTO models for all data transfer
- [ ] No breaking changes to existing functionality
- [ ] All tests pass
- [ ] Build succeeds without warnings

## Files to Modify
1. `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Replace direct DB with APIs
2. `SPA/NoorCanvas/Controllers/HostController.cs` - Add missing APIs
3. `SPA/NoorCanvas/Controllers/ParticipantController.cs` - Refactor internal lookups
4. `SPA/NoorCanvas/Controllers/SessionController.cs` - Use service layer
5. `SPA/NoorCanvas/Controllers/AdminController.cs` - Use statistics API

## Implementation Strategy
- **Incremental**: One component at a time
- **Backward Compatible**: Maintain existing functionality
- **Testable**: Add validation tests for each migration
- **Documented**: Update architecture documentation as changes are made