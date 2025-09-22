/**
 * NOOR Canvas - Session Waiting Room Tests
 *
 * Comprehensive test suite for SessionWaiting.razor component including:
 * - Mock data loading and display
 * - Real API integration with valid tokens
 * - Error handling for various failure scenarios
 * - Countdown timer functionality
 * - Participant list rendering
 * - Responsive design verification
 */

import { expect, test } from "@playwright/test";

// Test configuration
const BASE_URL = "https://localhost:9091";
const VALID_TOKEN = "JXH89FKH"; // Known working token from database
const MOCK_TOKEN = "MOCK"; // Triggers mock data loading
const INVALID_TOKEN = "INVALID123";

test.describe("SessionWaiting Component Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for Blazor components to initialize
    test.setTimeout(30000);

    // Ignore SSL certificate errors for localhost
    await page.goto(`${BASE_URL}/session/waiting/test`, {
      waitUntil: "networkidle",
    });
  });

  test.describe("Mock Data Loading Tests", () => {
    test("should load mock session data successfully", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Wait for Blazor component to initialize
      await page.waitForSelector("h1", { timeout: 10000 });

      // Verify session information is displayed
      await expect(
        page.getByText("Advanced Quranic Calligraphy Workshop"),
      ).toBeVisible();
      await expect(page.getByText("Ustadh Mahmoud Al-Khattat")).toBeVisible();
      await expect(page.getByText("2 hours")).toBeVisible();

      // Verify countdown timer is visible
      await expect(
        page.locator('[data-testid="countdown-display"]'),
      ).toBeVisible();

      console.log("✅ Mock session data loaded successfully");
    });

    test("should display mock participants list", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Wait for participants to load
      await page.waitForSelector('[data-testid="participants-list"]', {
        timeout: 10000,
      });

      // Verify specific participants are displayed
      await expect(page.getByText("Dr. Fatima Al-Zahra")).toBeVisible();
      await expect(page.getByText("Ali Ibn Rashid")).toBeVisible();
      await expect(page.getByText("Zainab Qureshi")).toBeVisible();

      // Verify country flags are displayed
      const flagElements = page.locator('[data-testid="participant-flag"]');
      await expect(flagElements).toHaveCount(12); // Should have 12 participants

      console.log("✅ Mock participants list rendered correctly");
    });

    test("should show live countdown timer with mock data", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Wait for countdown to appear
      await page.waitForSelector('[data-testid="countdown-display"]', {
        timeout: 10000,
      });

      // Get initial countdown value
      const initialCountdown = await page.textContent(
        '[data-testid="countdown-display"]',
      );

      // Wait 2 seconds and check if countdown changed
      await page.waitForTimeout(2000);
      const updatedCountdown = await page.textContent(
        '[data-testid="countdown-display"]',
      );

      // Countdown should be different (decreasing)
      expect(initialCountdown).not.toBe(updatedCountdown);

      console.log(
        `✅ Countdown timer working: ${initialCountdown} → ${updatedCountdown}`,
      );
    });
  });

  test.describe("Real API Integration Tests", () => {
    test("should load real session data with valid token", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${VALID_TOKEN}`);

      // Wait for session validation and data loading
      await page.waitForSelector("h1", { timeout: 15000 });

      // Should not show loading state anymore
      await expect(page.getByText("Loading Session...")).not.toBeVisible();

      // Should show actual session title from database
      await expect(page.getByText("A Model For Success")).toBeVisible();

      console.log("✅ Real API integration working with valid token");
    });

    test("should handle invalid token gracefully", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${INVALID_TOKEN}`);

      // Wait for error state
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 10000,
      });

      // Should show appropriate error message
      await expect(page.getByText("Invalid session token")).toBeVisible();
      await expect(
        page.getByText("Please check your session link"),
      ).toBeVisible();

      console.log("✅ Invalid token error handling works correctly");
    });

    test("should call participants API endpoint", async ({ page }) => {
      // Monitor network requests
      const participantsRequests: string[] = [];
      page.on("request", (request) => {
        if (
          request.url().includes("/api/participant/session/") &&
          request.url().includes("/participants")
        ) {
          participantsRequests.push(request.url());
        }
      });

      await page.goto(`${BASE_URL}/session/waiting/${VALID_TOKEN}`);

      // Wait for API calls to complete
      await page.waitForTimeout(5000);

      // Should have made a participants API call
      expect(participantsRequests.length).toBeGreaterThan(0);
      expect(participantsRequests[0]).toContain(
        `/api/participant/session/${VALID_TOKEN}/participants`,
      );

      console.log("✅ Participants API endpoint called successfully");
    });
  });

  test.describe("Error Handling Tests", () => {
    test("should show loading state initially", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${VALID_TOKEN}`);

      // Should show loading state immediately
      await expect(page.getByText("Loading Session...")).toBeVisible();
      await expect(
        page.getByText("Please wait while we prepare your session"),
      ).toBeVisible();

      console.log("✅ Loading state displays correctly");
    });

    test("should handle network errors gracefully", async ({ page }) => {
      // Block all network requests to simulate network failure
      await page.route("**/api/**", (route) => route.abort());

      await page.goto(`${BASE_URL}/session/waiting/${VALID_TOKEN}`);

      // Wait for error state
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 15000,
      });

      // Should show network error message
      const errorText = await page.textContent('[data-testid="error-message"]');
      expect(errorText).toContain("error");

      console.log("✅ Network error handling works correctly");
    });
  });

  test.describe("UI Component Tests", () => {
    test("should display NOOR Canvas logo", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Verify logo is present
      await expect(page.locator('img[alt*="NOOR Canvas"]')).toBeVisible();

      console.log("✅ NOOR Canvas logo displayed correctly");
    });

    test("should be responsive on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Wait for content to load
      await page.waitForSelector("h1", { timeout: 10000 });

      // Verify content is still visible and properly laid out
      await expect(
        page.getByText("Advanced Quranic Calligraphy Workshop"),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="participants-list"]'),
      ).toBeVisible();

      console.log("✅ Mobile responsiveness verified");
    });

    test("should display progress indicator", async ({ page }) => {
      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);

      // Wait for progress indicator
      await page.waitForSelector('[data-testid="progress-bar"]', {
        timeout: 10000,
      });

      // Verify progress bar is visible
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

      console.log("✅ Progress indicator displayed correctly");
    });
  });

  test.describe("Performance Tests", () => {
    test("should load within acceptable time limits", async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`);
      await page.waitForSelector("h1", { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);

      console.log(`✅ Page loaded in ${loadTime}ms`);
    });
  });
});

