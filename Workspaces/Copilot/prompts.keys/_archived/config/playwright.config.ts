// @ts-check
import { defineConfig, devices } from '@playwright/test';

/** Resolve baseURL from environment; fall back to dev defaults */
const baseURL = process.env.APP_URL ?? 'http://localhost:9090';

export default defineConfig({
  testDir: 'Workspaces/copilot/Tests/Playwright',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'Workspaces/copilot/artifacts/playwright/report', open: 'never' }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  // Tag by key, e.g., `@hostcanvas`
  grep: process.env.PW_GREP ? new RegExp(process.env.PW_GREP) : undefined,
});
