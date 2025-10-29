# hcp.plan.md — Collapsible Questions+Participants Panel in Host Control Panel

**Key**: hcp  
**Created**: 2025-10-22  
**Status**: Ready for execution

## Overview
Make Questions+Participants panel collapsible on the right in Host Control Panel. Toggle button shows badge with total questions count. Panel slides in from right (RTL animation). Maximize transcript width when collapsed.

## Execution Model
- User says "proceed" → Copilot executes all phases sequentially
- Each phase: implement → test → validate (max 3 fix attempts) → next phase
- Testing discontinued after 3 failed attempts; report failure and stop
- No user intervention required between phases

## Affected Files
- Primary: `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- Supporting: Shared CSS/layout files as needed
- Optional: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` (container sizing only)

---

## Phase 1: UI/State Basics

### Implementation Context
Add collapsible right-side panel container for Questions+Participants. Add toggle button with live-updating badge showing total questions count. Default state: collapsed.

### Ready-to-paste prompt:
```
@task key:hcp-phase1 
  title:"Add collapsible panel container and toggle button with badge"
  scope:HostControlPanel.razor
  acceptance:[
    - Right-side panel container wrapping Questions+Participants sections
    - Toggle button positioned appropriately with icon/text
    - Badge element on toggle showing question count (initially "0")
    - Local component state: panelOpen (boolean, default false)
    - Panel visibility controlled by panelOpen state
    - Toggle button onclick flips panelOpen state
  ]
  constraints:[
    - No CSS transitions yet (Phase 2)
    - Badge shows static count for now (wired in Phase 3)
    - Keep existing functionality intact
  ]
  implementation_notes:[
    - Use Blazor @code block for panelOpen state
    - Panel content: wrap existing Questions and Participants markup
    - Toggle: button with aria-expanded, aria-controls
    - Badge: span with count value
  ]
  validation:[
    - Build succeeds (dotnet build)
    - Panel toggles visibility on button click
    - No console errors
  ]
```

### Test Generation:
```
@test-generation key:hcp-phase1
  subject:HostControlPanel toggle button and panel visibility
  test_types:[e2e]
  frameworks:[Playwright]
  coverage:[
    - Toggle button exists and is accessible
    - Initial state: panel hidden, badge shows "0"
    - Click toggle: panel becomes visible
    - Click again: panel hides
  ]
  test_location:Tests/UI/hcp-collapsible-panel-phase1.spec.ts
  retry_policy:3_attempts_max
```

### Exit Criteria
- [x] Build passes
- [x] Playwright test passes (max 3 attempts)
- [x] Panel toggles on/off
- [x] Badge element present

---

## Phase 2: Layout and Animation

### Implementation Context
Add responsive layout with smooth CSS transitions. Transcript region resizes when panel toggles. Panel slides in from right. Support mobile/tablet/desktop breakpoints.

### Ready-to-paste prompt:
```
@task key:hcp-phase2
  title:"Add responsive layout and smooth animations"
  scope:HostControlPanel.razor,shared CSS
  acceptance:[
    - CSS transitions for panel width/transform (200-300ms)
    - Panel slides from right edge using transform: translateX()
    - Transcript region width adjusts smoothly via flex/grid
    - Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
    - prefers-reduced-motion: disable/reduce animations
    - No cumulative layout shift (CLS-friendly)
  ]
  constraints:[
    - Use CSS transitions, not JavaScript animations
    - Panel overlay on mobile, side-by-side on desktop
  ]
  implementation_notes:[
    - Add CSS class: .panel-container with transition properties
    - Transcript container: flex-grow/shrink based on panel state
    - Use @media queries for breakpoints
    - Add @media (prefers-reduced-motion: reduce) rules
  ]
  validation:[
    - Smooth animation at 60fps (visual check)
    - No layout jump during transition
    - Reduced motion honored
  ]
```

### Test Generation:
```
@test-generation key:hcp-phase2
  subject:Panel animation and responsive layout
  test_types:[e2e,visual]
  frameworks:[Playwright,Percy]
  coverage:[
    - Animation completes within 300ms
    - Transcript width changes smoothly
    - Percy snapshots: desktop (panel open/closed), tablet, mobile
    - Reduced motion: transitions disabled
  ]
  test_location:Tests/UI/hcp-collapsible-panel-phase2.spec.ts
  retry_policy:3_attempts_max
```

### Exit Criteria
- [x] Build passes
- [x] Playwright test passes (max 3 attempts)
- [x] Percy snapshots approved
- [x] Animations smooth, no layout shift

---

## Phase 3: Data and Accessibility

### Implementation Context
Wire badge to live total questions count from existing API/SignalR. Add keyboard navigation and ARIA attributes. Ensure focus management.

