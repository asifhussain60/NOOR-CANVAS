import percySnapshot from '@percy/playwright';
import { test } from '@playwright/test';

test.describe('Start Time Dropdown Visual Regression', () => {
    test('dropdown initial state', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');
        await page.waitForSelector('#session-time');

        await percySnapshot(page, 'Start Time Dropdown - Initial State');
    });

    test('dropdown opened state', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');
        await timeSelect.click(); // Open dropdown

        await percySnapshot(page, 'Start Time Dropdown - Opened');
    });

    test('dropdown with selection', async ({ page }) => {
        await page.goto('http://localhost:9090/host/session-opener');

        const timeSelect = page.locator('#session-time');
        await timeSelect.selectOption('9:30 AM');

        await percySnapshot(page, 'Start Time Dropdown - Selected 9:30 AM');
    });
});
