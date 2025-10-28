import { expect, test } from '@playwright/test';

/**
 * E2E Test: Verify MediaUrlTransformService uses CDN URLs (not file://) for Session 2343
 * 
 * Purpose: Validate that the fix to MediaUrlTransformService correctly transforms
 * all resource URLs to use the CDN (https://resources.kashkole.com) instead of
 * file:// protocol in both development and production environments.
 * 
 * Related:
 * - .github/instructions/CDN-Architecture.md
 * - .github/key-data-streams/transcript-img-fix/
 * - SPA/NoorCanvas/Services/MediaUrlTransformService.cs
 * 
 * Session: 2343 (contains 2 images for testing)
 * Expected Images:
 * - 6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg
 * - 0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg
 */

test.describe('MediaUrlTransform CDN Fix - Session 2343', () => {

    // Base URL for the application
    const baseUrl = 'http://localhost:9090';

    test('should transform all image URLs to CDN (no file:// protocol)', async ({ page }) => {
        // Navigate to Session 2343 transcript page (adjust URL based on actual route)
        // Assuming route is /transcript/canvas/{token} or similar
        await page.goto(`${baseUrl}/transcript/canvas/2343`);

        // Wait for session to load
        await page.waitForLoadState('networkidle');

        // Get all image elements in the transcript content
        const images = await page.locator('img[src*="IMAGES/2343"], img[src*="resources.kashkole.com/IMAGES/2343"]').all();

        // Verify at least 2 images exist (Session 2343 has 2 images)
        expect(images.length).toBeGreaterThanOrEqual(2);

        // Check each image URL
        for (const img of images) {
            const src = await img.getAttribute('src');

            // Should use CDN URL
            expect(src).toContain('https://resources.kashkole.com/IMAGES/2343/');

            // Should NOT use file:// protocol
            expect(src).not.toContain('file://');

            // Should NOT use relative path
            expect(src).not.toMatch(/^Resources\//);

            // Should NOT use KSESSIONS domain
            expect(src).not.toContain('kashkole.com/Resources');

            console.log(`✓ Image URL transformed correctly: ${src}`);
        }
    });

    test('should verify specific Session 2343 images use CDN', async ({ page }) => {
        await page.goto('http://localhost:9090');
        await page.waitForLoadState('networkidle');

        // Expected image GUIDs from Session 2343
        const expectedImages = [
            '6cfa2ba3-9ae1-44d1-b38d-357ae051450c',
            '0bae0475-f5de-4d3d-8c83-134d16da18b7'
        ];

        for (const guid of expectedImages) {
            const expectedUrl = `https://resources.kashkole.com/IMAGES/2343/${guid}.jpg`;

            // Check if image with CDN URL exists
            const img = page.locator(`img[src="${expectedUrl}"]`);

            // Verify image exists
            await expect(img).toBeVisible({ timeout: 5000 });

            console.log(`✓ Verified CDN URL: ${expectedUrl}`);
        }
    });

    test('should load images successfully from CDN', async ({ page }) => {
        await page.goto('http://localhost:9090');
        await page.waitForLoadState('networkidle');

        // Get all Session 2343 images
        const images = await page.locator('img[src*="resources.kashkole.com/IMAGES/2343"]').all();

        expect(images.length).toBeGreaterThanOrEqual(2);

        // Verify each image loaded successfully (not broken)
        for (const img of images) {
            const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
            const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);

            // Non-zero dimensions mean image loaded successfully
            expect(naturalWidth).toBeGreaterThan(0);
            expect(naturalHeight).toBeGreaterThan(0);

            const src = await img.getAttribute('src');
            console.log(`✓ Image loaded successfully: ${src} (${naturalWidth}x${naturalHeight})`);
        }
    });

    test('should verify CORS headers allow CDN access', async ({ page }) => {
        // Intercept image requests to verify CORS headers
        const imageRequests: string[] = [];

        page.on('response', response => {
            const url = response.url();
            if (url.includes('resources.kashkole.com/IMAGES/2343')) {
                imageRequests.push(url);

                // Check CORS headers
                const corsHeader = response.headers()['access-control-allow-origin'];
                console.log(`CDN Response: ${url}`);
                console.log(`CORS Header: ${corsHeader}`);

                // Verify CORS is configured
                expect(corsHeader).toBeDefined();
            }
        });

        await page.goto('http://localhost:9090');
        await page.waitForLoadState('networkidle');

        // Verify at least 2 image requests were made to CDN
        expect(imageRequests.length).toBeGreaterThanOrEqual(2);
    });

    test('should NOT have any file:// URLs in page source', async ({ page }) => {
        await page.goto('http://localhost:9090');
        await page.waitForLoadState('networkidle');

        // Get page HTML
        const html = await page.content();

        // Verify NO file:// URLs exist
        expect(html).not.toContain('file:///D:/Websites/KSESSIONS/Resources');
        expect(html).not.toMatch(/file:\/\/.*Resources.*IMAGES/);

        console.log('✓ No file:// URLs found in page source');
    });
});
