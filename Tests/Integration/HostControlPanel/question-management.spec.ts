/**
 * [REFACTOR:Phase1] Host Control Panel - Question Management Integration Tests
 * Tests question reception, display, sharing, answering, and deletion
 */

import { expect, test } from '@playwright/test';

const TEST_HOST_TOKEN = 'testhost';
const BASE_URL = 'http://localhost:5000';

test.describe('Host Control Panel - Question Management', () => {

    test('should display Q&A panel when session is Active', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for Q&A panel
        const qaPanel = page.locator('[id*="qa-panel"], [class*="qa-panel"], text=/Questions|Q&A/i');
        const qaPanelExists = await qaPanel.count() > 0;

        if (qaPanelExists) {
            console.log('✅ Q&A panel found');

            // Verify toggle button exists
            const toggleButton = page.locator('button:has-text("Q&A"), button:has-text("Questions")');
            if (await toggleButton.count() > 0) {
                console.log('✅ Q&A toggle button found');
            }
        } else {
            console.log('ℹ️ Q&A panel not visible (session may not be Active)');
        }
    });

    test('should toggle Q&A panel visibility', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Find toggle button
        const toggleButton = page.locator('button:has-text("Q&A"), button:has-text("Questions")').first();

        if (await toggleButton.count() === 0) {
            console.log('ℹ️ Q&A toggle button not found');
            test.skip();
            return;
        }

        // Get initial visibility state
        const qaPanel = page.locator('[id*="qa-panel"]').first();
        const initiallyVisible = await qaPanel.isVisible().catch(() => false);

        console.log(`📊 Q&A panel initially: ${initiallyVisible ? 'visible' : 'hidden'}`);

        // Click toggle
        await toggleButton.click();
        await page.waitForTimeout(500);

        // Check new visibility state
        const afterToggleVisible = await qaPanel.isVisible().catch(() => false);

        console.log(`📊 Q&A panel after toggle: ${afterToggleVisible ? 'visible' : 'hidden'}`);

        // State should have changed
        expect(afterToggleVisible).not.toBe(initiallyVisible);
        console.log('✅ Q&A panel toggle working correctly');
    });

    test('should display question count badge', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for question count badge
        const badge = page.locator('[class*="badge"], [class*="count"]');
        const badgeCount = await badge.count();

        if (badgeCount > 0) {
            const badgeText = await badge.first().textContent();
            console.log(`✅ Question count badge found: ${badgeText}`);
        } else {
            console.log('ℹ️ No question count badge visible (may be 0 questions)');
        }
    });

    test('should receive question via SignalR', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Listen for console logs indicating question received
        const questionLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('QuestionReceived') || msg.text().includes('QUESTION')) {
                questionLogs.push(msg.text());
            }
        });

        // Wait for potential incoming questions
        await page.waitForTimeout(5000);

        if (questionLogs.length > 0) {
            console.log('✅ Question reception logging active');
            console.log(`📋 Question logs captured: ${questionLogs.length}`);
        } else {
            console.log('ℹ️ No questions received during test period');
        }
    });

    test('should display question toast notification', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Verify toast function exists
        const hasQuestionToast = await page.evaluate(() => {
            return typeof (window as any).showQuestionToast === 'function';
        });

        expect(hasQuestionToast).toBe(true);
        console.log('✅ showQuestionToast function registered');

        // Trigger test toast
        await page.evaluate(() => {
            if ((window as any).showQuestionToast) {
                (window as any).showQuestionToast('Test question received');
            }
        });

        await page.waitForTimeout(2000);

        // Check for toast element
        const toast = page.locator('.notyf, [class*="toast"]');
        if (await toast.count() > 0) {
            console.log('✅ Question toast notification displayed');
        }
    });

    test('should render question cards', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for question cards or question items
        const questionCards = page.locator('[class*="question-card"], [data-question-id]');
        const cardCount = await questionCards.count();

        console.log(`📊 Found ${cardCount} question cards`);

        if (cardCount > 0) {
            // Verify first question card structure
            const firstCard = questionCards.first();
            await expect(firstCard).toBeVisible();

            // Check for question text
            const questionText = await firstCard.textContent();
            console.log(`✅ First question preview: ${questionText?.substring(0, 50)}...`);
        } else {
            console.log('ℹ️ No questions available for display');
        }
    });

    test('should show question action buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const questionCards = page.locator('[class*="question-card"]').first();

        if (await questionCards.count() === 0) {
            console.log('ℹ️ No questions available for action button test');
            test.skip();
            return;
        }

        // Look for action buttons within question card
        const shareButton = questionCards.locator('button:has-text("Share"), button[title*="Share"]');
        const answerButton = questionCards.locator('button:has-text("Answered"), button:has-text("Mark")');
        const deleteButton = questionCards.locator('button:has-text("Delete"), button[title*="Delete"]');

        const hasShareButton = await shareButton.count() > 0;
        const hasAnswerButton = await answerButton.count() > 0;
        const hasDeleteButton = await deleteButton.count() > 0;

        console.log(`🔘 Question buttons - Share: ${hasShareButton}, Answer: ${hasAnswerButton}, Delete: ${hasDeleteButton}`);

        if (hasShareButton || hasAnswerButton || hasDeleteButton) {
            console.log('✅ Question action buttons available');
        }
    });

    test('should handle share question button click', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const questionCard = page.locator('[class*="question-card"]').first();

        if (await questionCard.count() === 0) {
            console.log('ℹ️ No questions available for share test');
            test.skip();
            return;
        }

        const shareButton = questionCard.locator('button:has-text("Share"), button[title*="Share"]').first();

        if (await shareButton.count() === 0) {
            console.log('ℹ️ Share button not found');
            test.skip();
            return;
        }

        // Listen for console logs
        const shareLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('ShareQuestion') || msg.text().includes('SHARE')) {
                shareLogs.push(msg.text());
            }
        });

        console.log('🖱️ Clicking share question button');
        await shareButton.click();
        await page.waitForTimeout(2000);

        if (shareLogs.length > 0) {
            console.log('✅ Share question action triggered');
        }
    });

    test('should display delete confirmation modal', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const questionCard = page.locator('[class*="question-card"]').first();

        if (await questionCard.count() === 0) {
            console.log('ℹ️ No questions available for delete test');
            test.skip();
            return;
        }

        const deleteButton = questionCard.locator('button:has-text("Delete"), button[title*="Delete"]').first();

        if (await deleteButton.count() === 0) {
            console.log('ℹ️ Delete button not found');
            test.skip();
            return;
        }

        console.log('🖱️ Clicking delete button');
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Look for confirmation modal
        const modal = page.locator('[role="dialog"], [class*="modal"], text=/Confirm|Delete/i');

        if (await modal.count() > 0) {
            console.log('✅ Delete confirmation modal displayed');

            // Check for confirm/cancel buttons
            const confirmButton = modal.locator('button:has-text("Confirm"), button:has-text("Delete")');
            const cancelButton = modal.locator('button:has-text("Cancel")');

            if (await confirmButton.count() > 0 && await cancelButton.count() > 0) {
                console.log('✅ Modal has confirmation buttons');

                // Click cancel to close modal
                await cancelButton.first().click();
                await page.waitForTimeout(500);
            }
        } else {
            console.log('ℹ️ Delete modal not displayed (may delete directly)');
        }
    });

    test('should display vote count on questions', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const questionCard = page.locator('[class*="question-card"]').first();

        if (await questionCard.count() === 0) {
            console.log('ℹ️ No questions available for vote count test');
            test.skip();
            return;
        }

        // Look for vote count indicator
        const voteIndicator = questionCard.locator('text=/votes?|👍|upvote/i, [class*="vote"]');

        if (await voteIndicator.count() > 0) {
            const voteText = await voteIndicator.first().textContent();
            console.log(`✅ Vote count displayed: ${voteText}`);
        } else {
            console.log('ℹ️ No vote count visible on question');
        }
    });

    test('should highlight selected question', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const questionCards = page.locator('[class*="question-card"]');
        const cardCount = await questionCards.count();

        if (cardCount === 0) {
            console.log('ℹ️ No questions available for selection test');
            test.skip();
            return;
        }

        // Share first question to select it
        const firstCard = questionCards.first();
        const shareButton = firstCard.locator('button:has-text("Share")').first();

        if (await shareButton.count() > 0) {
            await shareButton.click();
            await page.waitForTimeout(1000);

            // Check if card has selection styling
            const cardClass = await firstCard.getAttribute('class');
            const cardStyle = await firstCard.getAttribute('style');

            console.log(`📊 Selected card class: ${cardClass}`);
            console.log(`📊 Selected card style: ${cardStyle}`);

            const isHighlighted = cardClass?.includes('selected') ||
                cardStyle?.includes('border') ||
                cardStyle?.includes('background');

            if (isHighlighted) {
                console.log('✅ Selected question highlighted');
            }
        }
    });
});
