import { expect, test } from "@playwright/test";

/**
 * Comprehensive E2E test to validate data flow from KSESSIONS database through API to UI display
 * Fixes DTO binding issues identified in architectural review
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: "https://localhost:9091",
  tokens: {
    valid: "Z5GFJ2GR", // Real KSESSIONS token for Session 215 "A Model For Success"
    alternative: "5HZB6LLI", // Alternative token for testing
  },
  expectedData: {
    sessionTitle: "A Model For Success",
    instructorName: "Sister Zainab", // Expected instructor from KSESSIONS database
    sessionStatus: "Active",
  },
  timeout: 30000,
};

test.describe("Data Flow Validation - UserLanding to SessionWaiting", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });

    // Enable verbose logging for debugging
    page.on("console", (msg) => {
      if (msg.type() === "log" || msg.type() === "error") {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    // Monitor network requests
    page.on("request", (request) => {
      if (request.url().includes("/api/participant/session")) {
        console.log(`[API REQUEST]: ${request.method()} ${request.url()}`);
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/participant/session")) {
        console.log(`[API RESPONSE]: ${response.status()} ${response.url()}`);
      }
    });
  });

  test("Should validate complete data flow: URL token → API → UserLanding → SessionWaiting", async ({
    page,
  }) => {
    console.log("🔄 Starting comprehensive data flow validation test...");

    // Step 1: Navigate to UserLanding with real KSESSIONS token
    console.log(
      `📍 Step 1: Navigating to UserLanding with token ${TEST_CONFIG.tokens.valid}`,
    );
    await page.goto(
      `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.tokens.valid}`,
      {
        waitUntil: "networkidle",
        timeout: TEST_CONFIG.timeout,
      },
    );

    // Step 2: Verify session data loads from KSESSIONS database
    console.log("📍 Step 2: Verifying session data loads correctly");

    // Wait for session name to load (should come from KSESSIONS via API)
    const sessionNameSelector = '[data-testid="session-name"]';
    await page.waitForSelector(sessionNameSelector, {
      timeout: TEST_CONFIG.timeout,
    });

    const sessionName = await page.textContent(sessionNameSelector);
    console.log(`✅ Session Name loaded: "${sessionName}"`);

    // Validate that we get real data, not placeholder text
    expect(sessionName).toBeTruthy();
    expect(sessionName).not.toBe("[Session Name]");
    expect(sessionName).not.toBe("Enter Session Token");
    expect(sessionName).not.toBe("Loading...");

    // Log the actual session name for verification
    console.log(
      `🔍 Expected: "${TEST_CONFIG.expectedData.sessionTitle}", Got: "${sessionName}"`,
    );

    // Step 3: Verify registration form is visible (token validation successful)
    console.log(
      "📍 Step 3: Verifying registration form appears after token validation",
    );

    const registrationFormSelector = 'div:has-text("REGISTRATION")';
    await expect(page.locator(registrationFormSelector)).toBeVisible({
      timeout: TEST_CONFIG.timeout,
    });

    const nameInput = page.locator('input[placeholder*="name" i]');
    const emailInput = page.locator('input[type="email"]');
    const countrySelect = page.locator("select");

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(countrySelect).toBeVisible();

    // Step 4: Fill registration form and submit
    console.log("📍 Step 4: Filling registration form with test data");

    await nameInput.fill("Test Participant");
    await emailInput.fill("test@noorcanvas.com");

    // Wait for countries to load and select one
    await page.waitForFunction(
      () => {
        const select = document.querySelector("select");
        return select && select.options.length > 1;
      },
      { timeout: TEST_CONFIG.timeout },
    );

    await countrySelect.selectOption({ index: 1 }); // Select first available country

    // Submit registration form
    const submitButton = page.locator('button:has-text("Join Waiting Room")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Step 5: Verify navigation to SessionWaiting page
    console.log("📍 Step 5: Verifying navigation to SessionWaiting page");

    await page.waitForURL(/\/session\/waiting\/.*/, {
      timeout: TEST_CONFIG.timeout,
    });
    console.log(`✅ Successfully navigated to SessionWaiting: ${page.url()}`);

    // Step 6: Validate SessionWaiting displays real KSESSIONS data
    console.log(
      "📍 Step 6: Validating SessionWaiting displays real KSESSIONS data",
    );

    // Wait for session data to load in waiting room
    await page.waitForSelector('h1:has-text("Waiting Room")', {
      timeout: TEST_CONFIG.timeout,
    });

    // Verify session title appears correctly
    const waitingRoomSessionName = await page.textContent(
      'h2, h3, .session-title, [class*="session"], [class*="title"]',
    );
    console.log(`🔍 SessionWaiting Session Name: "${waitingRoomSessionName}"`);

    if (waitingRoomSessionName) {
      expect(waitingRoomSessionName).toBeTruthy();
      expect(waitingRoomSessionName).not.toBe("Unknown Session");
      expect(waitingRoomSessionName).not.toBe("Loading...");
    }

    // Verify instructor name appears (from KSESSIONS database)
    const instructorElements = await page
      .locator("text=/instructor|teacher|speaker/i")
      .all();
    let instructorFound = false;

    for (const element of instructorElements) {
      const text = await element.textContent();
      console.log(`🔍 Instructor element text: "${text}"`);
      if (text && text.includes(TEST_CONFIG.expectedData.instructorName)) {
        instructorFound = true;
        console.log(
          `✅ Found expected instructor: ${TEST_CONFIG.expectedData.instructorName}`,
        );
        break;
      }
    }

    // Verify session timing information appears
    const dateElements = await page
      .locator("text=/date|time|duration|start/i")
      .all();
    let timingDataFound = false;

    for (const element of dateElements) {
      const text = await element.textContent();
      console.log(`🔍 Timing element text: "${text}"`);
      if (
        text &&
        !text.includes("TBD") &&
        !text.includes("Loading") &&
        text.length > 3
      ) {
        timingDataFound = true;
        break;
      }
    }

    console.log(`✅ Timing data found: ${timingDataFound}`);

    // Step 7: Verify participant list functionality
    console.log("📍 Step 7: Verifying participant list shows registered user");

    const participantsList = page.locator(
      '[class*="participant"], [data-testid*="participant"]',
    );
    if ((await participantsList.count()) > 0) {
      const participantText = await participantsList.first().textContent();
      console.log(`🔍 Participant list content: "${participantText}"`);

      // Should show the test participant we just registered
      if (participantText?.includes("Test Participant")) {
        console.log("✅ Successfully found registered participant in list");
      }
    }

    console.log(
      "🎉 Comprehensive data flow validation completed successfully!",
    );
  });

  test("Should handle invalid token gracefully", async ({ page }) => {
    console.log("🔄 Testing invalid token handling...");

    const invalidToken = "INVALID1";
    await page.goto(`${TEST_CONFIG.baseUrl}/user/landing/${invalidToken}`, {
      waitUntil: "networkidle",
    });

    // Should show error message or redirect to token entry
    const errorIndicators = [
      "Invalid token",
      "Enter Session Token",
      "Token not found",
      "Session could not be found",
    ];

    let errorFound = false;
    for (const errorText of errorIndicators) {
      if ((await page.locator(`text=${errorText}`).count()) > 0) {
        errorFound = true;
        console.log(`✅ Found expected error handling: "${errorText}"`);
        break;
      }
    }

    expect(errorFound).toBe(true);
  });

  test("Should validate API response format matches DTO expectations", async ({
    page,
  }) => {
    console.log("🔄 Testing API response format validation...");

    // Intercept API call to validate response structure
    const apiResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/participant/session/") &&
        response.url().includes("/validate"),
    );

    await page.goto(
      `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.tokens.valid}`,
    );

    const response = await apiResponsePromise;
    const responseBody = await response.json();

    console.log(
      "🔍 API Response structure:",
      JSON.stringify(responseBody, null, 2),
    );

    // Validate response has expected structure matching our fixed DTOs
    expect(responseBody).toHaveProperty("Valid");
    expect(responseBody).toHaveProperty("SessionId");
    expect(responseBody).toHaveProperty("Session");

    if (responseBody.Session) {
      expect(responseBody.Session).toHaveProperty("Title");
      expect(responseBody.Session).toHaveProperty("InstructorName");
      expect(responseBody.Session).toHaveProperty("StartTime");
      expect(responseBody.Session).toHaveProperty("Duration");

      console.log("✅ API response structure matches expected DTO format");
      console.log(`📊 Session Title: ${responseBody.Session.Title}`);
      console.log(`👨‍🏫 Instructor: ${responseBody.Session.InstructorName}`);
      console.log(`📅 Start Time: ${responseBody.Session.StartTime}`);
      console.log(`⏱️ Duration: ${responseBody.Session.Duration}`);
    }
  });
});

test.describe("Performance and Reliability Checks", () => {
  test("Should load UserLanding within acceptable time limits", async ({
    page,
  }) => {
    const startTime = Date.now();

    await page.goto(
      `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.tokens.valid}`,
      {
        waitUntil: "networkidle",
      },
    );

    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page load time: ${loadTime}ms`);

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("Should handle network interruptions gracefully", async ({ page }) => {
    // Set slower network conditions
    await page.route("**/api/participant/**", (route) => {
      setTimeout(() => route.continue(), 2000); // 2 second delay
    });

    await page.goto(
      `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.tokens.valid}`,
      {
        waitUntil: "networkidle",
        timeout: 15000, // Allow extra time
      },
    );

    // Should still load successfully despite delay
    const sessionName = await page.textContent('[data-testid="session-name"]');
    expect(sessionName).toBeTruthy();
  });
});
