# NOOR Canvas UI Test Runner Guide

## Overview

This guide provides comprehensive UI testing for NOOR Canvas using Playwright. The test suite covers:

- **Host Authentication Flow** - Landing page, token validation, session configuration, simplified architecture
- **Session Opener & User Auth** - Session creation, token generation, user join flow validation
- **Issue-106 Cascading Dropdowns** - 2-second delays, race condition prevention, Open Session functionality
- **User Authentication** - Token entry, Issue-102 routing fixes, session access
- **API Integration** - Token generation/validation, database connectivity, Islamic content loading
- **Simplified Architecture Tests** - 3-table schema validation, embedded token authentication

## 🆕 Authentication Flow Tests (Simplified Architecture)

### New Test Files
- `host-authentication-flow-e2e.spec.ts` - Complete host authentication validation
- `session-opener-user-auth-flow.spec.ts` - Session management and user workflows  

### Key Validations
- ✅ No more "Authentication service unavailable" errors
- ✅ Host token `VIS68UW4` validates successfully  
- ✅ Session creation with embedded tokens
- ✅ User authentication link generation
- ✅ Simplified 3-table architecture operational

### Quick Start
```bash
# Run authentication tests
npm run test:simplified-auth

# PowerShell runner with app startup
.\Tests\run-auth-tests.ps1 -TestType all -Headed -StartApp
```
- **Performance & Security** - Load testing, validation, SQL injection protection

## Quick Start

### Prerequisites

- **VSCode with Playwright Extension**: Installed and active
- **Node.js**: v16+ recommended (for installation only)
- **NOOR Canvas Application**: Running on https://localhost:9091

### MANDATORY: VSCode Test Explorer Method

**Primary Testing Interface: VSCode Test Explorer**

1. **Access Test Explorer**: 
   - VSCode Activity Bar → Testing (flask icon) → Playwright section
   - All tests automatically discovered in `Tests/UI/` directory

2. **Run All Tests**: 
   - Click "Run All Tests" button in Test Explorer panel

3. **Run Specific Tests**:
   - Navigate to test file (e.g., `cascading-dropdowns.spec.js`)
   - Click individual play button next to test name

4. **Debug Tests**:
   - Right-click test → "Debug Test"
   - Set breakpoints in test files for step-through debugging

5. **Visual Testing**:
   - Enable "Show Browser" option to watch test execution

### DEPRECATED: Terminal Commands (DO NOT USE)

❌ **Forbidden Methods:**
```bash
# These commands are PROHIBITED
npm test
npx playwright test
npm run test:headed
```

✅ **Exception - Report Viewing Only:**
```bash
# Only allowed for viewing generated reports
npx playwright show-report
```

# Run tests with debugging
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Test Suites

### 1. Host Authentication Flow (`host-authentication.spec.js`)

Tests complete host authentication workflow using **VSCode Test Explorer**:

**Test Explorer Usage:**
1. Navigate to `host-authentication.spec.js` in Test Explorer
2. Click play button to run all host authentication tests
3. Use individual test play buttons for specific scenarios
4. Use "Debug Test" for breakpoint debugging

**Key Test Cases:**
- ✅ Landing page branding and layout
- ✅ Token validation and error handling  
- ✅ New token generation via API
- ✅ Expired token handling
- ✅ NOOR Canvas styling consistency

### 2. Issue-106 Cascading Dropdowns (`cascading-dropdowns.spec.js`)

Tests the critical Issue-106 implementation with 2-second delays:

```bash
**Test Explorer Usage:**
1. Navigate to `cascading-dropdowns.spec.js` in Test Explorer  
2. Click play button for complete Issue-106 validation
3. Use "Debug Test" for step-through debugging of cascading logic
4. Enable "Show Browser" to watch 2-second delay execution

**Key Test Cases:**
- ✅ Cascading sequence: Album=18 → Category=55 → Session=1281
- ✅ 2-second delays between dropdown loads
- ✅ Race condition prevention with IsSettingDefaultValues flag
- ✅ Open Session button functionality and API calls
- ✅ Session URL panel forced display
- ✅ Complete workflow validation

### 3. User Authentication (`user-authentication.spec.js`)

Tests user login and Issue-102 routing fixes using **VSCode Test Explorer**:

**Test Explorer Usage:**
1. Navigate to `user-authentication.spec.js` in Test Explorer
2. Click play button to run all user authentication tests
3. Filter tests by name for specific Issue-102 validation

**Key Test Cases:**
- ✅ Token entry form display (not registration)
- ✅ Invalid token error handling
- ✅ Valid token session access
- ✅ Issue-102: API failure returns false correctly
- ✅ User journey: token → waiting room → active session

### 4. API Integration (`api-integration.spec.js`)

Tests backend API endpoints and data flow using **VSCode Test Explorer**:

**Test Explorer Usage:**
1. Navigate to `api-integration.spec.js` in Test Explorer
2. Click play button for comprehensive API testing
npx playwright test api-integration.spec.js

# Test specific API functions
npx playwright test -g "should generate host token via API"
npx playwright test -g "should load Islamic content data"
```

