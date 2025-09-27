---
mode: agent
---



# /refactor — Structural Integrity Agent (v3.0.0)# /refactor — Structural Integrity Age2. **Backup Strat### Phase 3: Systematic Refactoring

4. **Code Quality Updates**

Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with industry standards — while ensuring analyzers, lints, test suites, and functional tests remain completely clean.     - **Structure:** Deduplication, dead code removal, encapsulation, separation of concerns

   - **Standards:** StyleCop (.NET), ESLint + Prettier (Playwright/JS)

**Core Mandate:** Refactors must **never change existing functionality**. All original files are backed up for traceability and recovery.   - **Performance:** Flag major inefficiencies (>O(n²), repeated DB calls) - get approval before micro-optimizations

   - **Files:** Professional naming (no `-fixed`, `-new` suffixes), delete obsolete files post-migration

## Parameters   - **Documentation:** Brief rationale comments in new files (split reason, preserved functionality, test status)- Back up each modified file to `Workspaces/temp/{key}/` (same name structure)

- **key:** Work stream identifier (e.g., `vault`)   - Maintain reference map: original → refactored files

  - Auto-inferred from conversation context if not provided (logged in outputs)   - Auto-cleanup after 30 days (user can request "check original code" comparisons)3.0.0)

- **notes:** Refactor task description (target areas, files/modules, rationale)

- **auditMode:** `compact` (default, 10-15 line summary) | `full` (detailed breakdown)Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with industry standards — while ensuring analyzers, lints, test suites, and functional tests remain completely clean.  



## Required Reading & Context**Core Mandate:** Refactors must **never change existing functionality**. All original files are backed up for traceability and recovery.

**MANDATORY:** Consult before any changes:

- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails## Parameters

- `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` - Complete system architecture- **key:** Work stream identifier (e.g., `vault`)

  - 52 API endpoints across 11 controllers  - Auto-inferred from conversation context if not provided (logged in outputs)

  - 15+ Razor pages and 10+ components  - **notes:** Refactor task description (target areas, files/modules, rationale)

  - 15+ services with mapped responsibilities- **auditMode:** `compact` (default, 10-15 line summary) | `full` (detailed breakdown)

  - 4 SignalR hubs with documented methods/events

- Current codebase and existing test coverage## Required Reading & Context

- `Workspaces/Copilot/prompts.keys/{key}/` - Work stream files**MANDATORY:** Consult before any changes:

- `#getTerminalOutput` for execution evidence- `.github/instructions/SelfAwareness.instructions.md` - Global operating guardrails

- `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD` - Complete system architecture

## Application Launch Protocols  - 52 API endpoints across 11 controllers

  - 15+ Razor pages and 10+ components  

### Development Context (Manual Launch)  - 15+ services with mapped responsibilities

```powershell  - 4 SignalR hubs with documented methods/events

# Use these scripts ONLY for manual development/implementation- Current codebase and existing test coverage

./Workspaces/Global/nc.ps1    # Launch only- `Workspaces/Copilot/prompts.keys/{key}/` - Work stream files

./Workspaces/Global/ncb.ps1   # Clean, build, then launch- `#getTerminalOutput` for execution evidence

```

- **NEVER** use `dotnet run` directly## Application Launch Protocols

- Log lifecycle events: `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

### Development Context (Manual Launch)

### Testing Context (Automatic Lifecycle)```powershell

```javascript# Use these scripts ONLY for manual development/implementation

// Playwright manages app via webServer configuration./Workspaces/Global/nc.ps1    # Launch only

PW_MODE=standalone  // Enables automatic app lifecycle management./Workspaces/Global/ncb.ps1   # Clean, build, then launch

``````

- **CRITICAL:** Playwright controls its own application startup/shutdown- **NEVER** use `dotnet run` directly

- Do NOT manually launch via PowerShell scripts before Playwright tests- Log lifecycle events: `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

