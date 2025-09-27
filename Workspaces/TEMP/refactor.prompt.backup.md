---
mode: agent
---

# /refactor — Structural Integrity Age2. **Backup Strat### Phase 3: Systematic Refactoring
4. **Code Quality Updates**
   - **Structure:** Deduplication, dead code removal, encapsulation, separation of concerns
   - **Standards:** StyleCop (.NET), ESLint + Prettier (Playwright/JS)
   - **Performance:** Flag major inefficiencies (>O(n²), repeated DB calls) - get approval before micro-optimizations
   - **Files:** Professional naming (no `-fixed`, `-new` suffixes), delete obsolete files post-migration
   - **Documentation:** Brief rationale comments in new files (split reason, preserved functionality, test status)- Back up each modified file to `Workspaces/temp/{key}/` (same name structure)
   - Maintain reference map: original → refactored files
   - Auto-cleanup after 30 days (user can request "check original code" comparisons)3.0.0)

Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with industry standards — while ensuring analyzers, lints, test suites, and functional tests remain completely clean.  

**Core Mandate:** Refactors must **never change existing functionality**. All original files are backed up for traceability and recovery.

## Parameters
- **key:** Work stream identifier (e.g., `vault`)
  - Auto-inferred from conversation context if not provided (logged in outputs)
- **notes:** Refactor task description (target areas, files/modules, rationale)
- **auditMode:** `compact` (default, 10-15 line summary) | `full` (detailed breakdown)

## Required Reading & Context
**MANDATORY:** Consult before any changes:
- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails
- `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` - Complete system architecture
  - 52 API endpoints across 11 controllers
  - 15+ Razor pages and 10+ components  
  - 15+ services with mapped responsibilities
  - 4 SignalR hubs with documented methods/events
- Current codebase and existing test coverage
- `Workspaces/Copilot/prompts.keys/{key}/` - Work stream files
- `#getTerminalOutput` for execution evidence

## Application Launch Protocols

