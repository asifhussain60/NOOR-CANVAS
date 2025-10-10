/**
 * Test: Verify Info Panel Removed from Host-SessionOpener
 * 
 * Purpose: Confirm that the blue information panel ("Auto-populated from Token")
 * has been completely removed from the Host-SessionOpener page while preserving
 * error message functionality.
 * 
 * Scenarios:
 * 1. Navigate with valid token - no info panel should appear
 * 2. Click Generate without fields - error panel should appear
 */

import { expect, test } from '@playwright/test';

test.describe('Host-SessionOpener Info Panel Removal', () => {

    const BASE_URL = 'https://localhost:9091';
    const VALID_TOKEN = 'PQ9N5YWW'; // Session 212 token

    test('should NOT display info panel when auto-populating from valid token', async ({ page }) => {
        // Ignore certificate errors for localhost
        await page.goto(`${BASE_URL}/host/session-opener/${VALID_TOKEN}`, {
            waitUntil: 'networkidle',
        });

        // Wait for form to load and auto-populate
        await page.waitForTimeout(2000);

        // Check that info panel (blue background) does NOT exist
        const infoPanelBlue = page.locator('div').filter({
            has: page.locator('h4:has-text("Information")'),
        });
        await expect(infoPanelBlue).toHaveCount(0);

        // Alternative check: search for the specific blue background color
        const blueBanner = page.locator('div[style*="background-color:#eff6ff"]');
        await expect(blueBanner).toHaveCount(0);

        // Alternative check: search for "Auto-populated" text
        const autoPopulatedText = page.getByText(/Auto-populated from Token/i);
        await expect(autoPopulatedText).toHaveCount(0);

        // Verify form WAS auto-populated (dropdowns have values)
        const albumSelect = page.locator('select').first();
        const albumValue = await albumSelect.inputValue();
        expect(albumValue).not.toBe('0'); // Should be album 14

        console.log('✓ Info panel not found - PASS');
        console.log(`✓ Form auto-populated with album: ${albumValue}`);
    });

    test('should NOT display info panel on page load without token', async ({ page }) => {
        // Navigate without token
        await page.goto(`${BASE_URL}/host/session-opener`, {
            waitUntil: 'networkidle',
        });

        await page.waitForTimeout(1000);

        // Check that info panel does NOT exist
        const blueBanner = page.locator('div[style*="background-color:#eff6ff"]');
        await expect(blueBanner).toHaveCount(0);

        // Error panel should also not be visible yet
        const errorPanel = page.locator('div[style*="background-color:#fef2f2"]');
        await expect(errorPanel).toHaveCount(0);

        console.log('✓ No panels visible on clean load - PASS');
    });

    test('should ONLY show error panel when validation fails', async ({ page }) => {
        // Navigate without token
        await page.goto(`${BASE_URL}/host/session-opener`, {
            waitUntil: 'networkidle',
        });

        await page.waitForTimeout(1000);

        // Click Generate button without filling fields
        const generateButton = page.getByRole('button', { name: /Generate User Token/i });
        await generateButton.click();

        await page.waitForTimeout(500);

        // Info panel should NOT exist
        const blueBanner = page.locator('div[style*="background-color:#eff6ff"]');
        await expect(blueBanner).toHaveCount(0);

        // Error panel SHOULD exist
        const errorPanel = page.locator('div[style*="background-color:#fef2f2"]');
        await expect(errorPanel).toBeVisible();

        // Error panel should contain "Action Required" heading
        const errorHeading = page.locator('h4:has-text("Action Required")');
        await expect(errorHeading).toBeVisible();

        console.log('✓ Only error panel visible on validation failure - PASS');
    });

    test('visual regression: check DOM structure has no blue info panel', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/session-opener/${VALID_TOKEN}`, {
            waitUntil: 'networkidle',
        });

        await page.waitForTimeout(2000);

        // Get all divs with background colors
        const allColoredDivs = await page.locator('div[style*="background-color"]').all();

        for (const div of allColoredDivs) {
            const style = await div.getAttribute('style');

            // Assert none have the blue info color
            expect(style).not.toContain('#eff6ff');
            expect(style).not.toContain('rgb(239, 246, 255)');
        }

        console.log(`✓ Checked ${allColoredDivs.length} colored divs - no blue info panels - PASS`);
    });
});
