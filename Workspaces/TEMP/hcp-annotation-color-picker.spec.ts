/**
 * Test: HCP Annotation Color Picker
 * Purpose: Test annotation color picker functionality
 * Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';

test.describe('HCP Annotation Color Picker', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate and start session
        await page.goto(`http://localhost:5000/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        
        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        
        // Wait for annotation toolbar
        await page.waitForSelector('#annotation-controls', { timeout: 15000 });
    });

    test('Color picker should be visible with default color', async ({ page }) => {
        console.log('[TEST] Testing color picker default state');
        
        const colorPicker = page.locator('#annotation-color');
        await expect(colorPicker).toBeVisible();
        
        // Verify default color is yellow (#ffff00)
        const defaultColor = await colorPicker.inputValue();
        expect(defaultColor.toLowerCase()).toBe('#ffff00');
        
        console.log('[TEST] ✅ Color picker visible with default yellow color:', defaultColor);
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Color Picker Default');
    });

    test('Color picker should change color and log', async ({ page }) => {
        console.log('[TEST] Testing color picker change');
        
        const consoleMessages: string[] = [];
        
        page.on('console', msg => {
            if (msg.text().includes('[TRACE-ANNOTATION:hcp-color]')) {
                consoleMessages.push(msg.text());
                console.log('[CONSOLE]', msg.text());
            }
        });
        
        const colorPicker = page.locator('#annotation-color');
        
        // Change color to red
        await colorPicker.fill('#ff0000');
        
        // Wait for console log
        await page.waitForTimeout(500);
        
        // Verify color changed
        const newColor = await colorPicker.inputValue();
        expect(newColor.toLowerCase()).toBe('#ff0000');
        
        // Verify console log
        const colorChangeLog = consoleMessages.find(msg => msg.includes('#ff0000'));
        expect(colorChangeLog).toBeDefined();
        
        console.log('[TEST] ✅ Color changed to red and logged:', colorChangeLog);
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Color Changed to Red');
    });

    test('Clear All button should be visible', async ({ page }) => {
        console.log('[TEST] Testing Clear All button visibility');
        
        const clearButton = page.locator('#clear-annotations');
        await expect(clearButton).toBeVisible();
        await expect(clearButton).toContainText('Clear All');
        
        // Verify button styling (red background)
        const bgColor = await clearButton.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log('[TEST] Clear All button background color:', bgColor);
        
        // Check for red color (rgb(220, 38, 38) = #DC2626)
        expect(bgColor).toContain('220, 38, 38');
        
        console.log('[TEST] ✅ Clear All button visible with red styling');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Clear All Button');
    });

    test('Annotation toolbar help text should be visible', async ({ page }) => {
        console.log('[TEST] Testing annotation help text');
        
        const helpText = page.locator('#annotation-controls').locator('text=/How to use:/i');
        await expect(helpText).toBeVisible();
        
        // Verify help text content
        const fullHelp = await page.locator('#annotation-controls').locator('p:has-text("How to use")').textContent();
        expect(fullHelp).toContain('Select a tool');
        expect(fullHelp).toContain('interact with shared assets');
        expect(fullHelp).toContain('real-time');
        
        console.log('[TEST] ✅ Help text visible:', fullHelp);
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Help Text');
    });
});
