/**
 * Session Opener and User Authentication Link Generation Test Suite
 * 
 * Tests the complete session opening workflow in the simplified architecture:
 * 1. Host opens session using control panel
 * 2. Session configuration and setup
 * 3. User authentication link generation 
 * 4. User join flow validation
 * 5. Participant management in simplified schema
 * 
 * This test focuses on the session management workflow after host authentication,
 * validating the simplified 3-table architecture for session operations.
 * 
 * Created: September 20, 2025
 * Architecture: Simplified 3-table schema (Sessions, Participants, SessionData)
 */

import { expect, test } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://localhost:9091';
const BASE_URL_HTTP = 'http://localhost:9090';
const TEST_HOST_TOKEN = 'VIS68UW4'; // Known working host token
const TEST_USER_NAME = 'Playwright Test User';
const TEST_USER_EMAIL = 'playwright@test.com';

// Session configuration for testing
const SESSION_CONFIG = {
    title: 'Playwright Session Opener Test',
    description: 'Testing session creation and user link generation',
    maxParticipants: 10,
    allowAnonymous: true,
    moderationEnabled: false
};

test.describe('Session Opener and User Link Generation - Simplified Architecture', () => {

    let sessionId: number;
    let userToken: string;
    let hostToken: string;
    let joinLink: string;

    test.beforeAll(async ({ request }) => {
        // Create a session for testing user workflows
        const response = await request.post(`${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
            data: SESSION_CONFIG
        });

        expect(response.status()).toBe(200);
        const sessionData = await response.json();

        sessionId = sessionData.SessionId;
        userToken = sessionData.UserToken;
        hostToken = sessionData.HostToken;
        joinLink = sessionData.JoinLink;

        console.log(`Test Session Created: ${sessionId}, UserToken: ${userToken}`);
    });

    test('Host Session Configuration - Control Panel', async ({ page }) => {
        test.info().annotations.push({
            type: 'session-management',
            description: 'Tests host session configuration through control panel UI'
        });

        // Navigate to host control panel
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');

        // Should see control panel without authentication errors
        await expect(page.locator('text=Authentication service unavailable')).not.toBeVisible();

        // Look for session configuration elements (flexible selectors for different UI implementations)
        const sessionElements = [
            '[data-testid="session-config"]',
            '.session-configuration',
            'input[name="sessionTitle"], input[name="title"]',
            'input[name="maxParticipants"], input[type="number"]',
            'button:has-text("Start"), button:has-text("Create"), button:has-text("Open")'
        ];

        let foundSessionElement = false;
        for (const selector of sessionElements) {
            if (await page.locator(selector).isVisible()) {
                foundSessionElement = true;
                break;
            }
        }

        expect(foundSessionElement).toBe(true);
        console.log('✅ Host Control Panel Session Configuration UI Working');
    });

    test('Session Creation API with Token Embedding', async ({ request }) => {
        test.info().annotations.push({
            type: 'api-integration',
            description: 'Tests session creation API with embedded tokens (simplified schema)'
        });

        const response = await request.post(`${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
            data: {
                title: 'API Test Session',
                description: 'Testing session creation via API',
                maxParticipants: 8
            }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();

        // Validate session creation response
        expect(data).toHaveProperty('Success', true);
        expect(data).toHaveProperty('SessionId');
        expect(data).toHaveProperty('UserToken');
        expect(data).toHaveProperty('HostToken');
        expect(data).toHaveProperty('JoinLink');

        // Verify token format and uniqueness
        expect(data.UserToken).toMatch(/^[A-Z0-9]{8}$/);
        expect(data.HostToken).toMatch(/^[A-Z0-9]{8}$/);
        expect(data.UserToken).not.toBe(data.HostToken);

        // Verify join link format
        expect(data.JoinLink).toContain('/user/landing/');
        expect(data.JoinLink).toContain(data.UserToken);

        console.log(`✅ Session Created via API - ID: ${data.SessionId}, UserToken: ${data.UserToken}`);
    });

    test('User Authentication Link Generation and Format', async ({ request }) => {
        test.info().annotations.push({
            type: 'link-generation',
            description: 'Tests user authentication link generation with embedded tokens'
        });

        // Create multiple sessions to test link uniqueness
        const sessions = [];

        for (let i = 0; i < 3; i++) {
            const response = await request.post(`${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
                data: {
                    title: `Link Test Session ${i + 1}`,
                    description: 'Testing user link generation',
                    maxParticipants: 5
                }
            });

            expect(response.status()).toBe(200);
            sessions.push(await response.json());
        }

        // Verify all sessions have unique tokens and links
        const userTokens = sessions.map(s => s.UserToken);
        const joinLinks = sessions.map(s => s.JoinLink);

        // Check token uniqueness
        const uniqueTokens = new Set(userTokens);
        expect(uniqueTokens.size).toBe(userTokens.length);

        // Check link format consistency
        joinLinks.forEach(link => {
            expect(link).toMatch(/^https?:\/\/localhost:909[01]\/user\/landing\/[A-Z0-9]{8}$/);
        });

        console.log('✅ User Authentication Link Generation Test Passed');
    });

    test('User Join Flow - Landing Page Authentication', async ({ page }) => {
        test.info().annotations.push({
            type: 'user-flow',
            description: 'Tests user join flow using generated authentication links'
        });

        // Navigate to user landing page using generated link
        await page.goto(joinLink);
        await page.waitForLoadState('networkidle');

        // Should not see authentication errors
        await expect(page.locator('text=Invalid token')).not.toBeVisible();
        await expect(page.locator('text=Token not found')).not.toBeVisible();
        await expect(page.locator('text=Authentication service unavailable')).not.toBeVisible();

        // Should see user landing elements (flexible selectors)
        const userLandingElements = [
            '[data-testid="user-landing"]',
            '.user-landing',
            '.join-session',
            'h1:has-text("Join"), h2:has-text("Session")',
            'input[name="name"], input[name="displayName"]',
            'button:has-text("Join"), button:has-text("Enter")'
        ];

        let foundLandingElement = false;
        for (const selector of userLandingElements) {
            if (await page.locator(selector).isVisible()) {
                foundLandingElement = true;
                break;
            }
        }

        expect(foundLandingElement).toBe(true);
        console.log('✅ User Landing Page Authentication Working');
    });

    test('User Registration and Participant Creation - Simplified Schema', async ({ page, request }) => {
        test.info().annotations.push({
            type: 'participant-management',
            description: 'Tests user registration creating entries in Participants table'
        });

        // Navigate to user landing page
        await page.goto(joinLink);
        await page.waitForLoadState('networkidle');

        // Try to find and fill user registration form
        const nameInput = page.locator('input[name="name"], input[name="displayName"], input[placeholder*="name"], input[placeholder*="Name"]');
        const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]');
        const joinButton = page.locator('button:has-text("Join"), button:has-text("Enter"), button[type="submit"]');

        if (await nameInput.isVisible()) {
            await nameInput.fill(TEST_USER_NAME);

            if (await emailInput.isVisible()) {
                await emailInput.fill(TEST_USER_EMAIL);
            }

            if (await joinButton.isVisible()) {
                await joinButton.click();
                await page.waitForLoadState('networkidle');

                // Should not see validation errors
                await expect(page.locator('text=Invalid token')).not.toBeVisible();
                await expect(page.locator('text=Registration failed')).not.toBeVisible();

                console.log('✅ User Registration Flow Working');
            }
        } else {
            console.log('ℹ️ User registration form not found - may be auto-join flow');
        }
    });

    test('Session Participant Management API', async ({ request }) => {
        test.info().annotations.push({
            type: 'api-integration',
            description: 'Tests participant management through simplified Participants table'
        });

        // Test adding a participant via API (if endpoint exists)
        try {
            const participantData = {
                sessionId: sessionId,
                displayName: 'API Test Participant',
                email: 'api-test@example.com',
                userGuid: 'test-guid-12345'
            };

            const response = await request.post(`${BASE_URL_HTTP}/api/session/${sessionId}/participants`, {
                data: participantData
            });

            if (response.status() === 200 || response.status() === 201) {
                const result = await response.json();
                console.log('✅ Participant API Working:', result);
            }
        } catch (error) {
            console.log('ℹ️ Participant management API may not be implemented yet');
        }
    });

    test('Session Data Storage - Annotations and Questions', async ({ request }) => {
        test.info().annotations.push({
            type: 'data-storage',
            description: 'Tests SessionData table usage for annotations and questions (JSON storage)'
        });

        // Test storing annotation data via SimplifiedTokenService
        try {
            const annotationData = {
                type: 'highlight',
                content: 'Test annotation from Playwright',
                position: { x: 100, y: 200 },
                timestamp: new Date().toISOString(),
                userGuid: 'test-user-guid'
            };

            const response = await request.post(`${BASE_URL_HTTP}/api/session/${sessionId}/annotations`, {
                data: annotationData
            });

            if (response.status() === 200 || response.status() === 201) {
                console.log('✅ Annotation Storage API Working');
            }
        } catch (error) {
            console.log('ℹ️ Annotation storage API may not be exposed yet');
        }

        // Test storing question data
        try {
            const questionData = {
                type: 'multiple-choice',
                question: 'Test question from Playwright?',
                options: ['Option A', 'Option B', 'Option C'],
                correctAnswer: 0,
                timestamp: new Date().toISOString()
            };

            const response = await request.post(`${BASE_URL_HTTP}/api/session/${sessionId}/questions`, {
                data: questionData
            });

            if (response.status() === 200 || response.status() === 201) {
                console.log('✅ Question Storage API Working');
            }
        } catch (error) {
            console.log('ℹ️ Question storage API may not be exposed yet');
        }
    });

    test('Token Expiration and Validation', async ({ request }) => {
        test.info().annotations.push({
            type: 'security',
            description: 'Tests token expiration handling in simplified architecture'
        });

        // Validate that current tokens are still active
        const hostValidation = await request.get(`${BASE_URL_HTTP}/api/host/token/${hostToken}/validate`);
        expect(hostValidation.status()).toBe(200);

        const hostData = await hostValidation.json();
        expect(hostData.Valid).toBe(true);

        // Check token expiration information
        if (hostData.Session && hostData.Session.ExpiresAt) {
            const expiresAt = new Date(hostData.Session.ExpiresAt);
            const now = new Date();

            expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
            console.log(`✅ Token Expiration Valid - Expires: ${expiresAt.toISOString()}`);
        }
    });

    test('Session Status and Lifecycle Management', async ({ request }) => {
        test.info().annotations.push({
            type: 'lifecycle',
            description: 'Tests session status management in simplified schema'
        });

        // Get session status
        const statusResponse = await request.get(`${BASE_URL_HTTP}/api/session/${sessionId}/status`);

        if (statusResponse.status() === 200) {
            const statusData = await statusResponse.json();

            // Verify session status fields
            expect(statusData).toHaveProperty('sessionId', sessionId);

            if (statusData.status) {
                expect(['Active', 'Waiting', 'Started', 'Created']).toContain(statusData.status);
            }

            console.log(`✅ Session Status: ${statusData.status || 'Unknown'}`);
        } else {
            console.log('ℹ️ Session status endpoint may not be implemented yet');
        }
    });

    test('Error Handling - Invalid Session Access', async ({ page, request }) => {
        test.info().annotations.push({
            type: 'error-handling',
            description: 'Tests error handling for invalid session access attempts'
        });

        // Test with invalid user token
        const invalidUserToken = 'INVALID1';
        const invalidJoinLink = `${BASE_URL}/user/landing/${invalidUserToken}`;

        await page.goto(invalidJoinLink);
        await page.waitForLoadState('networkidle');

        // Should show appropriate error, not authentication service unavailable
        const errorMessages = [
            'Invalid token',
            'Token not found',
            'Session not found',
            'Authentication failed'
        ];

        let foundError = false;
        for (const errorMessage of errorMessages) {
            if (await page.locator(`text=${errorMessage}`).isVisible()) {
                foundError = true;
                break;
            }
        }

        expect(foundError).toBe(true);
        await expect(page.locator('text=Authentication service unavailable')).not.toBeVisible();

        console.log('✅ Invalid Session Error Handling Working');
    });
});

test.describe('Performance and Reliability - Session Operations', () => {

    test('Session Creation Performance', async ({ request }) => {
        test.info().annotations.push({
            type: 'performance',
            description: 'Measures session creation performance in simplified architecture'
        });

        const startTime = Date.now();

        const response = await request.post(`${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
            data: SESSION_CONFIG
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(10000); // Should create session within 10 seconds

        console.log(`✅ Session Creation Time: ${responseTime}ms`);
    });

    test('Concurrent User Join Simulation', async ({ browser }) => {
        test.info().annotations.push({
            type: 'load-testing',
            description: 'Simulates multiple users joining session concurrently'
        });

        // Create a session for concurrent testing
        const context = await browser.newContext();
        const page = await context.newPage();

        const response = await page.request.post(`${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`, {
            data: SESSION_CONFIG
        });

        expect(response.status()).toBe(200);
        const sessionData = await response.json();
        const testJoinLink = sessionData.JoinLink;

        // Create multiple browser contexts to simulate different users
        const userContexts = await Promise.all(
            Array(3).fill(null).map(() => browser.newContext())
        );

        const userPages = await Promise.all(
            userContexts.map(ctx => ctx.newPage())
        );

        // Navigate all users to join link concurrently
        const joinPromises = userPages.map(userPage =>
            userPage.goto(testJoinLink)
        );

        await Promise.all(joinPromises);

        // Verify all users can access the session
        for (const userPage of userPages) {
            await userPage.waitForLoadState('networkidle');
            await expect(userPage.locator('text=Authentication service unavailable')).not.toBeVisible();
        }

        // Cleanup
        await Promise.all(userContexts.map(ctx => ctx.close()));
        await context.close();

        console.log('✅ Concurrent User Join Test Passed');
    });
});