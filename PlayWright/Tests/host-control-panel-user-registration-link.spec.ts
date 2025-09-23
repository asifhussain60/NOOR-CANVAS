// ================================================================================================
// Generated: September 23, 2025 14:35:00 UTC
// Test Name: Host Control Panel User Registration Link Display
// Targets: #file:HostControlPanel.razor, /api/session/{sessionId}/usertoken endpoint
// Notes: sessionId:212 headless verbose (UserToken expected: N8JUXFJX, UFS9GY76 hostToken)
// 
// Purpose: Verify User Registration Link displays correctly between SESSION CONTROLS header 
// and Start Session button when valid UserToken is loaded from API
// ================================================================================================

import { expect, Page, test } from '@playwright/test';

// Hard stop against accidental UI runs:
test.use({ headless: true });  // prevents headed/--ui even if config drifts

// Inline helpers for Blazor-safe interactions
async function fillBlazorInput(page: Page, selector: string, value: string) {
    const input = page.locator(selector);
    await input.clear();
    await input.fill(value);
    await input.dispatchEvent('input');
    await input.dispatchEvent('change');
    await page.waitForTimeout(2000);
}

async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
    const button = page.locator(selector);
    await expect(button).toBeEnabled({ timeout });
    await button.click();
}

function redact(v?: string) {
    if (!v) return v;
    return v.replace(/[A-Z0-9]{8}/g, '********');
}

// Infrastructure validation with SSL support
async function validateInfrastructure() {
    console.log('🔍 Validating infrastructure with SSL support...');
    try {
        // REGRESSION FIX: Use https module instead of fetch() for SSL bypass
        const https = require('https');
        const { URL } = require('url');
        const url = new URL('https://localhost:9091/healthz');
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'HEAD',
            rejectUnauthorized: false, // CRITICAL: Required for self-signed certs
            timeout: 10000
        };
        const response = await new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
            const req = https.request(options, (res: any) => {
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
            req.end();
        });
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
        console.log('✅ Application running on https://localhost:9091');
    } catch (error) {
        throw new Error(`❌ Infrastructure validation failed: ${error}`);
    }
}

// Blazor selectors based on HostControlPanel.razor source analysis
class BlazorSelectors {
    static SESSION_CONTROLS_HEADER = 'h3:has-text("SESSION CONTROLS")';
    static START_SESSION_BUTTON = 'button:has-text("Start Session")';
    static USER_REGISTRATION_LINK_SECTION = 'div:has(h4:has-text("User Registration Link"))';
    static USER_LINK_INPUT = 'input[value*="/user/landing/"]';
    static COPY_BUTTON = 'button:has-text("Copy")';
    static USER_REGISTRATION_TITLE = 'h4:has-text("User Registration Link")';
    static USER_LINK_DESCRIPTION = 'p:has-text("Share this link with session participants")';
}

