# Playwright Test Generation Guide

## Purpose
Automatically generate appropriate test coverage for UI changes following established patterns.

---

## Test Type Decision Matrix

**Generate Functional E2E Tests (Playwright) When:**
- ✅ New user interaction flow (buttons, forms, navigation, modals)
- ✅ API endpoint creation/modification affecting UI behavior
- ✅ SignalR real-time feature changes (broadcasts, synchronization)
- ✅ Bug fixes affecting user-visible behavior
- ✅ Multi-user/multi-browser scenarios
- ✅ Question/voting/session management features
- ✅ Authentication/authorization flow changes
- ✅ Accessibility features (ARIA, keyboard navigation)

**Generate Visual Regression Tests (Percy + Playwright) When:**
- ✅ CSS/styling changes (colors, layouts, spacing, themes)
- ✅ Component visual consistency (cards, buttons, panels)
- ✅ Responsive design changes (mobile/tablet/desktop)
- ✅ Theme changes (dark mode, Blazor themes)
- ✅ Layout refactoring (grid systems, flexbox)
- ✅ Animation/transition implementation
- ✅ Visual bug fixes (alignment, rendering issues)

**Recommend CSS Quality Checks (Stylelint) When:**
- ✅ New CSS files or Blazor Razor component styles
- ✅ Theme development (color schemes, design tokens)
- ✅ CSS refactoring (consolidating styles, removing duplicates)
- ✅ Component library development

**Skip Tests For:**
- ❌ Debug logging additions/removals
- ❌ Documentation-only updates
- ❌ Internal code refactoring without UI/behavior change

---

## Orchestration Script Requirement

⚠️ **ABSOLUTE MANDATE: ALL PLAYWRIGHT TESTS REQUIRE ORCHESTRATION SCRIPTS**

**NEVER execute tests directly - ALWAYS use orchestration scripts.**

### Why Orchestration Scripts Are Mandatory

**Orchestration scripts ensure:**
- ✅ Separate PowerShell window ensures proper environment isolation
- ✅ `ASPNETCORE_ENVIRONMENT=Development` correctly sets DevMode
- ✅ Health check retry logic prevents race conditions
- ✅ Automated cleanup prevents port conflicts
- ✅ Reliable PID tracking for process termination
- ✅ Visible app window (minimized) for debugging
- ✅ Guaranteed cleanup even if tests fail (`try/finally`)

**Direct execution approaches are ALL DEPRECATED:**
- ❌ `npx playwright test` (missing environment setup, no cleanup)
- ❌ `PW_MODE=standalone npx playwright test` (webServer config - unreliable)
- ❌ `Start-Job` for app startup (unreliable PID tracking, orphaned processes)
- ❌ Manual `dotnet run` before tests (non-automatable, fragile)
- ❌ PowerShell background operator `&` (doesn't work in PowerShell 5.1)

**REQUIRED: Create orchestration script for EVERY test**
- Location: `Scripts/run-{feature}-test.ps1`
- Template: See `.github/prompts/shared/test-orchestration-patterns.md` (MANDATORY READING)
- Execution: `.\Scripts\run-{feature}-test.ps1`

**See Complete Pattern:** `.github/prompts/shared/test-orchestration-patterns.md`

---

**Script MUST include these components:**

```powershell
# Launch app using canonical launcher (v3.0 direct dotnet.exe pattern)
Write-Host "[APP] Launching application..." -ForegroundColor Cyan

try {
    # NOTE: Adjust path and URL for your project
    $appInfo = & "Scripts\Test-Framework\Start-NoorCanvasForTests.ps1" `
        -Url "https://localhost:5001" `
        -Environment "Development" `
        -Verbose:$VerbosePreference
    
    Write-Host "  ✅ App ready (PID: $($appInfo.ProcessId))" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ App launch failed: $_" -ForegroundColor Red
    exit 1
}

# Run Playwright tests (with guaranteed cleanup)
try {
    Push-Location "Tests\UI"  # Adjust path for your project
    
    Write-Host "[TEST] Running tests..." -ForegroundColor Cyan
    npx playwright test {test-file}.spec.ts --headed --reporter=list
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host "  ✅ Tests PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ Tests FAILED" -ForegroundColor Red
    }
}
finally {
    # GUARANTEED cleanup (always runs - even on error)
    Pop-Location
    
    Write-Host "[CLEANUP] Stopping app..." -ForegroundColor Cyan
    Stop-Process -Id $appInfo.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Cleanup complete" -ForegroundColor Green
}

