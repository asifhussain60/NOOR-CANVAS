import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:signalcomm:impl] Enhanced HTML parsing tests for DOM parser replacement ;CLEANUP_OK
 * Tests the new HtmlParsingService and JavaScript fallback renderer
 */

test.describe('SignalComm HTML Parser Enhancement', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to host control panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Wait for the page to be fully loaded
        await expect(page.locator('h1')).toContainText('Host Control Panel');
    });

    test('Database-driven HTML broadcasting works without JavaScript errors', async ({ page }) => {
        // Monitor console for JavaScript errors
        const consoleErrors: string[] = [];
        const jsErrors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        // Click Simple HTML button to load content
        await page.click('button:has-text("Simple")');

        // Wait for content to be loaded in textarea
        await page.waitForSelector('textarea[placeholder*="HTML content"]');

        // Verify Simple HTML content is loaded
        const textareaContent = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
        expect(textareaContent).toContain('Welcome Message');

        // Click Broadcast button (now uses database instead of SignalR DOM manipulation)
        await page.click('button:has-text("Broadcast")');

        // Wait for broadcast to complete
        await page.waitForTimeout(3000);

        // Check for success message indicating database storage
        const successMessages = await page.locator('text*="content saved to database"').count();
        expect(successMessages).toBeGreaterThan(0);

        // Verify no JavaScript errors occurred during the broadcast process
        const criticalErrors = jsErrors.filter(error =>
            error.includes('appendChild') ||
            error.includes('Invalid or unexpected token')
        );
        expect(criticalErrors).toHaveLength(0);

        // Test API endpoint for retrieving broadcasts
        const response = await page.request.get('/api/contentbroadcast/session/212');
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.broadcasts).toBeDefined();
        msg.includes('broadcast') || msg.includes('success') || msg.includes('sent')
        );

    if (!hasSuccessMessage) {
        // Check console logs for success indicators
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'info' || msg.type() === 'log') {
                consoleLogs.push(msg.text());
            }
        });

        // Re-broadcast to capture logs
        await page.click('button:has-text("Broadcast")');
        await page.waitForTimeout(1000);

        const hasLogSuccess = consoleLogs.some(log =>
            log.includes('broadcast') || log.includes('success') || log.includes('HTML')
        );
        expect(hasLogSuccess).toBe(true);
    }
});

test('Complex HTML uses enhanced parser without errors', async ({ page }) => {
    // Monitor console for JavaScript errors
    const consoleErrors: string[] = [];
    const parserLogs: string[] = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
        if (msg.text().includes('PARSER') || msg.text().includes('signalcomm')) {
            parserLogs.push(msg.text());
        }
    });

    // Click Complex HTML button
    await page.click('button:has-text("Complex")');

    // Wait for content to be loaded
    await page.waitForSelector('textarea[placeholder*="HTML content"]');

    // Verify Complex HTML content is loaded (should have more advanced CSS)
    const textareaContent = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
    expect(textareaContent.length).toBeGreaterThan(500); // Complex content should be longer

    // Click Broadcast button
    await page.click('button:has-text("Broadcast")');

    // Wait for broadcast processing
    await page.waitForTimeout(3000);

    // Verify no JavaScript errors occurred (the key test)
    if (consoleErrors.length > 0) {
        console.log('Console errors detected:', consoleErrors);
        // Check if errors are the old parsing errors we're trying to fix
        const oldParsingErrors = consoleErrors.filter(error =>
            error.includes("Failed to execute 'appendChild' on 'Node'") ||
            error.includes("Invalid or unexpected token")
        );
        expect(oldParsingErrors).toHaveLength(0);
    }

    // Verify enhanced parser was used
    const hasParserLogs = parserLogs.length > 0;
    expect(hasParserLogs).toBe(true);
});

test('Minimal HTML button exists and works', async ({ page }) => {
    // Look for Minimal HTML button (should be the new addition)
    const minimalButton = page.locator('button:has-text("Minimal")');
    await expect(minimalButton).toBeVisible();

    // Click Minimal HTML button
    await minimalButton.click();

    // Wait for content to be loaded
    await page.waitForSelector('textarea[placeholder*="HTML content"]');

    // Verify Minimal HTML content is loaded and is indeed minimal
    const textareaContent = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
    expect(textareaContent).toContain('<div');
    expect(textareaContent.length).toBeLessThan(200); // Minimal should be short

    // Monitor for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    // Broadcast minimal content
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(2000);

    // Verify no errors with minimal content
    expect(consoleErrors).toHaveLength(0);
});

