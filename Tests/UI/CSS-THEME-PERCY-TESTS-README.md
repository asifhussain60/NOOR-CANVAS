# CSS Theme Consistency - Visual Regression Testing

**[DEBUG-WORKITEM:css:theme-consistency]** Percy visual validation tests

## Overview

This test suite validates that the CSS theme unification (HostControlPanel → narrow theme) renders session transcript content consistently across all three views:

1. **HostControlPanel** (`/host/control-panel/{token}`)
2. **SessionCanvas** (`/session/{token}`)  
3. **TranscriptCanvas** (`/transcript/{sessionId}`)

## What We're Testing

All three views should:
- Use `data-theme="narrow"` attribute
- Apply CSS classes: `.html-viewer-content`, `.session-transcript-content`, `.islamic-content`
- Render Islamic content assets (poetry, hadees, ayah cards) at **90% width**
- Apply CSS custom properties: `--islamic-asset-width: 90%`, `--islamic-asset-max-width: none`

## Test Files

### 1. `css-theme-consistency-percy.spec.ts`
Playwright test file with 6 test cases:

- **Test 01**: HostControlPanel transcript rendering (90% width)
- **Test 02**: SessionCanvas transcript rendering (90% width)
- **Test 03**: TranscriptCanvas transcript rendering (90% width)
- **Test 04**: Side-by-side comparison with Islamic content
- **Test 05**: CSS Custom Property validation
- **Test 06**: Responsive behavior validation (narrow theme)

### 2. `run-css-theme-percy-tests.ps1`
PowerShell orchestration script that:
- Builds and starts NoorCanvas app (if not running)
- Runs Percy visual regression tests
- Captures screenshots at multiple viewports (1280px, 1920px)
- Stops app after tests (optional keep-alive mode)

## Prerequisites

### Required
- **NoorCanvas app** buildable and runnable on `https://localhost:9091`
- **Node.js** with npm packages installed
- **Playwright** browsers installed: `npx playwright install`
- **Session 212** must exist in database with Islamic content

### Optional (for Percy.io integration)
- **PERCY_TOKEN** environment variable set
- **Percy.io account** with project configured

## Usage

### Option A: Run with Percy (Visual Comparison)

```powershell
# Set Percy token (one-time setup)
$env:PERCY_TOKEN = "your-percy-token-here"

# Run tests
.\Scripts\run-css-theme-percy-tests.ps1
```

### Option B: Run without Percy (Local Validation)

```powershell
# Run tests locally without Percy snapshots
npx playwright test Tests/UI/css-theme-consistency-percy.spec.ts --headed
```

### Option C: Run with PowerShell script (handles app lifecycle)

```powershell
# Full automation with app management
.\Scripts\run-css-theme-percy-tests.ps1 -SkipBuild

# Keep app running after tests
.\Scripts\run-css-theme-percy-tests.ps1 -KeepAppRunning
```

## Test Data

**Session 212** tokens (from InfrastructureQuickRef.md):
- **Host Token**: `PQ9N5YWW`
- **User Token**: `KJAHA99L`
- **Session ID**: `212`

This session contains Islamic content (ayah cards, poetry, hadees) suitable for validating CSS rendering.

## Expected Outcomes

### ✅ Success Criteria

1. **All tests pass** (6/6 green)
2. **Screenshots captured** for all three views
3. **CSS variables validated**: `--islamic-asset-width: 90%`
4. **Visual consistency** confirmed across views
5. **Responsive behavior** correct at all viewports

### ❌ Failure Scenarios

| Scenario | Cause | Solution |
|----------|-------|----------|
| App not reachable | Not running on localhost:9091 | Start app manually or use script with auto-start |
| Session 212 not found | Database missing session | Verify session exists in database |
| CSS classes missing | Code changes not deployed | Rebuild and restart app |
| Width inconsistent | CSS not applied | Check session-transcript.css loaded |
| Percy upload fails | PERCY_TOKEN not set | Set environment variable or run locally |

## Visual Comparison

When run with Percy, the tests upload screenshots to Percy.io for:
- **Baseline establishment**: First run creates baseline images
- **Visual diff detection**: Subsequent runs compare against baseline
- **Cross-browser validation**: Ensures consistency across browsers
- **Historical tracking**: Prevents visual regressions over time

## Manual Verification (Alternative)

If you prefer manual validation:

1. Open three browser tabs:
   - `https://localhost:9091/host/control-panel/PQ9N5YWW`
   - `https://localhost:9091/session/KJAHA99L`
   - `https://localhost:9091/transcript/212`

2. Inspect the transcript content containers:
   ```javascript
   // Open browser DevTools Console
   const containers = document.querySelectorAll('[data-theme="narrow"]');
   containers.forEach(el => {
       const computed = getComputedStyle(el);
       console.log({
           element: el.className,
           width: computed.getPropertyValue('--islamic-asset-width'),
           maxWidth: computed.getPropertyValue('--islamic-asset-max-width')
       });
   });
   ```

3. Verify output shows:
   ```javascript
   {
       width: "90%",
       maxWidth: "none"
   }
   ```

4. Visually compare Islamic content (ayah cards, poetry) width across all three tabs

## Integration with CI/CD

To integrate these tests into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run CSS Theme Percy Tests
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  run: |
    npm install
    npx playwright install
    npx percy exec -- npx playwright test Tests/UI/css-theme-consistency-percy.spec.ts
```

## Troubleshooting

### Test timeout errors
**Problem**: Tests timeout waiting for content  
**Solution**: Increase timeout in test file or ensure Session 212 has content

### Certificate errors (localhost SSL)
**Problem**: SSL certificate not trusted  
**Solution**: Tests use `SkipCertificateCheck` - ensure Playwright configured correctly

### Percy quota exceeded
**Problem**: Too many snapshots uploaded  
**Solution**: Run tests locally without Percy or upgrade Percy plan

### App won't start
**Problem**: Port 9091 already in use  
**Solution**: Stop existing process or change port in test configuration

## Files Modified (CSS Unification)

- `SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor` (line 62)
- `SPA/NoorCanvas/wwwroot/css/session-transcript.css` (lines 75-89)

## Commits

- **CSS Unification**: `1c3432642aa16aed` (checkpoint/css/2025-10-19_0000)
- **Lint Remediation**: `7a939bf0286957f1` (checkpoint/css/lint-fixes-2025-10-19)
- **Visual Tests**: (pending commit)

## Next Steps

1. ✅ Set `PERCY_TOKEN` environment variable (optional)
2. ✅ Run tests: `.\Scripts\run-css-theme-percy-tests.ps1`
3. ✅ Review Percy dashboard for visual diffs (if using Percy)
4. ✅ Commit baseline screenshots (if satisfied)
5. ✅ Integrate into CI/CD pipeline (optional)

## Resources

- **Percy Documentation**: https://docs.percy.io/docs
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Session 212 Data**: `.github/prompts.keys/css/InfrastructureQuickRef.md`
- **CSS Implementation**: `SPA/NoorCanvas/wwwroot/css/session-transcript.css`
