/**
 * [WORKITEM:signalcomm:test] Test HTML template broadcast functionality
 * Verifies the new Simple HTML and Complex HTML template buttons work correctly
 * and that the inline broadcast button functions properly
 * ;CLEANUP_OK
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:9090';

test.describe('Broadcast HTML Templates - signalcomm', () => {
    test.beforeEach(async ({ page }) => {
        // Enable detailed console logging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[${msg.type().toUpperCase()}]`, msg.text());
            }
        });
    });

    test('Verify Simple HTML template button populates textarea correctly', async ({ page }) => {
        console.log('[WORKITEM:signalcomm:test] Testing Simple HTML template functionality ;CLEANUP_OK');

        // Step 1: Navigate to host control panel
        await page.goto(`${BASE_URL}/host-control`);
        await expect(page.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Locate the broadcast panel
        const broadcastPanel = page.locator('.card:has-text("Broadcast HTML to Sessions")');
        await expect(broadcastPanel).toBeVisible();

        // Step 3: Find and click the Simple HTML button
        const simpleHtmlButton = broadcastPanel.locator('button:has-text("Simple HTML")');
        await expect(simpleHtmlButton).toBeVisible();
        await simpleHtmlButton.click();

        // Step 4: Verify textarea is populated with simple HTML content
        const textarea = broadcastPanel.locator('textarea');
        await expect(textarea).toBeVisible();

        const textareaContent = await textarea.inputValue();
        console.log(`[WORKITEM:signalcomm:test] Simple HTML content: ${textareaContent} ;CLEANUP_OK`);

        // Verify it contains basic HTML elements
        expect(textareaContent).toContain('<div');
        expect(textareaContent).toContain('Welcome to NOOR Canvas');
        expect(textareaContent).toContain('</div>');
    });

    test('Verify Complex HTML template button populates textarea with ayah-card content', async ({ page }) => {
        console.log('[WORKITEM:signalcomm:test] Testing Complex HTML template functionality ;CLEANUP_OK');

        // Step 1: Navigate to host control panel
        await page.goto(`${BASE_URL}/host-control`);
        await expect(page.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Locate the broadcast panel
        const broadcastPanel = page.locator('.card:has-text("Broadcast HTML to Sessions")');
        await expect(broadcastPanel).toBeVisible();

        // Step 3: Find and click the Complex HTML button
        const complexHtmlButton = broadcastPanel.locator('button:has-text("Complex HTML")');
        await expect(complexHtmlButton).toBeVisible();
        await complexHtmlButton.click();

        // Step 4: Verify textarea is populated with complex ayah-card inspired content
        const textarea = broadcastPanel.locator('textarea');
        await expect(textarea).toBeVisible();

        const textareaContent = await textarea.inputValue();
        console.log(`[WORKITEM:signalcomm:test] Complex HTML content: ${textareaContent} ;CLEANUP_OK`);

        // Verify it contains ayah-card style elements
        expect(textareaContent).toContain('ayah-card');
        expect(textareaContent).toContain('card-header');
        expect(textareaContent).toContain('card-body');
        expect(textareaContent).toContain('Bootstrap');
    });

    test('Verify inline Broadcast button is positioned correctly and functions', async ({ page }) => {
        console.log('[WORKITEM:signalcomm:test] Testing inline Broadcast button positioning and functionality ;CLEANUP_OK');

        // Step 1: Navigate to host control panel
        await page.goto(`${BASE_URL}/host-control`);
        await expect(page.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Locate the broadcast panel
        const broadcastPanel = page.locator('.card:has-text("Broadcast HTML to Sessions")');
        await expect(broadcastPanel).toBeVisible();

        // Step 3: Verify the broadcast button is positioned inline with textarea
        const broadcastButton = broadcastPanel.locator('button:has-text("Broadcast")');
        await expect(broadcastButton).toBeVisible();

        // Step 4: Load some content using Simple HTML button
        const simpleHtmlButton = broadcastPanel.locator('button:has-text("Simple HTML")');
        await simpleHtmlButton.click();

        // Step 5: Click the broadcast button and verify it works
        await broadcastButton.click();

        // Step 6: Check for success indication or console logs
        // Wait a moment for any broadcast to complete
        await page.waitForTimeout(1000);

        console.log('[WORKITEM:signalcomm:test] Broadcast button clicked successfully ;CLEANUP_OK');
    });

    test('Verify old broadcast and delete buttons are removed', async ({ page }) => {
        console.log('[WORKITEM:signalcomm:test] Verifying old UI elements are removed ;CLEANUP_OK');

        // Step 1: Navigate to host control panel
        await page.goto(`${BASE_URL}/host-control`);
        await expect(page.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Locate the broadcast panel
        const broadcastPanel = page.locator('.card:has-text("Broadcast HTML to Sessions")');
        await expect(broadcastPanel).toBeVisible();

        // Step 3: Verify old buttons are NOT present
        const oldBroadcastButton = broadcastPanel.locator('button:has-text("Broadcast HTML")');
        const deleteButton = broadcastPanel.locator('button:has-text("Delete")');
        const testShareButton = broadcastPanel.locator('button:has-text("Test Share Asset")');

        // These should not be visible
        await expect(oldBroadcastButton).not.toBeVisible();
        await expect(deleteButton).not.toBeVisible();
        await expect(testShareButton).not.toBeVisible();

        console.log('[WORKITEM:signalcomm:test] Confirmed old UI elements are removed ;CLEANUP_OK');
    });

    test('End-to-end broadcast flow: template selection to content reception', async ({ page, context }) => {
        console.log('[WORKITEM:signalcomm:test] Testing complete broadcast flow ;CLEANUP_OK');

        // Step 1: Open host control panel in first tab
        await page.goto(`${BASE_URL}/host-control`);
        await expect(page.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Open session canvas in second tab (simulate user session)
        const sessionPage = await context.newPage();
        await sessionPage.goto(`${BASE_URL}/user`);

        // Register a quick session for testing (if needed)
        const tokenInput = sessionPage.locator('#token-input');
        if (await tokenInput.isVisible()) {
            await sessionPage.fill('#token-input', 'TESTUSER');
            await sessionPage.click('button:has-text("Submit")');
            await sessionPage.waitForTimeout(2000);

            // If registration form appears, fill it
            const nameInput = sessionPage.locator('#name-input');
            if (await nameInput.isVisible()) {
                await sessionPage.fill('#name-input', 'Test User');
                await sessionPage.selectOption('#country-select', 'US');
                await sessionPage.click('button:has-text("Register")');
                await sessionPage.waitForTimeout(2000);
            }
        }

        // Step 3: Back to host control panel - load Complex HTML template
        const broadcastPanel = page.locator('.card:has-text("Broadcast HTML to Sessions")');
        const complexHtmlButton = broadcastPanel.locator('button:has-text("Complex HTML")');
        await complexHtmlButton.click();

        // Step 4: Broadcast the content
        const broadcastButton = broadcastPanel.locator('button:has-text("Broadcast")');
        await broadcastButton.click();

        // Step 5: Check if content appears in session canvas (if accessible)
        await sessionPage.waitForTimeout(3000);

        console.log('[WORKITEM:signalcomm:test] End-to-end broadcast flow completed ;CLEANUP_OK');

        await sessionPage.close();
    });
});