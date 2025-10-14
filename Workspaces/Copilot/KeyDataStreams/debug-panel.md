# Debug Panel - Key Data Stream

**Feature**: Development debug panels across UserLanding, SessionCanvas, and HostControlPanel views
**Status**: ⚠️ Toast NotificationOptions.closeButton Error Investigation
**Last Updated**: 2025-10-14
**Debug Level**: trace

---

## 🔴 CURRENT ISSUE: Toast NotificationOptions Error

**Error Message**: `Microsoft.JSInterop.JSException: Object of type 'NotificationOptions' does not have a property named 'closeButton'`

**Root Cause**: Toastr.js was replaced with Notyf library (see `toastr.md` key), but C# code still passing old toastr.js configuration objects with properties like `closeButton`, `progressBar`, `timeOut` that don't exist in Notyf.

**Impact**: Toast notifications fail with JSInterop error when debug panel actions are executed

**Test Created**: 
- File: `Workspaces/TEMP/debug-panel-toast-error-visual.spec.ts`
- Purpose: Reproduce error via automated visual regression test
- Execution Script: `Scripts/run-debug-panel-toast-error-test.ps1`

**Next Steps**:
1. Run test to capture exact error stack trace
2. Locate C# code with `NotificationOptions` class
3. Remove class and update JSInterop calls to simple API: `JSRuntime.InvokeVoidAsync("showNoorToast", message, title, type)`
4. Re-run test to verify fix

---

## Overview

Debug panels provide development-time utilities for testing and debugging across three key views:

1. **UserLanding.razor**: Auto-fill registration form with superhero test data
2. **SessionCanvas.razor**: Simulate random questions for participants
3. **HostControlPanel.razor**: Test asset sharing and detection

All debug panels follow consistent architectural pattern using `DebugActions` list with `IDebugAction` interface.

---

## Architecture

### Component Structure

```
NoorCanvas.Components.Development.DebugPanel
│
├── Parameters
│   ├── CurrentViewName: string (e.g., "UserLanding")
│   ├── DebugActions: List<IDebugAction>
│   ├── GenericMessage: string (optional)
│   └── ShowDebugToasts: bool (default: true)
│
└── Rendering Pattern
    ├── Floating button (bottom-right, blue bug icon)
    ├── Click to expand actions panel
    ├── Each action renders as button with icon
    └── Conditional visibility (DevModeService.IsDevMode)
```

### Debug Action Interface

```csharp
public interface IDebugAction
{
    string Name { get; }          // Button text (e.g., "Enter Test Data")
    string Description { get; }    // Tooltip/help text
    Func<Task> Action { get; }     // Async method to execute
    string IconClass { get; }      // FontAwesome icon (e.g., "fa-solid fa-user-plus")
    bool IsEnabled { get; set; }   // Button enabled state
}
```

---

## Implementation: UserLanding.razor

### Debug Actions Factory Method

**Location**: `SPA/NoorCanvas/Pages/UserLanding.razor:1254-1271`

```csharp
private List<NoorCanvas.Models.Debug.IDebugAction> GetUserLandingDebugActions()
{
    var actions = new List<NoorCanvas.Models.Debug.IDebugAction>();
    
    // Only show "Enter Test Data" when on registration panel with countries loaded
    if (Model != null && !Model.ShowTokenPanel && Countries.Any())
    {
        actions.Add(new NoorCanvas.Models.Debug.DebugAction(
            "Enter Test Data",
            "Auto-fill registration form with superhero test data",
            async () => await HandleEnterTestData(),
            "fa-solid fa-user-plus"
        )
        {
            IsEnabled = !Model.IsLoading && !Model.IsLoadingCountries
        });
    }
    
    return actions;
}
```

**Conditional Visibility**:
- `Model != null`: Component initialized
- `!Model.ShowTokenPanel`: Registration panel visible (not token entry panel)
- `Countries.Any()`: Countries dropdown populated from API

**Button State**:
- Enabled: `!Model.IsLoading && !Model.IsLoadingCountries`
- Disabled: Form loading or countries still fetching

### HandleEnterTestData Method

**Location**: `SPA/NoorCanvas/Pages/UserLanding.razor:1273-1320`

**Functionality**:
1. Generates superhero test data via `TestDataService.GenerateUserLandingNameAndEmail()`
2. Populates form fields:
   - `Model.NameInput` = Superhero name (e.g., "Bruce Wayne")
   - `Model.EmailInput` = Superhero email (e.g., "bruce.wayne@gotham.example")
   - `Model.CountrySelect` = Random country ISO2 code from dropdown
