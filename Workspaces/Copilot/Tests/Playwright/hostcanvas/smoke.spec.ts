import { test, expect } from '@playwright/test';

test.describe('@hostcanvas smoke', () => {
  test('app boots and has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Noor Canvas/i);
  });
});
