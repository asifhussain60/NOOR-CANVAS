# Testing Guidelines - plan-prompt-enhancement

**Purpose**: Document lessons learned and best practices for Playwright test generation and orchestration

**Audience**: Future plan implementations, test-generation agent, task agent

**Last Updated**: 2025-10-20

---

## Lessons Learned

### 1. Browser Log Validation
**Critical Insight**: Server-side logs (Logger.LogInformation, Logger.LogWarning) do NOT appear in browser console

**Problem**: Tests failed looking for server log messages in browser console
```typescript
// ❌ WRONG: This will always fail
const logs = await page.evaluate(() => console.logs);
expect(logs).toContain('Registration guard activated'); // Server log - won't be there
```

**Solution**: Verify functionality through behavior, not log presence
```typescript
// ✅ CORRECT: Verify redirect happened (behavior)
await expect(page).toHaveURL(/.*\/UserGuidRegistration.*/);

// ✅ CORRECT: Verify data saved (state)
const userId = await page.evaluate(() => localStorage.getItem('userGuid'));
expect(userId).toBeTruthy();
```

**Best Practice**:
- **Server logs**: Check terminal output during orchestration, NOT browser console
- **Client logs**: Use `page.on('console')` listener for browser console messages
- **Verification**: Test behavior (redirects, data, state), not log presence

---

### 2. Orchestration Script Patterns
**Critical Insight**: `Start-Job` causes orphaned processes; use `Start-Process -PassThru` instead

**Problem**: Jobs run in background thread, cleanup unreliable, output hangs on pipe
```powershell
# ❌ WRONG: Start-Job pattern
$app = Start-Job -ScriptBlock { dotnet run } | Out-Null  # Hangs here
Stop-Job -Name Job1  # Unreliable - job name unpredictable
```

**Solution**: Use separate process with direct PID access
```powershell
# ✅ CORRECT: Start-Process -PassThru pattern
$app = Start-Process powershell `
    -ArgumentList "-NoExit","-Command","cd 'PATH'; dotnet run" `
    -PassThru `
    -WindowStyle Minimized

# Direct cleanup
Stop-Process -Id $app.Id -Force  # Reliable - exact PID
```

**Best Practice**:
- Always use `Start-Process -PassThru` (NOT Start-Job)
- Use `-WindowStyle Minimized` to hide window but keep accessible
- Capture PID via `$app.Id` for reliable cleanup
- Use `try/finally` block to ensure cleanup always runs

---

### 3. Health Check Polling
**Critical Insight**: Fixed delays are unreliable; use polling with timeout

**Problem**: App startup time varies (5-30 seconds); fixed delay wastes time or insufficient
```powershell
# ❌ WRONG: Fixed delay
Start-Sleep -Seconds 15  # Too short if slow start, too long if fast start
```

**Solution**: Poll health endpoint with timeout and interval
```powershell
# ✅ CORRECT: Health check polling
$maxAttempts = 30
$interval = 1  # seconds
$attempt = 0
$ready = $false

while (-not $ready -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:9091" -SkipCertificateCheck -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            Write-Host "App ready after $attempt seconds"
        }
    }
    catch {
        $attempt++
        Start-Sleep -Seconds $interval
    }
}

if (-not $ready) {
    Write-Host "App failed to start within timeout"
    Stop-Process -Id $app.Id -Force
    exit 1
}
```

**Best Practice**:
- Use polling with retry logic (NOT fixed delays)
- Set reasonable timeout (30 attempts × 1 second = 30 seconds)
- Fail fast with clear error message if timeout exceeded
- Report actual startup time for performance insights

---

### 4. Selector Strategies
**Critical Insight**: Framework matters - Blazor components vs HTML elements require different selectors

**Blazor Components**:
```typescript
// ✅ CORRECT: Use ID selectors (stable)
await page.locator('#firstName').fill('John');
await page.locator('#submitButton').click();

// ✅ CORRECT: Use CSS class selectors (for styled components)
await page.locator('.blazor-validation-message').textContent();
```

**HTML Elements**:
```typescript
// ✅ CORRECT: Use attribute selectors (stable)
await page.locator('input[name="email"]').fill('user@example.com');
await page.locator('button[type="submit"]').click();

