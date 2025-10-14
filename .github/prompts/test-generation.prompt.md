---
mode: agent
purpose: Generate Playwright end-to-end tests for user-facing functionality
inputs: feature, scenario, endpoints, tokens
outputs: TypeScript test file in Workspaces/TEMP/ (MANDATORY - all new tests)
---

# Test Generation Agent

## Role
You are the **Test Generation Agent** responsible for creating Playwright end-to-end tests following canonical patterns and proven test data.

## Mandatory Prerequisites


### 1. Server Management Protocol
**MANDATORY SERVER STARTUP BEFORE TESTS**

**Before running any Playwright or Percy automated tests, you MUST start the NoorCanvas application in a separate, elevated (Administrator) PowerShell window. Do NOT use the VS Code integrated terminal.**

**How to start the app for tests:**
1. Open a new Windows PowerShell window as Administrator (right-click → "Run as administrator").
2. Run the following command:
    ```powershell
    cd 'd:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'; dotnet run
    ```
3. Confirm the server is running and accessible at `https://localhost:9091`.
4. Leave this window open and running during all Playwright and Percy test execution.

**Do NOT use the VS Code terminal for server startup when running automated tests.**

---

```typescript
// Option A: PW_MODE=standalone (PREFERRED)
// - Playwright manages .NET app lifecycle automatically
// - Set via: $env:PW_MODE="standalone" (PowerShell)
// - webServer config handles startup/shutdown
// - Use this for CI/CD and automated test runs

// Option B: Manual Server Check (for development)
// - Check if server is already running on port 9091
// - If running: connect to existing instance
// - If not running: fail fast with clear error message
```

**Test Execution Strategy**:
1. **Check running processes**: `Get-Process | Where-Object {$_.ProcessName -eq "NoorCanvas"}`
2. **If server running**: Proceed with tests (faster feedback loop)
3. **If server NOT running**: 
    - **CI/CD Mode**: Use `PW_MODE=standalone` to auto-start
    - **Dev Mode**: You MUST start the server manually in a separate admin PowerShell window (see above) OR use standalone mode
4. **Never**: Start multiple conflicting server instances

### 2. Canonical References (MANDATORY)
- **`InfrastructureQuickRef.md`**: Database connections, API endpoints, SignalR hubs, Session 212 tokens
- **`PlaywrightConfig.MD`**: Configuration, modes, artifact paths, webServer settings
- **`PlaywrightTestPaths.MD`**: Proven tokens, URLs, API patterns, expected responses
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
   - SignalR: Wait for specific broadcast events or UI state changes
6. **Artifact capture**: `PW_MODE=standalone` enables auto-screenshots/traces on failure

### Test Type Selection (See PlaywrightQuickRef.md Decision Matrix)

**When to generate Functional E2E Tests (Playwright):**
- User workflows (login, navigation, form submission)
- API contract validation (endpoints, response format)
- SignalR real-time updates (question broadcasts, voting)
- Multi-user synchronization (host/participant interactions)
- Accessibility features (ARIA, keyboard navigation)
- Component behavior (without visual changes)

**When to generate Visual Regression Tests (Percy + Playwright):**
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
- `debug-panel-islamic-questions-functional.spec.ts` (Playwright E2E)
- `canvas-questions-orange-card-visual.spec.ts` (Percy visual)
- `question-enter-key-submit-functional.spec.ts` (Playwright E2E)
- `session-canvas-responsive-visual.spec.ts` (Percy multi-viewport)
Examples:
- `debug-panel-islamic-questions-broadcast.spec.ts`
- `question-enter-key-submit.spec.ts`
- `question-multi-user-sync.spec.ts`

### Test Location
- **ALL new tests**: `Workspaces/TEMP/` (MANDATORY)
- **Production promotion**: Tests move to `Tests/UI/` ONLY during task completion workflow
- **Rationale**: Keeps Tests/UI/ clean, allows experimentation, clear quality gate

## Template Structure

```typescript
import { test, expect, Page, Browser } from '@playwright/test';

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
 * - PlaywrightTestPaths.MD: Session 212 tokens
 * - PlaywrightConfig.MD: Test configuration
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
            // Step 2: Navigate using canonical URLs from PlaywrightTestPaths.MD
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
            
            // Step 7: Verify API responses match PlaywrightTestPaths.MD patterns
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

# Run tests (Playwright handles server lifecycle)
npx playwright test debug-panel-islamic-questions-broadcast.spec.ts --headed
```

### Example 2: Manual Server Check
```typescript
test.beforeAll(async () => {
    // Verify server is accessible
    const response = await fetch('https://localhost:9091/api/health');
    if (!response.ok) {
        throw new Error('Server not running. Start with: dotnet run (in SPA/NoorCanvas)');
    }
});
```


### Example 3: PowerShell Server Check (in test instructions)
```markdown
## Prerequisites
Before running tests, you MUST start the server in a separate, elevated (Administrator) PowerShell window:

```powershell
# Open PowerShell as Administrator (right-click → "Run as administrator")
cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
dotnet run
```

# Optionally, for CI/CD or automation, use standalone mode:
$env:PW_MODE="standalone"
npx playwright test
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
        
        // Wait for SignalR broadcast
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
// Verify API responses match PlaywrightTestPaths.MD expected data
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
    err.includes('SignalR')
);

expect(criticalErrors).toHaveLength(0);
```

---

## Percy Visual Regression Test Template

**Use this template when generating visual regression tests (see Test Type Selection above).**

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

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
 * - PlaywrightQuickRef.md: Decision matrix for when to use Percy
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
npm run test:percy:headed -- Tests/UI/feature-visual.spec.ts

# Run all visual tests (headless)
npm run test:percy

# Run visual test without Percy (for debugging)
npx playwright test Tests/UI/feature-visual.spec.ts --headed
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

Generate complete TypeScript test file with:
1. **File header**: Feature description, prerequisites, references
2. **Imports**: Playwright test framework
3. **Test suite**: Descriptive test.describe block
4. **Server check**: beforeAll hook with readiness verification
5. **Test cases**: One or more test() blocks with clear step comments
6. **Cleanup**: Proper context/page closure in finally blocks
7. **Documentation**: Inline comments explaining critical waits and assertions

## Success Criteria

- ✅ Uses canonical Session 212 data from PlaywrightTestPaths.MD
- ✅ Includes server readiness check (standalone mode aware)
- ✅ Follows proven API-based participant loading pattern
- ✅ Implements proper wait strategies (networkidle + explicit timeouts)
- ✅ Tests multi-browser scenarios when applicable
- ✅ Monitors console for critical errors
- ✅ Validates API responses against expected data
- ✅ Includes cleanup in finally blocks
- ✅ File saved to Workspaces/TEMP/ (production promotion happens in task completion)

## Workflow Integration

**Invoked by**: task.prompt.md when test generation is required
**Returns to**: task.prompt.md with test file path for key-data-stream documentation
**Artifacts**: TypeScript test file, execution instructions, server management guidance
