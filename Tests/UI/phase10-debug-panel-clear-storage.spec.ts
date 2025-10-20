import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// Session 212 configuration
const USER_TOKEN = 'KJAHA99L';
const BASE_URL = `http://localhost:9090`;
const USER_LANDING_URL = `${BASE_URL}/user/landing/${USER_TOKEN}`;
const STORAGE_KEY = `noor_user_registration_${USER_TOKEN}`;

test.describe('Phase 10: Debug Panel Clear localStorage', () => {

    test('should show Clear Local Storage button in debug panel', async ({ page }) => {
        console.log('\n📝 TEST: Show Clear Local Storage button in debug panel');

        // Navigate to UserLanding
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for countries dropdown to load
        await page.waitForFunction(() => {
            const select = document.querySelector('select.user-landing-select') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        // Wait for form to be visible
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 10000 });

        // Open debug panel with Ctrl+D
        await page.keyboard.press('Control+d');

        // Wait for debug panel to be visible
        await page.waitForSelector('.debug-panel', { state: 'visible', timeout: 5000 });

        // Verify "Clear Local Storage" button exists
        const clearButton = page.locator('.debug-action').filter({ hasText: 'Clear Local Storage' });
        await expect(clearButton).toBeVisible();

        // Verify button has trash icon
        const trashIcon = clearButton.locator('i.fa-trash-can');
        await expect(trashIcon).toBeVisible();

        console.log('   ✅ Clear Local Storage button visible in debug panel with trash icon');

        // Take Percy snapshot of debug panel with button
        await percySnapshot(page, 'Phase 10 - Debug Panel with Clear Local Storage Button');
    });

    test('should clear localStorage and reset form fields when button clicked', async ({ page }) => {
        console.log('\n📝 TEST: Clear localStorage and reset form fields');

        // Navigate to UserLanding
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for countries dropdown
        await page.waitForFunction(() => {
            const select = document.querySelector('select.user-landing-select') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        // Manually set localStorage data to test clear functionality
        await page.evaluate((key) => {
            const data = {
                Name: 'Test User',
                Email: 'test@example.com',
                Country: 'US',
                ExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                LastAccessedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
            // Clear sessionStorage to prevent auto-navigation
            sessionStorage.clear();
        }, STORAGE_KEY);

        // Reload to trigger LoadRegistrationDataAsync
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

        // Wait for form
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 10000 });

        // Verify form is pre-populated
        const nameValueBefore = await page.locator('#name-input').inputValue();
        const emailValueBefore = await page.locator('input.user-landing-input[placeholder="Enter your email"]').inputValue();

        expect(nameValueBefore).toBe('Test User');
        expect(emailValueBefore).toBe('test@example.com');

        console.log('   ✅ Form pre-populated - Name:', nameValueBefore, 'Email:', emailValueBefore);

        // Set up console log listener
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(text);
            if (text.includes('NOOR-DEBUG-PANEL')) {
                console.log('   📢 Console:', text);
            }
        });

        // Open debug panel
        await page.keyboard.press('Control+d');
        await page.waitForSelector('.debug-panel', { state: 'visible', timeout: 5000 });

        // Click Clear Local Storage button
        const clearButton = page.locator('.debug-action').filter({ hasText: 'Clear Local Storage' });
        await clearButton.click();
        await page.waitForTimeout(1000);

        // Verify localStorage cleared
        const storageDataAfter = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageDataAfter).toBeNull();
        console.log('   ✅ localStorage cleared');

        // Verify form fields cleared
        const nameAfter = await page.locator('#name-input').inputValue();
        const emailAfter = await page.locator('input.user-landing-input[placeholder="Enter your email"]').inputValue();

        expect(nameAfter).toBe('');
        expect(emailAfter).toBe('');

        console.log('   ✅ Form fields cleared');

        // Verify console log
        const hasDebugLog = consoleLogs.some(log => log.includes('NOOR-DEBUG-PANEL: Local storage cleared'));
        expect(hasDebugLog).toBe(true);
        console.log('   ✅ Debug panel console log confirmed');

        // Take Percy snapshot
        await percySnapshot(page, 'Phase 10 - Form Cleared After Clear Local Storage');
    });

    test('should persist empty state across page reload', async ({ page }) => {
        console.log('\n📝 TEST: Persist empty state across page reload');

        // Navigate to UserLanding
        await page.goto(USER_LANDING_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for countries dropdown
        await page.waitForFunction(() => {
            const select = document.querySelector('select.user-landing-select') as HTMLSelectElement;
            return select && select.options.length > 1;
        }, { timeout: 10000 });

        // Manually set localStorage data
        await page.evaluate((key) => {
            const data = {
                Name: 'Persist Test',
                Email: 'persist@example.com',
                Country: 'GB',
                ExpiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                LastAccessedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
            // Clear sessionStorage to prevent auto-navigation
            sessionStorage.clear();
        }, STORAGE_KEY);

        // Reload
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 10000 });

        // Open debug panel and clear
        await page.keyboard.press('Control+d');
        await page.waitForSelector('.debug-panel', { state: 'visible', timeout: 5000 });
        const clearButton = page.locator('.debug-action').filter({ hasText: 'Clear Local Storage' });
        await clearButton.click();
        await page.waitForTimeout(1000);

        // Close debug panel
        await page.keyboard.press('Control+d');

        // Reload page
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#name-input', { state: 'visible', timeout: 10000 });

        // Verify form still empty
        const nameValue = await page.locator('#name-input').inputValue();
        const emailValue = await page.locator('input.user-landing-input[placeholder="Enter your email"]').inputValue();

        expect(nameValue).toBe('');
        expect(emailValue).toBe('');

        console.log('   ✅ Form remains empty after reload');

        // Verify localStorage still empty
        const storageData = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
        expect(storageData).toBeNull();
        console.log('   ✅ localStorage remains cleared after reload');
    });

});