- webServer configuration in `config/testing/playwright.config.cjs` handles .NET app as managed subprocess

### Testing Context (Automatic Lifecycle)

## Quality Gates```javascript

**Completion Criteria:** Zero errors, zero warnings, all tests passing.// Playwright manages app via webServer configuration

- Build must complete with `0 errors and 0 warnings`PW_MODE=standalone  // Enables automatic app lifecycle management

- All analyzers and linters must be green```

- Playwright and functional tests must pass- **CRITICAL:** Playwright controls its own application startup/shutdown

- Debug marker: `[DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK`- Do NOT manually launch via PowerShell scripts before Playwright tests

- webServer configuration in `config/testing/playwright.config.cjs` handles .NET app as managed subprocess

## Execution Protocol

## Quality Gates

### Phase 1: Scope & Backup**Completion Criteria:** Zero errors, zero warnings, all tests passing.

1. **Scope Assessment**- Build must complete with `0 errors and 0 warnings`

   - For >5 files: Present planned changes for approval (affected files, deletions/creations, test impact)- All analyzers and linters must be green

   - For ≤5 files: Proceed directly to backup phase- Playwright and functional tests must pass

   - Debug marker: `[DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK`

2. **Backup Strategy**

   - Back up each modified file to `Workspaces/temp/{key}/` (same name structure)## Execution Protocol

   - Maintain reference map: original → refactored files

   - Auto-cleanup after 30 days (user can request "check original code" comparisons)### Phase 1: Scope & Backup

1. **Scope Assessment**

### Phase 2: Analysis & Planning   - For >5 files: Present planned changes for approval (affected files, deletions/creations, test impact)

3. **Code Survey**   - For ≤5 files: Proceed directly to backup phase

   - Identify: duplicate code, dead code, bloated implementations

   - Extract **TODO Functionalities Checklist** (public API/key features only, exclude helpers)2. **Backup Originals**  

   - Output TODO list before refactoring begins   - Back up each **modified** file into `Workspaces/temp/{key}/` with the same name.  

   - Maintain a reference map of original → refactored files.  

### Phase 3: Systematic Refactoring   - Backups may be auto-cleaned after 30 days.  

4. **Code Quality Updates**   - If the user requests *“check original code”*, compare against these backups.

   - **Structure:** Deduplication, dead code removal, encapsulation, separation of concerns

   - **Standards:** StyleCop (.NET), ESLint + Prettier (Playwright/JS)### Phase 2: Analysis & Planning

   - **Performance:** Flag major inefficiencies (>O(n²), repeated DB calls) - get approval before micro-optimizations3. **Code Survey**

   - **Files:** Professional naming (no `-fixed`, `-new` suffixes), delete obsolete files post-migration   - Identify: duplicate code, dead code, bloated implementations

   - **Documentation:** Brief rationale comments in new files (split reason, preserved functionality, test status)   - Extract **TODO Functionalities Checklist** (public API/key features only, exclude helpers)

   - Output TODO list before refactoring begins

### Phase 4: Test Protection

5. **Test Strategy**4. **Systematic Updates**  

   - **Reuse first:** Leverage existing test coverage wherever possible   Apply refactorizations with efficiency in mind:

   - **Generate only:** Missing Playwright tests for uncovered TODO checklist items   - Deduplication, dead code removal, encapsulation, separation of concerns  

   - **Execution:** Run tests before AND after refactor to confirm functionality preservation   - StyleCop + ESLint naming conventions  

   - **Context:** Use `PW_MODE=standalone` (automatic lifecycle), never manual app launch for Playwright   - Prettier for Playwright, StyleCop for .NET  

   - Flag major performance inefficiencies (>O(n²), repeated DB calls) but don’t optimize micro-patterns without approval  

### Phase 5: Validation & Refinement   - File names must be professional and production-ready (no `-fixed`, `-new`, etc.)  

6. **Quality Validation**   - Delete obsolete source files once migration is complete  

   - Parallel execution: analyzers, linters, test suites   - Insert brief rationale comment at top of new files (reason for split, preserved functionality, tests)

   - Confirm: 0 errors, 0 warnings build completion

   - Verify: TODO checklist items preserved, backup map current### Phase 4: Test Protection

5. **Test Strategy**

7. **Iterative Approach**   - **Reuse first:** Leverage existing test coverage wherever possible

   - **Checkpoints:** After deduplication, file splits, test validation   - **Generate only:** Missing Playwright tests for uncovered TODO checklist items

   - **Failure Recovery:** 3-iteration limit, restore backups if clean state unachievable   - **Execution:** Run tests before AND after refactor to confirm functionality preservation

   - **Prerequisites:** All Playwright/functional tests must pass before progression   - **Context:** Use `PW_MODE=standalone` (automatic lifecycle), never manual app launch for Playwright



## Deliverables & Reporting### Phase 5: Validation & Refinement

6. **Quality Validation**

### Required Outputs   - Parallel execution: analyzers, linters, test suites

- **Scope Summary:** Planned changes (if >5 files)   - Confirm: 0 errors, 0 warnings build completion

- **TODO Checklist:** Functionalities preserved/migrated   - Verify: TODO checklist items preserved, backup map current

- **Quality Report:** Analyzer, linter, test outcomes

- **Audit Trail:** Files deleted/renamed/created, backup reference map, terminal evidence7. **Iterative Approach**

- **Completion Statement:** "Build completed with 0 errors and 0 warnings"   - **Checkpoints:** After deduplication, file splits, test validation

   - **Failure Recovery:** 3-iteration limit, restore backups if clean state unachievable

### Reporting Modes   - **Prerequisites:** All Playwright/functional tests must pass before progression

- **Compact** (default): 10-15 line summary

- **Full**: Detailed breakdown with metrics and evidence## Deliverables & Reporting



### Approval Process### Required Outputs

**Prerequisites for completion:**- **Scope Summary:** Planned changes (if >5 files)

- All analyzers, linters, tests green and warning-free- **TODO Checklist:** Functionalities preserved/migrated

- User confirmation required before task closure- **Quality Report:** Analyzer, linter, test outcomes

- **Audit Trail:** Files deleted/renamed/created, backup reference map, terminal evidence

## Safety Guardrails- **Completion Statement:** "Build completed with 0 errors and 0 warnings"



### Code Protection### Reporting Modes

- **Functional Safety:** Never change existing functionality- **Compact** (default): 10-15 line summary

- **Backup Mandatory:** Store all modified files in `Workspaces/temp/{key}/`- **Full**: Detailed breakdown with metrics and evidence

- **File Scope:** Keep `{key}`-scoped files in their directories

- **Clean Migration:** Delete obsolete files only after successful migration### Approval Process

**Prerequisites for completion:**

### System Boundaries- All analyzers, linters, tests green and warning-free

- **No Changes:** `appsettings.*.json`, secrets, requirement files (unless explicitly instructed)- User confirmation required before task closure

- **Directory Limits:** No new roots outside `Workspaces/Copilot/` (except `.github/`)

- **Database:** SQL Server only (`AHHOME/KSESSIONS_DEV`), never LocalDB## Safety Guardrails

- **Launch Protocol:** Use nc.ps1/ncb.ps1 for port management compliance

### Code Protection

---- **Functional Safety:** Never change existing functionality

- **Backup Mandatory:** Store all modified files in `Workspaces/temp/{key}/`

## Refactoring Patterns Library- **File Scope:** Keep `{key}`-scoped files in their directories

- **Clean Migration:** Delete obsolete files only after successful migration

### Blazor Component Patterns

### System Boundaries

#### Cascade Dropdown Implementation- **No Changes:** `appsettings.*.json`, secrets, requirement files (unless explicitly instructed)

**Pattern:** Automated cascade dropdowns with proper async timing- **Directory Limits:** No new roots outside `Workspaces/Copilot/` (except `.github/`)

- **Database:** SQL Server only (`AHHOME/KSESSIONS_DEV`), never LocalDB

```csharp- **Launch Protocol:** Use nc.ps1/ncb.ps1 for port management compliance

private string? SelectedAlbum

{---

    get => Model?.SelectedAlbum;

    set## Refactoring Patterns Library

    {

        if (Model != null && Model.SelectedAlbum != value)### Blazor Component Patterns

        {

            Model.SelectedAlbum = value;#### Cascade Dropdown Implementation

            InvokeAsync(async () => await OnAlbumChanged()); // Prevent timing issues**Pattern:** Automated cascade dropdowns with proper async timing

        }

    }```csharp

}private string? SelectedAlbum

```{

    get => Model?.SelectedAlbum;

**Requirements:**    set

- `InvokeAsync()` for async property setters    {

- Timeout mechanisms for auto-population (max 10 seconds)        if (Model != null && Model.SelectedAlbum != value)

- Clear dependent selections on parent changes        {

- `StateHasChanged()` after async operations            Model.SelectedAlbum = value;

            InvokeAsync(async () => await OnAlbumChanged()); // Prevent timing issues

#### Token-Based Auto-Population        }

**Pattern:** Sequential API calls with timeout handling    }

}

```csharp```

private async Task AutoPopulateSequence(string runId, string albumId, string categoryId, string sessionId)

{**Requirements:**

    var maxWait = 10; // 10 second timeout- `InvokeAsync()` for async property setters

    var waited = 0;- Timeout mechanisms for auto-population (max 10 seconds)

    while (Albums.Count == 0 && waited < maxWait)- Clear dependent selections on parent changes

    {- `StateHasChanged()` after async operations

        await Task.Delay(1000);

        waited++;#### Token-Based Auto-Population

    }**Pattern:** Sequential API calls with timeout handling

    // Sequential population with error handling...

}```csharp

```private async Task AutoPopulateSequence(string runId, string albumId, string categoryId, string sessionId)

{

**Requirements:**    var maxWait = 10; // 10 second timeout

- Timeout mechanisms (10 second max)    var waited = 0;

- Structured debug logging with RUN_ID    while (Albums.Count == 0 && waited < maxWait)

- Token validation before auto-population    {

- Fallback behavior for failures        await Task.Delay(1000);

        waited++;

#### Service Layer Integration    }

**Pattern:** Dedicated services for API complexity separation    // Sequential population with error handling...

}

```csharp```

@inject HostSessionService HostService

**Requirements:**

var albums = await HostService.LoadAlbumsAsync(Model.HostFriendlyToken);- Timeout mechanisms (10 second max)

```- Structured debug logging with RUN_ID

- Token validation before auto-population

**Requirements:**- Fallback behavior for failures

- Separate API logic from UI logic via service classes

- Services handle HTTP client configuration and errors#### Service Layer Integration

- Consistent logging patterns across layers**Pattern:** Dedicated services for API complexity separation

- Proper async/await throughout call chain

```csharp

### Testing Patterns@inject HostSessionService HostService



#### Playwright Lifecycle Managementvar albums = await HostService.LoadAlbumsAsync(Model.HostFriendlyToken);

**CRITICAL:** Independent application lifecycle management```



**Context Separation:****Requirements:**

- **Development:** nc.ps1/ncb.ps1 PowerShell scripts- Separate API logic from UI logic via service classes

- **Playwright:** webServer config with `PW_MODE=standalone`- Services handle HTTP client configuration and errors

- **Never mix:** Don't launch manually before Playwright tests- Consistent logging patterns across layers

- Proper async/await throughout call chain

```javascript

// playwright.config.cjs webServer configuration### Testing Patterns

webServer: {

  command: 'dotnet run --project SPA/NoorCanvas',#### Playwright Lifecycle Management

  port: 9091,**CRITICAL:** Independent application lifecycle management

  reuseExistingServer: !process.env.CI

}**Context Separation:**

```- **Development:** nc.ps1/ncb.ps1 PowerShell scripts

- **Playwright:** webServer config with `PW_MODE=standalone`

#### Component State Validation- **Never mix:** Don't launch manually before Playwright tests

**Pattern:** Comprehensive state transition testing

```javascript

**Test Coverage:**// playwright.config.cjs webServer configuration

- Cascade dropdown behavior (Album → Category → Session)webServer: {

- Auto-population from tokens  command: 'dotnet run --project SPA/NoorCanvas',

- Error handling and recovery scenarios  port: 9091,

- Button state transitions during async operations  reuseExistingServer: !process.env.CI

- Clipboard integration and URL generation}

```

### Architecture Patterns

#### Component State Validation

#### View Model Separation**Pattern:** Comprehensive state transition testing

**Pattern:** Dedicated ViewModels for complex forms

**Test Coverage:**

```csharp- Cascade dropdown behavior (Album → Category → Session)

public class HostSessionOpenerViewModel - Auto-population from tokens

{- Error handling and recovery scenarios

    public bool IsFormValid { get; set; }- Button state transitions during async operations

    public bool ValidateRequiredFields() => // validation logic- Clipboard integration and URL generation

}

### Architecture Patterns

private HostSessionOpenerViewModel Model { get; set; } = new();

```#### View Model Separation

**Pattern:** Dedicated ViewModels for complex forms

#### Error Handling Consistency

**Pattern:** Layered error messaging strategy```csharp

public class HostSessionOpenerViewModel 

**Requirements:**{

- Distinguish validation errors from system errors    public bool IsFormValid { get; set; }

- Provide specific user action guidance    public bool ValidateRequiredFields() => // validation logic

- Log technical details, show friendly messages}

- Reset error state during user interactions

private HostSessionOpenerViewModel Model { get; set; } = new();

### Performance Patterns```



#### Async Operation Management#### Error Handling Consistency

**Pattern:** Coordinated async operations to prevent races**Pattern:** Layered error messaging strategy



**Requirements:****Requirements:**

- Loading flags prevent concurrent operations- Distinguish validation errors from system errors

- Proper cleanup in finally blocks- Provide specific user action guidance

- Strategic `StateHasChanged()` usage- Log technical details, show friendly messages

- Handle disposal during async operations- Reset error state during user interactions



#### Memory Management### Performance Patterns

**Pattern:** Proper resource cleanup for long-running components

#### Async Operation Management

**Requirements:****Pattern:** Coordinated async operations to prevent races

- Clear collections when no longer needed

- Dispose event handlers and timers**Requirements:**

- Handle navigation gracefully- Loading flags prevent concurrent operations

- Structured logging for component lifecycle- Proper cleanup in finally blocks

- Strategic `StateHasChanged()` usage

### Documentation Patterns- Handle disposal during async operations



#### Architecture Document Synchronization#### Memory Management

**Pattern:** Post-refactor documentation maintenance**Pattern:** Proper resource cleanup for long-running components



**Update Requirements:****Requirements:**

- Document new service classes and responsibilities- Clear collections when no longer needed

- Update component dependencies and injection patterns- Dispose event handlers and timers

- Document new API endpoints or method signatures- Handle navigation gracefully

- Update integration patterns and workflows- Structured logging for component lifecycle

- Remove obsolete patterns from documentation
### Documentation Patterns

#### Architecture Document Synchronization
**Pattern:** Post-refactor documentation maintenance

**Update Requirements:**
- Document new service classes and responsibilities
- Update component dependencies and injection patterns
- Document new API endpoints or method signatures
- Update integration patterns and workflows
- Remove obsolete patterns from documentation
