# Plan: hcp-refactor (Phase 2 - Architecture Refactoring)

**Key:** `hcp-refactor`  
**Created:** 2025-10-29  
**Type:** Architecture Refactoring  
**Status:** 🟡 In Progress  
**Phase:** 2 of 2 (Phase 1 = UI enhancements in hcp-refactor-phase1)

---

## Overview

**Objective:** Refactor HostControlPanel.razor from monolithic component to service-oriented architecture with clear separation of concerns, eliminating duplication and performance inefficiencies.

**Scope:** Architecture, Infrastructure, Duplication, Performance  
**Approach:** Phased refactoring with continuous validation  
**Baseline:** Phase 1 work (UI enhancements) in `hcp-refactor-phase1` KDS

---

## Current State Assessment

### File Metrics
- **Total Lines:** 5,170 lines
- **Embedded JavaScript:** 832 lines
- **Debug Markers:** 476 (preserved per development mandate)
- **Service Dependencies:** 12+ injected services
- **Component Extraction:** Partial (4 components extracted in Phase 1)
- **State Management:** Scattered (30+ properties)

### Architecture Issues
- SignalR logic embedded in UI component (800+ lines)
- No service layer for business logic
- Direct DOM manipulation via JSInterop
- Inline event handlers creating allocations
- Missing async patterns (blocking UI thread)

### Duplication Detected
1. **Transcript Parsing** - 3 separate implementations
2. **SignalR Connection** - 2 duplicate handler setups
3. **Timer Logic** - 4 similar methods (start/stop/reset/update)
4. **Error Handling** - Inconsistent patterns across methods

### Performance Inefficiencies
- 40+ redundant `StateHasChanged()` calls
- 15+ direct DOM manipulations
- 25+ lambda closures in event handlers
- 8 synchronous methods blocking UI

### Health Score
- **Current:** 6.5/10
- **Target:** 8.5/10
- **Expected Improvement:** +2.0 points

---

## Phase 2 Implementation Plan

### Phase 1: Service Extraction (Architecture) 🏗️

**Objective:** Extract business logic from UI component to dedicated services

**Tasks:**
1. Create `TranscriptProcessingService.cs`
   - Consolidate 3 parsing patterns
   - Methods: `ParseSections()`, `TransformHtml()`, `ValidateStructure()`
   - Location: `SPA/NoorCanvas/Services/TranscriptProcessingService.cs`

2. Create `SignalRStateService.cs`
   - Centralize connection state management
   - Extract 800 lines from component
   - Methods: `InitializeConnection()`, `RegisterHandlers()`, `ValidateHealth()`
   - Location: `SPA/NoorCanvas/Services/SignalRStateService.cs`

3. Create `TimerStateService.cs`
   - Consolidate 4 timer methods
   - Methods: `Start()`, `Stop()`, `Reset()`, `GetElapsed()`
   - Event-driven updates (no polling)
   - Location: `SPA/NoorCanvas/Services/TimerStateService.cs`

4. Update `HostControlPanel.razor`
   - Replace inline logic with service calls
   - Reduce component to presentation layer only
   - Subscribe to service events for state updates

**Files Created:** 3 services  
**Files Modified:** `HostControlPanel.razor`  
**LOC Impact:** ~1,200 lines moved to services

**Validation:**
```powershell
dotnet build --no-incremental
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
```

**Success Criteria:**
- Build: 0 errors, 0 warnings
- Tests: All baseline tests pass
- Functionality: SignalR, timer, transcript unchanged
- Architecture: Clear service/UI separation

**Commit:** `refactor(hcp): Phase 1 - Extract services (architecture separation)`

---

### Phase 2: SignalR Middleware (Infrastructure) 🔌

**Objective:** Centralize SignalR connection management with proper infrastructure

**Tasks:**
1. Create `SignalRMiddleware.cs`
   - Connection lifecycle management
   - Automatic reconnection logic (exponential backoff)
   - Health monitoring (heartbeat every 30s)
   - Location: `SPA/NoorCanvas/Middleware/SignalRMiddleware.cs`

