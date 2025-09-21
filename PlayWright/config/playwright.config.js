// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * NOOR Canvas UI Test Runner Configuration (Consolidated & Optimized)
 * 
 * This configuration provides comprehensive UI testing for NOOR Canvas workflows including:
 * - Host Authentication Flow with TypeScript typing
 * - Cascading Dropdown Testing (Issue-106 validation)
 * - Session Management and URL generation
 * - User Authentication with routing fixes (Issue-102)
 * - API Integration Testing with proper error handling
 * - Database Integration with AHHOME SQL Server (KSESSIONS_DEV)
 * 
 * Enhanced Features:
 * - Consolidated test directory: All tests run from PlayWright/tests/
 * - Headless mode by default for CI/CD compatibility
 * - Automatic application health checks and startup using nc.ps1 launcher
 * - Enhanced monitoring with 18-second timeout and 6 retry attempts for realistic ASP.NET Core startup
 * - Real database integration with AHHOME server (SQL Server Authentication: sa/adf4961glo)
 * - TypeScript support for better IntelliSense and Copilot suggestions
 * - Optimized test artifact storage for easy cleanup
 * - VSCode Test Explorer integration for visual test management
 * 
 * Updated: September 21, 2025 - Button enablement fixes and comprehensive patterns
 * 
 * CRITICAL LESSONS LEARNED:
 * 1. **Blazor Server Binding**: Playwright .fill() doesn't trigger @bind-Value updates automatically
 *    - SOLUTION: Use dispatchEvent('input') and dispatchEvent('change') after fill()
 *    - TIMING: Wait 2 seconds for Blazor to process binding before button interactions
 * 
 * 2. **Button Enablement Pattern**: Buttons disabled by Blazor binding require proper event dispatch
 *    - PATTERN: clear() → fill() → dispatchEvent('input') → dispatchEvent('change') → waitForTimeout(2000) → expect(button).toBeEnabled()
 * 
 * 3. **Application Stability**: ASP.NET Core applications can shut down during test execution
 *    - MONITORING: Enhanced health checks with nc.ps1 automatic restart capability
 *    - TIMING: 15+ seconds realistic startup time, use 18-second timeouts with 6 attempts
 * 
 * 4. **Database Integration**: AHHOME server connectivity essential for real token testing
 *    - FALLBACK: Permanent Session 212 tokens (VNBPRVII/DPH42JR5) provide reliable testing
 *    - GRACEFUL: Tests work with or without database connectivity via fallback system
 */

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './PlayWright/tests',
  /* Output directory for test artifacts (centralized in PlayWright structure) */
  outputDir: './PlayWright/artifacts',
  /* Run tests sequentially for session-based testing and better Copilot context */
  fullyParallel: false, // Sequential execution prevents race conditions in cascading tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry configuration optimized for session management testing */
  retries: process.env.CI ? 2 : 1,
  /* Single worker for session testing to prevent token conflicts */
  workers: process.env.CI ? 1 : 1,
  /* Enhanced reporters for TypeScript debugging and Copilot integration */
  reporter: [
    ['html', { outputFolder: './PlayWright/reports' }],
    ['json', { outputFile: './PlayWright/results/test-results.json' }],
    ['line'], // Enhanced console output for better debugging
    ['list'] // Detailed test execution list for Copilot context
  ],
  /* Shared settings optimized for TypeScript development and Copilot integration */
  use: {
    /* Base URL for NOOR Canvas application (localhost HTTPS) */
    baseURL: 'https://localhost:9091',
    /* Enhanced trace collection for TypeScript debugging and Copilot context */
    trace: 'on-first-retry',
    /* Screenshot capture for visual debugging assistance */
    screenshot: 'only-on-failure',
    /* Video recording for comprehensive test failure analysis */
    video: 'retain-on-failure',
    /* Accept self-signed certificates for localhost development */
    ignoreHTTPSErrors: true,

    /* CRITICAL TIMING LESSONS: Blazor Server binding requires extended timeouts */
    actionTimeout: 30000, // Covers 2-second Blazor binding delays + button enablement
    /* Navigation timeout accommodating Blazor Server rendering delays */
    navigationTimeout: 60000,
    /* Enhanced context options for better Copilot suggestions */
    contextOptions: {
      // Enable better debugging information for TypeScript
      recordVideo: {
        dir: './PlayWright/artifacts/videos/'
      }
    }
  },

  /* Browser projects - Headless by default for CI/CD compatibility */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Headless mode enforced for consistent CI/CD execution
        launchOptions: {
          headless: true, // Explicitly set headless mode
          args: [
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--ignore-certificate-errors',
            '--disable-features=VizDisplayCompositor' // Improve stability in headless mode
          ]
        }
      },
    },
    // Additional browsers for comprehensive testing (uncomment as needed)
    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     launchOptions: { headless: true }
    //   },
    // },
    // {
    //   name: 'webkit', 
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     launchOptions: { headless: true }
    //   },
    // },
  ],

  /* Application health management - Automatic startup and monitoring */
  webServer: {
    command: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "../../Workspaces/Global/nc.ps1"',
    url: 'https://localhost:9091',
    reuseExistingServer: !process.env.CI, // Reuse in development, fresh start in CI
    timeout: 120000, // Extended timeout for Kestrel startup and app initialization (realistic: 15+ seconds)
    ignoreHTTPSErrors: true,
    /* Enhanced server readiness checking for better test reliability */
    stdout: 'pipe',
    stderr: 'pipe'
  },



  /* Global test timeout extended for cascading dropdown sequences */
  timeout: 60000, // Accommodates 6+ second cascading sequences (Issue-106)

  /* Expect assertion timeout optimized for dynamic content loading */
  expect: {
    timeout: 10000
  },

  /* TypeScript-specific configuration */
  testMatch: [
    '**/*.spec.ts', // Prioritize TypeScript test files
    '**/*.spec.js'  // Fallback to JavaScript files if needed
  ],

  /* Enhanced global setup with smart monitoring and fast failure recovery */
  globalSetup: require.resolve('../tests/utils/enhanced-global-setup.ts'),
  globalTeardown: require.resolve('../tests/utils/enhanced-global-teardown.ts')
});