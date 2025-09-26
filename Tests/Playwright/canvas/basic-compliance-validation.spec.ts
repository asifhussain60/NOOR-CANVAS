import { expect, test } from '@playwright/test';

/**
 * Basic Compliance Validation for key:hostcanvas
 * Tests core functionality after compliance fixes
 */
test.describe('Basic Compliance Validation', () => {
    const testSessionId = '215';

    test('Host Control Panel TestShareAsset button functionality', async ({ page }) => {
        // Navigate to host control panel
        await page.goto('http://localhost:9090/hostcontrol');
        await page.waitForLoadState('networkidle');

        // Verify the TestShareAsset button exists
        const testButton = page.locator('#test-share-asset');
        await expect(testButton).toBeVisible();

        // Fill in session ID
        await page.fill('#test-session-id', testSessionId);

        // Click the test button
        await testButton.click();

        // Wait for response
        await page.waitForTimeout(3000);

        // Check for success message
        const successMessage = page.locator('#success-message');
        await expect(successMessage).toBeVisible();
        await expect(successMessage).toContainText('Asset shared successfully');

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] TestShareAsset button test completed');
    });

    test('SessionCanvas page loads correctly', async ({ page }) => {
        // Navigate to session canvas
        await page.goto(`http://localhost:9090/session?sessionId=${testSessionId}`);
        await page.waitForLoadState('networkidle');

        // Verify basic page elements
        const sessionTitle = page.locator('h1, h2, .session-title');
        await expect(sessionTitle).toBeVisible();

        // Verify asset display area exists
        const assetDisplay = page.locator('#asset-display');
        await expect(assetDisplay).toBeVisible();

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] SessionCanvas page load test completed');
    });

    test('REST API ShareAsset endpoint responds correctly', async ({ request }) => {
        // Test the REST API endpoint
        const response = await request.post('http://localhost:9090/api/host/share-asset', {
            data: {
                sessionId: testSessionId,
                selector: '#test-element',
                assetType: 'html',
                metadata: {
                    title: 'API Test Asset',
                    description: 'Testing REST API functionality',
                    timestamp: new Date().toISOString()
                }
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(200);

        const responseData = await response.json();
        expect(responseData.success).toBe(true);
        expect(responseData.message).toContain('successfully');

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] REST API endpoint test completed');
    });
});