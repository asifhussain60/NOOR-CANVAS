const path = require('path');

/**
 * Canonical Playwright configuration for the repository.
 * - Uses repository-relative paths for artifacts (Workspaces/TEMP/playwright-artifacts)
 * - Keeps PW_MODE-aware overrides for 'standalone' and 'temp'
 * - Supports both PlayWright/tests and Workspaces/TEMP directories per SelfAwareness instructions
 */
const cfg = {
    timeout: 30 * 1000,
    testDir: '../../',
    testMatch: ['**/PlayWright/tests/**/*.{test,spec}.{js,ts,jsx,tsx}', '**/Workspaces/TEMP/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    retries: 0,
    reporter: [
        ['list'],
        [
            'json',
            {
                outputFile: path.resolve(__dirname, '../../Workspaces', 'TEMP', 'playwright-report', 'report.json'),
            },
        ],
    ],
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        outputDir: path.resolve(__dirname, '../../Workspaces', 'TEMP', 'playwright-artifacts'),
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    // Environment-mode overrides will be merged below
};

function applyModeOverrides(base) {
    const mode = process.env.PW_MODE || process.env.PLAYWRIGHT_MODE || '';
    if (mode === 'standalone') {
        return Object.assign({}, base, {
            timeout: 120000,
            retries: 0,
            workers: 1,
            webServer: {
                command: 'dotnet run',
                cwd: '../../SPA/NoorCanvas',
                port: 9091,
                reuseExistingServer: !process.env.CI,
                timeout: 60000,
            },
            reporter: [
                ['list'],
                ['html', { open: 'never', outputFolder: path.resolve(__dirname, '../../Workspaces', 'TEMP', 'playwright-report', 'standalone-html') }],
            ],
            use: Object.assign({}, base.use, { headless: false, viewport: { width: 1280, height: 720 }, trace: 'retain-on-failure', video: 'retain-on-failure' }),
        });
    }
    if (mode === 'temp') {
        return Object.assign({}, base, { retries: 0, workers: 1, use: Object.assign({}, base.use, { video: 'on', trace: 'on' }) });
    }
    return base;
}

module.exports = applyModeOverrides(cfg);
