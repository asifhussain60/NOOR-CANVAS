# Test Registry: transcript-canvas

## Active Tests

### canvas-rendering-visual.spec.ts
- Created: 2025-10-18T16:15:00Z
- Type: Visual Regression (Percy + Playwright)
- Scenario: Verify TranscriptCanvas and SessionCanvas rendering matches expected HTML
- Test Cases:
  1. TranscriptCanvas - Full Page Layout
  2. SessionCanvas - Full Page with Sidebar
  3. TranscriptCanvas - Content Area Focus
  4. SessionCanvas - Q&A Sidebar Focus
  5. TranscriptCanvas - Responsive Layout (Mobile)
  6. SessionCanvas - Grid Layout Verification
- Test Data: Session 212 (Participant: KJAHA99L, Host: PQ9N5YWW)
- Status: Active
- Last Run: N/A (awaiting first execution)
- Orchestration: scripts/run-canvas-rendering-percy-tests.ps1
- Percy Dashboard: https://percy.io/NOOR-CANVAS/noor-canvas

### transcript-modal-submit-console.spec.ts
- Created: 2025-10-18T00:00:00Z
- Type: Functional E2E
- Scenario: Modal submit logs click and completion markers without console errors
- Status: Active
- Last Run: N/A (not yet executed)
- Orchestration: scripts/run-transcript-modal-submit-console-e2e-test.ps1

## Archived Tests (Promoted to Production)
