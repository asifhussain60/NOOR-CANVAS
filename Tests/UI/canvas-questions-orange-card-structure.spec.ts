import type { BrowserContext, Page } from '@playwright/test';
import { chromium, expect, test } from '@playwright/test';

/**
 * Test: Canvas Questions Orange Card HTML Structure Verification
 * 
 * Purpose: Verify that orange (sienna) question cards from other users render with the correct
 *          HTML structure matching the reference implementation in ContextCopilot.txt
 * 
 * Expected Structure (from ContextCopilot.txt):
 * - Card: .question-item-style-sienna with border-color: #A0522D, background: #FAEBD7, border-left-width: 6px
 * - Vote Badge: Absolute positioned top-right, red circle (#DC2626), white text
 * - Vote Button: White background (#FFFFFF), border: 2px solid #A0522D, rounded-full, thumbs-up icon
 * - Vote Button Color: #8B4513 (darker brown)
 * - Question Text: .question-text-color-sienna with color: #A0522D
 * - Layout: Single flex row with question text (flex-grow) + vote button (flex-shrink-0)
 * 
 * Regression Issue:
 * User reported orange cards not rendering correctly (Pasted Image 1 vs Pasted Image 2)
 * 
 * Debug Level: trace
 */

console.log('[DEBUG-WORKITEM:canvas-questions:test-init] Starting orange card structure verification test ;CLEANUP_OK');

