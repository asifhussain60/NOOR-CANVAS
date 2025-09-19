# NOOR Canvas Testing Standards and Best Practices

**Version:** 2.0  
**Last Updated:** September 19, 2025  
**Scope:** Playwright E2E Testing, Unit Testing, Integration Testing

---

## 🎯 **Core Testing Philosophy**

### **Fresh Process Standard (CRITICAL)**
**MANDATORY: Kill all processes before running Playwright tests to ensure clean state**

#### **Standard Process Kill Command**
```powershell
# Kill all related processes to start fresh
taskkill /f /im dotnet.exe /t 2>$null; taskkill /f /im node.exe /t 2>$null; taskkill /f /im playwright.exe /t 2>$null; Write-Host "Processes killed - starting fresh"
```

#### **Why This is Required**
- **Port Conflicts:** Previous dotnet processes may still hold ports 9090/9091
- **State Pollution:** Cached application state can cause false test results
- **Process Leaks:** Background Playwright processes can interfere with new tests
- **Database Connections:** Stale EF Core connections can cause deadlocks
- **SignalR Hubs:** Previous SignalR connections can cause message routing issues

#### **Implementation in Tests**
```typescript
test.beforeEach(async ({ page }: { page: Page }) => {
    // Kill any existing processes and start fresh before each test
    console.log('🔄 FRESH-START: Starting test with clean process state...');
});
```

---

## 📋 **Playwright Test Structure Standards**

### **File Naming Convention**
```
issue-[NUMBER]-[brief-description].spec.ts
```
**Examples:**
- `issue-120-host-control-panel-routing-fix.spec.ts`
- `issue-114-countries-dropdown-loading.spec.ts`

### **Test Organization**
```typescript
test.describe('Issue-XXX: [Brief Description]', () => {
    const baseURL = process.env.BASE_URL || 'https://localhost:9091';
    
    // Session/test data constants
    const TEST_DATA = {
        token: 'EXPECTED_TOKEN',
        sessionId: 'EXPECTED_ID',
        // ... other constants
    };

    test.beforeEach(async ({ page }: { page: Page }) => {
        console.log('🔄 FRESH-START: Starting test with clean process state...');
    });

    test('should [specific behavior being tested]', async ({ page }) => {
        // Test implementation
    });
});
```

### **Required Test Documentation Header**
```typescript
/**
 * Issue-XXX [Issue Title]
 * 
 * This test verifies that [specific problem] is resolved by testing:
 * 1. [Step 1 description]
 * 2. [Step 2 description]
 * 3. [Step 3 description]
 * 
 * KEY FIXES TESTED:
 * - [File name]: [Specific change description]
 * - [File name]: [Specific change description]
 */
```

---

## 🔍 **Debugging and Monitoring Standards**

### **Required Logging Pattern**
```typescript
// Monitor navigation and API calls
const navigationLog: string[] = [];
const apiCalls: string[] = [];

page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/host/')) {
        apiCalls.push(`REQUEST: ${request.method()} ${url}`);
    }
});

page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/host/')) {
        apiCalls.push(`RESPONSE: ${response.status()} ${url}`);
    }
});

page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
        navigationLog.push(`NAVIGATION: ${frame.url()}`);
    }
});

// Log results at end of test
console.log('🔍 Navigation History:');
navigationLog.forEach(nav => console.log(nav));

console.log('🔍 API Call History:');
apiCalls.forEach(call => console.log(call));
```

### **Console Error Monitoring**
```typescript
const consoleErrors: string[] = [];
page.on('console', msg => {
    if (msg.type() === 'error') {
        consoleErrors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
});

// Validate no critical errors at end of test
const hasCriticalErrors = consoleErrors.some(error => 
    error.includes('Failed to') || 
    error.includes('404') ||
    error.includes('500')
);
expect(hasCriticalErrors).toBe(false);
```

---

## 🎮 **Test Execution Standards**

### **Application Startup Verification**
Before running ANY Playwright tests:

1. **Kill All Processes** (mandatory)
2. **Start Application Fresh**
```powershell
dotnet run --project "d:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\NoorCanvas.csproj" --no-build
```
3. **Wait for "Application started" message**
4. **Verify ports 9090/9091 are responding**

### **Test Execution Commands**
```powershell
# Individual test file
npx playwright test Tests/UI/issue-120-host-control-panel-routing-fix.spec.ts --headed

# With debugging
npx playwright test Tests/UI/issue-120-host-control-panel-routing-fix.spec.ts --headed --debug

# Full test suite (after verifying individual tests)
npx playwright test Tests/UI/ --headed
```

