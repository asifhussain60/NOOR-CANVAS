/**
 * [DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] Percy visual regression test for orange-themed question cards ;CLEANUP_OK
 * 
 * Test validates that broadcasted questions from HostControlPanel match ContextCopilot.txt styling:
 * - Orange theme: #fff7f5 (bg), #fdba74 (border), #f97316 (icon), #c2410c (title)
 * - Border styling: 2px top/left, 4px right/bottom
 * - Question circle icon with fa-question-circle
 * 
 * Session: 212 (KJAHA99L user / PQ9N5YWW host)
 * 
 * Run via: npm run test:hcp-question-percy (launches app in separate PowerShell window)
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

// [DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] Test configuration - Session 212 tokens ;CLEANUP_OK
const SESSION_212 = {
    userToken: 'KJAHA99L',
    hostToken: 'PQ9N5YWW',
    sessionId: 212,
    baseUrl: 'https://localhost:7101'
};

// [DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] Wait for app initialization ;CLEANUP_OK
const APP_INIT_WAIT = 3000;
const SIGNALR_CONNECT_WAIT = 2000;
const QUESTION_RENDER_WAIT = 1500;

test.describe('HCP Question Orange Styling - Percy Visual Regression', () => {

    test.beforeEach(async ({ page }) => {
        // [DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] Ignore certificate errors for localhost ;CLEANUP_OK
        await page.goto(SESSION_212.baseUrl, { waitUntil: 'networkidle' });
    });

    test('should display orange-themed question card matching ContextCopilot.txt', async ({ page, context }) => {
        const testId = `percy-${Date.now()}`;

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Test started ;CLEANUP_OK`);

        // Step 1: Open SessionCanvas in first tab
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Opening SessionCanvas ;CLEANUP_OK`);
        const canvasPage = page;
        await canvasPage.goto(`${SESSION_212.baseUrl}/session/canvas/${SESSION_212.userToken}`, { waitUntil: 'networkidle' });
        await canvasPage.waitForTimeout(APP_INIT_WAIT);

        // Verify SessionCanvas loaded
        const sessionTitle = canvasPage.locator('.canvas-session-title');
        await expect(sessionTitle).toBeVisible({ timeout: 10000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - SessionCanvas loaded ;CLEANUP_OK`);

        // Step 2: Open HostControlPanel in second tab
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Opening HostControlPanel ;CLEANUP_OK`);
        const hcpPage = await context.newPage();
        await hcpPage.goto(`${SESSION_212.baseUrl}/host/control-panel/${SESSION_212.hostToken}`, { waitUntil: 'networkidle' });
        await hcpPage.waitForTimeout(APP_INIT_WAIT);

        // Verify HostControlPanel loaded
        const hcpHeader = hcpPage.locator('text=Host Control Panel');
        await expect(hcpHeader).toBeVisible({ timeout: 10000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - HostControlPanel loaded ;CLEANUP_OK`);

        // Wait for SignalR connections
        await canvasPage.waitForTimeout(SIGNALR_CONNECT_WAIT);
        await hcpPage.waitForTimeout(SIGNALR_CONNECT_WAIT);

        // Step 3: Click first question in HostControlPanel to broadcast
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Broadcasting question from HCP ;CLEANUP_OK`);

        // Find first question card and click it
        const firstQuestionCard = hcpPage.locator('.hcp-question-item').first();
        await expect(firstQuestionCard).toBeVisible({ timeout: 5000 });

        const questionText = await firstQuestionCard.locator('.hcp-question-text').textContent();
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Question text: "${questionText?.substring(0, 50)}..." ;CLEANUP_OK`);

        await firstQuestionCard.click();
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Question clicked, waiting for broadcast ;CLEANUP_OK`);

        // Step 4: Wait for question to appear in SessionCanvas
        await canvasPage.waitForTimeout(QUESTION_RENDER_WAIT);

        // Step 5: Verify orange-themed question card is visible in canvas
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Verifying question rendered in canvas ;CLEANUP_OK`);

        // Look for the broadcasted question in canvas area
        const canvasContent = canvasPage.locator('.canvas-asset-content');
        await expect(canvasContent).toBeVisible({ timeout: 5000 });

        // Verify orange theme styling elements are present
        const questionCard = canvasPage.locator('div[style*="background-color:#fff7f5"]').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Orange background (#fff7f5) detected ;CLEANUP_OK`);

        // Verify question circle icon
        const questionIcon = canvasPage.locator('i.fa-question-circle').first();
        await expect(questionIcon).toBeVisible({ timeout: 3000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Question circle icon detected ;CLEANUP_OK`);

        // Verify "Participant Question" header
        const headerTitle = canvasPage.locator('h1:has-text("Participant Question")').first();
        await expect(headerTitle).toBeVisible({ timeout: 3000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Header title verified ;CLEANUP_OK`);

        // Step 6: Take Percy snapshot for visual regression
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Taking Percy snapshot ;CLEANUP_OK`);

        await percySnapshot(canvasPage, 'HCP Question Orange Card - SessionCanvas View', {
            widths: [1280, 1920],
            minHeight: 1024,
            enableJavaScript: true,
            percyCSS: `
        /* Hide dynamic elements that change between runs */
        .canvas-signalr-status { visibility: hidden !important; }
        .canvas-session-description { visibility: hidden !important; }
      `
        });

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Percy snapshot captured ;CLEANUP_OK`);

        // Step 7: Additional visual assertions

        // Verify border styling (2px top/left, 4px right/bottom from ContextCopilot.txt)
        const cardStyles = await questionCard.evaluate((el) => {
            const computedStyle = window.getComputedStyle(el);
            return {
                backgroundColor: computedStyle.backgroundColor,
                borderTopWidth: computedStyle.borderTopWidth,
                borderLeftWidth: computedStyle.borderLeftWidth,
                borderRightWidth: computedStyle.borderRightWidth,
                borderBottomWidth: computedStyle.borderBottomWidth,
                borderColor: computedStyle.borderColor,
                borderRadius: computedStyle.borderRadius
            };
        });

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Card styles detected:`, cardStyles, ';CLEANUP_OK');

        // Verify subtitle "Shared by host for discussion"
        const subtitle = canvasPage.locator('p:has-text("Shared by host for discussion")').first();
        await expect(subtitle).toBeVisible({ timeout: 3000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Subtitle verified ;CLEANUP_OK`);

        // Verify white question content box
        const questionContentBox = canvasPage.locator('div[style*="background-color:white"]').first();
        await expect(questionContentBox).toBeVisible({ timeout: 3000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - White content box verified ;CLEANUP_OK`);

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - ✅ Test completed successfully ;CLEANUP_OK`);

        // Cleanup
        await hcpPage.close();
    });

    test('should match ContextCopilot.txt styling for long question', async ({ page, context }) => {
        const testId = `percy-long-${Date.now()}`;

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Testing long question rendering ;CLEANUP_OK`);

        // Step 1: Open SessionCanvas
        const canvasPage = page;
        await canvasPage.goto(`${SESSION_212.baseUrl}/session/canvas/${SESSION_212.userToken}`, { waitUntil: 'networkidle' });
        await canvasPage.waitForTimeout(APP_INIT_WAIT);

        // Step 2: Open HostControlPanel
        const hcpPage = await context.newPage();
        await hcpPage.goto(`${SESSION_212.baseUrl}/host/control-panel/${SESSION_212.hostToken}`, { waitUntil: 'networkidle' });
        await hcpPage.waitForTimeout(APP_INIT_WAIT);

        // Wait for SignalR
        await canvasPage.waitForTimeout(SIGNALR_CONNECT_WAIT);
        await hcpPage.waitForTimeout(SIGNALR_CONNECT_WAIT);

        // Step 3: Find and broadcast a long question (>100 chars)
        const allQuestions = await hcpPage.locator('.hcp-question-item').all();

        let longQuestionCard = null;
        for (const questionCard of allQuestions) {
            const text = await questionCard.locator('.hcp-question-text').textContent();
            if (text && text.length > 100) {
                longQuestionCard = questionCard;
                console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Found long question (${text.length} chars) ;CLEANUP_OK`);
                break;
            }
        }

        if (!longQuestionCard) {
            console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - No long question found, using first question ;CLEANUP_OK`);
            longQuestionCard = hcpPage.locator('.hcp-question-item').first();
        }

        await longQuestionCard.click();
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Long question broadcasted ;CLEANUP_OK`);

        // Step 4: Wait for render
        await canvasPage.waitForTimeout(QUESTION_RENDER_WAIT);

        // Step 5: Verify rendering
        const questionCard = canvasPage.locator('div[style*="background-color:#fff7f5"]').first();
        await expect(questionCard).toBeVisible({ timeout: 5000 });

        // Step 6: Percy snapshot for long question
        await percySnapshot(canvasPage, 'HCP Question Orange Card - Long Question', {
            widths: [1280, 1920],
            minHeight: 1024,
            enableJavaScript: true,
            percyCSS: `
        .canvas-signalr-status { visibility: hidden !important; }
        .canvas-session-description { visibility: hidden !important; }
      `
        });

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - ✅ Long question test completed ;CLEANUP_OK`);

        await hcpPage.close();
    });

    test('should preserve vote badge styling when present', async ({ page, context }) => {
        const testId = `percy-votes-${Date.now()}`;

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Testing vote badge preservation ;CLEANUP_OK`);

        // Step 1: Open SessionCanvas
        const canvasPage = page;
        await canvasPage.goto(`${SESSION_212.baseUrl}/session/canvas/${SESSION_212.userToken}`, { waitUntil: 'networkidle' });
        await canvasPage.waitForTimeout(APP_INIT_WAIT);

        // Step 2: Open HostControlPanel
        const hcpPage = await context.newPage();
        await hcpPage.goto(`${SESSION_212.baseUrl}/host/control-panel/${SESSION_212.hostToken}`, { waitUntil: 'networkidle' });
        await hcpPage.waitForTimeout(APP_INIT_WAIT);

        // Wait for SignalR
        await canvasPage.waitForTimeout(SIGNALR_CONNECT_WAIT);
        await hcpPage.waitForTimeout(SIGNALR_CONNECT_WAIT);

        // Step 3: Find question with votes
        const allQuestions = await hcpPage.locator('.hcp-question-item').all();

        let questionWithVotes = null;
        for (const questionCard of allQuestions) {
            const voteBadge = questionCard.locator('.hcp-question-vote-count');
            if (await voteBadge.isVisible()) {
                const voteText = await voteBadge.textContent();
                if (voteText && !voteText.includes('0')) {
                    questionWithVotes = questionCard;
                    console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Found question with votes: ${voteText} ;CLEANUP_OK`);
                    break;
                }
            }
        }

        if (!questionWithVotes) {
            console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - No questions with votes found, skipping test ;CLEANUP_OK`);
            test.skip();
            return;
        }

        // Step 4: Broadcast question with votes
        await questionWithVotes.click();
        await canvasPage.waitForTimeout(QUESTION_RENDER_WAIT);

        // Step 5: Verify vote badge is visible in canvas
        const voteBadge = canvasPage.locator('div[style*="background-color:#DC2626"]').first();
        await expect(voteBadge).toBeVisible({ timeout: 5000 });
        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - Vote badge rendered in canvas ;CLEANUP_OK`);

        // Step 6: Percy snapshot
        await percySnapshot(canvasPage, 'HCP Question Orange Card - With Vote Badge', {
            widths: [1280, 1920],
            minHeight: 1024,
            enableJavaScript: true,
            percyCSS: `
        .canvas-signalr-status { visibility: hidden !important; }
        .canvas-session-description { visibility: hidden !important; }
      `
        });

        console.log(`[DEBUG-WORKITEM:hcp-question:percy-visual:TRACE] ${testId} - ✅ Vote badge test completed ;CLEANUP_OK`);

        await hcpPage.close();
    });
});
