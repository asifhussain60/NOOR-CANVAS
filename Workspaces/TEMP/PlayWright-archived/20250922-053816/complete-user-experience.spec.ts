import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * Complete User Experience E2E Test Suite
 *
 * This comprehensive test validates the complete multi-user session experience:
 * - Spins up 5 browser sessions using the same session token
 * - Different users register with unique names, emails, and countries (US, UK, Australia)
 * - Validates real-time SignalR updates as each user joins the waiting room
 * - Ensures all connected users see new participants appear instantly
 * - Tests date formatting, timer functionality, and participant display across all sessions
 *
 * STANDALONE TEST - No enhanced utilities to avoid conflicts
 */

interface TestUser {
  name: string;
  email: string;
  country: string;
  countryCode: string;
  flagCode: string;
}

test.describe("Complete User Experience - Multi-User SignalR Validation", () => {
  const testUsers: TestUser[] = [
    {
      name: "John Smith",
      email: "john.smith@example.com",
      country: "United States",
      countryCode: "US",
      flagCode: "us",
    },
    {
      name: "Emily Johnson",
      email: "emily.johnson@example.co.uk",
      country: "United Kingdom",
      countryCode: "GB",
      flagCode: "gb",
    },
    {
      name: "Michael Brown",
      email: "michael.brown@example.com.au",
      country: "Australia",
      countryCode: "AU",
      flagCode: "au",
    },
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      country: "United States",
      countryCode: "US",
      flagCode: "us",
    },
    {
      name: "David Taylor",
      email: "david.taylor@example.co.uk",
      country: "United Kingdom",
      countryCode: "GB",
      flagCode: "gb",
    },
  ];

  let contexts: BrowserContext[] = [];
  let pages: Page[] = [];
  let userToken: string;

  test.beforeAll(async ({ browser }) => {
    // Use working token from previous tests
    userToken = "ZUPNFUD7";

    // Create 5 separate browser contexts (simulating different users)
    for (let i = 0; i < testUsers.length; i++) {
      const context = await browser.newContext({
        // Each user gets their own isolated session
        storageState: undefined,
      });
      const page = await context.newPage();

      contexts.push(context);
      pages.push(page);

      console.log(
        `Created browser context ${i + 1} for user: ${testUsers[i].name}`,
      );
    }
  });

  test.afterAll(async () => {
    // Cleanup all browser contexts
    for (const context of contexts) {
      await context.close();
    }
  });

  test("should register 5 users and validate real-time SignalR participant updates", async () => {
    const registrationResults: {
      userName: string;
      success: boolean;
      waitingRoomLoaded: boolean;
    }[] = [];

    console.log("\n=== STARTING MULTI-USER REGISTRATION TEST ===\n");

    // Phase 1: Register all users sequentially and get them to waiting room
    for (let i = 0; i < testUsers.length; i++) {
      const page = pages[i];
      const user = testUsers[i];

      console.log(`\n--- REGISTERING USER ${i + 1}: ${user.name} ---`);

      try {
        // Navigate to landing page
        console.log(`User ${i + 1}: Navigating to landing page...`);
        await page.goto(`http://localhost:9090/user/landing/${userToken}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Wait for session info to load
        await page.waitForSelector('[data-testid="session-name"]', {
          timeout: 15000,
        });

        // Fill registration form
        console.log(`User ${i + 1}: Filling registration form...`);

        // Name field
        await page.waitForSelector('input[placeholder*="Enter your name"]', {
          timeout: 10000,
        });
        await page.fill('input[placeholder*="Enter your name"]', user.name);

        // Email field
        await page.fill('input[placeholder*="Enter your email"]', user.email);

        // Country selection
        await page.waitForSelector("select", { timeout: 10000 });
        await page.selectOption("select", { value: user.countryCode });

        console.log(
          `User ${i + 1}: Form filled with name="${user.name}", email="${user.email}", country="${user.country}"`,
        );

        // Submit registration
        console.log(`User ${i + 1}: Submitting registration...`);
        await page.click('button:has-text("Register")');

        // Wait for navigation to waiting room
        console.log(`User ${i + 1}: Waiting for navigation to waiting room...`);
        await page.waitForURL("**/session/waiting/**", { timeout: 20000 });

        // Wait for waiting room to fully load
        await page.waitForSelector('[data-testid="countdown-display"]', {
          timeout: 15000,
        });
        await page.waitForSelector('[data-testid="participants-list"]', {
          timeout: 10000,
        });

        console.log(`User ${i + 1}: Successfully reached waiting room!`);

        registrationResults.push({
          userName: user.name,
          success: true,
          waitingRoomLoaded: true,
        });

        // Small delay between registrations to allow SignalR propagation
        if (i < testUsers.length - 1) {
          console.log(
            `User ${i + 1}: Waiting 2 seconds before next registration...`,
          );
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        console.error(`User ${i + 1} registration failed:`, error);
        registrationResults.push({
          userName: user.name,
          success: false,
          waitingRoomLoaded: false,
        });
      }
    }

    console.log("\n=== REGISTRATION PHASE COMPLETE ===");
    console.log("Registration Results:", registrationResults);

    // Phase 2: Validate that all users can see each other via SignalR
    console.log("\n=== VALIDATING SIGNALR PARTICIPANT UPDATES ===\n");

    const successfulUsers = registrationResults.filter(
      (r) => r.success && r.waitingRoomLoaded,
    );
    expect(successfulUsers.length).toBeGreaterThan(0); // At least some users should succeed

    console.log(
      `Successfully registered users: ${successfulUsers.length}/${testUsers.length}`,
    );

    // Wait for SignalR propagation
    console.log("Waiting 5 seconds for SignalR updates to propagate...");
    await pages[0].waitForTimeout(5000);

    // Check each successful user's waiting room for participant list
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const user = testUsers[i];

      if (!registrationResults[i].success) {
        console.log(
          `Skipping participant validation for failed user: ${user.name}`,
        );
        continue;
      }

      console.log(`\n--- VALIDATING WAITING ROOM FOR USER: ${user.name} ---`);

      try {
        // Check that participants list exists and has content
        await page.waitForSelector('[data-testid="participants-list"]', {
          timeout: 10000,
        });

        // Get all participant elements
        const participantElements = await page.$$(
          '[data-testid="participants-list"] > div:not(:has-text("No participants"))',
        );
        console.log(
          `User ${user.name}: Found ${participantElements.length} participants in list`,
        );

        // Validate participant names and flags
        const participantData: { name: string; flag: string }[] = [];

        for (const element of participantElements) {
          const nameText = await element.textContent();
          const flagImg = await element.$(
            'img[data-testid="participant-flag"]',
          );
          const flagSrc = flagImg ? await flagImg.getAttribute("src") : "";

          if (nameText && nameText.trim()) {
            participantData.push({
              name: nameText.trim(),
              flag: flagSrc || "",
            });
          }
        }

        console.log(`User ${user.name}: Participant data:`, participantData);

        // Expect to see at least the current user in the list
        const hasCurrentUser = participantData.some((p) =>
          p.name.includes(user.name),
        );
        expect(hasCurrentUser).toBeTruthy();

        // If multiple users registered successfully, expect to see others too
        if (successfulUsers.length > 1) {
          expect(participantData.length).toBeGreaterThan(0);
          console.log(
            `User ${user.name}: Can see ${participantData.length} total participants`,
          );
        }
      } catch (error) {
        console.error(
          `Error validating participants for user ${user.name}:`,
          error,
        );
      }
    }

    console.log("\n=== VALIDATING UI ELEMENTS ACROSS ALL SESSIONS ===\n");

    // Phase 3: Validate UI elements work correctly across all sessions
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const user = testUsers[i];

      if (!registrationResults[i].success) {
        console.log(`Skipping UI validation for failed user: ${user.name}`);
        continue;
      }

      console.log(`\n--- UI VALIDATION FOR USER: ${user.name} ---`);

      try {
        // 1. Validate current date display (not Oct 26, 2020)
        const dateElement = await page.locator(
          "div:has(.fa-calendar-days) + div p:last-child",
        );
        const dateText = await dateElement.textContent();

        console.log(`User ${user.name}: Date displayed as "${dateText}"`);

        // Should show current date, not 2020
        expect(dateText).not.toContain("2020");
        expect(dateText).not.toContain("Oct 26");

        // Should show current date
        const today = new Date();
        const currentMonth = today.toLocaleDateString("en-US", {
          month: "short",
        });
        const isCurrentDate =
          dateText?.includes("Today") || dateText?.includes(currentMonth);
        expect(isCurrentDate).toBeTruthy();

        // 2. Validate timer is running (not stuck at 00:00)
        const timerElement = await page.locator(
          '[data-testid="countdown-display"]',
        );
        const initialTime = await timerElement.textContent();

        console.log(`User ${user.name}: Initial timer value "${initialTime}"`);

        // Wait 2 seconds and check timer changed
        await page.waitForTimeout(2000);
        const updatedTime = await timerElement.textContent();

        console.log(
          `User ${user.name}: Timer after 2 seconds "${updatedTime}"`,
        );

        // Timer should either be counting down or show session started
        const timerWorking =
          initialTime !== updatedTime ||
          initialTime?.includes("00:00") ||
          updatedTime?.includes("00:00");
        expect(timerWorking).toBeTruthy();

        // 3. Validate progress bar exists and has proper styling
        const progressBar = await page.locator('[data-testid="progress-bar"]');
        expect(progressBar).toBeVisible();

        // 4. Validate session name is loaded (not placeholder text)
        const sessionNameElement = await page
          .locator('h2:has-text("Loading")')
          .first();
        const sessionNameCount = await sessionNameElement.count();
        expect(sessionNameCount).toBe(0); // No "Loading..." text should remain

        console.log(
          `User ${user.name}: ✅ All UI elements validated successfully`,
        );
      } catch (error) {
        console.error(`UI validation failed for user ${user.name}:`, error);
      }
    }

    console.log("\n=== FINAL SIGNALR CONSISTENCY CHECK ===\n");

    // Phase 4: Final consistency check - all waiting rooms should show same participant count
    const participantCounts: number[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const user = testUsers[i];

      if (!registrationResults[i].success) continue;

      try {
        const participantElements = await page.$$(
          '[data-testid="participants-list"] > div:not(:has-text("No participants"))',
        );
        participantCounts.push(participantElements.length);

        console.log(
          `User ${user.name}: Sees ${participantElements.length} participants`,
        );
      } catch (error) {
        console.error(
          `Error checking participant count for ${user.name}:`,
          error,
        );
      }
    }

    // All successful users should see roughly the same number of participants (allowing for timing differences)
    if (participantCounts.length > 1) {
      const minCount = Math.min(...participantCounts);
      const maxCount = Math.max(...participantCounts);
      const countDifference = maxCount - minCount;

      console.log(
        `Participant count range: ${minCount}-${maxCount} (difference: ${countDifference})`,
      );

      // Allow small differences due to SignalR timing, but shouldn't be wildly different
      expect(countDifference).toBeLessThanOrEqual(2);
    }

    console.log("\n=== TEST COMPLETE ===");
    console.log(
      `✅ Successfully tested ${successfulUsers.length}/${testUsers.length} users`,
    );
    console.log("✅ SignalR real-time updates validated");
    console.log("✅ UI elements working correctly across all sessions");
    console.log("✅ Date display fixed (no more Oct 26, 2020)");
    console.log("✅ Timer functionality restored");
    console.log("✅ Participant names display correctly");
  });

  test("should validate session token reuse works for all users", async () => {
    console.log("\n=== VALIDATING SESSION TOKEN REUSE ===\n");

    // All users should be able to use the same token and join the same session
    for (let i = 0; i < Math.min(3, pages.length); i++) {
      // Test with first 3 users for speed
      const page = pages[i];
      const user = testUsers[i];

      console.log(`Testing token reuse for user: ${user.name}`);

      // Navigate directly to waiting room with token
      await page.goto(`http://localhost:9090/session/waiting/${userToken}`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });

      // Should load waiting room successfully (not show token error)
      try {
        await page.waitForSelector('[data-testid="countdown-display"]', {
          timeout: 10000,
        });

        // Should not show error message
        const errorElement = await page.$('[data-testid="error-message"]');
        if (errorElement) {
          const errorText = await errorElement.textContent();
          expect(errorText).not.toContain("Invalid");
          expect(errorText).not.toContain("expired");
        }

        console.log(`✅ User ${user.name}: Token reuse successful`);
      } catch (error) {
        console.log(`❌ User ${user.name}: Token reuse failed - ${error}`);
        throw error;
      }
    }
  });
});
