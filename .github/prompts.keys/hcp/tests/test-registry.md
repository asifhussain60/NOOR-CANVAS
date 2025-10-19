# HCP Test Registry

## Active Tests

### hcp-session-controls-visual.spec.ts
- **Created**: 2025-10-19T02:30:00Z
- **Type**: Visual Regression (Percy)
- **Purpose**: Verify SESSION CONTROLS panel rendering, icon display, border styling, and collapse transition
- **Test Cases**:
  1. FontAwesome icons render correctly (no garbled Unicode)
  2. Session details panel has 2px solid #C5A84C border
  3. SESSION CONTROLS panel collapses smoothly when Start Session clicked
  4. No JavaScript errors in browser console
  5. Play icon renders correctly in Start Session button
- **Orchestration**: `.github/prompts.keys/hcp/scripts/run-hcp-session-controls-test.ps1`
- **Status**: Active (not yet promoted)

## Archived Tests
(None yet - tests will be moved here after production promotion)
