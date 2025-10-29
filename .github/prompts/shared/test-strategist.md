# Test Strategist Algorithm

**Purpose:** Generate comprehensive test strategy from plan

**Used by:** plan.prompt.md (Test Strategy section)

---

## Algorithm

**Input:** plan, complexity, affected_layers[]

**Output:** test_strategy { types[], scenarios[], coverage[], percy_points[] }

---

## Test Type Selection

**Based on affected layers:**

**UI Layer:**
- Percy visual regression (mandatory)
- E2E functional tests
- Component interaction tests
- Responsive design tests

**API Layer:**
- Unit tests (controllers)
- Integration tests (endpoints)
- Request/response validation
- Error handling tests

**Service Layer:**
- Unit tests (business logic)
- Mock data tests
- Exception handling
- Performance tests

**Database Layer:**
- Migration tests (up/down)
- Query performance tests
- Data integrity tests
- Constraint validation

**SignalR Layer:**
- Multi-client E2E tests
- Connection lifecycle tests
- Message broadcast tests
- Reconnection scenarios

---

## Test Scenario Generation

**From user stories:**
- Extract user actions
- Identify happy paths
- Find edge cases
- Note error conditions

**From requirements:**
- Functional requirements → functional tests
- UX requirements → visual tests
- Performance requirements → load tests
- Security requirements → penetration tests

---

## Percy Snapshot Strategy

**When to snapshot:**
- Initial component render
- After user interaction
- Different viewport sizes
- Different states (loading, error, success)
- Before/after animations

**Snapshot naming:**
- `{component}-{state}-{viewport}`
- `session-canvas-initial-desktop`
- `share-button-hover-mobile`
- `debug-panel-expanded-tablet`

**Viewports:**
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

---

## Coverage Requirements

**Critical paths:** 100%
- Core user flows
- Data operations
- Authentication/authorization
- Error handling

**New features:** 90%
- Feature functionality
- Edge cases
- Integration points
- UI interactions

**Bug fixes:** Regression test
- Reproduce bug scenario
- Verify fix works
- Test related scenarios
- Prevent recurrence

**Refactors:** Maintain existing
- Keep current coverage
- Update tests if API changes
- Add missing tests if found

---

## Test File Organization

```
Tests/
  UI/
    {key}-{scenario}.spec.ts
    {key}-percy-snapshots.spec.ts
  Integration/
    {key}-api-tests.spec.ts
  Unit/
    {component}Tests.cs
```

---

## Test Execution Order

**1. Unit Tests (fast, isolated)**
- Run first
- Quick feedback
- High volume

**2. Integration Tests (moderate speed)**
- Run after unit tests pass
- Test component interactions
- Moderate volume

**3. E2E Tests (slow, comprehensive)**
- Run after integration tests pass
- Test full user flows
- Lower volume

**4. Percy Visual Tests (slowest)**
- Run after E2E tests pass
- Visual regression detection
- Selective scenarios

---

## Example Test Strategy

```markdown
## Test Strategy

**Types:**
- E2E Functional: Share button click triggers broadcast
- Percy Visual: Button appearance across viewports
- Unit: ShareAssetHub message handling
- Integration: SignalR client-server communication

**Scenarios:**
1. Happy Path: User clicks share, asset broadcasts, receivers display
2. Edge Case: Share with no active receivers
3. Error: Share fails due to network issue
4. Multi-client: Simultaneous shares from multiple users

**Percy Snapshots (5):**
- session-canvas-share-button-initial-desktop
- session-canvas-share-button-hover-desktop
- session-canvas-share-button-initial-mobile
- receiver-asset-display-desktop
- receiver-asset-display-mobile

**Coverage:**
- SessionCanvas.razor: 95% (share button UI)
- ShareAssetHub.cs: 100% (broadcast logic)
- ReceiverView.razor: 90% (asset display)

**Execution:**
1. Unit tests (2 min)
2. E2E tests (5 min)
3. Percy tests (3 min)
Total: ~10 min
```

---

## See Also

- `../plan.prompt.md` - Test strategy integration
- `playwright-test-generation.md` - E2E test creation
- `test-orchestration-patterns.md` - Test execution
