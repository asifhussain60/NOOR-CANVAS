import { test, expect, Page } from "@playwright/test";

test.describe("Token Validation Comprehensive Test", () => {
  const TEST_TOKEN = "YWCWDL7N";
  const BASE_URL = "https://localhost:9091";

  test.beforeEach(async ({ page }) => {
    // Ignore certificate errors for localhost
    await page.setExtraHTTPHeaders({
      Accept:
        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    });
  });

  test("should validate token through manual entry and show registration form", async ({
    page,
  }) => {
    console.log("🚀 Starting comprehensive token validation test...");

    // Step 1: Navigate to user landing page
    console.log("📍 Step 1: Navigating to /user/landing");
    await page.goto(`${BASE_URL}/user/landing`, {
      waitUntil: "networkidle",
      timeout: 10000,
    });

    // Step 2: Verify initial state shows token entry form
    console.log("📍 Step 2: Verifying token entry form is visible");
    await expect(page.locator('h3:has-text("ENTER TOKEN")')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[placeholder*="token" i]')).toBeVisible();

    // Verify error message is not shown initially
    const errorMessage = page.locator('div:has-text("Invalid Token")');
    await expect(errorMessage).not.toBeVisible();

    // Step 3: Set up network request interception to monitor API calls
    console.log("📍 Step 3: Setting up network monitoring");
    const apiCalls: any[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/participant/session/")) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/participant/session/")) {
        console.log(`📨 API Response: ${response.status()} ${response.url()}`);
        // Log response details
        response
          .text()
          .then((body) => {
            console.log(`📝 Response body: ${body}`);
          })
          .catch((err) => {
            console.log(`❌ Error reading response body: ${err.message}`);
          });
      }
    });

    // Step 4: Enter the test token
    console.log(`📍 Step 4: Entering token: ${TEST_TOKEN}`);
    const tokenInput = page.locator('input[placeholder*="token" i]');
    await tokenInput.fill(TEST_TOKEN);

    // Verify token was entered correctly
    await expect(tokenInput).toHaveValue(TEST_TOKEN);

    // Step 5: Submit the token and monitor the request/response
    console.log("📍 Step 5: Submitting token and monitoring API calls");
    const submitButton = page.locator('button:has-text("Submit")');
    await expect(submitButton).toBeVisible();

    // Click submit and wait for network activity
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`/api/participant/session/${TEST_TOKEN}/validate`) &&
          response.status() === 200,
        { timeout: 10000 },
      ),
      submitButton.click(),
    ]);

    // Step 6: Wait for UI state change and verify transition to registration form
    console.log("📍 Step 6: Verifying transition to registration form");

    // Wait for the token panel to disappear and registration form to appear
    await expect(page.locator('h3:has-text("ENTER TOKEN")')).not.toBeVisible({
      timeout: 5000,
    });

    // Check for registration form elements
    const nameInput = page.locator('input[placeholder*="name" i]');
    const emailInput = page.locator('input[placeholder*="email" i]');
    const countrySelect = page.locator("select");

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(countrySelect).toBeVisible({ timeout: 5000 });

    // Step 7: Verify session information was loaded
    console.log("📍 Step 7: Verifying session information display");

    // Check if session name updated from the API response
    const sessionName = page
      .locator("p")
      .filter({ hasText: /Islamic Art|Session|Unknown/ })
      .first();
    await expect(sessionName).toBeVisible({ timeout: 3000 });

    // Step 8: Verify API calls were made correctly
    console.log("📍 Step 8: Verifying API call details");
    expect(apiCalls.length).toBeGreaterThan(0);

    const validateCall = apiCalls.find((call) =>
      call.url.includes(`/api/participant/session/${TEST_TOKEN}/validate`),
    );
    expect(validateCall).toBeDefined();
    console.log(`✅ Found validation API call: ${validateCall?.url}`);

    // Step 9: Verify no error messages are displayed
    console.log("📍 Step 9: Verifying no error messages");
    const errorMessages = [
      "Invalid Token",
      "Invalid token. Please check your token and try again.",
      "Network error",
      "Unable to validate token",
    ];

    for (const errorText of errorMessages) {
      const errorElement = page.locator(`div:has-text("${errorText}")`);
      await expect(errorElement).not.toBeVisible();
    }

    console.log(
      "✅ Comprehensive token validation test completed successfully!",
    );
  });

  test("should handle token validation via URL parameter", async ({ page }) => {
    console.log("🚀 Testing token validation via URL parameter...");

    // Navigate directly to user landing with token in URL
    console.log(`📍 Navigating to /user/landing/${TEST_TOKEN}`);
    await page.goto(`${BASE_URL}/user/landing/${TEST_TOKEN}`, {
      waitUntil: "networkidle",
      timeout: 10000,
    });

    // Should automatically load session info and show registration form
    console.log("📍 Checking if token was auto-validated from URL");

    // Wait for either token form or registration form to appear
    await page.waitForSelector(
      'h3:has-text("ENTER TOKEN"), input[placeholder*="name" i]',
      { timeout: 10000 },
    );

    // Check if we went straight to registration (successful auto-validation)
    const nameInput = page.locator('input[placeholder*="name" i]');
    const tokenForm = page.locator('h3:has-text("ENTER TOKEN")');

    if (await nameInput.isVisible()) {
      console.log(
        "✅ Token auto-validated successfully, showing registration form",
      );
      await expect(nameInput).toBeVisible();
      await expect(page.locator('input[placeholder*="email" i]')).toBeVisible();
    } else if (await tokenForm.isVisible()) {
      console.log("📋 Token form still visible, may need manual validation");
      // Token input should be pre-filled
      const tokenInput = page.locator('input[placeholder*="token" i]');
      await expect(tokenInput).toHaveValue(TEST_TOKEN);
    }

    console.log("✅ URL parameter token test completed!");
  });

  test("should make correct API call and handle response format", async ({
    page,
  }) => {
    console.log("🚀 Testing API call format and response handling...");

    let apiResponse: any = null;

    // Intercept and capture the API response
    page.on("response", async (response) => {
      if (
        response
          .url()
          .includes(`/api/participant/session/${TEST_TOKEN}/validate`)
      ) {
        try {
          const responseBody = await response.text();
          apiResponse = JSON.parse(responseBody);
          console.log(`📨 Captured API response:`, apiResponse);
        } catch (err) {
          console.log(`❌ Error parsing API response: ${err}`);
        }
      }
    });

    await page.goto(`${BASE_URL}/user/landing`);

    // Enter token and submit
    await page.fill('input[placeholder*="token" i]', TEST_TOKEN);
    await page.click('button:has-text("Submit")');

    // Wait for API call to complete
    await page.waitForTimeout(3000);

    // Verify API response format
    expect(apiResponse).toBeDefined();
    console.log("📊 API Response validation:");
    console.log(
      `  - Has 'valid' property: ${apiResponse?.valid !== undefined}`,
    );
    console.log(
      `  - Has 'sessionId' property: ${apiResponse?.sessionId !== undefined}`,
    );
    console.log(`  - Valid value: ${apiResponse?.valid}`);
    console.log(`  - Session ID: ${apiResponse?.sessionId}`);

    // Verify the response has the expected structure
    expect(apiResponse).toHaveProperty("valid");
    expect(apiResponse).toHaveProperty("sessionId");
    expect(apiResponse?.valid).toBe(true);
    expect(apiResponse?.sessionId).toBeDefined();

    console.log("✅ API format validation completed!");
  });

  test("should debug specific UserLanding component behavior", async ({
    page,
  }) => {
    console.log("🔍 Debugging UserLanding component behavior...");

    // Enable console logging from the page
    page.on("console", (msg) => {
      if (
        msg.text().includes("NOOR-DEBUG") ||
        msg.text().includes("UserLanding")
      ) {
        console.log(`🖥️ Browser console: ${msg.text()}`);
      }
    });

    // Track all network requests
    page.on("request", (request) => {
      console.log(`🌐 Network request: ${request.method()} ${request.url()}`);
    });

    page.on("response", (response) => {
      console.log(
        `📨 Network response: ${response.status()} ${response.url()}`,
      );
    });

    await page.goto(`${BASE_URL}/user/landing`);

    // Take a screenshot of initial state
    await page.screenshot({
      path: "token-validation-initial-state.png",
      fullPage: true,
    });

    // Enter token
    const tokenInput = page.locator('input[placeholder*="token" i]');
    await tokenInput.fill(TEST_TOKEN);

    // Take screenshot after token entry
    await page.screenshot({
      path: "token-validation-after-entry.png",
      fullPage: true,
    });

    // Submit and wait
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({
      path: "token-validation-final-state.png",
      fullPage: true,
    });

    // Check current DOM state
    const pageContent = await page.content();
    console.log("📄 Current page state analysis:");
    console.log(
      `  - Contains "ENTER TOKEN": ${pageContent.includes("ENTER TOKEN")}`,
    );
    console.log(
      `  - Contains "Invalid Token": ${pageContent.includes("Invalid Token")}`,
    );
    console.log(`  - Contains name input: ${pageContent.includes("name")}`);
    console.log(`  - Contains email input: ${pageContent.includes("email")}`);

    console.log("🔍 Debug test completed - check screenshots for visual state");
  });
});
