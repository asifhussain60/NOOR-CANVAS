/**
 * Playwright Configuration for Authentication Tests
 * 
 * Specialized configuration for testing host authentication and session management
 * in the simplified 3-table architecture.
 * 
 * This configuration optimizes for:
 * - Authentication flow testing
 * - Session management validation  
 * - API integration testing
 * - Error handling verification
 * 
 * Created: September 20, 2025
 * Purpose: Validate simplified architecture authentication fixes
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    // Test files location
    testDir: './Tests/UI',

    // Test file patterns for authentication tests
    testMatch: [
        '**/host-authentication-flow-e2e.spec.ts',
        '**/session-opener-user-auth-flow.spec.ts'
    ],

    // Output directories
    outputDir: './test-results/auth-tests',

    // Execution settings
    fullyParallel: false, // Sequential for session testing
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1, // Single worker to prevent token conflicts

    // Timeout settings
    timeout: 60000, // 60 seconds for authentication flows
    expect: {
        timeout: 10000 // 10 seconds for assertions
    },

    // Reporters
    reporter: [
        ['html', { outputFolder: './test-results/auth-tests/reports' }],
        ['json', { outputFile: './test-results/auth-tests/results.json' }],
        ['line']
    ],

    // Global settings
    use: {
        // NOOR Canvas application URLs
        baseURL: 'https://localhost:9091',

        // Enhanced debugging for authentication testing
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // Accept self-signed certificates for localhost
        ignoreHTTPSErrors: true,

        // Extended timeouts for authentication flows
        actionTimeout: 15000,
        navigationTimeout: 30000,

        // Additional context options
        contextOptions: {
            recordVideo: {
                dir: './test-results/auth-tests/videos/',
                size: { width: 1280, height: 720 }
            }
        }
    },

    // Browser projects
    projects: [
        {
            name: 'chromium-auth-tests',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: [
                        '--disable-web-security',
                        '--allow-running-insecure-content',
                        '--ignore-certificate-errors'
                    ]
                }
            }
        }
    ],

    // Global setup and teardown
    globalSetup: require.resolve('./Tests/global-setup.ts'),
    globalTeardown: require.resolve('./Tests/global-teardown.ts')
});