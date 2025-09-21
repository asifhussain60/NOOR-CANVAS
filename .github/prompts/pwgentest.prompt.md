mode: agent
name: pwgentest
description: >
  Generate production-ready Playwright E2E tests for NOOR Canvas with proven Blazor Server patterns.
  Includes battle-tested button enablement, database integration, and application health monitoring
  based on successful Session 212 test execution patterns.

arguments:
  - name: name
    required: true
    description: >
      Test name (used for filename and test suite title).
      Example: "Host Experience Flow", "User Session Creation"
  - name: targets
    required: true
    description: >
      Files to analyze for test generation (Razor pages, components, controllers, routes).
      Performs deep component analysis to extract navigation, bindings, and validation patterns.
  - name: notes
    required: false
    description: >
      Additional requirements and constraints (edge cases, multi-user scenarios, performance thresholds).
      Supports hints like 'sessionId:212', 'token:VNBPRVII', 'negative-testing', 'performance'.

# � Mission
# Generate TypeScript Playwright tests with proven NOOR Canvas patterns.
# Implements battle-tested Blazor Server solutions, reliable database integration,
# and comprehensive debugging capabilities for headless CI/CD execution.

    description: Files (Razor pages/components, controllers, routes) to review to build the test

## 📋 Required Analysis Process    required: true

  - name: notes

### **🔍 STEP 1: Deep Component Analysis (CRITICAL)**    description: Any extra constraints or scenarios (edge cases, negative paths, multi-user, perf thresholds)

For each file in `${targets}`, extract and document:    required: false

---t

#### **Razor Pages/Components Analysis**name: pwgentest

- **Routes & Navigation**: Extract `@page` directives and routing patternsdescription: Generate a production-ready Playwright E2E test aligned with this repo’s Playwright configuration. Tests must run headless, emit verbose logs, and capture trace/screenshots/video and reports for debugging.

- **Form Bindings**: Identify ALL `@bind-Value` properties requiring `fillBlazorInput()`arguments:

- **Conditional Logic**: Find `disabled="@(!condition)"` patterns needing enablement verification  - name: name

- **Cascading Elements**: Locate dropdowns/selects populated after other field changes    description: Name of the Playwright test (used for file name and suite title)

- **SignalR Integration**: Document real-time updates and state synchronization    required: true

- **Validation Rules**: Extract `[Required]`, `[StringLength]`, custom validators  - name: targets

    description: Files (Razor pages/components, controllers, routes) to review to build the test

#### **Controller/API Analysis**      required: true

- **Endpoints**: Document action methods and expected HTTP responses  - name: notes

- **Authorization**: Identify `[Authorize]` requirements and token dependencies    description: Any extra constraints or scenarios (edge cases, negative paths, multi-user, perf thresholds)

- **Model Binding**: Extract input DTOs and validation requirements    required: false

- **Error Handling**: Document exception responses for negative test cases---

- **Database Operations**: Identify session/token queries for test data setup

# Mission

#### **Workflow Mapping**

- **User Journey**: Map complete navigation flow from entry to completionGenerate a **TypeScript** Playwright test for the NOOR Canvas app that:

- **State Dependencies**: Document required application state for each step- Runs **headless** and produces **rich debug artifacts** (trace on first retry, screenshots & videos on failure, HTML + JSON reports) via the project’s `playwright.config.js`.

- **Critical Paths**: Identify must-work scenarios for business functionality- Emits **verbose Playwright logs** (the runner will set `DEBUG="pw:api,pw:test"`).

- **Error Scenarios**: Map validation failures and error states- Obeys **sequential, single-worker** semantics and relies on the repo’s **global setup/teardown** and **webServer** launcher. Do **not** attempt to boot the app in the test.

- Implements **Blazor Server binding** so button enablement and validation work reliably in CI.

---

## Inputs

# 🚨 Proven Technical Patterns (Battle-Tested Solutions)

- **NAME**: ${name}

## **✅ Blazor Server Input Binding (FIXES BUTTON BUGS)**- **TARGETS**: ${targets}

