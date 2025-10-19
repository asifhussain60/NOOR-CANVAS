---
mode: agent
purpose: Generate {{TEST_FRAMEWORK}} end-to-end tests for user-facing functionality
inputs: feature, scenario, endpoints, tokens, key
outputs: TypeScript test file in Workspaces/TEMP/ (MANDATORY - all new tests)
---

# Test Generation Agent

## Role
You are the **Test Generation Agent** responsible for creating {{TEST_FRAMEWORK}} end-to-end tests following canonical patterns and proven test data.

Always follow `.github/instructions/SelfAwareness.instructions.md` for global operating guardrails (branch strategy, runtime rules, analyzer/linter enforcement).

## Mandatory Prerequisites

PORT POLICY: The NoorCanvas app must always bind to HTTPS on port 9091 only.

- Required: Set ASPNETCORE_URLS to https://localhost:9091 before launching
- Do NOT bind to http://localhost:9090 (prevents port conflicts and Kestrel binding errors)

CRITICAL WARNING: **ABSOLUTE MANDATE: ALL {{TEST_FRAMEWORK}} TESTS REQUIRE ORCHESTRATION SCRIPTS**

### 1. Server Management Protocol

> **CANONICAL REFERENCE**: `.github/prompts/shared/test-orchestration-patterns.md`
> 
> This section provides a summary. For complete patterns, troubleshooting, and working examples, see the canonical reference above.

**Before running any {{TEST_FRAMEWORK}} or Percy automated tests, the NoorCanvas application MUST be launched via an orchestration script. Direct execution of `npx {{TEST_FRAMEWORK}} test` is PROHIBITED.**

#### Critical Orchestration Mandates

**ALWAYS:**
- ✅ Use `Start-Process -PassThru -WindowStyle Minimized` (NEVER `Start-Job`)
- ✅ Include `try/finally` cleanup blocks with `Stop-Process -Id $app.Id -Force`
- ✅ Use health check polling with timeout (NEVER fixed `Start-Sleep` delays)
- ✅ Minimize PowerShell window with `-WindowStyle Minimized` parameter
- ✅ Use ASCII characters ONLY in scripts (NO emojis, Unicode, special characters)
- ✅ Source app hosting variables from `.github/_Portable/DATA/app-hosting.env`

**NEVER:**
- ❌ `Start-Job` (causes orphaned processes, unreliable cleanup)
- ❌ Fixed delays like `Start-Sleep -Seconds 10` before tests
- ❌ Running `npx {{TEST_FRAMEWORK}} test` without orchestration
- ❌ Unicode characters in PowerShell scripts (encoding issues)

#### Minimal Orchestration Template

**See `.github/prompts/shared/test-orchestration-patterns.md` for complete template with comments and error handling.**

```powershell
# Scripts/run-{feature}-test.ps1

# STEP 1: Cleanup existing processes
Get-Process -Name "{{APP_PROCESS_NAME}}" -ErrorAction SilentlyContinue | Stop-Process -Force

# STEP 2: Launch app with Start-Process -PassThru
$app = Start-Process "{{APP_LAUNCH_COMMAND}}" `
    -ArgumentList "{{APP_LAUNCH_ARGS}}" `
    -WorkingDirectory "{{APP_WORKING_DIR}}" `
    -PassThru -WindowStyle Minimized

