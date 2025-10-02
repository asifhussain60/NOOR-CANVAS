/**
 * Comprehensive test for signal-participant fix
 * Tests that SignalR questions display actual participant names instead of "Anonymous"
 */

const { chromium } = require('playwright');

async function testSignalParticipantFix() {
    console.log('🔧 TESTING: signal-participant fix for real-time question names');
    console.log('='.repeat(70));

    const testConfig = {
        baseUrl: 'http://localhost:9090',
        sessionId: '212',
        hostToken: 'KJAHA99L',
        userToken: 'PQ9N5YWW',
        participantName: 'SignalR Test Participant'
    };

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--disable-web-security']
    });

    try {
        const hostContext = await browser.newContext();
        const userContext = await browser.newContext();

        const hostPage = await hostContext.newPage();
        const userPage = await userContext.newPage();

        // Set up comprehensive console monitoring
        console.log('\n📊 Setting up console monitoring...');

        hostPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('SIGNAL-PARTICIPANT-TRACE') ||
                text.includes('HOST-QUESTIONS-TRACE') ||
                text.includes('NOOR-QA-') ||
                text.includes('HostQuestionAlert')) {
                console.log(`🎯 HOST: ${text}`);
            }
        });

        userPage.on('console', msg => {
            const text = msg.text();
            if (text.includes('NOOR-QA-SUBMIT-TRACE') ||
                text.includes('SIGNAL-PARTICIPANT')) {
                console.log(`📝 USER: ${text}`);
            }
        });

        // Step 1: Open HostControlPanel
        console.log('\n🏠 Step 1: Opening Host Control Panel...');
        await hostPage.goto(`${testConfig.baseUrl}/Admin/HostControlPanel?SessionID=${testConfig.sessionId}&HostToken=${testConfig.hostToken}`);
        await hostPage.waitForSelector('h2:has-text("HOST CONTROL PANEL")', { timeout: 15000 });
        console.log('✅ Host Control Panel loaded');

        // Step 2: Open SessionCanvas
        console.log('\n🎨 Step 2: Opening Session Canvas...');
        await userPage.goto(`${testConfig.baseUrl}/SessionCanvas?SessionID=${testConfig.sessionId}&UserToken=${testConfig.userToken}`);
        await userPage.waitForSelector('h1', { timeout: 15000 });
        console.log('✅ Session Canvas loaded');

        // Step 3: Register participant if needed
        console.log('\n👤 Step 3: Ensuring participant registration...');

        const registrationForm = await userPage.$('form');
        if (registrationForm) {
            console.log('🔄 Registering participant...');
            await userPage.fill('input[name="name"]', testConfig.participantName);
            await userPage.fill('input[name="email"]', 'signaltest@example.com');
            await userPage.selectOption('select[name="country"]', 'Canada');
            await userPage.click('button[type="submit"]');
            await userPage.waitForTimeout(2000);
            console.log(`✅ Participant registered: ${testConfig.participantName}`);
        } else {
            console.log('ℹ️ Participant already registered');
        }

        // Step 4: Wait for SignalR connections
        console.log('\n🔗 Step 4: Waiting for SignalR connections...');
        await hostPage.waitForTimeout(3000);
        await userPage.waitForTimeout(3000);

        // Step 5: Submit question to test real-time SignalR
        console.log('\n❓ Step 5: Submitting test question via SignalR...');

        const testQuestion = `SignalR Participant Test - ${new Date().toISOString()}`;
        console.log(`📤 Submitting: "${testQuestion}"`);

        // Look for Q&A interface
        const qaTab = await userPage.$('button:has-text("Q&A"), [data-testid="qa-tab"]');
        if (qaTab) {
            await qaTab.click();
            await userPage.waitForTimeout(1000);
        }

        // Find question input
        const questionInput = await userPage.$('input[placeholder*="question"], textarea[placeholder*="question"], input[type="text"]');
        if (questionInput) {
            await questionInput.fill(testQuestion);

            // Find submit button
            const submitButton = await userPage.$('button:has-text("Submit"), button:has-text("Ask"), button[type="submit"]');
            if (submitButton) {
                // Click submit and wait for SignalR propagation
                await submitButton.click();
                console.log('📡 Question submitted, waiting for SignalR propagation...');

                // Wait for SignalR message to propagate
                await hostPage.waitForTimeout(5000);

                console.log('⏰ SignalR propagation window complete');
            } else {
                console.log('❌ Submit button not found');
                return;
            }
        } else {
            console.log('❌ Question input not found');
            return;
        }

        // Step 6: Check Host Control Panel for participant name
        console.log('\n🔍 Step 6: Analyzing Host Control Panel for participant names...');

        // Look for question display in various possible locations
        const questionElements = await hostPage.$$('div, span, p');
        let participantNameFound = false;
        let anonymousFound = false;

        for (const element of questionElements) {
            const textContent = await element.textContent();
            if (textContent && textContent.includes(testQuestion.substring(0, 30))) {
                console.log(`📋 Found question element: "${textContent}"`);

                if (textContent.includes(testConfig.participantName)) {
                    participantNameFound = true;
                    console.log(`✅ SUCCESS: Participant name "${testConfig.participantName}" found in question!`);
                }

                if (textContent.includes('Anonymous')) {
                    anonymousFound = true;
                    console.log(`❌ ISSUE: Still shows "Anonymous" instead of participant name`);
                }
            }
        }

        // Step 7: Comprehensive verification
        console.log('\n📊 Step 7: Comprehensive verification results...');

        if (participantNameFound && !anonymousFound) {
            console.log('🎉 TEST PASSED: SignalR participant fix is working correctly!');
            console.log(`   ✓ Participant name "${testConfig.participantName}" displayed correctly`);
            console.log('   ✓ No "Anonymous" entries found');
        } else if (participantNameFound && anonymousFound) {
            console.log('⚠️ TEST PARTIAL: Some questions show names, others show Anonymous');
            console.log('   - This may indicate API vs SignalR differences are partially resolved');
        } else if (!participantNameFound && anonymousFound) {
            console.log('❌ TEST FAILED: Still showing Anonymous instead of participant names');
            console.log('   - SignalR handler may not be extracting participant info correctly');
        } else {
            console.log('❓ TEST INCONCLUSIVE: No questions found or unclear results');
        }

        // Step 8: Check browser console logs for detailed analysis
        console.log('\n📜 Step 8: Analysis complete - check logs above for SignalR trace data');
        console.log('Look for:');
        console.log('  - SIGNAL-PARTICIPANT-TRACE: SignalR payload analysis');
        console.log('  - NOOR-QA-SUBMIT-TRACE: Question submission details');
        console.log('  - HostQuestionAlert: SignalR event processing');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testSignalParticipantFix().catch(console.error);