```ts- **NOTES** (optional): ${notes}

/**

 * CRITICAL: Blazor Server requires explicit DOM events for @bind-Value updates## Output

 * This pattern SOLVES button enablement issues that plagued previous tests

 */- **File**: `PlayWright/tests/{kebab-case(NAME)}.spec.ts`

async function fillBlazorInput(page: Page, selector: string, value: string) {- **Structure**:

  const input = page.locator(selector);  - Header comment with brief description + date

  await input.clear();                    // Clear existing  - `test.describe('{NAME} – summary', () => { ... })`

  await input.fill(value);               // Fill new value  - One or more `test('does X', async ({ page }) => { ... })` blocks

  await input.dispatchEvent('input');    // CRITICAL: Notify Blazor of change- **No global side-effects**; tests must be retry-safe.

  await input.dispatchEvent('change');   // CRITICAL: Trigger validation

  await page.waitForTimeout(2000);       // PROVEN: Wait for Blazor processing---

}

# 🚨 **MANDATORY BLAZOR PATTERNS (Proven Working)**

async function verifyButtonEnabled(page: Page, selector: string, timeout = 5000) {

  await expect(page.locator(selector)).toBeEnabled({ timeout });## **✅ CRITICAL: Blazor Server Input Binding (FIXES BUTTON ENABLEMENT BUGS)**

}

```**Problem Solved**: Playwright `.fill()` does NOT trigger Blazor `@bind-Value` updates, causing buttons to remain disabled

**Our Solution**: Proven pattern from `host-experience-complete-workflow.spec.ts` success:

## **✅ Database Integration (Reliable Session 212 Fallback)**

```ts```ts

import { DatabaseTokenManager } from '../../../Tests/UI/database-token-manager.ts';/**

 * MANDATORY: Use this exact pattern for ALL Blazor input fields

// PROVEN: Session 212 tokens are PERMANENT in AHHOME database * This pattern WORKS and fixes button enablement issues

const dbManager = new DatabaseTokenManager(); */

const hostToken = await dbManager.getHostToken();    // Falls back to VNBPRVIIasync function fillBlazorInput(page: Page, selector: string, value: string) {

const userToken = await dbManager.getUserToken();    // Falls back to DPH42JR5  const input = page.locator(selector);

  await input.clear();                    // Clear existing value

  - title: Generate Complete TypeScript Test
    details: |
      Create production-ready Playwright test with full error handling and debug capabilities.
      
      PowerShell generation logic:
      ```powershell
      Write-Host "🚀 Generating TypeScript Playwright test..." -ForegroundColor Green
      
      # Build test file name (kebab-case conversion)
      $testName = "${name}" -replace '\s+', '-' -replace '[^a-zA-Z0-9\-]', '' | ForEach-Object { $_.ToLower() }
      $testPath = "Tests/UI/$testName.spec.ts"
      
      Write-Host "📁 Test file: $testPath" -ForegroundColor Cyan
      
      # Generate test content with proven patterns
      $testContent = @"
      /**
       * Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
       * Test: ${name}
       * Purpose: E2E test with proven NOOR Canvas Blazor Server patterns
       */
      
      import { test, expect, Page } from '@playwright/test';
      import { DatabaseTokenManager } from '../utils/database-token-manager';
      
      // PROVEN HELPER: Blazor Server Input Binding (CRITICAL FOR SUCCESS)
      async function fillBlazorInput(page: Page, selector: string, value: string) {
        const input = page.locator(selector);
        await input.clear();
        await input.fill(value);
        await input.dispatchEvent('input');    // CRITICAL: Notify Blazor
        await input.dispatchEvent('change');   // CRITICAL: Trigger validation
        await page.waitForTimeout(2000);       // PROVEN: Wait for processing
      }
      
      // PROVEN HELPER: Safe Button Clicking (PREVENTS FAILURES)
      async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
        const button = page.locator(selector);
        await expect(button).toBeEnabled({ timeout }); // CRITICAL: Verify before clicking
        await button.click();
        console.log('✅ Button clicked: \${selector}');
      }
      
      test.describe('${name}', () => {
        let dbManager: DatabaseTokenManager;
        let hostToken: string;
        let userToken: string;
      
        test.beforeEach(async ({ page }) => {
          // Database token setup with Session 212 fallback
          dbManager = new DatabaseTokenManager();
          hostToken = await dbManager.getHostToken();   // Falls back to VNBPRVII
          userToken = await dbManager.getUserToken();   // Falls back to DPH42JR5
      
          // Validate tokens (prevents runtime failures)
          expect(hostToken).toMatch(/^[A-Z0-9]{8}\$/);
          expect(userToken).toMatch(/^[A-Z0-9]{8}\$/);
      
          // Application health check with realistic timing
          await page.goto('http://localhost:9090', { 
            waitUntil: 'networkidle',
            timeout: 30000  // PROVEN: 30s for ASP.NET Core startup
          });
          await expect(page).toHaveTitle(/Noor Canvas|NOOR CANVAS/, { timeout: 10000 });
          
          console.log('✅ Test setup complete - App ready, tokens validated');
        });
      
        test('primary workflow', async ({ page }) => {
          console.log('🧪 Starting test execution...');
          
          // TODO: Generated based on component analysis of \${targets}
          // Navigation sequence based on @page directives
          // Form filling using fillBlazorInput for @bind-Value properties  
          // Button interactions using clickEnabledButton for safety
          // Validation verification and error handling
          // Final outcome verification
          
          // Example navigation pattern:
          // await page.goto('/target-route');
          // await expect(page).toHaveURL(/\/target-route/);
          // await fillBlazorInput(page, '#input-field', 'test-value');
          // await clickEnabledButton(page, '#submit-button');
        });
      });
      "@
      
      # Write test file
      $testContent | Out-File -FilePath $testPath -Encoding UTF8 -Force
      Write-Host "✅ Test generated: $testPath" -ForegroundColor Green
      Write-Host "📋 Includes proven Session 212 patterns and database fallback" -ForegroundColor Yellow
      ```

