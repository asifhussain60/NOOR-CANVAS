import type { BrowserContext, Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Test: Canvas Questions Orange Card Visual Regression with Percy
 * 
 * Purpose: Verify that orange (sienna) question cards from other users render with the correct
 *          visual appearance matching the reference implementation in ContextCopilot.txt
 * 
 * Percy Integration:
 * - Captures pixel-perfect snapshots at multiple viewport sizes (mobile, tablet, desktop)
 * - Creates baseline on first run, compares against baseline on subsequent runs
 * - Highlights visual differences in Percy dashboard
 * 
 * Expected Visual Structure (from ContextCopilot.txt):
 * - Card: Sienna border (#A0522D), antique white background (#FAEBD7), 6px left border
 * - Vote Badge: Red circle (#DC2626) with white text, positioned top-right
 * - Vote Button: White background, 2px sienna border, rounded-full, darker brown icon (#8B4513)
 * - Question Text: Sienna color (#A0522D), full-width layout
 * - No "Your Question" label or edit/delete buttons
 * 
 * Debug Level: trace
 */

console.log('[DEBUG-WORKITEM:canvas-questions:percy-test-init] Starting Percy visual regression test ;CLEANUP_OK');

test.describe('Canvas Questions - Orange Card Visual Regression (Percy)', () => {
    let browser: any;
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;

    const SESSION_TOKEN = 'KJAHA99L'; // Session 212 user token from InfrastructureQuickRef.md
    const BASE_URL = 'https://localhost:9091'; // Standard Kestrel port from PlaywrightQuickRef.md
    const USER_A_NAME = 'Test User A';
    const USER_A_COUNTRY = 'United States';
    const USER_B_NAME = 'Test User B';
    const USER_B_COUNTRY = 'Canada';
    const TEST_QUESTION = 'What is the importance of family in Islam?'; // Question from ContextCopilot.txt

    test.beforeAll(async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-setup-trace] Launching browser contexts for Percy ;CLEANUP_OK');
        
        browser = await chromium.launch({ 
            headless: false,
            slowMo: 300 // Slightly faster than structure test
        });

        // Create two isolated browser contexts
        contextA = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });

        contextB = await browser.newContext({
            storageState: undefined,
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
        });

        pageA = await contextA.newPage();
        pageB = await contextB.newPage();

        // Enable console logging
        pageA.on('console', msg => console.log(`[USER A] ${msg.text()}`));
        pageB.on('console', msg => console.log(`[USER B] ${msg.text()}`));
        
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-setup-trace] Browser contexts created ;CLEANUP_OK');
    });

    test.afterAll(async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-teardown-trace] Closing browser contexts ;CLEANUP_OK');
        await contextA?.close();
        await contextB?.close();
        await browser?.close();
    });

    test('should match visual baseline for orange question card', async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-test-start] Beginning visual regression test ;CLEANUP_OK');
        
        // Step 1: User A joins session
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-user-a-join] User A navigating to session ;CLEANUP_OK');
        await pageA.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageA.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageA.fill('input[placeholder="Enter your name"]', USER_A_NAME);
        await pageA.fill('input[placeholder="Enter your country"]', USER_A_COUNTRY);
        await pageA.click('button:has-text("Join Session")');

        await pageA.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-user-a-join] User A entered session canvas ;CLEANUP_OK');

        // Step 2: User B joins session
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-user-b-join] User B navigating to session ;CLEANUP_OK');
        await pageB.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageB.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageB.fill('input[placeholder="Enter your name"]', USER_B_NAME);
        await pageB.fill('input[placeholder="Enter your country"]', USER_B_COUNTRY);
        await pageB.click('button:has-text("Join Session")');

        await pageB.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-user-b-join] User B entered session canvas ;CLEANUP_OK');

        // Wait for SignalR connections
        await pageA.waitForTimeout(3000);
        await pageB.waitForTimeout(3000);

        // Step 3: User A submits question
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-submit-trace] User A submitting question ;CLEANUP_OK');
        await pageA.waitForSelector('textarea[placeholder="Ask a question..."]', { timeout: 5000 });
        await pageA.fill('textarea[placeholder="Ask a question..."]', TEST_QUESTION);
        await pageA.click('button:has-text("Submit")');

        // Wait for SignalR broadcast
        await pageA.waitForTimeout(3000);
        await pageB.waitForTimeout(3000);
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-submit-trace] Question submitted, waiting for propagation ;CLEANUP_OK');

        // Step 4: User B verifies orange card is visible
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-verification] User B verifying orange card visibility ;CLEANUP_OK');
        
        const questionCard = pageB.locator('.canvas-question-item.question-item-style-sienna').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        
        // Wait for card to fully render
        await pageB.waitForTimeout(1000);
        
        // Step 5: Capture Percy snapshot - Orange Card (User B's view)
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-snapshot] Capturing Percy snapshot - Orange Card ;CLEANUP_OK');
        await percySnapshot(pageB, 'Orange Question Card - User B View (Other Users Question)', {
            widths: [375, 768, 1280], // Mobile, tablet, desktop
            minHeight: 1024,
            percyCSS: `
                /* Hide dynamic elements that might cause false positives */
                .canvas-session-timer { visibility: hidden; }
                .canvas-participant-count { visibility: hidden; }
            `
        });
        
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-snapshot] Orange card snapshot captured ;CLEANUP_OK');
        
        // Step 6: Capture Percy snapshot - Green Card (User A's view)
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-snapshot] Capturing Percy snapshot - Green Card ;CLEANUP_OK');
        await percySnapshot(pageA, 'Green Question Card - User A View (Own Question)', {
            widths: [375, 768, 1280],
            minHeight: 1024,
            percyCSS: `
                .canvas-session-timer { visibility: hidden; }
                .canvas-participant-count { visibility: hidden; }
            `
        });
        
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-snapshot] Green card snapshot captured ;CLEANUP_OK');
        
        // Step 7: Functional validations (ensure Percy snapshots are of working features)
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-functional] Running functional validations ;CLEANUP_OK');
        
        // User B sees orange card without owner controls
        const voteBadge = questionCard.locator('.canvas-question-vote-count').first();
        await expect(voteBadge).toBeVisible();
        await expect(voteBadge).toHaveText('0');
        
        const ownerLabel = questionCard.locator('.canvas-question-owner-label');
        await expect(ownerLabel).toHaveCount(0);
        
        // User A sees green card with owner controls
        const greenCard = pageA.locator('.canvas-question-item.question-item-style-green').first();
        await expect(greenCard).toBeVisible();
        
        const greenOwnerLabel = greenCard.locator('.canvas-question-owner-label');
        await expect(greenOwnerLabel).toBeVisible();
        await expect(greenOwnerLabel).toHaveText('Your Question');
        
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-test-complete] ✅ Percy visual regression test completed ;CLEANUP_OK');
        
        // Final pause for manual verification
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-manual-verification] Pausing for manual visual verification (5 seconds) ;CLEANUP_OK');
        await pageB.waitForTimeout(5000);
    });

    test('should capture vote state changes visually', async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-vote-test] Testing vote visual state changes ;CLEANUP_OK');
        
        // Reuse existing session from previous test
        // User B should see the question from User A
        
        const questionCard = pageB.locator('.canvas-question-item.question-item-style-sienna').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        
        // Capture pre-vote state
        await percySnapshot(pageB, 'Orange Card - Before Vote', {
            widths: [1280],
            scope: '.canvas-question-item.question-item-style-sienna'
        });
        
        // User B votes on question
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-vote-action] User B voting on question ;CLEANUP_OK');
        const voteButton = questionCard.locator('.canvas-question-vote-button').first();
        await voteButton.click();
        
        // Wait for vote to register
        await pageB.waitForTimeout(2000);
        
        // Capture post-vote state
        await percySnapshot(pageB, 'Orange Card - After Vote (Count: 1)', {
            widths: [1280],
            scope: '.canvas-question-item.question-item-style-sienna'
        });
        
        // Verify vote count changed
        const voteBadge = questionCard.locator('.canvas-question-vote-count').first();
        await expect(voteBadge).toHaveText('1');
        
        // Verify button is now disabled
        await expect(voteButton).toBeDisabled();
        
        console.log('[DEBUG-WORKITEM:canvas-questions:percy-vote-test] ✅ Vote state visual regression test completed ;CLEANUP_OK');
    });
});
