/**
 * [DEBUG-WORKITEM:hostcanvas:test] Playwright test for user routing fix
 * Tests that users are routed to SessionWaiting by default, and only to SessionCanvas when:
 * 1. Host clicks "Start Session" button, or
 * 2. User joins after session has started
 * ;CLEANUP_OK
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:9090';

test.describe('User Routing Fix - hostcanvas', () => {
    test.beforeEach(async ({ page }) => {
        // Enable detailed console logging for debugging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`[${msg.type().toUpperCase()}]`, msg.text());
            }
        });
    });

    test('User registration should route to SessionWaiting by default (before session start)', async ({ page }) => {
        // [DEBUG-WORKITEM:hostcanvas:test] First create a session as host ;CLEANUP_OK

        // Step 1: Create a session as host
        await page.goto(`${BASE_URL}/host/session-opener`);
        await expect(page.locator('h1')).toContainText('HOST SESSION OPENER');

        // Fill session details
        await page.fill('[data-testid="session-name-input"]', 'User Routing Test Session');
        await page.fill('[data-testid="session-description-input"]', 'Testing user routing behavior');
        await page.click('[data-testid="create-session-button"]');

        // Wait for session creation and extract host token
        await expect(page.locator('[data-testid="session-created-success"]')).toBeVisible({ timeout: 10000 });

        // Get the user registration link
        const userLink = await page.locator('[data-testid="user-registration-link"]').inputValue();
        const userToken = userLink.split('/').pop()?.replace(/[?#].*/, '') || '';

        console.log(`[DEBUG-WORKITEM:hostcanvas:test] User token: ${userToken} ;CLEANUP_OK`);

        // Step 2: Register as a user (session not started yet)
        await page.goto(`${BASE_URL}/user`);
        await expect(page.locator('h1')).toContainText('JOIN SESSION');

        // Fill user registration
        await page.fill('[data-testid="token-input"]', userToken);
        await page.fill('[data-testid="name-input"]', 'Test User');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.selectOption('[data-testid="country-select"]', 'United States');

        await page.click('[data-testid="join-session-button"]');

        // [DEBUG-WORKITEM:hostcanvas:test] Verify user is routed to SessionWaiting (not SessionCanvas) ;CLEANUP_OK
        await expect(page).toHaveURL(new RegExp(`/session/waiting/${userToken}`), { timeout: 10000 });
        await expect(page.locator('h1')).toContainText(/WAITING|SESSION/);
    });

    test('User should route to SessionCanvas when joining after session started', async ({ page, context }) => {
        // [DEBUG-WORKITEM:hostcanvas:test] Create session and start it before user joins ;CLEANUP_OK

        // Step 1: Create and start session as host in separate page
        const hostPage = await context.newPage();

        await hostPage.goto(`${BASE_URL}/host/session-opener`);
        await expect(hostPage.locator('h1')).toContainText('HOST SESSION OPENER');

        // Create session
        await hostPage.fill('[data-testid="session-name-input"]', 'Late Joiner Test Session');
        await hostPage.fill('[data-testid="session-description-input"]', 'Testing late user routing');
        await hostPage.click('[data-testid="create-session-button"]');

        await expect(hostPage.locator('[data-testid="session-created-success"]')).toBeVisible({ timeout: 10000 });

        // Get user token and navigate to control panel
        const userLink = await hostPage.locator('[data-testid="user-registration-link"]').inputValue();
        const userToken = userLink.split('/').pop()?.replace(/[?#].*/, '') || '';

        await hostPage.click('[data-testid="load-control-panel-button"]');
        await expect(hostPage).toHaveURL(/\/host\/control-panel\//, { timeout: 10000 });

        // Start the session
        await expect(hostPage.locator('[data-testid="start-session-button"]')).toBeVisible({ timeout: 10000 });
        await hostPage.click('[data-testid="start-session-button"]');

        // Wait for session to start
        await expect(hostPage.locator('text=Session started successfully')).toBeVisible({ timeout: 10000 });

        // Step 2: Register as user AFTER session has started
        await page.goto(`${BASE_URL}/user`);
        await page.fill('[data-testid="token-input"]', userToken);
        await page.fill('[data-testid="name-input"]', 'Late Joiner');
        await page.fill('[data-testid="email-input"]', 'late@example.com');
        await page.selectOption('[data-testid="country-select"]', 'Canada');

        await page.click('[data-testid="join-session-button"]');

        // [DEBUG-WORKITEM:hostcanvas:test] Verify user routes directly to SessionCanvas ;CLEANUP_OK
        await expect(page).toHaveURL(new RegExp(`/session/canvas/${userToken}`), { timeout: 10000 });
        await expect(page.locator('h1')).toContainText(/CANVAS|SESSION/);

        await hostPage.close();
    });

    test('Users in waiting room should route to SessionCanvas when host starts session', async ({ page, context }) => {
        // [DEBUG-WORKITEM:hostcanvas:test] Test SessionBegan SignalR event routing ;CLEANUP_OK

        // Step 1: Create session as host
        const hostPage = await context.newPage();

        await hostPage.goto(`${BASE_URL}/host/session-opener`);
        await hostPage.fill('[data-testid="session-name-input"]', 'SignalR Routing Test');
        await hostPage.fill('[data-testid="session-description-input"]', 'Testing SessionBegan event');
        await hostPage.click('[data-testid="create-session-button"]');

        await expect(hostPage.locator('[data-testid="session-created-success"]')).toBeVisible({ timeout: 10000 });

        const userLink = await hostPage.locator('[data-testid="user-registration-link"]').inputValue();
        const userToken = userLink.split('/').pop()?.replace(/[?#].*/, '') || '';

        // Step 2: Register user and go to waiting room
        await page.goto(`${BASE_URL}/user`);
        await page.fill('[data-testid="token-input"]', userToken);
        await page.fill('[data-testid="name-input"]', 'Waiting User');
        await page.fill('[data-testid="email-input"]', 'waiting@example.com');
        await page.selectOption('[data-testid="country-select"]', 'United Kingdom');

        await page.click('[data-testid="join-session-button"]');

        // Verify in waiting room
        await expect(page).toHaveURL(new RegExp(`/session/waiting/${userToken}`));

        // Step 3: Host starts session
        await hostPage.click('[data-testid="load-control-panel-button"]');
        await expect(hostPage).toHaveURL(/\/host\/control-panel\//);

        await expect(hostPage.locator('[data-testid="start-session-button"]')).toBeVisible({ timeout: 10000 });
        await hostPage.click('[data-testid="start-session-button"]');

        // Step 4: Verify user automatically routes to canvas via SignalR
        await expect(page).toHaveURL(new RegExp(`/session/canvas/${userToken}`), { timeout: 15000 });
        await expect(page.locator('h1')).toContainText(/CANVAS|SESSION/);

        await hostPage.close();
    });
});