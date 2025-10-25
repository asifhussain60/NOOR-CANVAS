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

---

## Notes

- All tests use Session 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
- Tests require app running at https://localhost:9091
- Orchestration scripts manage app lifecycle automatically
- Maximum 3 retry attempts per test phase