guardrails:
  - title: Blazor Server Compliance
    check: Ensure all form inputs use fillBlazorInput() pattern with dispatchEvent calls
  - title: Button Safety  
    check: Verify all button clicks have toBeEnabled() verification before clicking
  - title: Token Validation
    check: Confirm hostToken and userToken match /^[A-Z0-9]{8}$/ regex pattern
  - title: Application Health
    check: Include realistic 30s timeout for ASP.NET Core startup with networkidle wait
  - title: Database Fallback
    check: Use DatabaseTokenManager with Session 212 fallback tokens (VNBPRVII/DPH42JR5)

quality_checklist:

```test.beforeEach(async ({ page }) => {

  // CRITICAL: Wait for enhanced monitoring to confirm app is truly ready

---  await page.goto('http://localhost:9090', { 

    waitUntil: 'networkidle',

# 📝 Test Generation Template    timeout: 30000  // PROVEN: 30s timeout for ASP.NET Core startup

  });

## Required Imports & Setup  

```ts  // Verify basic page load succeeded

/**  await expect(page).toHaveTitle(/Noor Canvas|NOOR CANVAS/, { timeout: 10000 });

 * ${name} - Generated E2E Test});

 * Targets: ${targets}```

 * Notes: ${notes}

 * Generated: ${new Date().toISOString().slice(0,10)}## **✅ DATABASE INTEGRATION (Proven Reliable Fallback)**

 */

import { test, expect, type Page } from '@playwright/test';**Problem Solved**: Test failures due to missing sessions in AHHOME database  

import { DatabaseTokenManager } from '../../../Tests/UI/database-token-manager.ts';**Our Solution**: Permanent Session 212 tokens with graceful fallback:

```

```ts

## Test Structure Requirementsimport { DatabaseTokenManager } from '../../../Tests/UI/database-token-manager.ts';

- **File Location**: `PlayWright/tests/{kebab-case(name)}.spec.ts`

- **Test Suite**: `test.describe('${name}', () => { ... })`/**

- **Descriptive Test Names**: Focus on business functionality * PROVEN PATTERN: Real database tokens with reliable fallback

- **beforeEach**: Application health verification * Session 212 tokens are PERMANENT in AHHOME database:

- **Comprehensive Assertions**: URL, title, content, state verification * - Host Token: VNBPRVII (always works)

 * - User Token: DPH42JR5 (always works)  

## Quality Checklist */

- [ ] `fillBlazorInput()` used for ALL form inputsconst dbManager = new DatabaseTokenManager();

- [ ] Button enablement verified before clickingconst hostToken = await dbManager.getHostToken();   // Falls back to VNBPRVII if DB unavailable

- [ ] Database tokens with fallback patternsconst userToken = await dbManager.getUserToken();   // Falls back to DPH42JR5 if DB unavailable

- [ ] Navigation verified with URL assertions

- [ ] Error scenarios covered based on controller analysis/**

- [ ] Realistic timeouts (2s Blazor, 30s startup, 10s expects) * CRITICAL: Always verify tokens are valid 8-character format

- [ ] Security-safe logging (no token exposure) */

- [ ] Retry-stable design (no transient dependencies)expect(hostToken).toMatch(/^[A-Z0-9]{8}$/);

expect(userToken).toMatch(/^[A-Z0-9]{8}$/);

