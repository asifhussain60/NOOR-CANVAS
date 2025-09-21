/**
 * Test Hooks for Application Health Monitoring
 * 
 * Provides reusable test hooks for before/after test health checks.
 * Import and use these hooks in individual test files as needed.
 * 
 * Created: September 21, 2025
 * Purpose: Individual test-level health monitoring
 */

import { test } from '@playwright/test';
import { AppHealthChecker } from './app-health-checker';

/**
 * Before each test hook - ensures application is running
 */
export const beforeEachHealthCheck = test.beforeEach(async () => {
    console.log('🔍 Pre-test health check...');
    await AppHealthChecker.ensureApplicationRunning();
});

/**
 * After each test hook - verifies application is still running
 */
export const afterEachHealthCheck = test.afterEach(async () => {
    console.log('🔍 Post-test health check...');
    await AppHealthChecker.postTestHealthCheck();
});

/**
 * Combined health check hooks for convenience
 */
export const withHealthChecks = () => {
    beforeEachHealthCheck;
    afterEachHealthCheck;
};

export { AppHealthChecker };
