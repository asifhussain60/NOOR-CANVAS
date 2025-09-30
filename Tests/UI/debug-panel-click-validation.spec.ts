import { expect, test } from '@playwright/test';

test.describe('Debug Panel Click Validation', () => {
    let page: any;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();

        // Enable console logging
        page.on('console', (msg: any) => console.log('BROWSER:', msg.text()));
        page.on('pageerror', (error: any) => console.error('PAGE ERROR:', error.message));

        // Navigate to Host Control Panel
        await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Wait for the debug panel icon to be visible
        await page.waitForSelector('#debug-panel-toggle-btn', {
            state: 'visible',
            timeout: 10000
        });
    });

    test('Debug panel toggle button should be visible and clickable', async () => {
        console.log('🔍 Testing debug panel visibility and click functionality...');

        // Verify debug panel toggle button exists and is visible
        const debugToggleBtn = page.locator('#debug-panel-toggle-btn');
        await expect(debugToggleBtn).toBeVisible();

        console.log('✅ Debug panel toggle button is visible');

        // Check if button is enabled
        await expect(debugToggleBtn).toBeEnabled();
        console.log('✅ Debug panel toggle button is enabled');

        // Get initial debug panel state
        const debugPanel = page.locator('.debug-panel-content');
        const initiallyVisible = await debugPanel.isVisible().catch(() => false);
        console.log(`📊 Debug panel initially visible: ${initiallyVisible}`);

        // Click the debug panel toggle button
        console.log('🖱️  Clicking debug panel toggle button...');
        await debugToggleBtn.click();

        // Wait a moment for any state changes
        await page.waitForTimeout(1000);

        // Check if debug panel visibility changed
        const afterClickVisible = await debugPanel.isVisible().catch(() => false);
        console.log(`📊 Debug panel visible after click: ${afterClickVisible}`);

        // The panel should toggle state
        expect(afterClickVisible).toBe(!initiallyVisible);
        console.log('✅ Debug panel toggled successfully');
    });

    test('Debug panel toggle should trigger JavaScript events', async () => {
        console.log('🔍 Testing JavaScript event handling...');

        // Monitor console for our debug logging
        const consoleLogs: string[] = [];
        page.on('console', (msg: any) => {
            const text = msg.text();
            consoleLogs.push(text);
            if (text.includes('DEBUG-PANEL') || text.includes('ToggleDebugPanel')) {
                console.log('🎯 DEBUG LOG:', text);
            }
        });

        const debugToggleBtn = page.locator('#debug-panel-toggle-btn');

        // Click the button
        await debugToggleBtn.click();
        await page.waitForTimeout(2000);

        // Check if our JavaScript logging was triggered
        const jsClickLogs = consoleLogs.filter(log =>
            log.includes('DEBUG-PANEL-CLICK') ||
            log.includes('Button clicked')
        );

        console.log(`📊 JavaScript click logs found: ${jsClickLogs.length}`);
        jsClickLogs.forEach(log => console.log('  -', log));

        // We should see the JavaScript click event
        expect(jsClickLogs.length).toBeGreaterThan(0);
    });

    test('Blazor event binding should be functional', async () => {
        console.log('🔍 Testing Blazor event binding...');

        // Monitor network requests for Blazor SignalR messages
        const blazorMessages: any[] = [];
        page.on('response', async (response: any) => {
            if (response.url().includes('_blazor') && response.request().method() === 'POST') {
                try {
                    const body = await response.text();
                    if (body.includes('DispatchEventAsync') || body.includes('ToggleDebugPanel')) {
                        blazorMessages.push(body);
                        console.log('🎯 BLAZOR MESSAGE:', body.substring(0, 200) + '...');
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        const debugToggleBtn = page.locator('#debug-panel-toggle-btn');

        // Click the button
        await debugToggleBtn.click();
        await page.waitForTimeout(3000);

        console.log(`📊 Blazor messages captured: ${blazorMessages.length}`);

        // We should see Blazor event dispatching
        expect(blazorMessages.length).toBeGreaterThan(0);
    });

    test('Debug panel DOM structure validation', async () => {
        console.log('🔍 Validating debug panel DOM structure...');

        // Check debug toggle button attributes
        const debugToggleBtn = page.locator('#debug-panel-toggle-btn');

        // Verify onclick attribute exists
        const onclickAttr = await debugToggleBtn.getAttribute('onclick');
        console.log(`📊 onclick attribute: ${onclickAttr}`);
        expect(onclickAttr).toBeTruthy();

        // Verify Blazor event handler exists
        const element = await debugToggleBtn.elementHandle();
        const attributes = await element?.evaluate((el: any) => {
            const attrs: any = {};
            for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                attrs[attr.name] = attr.value;
            }
            return attrs;
        });

        console.log('📊 All button attributes:', JSON.stringify(attributes, null, 2));

        // Check for Blazor-specific attributes
        const hasBlazorBinding = Object.keys(attributes || {}).some(key =>
            key.startsWith('blazor:') || key.includes('onclick') || key.includes('click')
        );

        console.log(`📊 Has Blazor event binding: ${hasBlazorBinding}`);
    });

    test('Manual JavaScript debug panel toggle', async () => {
        console.log('🔍 Testing manual JavaScript toggle...');

        // Try to manually trigger the toggle via JavaScript
        const result = await page.evaluate(() => {
            // Try to find and call any debug panel related functions
            const button = document.getElementById('debug-panel-toggle-btn');
            if (button) {
                console.log('DEBUG-PANEL-MANUAL: Button found, attempting click');
                button.click();
                return 'clicked via JS';
            }
            return 'button not found';
        });

        console.log(`📊 Manual JS trigger result: ${result}`);
        expect(result).toBe('clicked via JS');

        await page.waitForTimeout(2000);
    });

    test.afterEach(async () => {
        if (page) {
            await page.close();
        }
    });
});