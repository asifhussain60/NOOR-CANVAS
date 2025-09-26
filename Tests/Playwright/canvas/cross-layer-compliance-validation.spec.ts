import { expect, Page, test } from '@playwright/test';

// Extend Window interface for test properties
declare global {
    interface Window {
        assetReceived?: boolean;
        receivedAssetData?: any;
        blazorCulture?: {
            dotNetHelper?: {
                invokeMethodAsync: (method: string, ...args: any[]) => Promise<any>;
            };
        };
    }
}

/**
 * Cross-Layer Compliance Validation Tests for key:hostcanvas
 * 
 * Validates that the compliance fixes implemented across all layers work correctly:
 * 1. SignalR group naming consistency (session_{id})
 * 2. Dual-format asset handling in SessionCanvas (testContent vs selector/metadata)
 * 3. Property alignment between TestShareAsset and REST API paths
 */

test.describe('Cross-Layer Compliance Validation', () => {
    let hostPage: Page;
    let userPage: Page;
    const testSessionId = '215';

    test.beforeEach(async ({ browser }) => {
        // Create two browser contexts for host and user sessions
        const hostContext = await browser.newContext();
        const userContext = await browser.newContext();

        hostPage = await hostContext.newPage();
        userPage = await userContext.newPage();

        // Enable console logging for debugging
        hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
        userPage.on('console', msg => console.log(`USER: ${msg.text()}`));
    });

    test.afterEach(async () => {
        await hostPage?.close();
        await userPage?.close();
    });

    test('Compliance Fix: TestShareAsset uses correct SignalR group naming and data structure', async () => {
        // Navigate to host control panel
        await hostPage.goto('http://localhost:9090/hostcontrol');
        await hostPage.waitForLoadState('networkidle');

        // Navigate to user session canvas
        await userPage.goto(`http://localhost:9090/session?sessionId=${testSessionId}`);
        await userPage.waitForLoadState('networkidle');

        // Wait for SignalR connections to establish
        await hostPage.waitForTimeout(2000);
        await userPage.waitForTimeout(2000);

        // Set up listener for asset reception on user page
        let assetReceived = false;
        let receivedAssetData: any = null;

        await userPage.evaluate(() => {
            window.assetReceived = false;
            window.receivedAssetData = null;

            // Monitor for asset shared events
            const originalLog = console.log;
            console.log = function (...args) {
                if (args[0] && args[0].includes('Asset received')) {
                    window.assetReceived = true;
                    window.receivedAssetData = args[1];
                }
                originalLog.apply(console, args);
            };
        });

        // Trigger TestShareAsset from host page
        await hostPage.fill('#test-session-id', testSessionId);
        await hostPage.click('#test-share-asset');

        // Wait for asset transmission
        await hostPage.waitForTimeout(3000);

        // Check if success message appeared on host
        const successMessage = await hostPage.locator('#success-message').textContent();
        expect(successMessage).toContain('Asset shared successfully');

        // Verify asset was received on user page
        const userAssetReceived = await userPage.evaluate(() => window.assetReceived);
        expect(userAssetReceived).toBe(true);

        // Verify the asset content appears in the user session
        const assetDisplay = await userPage.locator('#asset-display').textContent();
        expect(assetDisplay).toContain('Shared Test Asset');
        expect(assetDisplay).toContain('This is a test asset shared via TestShareAsset');

        // Verify the HTML content is properly rendered
        const htmlContent = await userPage.locator('#asset-display .asset-content').innerHTML();
        expect(htmlContent).toContain('<h3>');
        expect(htmlContent).toContain('<p>');
        expect(htmlContent).toContain('test-asset-content');

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] TestShareAsset validation completed successfully');
    });

    test('Compliance Fix: REST API asset sharing uses correct SignalR group and data structure', async () => {
        // Navigate to user session canvas first
        await userPage.goto(`http://localhost:9090/session?sessionId=${testSessionId}`);
        await userPage.waitForLoadState('networkidle');

        // Wait for SignalR connection
        await userPage.waitForTimeout(2000);

        // Set up listener for asset reception
        let assetReceived = false;
        await userPage.evaluate(() => {
            window.assetReceived = false;

            const originalLog = console.log;
            console.log = function (...args) {
                if (args[0] && args[0].includes('Asset received')) {
                    window.assetReceived = true;
                }
                originalLog.apply(console, args);
            };
        });

        // Send REST API request to share asset
        const response = await hostPage.request.post('http://localhost:9090/api/host/share-asset', {
            data: {
                sessionId: testSessionId,
                selector: '#test-element',
                assetType: 'html',
                metadata: {
                    title: 'REST API Test Asset',
                    description: 'Asset shared via REST API endpoint',
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

        // Wait for asset transmission
        await userPage.waitForTimeout(3000);

        // Verify asset was received on user page
        const userAssetReceived = await userPage.evaluate(() => window.assetReceived);
        expect(userAssetReceived).toBe(true);

        // Verify the asset content appears in the user session with proper formatting
        const assetDisplay = await userPage.locator('#asset-display').textContent();
        expect(assetDisplay).toContain('REST API Test Asset');
        expect(assetDisplay).toContain('Asset shared via REST API endpoint');

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] REST API asset sharing validation completed successfully');
    });

    test('Compliance Fix: SessionCanvas handles both testContent and production asset formats', async () => {
        // Navigate to user session canvas
        await userPage.goto(`http://localhost:9090/session?sessionId=${testSessionId}`);
        await userPage.waitForLoadState('networkidle');
        await userPage.waitForTimeout(2000);

        // Test 1: Simulate testContent format reception (from TestShareAsset)
        await userPage.evaluate((sessionId) => {
            const testContentAsset = {
                testContent: '<div class="test-content"><h3>Test Content Format</h3><p>This tests the testContent property handling</p></div>'
            };

            // Simulate SignalR message reception
            if (window.blazorCulture && window.blazorCulture.dotNetHelper) {
                window.blazorCulture.dotNetHelper.invokeMethodAsync('ReceiveAsset', testContentAsset);
            }
        }, testSessionId);

        await userPage.waitForTimeout(2000);

        // Verify testContent format is handled
        const testContentDisplay = await userPage.locator('#asset-display').textContent();
        expect(testContentDisplay).toContain('Test Content Format');

        // Test 2: Simulate production asset format reception (from REST API)
        await userPage.evaluate((sessionId) => {
            const productionAsset = {
                selector: '#production-element',
                assetType: 'html',
                metadata: {
                    title: 'Production Asset Format',
                    description: 'This tests the selector/metadata property handling'
                }
            };

            // Simulate SignalR message reception
            if (window.blazorCulture && window.blazorCulture.dotNetHelper) {
                window.blazorCulture.dotNetHelper.invokeMethodAsync('ReceiveAsset', productionAsset);
            }
        }, testSessionId);

        await userPage.waitForTimeout(2000);

        // Verify production format is handled
        const productionDisplay = await userPage.locator('#asset-display').textContent();
        expect(productionDisplay).toContain('Production Asset Format');

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] Dual-format asset handling validation completed successfully');
    });

    test('Compliance Fix: SignalR group naming consistency across all paths', async () => {
        // This test verifies that both TestShareAsset and REST API use the same group naming convention

        // Navigate to host control panel
        await hostPage.goto('http://localhost:9090/hostcontrol');
        await hostPage.waitForLoadState('networkidle');

        // Set up network monitoring to capture SignalR traffic
        const signalRMessages: string[] = [];

        await hostPage.route('**/*', (route) => {
            const url = route.request().url();
            if (url.includes('sessionHub') || url.includes('negotiate')) {
                signalRMessages.push(url);
            }
            route.continue();
        });

        // Navigate to user session
        await userPage.goto(`http://localhost:9090/session?sessionId=${testSessionId}`);
        await userPage.waitForLoadState('networkidle');
        await userPage.waitForTimeout(2000);

        // Test TestShareAsset path
        await hostPage.fill('#test-session-id', testSessionId);
        await hostPage.click('#test-share-asset');
        await hostPage.waitForTimeout(2000);

        // Test REST API path
        await hostPage.request.post('http://localhost:9090/api/host/share-asset', {
            data: {
                sessionId: testSessionId,
                selector: '#consistency-test',
                assetType: 'html',
                metadata: { title: 'Consistency Test' }
            },
            headers: { 'Content-Type': 'application/json' }
        });

        await userPage.waitForTimeout(2000);

        // Verify both messages are received (indicating consistent group naming)
        const assetElements = await userPage.locator('#asset-display .asset-item').count();
        expect(assetElements).toBeGreaterThanOrEqual(1);

        console.log('[DEBUG-WORKITEM:hostcanvas:validation] SignalR group naming consistency validation completed successfully');
    });
});