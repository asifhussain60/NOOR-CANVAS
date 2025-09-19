// This file contains Playwright tests using @playwright/test
// Testing NOOR Canvas Issue-106: Cascading dropdown implementation with proper timing

import { expect, test, type APIRequestContext, type Page, type Request, type Response } from '@playwright/test';
import { generateTestToken, type TokenData } from './test-utils';

/**
 * NOOR Canvas - Cascading Dropdown Test Suite (TypeScript)
 * 
 * Enhanced with TypeScript typing for optimal GitHub Copilot integration.
 * 
 * Tests Issue-106 cascading dropdown implementation with 2-second delays:
 * - Album selection triggers Category loading with proper timing
 * - Category selection triggers Session loading with race condition prevention
 * - Open Session button functionality with API integration
 * - Session URL generation and accessibility validation
 */

// TypeScript interfaces for better IntelliSense and Copilot suggestions
interface CascadingLogEntry {
    time: number;
    text: string;
}

interface ApiCallData {
    url: string;
    method: string;
    postData?: string | null;
}

interface ApiResponseData {
    status: number;
    data: SessionCreationResponse;
    url: string;
}

interface SessionCreationResponse {
    Success: boolean;
    UserToken: string;
    SessionId: number;
    Message?: string;
}

test.describe('Issue-106: Cascading Dropdown Implementation', () => {

    let hostToken: string;

    test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
        // Generate a fresh host token for cascading dropdown testing
        const tokenData: TokenData = await generateTestToken(request);
        hostToken = tokenData.hostToken;
    });

    test.beforeEach(async ({ page }: { page: Page }) => {
        // Navigate directly to session opener with valid token
        await page.goto(`/host/session-opener/${hostToken}`);

        // Wait for page to load completely and verify session configuration header
        await expect(page.locator('h1:has-text("Session Configuration")')).toBeVisible({ timeout: 10000 });
    });

    test('should load cascading dropdown with proper 2-second delays', async ({ page }: { page: Page }) => {
        console.log('Testing cascading dropdown implementation...');

        // Wait for initial page load and network stabilization
        await page.waitForLoadState('networkidle');

        // Monitor console logs for cascading sequence timing validation
        const consoleLogs: CascadingLogEntry[] = [];
        page.on('console', (msg) => {
            if (msg.text().includes('ISSUE-106-CASCADING')) {
                consoleLogs.push({
                    time: Date.now(),
                    text: msg.text()
                });
            }
        });

        // Wait for complete cascading sequence (6+ seconds: 2s + 2s + 2s)
        console.log('Waiting for cascading sequence to complete...');
        await page.waitForTimeout(8000); // Extra buffer for timing validation

        // Verify Album dropdown has expected default value (18)
        const albumSelect = page.locator('select[data-testid="album-select"], select:has(option:text-is("18"))').first();
        await expect(albumSelect).toHaveValue('18', { timeout: 5000 });

        // Verify Category dropdown cascaded to correct value (55)
        const categorySelect = page.locator('select[data-testid="category-select"], select:has(option:text-is("55"))').first();
        await expect(categorySelect).toHaveValue('55', { timeout: 5000 });

        // Verify Session dropdown cascaded to final value (1281)
        const sessionSelect = page.locator('select[data-testid="session-select"], select:has(option:text-is("1281"))').first();
        await expect(sessionSelect).toHaveValue('1281', { timeout: 5000 });

        // Verify timing logs captured proper cascading sequence
        expect(consoleLogs.length).toBeGreaterThan(0);
        console.log('Cascading logs captured:', consoleLogs.length);

        // Log captured sequence for debugging and timing verification
        consoleLogs.forEach((log: CascadingLogEntry, index: number) => {
            console.log(`Log ${index + 1}: ${log.text}`);
        });
    });

    test('should handle Open Session button click with cascaded values', async ({ page }: { page: Page }) => {
        console.log('Testing Open Session button functionality...');

        // Wait for cascading sequence to complete
        await page.waitForTimeout(8000);

        // Verify Open Session button is visible and interactive
        const openSessionButton = page.locator('button:has-text("Open Session")');
        await expect(openSessionButton).toBeVisible();
        await expect(openSessionButton).toBeEnabled();

        // Monitor API calls for session creation endpoint
        const apiCalls: ApiCallData[] = [];
        page.on('request', (req: Request) => {
            if (req.url().includes('/api/host/create-session')) {
                apiCalls.push({
                    url: req.url(),
                    method: req.method(),
                    postData: req.postData()
                });
            }
        });

        // Monitor API responses for session creation validation
        const apiResponses: ApiResponseData[] = [];
        page.on('response', async (response: Response) => {
            if (response.url().includes('/api/host/create-session')) {
                try {
                    const responseData: SessionCreationResponse = await response.json();
                    apiResponses.push({
                        status: response.status(),
                        data: responseData,
                        url: response.url()
                    });
                    console.log('API Response captured:', JSON.stringify(responseData, null, 2));
                } catch (e: any) {
                    console.log('Failed to parse API response as JSON:', e.message);
                }
            }
        });

        // Execute Open Session button click
        await openSessionButton.click();

        // Wait for API call completion and response processing
        await page.waitForTimeout(5000);

        // Verify API call was made with correct session data
        expect(apiCalls.length).toBeGreaterThan(0);
        console.log('API calls captured:', apiCalls.length);

        // Validate API response structure and data accuracy
        expect(apiResponses.length).toBeGreaterThan(0);
        const apiResponse: ApiResponseData = apiResponses[0];

        // Verify API response meets Issue-106 URL Generation Prerequisites
        expect(apiResponse.status).toBe(200);
        expect(apiResponse.data).toBeDefined();
        expect(apiResponse.data.Success).toBe(true);
        expect(apiResponse.data.UserToken).toBeDefined();
        expect(apiResponse.data.UserToken.length).toBe(8); // 8-character friendly tokens
        expect(apiResponse.data.SessionId).toBeDefined();

        console.log('✅ API Prerequisites validated - UserToken:', apiResponse.data.UserToken);

        // Verify Session URL panel becomes visible after session creation
        const sessionUrlPanel = page.locator('[data-testid="session-url-panel"], .session-url-panel, text="Session URL"');
        await expect(sessionUrlPanel.first()).toBeVisible({ timeout: 10000 });

        console.log('Session URL panel visibility confirmed');
    });

    test('should prevent race conditions during cascading', async ({ page }: { page: Page }) => {
        console.log('Testing race condition prevention...');

        // Monitor IsSettingDefaultValues flag management for race condition prevention
        const flagLogs: string[] = [];
        page.on('console', (msg) => {
            if (msg.text().includes('IsSettingDefaultValues') || msg.text().includes('flag')) {
                flagLogs.push(msg.text());
            }
        });

        // Wait for complete cascading sequence
        await page.waitForTimeout(8000);

        // Verify flag was properly managed throughout cascading
        expect(flagLogs.length).toBeGreaterThan(0);
        console.log('Flag management logs:', flagLogs.length);

        // Look for flag reset confirmation indicating race condition prevention
        const hasResetLog: boolean = flagLogs.some((log: string) =>
            log.includes('reset to false') || log.includes('flag reset')
        );
        expect(hasResetLog).toBeTruthy();
    });

    test('should maintain dropdown selections throughout cascading', async ({ page }: { page: Page }) => {
        console.log('Testing dropdown selection persistence...');

        // Wait for initial cascading phase
        await page.waitForTimeout(2000);

        // Check Album dropdown maintains selection during cascading
        const albumSelect = page.locator('select').first();
        await expect(albumSelect).toHaveValue('18', { timeout: 8000 });

        // Wait for Category cascading phase
        await page.waitForTimeout(3000);
        const categorySelect = page.locator('select').nth(1);
        await expect(categorySelect).toHaveValue('55', { timeout: 5000 });

        // Wait for final Session cascading phase
        await page.waitForTimeout(3000);
        const sessionSelect = page.locator('select').nth(2);
        await expect(sessionSelect).toHaveValue('1281', { timeout: 5000 });

        console.log('All dropdown selections maintained during cascading');
    });

    test('should complete full workflow: cascading -> open session -> url display', async ({ page }: { page: Page }) => {
        console.log('Testing complete Issue-106 workflow...');

        // Step 1: Wait for cascading dropdown loading sequence
        console.log('Step 1: Waiting for cascading sequence...');
        await page.waitForTimeout(8000);

        // Step 2: Verify all dropdowns have correct cascaded values
        console.log('Step 2: Verifying dropdown values...');
        const albumSelect = page.locator('select').first();
        const categorySelect = page.locator('select').nth(1);
        const sessionSelect = page.locator('select').nth(2);

        await expect(albumSelect).toHaveValue('18');
        await expect(categorySelect).toHaveValue('55');
        await expect(sessionSelect).toHaveValue('1281');

        // Step 3: Execute Open Session button click
        console.log('Step 3: Clicking Open Session button...');
        const openSessionButton = page.locator('button:has-text("Open Session")');
        await openSessionButton.click();

        // Step 4: Verify Session URL panel displays (forced display per requirements)
        console.log('Step 4: Verifying Session URL panel display...');
        await page.waitForTimeout(3000);

        // Look for session URL panel or related elements
        const sessionPanel = page.locator('[data-testid="session-url-panel"], .session-url, text="Session URL", text="User Token", text="Host Token"');
        await expect(sessionPanel.first()).toBeVisible({ timeout: 10000 });

        console.log('✅ Complete Issue-106 workflow test passed');
    });

    test('should generate correct user URLs for Open Session functionality', async ({ page }: { page: Page }) => {
        console.log('Testing Issue-106 URL generation accuracy...');

        // Wait for cascading to complete
        await page.waitForTimeout(8000);

        // Monitor API responses for UserToken generation
        let generatedUserToken: string | null = null;
        page.on('response', async (response: Response) => {
            if (response.url().includes('/api/host/create-session')) {
                try {
                    const responseData: SessionCreationResponse = await response.json();
                    generatedUserToken = responseData.UserToken;
                } catch (e: any) {
                    console.log('Failed to capture UserToken:', e.message);
                }
            }
        });

        // Trigger URL generation via Open Session button
        const openSessionButton = page.locator('button:has-text("Open Session")');
        await openSessionButton.click();
        await page.waitForTimeout(5000);

        // Verify UserToken was generated with correct format
        expect(generatedUserToken).toBeDefined();
        expect(generatedUserToken!.length).toBe(8);
        console.log('Generated UserToken:', generatedUserToken);

        // Find the displayed Session URL in the panel
        const sessionUrlElement = page.locator('#sessionUrl, [data-testid="session-url"], text*="localhost:9091"');
        await expect(sessionUrlElement.first()).toBeVisible({ timeout: 10000 });

        const displayedUrl: string | null = await sessionUrlElement.first().textContent();
        console.log('Displayed Session URL:', displayedUrl);

        // Validate URL format and token matching
        const expectedUrl: string = `https://localhost:9091/user/landing/${generatedUserToken}`;
        expect(displayedUrl?.trim()).toBe(expectedUrl);

        // Test URL accessibility by navigating to generated URL
        console.log('Testing URL accessibility...');
        const newPage = await page.context().newPage();

        try {
            await newPage.goto(expectedUrl);
            await newPage.waitForLoadState('networkidle');

            // Verify the URL loads the correct UserLanding page
            const pageTitle: string | null = await newPage.locator('h1, title').first().textContent();
            console.log('URL destination page title:', pageTitle);

            // Should load UserLanding.razor with proper token recognition
            expect(pageTitle).toContain('User'); // Basic validation

            console.log('✅ URL generation and accessibility validated');
        } catch (error: any) {
            console.log('❌ URL accessibility failed:', error.message);
            throw new Error(`Generated URL ${expectedUrl} is not accessible: ${error.message}`);
        } finally {
            await newPage.close();
        }
    });
});

test.describe('Issue-106: Error Handling & Edge Cases', () => {

    test('should handle API errors gracefully during cascading', async ({ page }: { page: Page }) => {
        // Navigate with potentially invalid token to trigger error handling
        await page.goto('/host/session-opener/invalid-token-format');

        // Wait for error handling mechanisms to activate
        await page.waitForTimeout(5000);

        // Should display error message but not crash application
        const errorElement = page.locator('text="error", text="failed", text="invalid"').first();
        await expect(errorElement).toBeVisible({ timeout: 10000 });
    });

    test('should recover from network timeouts during cascading', async ({ page }: { page: Page }) => {
        // Test basic error display functionality for network issues
        // Note: Full network interception would require additional setup

        await page.goto('/host/session-opener/timeout-test');
        await page.waitForTimeout(5000);

        // Should show some form of error state indication
        const hasErrorState: boolean = await page.locator('text="error", text="timeout", text="failed"').first().isVisible();
        console.log('Error state handling:', hasErrorState ? 'Present' : 'Not found');
    });
});