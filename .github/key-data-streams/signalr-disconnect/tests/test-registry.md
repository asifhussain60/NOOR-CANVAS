# Test Registry: signalr-disconnect

**Last Updated**: 2025-10-31  
**Status**: Tests Recommended  
**Reason**: Bug fix - regression tests should exist

## Test Suites

### Recommended Tests
| Test Scenario | Type | Priority | Status |
|---------------|------|----------|--------|
| SignalR connection establishment | Integration | P0 | ⏳ Not Implemented |
| Graceful disconnection handling | Integration | P0 | ⏳ Not Implemented |
| Reconnection after disconnect | Integration | P1 | ⏳ Not Implemented |
| Connection state persistence | Integration | P2 | ⏳ Not Implemented |

## Test Execution Commands

### Recommended Implementation
```powershell
# E2E disconnect test
npx playwright test Tests/UI/signalr-disconnect.spec.ts --headed

# Integration test
dotnet test --filter "Category=SignalR"
```

## Test Coverage

- [ ] Integration tests (Recommended - connection management)
- [ ] E2E tests (Recommended - user-facing behavior)
- [ ] Unit tests (Optional - disconnect logic)
- [ ] Visual regression tests (Not Applicable)
- [ ] Accessibility tests (Not Applicable)

## Notes

**HIGH PRIORITY**: SignalR disconnects affect real-time collaboration. Regression tests should verify the fix prevents recurrence of the original issue.
