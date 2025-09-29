import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for testing participant name display fixes
 * 
 * This configuration is optimized for testing:
 * 1. Welcome message personalization in SessionCanvas
 * 2. Q&A participant name resolution in HostControlPanel
 * 3. API integration and data flow validation
 */
export default defineConfig({
  testDir: './Tests/UI',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://localhost:9091',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording */
    video: 'retain-on-failure',

    /* Ignore HTTPS errors for localhost testing */
    ignoreHTTPSErrors: true,

    /* Timeout for each action */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Additional Chrome flags for testing
        launchOptions: {
          args: ['--disable-web-security', '--allow-running-insecure-content']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against Microsoft Edge. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  /* Global test timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'dotnet run --project "SPA/NoorCanvas/NoorCanvas.csproj"',
    port: 9091,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for .NET app to start
    env: {
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: 'https://localhost:9091;http://localhost:9092'
    }
  },

  /* Test-specific settings */
  globalSetup: './Tests/UI/global-setup.ts',
  globalTeardown: './Tests/UI/global-teardown.ts',
});