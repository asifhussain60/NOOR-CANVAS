import { test } from '@playwright/test';

/**
 * Issue-108: Token Validation Failure Investigation - TXZ25W6K
 * 
 * This test investigates why token TXZ25W6K is showing "Unable to validate token" error
 * Tests database connectivity, token existence, and validation workflow
 */
test.describe('Issue-108: Token Validation Debug for TXZ25W6K', () => {

    test('should investigate TXZ25W6K token validation failure', async ({ page, request }) => {
        console.log('🔍 [ISSUE-108-DEBUG] Starting token validation investigation for TXZ25W6K');

        // Step 1: Test direct API endpoint
        console.log('📡 [ISSUE-108-DEBUG] Testing direct API validation endpoint');
        try {
            const apiResponse = await request.get('/api/participant/session/TXZ25W6K/validate');
            console.log('📡 [ISSUE-108-DEBUG] API Response Status:', apiResponse.status());

            if (apiResponse.ok()) {
                const responseData = await apiResponse.json();
                console.log('✅ [ISSUE-108-DEBUG] API Success Response:', JSON.stringify(responseData, null, 2));
            } else {
                const errorData = await apiResponse.json();
                console.log('❌ [ISSUE-108-DEBUG] API Error Response:', JSON.stringify(errorData, null, 2));
            }
        } catch (error) {
            console.log('💥 [ISSUE-108-DEBUG] API Request Failed:', error);
        }

        // Step 2: Test UI authentication page with token
        console.log('🖥️ [ISSUE-108-DEBUG] Testing User Authentication UI');
        await page.goto('/user/authentication');

        // Wait for page to load
        await page.waitForSelector('input[type="text"]');

        // Enter the problematic token
        await page.fill('input[type="text"]', 'TXZ25W6K');

        // Take screenshot before submission
        await page.screenshot({ path: 'TEMP/issue-108-before-submit.png', fullPage: true });

        // Submit the form
        await page.click('button:has-text("Submit")');

        // Wait for response and capture result
        await page.waitForTimeout(3000);

        // Take screenshot after submission
        await page.screenshot({ path: 'TEMP/issue-108-after-submit.png', fullPage: true });

        // Check for error message
        const errorMessage = await page.textContent('.alert-danger, .error-message, .text-danger');
        if (errorMessage) {
            console.log('🚨 [ISSUE-108-DEBUG] Error message displayed:', errorMessage);
        }

        // Check for success indicators
        const successIndicators = await page.$$('.alert-success, .success-message, .text-success');
        console.log('✅ [ISSUE-108-DEBUG] Success indicators found:', successIndicators.length);

        // Step 3: Test database query directly via test API
        console.log('🗄️ [ISSUE-108-DEBUG] Testing database queries');
        try {
            const dbQueryResponse = await request.post('/api/test/query', {
                data: {
                    query: `
                        SELECT st.Id, st.UserToken, st.HostToken, st.IsActive, st.ExpiresAt, st.CreatedAt, st.AccessCount,
                               s.Id as SessionId, s.Title, s.Status
                        FROM canvas.SecureTokens st
                        LEFT JOIN canvas.Sessions s ON st.SessionId = s.Id  
                        WHERE st.UserToken = 'TXZ25W6K' OR st.HostToken = 'TXZ25W6K'
                        ORDER BY st.CreatedAt DESC
                    `
                }
            });

            if (dbQueryResponse.ok()) {
                const dbData = await dbQueryResponse.json();
                console.log('🗄️ [ISSUE-108-DEBUG] Database query results:', JSON.stringify(dbData, null, 2));

                if (Array.isArray(dbData) && dbData.length > 0) {
                    const tokenRecord = dbData[0];
                    console.log('📊 [ISSUE-108-DEBUG] Token Analysis:');
                    console.log('  - Token exists in database:', true);
                    console.log('  - IsActive:', tokenRecord.IsActive);
                    console.log('  - Expires At:', tokenRecord.ExpiresAt);
                    console.log('  - Current Time:', new Date().toISOString());
                    console.log('  - Is Expired:', new Date(tokenRecord.ExpiresAt) <= new Date());
                    console.log('  - Access Count:', tokenRecord.AccessCount);
                    console.log('  - Session Status:', tokenRecord.Status);
                } else {
                    console.log('❌ [ISSUE-108-DEBUG] Token TXZ25W6K NOT FOUND in database');
                }
            } else {
                console.log('❌ [ISSUE-108-DEBUG] Database query failed:', dbQueryResponse.status());
            }
        } catch (dbError) {
            console.log('💥 [ISSUE-108-DEBUG] Database query error:', dbError);
        }

        // Step 4: Check for any active tokens in the system
        console.log('🔍 [ISSUE-108-DEBUG] Checking for any active tokens in system');
        try {
            const allTokensResponse = await request.post('/api/test/query', {
                data: {
                    query: `
                        SELECT COUNT(*) as TotalTokens,
                               SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveTokens,
                               SUM(CASE WHEN IsActive = 1 AND ExpiresAt > GETUTCDATE() THEN 1 ELSE 0 END) as ValidTokens
                        FROM canvas.SecureTokens
                    `
                }
            });

            if (allTokensResponse.ok()) {
                const tokenStats = await allTokensResponse.json();
                console.log('📈 [ISSUE-108-DEBUG] Token statistics:', JSON.stringify(tokenStats, null, 2));
            }
        } catch (statsError) {
            console.log('💥 [ISSUE-108-DEBUG] Token stats query error:', statsError);
        }

        // Step 5: Test with a known good token (if available)
        console.log('🧪 [ISSUE-108-DEBUG] Testing with known good tokens');
        try {
            const goodTokensResponse = await request.post('/api/test/query', {
                data: {
                    query: `
                        SELECT TOP 3 UserToken, HostToken, IsActive, ExpiresAt
                        FROM canvas.SecureTokens 
                        WHERE IsActive = 1 AND ExpiresAt > GETUTCDATE()
                        ORDER BY CreatedAt DESC
                    `
                }
            });

            if (goodTokensResponse.ok()) {
                const goodTokens = await goodTokensResponse.json();
                console.log('✅ [ISSUE-108-DEBUG] Available valid tokens:', JSON.stringify(goodTokens, null, 2));

                if (Array.isArray(goodTokens) && goodTokens.length > 0) {
                    const testToken = goodTokens[0].UserToken;
                    if (testToken) {
                        console.log(`🧪 [ISSUE-108-DEBUG] Testing validation with good token: ${testToken}`);
                        const goodTokenTest = await request.get(`/api/participant/session/${testToken}/validate`);
                        console.log('🧪 [ISSUE-108-DEBUG] Good token test status:', goodTokenTest.status());
                    }
                }
            }
        } catch (goodTokenError) {
            console.log('💥 [ISSUE-108-DEBUG] Good token test error:', goodTokenError);
        }
    });

    test('should create TXZ25W6K token if missing', async ({ request }) => {
        console.log('🔧 [ISSUE-108-DEBUG] Checking if TXZ25W6K needs to be created');

        // First check if token exists
        const checkResponse = await request.post('/api/test/query', {
            data: {
                query: `
                    SELECT COUNT(*) as TokenCount
                    FROM canvas.SecureTokens 
                    WHERE UserToken = 'TXZ25W6K' OR HostToken = 'TXZ25W6K'
                `
            }
        });

        if (checkResponse.ok()) {
            const checkResult = await checkResponse.json();
            const tokenExists = Array.isArray(checkResult) && checkResult.length > 0 && checkResult[0].TokenCount > 0;

            console.log('🔍 [ISSUE-108-DEBUG] Token exists:', tokenExists);

            if (!tokenExists) {
                console.log('🔧 [ISSUE-108-DEBUG] Token TXZ25W6K not found, creating test token...');

                // Create a test session first
                const createSessionResponse = await request.post('/api/test/query', {
                    data: {
                        query: `
                            INSERT INTO canvas.Sessions (Id, Title, Description, Status, CreatedAt, UpdatedAt)
                            OUTPUT INSERTED.Id
                            VALUES (NEWID(), 'Test Session for TXZ25W6K', 'Debug session for Issue-108 investigation', 'Active', GETUTCDATE(), GETUTCDATE())
                        `
                    }
                });

                if (createSessionResponse.ok()) {
                    const sessionResult = await createSessionResponse.json();
                    const sessionId = Array.isArray(sessionResult) && sessionResult.length > 0 ? sessionResult[0].Id : null;

                    if (sessionId) {
                        console.log('✅ [ISSUE-108-DEBUG] Created test session:', sessionId);

                        // Create the token
                        const createTokenResponse = await request.post('/api/test/query', {
                            data: {
                                query: `
                                    INSERT INTO canvas.SecureTokens (SessionId, UserToken, HostToken, IsActive, ExpiresAt, CreatedAt, AccessCount)
                                    VALUES ('${sessionId}', 'TXZ25W6K', 'HHINFLXN', 1, DATEADD(day, 30, GETUTCDATE()), GETUTCDATE(), 0)
                                `
                            }
                        });

                        if (createTokenResponse.ok()) {
                            console.log('✅ [ISSUE-108-DEBUG] Successfully created TXZ25W6K token');
                        } else {
                            console.log('❌ [ISSUE-108-DEBUG] Failed to create token');
                        }
                    }
                }
            }
        }
    });
});