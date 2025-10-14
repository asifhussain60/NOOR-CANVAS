/**
 * CANVAS SIDEBAR HEIGHT FIX - VALIDATION TEST
 * 
 * Bug: div.canvas-sidebar was increasing in height after 4+ questions
 * Fix: Removed height:100% from .canvas-sidebar, added min-height:400px and max-height:100%
 * 
 * Test Strategy:
 * 1. Join session as participant (Session 212: PQ9N5YWW)
 * 2. Capture initial dimensions of .canvas-area-container and .canvas-sidebar
 * 3. Add 10 questions via debug panel "Simulate Random Question" button
 * 4. Verify .canvas-area-container height remains constant
 * 5. Verify .canvas-sidebar shows vertical scrollbar (overflow-y: auto)
 * 6. Verify NO horizontal scrollbar appears (overflow-x: hidden)
 * 
 * Expected Outcome:
 * - canvas-area-container height: UNCHANGED
 * - canvas-sidebar scrollHeight > clientHeight (scrollbar present)
 * - canvas-sidebar scrollWidth === clientWidth (no horizontal scroll)
 */

import { expect, Page, test } from '@playwright/test';

// Session 212 canonical data (from PlaywrightQuickRef.md)
const SESSION_212 = {
    sessionToken: 'PQ9N5YWW',
    participantToken: 'KJAHA99L',
    hostToken: 'k4drccsw',
    sessionId: 212,
    sessionName: 'What is Tawheed',
    url: (participantToken: string) => `/session/canvas/${participantToken}`
};

interface DimensionSnapshot {
    width: number;
    height: number;
    scrollHeight: number;
    scrollWidth: number;
    clientHeight: number;
    clientWidth: number;
}

