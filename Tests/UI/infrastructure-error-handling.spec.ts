/**
 * Error Handling Infrastructure Tests
 * Generated from test-prep session: 20251031120000
 * Quality: 55% (Low)
 * 
 * Tests Blazor error handling and browser error logging
 * Based on browser logs (line 49): appendChild SyntaxError, UNHANDLED-ERROR logging
 */

import { expect, test } from '@playwright/test';

test.describe('Error Handling Infrastructure', () => {
    test('should capture and log Blazor appendChild error', async ({ page }) => {
        // Arrange: Capture console errors
        const errorLogs: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('ERROR')) {
                errorLogs.push(msg.text());
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: UNHANDLED-ERROR log present (based on browser log line 49)
        const hasAppendChildError = errorLogs.some(log =>
            log.includes('UNHANDLED-ERROR') &&
            log.includes("Failed to execute 'appendChild' on 'Node'")
        );
        expect(hasAppendChildError).toBeTruthy();
    });

    test('should send browser errors to server via /api/logs endpoint', async ({ page }) => {
        // Arrange: Intercept API logs endpoint
        let errorSent = false;
        page.on('request', req => {
            if (req.url().includes('/api/logs') && req.method() === 'POST') {
                errorSent = true;
            }
        });

        // Act: Navigate and trigger error
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Error sent to server (based on server log line 136)
        expect(errorSent).toBeTruthy();
    });

    test('should continue page functionality despite appendChild error', async ({ page }) => {
        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: Page still interactive despite error
        const bodyVisible = await page.locator('body').isVisible();
        const hasInteractiveElements = await page.locator('button, input, a').count() > 0;

        expect(bodyVisible).toBe(true);
        expect(hasInteractiveElements).toBe(true);
    });

    test('should log error details including filename and line number', async ({ page }) => {
        // Arrange: Capture console errors with details
        const detailedErrors: any[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                detailedErrors.push({
                    text: msg.text(),
                    location: msg.location()
                });
            }
        });

        // Act: Navigate
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Assert: At least one error logged with location details
        const hasDetailedError = detailedErrors.some(err =>
            err.location && (err.location.lineNumber !== undefined)
        );
        expect(hasDetailedError).toBeTruthy();
    });
});
