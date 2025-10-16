# css

**Status**: in-progress  
**Created**: 2025-10-16  
**Last Updated**: 2025-10-16

## Overview
Mobile CSS testing infrastructure for responsive design validation across SessionWaiting, UserLanding, and SessionCanvas views using Playwright device emulation and Percy visual regression.

## Key Information
- **Test Framework**: Playwright + Percy
- **Device Profiles**: iPhone SE (375x667), iPad (768x1024), Desktop (1280x720)
- **Percy Breakpoints**: 375px, 768px, 1280px
- **Test Session**: Session 212 (tokens: KJAHA99L user / PQ9N5YWW host)

## Mobile Testing Strategy

### Functional Testing (Playwright Device Emulation)
**Purpose**: Verify layout behavior and element visibility across device profiles

**Test Coverage**:
- **SessionWaiting.razor**:
  - Mobile: Logo sizing (175px), single-column participant grid, timer panel
  - Tablet: 2-column participant grid, session info panel
  - Desktop: 3-4 column participant grid, full layout

- **UserLanding.razor**:
  - Mobile: Logo sizing (175px), form panel padding, reduced font sizes
  - Tablet: Container width adjustments, form panel sizing
  - Desktop: Full 35rem max-width, 200px logo

- **SessionCanvas.razor**:
  - Mobile: Single column stacked layout, sidebar below canvas
  - Tablet: Grid layout transition, responsive sidebar
  - Desktop: Full 2-column grid, sidebar height constraints

### Visual Regression Testing (Percy)
**Purpose**: Pixel-perfect screenshot comparison across responsive breakpoints

**Percy Configuration**:
- Multi-viewport snapshots: 375px, 768px, 1280px
- CSS overrides to hide dynamic content (timers, SignalR status)
- Scoped snapshots for specific components (logos, forms, grids)

**Test Coverage**:
- Full page layout across all breakpoints
- Component-specific sizing (logos, forms, grids)
- Responsive transitions between mobile/tablet/desktop

## Files Created

### Test Specifications
1. **`Workspaces/TEMP/mobile-views-responsive.spec.ts`**
   - Functional tests with device emulation
   - Validates layout behavior and element visibility
   - Tests: SessionWaiting (3 tests), UserLanding (3 tests), SessionCanvas (3 tests)
   - ✅ **Status**: All 9 tests passed

2. **`Workspaces/TEMP/mobile-views-visual.spec.ts`**
   - Percy visual regression tests
   - Captures screenshots across responsive breakpoints
   - Tests: SessionWaiting (3 tests), UserLanding (3 tests), SessionCanvas (3 tests)
   - 📝 **Note**: Requires PERCY_TOKEN environment variable for Percy cloud upload

3. **`Workspaces/TEMP/mobile-views-screenshots.spec.ts`**
   - Screenshot capture for documentation
   - Saves full-page screenshots to `test-results/screenshots/`
   - Tests: 9 screenshots (3 views × 3 viewports)
   - ✅ **Status**: All 9 screenshots captured successfully

### Orchestration
4. **`Scripts/run-mobile-view-tests.ps1`**
   - PowerShell orchestration script
   - Automatic app lifecycle management
   - Supports functional, visual, or both test modes
   - Parameters: `-TestType`, `-Percy`, `-Headed`, `-KeepAppRunning`

### Percy CLI Installation
5. **Percy packages installed via npm**:
   - `@percy/cli` v1.31.4
   - `@percy/playwright`
   - Available via `npx percy` command

### Screenshots Captured
6. **`test-results/screenshots/`** (9 PNG files):
   - **SessionWaiting**: mobile-375px, tablet-768px, desktop-1280px
   - **UserLanding**: mobile-375px, tablet-768px, desktop-1280px
   - **SessionCanvas**: mobile-375px, tablet-768px, desktop-1280px

## Usage Examples

### Run All Tests (Functional + Visual)
```powershell
.\Scripts\run-mobile-view-tests.ps1
```

### Run Only Functional Tests (Headed Mode)
```powershell
.\Scripts\run-mobile-view-tests.ps1 -TestType functional -Headed
```

### Run Only Visual Tests (Percy)
```powershell
.\Scripts\run-mobile-view-tests.ps1 -Percy
```

### Keep App Running After Tests
```powershell
.\Scripts\run-mobile-view-tests.ps1 -KeepAppRunning
```

## Responsive Breakpoints

### Mobile (375px)
- **SessionWaiting**: Logo 175x175px, single-column participant grid, stacked panels
- **UserLanding**: Logo 175x175px, reduced title (1.5rem), compact form panel (1.5rem padding)
- **SessionCanvas**: Single column layout, stacked canvas and sidebar

### Tablet (768px)
- **SessionWaiting**: Logo 200x200px, 2-column participant grid, side-by-side panels
- **UserLanding**: Logo 200x200px, standard title (2.5rem), standard form panel (2rem padding)
- **SessionCanvas**: Grid layout transition, responsive sidebar visibility

### Desktop (1280px)
- **SessionWaiting**: Full layout, 3-4 column participant grid, all panels visible
- **UserLanding**: Full 35rem max-width container, 200x200px logo
- **SessionCanvas**: Full 2-column grid (2fr 1fr), sidebar with height constraints

## Key Learnings

### Device Emulation Best Practices
1. Use Playwright's built-in device profiles (`devices['iPhone SE']`, `devices['iPad']`)
2. Close browser contexts between tests to prevent state leakage
3. Wait for `networkidle` before capturing snapshots

### Percy Visual Testing
1. Use `percyCSS` to hide dynamic content (timers, status indicators)
2. Set appropriate `minHeight` for tall stacked layouts on mobile
3. Use `scope` parameter for component-specific snapshots
4. Always wait for animations to complete before snapshots

### Test Reliability
1. Wait for key elements to be visible before assertions
2. Add small timeouts after page load for SignalR connections
3. Use `waitForLoadState('networkidle')` for stable page state

## Validation

- **Build**: Clean (0 errors, 0 warnings)
- **Test Files**: TypeScript validated, no syntax errors
- **Orchestration Script**: PowerShell validated, parameter validation included

## Future Enhancements

### Additional Test Coverage
1. Add tests for HostLanding.razor and HostControlPanel.razor
2. Test landscape orientation on mobile devices
3. Test touch interactions and gesture controls

### Percy Enhancements
1. Add Percy comparisons for dark mode themes
2. Test hover states and focus indicators across viewports
3. Add accessibility snapshot testing (ARIA labels, contrast)

### Performance Testing
1. Add Lighthouse mobile performance tests
2. Test network throttling scenarios (3G, 4G)
3. Monitor CSS bundle size impact on mobile load times

## Related Keys
- **session-transcript-css**: CSS cleanup for session transcript styling
- **canvas**: SessionCanvas functionality and UI components
- **user-auth**: UserLanding authentication and registration

## Notes
- Tests are located in `Workspaces/TEMP/` for temporary/experimental work
- Production tests should be moved to `Tests/UI/` or `PlayWright/tests/`
- Percy requires `PERCY_TOKEN` environment variable for visual regression
- All tests use Session 212 as consistent test data