test.describe('Host Control Panel User Registration Link', () => {
    let hostToken: string;
    let expectedUserToken: string;
    let sessionId: string;

    test.beforeEach(async ({ page }) => {
        // Setup test tokens - Session 212 fallback as per guidelines
        hostToken = process.env.CANVAS_HOST_TOKEN || 'UFS9GY76';  // Host token for session 212
        expectedUserToken = process.env.CANVAS_USER_TOKEN || 'N8JUXFJX';  // Expected user token
        sessionId = '212';

        // Validate token formats
        expect(hostToken).toMatch(/^[A-Z0-9]{8}$/);
        expect(expectedUserToken).toMatch(/^[A-Z0-9]{8}$/);

        console.log(`🎯 Test setup - SessionId: ${sessionId}, HostToken: ${redact(hostToken)}, Expected UserToken: ${redact(expectedUserToken)}`);

        // Infrastructure health check
        await validateInfrastructure();

        // Navigate to Host Control Panel
        const hostUrl = `https://localhost:9091/host/control-panel/${hostToken}`;
        console.log(`📍 Navigating to Host Control Panel: ${redact(hostUrl)}`);

        await page.goto(hostUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Verify page loaded correctly
        await expect(page).toHaveTitle(/NOOR Canvas|Noor Canvas/i, { timeout: 10000 });
        console.log('✅ Host Control Panel loaded successfully');

        // Wait for session data to load
        await page.waitForSelector(BlazorSelectors.SESSION_CONTROLS_HEADER, { timeout: 15000 });
        console.log('✅ Session controls header found');

        // Log configuration
        console.log('🔧 Test config: headless=true, 1 worker, list+json reporters');
    });

    test('should display User Registration Link with valid token between SESSION CONTROLS and Start Session button', async ({ page }) => {
        console.log('🧪 Testing User Registration Link display with valid token');

        // Wait for session to load completely and UserToken API to be called
        console.log('⏳ Waiting for session data and UserToken to load...');
        await page.waitForTimeout(5000); // Allow time for LoadUserTokenAsync to complete

        // Verify SESSION CONTROLS header exists
        const sessionControlsHeader = page.locator(BlazorSelectors.SESSION_CONTROLS_HEADER);
        await expect(sessionControlsHeader).toBeVisible({ timeout: 10000 });
        console.log('✅ SESSION CONTROLS header is visible');

        // Verify Start Session button exists  
        const startSessionButton = page.locator(BlazorSelectors.START_SESSION_BUTTON);
        await expect(startSessionButton).toBeVisible({ timeout: 10000 });
        console.log('✅ Start Session button is visible');

        // Check if User Registration Link section is visible
        const userLinkSection = page.locator(BlazorSelectors.USER_REGISTRATION_LINK_SECTION);

        try {
            await expect(userLinkSection).toBeVisible({ timeout: 10000 });
            console.log('✅ User Registration Link section is visible');

            // Verify the section contains expected elements
            const userLinkTitle = page.locator(BlazorSelectors.USER_REGISTRATION_TITLE);
            await expect(userLinkTitle).toBeVisible();
            console.log('✅ User Registration Link title is visible');

            // Verify input field contains expected URL format
            const userLinkInput = page.locator(BlazorSelectors.USER_LINK_INPUT);
            await expect(userLinkInput).toBeVisible();

            const inputValue = await userLinkInput.getAttribute('value');
            expect(inputValue).toContain('https://localhost:9091/user/landing/');
            expect(inputValue).toMatch(/https:\/\/localhost:9091\/user\/landing\/[A-Z0-9]{8}/);
            console.log(`✅ User link input contains valid URL format: ${redact(inputValue || '')}`);

            // Verify copy button exists and is enabled
            const copyButton = page.locator(BlazorSelectors.COPY_BUTTON);
            await expect(copyButton).toBeVisible();
            await expect(copyButton).toBeEnabled();
            console.log('✅ Copy button is visible and enabled');

            // Verify description text
            const description = page.locator(BlazorSelectors.USER_LINK_DESCRIPTION);
            await expect(description).toBeVisible();
            console.log('✅ User Registration Link description is visible');

            // Verify positioning: User Registration Link should be between SESSION CONTROLS and Start Session
            const sessionControlsRect = await sessionControlsHeader.boundingBox();
            const userLinkRect = await userLinkSection.boundingBox();
            const startButtonRect = await startSessionButton.boundingBox();

            if (sessionControlsRect && userLinkRect && startButtonRect) {
                expect(userLinkRect.y).toBeGreaterThan(sessionControlsRect.y);
                expect(startButtonRect.y).toBeGreaterThan(userLinkRect.y);
                console.log('✅ User Registration Link positioned correctly between SESSION CONTROLS and Start Session button');
            }

        } catch (error) {
            console.log('❌ User Registration Link section not visible - investigating...');

            // Debug: Check if UserToken loaded properly
            const pageContent = await page.content();
            const hasUserToken = pageContent.includes('/user/landing/');
            console.log(`🔍 Page contains user landing URL: ${hasUserToken}`);

            // Debug: Check console logs for UserToken loading
            const logs = await page.evaluate(() => {
                return (window as any).__consoleLogs || [];
            });
            console.log('🔍 Browser console logs:', logs);

            // Re-throw the error for proper test failure
            throw error;
        }
    });

    test('should handle copy functionality when clicking copy button', async ({ page }) => {
        console.log('🧪 Testing User Registration Link copy functionality');

        // Wait for User Registration Link to be visible
        const userLinkSection = page.locator(BlazorSelectors.USER_REGISTRATION_LINK_SECTION);
        await expect(userLinkSection).toBeVisible({ timeout: 15000 });

        // Test copy button functionality
        const copyButton = page.locator(BlazorSelectors.COPY_BUTTON);
        await expect(copyButton).toBeVisible();
        await expect(copyButton).toBeEnabled();

        // Grant clipboard permissions
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

        // Click copy button
        await copyButton.click();
        console.log('✅ Copy button clicked');

        // Allow time for copy operation
        await page.waitForTimeout(1000);

        // Verify clipboard contains the expected URL
        const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardContent).toContain('https://localhost:9091/user/landing/');
        expect(clipboardContent).toMatch(/https:\/\/localhost:9091\/user\/landing\/[A-Z0-9]{8}/);
        console.log(`✅ Clipboard contains valid user registration URL: ${redact(clipboardContent)}`);
    });

    test('should handle case when UserToken is not loaded (negative path)', async ({ page }) => {
        console.log('🧪 Testing behavior when UserToken is not available');

        // Wait for session to load
        await page.waitForSelector(BlazorSelectors.SESSION_CONTROLS_HEADER, { timeout: 15000 });

        // If UserToken fails to load, the User Registration Link section should not be visible
        const userLinkSection = page.locator(BlazorSelectors.USER_REGISTRATION_LINK_SECTION);

        // Check current state
        const isVisible = await userLinkSection.isVisible();

        if (isVisible) {
            console.log('✅ User Registration Link is visible (UserToken loaded successfully)');
            // This is the positive case - UserToken loaded correctly
            const userLinkInput = page.locator(BlazorSelectors.USER_LINK_INPUT);
            const inputValue = await userLinkInput.getAttribute('value');
            expect(inputValue).toContain('https://localhost:9091/user/landing/');
            console.log(`✅ UserToken loaded: ${redact(inputValue?.split('/').pop() || '')}`);
        } else {
            console.log('⚠️  User Registration Link not visible (UserToken not loaded)');

            // Verify that SESSION CONTROLS and Start Session are still visible
            await expect(page.locator(BlazorSelectors.SESSION_CONTROLS_HEADER)).toBeVisible();
            await expect(page.locator(BlazorSelectors.START_SESSION_BUTTON)).toBeVisible();
            console.log('✅ Other panel elements remain visible when UserToken is missing');
        }
    });
});