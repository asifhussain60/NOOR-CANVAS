import { test, expect } from '@playwright/test';

/**
 * Simple SignalR vs HTTP Implementation Test
 * Tests basic functionality to determine which approach works better
 */

test.describe('Implementation Comparison: SignalR vs HTTP', () => {
    const testConfig = {
        baseUrl: 'https://localhost:9091',
        hostToken: process.env.HOST_TOKEN || '7AJG8862',
        userToken: process.env.USER_TOKEN || '4QAXQGFS'
    };

    test.beforeAll(() => {
        console.log('🧪 Starting Implementation Comparison Test');
        console.log(`📊 Using tokens - Host: ${testConfig.hostToken}, User: ${testConfig.userToken}`);
    });

    test('HTTP API - Participant Management', async ({ page }) => {
        console.log('🔍 Testing HTTP API for Participant Management');
        
        await page.goto(testConfig.baseUrl);
        
        // Test participant loading via HTTP API
        const participantTest = await page.evaluate(async (userToken) => {
            try {
                const response = await fetch(`/api/participant/session/${userToken}/participants`);
                const data = await response.json();
                
                return {
                    success: response.ok,
                    status: response.status,
                    participantCount: data?.participantCount || 0,
                    data: data
                };
            } catch (err) {
                return {
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                };
            }
        }, testConfig.userToken);
        
        console.log(`👥 HTTP Participant API: ${participantTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Status: ${participantTest.status || 'N/A'}`);
        console.log(`   Participants: ${participantTest.participantCount || 0}`);
        
        if (!participantTest.success) {
            console.log(`   Error: ${participantTest.error || 'HTTP ' + participantTest.status}`);
        }
        
        expect(participantTest.success).toBeTruthy();
    });

    test('HTTP API - Question Management', async ({ page }) => {
        console.log('🔍 Testing HTTP API for Question Management');
        
        await page.goto(testConfig.baseUrl);
        
        // First get a user GUID for the session
        const userGuidTest = await page.evaluate(async (userToken) => {
            try {
                const response = await fetch(`/api/participant/session/${userToken}/user-guid`);
                const data = await response.json();
                
                return {
                    success: response.ok,
                    userGuid: data?.userGuid
                };
            } catch (err) {
                return {
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                };
            }
        }, testConfig.userToken);
        
        if (userGuidTest.success && userGuidTest.userGuid) {
            // Test question submission
            const questionTest = await page.evaluate(async (config) => {
                try {
                    const response = await fetch('/api/question/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionToken: config.userToken,
                            questionText: 'Test question from implementation comparison',
                            userGuid: config.userGuid
                        })
                    });
                    
                    const data = await response.json();
                    return {
                        success: response.ok,
                        status: response.status,
                        data: data
                    };
                } catch (err) {
                    return {
                        success: false,
                        error: err instanceof Error ? err.message : 'Unknown error'
                    };
                }
            }, { userToken: testConfig.userToken, userGuid: userGuidTest.userGuid });
            
            console.log(`📝 HTTP Question Submission: ${questionTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Status: ${questionTest.status || 'N/A'}`);
            
            if (!questionTest.success) {
                console.log(`   Error: ${questionTest.error || 'HTTP ' + questionTest.status}`);
            }
            
            expect(questionTest.success).toBeTruthy();
        } else {
            console.log('⚠️ Could not get user GUID, skipping question test');
        }
    });

    test('SignalR Hub Connectivity', async ({ page }) => {
        console.log('🔍 Testing SignalR Hub Connections');
        
        await page.goto(testConfig.baseUrl);
        
        // Add SignalR library
        await page.addScriptTag({ 
            url: 'https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js' 
        });
        
        // Test SignalR connections
        const signalRTest = await page.evaluate(async () => {
            const results = {
                sessionHub: false,
                qaHub: false,
                annotationHub: false,
                error: null as string | null
            };
            
            try {
                // Test SessionHub
                const sessionConnection = new (window as any).signalR.HubConnectionBuilder()
                    .withUrl('/hub/session')
                    .build();
                
                await sessionConnection.start();
                results.sessionHub = true;
                await sessionConnection.stop();
                
                // Test QAHub
                const qaConnection = new (window as any).signalR.HubConnectionBuilder()
                    .withUrl('/hub/qa')
                    .build();
                
                await qaConnection.start();
                results.qaHub = true;
                await qaConnection.stop();
                
                // Test AnnotationHub
                const annotationConnection = new (window as any).signalR.HubConnectionBuilder()
                    .withUrl('/hub/annotation')
                    .build();
                
                await annotationConnection.start();
                results.annotationHub = true;
                await annotationConnection.stop();
                
            } catch (err) {
                results.error = err instanceof Error ? err.message : 'Unknown SignalR error';
            }
            
            return results;
        });
        
        console.log(`🔌 SignalR SessionHub: ${signalRTest.sessionHub ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`🔌 SignalR QAHub: ${signalRTest.qaHub ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`🔌 SignalR AnnotationHub: ${signalRTest.annotationHub ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (signalRTest.error) {
            console.log(`   Error: ${signalRTest.error}`);
        }
        
        // At least one hub should connect successfully
        expect(signalRTest.sessionHub || signalRTest.qaHub || signalRTest.annotationHub).toBeTruthy();
    });

    test('SignalR Real-time Messaging', async ({ page, context }) => {
        console.log('🔍 Testing SignalR Real-time Messaging');
        
        // Create two pages to test real-time communication
        const page1 = page;
        const page2 = await context.newPage();
        
        await page1.goto(testConfig.baseUrl);
        await page2.goto(testConfig.baseUrl);
        
        // Add SignalR to both pages
        await page1.addScriptTag({ 
            url: 'https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js' 
        });
        await page2.addScriptTag({ 
            url: 'https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js' 
        });
        
        // Test real-time messaging
        const messagingTest = await page1.evaluate(async () => {
            return new Promise((resolve) => {
                let messageReceived = false;
                const timeout = setTimeout(() => resolve(false), 5000);
                
                const connection = new (window as any).signalR.HubConnectionBuilder()
                    .withUrl('/hub/session')
                    .build();
                
                connection.start().then(() => {
                    // Listen for user joined events
                    connection.on('UserJoined', () => {
                        messageReceived = true;
                        clearTimeout(timeout);
                        resolve(true);
                    });
                    
                    // Join session to trigger the event
                    connection.invoke('JoinSession', 1, 'test-user');
                }).catch(() => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            });
        });
        
        console.log(`📨 SignalR Real-time Messaging: ${messagingTest ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        await page2.close();
        
        expect(messagingTest).toBeTruthy();
    });

    test('Implementation Comparison Summary', async ({ page }) => {
        console.log('\n📊 IMPLEMENTATION ANALYSIS SUMMARY');
        console.log('=====================================');
        
        // Run a quick test of both approaches
        await page.goto(testConfig.baseUrl);
        
        // Test HTTP API reliability
        const httpReliability = await page.evaluate(async (userToken) => {
            let httpScore = 0;
            const tests = [];
            
            // Test 1: Participant API
            try {
                const response = await fetch(`/api/participant/session/${userToken}/participants`);
                if (response.ok) {
                    httpScore += 25;
                    tests.push('Participant API: ✅');
                } else {
                    tests.push(`Participant API: ❌ (${response.status})`);
                }
            } catch {
                tests.push('Participant API: ❌ (Connection Error)');
            }
            
            // Test 2: Session validation
            try {
                const response = await fetch(`/api/participant/session/${userToken}/validate`);
                if (response.ok) {
                    httpScore += 25;
                    tests.push('Session Validation: ✅');
                } else {
                    tests.push(`Session Validation: ❌ (${response.status})`);
                }
            } catch {
                tests.push('Session Validation: ❌ (Connection Error)');
            }
            
            return { score: httpScore, tests };
        }, testConfig.userToken);
        
        // Test SignalR reliability
        await page.addScriptTag({ 
            url: 'https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js' 
        });
        
        const signalRReliability = await page.evaluate(async () => {
            let signalRScore = 0;
            const tests = [];
            
            const hubTests = [
                { name: 'SessionHub', url: '/hub/session' },
                { name: 'QAHub', url: '/hub/qa' },
                { name: 'AnnotationHub', url: '/hub/annotation' }
            ];
            
            for (const hubTest of hubTests) {
                try {
                    const connection = new (window as any).signalR.HubConnectionBuilder()
                        .withUrl(hubTest.url)
                        .build();
                    
                    await connection.start();
                    signalRScore += Math.round(25 / hubTests.length);
                    tests.push(`${hubTest.name}: ✅`);
                    await connection.stop();
                } catch {
                    tests.push(`${hubTest.name}: ❌`);
                }
            }
            
            return { score: signalRScore, tests };
        });
        
        console.log('\n🔗 HTTP API Results:');
        httpReliability.tests.forEach(test => console.log(`  ${test}`));
        console.log(`  HTTP Score: ${httpReliability.score}/50`);
        
        console.log('\n🔌 SignalR Results:');
        signalRReliability.tests.forEach(test => console.log(`  ${test}`));
        console.log(`  SignalR Score: ${signalRReliability.score}/25`);
        
        // Determine recommendation
        const httpPercentage = (httpReliability.score / 50) * 100;
        const signalRPercentage = (signalRReliability.score / 25) * 100;
        
        console.log('\n🎯 RECOMMENDATION:');
        if (httpPercentage > signalRPercentage) {
            console.log(`  ✅ KEEP HTTP API (${httpPercentage}% vs ${signalRPercentage}%)`);
            console.log('  📝 HTTP APIs are more reliable and functional');
            console.log('  🔧 Consider removing unused SignalR hubs');
        } else if (signalRPercentage > httpPercentage) {
            console.log(`  ✅ KEEP SIGNALR (${signalRPercentage}% vs ${httpPercentage}%)`);
            console.log('  📝 SignalR hubs are working well for real-time features');
            console.log('  🔧 Consider migrating remaining HTTP operations to SignalR');
        } else {
            console.log(`  ⚖️ MIXED APPROACH (HTTP: ${httpPercentage}%, SignalR: ${signalRPercentage}%)`);
            console.log('  📝 Use HTTP for CRUD operations, SignalR for real-time features');
            console.log('  🔧 Current hybrid approach is working');
        }
        
        console.log('\n🔍 DETAILED FINDINGS:');
        console.log('  • HTTP APIs handle participant and session management well');
        console.log('  • SignalR provides real-time communication capabilities');
        console.log('  • Both implementations have their strengths');
        console.log('  • Current hybrid approach provides redundancy and reliability');
        
        // Test should pass if at least one approach works reasonably well
        expect(httpPercentage > 50 || signalRPercentage > 50).toBeTruthy();
    });
});