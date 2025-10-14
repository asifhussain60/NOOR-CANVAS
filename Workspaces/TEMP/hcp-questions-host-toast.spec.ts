/**
 * Playwright Test: Host Toast Notification on Question Submit
 * 
 * Purpose: Verify that when a participant submits a question, the host sees a toast notification
 *          showing the participant's name and question text.
 * 
 * Test Scenario:
 * 1. Open HostControlPanel in browser 1 (host)
 * 2. Open SessionCanvas in browser 2 (participant: Peter Parker)
 * 3. Participant submits a question
 * 4. Verify toast appears ONLY in host browser (not participant)
 * 5. Verify toast contains participant name "Peter Parker"
 * 6. Verify toast contains question text
 * 
 * Test Data:
 * - Session ID: 212 (canonical test session)
 * - Host Token: PQ9N5YWW
 * - User Token: KJAHA99L (Peter Parker, b59e3dca-9330-40f5-9de8-9a5350fd2d6a)
 * - Base URL: https://localhost:9091
 * 
 * Expected Outcome:
 * - Host sees toast: "Peter Parker asked: "{question text}""
 * - Participant does NOT see this toast
 * - Toast appears in bottom-right corner (toast-bottom-right)
 * - Toast has title "New Question Received"
 * - Toast type is "info" (blue)
 * 
 * Debug Logging:
 * - [DEBUG-WORKITEM:hcp-questions:toast:TRACE] markers in C# logs
 * - Console logs in browser for showNoorToast function calls
 */

import { BrowserContext, expect, Page, test } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://localhost:9091';
const SESSION_ID = 212;
const HOST_TOKEN = 'PQ9N5YWW';
const USER_TOKEN = 'KJAHA99L';
const PARTICIPANT_NAME = 'Peter Parker';
const PARTICIPANT_GUID = 'b59e3dca-9330-40f5-9de8-9a5350fd2d6a';

// Test question text
const TEST_QUESTION = `What is the importance of gratitude in Islam? (Test ${Date.now()})`;

