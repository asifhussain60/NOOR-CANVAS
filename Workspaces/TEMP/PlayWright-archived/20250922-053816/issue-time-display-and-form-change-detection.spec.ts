import { expect, test } from "@playwright/test";

/**
 * ISSUE FIX TESTS: Time Display and Form Change Detection
 *
 * Test Suite for two critical issues:
 * 1. SessionWaiting.razor: Time display and countdown accuracy for future sessions
 * 2. Host-SessionOpener.razor: Form change detection and session URL invalidation
 *
 * These tests verify the fixes implemented following fixissue.prompt.md protocol
 */

test.describe("NOOR Canvas - Time Display and Form Change Detection Issues", () => {
  test.describe("Issue 1: SessionWaiting.razor Time Display", () => {
    test("should display correct countdown for future scheduled session", async ({
      page,
    }) => {
      // Navigate to a session waiting page with a known future session token
      // Note: This test assumes we have a test session configured for future time
      await page.goto("/session/waiting/E5R7TLXK");

      // Wait for the session to load
      await page.waitForSelector('[data-testid="countdown-display"]', {
        timeout: 10000,
      });

      // Verify countdown display is not showing "00:00" for future session
      const countdownText = await page
        .locator('[data-testid="countdown-display"]')
        .textContent();
      expect(countdownText).not.toBe("00:00");
      expect(countdownText).toMatch(/^\d{1,2}:\d{2}$/); // Format: MM:SS or HH:SS

      // Verify start time is displayed and not "Loading..."
      const startTimeElement = page
        .locator("text=Start Time")
        .locator("..")
        .locator("p")
        .nth(1);
      const startTime = await startTimeElement.textContent();
      expect(startTime).not.toBe("Loading...");
      expect(startTime).not.toBe("2:00 PM EST"); // Should not be the hardcoded default

      // Verify progress bar is functioning (not at 100% immediately for future session)
      const progressBar = page.locator('[data-testid="progress-bar"] div');
      const progressWidth = await progressBar.getAttribute("style");
      expect(progressWidth).not.toContain("width:100%");

      console.log(`✓ Future session countdown displaying: ${countdownText}`);
      console.log(`✓ Start time showing: ${startTime}`);
    });

    test("should update countdown dynamically every second", async ({
      page,
    }) => {
      await page.goto("/session/waiting/E5R7TLXK");
      await page.waitForSelector('[data-testid="countdown-display"]');

      // Capture initial countdown value
      const initialCountdown = await page
        .locator('[data-testid="countdown-display"]')
        .textContent();

      // Wait 2 seconds and verify countdown has changed
      await page.waitForTimeout(2000);
      const updatedCountdown = await page
        .locator('[data-testid="countdown-display"]')
        .textContent();

      // For a future session, countdown should be decreasing
      expect(updatedCountdown).not.toBe(initialCountdown);

      console.log(
        `✓ Countdown updated from ${initialCountdown} to ${updatedCountdown}`,
      );
    });

    test("should show appropriate status messages based on time remaining", async ({
      page,
    }) => {
      await page.goto("/session/waiting/E5R7TLXK");
      await page.waitForSelector('[data-testid="countdown-display"]');

      // Get the status message
      const statusMessage = await page
        .locator("text=Waiting for host to begin")
        .or(page.locator("text=Starting soon"))
        .or(page.locator("text=Starting very soon"))
        .first()
        .textContent();

      // Verify we have a meaningful status message
      expect(statusMessage).toBeTruthy();
      expect([
        "Waiting for host to begin the session.",
        "Waiting for session to begin.",
        "Starting soon...",
        "Starting very soon...",
      ]).toContain(statusMessage);

      console.log(`✓ Status message: ${statusMessage}`);
    });
  });

  test.describe("Issue 2: Host-SessionOpener.razor Form Change Detection", () => {
    test("should hide session URL panel when form fields change", async ({
      page,
    }) => {
      // Navigate to host session opener with valid token
      await page.goto("/host/session-opener/ADMIN123");

      // Wait for form to load
      await page.waitForSelector("#album-select");

      // Fill out the form completely to generate a session URL
      await page.selectOption("#album-select", "1"); // Assuming album ID 1 exists
      await page.waitForTimeout(1000); // Wait for categories to load

      await page.selectOption("#category-select", "1"); // Assuming category ID 1 exists
      await page.waitForTimeout(1000); // Wait for sessions to load

      await page.selectOption("#session-select", "1"); // Assuming session ID 1 exists

      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split("T")[0];
      await page.fill("#session-date", tomorrowString);

      // Set time
      await page.fill("#session-time", "2:00 PM");

      // Set duration
      await page.fill("#session-duration", "60");

      // Click Open Session to generate URL
      await page.click('button:has-text("Open Session")');

      // Wait for session URL panel to appear
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Verify session URL panel is visible
      let sessionUrlVisible = await page
        .locator("text=Session URL:")
        .isVisible();
      expect(sessionUrlVisible).toBe(true);

      console.log("✓ Session URL panel created successfully");

      // Now change a form field and verify panel is hidden
      await page.selectOption("#album-select", "2"); // Change album selection

      // Verify session URL panel is now hidden
      sessionUrlVisible = await page.locator("text=Session URL:").isVisible();
      expect(sessionUrlVisible).toBe(false);

      console.log("✓ Session URL panel hidden after form field change");
    });

    test("should invalidate session URL when date changes", async ({
      page,
    }) => {
      await page.goto("/host/session-opener/ADMIN123");

      // Complete form and generate session URL
      await page.waitForSelector("#album-select");
      await page.selectOption("#album-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#category-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#session-select", "1");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill("#session-date", tomorrow.toISOString().split("T")[0]);
      await page.fill("#session-time", "3:00 PM");
      await page.fill("#session-duration", "90");

      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Capture the original URL
      const originalUrl = await page.locator("#sessionUrl").textContent();

      // Change the date
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      await page.fill(
        "#session-date",
        dayAfterTomorrow.toISOString().split("T")[0],
      );

      // Verify panel is hidden (URL invalidated)
      const sessionUrlVisible = await page
        .locator("text=Session URL:")
        .isVisible();
      expect(sessionUrlVisible).toBe(false);

      console.log(
        `✓ Session URL invalidated after date change: ${originalUrl}`,
      );
    });

    test("should invalidate session URL when time changes", async ({
      page,
    }) => {
      await page.goto("/host/session-opener/ADMIN123");

      // Complete form and generate session URL
      await page.waitForSelector("#album-select");
      await page.selectOption("#album-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#category-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#session-select", "1");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill("#session-date", tomorrow.toISOString().split("T")[0]);
      await page.fill("#session-time", "4:00 PM");
      await page.fill("#session-duration", "60");

      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Change the time
      await page.fill("#session-time", "5:00 PM");

      // Verify panel is hidden (URL invalidated)
      const sessionUrlVisible = await page
        .locator("text=Session URL:")
        .isVisible();
      expect(sessionUrlVisible).toBe(false);

      console.log("✓ Session URL invalidated after time change");
    });

    test("should invalidate session URL when duration changes", async ({
      page,
    }) => {
      await page.goto("/host/session-opener/ADMIN123");

      // Complete form and generate session URL
      await page.waitForSelector("#album-select");
      await page.selectOption("#album-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#category-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#session-select", "1");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill("#session-date", tomorrow.toISOString().split("T")[0]);
      await page.fill("#session-time", "6:00 PM");
      await page.fill("#session-duration", "60");

      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Change the duration
      await page.fill("#session-duration", "120");

      // Verify panel is hidden (URL invalidated)
      const sessionUrlVisible = await page
        .locator("text=Session URL:")
        .isVisible();
      expect(sessionUrlVisible).toBe(false);

      console.log("✓ Session URL invalidated after duration change");
    });

    test("should allow creating new session URL after form changes", async ({
      page,
    }) => {
      await page.goto("/host/session-opener/ADMIN123");

      // Complete form and generate initial session URL
      await page.waitForSelector("#album-select");
      await page.selectOption("#album-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#category-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#session-select", "1");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill("#session-date", tomorrow.toISOString().split("T")[0]);
      await page.fill("#session-time", "7:00 PM");
      await page.fill("#session-duration", "60");

      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      console.log("✓ Initial session URL created");

      // Change form field to invalidate URL
      await page.fill("#session-time", "8:00 PM");

      // Verify panel is hidden
      let sessionUrlVisible = await page
        .locator("text=Session URL:")
        .isVisible();
      expect(sessionUrlVisible).toBe(false);

      console.log("✓ Session URL panel hidden after change");

      // Click Open Session again to create new URL
      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Verify new session URL panel is visible
      sessionUrlVisible = await page.locator("text=Session URL:").isVisible();
      expect(sessionUrlVisible).toBe(true);

      console.log("✓ New session URL created successfully after form change");
    });
  });

  test.describe("Integration Tests: Both Issues Combined", () => {
    test("should create session with correct time and verify waiting room displays proper countdown", async ({
      page,
      browser,
    }) => {
      // Create a session with specific future time
      await page.goto("/host/session-opener/ADMIN123");

      // Complete form with specific future time (15 minutes from now)
      await page.waitForSelector("#album-select");
      await page.selectOption("#album-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#category-select", "1");
      await page.waitForTimeout(1000);
      await page.selectOption("#session-select", "1");

      // Set date to today
      const today = new Date();
      await page.fill("#session-date", today.toISOString().split("T")[0]);

      // Set time to 15 minutes from now
      const futureTime = new Date(today.getTime() + 15 * 60000);
      const timeString = futureTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      await page.fill("#session-time", timeString);
      await page.fill("#session-duration", "60");

      await page.click('button:has-text("Open Session")');
      await page.waitForSelector("text=Session URL:", { timeout: 10000 });

      // Extract the session URL
      const sessionUrl = await page.locator("#sessionUrl").textContent();
      expect(sessionUrl).toContain("localhost");

      // Extract token from URL
      const tokenMatch = sessionUrl?.match(
        /\/user\/userlanding\/([A-Z0-9]{8})/,
      );
      expect(tokenMatch).toBeTruthy();
      const userToken = tokenMatch![1];

      console.log(`✓ Created session with user token: ${userToken}`);

      // Navigate to waiting room with the generated token
      await page.goto(`/session/waiting/${userToken}`);
      await page.waitForSelector('[data-testid="countdown-display"]', {
        timeout: 10000,
      });

      // Verify countdown shows approximately 15 minutes (accounting for processing time)
      const countdownText = await page
        .locator('[data-testid="countdown-display"]')
        .textContent();
      const [minutes, seconds] = countdownText!.split(":").map(Number);
      const totalSeconds = minutes * 60 + seconds;

      // Should be between 13-16 minutes (accounting for processing delays)
      expect(totalSeconds).toBeGreaterThan(13 * 60);
      expect(totalSeconds).toBeLessThan(16 * 60);

      console.log(
        `✓ Waiting room shows correct countdown: ${countdownText} (${totalSeconds} seconds)`,
      );
    });
  });
});
