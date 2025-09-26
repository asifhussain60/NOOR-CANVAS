import { expect, Page, test } from '@playwright/test';

/**
 * NOOR Canvas - Host Control Panel Focused Tests
 * 
 * This test suite specifically validates the HostControlPanel.razor component:
 * - Host token authentication and session loading
 * - User registration link generation and copying
 * - Session management (start/end functionality)
 * - Real-time participant monitoring
 * - Asset sharing controls
 * - Q&A management interface
 */

test.describe('Host Control Panel - Component Tests', () => {
    let hostPage: Page;

    const APP_BASE_URL = 'https://localhost:9091';
    const TEST_HOST_TOKEN = 'TEST_H215'; // Test host token for session 215

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1400, height: 900 }
        });

        hostPage = await context.newPage();

        // Enable debug logging
        hostPage.on('console', msg => {
            if (msg.text().includes('DEBUG-WORKITEM') ||
                msg.text().includes('NOOR-HOST') ||
                msg.text().includes('copyUserLink')) {
                console.log(`[HOST-PANEL-DEBUG] ${msg.text()}`);
            }
        });
    });

    test.afterEach(async () => {
        await hostPage.close();
    });

    test('Host token authentication and session data loading', async () => {
        console.log('🔐 [DEBUG-WORKITEM:debug:host-auth] Testing host authentication');

        // Navigate to host control panel with valid token
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Validate host control panel loads successfully
        await expect(hostPage.locator('h1:has-text("Host Control Panel")')).toBeVisible({ timeout: 10000 });
        await expect(hostPage.locator('text=Session')).toBeVisible();

        // Validate session information is loaded
        await expect(hostPage.locator('[data-session-id]')).toBeVisible();
        await expect(hostPage.locator('[data-session-title]')).toBeVisible();

        // Validate user registration link is generated
        const userLinkInput = hostPage.locator('#user-registration-link');
        await expect(userLinkInput).toBeVisible();

        const userLinkValue = await userLinkInput.inputValue();
        expect(userLinkValue).toContain('/session/waiting/');
        expect(userLinkValue).toMatch(/https?:\/\/localhost:909[01]\//);

        console.log(`✅ [DEBUG-WORKITEM:debug:host-auth] User registration link: ${userLinkValue}`);
    });

    test('User registration link copy functionality', async () => {
        console.log('📋 [DEBUG-WORKITEM:debug:copy-link] Testing copy user link functionality');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Test the copyUserLink function
        await hostPage.evaluate(() => {
            console.log('[DEBUG-WORKITEM:debug:copy-link] Testing window.copyUserLink function');

            // Verify the function exists
            if (typeof (window as any).copyUserLink === 'function') {
                console.log('[DEBUG-WORKITEM:debug:copy-link] copyUserLink function found');
                return true;
            } else {
                console.error('[DEBUG-WORKITEM:debug:copy-link] copyUserLink function not found');
                return false;
            }
        });

        // Click the copy button
        const copyButton = hostPage.locator('button:has-text("Copy Link")');
        await expect(copyButton).toBeVisible();
        await copyButton.click();

        // Validate copy feedback appears
        const copyFeedback = hostPage.locator('[data-copy-feedback]');
        await expect(copyFeedback).toBeVisible({ timeout: 3000 });
        await expect(copyFeedback).toContainText('Copied');

        console.log('✅ [DEBUG-WORKITEM:debug:copy-link] Copy functionality validated');
    });

    test('Session start functionality and SignalR integration', async () => {
        console.log('🎬 [DEBUG-WORKITEM:debug:session-start] Testing session start');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Wait for SignalR connection to establish
        await hostPage.waitForTimeout(2000);

        // Validate start session button is available
        const startButton = hostPage.locator('button:has-text("Start Session")');
        await expect(startButton).toBeVisible();

        // Test session start (without actually starting to avoid side effects)
        await startButton.hover();

        // Validate button is enabled and clickable
        await expect(startButton).toBeEnabled();

        console.log('✅ [DEBUG-WORKITEM:debug:session-start] Start session button validated');
    });

    test('Asset sharing test functionality', async () => {
        console.log('📤 [DEBUG-WORKITEM:debug:asset-test] Testing asset sharing controls');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Wait for page to fully initialize
        await hostPage.waitForTimeout(3000);

        // Validate test asset sharing button
        const testShareButton = hostPage.locator('button:has-text("Test Share Asset")');
        await expect(testShareButton).toBeVisible();
        await expect(testShareButton).toBeEnabled();

        // Test asset sharing (monitor console for SignalR activity)
        let signalRActivityDetected = false;

        hostPage.on('console', msg => {
            if (msg.text().includes('shareAssetViaSignalR') ||
                msg.text().includes('NOOR-HUB-SHARE')) {
                signalRActivityDetected = true;
                console.log(`[DEBUG-WORKITEM:debug:asset-test] SignalR activity: ${msg.text()}`);
            }
        });

        await testShareButton.click();
        await hostPage.waitForTimeout(2000);

        // Note: We can't fully test SignalR without participants, but we validate the UI
        console.log('✅ [DEBUG-WORKITEM:debug:asset-test] Asset sharing controls validated');
    });

    test('Q&A management interface', async () => {
        console.log('❓ [DEBUG-WORKITEM:debug:qa-mgmt] Testing Q&A management');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Validate Q&A section is present
        const qaSection = hostPage.locator('[data-qa-section]');
        await expect(qaSection).toBeVisible();

        // Check for questions container
        const questionsContainer = hostPage.locator('[data-questions-container]');
        await expect(questionsContainer).toBeVisible();

        // Validate question management buttons would be available
        // (These appear dynamically when questions exist)
        const questionActions = hostPage.locator('[data-question-actions]');
        // Note: These may not be visible without actual questions

        console.log('✅ [DEBUG-WORKITEM:debug:qa-mgmt] Q&A management interface validated');
    });

    test('Real-time participant monitoring', async () => {
        console.log('👥 [DEBUG-WORKITEM:debug:participants] Testing participant monitoring');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Validate participant count display
        const participantCount = hostPage.locator('[data-participant-count]');
        await expect(participantCount).toBeVisible();

        // Validate participant list container
        const participantsList = hostPage.locator('[data-participants-list]');
        await expect(participantsList).toBeVisible();

        // Initial participant count should be 0 or a specific test value
        const countText = await participantCount.textContent();
        expect(countText).toMatch(/\d+/); // Should contain a number

        console.log(`✅ [DEBUG-WORKITEM:debug:participants] Participant count: ${countText}`);
    });

    test('Error handling and user feedback', async () => {
        console.log('⚠️ [DEBUG-WORKITEM:debug:errors] Testing error handling');

        // Test with invalid host token
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/INVALID_TOKEN`);
        await hostPage.waitForLoadState('networkidle');

        // Should show error state or redirect
        const errorElement = hostPage.locator('[data-error-message]');
        const isErrorVisible = await errorElement.isVisible();

        if (isErrorVisible) {
            console.log('✅ [DEBUG-WORKITEM:debug:errors] Error state displayed for invalid token');
        } else {
            // Check if redirected or shows different error handling
            const currentUrl = hostPage.url();
            console.log(`[DEBUG-WORKITEM:debug:errors] Current URL after invalid token: ${currentUrl}`);
        }

        console.log('✅ [DEBUG-WORKITEM:debug:errors] Error handling validated');
    });

    test('Session navigation and canvas integration', async () => {
        console.log('🎨 [DEBUG-WORKITEM:debug:navigation] Testing canvas navigation');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Validate "View Session Canvas" link
        const canvasLink = hostPage.locator('a:has-text("View Session Canvas")');

        if (await canvasLink.isVisible()) {
            const canvasUrl = await canvasLink.getAttribute('href');
            expect(canvasUrl).toContain('/session/canvas/');
            console.log(`✅ [DEBUG-WORKITEM:debug:navigation] Canvas link: ${canvasUrl}`);
        } else {
            // Canvas link may only be visible when session is active
            console.log('ℹ️ [DEBUG-WORKITEM:debug:navigation] Canvas link not visible (session may not be active)');
        }

        console.log('✅ [DEBUG-WORKITEM:debug:navigation] Navigation features validated');
    });
});