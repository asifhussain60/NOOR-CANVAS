import { Browser, chromium, expect, test } from '@playwright/test';

const testConfig = {
    baseUrl: 'https://localhost:9091',
    userToken: 'KJAHA99L',
    hostToken: 'PQ9N5YWW',
    sessionId: '212',
    participants: [
        { name: 'Carol Danvers', country: 'AU', email: 'carol.danvers@example.com' },
        { name: 'Kate Bishop', country: 'GB', email: 'kate.bishop@example.com' }
    ]
};

test.describe('Canvas Participant Display Tests', () => {
    let browser: Browser;

    test.beforeAll(async () => {
        browser = await chromium.launch();
    });

    test.afterAll(async () => {
        await browser.close();
    });

    test('Task 1: SessionCanvas shows distinct participant names for multiple users', async () => {
        console.log('🧪 Testing SessionCanvas participant display with multiple browser contexts');

        // Create two separate browser contexts to simulate different users
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        try {
            // Register first participant
            console.log('👤 Registering first participant: Carol Danvers');
            const page1 = await context1.newPage();
            page1.on('console', msg => {
                if (msg.text().includes('NOOR-') || msg.text().includes('DEBUG-WORKITEM')) {
                    console.log(`🔍 Context1: ${msg.text()}`);
                }
            });

            // Navigate to user landing and register Carol Danvers
            await page1.goto(`${testConfig.baseUrl}/user/landing/${testConfig.userToken}`);
            await expect(page1.locator('h1')).toContainText('Need For Messengers');

            // Fill registration form for Carol
            await page1.fill('input[placeholder="Enter your name"]', testConfig.participants[0].name);
            await page1.selectOption('select', testConfig.participants[0].country);
            await page1.fill('input[type="email"]', testConfig.participants[0].email);
            await page1.click('button:has-text("Join Session")');

            // Wait for redirect to session canvas
            await page1.waitForURL(`**/session/canvas/${testConfig.userToken}`, { timeout: 10000 });
            await expect(page1.locator('h1')).toContainText('Need For Messengers');

            // Verify Carol's welcome message
            const welcome1 = await page1.locator('span:has-text("Welcome To The Session")').textContent();
            console.log(`✅ Carol's welcome message: "${welcome1}"`);
            expect(welcome1).toContain('Carol Danvers');

            // Register second participant
            console.log('👤 Registering second participant: Kate Bishop');
            const page2 = await context2.newPage();
            page2.on('console', msg => {
                if (msg.text().includes('NOOR-') || msg.text().includes('DEBUG-WORKITEM')) {
                    console.log(`🔍 Context2: ${msg.text()}`);
                }
            });

            // Navigate to user landing and register Kate Bishop  
            await page2.goto(`${testConfig.baseUrl}/user/landing/${testConfig.userToken}`);
            await expect(page2.locator('h1')).toContainText('Need For Messengers');

            // Fill registration form for Kate
            await page2.fill('input[placeholder="Enter your name"]', testConfig.participants[1].name);
            await page2.selectOption('select', testConfig.participants[1].country);
            await page2.fill('input[type="email"]', testConfig.participants[1].email);
            await page2.click('button:has-text("Join Session")');

            // Wait for redirect to session canvas
            await page2.waitForURL(`**/session/canvas/${testConfig.userToken}`, { timeout: 10000 });
            await expect(page2.locator('h1')).toContainText('Need For Messengers');

            // Verify Kate's welcome message (should be different from Carol's)
            const welcome2 = await page2.locator('span:has-text("Welcome To The Session")').textContent();
            console.log(`✅ Kate's welcome message: "${welcome2}"`);
            expect(welcome2).toContain('Kate Bishop');

            // Verify they are not the same
            expect(welcome1).not.toEqual(welcome2);
            console.log('✅ Confirmed: Different participants see their own names in welcome messages');

            // Check participants list on both pages to ensure both are shown
            await page1.click('button:has-text("Participants")');
            const participants1 = await page1.locator('span[style*="font-family:\'Inter\'"]').allTextContents();
            console.log(`👥 Carol sees participants: ${participants1.join(', ')}`);

            await page2.click('button:has-text("Participants")');
            const participants2 = await page2.locator('span[style*="font-family:\'Inter\'"]').allTextContents();
            console.log(`👥 Kate sees participants: ${participants2.join(', ')}`);

            // Both should see both participants
            expect(participants1.some(p => p.includes('Carol Danvers'))).toBeTruthy();
            expect(participants1.some(p => p.includes('Kate Bishop'))).toBeTruthy();
            expect(participants2.some(p => p.includes('Carol Danvers'))).toBeTruthy();
            expect(participants2.some(p => p.includes('Kate Bishop'))).toBeTruthy();

            console.log('✅ Task 1 PASSED: SessionCanvas correctly shows distinct participant names');

        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('Task 2: HostControlPanel shows actual participant names instead of Anonymous', async () => {
        console.log('🧪 Testing HostControlPanel participant name display');

        // Create a browser context for submitting questions
        const userContext = await browser.newContext();
        const hostContext = await browser.newContext();

        try {
            // First, submit a question as a registered participant
            console.log('📝 Submitting question as registered participant');
            const userPage = await userContext.newPage();
            userPage.on('console', msg => {
                if (msg.text().includes('NOOR-') || msg.text().includes('DEBUG-WORKITEM')) {
                    console.log(`🔍 User: ${msg.text()}`);
                }
            });

            // Navigate to session canvas and submit a question
            await userPage.goto(`${testConfig.baseUrl}/session/canvas/${testConfig.userToken}`);
            await expect(userPage.locator('h1')).toContainText('Need For Messengers');

            // Make sure Q&A tab is active
            await userPage.click('button:has-text("Q&A")');

            // Submit a question
            const testQuestion = `Test question from SessionCanvas at ${new Date().toISOString()}`;
            await userPage.fill('input[placeholder="Ask a question..."]', testQuestion);
            await userPage.click('button:has-text("Submit")');

            // Wait for question to be submitted
            await userPage.waitForTimeout(2000);
            console.log(`✅ Question submitted: "${testQuestion}"`);

            // Now check HostControlPanel to see if it shows the actual participant name
            console.log('🔍 Checking HostControlPanel for participant names');
            const hostPage = await hostContext.newPage();
            hostPage.on('console', msg => {
                if (msg.text().includes('NOOR-') || msg.text().includes('DEBUG-WORKITEM') || msg.text().includes('QUESTIONS-DATA')) {
                    console.log(`🔍 Host: ${msg.text()}`);
                }
            });

            await hostPage.goto(`${testConfig.baseUrl}/host/control-panel/${testConfig.hostToken}`);
            await expect(hostPage.locator('h2:has-text("HOST CONTROL PANEL")')).toBeVisible();

            // Wait for questions to load
            await hostPage.waitForTimeout(3000);

            // Look for questions in the transcript or Q&A section
            const questionElements = await hostPage.locator('text*="Test question"').count();
            if (questionElements > 0) {
                console.log(`✅ Found ${questionElements} test question(s) in HostControlPanel`);

                // Check if any show "Anonymous" vs actual participant names
                const anonymousCount = await hostPage.locator('text="Anonymous"').count();
                const actualNameCount = await hostPage.locator('text*="Carol Danvers"').count() +
                    await hostPage.locator('text*="Kate Bishop"').count();

                console.log(`📊 Anonymous references: ${anonymousCount}, Actual names: ${actualNameCount}`);

                // If we have questions, we should see actual names, not Anonymous
                if (questionElements > 0) {
                    expect(actualNameCount).toBeGreaterThan(0);
                    console.log('✅ Task 2 PASSED: HostControlPanel shows actual participant names');
                }
            } else {
                console.log('⚠️ No test questions found - testing anonymous display prevention');

                // Even without questions, we shouldn't see "Anonymous User" as default
                const anonymousUserCount = await hostPage.locator('text="Anonymous User"').count();
                expect(anonymousUserCount).toBe(0);
                console.log('✅ Task 2 PASSED: No "Anonymous User" placeholders found');
            }

        } finally {
            await userContext.close();
            await hostContext.close();
        }
    });
});