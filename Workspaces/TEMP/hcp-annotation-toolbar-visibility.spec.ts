/**
 * Test: HCP Annotation Toolbar Visibility
 * Purpose: Verify annotation toolbar only appears after transcript loaded and share buttons injected
 * Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const SESSION_ID = 212;

test.describe('HCP Annotation Toolbar Visibility', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Host Control Panel
        await page.goto(`http://localhost:5000/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
    });

    test('Annotation toolbar should NOT be visible before session starts', async ({ page }) => {
        console.log('[TEST] Verifying annotation toolbar hidden before session start');
        
        // Wait for page to load
        await page.waitForSelector('h1:has-text("Host Control Panel")', { timeout: 10000 });
        
        // Verify annotation toolbar is NOT present
        const annotationToolbar = page.locator('#annotation-controls');
        await expect(annotationToolbar).toHaveCount(0);
        
        console.log('[TEST] ✅ Annotation toolbar correctly hidden before session start');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Toolbar Hidden (Before Session Start)');
    });

    test('Annotation toolbar should appear after session starts and transcript loads', async ({ page }) => {
        console.log('[TEST] Starting session to trigger toolbar visibility');
        
        // Wait for Start Session button
        const startButton = page.locator('button:has-text("Start Session")');
        await expect(startButton).toBeVisible({ timeout: 10000 });
        
        // Click Start Session
        await startButton.click();
        console.log('[TEST] Start Session clicked');
        
        // Wait for session to start (status changes to Active)
        await page.waitForSelector('text=/Session Status.*Active/i', { timeout: 15000 });
        console.log('[TEST] Session status is Active');
        
        // Wait for transcript to load (session-transcript div appears)
        await page.waitForSelector('#session-transcript', { timeout: 10000 });
        console.log('[TEST] Session transcript loaded');
        
        // Wait for share buttons to be injected (data-asset-id attributes present)
        await page.waitForFunction(() => {
            const shareButtons = document.querySelectorAll('button[data-asset-id]');
            return shareButtons.length > 0;
        }, { timeout: 15000 });
        console.log('[TEST] Share buttons injected');
        
        // NOW annotation toolbar should be visible
        const annotationToolbar = page.locator('#annotation-controls');
        await expect(annotationToolbar).toBeVisible({ timeout: 5000 });
        
        console.log('[TEST] ✅ Annotation toolbar visible after transcript and share buttons loaded');
        
        // Verify toolbar elements
        await expect(page.locator('.tool-button[data-tool="select"]')).toBeVisible();
        await expect(page.locator('.tool-button[data-tool="laser"]')).toBeVisible();
        await expect(page.locator('.tool-button[data-tool="drawing"]')).toBeVisible();
        await expect(page.locator('.tool-button[data-tool="highlight"]')).toBeVisible();
        await expect(page.locator('.tool-button[data-tool="note"]')).toBeVisible();
        await expect(page.locator('#annotation-color')).toBeVisible();
        await expect(page.locator('#clear-annotations')).toBeVisible();
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Toolbar Visible (After Transcript Load)');
    });

    test('Annotation toolbar connection status should update', async ({ page }) => {
        console.log('[TEST] Verifying annotation connection status indicator');
        
        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        
        // Wait for toolbar to appear
        await page.waitForSelector('#annotation-controls', { timeout: 15000 });
        
        // Check connection status indicator exists
        const statusIndicator = page.locator('#annotation-connection-status');
        await expect(statusIndicator).toBeVisible();
        
        // Initially should be red (disconnected) or orange (connecting)
        const bgColor = await statusIndicator.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log('[TEST] Connection status indicator color:', bgColor);
        
        // Wait for connection to establish (should turn green)
        await page.waitForFunction(() => {
            const indicator = document.getElementById('annotation-connection-status');
            if (!indicator) return false;
            const color = window.getComputedStyle(indicator).backgroundColor;
            // Check for green (rgb(16, 185, 129) = #10b981)
            return color === 'rgb(16, 185, 129)' || color.includes('16, 185, 129');
        }, { timeout: 10000 });
        
        console.log('[TEST] ✅ Annotation connection status turned green (connected)');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Connection Status (Connected)');
    });

    test('Annotation toolbar should show session ID', async ({ page }) => {
        console.log('[TEST] Verifying session ID display in annotation toolbar');
        
        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        
        // Wait for toolbar
        await page.waitForSelector('#annotation-controls', { timeout: 15000 });
        
        // Verify session ID is displayed
        const sessionIdElement = page.locator('#annotation-controls').locator('text=/Session:\\s*212/i');
        await expect(sessionIdElement).toBeVisible();
        
        console.log('[TEST] ✅ Session ID (212) displayed in annotation toolbar');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Toolbar Session ID Display');
    });
});
