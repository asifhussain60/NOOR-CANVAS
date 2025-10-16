import { expect, test } from '@playwright/test';

/**
 * Test Suite: Annotation Demo - Laser Pointer Synchronization
 * Purpose: Verify laser pointer broadcasts correctly between two views via SignalR
 * 
 * Prerequisites:
 * - Server running on https://localhost:9091
 * - canvas.Annotations table exists in KSESSIONS_DEV database
 * - SignalR hub /hub/annotation registered and accessible
 */

test.describe('Annotation Demo - Laser Pointer', () => {

    test('should connect to SignalR and show connected status', async ({ page }) => {
        // Navigate to annotation demo
        await page.goto('https://localhost:9091/annotation-demo.html');
        await page.waitForLoadState('networkidle');

        // Click Connect button
        await page.click('#connect-btn');

        // Wait for connection to establish
        await page.waitForSelector('.status-connected', { timeout: 10000 });

        // Verify connection status
        const statusText = await page.textContent('#connection-text');
        expect(statusText).toBe('Connected');

        // Verify event log shows successful connection
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('SignalR connection established');
        await expect(eventLog).toContainText('successfully joined session');
    });

    test('should activate laser pointer tool', async ({ page }) => {
        // Navigate and connect
        await page.goto('https://localhost:9091/annotation-demo.html');
        await page.waitForLoadState('networkidle');
        await page.click('#connect-btn');
        await page.waitForSelector('.status-connected', { timeout: 10000 });

        // Click Laser Pointer tool button
        const laserButton = page.locator('button[data-tool="laser"]');
        await laserButton.click();

        // Verify tool is active
        await expect(laserButton).toHaveClass(/active/);

        // Verify event log shows laser activation
        const eventLog = page.locator('#event-log');
        await expect(eventLog).toContainText('Laser pointer activated');
    });

    test('should show laser pointer on mousemove over View 1', async ({ page }) => {
        // Navigate and connect
        await page.goto('https://localhost:9091/annotation-demo.html');
        await page.waitForLoadState('networkidle');
        await page.click('#connect-btn');
        await page.waitForSelector('.status-connected', { timeout: 10000 });

        // Activate laser pointer
        await page.click('button[data-tool="laser"]');
        await page.waitForTimeout(500);

        // Move mouse over View 1
        const view1Container = page.locator('#view-1-container');
        const box = await view1Container.boundingBox();

        if (box) {
            // Move to center of View 1
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(1000);

            // Verify laser pointer 1 is visible
            const laserPointer1 = page.locator('#laser-pointer-1');
            await expect(laserPointer1).toBeVisible();

            // Verify laser pointer has correct position (not hidden display:none)
            const display = await laserPointer1.evaluate(el => window.getComputedStyle(el).display);
            expect(display).not.toBe('none');
        }
    });

    test('should broadcast laser pointer position to View 2', async ({ page, context }) => {
        // Create two pages to simulate two users
        const page1 = page;
        const page2 = await context.newPage();

        // Page 1: Navigate and connect
        await page1.goto('https://localhost:9091/annotation-demo.html');
        await page1.waitForLoadState('networkidle');
        await page1.click('#connect-btn');
        await page1.waitForSelector('.status-connected', { timeout: 10000 });

        // Page 2: Navigate and connect (different user)
        await page2.goto('https://localhost:9091/annotation-demo.html');
        await page2.waitForLoadState('networkidle');
        await page2.fill('#user-id', 'demo-user-2'); // Different user ID
        await page2.click('#connect-btn');
        await page2.waitForSelector('.status-connected', { timeout: 10000 });

        // Page 1: Activate laser pointer
        await page1.click('button[data-tool="laser"]');
        await page1.waitForTimeout(500);

        // Page 1: Move mouse over View 1
        const view1Container = page1.locator('#view-1-container');
        const box = await view1Container.boundingBox();

        if (box) {
            // Move to center of View 1
            await page1.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page1.waitForTimeout(1000);

            // Page 2: Verify laser pointer appears in View 2
            const laserPointer2 = page2.locator('#laser-pointer-2');
            await expect(laserPointer2).toBeVisible({ timeout: 5000 });

            // Page 2: Verify event log shows laser movement
            const eventLog2 = page2.locator('#event-log');
            await expect(eventLog2).toContainText('Laser pointer moved to', { timeout: 3000 });
        }

        await page2.close();
    });

    test('should hide laser pointer when mouse leaves View 1', async ({ page, context }) => {
        // Create two pages
        const page1 = page;
        const page2 = await context.newPage();

        // Page 1: Navigate and connect
        await page1.goto('https://localhost:9091/annotation-demo.html');
        await page1.waitForLoadState('networkidle');
        await page1.click('#connect-btn');
        await page1.waitForSelector('.status-connected', { timeout: 10000 });

        // Page 2: Navigate and connect
        await page2.goto('https://localhost:9091/annotation-demo.html');
        await page2.waitForLoadState('networkidle');
        await page2.fill('#user-id', 'demo-user-2');
        await page2.click('#connect-btn');
        await page2.waitForSelector('.status-connected', { timeout: 10000 });

        // Page 1: Activate laser pointer and move mouse
        await page1.click('button[data-tool="laser"]');
        const view1Container = page1.locator('#view-1-container');
        const box = await view1Container.boundingBox();

        if (box) {
            // Move to center
            await page1.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page1.waitForTimeout(1000);

            // Verify laser appears on page 2
            const laserPointer2 = page2.locator('#laser-pointer-2');
            await expect(laserPointer2).toBeVisible({ timeout: 5000 });

            // Move mouse outside View 1
            await page1.mouse.move(box.x - 50, box.y - 50);
            await page1.waitForTimeout(1000);

            // Verify laser hidden on page 2
            const display = await laserPointer2.evaluate(el => window.getComputedStyle(el).display);
            expect(display).toBe('none');

            // Verify event log shows hide
            const eventLog2 = page2.locator('#event-log');
            await expect(eventLog2).toContainText('Laser pointer hidden', { timeout: 3000 });
        }

        await page2.close();
    });

    test('should handle console trace logs correctly', async ({ page }) => {
        const consoleLogs: string[] = [];

        page.on('console', msg => {
            if (msg.text().includes('[TRACE-ANNOTATION:')) {
                consoleLogs.push(msg.text());
            }
        });

        // Navigate and connect
        await page.goto('https://localhost:9091/annotation-demo.html');
        await page.waitForLoadState('networkidle');
        await page.click('#connect-btn');
        await page.waitForSelector('.status-connected', { timeout: 10000 });

        // Activate laser and move
        await page.click('button[data-tool="laser"]');
        const view1Container = page.locator('#view-1-container');
        const box = await view1Container.boundingBox();

        if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(2000);
        }

        // Verify trace logs captured
        expect(consoleLogs.length).toBeGreaterThan(0);
        expect(consoleLogs.some(log => log.includes('[TRACE-ANNOTATION:connect]'))).toBeTruthy();
        expect(consoleLogs.some(log => log.includes('[TRACE-ANNOTATION:laser-'))).toBeTruthy();
    });
});
