# css

**Status**: in-progress  
**Created**: 2025-10-16  
**Last Updated**: 2025-10-16T07:10:00Z

## Overview
Mobile CSS testing infrastructure with comprehensive device coverage (portrait/landscape orientations) for responsive design validation across SessionWaiting, UserLanding, and SessionCanvas views using Playwright device emulation and Percy visual regression.

## Key Information
- **Test Framework**: Playwright + Percy
- **Device Coverage**: iPhone, iPhone Pro, Android, iPad, iPad Pro (portrait & landscape) + Desktop
- **Total Viewports**: 11 (5 portrait, 5 landscape, 1 desktop)
- **Percy Breakpoints**: 360px, 375px, 390px, 667px, 740px, 768px, 834px, 844px, 1024px, 1194px, 1280px
- **Screenshot Storage**: `Workspaces/PercyScreenshots/` (auto-cleanup on test start)
- **Test Session**: Session 212 (tokens: KJAHA99L user / PQ9N5YWW host)

## CSS Changes

### SessionWaiting.razor - Mobile Grid Layout
**File**: `SPA/NoorCanvas/Pages/SessionWaiting.razor`
**Change**: Modified `.session-details-grid` to display in 2-column layout on mobile devices

```css
/* Before: Single column on mobile */
@media (max-width: 767px) {
    .session-details-grid {
        grid-template-columns: 1fr;
    }
}

/* After: 2-column layout on mobile */
@media (max-width: 767px) {
    .session-details-grid {
        grid-template-columns: 1fr 1fr;  /* [DEBUG-WORKITEM:css:mobile-grid] ;CLEANUP_OK */
    }
}
```

**Impact**: Session details (Date, Time, Duration, Instructor) now render in 2 columns on mobile instead of single column stack.

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
**Purpose**: Pixel-perfect screenshot comparison across comprehensive responsive breakpoints

**Percy Configuration**:
- **Enhanced Device Coverage**: Portrait AND landscape orientations for all mobile/tablet devices
- **Auto-Cleanup**: `Workspaces/PercyScreenshots/` folder cleared before each test run
- **Total Screenshots**: 33 (11 viewports × 3 views)
- **Responsive Widths**: 360px, 375px, 390px, 667px, 740px, 768px, 834px, 844px, 1024px, 1194px, 1280px

**Test Coverage**:
- Full page layout across all 11 viewports
- Portrait/landscape orientations for comprehensive mobile coverage
- Component-specific sizing validation (logos, forms, grids)
- Responsive transitions between mobile/tablet/desktop

## Files Created

### Test Specifications
1. **`Workspaces/TEMP/mobile-views-responsive.spec.ts`**
   - Functional tests with device emulation
   - Validates layout behavior and element visibility
   - Tests: SessionWaiting (3 tests), UserLanding (3 tests), SessionCanvas (3 tests)
   - ✅ **Status**: All 9 tests passed

2. **`Workspaces/TEMP/mobile-views-visual.spec.ts`** ⭐ **ENHANCED**
   - Percy visual regression tests
   - Expanded viewport coverage: 11 responsive widths (portrait/landscape)
   - Tests: SessionWaiting (10 tests), UserLanding (10 tests), SessionCanvas (10 tests)
   - 📝 **Note**: Requires PERCY_TOKEN environment variable for Percy cloud upload

3. **`Workspaces/TEMP/mobile-views-screenshots.spec.ts`** ⭐ **ENHANCED**
   - Screenshot capture with comprehensive device coverage
   - **Auto-cleanup**: Folder emptied before each test run
   - Saves to: `Workspaces/PercyScreenshots/`
   - Tests: 33 screenshots (11 viewports × 3 views)
   - ✅ **Status**: All 33 screenshots captured successfully

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
6. **`Workspaces/PercyScreenshots/`** (33 PNG files): ⭐ **NEW LOCATION**
   - **SessionWaiting**: 11 viewports (iPhone portrait/landscape, iPhone Pro p/l, Android p/l, iPad p/l, iPad Pro p/l, Desktop)
   - **UserLanding**: 11 viewports (same coverage)
   - **SessionCanvas**: 11 viewports (same coverage)

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
