// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * NOOR Canvas UI Test Runner Configuration (Enhanced for TypeScript + GitHub Copilot)
 * 
 * This configuration provides comprehensive UI testing for NOOR Canvas workflows including:
 * - Host Authentication Flow with TypeScript typing
 * - Cascading Dropdown Testing (Issue-106 validation)
 * - Session Management and URL generation
 * - User Authentication with routing fixes (Issue-102)
 * - API Integration Testing with proper error handling
 * 
 * Enhanced Features:
 * - TypeScript support for better IntelliSense and Copilot suggestions
 * - Optimized test artifact storage in TEMP/ for easy cleanup
 * - GitHub Copilot-friendly test patterns and documentation
 * - VSCode Test Explorer integration for visual test management
 */

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './Tests/UI',
  /* Output directory for test artifacts (optimized for TypeScript builds) */
  outputDir: './TEMP/test-artifacts',
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
    ['html', { outputFolder: './TEMP/playwright-report' }],
    ['json', { outputFile: './TEMP/test-results.json' }],
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
    /* Extended timeouts for cascading dropdown testing (Issue-106) */
    actionTimeout: 30000,
    /* Navigation timeout accommodating session loading delays */
    navigationTimeout: 60000,
    /* Enhanced context options for better Copilot suggestions */
    contextOptions: {
      // Enable better debugging information for TypeScript
      recordVideo: {
        dir: './TEMP/test-videos/'
      }
    }
  },

  /* Browser projects optimized for TypeScript testing and Copilot development */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enhanced Chrome settings for better debugging and Copilot integration
        launchOptions: {
          args: ['--disable-web-security', '--allow-running-insecure-content']
        }
      },
    },
    // Additional browsers for comprehensive testing (uncomment as needed)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit', 
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile testing project for responsive design validation
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Automated dev server management for seamless TypeScript testing */
  webServer: {
    command: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "./run-with-iiskill.ps1"',
    url: 'https://localhost:9091',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Extended timeout for IIS startup and app initialization
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

  /* Global setup for enhanced TypeScript testing */
  globalSetup: undefined, // Can be configured for database setup if needed
  globalTeardown: undefined, // Can be configured for cleanup operations
});