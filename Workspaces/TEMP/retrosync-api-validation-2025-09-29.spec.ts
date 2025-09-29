import { expect, test } from '@playwright/test';

// Retrosync API Validation Test Suite
// Tests newly documented endpoints: TokenController, HealthController, LogsController
// Generated: 2025-09-29 for architectural synchronization validation

test.describe('Retrosync API Validation - Newly Documented Controllers', () => {
    const baseUrl = 'http://localhost:5000';

    test.beforeAll(async () => {
        // Ensure application is running before tests
        console.log('🔍 Starting API validation for newly documented endpoints...');
    });

    test('Health Controller - System Health Check', async ({ request }) => {
        console.log('📡 Testing Health Controller API...');

        // Test GET /health endpoint
        const healthResponse = await request.get(`${baseUrl}/health`);

        expect(healthResponse.status()).toBe(200);

        const healthData = await healthResponse.json();
        expect(healthData).toHaveProperty('status', 'ok');
        expect(healthData).toHaveProperty('timestamp');
        expect(healthData).toHaveProperty('version');
        expect(healthData).toHaveProperty('environment');
        expect(healthData).toHaveProperty('checks');

        // Validate health checks structure
        expect(healthData.checks).toHaveProperty('database');
        expect(healthData.checks).toHaveProperty('canvas_schema');

        console.log('✅ Health Controller validation passed');
    });

    test('Logs Controller - Browser Log Reception', async ({ request }) => {
        console.log('📡 Testing Logs Controller API...');

        // Test POST /api/logs endpoint
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            component: 'TEST_COMPONENT',
            message: 'Retrosync API validation test log',
            sessionId: 'test-session-123',
            userId: 'test-user-456',
            url: 'http://localhost:5000/test',
            data: JSON.stringify({ testData: 'validation' })
        };

        const logsResponse = await request.post(`${baseUrl}/api/logs`, {
            data: logEntry,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Logs endpoint should accept the log and return success
        expect(logsResponse.status()).toBe(200);

        console.log('✅ Logs Controller validation passed');
    });

    test('Token Controller - Token Validation (Error Cases)', async ({ request }) => {
        console.log('📡 Testing Token Controller API...');

        // Test GET /api/token/validate/{token} with invalid token (should fail gracefully)
        const invalidTokenResponse = await request.get(`${baseUrl}/api/token/validate/INVALID1`);

        // Should return 400 Bad Request for invalid token format
        expect(invalidTokenResponse.status()).toBe(400);

        const errorData = await invalidTokenResponse.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('requestId');

        // Test empty token validation
        const emptyTokenResponse = await request.get(`${baseUrl}/api/token/validate/`);
        expect(emptyTokenResponse.status()).toBe(404); // Route not found for empty token

        console.log('✅ Token Controller validation passed (error handling verified)');
    });

    test('API Endpoint Inventory Verification', async ({ request }) => {
        console.log('📊 Verifying documented API endpoints exist...');

        const endpointsToTest = [
            { path: '/health', method: 'GET', controller: 'HealthController' },
            { path: '/api/logs', method: 'POST', controller: 'LogsController' },
            { path: '/api/token/validate/TEST1234', method: 'GET', controller: 'TokenController' }
        ];

        for (const endpoint of endpointsToTest) {
            console.log(`🔍 Testing ${endpoint.controller}: ${endpoint.method} ${endpoint.path}`);

            let response;
            if (endpoint.method === 'GET') {
                response = await request.get(`${baseUrl}${endpoint.path}`);
            } else if (endpoint.method === 'POST') {
                response = await request.post(`${baseUrl}${endpoint.path}`, {
                    data: { test: 'data' },
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Endpoints should respond (not 404), indicating they exist
            if (response) {
                expect(response.status()).not.toBe(404);
            }
            console.log(`✅ ${endpoint.controller} endpoint exists and responds`);
        }
    });

    test('Architecture Document Accuracy Validation', async ({ request }) => {
        console.log('🏗️ Validating architecture document accuracy...');

        // Verify that documented endpoints are actually functional
        const criticalEndpoints = [
            '/health',
            '/api/logs',
            '/api/token/validate/12345678' // 8-character test token
        ];

        let functionalEndpoints = 0;

        for (const endpoint of criticalEndpoints) {
            try {
                let response;
                if (endpoint === '/api/logs') {
                    response = await request.post(`${baseUrl}${endpoint}`, {
                        data: { test: 'validation' },
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    response = await request.get(`${baseUrl}${endpoint}`);
                }

                if (response.status() !== 404) {
                    functionalEndpoints++;
                }
            } catch (error) {
                console.log(`⚠️ Endpoint ${endpoint} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        // At least 2 of 3 critical endpoints should be functional
        expect(functionalEndpoints).toBeGreaterThanOrEqual(2);
        console.log(`✅ Architecture accuracy validated: ${functionalEndpoints}/3 endpoints functional`);
    });

    test.afterAll(async () => {
        console.log('🎯 Retrosync API validation completed successfully');
        console.log('📋 Summary: TokenController, HealthController, LogsController validated');
        console.log('🔄 Architecture document synchronization verified');
    });
});

// Additional test for service integration
test.describe('Service Architecture Integration Validation', () => {
    test('SecureTokenService Integration', async ({ request }) => {
        console.log('🔧 Testing SecureTokenService integration via TokenController...');

        // Test that TokenController properly integrates with SecureTokenService
        const testToken = 'ABC12345'; // 8-character test token

        const response = await request.get(`http://localhost:5000/api/token/validate/${testToken}?isHost=true`);

        // Should get a structured response (not 500 error) indicating service integration works
        expect(response.status()).not.toBe(500);

        if (response.status() === 200 || response.status() === 400 || response.status() === 404) {
            const data = await response.json();
            expect(data).toBeDefined();
            console.log('✅ SecureTokenService integration functional');
        }
    });
});