# Functional E2E Test Template

**Purpose**: TypeScript template structure for generating Playwright functional end-to-end tests.

**When to Load**: During Step 3 (Functional Test Generation).

**Integration Point**: Called by test-generation.prompt.md when generating `.spec.ts` files.

---

## Core Template Structure

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

        // Collect browser console messages and assert no errors
        const consoleMessages: { type: string; text: string }[] = [];
        userPage.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));

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
            
            // Step 8: Assert no browser console errors occurred during the test
            const consoleErrors = consoleMessages.filter(m => m.type === 'error');
            expect(consoleErrors, `Browser console errors detected: ${consoleErrors.map(e => e.text).join('\n')}`).toHaveLength(0);
        } finally {
            // Cleanup
            await userContext.close();
            // await hostContext.close();
        }
    });
});
```

---

## Server Management Patterns

### Pattern 1: Standalone Mode (Recommended)

```powershell
# Set mode before test execution
$env:PW_MODE="standalone"

# Run tests (Playwright handles server lifecycle)
npx playwright test debug-panel-islamic-questions-broadcast.spec.ts --headed
```

**Benefits**:
- Automatic server startup/shutdown
- No manual server management
- Ideal for CI/CD pipelines

### Pattern 2: Manual Server Check

```typescript
test.beforeAll(async () => {
    // Verify server is accessible
    const response = await fetch('https://localhost:9091/api/health');
    if (!response.ok) {
        throw new Error('Server not running. Start with: dotnet run (in SPA/NoorCanvas)');
    }
});
```

**Use When**:
- Debugging specific server configurations
- Testing against existing running server

### Pattern 3: PowerShell Server Instructions

Include in test file comments:

```typescript
/**
 * Prerequisites:
 * Before running tests, you MUST start the server in a separate, elevated (Administrator) PowerShell window:
 * 
 * ```powershell
 * # Open PowerShell as Administrator (right-click → "Run as administrator")
 * cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
 * $env:ASPNETCORE_URLS = 'https://localhost:9091'
 * dotnet run
 * ```
 * 
 * Optionally, for CI/CD or automation, use standalone mode:
 * $env:PW_MODE="standalone"
 * npx playwright test
 */
```

---

## Multi-Browser Test Pattern

For testing multi-user interactions (e.g., host/participant synchronization):

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

**Use When**:
- Testing real-time synchronization (SignalR)
- Testing role-based features (host vs participant)
- Testing concurrent user interactions

---

## Console Error Monitoring (MANDATORY)

**ALWAYS include browser console log monitoring in generated tests.**

### Basic Console Log Capture

```typescript
const consoleErrors: string[] = [];
const consoleMessages: string[] = [];

page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    // Capture all messages for diagnostics
    consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    
    // Track errors separately
    if (type === 'error') {
        consoleErrors.push(text);
    }
});
```

### Filtering Critical Errors

```typescript
// After test actions
const criticalErrors = consoleErrors.filter(err => {
    // Ignore expected test environment warnings
    if (err.includes('SignalR') || err.includes('WebSocket')) return false;
    if (err.includes('CORS') || err.includes('Access-Control')) return false;
    
    // Flag critical errors
    if (err.includes('NotifyQuestionDeleted')) return true;
    if (err.includes('appendChild')) return true;
    if (err.includes('Uncaught')) return true;
    
    return false;
});

// Report but don't fail on non-critical warnings
if (consoleErrors.length > 0) {
    console.log('\n⚠️ Browser console errors detected:');
    consoleErrors.forEach(err => console.log(`  - ${err}`));
}

// Fail only on critical errors
expect(criticalErrors).toHaveLength(0);
```

### Page Error Monitoring

```typescript
// Also capture page-level JavaScript errors
page.on('pageerror', error => {
    const errorMsg = `[PAGE ERROR] ${error.message}`;
    consoleErrors.push(errorMsg);
    console.error(errorMsg);
});
```

### Full Diagnostic Pattern

```typescript
test.describe('Feature Test with Console Monitoring', () => {
    let consoleMessages: string[] = [];
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Reset for each test
        consoleMessages = [];
        consoleErrors = [];

        // Monitor console logs
        page.on('console', msg => {
            const text = msg.text();
            const type = msg.type();
            consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
            
            if (type === 'error' || type === 'warning') {
                consoleErrors.push(text);
            }
        });

        // Monitor page errors
        page.on('pageerror', error => {
            consoleErrors.push(`[PAGE ERROR] ${error.message}`);
        });
    });

    test.afterEach(async () => {
        // Report console activity
        if (consoleErrors.length > 0) {
            console.log('\n🔴 Browser Console Errors/Warnings:');
            consoleErrors.forEach(err => console.log(`  ${err}`));
        } else {
            console.log('\n✅ No browser console errors detected');
        }
    });

    test('Test scenario with console monitoring', async ({ page }) => {
        // Test implementation
    });
});
```

---

## Template Variables

When generating from this template, replace:

| Placeholder | Replace With | Example |
|-------------|-------------|---------|
| `{Feature Name}` | Primary feature being tested | "Share Button" |
| `{Scenario Description}` | Specific test scenario | "should copy canvas link to clipboard" |
| `{test-specific logic}` | Actual test interactions | `await page.click('[data-testid="share-button"]')` |
| `{assertions}` | Expected outcome validations | `await expect(page.locator('.success-toast')).toBeVisible()` |
| `{API validation}` | API response checks | `expect(response.status()).toBe(200)` |

---

## Session 212 Canonical URLs

Always use Session 212 for tests (from PlaywrightTestPaths.MD):

| Role | Token | URL |
|------|-------|-----|
| **Participant** | KJAHA99L | `https://localhost:9091/session/canvas/KJAHA99L` |
| **Host** | PQ9N5YWW | `https://localhost:9091/host/control-panel/PQ9N5YWW` |

---

## Reference

- See console-monitoring-patterns.md for advanced error filtering
- See authentication-detection.md for determining auth requirements
- See test-registry-protocol.md for duplicate prevention
- See test-generation.prompt.md for main execution flow