exit $testExitCode
```

**v3.0 Benefits:**
- ✅ Delegates to canonical launcher (Start-NoorCanvasForTests.ps1)
- ✅ Direct `dotnet.exe` launch (67-80% faster startup)
- ✅ Port binding + HTTP health checks (optimized exponential backoff)
- ✅ 100% cleanup reliability via `$appInfo.ProcessId`
- ✅ Single source of truth (one file maintains launch logic)

**See Also**: `.github/prompts/shared/app-launch-fix-protocol.md` for v3.0 implementation details

### Execution Method

**Store script in**: `Scripts/run-{feature}-test.ps1`

**Execute via**:
```powershell
# From VS Code terminal
.\Scripts\run-{feature}-test.ps1

# OR add to tasks.json
{
    "label": "test-{feature}",
    "type": "shell",
    "command": "powershell.exe",
    "args": ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", 
             "${workspaceFolder}/Scripts/run-{feature}-test.ps1"]
}
```

**Reference Implementation**: `Scripts/run-debug-panel-e2e-visual-test.ps1`

---

## Test Generation Requirements

### For Functional E2E Tests

1. **Invoke test-generation.prompt.md** with parameters:
   ```
   type=functional
   feature={feature-name}
   browsers=chromium,firefox
   ```

2. **Read canonical data** from:
   - `PlaywrightQuickRef.md` - Test patterns, Session 212 data
   - `PlaywrightTestPaths.MD` - Proven test structures

3. **Follow proven patterns**:
   - API-based test setup (no UI clicks for setup)
   - Multi-browser isolation (separate sessions)
   - Waiting strategies (avoid `waitForTimeout`, use specific waits)

4. **Naming convention**: `{feature}-{test-type}.spec.ts` in `Workspaces/TEMP/` (MANDATORY)
   - Example: `question-delete-e2e.spec.ts`
   - Example: `session-creation-functional.spec.ts`

### For Visual Regression Tests

1. **Invoke test-generation.prompt.md** with parameters:
   ```
   type=visual
   feature={feature-name}
   percy=true
   ```

2. **Read configuration** from:
   - `VISUAL_REGRESSION_TESTING.md` - Percy setup, snapshot strategies
   - `PlaywrightConfig.MD` - Browser configurations

3. **Follow Percy patterns**:
   - Use `percySnapshot()` for visual captures
   - Name snapshots descriptively: `{Component} - {State}`
   - Test multiple states (default, hover, active, disabled)

4. **Naming convention**: `{feature}-visual.spec.ts` in `Workspaces/TEMP/` (MANDATORY)

5. **Execution**: `npm run test:percy:visual -- Workspaces/TEMP/{file}.spec.ts`

### For CSS Quality Checks

1. **Document in key data stream**: "CSS changes require Stylelint validation"
2. **Provide command**: `npm run lint:css -- {file-pattern}`
3. **Reference**: `.stylelintrc.json` for rules (canvas-* naming, no duplicates, etc.)

---

## Test Template (Functional E2E)

```typescript
import { test, expect } from '@playwright/test';

test.describe('{Feature Name}', () => {
    const BASE_URL = 'https://localhost:9091';
    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token
    const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token

    test('should {describe behavior}', async ({ page }) => {
        // 1. API-based setup (no UI clicks)
        await page.goto(`${BASE_URL}/SessionCanvas?token=${SESSION_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // 2. Perform action
        await page.click('[data-testid="action-button"]');

        // 3. Assert outcome
        await expect(page.locator('[data-testid="result"]'))
            .toBeVisible({ timeout: 5000 });
        
        // 4. Verify persistence (MANDATORY for CRUD operations)
        await page.reload();
        await expect(page.locator('[data-testid="result"]'))
            .toBeVisible({ timeout: 5000 });
    });
});
```

---

## Automatic Test Type Detection

After generating test file, automatically execute:

1. **Analyze task description** for keywords:
   - "add button", "delete", "create" → Functional
   - "change color", "fix alignment", "responsive" → Visual

2. **Determine test type**:
   - Contains `percySnapshot()` → Visual (use Percy)
   - Contains API calls + UI interaction → Functional
   - Pure CSS changes → Visual + Stylelint

3. **Auto-execute appropriate test**:
   - **Functional**: Create orchestration script → Run via script
   - **Visual**: Run `npm run test:percy:visual -- {file}`
   - **CSS**: Run `npm run lint:css -- {pattern}`

---

## References

- **Complete Guide**: `.github/instructions/Links/PlaywrightQuickRef.md`
- **Configuration**: `PlaywrightConfig.MD`
- **Session 212 Data**: `PlaywrightTestPaths.MD`
- **Visual Testing**: `VISUAL_REGRESSION_TESTING.md`
