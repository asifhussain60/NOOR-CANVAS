/**
 * Host Token Discovery Test
 * 
 * This test attempts to discover valid host tokens through various methods:
 * 1. Try common token patterns
 * 2. Check if there are any pre-generated tokens
 * 3. Investigate the token generation endpoint directly
 */

import { test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';

test.describe('Host Token Discovery', () => {
    test('Find working host token', async ({ page, request }) => {
        console.log('🔍 Starting host token discovery...');

        // Method 1: Try some common 8-character patterns
        const possibleTokens = [
            'ADMIN123',
            'HOST1234',
            'TEST1234',
            'DEMO1234',
            'DEV12345',
            'SAMPLE01',
            'TEMP1234',
            'GUEST123',
            '12345678',
            'ABCD1234'
        ];

        console.log('🧪 Method 1: Testing common token patterns...');
        for (const token of possibleTokens) {
            console.log(`   Testing token: ${token}`);

            try {
                const response = await page.goto(`${BASE_URL}/host/session-opener/${token}`, {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });

                await page.waitForTimeout(3000);
                const pageContent = await page.textContent('body');

                if (pageContent && !pageContent.includes('Invalid host token') && !pageContent.includes('API Error')) {
                    console.log(`✅ FOUND WORKING TOKEN: ${token}`);
                    console.log(`📄 Page content preview: ${pageContent.substring(0, 200)}`);

                    await page.screenshot({ path: `./screenshots/working-token-${token}.png`, fullPage: true });
                    return; // Exit if we find a working token
                } else {
                    console.log(`   ❌ Token ${token} failed`);
                }
            } catch (error) {
                console.log(`   ⚠️ Token ${token} caused error: ${error}`);
            }
        }

        // Method 2: Try to investigate the token generation API directly
        console.log('🔧 Method 2: Investigating token generation API...');

        try {
            // Check if there's a way to list existing tokens
            const tokenListResponse = await request.get(`${BASE_URL}/api/host/tokens`, {
                ignoreHTTPSErrors: true
            });

            if (tokenListResponse.ok()) {
                const tokenList = await tokenListResponse.json();
                console.log('📋 Found existing tokens:', tokenList);
            } else {
                console.log(`   ❌ Token list API returned: ${tokenListResponse.status()}`);
            }
        } catch (error) {
            console.log(`   ⚠️ Token list API error: ${error}`);
        }

        // Method 3: Try to generate a new token with different parameters
        console.log('🔧 Method 3: Attempting token generation with various parameters...');

        const tokenRequests = [
            {
                sessionId: 1,
                createdBy: 'Test User',
                title: 'Test Session'
            },
            {
                sessionId: 100,
                createdBy: 'Playwright Test',
                title: 'Automated Test Session'
            },
            {
                // Minimal request
                sessionId: 999
            }
        ];

        for (const tokenRequest of tokenRequests) {
            try {
                console.log(`   Trying token generation with:`, tokenRequest);

                const tokenResponse = await request.post(`${BASE_URL}/api/host/generate-token`, {
                    data: tokenRequest,
                    ignoreHTTPSErrors: true
                });

                if (tokenResponse.ok()) {
                    const tokenData = await tokenResponse.json();
                    console.log(`✅ SUCCESSFULLY GENERATED TOKEN:`, tokenData);

                    if (tokenData.hostToken) {
                        // Test the generated token
                        await page.goto(`${BASE_URL}/host/session-opener/${tokenData.hostToken}`);
                        await page.waitForTimeout(3000);

                        const pageContent = await page.textContent('body');
                        if (pageContent && !pageContent.includes('Invalid host token')) {
                            console.log(`🎯 CONFIRMED WORKING: Generated token ${tokenData.hostToken} works!`);
                            await page.screenshot({ path: `./screenshots/generated-token-${tokenData.hostToken}.png`, fullPage: true });
                            return;
                        }
                    }
                } else {
                    const errorText = await tokenResponse.text();
                    console.log(`   ❌ Token generation failed: ${tokenResponse.status()} - ${errorText}`);
                }
            } catch (error) {
                console.log(`   ⚠️ Token generation error: ${error}`);
            }
        }

        // Method 4: Check database or configuration files (if accessible)
        console.log('🔧 Method 4: Looking for configuration or database hints...');

        try {
            // Try to access any configuration endpoints
            const configResponse = await request.get(`${BASE_URL}/api/config`, {
                ignoreHTTPSErrors: true
            });

            if (configResponse.ok()) {
                const config = await configResponse.json();
                console.log('⚙️ Found configuration:', config);
            }
        } catch (error) {
            console.log(`   ⚠️ Config endpoint not accessible: ${error}`);
        }

        console.log('❌ No valid host token found through any method');
        console.log('💡 Suggestions:');
        console.log('   1. Check the database for existing host tokens');
        console.log('   2. Use the application UI to generate a token manually');
        console.log('   3. Check application logs for token generation patterns');
        console.log('   4. Contact the development team for a valid token');
    });
});