import { expect, test } from "@playwright/test";

/**
 * Simple verification test for panel spacing fix
 */

test.describe("Panel Spacing Verification", () => {
  test("Verify margin between golden border panels", async ({ page }) => {
    // Navigate to Host Session Opener page
    await page.goto("https://localhost:9091/host/session-opener");
    await page.waitForLoadState("networkidle");

    // Wait for the page to be fully loaded
    await expect(
      page.locator('h1:has-text("Host Session Opener")'),
    ).toBeVisible();

    // Find all golden border panels
    const goldenPanels = page.locator('div[style*="border:2px solid #C5B358"]');
    const panelCount = await goldenPanels.count();
    console.log(`Found ${panelCount} golden border panels`);

    if (panelCount === 1) {
      console.log(
        "✅ Only one panel visible (session panel). Need to open session to see link panel.",
      );

      // Open a session to make the second panel appear
      await page.selectOption('select[id="album-select"]', { index: 1 });
      await page.waitForTimeout(2000);

      await page.selectOption('select[id="category-select"]', { index: 1 });
      await page.waitForTimeout(2000);

      await page.selectOption('select[id="session-select"]', { index: 1 });
      await page.waitForTimeout(2000);

      await page.selectOption('select[id="country-select"]', { index: 1 });

      await page.fill('input[type="date"]', "2025-09-20");
      await page.fill('input[type="text"][placeholder*="HH:MM"]', "10:00 AM");
      await page.fill('input[type="number"][placeholder*="duration"]', "60");

      // Click Open Session button
      const openSessionBtn = page.locator('button:has-text("Open Session")');
      await expect(openSessionBtn).toBeEnabled();
      await openSessionBtn.click();

      // Wait for the link panel to appear
      await expect(page.locator('h3:has-text("Session URL")')).toBeVisible();

      // Now check both panels
      const updatedPanelCount = await goldenPanels.count();
      console.log(
        `After opening session: ${updatedPanelCount} golden border panels`,
      );

      if (updatedPanelCount >= 2) {
        // Get the second panel (link panel) and check its margin
        const linkPanel = page.locator(
          'div[style*="border:2px solid #C5B358"]:has-text("Session URL")',
        );
        const marginTop = await linkPanel.evaluate(
          (el) => window.getComputedStyle(el).marginTop,
        );
        console.log(`Link panel margin-top: ${marginTop}`);

        // Check that margin-top is 24px (1.5rem)
        expect(marginTop).toBe("24px");
        console.log("✅ Panel spacing verified: 24px margin-top applied");
      }
    } else if (panelCount >= 2) {
      console.log("✅ Multiple panels visible. Checking spacing...");

      // Find the link panel specifically and check its margin
      const linkPanel = page.locator(
        'div[style*="border:2px solid #C5B358"]:has-text("Session URL")',
      );
      if ((await linkPanel.count()) > 0) {
        const marginTop = await linkPanel.evaluate(
          (el) => window.getComputedStyle(el).marginTop,
        );
        console.log(`Link panel margin-top: ${marginTop}`);
        expect(marginTop).toBe("24px");
        console.log("✅ Panel spacing verified: 24px margin-top applied");
      } else {
        console.log("Link panel not found, taking screenshot for debugging");
        await page.screenshot({
          path: "Tests/UI/screenshots/panel-spacing-debug.png",
          fullPage: true,
        });
      }
    }
  });
});