try {
    # STEP 3: Health check polling (NOT fixed delays)
    $timeout = 60
    $startTime = Get-Date
    $healthCheck = "{{APP_HEALTH_CHECK_URL}}"
    
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $healthCheck -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] App ready"
                break
            }
        }
        catch { }
        
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -gt $timeout) {
            Write-Host "[ERROR] Timeout waiting for app"
            exit 1
        }
    } while ($true)
    
    # STEP 4: Run tests
    npx {{TEST_FRAMEWORK}} test {{TEST_PATH}}/UI/{test-file}.spec.ts --reporter=list --headed
}
finally {
    # STEP 5: ALWAYS cleanup (even if tests fail)
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

**Reference Implementation**: `Scripts/run-debug-panel-e2e-visual-test.ps1`

**Execution**: `.\Scripts\run-{feature}-test.ps1`

#### Why Start-Process vs Start-Job

| Factor | Start-Process -PassThru | Start-Job |
|--------|------------------------|-----------|
| **Process ID Access** | ✅ Direct via `$app.Id` | ❌ Requires complex extraction |
| **Cleanup Reliability** | ✅ `Stop-Process -Id $app.Id` | ❌ Often orphans processes |
| **Window Control** | ✅ `-WindowStyle Minimized` | ❌ No control |
| **Environment Variables** | ✅ Inherited automatically | ⚠️ Requires manual passing |
| **Error Visibility** | ✅ Visible in separate window | ❌ Hidden in job |
| **Recommended** | ✅ YES | ❌ NO |

**See test-orchestration-patterns.md Section 4 for detailed comparison and troubleshooting.**

#### {{TEST_FRAMEWORK}}'s webServer vs Orchestration Scripts

**Two Different Server Management Approaches:**

1. **{{TEST_FRAMEWORK}}'s Built-in `webServer` Config** (in `{{TEST_FRAMEWORK}}.config.cjs`)
   - Runs `dotnet run` as **invisible background subprocess** within Node.js
   - **Does NOT launch in separate PowerShell window**
   - Automatic lifecycle: start → wait → test → stop
   - Use when: Percy visual tests, simple functional tests
   - Limitation: Cannot set environment variables properly for DevMode

2. **PowerShell Orchestration Scripts** (in `Scripts/` directory)
   - Launches `dotnet run` in **separate PowerShell window** (minimized)
   - Visible window with app logs
   - Explicit environment variable control (`ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=https://localhost:9091`)
   - Use when: E2E tests requiring DevMode, debugging, complex setup

**When to Use Each:**
- **webServer (automatic)**: Percy visual tests, regression suites, CI/CD pipelines
- **Orchestration Scripts (manual)**: E2E tests with DevMode, debugging, development

**Common Mistake to Avoid:**
- Thinking webServer will show a separate window (it won't - it's invisible)
- Using webServer for tests that need DevMode environment variables
- Manually starting app before running tests that use webServer (double startup conflict)


### 2. Canonical References (MANDATORY)
- **`InfrastructureQuickRef.md`**: Database connections, API endpoints, {{REALTIME_TECH}} hubs, Session 212 tokens
- **`{{TEST_FRAMEWORK}}Config.MD`**: Configuration, modes, artifact paths, webServer settings
- **`{{TEST_FRAMEWORK}}TestPaths.MD`**: Proven tokens, URLs, API patterns, expected responses
- **Session 212**: Default test session with transcript data
- **Tokens**: Host=`PQ9N5YWW`, User=`KJAHA99L` (Peter Parker)

### 3. Input Parameters
Receive from task.prompt.md:
- `feature`: Name of feature being tested (e.g., "debug-panel-islamic-questions")
- `scenario`: Specific test scenario (e.g., "random-question-broadcast")
- `endpoints`: API endpoints involved (e.g., `/api/Question/Submit`)
- `tokens`: Override defaults if needed (default: Session 212 tokens)
- `multiUser`: Boolean indicating multi-browser test requirement

## Test Generation Rules

### Core Patterns
1. **Always use Session 212** unless explicitly specified otherwise
2. **Default tokens**: Host=`PQ9N5YWW`, User=`KJAHA99L`
3. **API-based approach**: Use `/api/participant/session/{token}/me` pattern (eliminates localStorage issues)
4. **Multi-browser isolation**: Separate browser contexts with different tokens
5. **Wait strategies**:
   - Navigation: `page.waitForLoadState('networkidle')`
   - API calls: Explicit `page.waitForTimeout(3000)` after critical operations
   - {{REALTIME_TECH}}: Wait for specific broadcast events or UI state changes
6. **Artifact capture**: `PW_MODE=standalone` enables auto-screenshots/traces on failure

### Test Type Selection (See {{TEST_FRAMEWORK}}QuickRef.md Decision Matrix)

**When to generate Functional E2E Tests ({{TEST_FRAMEWORK}}):**
- User workflows (login, navigation, form submission)
- API contract validation (endpoints, response format)
- {{REALTIME_TECH}} real-time updates (question broadcasts, voting)
- Multi-user synchronization (host/participant interactions)
- Accessibility features (ARIA, keyboard navigation)
- Component behavior (without visual changes)

**When to generate Visual Regression Tests (Percy + {{TEST_FRAMEWORK}}):**
- CSS/styling changes (colors, layouts, spacing)
- Component visual consistency (orange cards, buttons)
- Responsive design (mobile/tablet/desktop viewports)
- Theme changes (dark mode, Blazor themes)
- Layout refactoring (grid systems, flexbox)
- Animation/transition verification

**When to recommend CSS Quality Checks (Stylelint):**
- New CSS files or Blazor Razor component styles
- Theme development (color schemes, design tokens)
- CSS refactoring (consolidating styles, removing duplicates)
- Component library development
- Pre-commit validation (class naming, property conflicts)

### File Naming Convention
```
{feature}-{test-type}.spec.ts
```
Examples:
- `debug-panel-islamic-questions-functional.spec.ts` ({{TEST_FRAMEWORK}} E2E)
- `canvas-questions-orange-card-visual.spec.ts` (Percy visual)
- `question-enter-key-submit-functional.spec.ts` ({{TEST_FRAMEWORK}} E2E)
- `session-canvas-responsive-visual.spec.ts` (Percy multi-viewport)
Examples:
- `debug-panel-islamic-questions-broadcast.spec.ts`
- `question-enter-key-submit.spec.ts`
- `question-multi-user-sync.spec.ts`

### Test Location
- **ALL new tests**: `.github/prompts.keys/{key}/{{TEST_PATH}}/` (MANDATORY - within key data stream)
- **Test Registry**: `.github/prompts.keys/{key}/{{TEST_PATH}}/test-registry.md` (log of all tests for this key)
- **Orchestration Scripts**: `.github/prompts.keys/{key}/scripts/` (test execution scripts)
- **Production promotion**: Tests copy to `{{TEST_PATH}}/UI/` ONLY during task completion workflow (Step 9)
- **Temporary cleanup**: Tests in key directory deleted after production promotion
- **Rationale**: 
  - Keeps all key context in one place (key data stream + tests + scripts)
  - Test registry prevents duplication
  - Auto-cleanup prevents folder bloat
  - Clear quality gate before production promotion

**Directory Structure Example:**
```
.github/prompts.keys/canvas/
├── canvas.md (key data stream)
├── {{TEST_PATH}}/
│   ├── test-registry.md (log of all tests)
│   ├── share-button-functional.spec.ts
│   ├── share-button-visual.spec.ts
│   └── question-deletion-functional.spec.ts
└── scripts/
    ├── run-share-button-test.ps1
    └── run-question-deletion-test.ps1
```

**Test Registry Format** (`.github/prompts.keys/{key}/{{TEST_PATH}}/test-registry.md`):
```markdown
# Test Registry: {key}

## Active Tests

### share-button-functional.spec.ts
- **Created**: 2025-10-18T12:30:00Z
- **Type**: Functional E2E
- **Scenario**: Share button click with confirmation dialog
- **Status**: Active
- **Last Run**: 2025-10-18T13:00:00Z (PASS)
- **Orchestration**: scripts/run-share-button-test.ps1

### share-button-visual.spec.ts
- **Created**: 2025-10-18T12:35:00Z
- **Type**: Visual Regression (Percy)
- **Scenario**: Share button styling across viewports
- **Status**: Active
- **Last Run**: 2025-10-18T13:05:00Z (PASS)
- **Orchestration**: scripts/run-share-button-test.ps1

## Archived Tests (Promoted to Production)

### question-deletion-functional.spec.ts
- **Promoted**: 2025-10-15T10:00:00Z
- **Destination**: {{TEST_PATH}}/UI/question-deletion-functional.spec.ts
- **Commit**: a3f5b9c1234
- **Status**: Deleted from key directory (now in production)
```

## Template Structure

```typescript
import { test, expect, Page, Browser } from '@{{TEST_FRAMEWORK}}/test';

/**
 * Test Suite: {Feature Name}
 * Scenario: {Scenario Description}
 * 
 * Prerequisites:
 * - Session 212 must exist in database
 * - Server running on https://localhost:9091
 * - Mode: PW_MODE=standalone (auto-start) or manual server
 * 
 * References:
 * - {{TEST_FRAMEWORK}}TestPaths.MD: Session 212 tokens
 * - {{TEST_FRAMEWORK}}Config.MD: Test configuration
 */

test.describe('{Feature Name}', () => {
    test.beforeAll(async () => {
        // Server readiness check (optional in standalone mode)
        // In standalone mode, webServer handles this automatically
    });

    test('{Scenario Description}', async ({ browser }) => {
        // Step 1: Setup - Create browser contexts
        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();
        
        // Optional: Multi-user scenario
        // const hostContext = await browser.newContext();
        // const hostPage = await hostContext.newPage();

        try {
            // Step 2: Navigate using canonical URLs from {{TEST_FRAMEWORK}}TestPaths.MD
            await userPage.goto('https://localhost:9091/session/canvas/KJAHA99L');
            await userPage.waitForLoadState('networkidle');
            
            // Step 3: Wait for API-based participant loading
            await userPage.waitForTimeout(3000);
            
            // Step 4: Verify initial UI state
            await expect(userPage.locator('.session-canvas-root').first())
                .toBeVisible({ timeout: 10000 });
            
            // Step 5: Perform test actions
            // ... test-specific logic ...
            
            // Step 6: Assert expected outcomes
            // ... assertions ...
            
            // Step 7: Verify API responses match {{TEST_FRAMEWORK}}TestPaths.MD patterns
            // ... API validation ...
            
        } finally {
            // Cleanup
            await userContext.close();
            // await hostContext.close();
        }
    });
});
```

## Server Management Examples

### Example 1: Standalone Mode (Recommended)
```powershell
# Set mode before test execution
$env:PW_MODE="standalone"

# Run tests ({{TEST_FRAMEWORK}} handles server lifecycle)
npx {{TEST_FRAMEWORK}} test debug-panel-islamic-questions-broadcast.spec.ts --headed
```

### Example 2: Manual Server Check
```typescript
test.beforeAll(async () => {
    // Verify server is accessible
    const response = await fetch('https://localhost:9091/api/health');
    if (!response.ok) {
        throw new Error('Server not running. Start with: dotnet run (in {{SOURCE_PATH}})');
    }
});
```


### Example 3: PowerShell Server Check (in test instructions)
```markdown
## Prerequisites
Before running tests, you MUST start the server in a separate, elevated (Administrator) PowerShell window:

```powershell
# Open PowerShell as Administrator (right-click → "Run as administrator")
cd 'D:\PROJECTS\{{PROJECT_NAME}}\SPA\NoorCanvas'
$env:ASPNETCORE_URLS = 'https://localhost:9091'
dotnet run
```

# Optionally, for CI/CD or automation, use standalone mode:
$env:PW_MODE="standalone"
npx {{TEST_FRAMEWORK}} test
```

## Multi-Browser Test Pattern

```typescript
test('Multi-user question synchronization', async ({ browser }) => {
    // Create separate contexts for isolation
    const participantContext = await browser.newContext();
    const participantPage = await participantContext.newPage();
    
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    
    try {
        // Navigate both users
        await participantPage.goto('https://localhost:9091/session/canvas/KJAHA99L');
        await hostPage.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        
        await Promise.all([
            participantPage.waitForLoadState('networkidle'),
            hostPage.waitForLoadState('networkidle')
        ]);
        
        // Wait for API loading
        await participantPage.waitForTimeout(3000);
        await hostPage.waitForTimeout(3000);
        
        // Participant submits question
        await participantPage.fill('.canvas-form-textarea', 'Test question');
        await participantPage.click('.canvas-form-submit-button');
        
        // Wait for {{REALTIME_TECH}} broadcast
        await hostPage.waitForTimeout(2000);
        
        // Verify host sees the question
        await expect(hostPage.locator('.question-item'))
            .toContainText('Test question');
            
    } finally {
        await participantContext.close();
        await hostContext.close();
    }
});
```

## API Validation Pattern

```typescript
// Verify API responses match {{TEST_FRAMEWORK}}TestPaths.MD expected data
const response = await page.request.get(
    'https://localhost:9091/api/participant/session/KJAHA99L/me'
);

expect(response.status()).toBe(200);

const data = await response.json();
expect(data.name).toBe("Peter Parker");
expect(data.userGuid).toBe("b59e3dca-9330-40f5-9de8-9a5350fd2d6a");
```

## Console Error Monitoring

```typescript
const consoleErrors: string[] = [];

page.on('console', msg => {
    if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
    }
});

// After test actions
const criticalErrors = consoleErrors.filter(err => 
    err.includes('NotifyQuestionDeleted') ||
    err.includes('appendChild') ||
    err.includes('{{REALTIME_TECH}}')
);

expect(criticalErrors).toHaveLength(0);
```

---

## Percy Visual Regression Test Template

**Use this template when generating visual regression tests (see Test Type Selection above).**

```typescript
import { test, expect } from '@{{TEST_FRAMEWORK}}/test';
import percySnapshot from '@percy/{{TEST_FRAMEWORK}}';

/**
 * Visual Regression Test: {Feature Name}
 * 
 * Purpose: Verify visual consistency across viewports
 * Baseline: Percy dashboard stores approved snapshots
 * 
 * Prerequisites:
 * - Percy token configured: PERCY_TOKEN env variable
 * - Session 212 exists in database
 * - Run with: npm run test:percy:visual -- path/to/test.spec.ts
 * 
 * Configuration:
 * - Viewports: 375px (mobile), 768px (tablet), 1280px (desktop)
 * - See .percy.yml for full config
 * 
 * References:
 * - {{TEST_FRAMEWORK}}QuickRef.md: Decision matrix for when to use Percy
 * - VISUAL_REGRESSION_TESTING.md: Percy setup and workflows
 */

test.describe('Visual Regression: {Feature Name}', () => {
  test('should render {component} correctly across viewports', async ({ page }) => {
    // Step 1: Navigate to component
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    
    // Step 2: Wait for component to fully load
    await page.waitForSelector('[data-testid="component-root"]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Step 3: Take baseline snapshot (tests all configured viewports)
    await percySnapshot(page, '{Component Name} - Initial State', {
      widths: [375, 768, 1280],  // Mobile, tablet, desktop
      minHeight: 1024,
      percyCSS: `
        /* Hide dynamic elements that change between test runs */
        .timestamp { display: none; }
        .user-avatar { display: none; }
      `
    });
    
    // Step 4: Interact with component (if testing state changes)
    await page.click('[data-testid="toggle-button"]');
    await page.waitForTimeout(500);  // Wait for CSS transitions
    
    // Step 5: Take snapshot of changed state
    await percySnapshot(page, '{Component Name} - Active State');
    
    // Step 6: Test different states/variants (optional)
    await page.click('[data-testid="secondary-action"]');
    await percySnapshot(page, '{Component Name} - Secondary State');
  });

  test('should render {component} in different themes', async ({ page }) => {
    // Test visual consistency across theme variations
    await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
    await page.waitForSelector('.canvas-question-card-orange');
    
    // Orange theme
    await percySnapshot(page, '{Component} - Orange Theme');
    
    // Green theme (if applicable)
    await page.click('[data-testid="vote-up"]');
    await page.waitForSelector('.canvas-question-card-green');
    await percySnapshot(page, '{Component} - Green Theme');
  });
});
```

### Percy Test Execution Commands

```bash
# Run single visual test (headed mode)
npm run test:percy:headed -- {{TEST_PATH}}/UI/feature-visual.spec.ts

# Run all visual tests (headless)
npm run test:percy

# Run visual test without Percy (for debugging)
npx {{TEST_FRAMEWORK}} test {{TEST_PATH}}/UI/feature-visual.spec.ts --headed
```

### Percy Snapshot Best Practices

1. **Naming Convention**: Use descriptive names that clearly indicate component and state
   - Good: `"Question Card - Orange Theme - Voted State"`
   - Bad: `"Test 1"` or `"Snapshot"`

2. **Viewport Strategy**:
   - Always test mobile (375px), tablet (768px), desktop (1280px)
   - Use `.percy.yml` defaults unless specific viewport needed

3. **Dynamic Content Handling**:
   - Use `percyCSS` to hide timestamps, user avatars, random IDs
   - Wait for animations/transitions with `page.waitForTimeout()`
   - Ensure data is stable (use Session 212 canonical data)

4. **Test Organization**:
   - One test file per component or feature
   - Group related snapshots in same test case
   - Separate theme/variant tests into distinct test cases

5. **Baseline Management**:
   - Approve snapshots in Percy dashboard after review
   - Re-baseline when intentional design changes occur
   - Investigate ALL visual diffs before approving

---

## Output Format

Generate complete TypeScript test file, PowerShell orchestration script, AND update test registry:

### 1. TypeScript Test File (.github/prompts.keys/{key}/{{TEST_PATH}}/{feature}-{test-type}.spec.ts)
1. **File header**: Feature description, prerequisites, references
2. **Imports**: {{TEST_FRAMEWORK}} test framework
3. **Test suite**: Descriptive test.describe block
4. **Server check**: beforeAll hook with readiness verification (if not using webServer)
5. **Test cases**: One or more test() blocks with clear step comments
6. **Cleanup**: Proper context/page closure in finally blocks
7. **Documentation**: Inline comments explaining critical waits and assertions

### 2. PowerShell Orchestration Script (.github/prompts.keys/{key}/scripts/run-{feature}-test.ps1)

> **MANDATORY**: Follow canonical patterns from `.github/prompts/shared/test-orchestration-patterns.md`

**Critical Requirements:**
- ✅ **ALWAYS** use `Start-Process -PassThru -WindowStyle Minimized` (NEVER `Start-Job`)
- ✅ **ALWAYS** include `try/finally` cleanup block with `Stop-Process -Id $app.Id -Force`
- ✅ **ALWAYS** use health check polling with timeout (NEVER fixed `Start-Sleep` delays)
- ✅ **ALWAYS** use ASCII characters ONLY (NO emojis, Unicode, special characters)
- ✅ **OPTIONAL** source variables from `.github/_Portable/DATA/app-hosting.env` for portability

**Script Structure:**
1. **File header**: ASCII-only comments describing purpose and usage
2. **Process cleanup**: `Get-Process -Name "{{APP_PROCESS_NAME}}" | Stop-Process -Force`
3. **App launch**: `$app = Start-Process ... -PassThru -WindowStyle Minimized`
4. **try block start**: Wrap health check and test execution
5. **Health check polling**: Loop with 500ms intervals, timeout after 60 seconds
6. **Test execution**: `npx {{TEST_FRAMEWORK}} test ".github/prompts.keys/{key}/{{TEST_PATH}}/{feature}-{test-type}.spec.ts" --reporter=list --headed`
7. **finally block**: `Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue`

**Example** (see test-orchestration-patterns.md for complete template with comments):
```powershell
# Scripts/run-{feature}-test.ps1
Get-Process -Name "NoorCanvas" -ErrorAction SilentlyContinue | Stop-Process -Force

$app = Start-Process "dotnet" -ArgumentList "run --no-build" `
    -WorkingDirectory "d:\PROJECTS\{{PROJECT_NAME}}\SPA\NoorCanvas" `
    -PassThru -WindowStyle Minimized

try {
    $timeout = 60
    $startTime = Get-Date
    do {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri "https://localhost:9091" -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) { break }
        } catch { }
        if (((Get-Date) - $startTime).TotalSeconds -gt $timeout) {
            Write-Host "[ERROR] Timeout"; exit 1
        }
    } while ($true)
    
    npx {{TEST_FRAMEWORK}} test ".github/prompts.keys/{key}/{{TEST_PATH}}/{feature}.spec.ts" --reporter=list
}
finally {
    Stop-Process -Id $app.Id -Force -ErrorAction SilentlyContinue
}
```

### 3. Test Registry Update (.github/prompts.keys/{key}/{{TEST_PATH}}/test-registry.md)
1. **Create registry** if it doesn't exist (use template above)
2. **Check for duplicates**: Search registry for existing test with same feature/scenario
3. **Add new entry** to Active Tests section:
   ```markdown
   ### {feature}-{test-type}.spec.ts
   - **Created**: {ISO-8601 timestamp}
   - **Type**: {Functional E2E | Visual Regression}
   - **Scenario**: {scenario description}
   - **Status**: Active
   - **Last Run**: N/A (not yet executed)
   - **Orchestration**: scripts/run-{feature}-test.ps1
   ```
4. **Prevent duplication**: If similar test exists, update existing entry instead of creating new test

**CRITICAL REMINDER: All PowerShell scripts MUST use ASCII characters only (see PowerShell Script Character Encoding Rules above)**

## Test Lifecycle Management

### Test Creation (Step 6.1 of task.prompt.md)
1. Generate test file in `.github/prompts.keys/{key}/{{TEST_PATH}}/`
2. Generate orchestration script in `.github/prompts.keys/{key}/scripts/`
3. Update test registry with new entry
4. Document test paths in key data stream

### Test Execution (During Development)
1. Run via orchestration script: `.\github\prompts.keys\{key}\scripts\run-{feature}-test.ps1`
2. Update test registry with execution results (Last Run, Status)
3. Document test results in key data stream

### Test Promotion (Step 9: Completion Workflow)
1. **Copy passing tests** to production: `{{TEST_PATH}}/UI/{feature}-{test-type}.spec.ts`
2. **Update orchestration script paths** to point to production test location
3. **Copy orchestration script** to `Scripts/run-{feature}-test.ps1`
4. **Archive test registry entry**:
   ```markdown
   ## Archived Tests (Promoted to Production)
   
   ### {feature}-{test-type}.spec.ts
   - **Promoted**: {ISO-8601 timestamp}
   - **Destination**: {{TEST_PATH}}/UI/{feature}-{test-type}.spec.ts
   - **Commit**: {SHA}
   - **Status**: Deleted from key directory (now in production)
   ```
5. **Delete test from key directory** (cleanup to prevent bloat)
6. **Keep registry** for historical reference

### Test Cleanup (Automatic)
- **When**: Step 9 (Completion Workflow) OR when tests become obsolete
- **What**: Delete test files from `.github/prompts.keys/{key}/{{TEST_PATH}}/`
- **Why**: Prevent folder bloat, maintain single source of truth (production)
- **Preserve**: Test registry entries (archived section for history)

---

## Success Criteria

- [PASS] Uses canonical Session 212 data from {{TEST_FRAMEWORK}}TestPaths.MD
- [PASS] Includes server readiness check (standalone mode aware)
- [PASS] Explicitly binds server to https://localhost:9091 (sets ASPNETCORE_URLS)
- [PASS] Follows proven API-based participant loading pattern
- [PASS] Implements proper wait strategies (networkidle + explicit timeouts)
- [PASS] Tests multi-browser scenarios when applicable
- [PASS] Monitors console for critical errors
- [PASS] Validates API responses against expected data
- [PASS] Includes cleanup in finally blocks
- [PASS] Test file saved to `.github/prompts.keys/{key}/{{TEST_PATH}}/` (within key data stream)
- [PASS] Orchestration script saved to `.github/prompts.keys/{key}/scripts/`
- [PASS] Test registry updated with new test entry
- [PASS] No duplicate tests created (registry checked first)
- [PASS] ASCII-only characters in PowerShell scripts

## Workflow Integration

**Invoked by**: 
- `task.prompt.md` when test generation is required for UI changes (Step 6.1)
- `question.prompt.md` when user asks "how do I test X feature?"
- Direct invocation with test parameters

**Parameters Received**:
- `key`: Key name for directory structure (MANDATORY)
- `feature`: Name of feature being tested (e.g., "debug-panel-islamic-questions")
- `scenario`: Specific test scenario (e.g., "random-question-broadcast")
- `endpoints`: API endpoints involved (e.g., `/api/Question/Submit`)
- `tokens`: Override defaults if needed (default: Session 212 tokens)
- `multiUser`: Boolean indicating multi-browser test requirement
- `testType`: "functional" | "visual" | "both" (determines test generation approach)

**Returns to**: 
- Calling prompt with test file paths and execution instructions
- Key-data-stream documentation with test coverage details

**Artifacts Generated**:
1. TypeScript test file in `.github/prompts.keys/{key}/{{TEST_PATH}}/{feature}-{test-type}.spec.ts`
2. PowerShell orchestration script in `.github/prompts.keys/{key}/scripts/run-{feature}-test.ps1`
3. Test registry entry in `.github/prompts.keys/{key}/{{TEST_PATH}}/test-registry.md`
4. Execution instructions (how to run the tests)
5. Server management guidance (when to use orchestration vs webServer)

**Key Data Stream Entry Template**:
```markdown
## Test Coverage

### Active Tests (In Key Directory)
- **Test File**: .github/prompts.keys/{key}/{{TEST_PATH}}/{feature}-{test-type}.spec.ts
- **Orchestration Script**: .github/prompts.keys/{key}/scripts/run-{feature}-test.ps1
- **Test Type**: {Functional E2E | Visual Regression | Both}
- **Session Data**: Session 212 (Host: PQ9N5YWW, User: KJAHA99L)
- **Execution**: `.\.github\prompts.keys\{key}\scripts\run-{feature}-test.ps1`
- **Expected Result**: {description of expected test outcomes}
- **Status**: Active (pending promotion to production)

### Production Tests (Promoted)
- **Production Path**: {{TEST_PATH}}/UI/{feature}-{test-type}.spec.ts
- **Promoted**: {ISO-8601 timestamp}
- **Commit**: {SHA}
- **Status**: In production (key directory test deleted)
```