3. Clears error messages
4. Calls `StateHasChanged()` to update UI
5. Waits 100ms for UI render
6. Auto-submits form via `HandleUserRegistration()`

**Logging**:
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:debug-panel:test-data:TRACE] [{RequestId}] Populating UserLanding with test data ;CLEANUP_OK", requestId);
Logger.LogInformation("[DEBUG-WORKITEM:debug-panel:test-data:TRACE] [{RequestId}] Test data populated - Name: {Name}, Email: {Email}, Country: {CountryName} (ISO2: {ISO2}) ;CLEANUP_OK", ...);
Logger.LogInformation("[DEBUG-WORKITEM:debug-panel:test-data:TRACE] [{RequestId}] Auto-submitting registration form ;CLEANUP_OK", requestId);
```

**Test Data Format**:
- Name: Superhero names (e.g., "Clark Kent", "Diana Prince")
- Email: `{firstname}.{lastname}@{location}.example`
- Country: Random selection from `Countries` list using ISO2 codes

---

## Implementation: SessionCanvas.razor

**Location**: `SPA/NoorCanvas/Pages/SessionCanvas.razor`

### Debug Actions

**Factory Method**: `GetSessionCanvasDebugActions()` (lines 3371-3388)

**Action**: "Simulate Random Question"
- Icon: `fa-solid fa-comment-dots`
- Description: "Submit a random Islamic question to test broadcasting"
- Enabled When: `SessionToken != null` (participant joined session)
- Handler: `SimulateRandomQuestion()`

### SimulateRandomQuestion Method

**Location**: Lines 3446-3462

**Functionality**:
1. Selects random question from `DebugIslamicQuestions` static list (50+ questions)
2. Calls `SubmitQuestion()` with selected question text
3. Logs submission with trace markers

**Test Question Examples**:
- "What is the importance of family in Islam?"
- "How can we develop patience in difficult times?"
- "What does Islam say about helping neighbors?"
- (Full list at lines 3394-3444)

**Logging**:
```csharp
Logger.LogInformation("[DEBUG-WORKITEM:canvas:test-question:TRACE] Random question submitted: {Question} ;CLEANUP_OK", randomQuestion);
```

---

## Implementation: HostControlPanel.razor

**Location**: `SPA/NoorCanvas/Components/Host/HostControlPanel.razor`

### Debug Actions

**Factory Method**: `GetHostControlPanelDebugActions()` (line 3333+)

**Actions**:
1. **"Test Share Asset"**
   - Icon: `fa-solid fa-share-nodes`
   - Description: "Share test asset to verify broadcasting"
   - Enabled When: `SessionStatus == "Active" && SessionId.HasValue`
   - Handler: `TestShareAsset()`

2. **"Test Asset Detection"**
   - Icon: `fa-solid fa-magnifying-glass`
   - Description: "Run asset detection diagnostics"
   - Enabled When: `SessionStatus == "Active" && SessionId.HasValue`
   - Handler: `TestAssetDetectionAsync()`

### Test Methods

**TestShareAsset()**:
- Shares predefined test asset to all participants
- Verifies SignalR broadcast functionality
- Logs asset sharing trace

**TestAssetDetectionAsync()**:
- Runs diagnostic checks on asset detection system
- Validates URL patterns, database lookups
- Logs detection results with trace markers

---

## Visual Regression Testing

### Percy Integration

**Test File**: `Tests/UI/debug-panel-user-landing-visual.spec.ts`
**Created**: 2025-10-14
**Test Count**: 6 comprehensive tests

#### Test Coverage

1. **Debug Panel Visibility Test**
   - Verifies panel appears when conditions met
   - Captures closed and open states
   - Validates icon rendering (fa-user-plus)
   
2. **Responsive Design Test**
   - Mobile: 375px width
   - Tablet: 768px width  
   - Desktop: 1280px width
   - Ensures consistent positioning across viewports
   
3. **Auto-fill Functionality Test**
   - Captures before, during, after auto-fill states
   - Verifies form population with test data
   - Validates auto-submit to session canvas
   - Percy snapshots: 
     * Empty form (baseline)
     * Button ready to click
     * Populated form
     * Session canvas after submit
   
4. **Button Disabled State Test**
   - Verifies button disabled when countries loading
   - Captures enabled state when ready
   
5. **Multi-Session Test**
   - Tests debug panel across different sessions
   - Ensures consistent behavior
   
6. **Console Logging Test**
   - Validates expected log messages:
     * "Populating UserLanding with test data"
     * "Test data populated - Name: X, Email: Y, Country: Z"
     * "Auto-submitting registration form"
   - Ensures trace markers present

### Percy Snapshots Captured

| Snapshot Name | Description | Viewports |
|--------------|-------------|-----------|
| `Debug Panel - UserLanding - Closed State (Desktop)` | Baseline with debug button visible | 1280px |
| `Debug Panel - UserLanding - Open State with Actions (Desktop)` | Panel expanded showing actions | 1280px |
| `Debug Panel - UserLanding - Mobile (375px)` | Responsive mobile view | 375px |
| `Debug Panel - UserLanding - Tablet (768px)` | Responsive tablet view | 768px |
| `Debug Panel - UserLanding - Before Auto-fill (Empty Form)` | Baseline before test data | 1280px |
| `Debug Panel - UserLanding - About to Auto-fill (Button Ready)` | Button highlighted pre-click | 1280px |
| `Debug Panel - UserLanding - After Auto-fill (Populated Form)` | Form filled with test data | 1280px |
| `Debug Panel - UserLanding - Session Canvas After Auto-submit` | Final state after auto-submit | 1280px |
| `Debug Panel - UserLanding - Button Enabled (Ready to Use)` | Button state when enabled | 1280px |
| `Debug Panel - UserLanding - Session 212 View` | Specific session view | 1280px |

### Running Percy Tests

#### Via VS Code Task (Recommended)

```
Task: "test-debug-panel-percy"
Description: Launches app in separate PowerShell window, runs Percy tests
```

**Steps**:
1. Press `Ctrl+Shift+P` → "Tasks: Run Task"
2. Select `test-debug-panel-percy`
3. Script handles:
   - Building application
   - Launching in separate PowerShell window
   - Health check wait
   - Percy test execution
   - Cleanup

#### Via PowerShell Script

```powershell
# Standard run (auto-cleanup)
.\Scripts\run-debug-panel-percy-tests.ps1

