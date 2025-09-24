import { expect, test } from '@playwright/test';

test.describe('Logo Replacement Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Ensure the app is running
        await page.goto('https://localhost:9091/health', { waitUntil: 'networkidle' });
        await expect(page.locator('text=Healthy')).toBeVisible({ timeout: 5000 });
    });

    test('Host Landing page should use NoorCanvas.png logo', async ({ page }) => {
        await page.goto('https://localhost:9091/');

        // Look for the logo image
        const logoImg = page.locator('img[alt*="NOOR Canvas"]').first();
        await expect(logoImg).toBeVisible();

        // Verify the logo source path contains NoorCanvas.png
        const logoSrc = await logoImg.getAttribute('src');
        expect(logoSrc).toContain('NoorCanvas.png');
        expect(logoSrc).not.toContain('NC-Header.png');
        expect(logoSrc).not.toContain('branding/');

        console.log(`✅ Host Landing Logo: ${logoSrc}`);

        // Take a screenshot for visual verification
        await page.screenshot({
            path: 'Workspaces/TEMP/logo-verification-host-landing.png',
            fullPage: false
        });
    });

    test('UserLanding page should use NoorCanvas.png logo', async ({ page }) => {
        await page.goto('https://localhost:9091/user/landing');

        // Look for the logo image
        const logoImg = page.locator('img[alt*="NOOR Canvas"]').first();
        await expect(logoImg).toBeVisible();

        // Verify the logo source path contains NoorCanvas.png
        const logoSrc = await logoImg.getAttribute('src');
        expect(logoSrc).toContain('NoorCanvas.png');
        expect(logoSrc).not.toContain('NC-Header.png');
        expect(logoSrc).not.toContain('branding/');

        console.log(`✅ User Landing Logo: ${logoSrc}`);

        // Take a screenshot for visual verification
        await page.screenshot({
            path: 'Workspaces/TEMP/logo-verification-user-landing.png',
            fullPage: false
        });
    });

    test('All logo images should load successfully', async ({ page }) => {
        const pages = [
            '/',
            '/user/landing',
            '/test-harness'
        ];

        for (const pagePath of pages) {
            console.log(`🔍 Checking logo on: ${pagePath}`);
            await page.goto(`https://localhost:9091${pagePath}`);

            // Wait for page to load
            await page.waitForLoadState('networkidle');

            // Find all logo images
            const logoImages = page.locator('img[alt*="NOOR Canvas"], img[src*="NoorCanvas.png"]');
            const logoCount = await logoImages.count();

            if (logoCount > 0) {
                for (let i = 0; i < logoCount; i++) {
                    const logo = logoImages.nth(i);
                    const logoSrc = await logo.getAttribute('src');

                    // Verify logo loads (not broken)
                    const response = await page.request.get(`https://localhost:9091${logoSrc}`);
                    expect(response.status()).toBe(200);

                    // Verify it's using the correct logo file
                    expect(logoSrc).toContain('NoorCanvas.png');

                    console.log(`  ✅ Logo ${i + 1}: ${logoSrc} - Status: ${response.status()}`);
                }
            }
        }
    });

    test('Old NC-Header.png references should be completely removed', async ({ page }) => {
        const pages = [
            '/',
            '/user/landing',
            '/test-harness'
        ];

        for (const pagePath of pages) {
            await page.goto(`https://localhost:9091${pagePath}`);
            await page.waitForLoadState('networkidle');

            // Check that no images reference the old logo
            const oldLogoImages = page.locator('img[src*="NC-Header.png"], img[src*="branding/NC-Header"]');
            const oldLogoCount = await oldLogoImages.count();

            expect(oldLogoCount).toBe(0);
            console.log(`✅ No old logo references found on: ${pagePath}`);
        }
    });
});