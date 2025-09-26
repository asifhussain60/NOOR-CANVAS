import { expect, Page, test } from '@playwright/test';

/**
 * NOOR Canvas - SignalR Contract Validation Tests
 * 
 * This test suite validates the SignalR contract compliance between
 * host and participant sessions, ensuring all consumer-required fields
 * are properly populated and transmitted.
 */

test.describe('SignalR Contract Validation', () => {
    let hostPage: Page;
    let participantPage: Page;

    const APP_BASE_URL = 'https://localhost:9091';
    const TEST_HOST_TOKEN = 'TEST_H215';
    const TEST_USER_TOKEN = 'TEST_U215_001';

    test.beforeAll(async ({ browser }) => {
        // Create separate contexts
        const hostContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1400, height: 900 }
        });

        const participantContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            viewport: { width: 1200, height: 800 }
        });

        hostPage = await hostContext.newPage();
        participantPage = await participantContext.newPage();

        // Setup message interception
        hostPage.on('console', msg => {
            if (msg.text().includes('SignalR') || msg.text().includes('NOOR-HUB')) {
                console.log(`[HOST-SIGNALR] ${msg.text()}`);
            }
        });

        participantPage.on('console', msg => {
            if (msg.text().includes('SignalR') || msg.text().includes('NOOR-CANVAS')) {
                console.log(`[PARTICIPANT-SIGNALR] ${msg.text()}`);
            }
        });
    });

    test.afterAll(async () => {
        await hostPage.close();
        await participantPage.close();
    });

    test('Asset sharing contract validation', async () => {
        console.log('📋 [DEBUG-WORKITEM:debug:contract] Testing asset sharing contract');

        // Setup host
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');
        await hostPage.waitForTimeout(2000); // SignalR connection

        // Setup participant (simulate user in canvas)
        await participantPage.goto(`${APP_BASE_URL}/session/canvas/${TEST_USER_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');
        await participantPage.waitForTimeout(2000); // SignalR connection

        // Intercept SignalR messages on participant side
        let assetSharedMessageReceived = false;
        let messagePayload: any = null;

        await participantPage.evaluate(() => {
            // Hook into SignalR message reception
            if ((window as any).hubConnection) {
                (window as any).hubConnection.on('AssetShared', (data: any) => {
                    console.log('[DEBUG-WORKITEM:debug:contract] AssetShared message received:', JSON.stringify(data));
                    (window as any).lastAssetSharedMessage = data;
                });
            }
        });

        // Host shares an asset
        await hostPage.click('button:has-text("Test Share Asset")');
        await hostPage.waitForTimeout(3000); // Allow propagation

        // Validate message was received and contains required fields
        messagePayload = await participantPage.evaluate(() => {
            return (window as any).lastAssetSharedMessage;
        });

        if (messagePayload) {
            assetSharedMessageReceived = true;

            // Contract validation: Required fields
            expect(messagePayload).toHaveProperty('shareId');
            expect(messagePayload).toHaveProperty('assetType');
            expect(messagePayload).toHaveProperty('testContent'); // Consumer-required HTML content

            // Validate testContent is sanitized HTML
            if (messagePayload.testContent) {
                expect(typeof messagePayload.testContent).toBe('string');
                expect(messagePayload.testContent.length).toBeGreaterThan(0);
                console.log('[DEBUG-WORKITEM:debug:contract] testContent validated:', messagePayload.testContent.substring(0, 100));
            }

            console.log('✅ [DEBUG-WORKITEM:debug:contract] Asset sharing contract validated');
        } else {
            console.log('⚠️ [DEBUG-WORKITEM:debug:contract] Asset sharing message not received');
        }

        expect(assetSharedMessageReceived).toBe(true);
    });

    test('Q&A workflow contract validation', async () => {
        console.log('❓ [DEBUG-WORKITEM:debug:contract] Testing Q&A workflow contract');

        // Setup both contexts
        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        await participantPage.goto(`${APP_BASE_URL}/session/canvas/${TEST_USER_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');

        await hostPage.waitForTimeout(2000);
        await participantPage.waitForTimeout(2000);

        // Intercept Q&A messages on host side
        await hostPage.evaluate(() => {
            if ((window as any).hubConnection) {
                (window as any).hubConnection.on('NewQuestion', (data: any) => {
                    console.log('[DEBUG-WORKITEM:debug:contract] NewQuestion message received:', JSON.stringify(data));
                    (window as any).lastQuestionMessage = data;
                });
            }
        });

        // Participant submits a question
        const testQuestion = "What is the proper way to perform Salah?";

        await participantPage.fill('#question-input', testQuestion);
        await participantPage.click('button:has-text("Submit Question")');
        await participantPage.waitForTimeout(3000);

        // Validate question message was received by host
        const questionPayload = await hostPage.evaluate(() => {
            return (window as any).lastQuestionMessage;
        });

        if (questionPayload) {
            // Contract validation: Required fields for Q&A
            expect(questionPayload).toHaveProperty('questionId');
            expect(questionPayload).toHaveProperty('questionText');
            expect(questionPayload).toHaveProperty('userName');
            expect(questionPayload).toHaveProperty('timestamp');

            expect(questionPayload.questionText).toBe(testQuestion);

            console.log('✅ [DEBUG-WORKITEM:debug:contract] Q&A workflow contract validated');
        } else {
            console.log('⚠️ [DEBUG-WORKITEM:debug:contract] Q&A message not received');
        }
    });

    test('Session state synchronization contract', async () => {
        console.log('🔄 [DEBUG-WORKITEM:debug:contract] Testing session state contract');

        await hostPage.goto(`${APP_BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        await participantPage.goto(`${APP_BASE_URL}/session/waiting/${TEST_USER_TOKEN}`);
        await participantPage.waitForLoadState('networkidle');

        await hostPage.waitForTimeout(2000);
        await participantPage.waitForTimeout(2000);

        // Intercept session state messages
        await participantPage.evaluate(() => {
            if ((window as any).hubConnection) {
                (window as any).hubConnection.on('SessionStarted', (data: any) => {
                    console.log('[DEBUG-WORKITEM:debug:contract] SessionStarted message received:', JSON.stringify(data));
                    (window as any).lastSessionMessage = data;
                });
            }
        });

        // Host starts session
        await hostPage.click('button:has-text("Start Session")');
        await hostPage.waitForTimeout(3000);

        // Validate session message contract
        const sessionPayload = await participantPage.evaluate(() => {
            return (window as any).lastSessionMessage;
        });

        if (sessionPayload) {
            expect(sessionPayload).toHaveProperty('sessionId');
            expect(sessionPayload).toHaveProperty('status');
            expect(sessionPayload).toHaveProperty('redirectUrl');

            console.log('✅ [DEBUG-WORKITEM:debug:contract] Session state contract validated');
        }

        // Also check that participant navigates to canvas
        await expect(participantPage).toHaveURL(/\/session\/canvas\//, { timeout: 10000 });
    });
});

test.describe('API Contract Validation', () => {
    const API_BASE_URL = 'https://localhost:9091';

    test('Session validation API contract', async ({ request }) => {
        console.log('🔌 [DEBUG-WORKITEM:debug:api-contract] Testing session validation API');

        const testToken = 'TEST_USER_TOKEN';

        const response = await request.post(`${API_BASE_URL}/api/participant/validate-session`, {
            data: { token: testToken },
            ignoreHTTPSErrors: true
        });

        expect(response.ok()).toBe(true);

        const responseData = await response.json();

        // Contract validation: Required response fields
        expect(responseData).toHaveProperty('valid');
        expect(responseData).toHaveProperty('sessionId');
        expect(responseData).toHaveProperty('session');

        if (responseData.session) {
            expect(responseData.session).toHaveProperty('sessionId');
            expect(responseData.session).toHaveProperty('title');
            expect(responseData.session).toHaveProperty('startTime');
        }

        console.log('✅ [DEBUG-WORKITEM:debug:api-contract] Session validation API contract validated');
    });

    test('Participants list API contract', async ({ request }) => {
        console.log('👥 [DEBUG-WORKITEM:debug:api-contract] Testing participants API');

        const testToken = 'TEST_USER_TOKEN';

        const response = await request.get(`${API_BASE_URL}/api/participant/participants/${testToken}`, {
            ignoreHTTPSErrors: true
        });

        expect(response.ok()).toBe(true);

        const responseData = await response.json();

        // Contract validation
        expect(responseData).toHaveProperty('sessionId');
        expect(responseData).toHaveProperty('participantCount');
        expect(responseData).toHaveProperty('participants');

        if (responseData.participants && responseData.participants.length > 0) {
            const participant = responseData.participants[0];
            expect(participant).toHaveProperty('userId');
            expect(participant).toHaveProperty('displayName');
            expect(participant).toHaveProperty('country');
        }

        console.log('✅ [DEBUG-WORKITEM:debug:api-contract] Participants API contract validated');
    });
});