### Ready-to-paste prompt:
```
@task key:hcp-phase3
  title:"Wire live question count and add accessibility"
  scope:HostControlPanel.razor
  acceptance:[
    - Badge displays real-time total questions count
    - Subscribe to existing question events/API
    - Keyboard: Space/Enter on toggle button works
    - ARIA: aria-expanded on button, aria-label on badge, aria-controls linking button to panel
    - Focus management: toggle button retains focus after activation
    - Screen reader announces panel state changes
  ]
  constraints:[
    - Use existing API/SignalR patterns (no new endpoints)
    - No DbContext injection in UI layer
  ]
  implementation_notes:[
    - Inject existing service/hub for question count
    - OnInitializedAsync: load initial count
    - Subscribe to question added/removed events
    - Update badge value on state change
    - Add @onkeydown handler for Space/Enter
  ]
  validation:[
    - Badge shows correct count
    - Count updates when question added (test with mock event)
    - Keyboard navigation works
    - Screen reader announces correctly
  ]
```

### Test Generation:
```
@test-generation key:hcp-phase3
  subject:Live badge updates and keyboard accessibility
  test_types:[e2e,a11y]
  frameworks:[Playwright,axe-core]
  coverage:[
    - Badge reflects initial question count
    - Add question via API: badge increments
    - Keyboard: Space and Enter toggle panel
    - Axe-core scan: no critical/serious violations
    - Focus remains on toggle after activation
  ]
  test_location:Tests/UI/hcp-collapsible-panel-phase3.spec.ts
  retry_policy:3_attempts_max
```

### Exit Criteria
- [x] Build passes
- [x] Playwright test passes (max 3 attempts)
- [x] Badge shows live count
- [x] Keyboard accessible, no a11y violations

---

## Phase 4: Final Tests and Health Check

### Implementation Context
Comprehensive e2e tests, Percy visual regression across all states/breakpoints, final healthcheck (build, lint, all tests).

### Ready-to-paste prompt:
```
@task key:hcp-phase4
  title:"Final testing and validation"
  scope:All hcp changes
  acceptance:[
    - All previous phase tests pass
    - Percy snapshots: all breakpoints, all states (collapsed/expanded, badge values 0/1/10)
    - Edge cases: no questions, many questions, rapid toggling
    - No regressions to existing HCP functionality
    - Build clean, no new warnings/errors
  ]
  implementation_notes:[
    - Run full test suite
    - Generate Percy baseline for future comparisons
    - Manual smoke test: toggle on desktop and mobile
  ]
  validation:[
    - dotnet build --no-incremental: success
    - npm run lint: no new errors
    - All Playwright tests pass
    - Percy visual diff: approved
  ]
```

### Test Generation:
```
@test-generation key:hcp-phase4
  subject:Full integration and regression testing
  test_types:[e2e,visual,regression]
  frameworks:[Playwright,Percy]
  coverage:[
    - Happy path: full user flow with toggle, questions, badge updates
    - Edge cases: zero questions, 100+ questions, rapid clicking
    - Regression: existing HCP features still work
    - Percy: comprehensive snapshots (6+ variants)
  ]
  test_location:Tests/UI/hcp-collapsible-panel-final.spec.ts
  retry_policy:3_attempts_max
```

### Healthcheck:
```
@healthcheck
  pre_flight:[build, lint_baseline]
  post_implementation:[build, lint, playwright_tests, percy_snapshots]
  report_format:summary
```

### Exit Criteria
- [x] All tests pass
- [x] Percy approved
- [x] Build clean
- [x] No regressions

---

## Failure Handling

**Per-phase retry policy**:
1. Test fails → analyze error
2. Apply fix (implementation or test adjustment)
3. Retry test
4. Repeat up to 3 total attempts
5. After 3 failed attempts: STOP, report failure with:
   - Phase number
   - Test failure details
   - Last error message
   - Attempted fixes
   - Recommendation for manual intervention

**Phase gate**: Each phase must fully pass before proceeding to next phase.

---

## Completion Summary Template

After all phases complete, generate:

```
## 📌 Summary for You — AFTER IMPLEMENTATION

1) Work Requested (key: hcp)
- Collapsible Questions+Participants panel in Host Control Panel with toggle badge

2) Tasks completed:
- [x] Phase 1: UI/State basics (panel container, toggle, badge)
- [x] Phase 2: Layout and animation (responsive, smooth transitions)
- [x] Phase 3: Data and accessibility (live count, keyboard, ARIA)
- [x] Phase 4: Final tests and healthcheck

3) Next step recommendations:
- Optional: Persist panel state per session in localStorage
- Optional: Add subtle shadow/divider when panel open
- Deploy to staging for user acceptance testing

4) What would you like to do next?
- [ ] Run additional healthcheck validation (specify scope)
- [ ] Review implementation details (open HostControlPanel.razor)
- [ ] Generate conventional commit message (@commit)
- [ ] Deploy to staging environment (ncdeploy workflow)
- [ ] Add enhancement (persist state / shadow effect)

(See <attachments> above for file contents. You may not need to search or read the file again.)
```

---

## User Command

**To execute this plan**: Simply say "proceed" and Copilot will execute all 4 phases sequentially with automatic testing and retry logic.
