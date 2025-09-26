import { expect, Page, test } from '@playwright/test';

/**
 * Asset Sharing Test for NoorCanvas
 * 
 * This test validates the TestShareAsset functionality that was recently fixed:
 * - TestShareAsset button in HostControlPanel
 * - SignalR transmission from host to participants
 * - Complex HTML content display in SessionCanvas
 * - AssetShared event handler functionality
 */

test.describe('NoorCanvas Asset Sharing', () => {
    let hostPage: Page;
    let participantPage: Page;

    const APP_BASE_URL = 'https://localhost:9091';
    const HOST_SESSION_ID = '215'; // Using session 215 from task configuration
    const PARTICIPANT_TOKEN = 'TEST_P1'; // Test participant token

    test.beforeAll(async ({ browser }) => {
        // Create separate contexts for host and participant
        const hostContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1400, height: 900 }
        });
        const participantContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1200, height: 800 }
        });

        hostPage = await hostContext.newPage();
        participantPage = await participantContext.newPage();

        // Enable console logging for debugging
        hostPage.on('console', msg => {
            if (msg.text().includes('NOOR-TEST') || msg.text().includes('NOOR-HUB-SHARE')) {
                console.log(`[HOST] ${msg.text()}`);
            }
        });

        participantPage.on('console', msg => {
            if (msg.text().includes('NOOR-CANVAS-SHARE')) {
                console.log(`[PARTICIPANT] ${msg.text()}`);
            }
        });
    });

    test.afterAll(async () => {
        await hostPage.close();
        await participantPage.close();
    });

    test('should successfully share complex HTML assets from host to participant', async () => {
        // Step 1: Load Host Control Panel
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${HOST_SESSION_ID}`);
        await hostPage.waitForLoadState('networkidle');

        // Verify Host Control Panel loaded
        const hostTitle = await hostPage.locator('h1, h2').first();
        await expect(hostTitle).toBeVisible({ timeout: 10000 });

        // Step 2: Load Participant Session Canvas  
        await participantPage.goto(`${APP_BASE_URL}/session/canvas/${PARTICIPANT_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');

        // Verify Session Canvas loaded
        const canvasTitle = await participantPage.locator('h1, h2').first();
        await expect(canvasTitle).toBeVisible({ timeout: 10000 });

        // Step 3: Look for TestShareAsset button in Host Control Panel
        const testShareButton = hostPage.locator('button:has-text("Test Share Asset")');
        await expect(testShareButton).toBeVisible({ timeout: 5000 });

        // Step 4: Click TestShareAsset button
        await testShareButton.click();

        // Wait for asset sharing to process
        await hostPage.waitForTimeout(2000);

        // Step 5: Verify complex HTML content appears in participant canvas
        const canvasContent = participantPage.locator('.canvas-content, #canvas-area, [class*="content"]');

        // Look for signs of the complex HTML content we expect:
        // - Gradient backgrounds
        // - Emojis 
        // - Test content
        const contentArea = participantPage.locator('text=Complex Asset Test');
        await expect(contentArea).toBeVisible({ timeout: 10000 });

        // Verify specific elements from our complex HTML
        const testFeatures = participantPage.locator('text=Test Features');
        await expect(testFeatures).toBeVisible({ timeout: 5000 });

        // Check for dynamic timestamp
        const timestampElement = participantPage.locator('text=Timestamp:');
        await expect(timestampElement).toBeVisible({ timeout: 5000 });

        console.log('✅ Asset sharing test completed successfully!');
    });

    test('should show proper SignalR logging during asset sharing', async () => {
        // Load both pages
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${HOST_SESSION_ID}`);
        await participantPage.goto(`${APP_BASE_URL}/session/canvas/${PARTICIPANT_TOKEN}`);

        await hostPage.waitForLoadState('networkidle');
        await participantPage.waitForLoadState('networkidle');

        // Set up console message capture
        const hostLogs: string[] = [];
        const participantLogs: string[] = [];

        hostPage.on('console', msg => {
            if (msg.text().includes('NOOR-TEST') || msg.text().includes('ShareAsset')) {
                hostLogs.push(msg.text());
            }
        });

        participantPage.on('console', msg => {
            if (msg.text().includes('NOOR-CANVAS-SHARE') || msg.text().includes('AssetShared')) {
                participantLogs.push(msg.text());
            }
        });

        // Click TestShareAsset button
        const testShareButton = hostPage.locator('button:has-text("Test Share Asset")');
        await testShareButton.click();

        // Wait for logging to occur
        await hostPage.waitForTimeout(3000);

        // Verify we got expected logging
        expect(hostLogs.length).toBeGreaterThan(0);
        console.log('Host logs captured:', hostLogs.length);
        console.log('Participant logs captured:', participantLogs.length);

        // Look for specific log patterns
        const hasTestLog = hostLogs.some(log => log.includes('Testing ShareAsset functionality'));
        const hasComplexHtmlLog = hostLogs.some(log => log.includes('complex HTML asset'));

        expect(hasTestLog || hasComplexHtmlLog).toBeTruthy();
    });

    test('should handle asset sharing when participant session is not active', async () => {
        // Load only host page (no participant)
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${HOST_SESSION_ID}`);
        await hostPage.waitForLoadState('networkidle');

        // Click TestShareAsset button
        const testShareButton = hostPage.locator('button:has-text("Test Share Asset")');
        await expect(testShareButton).toBeVisible();
        await testShareButton.click();

        // Should not cause errors even with no participants
        await hostPage.waitForTimeout(2000);

        // Verify success message appears
        const successMessage = hostPage.locator('text=successfully, text=shared');
        await expect(successMessage).toBeVisible({ timeout: 5000 });
    });
});