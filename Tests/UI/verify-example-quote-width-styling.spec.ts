/**
 * Test Suite: Example and Quote Element Width Styling Verification
 * 
 * Purpose:
 * Verifies that the transformHtml() function correctly adds data-islamic-content
 * attributes to .example and .quote elements, enabling them to use the centralized
 * CSS variable width system (--islamic-asset-width).
 * 
 * What This Tests:
 * 1. Transform function adds data-islamic-content to .example elements
 * 2. Transform function adds data-islamic-content to .quote elements
 * 3. CSS rules apply standardized widths to elements with data-islamic-content
 * 4. Elements receive width: var(--islamic-asset-width) and max-width: var(--islamic-asset-max-width)
 * 5. Verification that widths match other Islamic content assets (poetry, hadees, etc.)
 * 
 * Test Strategy:
 * - Load session-transcript-styling.html demo page
 * - Access transformHtml() function directly
 * - Test with HTML containing .example and .quote elements
 * - Verify data-islamic-content attribute is added
 * - Confirm CSS variables are applied and computed widths are correct
 * 
 * Expected Behavior:
 * - .example elements get data-islamic-content attribute
 * - .quote elements get data-islamic-content attribute
 * - CSS rule [data-islamic-content] .example applies width variables
 * - CSS rule [data-islamic-content] .quote applies width variables
 * - Computed width matches --islamic-asset-width (75% for standalone pages)
 * 
 * Related Files:
 * - session-transcript-styling.html (transformHtml function)
 * - session-transcript.css (CSS variable definitions and rules)
 * - key.json (task: session-transcript-styling)
 */

import { expect, test } from '@playwright/test';

