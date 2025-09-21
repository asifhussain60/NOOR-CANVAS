/**
 * Waiting Room Navigation Bug Test
 *
 * This test specifically focuses on reproducing the "Enter Waiting Room" button issue
 * where users cannot successfully navigate to the waiting room after session creation.
 *
 * Test Strategy:
 * 1. Use working host token (ADMIN123) to create a session
 * 2. Complete full session creation process
 * 3. Look for any generated participant URLs or session links
 * 4. Test "Enter Waiting Room" button functionality
 * 5. Reproduce and document the waiting room navigation error
 */

import { expect, test, type Page } from "@playwright/test";

const BASE_URL = "https://localhost:9091";

// Helper function for cascading dropdown selection
async function performCascadingSelection(page: Page) {
  console.log("🎯 Starting cascading dropdown selection...");

  await page.waitForSelector("select", { timeout: 10000 });
  const albumSelect = page.locator("select").first();
  await albumSelect.selectOption({ label: "Quran Comprehension" });
  console.log("✅ Selected Album: Quran Comprehension");
  await page.waitForTimeout(3000);

  const categorySelect = page.locator("select").nth(1);
  await categorySelect.selectOption({ label: "Surah Ikhlas" });
  console.log("✅ Selected Category: Surah Ikhlas");
  await page.waitForTimeout(5000);

  const sessionSelect = page.locator("select").nth(2);
  await sessionSelect.selectOption({ label: "Masculine vs Feminine Gender" });
  console.log("✅ Selected Session: Masculine vs Feminine Gender");
  await page.waitForTimeout(3000);
}

