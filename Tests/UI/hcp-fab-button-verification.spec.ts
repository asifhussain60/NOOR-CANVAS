import { test, expect } from '@playwright/test';

/**
 * HCP FAB Button Verification Test
 * 
 * Purpose: Verify FAB (Floating Action Button) appears top-right of transcript container
 *          and successfully broadcasts transcript when clicked
 * 
 * Test Flow:
 * 1. Navigate to Host Control Panel with session PQ9N5YWW
 * 2. Click "Transcript Canvas" to select canvas type
 * 3. Wait for view to load and transcript to render
 * 4. Verify FAB button exists at top-right position
 * 5. Click FAB button to broadcast transcript
 * 6. Verify broadcast initiated (button shows loading state)
 * 
 * Key: hcp-fab-button
 * Related: HostControlPanelContent.razor, host-control-panel.css
 */

test.describe('HCP FAB Button Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Enable console logging for debugging
        page.on('console', msg => {
            if (msg.text().includes('[FAB-DEBUG]')) {
                console.log(`🔍 ${msg.text()}`);
            }
        });
    });

    test('FAB button appears and broadcasts transcript successfully', async ({ page }) => {
        // Step 1: Navigate to Host Control Panel with session PQ9N5YWW
        console.log('📍 Step 1: Navigating to Host Control Panel...');
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        console.log('✅ Page loaded');

        // Step 2: Click "Transcript Canvas" button
        console.log('📍 Step 2: Clicking Transcript Canvas button...');
        const transcriptCanvasButton = page.locator('button:has-text("Transcript Canvas"), div:has-text("Transcript Canvas")').first();
        await expect(transcriptCanvasButton).toBeVisible({ timeout: 10000 });
        await transcriptCanvasButton.click();
        console.log('✅ Transcript Canvas selected');

        // Step 3: Click "Start Session" button to trigger transcript render
        console.log('📍 Step 3: Starting session to trigger transcript render...');
        const startSessionButton = page.locator('button:has-text("Start Session")').first();
        
        // Wait for button to be visible and enabled
        await expect(startSessionButton).toBeVisible({ timeout: 10000 });
        await expect(startSessionButton).toBeEnabled({ timeout: 5000 });
        
        await startSessionButton.click();
        console.log('✅ Session started');

        // Step 4: Wait for transcript to load (loading spinner should disappear)
        console.log('📍 Step 4: Waiting for transcript to load...');
        await page.waitForSelector('.fa-spinner', { state: 'hidden', timeout: 15000 });
        
        // Wait for transcript content to appear
        await page.waitForSelector('#transcript-content-container', { state: 'visible', timeout: 10000 });
        console.log('✅ Transcript loaded');

        // Step 5: Verify FAB button exists
        console.log('📍 Step 5: Verifying FAB button...');
        const fabButton = page.locator('button.hcp-fab-share-button');
        
        // Wait for FAB button to appear
        await expect(fabButton).toBeVisible({ timeout: 10000 });
        console.log('✅ FAB button is visible');

        // Verify FAB button positioning (should be in transcript container area)
        const fabBox = await fabButton.boundingBox();
        expect(fabBox).not.toBeNull();
        if (fabBox) {
            console.log(`📐 FAB button position: top=${fabBox.y}px, right=${page.viewportSize()!.width - (fabBox.x + fabBox.width)}px`);
            
            // Button should be in top-right area (top < 200px, right < 100px from viewport edge)
            const rightDistance = page.viewportSize()!.width - (fabBox.x + fabBox.width);
            expect(fabBox.y).toBeLessThan(200); // Top positioning
            expect(rightDistance).toBeLessThan(100); // Right positioning
            console.log('✅ FAB button positioned correctly (top-right)');
        }

        // Verify FAB button has share icon
        const shareIcon = fabButton.locator('i.fa-share-nodes');
        await expect(shareIcon).toBeVisible();
        console.log('✅ FAB button has share icon');

        // Verify FAB button is enabled (not in loading state)
        await expect(fabButton).toBeEnabled();
        console.log('✅ FAB button is enabled');

        // Step 6: Click FAB button to broadcast transcript
        console.log('📍 Step 6: Clicking FAB button to broadcast...');
        await fabButton.click();
        console.log('✅ FAB button clicked');

        // Verify button enters loading state (shows spinner)
        const spinner = fabButton.locator('i.fa-spinner');
        await expect(spinner).toBeVisible({ timeout: 5000 });
        console.log('✅ Broadcast initiated (spinner visible)');

        // Wait for broadcast to complete (spinner disappears)
        await expect(spinner).toBeHidden({ timeout: 10000 });
        console.log('✅ Broadcast completed');

        // Final verification: FAB button returns to normal state
        await expect(shareIcon).toBeVisible();
        await expect(fabButton).toBeEnabled();
        console.log('✅ FAB button returned to normal state');

        console.log('🎉 Test completed successfully!');
    });

    test('FAB button hidden when not in broadcast mode', async ({ page }) => {
        console.log('📍 Testing FAB button visibility logic...');
        
        // Navigate to Host Control Panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');

        // Select Asset Canvas (NOT Transcript Canvas)
        console.log('📍 Selecting Asset Canvas (not transcript)...');
        const assetCanvasButton = page.locator('button:has-text("Asset Canvas"), div:has-text("Asset Canvas")').first();
        await expect(assetCanvasButton).toBeVisible({ timeout: 10000 });
        await assetCanvasButton.click();
        console.log('✅ Asset Canvas selected');

        // Verify FAB button is NOT visible (IsBroadcastMode should be false for Asset Canvas)
        const fabButton = page.locator('button.hcp-fab-share-button');
        await expect(fabButton).toBeHidden({ timeout: 5000 });
        console.log('✅ FAB button correctly hidden for Asset Canvas');

        console.log('🎉 Visibility test completed!');
    });

    test('FAB button styling and hover effects', async ({ page }) => {
        console.log('📍 Testing FAB button styling...');
        
        // Navigate and setup (same as first test)
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
        await page.waitForLoadState('networkidle');
        
        const transcriptCanvasButton = page.locator('button:has-text("Transcript Canvas")').first();
        await transcriptCanvasButton.click();
        
        const startSessionButton = page.locator('button:has-text("Start Session")').first();
        await startSessionButton.click();
        
        await page.waitForSelector('#transcript-content-container', { state: 'visible', timeout: 10000 });

        const fabButton = page.locator('button.hcp-fab-share-button');
        await expect(fabButton).toBeVisible({ timeout: 10000 });

        // Verify button is circular (width === height)
        const box = await fabButton.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
            expect(Math.abs(box.width - box.height)).toBeLessThan(2); // Allow 1px tolerance
            console.log(`✅ Button is circular: ${box.width}x${box.height}px`);
        }

        // Verify button has green background (check computed styles)
        const bgColor = await fabButton.evaluate(el => getComputedStyle(el).backgroundColor);
        console.log(`🎨 Background color: ${bgColor}`);
        
        // Verify border radius is 50% (circular)
        const borderRadius = await fabButton.evaluate(el => getComputedStyle(el).borderRadius);
        expect(borderRadius).toContain('50%');
        console.log(`✅ Border radius: ${borderRadius}`);

        // Hover test
        console.log('📍 Testing hover effect...');
        await fabButton.hover();
        await page.waitForTimeout(500); // Wait for transition
        
        // Button should scale on hover (check transform)
        const transform = await fabButton.evaluate(el => getComputedStyle(el).transform);
        console.log(`🎨 Hover transform: ${transform}`);
        expect(transform).not.toBe('none');
        console.log('✅ Hover effect applied');

        console.log('🎉 Styling test completed!');
    });
});