test.describe('Canvas Sidebar Height Fix - Validation', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to SessionCanvas as participant
        await page.goto(SESSION_212.url(SESSION_212.participantToken));

        // Wait for session to load
        await expect(page.locator('text=What is Tawheed')).toBeVisible({ timeout: 10000 });

        // Ensure Questions tab is active
        await page.click('button:has-text("Questions")');
        await page.waitForTimeout(500); // Allow tab content to render
    });

    test('sidebar should NOT increase in height when 10 questions are added', async ({ page }) => {
        console.log('\n🧪 TEST: Sidebar Height Fix - 10 Questions Validation');

        // Step 1: Capture initial dimensions
        console.log('📐 STEP 1: Capturing initial dimensions...');
        const initialCanvasArea = await getDimensions(page, '.canvas-area-container');
        const initialSidebar = await getDimensions(page, '.canvas-sidebar');

        console.log(`📊 Initial canvas-area-container: ${initialCanvasArea.width}x${initialCanvasArea.height}px`);
        console.log(`📊 Initial canvas-sidebar: ${initialSidebar.width}x${initialSidebar.height}px, scrollHeight: ${initialSidebar.scrollHeight}px`);

        // Verify initial state
        expect(initialCanvasArea.height).toBeGreaterThan(0);
        expect(initialSidebar.height).toBeGreaterThan(0);

        // Step 2: Add 10 questions using debug panel
        console.log('\n📝 STEP 2: Adding 10 questions via debug panel...');

        for (let i = 1; i <= 10; i++) {
            console.log(`  📌 Adding question ${i}/10...`);

            // Click "Simulate Random Question" button in debug panel
            await page.click('button:has-text("Simulate Random Question")');

            // Wait for question to be added (SignalR broadcast)
            await page.waitForTimeout(1000);

            // Log progress after every 2 questions
            if (i % 2 === 0) {
                const currentSidebar = await getDimensions(page, '.canvas-sidebar');
                console.log(`  ✅ ${i} questions added - sidebar height: ${currentSidebar.height}px, scrollHeight: ${currentSidebar.scrollHeight}px`);
            }
        }

        console.log('✅ All 10 questions added successfully');

        // Step 3: Capture dimensions after adding 10 questions
        console.log('\n📐 STEP 3: Capturing dimensions after 10 questions...');
        await page.waitForTimeout(1000); // Allow final render

        const finalCanvasArea = await getDimensions(page, '.canvas-area-container');
        const finalSidebar = await getDimensions(page, '.canvas-sidebar');

        console.log(`📊 Final canvas-area-container: ${finalCanvasArea.width}x${finalCanvasArea.height}px`);
        console.log(`📊 Final canvas-sidebar: ${finalSidebar.width}x${finalSidebar.height}px, scrollHeight: ${finalSidebar.scrollHeight}px`);

        // Step 4: Verify canvas-area-container height is UNCHANGED
        console.log('\n🔍 STEP 4: Verifying canvas-area-container height...');
        const heightDifference = Math.abs(finalCanvasArea.height - initialCanvasArea.height);
        console.log(`📏 Height difference: ${heightDifference}px (tolerance: ±5px)`);

        expect(heightDifference).toBeLessThanOrEqual(5); // Allow 5px tolerance for rounding
        console.log('✅ canvas-area-container height remained constant');

        // Step 5: Verify vertical scrollbar is present in sidebar
        console.log('\n🔍 STEP 5: Verifying vertical scrollbar...');
        console.log(`📏 Sidebar scrollHeight: ${finalSidebar.scrollHeight}px`);
        console.log(`📏 Sidebar clientHeight: ${finalSidebar.clientHeight}px`);

        expect(finalSidebar.scrollHeight).toBeGreaterThan(finalSidebar.clientHeight);
        console.log('✅ Vertical scrollbar is present (scrollHeight > clientHeight)');

        // Step 6: Verify NO horizontal scrollbar
        console.log('\n🔍 STEP 6: Verifying NO horizontal scrollbar...');
        console.log(`📏 Sidebar scrollWidth: ${finalSidebar.scrollWidth}px`);
        console.log(`📏 Sidebar clientWidth: ${finalSidebar.clientWidth}px`);

        const widthDifference = Math.abs(finalSidebar.scrollWidth - finalSidebar.clientWidth);
        expect(widthDifference).toBeLessThanOrEqual(2); // Allow 2px tolerance
        console.log('✅ NO horizontal scrollbar (scrollWidth ≈ clientWidth)');

        // Step 7: Visual verification - take screenshot
        console.log('\n📸 STEP 7: Capturing visual verification screenshot...');
        await page.screenshot({
            path: 'Workspaces/TEMP/sidebar-height-fix-10-questions.png',
            fullPage: true
        });
        console.log('✅ Screenshot saved to Workspaces/TEMP/sidebar-height-fix-10-questions.png');

        // Summary
        console.log('\n🎉 TEST PASSED - Sidebar Height Fix Validated');
        console.log(`📊 Summary:`);
        console.log(`   - Questions added: 10`);
        console.log(`   - canvas-area-container height change: ${heightDifference}px (expected: ≤5px)`);
        console.log(`   - Vertical scrollbar: Present ✓`);
        console.log(`   - Horizontal scrollbar: Absent ✓`);
    });

    test('sidebar scrolling behavior with 15 questions', async ({ page }) => {
        console.log('\n🧪 TEST: Sidebar Scrolling Behavior - 15 Questions');

        // Add 15 questions to ensure scrolling is necessary
        console.log('📝 Adding 15 questions...');
        for (let i = 1; i <= 15; i++) {
            await page.click('button:has-text("Simulate Random Question")');
            await page.waitForTimeout(800);
        }

        console.log('✅ 15 questions added');

        // Verify scrollbar presence
        const sidebar = page.locator('.canvas-sidebar');
        const scrollHeight = await sidebar.evaluate((el) => el.scrollHeight);
        const clientHeight = await sidebar.evaluate((el) => el.clientHeight);

        console.log(`📏 Sidebar scrollHeight: ${scrollHeight}px, clientHeight: ${clientHeight}px`);
        expect(scrollHeight).toBeGreaterThan(clientHeight * 1.5); // Ensure significant scrollable area

        // Test scrolling functionality
        console.log('🖱️ Testing scroll to bottom...');
        await sidebar.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
        });

        await page.waitForTimeout(500);

        // Verify scroll position
        const scrollTop = await sidebar.evaluate((el) => el.scrollTop);
        console.log(`📏 Final scrollTop: ${scrollTop}px`);
        expect(scrollTop).toBeGreaterThan(0);

        console.log('✅ Scrolling works correctly');
    });
});

/**
 * Helper: Get element dimensions including scroll properties
 */
async function getDimensions(page: Page, selector: string): Promise<DimensionSnapshot> {
    return await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) {
            throw new Error(`Element not found: ${sel}`);
        }

        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            scrollHeight: element.scrollHeight,
            scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight,
            clientWidth: element.clientWidth
        };
    }, selector);
}
