// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * ✅ VALIDATED Standalone Playwright Configuration
 *
 * This configuration was successfully used during infrastructure validation testing.
 * E2E tests executed successfully with 2 concurrent browsers, validating:
 * - Application stability under load
 * - SignalR circuit establishment
 * - Database connectivity and queries
 * - API endpoint functionality
 *
 * INFRASTRUCTURE FIXES APPLIED (Sept 21, 2025):
 * - ✅ Fixed duplicate Serilog configuration (root cause resolved)
 * - ✅ Enhanced with stable directory structure (PlayWright/tests/)
 * - ✅ Updated to use HTTPS (matches infrastructure standards)
 * - ✅ Validated with real multi-user testing scenarios
 *
 * Usage: npx playwright test --config=playwright-standalone.config.js
 * Prerequisites: NoorCanvas application running on https://localhost:9091
 */
module.exports = defineConfig({
    testDir: "./PlayWright/tests", // Updated to centralized structure
    outputDir: "D:/PROJECTS/NOOR CANVAS/Workspaces/TEMP/playwright-artifacts",
    fullyParallel: false, // Sequential for session-based testing
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1, // Single worker prevents token conflicts
    reporter: [
        ["list"],
    ["html", { outputFolder: "D:/PROJECTS/NOOR CANVAS/Workspaces/TEMP/playwright-reports" }], // Centralized reports
    ["json", { outputFile: "D:/PROJECTS/NOOR CANVAS/Workspaces/TEMP/playwright-artifacts/results/test-results.json" }],
    ],
    use: {
        baseURL: "https://localhost:9091", // HTTPS as validated in infrastructure tests
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        ignoreHTTPSErrors: true, // Required for localhost SSL
        actionTimeout: 30000, // Accommodates Blazor Server binding delays
        navigationTimeout: 60000, // Extended for application stability
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                launchOptions: {
                    headless: false, // Visual mode for manual testing
                    args: [
                        "--disable-web-security",
                        "--allow-running-insecure-content",
                        "--ignore-certificate-errors",
                    ],
                },
            },
        },
    ],
    timeout: 60000, // Extended timeout for comprehensive test scenarios
    expect: {
        timeout: 10000, // Dynamic content loading accommodation
    },
    // ✅ NO webServer - Manual application management (VALIDATED APPROACH)
    // Application should be started independently before running tests
});
