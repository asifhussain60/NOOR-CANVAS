/**
 * Direct Waiting Room Access Test
 * 
 * This test bypasses the host session creation UI and directly tests
 * waiting room navigation with various approaches to reproduce the error.
 * 
 * Strategy:
 * 1. Test direct navigation to waiting room URLs
 * 2. Try different participant token patterns
 * 3. Create session via API if possible
 * 4. Reproduce the specific "Enter Waiting Room" error
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';

test.describe('Direct Waiting Room Access Test', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
            } else {
                console.log(`🖥️  BROWSER [${msg.type()}]: ${msg.text()}`);
            }
        });

        page.on('request', (request) => {
            if (request.url().includes('api') || request.url().includes('waiting') || request.url().includes('session')) {
                console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', (response) => {
            if (response.url().includes('api') || response.url().includes('waiting') || response.url().includes('session')) {
                console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
            }
        });
    });

    test('Test Waiting Room URLs Directly', async ({ page }) => {
        console.log('🚀 Starting Direct Waiting Room Access Test...');

        // Test various waiting room URL patterns
        const waitingRoomUrls = [
            '/waiting-room',
            '/session/waiting',
            '/user/waiting',
            '/session-waiting',
            '/waiting',
            '/participant/waiting-room',
            '/session/participant-waiting'
        ];

        console.log('🔍 Testing direct waiting room URL patterns...');

        for (const urlPath of waitingRoomUrls) {
            try {
                console.log(`   Testing: ${BASE_URL}${urlPath}`);
                
                const response = await page.goto(`${BASE_URL}${urlPath}`, { 
                    waitUntil: 'networkidle',
                    timeout: 10000 
                });
                
                await page.waitForTimeout(3000);
                
                const pageText = await page.textContent('body');
                const statusCode = response?.status() || 0;
                
                console.log(`   Status: ${statusCode}`);
                
                if (pageText && !pageText.includes('404') && !pageText.includes('Not Found')) {
                    console.log(`✅ Found working waiting room URL: ${urlPath}`);
                    console.log(`📄 Content preview: ${pageText.substring(0, 200)}`);
                    
                    await page.screenshot({ path: `./screenshots/waiting-room-${urlPath.replace(/\//g, '-')}.png`, fullPage: true });
                    
                    // Check for session error in this page
                    if (pageText.includes('Session Error') || pageText.includes('Session not found')) {
                        console.log('🎯 FOUND SESSION ERROR in waiting room!');
                    }
                } else {
                    console.log(`   ❌ ${urlPath}: Not found or error`);
                }
                
            } catch (error) {
                console.log(`   ⚠️ ${urlPath}: ${error}`);
            }
        }

        console.log('');
        console.log('🔍 Testing participant landing URLs with different tokens...');

        // Test participant landing URLs with various token patterns
        const testTokens = [
            'TEST1234',
            'ADMIN123', 
            'SAMPLE01',
            'DEMO1234',
            '12345678',
            'ABCDEFGH',
            'GUEST123'
        ];

        for (const token of testTokens) {
            try {
                const landingUrl = `${BASE_URL}/user/landing/${token}`;
                console.log(`   Testing participant URL: ${landingUrl}`);
                
                await page.goto(landingUrl, { waitUntil: 'networkidle', timeout: 10000 });
                await page.waitForTimeout(3000);
                
                const pageText = await page.textContent('body');
                
                if (pageText) {
                    // Look for Enter Waiting Room button on participant landing pages
                    const hasEnterButton = pageText.includes('Enter Waiting Room') || 
                                         pageText.includes('Join Session') ||
                                         pageText.includes('Enter Session');
                    
                    if (hasEnterButton) {
                        console.log(`✅ Found participant page with enter button: ${token}`);
                        
                        // Try to click the Enter Waiting Room button
                        const enterButton = page.locator('button:has-text("Enter Waiting Room"), a:has-text("Enter Waiting Room"), button:has-text("Join Session"), a:has-text("Join Session")');
                        
                        const buttonCount = await enterButton.count();
                        if (buttonCount > 0) {
                            console.log(`🎯 Found ${buttonCount} enter button(s), testing click...`);
                            
                            await page.screenshot({ path: `./screenshots/before-enter-${token}.png`, fullPage: true });
                            
                            await enterButton.first().click();
                            await page.waitForLoadState('networkidle');
                            await page.waitForTimeout(5000);
                            
                            const afterClickText = await page.textContent('body');
                            const finalUrl = page.url();
                            
                            await page.screenshot({ path: `./screenshots/after-enter-${token}.png`, fullPage: true });
                            
                            console.log(`🏁 After click URL: ${finalUrl}`);
                            
                            // Check for session error
                            if (afterClickText?.includes('Session Error')) {
                                console.log('🎯 REPRODUCED SESSION ERROR!');
                                console.log('📄 Error details:', afterClickText.substring(0, 500));
                            } else if (afterClickText?.includes('Waiting Room')) {
                                console.log('✅ Successfully entered waiting room');
                            } else {
                                console.log('❓ Unexpected result after click');
                                console.log('📄 Result preview:', afterClickText?.substring(0, 300));
                            }
                        }
                    } else {
                        // Check if this is a Session Error page
                        if (pageText.includes('Session Error') || pageText.includes('Session not found')) {
                            console.log(`🎯 Found Session Error page for token: ${token}`);
                            console.log('📄 Error content:', pageText.substring(0, 300));
                        } else {
                            console.log(`   ❌ ${token}: No enter button found`);
                        }
                    }
                }
                
            } catch (error) {
                console.log(`   ⚠️ ${token}: ${error}`);
            }
        }

        console.log('');
        console.log('🔧 Testing session API endpoints...');

        // Test if we can create a session via API
        try {
            const sessionResponse = await page.request.post(`${BASE_URL}/api/session/create`, {
                data: {
                    hostToken: 'ADMIN123',
                    title: 'Test Session',
                    date: '2025-09-19',
                    time: '4:45 PM',
                    duration: 60
                },
                ignoreHTTPSErrors: true
            });

            if (sessionResponse.ok()) {
                const sessionData = await sessionResponse.json();
                console.log('✅ Successfully created session via API:', sessionData);

                if (sessionData.participantToken || sessionData.userToken) {
                    const participantToken = sessionData.participantToken || sessionData.userToken;
                    console.log(`🎫 Got participant token: ${participantToken}`);

                    // Test the participant token
                    await page.goto(`${BASE_URL}/user/landing/${participantToken}`);
                    await page.waitForTimeout(3000);

                    const participantPageText = await page.textContent('body');
                    if (participantPageText?.includes('Enter Waiting Room')) {
                        console.log('🎯 Testing API-generated session...');
                        
                        const enterBtn = page.locator('button:has-text("Enter Waiting Room"), a:has-text("Enter Waiting Room")');
                        await enterBtn.click();
                        await page.waitForTimeout(5000);

                        const waitingRoomText = await page.textContent('body');
                        if (waitingRoomText?.includes('Session Error')) {
                            console.log('🎯 CONFIRMED: API session also produces Session Error!');
                        }
                    }
                }
            } else {
                console.log(`❌ Session API failed: ${sessionResponse.status()}`);
                const errorText = await sessionResponse.text();
                console.log(`📄 API error: ${errorText}`);
            }
        } catch (error) {
            console.log(`⚠️ Session API test error: ${error}`);
        }

        console.log('');
        console.log('📊 DIRECT WAITING ROOM ACCESS TEST COMPLETE');
        console.log('📸 Screenshots saved for analysis');
    });
});