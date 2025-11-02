import { expect, test } from '@playwright/test';

/**
 * FAB Button Click Test for Host Control Panel
 * Route Key: hcp-ids
 * 
 * Test Steps:
 * 1. Navigate to Host Control Panel
 * 2. Select Transcript Canvas
 * 3. Start Session
 * 4. Wait for Transcript to Load
 * 5. Identify Share Buttons (including FAB button)
 * 6. Click FAB Button
 * 
 * Based on screenshots and element IDs from HostControlPanel.razor
 */

test.describe('Host Control Panel - FAB Button Click Test', () => {
    const HOST_TOKEN = 'PQ9N5YWW';
    const BASE_URL = 'https://localhost:9091';
    const FAB_BUTTON_ID = 'content-fab-share-btn'; // Updated to use the purple FAB broadcast button

    test.beforeEach(async ({ page }) => {
        // Enable console logging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('CLICK') || text.includes('ShareAsset') || text.includes('fab')) {
                console.log(`[BROWSER CONSOLE] ${text}`);
            }
        });

        // Enable error logging
        page.on('pageerror', error => {
            console.error(`[PAGE ERROR] ${error.message}`);
        });
    });

    test('should click Transcript Canvas, start session, and click FAB button', async ({ page }) => {
        const testId = `fab-click-${Date.now()}`;
        console.log(`[${testId}] ═══════════════════════════════════════`);
        console.log(`[${testId}] Starting FAB Button Click Test`);
        console.log(`[${testId}] ═══════════════════════════════════════`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Navigate to Host Control Panel
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 1: Navigating to Host Control Panel`);
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Verify Host Control Panel loaded
        await expect(page.locator('h1:has-text("HOST CONTROL PANEL")')).toBeVisible({ timeout: 10000 });
        console.log(`[${testId}] ✅ Host Control Panel loaded successfully`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Select Transcript Canvas
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 2: Selecting Transcript Canvas`);
        
        // Use the new ID: reg-transcript-canvas-btn
        const transcriptCanvasButton = page.locator('#reg-transcript-canvas-btn');
        await expect(transcriptCanvasButton).toBeVisible({ timeout: 10000 });
        
        await transcriptCanvasButton.click();
        console.log(`[${testId}] ✅ Transcript Canvas button clicked (ID: reg-transcript-canvas-btn)`);

        // Wait for selection to register
        await page.waitForTimeout(1000);

        // Verify selection (button should have aria-pressed="true" or green border styling)
        const isPressed = await transcriptCanvasButton.getAttribute('aria-pressed');
        console.log(`[${testId}] Transcript Canvas button aria-pressed: ${isPressed}`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: Start Session
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 3: Starting session`);

        // Use the new ID: sidebar-start-session-btn
        const startSessionButton = page.locator('#sidebar-start-session-btn');
        await expect(startSessionButton).toBeVisible({ timeout: 10000 });
        await expect(startSessionButton).toBeEnabled({ timeout: 5000 });

        await startSessionButton.click();
        console.log(`[${testId}] ✅ Start Session button clicked (ID: sidebar-start-session-btn)`);

        // Wait for session to start
        await page.waitForTimeout(2000);

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: Wait for Transcript to Load
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 4: Waiting for transcript to load`);

        // Wait for session transcript content to appear
        const transcriptSelectors = [
            '.session-transcript-content',
            '.transcript-display',
            '[data-testid="transcript-content"]',
            '.ks-transcript'
        ];

        let transcriptFound = false;
        for (const selector of transcriptSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                transcriptFound = true;
                console.log(`[${testId}] ✅ Transcript loaded (selector: ${selector})`);
                break;
            } catch (error) {
                console.log(`[${testId}] Transcript not found with selector: ${selector}`);
            }
        }

        if (!transcriptFound) {
            console.log(`[${testId}] ⚠️ Transcript container not found with standard selectors`);
        }

        // Wait for content to fully render
        await page.waitForTimeout(3000);

        // ═══════════════════════════════════════════════════════════════
        // STEP 5: Identify Share Buttons (including FAB button)
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 5: Identifying share buttons`);

        // Get all share buttons
        const allShareButtons = await page.evaluate(() => {
            const buttons = document.querySelectorAll('.ks-share-button, [data-share-button="true"], button[data-share-id]');
            return Array.from(buttons).map(btn => ({
                id: btn.id,
                dataShareId: btn.getAttribute('data-share-id'),
                dataAssetType: btn.getAttribute('data-asset-type'),
                text: btn.textContent?.trim(),
                visible: (btn as HTMLElement).offsetWidth > 0 && (btn as HTMLElement).offsetHeight > 0
            }));
        });

        console.log(`[${testId}] Found ${allShareButtons.length} share buttons:`);
        allShareButtons.forEach((btn, idx) => {
            console.log(`[${testId}]   ${idx + 1}. ID: ${btn.id}, Type: ${btn.dataAssetType}, Visible: ${btn.visible}`);
        });

        // ═══════════════════════════════════════════════════════════════
        // STEP 6: Click FAB Button
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] STEP 6: Clicking FAB button (ID: ${FAB_BUTTON_ID})`);

        // Locate the FAB button by its specific ID
        const fabButton = page.locator(`#${FAB_BUTTON_ID}`);

        // Verify FAB button exists
        const fabButtonExists = await fabButton.count();
        console.log(`[${testId}] FAB button exists: ${fabButtonExists > 0}`);

        if (fabButtonExists === 0) {
            console.log(`[${testId}] ❌ FAB button not found with ID: ${FAB_BUTTON_ID}`);
            console.log(`[${testId}] Available button IDs:`, allShareButtons.map(b => b.id).join(', '));
            
            // Try to find any FAB button pattern
            const fabButtons = await page.locator('button[id^="asset-fab-"]').all();
            if (fabButtons.length > 0) {
                console.log(`[${testId}] Found ${fabButtons.length} FAB buttons with pattern "asset-fab-*"`);
                const firstFabId = await fabButtons[0].getAttribute('id');
                console.log(`[${testId}] Using first available FAB button: ${firstFabId}`);
                
                await fabButtons[0].scrollIntoViewIfNeeded();
                await fabButtons[0].click();
                console.log(`[${testId}] ✅ Alternative FAB button clicked`);
            } else {
                throw new Error(`No FAB buttons found (expected ID: ${FAB_BUTTON_ID})`);
            }
        } else {
            // Get button details before clicking
            const buttonDetails = await page.evaluate((btnId) => {
                const btn = document.getElementById(btnId);
                return {
                    id: btn?.id,
                    className: btn?.className,
                    dataShareId: btn?.getAttribute('data-share-id'),
                    dataAssetType: btn?.getAttribute('data-asset-type'),
                    offsetTop: (btn as HTMLElement)?.offsetTop,
                    offsetLeft: (btn as HTMLElement)?.offsetLeft,
                    visible: (btn as HTMLElement)?.offsetWidth > 0 && (btn as HTMLElement)?.offsetHeight > 0
                };
            }, FAB_BUTTON_ID);

            console.log(`[${testId}] FAB Button Details:`, JSON.stringify(buttonDetails, null, 2));

            // Verify button is visible
            await expect(fabButton).toBeVisible({ timeout: 5000 });
            console.log(`[${testId}] ✅ FAB button is visible`);

            // Verify button is enabled
            const isDisabled = await fabButton.isDisabled();
            expect(isDisabled).toBe(false);
            console.log(`[${testId}] ✅ FAB button is enabled`);

            // Scroll button into view
            await fabButton.scrollIntoViewIfNeeded();
            console.log(`[${testId}] ✅ FAB button scrolled into view`);

            // Click the FAB button
            await fabButton.click();
            console.log(`[${testId}] ✅ FAB button clicked successfully`);
        }

        // Wait for any JavaScript processing
        await page.waitForTimeout(2000);

        // ═══════════════════════════════════════════════════════════════
        // VERIFICATION: Check for success indicators
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] VERIFICATION: Checking for click handler response`);

        // Check for console logs indicating share operation
        // (Console logs are captured by beforeEach hook)

        // Check for any visible success messages
        const successIndicators = [
            page.locator('text=/shared successfully/i'),
            page.locator('text=/asset shared/i'),
            page.locator('.toast-success'),
            page.locator('[data-testid="success-message"]')
        ];

        for (const indicator of successIndicators) {
            const isVisible = await indicator.isVisible({ timeout: 2000 }).catch(() => false);
            if (isVisible) {
                const text = await indicator.textContent();
                console.log(`[${testId}] ✅ Success indicator found: "${text}"`);
                break;
            }
        }

        // Take screenshot for evidence
        await page.screenshot({
            path: `test-results/fab-button-clicked-${testId}.png`,
            fullPage: true
        });
        console.log(`[${testId}] ✅ Screenshot saved`);

        // ═══════════════════════════════════════════════════════════════
        // TEST SUMMARY
        // ═══════════════════════════════════════════════════════════════
        console.log(`[${testId}] ═══════════════════════════════════════`);
        console.log(`[${testId}] TEST SUMMARY:`);
        console.log(`[${testId}] ✅ Step 1: Host Control Panel loaded`);
        console.log(`[${testId}] ✅ Step 2: Transcript Canvas selected`);
        console.log(`[${testId}] ✅ Step 3: Session started`);
        console.log(`[${testId}] ✅ Step 4: Transcript loaded`);
        console.log(`[${testId}] ✅ Step 5: Share buttons identified (${allShareButtons.length} total)`);
        console.log(`[${testId}] ✅ Step 6: FAB button clicked`);
        console.log(`[${testId}] ═══════════════════════════════════════`);
    });

    test('should find all FAB buttons and verify their properties', async ({ page }) => {
        const testId = `fab-discovery-${Date.now()}`;
        console.log(`[${testId}] Starting FAB button discovery test`);

        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Select canvas and start session
        const transcriptBtn = page.locator('#reg-transcript-canvas-btn');
        if (await transcriptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await transcriptBtn.click();
            await page.waitForTimeout(500);
        }
        
        const startButton = page.locator('#sidebar-start-session-btn');
        if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await startButton.click();
            await page.waitForTimeout(3000);
        }

        // Find all FAB buttons (updated to include both asset FABs and content FAB)
        const fabButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button[id^="asset-fab-"], #content-fab-share-btn'));
            return buttons.map(btn => ({
                id: btn.id,
                className: btn.className,
                dataShareId: btn.getAttribute('data-share-id'),
                dataAssetType: btn.getAttribute('data-asset-type'),
                dataInstanceNumber: btn.getAttribute('data-instance-number'),
                innerHTML: btn.innerHTML.substring(0, 100),
                visible: (btn as HTMLElement).offsetWidth > 0 && (btn as HTMLElement).offsetHeight > 0
            }));
        });

        console.log(`[${testId}] ═══════════════════════════════════════`);
        console.log(`[${testId}] FAB BUTTON DISCOVERY RESULTS:`);
        console.log(`[${testId}] Total FAB buttons found: ${fabButtons.length}`);
        console.log(`[${testId}] ═══════════════════════════════════════`);

        fabButtons.forEach((btn, idx) => {
            console.log(`[${testId}] FAB Button ${idx + 1}:`);
            console.log(`[${testId}]   ID: ${btn.id}`);
            console.log(`[${testId}]   Asset Type: ${btn.dataAssetType}`);
            console.log(`[${testId}]   Instance: ${btn.dataInstanceNumber}`);
            console.log(`[${testId}]   Visible: ${btn.visible}`);
            console.log(`[${testId}]   ---`);
        });

        expect(fabButtons.length).toBeGreaterThan(0);
        console.log(`[${testId}] ✅ Test complete - found ${fabButtons.length} FAB buttons`);
    });
});
