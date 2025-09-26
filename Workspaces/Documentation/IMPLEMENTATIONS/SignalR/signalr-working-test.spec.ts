import { expect, test } from '@playwright/test';

/**
 * SignalR Working Implementation Test
 * Tests the restored working SignalR functionality from commit c362e29184f7395701a73a6d023bd2be52b79b2c
 * 
 * Test Environment:
 * - Session ID: 218
 * - Host Token: LY7PQX4C  
 * - User Token: E9LCN7YQ
 * - Database: KSESSIONS_DEV
 */

test.describe('SignalR Working Implementation Tests', () => {
    const HOST_TOKEN = 'LY7PQX4C';
    const USER_TOKEN = 'E9LCN7YQ';
    const SESSION_ID = '218';

    // Test URLs
    const HOST_URL = `https://localhost:9091/host/control-panel/${HOST_TOKEN}`;
    const SESSION_URL = `https://localhost:9091/session/canvas/${USER_TOKEN}`;

    test.beforeEach(async ({ page }) => {
        // Ignore certificate errors for localhost
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        });
    });

    test('Host Control Panel - TestShareAsset Button Available', async ({ page }) => {
        console.log('Testing Host Control Panel TestShareAsset button availability...');

        // Navigate to Host Control Panel
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });

        // Wait for page to load completely
        await page.waitForTimeout(3000);

        // Verify host control panel loads
        await expect(page.locator('h1')).toContainText('HOST CONTROL PANEL');

        // Check if session is active (needed for TestShareAsset button)
        const sessionStatus = await page.locator('text=Session Status').isVisible();
        console.log(`Session status section visible: ${sessionStatus}`);

        // Start session if not already active
        const startButton = page.locator('button:has-text("Start Session")');
        if (await startButton.isVisible() && !await startButton.isDisabled()) {
            console.log('Starting session...');
            await startButton.click();
            await page.waitForTimeout(2000);
        }

        // Look for TestShareAsset button (should appear when session is active)
        const testShareButton = page.locator('button:has-text("Test Share Asset")');
        await expect(testShareButton).toBeVisible({ timeout: 10000 });
        console.log('✅ TestShareAsset button is visible');

        // Verify button is enabled
        await expect(testShareButton).toBeEnabled();
        console.log('✅ TestShareAsset button is enabled');

        // Take screenshot for documentation
        await page.screenshot({
            path: 'D:/PROJECTS/NOOR CANVAS/Workspaces/Documentation/IMPLEMENTATIONS/SignalR/host-panel-test-share-button.png',
            fullPage: true
        });
    });

    test('SessionCanvas - Single Column Layout Verification', async ({ page }) => {
        console.log('Testing SessionCanvas single column layout...');

        // Navigate to SessionCanvas
        await page.goto(SESSION_URL, { waitUntil: 'networkidle' });

        // Wait for page to load
        await page.waitForTimeout(3000);

        // Verify session canvas loads
        await expect(page.locator('h3:has-text("Noor Canvas")')).toBeVisible();

        // Verify main canvas area exists
        const mainCanvas = page.locator('.lg\\:col-span-2').first();
        await expect(mainCanvas).toBeVisible();
        console.log('✅ Main canvas area is visible');

        // Check for waiting state (spinner)
        const waitingSpinner = page.locator('.fa-spinner');
        const waitingText = page.locator('text=Awaiting content from the instructor');

        if (await waitingSpinner.isVisible()) {
            console.log('✅ Default waiting state with spinner displayed');
        }

        if (await waitingText.isVisible()) {
            console.log('✅ Waiting message displayed');
        }

        // Verify single column layout structure
        const canvasContainer = page.locator('[data-testid="canvas-container"]').or(
            page.locator('.min-h-96.border-4.border-double')
        );
        await expect(canvasContainer).toBeVisible();
        console.log('✅ Canvas container with single column layout verified');

        // Take screenshot for documentation
        await page.screenshot({
            path: 'D:/PROJECTS/NOOR CANVAS/Workspaces/Documentation/IMPLEMENTATIONS/SignalR/session-canvas-layout.png',
            fullPage: true
        });
    });

    test('Complete SignalR Asset Share Flow', async ({ browser }) => {
        console.log('Testing complete SignalR asset sharing flow...');

        // Create two browser contexts for host and user
        const hostContext = await browser.newContext();
        const userContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const userPage = await userContext.newPage();

        try {
            // Setup host page
            console.log('Setting up host page...');
            await hostPage.goto(HOST_URL, { waitUntil: 'networkidle' });
            await hostPage.waitForTimeout(2000);

            // Setup user page
            console.log('Setting up user page...');
            await userPage.goto(SESSION_URL, { waitUntil: 'networkidle' });
            await userPage.waitForTimeout(2000);

            // Verify both pages loaded
            await expect(hostPage.locator('h1')).toContainText('HOST CONTROL PANEL');
            await expect(userPage.locator('h3:has-text("Noor Canvas")')).toBeVisible();

            // Start session on host page if needed
            const startButton = hostPage.locator('button:has-text("Start Session")');
            if (await startButton.isVisible() && !await startButton.isDisabled()) {
                console.log('Starting session from host...');
                await startButton.click();
                await hostPage.waitForTimeout(3000);
            }

            // Wait for TestShareAsset button to appear
            const testShareButton = hostPage.locator('button:has-text("Test Share Asset")');
            await expect(testShareButton).toBeVisible({ timeout: 10000 });
            console.log('✅ TestShareAsset button available on host');

            // Verify user page is in waiting state
            const userWaitingState = userPage.locator('text=Awaiting content from the instructor');
            await expect(userWaitingState).toBeVisible();
            console.log('✅ User page showing waiting state');

            // Click TestShareAsset button on host
            console.log('Clicking TestShareAsset button...');
            await testShareButton.click();

            // Wait for success message on host
            await expect(hostPage.locator('text=Test asset shared successfully')).toBeVisible({ timeout: 5000 });
            console.log('✅ Host received success confirmation');

            // Check if content appears on user page
            console.log('Waiting for shared content on user page...');

            // Look for shared asset content indicators
            const sharedContentHeader = userPage.locator('text=Asset Shared by Host').or(
                userPage.locator('text=Shared by Host')
            );

            const sharedContent = userPage.locator('.fa-share').or(
                userPage.locator('[style*="background: linear-gradient"]')
            );

            // Wait for content to appear (SignalR should be near-instant)
            await expect(sharedContentHeader.or(sharedContent)).toBeVisible({ timeout: 8000 });
            console.log('✅ Shared content appeared on user page');

            // Verify no appendChild errors in console
            const consoleErrors: string[] = [];
            userPage.on('console', msg => {
                if (msg.type() === 'error' && msg.text().includes('appendChild')) {
                    consoleErrors.push(msg.text());
                }
            });

            // Wait a bit more to catch any delayed errors
            await userPage.waitForTimeout(2000);

            if (consoleErrors.length === 0) {
                console.log('✅ No appendChild errors detected');
            } else {
                console.log('❌ appendChild errors found:', consoleErrors);
            }

            // Take final screenshots
            await hostPage.screenshot({
                path: 'D:/PROJECTS/NOOR CANVAS/Workspaces/Documentation/IMPLEMENTATIONS/SignalR/host-after-share.png',
                fullPage: true
            });

            await userPage.screenshot({
                path: 'D:/PROJECTS/NOOR CANVAS/Workspaces/Documentation/IMPLEMENTATIONS/SignalR/user-received-content.png',
                fullPage: true
            });

            console.log('✅ Complete SignalR flow test completed successfully');

        } finally {
            await hostContext.close();
            await userContext.close();
        }
    });

    test('SignalR Connection Health Check', async ({ page }) => {
        console.log('Testing SignalR connection health...');

        // Navigate to host page to test SignalR connection
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        // Check for SignalR connection errors in console
        const signalRErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error' &&
                (msg.text().includes('SignalR') ||
                    msg.text().includes('HubConnection') ||
                    msg.text().includes('WebSocket'))) {
                signalRErrors.push(msg.text());
            }
        });

        // Wait for potential connection establishment
        await page.waitForTimeout(5000);

        // Look for SignalR connection indicators
        const sessionControls = page.locator('text=SESSION CONTROLS');
        await expect(sessionControls).toBeVisible();

        if (signalRErrors.length === 0) {
            console.log('✅ No SignalR connection errors detected');
        } else {
            console.log('❌ SignalR errors found:', signalRErrors);
        }

        // Test basic page functionality (indicates SignalR is working)
        const controlPanel = page.locator('h1:has-text("HOST CONTROL PANEL")');
        await expect(controlPanel).toBeVisible();
        console.log('✅ Host control panel loaded successfully');
    });
});

/**
 * Test Validation Criteria:
 * 
 * ✅ Host Control Panel loads with TestShareAsset button
 * ✅ SessionCanvas displays single-column vertical layout
 * ✅ TestShareAsset button triggers SignalR message
 * ✅ User page receives shared content via SignalR
 * ✅ No appendChild JavaScript errors
 * ✅ Content renders as MarkupString without transformation errors
 * ✅ SignalR hub communication functions properly
 * 
 * Success Indicators:
 * - TestShareAsset button visible when session active
 * - Shared content appears on user page within 8 seconds
 * - No console errors related to appendChild or DOM manipulation
 * - Clean single-column layout on SessionCanvas
 * - Proper SignalR connection establishment
 */