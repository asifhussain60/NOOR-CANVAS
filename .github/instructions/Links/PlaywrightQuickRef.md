# Playwright Testing Quick Reference

**Version**: 1.0.0  
**Last Updated**: 2025-10-12  
**Purpose**: Authoritative Playwright testing reference - eliminates ambiguity in test creation and execution

---

## 🎯 When User Says "Playwright Test" or "pwtest"

**Copilot Should Know**:
1. **Test Location**: `PlayWright/tests/` or `Tests/UI/` or `Workspaces/TEMP/` (for temporary tests)
2. **Configuration**: `config/testing/playwright.config.cjs`
3. **Test Data**: Session 212 with tokens KJAHA99L (user) / PQ9N5YWW (host)
4. **Base URL**: `https://localhost:9091`
5. **Execution Modes**: standalone, temp, CI
6. **Browser**: Chromium (default), Firefox, WebKit available

---

## 📁 Test File Structure

### Standard Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Navigate
    await page.goto('https://localhost:9091/route');
    
    // Interact
    await page.click('selector');
    
    // Assert
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Test File Naming Convention
- **Pattern**: `{feature}-{test-type}.spec.ts`
- **Examples**:
  - `session-canvas-loading.spec.ts`
  - `user-registration-flow.spec.ts`
  - `host-control-panel-navigation.spec.ts`

### Test Location Rules
1. **Permanent Tests**: `PlayWright/tests/` or `Tests/UI/`
2. **Temporary Tests**: `Workspaces/TEMP/` (auto-cleanup after task completion)
3. **Phase Tests**: `Workspaces/TEMP/` with naming: `{agent}-phase-{n}-{key}-{RUN_ID}.spec.ts`

---

## 🔧 Configuration Files

### Primary Config: `config/testing/playwright.config.cjs`

**Core Settings**:
```javascript
{
  timeout: 30000,
  testDir: '../../',
  testMatch: [
    '**/PlayWright/tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
    '**/Tests/UI/**/*.{test,spec}.{js,ts,jsx,tsx}',
    '**/Workspaces/TEMP/**/*.{test,spec}.{js,ts,jsx,tsx}'
  ],
  retries: 0,
  use: {
    baseURL: 'https://localhost:9091',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true
  }
}
```

### Environment Modes

#### 1. Standalone Mode (`PW_MODE=standalone`)
**Purpose**: Automatic .NET app lifecycle management

**Usage**:
```bash
$env:PW_MODE='standalone'; npx playwright test
```

**Features**:
- Starts .NET app automatically (`dotnet run` in `SPA/NoorCanvas`)
- Port: 9091
- Timeout: 60000ms for app startup
- Workers: 1 (sequential execution)
- Headless: false (visible browser)
- Viewport: 1280x720
- Video/Trace: retain-on-failure
- Report: `Workspaces/TEMP/playwright-report/standalone-html`

**When to Use**:
- Manual test execution
- Debugging tests
- Local development

#### 2. Temp Mode (`PW_MODE=temp`)
**Purpose**: Enhanced artifact collection

**Usage**:
```bash
$env:PW_MODE='temp'; npx playwright test
```

**Features**:
- Video: on (always)
- Trace: on (always)
- Workers: 1
- Retries: 0

**When to Use**:
- Debugging failures
- Capturing full test execution
- Temporary test runs

#### 3. CI Mode (default)
**Purpose**: Continuous Integration

**Features**:
- Headless: true
- Workers: multiple (parallel)
- Video: retain-on-failure
- Trace: on-first-retry

**When to Use**:
- Automated CI/CD pipelines
- Pre-commit hooks
- Batch test execution

---

## 🧪 Test Data (Session 212)

### Canonical Test Session
**Session ID**: `212`

**Why Session 212?**:
- Has complete transcript data
- Multiple participants registered
- Known stable state
- Used across all test documentation

### Test Tokens

#### User Token: `KJAHA99L`
**Purpose**: Participant/user testing