**Key Test Cases:**
- ✅ Host token generation and validation
- ✅ Invalid token rejection (400 errors)
- ✅ Database connectivity health checks
- ✅ Islamic content API loading (albums, categories, sessions)
- ✅ Performance testing (concurrent tokens)
- ✅ Security validation (SQL injection protection)

## Test Configuration

### Playwright Config (`playwright.config.js`)

```javascript
module.exports = defineConfig({
  testDir: './Tests/UI',
  webServer: {
    command: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "./run-with-iiskill.ps1"',
    url: 'https://localhost:9091',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'https://localhost:9091',
    ignoreHTTPSErrors: true, // For localhost SSL
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  }
});
```

### Test Reports

**Automatic Report Generation:**
- Test Explorer automatically generates reports after test execution
- Reports stored in `Workspaces/TEMP/playwright-report/`
- Artifacts (screenshots, videos) stored in `Workspaces/TEMP/test-artifacts/`

**Manual Report Viewing (Only Exception to Terminal Ban):**
```bash
# View generated HTML report (ONLY allowed terminal command)
npx playwright show-report
```

## Debugging & Development

### VSCode Integrated Debugging

**Primary Method - Test Explorer:**
1. **Set Breakpoints**: Click in test file gutters to set breakpoints
2. **Debug Test**: Right-click test in Test Explorer → "Debug Test"  
3. **Step Through**: Use VSCode debugging controls (F10, F11, etc.)
4. **Variable Inspection**: Hover over variables or use Debug Console

### Visual Test Execution

**Test Explorer Options:**
- **Show Browser**: Enable to watch test execution in real browser
- **Slow Motion**: Available through Test Explorer configuration
- **Real-time Logging**: Console output appears in VSCode Output panel

**❌ DEPRECATED Terminal Commands (DO NOT USE):**
```bash
# These are PROHIBITED - Use Test Explorer instead
npx playwright test --headed
npx playwright test --debug
npx playwright test --slowMo=1000
```

### Console Logging

Tests include extensive console logging for debugging:

```javascript
// Enable console logs in tests
page.on('console', msg => {
  if (msg.text().includes('ISSUE-106-CASCADING')) {
    console.log('Cascading log:', msg.text());
  }
});
```

### Screenshots & Videos

Test failures automatically capture:
- Screenshots at failure point
- Video recordings of test execution
- Network request/response logs
- Browser console logs

## Integration with NOOR Canvas

### Test Data Management

Tests use dynamic token generation to avoid hardcoded values:

```javascript
// Generate fresh tokens for each test
const tokenResponse = await request.post('/api/host/generate-token', {
  data: {
    sessionId: Math.floor(Math.random() * 1000) + 200,
    createdBy: 'Playwright Test Suite',
    title: `Test Session ${Date.now()}`
  }
});
```

### Application State

Tests handle application lifecycle:
- Server startup/shutdown via `run-with-iiskill.ps1`
- Database connection verification
- Clean test isolation between runs

### CI/CD Integration

```bash
# CI mode (no browser UI)
CI=true npx playwright test

# Generate reports for CI
npx playwright test --reporter=json --output-dir=./test-results
```

## Troubleshooting

### Common Issues

1. **Server Not Starting**
   ```bash
   # Ensure application can start manually
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "./run-with-iiskill.ps1"
   
   # Check port availability
   netstat -an | findstr :9091
   ```

2. **SSL Certificate Errors**
   ```javascript
   // Config already includes ignoreHTTPSErrors: true
   use: {
     ignoreHTTPSErrors: true
   }
   ```

3. **Test Timeout Issues**
   ```bash
   # Increase timeout for slow operations
   npx playwright test --timeout=120000
   ```

4. **Database Connection Issues**
   ```bash
   # Verify database connectivity manually
   # Check KSESSIONS_DEV and canvas database connections
   ```

### Debug Commands

```bash
# Verbose output
npx playwright test --verbose

# Show browser for debugging
npx playwright test --headed --slowMo=500

# Generate trace for failed tests
npx playwright test --trace=retain-on-failure

# View trace files
npx playwright show-trace trace.zip
```

## Test Maintenance

### Adding New Tests

1. Create test file in `Tests/UI/`
2. Follow existing patterns for token generation
3. Include proper error handling and cleanup
4. Add console logging for debugging
5. Update this documentation

### Updating Existing Tests

When UI changes occur:
1. Update selectors in test files
2. Verify test data expectations
3. Run tests to validate changes
4. Update documentation as needed

### Performance Optimization

- Use `page.waitForLoadState('networkidle')` for dynamic content
- Implement proper timeout handling
- Minimize test execution time with parallel runs where safe
- Cache commonly used test data

## Integration with Development Workflow

### Pre-Commit Testing

```bash
# Quick smoke tests before commit
npx playwright test host-authentication.spec.js

# Full test suite for major changes
npx playwright test
```

### Issue Resolution Workflow

1. Write failing test reproducing issue
2. Implement fix in application code
3. Verify test passes
4. Run full test suite
5. Update documentation

### Continuous Integration

Tests can be integrated with GitHub Actions or similar CI systems:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci
- name: Install Playwright
  run: npx playwright install
- name: Run tests
  run: npx playwright test
```

This UI test runner provides comprehensive coverage of NOOR Canvas functionality and serves as both validation and documentation of expected behavior.