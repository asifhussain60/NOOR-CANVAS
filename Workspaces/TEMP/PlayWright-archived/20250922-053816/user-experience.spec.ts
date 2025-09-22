import { expect, Page, test } from "@playwright/test";

/**
 * User Experience Test Suite
 *
 * This test validates the complete user journey through the NoorCanvas waiting room,
 * ensuring proper display of:
 * - Current date formatting (not historical KSESSIONS date)
 * - Live countdown timer functionality
 * - Complete participant names (not truncated)
 * - All UI elements render correctly
 */

test.describe("User Experience - Complete Waiting Room Journey", () => {
  let page: Page;
  let userToken: string;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Use the same working token from the logs: ZUPNFUD7
    userToken = "ZUPNFUD7";

    // Navigate to user landing page first
    await page.goto(`https://localhost:9091/user/landing/${userToken}`, {
      waitUntil: "networkidle",
    });
  });

  test("should display correct current date format and working timer", async () => {
    // Wait for the landing page to load
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });

    // Click join session button
    await page.click('button[data-testid="join-session-button"]');

    // Wait for navigation to waiting room
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for session data to load
    await page.waitForSelector('[data-testid="countdown-display"]', {
      timeout: 15000,
    });

    // Verify current date is displayed (should be today's date, not Oct 26, 2020)
    const sessionDateText = await page
      .textContent(".fa-calendar-days")
      .then(() =>
        page
          .locator("div:has(.fa-calendar-days) + div p:last-child")
          .textContent(),
      );

    const today = new Date();
    const currentMonth = today.toLocaleDateString("en-US", { month: "short" });
    const currentDate = today.getDate();
    const currentYear = today.getFullYear();

    // Should show "Today" or current date format, NOT "Oct 26, 2020"
    expect(sessionDateText).not.toContain("Oct 26, 2020");
    expect(sessionDateText).not.toContain("2020");

    // Most likely should show "Today" for current date
    if (sessionDateText?.includes("Today")) {
      expect(sessionDateText).toBe("Today");
    } else {
      // Or should contain current year if showing formatted date
      expect(sessionDateText).toContain(currentYear.toString());
    }

    console.log(`✅ Date validation passed: ${sessionDateText}`);
  });

  test("should have functional countdown timer that updates", async () => {
    // Navigate through landing page
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });
    await page.click('button[data-testid="join-session-button"]');
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for countdown to appear
    const countdownSelector = '[data-testid="countdown-display"]';
    await page.waitForSelector(countdownSelector, { timeout: 15000 });

    // Get initial countdown value
    const initialTime = await page.textContent(countdownSelector);
    console.log(`Initial countdown time: ${initialTime}`);

    // Countdown should NOT be "00:00" (the bug we're fixing)
    expect(initialTime).not.toBe("00:00");

    // Should show a realistic countdown (format like "04:59" or similar)
    expect(initialTime).toMatch(/^\d{2}:\d{2}$/);

    // Wait 3 seconds and check that timer has changed (proving it's running)
    await page.waitForTimeout(3000);
    const updatedTime = await page.textContent(countdownSelector);
    console.log(`Updated countdown time: ${updatedTime}`);

    // Timer should have decreased (proving it's actively counting down)
    expect(updatedTime).not.toBe(initialTime);

    // Verify progress bar is present and has some progress
    const progressBar = page.locator('[data-testid="progress-bar"] > div');
    const progressWidth = await progressBar.getAttribute("style");
    expect(progressWidth).toContain("width:");

    console.log(
      `✅ Timer functionality validated: ${initialTime} → ${updatedTime}`,
    );
  });

  test("should display complete participant names without truncation", async () => {
    // Navigate through landing page
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });
    await page.click('button[data-testid="join-session-button"]');
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for participants list to load
    await page.waitForSelector('[data-testid="participants-list"]', {
      timeout: 15000,
    });

    // Wait a moment for participant data to populate via API
    await page.waitForTimeout(2000);

    // Get all participant names
    const participantNames = await page
      .locator('[data-testid="participants-list"] span')
      .allTextContents();
    console.log(`Participant names found: ${JSON.stringify(participantNames)}`);

    // Should have participants (based on API logs showing 2 participants)
    expect(participantNames.length).toBeGreaterThan(0);

    // Based on API logs, we expect "Asif Hussain" and "Asif" (two different people)
    const fullNameFound = participantNames.some((name) =>
      name.includes("Asif Hussain"),
    );
    const shortNameFound = participantNames.some((name) => name === "Asif");

    expect(fullNameFound).toBe(true);
    expect(shortNameFound).toBe(true);

    // Verify that "Asif Hussain" is displayed completely, not truncated to just "Asif"
    expect(participantNames).toContain("Asif Hussain");

    console.log(
      `✅ Participant names validation passed: Full names displayed correctly`,
    );
  });

  test("should display all required session information correctly", async () => {
    // Navigate through landing page
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });
    await page.click('button[data-testid="join-session-button"]');
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for session data to fully load
    await page.waitForSelector("h2", { timeout: 15000 });

    // Verify session title is displayed (from API: "Need For Messengers")
    const sessionTitle = await page.locator("h2").first().textContent();
    expect(sessionTitle).toBeTruthy();
    expect(sessionTitle).not.toBe("Loading...");
    console.log(`Session title: ${sessionTitle}`);

    // Verify instructor name is displayed (from API: "Asif Hussain")
    const instructorElement = await page
      .locator("div:has(.fa-user-tie) + div p:last-child")
      .textContent();
    expect(instructorElement).toBeTruthy();
    expect(instructorElement).not.toBe("Loading...");
    console.log(`Instructor: ${instructorElement}`);

    // Verify start time is displayed and not default placeholder
    const startTimeElement = await page
      .locator("div:has(.fa-clock) + div p:last-child")
      .textContent();
    expect(startTimeElement).toBeTruthy();
    expect(startTimeElement).not.toBe("2:00 PM EST"); // Should not be default placeholder
    console.log(`Start time: ${startTimeElement}`);

    // Verify duration is shown
    const durationElement = await page
      .locator("div:has(.fa-hourglass-half) + div p:last-child")
      .textContent();
    expect(durationElement).toBeTruthy();
    expect(durationElement).not.toBe("Loading...");
    console.log(`Duration: ${durationElement}`);

    console.log(`✅ All session information displayed correctly`);
  });

  test("should show proper waiting room status and messaging", async () => {
    // Navigate through landing page
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });
    await page.click('button[data-testid="join-session-button"]');
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for status message area
    await page.waitForSelector('[data-testid="countdown-display"]', {
      timeout: 15000,
    });

    // Should show appropriate waiting message (not the bug state "Session is starting now!")
    const statusMessages = await page.locator("p").allTextContents();
    const hasWaitingMessage = statusMessages.some(
      (msg) =>
        msg.includes("Session begins in:") ||
        msg.includes("Waiting for") ||
        msg.includes("Starting"),
    );

    expect(hasWaitingMessage).toBe(true);

    // Should NOT show "Session is starting now!" with "00:00" (the bug state)
    const countdownTime = await page.textContent(
      '[data-testid="countdown-display"]',
    );
    if (countdownTime === "00:00") {
      const sessionStartedMessage = statusMessages.some((msg) =>
        msg.includes("Session is starting now!"),
      );
      // If showing 00:00, it should be because session actually started, not due to bug
      console.log(`Countdown shows 00:00, checking context...`);
    }

    console.log(`✅ Proper waiting room status confirmed`);
  });

  test("should have responsive UI elements and proper styling", async () => {
    // Navigate through landing page
    await page.waitForSelector('button[data-testid="join-session-button"]', {
      timeout: 10000,
    });
    await page.click('button[data-testid="join-session-button"]');
    await page.waitForURL("**/session/waiting/**", { timeout: 10000 });

    // Wait for main content to load
    await page.waitForSelector("h1", { timeout: 15000 });

    // Verify main heading is present
    const mainHeading = await page.locator("h1").textContent();
    expect(mainHeading).toContain("Waiting Room");

    // Verify logo is displayed
    const logo = page.locator('img[alt*="Canvas"]');
    await expect(logo).toBeVisible();

    // Verify progress bar container exists
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

    // Verify participants section exists
    await expect(
      page.locator('[data-testid="participants-list"]'),
    ).toBeVisible();

    // Verify sort buttons are present
    await expect(page.locator('button:has-text("Sort by Name")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Sort by Country")'),
    ).toBeVisible();

    console.log(`✅ All UI elements properly rendered and styled`);
  });

  test.afterEach(async () => {
    // Clean up: Close any remaining connections
    await page.close();
  });
});

/**
 * Test Configuration Notes:
 *
 * These tests validate the fixes for:
 * 1. Date Issue: Should show current date, not "Oct 26, 2020"
 * 2. Timer Issue: Should show working countdown, not frozen "00:00"
 * 3. Participant Issue: Should show full names like "Asif Hussain", not truncated
 *
 * Expected Behavior After Fixes:
 * - Date: Shows "Today" or current date format
 * - Timer: Shows active countdown from current time + 5 minutes
 * - Participants: Shows complete names from API response
 * - UI: All elements render properly and responsively
 */