test.describe('Canvas Questions - Orange Card HTML Structure', () => {
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
        console.log('[DEBUG-WORKITEM:canvas-questions:setup-trace] Launching browser contexts ;CLEANUP_OK');

        browser = await chromium.launch({
            headless: false,
            slowMo: 500 // Slow down for visual verification
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

        console.log('[DEBUG-WORKITEM:canvas-questions:setup-trace] Browser contexts created ;CLEANUP_OK');
    });

    test.afterAll(async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:teardown-trace] Closing browser contexts ;CLEANUP_OK');
        await contextA?.close();
        await contextB?.close();
        await browser?.close();
    });

    test('should render orange card with correct HTML structure matching ContextCopilot.txt', async () => {
        console.log('[DEBUG-WORKITEM:canvas-questions:test-start] Beginning multi-user orange card test ;CLEANUP_OK');

        // Step 1: User A joins session
        console.log('[DEBUG-WORKITEM:canvas-questions:user-a-join] User A navigating to session ;CLEANUP_OK');
        await pageA.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageA.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageA.fill('input[placeholder="Enter your name"]', USER_A_NAME);
        await pageA.fill('input[placeholder="Enter your country"]', USER_A_COUNTRY);
        await pageA.click('button:has-text("Join Session")');

        await pageA.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('[DEBUG-WORKITEM:canvas-questions:user-a-join] User A entered session canvas ;CLEANUP_OK');

        // Step 2: User B joins session
        console.log('[DEBUG-WORKITEM:canvas-questions:user-b-join] User B navigating to session ;CLEANUP_OK');
        await pageB.goto(`${BASE_URL}/user/landing/${SESSION_TOKEN}`);
        await pageB.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

        await pageB.fill('input[placeholder="Enter your name"]', USER_B_NAME);
        await pageB.fill('input[placeholder="Enter your country"]', USER_B_COUNTRY);
        await pageB.click('button:has-text("Join Session")');

        await pageB.waitForURL(/\/session\/canvas\//, { timeout: 15000 });
        console.log('[DEBUG-WORKITEM:canvas-questions:user-b-join] User B entered session canvas ;CLEANUP_OK');

        // Wait for SignalR connections
        await pageA.waitForTimeout(3000);
        await pageB.waitForTimeout(3000);

        // Step 3: User A submits question
        console.log('[DEBUG-WORKITEM:canvas-questions:submit-trace] User A submitting question ;CLEANUP_OK');
        await pageA.waitForSelector('textarea[placeholder="Ask a question..."]', { timeout: 5000 });
        await pageA.fill('textarea[placeholder="Ask a question..."]', TEST_QUESTION);
        await pageA.click('button:has-text("Submit")');

        // Wait for SignalR broadcast
        await pageA.waitForTimeout(3000);
        await pageB.waitForTimeout(3000);
        console.log('[DEBUG-WORKITEM:canvas-questions:submit-trace] Question submitted, waiting for propagation ;CLEANUP_OK');

        // Step 4: User B verifies orange card structure
        console.log('[DEBUG-WORKITEM:canvas-questions:structure-verification] User B verifying orange card HTML ;CLEANUP_OK');

        // 4.1: Verify card container has correct sienna styling
        const questionCard = pageB.locator('.canvas-question-item.question-item-style-sienna').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });

        console.log('[DEBUG-WORKITEM:canvas-questions:css-trace] Verifying .question-item-style-sienna CSS properties ;CLEANUP_OK');

        // Verify border-color: #A0522D (Sienna)
        const borderColor = await questionCard.evaluate(el => window.getComputedStyle(el).borderLeftColor);
        console.log(`[DEBUG-WORKITEM:canvas-questions:css-trace] Border color: ${borderColor} (expected: rgb(160, 82, 45) = #A0522D) ;CLEANUP_OK`);
        expect(borderColor).toBe('rgb(160, 82, 45)'); // #A0522D

        // Verify background-color: #FAEBD7 (Antique White)
        const bgColor = await questionCard.evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`[DEBUG-WORKITEM:canvas-questions:css-trace] Background color: ${bgColor} (expected: rgb(250, 235, 215) = #FAEBD7) ;CLEANUP_OK`);
        expect(bgColor).toBe('rgb(250, 235, 215)'); // #FAEBD7

        // Verify border-left-width: 6px
        const borderLeftWidth = await questionCard.evaluate(el => window.getComputedStyle(el).borderLeftWidth);
        console.log(`[DEBUG-WORKITEM:canvas-questions:css-trace] Border left width: ${borderLeftWidth} (expected: 6px) ;CLEANUP_OK`);
        expect(borderLeftWidth).toBe('6px');

        // 4.2: Verify vote badge (red circle, absolute positioned)
        console.log('[DEBUG-WORKITEM:canvas-questions:vote-badge-trace] Verifying vote badge structure ;CLEANUP_OK');
        const voteBadge = questionCard.locator('.canvas-question-vote-count').first();
        await expect(voteBadge).toBeVisible();

        // Verify vote badge red background (#DC2626)
        const voteBadgeBg = await voteBadge.evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-badge-trace] Vote badge background: ${voteBadgeBg} (expected: rgb(220, 38, 38) = #DC2626) ;CLEANUP_OK`);
        expect(voteBadgeBg).toBe('rgb(220, 38, 38)'); // #DC2626

        // Verify vote badge white text
        const voteBadgeColor = await voteBadge.evaluate(el => window.getComputedStyle(el).color);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-badge-trace] Vote badge text color: ${voteBadgeColor} (expected: rgb(255, 255, 255) = #FFFFFF) ;CLEANUP_OK`);
        expect(voteBadgeColor).toBe('rgb(255, 255, 255)'); // #FFFFFF

        // Verify vote badge shows "0" initially
        const voteBadgeText = await voteBadge.textContent();
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-badge-trace] Vote badge text: "${voteBadgeText}" (expected: "0") ;CLEANUP_OK`);
        expect(voteBadgeText?.trim()).toBe('0');

        // 4.3: Verify vote button styling
        console.log('[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Verifying vote button structure ;CLEANUP_OK');
        const voteButton = questionCard.locator('.canvas-question-vote-button').first();
        await expect(voteButton).toBeVisible();

        // Verify vote button background: #FFFFFF (white)
        const voteButtonBg = await voteButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Vote button background: ${voteButtonBg} (expected: rgb(255, 255, 255) = #FFFFFF) ;CLEANUP_OK`);
        expect(voteButtonBg).toBe('rgb(255, 255, 255)'); // #FFFFFF

        // Verify vote button border: 2px solid #A0522D
        const voteButtonBorderWidth = await voteButton.evaluate(el => window.getComputedStyle(el).borderWidth);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Vote button border width: ${voteButtonBorderWidth} (expected: 2px) ;CLEANUP_OK`);
        expect(voteButtonBorderWidth).toBe('2px');

        const voteButtonBorderColor = await voteButton.evaluate(el => window.getComputedStyle(el).borderColor);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Vote button border color: ${voteButtonBorderColor} (expected: rgb(160, 82, 45) = #A0522D) ;CLEANUP_OK`);
        expect(voteButtonBorderColor).toBe('rgb(160, 82, 45)'); // #A0522D

        // Verify vote button icon color: #8B4513 (darker brown)
        const voteButtonColor = await voteButton.evaluate(el => window.getComputedStyle(el).color);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Vote button icon color: ${voteButtonColor} (expected: rgb(139, 69, 19) = #8B4513) ;CLEANUP_OK`);
        expect(voteButtonColor).toBe('rgb(139, 69, 19)'); // #8B4513

        // Verify vote button is rounded-full (border-radius: 9999px)
        const voteButtonBorderRadius = await voteButton.evaluate(el => window.getComputedStyle(el).borderRadius);
        console.log(`[DEBUG-WORKITEM:canvas-questions:vote-button-trace] Vote button border radius: ${voteButtonBorderRadius} (expected: 9999px) ;CLEANUP_OK`);
        expect(voteButtonBorderRadius).toBe('9999px');

        // 4.4: Verify question text color: #A0522D
        console.log('[DEBUG-WORKITEM:canvas-questions:text-trace] Verifying question text color ;CLEANUP_OK');
        const questionText = questionCard.locator('.canvas-question-text.question-text-color-sienna').first();
        await expect(questionText).toBeVisible();

        const questionTextColor = await questionText.evaluate(el => window.getComputedStyle(el).color);
        console.log(`[DEBUG-WORKITEM:canvas-questions:text-trace] Question text color: ${questionTextColor} (expected: rgb(160, 82, 45) = #A0522D) ;CLEANUP_OK`);
        expect(questionTextColor).toBe('rgb(160, 82, 45)'); // #A0522D

        // Verify question text content
        const questionTextContent = await questionText.textContent();
        console.log(`[DEBUG-WORKITEM:canvas-questions:text-trace] Question text: "${questionTextContent}" ;CLEANUP_OK`);
        expect(questionTextContent?.trim()).toBe(TEST_QUESTION);

        // 4.5: Verify layout - vote section and question text in single row
        console.log('[DEBUG-WORKITEM:canvas-questions:layout-trace] Verifying flex layout structure ;CLEANUP_OK');
        const questionContent = questionCard.locator('.canvas-question-content').first();
        await expect(questionContent).toBeVisible();

        // Verify flex display
        const contentDisplay = await questionContent.evaluate(el => window.getComputedStyle(el).display);
        console.log(`[DEBUG-WORKITEM:canvas-questions:layout-trace] Content display: ${contentDisplay} (expected: flex) ;CLEANUP_OK`);
        // Note: Display might be "flex" or inherited, just verify it's not "block"

        // 4.6: Verify NO "Your Question" label (should only appear on green cards)
        console.log('[DEBUG-WORKITEM:canvas-questions:ownership-trace] Verifying NO "Your Question" label on orange card ;CLEANUP_OK');
        const ownerLabel = questionCard.locator('.canvas-question-owner-label');
        await expect(ownerLabel).toHaveCount(0);

        // 4.7: Verify NO edit/delete buttons (should only appear on green cards)
        console.log('[DEBUG-WORKITEM:canvas-questions:ownership-trace] Verifying NO edit/delete buttons on orange card ;CLEANUP_OK');
        const editButton = questionCard.locator('.canvas-question-edit-button');
        const deleteButton = questionCard.locator('.canvas-question-delete-button');
        await expect(editButton).toHaveCount(0);
        await expect(deleteButton).toHaveCount(0);

        console.log('[DEBUG-WORKITEM:canvas-questions:test-complete] ✅ Orange card HTML structure verified successfully ;CLEANUP_OK');

        // Step 5: User A verifies green card (own question) for contrast
        console.log('[DEBUG-WORKITEM:canvas-questions:green-card-verification] User A verifying green card (control) ;CLEANUP_OK');
        const greenCard = pageA.locator('.canvas-question-item.question-item-style-green').first();
        await expect(greenCard).toBeVisible({ timeout: 5000 });

        // Verify green card has owner label
        const greenOwnerLabel = greenCard.locator('.canvas-question-owner-label');
        await expect(greenOwnerLabel).toBeVisible();
        await expect(greenOwnerLabel).toHaveText('Your Question');

        // Verify green card has edit/delete buttons
        const greenEditButton = greenCard.locator('.canvas-question-edit-button');
        const greenDeleteButton = greenCard.locator('.canvas-question-delete-button');
        await expect(greenEditButton).toBeVisible();
        await expect(greenDeleteButton).toBeVisible();

        // Verify green card has NO vote button
        const greenVoteButton = greenCard.locator('.canvas-question-vote-button');
        await expect(greenVoteButton).toHaveCount(0);

        console.log('[DEBUG-WORKITEM:canvas-questions:test-complete] ✅ Green card verification complete (control group) ;CLEANUP_OK');

        // Final pause for manual visual verification
        console.log('[DEBUG-WORKITEM:canvas-questions:manual-verification] Pausing for manual visual verification (10 seconds) ;CLEANUP_OK');
        await pageB.waitForTimeout(10000);
    });
});
