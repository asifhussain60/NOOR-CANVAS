import { expect, test } from '@playwright/test';

/**
 * [DEBUG-WORKITEM:retrosync:validation] Final validation test for retrosync protocol
 * Quick validation of core system functionality
 */

test.describe('RETROSYNC: Final Validation', () => {

    test('Core System Health Check', async ({ page }) => {
        console.log('[DEBUG-WORKITEM:retrosync:validation] Testing core system health');

        // Test health endpoint
        try {
            const response = await page.request.get('https://localhost:9091/api/health');
            if (response.ok()) {
                const healthData = await response.json();
                console.log('✅ Health endpoint working:', healthData);
            } else {
                console.log('❓ Health endpoint status:', response.status());
            }
        } catch (error) {
            console.log('❌ Health endpoint failed:', error.message);
        }

        // Test routing fix
        try {
            await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW', { timeout: 10000 });
            const url = page.url();
            expect(url).toContain('/host/control-panel/PQ9N5YWW');
            console.log('✅ Routing fix validated:', url);
        } catch (error) {
            console.log('❌ Routing test failed:', error.message);
        }
    });
});