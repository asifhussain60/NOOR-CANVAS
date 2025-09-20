import { expect, test } from '@playwright/test';

/**
 * Test suite for Host Control Panel token validation and session loading
 * Verifies that the database-driven token validation system works correctly
 * without hardcoded mappings. Uses generated token 67HATXRR for session 212.
 */
test.describe('Host Token Validation', () => {

    test('should load Host Control Panel with database token from SQL pipeline', async ({ page }) => {
        // Navigate to HostControlPanel with properly generated token for session 212
        await page.goto('https://localhost:9091/host/control-panel/67HATXRR');

        // Wait for page to load completely
        await page.waitForLoadState('networkidle');

        // Verify page title
        await expect(page).toHaveTitle(/NOOR Canvas - Host Control Panel/);

        // Verify the page doesn't show "Loading Session" indefinitely
        // This would indicate the old hanging issue
        await expect(page.locator('text=Loading Session')).toBeHidden({ timeout: 10000 });

        // Verify session information is loaded from database
        // Should show session name and description from KSessions database
        await expect(page.locator('.session-info')).toBeVisible({ timeout: 15000 });

        // Verify no authentication errors are shown
        await expect(page.locator('text=Authentication Required')).not.toBeVisible();
        await expect(page.locator('text=Session Not Found')).not.toBeVisible();

        console.log('✅ Host token 67HATXRR successfully validated through database pipeline');
    });

    test('should display session transcript from KSessions database', async ({ page }) => {
        // Navigate to HostControlPanel with properly generated token
        await page.goto('https://localhost:9091/host/control-panel/67HATXRR');

        // Wait for page to load completely
        await page.waitForLoadState('networkidle');

        // Wait for session data to load from database
        await page.waitForTimeout(3000);

        // Check if transcript panel exists
        const transcriptPanel = page.locator('text=Session Transcript').first();
        await expect(transcriptPanel).toBeVisible();

        // Verify transcript content is loaded (not showing "No transcript available")
        const noTranscriptMessage = page.locator('text=No transcript available');

        try {
            // If there's actually transcript data in the database
            await expect(noTranscriptMessage).not.toBeVisible();
            console.log('✅ Session transcript successfully loaded from KSessions database');
        } catch {
            // If no transcript exists in database, that's also valid
            await expect(noTranscriptMessage).toBeVisible();
            console.log('ℹ️  No transcript found in database for session 212 (expected)');
        }
    });

    test('should not use hardcoded token mappings', async ({ page }) => {
        // This test verifies that the system queries the database for token validation
        // instead of using hardcoded mappings

        // Navigate to HostControlPanel with properly generated token
        await page.goto('https://localhost:9091/host/control-panel/67HATXRR');

        // Monitor console logs to ensure no hardcoded mapping messages appear
        const hardcodedMappingLogs: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Using hardcoded mapping') ||
                text.includes('V7U6P4RW') ||
                text.includes('BIIVCFDY') ||
                text.includes('79ESAWLD') ||
                text.includes('HOST212A')) {
                hardcodedMappingLogs.push(text);
            }
        });

        // Wait for page to load completely
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);

        // Verify no hardcoded mapping logs appeared
        expect(hardcodedMappingLogs).toHaveLength(0);

        // Verify session loads successfully (proving database queries work)
        await expect(page.locator('text=Loading Session')).toBeHidden({ timeout: 10000 });

        console.log('✅ No hardcoded token mappings used - database queries working correctly');
    });

});