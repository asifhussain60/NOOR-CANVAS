import { expect, test } from '@playwright/test';

/**
 * Test: imgResponsive Image Width Sizing Fix
 * Key: session-transcript-styling
 * Phase: 1
 * 
 * Validates that:
 * 1. Images with imgResponsive class have no inline width/height styles
 * 2. Images have data-islamic-content attribute appended
 * 3. Computed width matches expected CSS variable percentage (70% for wide theme)
 * 4. Transform function successfully removes inline styles
 * 5. Images render with correct responsive width
 */

test.describe('imgResponsive Width Sizing Fix', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the session transcript styling page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
    });

    test('should load session transcript styling page successfully', async ({ page }) => {
        // Verify page title
        await expect(page).toHaveTitle(/Session Transcript Styling Demo/);

        // Verify main container is present
        const mainContainer = page.locator('.ks-transcript');
        await expect(mainContainer).toBeVisible();
    });

    test('should have transform function defined', async ({ page }) => {
        // Verify transformHtml function exists
        const hasTransformFunction = await page.evaluate(() => {
            return typeof (window as any).transformHtml === 'function';
        });
        expect(hasTransformFunction).toBe(true);
    });

    test('should remove inline width/height styles from imgResponsive images', async ({ page }) => {
        // Create a test HTML snippet with imgResponsive image with inline styles
        const testHtml = `
            <img src="/images/test.jpg" class="imgResponsive" style="width: 500px; height: 300px; border: 1px solid red;" data-islamic-content>
            <img src="/images/test2.jpg" class="imgResponsive another-class" style="height: 400px; width: 600px;" data-islamic-content>
        `;

        // Run transform function
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Verify width and height styles are removed
        expect(transformedHtml).not.toContain('width: 500px');
        expect(transformedHtml).not.toContain('height: 300px');
        expect(transformedHtml).not.toContain('width: 600px');
        expect(transformedHtml).not.toContain('height: 400px');

        // Verify other styles remain (border should still be there)
        expect(transformedHtml).toContain('border: 1px solid red');

        // Verify imgResponsive class is still present
        expect(transformedHtml).toContain('imgResponsive');
    });

    test('should add data-islamic-content attribute to imgResponsive elements', async ({ page }) => {
        // Create test HTML without data-islamic-content
        const testHtml = `
            <img src="/images/test.jpg" class="imgResponsive">
            <img src="/images/test2.jpg" class="another-class imgResponsive">
        `;

        // Run transform function
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Count occurrences of data-islamic-content
        const matches = transformedHtml.match(/data-islamic-content/g);
        expect(matches).not.toBeNull();
        expect(matches?.length).toBe(2); // Both images should have the attribute
    });

    test('should not duplicate data-islamic-content attribute', async ({ page }) => {
        // Create test HTML with data-islamic-content already present
        const testHtml = `
            <img src="/images/test.jpg" class="imgResponsive" data-islamic-content>
        `;

        // Run transform function
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Count occurrences of data-islamic-content (should still be 1)
        const matches = transformedHtml.match(/data-islamic-content/g);
        expect(matches).not.toBeNull();
        expect(matches?.length).toBe(1); // Should not duplicate
    });

    test('should handle images without style attribute', async ({ page }) => {
        // Create test HTML without style attribute
        const testHtml = `
            <img src="/images/test.jpg" class="imgResponsive">
        `;

        // Run transform function (should not throw error)
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Verify image is still present and has data-islamic-content
        expect(transformedHtml).toContain('imgResponsive');
        expect(transformedHtml).toContain('data-islamic-content');
    });

    test('should remove empty style attributes after cleaning', async ({ page }) => {
        // Create test HTML with style containing only width/height
        const testHtml = `
            <img src="/images/test.jpg" class="imgResponsive" style="width: 500px; height: 300px;">
        `;

        // Run transform function
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Verify style attribute is completely removed (not just empty)
        expect(transformedHtml).not.toContain('style=""');
        expect(transformedHtml).not.toContain('style=');
    });

    test('should apply CSS variable width with !important override', async ({ page }) => {
        // Inject test HTML with imgResponsive image
        await page.evaluate(() => {
            const container = document.querySelector('.ks-transcript');
            if (container) {
                container.innerHTML = `
                    <div data-islamic-content>
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23ddd' width='800' height='600'/%3E%3C/svg%3E" 
                             class="imgResponsive" 
                             style="width: 800px; height: 600px;"
                             data-islamic-content>
                    </div>
                `;
            }
        });

        // Wait for image to be present
        const image = page.locator('.imgResponsive').first();
        await expect(image).toBeVisible();

        // Get computed width percentage relative to container
        const widthInfo = await page.evaluate(() => {
            const img = document.querySelector('.imgResponsive') as HTMLImageElement;
            const container = document.querySelector('.ks-transcript') as HTMLElement;

            if (!img || !container) {
                return { error: 'Elements not found' };
            }

            const imgWidth = img.offsetWidth;
            const containerWidth = container.offsetWidth;
            const widthPercentage = (imgWidth / containerWidth) * 100;

            return {
                imgWidth,
                containerWidth,
                widthPercentage: Math.round(widthPercentage),
                hasInlineWidth: img.style.width !== '',
                computedWidth: window.getComputedStyle(img).width
            };
        });

        console.log('Image Width Info:', widthInfo);

        // Image should be approximately 70% of container width (wide theme)
        // Allow 5% variance for margins, padding, etc.
        expect(widthInfo.widthPercentage).toBeGreaterThanOrEqual(65);
        expect(widthInfo.widthPercentage).toBeLessThanOrEqual(75);
    });

    test('should validate transformation metrics logging', async ({ page }) => {
        // Listen for console logs
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'log' && msg.text().includes('TRANSFORM:')) {
                consoleLogs.push(msg.text());
            }
        });

        // Create test HTML with buttons and images to transform
        const testHtml = `
            <button id="delete-btn">Delete</button>
            <img src="/images/test.jpg" class="imgResponsive" style="width: 500px; height: 300px;">
            <div class="example">Example content</div>
        `;

        // Run transform function
        await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Wait a bit for logs to be captured
        await page.waitForTimeout(500);

        // Verify transformation logs were emitted
        const hasTransformLog = consoleLogs.some(log =>
            log.includes('HTML transformation completed')
        );
        expect(hasTransformLog).toBe(true);
    });

    test('should handle complex real-world HTML transformation', async ({ page }) => {
        // Simulate real database HTML with mixed content
        const testHtml = `
            <div class="example">
                <p>Some example content</p>
                <button class="poetry-restore-btn">Plain Text</button>
            </div>
            <div class="quote">
                <p>A quote from a scholar</p>
            </div>
            <img src="/images/kaaba.jpg" class="imgResponsive" style="width: 700px; height: 525px; margin: 10px auto;">
            <button id="delete-hadees-123">Delete Hadees</button>
        `;

        // Run transform function
        const transformedHtml = await page.evaluate((html) => {
            return (window as any).transformHtml(html);
        }, testHtml);

        // Verify buttons are removed
        expect(transformedHtml).not.toContain('poetry-restore-btn');
        expect(transformedHtml).not.toContain('delete-hadees-123');

        // Verify image styles cleaned
        expect(transformedHtml).not.toContain('width: 700px');
        expect(transformedHtml).not.toContain('height: 525px');

        // Verify margin style preserved
        expect(transformedHtml).toContain('margin: 10px auto');

        // Verify data-islamic-content added to all relevant elements
        const dataIslamicCount = (transformedHtml.match(/data-islamic-content/g) || []).length;
        expect(dataIslamicCount).toBeGreaterThanOrEqual(3); // example, quote, img
    });
});
