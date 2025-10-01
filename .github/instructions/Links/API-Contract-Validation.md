# API Contract Validation Guidelines

## Overview
This document provides preventive measures to avoid API/frontend model mismatches during refactoring operations. These guidelines were developed after resolving critical issues where refactoring inadvertently broke the contract between API controllers and frontend service classes.

## Critical Prevention Checks

### Pre-Refactoring Model Inventory
Before beginning any refactoring that touches API endpoints or service classes:

1. **Catalog API Response Models**
   - List all affected API controller endpoints
   - Document the exact response model type for each endpoint
   - Note the complete namespace path (e.g., `NoorCanvas.Controllers.CreateSessionResponse`)

2. **Service Class Verification** 
   - Identify all service classes that consume these APIs
   - Verify the deserialization target matches controller response type exactly
   - Check for naming mismatches (e.g., `CreateSessionResponse` vs `SessionCreationResponse`)

### Model Consistency Validation

#### Response Type Alignment
**Problem Prevention:** Refactoring can introduce subtle model mismatches where the API returns `ModelA` but the service expects `ModelB`.

**Validation Steps:**
- Cross-reference controller return types with service deserialization types
- Use fully qualified type names to prevent namespace conflicts
- Implement compile-time checks where possible

**Example Issue:** 
```csharp
// Controller returns this
public async Task<ActionResult<CreateSessionResponse>> CreateSession(...)

// But service expects this (WRONG)
var response = await httpResponse.Content.ReadFromJsonAsync<SessionCreationResponse>();
```

**Correct Implementation:**
```csharp
// Use exact match with full qualification
var response = await httpResponse.Content.ReadFromJsonAsync<NoorCanvas.Controllers.CreateSessionResponse>();
```

#### Field Name Mapping
**Problem Prevention:** API field names may not match frontend expectations, especially after refactoring.

**Validation Areas:**
- Property name changes in API models
- Field mapping in service transformation logic
- Frontend binding expectations

**Example Issues:**
- API returns `HostFriendlyToken` but frontend expects `HostGuid`
- API returns `SelectedAlbumId` but frontend expects `AlbumId`

#### Response Transformation Logic
**Problem Prevention:** When API and frontend models differ, ensure proper transformation.

**Implementation Guidelines:**
- Never assume implicit conversion between similar models
- Implement explicit mapping logic when models don't match exactly
- Log transformation steps for debugging
- Handle null responses gracefully

**Example:**
```csharp
// Proper transformation when models differ
var apiResponse = await httpResponse.Content.ReadFromJsonAsync<Controllers.CreateSessionResponse>();
if (apiResponse != null)
{
    return new SessionCreationResponse
    {
        SessionId = apiResponse.SessionId,
        Status = apiResponse.Status,
        UserToken = ExtractTokenFromJoinLink(apiResponse.JoinLink),
        // Explicit field mapping prevents silent failures
    };
}
```

### Testing Strategy

#### Deserialization Validation
- Test that API responses deserialize successfully (not null)
- Verify all expected fields are populated
- Check type compatibility and field mapping

#### End-to-End Contract Testing
1. Make actual API call
2. Verify successful deserialization
3. Confirm frontend receives expected data structure
4. Test complete user workflow

### Git History Analysis

When model mismatches are discovered:
1. Check git history for recent model changes
2. Identify commits that modified API response structures
3. Trace when frontend/backend contracts diverged
4. Document lessons learned for future prevention

### Common Mismatch Patterns

#### Model Name Variations
- `CreateSessionResponse` vs `SessionCreationResponse`
- `AdminAuthRequest` vs `AuthAdminRequest`  
- Similar naming that masks contract violations

#### Field Name Inconsistencies
- `HostFriendlyToken` vs `HostGuid`
- `SelectedXId` vs `XId` patterns
- Underscore vs camelCase conventions

#### Namespace Confusion
- Multiple models with same name in different namespaces
- Import statements that mask type resolution
- Generic type parameters that hide actual types

## Implementation Checklist

### Before Refactoring
- [ ] Document all API endpoints and response types
- [ ] Verify service class deserialization targets
- [ ] Check for model name variations
- [ ] Review recent git history for model changes

### During Refactoring
- [ ] Use fully qualified type names
- [ ] Implement explicit transformation logic
- [ ] Add logging for deserialization steps
- [ ] Test API calls immediately after changes

### After Refactoring
- [ ] Verify successful deserialization
- [ ] Test end-to-end user workflows
- [ ] Run comprehensive test suite
- [ ] Document any new transformation logic

## Recovery Procedures

If model mismatches are discovered:
1. Identify the exact type mismatch
2. Check git history for the source of divergence
3. Implement proper deserialization with correct types
4. Add transformation logic if models legitimately differ
5. Add tests to prevent regression

## Prevention Integration

These guidelines should be referenced in:
- Code review checklists
- Refactoring procedures
- API documentation standards
- Testing protocols

Regular validation of API contracts prevents silent failures and reduces debugging time during development.

---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._


---
## Sync Protocol
This file must reflect the **REAL current state** of the project.  
- `/sync` is responsible for updating this file automatically.  
- Obsolete data must be removed.  
- Modified values must be updated to match source of truth in the repo.  
- Placeholders (`[PLACEHOLDER]`) must be replaced on the next run.  