2. Create `HubConnectionFactory.cs`
   - DI-friendly hub creation
   - Connection pooling
   - Configuration from appsettings
   - Location: `SPA/NoorCanvas/Factories/HubConnectionFactory.cs`

3. Update `Program.cs`
   - Register middleware in DI container
   - Configure SignalR options
   - Add connection health check endpoint

4. Update `HostControlPanel.razor`
   - Remove inline SignalR setup (400+ lines)
   - Inject `SignalRMiddleware` instead
   - Use factory for hub connections

**Files Created:** 2 infrastructure classes  
**Files Modified:** `Program.cs`, `HostControlPanel.razor`  
**LOC Impact:** ~400 lines moved to middleware

**Validation:**
```powershell
dotnet build
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
# Manual: Verify SignalR reconnection after network interruption
```

**Success Criteria:**
- SignalR connection stable
- Automatic reconnection works
- Health endpoint responds
- No connection leaks

**Commit:** `refactor(hcp): Phase 2 - SignalR middleware infrastructure`

---

### Phase 3: Duplication Elimination 🔄

**Objective:** Remove all duplicate code patterns

**Duplicate Patterns:**

1. **Transcript Parsing (3 instances)**
   - `BroadcastFullTranscript()` - Lines ~1200-1285
   - `ProcessTranscript()` - Lines ~850-915
   - `ParseTranscriptSections()` - Lines ~1450-1510
   - **Action:** Consolidate → `TranscriptProcessingService.ParseSections()`

2. **SignalR Handler Setup (2 instances)**
   - `OnInitializedAsync()` hub setup - Lines ~200-280
   - `ReconnectSignalR()` - Lines ~1850-1920
   - **Action:** Consolidate → `SignalRMiddleware.EnsureConnected()`

3. **Timer Methods (4 instances)**
   - `StartTimer()`, `StopTimer()`, `ResetTimer()`, `UpdateTimerDisplay()`
   - **Action:** Already addressed in Phase 1 (`TimerStateService`)

4. **Error Handling (inconsistent patterns)**
   - Mix of try-catch, null checks, logging styles
   - **Action:** Standardize → single `HandleError(Exception ex, string context)` method

**Tasks:**
1. Replace all transcript parsing calls with service
2. Remove duplicate SignalR connection code
3. Consolidate error handling patterns
4. Remove redundant null checks (rely on service guarantees)
5. Standardize logging format across all methods

**Files Modified:** `HostControlPanel.razor`, 3 services  
**LOC Impact:** ~600 lines removed

**Validation:**
```powershell
dotnet build
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
# Code review: Verify no duplicate patterns remain
```

**Success Criteria:**
- Each pattern has single implementation
- Error handling consistent
- Logging format uniform
- Code coverage maintained

**Commit:** `refactor(hcp): Phase 3 - Eliminate duplication patterns`

---

### Phase 4: JavaScript Modularization (Infrastructure) 📦

**Objective:** Extract 832 lines of embedded JavaScript to proper modules

**Current Embedded JS:**
- Timer manipulation logic (~200 lines)
- SignalR client setup (~350 lines)
- DOM manipulation utilities (~150 lines)
- Animation helpers (~132 lines)

**Tasks:**
1. Create `hcp-timer.js`
   - Timer start/stop/reset logic
   - Display formatting
   - Location: `wwwroot/js/modules/hcp-timer.js`

2. Create `hcp-signalr.js`
   - SignalR client initialization
   - Handler registration
   - Reconnection UI feedback
   - Location: `wwwroot/js/modules/hcp-signalr.js`

3. Create `hcp-animations.js`
   - Panel slide animations
   - Button hover effects
   - Loading spinners
   - Location: `wwwroot/js/modules/hcp-animations.js`

4. Create `hcp-dom-utils.js`
   - Element queries
   - Class manipulation
   - Scroll utilities
   - Location: `wwwroot/js/modules/hcp-dom-utils.js`

