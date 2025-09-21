# TODO: Remove Issue-106 Cascading Default Values

**Created**: September 18, 2025  
**Updated**: September 18, 2025  
**Priority**: MEDIUM - Remove test-specific values after validation  
**Type**: Cascading dropdown cleanup

## Background

User requested cascading dropdown loading with delays to avoid race condition:

- **Previous Issue**: Hardcoded values caused maintenance overhead
- **Current Solution**: Proper cascading loading with 2-second delays: Album=18 → Category=55 → Session=1281
- **User Request**: "Load Albumid=18, wait 2 sec, load Categoryid 55, wait 2sec then load Sessionid 1281"

## Hardcoded Values to Remove

### Files Modified: `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`

#### 1. SetCascadingDefaultValuesAsync Method (Lines ~404-446)

```csharp
// TODO: ISSUE-106-CASCADING - Sets specific values with cascading dropdown loading and 2-second delays
// Load Albumid=18, wait 2s, load Categoryid=55, wait 2s, then load Sessionid=1281
private async Task SetCascadingDefaultValuesAsync()
```

**Action Required**: Remove specific Album=18, Category=55, Session=1281 values and make generic or configurable

#### 2. OnInitializedAsync Method Cascading Comments (Lines ~360-362)

```csharp
// TODO: ISSUE-106-CASCADING - Load albums first, then set cascading values with delays
await SetCascadingDefaultValuesAsync();
Logger.LogInformation("NOOR-HOST-OPENER: [ISSUE-106-HARDCODE] Using hardcoded values...");
```

**Action Required**: Remove hardcode logging, restore SetTemporaryDefaultValuesAsync with proper race condition fix

#### 3. OpenSession Error Handling Hardcoded Panel Show (Lines ~678-685)

```csharp
// TODO: ISSUE-106-HARDCODE - Display actual API error instead of generic message
ErrorMessage = $"API Error: {ex.Message}";

// TODO: ISSUE-106-HARDCODE - Force show Session URL panel as requested
ShowSessionUrlPanel = true;
```

**Action Required**: Revert to generic error message and remove forced panel show

#### 4. CreateSessionAndGenerateTokens Error Detail Enhancement (Lines ~765-771)

```csharp
// TODO: ISSUE-106-HARDCODE - Provide detailed API error message instead of generic status code
string detailedError = $"HTTP {(int)response.StatusCode} {response.StatusCode}";
if (!string.IsNullOrEmpty(responseContent))
{
    detailedError += $" - {responseContent}";
}
```

**Action Required**: Evaluate if this enhancement should be kept (it's actually an improvement)

## Cleanup Steps (Execute when Issue-106 is fully resolved)

### Step 1: Fix Race Condition First

- [ ] Implement proper fix for OnAlbumChanged/OnCategoryChanged clearing values during programmatic setting
- [ ] Test that SetTemporaryDefaultValuesAsync works without race condition
- [ ] Validate that API calls receive proper Album/Category/Session values

### Step 2: Remove Hardcoded Values

- [ ] Reset ViewModel properties to `null`:
  ```csharp
  public string? SelectedAlbum { get; set; }
  public string? SelectedCategory { get; set; }
  public string? SelectedSession { get; set; }
  ```
- [ ] Restore `await SetTemporaryDefaultValuesAsync();` call in OnInitializedAsync
- [ ] Remove all `[ISSUE-106-HARDCODE]` logging statements

### Step 3: Restore Proper Error Handling

- [ ] Revert OpenSession catch block to not force ShowSessionUrlPanel = true
- [ ] Evaluate keeping detailed API error messages (user-friendly improvement)
- [ ] Test that Session URL panel shows only on successful session creation

### Step 4: Clean Up TODO Comments

- [ ] Remove all `TODO: ISSUE-106-HARDCODE` comments
- [ ] Update or remove `TODO: TEMPORARY` comments as appropriate
- [ ] Update Issue-106 documentation with final resolution

## Testing Validation (Before Cleanup)

- ✅ Verify hardcoded values work and Session URL panel shows
- ✅ Confirm error messages are displayed to user
- ⏳ Pending: Race condition fix validation

## Testing Validation (After Cleanup)

- [ ] Verify dynamic loading works without race condition
- [ ] Confirm Session URL panel shows only on success
- [ ] Validate error handling is appropriate
- [ ] Test complete workflow end-to-end

## Risk Assessment

- **Low Risk**: Hardcoded values are clearly marked and isolated
- **Medium Risk**: Race condition fix must be implemented before cleanup
- **High Risk**: Don't remove hardcode without fixing underlying issue

---

_This TODO will be moved to COMPLETED when all hardcoded values are properly removed and dynamic loading is restored._
