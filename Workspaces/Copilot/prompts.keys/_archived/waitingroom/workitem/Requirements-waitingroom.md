# Waitingroom Key - Requirements

## Overview
Updates to the SessionWaiting.razor page to improve UI consistency, styling, and development tooling.

## Implementation Phases

### Phase 1: Logo Styling Consistency
- **Objective**: Apply same logo styling from UserLanding.razor to SessionWaiting.razor
- **Target**: Update logo container in SessionWaiting.razor 
- **Details**: Replace generic `logo-container` class with `noor-canvas-logo` class and inline styles matching UserLanding.razor implementation

### Phase 2: Session Info Panel Spacing
- **Objective**: Add 1.5rem margin-top to session info panel
- **Target**: `.session-info-panel` CSS class
- **Details**: Update margin from `0rem auto 3rem auto` to `1.5rem auto 3rem auto`

### Phase 3: Debug Panel Implementation
- **Objective**: Replace Test Panel with standardized DebugPanel component
- **Target**: Remove DevPanel, add DebugPanel matching UserLanding.razor pattern
- **Details**: 
  - Remove existing DevPanel with "Test Panel" title
  - Remove associated CSS classes (.test-button, .test-button:hover)
  - Add DebugPanel component with development-only visibility
  - Create HandleEnterTestData method that calls existing FloodParticipantList functionality
  - Move "Add 50 Random Participants" functionality into debug panel

## Technical Specifications

### Files Modified
- `d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Pages\SessionWaiting.razor`

### Dependencies
- DebugPanel component (already exists in NoorCanvas.Components.Development)
- IDevModeService for development mode detection
- Existing FloodParticipantList method for participant testing

### Success Criteria
- Logo styling matches UserLanding.razor exactly
- Session info panel has proper spacing with 1.5rem top margin
- Debug panel only appears in development mode
- "Add 50 Random Participants" functionality preserved in debug panel
- No compilation errors or analyzer violations
- Clean build without warnings related to changes

## Quality Gates
- .NET analyzers pass without warnings
- ESLint passes (existing baseline debt acceptable)
- Application builds successfully
- No runtime errors in development mode