5. Create `HCPJavaScriptService.cs`
   - C# wrapper for JS modules
   - Strongly-typed JS interop
   - Module lifecycle management
   - Location: `SPA/NoorCanvas/Services/HCPJavaScriptService.cs`

6. Update `HostControlPanel.razor`
   - Replace `IJSRuntime.InvokeAsync()` with service calls
   - Remove all embedded `<script>` blocks
   - Import modules in `OnAfterRenderAsync()`

**Files Created:** 4 JS modules, 1 C# service  
**Files Modified:** `HostControlPanel.razor`  
**LOC Impact:** 832 lines → modular JS

**Validation:**
```powershell
dotnet build
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
# Manual: Verify timer, animations, SignalR UI feedback
```

**Success Criteria:**
- Zero embedded JS in component
- All modules load correctly
- Timer accuracy maintained
- Animations smooth

**Commit:** `refactor(hcp): Phase 4 - JavaScript modularization`

---

### Phase 5: Performance Optimization ⚡

**Objective:** Remove performance bottlenecks and inefficiencies

**Inefficiencies Identified:**

1. **Redundant State Checks (40+ instances)**
   - Unnecessary `StateHasChanged()` calls
   - Blazor handles most automatically
   - **Action:** Remove all except after async service calls

2. **Direct DOM Manipulation (15+ instances)**
   - `IJSRuntime.InvokeAsync("document.getElementById")`
   - **Action:** Replace with Blazor `@ref` + CSS classes

3. **Inline Event Handlers (25+ instances)**
   - Lambda closures in `@onclick` (allocations)
   - **Action:** Extract to named methods

4. **Missing Async Patterns (8 instances)**
   - Synchronous methods blocking UI
   - **Action:** Convert to async (e.g., `LoadSession()` → `LoadSessionAsync()`)

5. **No Caching**
   - Transcript re-parsed on every share
   - **Action:** Add caching to `TranscriptProcessingService`

6. **Missing Disposal**
   - No `IAsyncDisposable` implementation
   - **Action:** Properly dispose timers, SignalR, subscriptions

**Tasks:**
1. Audit and remove redundant `StateHasChanged()` calls
2. Replace DOM manipulation with `@ref` + CSS
3. Extract all lambda event handlers to named methods
4. Convert 8 sync methods to async
5. Implement caching in `TranscriptProcessingService`
6. Implement `IAsyncDisposable` on component
7. Add memory profiling validation

**Files Modified:** `HostControlPanel.razor`, 3 services  
**LOC Impact:** ~200 lines simplified

**Validation:**
```powershell
dotnet build
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
# Performance: Measure render time before/after
# Memory: Check for leaks with dotnet-counters
```

**Success Criteria:**
- Render time improved ≥20%
- No memory leaks detected
- Timer accuracy ±10ms
- Smooth UI interactions

**Commit:** `refactor(hcp): Phase 5 - Performance optimization`

---

### Phase 6: Component Decomposition (Architecture) 🧩

**Objective:** Further decompose monolithic component

**Already Extracted (Phase 1):**
- `HostControlPanelHeader.razor`
- `HostControlPanelSidebar.razor`
- `HostControlPanelContent.razor`
- `HostControlPanelModal.razor`
- `QuestionCard.razor`
- `UserRegistrationLink.razor`

**Additional Extraction:**

1. **HCPTimerComponent.razor**
   - Timer display and controls
   - Uses `TimerStateService` from Phase 1
   - Props: `SessionStartTime`
   - Events: `OnTimerUpdate`

2. **HCPQuestionPanel.razor**
   - Question list and filtering
   - Live count badge
   - Props: `Questions`, `SelectedQuestionId`
   - Events: `OnQuestionClick`, `OnDeleteClick`

3. **HCPParticipantList.razor**
   - Participant display
   - Online/offline status
   - Props: `Participants`
   - Events: `OnParticipantClick`