### Development Context (Manual Launch)
```powershell
# Use these scripts ONLY for manual development/implementation
./Workspaces/Global/nc.ps1    # Launch only
./Workspaces/Global/ncb.ps1   # Clean, build, then launch
```
- **NEVER** use `dotnet run` directly
- Log lifecycle events: `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

### Testing Context (Automatic Lifecycle)
```javascript
// Playwright manages app via webServer configuration
PW_MODE=standalone  // Enables automatic app lifecycle management
```
- **CRITICAL:** Playwright controls its own application startup/shutdown
- Do NOT manually launch via PowerShell scripts before Playwright tests
- webServer configuration in `config/testing/playwright.config.cjs` handles .NET app as managed subprocess

## Quality Gates
**Completion Criteria:** Zero errors, zero warnings, all tests passing.
- Build must complete with `0 errors and 0 warnings`
- All analyzers and linters must be green
- Playwright and functional tests must pass
- Debug marker: `[DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK`

## Execution Protocol

### Phase 1: Scope & Backup
1. **Scope Assessment**
   - For >5 files: Present planned changes for approval (affected files, deletions/creations, test impact)
   - For ≤5 files: Proceed directly to backup phase

2. **Backup Originals**  
   - Back up each **modified** file into `Workspaces/temp/{key}/` with the same name.  
   - Maintain a reference map of original → refactored files.  
   - Backups may be auto-cleaned after 30 days.  
   - If the user requests *“check original code”*, compare against these backups.

### Phase 2: Analysis & Planning
3. **Code Survey**
   - Identify: duplicate code, dead code, bloated implementations
   - Extract **TODO Functionalities Checklist** (public API/key features only, exclude helpers)
   - Output TODO list before refactoring begins

4. **Systematic Updates**  
   Apply refactorizations with efficiency in mind:
   - Deduplication, dead code removal, encapsulation, separation of concerns  
   - StyleCop + ESLint naming conventions  
   - Prettier for Playwright, StyleCop for .NET  
   - Flag major performance inefficiencies (>O(n²), repeated DB calls) but don’t optimize micro-patterns without approval  
   - File names must be professional and production-ready (no `-fixed`, `-new`, etc.)  
   - Delete obsolete source files once migration is complete  
   - Insert brief rationale comment at top of new files (reason for split, preserved functionality, tests)

### Phase 4: Test Protection
5. **Test Strategy**
   - **Reuse first:** Leverage existing test coverage wherever possible
   - **Generate only:** Missing Playwright tests for uncovered TODO checklist items
   - **Execution:** Run tests before AND after refactor to confirm functionality preservation
   - **Context:** Use `PW_MODE=standalone` (automatic lifecycle), never manual app launch for Playwright

### Phase 5: Validation & Refinement
6. **Quality Validation**
   - Parallel execution: analyzers, linters, test suites
   - Confirm: 0 errors, 0 warnings build completion
   - Verify: TODO checklist items preserved, backup map current

7. **Iterative Approach**
   - **Checkpoints:** After deduplication, file splits, test validation
   - **Failure Recovery:** 3-iteration limit, restore backups if clean state unachievable
   - **Prerequisites:** All Playwright/functional tests must pass before progression

## Deliverables & Reporting

### Required Outputs
- **Scope Summary:** Planned changes (if >5 files)
- **TODO Checklist:** Functionalities preserved/migrated
- **Quality Report:** Analyzer, linter, test outcomes
- **Audit Trail:** Files deleted/renamed/created, backup reference map, terminal evidence
- **Completion Statement:** "Build completed with 0 errors and 0 warnings"

### Reporting Modes
- **Compact** (default): 10-15 line summary
- **Full**: Detailed breakdown with metrics and evidence

### Approval Process
**Prerequisites for completion:**
- All analyzers, linters, tests green and warning-free
- User confirmation required before task closure

## Safety Guardrails

### Code Protection
- **Functional Safety:** Never change existing functionality
- **Backup Mandatory:** Store all modified files in `Workspaces/temp/{key}/`
- **File Scope:** Keep `{key}`-scoped files in their directories
- **Clean Migration:** Delete obsolete files only after successful migration

### System Boundaries
- **No Changes:** `appsettings.*.json`, secrets, requirement files (unless explicitly instructed)
- **Directory Limits:** No new roots outside `Workspaces/Copilot/` (except `.github/`)
- **Database:** SQL Server only (`AHHOME/KSESSIONS_DEV`), never LocalDB
- **Launch Protocol:** Use nc.ps1/ncb.ps1 for port management compliance

---

## Refactoring Patterns Library

### Blazor Component Patterns

#### Cascade Dropdown Implementation
**Pattern:** Automated cascade dropdowns with proper async timing

```csharp
private string? SelectedAlbum
{
    get => Model?.SelectedAlbum;
    set
    {
        if (Model != null && Model.SelectedAlbum != value)
        {
            Model.SelectedAlbum = value;
            InvokeAsync(async () => await OnAlbumChanged()); // Prevent timing issues
        }
    }
}
```

**Requirements:**
- `InvokeAsync()` for async property setters
- Timeout mechanisms for auto-population (max 10 seconds)
- Clear dependent selections on parent changes
- `StateHasChanged()` after async operations

#### Token-Based Auto-Population
**Pattern:** Sequential API calls with timeout handling

```csharp
private async Task AutoPopulateSequence(string runId, string albumId, string categoryId, string sessionId)
{
    var maxWait = 10; // 10 second timeout
    var waited = 0;
    while (Albums.Count == 0 && waited < maxWait)
    {
        await Task.Delay(1000);
        waited++;
    }
    // Sequential population with error handling...
}
```

**Requirements:**
- Timeout mechanisms (10 second max)
- Structured debug logging with RUN_ID
- Token validation before auto-population
- Fallback behavior for failures

#### Service Layer Integration
**Pattern:** Dedicated services for API complexity separation

```csharp
@inject HostSessionService HostService

var albums = await HostService.LoadAlbumsAsync(Model.HostFriendlyToken);
```

**Requirements:**
- Separate API logic from UI logic via service classes
- Services handle HTTP client configuration and errors
- Consistent logging patterns across layers
- Proper async/await throughout call chain

### Testing Patterns

#### Playwright Lifecycle Management
**CRITICAL:** Independent application lifecycle management

**Context Separation:**
- **Development:** nc.ps1/ncb.ps1 PowerShell scripts
- **Playwright:** webServer config with `PW_MODE=standalone`
- **Never mix:** Don't launch manually before Playwright tests

```javascript
// playwright.config.cjs webServer configuration
webServer: {
  command: 'dotnet run --project SPA/NoorCanvas',
  port: 9091,
  reuseExistingServer: !process.env.CI
}
```

#### Component State Validation
**Pattern:** Comprehensive state transition testing

**Test Coverage:**
- Cascade dropdown behavior (Album → Category → Session)
- Auto-population from tokens
- Error handling and recovery scenarios
- Button state transitions during async operations
- Clipboard integration and URL generation

### Architecture Patterns

#### View Model Separation
**Pattern:** Dedicated ViewModels for complex forms

```csharp
public class HostSessionOpenerViewModel 
{
    public bool IsFormValid { get; set; }
    public bool ValidateRequiredFields() => // validation logic
}

private HostSessionOpenerViewModel Model { get; set; } = new();
```

#### Error Handling Consistency
**Pattern:** Layered error messaging strategy

**Requirements:**
- Distinguish validation errors from system errors
- Provide specific user action guidance
- Log technical details, show friendly messages
- Reset error state during user interactions

### Performance Patterns

#### Async Operation Management
**Pattern:** Coordinated async operations to prevent races

**Requirements:**
- Loading flags prevent concurrent operations
- Proper cleanup in finally blocks
- Strategic `StateHasChanged()` usage
- Handle disposal during async operations

#### Memory Management
**Pattern:** Proper resource cleanup for long-running components

**Requirements:**
- Clear collections when no longer needed
- Dispose event handlers and timers
- Handle navigation gracefully
- Structured logging for component lifecycle

### Documentation Patterns

#### Architecture Document Synchronization
**Pattern:** Post-refactor documentation maintenance

**Update Requirements:**
- Document new service classes and responsibilities
- Update component dependencies and injection patterns
- Document new API endpoints or method signatures
- Update integration patterns and workflows
- Remove obsolete patterns from documentation