# Keep app running after tests
.\Scripts\run-debug-panel-percy-tests.ps1 -KeepAppRunning

# Skip build (use existing binaries)
.\Scripts\run-debug-panel-percy-tests.ps1 -SkipBuild

# Headless mode (faster, no browser window)
.\Scripts\run-debug-panel-percy-tests.ps1 -HeadlessTests
```

#### Via npm Scripts

```bash
# Run all Percy tests
npm run test:percy

# Run with headed browser
npm run test:percy:headed

# Run specific visual test
npm run test:percy:visual
```

### Percy Dashboard

**Project URL**: https://percy.io (NOOR-CANVAS project)

**Baseline Workflow**:
1. First run establishes baseline snapshots
2. Subsequent runs compare against baseline
3. Visual differences highlighted in dashboard
4. Approve/reject changes via web interface

**Review Process**:
1. Navigate to Percy dashboard after test run
2. View side-by-side comparisons
3. Approve expected changes
4. Investigate unexpected visual regressions

---

## Testing Instructions

### Manual Testing

#### UserLanding Debug Panel

1. **Prerequisites**:
   - Application running: `dotnet run` from `SPA/NoorCanvas`
   - Session 212 created with token `KJAHA99L`
   - Development mode enabled (`ASPNETCORE_ENVIRONMENT=Development`)

2. **Steps**:
   ```
   1. Navigate to: https://localhost:9091/user/landing/KJAHA99L
   2. Wait for registration panel to load
   3. Wait for countries dropdown to populate (7 countries)
   4. Look for blue bug icon (bottom-right corner)
   5. Click bug icon to open debug panel
   6. Verify "Enter Test Data" button visible
   7. Verify button enabled (not grayed out)
   8. Click "Enter Test Data"
   9. Observe form auto-fill:
      - Name field: Superhero name
      - Email field: Superhero email (*.example domain)
      - Country: Random selection
   10. Observe auto-submit (redirects to /session/canvas or /session/waiting)
   11. Verify successful join to session canvas
   ```

3. **Expected Results**:
   - Debug panel appears only when `!ShowTokenPanel && Countries.Any()`
   - Button disabled when `IsLoading || IsLoadingCountries`
   - Form auto-fills with valid test data
   - Form auto-submits after 100ms delay
   - Browser console shows trace logs:
     ```
     [DEBUG-WORKITEM:debug-panel:test-data:TRACE] [RequestId] Populating UserLanding with test data
     [DEBUG-WORKITEM:debug-panel:test-data:TRACE] [RequestId] Test data populated - Name: {Name}, Email: {Email}, Country: {Country}
     [DEBUG-WORKITEM:debug-panel:test-data:TRACE] [RequestId] Auto-submitting registration form
     ```

#### SessionCanvas Debug Panel

1. **Prerequisites**:
   - Participant joined session (via UserLanding test above)
   - Session status: "Active" or "Created"

2. **Steps**:
   ```
   1. On session canvas, look for blue bug icon (bottom-right)
   2. Click bug icon
   3. Click "Simulate Random Question"
   4. Observe question card appear on canvas
   5. Verify question text is from DebugIslamicQuestions list
   6. If multiple participants connected, verify question broadcasts to all
   ```

#### HostControlPanel Debug Panel

1. **Prerequisites**:
   - Host authenticated with session
   - Session status: "Active"
   - SessionId available

2. **Steps**:
   ```
   1. On host control panel, find debug panel icon
   2. Click to expand
   3. Verify "Test Share Asset" and "Test Asset Detection" buttons
   4. Click "Test Share Asset"
   5. Verify asset broadcast to participants
   6. Click "Test Asset Detection"
   7. Check console for diagnostic logs
   ```

### Automated Testing

#### Playwright + Percy Tests

**Command**:
```bash
# Via task
Ctrl+Shift+P → Tasks: Run Task → test-debug-panel-percy

