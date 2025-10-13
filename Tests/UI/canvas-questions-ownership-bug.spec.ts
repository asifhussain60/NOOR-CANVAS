import type { BrowserContext, Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Canvas Questions Ownership Display Bug
 * 
 * Issue: Questions from other users display as "Your Question" with edit/delete buttons
 *        instead of showing in orange without action buttons. Upvote button also missing.
 * 
 * This test simulates two different users in separate browser contexts:
 * - User A submits a question
 * - User B verifies the question appears as from "another user" (orange, no edit/delete, upvote visible)
 * - User A verifies their own question shows correctly (green, "Your Question", edit/delete visible, no upvote)
 */

test.describe('Canvas Questions Ownership Bug - Session 212', () => {
    let browser: any;
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;

    const SESSION_TOKEN = 'SESS0212'; // Session 212 from PlaywrightTestPaths.MD
    const BASE_URL = 'http://localhost:9090'; // App runs on port 9090 per launchSettings
    const USER_A_NAME = 'Test User A';
    const USER_A_COUNTRY = 'United States';
    const USER_B_NAME = 'Test User B';
    const USER_B_COUNTRY = 'Canada';
    const TEST_QUESTION = 'What is the significance of Surah Al-Fatiha?';

    test.beforeAll(async () => {
        browser = await chromium.launch({ headless: false });

        // Create two completely isolated browser contexts (different users)
        contextA = await browser.newContext({
            storageState: undefined, // Clear storage
            viewport: { width: 1280, height: 720 }
        });

        contextB = await browser.newContext({
            storageState: undefined, // Clear storage
            viewport: { width: 1280, height: 720 }
        });

        pageA = await contextA.newPage();
        pageB = await contextB.newPage();

        // Enable console logging for debugging
        pageA.on('console', msg => console.log(`[USER A] ${msg.text()}`));
        pageB.on('console', msg => console.log(`[USER B] ${msg.text()}`));
    });

    test.afterAll(async () => {
        await contextA?.close();
        await contextB?.close();
        await browser?.close();
    });

    test('should display ownership correctly for multi-user questions', async () => {
        // Step 1: User A joins session and registers
        console.log('Step 1: User A registering...');
        await pageA.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageA.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageA.fill('input[placeholder="Enter your name"]', USER_A_NAME);
        await pageA.fill('input[placeholder="Enter your country"]', USER_A_COUNTRY);
        await pageA.click('button:has-text("Join Session")');

        // Wait for redirect to SessionCanvas
        await pageA.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('✓ User A registered and entered session');

        // Step 2: User B joins session and registers
        console.log('Step 2: User B registering...');
        await pageB.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageB.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageB.fill('input[placeholder="Enter your name"]', USER_B_NAME);
        await pageB.fill('input[placeholder="Enter your country"]', USER_B_COUNTRY);
        await pageB.click('button:has-text("Join Session")');

        await pageB.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('✓ User B registered and entered session');

        // Wait for both users to be fully connected
        await pageA.waitForTimeout(2000);
        await pageB.waitForTimeout(2000);

        // Step 3: User A submits a question
        console.log('Step 3: User A submitting question...');
        await pageA.waitForSelector('textarea[placeholder="Ask a question..."]', { timeout: 5000 });
        await pageA.fill('textarea[placeholder="Ask a question..."]', TEST_QUESTION);
        await pageA.click('button:has-text("Submit")');

        // Wait for SignalR propagation
        await pageA.waitForTimeout(3000);
        console.log('✓ User A submitted question');

        // Step 4: Verify User A sees their OWN question correctly
        console.log('Step 4: Verifying User A sees their own question...');

        // User A should see green background
        const userAQuestionBox = await pageA.locator('.canvas-question-item').first();
        const userABgColor = await userAQuestionBox.evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`User A question background: ${userABgColor}`);
        expect(userABgColor).toContain('rgb(236, 253, 245)'); // #ECFDF5 (green)

        // User A should see "Your Question" label
        const userALabel = await pageA.locator('.canvas-question-owner-label').first();
        await expect(userALabel).toBeVisible();
        await expect(userALabel).toHaveText('Your Question');
        console.log('✓ User A sees "Your Question" label');

        // User A should see edit/delete buttons
        const userAEditButton = await pageA.locator('.canvas-question-edit-button').first();
        const userADeleteButton = await pageA.locator('.canvas-question-delete-button').first();
        await expect(userAEditButton).toBeVisible();
        await expect(userADeleteButton).toBeVisible();
        console.log('✓ User A sees edit/delete buttons');

        // User A should NOT see upvote button (or it should be hidden)
        const userAVoteSection = await userAQuestionBox.locator('.canvas-question-vote-section').first();
        const userAVoteVisibility = await userAVoteSection.evaluate(el => window.getComputedStyle(el).visibility);
        expect(userAVoteVisibility).toBe('hidden');
        console.log('✓ User A upvote section is hidden');

        // Step 5: Verify User B sees question as from ANOTHER USER
        console.log('Step 5: Verifying User B sees question as from another user...');

        await pageB.waitForSelector('.canvas-question-item', { timeout: 5000 });
        const userBQuestionBox = await pageB.locator('.canvas-question-item').first();

        // User B should see ORANGE background (not green!)
        const userBBgColor = await userBQuestionBox.evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`User B question background: ${userBBgColor}`);
        expect(userBBgColor).toContain('rgb(255, 247, 237)'); // #FFF7ED (orange) - THIS IS THE BUG!

        // User B should NOT see "Your Question" label
        const userBLabelCount = await pageB.locator('.canvas-question-owner-label').count();
        expect(userBLabelCount).toBe(0);
        console.log('✓ User B does NOT see "Your Question" label');

        // User B should NOT see edit/delete buttons
        const userBEditCount = await pageB.locator('.canvas-question-edit-button').count();
        const userBDeleteCount = await pageB.locator('.canvas-question-delete-button').count();
        expect(userBEditCount).toBe(0);
        expect(userBDeleteCount).toBe(0);
        console.log('✓ User B does NOT see edit/delete buttons');

        // User B SHOULD see upvote button and count
        const userBVoteSection = await userBQuestionBox.locator('.canvas-question-vote-section').first();
        const userBVoteVisibility = await userBVoteSection.evaluate(el => window.getComputedStyle(el).visibility);
        expect(userBVoteVisibility).toBe('visible');

        const userBVoteButton = await userBQuestionBox.locator('.canvas-question-vote-button').first();
        await expect(userBVoteButton).toBeVisible();
        console.log('✓ User B sees upvote button');

        // Step 6: User B upvotes the question
        console.log('Step 6: User B upvoting question...');
        await userBVoteButton.click();
        await pageB.waitForTimeout(2000);

        // Verify vote count increased
        const voteCount = await userBQuestionBox.locator('.canvas-question-vote-count').first();
        await expect(voteCount).toHaveText('1');
        console.log('✓ User B successfully upvoted question');

        // Step 7: Verify User A still cannot upvote their own question
        await pageA.waitForTimeout(2000);
        const userAVoteSectionAfter = await userAQuestionBox.locator('.canvas-question-vote-section').first();
        const userAVoteVisibilityAfter = await userAVoteSectionAfter.evaluate(el => window.getComputedStyle(el).visibility);
        expect(userAVoteVisibilityAfter).toBe('hidden');
        console.log('✓ User A still cannot upvote their own question');

        console.log('✅ All assertions passed! Ownership display is working correctly.');
    });
});
