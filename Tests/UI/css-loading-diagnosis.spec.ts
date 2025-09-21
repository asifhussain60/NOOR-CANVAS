import { test } from '@playwright/test';

test('CSS Loading Diagnosis', async ({ page }) => {
    // Capture console errors
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleMessages.push(`CONSOLE ERROR: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(`PAGE ERROR: ${error.message}`);
    });

    // Navigate to the host control panel
    await page.goto('https://localhost:9091/host/control-panel/UD3F5P3A');

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Check if specific CSS classes exist
    const hasAyahCard = await page.locator('.ayah-card').count() > 0;
    const hasHadeesCard = await page.locator('.hadees-container').count() > 0;

    console.log(`Ayah cards found: ${hasAyahCard}`);
    console.log(`Hadees cards found: ${hasHadeesCard}`);

    // Log all console messages and errors
    console.log('Console Messages:', consoleMessages);
    console.log('Page Errors:', errors);

    // Take screenshot for debugging
    await page.screenshot({ path: 'd:\\PROJECTS\\NOOR CANVAS\\css-diagnosis-screenshot.png', fullPage: true });

    // Wait to see the page
    await page.waitForTimeout(10000);
});