4. **HCPSessionControls.razor**
   - Start/Stop/Share buttons
   - Session state management
   - Props: `SessionStatus`, `CanvasType`
   - Events: `OnStartSession`, `OnEndSession`, `OnBroadcast`

5. **HCPErrorBanner.razor**
   - Error display component
   - Replace existing `ErrorDisplay`
   - Props: `ErrorMessage`, `ErrorType`
   - Events: `OnDismiss`

**Tasks:**
1. Create 5 child components
2. Move logic from parent to children
3. Define clear prop/event contracts
4. Update parent component to use children
5. Add component-level tests

**Files Created:** 5 components  
**Files Modified:** `HostControlPanel.razor`  
**LOC Impact:** ~800 lines → child components

**Validation:**
```powershell
dotnet build
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
# Visual: Percy snapshots (no UI changes)
```

**Success Criteria:**
- Parent component ≤1,500 lines
- Each child ≤200 lines
- Clear component boundaries
- Visual regression tests pass

**Commit:** `refactor(hcp): Phase 6 - Component decomposition complete`

---

## Expected Outcomes

### Metrics Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **File Size** | 5,170 lines | ~1,800 lines | 65% reduction |
| **Architecture** | Monolithic | Service-oriented | ✅ Separated |
| **Services** | 0 (logic in UI) | 6 new services | ✅ Layered |
| **Embedded JS** | 832 lines | 0 lines | 100% modular |
| **Duplication** | 3 parsing, 2 SignalR, 4 timer | 1 each | 67% reduction |
| **Components** | 6 (from Phase 1) | 11 total | ✅ Decomposed |
| **State Checks** | 40+ redundant | ~10 necessary | 75% reduction |
| **DOM Calls** | 15 direct | 0 (CSS only) | 100% eliminated |
| **Performance** | Baseline | +20% faster | ⚡ Optimized |
| **Health Score** | 6.5/10 | 8.5/10 | +2.0 points |

### Architecture Improvements

**Before:**
```
HostControlPanel.razor (5,170 lines)
├─ UI Logic (mixed)
├─ Business Logic (mixed)
├─ SignalR Logic (800 lines)
├─ JavaScript (832 lines)
└─ State Management (scattered)
```

**After:**
```
HostControlPanel.razor (~1,800 lines)
├─ Child Components (5 new)
│   ├─ HCPTimerComponent
│   ├─ HCPQuestionPanel
│   ├─ HCPParticipantList
│   ├─ HCPSessionControls
│   └─ HCPErrorBanner
├─ Services (6 new)
│   ├─ TranscriptProcessingService
│   ├─ SignalRStateService
│   ├─ TimerStateService
│   ├─ HCPJavaScriptService
│   ├─ SignalRMiddleware
│   └─ HubConnectionFactory
└─ JavaScript Modules (4 files)
    ├─ hcp-timer.js
    ├─ hcp-signalr.js
    ├─ hcp-animations.js
    └─ hcp-dom-utils.js
```

---

## Continuous Validation Strategy

### Before Each Phase
```powershell
# Create checkpoint
git add -A
git commit -m "checkpoint: pre-refactor hcp phase-{N}"

# Run baseline tests
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1
```

### After Each Phase
```powershell
# Validate build
dotnet build --no-incremental

# Run tests
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-baseline-test.ps1

# If failures (max 3 retries), rollback
git reset --hard HEAD~1
```

### Test Coverage
- **Phase 1:** Service functionality (unit tests)
- **Phase 2:** SignalR connection stability
- **Phase 3:** Code coverage maintained
- **Phase 4:** JavaScript module loading
- **Phase 5:** Performance benchmarks
- **Phase 6:** Visual regression (Percy)

---

## Rollback Strategy

### Phase-Level Rollback
```powershell
# Manual rollback to checkpoint
git reset --hard {checkpoint-commit-hash}
git push origin development --force-with-lease
```

### Automated Rollback
```powershell
# Use global rollback script
.\Workspaces\Global\rollback.ps1 -Key hcp-refactor -Agent refactor
```