---```



# 📖 How This Test Generation Works (Plain English)## **⚡ MANDATORY TEST PATTERNS (From Working Tests)**



## What This Prompt Does### **Navigation & URL Validation**

This prompt helps GitHub Copilot create **reliable website tests** for the NOOR Canvas application. Think of it as a recipe that ensures every test follows proven patterns that actually work.```ts

// PROVEN: Always verify URL changes after navigation

## Why These Patterns Matterawait page.goto(`/host/control-panel/${hostToken}`);

**The Problem**: Regular web testing tools don't work well with Blazor Server (the technology NOOR Canvas uses) because Blazor has special requirements for form inputs and button interactions.await expect(page).toHaveURL(new RegExp(`/host/control-panel/${hostToken}`));

await expect(page).toHaveTitle(/Control Panel|Host Dashboard/, { timeout: 10000 });

**Our Solution**: We've discovered specific techniques through real testing that solve these problems:```



1. **Form Filling**: Instead of just typing in form fields, we send special "events" that tell Blazor the field changed### **Blazor Form Interaction (CRITICAL)**

2. **Button Clicking**: We always check that buttons are enabled before clicking them```ts

3. **Database Setup**: We use real session tokens from the database, but have backup tokens if the database isn't available// MANDATORY: Use fillBlazorInput for ALL form fields

4. **App Startup**: We wait realistically for the application to fully start (30 seconds) instead of assuming it's ready immediatelyawait fillBlazorInput(page, '#hostTokenInput', hostToken);



## How the Generated Test Works// MANDATORY: Verify button enablement before clicking

1. **Setup Phase**: Connects to the database and gets valid session tokensawait clickEnabledButton(page, 'button:has-text("Access Control Panel")', 10000);

2. **Navigation**: Opens the correct web pages in the right order```

3. **Form Interaction**: Fills out forms using the special Blazor-compatible method

4. **Verification**: Checks that each step worked correctly (right page loaded, buttons enabled, etc.)### **Dropdown Handling (Blazor Cascading)**

5. **Cleanup**: Handles errors gracefully and provides helpful debug information```ts

// PROVEN: Wait for Blazor to populate dropdowns after token validation

## What Makes This Differentawait page.waitForTimeout(3000); // Allow cascading dropdowns to load

- **Battle-Tested**: These patterns come from solving real problems in actual testingconst dropdown = page.locator('select#sessionSelector');

- **Blazor-Aware**: Specifically designed for Blazor Server applications like NOOR Canvas  await expect(dropdown.locator('option')).toHaveCount(gt(1)); // Verify options loaded

- **CI/CD Ready**: Works reliably in automated testing environmentsawait dropdown.selectOption({ index: 1 }); // Select first real option

- **Debug-Friendly**: Captures screenshots, videos, and logs when tests fail```

- **Realistic**: Uses actual timing expectations based on how the application really behaves

### **Enhanced Monitoring Integration**

The result is tests that **actually work** instead of tests that fail for technical reasons unrelated to the application functionality.```ts
// OPTIONAL: Use EnhancedTestMonitor for health checks (non-fatal)
import { EnhancedTestMonitor } from '../../../Tests/UI/enhanced-test-monitor.ts';
const monitor = new EnhancedTestMonitor();
await monitor.ensureApplicationReady(); // Graceful health check
```

## **🎯 PROVEN SUCCESS PATTERNS**

### **Locator Best Practices**
```ts
// PREFERRED: Modern Playwright locator APIs
await page.getByRole('button', { name: 'Access Control Panel' }).click();
await page.getByLabel('Host Token').fill(hostToken);
await page.getByPlaceholder('Enter 8-character token').fill(userToken);
```

### **Logging & Security**  
```ts
// SAFE: Log operations without exposing secrets
console.log(`✅ Navigated to host control panel with token ending in ...${hostToken.slice(-4)}`);
console.log(`✅ Button enabled after token validation: ${hostToken.slice(0,4)}****`);
```

### **Error Handling & Resilience**
```ts
// PROVEN: Graceful fallback for database operations
try {
  const hostToken = await dbManager.getHostToken();
  console.log(`✅ Retrieved host token from database: ...${hostToken.slice(-4)}`);
} catch (error) {
  console.log(`⚠️ Database unavailable, using fallback token: VNBPRVII`);
  const hostToken = 'VNBPRVII'; // Permanent Session 212 fallback
}
```

