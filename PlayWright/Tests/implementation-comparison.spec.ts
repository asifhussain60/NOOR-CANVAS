import { expect, test } from '@playwright/test';

/**
 * SignalR vs HTTP Implementation Comparison Test
 * 
 * This test compares the functionality and reliability of:
 * 1. HTTP API endpoints for questions, voting, and participant management
 * 2. SignalR hub implementations for real-time features
 * 
 * Goal: Determine which implementation works better to consolidate to a single approach
 */

const testConfig = {
    baseUrl: 'https://localhost:9091',
    hostToken: process.env.HOST_TOKEN || '7AJG8862',
    userToken: process.env.USER_TOKEN || '4QAXQGFS',
    timeout: 30000,
    signalRTimeout: 10000
};

interface TestResult {
    success: boolean;
    time: number;
    error: string | null;
}

interface TestResults {
    http: {
        questionSubmission: TestResult;
        questionVoting: TestResult;
        participantLoading: TestResult;
        participantUpdates: TestResult;
    };
    signalr: {
        questionSubmission: TestResult;
        questionVoting: TestResult;
        participantLoading: TestResult;
        participantUpdates: TestResult;
    };
}

// Test results tracking
const testResults: TestResults = {
    http: {
        questionSubmission: { success: false, time: 0, error: null },
        questionVoting: { success: false, time: 0, error: null },
        participantLoading: { success: false, time: 0, error: null },
        participantUpdates: { success: false, time: 0, error: null }
    },
    signalr: {
        questionSubmission: { success: false, time: 0, error: null },
        questionVoting: { success: false, time: 0, error: null },
        participantLoading: { success: false, time: 0, error: null },
        participantUpdates: { success: false, time: 0, error: null }
    }
};

