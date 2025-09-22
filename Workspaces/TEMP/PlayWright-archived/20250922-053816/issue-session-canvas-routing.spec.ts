import { test, expect } from "@playwright/test";

test.describe("Session Canvas Routing", () => {
  test("should navigate from SessionWaiting to SessionCanvas when StartSession is clicked", async ({
    page,
  }) => {
    // Go to a session waiting page with a test token
    const testToken = "TEST123"; // Using a test token for routing verification
    await page.goto(`/session/waiting/${testToken}`);

    // Wait for the page to load
    await page.waitForSelector('[data-testid="start-session-btn"]', {
      timeout: 10000,
    });

    // Verify we're on the waiting page
    expect(page.url()).toContain("/session/waiting/");

    // Click the Start Session button
    await page.click('[data-testid="start-session-btn"]');

    // Verify we navigated to the canvas page
    await page.waitForURL(/\/session\/canvas\//, { timeout: 5000 });
    expect(page.url()).toContain("/session/canvas/");
    expect(page.url()).toContain(testToken);

    // Verify basic canvas elements are present
    await expect(page.locator("text=Session Canvas")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display SessionCanvas page with basic info", async ({
    page,
  }) => {
    // Go directly to session canvas with test token
    const testToken = "TEST123";
    await page.goto(`/session/canvas/${testToken}`);

    // Wait for loading to complete - might show loading state first
    await page.waitForTimeout(2000);

    // Should either show session content or error message
    const hasSessionContent =
      (await page.locator("text=Session Canvas").count()) > 0;
    const hasErrorMessage =
      (await page.locator('[data-testid="error-message"]').count()) > 0;

    // One of these should be present
    expect(hasSessionContent || hasErrorMessage).toBeTruthy();

    // If error message, verify it's appropriate (since TEST123 is not a real token)
    if (hasErrorMessage) {
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    }

    // Verify basic page structure exists
    expect(page.url()).toContain("/session/canvas/");
  });

  test("should have Start Session button visible on waiting page", async ({
    page,
  }) => {
    // Go to session waiting page
    const testToken = "TEST123";
    await page.goto(`/session/waiting/${testToken}`);

    // Wait for page load
    await page.waitForTimeout(3000);

    // Check if Start Session button is present
    const startButton = page.locator('[data-testid="start-session-btn"]');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await expect(startButton).toContainText("Start Session");
  });
});
