import { defineConfig, devices } from "@playwright/test";

/**
 * Standalone configuration for Complete User Experience test
 * No enhanced utilities to avoid conflicts
 */
export default defineConfig({
  testDir: "./Tests/UI",
  testMatch: "**/complete-user-experience.spec.ts",

  timeout: 120000,
  expect: {
    timeout: 10000,
  },

  fullyParallel: false,
  workers: 1,
  retries: 0,

  // Web Server configuration for automated startup
  webServer: {
    command: "dotnet run",
    cwd: "./SPA/NoorCanvas",
    port: 9091,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "PlayWright/reports",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: "PlayWright/results/test-results.json",
      },
    ],
  ],

  outputDir: "PlayWright/results/",

  use: {
    baseURL: "https://localhost:9091",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",

    // Headless settings for faster execution
    headless: true,
    viewport: { width: 1280, height: 720 },

    // No global setup/teardown
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // No web server config - app should be running manually
});
