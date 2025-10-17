/**
 * End-to-End Test: HCP Annotation Canvas Overlay System
 * 
 * Tests the complete annotation flow using canvas overlay architecture:
 * 1. Host opens HCP → Sticky toolbar appears
 * 2. Host draws on canvas → Annotation broadcasts via SignalR
 * 3. Participant receives annotation → Renders on SessionCanvas
 * 4. Toolbar remains sticky during scroll
 * 
 * Session: 212 (Host: PQ9N5YWW, Participant: KJAHA99L)
 */

import { expect, Page, test } from '@playwright/test';

const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const SESSION_ID = '212';

test.describe('HCP Annotation Canvas Overlay E2E', () => {
    let hostPage: Page;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        // Create two browser contexts (host and participant)
        hostPage = await browser.newPage();
        participantPage = await browser.newPage();
    });

    test.afterAll(async () => {
        await hostPage.close();
        await participantPage.close();
    });

    test('Complete annotation flow: toolbar visibility, drawing, broadcast, sticky scroll', async () => {
        // Step 1: Host opens HCP
        await hostPage.goto(`http://localhost:5000/hcp/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Step 2: Verify sticky annotation toolbar appears
        const annotationToolbar = hostPage.locator('#annotation-toolbar');
        await expect(annotationToolbar).toBeVisible({ timeout: 10000 });

        // Verify toolbar has sticky positioning
        const toolbarStyles = await annotationToolbar.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
                position: styles.position,
                top: styles.top,
                zIndex: styles.zIndex
            };
        });
        expect(toolbarStyles.position).toBe('sticky');
        expect(toolbarStyles.top).toBe('0px');

        // Step 3: Verify canvas overlay exists
        const canvas = hostPage.locator('#hcp-annotation-canvas');
        await expect(canvas).toBeVisible();

        const canvasProps = await canvas.evaluate((el: HTMLCanvasElement) => ({
            width: el.width,
            height: el.height,
            zIndex: window.getComputedStyle(el).zIndex
        }));
        expect(canvasProps.zIndex).toBe('900');

        // Step 4: Participant opens SessionCanvas
        await participantPage.goto(`http://localhost:5000/session/${USER_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');

        const participantCanvas = participantPage.locator('#sessioncanvas-annotation-canvas');
        await expect(participantCanvas).toBeVisible({ timeout: 10000 });

        // Step 5: Host selects draw tool
        const drawButton = hostPage.locator('button[data-tool="draw"]');
        await drawButton.click();
        await hostPage.waitForTimeout(500); // Wait for tool activation

        // Step 6: Host draws a path on canvas
        const hostCanvasElement = await canvas.elementHandle();
        if (!hostCanvasElement) {
            throw new Error('Host canvas element not found');
        }

        const hostCanvasBox = await hostCanvasElement.boundingBox();
        if (!hostCanvasBox) {
            throw new Error('Host canvas bounding box not found');
        }

        // Draw a simple path (diagonal line)
        const startX = hostCanvasBox.x + 100;
        const startY = hostCanvasBox.y + 100;
        const endX = startX + 200;
        const endY = startY + 200;

        await hostPage.mouse.move(startX, startY);
        await hostPage.mouse.down();
        await hostPage.mouse.move(endX, endY, { steps: 10 });
        await hostPage.mouse.up();

        // Wait for broadcast
        await hostPage.waitForTimeout(1000);

        // Step 7: Verify annotation appears on participant canvas
        const participantCanvasObjects = await participantPage.evaluate(() => {
            const canvas = (window as any)['participantCanvas'];
            if (!canvas) return null;
            return canvas.getObjects().length;
        });

        expect(participantCanvasObjects).toBeGreaterThan(0);
        console.log(`✅ Participant received ${participantCanvasObjects} annotation objects`);

        // Step 8: Test sticky toolbar during scroll
        // Scroll host page down
        await hostPage.evaluate(() => window.scrollBy(0, 500));
        await hostPage.waitForTimeout(300);

        // Verify toolbar is still visible at top of viewport
        const toolbarAfterScroll = await annotationToolbar.boundingBox();
        expect(toolbarAfterScroll).not.toBeNull();
        expect(toolbarAfterScroll!.y).toBeLessThanOrEqual(10); // Should be at top

        console.log('✅ Sticky toolbar remains visible after scroll');

        // Step 9: Test laser pointer (transient annotation)
        const laserButton = hostPage.locator('button[data-tool="laser"]');
        await laserButton.click();
        await hostPage.waitForTimeout(500);

        // Move mouse to trigger laser pointer
        await hostPage.mouse.move(hostCanvasBox.x + 300, hostCanvasBox.y + 300);
        await hostPage.waitForTimeout(200);

        // Verify laser pointer appears on participant canvas
        const laserPointBefore = await participantPage.evaluate(() => {
            const canvas = (window as any)['participantCanvas'];
            if (!canvas) return 0;
            return canvas.getObjects().filter((obj: any) => obj.get('fill') === 'red' && obj.radius === 8).length;
        });

        // Wait for laser timeout (500ms)
        await participantPage.waitForTimeout(600);

        const laserPointAfter = await participantPage.evaluate(() => {
            const canvas = (window as any)['participantCanvas'];
            if (!canvas) return 0;
            return canvas.getObjects().filter((obj: any) => obj.get('fill') === 'red' && obj.radius === 8).length;
        });

        console.log(`✅ Laser pointer transient behavior: ${laserPointBefore} before timeout, ${laserPointAfter} after`);

        // Step 10: Test clear button
        const clearButton = hostPage.locator('button:has-text("Clear All")');
        await clearButton.click();
        await hostPage.waitForTimeout(500);

        const objectsAfterClear = await hostPage.evaluate(() => {
            const canvas = (window as any)['hcpAnnotationCanvas'];
            if (!canvas) return null;
            return canvas.getObjects().length;
        });

        expect(objectsAfterClear).toBe(0);
        console.log('✅ Clear button removed all annotations from host canvas');
    });

    test('Verify toolbar only appears when session is Active', async () => {
        await hostPage.goto(`http://localhost:5000/hcp/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Check session status
        const sessionStatus = await hostPage.evaluate(() => {
            const statusElement = document.querySelector('[data-session-status]');
            return statusElement?.getAttribute('data-session-status');
        });

        const toolbar = hostPage.locator('#annotation-toolbar');

        if (sessionStatus === 'Active') {
            await expect(toolbar).toBeVisible();
            console.log('✅ Toolbar visible when session Active');
        } else {
            await expect(toolbar).not.toBeVisible();
            console.log(`✅ Toolbar hidden when session status: ${sessionStatus}`);
        }
    });

    test('Verify color picker changes annotation color', async () => {
        await hostPage.goto(`http://localhost:5000/hcp/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Select draw tool
        const drawButton = hostPage.locator('button[data-tool="draw"]');
        await drawButton.click();

        // Change color to blue
        const colorPicker = hostPage.locator('#annotation-color-picker');
        await colorPicker.fill('#0000ff');
        await hostPage.waitForTimeout(300);

        // Draw path
        const canvas = hostPage.locator('#hcp-annotation-canvas');
        const canvasBox = await canvas.boundingBox();
        if (!canvasBox) throw new Error('Canvas not found');

        await hostPage.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
        await hostPage.mouse.down();
        await hostPage.mouse.move(canvasBox.x + 150, canvasBox.y + 150, { steps: 5 });
        await hostPage.mouse.up();

        await hostPage.waitForTimeout(500);

        // Verify path color
        const pathColor = await hostPage.evaluate(() => {
            const canvas = (window as any)['hcpAnnotationCanvas'];
            if (!canvas) return null;
            const objects = canvas.getObjects();
            if (objects.length === 0) return null;
            return objects[objects.length - 1].stroke;
        });

        expect(pathColor).toBe('#0000ff');
        console.log('✅ Color picker changed annotation color to blue');
    });

    test('Verify text annotation tool', async () => {
        await hostPage.goto(`http://localhost:5000/hcp/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Select text tool
        const textButton = hostPage.locator('button[data-tool="text"]');
        await textButton.click();
        await hostPage.waitForTimeout(300);

        // Mock prompt for text input
        await hostPage.evaluate(() => {
            window.prompt = () => 'Test Annotation';
        });

        // Click on canvas to add text
        const canvas = hostPage.locator('#hcp-annotation-canvas');
        const canvasBox = await canvas.boundingBox();
        if (!canvasBox) throw new Error('Canvas not found');

        await canvas.click({ position: { x: 100, y: 100 } });
        await hostPage.waitForTimeout(500);

        // Verify text object was created
        const textObject = await hostPage.evaluate(() => {
            const canvas = (window as any)['hcpAnnotationCanvas'];
            if (!canvas) return null;
            const objects = canvas.getObjects();
            const textObjs = objects.filter((obj: any) => obj.type === 'i-text' || obj.type === 'text');
            if (textObjs.length === 0) return null;
            return textObjs[textObjs.length - 1].text;
        });

        expect(textObject).toBe('Test Annotation');
        console.log('✅ Text annotation tool added text to canvas');
    });
});
