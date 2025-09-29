import { Browser, expect, Page, test } from '@playwright/test';

test.describe('Phase 4: Regression Testing - Existing Features', () => {
    let hostPage: Page;
    let canvasPageA: Page;
    let canvasPageB: Page;
    let browser: Browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;
    });

    test.beforeEach(async () => {
        const hostContext = await browser.newContext();
        const canvasContextA = await browser.newContext();
        const canvasContextB = await browser.newContext();

        hostPage = await hostContext.newPage();
        canvasPageA = await canvasContextA.newPage();
        canvasPageB = await canvasContextB.newPage();

        await hostPage.goto('http://localhost:9091/host-control-panel');
        await canvasPageA.goto('http://localhost:9091/session-canvas');
        await canvasPageB.goto('http://localhost:9091/session-canvas');

        await hostPage.waitForLoadState('networkidle');
        await canvasPageA.waitForLoadState('networkidle');
        await canvasPageB.waitForLoadState('networkidle');
    });

    test('Phase 4.1: Question Broadcasting System Integrity', async () => {
        const sessionId = '44401';

        // All join same session
        await hostPage.fill('[data-testid="session-id-input"]', sessionId);
        await hostPage.click('[data-testid="start-session-btn"]');

        await canvasPageA.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageA.click('[data-testid="join-session-btn"]');

        await canvasPageB.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageB.click('[data-testid="join-session-btn"]');

        // Wait for connections to establish
        await hostPage.waitForTimeout(2000);

        // User A submits a question
        const questionText = 'Phase 4 test question from User A';
        await canvasPageA.fill('[data-testid="question-input"]', questionText);
        await canvasPageA.click('[data-testid="submit-question-btn"]');

        // Verify question appears in host control panel
        await expect(hostPage.locator('[data-testid="questions-list"]'))
            .toContainText(questionText, { timeout: 5000 });

        // Host responds to question
        await hostPage.click(`[data-testid="answer-question-btn"]:has-text("${questionText.substring(0, 20)}")`);

        // Verify response appears in canvas A
        await expect(canvasPageA.locator('[data-testid="question-responses"]'))
            .toContainText('Answered', { timeout: 5000 });

        // User B submits different question
        const questionTextB = 'Phase 4 test question from User B';
        await canvasPageB.fill('[data-testid="question-input"]', questionTextB);
        await canvasPageB.click('[data-testid="submit-question-btn"]');

        // Verify both questions appear in host panel
        await expect(hostPage.locator('[data-testid="questions-list"]'))
            .toContainText(questionTextB, { timeout: 5000 });

        const questionCount = await hostPage.locator('[data-testid="question-item"]').count();
        expect(questionCount).toBeGreaterThanOrEqual(2);
    });

    test('Phase 4.2: Session Management Integrity', async () => {
        const sessionId = '44402';

        // Host starts session
        await hostPage.fill('[data-testid="session-id-input"]', sessionId);
        await hostPage.click('[data-testid="start-session-btn"]');

        // User A joins
        await canvasPageA.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageA.click('[data-testid="join-session-btn"]');

        // Verify user count updates in host
        await expect(hostPage.locator('[data-testid="participant-count"]'))
            .toContainText('1', { timeout: 5000 });

        // User B joins
        await canvasPageB.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageB.click('[data-testid="join-session-btn"]');

        // Verify user count updates to 2
        await expect(hostPage.locator('[data-testid="participant-count"]'))
            .toContainText('2', { timeout: 5000 });

        // User A leaves session
        await canvasPageA.click('[data-testid="leave-session-btn"]');

        // Verify count decreases
        await expect(hostPage.locator('[data-testid="participant-count"]'))
            .toContainText('1', { timeout: 5000 });

        // Verify User B still connected
        await expect(canvasPageB.locator('[data-testid="connection-status"]'))
            .toContainText('Connected');
    });

    test('Phase 4.3: Cross-Session Isolation', async () => {
        const sessionIdA = '44403';
        const sessionIdB = '44404';

        // Set up separate sessions
        await hostPage.fill('[data-testid="session-id-input"]', sessionIdA);
        await hostPage.click('[data-testid="start-session-btn"]');

        await canvasPageA.fill('[data-testid="session-id-input"]', sessionIdA);
        await canvasPageA.click('[data-testid="join-session-btn"]');

        await canvasPageB.fill('[data-testid="session-id-input"]', sessionIdB);
        await canvasPageB.click('[data-testid="join-session-btn"]');

        // User A submits question in session A
        const questionA = 'Question for session A only';
        await canvasPageA.fill('[data-testid="question-input"]', questionA);
        await canvasPageA.click('[data-testid="submit-question-btn"]');

        // Verify question appears in host (session A)
        await expect(hostPage.locator('[data-testid="questions-list"]'))
            .toContainText(questionA, { timeout: 5000 });

        // Verify question does NOT appear in canvas B (session B)
        await canvasPageB.waitForTimeout(3000); // Wait to ensure no message received
        await expect(canvasPageB.locator('[data-testid="question-responses"]'))
            .not.toContainText(questionA);

        // Test asset sharing isolation
        await hostPage.click('[data-testid="share-ayah-1-1"]');

        // Verify content appears in canvas A
        await expect(canvasPageA.locator('[data-testid="shared-content-area"]'))
            .not.toBeEmpty({ timeout: 5000 });

        // Verify content does NOT appear in canvas B
        await canvasPageB.waitForTimeout(3000);
        await expect(canvasPageB.locator('[data-testid="shared-content-area"]'))
            .toBeEmpty();
    });

    test('Phase 4.4: SignalR Connection State Management', async () => {
        const sessionId = '44405';

        // Test connection establishment
        await hostPage.fill('[data-testid="session-id-input"]', sessionId);
        await hostPage.click('[data-testid="start-session-btn"]');

        await canvasPageA.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageA.click('[data-testid="join-session-btn"]');

        // Verify connection indicators
        await expect(hostPage.locator('[data-testid="signalr-status"]'))
            .toContainText('Connected', { timeout: 5000 });

        await expect(canvasPageA.locator('[data-testid="connection-status"]'))
            .toContainText('Connected', { timeout: 5000 });

        // Test reconnection after temporary disconnect
        await canvasPageA.evaluate(() => {
            // Simulate temporary network issue
            if ((window as any).hubConnection) {
                (window as any).hubConnection.stop();
            }
        });

        // Wait for reconnection
        await canvasPageA.waitForTimeout(5000);

        // Verify reconnection works
        await expect(canvasPageA.locator('[data-testid="connection-status"]'))
            .toContainText('Connected', { timeout: 10000 });

        // Test functionality still works after reconnection
        const testQuestion = 'Post-reconnection test question';
        await canvasPageA.fill('[data-testid="question-input"]', testQuestion);
        await canvasPageA.click('[data-testid="submit-question-btn"]');

        await expect(hostPage.locator('[data-testid="questions-list"]'))
            .toContainText(testQuestion, { timeout: 5000 });
    });

    test('Phase 4.5: Performance Regression Check', async () => {
        const sessionId = '44406';

        // Measure baseline performance
        const startTime = Date.now();

        await hostPage.fill('[data-testid="session-id-input"]', sessionId);
        await hostPage.click('[data-testid="start-session-btn"]');

        await canvasPageA.fill('[data-testid="session-id-input"]', sessionId);
        await canvasPageA.click('[data-testid="join-session-btn"]');

        const connectionTime = Date.now() - startTime;
        expect(connectionTime).toBeLessThan(5000); // Should connect within 5 seconds

        // Test rapid message processing
        const messageStartTime = Date.now();

        // Send 5 rapid questions
        for (let i = 1; i <= 5; i++) {
            await canvasPageA.fill('[data-testid="question-input"]', `Rapid question ${i}`);
            await canvasPageA.click('[data-testid="submit-question-btn"]');
            await canvasPageA.waitForTimeout(100); // Brief pause between sends
        }

        // Verify all questions appear within reasonable time
        await expect(hostPage.locator('[data-testid="question-item"]'))
            .toHaveCount(5, { timeout: 10000 });

        const processingTime = Date.now() - messageStartTime;
        expect(processingTime).toBeLessThan(15000); // Should process within 15 seconds

        // Test rapid asset sharing
        const shareStartTime = Date.now();

        for (let i = 1; i <= 3; i++) {
            await hostPage.click(`[data-testid="share-ayah-1-${i}"]`);
            await hostPage.waitForTimeout(200);
        }

        // Verify content updates efficiently
        const shareProcessingTime = Date.now() - shareStartTime;
        expect(shareProcessingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test.afterEach(async () => {
        await hostPage?.close();
        await canvasPageA?.close();
        await canvasPageB?.close();
    });
});