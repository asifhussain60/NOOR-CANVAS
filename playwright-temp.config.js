// Temporary Playwright configuration without global setup for testing
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './PlayWright/tests',
    outputDir: './PlayWright/artifacts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 1,
    reporter: [
        ['html', { outputFolder: './PlayWright/reports', open: 'never' }],
        ['json', { outputFile: './PlayWright/results/test-results.json' }],
        ['line']
    ],
    use: {
        baseURL: 'http://localhost:9090',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: true,
        actionTimeout: 30000,
        navigationTimeout: 60000,
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    headless: true,
                    args: [
                        '--disable-web-security',
                        '--allow-running-insecure-content',
                        '--ignore-certificate-errors',
                        '--disable-features=VizDisplayCompositor'
                    ]
                }
            },
        },
    ],
    timeout: 60000,
    expect: {
        timeout: 10000
    },
    testMatch: [
        '**/*.spec.ts',
        '**/*.spec.js'
    ],
    // Temporarily disable global setup/teardown
    // globalSetup: require.resolve('../tests/utils/global-setup.ts'),
    // globalTeardown: require.resolve('../tests/utils/global-teardown.ts')
});