/**
 * Debug Test - Run this when component isn't rendering properly
 * This test will help identify what's happening during component initialization
 */
test.describe("Debug Tests", () => {
  test("debug component initialization", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) =>
      console.log(`Browser Console [${msg.type()}]: ${msg.text()}`),
    );

    // Monitor all network requests
    page.on("request", (request) =>
      console.log(`Request: ${request.method()} ${request.url()}`),
    );
    page.on("response", (response) =>
      console.log(`Response: ${response.status()} ${response.url()}`),
    );

    console.log("🔍 Starting debug session...");

    await page.goto(`${BASE_URL}/session/waiting/${MOCK_TOKEN}`, {
      waitUntil: "networkidle",
    });

    // Wait longer to see what happens
    await page.waitForTimeout(5000);

    // Capture page content for debugging
    const pageContent = await page.content();
    console.log("📄 Page HTML length:", pageContent.length);

    // Check for Blazor-specific elements
    const blazorElements = await page.locator("[blazor-component-id]").count();
    console.log("🔧 Blazor components found:", blazorElements);

    // Check for JavaScript errors
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    console.log("❌ JavaScript errors:", errors.length > 0 ? errors : "None");

    // Take screenshot for visual debugging
    await page.screenshot({
      path: "./TEMP/debug-session-waiting.png",
      fullPage: true,
    });

    console.log(
      "📸 Debug screenshot saved to ./TEMP/debug-session-waiting.png",
    );
  });
});
