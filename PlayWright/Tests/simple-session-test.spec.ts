import { test } from '@playwright/test';

test.describe('Simple Session Test', () => {

    test('should access session with real tokens', async ({ browser }) => {
        console.log('=== SIMPLE SESSION TEST START ===');

        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            storageState: undefined
        });

        const page = await context.newPage();

        try {
            // Test with host token using the correct canvas route
            console.log('Testing host token PQ9N5YWW with canvas route...');
            await page.goto('https://localhost:9091/session/canvas/PQ9N5YWW');
            await page.waitForTimeout(5000);

            let pageContent = await page.locator('body').textContent();
            console.log(`Host token page content (first 300 chars): ${pageContent?.substring(0, 300)}`);

            // Test with user token using canvas route
            console.log('Testing user token KJAHA99L with canvas route...');
            await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
            await page.waitForTimeout(5000);

            const hasRegistrationForm2 = await page.locator('input[placeholder*="name" i]').isVisible();
            console.log(`Registration form visible with user token: ${hasRegistrationForm2}`);

            console.log(`Final URL with user token: ${page.url()}`);

            // Get page content to understand what we're seeing
            const pageTitle = await page.title();
            const bodyText = await page.locator('body').textContent();
            console.log(`Page title: ${pageTitle}`);
            console.log(`Page content (first 500 chars): ${bodyText?.substring(0, 500)}`);

            // Look for session canvas elements
            const hasSessionCanvas = await page.locator('.session-canvas-container, .session-canvas-root').isVisible();
            console.log(`Session canvas visible: ${hasSessionCanvas}`);

            // Look for waiting room elements
            const hasWaitingRoom = await page.locator('text=waiting, text=Waiting').isVisible();
            console.log(`Waiting room visible: ${hasWaitingRoom}`);

            // Take a screenshot to see what we're dealing with
            await page.screenshot({ path: 'session-test-result.png', fullPage: true });

        } catch (error) {
            console.error('Test failed with error:', error);
            await page.screenshot({ path: 'session-test-error.png', fullPage: true });
        } finally {
            await context.close();
        }
    });
});