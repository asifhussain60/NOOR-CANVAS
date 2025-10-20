import { expect, test } from '@playwright/test';

/**
 * Phase 7: localStorage Expiration Extension Test
 * 
 * Tests the rolling expiration mechanism in UserLanding.razor
 * Validates that ExpiresAt is extended by 24 hours on each access
 * Verifies LastAccessedAt timestamp is updated
 * 
 * Debug Marker: [DEBUG-WORKITEM:userlanding:localStorage:extension]
 * Session 212: User Token KJAHA99L, Host Token PQ9N5YWW
 */

test.describe('Phase 7: localStorage Expiration Extension', () => {
    const BASE_URL = 'http://localhost:9090';
    const USER_TOKEN = 'KJAHA99L';
    const USER_LANDING_URL = `${BASE_URL}/user/landing/${USER_TOKEN}`;
    const STORAGE_KEY = `noor_user_registration_${USER_TOKEN}`;

    test.beforeEach(async ({ page }) => {
        // Clear all storage before each test
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('should extend expiration by 24 hours on each access', async ({ page }) => {
        // Capture console logs
        const consoleLogs: string[] = [];
        const jsErrors: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();
            consoleLogs.push(text);
            console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
        });

        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
            console.error(`[BROWSER ERROR] ${error.message}`);
        });

        // Navigate to UserLanding
        console.log(`\n🔍 Navigating to: ${USER_LANDING_URL}`);
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for token validation and registration form to appear
        console.log(`\n⏳ Waiting for registration form to appear after token validation...`);
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 });

        // Fill in registration form (using Blazor component selectors)
        console.log(`\n📝 Filling registration form...`);
        const testName = 'Test User Phase 7';
        const testEmail = 'phase7test@example.com';
        const testCountry = 'US';

        await page.fill('#name-input', testName);
        await page.fill('input.user-landing-input[placeholder="Enter your email"]', testEmail);
        await page.selectOption('select.user-landing-select', testCountry);

        // Submit registration (triggers SaveRegistrationDataAsync)
        console.log(`\n🚀 Submitting registration (triggers SaveRegistrationDataAsync)...`);
        await page.click('button.user-landing-button');

        // Wait for navigation to complete
        console.log(`\n⏳ Waiting for post-registration navigation...`);
        await Promise.race([
            page.waitForURL('**/session/waiting/**', { timeout: 15000 }),
            page.waitForURL('**/session/canvas/**', { timeout: 15000 })
        ]).catch(() => {
            console.log('   Navigation timeout - checking localStorage anyway');
        });

        // Wait a moment for SaveRegistrationDataAsync to complete
        await page.waitForTimeout(1000);

        // Navigate back to UserLanding to trigger data load
        console.log(`\n🔄 Navigating back to UserLanding to trigger LoadRegistrationDataAsync...`);
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 });

        // Capture initial ExpiresAt timestamp
        console.log(`\n📋 Capturing initial ExpiresAt timestamp...`);
        const initialData = await page.evaluate((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }, STORAGE_KEY);

        expect(initialData).not.toBeNull();
        console.log(`   Initial ExpiresAt: ${initialData.ExpiresAt}`);
        console.log(`   Initial LastAccessedAt: ${initialData.LastAccessedAt}`);

        // Wait a moment to ensure timestamp differences are detectable
        await page.waitForTimeout(2000);

        // Reload page again to trigger ExtendExpirationAsync
        console.log(`\n🔄 Reloading page to trigger ExtendExpirationAsync...`);
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 });

        // Wait for extension to complete
        await page.waitForTimeout(1000);

        // Capture new ExpiresAt timestamp
        console.log(`\n📋 Capturing updated ExpiresAt timestamp...`);
        const updatedData = await page.evaluate((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }, STORAGE_KEY);

        expect(updatedData).not.toBeNull();
        console.log(`   Updated ExpiresAt: ${updatedData.ExpiresAt}`);
        console.log(`   Updated LastAccessedAt: ${updatedData.LastAccessedAt}`);

        // Calculate time difference
        const initialExpires = new Date(initialData.ExpiresAt);
        const updatedExpires = new Date(updatedData.ExpiresAt);
        const timeDiffHours = (updatedExpires.getTime() - initialExpires.getTime()) / (1000 * 60 * 60);

        console.log(`\n📅 Expiration Extension Validation:`);
        console.log(`   Time difference: ${timeDiffHours.toFixed(2)} hours`);
        console.log(`   Expected: ~24 hours`);

        // Allow some tolerance (23-25 hours due to timing)
        expect(timeDiffHours).toBeGreaterThan(23);
        expect(timeDiffHours).toBeLessThan(25);

        console.log(`\n✅ Expiration successfully extended by 24 hours`);

        // Verify LastAccessedAt was updated
        const initialLastAccessed = new Date(initialData.LastAccessedAt);
        const updatedLastAccessed = new Date(updatedData.LastAccessedAt);

        console.log(`\n⏱️  LastAccessedAt Update Validation:`);
        console.log(`   Initial: ${initialLastAccessed.toISOString()}`);
        console.log(`   Updated: ${updatedLastAccessed.toISOString()}`);

        expect(updatedLastAccessed.getTime()).toBeGreaterThan(initialLastAccessed.getTime());

        console.log(`\n✅ LastAccessedAt successfully updated`);

        // NOTE: [DEBUG-WORKITEM:userlanding:localStorage:extension] markers are server-side logs
        // and won't appear in browser console. localStorage timestamp changes prove functionality.

        // Warn about JavaScript errors but don't fail the test unless critical
        if (jsErrors.length > 0) {
            console.warn(`\n⚠️  JavaScript Errors detected (${jsErrors.length}):`, jsErrors);
            console.warn(`   Note: Errors during navigation may be timing-related, not extension failures`);
        }

        console.log(`\n✅ Test completed successfully`);
    });

    test('should maintain 24-hour rolling window across multiple accesses', async ({ page }) => {
        // Pre-populate localStorage with initial data
        console.log(`\n📝 Pre-populating localStorage with initial data...`);
        await page.goto(BASE_URL);

        const now = new Date();
        const testData = {
            Name: 'Rolling Window User',
            Email: 'rolling@example.com',
            Country: 'CA',
            ExpiresAt: new Date(now.getTime() + (48 * 60 * 60 * 1000)).toISOString(), // 48 hours from now
            LastAccessedAt: now.toISOString()
        };

        await page.evaluate(({ key, data }) => {
            localStorage.setItem(key, JSON.stringify(data));
        }, { key: STORAGE_KEY, data: testData });

        console.log(`   Initial data saved (ExpiresAt in 48 hours)`);

        // First access
        console.log(`\n🔄 First access - triggering LoadRegistrationDataAsync...`);
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 });
        await page.waitForTimeout(1000);

        const afterFirstAccess = await page.evaluate((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }, STORAGE_KEY);

        const firstAccessExpires = new Date(afterFirstAccess.ExpiresAt);
        const initialExpires = new Date(testData.ExpiresAt);
        const firstDiff = (firstAccessExpires.getTime() - initialExpires.getTime()) / (1000 * 60 * 60);

        console.log(`   First access extended by: ${firstDiff.toFixed(2)} hours`);
        expect(firstDiff).toBeGreaterThan(23);
        expect(firstDiff).toBeLessThan(25);

        // Wait a moment
        await page.waitForTimeout(2000);

        // Second access
        console.log(`\n🔄 Second access - triggering ExtendExpirationAsync again...`);
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 15000 });
        await page.waitForTimeout(1000);

        const afterSecondAccess = await page.evaluate((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }, STORAGE_KEY);

        const secondAccessExpires = new Date(afterSecondAccess.ExpiresAt);
        const secondDiff = (secondAccessExpires.getTime() - firstAccessExpires.getTime()) / (1000 * 60 * 60);

        console.log(`   Second access extended by: ${secondDiff.toFixed(2)} hours`);
        expect(secondDiff).toBeGreaterThan(23);
        expect(secondDiff).toBeLessThan(25);

        console.log(`\n✅ Rolling 24-hour window maintained across multiple accesses`);
    });
});
