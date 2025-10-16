/**
 * Test: HCP Annotation Laser Pointer
 * Purpose: Test laser pointer tool activation and SignalR broadcast
 * Session: 212 (Host Token: PQ9N5YWW, User Token: KJAHA99L)
 */

import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const SESSION_ID = 212;

test.describe('HCP Annotation Laser Pointer', () => {
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

    test('Laser pointer tool should be selectable', async ({ page }) => {
        console.log('[TEST] Testing laser pointer tool selection');
        
        // Initially Select tool should be active
        const selectButton = page.locator('.tool-button[data-tool="select"]');
        await expect(selectButton).toHaveClass(/active/);
        
        // Click laser pointer button
        const laserButton = page.locator('.tool-button[data-tool="laser"]');
        await laserButton.click();
        console.log('[TEST] Laser pointer button clicked');
        
        // Verify laser button becomes active
        await expect(laserButton).toHaveClass(/active/);
        
        // Verify select button is no longer active
        await expect(selectButton).not.toHaveClass(/active/);
        
        console.log('[TEST] ✅ Laser pointer tool activated successfully');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Laser Pointer Tool Active');
    });

    test('All annotation tools should be mutually exclusive', async ({ page }) => {
        console.log('[TEST] Testing tool mutual exclusivity');
        
        const tools = ['laser', 'drawing', 'highlight', 'note'];
        
        for (const tool of tools) {
            const toolButton = page.locator(`.tool-button[data-tool="${tool}"]`);
            await toolButton.click();
            console.log(`[TEST] Clicked ${tool} tool`);
            
            // Verify only this tool is active
            await expect(toolButton).toHaveClass(/active/);
            
            // Verify other tools are not active
            for (const otherTool of tools) {
                if (otherTool !== tool) {
                    const otherButton = page.locator(`.tool-button[data-tool="${otherTool}"]`);
                    await expect(otherButton).not.toHaveClass(/active/);
                }
            }
        }
        
        console.log('[TEST] ✅ All tools are mutually exclusive');
        
        // Take Percy snapshot
        await percySnapshot(page, 'HCP - Annotation Tools Mutual Exclusivity');
    });

    test('Laser pointer should log console messages', async ({ page }) => {
        console.log('[TEST] Testing laser pointer console logging');
        
        const consoleMessages: string[] = [];
        
        page.on('console', msg => {
            if (msg.text().includes('[TRACE-ANNOTATION:')) {
                consoleMessages.push(msg.text());
                console.log('[CONSOLE]', msg.text());
            }
        });
        
        // Click laser pointer button
        const laserButton = page.locator('.tool-button[data-tool="laser"]');
        await laserButton.click();
        
        // Wait for console message
        await page.waitForTimeout(1000);
        
        // Verify trace logging
        const toolChangeLog = consoleMessages.find(msg => 
            msg.includes('[TRACE-ANNOTATION:hcp-tool]') && msg.includes('laser')
        );
        
        expect(toolChangeLog).toBeDefined();
        console.log('[TEST] ✅ Laser pointer tool change logged:', toolChangeLog);
    });
});
