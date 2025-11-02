# Test Registry for hcp

**Key**: hcp (Host Control Panel Collapsible Panel)  
**Created**: 2025-10-22  
**Purpose**: Track all tests generated for the collapsible Questions+Participants panel feature

---

## Test Inventory

### hcp-collapsible-panel-phase1.spec.ts
- **Created**: 2025-10-22
- **Type**: E2E Functional (Playwright)
- **Scenario**: Validate toggle button and panel visibility
- **Phase**: Phase 1 - UI/State Basics
- **Status**: Active
- **Last Run**: Not yet executed
- **Orchestration**: scripts/run-hcp-phase1-test.ps1
- **Coverage**:
  - Toggle button exists and is accessible
  - Initial state: panel hidden, badge shows question count
  - Click toggle: panel becomes visible
  - Click again: panel hides
  - Keyboard navigation (Space/Enter)
  - ARIA attributes present

### hcp-timer-integration.spec.ts ⭐ NEW
- **Created**: 2025-10-29
- **Type**: E2E Functional (Playwright) - Test-First Development
- **Scenario**: Timer Service Integration Tests
- **Phase**: Phase 1 - Service Extraction (TimerStateService)
- **Status**: **FAILING (Expected)** - Tests written BEFORE refactoring
- **Orchestration**: scripts/run-hcp-timer-test.ps1
- **Coverage**:
  - TimerStateService subscription on initialization
  - Timer starts when session becomes Active
  - Timer displays elapsed time in HH:mm:ss format
  - Timer updates every second (UI refresh)
  - Timer persists across UI state changes
  - Timer uses TimerStateService.ElapsedFormatted
  - sessionStartTime set correctly
  - Timer cleanup on disposal
  - Timer stops when session ends
- **Test Count**: 10 tests (T1-T10)

---

## Test Execution Commands

### Run Phase 1 Test
```powershell
.\. github\prompts.keys\hcp\scripts\run-hcp-phase1-test.ps1
```

### Run Phase 1 Test (Headed Mode)
```powershell
.\.github\prompts.keys\hcp\scripts\run-hcp-phase1-test.ps1 -Headed
```

### Run Timer Integration Tests (NEW)
```powershell
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-timer-test.ps1
```

### Run Timer Tests (Headed Mode)
```powershell
.\.github\key-data-streams\hcp-refactor-phase1\scripts\run-hcp-timer-test.ps1 -Headed
```

---

## Notes

- All tests use Session 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
- Tests require app running at https://localhost:9091
- Orchestration scripts manage app lifecycle automatically
- Maximum 3 retry attempts per test phase