test.describe('SignalR vs HTTP Implementation Comparison', () => {

    test.beforeAll(async () => {
        console.log('🧪 Starting SignalR vs HTTP Implementation Analysis');
        console.log(`📊 Test Configuration:`);
        console.log(`  - Base URL: ${testConfig.baseUrl}`);
        console.log(`  - Host Token: ${testConfig.hostToken}`);
        console.log(`  - User Token: ${testConfig.userToken}`);
        console.log(`  - Test Timeout: ${testConfig.timeout}ms`);
    });

    test('HTTP API Implementation - Question Management', async ({ page }) => {
        console.log('🔍 Testing HTTP API Implementation for Question Management');

        const startTime = Date.now();

        try {
            // Test 1: Submit question via HTTP API
            await page.goto(testConfig.baseUrl);

            const questionSubmissionStart = Date.now();
            const questionResponse = await page.evaluate(async (config) => {
                try {
                    const response = await fetch('/api/question/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sessionToken: config.userToken,
                            questionText: 'Test question via HTTP API',
                            userGuid: 'test-user-guid-' + Date.now()
                        })
                    });

                    const data = await response.json();
                    return {
                        success: response.ok,
                        status: response.status,
                        data: data
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }, testConfig);

            testResults.http.questionSubmission.time = Date.now() - questionSubmissionStart;
            testResults.http.questionSubmission.success = questionResponse.success;
            testResults.http.questionSubmission.error = questionResponse.error;

            console.log(`📝 HTTP Question Submission: ${questionResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Time: ${testResults.http.questionSubmission.time}ms`);
            if (!questionResponse.success) {
                console.log(`   Error: ${questionResponse.error || 'HTTP ' + questionResponse.status}`);
            }

            // Test 2: Vote on question via HTTP API (if question submission worked)
            if (questionResponse.success && questionResponse.data?.questionId) {
                const voteStart = Date.now();
                const voteResponse = await page.evaluate(async (config, questionId) => {
                    try {
                        const response = await fetch(`/api/question/${questionId}/vote`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                sessionToken: config.userToken,
                                direction: 'up',
                                userGuid: 'test-user-guid-' + Date.now()
                            })
                        });

                        const data = await response.json();
                        return {
                            success: response.ok,
                            status: response.status,
                            data: data
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }, testConfig, questionResponse.data.questionId);

                testResults.http.questionVoting.time = Date.now() - voteStart;
                testResults.http.questionVoting.success = voteResponse.success;
                testResults.http.questionVoting.error = voteResponse.error;

                console.log(`🗳️ HTTP Question Voting: ${voteResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`   Time: ${testResults.http.questionVoting.time}ms`);
                if (!voteResponse.success) {
                    console.log(`   Error: ${voteResponse.error || 'HTTP ' + voteResponse.status}`);
                }
            }

        } catch (error) {
            console.log(`❌ HTTP API Test Failed: ${error.message}`);
            testResults.http.questionSubmission.error = error.message;
        }
    });

    test('HTTP API Implementation - Participant Management', async ({ page }) => {
        console.log('🔍 Testing HTTP API Implementation for Participant Management');

        try {
            await page.goto(testConfig.baseUrl);

            // Test 3: Load participants via HTTP API
            const participantLoadStart = Date.now();
            const participantResponse = await page.evaluate(async (config) => {
                try {
                    const response = await fetch(`/api/participant/session/${config.userToken}/participants`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    const data = await response.json();
                    return {
                        success: response.ok,
                        status: response.status,
                        data: data,
                        participantCount: data?.participantCount || 0
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }, testConfig);

            testResults.http.participantLoading.time = Date.now() - participantLoadStart;
            testResults.http.participantLoading.success = participantResponse.success;
            testResults.http.participantLoading.error = participantResponse.error;

            console.log(`👥 HTTP Participant Loading: ${participantResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Time: ${testResults.http.participantLoading.time}ms`);
            console.log(`   Participants Found: ${participantResponse.participantCount || 0}`);
            if (!participantResponse.success) {
                console.log(`   Error: ${participantResponse.error || 'HTTP ' + participantResponse.status}`);
            }

            // Test 4: Delete participants via HTTP API
            const deleteStart = Date.now();
            const deleteResponse = await page.evaluate(async (config) => {
                try {
                    const response = await fetch(`/api/participant/session/${config.userToken}/participants`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    const data = await response.json();
                    return {
                        success: response.ok,
                        status: response.status,
                        data: data,
                        deletedCount: data?.deletedCount || 0
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }, testConfig);

            testResults.http.participantUpdates.time = Date.now() - deleteStart;
            testResults.http.participantUpdates.success = deleteResponse.success;
            testResults.http.participantUpdates.error = deleteResponse.error;

            console.log(`🗑️ HTTP Participant Deletion: ${deleteResponse.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Time: ${testResults.http.participantUpdates.time}ms`);
            console.log(`   Participants Deleted: ${deleteResponse.deletedCount || 0}`);
            if (!deleteResponse.success) {
                console.log(`   Error: ${deleteResponse.error || 'HTTP ' + deleteResponse.status}`);
            }

        } catch (error) {
            console.log(`❌ HTTP Participant Test Failed: ${error.message}`);
            testResults.http.participantLoading.error = error.message;
        }
    });

    test('SignalR Implementation - Real-time Features', async ({ page }) => {
        console.log('🔍 Testing SignalR Implementation for Real-time Features');

        try {
            await page.goto(testConfig.baseUrl);

            // Add SignalR client library
            await page.addScriptTag({
                url: 'https://unpkg.com/@microsoft/signalr@latest/dist/browser/signalr.min.js'
            });

            // Test SignalR Hub Connections
            const signalRTest = await page.evaluate(async (config) => {
                const results = {
                    sessionHub: { success: false, time: 0, error: null },
                    qaHub: { success: false, time: 0, error: null },
                    annotationHub: { success: false, time: 0, error: null },
                    messaging: { success: false, time: 0, error: null }
                };

                try {
                    // Test SessionHub connection
                    const sessionHubStart = Date.now();
                    const sessionConnection = new signalR.HubConnectionBuilder()
                        .withUrl('/hub/session')
                        .build();

                    await sessionConnection.start();
                    results.sessionHub.success = true;
                    results.sessionHub.time = Date.now() - sessionHubStart;

                    // Test messaging through SessionHub
                    const messagingStart = Date.now();
                    let messageReceived = false;

                    sessionConnection.on('UserJoined', (data) => {
                        messageReceived = true;
                        console.log('SignalR UserJoined event received:', data);
                    });

                    // Join a test session
                    await sessionConnection.invoke('JoinSession', 1, 'test-user');

                    // Wait a bit for the message
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    results.messaging.success = messageReceived;
                    results.messaging.time = Date.now() - messagingStart;

                    await sessionConnection.stop();

                } catch (error) {
                    results.sessionHub.error = error.message;
                    console.error('SessionHub test failed:', error);
                }

                try {
                    // Test QAHub connection
                    const qaHubStart = Date.now();
                    const qaConnection = new signalR.HubConnectionBuilder()
                        .withUrl('/hub/qa')
                        .build();

                    await qaConnection.start();
                    results.qaHub.success = true;
                    results.qaHub.time = Date.now() - qaHubStart;

                    await qaConnection.stop();

                } catch (error) {
                    results.qaHub.error = error.message;
                    console.error('QAHub test failed:', error);
                }

                try {
                    // Test AnnotationHub connection
                    const annotationHubStart = Date.now();
                    const annotationConnection = new signalR.HubConnectionBuilder()
                        .withUrl('/hub/annotation')
                        .build();

                    await annotationConnection.start();
                    results.annotationHub.success = true;
                    results.annotationHub.time = Date.now() - annotationHubStart;

                    await annotationConnection.stop();

                } catch (error) {
                    results.annotationHub.error = error.message;
                    console.error('AnnotationHub test failed:', error);
                }

                return results;

            }, testConfig);

            // Update test results
            testResults.signalr.questionSubmission.success = signalRTest.sessionHub.success;
            testResults.signalr.questionSubmission.time = signalRTest.sessionHub.time;
            testResults.signalr.questionSubmission.error = signalRTest.sessionHub.error;

            testResults.signalr.questionVoting.success = signalRTest.qaHub.success;
            testResults.signalr.questionVoting.time = signalRTest.qaHub.time;
            testResults.signalr.questionVoting.error = signalRTest.qaHub.error;

            testResults.signalr.participantLoading.success = signalRTest.annotationHub.success;
            testResults.signalr.participantLoading.time = signalRTest.annotationHub.time;
            testResults.signalr.participantLoading.error = signalRTest.annotationHub.error;

            testResults.signalr.participantUpdates.success = signalRTest.messaging.success;
            testResults.signalr.participantUpdates.time = signalRTest.messaging.time;
            testResults.signalr.participantUpdates.error = signalRTest.messaging.error;

            console.log(`🔌 SignalR SessionHub: ${signalRTest.sessionHub.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Connection Time: ${signalRTest.sessionHub.time}ms`);
            if (!signalRTest.sessionHub.success) {
                console.log(`   Error: ${signalRTest.sessionHub.error}`);
            }

            console.log(`🔌 SignalR QAHub: ${signalRTest.qaHub.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Connection Time: ${signalRTest.qaHub.time}ms`);
            if (!signalRTest.qaHub.success) {
                console.log(`   Error: ${signalRTest.qaHub.error}`);
            }

            console.log(`🔌 SignalR AnnotationHub: ${signalRTest.annotationHub.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Connection Time: ${signalRTest.annotationHub.time}ms`);
            if (!signalRTest.annotationHub.success) {
                console.log(`   Error: ${signalRTest.annotationHub.error}`);
            }

            console.log(`📨 SignalR Messaging: ${signalRTest.messaging.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Message Time: ${signalRTest.messaging.time}ms`);
            if (!signalRTest.messaging.success) {
                console.log(`   Error: ${signalRTest.messaging.error}`);
            }

        } catch (error) {
            console.log(`❌ SignalR Test Failed: ${error.message}`);
            testResults.signalr.questionSubmission.error = error.message;
        }
    });

    test('Performance and Reliability Comparison', async ({ page }) => {
        console.log('📊 Generating Performance and Reliability Comparison Report');

        // Calculate scores
        const httpScore = calculateScore(testResults.http);
        const signalrScore = calculateScore(testResults.signalr);

        console.log(`\n🏆 IMPLEMENTATION COMPARISON RESULTS`);
        console.log(`=====================================`);

        console.log(`\n📊 HTTP API Implementation:`);
        console.log(`  Question Submission: ${testResults.http.questionSubmission.success ? '✅' : '❌'} (${testResults.http.questionSubmission.time}ms)`);
        console.log(`  Question Voting:     ${testResults.http.questionVoting.success ? '✅' : '❌'} (${testResults.http.questionVoting.time}ms)`);
        console.log(`  Participant Loading: ${testResults.http.participantLoading.success ? '✅' : '❌'} (${testResults.http.participantLoading.time}ms)`);
        console.log(`  Participant Updates: ${testResults.http.participantUpdates.success ? '✅' : '❌'} (${testResults.http.participantUpdates.time}ms)`);
        console.log(`  Overall Score: ${httpScore}/100`);

        console.log(`\n🔌 SignalR Implementation:`);
        console.log(`  SessionHub Connect:  ${testResults.signalr.questionSubmission.success ? '✅' : '❌'} (${testResults.signalr.questionSubmission.time}ms)`);
        console.log(`  QAHub Connect:       ${testResults.signalr.questionVoting.success ? '✅' : '❌'} (${testResults.signalr.questionVoting.time}ms)`);
        console.log(`  AnnotationHub:       ${testResults.signalr.participantLoading.success ? '✅' : '❌'} (${testResults.signalr.participantLoading.time}ms)`);
        console.log(`  Real-time Messaging: ${testResults.signalr.participantUpdates.success ? '✅' : '❌'} (${testResults.signalr.participantUpdates.time}ms)`);
        console.log(`  Overall Score: ${signalrScore}/100`);

        console.log(`\n🎯 RECOMMENDATION:`);
        if (httpScore > signalrScore) {
            console.log(`  ✅ KEEP HTTP API (Score: ${httpScore} vs ${signalrScore})`);
            console.log(`  📝 HTTP APIs are more reliable and performant for this application`);
            console.log(`  🔧 Consider removing SignalR hubs to reduce complexity`);
        } else if (signalrScore > httpScore) {
            console.log(`  ✅ KEEP SIGNALR HUBS (Score: ${signalrScore} vs ${httpScore})`);
            console.log(`  📝 SignalR provides better real-time capabilities`);
            console.log(`  🔧 Consider migrating remaining HTTP operations to SignalR`);
        } else {
            console.log(`  ⚖️ TIED SCORES (HTTP: ${httpScore}, SignalR: ${signalrScore})`);
            console.log(`  📝 Both implementations have similar reliability`);
            console.log(`  🔧 Choose SignalR for real-time features, HTTP for CRUD operations`);
        }

        // Generate detailed error report
        const errors = collectErrors();
        if (errors.length > 0) {
            console.log(`\n❌ ERROR SUMMARY:`);
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.type}: ${error.message}`);
            });
        }

        // Assert that at least one implementation works
        expect(httpScore > 0 || signalrScore > 0,
            'At least one implementation (HTTP or SignalR) should be functional').toBeTruthy();
    });
});

function calculateScore(results: any): number {
    let score = 0;
    let total = 0;

    Object.values(results).forEach((result: any) => {
        total += 25; // Each test is worth 25 points
        if (result.success) {
            score += 25;
            // Bonus points for good performance (under 1000ms)
            if (result.time < 1000) {
                score += 5;
            }
        }
    });

    return Math.min(100, Math.round((score / total) * 100));
}

function collectErrors(): Array<{ type: string, message: string }> {
    const errors: Array<{ type: string, message: string }> = [];

    // HTTP errors
    Object.entries(testResults.http).forEach(([key, result]: [string, any]) => {
        if (!result.success && result.error) {
            errors.push({
                type: `HTTP ${key}`,
                message: result.error
            });
        }
    });

    // SignalR errors
    Object.entries(testResults.signalr).forEach(([key, result]: [string, any]) => {
        if (!result.success && result.error) {
            errors.push({
                type: `SignalR ${key}`,
                message: result.error
            });
        }
    });

    return errors;
}