**API Response** (`/api/participant/session/KJAHA99L/me`):
```json
{
  "name": "Peter Parker",
  "userGuid": "b59e3dca-9330-40f5-9de8-9a5350fd2d6a",
  "email": "peter.parker@test.com",
  "country": "Bahrain",
  "joinedAt": "2025-10-01T14:28:43.523333"
}
```

**Test URLs**:
- Session Canvas: `https://localhost:9091/session/canvas/KJAHA99L`
- User Info: API-based participant loading

#### Host Token: `PQ9N5YWW`
**Purpose**: Host control panel testing

**Behavior**:
- Shows registration panel after authentication
- Different content/behavior than user token

**Test URLs**:
- Host Control Panel: `https://localhost:9091/host/control-panel/PQ9N5YWW`
- Registration: `https://localhost:9091/session/join/PQ9N5YWW`
- Session Canvas (Host): `https://localhost:9091/session/canvas/PQ9N5YWW`

### Other Test Data
- **Base URL**: `https://localhost:9091`
- **API Base**: `https://localhost:9091/api`
- **SignalR Hubs**: 
  - `/hub/session`
  - `/hub/qa`
  - `/hub/annotation`

---

## 🚀 Test Execution Commands

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test Tests/UI/session-canvas.spec.ts
```

### Run Tests in Headed Mode
```bash
npx playwright test --headed
```

### Run Tests with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run in Standalone Mode
```bash
$env:PW_MODE='standalone'; npx playwright test
```

### Run Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug Mode
```bash
npx playwright test --debug
```

### Generate Report
```bash
npx playwright show-report
```

---

## 📝 Test Writing Patterns

### API-Based Approach (Preferred)
**Pattern**: Load data from API, not localStorage

```typescript
test('should load participant from API', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  
  // API call happens automatically in component
  await page.waitForSelector('[data-testid="participant-name"]');
  
  const name = await page.locator('[data-testid="participant-name"]').textContent();
  expect(name).toBe('Peter Parker');
});
```

**Why?**: Eliminates localStorage dependency, more reliable

### Multi-Browser Isolation
**Pattern**: Each test starts fresh, no shared state

```typescript
test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Each test gets fresh browser context
    await page.goto('https://localhost:9091');
  });

  test('test 1', async ({ page }) => {
    // Isolated
  });

  test('test 2', async ({ page }) => {
    // Isolated
  });
});
```

### Waiting Strategies

#### Wait for Selector
```typescript
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
```

#### Wait for URL
```typescript
await page.waitForURL('**/expected-route');
```

#### Wait for API Response
```typescript
const response = await page.waitForResponse(
  response => response.url().includes('/api/endpoint')
);
```

#### Wait for Network Idle
```typescript
await page.waitForLoadState('networkidle');
```

### Assertion Patterns

#### Visibility
```typescript
await expect(page.locator('selector')).toBeVisible();
await expect(page.locator('selector')).toBeHidden();
```

#### Text Content
```typescript
await expect(page.locator('selector')).toHaveText('Expected Text');
await expect(page.locator('selector')).toContainText('Partial');
```

#### Count
```typescript
await expect(page.locator('selector')).toHaveCount(5);
```

#### URL
```typescript
await expect(page).toHaveURL('https://localhost:9091/expected-route');
```

#### Attribute
```typescript
await expect(page.locator('selector')).toHaveAttribute('attr', 'value');
```

---

## 🎯 Common Test Scenarios

### 1. Navigation Test
```typescript
test('should navigate to session canvas', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  await expect(page).toHaveURL(/session\/canvas/);
  await expect(page.locator('h1')).toBeVisible();
});
```

### 2. Form Submission Test
```typescript
test('should submit question', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  
  await page.fill('[data-testid="question-input"]', 'Test question');
  await page.click('[data-testid="submit-button"]');
  
  await expect(page.locator('[data-testid="question-submitted"]')).toBeVisible();
});
```

### 3. API Response Test
```typescript
test('should load data from API', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/participant/session/KJAHA99L/me')
  );
  
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  
  const response = await responsePromise;
  const data = await response.json();
  
  expect(data.name).toBe('Peter Parker');
});
```

### 4. SignalR Real-Time Test
```typescript
test('should receive SignalR updates', async ({ page }) => {
  await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
  
  // Trigger action that should broadcast
  await page.click('[data-testid="vote-button"]');
  
  // Wait for SignalR update to reflect
  await page.waitForSelector('[data-testid="vote-count-updated"]');
  
  const count = await page.locator('[data-testid="vote-count"]').textContent();
  expect(parseInt(count!)).toBeGreaterThan(0);
});
```

---

## 🐛 Debugging Tips

### 1. Slow Motion
```typescript
test.use({ 
  launchOptions: { 
    slowMo: 500  // Slows down by 500ms per action
  } 
});
```

### 2. Screenshots on Failure (Automatic)
- Configured in `playwright.config.cjs`
- Location: `test-results/` folder

### 3. Video Recording
- Standalone mode: Always on
- Temp mode: Always on
- Default: Only on failure

### 4. Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

### 5. Console Logs
```typescript
page.on('console', msg => console.log('Browser:', msg.text()));
```

---

## ⚙️ TypeScript Configuration

**File**: `config/testing/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "types": ["node", "@playwright/test"]
  },
  "include": [
    "../../PlayWright/**/*.ts",
    "../../Tests/UI/**/*.ts",
    "../../Workspaces/TEMP/**/*.ts"
  ]
}
```

---

## 🧹 Cleanup Rules

### Temporary Test Cleanup
**When**: After task completion (in key data stream update)

**Pattern**:
```powershell
Remove-Item "Workspaces/TEMP/*-phase-*.spec.ts" -Force
Remove-Item "Workspaces/TEMP/playwright-artifacts/*" -Recurse -Force
```

**Exceptions**: 
- Keep tests if `commit:false` flag used
- Keep tests marked for preservation in key metadata

---

## 📊 Test Reporting

### HTML Report (Default)
```bash
npx playwright show-report
```

**Location**: `playwright-report/` or mode-specific folder

### JSON Report
```bash
npx playwright test --reporter=json
```

### Custom Reporter
Configured in `playwright.config.cjs` per mode

---

## 🔗 Integration Points

### With Task Agent
- **Step 6.1**: Automatic Playwright test generation for UI tasks
- **Test Location**: `Workspaces/TEMP/` for phase tests
- **Cleanup**: After successful task completion

### With Test-Generation Agent
- Uses Session 212 canonical patterns
- Multi-browser testing support
- API-based test approaches

### With Validation Framework
- Level 5: E2E Testing with Playwright
- Required for UI feature tasks
- Optional for backend-only tasks

---

## 📚 Related Documentation

- **PlaywrightConfig.MD** - Detailed configuration reference
- **PlaywrightTestPaths.MD** - Canonical test patterns and Session 212 data
- **InfrastructureQuickRef.md** - API endpoints for test assertions
- **Architecture.md** - SignalR hubs and real-time testing

---

## 🔄 Auto-Update Protocol

**This file is maintained by**:
- **cohesion-review** agent - Updates during system-wide reviews
- **sync** agent - Keeps consistent with actual configuration files

**Update Triggers**:
- New test patterns discovered
- Configuration changes in `playwright.config.cjs`
- New test data added (beyond Session 212)
- New environment modes added
- Test execution strategy changes

**Verification**:
- Compare with `config/testing/playwright.config.cjs`
- Validate Session 212 test data still valid
- Ensure test commands match actual npm scripts
- Cross-reference with `PlaywrightConfig.MD` and `PlaywrightTestPaths.MD`

---

**Version History**:
- **1.0.0** (2025-10-12): Initial creation - Consolidated Playwright testing knowledge
