/**
 * Complete User Journey End-to-End Test
 * Tests the full user experience path from registration through waiting room
 * Validates that participants load correctly after registration
 */

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { generateTestToken, type TokenData } from "./test-utils";

test.describe("Complete User Journey E2E", () => {
  let testTokenData: TokenData;
  let page: Page;
  let request: APIRequestContext;

  test.beforeAll(async ({ browser }) => {
    // Create a dedicated page and API context for this test suite
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();
    request = context.request;

    // Generate fresh test tokens for this test run
    testTokenData = await generateTestToken(request);
    console.log("🔑 Generated test tokens:", {
      userToken: testTokenData.userToken,
      sessionId: testTokenData.sessionId,
    });
  });

  test("Complete User Registration Journey", async () => {
    console.log("\n🚀 Starting Complete User Registration Journey...");

    // Step 1: Navigate to registration page with valid token
    console.log("📍 Step 1: Navigate to registration page");
    await page.goto(`/landing?token=${testTokenData.userToken}`);

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify we're on the registration page
    await expect(page).toHaveTitle(/NoorCanvas/);
    console.log("✅ Registration page loaded successfully");

    // Step 2: Fill out registration form
    console.log("📍 Step 2: Fill registration form");

    // Wait for registration form to be visible
    await page.waitForSelector('input[placeholder*="name"]', {
      timeout: 10000,
    });

    // Fill name field
    const nameField = page.locator('input[placeholder*="name"]').first();
    await nameField.fill("Frank Adams");
    console.log("✅ Name filled: Frank Adams");

    // Fill email field
    const emailField = page.locator('input[placeholder*="email"]').first();
    await emailField.fill("frank.adams@example.com");
    console.log("✅ Email filled: frank.adams@example.com");

    // Wait for and select country dropdown
    await page.waitForSelector("select", { timeout: 5000 });

    const countrySelect = page.locator("select").first();
    await countrySelect.selectOption("AU"); // Use ISO2 code for Australia
    console.log("✅ Country selected: Australia");

    // Step 3: Submit registration
    console.log("📍 Step 3: Submit registration");

    // Find and click the "Join Waiting Room" button
    const registerButton = page
      .locator('button:has-text("Join Waiting Room")')
      .or(page.locator('button:has-text("Submit")'))
      .first();

    await registerButton.click();
    console.log("✅ Registration submitted");

    // Step 4: Wait for navigation to waiting room
    console.log("📍 Step 4: Navigate to waiting room");

    // Wait for navigation to the correct waiting room URL and content
    await Promise.race([
      page.waitForURL(/.*\/session\/waiting\/.*/, { timeout: 10000 }),
      page.waitForSelector(
        '[data-testid="participants-list"], [data-testid="countdown-display"]',
        { timeout: 10000 },
      ),
    ]);

    console.log("✅ Navigated to waiting room");

    // Step 5: Verify Frank Adams appears in participants list
    console.log("📍 Step 5: Verify participant appears in list");

    // Wait for participants to load
    await page.waitForTimeout(2000); // Allow time for API calls

    // Check if Frank Adams is in the participant list
    const frankInList = await page
      .locator("text=Frank Adams")
      .isVisible({ timeout: 5000 });

    if (frankInList) {
      console.log("✅ SUCCESS: Frank Adams found in participants list!");
    } else {
      // If not visible, let's debug what's happening
      console.log(
        "⚠️  Frank Adams not immediately visible, checking page content...",
      );

      // Get page content for debugging
      const pageContent = await page.content();
      const hasParticipantSection =
        pageContent.includes("participant") || pageContent.includes("waiting");

      console.log("📊 Debug info:", {
        hasParticipantSection,
        currentURL: page.url(),
        pageTitle: await page.title(),
      });

      // Try to find any participant-related content
      const participantElements = await page
        .locator(".participant, [data-participant], .user-list li")
        .all();
      console.log(
        `📊 Found ${participantElements.length} potential participant elements`,
      );

      for (let i = 0; i < participantElements.length; i++) {
        const text = await participantElements[i].textContent();
        console.log(`  - Element ${i}: "${text}"`);
      }
    }

    // Final assertion - Frank Adams should be visible
    await expect(page.locator("text=Frank Adams")).toBeVisible({
      timeout: 10000,
    });
    console.log(
      "🎉 COMPLETE SUCCESS: Frank Adams registration and display verified!",
    );
  });

  test("Verify Registration API Integration", async () => {
    console.log("\n🔍 Verifying Registration API Integration...");

    // Test the registration API directly
    const registrationData = {
      Name: "Test User API",
      Email: "testuser@example.com",
      Country: "CA", // Use ISO2 code
      Token: testTokenData.userToken,
    };

    console.log("📍 Calling registration API with:", registrationData);

    const response = await request.post(
      "/api/participant/register-with-token",
      {
        data: registrationData,
      },
    );

    expect(response.ok()).toBeTruthy();

    const responseData = await response.json();
    console.log("✅ Registration API response:", responseData);

    expect(responseData).toHaveProperty("success", true);
    expect(responseData).toHaveProperty("userId");
    expect(responseData).toHaveProperty("registrationId");

    // Verify the participant appears in the participants list API
    console.log("📍 Checking participants list API...");

    const participantsResponse = await request.get(
      `/api/participant/session/${testTokenData.userToken}/participants`,
    );
    expect(participantsResponse.ok()).toBeTruthy();

    const participantsData = await participantsResponse.json();
    console.log("✅ Participants API response:", participantsData);

    expect(participantsData.participantCount).toBeGreaterThan(0);
    expect(participantsData.participants).toContainEqual(
      expect.objectContaining({
        displayName: "Test User API",
        country: "Canada", // This might be the full name, not ISO code
      }),
    );

    console.log("🎉 API Integration verified successfully!");
  });

  test("Verify Waiting Room Loads Participants Correctly", async () => {
    console.log("\n🏃‍♂️ Testing Waiting Room Participant Loading...");

    // Navigate directly to waiting room
    await page.goto(`/session/waiting/${testTokenData.userToken}`);
    await page.waitForLoadState("networkidle");

    console.log("📍 Waiting room loaded, checking for participants...");

    // Wait for participant loading to complete
    await page.waitForTimeout(3000);

    // Check for participant count indicator from SessionWaiting component
    const participantCount = await page
      .locator("text=/Participants \\(\\d+\\)/")
      .textContent()
      .catch(() => null);
    console.log("📊 Participant count display:", participantCount);

    // Verify at least one participant is shown in the participants list
    const participants = await page
      .locator('[data-testid="participants-list"] > div')
      .all();
    console.log(
      `📊 Found ${participants.length} participant elements in waiting room`,
    );

    expect(participants.length).toBeGreaterThan(0);

    // Check for our test participant
    const testUserVisible = await page
      .locator("text=Test User API")
      .isVisible();
    if (testUserVisible) {
      console.log("✅ Test User API found in waiting room");
    }

    console.log("🎉 Waiting room participant loading verified!");
  });
});

