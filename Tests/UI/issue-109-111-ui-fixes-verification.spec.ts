import { expect, test } from '@playwright/test';

/**
 * Test suite for Issues 109-111 UI fixes verification
 * 
 * Issue-109: Panel spacing between golden border panels
 * Issue-110: Logo positioning inside vs outside card
 * Issue-111: Debug panel removal 
 */

test.describe('Issues 109-111 UI Fixes Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Host Session Opener page
        await page.goto('https://localhost:9091/host/session-opener');
        await page.waitForLoadState('networkidle');

        // Wait for the page to be fully loaded
        await expect(page.locator('h1:has-text("Host Session Opener")')).toBeVisible();
    });

    test('Issue-109: Verify panel spacing between golden border panels', async ({ page }) => {
        // First, let's check if the session panel exists
        const sessionPanel = page.locator('div').filter({
            hasText: 'Open Session'
        }).locator('..').filter({
            has: page.locator('div[style*="border:2px solid #C5B358"]')
        });

        await expect(sessionPanel).toBeVisible();
        console.log('✅ Session panel found');

        // Open a session to make the link panel appear
        await page.selectOption('select[id="album-select"]', { index: 1 }); // Select first available album
        await page.waitForTimeout(2000); // Wait for cascading dropdown

        await page.selectOption('select[id="category-select"]', { index: 1 }); // Select first category
        await page.waitForTimeout(2000); // Wait for cascading dropdown

        await page.selectOption('select[id="session-select"]', { index: 1 }); // Select first session
        await page.waitForTimeout(2000);

        await page.selectOption('select[id="country-select"]', { index: 1 }); // Select first country

        await page.fill('input[type="date"]', '2025-09-20');
        await page.fill('input[type="text"][placeholder*="HH:MM"]', '10:00 AM');
        await page.fill('input[type="number"][placeholder*="duration"]', '60');

        // Click Open Session button
        const openSessionBtn = page.locator('button:has-text("Open Session")');
        await expect(openSessionBtn).toBeEnabled();
        await openSessionBtn.click();

        // Wait for the link panel to appear
        await expect(page.locator('h3:has-text("Session URL")')).toBeVisible();
        console.log('✅ Link panel appeared after opening session');

        // Now check the spacing between panels
        const linkPanel = page.locator('div').filter({
            hasText: 'Session URL'
        }).locator('..').filter({
            has: page.locator('div[style*="border:2px solid #C5B358"]')
        });

        await expect(linkPanel).toBeVisible();

        // Get the computed styles to check margin
        const linkPanelStyle = await linkPanel.evaluate(el => window.getComputedStyle(el).marginTop);
        console.log(`Link panel margin-top: ${linkPanelStyle}`);

        // Check that margin-top is 1.5rem (24px)
        expect(linkPanelStyle).toBe('24px'); // 1.5rem = 24px
    });

    test('Issue-110: Verify logo is positioned inside the card', async ({ page }) => {
        // Find the main card container
        const mainCard = page.locator('div[style*="background-color:#FFFFFF"][style*="border-radius:1.5rem"]');
        await expect(mainCard).toBeVisible();
        console.log('✅ Main card container found');

        // Find the logo image
        const logoImage = page.locator('img[src*="NC-Header.png"]');
        await expect(logoImage).toBeVisible();
        console.log('✅ Logo image found');

        // Check if the logo is inside the main card
        const logoInsideCard = mainCard.locator('img[src*="NC-Header.png"]');
        await expect(logoInsideCard).toBeVisible();
        console.log('✅ Logo is inside the main card container');

        // Verify the logo is not absolutely positioned outside the card
        const logoStyle = await logoImage.evaluate(el => {
            const computed = window.getComputedStyle(el);
            const parent = el.parentElement;
            const parentComputed = window.getComputedStyle(parent!);
            return {
                position: computed.position,
                parentPosition: parentComputed.position,
                top: computed.top,
                left: computed.left
            };
        });

        console.log(`Logo positioning: ${JSON.stringify(logoStyle)}`);

        // Logo should not be absolutely positioned
        expect(logoStyle.position).not.toBe('absolute');
    });

    test('Issue-111: Verify debug panel is completely removed', async ({ page }) => {
        // Check that there are no debug info panels visible
        const debugPanels = page.locator('div:has-text("Debug Info:")');
        await expect(debugPanels).toHaveCount(0);
        console.log('✅ No debug info panels found');

        // Check for any elements with debug-related text
        const debugText = page.locator('text=Debug Info:');
        await expect(debugText).toHaveCount(0);

        // Check for any elements showing Album/Category/Session/Country debug info
        const debugValues = page.locator('text=Album: >> text=Category: >> text=Session: >> text=Country:');
        await expect(debugValues).toHaveCount(0);

        console.log('✅ No debug information text found on page');
    });

    test('Comprehensive UI state verification', async ({ page }) => {
        // Take a screenshot for visual verification
        await page.screenshot({ path: 'Tests/UI/screenshots/host-session-opener-current-state.png', fullPage: true });
        console.log('✅ Screenshot saved for visual inspection');

        // Verify key elements are present and properly positioned
        await expect(page.locator('h1:has-text("Host Session Opener")')).toBeVisible();

        // Check that logo is visible and inside main container
        const mainContainer = page.locator('div[style*="max-width:46.4rem"]');
        const logoInContainer = mainContainer.locator('img[src*="NC-Header.png"]');
        await expect(logoInContainer).toBeVisible();

        // Check that form elements are present
        await expect(page.locator('select[id="album-select"]')).toBeVisible();
        await expect(page.locator('select[id="category-select"]')).toBeVisible();
        await expect(page.locator('select[id="session-select"]')).toBeVisible();
        await expect(page.locator('select[id="country-select"]')).toBeVisible();

        console.log('✅ All key UI elements are present and accessible');
    });
});