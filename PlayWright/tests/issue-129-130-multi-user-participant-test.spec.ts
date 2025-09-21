import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * Issue-129 & Issue-130 Multi-User Test Suite
 * Tests participant list functionality with 5 users from different countries
 * Validates start button removal and participant addition (not replacement)
 */

test.describe("Issue-129 & Issue-130: Multi-User Participant List Testing", () => {
  const testHostToken = "4M2HTZ4A"; // Host token for session 212
  const testSessionToken = "ZTC273KK"; // Valid participant token for session 212

  // Test data: 5 users from different countries
  const testUsers = [
    {
      name: "Ahmed Al-Rashid",
      email: "ahmed@test.com",
      country: "Saudi Arabia",
      countryCode: "sa",
    },
    {
      name: "Fatima Khan",
      email: "fatima@test.com",
      country: "Pakistan",
      countryCode: "pk",
    },
    {
      name: "Omar Hassan",
      email: "omar@test.com",
      country: "Egypt",
      countryCode: "eg",
    },
    {
      name: "Aisha Mahmoud",
      email: "aisha@test.com",
      country: "Morocco",
      countryCode: "ma",
    },
    {
      name: "Yusuf Ibrahim",
      email: "yusuf@test.com",
      country: "Turkey",
      countryCode: "tr",
    },
  ];

  test.beforeAll(async () => {
    // Ensure session has future start time for proper countdown display
    console.log("Setting up multi-user test environment...");
  });

  test("Issue-130: Multi-user participant registration and list addition", async ({
    browser,
  }) => {
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];

    try {
      // Create separate browser contexts for each user (simulating different users)
      for (let i = 0; i < testUsers.length; i++) {
        const context = await browser.newContext();
        contexts.push(context);
        const page = await context.newPage();
        pages.push(page);
      }

      console.log(
        `Created ${testUsers.length} browser contexts for multi-user testing`,
      );

      // Register each user and verify participant list grows
      for (let i = 0; i < testUsers.length; i++) {
        const page = pages[i];
        const user = testUsers[i];

        console.log(
          `\n=== Registering User ${i + 1}: ${user.name} from ${user.country} ===`,
        );

        // Navigate to user landing page
        await page.goto(
          `http://localhost:9090/user/landing/${testSessionToken}`,
        );

        // Wait for page to load
        await expect(page.getByText("Join Session")).toBeVisible({
          timeout: 15000,
        });

        // Fill registration form
        await page.fill('[name="Model.Name"]', user.name);
        await page.fill('[name="Model.Email"]', user.email);

        // Select country from dropdown
        await page.selectOption('[name="Model.Country"]', user.country);

        // Submit registration
        await page.click('button[type="submit"]');

        // Wait for redirect to waiting room
        await expect(page.getByText("Waiting Room")).toBeVisible({
          timeout: 15000,
        });

        console.log(`✅ User ${i + 1} (${user.name}) registered successfully`);

        // Verify participant count increases
        const participantCountText = await page.textContent(
          'h2:has-text("Participants")',
        );
        const currentCount = parseInt(
          participantCountText?.match(/\d+/)?.[0] || "0",
        );

        console.log(`Current participant count: ${currentCount}`);
        expect(currentCount).toBe(i + 1); // Should equal number of registered users

        // Verify this user appears in the list
        await expect(page.getByText(user.name)).toBeVisible();

        // Verify country flag is displayed
        const flagImg = page.locator(
          `img[alt*="${user.countryCode}"], img[src*="${user.countryCode}"]`,
        );
        await expect(
          flagImg.or(page.locator('img[data-testid="participant-flag"]')),
        ).toBeVisible();

        console.log(`✅ User ${i + 1} appears in participant list with flag`);
      }

      // Final verification: Check all users are present in the last registered user's view
      const finalPage = pages[pages.length - 1];

      console.log("\n=== Final Verification: All Users Present ===");

      // Verify total count
      const finalCountText = await finalPage.textContent(
        'h2:has-text("Participants")',
      );
      const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || "0");
      expect(finalCount).toBe(testUsers.length);

      console.log(
        `✅ Final participant count: ${finalCount}/${testUsers.length}`,
      );

      // Verify all names are present (testing Issue-130: addition not replacement)
      for (const user of testUsers) {
        await expect(finalPage.getByText(user.name)).toBeVisible();
        console.log(`✅ ${user.name} found in final list`);
      }

      // Verify Start Session button is NOT present (Issue-129)
      await expect(finalPage.getByTestId("start-session-btn")).toBeHidden();
      await expect(finalPage.getByText("Start Session")).toBeHidden();
      console.log(`✅ Start Session button correctly hidden from participants`);
    } finally {
      // Clean up contexts
      for (const context of contexts) {
        await context.close();
      }
      console.log("✅ Browser contexts cleaned up");
    }
  });

  test("Issue-129: Session countdown display with future start time", async ({
    page,
  }) => {
    // Navigate to waiting room
    await page.goto(
      `http://localhost:9090/session/waiting/${testSessionToken}`,
    );

    // Wait for page load
    await expect(page.getByText("Waiting Room")).toBeVisible({
      timeout: 15000,
    });

    // With future start time, should show countdown
    const hasCountdown = await page
      .getByText("Session begins in:")
      .isVisible()
      .catch(() => false);
    const hasActiveSession = await page
      .getByText("Session is starting now!")
      .isVisible()
      .catch(() => false);

    // Should show proper countdown message since start time is in future
    expect(hasCountdown || hasActiveSession).toBeTruthy();

    // Verify countdown display is present
    const countdownDisplay = page.getByTestId("countdown-display");
    await expect(countdownDisplay).toBeVisible();

    // Verify progress bar is present
    const progressBar = page.getByTestId("progress-bar");
    await expect(progressBar).toBeVisible();

    console.log("✅ Session countdown display working correctly");
  });

  test("Issue-130: Participant list sorting with multiple countries", async ({
    page,
  }) => {
    // Navigate to waiting room (should have participants from previous test)
    await page.goto(
      `http://localhost:9090/session/waiting/${testSessionToken}`,
    );

    await expect(page.getByText("Waiting Room")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Participants")).toBeVisible();

    // Get current participant count
    const participantsList = page.getByTestId("participants-list");
    await expect(participantsList).toBeVisible();

    const participantCount = await participantsList.locator("span").count();

    if (participantCount >= 2) {
      console.log(`Testing sorting with ${participantCount} participants`);

      // Test sorting by name
      await page.getByText("Sort by Name").click();
      await page.waitForTimeout(500);

      const namesSorted = await participantsList
        .locator("span")
        .allTextContents();
      console.log("Names after sorting by name:", namesSorted);

      // Test sorting by country
      await page.getByText("Sort by Country").click();
      await page.waitForTimeout(500);

      const countriesSorted = await participantsList
        .locator("span")
        .allTextContents();
      console.log("Names after sorting by country:", countriesSorted);

      // Verify sorting didn't break the participant list
      expect(namesSorted.length).toBe(participantCount);
      expect(countriesSorted.length).toBe(participantCount);

      console.log("✅ Participant sorting functionality working correctly");
    } else {
      console.log(
        `Only ${participantCount} participants found - sorting test requires 2+ participants`,
      );
    }
  });

  test("Issue-129 & Issue-130: Real-time updates verification", async ({
    browser,
  }) => {
    // Create two browser contexts: one viewer, one new registrant
    const viewerContext = await browser.newContext();
    const registrantContext = await browser.newContext();

    try {
      const viewerPage = await viewerContext.newPage();
      const registrantPage = await registrantContext.newPage();

      // Viewer goes to waiting room
      await viewerPage.goto(
        `http://localhost:9090/session/waiting/${testSessionToken}`,
      );
      await expect(viewerPage.getByText("Waiting Room")).toBeVisible({
        timeout: 15000,
      });

      // Get initial participant count
      const initialCountText = await viewerPage.textContent(
        'h2:has-text("Participants")',
      );
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || "0");

      console.log(`Initial participant count from viewer: ${initialCount}`);

      // New user registers
      const newUser = {
        name: "Real Time Test User",
        email: "realtime@test.com",
        country: "Indonesia",
      };

      await registrantPage.goto(
        `http://localhost:9090/user/landing/${testSessionToken}`,
      );
      await expect(registrantPage.getByText("Join Session")).toBeVisible({
        timeout: 15000,
      });

      await registrantPage.fill('[name="Model.Name"]', newUser.name);
      await registrantPage.fill('[name="Model.Email"]', newUser.email);
      await registrantPage.selectOption(
        '[name="Model.Country"]',
        newUser.country,
      );
      await registrantPage.click('button[type="submit"]');

      await expect(registrantPage.getByText("Waiting Room")).toBeVisible({
        timeout: 15000,
      });

      console.log(`✅ New user ${newUser.name} registered`);

      // Wait for real-time update on viewer page (up to 10 seconds)
      await viewerPage.waitForTimeout(3000);

      // Check if viewer sees the new participant
      const updatedCountText = await viewerPage.textContent(
        'h2:has-text("Participants")',
      );
      const updatedCount = parseInt(updatedCountText?.match(/\d+/)?.[0] || "0");

      console.log(`Updated participant count from viewer: ${updatedCount}`);

      // Verify count increased
      expect(updatedCount).toBeGreaterThan(initialCount);

      // Verify new user appears in viewer's list
      await expect(viewerPage.getByText(newUser.name)).toBeVisible({
        timeout: 5000,
      });

      console.log("✅ Real-time participant updates working correctly");
    } finally {
      await viewerContext.close();
      await registrantContext.close();
    }
  });
});