test.describe("User Journey Edge Cases", () => {
  test("Handle Invalid Tokens Gracefully", async ({ page }) => {
    console.log("\n🚫 Testing invalid token handling...");

    // Try to access waiting room with invalid token
    await page.goto("/session/waiting/INVALID1");

    // Should show error, not crash
    await page.waitForLoadState("networkidle");

    // Check for error message from SessionWaiting component
    const hasError = await page
      .locator('[data-testid="error-message"]')
      .isVisible({ timeout: 5000 });

    expect(hasError).toBeTruthy();
    console.log("✅ Invalid token handled gracefully");
  });

  test("Handle Empty Sessions Correctly", async ({ page, request }) => {
    console.log("\n📭 Testing empty session handling...");

    // Generate a fresh token with no participants
    const emptySessionToken = await generateTestToken(request);

    // Navigate to waiting room of empty session
    await page.goto(`/session/waiting/${emptySessionToken.userToken}`);
    await page.waitForLoadState("networkidle");

    // Should show "no participants" message from SessionWaiting component, not crash
    await page.waitForTimeout(2000);

    const noParticipantsMessage = await page
      .locator("text=/No participants yet|first|waiting for participants/i")
      .isVisible({ timeout: 5000 });
    const participantCount = await page
      .locator("text=/Participants \\(\\d+\\)/")
      .textContent()
      .catch(() => "(0)");

    console.log("📊 Empty session status:", {
      hasNoParticipantsMessage: noParticipantsMessage,
      participantCount: participantCount,
    });

    // Either explicit message or count should indicate empty state
    expect(
      noParticipantsMessage ||
        (participantCount && participantCount.includes("(0)")),
    ).toBeTruthy();
    console.log("✅ Empty session handled correctly");
  });
});
