import { BrowserContext, expect, Page, test } from '@playwright/test';

test.describe('Participant Name Broadcasting to Host Control Panel', () => {
    let context: BrowserContext;
    let hostPage: Page;
    let participantPage: Page;

    const sessionToken = 'KJAHA99L'; // Known test session token
    const hostToken = 'PQ9N5YWW';   // Known host token for session 212

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('should broadcast and display participant names correctly in Host Control Panel', async () => {
        // Create two pages: one for host, one for participant
        hostPage = await context.newPage();
        participantPage = await context.newPage();

        // Step 1: Navigate host to Host Control Panel
        console.log('Step 1: Opening Host Control Panel...');
        await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`);

        // Wait for host panel to load
        await hostPage.waitForSelector('h1', { timeout: 10000 });
        await expect(hostPage.locator('h1')).toContainText('Host Control Panel');

        // Step 2: Navigate participant to session canvas
        console.log('Step 2: Opening Participant Session Canvas...');
        await participantPage.goto(`https://localhost:9091/session/canvas/${sessionToken}`);

        // Wait for participant canvas to load
        await participantPage.waitForSelector('h1', { timeout: 10000 });

        // Step 3: Set participant name
        const participantName = `TestUser_${Date.now()}`;
        console.log(`Step 3: Setting participant name: ${participantName}`);

        // Check if there's a name input field and set it
        const nameInput = participantPage.locator('input[placeholder*="name" i], input[id*="name" i], input[name*="name" i]').first();
        if (await nameInput.isVisible({ timeout: 5000 })) {
            await nameInput.fill(participantName);
            await nameInput.press('Enter');
            await participantPage.waitForTimeout(1000);
        }

        // Step 4: Submit a question from participant
        console.log('Step 4: Submitting question from participant...');
        const questionText = `Test question from ${participantName} at ${new Date().toISOString()}`;

        // Look for question input field
        const questionInput = participantPage.locator('input[placeholder*="question" i], textarea[placeholder*="question" i], input[type="text"]').first();
        await expect(questionInput).toBeVisible({ timeout: 10000 });

        await questionInput.fill(questionText);

        // Find and click submit button
        const submitButton = participantPage.locator('button:has-text("Submit"), button:has-text("Send"), button[type="submit"]').first();
        await expect(submitButton).toBeVisible();

        // Listen for network response to confirm submission
        const questionSubmissionPromise = participantPage.waitForResponse(
            response => response.url().includes('/api/Question/Submit') && response.status() === 200,
            { timeout: 15000 }
        );

        await submitButton.click();

        // Wait for successful submission
        await questionSubmissionPromise;
        console.log('✅ Question submitted successfully');

        // Step 5: Wait for question to appear in Host Control Panel
        console.log('Step 5: Checking Host Control Panel for question with participant name...');

        // Wait a moment for SignalR updates
        await hostPage.waitForTimeout(2000);

        // Look for the Questions & Answers section in Host Control Panel
        // The questions might be in a dedicated section or tab
        const questionsSection = hostPage.locator('[class*="question"], [id*="question"], h2:has-text("Questions"), h3:has-text("Questions")');

        if (await questionsSection.isVisible({ timeout: 5000 })) {
            console.log('Found questions section in Host Control Panel');
        }

        // Step 6: Verify participant name is displayed correctly
        console.log(`Step 6: Verifying participant name "${participantName}" is displayed...`);

        // Check for the question text and participant name
        // The participant name should appear either:
        // 1. Next to the question text
        // 2. In a "Asked by" field
        // 3. As part of the question display

        let participantNameFound = false;
        let questionFound = false;

        // Method 1: Look for the participant name anywhere on the host page
        try {
            // First check if our question text appears
            const questionElement = hostPage.locator(`text="${questionText}"`);
            if (await questionElement.isVisible({ timeout: 5000 })) {
                questionFound = true;
                console.log('✅ Question text found in Host Control Panel');

                // Look for participant name near the question
                const participantNameElement = hostPage.locator(`text="${participantName}"`);
                if (await participantNameElement.isVisible({ timeout: 2000 })) {
                    participantNameFound = true;
                    console.log(`✅ Participant name "${participantName}" found in Host Control Panel`);
                } else {
                    console.log(`❌ Participant name "${participantName}" NOT found in Host Control Panel`);

                    // Check if "Anonymous" or "undefined" is displayed instead
                    const anonymousElement = hostPage.locator('text="Anonymous"');
                    const undefinedElement = hostPage.locator('text="undefined"');

                    if (await anonymousElement.isVisible({ timeout: 1000 })) {
                        console.log('⚠️  Found "Anonymous" instead of participant name');
                    }

                    if (await undefinedElement.isVisible({ timeout: 1000 })) {
                        console.log('⚠️  Found "undefined" instead of participant name - THIS IS THE BUG');
                    }
                }
            } else {
                console.log('❌ Question text not found in Host Control Panel');
            }
        } catch (error) {
            console.log('Error checking for participant name:', error);
        }

        // Method 2: Check browser console for trace logs
        const hostConsoleMessages: string[] = [];
        hostPage.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info') {
                const text = msg.text();
                hostConsoleMessages.push(text);

                // Look for our trace logging
                if (text.includes('NOOR-QA-TRACE') || text.includes('HOST-QUESTIONS-TRACE')) {
                    console.log('Host Control Panel Trace Log:', text);
                }
            }
        });

        // Method 3: Check participant console for submission logs
        const participantConsoleMessages: string[] = [];
        participantPage.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info') {
                const text = msg.text();
                participantConsoleMessages.push(text);

                // Look for submission trace logs
                if (text.includes('NOOR-QA-SUBMIT-TRACE')) {
                    console.log('Participant Submission Trace Log:', text);
                }
            }
        });

        // Step 7: Force refresh Host Control Panel to trigger question loading
        console.log('Step 7: Refreshing Host Control Panel to trigger question loading...');
        await hostPage.reload();
        await hostPage.waitForTimeout(3000);

        // Step 8: Check again after refresh
        try {
            const questionElement = hostPage.locator(`text="${questionText}"`);
            if (await questionElement.isVisible({ timeout: 5000 })) {
                questionFound = true;
                console.log('✅ Question text found after refresh');

                const participantNameElement = hostPage.locator(`text="${participantName}"`);
                if (await participantNameElement.isVisible({ timeout: 2000 })) {
                    participantNameFound = true;
                    console.log(`✅ Participant name "${participantName}" found after refresh`);
                }
            }
        } catch (error) {
            console.log('Error checking after refresh:', error);
        }

        // Step 9: Take screenshots for debugging
        await hostPage.screenshot({
            path: `test-results/host-control-panel-${Date.now()}.png`,
            fullPage: true
        });

        await participantPage.screenshot({
            path: `test-results/participant-canvas-${Date.now()}.png`,
            fullPage: true
        });

        // Step 10: Capture network activity
        console.log('Step 10: Checking network activity for API calls...');

        // Monitor for GetQuestions API calls
        const getQuestionsPromise = hostPage.waitForResponse(
            response => response.url().includes('/api/question/session/') && response.request().method() === 'GET',
            { timeout: 5000 }
        ).catch(() => {
            console.log('⚠️  No GetQuestions API call detected - this might be the issue');
            return null;
        });

        // Trigger a manual refresh or action that should call GetQuestions
        await hostPage.keyboard.press('F5');
        await hostPage.waitForTimeout(2000);

        const getQuestionsResponse = await getQuestionsPromise;
        if (getQuestionsResponse) {
            console.log('✅ GetQuestions API called:', getQuestionsResponse.url());

            try {
                const responseBody = await getQuestionsResponse.json();
                console.log('GetQuestions API Response:', JSON.stringify(responseBody, null, 2));

                // Check if participant names are in the response
                if (responseBody.questions && Array.isArray(responseBody.questions)) {
                    responseBody.questions.forEach((q: any, index: number) => {
                        console.log(`Question ${index + 1}:`, {
                            text: q.text?.substring(0, 50) + '...',
                            userName: q.userName || 'MISSING',
                            userGuid: q.userGuid || 'MISSING'
                        });
                    });
                }
            } catch (error) {
                console.log('Error parsing GetQuestions response:', error);
            }
        }

        // Step 11: Assert test results
        console.log('\n=== TEST RESULTS ===');
        console.log(`Question found in Host Control Panel: ${questionFound}`);
        console.log(`Participant name found in Host Control Panel: ${participantNameFound}`);
        console.log(`Expected participant name: ${participantName}`);
        console.log(`Question text: ${questionText}`);

        // Log console messages for debugging
        console.log('\n=== HOST CONSOLE MESSAGES ===');
        hostConsoleMessages.slice(-10).forEach(msg => console.log(msg));

        console.log('\n=== PARTICIPANT CONSOLE MESSAGES ===');
        participantConsoleMessages.slice(-10).forEach(msg => console.log(msg));

        // The main assertion - this should pass when the bug is fixed
        if (questionFound) {
            expect(participantNameFound).toBe(true);
            console.log('✅ TEST PASSED: Participant name correctly displayed in Host Control Panel');
        } else {
            // If question isn't found at all, that's a different issue
            expect(questionFound).toBe(true);
            console.log('❌ TEST FAILED: Question not found in Host Control Panel');
        }
    });

    test('should handle multiple participants with different names', async () => {
        // Create pages for host and two participants
        hostPage = await context.newPage();
        const participant1Page = await context.newPage();
        const participant2Page = await context.newPage();

        // Navigate host to control panel
        await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
        await hostPage.waitForSelector('h1', { timeout: 10000 });

        // Navigate participants to session
        await participant1Page.goto(`https://localhost:9091/session/canvas/${sessionToken}`);
        await participant2Page.goto(`https://localhost:9091/session/canvas/${sessionToken}`);

        await participant1Page.waitForSelector('h1', { timeout: 10000 });
        await participant2Page.waitForSelector('h1', { timeout: 10000 });

        // Set different participant names
        const participant1Name = `Alice_${Date.now()}`;
        const participant2Name = `Bob_${Date.now()}`;

        console.log(`Testing with participants: ${participant1Name}, ${participant2Name}`);

        // Submit questions from both participants
        const question1 = `Question from ${participant1Name}`;
        const question2 = `Question from ${participant2Name}`;

        // Participant 1 submits question
        const questionInput1 = participant1Page.locator('input[type="text"], textarea').first();
        await questionInput1.fill(question1);
        const submitButton1 = participant1Page.locator('button:has-text("Submit"), button[type="submit"]').first();

        const submission1Promise = participant1Page.waitForResponse(
            response => response.url().includes('/api/Question/Submit'),
            { timeout: 10000 }
        );
        await submitButton1.click();
        await submission1Promise;

        // Wait between submissions
        await hostPage.waitForTimeout(1000);

        // Participant 2 submits question  
        const questionInput2 = participant2Page.locator('input[type="text"], textarea').first();
        await questionInput2.fill(question2);
        const submitButton2 = participant2Page.locator('button:has-text("Submit"), button[type="submit"]').first();

        const submission2Promise = participant2Page.waitForResponse(
            response => response.url().includes('/api/Question/Submit'),
            { timeout: 10000 }
        );
        await submitButton2.click();
        await submission2Promise;

        // Check Host Control Panel for both questions and names
        await hostPage.waitForTimeout(2000);
        await hostPage.reload();
        await hostPage.waitForTimeout(3000);

        // Verify both questions and participant names are displayed
        const question1Found = await hostPage.locator(`text="${question1}"`).isVisible({ timeout: 5000 });
        const question2Found = await hostPage.locator(`text="${question2}"`).isVisible({ timeout: 5000 });

        const participant1NameFound = await hostPage.locator(`text="${participant1Name}"`).isVisible({ timeout: 2000 });
        const participant2NameFound = await hostPage.locator(`text="${participant2Name}"`).isVisible({ timeout: 2000 });

        console.log(`Question 1 found: ${question1Found}, Participant 1 name found: ${participant1NameFound}`);
        console.log(`Question 2 found: ${question2Found}, Participant 2 name found: ${participant2NameFound}`);

        // Take screenshot for debugging
        await hostPage.screenshot({
            path: `test-results/multiple-participants-${Date.now()}.png`,
            fullPage: true
        });

        // Assert that both participants' names are correctly displayed
        expect(question1Found && participant1NameFound).toBe(true);
        expect(question2Found && participant2NameFound).toBe(true);

        // Close participant pages
        await participant1Page.close();
        await participant2Page.close();
    });

    test('should show trace logs for debugging participant name resolution', async () => {
        hostPage = await context.newPage();
        participantPage = await context.newPage();

        // Enable console logging
        const traceLogs: string[] = [];

        hostPage.on('console', msg => {
            const text = msg.text();
            traceLogs.push(`HOST: ${text}`);

            if (text.includes('NOOR-QA-TRACE') ||
                text.includes('HOST-QUESTIONS-TRACE') ||
                text.includes('NOOR-QA-SUBMIT-TRACE')) {
                console.log('🔍 Host Trace Log:', text);
            }
        });

        participantPage.on('console', msg => {
            const text = msg.text();
            traceLogs.push(`PARTICIPANT: ${text}`);

            if (text.includes('NOOR-QA-SUBMIT-TRACE')) {
                console.log('🔍 Participant Trace Log:', text);
            }
        });

        // Navigate and perform the test
        await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`);
        await participantPage.goto(`https://localhost:9091/session/canvas/${sessionToken}`);

        await hostPage.waitForSelector('h1', { timeout: 10000 });
        await participantPage.waitForSelector('h1', { timeout: 10000 });

        // Submit a question to trigger trace logging
        const testQuestion = `Trace test question ${Date.now()}`;
        const questionInput = participantPage.locator('input[type="text"], textarea').first();
        await questionInput.fill(testQuestion);

        const submitButton = participantPage.locator('button:has-text("Submit"), button[type="submit"]').first();
        await submitButton.click();

        // Wait for logs to accumulate
        await hostPage.waitForTimeout(5000);

        // Force a GetQuestions API call by refreshing host panel
        await hostPage.reload();
        await hostPage.waitForTimeout(3000);

        // Output all collected trace logs
        console.log('\n=== ALL TRACE LOGS ===');
        traceLogs.forEach(log => {
            if (log.includes('TRACE') || log.includes('undefined') || log.includes('Anonymous')) {
                console.log(log);
            }
        });

        // Check if we captured any trace logs
        const hasTraceLog = traceLogs.some(log =>
            log.includes('NOOR-QA-TRACE') ||
            log.includes('HOST-QUESTIONS-TRACE') ||
            log.includes('NOOR-QA-SUBMIT-TRACE')
        );

        console.log(`Trace logs captured: ${hasTraceLog}`);

        // The test passes if we captured trace logs (indicating our logging is working)
        expect(hasTraceLog).toBe(true);
    });
});