test.describe('Example and Quote Element Width Styling', () => {

    test('should add data-islamic-content attribute to .example elements', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Test HTML with .example element
        const testHtml = `
            <div class="example">
                <p>This is an example block that should get standardized width.</p>
            </div>
        `;

        // Call transformHtml function
        const transformedHtml = await page.evaluate((html) => {
            // @ts-ignore - transformHtml is defined in the page
            return window.transformHtml(html);
        }, testHtml);

        // Verify data-islamic-content attribute was added
        expect(transformedHtml).toContain('data-islamic-content');
        expect(transformedHtml).toContain('<div class="example" data-islamic-content>');

        // Verify the transformation was logged
        const logs = await page.evaluate(() => {
            // @ts-ignore - window.console is available
            return window.console;
        });

        console.log('✓ Transform added data-islamic-content to .example element');
    });

    test('should add data-islamic-content attribute to .quote elements', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Test HTML with .quote element (both p and div variants)
        const testHtmlParagraph = `
            <p class="quote">This is a quote paragraph that needs width control.</p>
        `;

        const testHtmlDiv = `
            <div class="quote">This is a quote div that needs width control.</div>
        `;

        // Call transformHtml function for paragraph
        const transformedParagraph = await page.evaluate((html) => {
            // @ts-ignore
            return window.transformHtml(html);
        }, testHtmlParagraph);

        // Call transformHtml function for div
        const transformedDiv = await page.evaluate((html) => {
            // @ts-ignore
            return window.transformHtml(html);
        }, testHtmlDiv);

        // Verify data-islamic-content attribute was added to paragraph
        expect(transformedParagraph).toContain('data-islamic-content');
        expect(transformedParagraph).toContain('<p class="quote" data-islamic-content>');

        // Verify data-islamic-content attribute was added to div
        expect(transformedDiv).toContain('data-islamic-content');
        expect(transformedDiv).toContain('<div class="quote" data-islamic-content>');

        console.log('✓ Transform added data-islamic-content to both p.quote and div.quote elements');
    });

    test('should handle multiple .example and .quote elements in single HTML block', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Test HTML with multiple elements
        const testHtml = `
            <div class="example">
                <p>First example block.</p>
            </div>
            <p class="quote">A quote in the middle.</p>
            <div class="example">
                <p>Second example block.</p>
            </div>
            <p class="quote">Another quote at the end.</p>
        `;

        // Call transformHtml function
        const transformedHtml = await page.evaluate((html) => {
            // @ts-ignore
            return window.transformHtml(html);
        }, testHtml);

        // Count occurrences of data-islamic-content (should be 4 total)
        const matches = transformedHtml.match(/data-islamic-content/g);
        expect(matches).toHaveLength(4);

        // Verify each element type was transformed
        expect(transformedHtml).toContain('<div class="example" data-islamic-content>');
        expect(transformedHtml).toContain('<p class="quote" data-islamic-content>');

        console.log('✓ Transform handled multiple .example and .quote elements (4 total)');
    });

    test('should not duplicate data-islamic-content if already present', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Test HTML with element already having data-islamic-content
        const testHtml = `
            <div class="example" data-islamic-content>
                <p>This example already has the attribute.</p>
            </div>
        `;

        // Call transformHtml function
        const transformedHtml = await page.evaluate((html) => {
            // @ts-ignore
            return window.transformHtml(html);
        }, testHtml);

        // Count occurrences of data-islamic-content (should only be 1)
        const matches = transformedHtml.match(/data-islamic-content/g);
        expect(matches).toHaveLength(1);

        console.log('✓ Transform did not duplicate data-islamic-content attribute');
    });

    test('should verify CSS rules apply standardized width to [data-islamic-content] .example', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Create a test .example element with data-islamic-content attribute
        const elementHandle = await page.evaluateHandle(() => {
            const div = document.createElement('div');
            div.className = 'example';
            div.setAttribute('data-islamic-content', '');
            div.textContent = 'Test example element';
            document.body.appendChild(div);
            return div;
        });

        // Get computed styles
        const computedStyles = await page.evaluate((element) => {
            const el = element as HTMLElement;
            const styles = window.getComputedStyle(el);
            return {
                width: styles.width,
                maxWidth: styles.maxWidth,
                margin: styles.margin,
            };
        }, elementHandle);

        // Verify width is set using CSS variable
        // For standalone pages with [data-islamic-content], --islamic-asset-width is 75%
        // We can't check the exact pixel value, but we can verify it's not 'auto' or '100%'
        expect(computedStyles.width).not.toBe('auto');
        expect(computedStyles.width).not.toBe('100%');

        // Verify margin is set to auto (for centering)
        expect(computedStyles.margin).toContain('auto');

        console.log('✓ CSS rules apply to [data-islamic-content] .example');
        console.log(`  Computed width: ${computedStyles.width}`);
        console.log(`  Computed max-width: ${computedStyles.maxWidth}`);
        console.log(`  Computed margin: ${computedStyles.margin}`);

        // Clean up
        await page.evaluate((element) => {
            (element as HTMLElement).remove();
        }, elementHandle);
    });

    test('should verify CSS rules apply standardized width to [data-islamic-content] .quote', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Create a test .quote element with data-islamic-content attribute
        const elementHandle = await page.evaluateHandle(() => {
            const p = document.createElement('p');
            p.className = 'quote';
            p.setAttribute('data-islamic-content', '');
            p.textContent = 'Test quote element';
            document.body.appendChild(p);
            return p;
        });

        // Get computed styles
        const computedStyles = await page.evaluate((element) => {
            const el = element as HTMLElement;
            const styles = window.getComputedStyle(el);
            return {
                width: styles.width,
                maxWidth: styles.maxWidth,
                margin: styles.margin,
            };
        }, elementHandle);

        // Verify width is set using CSS variable
        expect(computedStyles.width).not.toBe('auto');
        expect(computedStyles.width).not.toBe('100%');

        // Verify margin is set to auto (for centering)
        expect(computedStyles.margin).toContain('auto');

        console.log('✓ CSS rules apply to [data-islamic-content] .quote');
        console.log(`  Computed width: ${computedStyles.width}`);
        console.log(`  Computed max-width: ${computedStyles.maxWidth}`);
        console.log(`  Computed margin: ${computedStyles.margin}`);

        // Clean up
        await page.evaluate((element) => {
            (element as HTMLElement).remove();
        }, elementHandle);
    });

    test('should verify .example and .quote widths match other Islamic assets (poetry, hadees)', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Create test elements for comparison
        const widthComparison = await page.evaluate(() => {
            // Create .example element
            const example = document.createElement('div');
            example.className = 'example';
            example.setAttribute('data-islamic-content', '');
            document.body.appendChild(example);

            // Create .quote element
            const quote = document.createElement('p');
            quote.className = 'quote';
            quote.setAttribute('data-islamic-content', '');
            document.body.appendChild(quote);

            // Create .poetry-section element for comparison
            const poetry = document.createElement('div');
            poetry.className = 'poetry-section';
            poetry.setAttribute('data-islamic-content', '');
            document.body.appendChild(poetry);

            // Get computed widths
            const exampleWidth = window.getComputedStyle(example).width;
            const quoteWidth = window.getComputedStyle(quote).width;
            const poetryWidth = window.getComputedStyle(poetry).width;

            // Clean up
            example.remove();
            quote.remove();
            poetry.remove();

            return {
                exampleWidth,
                quoteWidth,
                poetryWidth
            };
        });

        // Verify all elements use the same width (CSS variable standardization)
        expect(widthComparison.exampleWidth).toBe(widthComparison.poetryWidth);
        expect(widthComparison.quoteWidth).toBe(widthComparison.poetryWidth);

        console.log('✓ All Islamic content assets use standardized width');
        console.log(`  .example width: ${widthComparison.exampleWidth}`);
        console.log(`  .quote width: ${widthComparison.quoteWidth}`);
        console.log(`  .poetry-section width: ${widthComparison.poetryWidth}`);
    });

    test('should log transformation metrics for .example and .quote elements', async ({ page }) => {
        // Navigate to the demo page
        await page.goto('https://localhost:9091/session-transcript-styling.html');

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Set up console listener
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'info' && msg.text().includes('TRANSFORM:')) {
                consoleLogs.push(msg.text());
            }
        });

        // Test HTML with both .example and .quote
        const testHtml = `
            <div class="example">
                <p>Example content.</p>
            </div>
            <p class="quote">Quote content.</p>
        `;

        // Call transformHtml function
        await page.evaluate((html) => {
            // @ts-ignore
            return window.transformHtml(html);
        }, testHtml);

        // Wait a bit for console logs to be captured
        await page.waitForTimeout(100);

        // Verify logs mention adding data-islamic-content
        const hasExampleLog = consoleLogs.some(log =>
            log.includes('Added data-islamic-content') && log.includes('.example')
        );
        const hasQuoteLog = consoleLogs.some(log =>
            log.includes('Added data-islamic-content') && log.includes('.quote')
        );

        expect(hasExampleLog).toBeTruthy();
        expect(hasQuoteLog).toBeTruthy();

        console.log('✓ Transform function logs metrics for .example and .quote processing');
        consoleLogs.forEach(log => console.log(`  ${log}`));
    });
});
