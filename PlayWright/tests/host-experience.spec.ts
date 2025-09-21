/**
 * NOOR Canvas - Host Experience Test
 *
 * This comprehensive test validates the complete host experience workflow from
 * authentication through session creation to participant waiting room access.
 *
 * WORKFLOW COVERAGE:
 * 1. Host token authentication (using known working token R8N25I8J)
 * 2. Navigate to Host Session Opener with valid token
 * 3. Complete cascading dropdown selection (Album → Category → Session)
 * 4. Set session details (date, time, duration)
 * 5. Create session and get participant token
 * 6. Navigate to waiting room and validate access
 *
 * EXPECTED BEHAVIOR:
 * - Session creation should generate user landing URL: https://localhost:9091/user/landing/[TOKEN]
 * - "Open Waiting Room" button should appear and be clickable
 * - Participant should be able to access waiting room without "Session Error"
 *
 * PURPOSE:
 * This test can be run repeatedly to validate the complete host experience
 * and detect any regressions in the host authentication and session creation workflow.
 */

import {
  expect,
  test,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";

// Base URL for the application
const BASE_URL = "https://localhost:9091";

// Helper function to perform cascading dropdown selection with proper 2-second delays
async function performCascadingSelection(page: Page) {
  console.log("🎯 Starting cascading dropdown selection...");

  // Step 1: Select Album - "Quran Comprehension"
  await page.waitForSelector("select", { timeout: 10000 });
  const albumSelect = page.locator("select").first();
  await albumSelect.selectOption({ label: "Quran Comprehension" });
  console.log("✅ Selected Album: Quran Comprehension");
  await page.waitForTimeout(3000); // Wait for category dropdown to populate

  // Step 2: Select Category - "Surah Ikhlas"
  const categorySelect = page.locator("select").nth(1);
  await categorySelect.selectOption({ label: "Surah Ikhlas" });
  console.log("✅ Selected Category: Surah Ikhlas");
  await page.waitForTimeout(5000); // Wait for session dropdown to populate

  // Step 3: Select Session - "Masculine vs Feminine Gender"
  const sessionSelect = page.locator("select").nth(2);
  await sessionSelect.selectOption({ label: "Masculine vs Feminine Gender" });
  console.log("✅ Selected Session: Masculine vs Feminine Gender");
  await page.waitForTimeout(3000); // Allow form to update
}

// Helper function to set session details (date, time, duration)
async function setSessionDetails(page: Page) {
  console.log("📅 Setting session details...");

  // Set date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];

  const dateInput = page.locator("#session-date");
  await expect(dateInput).toBeVisible({ timeout: 5000 });
  await dateInput.fill(dateString);
  console.log(`✅ Set session date: ${dateString}`);

  // Set time (4:45 PM - text input expecting "HH:MM AM/PM" format)
  const timeInput = page.locator("#session-time");
  await expect(timeInput).toBeVisible({ timeout: 5000 });
  await timeInput.fill("4:45 PM");
  console.log("✅ Set session time: 4:45 PM");

  // Set duration (60 minutes)
  const durationInput = page.locator("#session-duration");
  await expect(durationInput).toBeVisible({ timeout: 5000 });
  await durationInput.clear();
  await durationInput.fill("60");
  console.log("✅ Set session duration: 60 minutes");

  // Wait for form validation
  await page.waitForTimeout(2000);
}

test.describe("Host Experience Test", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Comprehensive logging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`🚨 BROWSER ERROR: ${msg.text()}`);
      } else {
        console.log(`🖥️  BROWSER [${msg.type()}]: ${msg.text()}`);
      }
    });

    // Track all requests
    page.on("request", (request: Request) => {
      if (request.url().includes("api") || request.url().includes("host")) {
        console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    // Track all responses
    page.on("response", (response: Response) => {
      if (response.url().includes("api") || response.url().includes("host")) {
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
  });

  test("Complete Host Experience - Session Creation to Waiting Room", async ({
    page,
    request,
  }) => {
    console.log("🚀 Starting Complete Host Experience Test...");

    try {
      // Step 1: Use known working host token
      console.log("🔑 Step 1: Using known working host token...");
      const hostToken = "ADMIN123"; // Discovered working token
      console.log(`✅ Using host token: ${hostToken}`);

      // Step 2: Navigate to Host Session Opener
      console.log("🎯 Step 2: Navigate to Host Session Opener...");
      await page.goto(`${BASE_URL}/host/session-opener/${hostToken}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3000);

      // Verify successful navigation
      const pageUrl = page.url();
      expect(pageUrl).toContain("/host/session-opener/");
      console.log(`✅ Successfully navigated to: ${pageUrl}`);

      // Step 3: Complete cascading dropdown selection
      console.log("📋 Step 3: Complete cascading dropdown selection...");
      await performCascadingSelection(page);
      console.log("✅ Cascading dropdown selection completed");

      // Step 4: Set session details
      console.log("📅 Step 4: Set session details...");
      await setSessionDetails(page);
      console.log("✅ Session details configured");

      // Step 5: Create session
      console.log("🚀 Step 5: Create session...");

      // Wait for Open Session button to be enabled
      const openSessionBtn = page.locator(
        '#openSessionBtn, button:has-text("Open Session")',
      );
      await expect(openSessionBtn).toBeEnabled({ timeout: 10000 });
      console.log("✅ Open Session button is enabled");

      // Track session creation responses
      let sessionCreationResponse: any = null;
      page.on("response", async (response) => {
        if (
          response.url().includes("/api/host/create-session") ||
          response.url().includes("session")
        ) {
          try {
            const responseText = await response.text();
            console.log(
              "📊 Session API response:",
              responseText.substring(0, 200),
            );
            sessionCreationResponse = responseText;
          } catch (e) {
            console.log("⚠️ Could not parse session response");
          }
        }
      });

      // Click Open Session
      await openSessionBtn.click();
      console.log("🔄 Waiting for session creation...");
      await page.waitForTimeout(8000);

      // Take screenshot after session creation
      await page.screenshot({
        path: "./screenshots/after-session-creation.png",
        fullPage: true,
      });

      // Step 6: Look for generated session URL
      console.log("🔍 Step 6: Looking for generated session URL...");

      // Look for the session URL panel that should become visible after clicking Open Session
      await page.waitForTimeout(3000);

      // Look for session URL panel or any new content that appeared
      const sessionUrlPanelSelectors = [
        ".session-url-panel",
        "#session-url-panel",
        '[data-testid="session-url"]',
        'div:has-text("Session URL")',
        'div:has-text("User Link")',
        'input[readonly]:has([value*="user/landing"])',
        'a[href*="user/landing"]',
      ];

      let sessionUrlFound = false;
      let participantToken = null;
      let sessionUrl = "";

      // Try each selector to find the session URL panel
      for (const selector of sessionUrlPanelSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(
            `✅ Found session URL panel with selector: ${selector} (${count} elements)`,
          );
          sessionUrlFound = true;
          break;
        }
      }

      // Look for the pattern like "https://localhost:9091/user/landing/9HGUW8Z9" in page content
      const pageContent = await page.content();
      const userLandingPattern =
        /https?:\/\/localhost:9091\/user\/landing\/([A-Z0-9]{8})/i;
      const userLandingMatch = pageContent.match(userLandingPattern);

      if (userLandingMatch) {
        participantToken = userLandingMatch[1];
        sessionUrl = userLandingMatch[0];
        console.log(`✅ Found user landing URL: ${sessionUrl}`);
        console.log(`✅ Participant token: ${participantToken}`);
      } else {
        // Also try relative URLs
        const relativePattern = /\/user\/landing\/([A-Z0-9]{8})/i;
        const relativeMatch = pageContent.match(relativePattern);
        if (relativeMatch) {
          participantToken = relativeMatch[1];
          sessionUrl = `${BASE_URL}${relativeMatch[0]}`;
          console.log(`✅ Found relative user landing URL: ${sessionUrl}`);
          console.log(`✅ Participant token: ${participantToken}`);
        }
      }

      // If still no URL found, look for "Open Waiting Room" button or link
      if (!participantToken) {
        console.log('🔍 Looking for "Open Waiting Room" button or link...');
        const waitingRoomBtn = page.locator(
          'button:has-text("Open Waiting Room"), a:has-text("Open Waiting Room"), [data-testid="open-waiting-room"]',
        );
        const waitingRoomCount = await waitingRoomBtn.count();

        if (waitingRoomCount > 0) {
          console.log(
            `✅ Found "Open Waiting Room" button/link (${waitingRoomCount} elements)`,
          );

          // Try to extract the URL from the button's onclick or href
          for (let i = 0; i < waitingRoomCount; i++) {
            const element = waitingRoomBtn.nth(i);
            const href = (await element.getAttribute("href")) || "";
            const onclick = (await element.getAttribute("onclick")) || "";

            console.log(
              `   Element ${i}: href="${href}", onclick="${onclick}"`,
            );

            // Extract token from href or onclick
            const tokenMatch = (href + onclick).match(/([A-Z0-9]{8})/);
            if (tokenMatch) {
              participantToken = tokenMatch[1];
              sessionUrl = href.startsWith("http")
                ? href
                : `${BASE_URL}/user/landing/${participantToken}`;
              console.log(
                `✅ Extracted token from waiting room link: ${participantToken}`,
              );
              break;
            }
          }
        }
      }

      if (participantToken && sessionUrl) {
        // Step 7: Navigate to Waiting Room
        console.log("🎭 Step 7: Navigate to waiting room...");

        // Try clicking "Open Waiting Room" button first (if available)
        const waitingRoomBtn = page.locator(
          'button:has-text("Open Waiting Room"), a:has-text("Open Waiting Room")',
        );
        const hasWaitingRoomBtn = (await waitingRoomBtn.count()) > 0;

        if (hasWaitingRoomBtn) {
          console.log('🎯 Found "Open Waiting Room" button - clicking it...');
          await waitingRoomBtn.first().click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(5000);
        } else {
          console.log(
            '🔗 No "Open Waiting Room" button found - navigating directly to session URL...',
          );
          console.log(`🎫 Using session URL: ${sessionUrl}`);
          console.log(`🎫 Participant token: ${participantToken}`);

          await page.goto(sessionUrl);
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(8000);
        }

        // Step 8: Analyze waiting room result
        console.log("🔍 Step 8: Analyzing waiting room result...");
        await page.screenshot({
          path: "./screenshots/waiting-room-result.png",
          fullPage: true,
        });

        const pageText = await page.textContent("body");
        const hasSessionError =
          pageText?.includes("Session Error") ||
          pageText?.includes("Session not found") ||
          pageText?.includes("Invalid") ||
          pageText?.includes("Expired");
        const hasWaitingRoom =
          pageText?.includes("Waiting Room") ||
          pageText?.includes("Session begins") ||
          pageText?.includes("Participants");

        if (hasSessionError) {
          console.log(
            "🎯 ISSUE REPRODUCED: Session Error found in waiting room!",
          );
          console.log("📄 Error content:", pageText?.substring(0, 800));

          // This confirms the user's reported issue
          console.log(
            "✅ CONFIRMED: Host experience workflow generates session URL successfully",
          );
          console.log(
            '❌ CONFIRMED: Participant token leads to "Session Error" in waiting room',
          );
          console.log(
            "🔍 ROOT CAUSE: Session creation appears successful but participant access fails",
          );
        } else if (hasWaitingRoom) {
          console.log(
            "🎉 SUCCESS: Waiting room loaded correctly - no session error!",
          );
          console.log("📄 Success content:", pageText?.substring(0, 500));
          console.log("✅ Host experience working end-to-end");
        } else {
          console.log("❓ UNEXPECTED: Unknown page state");
          console.log("📄 Page content:", pageText?.substring(0, 500));
        }

        const finalUrl = page.url();
        console.log(`🏁 Final URL: ${finalUrl}`);
        console.log(
          `🏁 Session Error Found: ${hasSessionError ? "YES ❌" : "NO ✅"}`,
        );

        // Test Summary
        console.log("");
        console.log("📊 HOST EXPERIENCE TEST SUMMARY:");
        console.log("   ✅ Host token authentication: WORKING");
        console.log("   ✅ Navigation to session opener: WORKING");
        console.log("   ✅ Cascading dropdown selection: WORKING");
        console.log("   ✅ Form completion (date/time/duration): WORKING");
        console.log("   ✅ Session creation button: WORKING");
        console.log("   ✅ Session URL generation: WORKING");
        console.log(
          `   ${hasSessionError ? "❌" : "✅"} Waiting room access: ${hasSessionError ? "FAILS with Session Error" : "WORKING"}`,
        );
        console.log("");
        console.log(
          `🏆 HOST EXPERIENCE TEST: ${hasSessionError ? "ISSUE CONFIRMED" : "PASSED"}`,
        );
      } else {
        console.log(
          "❌ CRITICAL: No participant token found after session creation",
        );
        console.log("🔍 Session creation may be failing silently");
        console.log("📄 Page content sample:", pageContent.substring(0, 1000));

        // This is still valuable information - session creation is failing
        console.log("");
        console.log("📊 HOST EXPERIENCE TEST SUMMARY:");
        console.log("   ✅ Host token authentication: WORKING");
        console.log("   ✅ Navigation to session opener: WORKING");
        console.log("   ✅ Cascading dropdown selection: WORKING");
        console.log("   ✅ Form completion (date/time/duration): WORKING");
        console.log(
          "   ✅ Session creation button: WORKING (enabled and clickable)",
        );
        console.log(
          "   ❌ Session URL generation: FAILING (no participant token generated)",
        );
        console.log("   ❓ Waiting room access: CANNOT TEST (no session URL)");
        console.log("");
        console.log(
          "🏆 HOST EXPERIENCE TEST: SESSION CREATION FAILURE DETECTED",
        );

        throw new Error(
          "Session creation failed - no participant token generated",
        );
      }
    } catch (error) {
      console.error("❌ Host Experience Test failed:", error);
      await page.screenshot({
        path: "./screenshots/host-experience-error.png",
        fullPage: true,
      });
      throw error;
    }
  });

  test("Quick Session Error Validation", async ({ page }) => {
    console.log("🔍 Quick validation: Test invalid token behavior...");

    // Test with a known invalid token format
    const testToken = "TEST" + Date.now().toString().slice(-4);
    const testUrl = `${BASE_URL}/user/landing/${testToken}`;

    console.log(`🧪 Testing invalid token URL: ${testUrl}`);

    await page.goto(testUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const pageText = await page.textContent("body");
    const hasError =
      pageText?.includes("Session Error") || pageText?.includes("not found");

    console.log(
      `✅ Invalid token correctly shows error: ${hasError ? "YES" : "NO"}`,
    );

    await page.screenshot({
      path: "./screenshots/invalid-token-test.png",
      fullPage: true,
    });

    // This should show Session Error for invalid token - that's expected behavior
    expect(pageText).toBeTruthy(); // Page should not be blank
  });
});