// Helper function for setting session details
async function setSessionDetails(page: Page) {
  console.log("📅 Setting session details...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];

  await page.locator("#session-date").fill(dateString);
  console.log(`✅ Set session date: ${dateString}`);

  await page.locator("#session-time").fill("4:45 PM");
  console.log("✅ Set session time: 4:45 PM");

  await page.locator("#session-duration").clear();
  await page.locator("#session-duration").fill("60");
  console.log("✅ Set session duration: 60 minutes");

  await page.waitForTimeout(2000);
}

test.describe("Waiting Room Navigation Bug Test", () => {
  test.beforeEach(async ({ page }) => {
    // Comprehensive logging for debugging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
      } else {
        console.log(`🖥️  BROWSER [${msg.type()}]: ${msg.text()}`);
      }
    });

    page.on("request", (request) => {
      if (
        request.url().includes("api") ||
        request.url().includes("waiting") ||
        request.url().includes("session")
      ) {
        console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on("response", (response) => {
      if (
        response.url().includes("api") ||
        response.url().includes("waiting") ||
        response.url().includes("session")
      ) {
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
  });

  test("Test Enter Waiting Room Button Functionality", async ({ page }) => {
    console.log("🚀 Starting Waiting Room Navigation Test...");

    try {
      // Step 1: Use working host token to create session
      console.log("🔑 Step 1: Navigate to host session opener...");
      const hostToken = "ADMIN123";
      await page.goto(`${BASE_URL}/host/session-opener/${hostToken}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      console.log("✅ Successfully loaded host session opener");

      // Step 2: Complete session creation process
      console.log("📋 Step 2: Complete session creation...");
      await performCascadingSelection(page);
      await setSessionDetails(page);

      // Step 3: Click Open Session button
      console.log("🚀 Step 3: Creating session...");
      const openSessionBtn = page.locator(
        '#openSessionBtn, button:has-text("Open Session")',
      );
      await expect(openSessionBtn).toBeEnabled({ timeout: 10000 });

      // Take screenshot before clicking
      await page.screenshot({
        path: "./screenshots/before-session-creation.png",
        fullPage: true,
      });

      await openSessionBtn.click();
      console.log("🔄 Clicked Open Session button, waiting for response...");
      await page.waitForTimeout(8000); // Wait longer for session creation

      // Step 4: Look for ANY indication of session creation success
      console.log("🔍 Step 4: Analyzing page after session creation...");

      await page.screenshot({
        path: "./screenshots/after-session-creation.png",
        fullPage: true,
      });

      const pageContent = await page.content();
      console.log("📄 Page content length:", pageContent.length);

      // Look for any success indicators
      const successIndicators = [
        "session created",
        "session url",
        "participant",
        "waiting room",
        "enter waiting",
        "session link",
        "user/landing",
        "session-id",
      ];

      let foundIndicators = [];
      for (const indicator of successIndicators) {
        if (pageContent.toLowerCase().includes(indicator.toLowerCase())) {
          foundIndicators.push(indicator);
        }
      }

      if (foundIndicators.length > 0) {
        console.log("✅ Found success indicators:", foundIndicators);
      } else {
        console.log("❌ No success indicators found");
      }

      // Step 5: Look for Enter Waiting Room button specifically
      console.log("🎯 Step 5: Looking for Enter Waiting Room button...");

      const waitingRoomSelectors = [
        'button:has-text("Enter Waiting Room")',
        'a:has-text("Enter Waiting Room")',
        'button:has-text("Open Waiting Room")',
        'a:has-text("Open Waiting Room")',
        '[data-testid="enter-waiting-room"]',
        '[data-testid="open-waiting-room"]',
        'button[onclick*="waiting"]',
        'a[href*="waiting"]',
        ".waiting-room-btn",
        "#enterWaitingRoom",
        "#openWaitingRoom",
      ];

      let waitingRoomButton = null;
      let foundSelector = "";

      for (const selector of waitingRoomSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(
            `✅ Found waiting room button with selector: ${selector} (${count} elements)`,
          );
          waitingRoomButton = elements.first();
          foundSelector = selector;
          break;
        }
      }

      if (waitingRoomButton) {
        // Step 6: Test the Enter Waiting Room button
        console.log("🎭 Step 6: Testing Enter Waiting Room button...");

        // Get button attributes
        const buttonText = await waitingRoomButton.textContent();
        const buttonHref = await waitingRoomButton.getAttribute("href");
        const buttonOnClick = await waitingRoomButton.getAttribute("onclick");

        console.log(`📋 Button details:`);
        console.log(`   Text: "${buttonText}"`);
        console.log(`   Href: "${buttonHref}"`);
        console.log(`   OnClick: "${buttonOnClick}"`);
        console.log(`   Selector used: ${foundSelector}`);

        // Take screenshot before clicking waiting room button
        await page.screenshot({
          path: "./screenshots/before-waiting-room-click.png",
          fullPage: true,
        });

        // Click the Enter Waiting Room button
        console.log("🔄 Clicking Enter Waiting Room button...");
        await waitingRoomButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(5000);

        // Step 7: Analyze result after clicking Enter Waiting Room
        console.log("🔍 Step 7: Analyzing waiting room result...");

        const finalUrl = page.url();
        const finalPageText = await page.textContent("body");

        await page.screenshot({
          path: "./screenshots/after-waiting-room-click.png",
          fullPage: true,
        });

        console.log(`🏁 Final URL: ${finalUrl}`);
        console.log(
          `📄 Final page text preview: ${finalPageText?.substring(0, 500)}`,
        );

        // Check for error indicators
        const errorIndicators = [
          "Session Error",
          "Session not found",
          "Invalid session",
          "Error",
          "404",
          "500",
          "Not Found",
          "Session expired",
          "Session invalid",
        ];

        let foundErrors = [];
        for (const errorIndicator of errorIndicators) {
          if (
            finalPageText?.toLowerCase().includes(errorIndicator.toLowerCase())
          ) {
            foundErrors.push(errorIndicator);
          }
        }

        // Check for success indicators
        const waitingRoomSuccessIndicators = [
          "Waiting Room",
          "Session begins",
          "Participants",
          "Please wait",
          "Session will start",
          "Waiting for host",
        ];

        let foundSuccess = [];
        for (const successIndicator of waitingRoomSuccessIndicators) {
          if (
            finalPageText
              ?.toLowerCase()
              .includes(successIndicator.toLowerCase())
          ) {
            foundSuccess.push(successIndicator);
          }
        }

        // Step 8: Report results
        console.log("");
        console.log("📊 WAITING ROOM NAVIGATION TEST RESULTS:");
        console.log("");
        console.log("✅ SUCCESSFUL STEPS:");
        console.log("   ✅ Host token authentication (ADMIN123)");
        console.log("   ✅ Session opener navigation");
        console.log("   ✅ Cascading dropdown completion");
        console.log("   ✅ Session details form completion");
        console.log("   ✅ Open Session button click");
        console.log(`   ✅ Enter Waiting Room button found (${foundSelector})`);
        console.log("   ✅ Enter Waiting Room button clicked");
        console.log("");

        if (foundErrors.length > 0) {
          console.log("❌ ERRORS FOUND IN WAITING ROOM:");
          foundErrors.forEach((error) => console.log(`   ❌ ${error}`));
          console.log("");
          console.log(
            "🎯 BUG CONFIRMED: Enter Waiting Room button leads to error!",
          );
          console.log("🔍 This reproduces the user-reported issue");
        } else if (foundSuccess.length > 0) {
          console.log("✅ SUCCESS INDICATORS FOUND:");
          foundSuccess.forEach((success) => console.log(`   ✅ ${success}`));
          console.log("");
          console.log("🎉 Enter Waiting Room button works correctly!");
        } else {
          console.log("❓ UNEXPECTED STATE:");
          console.log("   ❓ No clear error or success indicators found");
          console.log("   ❓ May indicate a blank page or loading issue");
          console.log("");
        }

        console.log(`🌐 Final navigation result: ${finalUrl}`);
        console.log("📸 Screenshots saved for analysis");
      } else {
        console.log(
          "❌ CRITICAL: No Enter Waiting Room button found after session creation",
        );
        console.log(
          "🔍 This indicates the session creation itself may have failed",
        );
        console.log("📋 Available elements on page:");

        // Try to find any clickable elements that might be the waiting room button
        const allButtons = page.locator(
          'button, a, input[type="button"], input[type="submit"]',
        );
        const buttonCount = await allButtons.count();

        console.log(`   Found ${buttonCount} clickable elements:`);
        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = allButtons.nth(i);
          const text = await button.textContent();
          const tagName = await button.evaluate((el) => el.tagName);
          console.log(`   ${i + 1}. ${tagName}: "${text?.trim()}"`);
        }
      }
    } catch (error) {
      console.error("❌ Waiting Room Navigation Test failed:", error);
      await page.screenshot({
        path: "./screenshots/waiting-room-test-error.png",
        fullPage: true,
      });
      throw error;
    }
  });
});
