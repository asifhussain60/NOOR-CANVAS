/**
 * [DEBUG-WORKITEM:hostcanvas:config] Playwright configuration for copilot test suite
 * Following SelfAwareness requirements: testDir: "Workspaces/copilot/Tests/Playwright"
 * ;CLEANUP_OK
 */

import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
    timeout: 30 * 1000,
    testDir: 'Workspaces/copilot/Tests/Playwright',
    retries: 0,
    reporter: [
        ['list'],
        [
            'json',
            {
                outputFile: path.resolve(__dirname, '..', '..', 'Workspaces', 'TEMP', 'playwright-report', 'copilot-report.json'),
            },
        ],
    ],
    outputDir: path.resolve(__dirname, '..', '..', 'Workspaces', 'TEMP', 'playwright-artifacts'),
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        baseURL: 'http://localhost:9090',
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});