// ✅ CORRECT: Use data-testid (complex scenarios)
await page.locator('[data-testid="registration-form"]').isVisible();
```

**Best Practice**:
- **Analyze framework first**: Check .razor files for Blazor vs HTML
- **Blazor**: Prefer `#id` selectors (stable IDs from `@id` attribute)
- **HTML**: Prefer `input[name]` or `data-testid` attribute selectors
- **Avoid**: Text content selectors (brittle, localization issues)
- **Always**: Use explicit waits (`waitForSelector` with `state: 'visible'`)

---

### 5. Wait Strategies
**Critical Insight**: `waitForTimeout` is forbidden; use specific wait conditions

**Problem**: Arbitrary delays cause flakiness and slow tests
```typescript
// ❌ FORBIDDEN: Arbitrary timeout
await page.waitForTimeout(5000);  // NEVER USE THIS
```

**Solution**: Wait for specific conditions
```typescript
// ✅ CORRECT: Wait for element visibility
await page.waitForSelector('#userId', { 
    state: 'visible', 
    timeout: 15000 
});

// ✅ CORRECT: Wait for navigation completion
await page.waitForURL('**/SessionCanvas**', { 
    waitUntil: 'networkidle' 
});

// ✅ CORRECT: Wait for network request
await page.waitForResponse(resp => 
    resp.url().includes('/api/participants/create') && resp.status() === 200
);

// ✅ CORRECT: Wait for JavaScript condition
await page.waitForFunction(() => 
    localStorage.getItem('userGuid') !== null
);
```

**Best Practice**:
- **NEVER** use `waitForTimeout` (arbitrary delays)
- **ALWAYS** use specific wait conditions (`waitForSelector`, `waitForURL`, `waitForResponse`, `waitForFunction`)
- Set explicit timeouts (15000ms for slow operations, 5000ms for fast)
- Use `state: 'visible'` (not just existence) for element waits

---

### 6. Flakiness Detection
**Critical Insight**: Single test run insufficient; 3x run reveals flakiness

**Implementation**:
```powershell
# Run test 3 times
$passCount = 0
for ($i = 1; $i -le 3; $i++) {
    npx playwright test test.spec.ts
    if ($LASTEXITCODE -eq 0) { $passCount++ }
}

# Classify stability
if ($passCount -eq 3) {
    Write-Host "STABLE (3/3)"
}
elseif ($passCount -ge 1) {
    Write-Host "FLAKY ($passCount/3)"
}
else {
    Write-Host "FAILING (0/3)"
}
```

**Classification**:
- **3/3 passing**: ✅ Stable - proceed
- **2/3 passing**: ⚠️ Flaky - investigate but proceed with caution
- **1/3 passing**: ⚠️ Flaky - fix recommended before proceeding
- **0/3 passing**: ❌ Failing - halt, fix required

**Best Practice**:
- Run every test 3x during phase validation
- Track flakiness in Progress Checklist
- Investigate flaky tests (race conditions, timing issues)
- Document probable causes and resolutions

---

### 7. Percy Visual Regression
**Critical Insight**: Phase-specific baselines enable incremental validation

**Implementation**:
```typescript
// Phase 3 test - create baseline
import { percySnapshot } from '@percy/playwright';

test('Create Phase 3 baseline', async ({ page }) => {
    await page.goto(`${BASE_URL}/SessionCanvas?token=${TOKEN}`);
    
    // Create baseline for Phase 3
    await percySnapshot(page, 'sessionguard-phase3-baseline', {
        widths: [375, 768, 1280],
        minHeight: 1024,
        percyCSS: '.dynamic-timestamp { visibility: hidden; }'
    });
});

// Phase 4 test - compare against Phase 3
test('Compare against Phase 3 baseline', async ({ page }) => {
    await page.goto(`${BASE_URL}/SessionCanvas?token=${TOKEN}`);
    
    // This compares to phase3-baseline automatically
    await percySnapshot(page, 'sessionguard-phase4-baseline', {
        widths: [375, 768, 1280],
        minHeight: 1024,
        percyCSS: '.dynamic-timestamp { visibility: hidden; }'
    });
});
```

