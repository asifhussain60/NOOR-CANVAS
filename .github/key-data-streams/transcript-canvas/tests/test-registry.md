# Test Registry: transcript-canvas

**Last Updated**: 2025-10-31  
**Status**: Tests Exist Externally  
**Reason**: Visual regression tests exist in Tests/UI/Visual/

## Test Suites

### External Test Files
| Test File | Location | Type | Status |
|-----------|----------|------|--------|
| transcript-canvas-visual-tests.spec.ts | Tests/UI/Visual/ | Percy Visual | ✅ Active |
| verify-transcript-display.spec.ts | Tests/UI/ | Playwright | ✅ Active |

## Test Execution Commands

### Run Visual Tests
```powershell
.\Scripts\run-transcript-canvas-visual-tests.ps1
```

### Run Functional Tests
```powershell
npx playwright test Tests/UI/verify-transcript-display.spec.ts --headed
```

## Test Coverage

- [x] Integration tests (Covered in Tests/UI/)
- [x] Visual regression tests (Percy snapshots)
- [x] E2E tests (Covered by transcript workflow tests)
- [ ] Unit tests (Not Applicable - UI component)
- [ ] Accessibility tests (Recommended - add to existing tests)

## Notes

Transcript canvas has comprehensive test coverage in the main test suite. Visual regression tests via Percy ensure UI consistency. No duplication needed in this key's tests/ folder.
