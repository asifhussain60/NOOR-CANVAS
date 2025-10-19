# Test Registry - hcp-canvas

## Active Tests

### transcript-section-share-sanitization.spec.ts
- **Created**: 2025-10-19
- **Type**: Functional + Visual Regression (Percy)
- **Purpose**: Verify share buttons are removed from HTML before broadcasting to participants
- **Coverage**:
  - Share buttons visible in host view
  - Share buttons removed before participant broadcast
  - No "unsafe content" errors in participant view
  - Console error tracking (both host and participant)
  - Percy visual snapshots for regression detection
- **Test Data**: Session 212 (KJAHA99L participant / PQ9N5YWW host)
- **Execution**: `.github/prompts.keys/hcp-canvas/scripts/run-transcript-share-sanitization-test.ps1`
- **Status**: Active (not yet promoted)

## Test Execution History

### 2025-10-19 - Initial Creation
- Created test to validate HTML sanitization fix
- Added Percy visual regression for UI verification
- Included console error tracking for JavaScript validation
- Created orchestration script with app lifecycle management

## Archived Tests (Promoted to Production)

_No tests promoted yet_