**Best Practice**:
- Create baseline after each phase with visual changes
- Name baselines: `{key}-phase{N}-baseline`
- Subsequent phases compare against previous baseline
- Hide dynamic content with `percyCSS` (timestamps, session IDs)
- Test multiple viewport widths (mobile, tablet, desktop)

---

### 8. Incremental Breakage Detection
**Critical Insight**: Later phases can break earlier functionality

**Implementation**:
```powershell
# Run each phase test in isolation
foreach ($phase in $phases) {
    Write-Host "Testing Phase $($phase.id) in isolation..."
    
    # Run 3x for flakiness
    $passCount = 0
    for ($i = 1; $i -le 3; $i++) {
        npx playwright test $phase.testFile
        if ($LASTEXITCODE -eq 0) { $passCount++ }
    }
    
    # Compare to phase completion results
    if ($phase.wasPassingBefore -and $passCount -eq 0) {
        Write-Host "BREAKAGE: Phase $($phase.id) was passing, now failing"
        Write-Host "Suspect phases: $(phases after $phase.id)"
        exit 1
    }
}
```

**Best Practice**:
- Run all phase tests in isolation during final validation
- Compare current results to phase completion results (from {key}.plan.json)
- Identify culprit phases (those implemented after broken phase)
- Report clear suspect list for investigation

---

### 9. Shared Orchestration Library
**Critical Insight**: Eliminate script duplication with shared functions

**Implementation**:
```powershell
# Invoke-TestOrchestration.ps1 (shared library)
function Start-AppProcess {
    param([string]$AppPath, [int]$Port)
    # Implementation
}

function Wait-AppReady {
    param([string]$HealthCheckUrl, [int]$MaxAttempts = 30)
    # Implementation
}

function Stop-AppProcess {
    param([System.Diagnostics.Process]$Process)
    # Implementation
}

# Per-phase script
. "$PSScriptRoot\Invoke-TestOrchestration.ps1"

$app = Start-AppProcess -AppPath "PATH" -Port 9091
$ready = Wait-AppReady -HealthCheckUrl "https://localhost:9091"
# ... tests ...
Stop-AppProcess -Process $app
```

**Best Practice**:
- Create shared library: `.github/prompts.keys/{key}/scripts/Invoke-TestOrchestration.ps1`
- Define reusable functions: Start, Wait, Stop, Invoke
- All phase scripts import and use shared library
- Zero script duplication across phases

---

### 10. Test Data Management
**Critical Insight**: Use canonical test data (Session 212) consistently

**Session 212 Data**:
```typescript
const BASE_URL = 'https://localhost:9091';
const SESSION_TOKEN = 'KJAHA99L';  // User token
const HOST_TOKEN = 'PQ9N5YWW';     // Host token
const SESSION_ID = 212;

// Use for all tests
await page.goto(`${BASE_URL}/SessionCanvas?token=${SESSION_TOKEN}`);
```

**Best Practice**:
- Always use Session 212 for tests (canonical test data)
- Don't create new sessions (use existing stable data)
- Avoid localStorage for authentication (use token URL params)
- Clean up test data ONLY if creating new data during test

---

## Common Pitfalls

### ❌ Pitfall 1: Looking for server logs in browser console
**Why it fails**: Server logs don't appear in browser  
**Solution**: Verify behavior, not logs

### ❌ Pitfall 2: Using Start-Job for app orchestration
**Why it fails**: Orphaned processes, unreliable cleanup  
**Solution**: Use Start-Process -PassThru

### ❌ Pitfall 3: Fixed delays instead of health checks
**Why it fails**: Wastes time or insufficient  
**Solution**: Poll with timeout and interval

### ❌ Pitfall 4: Text content selectors
**Why it fails**: Brittle, localization breaks them  
**Solution**: Use #id or [attribute] selectors

### ❌ Pitfall 5: Using waitForTimeout
**Why it fails**: Arbitrary delays cause flakiness  
**Solution**: Use waitForSelector, waitForURL

### ❌ Pitfall 6: Single test run
**Why it fails**: Doesn't detect flakiness  
**Solution**: Run 3x, classify stability