# Via script
.\Scripts\run-debug-panel-percy-tests.ps1

# Via npm
npm run test:percy:headed
```

**Test Execution**:
1. Script builds application
2. Launches app in separate PowerShell window
3. Waits for health check (app ready)
4. Runs Playwright tests with Percy integration
5. Captures visual snapshots at multiple viewports
6. Uploads snapshots to Percy dashboard
7. Cleans up application process

**Percy Verification**:
1. Open Percy dashboard: https://percy.io
2. Navigate to NOOR-CANVAS project
3. Review latest build
4. Check for visual differences
5. Approve baselines on first run
6. Investigate any unexpected changes

---

## Git History

### Restoration from History

**Checkpoint**: Commit `3df21011` (Historical reference)
- Original `HandleEnterTestData` implementation
- Research method: `git log --all --oneline --grep="debug.*panel"`

### Implementation Commits

**Commit 1**: `9219c7e6` (2025-10-14)
```
feat(debug-panel): Restore test data entry functionality in UserLanding.razor

- Restored HandleEnterTestData method (~60 lines)
- Added superhero test data generation
- Implemented auto-submit after form population
- Added trace logging with [DEBUG-WORKITEM:debug-panel:test-data:TRACE]
```

**Commit 2**: `906b602a` (2025-10-14)
```
docs(debug-panel): Update key data stream with debug panel restoration and verification

- Documented UserLanding debug panel implementation
- Verified SessionCanvas debug panel (SimulateRandomQuestion functional)
- Verified HostControlPanel debug panel (TestShareAsset + TestAssetDetection functional)
- Added comprehensive testing instructions
```

**Commit 3**: `<pending>` (2025-10-14)
```
test(debug-panel): Add Percy visual regression tests for UserLanding

