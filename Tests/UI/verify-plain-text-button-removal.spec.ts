/**
 * Playwright Test: Verify Plain Text Button Removal
 * 
 * Purpose: Verify that the transformHtml() function in session-transcript-styling.html
 *          correctly removes "Plain Text" buttons (poetry-restore-btn) from session transcripts
 * 
 * Test Coverage:
 * - Navigate to session-transcript-styling.html
 * - Load transcript from database API
 * - Verify no Plain Text buttons are visible after transformation
 * - Verify no poetry-restore-btn elements exist in DOM
 * - Check console logs confirm transformation occurred
 * 
 * Related Files:
 * - SPA/NoorCanvas/wwwroot/session-transcript-styling.html
 * - Workspaces/Documentation/REQUIREMENTS/SampleAssetsHTML.txt
 */

import { expect, test } from '@playwright/test';

test.describe('Plain Text Button Removal Verification', () => {
    const BASE_URL = process.env.BASE_URL || 'https://localhost:9091';
    const SESSION_ID = 212; // Known session with Plain Text buttons

    test.beforeEach(async ({ page }) => {
        // Accept SSL certificate errors for localhost
        await page.context().setDefaultNavigationTimeout(30000);

        // Set up console log capture
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info' || msg.type() === 'warn' || msg.type() === 'error') {
                console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
            }
        });
    });

    test('should remove Plain Text buttons from session transcript', async ({ page }) => {
        // Navigate to session-transcript-styling.html
        await page.goto(`${BASE_URL}/session-transcript-styling.html`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await page.waitForSelector('.ks-transcript', { timeout: 10000 });

        // Set session ID if needed
        const sessionInput = page.locator('#sessionIdInput');
        await expect(sessionInput).toBeVisible();
        await sessionInput.fill(SESSION_ID.toString());

        // Capture console logs to verify transformation
        const consoleLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('TRANSFORM') || msg.text().includes('VALIDATION')) {
                consoleLogs.push(msg.text());
            }
        });

        // Click refresh button to load transcript
        const refreshButton = page.locator('button:has-text("Refresh from Database")');
        await expect(refreshButton).toBeVisible();
        await refreshButton.click();

        // Wait for transcript to load (look for actual content, not loading message)
        await page.waitForFunction(() => {
            const container = document.querySelector('.ks-transcript');
            return container && !container.textContent?.includes('Loading fresh transcript');
        }, { timeout: 15000 });

        // Wait a bit more for transformation to complete
        await page.waitForTimeout(2000);

        // CRITICAL TEST: Verify no Plain Text buttons are visible
        const plainTextButtons = page.locator('button:has-text("Plain Text")');
        const plainTextButtonCount = await plainTextButtons.count();

        console.log(`[TEST] Found ${plainTextButtonCount} Plain Text button(s) in DOM`);
        expect(plainTextButtonCount, 'Plain Text buttons should be removed by transformation').toBe(0);

        // Verify no poetry-restore-btn class elements exist
        const poetryRestoreButtons = page.locator('button.poetry-restore-btn');
        const poetryRestoreCount = await poetryRestoreButtons.count();

        console.log(`[TEST] Found ${poetryRestoreCount} poetry-restore-btn element(s) in DOM`);
        expect(poetryRestoreCount, 'poetry-restore-btn elements should be removed').toBe(0);

        // Verify no froala-only-btn class elements exist
        const froalaButtons = page.locator('button.froala-only-btn');
        const froalaCount = await froalaButtons.count();

        console.log(`[TEST] Found ${froalaCount} froala-only-btn element(s) in DOM`);
        expect(froalaCount, 'froala-only-btn elements should be removed').toBe(0);

        // Verify transformation logs indicate success
        await page.waitForTimeout(1000); // Give logs time to capture

        const hasTransformLog = consoleLogs.some(log =>
            log.includes('TRANSFORM') && log.includes('transformation completed')
        );
        expect(hasTransformLog, 'Console should show transformation completed').toBe(true);

        // Verify validation passed
        const hasValidationSuccess = consoleLogs.some(log =>
            log.includes('VALIDATION') && log.includes('Transformed HTML is clean')
        );
        expect(hasValidationSuccess, 'Console should show validation passed').toBe(true);

        // Take screenshot for visual verification
        await page.screenshot({
            path: 'Tests/UI/test-results/plain-text-button-removal-verification.png',
            fullPage: true
        });

        console.log('[TEST] ✓ All Plain Text button removal checks passed');
    });

    test('should verify transformation function exists and is callable', async ({ page }) => {
        await page.goto(`${BASE_URL}/session-transcript-styling.html`, {
            waitUntil: 'networkidle'
        });

        // Verify transformHtml function exists in page context
        const functionExists = await page.evaluate(() => {
            return typeof (window as any).transformHtml === 'function';
        });
        expect(functionExists, 'transformHtml function should be defined').toBe(true);

        // Verify validateTransformation function exists
        const validateExists = await page.evaluate(() => {
            return typeof (window as any).validateTransformation === 'function';
        });
        expect(validateExists, 'validateTransformation function should be defined').toBe(true);

        // Test the transformation function directly with sample HTML (matching actual structure from database)
        const testHtml = `
            <div>
                <button class="btn btn-sm btn-primary poetry-restore-btn froala-only-btn" title="Remove poetry formatting and restore plain text" type="button">
                    &nbsp;<i class="fa fa-undo" style="margin-right: 5px;" aria-hidden="true"></i>Plain Text&nbsp;
                </button>
                <p>Some content</p>
            </div>
        `;

        const transformResult = await page.evaluate((html) => {
            const transformed = (window as any).transformHtml(html);
            const validation = (window as any).validateTransformation(transformed);
            return {
                originalLength: html.length,
                transformedLength: transformed.length,
                containsButton: transformed.includes('poetry-restore-btn'),
                isValid: validation.isValid,
                plainTextButtonsFound: validation.plainTextButtonsFound
            };
        }, testHtml);

        console.log('[TEST] Direct transformation result:', transformResult);

        expect(transformResult.containsButton, 'Transformed HTML should not contain poetry-restore-btn').toBe(false);
        expect(transformResult.transformedLength, 'Transformed HTML should be shorter').toBeLessThan(transformResult.originalLength);
        expect(transformResult.isValid, 'Validation should pass').toBe(true);
        expect(transformResult.plainTextButtonsFound, 'Should find zero Plain Text buttons').toBe(0);

        console.log('[TEST] ✓ Transformation function verification passed');
    });

    test('should handle transcripts with multiple Plain Text buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/session-transcript-styling.html`, {
            waitUntil: 'networkidle'
        });

        // Test HTML with multiple Plain Text buttons
        const multiButtonHtml = `
            <div>
                <div class="poetry-section">
                    <button class="poetry-restore-btn">Plain Text</button>
                    <p>Poetry 1</p>
                </div>
                <div class="poetry-section">
                    <button class="froala-only-btn poetry-restore-btn">Plain Text</button>
                    <p>Poetry 2</p>
                </div>
                <div class="poetry-section">
                    <button class="btn poetry-restore-btn froala-only-btn">Plain Text</button>
                    <p>Poetry 3</p>
                </div>
            </div>
        `;

        const result = await page.evaluate((html) => {
            const transformed = (window as any).transformHtml(html);
            const validation = (window as any).validateTransformation(transformed);

            // Count how many times 'Plain Text' appears in result
            const plainTextMatches = (transformed.match(/Plain Text/g) || []).length;

            return {
                originalButtons: (html.match(/poetry-restore-btn/g) || []).length,
                transformedButtons: (transformed.match(/poetry-restore-btn/g) || []).length,
                plainTextInResult: plainTextMatches,
                isValid: validation.isValid,
                plainTextButtonsFound: validation.plainTextButtonsFound
            };
        }, multiButtonHtml);

        console.log('[TEST] Multiple buttons test result:', result);

        expect(result.originalButtons, 'Should start with 3 buttons').toBe(3);
        expect(result.transformedButtons, 'Should end with 0 buttons').toBe(0);
        expect(result.plainTextInResult, 'Should have no Plain Text in result').toBe(0);
        expect(result.isValid, 'Validation should pass').toBe(true);
        expect(result.plainTextButtonsFound, 'Should find zero buttons after transformation').toBe(0);

        console.log('[TEST] ✓ Multiple button removal verification passed');
    });
});
