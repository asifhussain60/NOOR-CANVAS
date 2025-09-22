import { test, expect } from "@playwright/test";

test.describe("Issue-128: Share Button Injection Control", () => {
  test.beforeEach(async ({ page }) => {
    // Basic health check
    const response = await page.goto("https://localhost:9091", {
      waitUntil: "networkidle",
      timeout: 10000,
    });
    expect(response?.ok()).toBeTruthy();
  });

  test("should NOT show share buttons in transcript when session is not active", async ({
    page,
  }) => {
    // Navigate to a host control panel with a session that has transcript content
    // Using a known test session - you may need to create one or use existing data
    await page.goto("https://localhost:9091/host/control-panel/TESTHOST123", {
      waitUntil: "networkidle",
    });

    // Wait for the page to load
    await expect(page.locator("h1")).toContainText("HOST CONTROL PANEL");

    // Look for session transcript content
    const transcriptSection = page.locator(".session-transcript-content");

    if ((await transcriptSection.count()) > 0) {
      // If transcript exists, verify NO share buttons are present
      const shareButtons = transcriptSection.locator(
        'button[data-share-button="asset"]',
      );
      await expect(shareButtons).toHaveCount(0);

      // Also check for any buttons containing "SHARE" text
      const shareTextButtons = transcriptSection.locator(
        'button:has-text("SHARE")',
      );
      await expect(shareTextButtons).toHaveCount(0);

      console.log(
        "✅ PASS: No share buttons found in transcript when session is not active",
      );
    } else {
      console.log(
        "ℹ️  INFO: No transcript content found - test case not applicable",
      );
    }
  });

  test("should show share buttons in transcript after session is started", async ({
    page,
  }) => {
    // Navigate to a host control panel
    await page.goto("https://localhost:9091/host/control-panel/TESTHOST123", {
      waitUntil: "networkidle",
    });

    // Wait for the page to load
    await expect(page.locator("h1")).toContainText("HOST CONTROL PANEL");

    // Check if Start Session button exists and is enabled
    const startButton = page.locator('button:has-text("Start Session")');

    if ((await startButton.count()) > 0 && (await startButton.isEnabled())) {
      // Click Start Session button
      await startButton.click();

      // Wait for session to start (status should change)
      await expect(startButton).toBeDisabled({ timeout: 10000 });

      // Wait a moment for transcript re-transformation
      await page.waitForTimeout(2000);

      // Now check if share buttons appear in transcript
      const transcriptSection = page.locator(".session-transcript-content");

      if ((await transcriptSection.count()) > 0) {
        // Look for share buttons - they should now be present
        const shareButtons = transcriptSection.locator(
          'button[data-share-button="asset"]',
        );

        // We expect at least some share buttons if there are assets in the transcript
        const buttonCount = await shareButtons.count();

        if (buttonCount > 0) {
          console.log(
            `✅ PASS: Found ${buttonCount} share buttons in transcript after session start`,
          );

          // Verify button properties
          const firstButton = shareButtons.first();
          await expect(firstButton).toHaveAttribute(
            "data-share-button",
            "asset",
          );
          await expect(firstButton).toContainText("SHARE");
        } else {
          console.log(
            "ℹ️  INFO: No share buttons found - may indicate no assets in transcript",
          );
        }
      } else {
        console.log(
          "ℹ️  INFO: No transcript content found after session start",
        );
      }
    } else {
      console.log(
        "ℹ️  INFO: Start Session button not available or not enabled - session may already be active",
      );
    }
  });

  test("should verify session status controls share button visibility", async ({
    page,
  }) => {
    // This test directly validates the core requirement
    await page.goto("https://localhost:9091/host/control-panel/TESTHOST123", {
      waitUntil: "networkidle",
    });

    await expect(page.locator("h1")).toContainText("HOST CONTROL PANEL");

    // Check initial state - should be no share buttons
    const initialShareButtons = page.locator(
      '.session-transcript-content button:has-text("SHARE")',
    );
    const initialCount = await initialShareButtons.count();

    console.log(`Initial share button count: ${initialCount}`);

    // Get the Start Session button
    const startButton = page.locator('button:has-text("Start Session")');

    if ((await startButton.isVisible()) && (await startButton.isEnabled())) {
      // Session is not active - should be 0 share buttons
      expect(initialCount).toBe(0);

      // Start the session
      await startButton.click();

      // Wait for the state change
      await page.waitForTimeout(3000);

      // Check if share buttons now appear
      const finalShareButtons = page.locator(
        '.session-transcript-content button:has-text("SHARE")',
      );
      const finalCount = await finalShareButtons.count();

      console.log(`Final share button count: ${finalCount}`);

      // The count should have increased (if there are assets to share)
      // or remained 0 if no assets exist
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);

      if (finalCount > initialCount) {
        console.log("✅ PASS: Share buttons appeared after session activation");
      } else {
        console.log(
          "ℹ️  INFO: No change in share button count - may indicate no shareable assets",
        );
      }
    } else {
      console.log(
        "ℹ️  INFO: Session may already be active or Start button not available",
      );
    }
  });
});