### **CI/CD Stability Rules**
- **NEVER** set `headless: false` (enforced by config)
- **NEVER** override reporters in tests  
- **ALWAYS** design for retry stability (no transient state dependencies)
- **ALWAYS** use configured timeouts (expect.timeout ≈ 10s)
- Artifacts auto-generated: trace on first retry, screenshots/videos on failure, HTML/JSON reports

Example Skeleton (adapt to TARGETS/NOTES)
/**
 * ${name} — auto-generated E2E
 * Targets: ${targets}
 * Notes: ${notes}
 * Generated: ${new Date().toISOString().slice(0,10)}
 */

import { test, expect, type Page } from '@playwright/test';
import { DatabaseTokenManager } from '../utils/database-token-manager';
import { EnhancedTestMonitor } from '../utils/enhanced-test-monitor';

async function fillBlazorInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
  await page.waitForTimeout(2000);
}

test.describe('${name}', () => {
  test('navigates and completes the primary flow', async ({ page }) => {
    // Readiness
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/NOOR|Canvas/i);

    // (Optional) DB token acquisition
    let session: any;
    try {
      session = await DatabaseTokenManager.getHostSessionToken();
      console.log('[token] using session id:', session?.id?.slice(-6));
    } catch {
      console.log('[token] DatabaseTokenManager unavailable; proceeding without token');
    }

    // Navigate to first target view (adjust selectors based on TARGETS)
    await page.getByRole('link', { name: /host/i }).click();

    // Example of Blazor-bound field
    if (session?.hostToken) {
      await fillBlazorInput(page, '[data-testid="host-token"]', session.hostToken);
    }

    // Button enablement must be asserted before click
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Validate route/content
    await expect(page).toHaveURL(/\/host\/session/i);
    await expect(page.getByRole('heading', { name: /session/i })).toBeVisible();

    // Add more steps derived from ${targets}...
  });
});
```

## **🔍 COMPONENT ANALYSIS METHODOLOGY**

When analyzing `${targets}` files, extract these critical elements:

### **From Razor Pages/Components**
- **Routes**: `@page` directives → expected navigation sequence
- **Bound Inputs**: `@bind-Value` dependencies → requires `fillBlazorInput()` pattern  
- **Conditional Buttons**: `disabled="@(!isValid)"` → requires enablement verification
- **Cascading Dropdowns**: API calls populating `<select>` → wait for options before selection

### **From Controllers/APIs**
- **Endpoints**: Action methods → expected HTTP responses for validation
- **Validation Logic**: Model binding → input requirements for successful submission  
- **Error Responses**: Exception handling → negative test case scenarios

  - title: File Structure & TypeScript Quality
    items:
      - Uses proper TypeScript typing with Page imports
      - File location follows convention - Tests/UI/{kebab-case-name}.spec.ts
      - Modern Playwright locator APIs (getByRole, getByLabel) preferred over CSS selectors
      - Proper test.describe structure with descriptive names
      
  - title: NOOR Canvas Blazor Server Compliance  
    items:
      - fillBlazorInput() function used for ALL form input fields
      - dispatchEvent('input') and dispatchEvent('change') calls after fill operations
      - 2000ms waitForTimeout after input operations for Blazor processing
      - Button enablement verification with expect().toBeEnabled() before clicking
      
  - title: Database & Token Management
    items:
      - DatabaseTokenManager integration with Session 212 fallback (VNBPRVII/DPH42JR5)
      - Token validation with /^[A-Z0-9]{8}$/ regex pattern 
      - Graceful fallback handling for database unavailability
      - Security-safe logging using token slicing (token.slice(-4))
      
  - title: Application Health & Stability
    items:
      - Realistic 30-second timeout for ASP.NET Core application startup
      - networkidle wait condition for proper page load
      - URL and title verification for navigation success
      - CI/CD ready with headless compatibility and retry stability
      
  - title: Error Handling & Edge Cases
    items:
      - Try-catch blocks for database operations with fallback tokens
      - Validation error scenarios based on component analysis
      - Multi-user scenarios if specified in notes
      - Performance threshold considerations for timeout configuration

---

## 📝 **OUTPUT SPECIFICATION**

Generate a complete, production-ready TypeScript Playwright test file at:
**`Tests/UI/{kebab-case(name)}.spec.ts`**

**Requirements:**
- Include ALL proven patterns from successful Session 212 execution
- Apply component analysis findings from ${targets} files  
- Integrate edge cases and constraints from ${notes}
- Follow NOOR Canvas Blazor Server architecture requirements
- Ensure CI/CD compatibility with project's playwright.config.js
- Provide comprehensive debug artifacts and verbose logging