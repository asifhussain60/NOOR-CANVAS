/**
 * Playwright E2E Visual Regression Test: Clickable Question Broadcasting
 * 
 * Test Scenario: Host clicks a question in HostControlPanel Q&A panel,
 * and it appears as a formatted asset in participant SessionCanvas views
 * 
 * Coverage:
 * - Question card hover animation
 * - Click interaction
 * - SignalR broadcast/reception
 * - Visual formatting (green theme, no buttons)
 * - Multi-browser synchronization
 * 
 * Session Data: Session 212 (canonical test session)
 */

import { test, expect } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'https://localhost:9091',
    session212: {
        hostToken: 'bpXpgGbc',
        userToken: 'S212U001', // Participant 1
        sessionId: 212
    },
    timeouts: {
        signalr: 10000, // 10s for SignalR connection
        broadcast: 5000, // 5s for asset broadcast
        render: 3000 // 3s for DOM rendering
    }
};

test.describe('HCP Questions: Clickable Question Broadcasting', () => {
    
    test.beforeAll(async () => {
        console.log('[TEST-SETUP] Ensure NoorCanvas app is running at', TEST_CONFIG.baseUrl);
        console.log('[TEST-SETUP] Using Session 212 with host token:', TEST_CONFIG.session212.hostToken);
    });

    test('should broadcast clicked question from host to participant with proper formatting', async ({ browser }) => {
        // Step 1: Create two browser contexts (Host and Participant)
        console.log('[TEST] Step 1: Creating host and participant contexts...');
        
        const hostContext = await browser.newContext({
            ignoreHTTPSErrors: true
        });
        const participantContext = await browser.newContext({
            ignoreHTTPSErrors: true
        });

        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();

        try {
            // Step 2: Navigate to HostControlPanel
            console.log('[TEST] Step 2: Navigating host to control panel...');
            await hostPage.goto(`${TEST_CONFIG.baseUrl}/host/control-panel/${TEST_CONFIG.session212.hostToken}`);
            await hostPage.waitForLoadState('networkidle');
            
            // Wait for SignalR connection
            await hostPage.waitForTimeout(TEST_CONFIG.timeouts.signalr);

            // Step 3: Navigate participant to SessionCanvas
            console.log('[TEST] Step 3: Navigating participant to session canvas...');
            await participantPage.goto(`${TEST_CONFIG.baseUrl}/session/canvas/${TEST_CONFIG.session212.userToken}`);
            await participantPage.waitForLoadState('networkidle');
            
            // Wait for SignalR connection
            await participantPage.waitForTimeout(TEST_CONFIG.timeouts.signalr);

            // Step 4: Verify Q&A panel exists and has questions
            console.log('[TEST] Step 4: Verifying Q&A panel and questions...');
            
            const qaPanel = hostPage.locator('.host-qa-panel');
            await expect(qaPanel).toBeVisible({ timeout: 5000 });
            
            // Find first question card
            const questionCard = hostPage.locator('div[style*="border-right:6px solid #006400"]').first();
            await expect(questionCard).toBeVisible({ timeout: 5000 });

            // Step 5: Verify hover animation
            console.log('[TEST] Step 5: Testing hover animation...');
            
            // Hover over question card
            await questionCard.hover();
            await hostPage.waitForTimeout(500); // Allow animation to complete
            
            // Check for hover class (added by @onmouseover)
            const hasHoverClass = await questionCard.evaluate((el) => {
                return el.classList.contains('question-card-hover');
            });
            expect(hasHoverClass).toBe(true);
            
            console.log('[TEST] ✅ Hover animation applied correctly');

            // Step 6: Extract question text before clicking
            const questionTextElement = questionCard.locator('p[style*="color:#006400"]').first();
            const originalQuestionText = await questionTextElement.textContent();
            console.log('[TEST] Question text:', originalQuestionText?.substring(0, 50) + '...');

            // Step 7: Click the question card
            console.log('[TEST] Step 7: Clicking question card to broadcast...');
            
            await questionCard.click();
            await hostPage.waitForTimeout(TEST_CONFIG.timeouts.broadcast);

            // Step 8: Verify asset appears in participant canvas
            console.log('[TEST] Step 8: Verifying asset reception in participant canvas...');
            
            // Look for the shared question asset in canvas
            const sharedAsset = participantPage.locator('div[style*="background-color:#F0FDF4"]');
            await expect(sharedAsset).toBeVisible({ timeout: TEST_CONFIG.timeouts.render });
            
            console.log('[TEST] ✅ Question asset received in participant canvas');

            // Step 9: Verify asset formatting
            console.log('[TEST] Step 9: Verifying asset visual formatting...');
            
            // Check for green theme background
            const backgroundStyle = await sharedAsset.getAttribute('style');
            expect(backgroundStyle).toContain('background-color:#F0FDF4');
            expect(backgroundStyle).toContain('border-left:6px solid #006400');
            
            // Check for header icon
            const headerIcon = sharedAsset.locator('i.fa-clipboard-question');
            await expect(headerIcon).toBeVisible();
            
            // Check for "Participant Question" title
            const titleElement = sharedAsset.locator('h3').first();
            const titleText = await titleElement.textContent();
            expect(titleText).toContain('Participant Question');
            
            // Check for question content
            const contentDiv = sharedAsset.locator('div[style*="background-color:white"]').first();
            await expect(contentDiv).toBeVisible();
            
            // Verify question text matches original
            const displayedQuestionText = await contentDiv.textContent();
            expect(displayedQuestionText).toBe(originalQuestionText);
            
            console.log('[TEST] ✅ Asset formatting verified (green theme, icon, content)');

            // Step 10: Verify NO action buttons in broadcasted asset
            console.log('[TEST] Step 10: Verifying action buttons removed...');
            
            // Check that approve button does NOT exist in asset
            const approveButton = sharedAsset.locator('button[title="Approve Question"]');
            await expect(approveButton).toHaveCount(0);
            
            // Check that delete button does NOT exist in asset
            const deleteButton = sharedAsset.locator('button[title="Delete Question"]');
            await expect(deleteButton).toHaveCount(0);
            
            console.log('[TEST] ✅ Action buttons correctly removed from broadcasted asset');

            // Step 11: Verify metadata footer
            console.log('[TEST] Step 11: Verifying metadata footer...');
            
            // Check for author information
            const authorSpan = sharedAsset.locator('span:has-text("Asked by:")');
            await expect(authorSpan).toBeVisible();
            
            // Check for user icon
            const userIcon = sharedAsset.locator('i.fa-user');
            await expect(userIcon).toBeVisible();
            
            console.log('[TEST] ✅ Metadata footer verified');

            // Step 12: Visual regression with Percy (if available)
            console.log('[TEST] Step 12: Capturing Percy snapshot...');
            
            // @ts-ignore - Percy may not be available in all environments
            if (typeof percySnapshot !== 'undefined') {
                // @ts-ignore
                await percySnapshot(participantPage, 'Question Asset - Green Theme Formatting');
                console.log('[TEST] ✅ Percy snapshot captured');
            } else {
                console.log('[TEST] ⚠️ Percy not available, skipping visual snapshot');
            }

            console.log('[TEST] ✅ All assertions passed - Question broadcasting successful!');

        } finally {
            // Cleanup
            console.log('[TEST] Cleanup: Closing browser contexts...');
            await hostContext.close();
            await participantContext.close();
        }
    });

    test('should show hover animation on question cards', async ({ page }) => {
        console.log('[TEST] Testing isolated hover animation...');
        
        await page.goto(`${TEST_CONFIG.baseUrl}/host/control-panel/${TEST_CONFIG.session212.hostToken}`, {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(TEST_CONFIG.timeouts.signalr);
        
        const questionCard = page.locator('div[style*="border-right:6px solid #006400"]').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        
        // Get initial box shadow
        const initialStyle = await questionCard.evaluate((el) => {
            return window.getComputedStyle(el).boxShadow;
        });
        
        // Hover
        await questionCard.hover();
        await page.waitForTimeout(500);
        
        // Get hover box shadow
        const hoverStyle = await questionCard.evaluate((el) => {
            return window.getComputedStyle(el).boxShadow;
        });
        
        // Box shadow should change on hover
        expect(hoverStyle).not.toBe(initialStyle);
        
        console.log('[TEST] ✅ Hover animation CSS verified');
    });

    test('should prevent button clicks from triggering card click', async ({ page }) => {
        console.log('[TEST] Testing event propagation stop on buttons...');
        
        await page.goto(`${TEST_CONFIG.baseUrl}/host/control-panel/${TEST_CONFIG.session212.hostToken}`, {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(TEST_CONFIG.timeouts.signalr);
        
        const questionCard = page.locator('div[style*="border-right:6px solid #006400"]').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        
        // Find approve button (if exists)
        const approveButton = questionCard.locator('button[title="Approve Question"]');
        
        if (await approveButton.count() > 0) {
            // Set up a listener to detect if card click fires
            let cardClicked = false;
            await page.evaluate(() => {
                // @ts-ignore
                window.cardClickFired = false;
            });
            
            await questionCard.evaluate((el) => {
                el.addEventListener('click', () => {
                    // @ts-ignore
                    window.cardClickFired = true;
                });
            });
            
            // Click the approve button
            await approveButton.click();
            await page.waitForTimeout(500);
            
            // Check if card click was triggered
            const wasTriggered = await page.evaluate(() => {
                // @ts-ignore
                return window.cardClickFired;
            });
            
            // Card click should NOT fire when button clicked (event.stopPropagation)
            expect(wasTriggered).toBe(false);
            
            console.log('[TEST] ✅ Event propagation correctly stopped on button click');
        } else {
            console.log('[TEST] ⚠️ No approve button found (question may be answered)');
        }
    });
});

test.describe('SignalR Trace Logging Verification', () => {
    
    test('should log broadcast and reception with trace level', async ({ browser }) => {
        console.log('[TEST] Verifying SignalR trace logging...');
        
        const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const participantContext = await browser.newContext({ ignoreHTTPSErrors: true });
        
        const hostPage = await hostContext.newPage();
        const participantPage = await participantContext.newPage();
        
        // Capture console logs
        const hostLogs: string[] = [];
        const participantLogs: string[] = [];
        
        hostPage.on('console', (msg) => {
            if (msg.text().includes('[DEBUG-WORKITEM:hcp-questions:broadcast:TRACE]')) {
                hostLogs.push(msg.text());
            }
        });
        
        participantPage.on('console', (msg) => {
            if (msg.text().includes('[DEBUG-WORKITEM:hcp-questions:reception:TRACE]')) {
                participantLogs.push(msg.text());
            }
        });
        
        try {
            await hostPage.goto(`${TEST_CONFIG.baseUrl}/host/control-panel/${TEST_CONFIG.session212.hostToken}`);
            await participantPage.goto(`${TEST_CONFIG.baseUrl}/session/canvas/${TEST_CONFIG.session212.userToken}`);
            
            await hostPage.waitForTimeout(TEST_CONFIG.timeouts.signalr);
            await participantPage.waitForTimeout(TEST_CONFIG.timeouts.signalr);
            
            // Click question to trigger broadcast
            const questionCard = hostPage.locator('div[style*="border-right:6px solid #006400"]').first();
            await questionCard.click();
            
            await hostPage.waitForTimeout(TEST_CONFIG.timeouts.broadcast);
            
            // Verify logs captured
            console.log('[TEST] Host broadcast logs:', hostLogs.length);
            console.log('[TEST] Participant reception logs:', participantLogs.length);
            
            // Should have broadcast logs from host
            expect(hostLogs.length).toBeGreaterThan(0);
            
            // Should have reception logs from participant
            expect(participantLogs.length).toBeGreaterThan(0);
            
            console.log('[TEST] ✅ Trace logging verified');
            
        } finally {
            await hostContext.close();
            await participantContext.close();
        }
    });
});