### ❌ Pitfall 7: Single Percy baseline for all phases
**Why it fails**: Can't identify which phase broke visuals  
**Solution**: Phase-specific baselines

### ❌ Pitfall 8: No breakage detection
**Why it fails**: Later phases silently break earlier functionality  
**Solution**: Run all phase tests in final validation

### ❌ Pitfall 9: Duplicate orchestration scripts
**Why it fails**: Maintenance nightmare, inconsistencies  
**Solution**: Shared orchestration library

### ❌ Pitfall 10: Creating new test data
**Why it fails**: Data proliferation, cleanup issues  
**Solution**: Use canonical Session 212

---

## Best Practices Summary

### ✅ Orchestration
1. Use Start-Process -PassThru (NOT Start-Job)
2. Poll health endpoint (NOT fixed delays)
3. Use try/finally for cleanup
4. Minimize window but keep accessible
5. Use shared orchestration library

### ✅ Selectors
1. Analyze framework (Blazor vs HTML)
2. Prefer #id (Blazor) or [attribute] (HTML)
3. Avoid text content selectors
4. Use explicit waits (waitForSelector)
5. Document selector strategy per phase

### ✅ Validation
1. Verify behavior (NOT log presence)
2. Distinguish server logs vs client logs
3. Test redirects, data, state
4. Capture browser console errors only

### ✅ Reliability
1. Run tests 3x (flakiness detection)
2. Classify: stable/flaky/failing
3. Track flakiness in Progress Checklist
4. Investigate and fix flaky tests

### ✅ Visual Regression
1. Create phase-specific Percy baselines
2. Hide dynamic content (percyCSS)
3. Test multiple viewports
4. Compare against previous phase baseline

### ✅ Final Validation
1. Run all phase tests in isolation (3x each)
2. Detect incremental breakage
3. Identify culprit phases
4. Generate flakiness summary report

---

## Reusable Patterns

### Pattern 1: Orchestration Script Template
```powershell
# Import shared library
. "$PSScriptRoot\Invoke-TestOrchestration.ps1"

# Start app
$app = Start-AppProcess -AppPath "PATH" -Port 9091

try {
    # Health check
    $ready = Wait-AppReady -HealthCheckUrl "https://localhost:9091"
    if (-not $ready) { exit 1 }
    
    # Run tests
    npx playwright test test.spec.ts --headed
    $exitCode = $LASTEXITCODE
    
    exit $exitCode
}
finally {
    # Cleanup (always runs)
    Stop-AppProcess -Process $app
}
```

### Pattern 2: Playwright Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
    const BASE_URL = 'https://localhost:9091';
    const TOKEN = 'KJAHA99L';  // Session 212
    
    test('should do something', async ({ page }) => {
        // Navigate with token
        await page.goto(`${BASE_URL}/SessionCanvas?token=${TOKEN}`);
        
        // Wait for element
        await page.waitForSelector('#element', { state: 'visible' });
        
        // Interact
        await page.locator('#element').click();
        
        // Verify behavior
        await expect(page).toHaveURL(/.*\/ExpectedPage.*/);
    });
});
```

### Pattern 3: Flakiness Detection
```powershell
$passCount = 0
for ($i = 1; $i -le 3; $i++) {
    npx playwright test test.spec.ts
    if ($LASTEXITCODE -eq 0) { $passCount++ }
    Start-Sleep -Seconds 2
}

if ($passCount -eq 3) { Write-Host "STABLE" }
elseif ($passCount -ge 1) { Write-Host "FLAKY ($passCount/3)" }
else { Write-Host "FAILING" }
```

---

## References

- **Canonical Patterns**: `.github/prompts/shared/test-orchestration-patterns.md`
- **Test Type Decisions**: `.github/prompts/shared/playwright-test-generation.md`
- **Playwright Best Practices**: `.github/instructions/Links/PlaywrightQuickRef.md`
- **Session 212 Data**: `.github/instructions/Links/PlaywrightTestPaths.MD`

---

**Last Updated**: 2025-10-20  
**Key**: plan-prompt-enhancement  
**Phase**: 6/6 Complete
