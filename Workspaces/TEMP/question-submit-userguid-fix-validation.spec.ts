import { expect, test } from '@playwright/test';

const testConfig = {
    baseUrl: 'https://localhost:9091',
    userToken: 'KJAHA99L',
    sessionId: '212',
    testParticipant: {
        name: 'Test User',
        country: 'US',
        email: 'test.user@example.com'
    }
};

test.describe('Question Submit UserGuid Fix Validation', () => {

    test('UserGuid synchronization between registration and SessionCanvas', async ({ page }) => {
        console.log('🧪 Testing UserGuid synchronization for question submission fix');

        // Step 1: Navigate to participant registration
        console.log('📝 Step 1: Navigate to registration page');
        await page.goto(`${testConfig.baseUrl}/session/${testConfig.userToken}/register`);
        await expect(page.locator('h1')).toContainText('Need For Messengers', { timeout: 10000 });

        // Step 2: Fill registration form
        console.log('📝 Step 2: Fill registration form');
        await page.fill('input[placeholder*="name"]', testConfig.testParticipant.name);
        await page.selectOption('select', testConfig.testParticipant.country);
        await page.fill('input[type="email"]', testConfig.testParticipant.email);

        // Step 3: Submit registration and capture the stored UserGuid
        console.log('📝 Step 3: Submit registration and capture UserGuid');

        // Monitor localStorage changes
        let registrationUserGuid: string | null = null;
        page.on('response', async (response) => {
            if (response.url().includes('/api/participant/register-with-token')) {
                console.log('🔍 Registration API response received');
                if (response.status() === 200) {
                    const responseBody = await response.json();
                    console.log('✅ Registration successful, UserGuid from server:', responseBody.userGuid?.substring(0, 8) + '...');
                }
            }
        });

        await page.click('button:has-text("Join Session")');

        // Wait for registration to complete and check localStorage
        await page.waitForURL('**/waiting**', { timeout: 15000 });

        // Check if UserGuid was stored with correct key pattern
        registrationUserGuid = await page.evaluate((token) => {
            return localStorage.getItem(`noor_user_guid_${token}`);
        }, testConfig.userToken);

        console.log('🔍 UserGuid stored in localStorage:', registrationUserGuid?.substring(0, 8) + '...');
        expect(registrationUserGuid).toBeTruthy();
        expect(registrationUserGuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

        // Step 4: Navigate to SessionCanvas
        console.log('📝 Step 4: Navigate to SessionCanvas');
        await page.goto(`${testConfig.baseUrl}/session/canvas/${testConfig.userToken}`);
        await expect(page.locator('h1')).toContainText('Need For Messengers', { timeout: 10000 });

        // Wait for SessionCanvas to load participants
        await page.waitForSelector('text=Participants', { timeout: 10000 });

        // Step 5: Check that SessionCanvas loads the same UserGuid
        console.log('📝 Step 5: Verify SessionCanvas uses same UserGuid');

        const sessionCanvasUserGuid = await page.evaluate((token) => {
            // Check both sessionStorage and localStorage for UserGuid
            const sessionStorageGuid = sessionStorage.getItem(`noor_user_guid_${token}`);
            const localStorageGuid = localStorage.getItem(`noor_user_guid_${token}`);
            return {
                sessionStorage: sessionStorageGuid,
                localStorage: localStorageGuid
            };
        }, testConfig.userToken);

        console.log('🔍 SessionCanvas UserGuid - sessionStorage:', sessionCanvasUserGuid.sessionStorage?.substring(0, 8) + '...');
        console.log('🔍 SessionCanvas UserGuid - localStorage:', sessionCanvasUserGuid.localStorage?.substring(0, 8) + '...');

        // Verify that SessionCanvas is using the same UserGuid as registration
        expect(sessionCanvasUserGuid.localStorage).toBe(registrationUserGuid);
        expect(sessionCanvasUserGuid.sessionStorage).toBe(registrationUserGuid);

        // Step 6: Test question submission with synchronized UserGuid
        console.log('📝 Step 6: Test question submission functionality');

        // Find the question input area
        const questionTextarea = page.locator('textarea[placeholder*="question"]');
        await expect(questionTextarea).toBeVisible({ timeout: 5000 });

        // Type a test question
        const testQuestion = 'Test question from UserGuid sync validation';
        await questionTextarea.fill(testQuestion);

        // Monitor the question submission API call
        let questionSubmissionSuccess = false;
        page.on('response', async (response) => {
            if (response.url().includes('/api/Question/Submit')) {
                console.log('🔍 Question submission API response:', response.status());
                if (response.status() === 200) {
                    questionSubmissionSuccess = true;
                    console.log('✅ Question submission successful!');
                } else if (response.status() === 401) {
                    console.log('❌ Question submission failed with 401 Unauthorized');
                    const errorBody = await response.text();
                    console.log('Error details:', errorBody);
                } else {
                    console.log('❌ Question submission failed with status:', response.status());
                }
            }
        });

        // Submit the question
        const submitButton = page.locator('button:has-text("Submit")');
        await submitButton.click();

        // Wait a moment for the API call to complete
        await page.waitForTimeout(3000);

        // Verify the question was submitted successfully (no 401 error)
        expect(questionSubmissionSuccess).toBe(true);

        console.log('✅ UserGuid synchronization test completed successfully!');
        console.log('✅ Registration and SessionCanvas are using the same UserGuid');
        console.log('✅ Question submission works without 401 Unauthorized errors');
    });
});