test('Enhanced error handling for malformed HTML', async ({ page }) => {
    // Monitor console and page for error messages
    const consoleErrors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    // Manually enter malformed HTML
    await page.click('textarea[placeholder*="HTML content"]');
    await page.fill('textarea[placeholder*="HTML content"]', '<div style="color: red; font-family: "Arial", "Helvetica";">Malformed quotes</div>');

    // Try to broadcast malformed content
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(2000);

    // Should either:
    // 1. Show user-friendly error message, OR
    // 2. Process successfully with enhanced parser, OR  
    // 3. Use JavaScript fallback

    // Check for error messages in UI
    const errorMessages = await page.locator('.alert-danger, .error, [class*="error"]').allTextContents();
    const hasUIError = errorMessages.some(msg => msg.includes('error') || msg.includes('invalid'));

    if (hasUIError) {
        // If UI shows error, that's acceptable - enhanced error handling working
        console.log('Enhanced error handling showing user-friendly error');
    } else {
        // If no UI error, then parsing should have succeeded without JavaScript errors
        const oldParsingErrors = consoleErrors.filter(error =>
            error.includes("Failed to execute 'appendChild' on 'Node'") ||
            error.includes("Invalid or unexpected token")
        );
        expect(oldParsingErrors).toHaveLength(0);
    }
});

test('JavaScript fallback renderer is available', async ({ page }) => {
    // Check that the JavaScript renderer is loaded and available
    const rendererExists = await page.evaluate(() => {
        const win = window as any;
        return typeof win.NoorCanvas !== 'undefined' &&
            typeof win.NoorCanvas.HtmlRenderer !== 'undefined' &&
            typeof win.NoorCanvas.HtmlRenderer.renderHtml === 'function';
    });

    expect(rendererExists).toBe(true);

    // Test the JavaScript renderer directly
    const testResult = await page.evaluate(async () => {
        // Create a test container
        const testDiv = document.createElement('div');
        testDiv.id = 'js-renderer-test';
        testDiv.style.display = 'none';
        document.body.appendChild(testDiv);

        try {
            // Test complex HTML that might fail in Blazor
            const testHtml = '<div style="background: linear-gradient(45deg, rgba(255,0,0,0.5), rgba(0,255,0,0.5)); padding: 10px;">JS Test</div>';
            const win = window as any;
            const result = await win.NoorCanvas.HtmlRenderer.renderHtml('js-renderer-test', testHtml);

            // Clean up
            document.body.removeChild(testDiv);
            return result;
        } catch (error) {
            if (testDiv.parentNode) {
                document.body.removeChild(testDiv);
            }
            throw error;
        }
    });

    expect(testResult).toBe(true);
});

test('Progressive complexity testing - all levels work', async ({ page }) => {
    const testLevels = ['Minimal', 'Simple', 'Complex'];

    for (const level of testLevels) {
        console.log(`Testing ${level} HTML level`);

        // Monitor for errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Click the appropriate button
        await page.click(`button:has-text("${level}")`);
        await page.waitForTimeout(500);

        // Verify content loads
        await page.waitForSelector('textarea[placeholder*="HTML content"]');
        const content = await page.locator('textarea[placeholder*="HTML content"]').inputValue();
        expect(content.length).toBeGreaterThan(0);

        // Broadcast
        await page.click('button:has-text("Broadcast")');
        await page.waitForTimeout(2000);

        // Verify no critical JavaScript errors
        const criticalErrors = consoleErrors.filter(error =>
            error.includes("Failed to execute 'appendChild' on 'Node'") ||
            error.includes("Invalid or unexpected token")
        );

        if (criticalErrors.length > 0) {
            console.error(`${level} level failed with errors:`, criticalErrors);
        }
        expect(criticalErrors).toHaveLength(0);
    }
});
});