- Created comprehensive Playwright + Percy test suite
- 6 tests covering visibility, responsiveness, auto-fill, logging
- 10 visual snapshots across mobile/tablet/desktop viewports
- PowerShell script for automated test execution with app launch
- VS Code tasks for easy test running
- Integration with Percy dashboard for visual baseline management
```

---

## Percy Configuration

### Environment Setup

**Percy Token**: Set via `setup-percy.ps1` script
- Token stored in environment variable `PERCY_TOKEN`
- Required for snapshot upload to Percy dashboard

**Percy CLI**: Installed via npm
```bash
npm install --save-dev @percy/cli @percy/playwright
```

### Percy CSS Overrides

Tests use `percyCSS` parameter to hide dynamic elements:

```typescript
percyCSS: `
    /* Hide elements that cause false positives */
    .session-timer { visibility: hidden; }
    .participant-count { visibility: hidden; }
`
```

**Rationale**: Session timers and participant counts change on every run, causing false visual differences.

---

## Troubleshooting

### Issue: Debug Panel Not Visible

**Symptoms**: Blue bug icon missing from UserLanding

**Diagnosis**:
1. Check `ASPNETCORE_ENVIRONMENT` = `Development`
   ```powershell
   $env:ASPNETCORE_ENVIRONMENT
   ```
2. Verify `DevModeService.IsDevMode` returns `true`
3. Check conditions:
   - `Model != null`: ✅
   - `!Model.ShowTokenPanel`: ✅ (on registration panel)
   - `Countries.Any()`: ✅ (countries loaded)

**Solution**:
```powershell
# Ensure development mode
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run
```

### Issue: "Enter Test Data" Button Disabled

**Symptoms**: Button grayed out, cannot click

**Diagnosis**:
1. Check `Model.IsLoading` = `false`
2. Check `Model.IsLoadingCountries` = `false`
3. Verify countries dropdown populated (should have 7 countries)

**Solution**: Wait for countries API call to complete (~2-3 seconds)

### Issue: Auto-submit Not Working

**Symptoms**: Form populates but doesn't submit

**Diagnosis**:
1. Check browser console for errors
2. Verify `HandleUserRegistration()` method exists
3. Check `SessionToken` is valid

**Solution**: Review browser console, check for validation errors

### Issue: Percy Tests Fail

**Symptoms**: `percy exec` command fails or snapshots not uploaded

**Diagnosis**:
1. Verify `PERCY_TOKEN` environment variable set:
   ```powershell
   $env:PERCY_TOKEN
   ```
2. Check Percy CLI installed:
   ```bash
   npx percy --version
   ```
3. Verify application is running and accessible

**Solution**:
```powershell
# Re-run Percy setup
.\setup-percy.ps1

# Verify Percy login
npx percy config:info

# Re-run tests
.\Scripts\run-debug-panel-percy-tests.ps1
```

---

## Related Files

### Source Code

- `SPA/NoorCanvas/Pages/UserLanding.razor` (lines 1254-1320) - UserLanding debug panel
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` (lines 3371-3462) - SessionCanvas debug panel
- `SPA/NoorCanvas/Components/Host/HostControlPanel.razor` (line 3333+) - Host debug panel
- `SPA/NoorCanvas/Components/Development/DebugPanel.razor` - Reusable debug panel component
- `SPA/NoorCanvas/Models/Debug/IDebugAction.cs` - Debug action interface
- `SPA/NoorCanvas/Models/Debug/DebugAction.cs` - Debug action implementation
- `SPA/NoorCanvas/Services/TestDataService.cs` - Superhero test data generator

### Tests

- `Tests/UI/debug-panel-user-landing-visual.spec.ts` - Percy visual regression tests
- `Scripts/run-debug-panel-percy-tests.ps1` - Automated test runner script
- `.vscode/tasks.json` - VS Code tasks for running tests

### Documentation

- `Workspaces/Copilot/KeyDataStreams/debug-panel.md` - This file
- `.github/instructions/Links/PlaywrightQuickRef.md` - Playwright test patterns
- `Docs/VISUAL_REGRESSION_TESTING.md` - Percy documentation

---

## Future Enhancements

### Potential Improvements

1. **Additional Percy Snapshots**:
   - SessionCanvas debug panel visual tests
   - HostControlPanel debug panel visual tests
   - Cross-browser testing (Chromium, Firefox, WebKit)

2. **Extended Test Coverage**:
   - Error state validation (e.g., countries fail to load)
   - Loading state animations
   - Debug panel keyboard navigation

3. **Performance Testing**:
   - Measure auto-fill execution time
   - Validate no performance regression from debug code
   - Ensure debug panels don't affect production builds

4. **Accessibility Testing**:
   - Screen reader compatibility
   - Keyboard-only operation
   - ARIA labels for debug buttons

---

## Notes

- **Cleanup Markers**: All debug panel code has `;CLEANUP_OK` markers
- **Production Safety**: Debug panels only render when `DevModeService.IsDevMode == true`
- **SignalR**: SessionCanvas and HostControlPanel debug actions test real-time broadcasting
- **Visual Regression**: Percy baselines must be approved manually on first test run
- **Test Isolation**: App launched in separate PowerShell window to avoid Terminal conflicts

---

**End of Key Data Stream**