### Rollback Triggers
- Build errors after 3 fix attempts
- Test failures after 3 fix attempts  
- Performance regressions >10%
- Memory leaks detected
- Visual regressions detected

---

## Dependencies

### Phase 1 KDS (Completed)
- `hcp-refactor-phase1` (renamed from `hcp`)
- Component extraction (6 components)
- UI enhancements (FAB button, timer, collapsible panel)
- Test infrastructure (10+ tests, 3 scripts)

### External Dependencies
- Blazor Server (.NET 8)
- SignalR Core
- AngleSharp (HTML parsing)
- System.Text.Json
- Playwright (testing)
- Percy (visual regression)

### Service Dependencies
- Existing services preserved:
  - `SessionStateService`
  - `AssetProcessingService`
  - `SafeHtmlRenderingService`
  - `UnifiedHtmlTransformService`
  - And 16+ others

---

## Risk Assessment

### High Risk
- **SignalR Middleware** - Connection stability critical
  - Mitigation: Extensive reconnection testing
  - Rollback: Keep inline setup until validated

### Medium Risk
- **JavaScript Modularization** - Browser compatibility
  - Mitigation: ES6 module support detection
  - Rollback: Fallback to embedded JS

### Low Risk
- **Service Extraction** - Well-isolated logic
- **Duplication Elimination** - No behavior changes
- **Performance Optimization** - Measurable improvements

---

## Success Criteria

### Technical
- ✅ Build: 0 errors, 0 warnings
- ✅ Tests: 100% baseline tests pass
- ✅ Performance: ≥20% render time improvement
- ✅ Architecture: Service/UI separation complete
- ✅ Code Quality: Health score 8.5/10
- ✅ Memory: No leaks detected

### Functional
- ✅ SignalR connection stable
- ✅ Timer accuracy maintained
- ✅ Transcript sharing works
- ✅ Question panel functional
- ✅ Session controls operational
- ✅ Error handling consistent

### Maintenance
- ✅ Component size ≤200 lines
- ✅ Service size ≤300 lines
- ✅ No duplication detected
- ✅ Clear separation of concerns
- ✅ Testable architecture

---

## Timeline

**Estimated Duration:** 6-8 hours total

- **Phase 1 (Service Extraction):** 1.5 hours
- **Phase 2 (SignalR Middleware):** 2 hours
- **Phase 3 (Duplication Elimination):** 1 hour
- **Phase 4 (JavaScript Modularization):** 1.5 hours
- **Phase 5 (Performance Optimization):** 1 hour
- **Phase 6 (Component Decomposition):** 1.5 hours
- **Validation & Documentation:** 1 hour

---

## Documentation Updates

### Files to Update
- ✅ This plan (`hcp-refactor.plan.md`)
- ✅ Work log (`work-log.md`)
- ✅ README (`README.md`)
- `.github/instructions/Links/NOOR-CANVAS_ARCHITECTURE.MD`
- `.github/instructions/Links/SystemIndex.md` (sync agent will update)

### New Documentation
- Service API contracts
- JavaScript module documentation
- Component usage examples
- Performance benchmarks

---

## Related Work

### Phase 1 (Completed)
- Key: `hcp-refactor-phase1` (formerly `hcp`)
- UI enhancements complete
- Component extraction complete
- Test infrastructure established

### Complementary Refactoring
- `SessionCanvas.razor` - Similar architecture issues
- `TranscriptCanvas.razor` - Shared transcript processing
- `DebugPanel.razor` - Component pattern alignment

---

## Metadata

**Key:** `hcp-refactor`  
**Phase:** 2 of 2  
**Type:** Architecture Refactoring  
**Status:** 🟡 In Progress  
**Created:** 2025-10-29  
**Owner:** GitHub Copilot  
**Baseline:** hcp-refactor-phase1 KDS  
**Agent:** refactor.prompt.md

---

*Document-first protocol: Plan created before execution*
