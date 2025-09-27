import { expect, test } from '@playwright/test';

test.describe('Host-SessionOpener Cascade Validation', () => {

  test('should validate cascade dropdown behavior', async ({ page }) => {
    // Navigate to Host-SessionOpener with test token
    await page.goto('https://localhost:9091/host/session-opener/PQ9N5YWW');

    // Wait for component initialization and albums to load
    await page.waitForSelector('#album-select', { timeout: 10000 });
    await page.waitForFunction(() => {
      const albumSelect = document.querySelector('#album-select') as HTMLSelectElement;
      return albumSelect && albumSelect.options.length > 1;
    }, { timeout: 15000 });

    // Verify albums dropdown is populated
    const albumOptions = await page.locator('#album-select option').count();
    expect(albumOptions).toBeGreaterThan(1);

    // Verify category dropdown starts disabled
    await expect(page.locator('#category-select')).toBeDisabled();

    // Select first album and verify cascade to categories
    const firstAlbumValue = await page.locator('#album-select option:nth-child(2)').getAttribute('value');
    if (firstAlbumValue) {
      await page.selectOption('#album-select', firstAlbumValue);

      // Wait for category dropdown to become enabled and load categories
      await page.waitForFunction(() => {
        const categorySelect = document.querySelector('#category-select') as HTMLSelectElement;
        return !categorySelect.disabled && categorySelect.options.length > 1;
      }, { timeout: 10000 });

      // Verify session dropdown starts disabled
      await expect(page.locator('#session-select')).toBeDisabled();

      // Select first category and verify cascade to sessions
      const firstCategoryValue = await page.locator('#category-select option:nth-child(2)').getAttribute('value');
      if (firstCategoryValue) {
        await page.selectOption('#category-select', firstCategoryValue);

        // Wait for session dropdown to become enabled and load sessions
        await page.waitForFunction(() => {
          const sessionSelect = document.querySelector('#session-select') as HTMLSelectElement;
          return !sessionSelect.disabled && sessionSelect.options.length > 1;
        }, { timeout: 10000 });

        const sessionOptions = await page.locator('#session-select option').count();
        expect(sessionOptions).toBeGreaterThan(1);
      }
    }
  });
});