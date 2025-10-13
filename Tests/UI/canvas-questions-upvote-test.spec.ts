import type { BrowserContext, Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Canvas Questions Upvote Functionality
 * 
 * Purpose: Verify that clicking the upvote button increments the vote counter
 *          and that the UI updates correctly via SignalR.
 * 
 * Test Flow:
 * - User A submits a question
 * - User B clicks upvote button
 * - Verify counter updates from 0 to 1
 * - Verify button becomes disabled
 * - Verify both User A and User B see the updated count
 * - Check server logs for vote processing
 */

test.describe('Canvas Questions Upvote Functionality - Session 212', () => {
    let browser: any;
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;

    const SESSION_TOKEN = 'SESS0212';
    const BASE_URL = 'http://localhost:9090';
    const USER_A_NAME = 'Question Author';
    const USER_A_COUNTRY = 'United States';
    const USER_B_NAME = 'Voter User';
    const USER_B_COUNTRY = 'Canada';
    const TEST_QUESTION = 'What are the etiquettes of visiting the mosque?';

    // Increase test timeout
    test.setTimeout(120000); // 2 minutes

    test.beforeAll(async () => {
        browser = await chromium.launch({
            headless: false,
            slowMo: 200 // Slow down actions for visibility
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
        pageA.on('console', msg => {
            const text = msg.text();
            if (text.includes('DEBUG-WORKITEM:canvas-questions') ||
                text.includes('upvote') ||
                text.includes('VoteQuestion')) {
                console.log(`[USER A CONSOLE] ${text}`);
            }
        });

        pageB.on('console', msg => {
            const text = msg.text();
            if (text.includes('DEBUG-WORKITEM:canvas-questions') ||
                text.includes('upvote') ||
                text.includes('VoteQuestion')) {
                console.log(`[USER B CONSOLE] ${text}`);
            }
        });

        console.log('✅ Browser contexts created for two users');
    });

    test.afterAll(async () => {
        await pageA?.close();
        await pageB?.close();
        await contextA?.close();
        await contextB?.close();
        await browser?.close();
    });

    test('User B can upvote User A\'s question and counter updates', async () => {
        console.log('\n🎬 TEST START: Upvote Functionality Test\n');

        // STEP 1: User A registers and navigates to canvas
        console.log('📝 STEP 1: User A registers for session...');
        await pageA.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageA.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageA.fill('input[placeholder="Enter your name"]', USER_A_NAME);
        await pageA.fill('input[placeholder="Enter your country"]', USER_A_COUNTRY);
        await pageA.click('button:has-text("Join Session")');

        await pageA.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('✅ User A registered and on canvas');

        // STEP 2: User A submits a question
        console.log('\n📝 STEP 2: User A submits a question...');

        // Wait for Q&A UI to be ready
        await pageA.waitForSelector('textarea[placeholder="Ask a question..."]', { timeout: 10000 });

        // Submit question
        await pageA.fill('textarea[placeholder="Ask a question..."]', TEST_QUESTION);
        await pageA.click('button:has-text("Submit")');

        console.log('✅ User A submitted question, waiting for it to appear...');
        await pageA.waitForTimeout(3000);

        // Verify question appears for User A (should show as "Your Question")
        const userAQuestion = pageA.locator('.canvas-question-item').filter({ hasText: TEST_QUESTION });
        await expect(userAQuestion).toBeVisible({ timeout: 5000 });
        console.log('✅ Question appears for User A');

        // STEP 3: User B registers and navigates to canvas
        console.log('\n📝 STEP 3: User B registers for session...');
        await pageB.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageB.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageB.fill('input[placeholder="Enter your name"]', USER_B_NAME);
        await pageB.fill('input[placeholder="Enter your country"]', USER_B_COUNTRY);
        await pageB.click('button:has-text("Join Session")');

        await pageB.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('✅ User B registered and on canvas');

        // Wait for SignalR and UI to sync
        await pageB.waitForTimeout(2000);

        // STEP 4: Verify question appears for User B
        console.log('\n📝 STEP 4: Verifying question appears for User B...');
        const userBQuestion = pageB.locator('.canvas-question-item').filter({ hasText: TEST_QUESTION });
        await expect(userBQuestion).toBeVisible({ timeout: 5000 });
        console.log('✅ Question visible to User B');

        // Verify upvote button is visible and enabled
        const upvoteButton = userBQuestion.locator('button.canvas-question-vote-button');
        await expect(upvoteButton).toBeVisible();
        await expect(upvoteButton).toBeEnabled();

        // Verify initial vote count is 0
        const voteCountElement = userBQuestion.locator('.canvas-question-vote-count');
        const initialVoteCount = await voteCountElement.textContent();
        console.log(`📊 Initial vote count: ${initialVoteCount}`);
        expect(initialVoteCount?.trim()).toBe('0');

        // STEP 5: User B clicks upvote button
        console.log('\n📝 STEP 5: User B clicks upvote button...');

        // Get the question ID for tracking
        const questionId = await upvoteButton.getAttribute('data-question-id');
        console.log(`🎯 Question ID: ${questionId}`);

        // Click the upvote button
        await upvoteButton.click();
        console.log('✅ Upvote button clicked');

        // STEP 6: Verify vote count updates to 1
        console.log('\n📝 STEP 6: Verifying vote count updates...');

        // Wait for vote count to update (via SignalR)
        await pageB.waitForTimeout(2000);

        const updatedVoteCount = await voteCountElement.textContent();
        console.log(`📊 Updated vote count: ${updatedVoteCount}`);

        // CRITICAL ASSERTION: Vote count should be 1
        expect(updatedVoteCount?.trim()).toBe('1');
        console.log('✅ Vote count updated from 0 to 1');

        // STEP 7: Verify button becomes disabled after voting
        console.log('\n📝 STEP 7: Verifying button state after vote...');
        await expect(upvoteButton).toBeDisabled();
        console.log('✅ Upvote button is now disabled');

        // STEP 8: Verify User A also sees updated vote count
        console.log('\n📝 STEP 8: Verifying User A sees updated vote count...');
        await pageA.waitForTimeout(2000);

        const userAVoteCount = userAQuestion.locator('.canvas-question-vote-count');
        const userACount = await userAVoteCount.textContent();
        console.log(`📊 User A sees vote count: ${userACount}`);
        expect(userACount?.trim()).toBe('1');
        console.log('✅ User A sees updated vote count via SignalR');

        // STEP 9: Verify User B cannot vote again
        console.log('\n📝 STEP 9: Verifying duplicate vote prevention...');
        await expect(upvoteButton).toBeDisabled();

        // Try to click again (should have no effect)
        await upvoteButton.click({ force: true }).catch(() => {
            console.log('✅ Cannot click disabled button (as expected)');
        });

        await pageB.waitForTimeout(1000);
        const finalVoteCount = await voteCountElement.textContent();
        expect(finalVoteCount?.trim()).toBe('1');
        console.log('✅ Vote count remains 1 (duplicate prevented)');

        console.log('\n✅ TEST COMPLETE: All upvote functionality verified successfully!\n');
    });

    test('Check server logs for vote processing', async () => {
        console.log('\n📋 Checking server logs for vote processing...');
        console.log('Check the terminal where "dotnet run" is running for:');
        console.log('  - [DEBUG-WORKITEM:canvas-questions:upvote] VoteQuestion CALLED');
        console.log('  - [DEBUG-WORKITEM:canvas-questions:upvote] CLICK EVENT');
        console.log('  - [DEBUG-WORKITEM:canvas-questions:upvote] Sending vote request to API');
        console.log('  - [DEBUG-WORKITEM:canvas-questions:upvote] Vote SUCCESS');
        console.log('  - [DEBUG-WORKITEM:canvas-questions:upvote] SignalR QuestionVoteUpdate');
        console.log('\nIf vote count does NOT update:');
        console.log('  1. Check for "Vote failed" logs');
        console.log('  2. Check for API errors (HTTP 4xx/5xx)');
        console.log('  3. Verify SessionToken and UserGuid are being sent');
        console.log('  4. Check database for vote record creation');
    });
});
