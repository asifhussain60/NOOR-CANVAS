# Console Monitoring Patterns

**Purpose**: Browser console log capture and error filtering for Playwright tests.

**When to Load**: Referenced by test templates (functional-e2e-template.md, visual-percy-template.md).

**Integration Point**: Embedded in generated test files for diagnostic output.

---

## Overview

**MANDATORY for ALL tests**: Include browser console log monitoring to capture JavaScript errors, warnings, and diagnostic output.

**Benefits**:
- Early detection of JavaScript runtime errors
- Capture SignalR/WebSocket issues
- Track API failures
- Monitor performance warnings
- Distinguish between critical errors and expected warnings

---

## Basic Console Log Capture

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

---

## Filtering Critical Errors

Not all console errors should fail tests. Filter out expected warnings:

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

---

## Page Error Monitoring

Capture page-level JavaScript errors (e.g., unhandled exceptions):

```typescript
// Also capture page-level JavaScript errors
page.on('pageerror', error => {
    const errorMsg = `[PAGE ERROR] ${error.message}`;
    consoleErrors.push(errorMsg);
    console.error(errorMsg);
});
```

---

## Full Diagnostic Pattern

Use `beforeEach` and `afterEach` for comprehensive monitoring:

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
        await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
        
        // ... test logic ...
        
        // Console monitoring happens automatically via beforeEach/afterEach
    });
});
```

---

## Common Ignored Warnings

These are expected in test environments and should be filtered out:

| Warning Pattern | Reason to Ignore |
|-----------------|------------------|
| `SignalR` | Connection warnings during server startup |
| `WebSocket` | Socket closure during test teardown |
| `CORS` | Cross-origin requests in local testing |
| `Access-Control` | CORS-related headers |
| `Failed to load resource` | Transient network issues |
| `favicon.ico` | Missing favicon (cosmetic) |

**Example filter**:
```typescript
const criticalErrors = consoleErrors.filter(err => {
    // Ignore expected warnings
    const ignorePatterns = [
        'SignalR',
        'WebSocket',
        'CORS',
        'Access-Control',
        'Failed to load resource',
        'favicon.ico'
    ];
    
    return !ignorePatterns.some(pattern => err.includes(pattern));
});
```

---

## Critical Error Patterns

These patterns indicate real issues and should fail tests:

| Error Pattern | Indicates |
|---------------|-----------|
| `Uncaught` | Unhandled JavaScript exception |
| `NotifyQuestionDeleted` | SignalR callback error |
| `appendChild` | DOM manipulation error |
| `Cannot read property` | Null reference error |
| `undefined is not a function` | Missing function/method |
| `Network request failed` | API call failure |

**Example critical filter**:
```typescript
const criticalErrors = consoleErrors.filter(err => {
    const criticalPatterns = [
        'Uncaught',
        'NotifyQuestionDeleted',
        'appendChild',
        'Cannot read property',
        'undefined is not a function',
        'Network request failed'
    ];
    
    return criticalPatterns.some(pattern => err.includes(pattern));
});

expect(criticalErrors, `Critical errors detected: ${criticalErrors.join('\n')}`).toHaveLength(0);
```

---

## Request/Response Monitoring

Monitor network requests for API failures:

```typescript
page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.method()} ${request.url()}`);
    console.error(`  Failure: ${request.failure()?.errorText}`);
});

page.on('response', response => {
    if (!response.ok()) {
        console.warn(`[HTTP ${response.status()}] ${response.url()}`);
    }
});
```

---

## Advanced Diagnostic Output

For debugging, capture full console message objects:

```typescript
const consoleMessages: { type: string; text: string; location: string }[] = [];

page.on('console', msg => {
    consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url || 'unknown'
    });
});

// After test
test.afterEach(async () => {
    if (consoleMessages.length > 0) {
        console.log('\n📋 Full Console Log:');
        consoleMessages.forEach(msg => {
            console.log(`  [${msg.type.toUpperCase()}] ${msg.text}`);
            console.log(`    Location: ${msg.location}`);
        });
    }
});
```

---

## Performance Monitoring

Track slow operations via console timing:

```typescript
page.on('console', msg => {
    const text = msg.text();
    
    // Capture performance warnings
    if (text.includes('Slow operation') || text.includes('Performance')) {
        console.warn(`⚠️ Performance issue: ${text}`);
    }
    
    // Capture console.time() measurements
    if (msg.type() === 'timeEnd') {
        console.log(`⏱️ Timing: ${text}`);
    }
});
```

---

## Multi-User Console Monitoring

For multi-browser tests (host + participant):

```typescript
test('Multi-user with console monitoring', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    
    const participantContext = await browser.newContext();
    const participantPage = await participantContext.newPage();
    
    const hostConsole: string[] = [];
    const participantConsole: string[] = [];
    
    hostPage.on('console', msg => {
        const text = `[HOST ${msg.type().toUpperCase()}] ${msg.text()}`;
        hostConsole.push(text);
        console.log(text);
    });
    
    participantPage.on('console', msg => {
        const text = `[PARTICIPANT ${msg.type().toUpperCase()}] ${msg.text()}`;
        participantConsole.push(text);
        console.log(text);
    });
    
    try {
        // Test logic
        await hostPage.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await participantPage.goto('https://localhost:9091/session/canvas/KJAHA99L');
        
        // ... test interactions ...
        
        // Check for errors in both contexts
        const hostErrors = hostConsole.filter(msg => msg.includes('[HOST ERROR]'));
        const participantErrors = participantConsole.filter(msg => msg.includes('[PARTICIPANT ERROR]'));
        
        expect(hostErrors, `Host console errors: ${hostErrors.join('\n')}`).toHaveLength(0);
        expect(participantErrors, `Participant console errors: ${participantErrors.join('\n')}`).toHaveLength(0);
    } finally {
        await hostContext.close();
        await participantContext.close();
    }
});
```

---

## Best Practices

1. **Always Monitor**: Include console monitoring in every test
2. **Filter Wisely**: Don't fail tests on expected warnings
3. **Report All**: Log all console activity for diagnostics
4. **Fail Critically**: Only fail tests on critical errors
5. **Context Labeling**: Use prefixes like `[HOST]`, `[PARTICIPANT]` for multi-user tests
6. **Timing Matters**: Capture console logs before assertions to see failure context

---

## Reference

- See functional-e2e-template.md for console monitoring integration
- See visual-percy-template.md for Percy test console handling
- See test-generation.prompt.md for when to apply monitoring