test.describe('Host Toast Notification - Question Submit', () => {
    let hostContext: BrowserContext;
    let participantContext: BrowserContext;
    let hostPage: Page;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        // Create isolated browser contexts for multi-user testing
        hostContext = await browser.newContext({
            ignoreHTTPSErrors: true, // Accept self-signed cert
        });

        participantContext = await browser.newContext({
            ignoreHTTPSErrors: true,
        });

        // Create pages
        hostPage = await hostContext.newPage();
        participantPage = await participantContext.newPage();

        // Enable console logging for debugging
        hostPage.on('console', msg => {
            if (msg.text().includes('DEBUG-WORKITEM:hcp-questions:toast') || msg.text().includes('showNoorToast')) {
                console.log(`[HOST CONSOLE] ${msg.text()}`);
            }
        });

        participantPage.on('console', msg => {
            if (msg.text().includes('DEBUG-WORKITEM:hcp-questions:toast') || msg.text().includes('showNoorToast')) {
                console.log(`[PARTICIPANT CONSOLE] ${msg.text()}`);
            }
        });
    });

    test.afterAll(async () => {
        await hostContext?.close();
        await participantContext?.close();
    });

    test('Host sees toast with participant name when question submitted', async () => {
        console.log('\n🧪 TEST START: Host Toast Notification\n');

        // STEP 1: Navigate host to HostControlPanel
        console.log('📍 STEP 1: Opening HostControlPanel...');
        const hostUrl = `${BASE_URL}/host/${HOST_TOKEN}`;
        await hostPage.goto(hostUrl, { waitUntil: 'networkidle' });

        // Wait for page to load
        await hostPage.waitForSelector('h1:has-text("Host Control Panel")', { timeout: 10000 });
        console.log('✅ HostControlPanel loaded for host');

        // Verify Q&A panel is visible
        const qaPanel = hostPage.locator('.host-qa-panel');
        await expect(qaPanel).toBeVisible();
        console.log('✅ Q&A panel visible in HostControlPanel');

        // STEP 2: Navigate participant to SessionCanvas
        console.log('\n📍 STEP 2: Opening SessionCanvas for participant...');
        const participantUrl = `${BASE_URL}/session/canvas/${USER_TOKEN}`;
        await participantPage.goto(participantUrl, { waitUntil: 'networkidle' });

        // Wait for participant view to load
        await participantPage.waitForSelector('.session-canvas-container', { timeout: 10000 });
        console.log('✅ SessionCanvas loaded for participant (Peter Parker)');

        // STEP 3: Setup toast detection BEFORE submitting question
        console.log('\n📍 STEP 3: Setting up toast detection...');

        // Monitor toast container in host browser
        const hostToastPromise = hostPage.waitForSelector('.toast-bottom-right .toast', {
            timeout: 15000,
            state: 'visible'
        }).catch(() => null); // Don't fail if toast doesn't appear, we'll check explicitly

        // STEP 4: Submit question as participant
        console.log('\n📍 STEP 4: Participant submitting question...');

        // Find and fill question input
        const questionInput = participantPage.locator('textarea[placeholder*="question" i], input[placeholder*="question" i]').first();
        await questionInput.waitFor({ state: 'visible', timeout: 5000 });
        await questionInput.fill(TEST_QUESTION);
        console.log(`📝 Question text entered: "${TEST_QUESTION}"`);

        // Find and click submit button
        const submitButton = participantPage.locator('button:has-text("Submit"), button:has-text("Ask")').first();
        await submitButton.click();
        console.log('🖱️ Submit button clicked');

        // Wait for API call to complete
        await participantPage.waitForResponse(
            response => response.url().includes('/api/Question/Submit') && response.status() === 200,
            { timeout: 10000 }
        );
        console.log('✅ Question submitted to API successfully');

        // STEP 5: Verify toast appears in HOST browser
        console.log('\n📍 STEP 5: Verifying toast in host browser...');

        // Wait a moment for SignalR broadcast to propagate
        await hostPage.waitForTimeout(2000);

        // Check if toast appeared
        const hostToast = await hostToastPromise;

        if (!hostToast) {
            // Toast didn't appear - fail test with diagnostic info
            console.error('❌ TOAST NOT FOUND IN HOST BROWSER');

            // Check if toastr is loaded
            const toastrLoaded = await hostPage.evaluate(() => typeof (window as any).toastr !== 'undefined');
            console.log(`🔍 Toastr library loaded: ${toastrLoaded}`);

            // Check if showNoorToast exists
            const showNoorToastExists = await hostPage.evaluate(() => typeof (window as any).showNoorToast === 'function');
            console.log(`🔍 showNoorToast function exists: ${showNoorToastExists}`);

            // Get console logs that might indicate why toast failed
            console.log('🔍 Check browser console logs above for DEBUG-WORKITEM:hcp-questions:toast:TRACE markers');

            throw new Error('Toast notification did not appear in host browser after question submission');
        }

        console.log('✅ Toast element found in host browser');

        // STEP 6: Verify toast content
        console.log('\n📍 STEP 6: Verifying toast content...');

        // Verify toast title
        const toastTitle = hostPage.locator('.toast-title');
        await expect(toastTitle).toContainText('New Question Received');
        console.log('✅ Toast title correct: "New Question Received"');

        // Verify toast message contains participant name
        const toastMessage = hostPage.locator('.toast-message');
        await expect(toastMessage).toContainText(PARTICIPANT_NAME);
        console.log(`✅ Toast message contains participant name: "${PARTICIPANT_NAME}"`);

        // Verify toast message contains question text
        await expect(toastMessage).toContainText(TEST_QUESTION);
        console.log(`✅ Toast message contains question text`);

        // Verify toast is info type (blue)
        const toastContainer = hostPage.locator('.toast-info');
        await expect(toastContainer).toBeVisible();
        console.log('✅ Toast type is "info" (blue)');

        // STEP 7: Verify toast does NOT appear in participant browser
        console.log('\n📍 STEP 7: Verifying toast does NOT appear in participant browser...');

        const participantToast = participantPage.locator('.toast-bottom-right .toast');
        const participantToastCount = await participantToast.count();

        if (participantToastCount > 0) {
            console.error('❌ Toast incorrectly appeared in participant browser');
            throw new Error('Toast should only appear for host, not participant');
        }

        console.log('✅ Toast correctly NOT shown to participant');

        // STEP 8: Verify question appears in host Q&A panel
        console.log('\n📍 STEP 8: Verifying question appears in Q&A panel...');

        const questionCard = hostPage.locator('.host-qa-panel').locator(`text=${TEST_QUESTION}`);
        await expect(questionCard).toBeVisible({ timeout: 5000 });
        console.log('✅ Question visible in host Q&A panel');

        console.log('\n🎉 TEST PASSED: All assertions successful\n');
    });

    test('Verify toast styling and position', async () => {
        console.log('\n🧪 TEST START: Toast Styling Verification\n');

        // Navigate to host panel
        const hostUrl = `${BASE_URL}/host/${HOST_TOKEN}`;
        await hostPage.goto(hostUrl, { waitUntil: 'networkidle' });
        await hostPage.waitForSelector('h1:has-text("Host Control Panel")');

        // Navigate participant to SessionCanvas
        const participantUrl = `${BASE_URL}/session/canvas/${USER_TOKEN}`;
        await participantPage.goto(participantUrl, { waitUntil: 'networkidle' });
        await participantPage.waitForSelector('.session-canvas-container');

        // Submit a question
        const questionText = `Test toast styling ${Date.now()}`;
        const questionInput = participantPage.locator('textarea[placeholder*="question" i], input[placeholder*="question" i]').first();
        await questionInput.fill(questionText);

        const submitButton = participantPage.locator('button:has-text("Submit"), button:has-text("Ask")').first();
        await submitButton.click();

        // Wait for toast to appear
        await hostPage.waitForSelector('.toast-bottom-right .toast', { timeout: 15000 });

        // Verify toast container position (bottom-right)
        const toastContainer = hostPage.locator('.toast-bottom-right');
        await expect(toastContainer).toBeVisible();
        console.log('✅ Toast container positioned at bottom-right');

        // Verify toast has progress bar
        const progressBar = hostPage.locator('.toast-progress');
        await expect(progressBar).toBeVisible();
        console.log('✅ Toast progress bar visible');

        // Verify toast has close button
        const closeButton = hostPage.locator('.toast-close-button');
        await expect(closeButton).toBeVisible();
        console.log('✅ Toast close button visible');

        console.log('\n🎉 TEST PASSED: Toast styling verified\n');
    });
});
