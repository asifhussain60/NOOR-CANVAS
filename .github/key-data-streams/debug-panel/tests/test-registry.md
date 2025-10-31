# Test Registry: debug-panel

**Last Updated**: 2025-10-31  
**Status**: Tests Exist Externally  
**Reason**: Visual regression tests exist in Tests/UI/Visual/

## Test Suites

### External Test Files
| Test File | Location | Type | Status |
|-----------|----------|------|--------|
| debug-panel-percy.spec.ts | Tests/UI/Visual/ | Percy Visual | ✅ Active |
| verify-debug-panel-ui.spec.ts | Tests/UI/ | Playwright | ✅ Active |

## Test Execution Commands

### Run Percy Tests
```powershell
.\Scripts\run-debug-panel-percy-tests.ps1
```

### Run UI Tests
```powershell
npx playwright test Tests/UI/verify-debug-panel-ui.spec.ts --headed
```

## Test Coverage

- [x] Integration tests (Covered in Tests/UI/)
- [x] Visual regression tests (Percy snapshots)
- [x] Accessibility tests (Playwright accessibility checks)
- [ ] Unit tests (Not Applicable - UI component)
- [ ] E2E tests (Covered by integration tests)

## Notes

Debug panel has comprehensive test coverage in the main test suite. No duplication needed in this key's tests/ folder.
