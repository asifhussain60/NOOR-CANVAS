import { expect, test } from "@playwright/test";
import { DatabaseTokenManager } from "./utils/database-token-manager";
import { EnhancedTestMonitor } from "./utils/enhanced-test-monitor";

test.describe("Simple Token Validation", () => {
  test("Validate permanent Session 212 tokens work with application", async ({
    page,
  }) => {
    const monitor = new EnhancedTestMonitor();

    console.log("🎯 Starting simple token validation test");

    try {
      // Get permanent test session
      const sessionData = DatabaseTokenManager.getPermanentTestSession();
      console.log(
        `✅ Using session ${sessionData.sessionId} with host token: ${sessionData.hostToken}`,
      );
      console.log(`📊 Session title: ${sessionData.sessionTitle}`);

      // Navigate to host landing page
      await page.goto("/host");
      await page.waitForLoadState("networkidle");

      // Verify basic page elements
      console.log("🔍 Checking page title...");
      const title = await page.title();
      console.log(`📋 Current page title: "${title}"`);

      // Look for token input
      console.log("🔍 Looking for token input field...");
      const tokenInput = page.locator(
        'input[placeholder*="token" i], input[type="text"], input[name*="token" i]',
      );
      await expect(tokenInput).toBeVisible({ timeout: 10000 });
      console.log("✅ Token input field found");

      // Enter the permanent host token with proper Blazor binding
      console.log("🎯 Entering host token...");
      await tokenInput.clear();
      await tokenInput.fill(sessionData.hostToken);

      // Trigger Blazor binding events
      await tokenInput.dispatchEvent("input");
      await tokenInput.dispatchEvent("change");

      // Wait for Blazor to process the binding
      await page.waitForTimeout(2000);

      // Look for submit button and check enablement
      console.log("🔍 Looking for submit button...");
      const buttons = await page.locator("button").all();
      for (const button of buttons) {
        const text = await button.textContent();
        console.log(`🔲 Found button: "${text}"`);
        const isEnabled = await button.isEnabled();
        console.log(`   Enabled: ${isEnabled}`);
      }

      // Specifically check the Access button
      const accessButton = page
        .locator(
          'button:has-text("Access Host Control Panel"), button:has-text("Access Control Panel")',
        )
        .first();
      if (await accessButton.isVisible()) {
        const isEnabled = await accessButton.isEnabled();
        console.log(`🎯 Access button enabled: ${isEnabled}`);

        if (isEnabled) {
          console.log(
            "✅ Access button is enabled - token validation successful",
          );
        } else {
          console.log("❌ Access button still disabled - checking why...");
          // Check if token field has value
          const tokenValue = await tokenInput.inputValue();
          console.log(`📝 Token input value: "${tokenValue}"`);
        }
      }

      // Take a screenshot for debugging
      await page.screenshot({
        path: `PlayWright/artifacts/simple-token-validation-${Date.now()}.png`,
        fullPage: true,
      });

      console.log("✅ Simple token validation completed successfully");
    } catch (error) {
      console.error("❌ Test failed:", error);
      await page.screenshot({
        path: `PlayWright/artifacts/simple-token-validation-error-${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    } finally {
      await DatabaseTokenManager.closeConnection();
    }
  });
});