---

## ✅ **Validation Patterns**

### **URL Validation**
```typescript
// Positive assertions (what should be in URL)
await expect(page).toHaveURL(new RegExp(`/host/control-panel/${expectedToken}`));

// Negative assertions (what should NOT be in URL)
expect(page.url()).not.toContain('/host/control-panel/10227'); // Old session ID
```

### **Element Visibility Patterns**
```typescript
// Try multiple selectors for robustness
const selectors = [
    'h1:has-text("Expected Title")',
    '[data-testid="expected-element"]',
    '.expected-class'
];

let elementFound = false;
for (const selector of selectors) {
    try {
        if (await page.locator(selector).isVisible({ timeout: 5000 })) {
            elementFound = true;
            break;
        }
    } catch {
        // Continue to next selector
    }
}
expect(elementFound).toBe(true);
```

### **Data Loading Validation**
```typescript
// Wait for dynamic content
await page.waitForTimeout(3000);

// Check multiple possible data indicators
const dataElements = [
    page.locator(`text=${expectedData}`),
    page.locator('[data-testid="data-container"]'),
    page.locator('.data-loaded-indicator')
];

let dataLoaded = false;
for (const element of dataElements) {
    try {
        if (await element.isVisible({ timeout: 3000 })) {
            dataLoaded = true;
            break;
        }
    } catch {
        // Continue to next element
    }
}
expect(dataLoaded).toBe(true);
```

---

## 🚨 **Common Pitfalls to Avoid**

### **❌ Don't Do This:**
```typescript
// Hard-coded timeouts without context
await page.waitForTimeout(10000);

// Single selector assumptions
await page.locator('.specific-class').click();

// Ignoring process cleanup
// (Starting tests without killing processes)
```

### **✅ Do This Instead:**
```typescript
// Contextual waits
await page.waitForLoadState('networkidle');
await page.waitForSelector('.expected-element', { timeout: 5000 });

// Multiple selector fallbacks
const selectors = ['.primary-selector', '[data-testid="fallback"]'];
// ... (use pattern from above)

// Always start with process cleanup
// (Follow Fresh Process Standard)
```

---

## 📊 **Test Reporting Standards**

### **Required Console Output Pattern**
```typescript
console.log('🔧 [TEST-NAME]: [Brief description of what is being tested]...');
console.log('🏠 Step 1: [Description]...');
console.log('✅ [Success message]');
console.log('⚠️ [Warning message]'); 
console.log('❌ [Error message]');
console.log('🎯 [TEST-NAME] COMPLETED: [Summary of results]!');
```

### **Test Result Validation**
Every test should end with:
1. **Clear Pass/Fail Status**
2. **Logged Navigation History**
3. **Logged API Call History** 
4. **Validation of Core Functionality**
5. **No Unhandled Console Errors**

---

## 🔄 **Integration with Issue Tracking**

### **Test Creation Workflow**
1. **Issue Created** → Add to `IssueTracker/NOT STARTED/`
2. **Implementation Started** → Move to `IssueTracker/IN PROGRESS/`
3. **Code Fixed** → Create Playwright test in `Tests/UI/`
4. **Test Passes** → Update issue status with test results
5. **Issue Verified** → Move to `IssueTracker/COMPLETED/`

### **Test File Location Standards**
- **Primary Tests:** `Tests/UI/issue-[number]-[description].spec.ts`
- **Workspace Tests:** `Workspaces/Testing/Issue-[Number]-[Description]/`
- **Legacy Tests:** `PlayWright/tests/` (maintain but prefer Tests/UI for new tests)

---

## 🎯 **Quality Gates**

### **Before Committing Tests:**
- [ ] Fresh process kill command documented and tested
- [ ] Test passes consistently (3+ runs)
- [ ] All console errors addressed or documented
- [ ] Navigation and API logging implemented
- [ ] Multiple selector fallbacks implemented
- [ ] Issue tracking updated with test results

### **Before Marking Issue Complete:**
- [ ] Primary functionality test passes
- [ ] Backward compatibility test passes (if applicable)
- [ ] Error handling test passes (if applicable)
- [ ] Integration with existing workflow verified
- [ ] Documentation updated

---

*This document establishes the mandatory standards for NOOR Canvas testing practices. All contributors must follow these patterns to ensure reliable, maintainable, and debuggable tests.*