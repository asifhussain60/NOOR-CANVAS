/**
 * Simple console check for FAB button debugging
 * Just navigates to HCP and logs ALL console messages
 */

import { test } from '@playwright/test';

test('capture all console logs from HostControlPanel', async ({ page }) => {
    const APP_URL = 'https://localhost:9091';
    const HOST_TOKEN = 'PQ9N5YWW';

    // Capture ALL console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[BROWSER-${type.toUpperCase()}] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
        console.error(`[PAGE-ERROR] ${error.message}`);
        console.error(error.stack);
    });

    console.log('\n=== Navigating to HostControlPanel ===\n');
    console.log(`URL: ${APP_URL}/host/control-panel/${HOST_TOKEN}\n`);

    await page.goto(`${APP_URL}/host/control-panel/${HOST_TOKEN}`, {
        waitUntil: 'networkidle',
        timeout: 60000
    });

    console.log('\n=== Page loaded, waiting 10 seconds for activity ===\n');
    await page.waitForTimeout(10000);

    console.log('\n=== Looking for FAB buttons ===\n');

    // Check for FAB buttons
    const fabButtons = await page.locator('.asset-header-fab-button').count();
    const shareButtons = await page.locator('.ks-share-button').count();

    console.log(`FAB buttons found: ${fabButtons}`);
    console.log(`Share buttons found: ${shareButtons}`);

    if (fabButtons > 0 || shareButtons > 0) {
        console.log('\n=== Attempting to click first available button ===\n');

        const button = fabButtons > 0
            ? page.locator('.asset-header-fab-button').first()
            : page.locator('.ks-share-button').first();

        const buttonHTML = await button.evaluate(el => el.outerHTML);
        console.log('Button HTML:', buttonHTML);

        console.log('\n>>> CLICKING BUTTON NOW <<<\n');
        await button.click();

        console.log('\n=== Waiting 5 seconds after click ===\n');
        await page.waitForTimeout(5000);
    } else {
        console.log('\n⚠️ No buttons found - check if transcript has content\n');
    }

    console.log('\n=== Test complete ===\n');
});
