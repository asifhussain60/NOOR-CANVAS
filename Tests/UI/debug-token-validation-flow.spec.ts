import { expect, test } from '@playwright/test';

test.describe('Debug Token Validation Flow - TXZ25W6K', () => {

    test('should validate token TXZ25W6K and show proper session title', async ({ page, request }) => {
        console.log('🔍 Starting comprehensive token validation debug...');

        // Step 1: Test the participant API directly
        console.log('Step 1: Testing participant API directly');

        try {
            const apiResponse = await request.get('/api/participant/session/TXZ25W6K/validate');
            console.log(`API Status: ${apiResponse.status()}`);

            if (apiResponse.ok()) {
                const responseData = await apiResponse.json();
                console.log('API Response Data:', JSON.stringify(responseData, null, 2));

                // Verify the response structure
                expect(responseData.valid).toBe(true);
                expect(responseData.session).toBeDefined();
                expect(responseData.session.title).toBeDefined();
                console.log(`✅ Session Title from API: "${responseData.session.title}"`);
            } else {
                const errorText = await apiResponse.text();
                console.log('❌ API Error Response:', errorText);
                throw new Error(`API returned ${apiResponse.status()}: ${errorText}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log('❌ API Request Failed:', errorMessage);
            throw error;
        }

        // Step 2: Check database state directly
        console.log('Step 2: Checking database state...');

        // Test KSESSIONS database content
        const ksessionsResponse = await request.post('/api/test/query', {
            data: {
                query: "SELECT SessionID, SessionName, Description FROM Sessions WHERE SessionID = 1281",
                database: "KSESSIONS_DEV"
            }
        });

        if (ksessionsResponse.ok()) {
            const ksessionsData = await ksessionsResponse.json();
            console.log('KSESSIONS Data:', ksessionsData);
        }

        // Step 3: Test the actual UserLanding page
        console.log('Step 3: Testing UserLanding page with token...');

        await page.goto('/user/landing/TXZ25W6K');

        // Wait for page to load and check for session name
        await page.waitForSelector('h1', { timeout: 10000 });

        // Check if error message appears
        const errorMessage = page.locator('.error, [style*="color: red"], [style*="color:#dc3545"]');
        if (await errorMessage.isVisible()) {
            const errorText = await errorMessage.textContent();
            console.log('❌ Error message found:', errorText);
        }

        // Find the session title element (golden color text)
        const sessionTitleElement = page.locator('p[style*="color:#D4AF37"], p[style*="color: #D4AF37"]');

        if (await sessionTitleElement.isVisible()) {
            const sessionTitle = await sessionTitleElement.textContent();
            console.log(`📋 Session Title in UI: "${sessionTitle}"`);

            // Verify it's not the generic fallback
            expect(sessionTitle).not.toMatch(/^\[Session Name\]$/);
            expect(sessionTitle).not.toMatch(/^Session \d+$/);

            // Should be a meaningful session name
            if (sessionTitle) {
                expect(sessionTitle.length).toBeGreaterThan(10);
                console.log('✅ Session title appears to be meaningful');
            }
        } else {
            console.log('❌ Session title element not found');
            await page.screenshot({ path: 'debug-session-title-missing.png' });
        }

        // Check for session description
        const descriptionElement = page.locator('p[style*="color:grey"], p[style*="color: grey"]');
        if (await descriptionElement.isVisible()) {
            const description = await descriptionElement.textContent();
            console.log(`📄 Session Description: "${description}"`);

            // Check if it still has the old album/category format
            if (description && description.includes('Album:') && description.includes('Category:')) {
                console.log('⚠️  Description still shows Album/Category format - needs updating');
            }
        }

        // Step 4: Check if token validation panel is still showing
        const tokenPanel = page.locator('text="ENTER TOKEN"');
        const registrationPanel = page.locator('text="ENTER DETAILS"');

        if (await tokenPanel.isVisible()) {
            console.log('❌ Token panel still visible - token validation failed');

            // Check for specific error messages
            const tokenInput = page.locator('input[placeholder*="token" i]');
            if (await tokenInput.isVisible()) {
                const tokenValue = await tokenInput.inputValue();
                console.log(`Token input value: "${tokenValue}"`);
            }

            await page.screenshot({ path: 'debug-token-validation-failed.png' });
        } else if (await registrationPanel.isVisible()) {
            console.log('✅ Registration panel visible - token validation succeeded');
        } else {
            console.log('⚠️  Unexpected UI state');
            await page.screenshot({ path: 'debug-unexpected-ui-state.png' });
        }

        // Step 5: Check console errors
        const consoleMessages: string[] = [];
        page.on('console', msg => {
            consoleMessages.push(`${msg.type()}: ${msg.text()}`);
        });

        // Reload to capture console messages
        await page.reload();
        await page.waitForTimeout(2000);

        if (consoleMessages.length > 0) {
            console.log('🔍 Console Messages:');
            consoleMessages.forEach(msg => console.log(`  ${msg}`));
        }

        console.log('🏁 Token validation debug complete');
    });

    test('should debug session creation and token mapping', async ({ page, request }) => {
        console.log('🔍 Debugging session creation and token mapping...');

        // Check SecureTokens table for TXZ25W6K
        const tokenQuery = `
      SELECT 
        st.UserToken, st.HostToken, st.SessionId, st.IsActive, st.ExpiresAt,
        s.SessionId as CanvasSessionId, s.Title, s.KSessionsId, s.Description
      FROM canvas.SecureTokens st
      LEFT JOIN canvas.Sessions s ON st.SessionId = s.SessionId
      WHERE st.UserToken = 'TXZ25W6K' OR st.HostToken = 'TXZ25W6K'
    `;

        console.log('Querying SecureTokens table...');
        console.log('SQL:', tokenQuery);

        // We'll need to create a test endpoint to execute this query
        // For now, let's test what we can through the UI and API

        console.log('✅ Token mapping debug complete');
    });
});