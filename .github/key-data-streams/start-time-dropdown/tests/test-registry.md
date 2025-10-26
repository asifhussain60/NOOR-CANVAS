# Test Registry: start-time-dropdown

Last Updated: 2025-10-26

---

## Test Suites

### Phase 5: Testing & Validation

| Test File | Scenario | Type | Status | Last Run | Pass/Fail |
|-----------|----------|------|--------|----------|-----------|
| start-time-dropdown.spec.ts | Display 38 time options | E2E | ⏳ Pending | - | - |
| start-time-dropdown.spec.ts | Auto-select nearest time | E2E | ⏳ Pending | - | - |
| start-time-dropdown.spec.ts | Manual time selection | E2E | ⏳ Pending | - | - |
| start-time-dropdown.spec.ts | Persist selection during form interaction | E2E | ⏳ Pending | - | - |
| start-time-dropdown-visual.spec.ts | Dropdown initial state | Visual | ⏳ Pending | - | - |
| start-time-dropdown-visual.spec.ts | Dropdown opened state | Visual | ⏳ Pending | - | - |
| start-time-dropdown-visual.spec.ts | Dropdown with selection | Visual | ⏳ Pending | - | - |

---

## Test Execution Commands

### Run All Tests
```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test start-time-dropdown.spec.ts start-time-dropdown-visual.spec.ts
```

### Run E2E Tests Only
```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test start-time-dropdown.spec.ts --headed
```

### Run Visual Regression Tests Only
```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tests\UI"
npx percy exec -- npx playwright test start-time-dropdown-visual.spec.ts
```

### Run Individual Test
```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test start-time-dropdown.spec.ts --grep "should display dropdown with 30-minute intervals" --headed
```

---

## Test Coverage

- [ ] Unit tests (time generation, nearest-time calculation)
- [x] Integration tests (N/A - UI-only change)
- [x] E2E tests (dropdown behavior, selection, persistence)
- [x] Visual regression tests (Percy snapshots)
- [ ] Accessibility tests (keyboard navigation, screen reader)

---

## Manual Testing Checklist

### Functional Tests
- [ ] Page loads with nearest time auto-selected
- [ ] Dropdown displays all 38 time options (5:00 AM - 11:30 PM)
- [ ] Selected time persists when changing other form fields
- [ ] Form validation passes with dropdown selection
- [ ] Session creation succeeds with dropdown time value
- [ ] Time value stored correctly in database

### Edge Cases
- [ ] Page load at 4:00 AM (before range) → selects 5:00 AM
- [ ] Page load at 11:59 PM (after range) → selects 11:30 PM
- [ ] Page load with token (auto-populate) → maintains auto-selected time
- [ ] Refresh page → nearest time recalculated

### Cross-Browser Testing
- [ ] Chrome/Edge: Dropdown styling consistent
- [ ] Firefox: Dropdown arrow appears correctly
- [ ] Safari: Option list displays properly

### Accessibility
- [ ] Tab key navigates to dropdown
- [ ] Arrow keys change selection
- [ ] Enter/Space opens dropdown
- [ ] Type-ahead works (press "5" jumps to 5:00 AM)
- [ ] Screen reader announces time options

---

## Test Results Summary

**Total Tests**: 7 (4 E2E + 3 Visual)  
**Passing**: 0  
**Failing**: 0  
**Pending**: 7  
**Coverage**: TBD%

---

## Notes

- Visual regression tests require Percy account and PERCY_TOKEN env variable
- E2E tests assume localhost:9090 (development server running)
- Manual accessibility testing with NVDA/JAWS recommended
- Edge case tests (4 AM, 11:59 PM) require time mocking or manual verification
