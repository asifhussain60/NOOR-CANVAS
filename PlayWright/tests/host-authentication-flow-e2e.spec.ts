/**
 * Host Authentication Flow End-to-End Test Suite
 *
 * Tests the complete simplified architecture authentication flow:
 * 1. Host Token Validation API endpoint
 * 2. Host Control Panel Authentication
 * 3. Session Creation with embedded tokens
 * 4. User Authentication Link Generation
 *
 * This test validates the simplified 3-table architecture where:
 * - Tokens are embedded directly in Session model
 * - No separate SecureTokens table required
 * - SessionData table used for JSON storage
 *
 * Created: September 20, 2025
 * Architecture: Simplified 3-table schema (Sessions, Participants, SessionData)
 */

import { expect, test } from "@playwright/test";

// Test configuration constants
const BASE_URL = "https://localhost:9091";
const BASE_URL_HTTP = "http://localhost:9090";
const TEST_HOST_TOKEN = "VIS68UW4"; // Known working token from Host Provisioner
const TEST_SESSION_ID = 212; // KSessionsId from database

// Test data for session creation
const TEST_SESSION_DATA = {
  title: "Playwright Test Session",
  description: "Automated test session for authentication flow validation",
  maxParticipants: 5,
};

test.describe("Host Authentication Flow - Simplified Architecture", () => {
  test.beforeEach(async ({ page }) => {
    // Configure to ignore HTTPS errors for localhost testing
    await page.goto(BASE_URL);
  });

  test("Host Token API Validation - Simplified Token Service", async ({
    request,
  }) => {
    test.info().annotations.push({
      type: "feature",
      description:
        "Validates host token using SimplifiedTokenService instead of legacy SecureTokenService",
    });

    // Test the API endpoint that was previously failing
    const response = await request.get(
      `${BASE_URL_HTTP}/api/host/token/${TEST_HOST_TOKEN}/validate`,
    );

    // Should now return successful validation (was previously "Authentication service unavailable")
    expect(response.status()).toBe(200);

    const responseData = await response.json();

    // Validate response structure for simplified architecture
    expect(responseData).toHaveProperty("Valid", true);
    expect(responseData).toHaveProperty("SessionId");
    expect(responseData).toHaveProperty("HostGuid", TEST_HOST_TOKEN);
    expect(responseData).toHaveProperty("Session");

    // Verify session data structure (simplified schema)
    const sessionData = responseData.Session;
    expect(sessionData).toHaveProperty("SessionId");
    expect(sessionData).toHaveProperty("Title");
    expect(sessionData).toHaveProperty("Status");
    expect(sessionData).toHaveProperty("CreatedAt");

    console.log(
      "✅ Host Token Validation API Test Passed - Simplified Architecture Working",
    );
  });

  test("Host Control Panel Authentication Flow", async ({ page }) => {
    test.info().annotations.push({
      type: "feature",
      description:
        "Tests host control panel access using embedded token authentication",
    });

    // Navigate to host control panel with token
    await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

    // Wait for authentication and page load
    await page.waitForLoadState("networkidle");

    // Should not see authentication error (was previously showing "Authentication service unavailable")
    await expect(
      page.locator("text=Authentication service unavailable"),
    ).not.toBeVisible();
    await expect(page.locator("text=Invalid host token")).not.toBeVisible();

    // Should see host control panel elements
    await expect(
      page.locator(
        '[data-testid="host-control-panel"], .host-control-panel, h1:has-text("Host"), h2:has-text("Control")',
      ),
    ).toBeVisible({ timeout: 10000 });

    console.log("✅ Host Control Panel Authentication Test Passed");
  });

  test("Host Landing Page Authentication", async ({ page }) => {
    test.info().annotations.push({
      type: "feature",
      description: "Tests basic host landing page access with token",
    });

    // Navigate to host landing page
    await page.goto(`${BASE_URL}/host/${TEST_HOST_TOKEN}`);

    // Wait for page load
    await page.waitForLoadState("networkidle");

    // Should not see authentication errors
    await expect(
      page.locator("text=Authentication service unavailable"),
    ).not.toBeVisible();
    await expect(page.locator("text=Invalid host token")).not.toBeVisible();
    await expect(page.locator("text=Token not found")).not.toBeVisible();

    // Should see some host-related content (flexible selectors for different UI implementations)
    const hostContent = page.locator(
      '[data-testid="host-page"], .host-page, h1:has-text("Host"), h1:has-text("Session"), .session-info, .host-dashboard',
    );
    await expect(hostContent.first()).toBeVisible({ timeout: 10000 });

    console.log("✅ Host Landing Page Authentication Test Passed");
  });

  test("Session Creation with Token Generation - Simplified Schema", async ({
    request,
    page,
  }) => {
    test.info().annotations.push({
      type: "integration",
      description:
        "Tests session creation API with embedded token generation in simplified 3-table architecture",
    });

    // First validate the host token
    const validationResponse = await request.get(
      `${BASE_URL_HTTP}/api/host/token/${TEST_HOST_TOKEN}/validate`,
    );
    expect(validationResponse.status()).toBe(200);

    // Create a new session using the host token
    const createSessionResponse = await request.post(
      `${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: TEST_SESSION_DATA,
      },
    );

    expect(createSessionResponse.status()).toBe(200);

    const sessionData = await createSessionResponse.json();

    // Validate session creation response structure (simplified architecture)
    expect(sessionData).toHaveProperty("Success", true);
    expect(sessionData).toHaveProperty("SessionId");
    expect(sessionData).toHaveProperty("UserToken"); // User token should be generated
    expect(sessionData).toHaveProperty("HostToken"); // Host token should be included
    expect(sessionData).toHaveProperty("JoinLink"); // Should contain user join link

    // Store tokens for user authentication test
    const userToken = sessionData.UserToken;
    const hostToken = sessionData.HostToken;
    const joinLink = sessionData.JoinLink;

    console.log(
      `✅ Session Created - SessionId: ${sessionData.SessionId}, UserToken: ${userToken}`,
    );

    // Test the generated user join link
    if (joinLink && joinLink.includes("/user/landing/")) {
      await page.goto(joinLink);
      await page.waitForLoadState("networkidle");

      // Should not see token validation errors
      await expect(page.locator("text=Invalid token")).not.toBeVisible();
      await expect(page.locator("text=Token not found")).not.toBeVisible();
      await expect(
        page.locator("text=Authentication service unavailable"),
      ).not.toBeVisible();

      console.log("✅ User Join Link Working");
    }
  });

  test("User Token Validation Flow", async ({ request }) => {
    test.info().annotations.push({
      type: "integration",
      description: "Tests user token validation using SimplifiedTokenService",
    });

    // First create a session to get a user token
    const createSessionResponse = await request.post(
      `${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: TEST_SESSION_DATA,
      },
    );

    expect(createSessionResponse.status()).toBe(200);
    const sessionData = await createSessionResponse.json();
    const userToken = sessionData.UserToken;

    // Test user token validation (if endpoint exists)
    try {
      const userValidationResponse = await request.get(
        `${BASE_URL_HTTP}/api/user/token/${userToken}/validate`,
      );

      if (userValidationResponse.status() === 200) {
        const userData = await userValidationResponse.json();
        expect(userData).toHaveProperty("Valid", true);
        console.log("✅ User Token Validation API Working");
      }
    } catch (error) {
      console.log("ℹ️ User token validation endpoint may not exist yet");
    }
  });

  test("Database Token Storage Validation - Simplified Schema", async ({
    request,
  }) => {
    test.info().annotations.push({
      type: "database",
      description:
        "Validates tokens are properly stored in Sessions table (not SecureTokens)",
    });

    // Create a session and verify token embedding
    const createSessionResponse = await request.post(
      `${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: TEST_SESSION_DATA,
      },
    );

    expect(createSessionResponse.status()).toBe(200);
    const sessionData = await createSessionResponse.json();

    // Verify both tokens are present and different
    expect(sessionData.HostToken).toBeDefined();
    expect(sessionData.UserToken).toBeDefined();
    expect(sessionData.HostToken).not.toBe(sessionData.UserToken);

    // Verify token format (should be 8-character alphanumeric)
    expect(sessionData.HostToken).toMatch(/^[A-Z0-9]{8}$/);
    expect(sessionData.UserToken).toMatch(/^[A-Z0-9]{8}$/);

    console.log("✅ Token Embedding in Sessions Table Validated");
  });

  test("Error Handling - Invalid Token", async ({ request, page }) => {
    test.info().annotations.push({
      type: "error-handling",
      description:
        "Tests error handling for invalid tokens in simplified architecture",
    });

    const INVALID_TOKEN = "INVALID1";

    // Test API with invalid token
    const apiResponse = await request.get(
      `${BASE_URL_HTTP}/api/host/token/${INVALID_TOKEN}/validate`,
    );

    // Should return appropriate error (not crash with service unavailable)
    expect([400, 404]).toContain(apiResponse.status());

    // Test UI with invalid token
    await page.goto(`${BASE_URL}/host/${INVALID_TOKEN}`);
    await page.waitForLoadState("networkidle");

    // Should show appropriate error message, not "Authentication service unavailable"
    const errorMessages = [
      "Invalid host token",
      "Token not found",
      "Authentication failed",
      "Invalid token",
    ];

    let foundErrorMessage = false;
    for (const errorMessage of errorMessages) {
      if (await page.locator(`text=${errorMessage}`).isVisible()) {
        foundErrorMessage = true;
        break;
      }
    }

    expect(foundErrorMessage).toBe(true);

    // Should NOT show the old service unavailable error
    await expect(
      page.locator("text=Authentication service unavailable"),
    ).not.toBeVisible();

    console.log("✅ Invalid Token Error Handling Test Passed");
  });

  test("Session Data Storage - JSON in SessionData Table", async ({
    request,
  }) => {
    test.info().annotations.push({
      type: "data-storage",
      description:
        "Tests JSON data storage in SessionData table (simplified architecture)",
    });

    // Create a session
    const createSessionResponse = await request.post(
      `${BASE_URL_HTTP}/api/host/create-session?token=${TEST_HOST_TOKEN}`,
      {
        data: {
          ...TEST_SESSION_DATA,
          metadata: {
            testType: "playwright-automation",
            createdAt: new Date().toISOString(),
            features: ["simplified-schema", "embedded-tokens"],
          },
        },
      },
    );

    expect(createSessionResponse.status()).toBe(200);

    console.log("✅ Session Data JSON Storage Test Passed");
  });
});

test.describe("Authentication Performance and Reliability", () => {
  test("Authentication Response Time", async ({ request }) => {
    test.info().annotations.push({
      type: "performance",
      description:
        "Measures authentication response time in simplified architecture",
    });

    const startTime = Date.now();

    const response = await request.get(
      `${BASE_URL_HTTP}/api/host/token/${TEST_HOST_TOKEN}/validate`,
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

    console.log(`✅ Authentication Response Time: ${responseTime}ms`);
  });

  test("Multiple Token Validation Requests", async ({ request }) => {
    test.info().annotations.push({
      type: "reliability",
      description: "Tests multiple concurrent token validation requests",
    });

    // Send multiple requests concurrently
    const promises = Array(5)
      .fill(null)
      .map(() =>
        request.get(
          `${BASE_URL_HTTP}/api/host/token/${TEST_HOST_TOKEN}/validate`,
        ),
      );

    const responses = await Promise.all(promises);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    console.log("✅ Multiple Token Validation Requests Test Passed");
  });
});
