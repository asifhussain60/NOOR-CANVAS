import { expect, test } from "@playwright/test";

/**
 * Issue-129 & Issue-130 Test Suite
 * Tests for Start Session Button Removal and Participant List Fix
 */

test.describe("Issue-129 & Issue-130: Start Button and Participant List Fixes", () => {
  const testHostToken = "4M2HTZ4A"; // Host token for testing as requested
  const testSessionToken = "ZTC273KK"; // Valid participant token for session 212 access

  test.beforeEach(async ({ page }) => {
    // Navigate to waiting room using participant token
    await page.goto(
      `http://localhost:9090/session/waiting/${testSessionToken}`,
    );

    // Wait for session to load
    await expect(page.getByText("Loading Session...")).toBeHidden({
      timeout: 10000,
    });
  });

  test("Issue-129: Start Session button should not be visible in waiting room", async ({
    page,
  }) => {
    // Verify the start session button is NOT present in the participant waiting room
    const startButton = page.getByTestId("start-session-btn");
    await expect(startButton).toBeHidden();

    // Alternative check - ensure the button text is not in the DOM
    await expect(page.getByText("Start Session")).toBeHidden();

    // Ensure the waiting room is properly loaded
    await expect(page.getByText("Participants")).toBeVisible();
  });

  test("Issue-130: Participant list should add participants instead of replacing", async ({
    page,
  }) => {
    // Wait for participants section to be visible
    await expect(page.getByText("Participants")).toBeVisible();

    // Get initial participant count
    const participantsList = page.getByTestId("participants-list");
    await expect(participantsList).toBeVisible();

    // Check if participants are properly displayed
    const participantElements = await participantsList
      .locator('[data-testid="participant-flag"]')
      .count();

    // Verify participant data structure
    if (participantElements > 0) {
      // Check first participant has proper flag and name
      const firstParticipant = participantsList
        .locator('[data-testid="participant-flag"]')
        .first();
      await expect(firstParticipant).toBeVisible();

      // Verify flag image loads
      await expect(firstParticipant).toHaveAttribute("src", /flagcdn\.com/);

      // Verify participant names are shown
      const participantNames = await participantsList
        .locator("span")
        .allTextContents();
      expect(participantNames.length).toBeGreaterThanOrEqual(1);

      console.log(
        `Found ${participantElements} participants:`,
        participantNames,
      );
    } else {
      // If no participants yet, verify the empty state message
      await expect(
        page.getByText("No participants yet. You're the first!"),
      ).toBeVisible();
    }
  });

  test("Issue-130: Participant list persistence - names should not be replaced", async ({
    page,
  }) => {
    // Wait for participants to load
    await expect(page.getByText("Participants")).toBeVisible();

    // Get current participants
    const participantsList = page.getByTestId("participants-list");
    const initialParticipants = await participantsList
      .locator("span")
      .allTextContents();

    console.log("Initial participants:", initialParticipants);

    // Wait a few seconds and check again to ensure participants persist
    await page.waitForTimeout(3000);

    const laterParticipants = await participantsList
      .locator("span")
      .allTextContents();
    console.log("Later participants:", laterParticipants);

    // Verify participants are not replaced (they should remain or increase)
    if (initialParticipants.length > 0) {
      expect(laterParticipants.length).toBeGreaterThanOrEqual(
        initialParticipants.length,
      );

      // Verify original participants are still present
      for (const participant of initialParticipants) {
        if (participant.trim()) {
          expect(laterParticipants).toContain(participant);
        }
      }
    }
  });

  test("Issue-129 & Issue-130: Waiting room layout without start button", async ({
    page,
  }) => {
    // Verify the main waiting room layout
    await expect(page.getByText("Waiting Room")).toBeVisible();

    // Check for either countdown state (session starting) or active state
    const hasCountdown = await page
      .getByText("Session begins in:")
      .isVisible()
      .catch(() => false);
    const hasActiveSession = await page
      .getByText("Session is starting now!")
      .isVisible()
      .catch(() => false);
    expect(hasCountdown || hasActiveSession).toBeTruthy();

    // Verify countdown display is present
    const countdownDisplay = page.getByTestId("countdown-display");
    await expect(countdownDisplay).toBeVisible();

    // Verify progress bar is present
    const progressBar = page.getByTestId("progress-bar");
    await expect(progressBar).toBeVisible();

    // Verify participants section layout
    await expect(page.getByText(/Participants \(\d+\)/)).toBeVisible();

    // Verify sorting buttons are present
    await expect(page.getByText("Sort by Name")).toBeVisible();
    await expect(page.getByText("Sort by Country")).toBeVisible();

    // CRITICAL: Verify start session button is NOT present
    await expect(page.getByTestId("start-session-btn")).toBeHidden();
    await expect(
      page.getByText("Click to enter the session canvas"),
    ).toBeHidden();
  });

  test("Issue-130: Participant sorting functionality works correctly", async ({
    page,
  }) => {
    // Wait for participants to load
    await expect(page.getByText("Participants")).toBeVisible();

    const participantsList = page.getByTestId("participants-list");
    const participantCount = await participantsList.locator("span").count();

    if (participantCount > 1) {
      // Test sorting by name
      await page.getByText("Sort by Name").click();
      await page.waitForTimeout(500); // Allow sorting to complete

      const namesSorted = await participantsList
        .locator("span")
        .allTextContents();
      console.log("Names after sorting by name:", namesSorted);

      // Test sorting by country
      await page.getByText("Sort by Country").click();
      await page.waitForTimeout(500); // Allow sorting to complete

      const countriesSorted = await participantsList
        .locator("span")
        .allTextContents();
      console.log("Names after sorting by country:", countriesSorted);

      // Verify sorting didn't break the participant list
      expect(namesSorted.length).toBe(participantCount);
      expect(countriesSorted.length).toBe(participantCount);
    } else {
      console.log("Insufficient participants to test sorting (need 2+)");
    }
  });

  test("Issue-129: Navigation flow without start button interference", async ({
    page,
  }) => {
    // Verify waiting room loads correctly
    await expect(page.getByText("Waiting Room")).toBeVisible();

    // Verify no unexpected navigation due to removed start button
    await page.waitForTimeout(2000);

    // Should still be on waiting room page
    expect(page.url()).toContain(`/session/waiting/${testSessionToken}`);

    // Verify the page remains functional
    await expect(page.getByText("Participants")).toBeVisible();
    await expect(page.getByText("Sort by Name")).toBeVisible();

    // No start session button should be available to interfere with the flow
    await expect(page.getByTestId("start-session-btn")).toBeHidden();
  });
});
