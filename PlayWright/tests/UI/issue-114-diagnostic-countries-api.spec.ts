// Issue-114 Diagnostic: Countries Dropdown API Loading Debug
// Focused test to debug why countries don't load after token validation

import { expect, test, type Page } from "@playwright/test";

/**
 * Issue-114 Diagnostic: Countries API Loading Debug
 *
 * The registration panel appears correctly after token validation,
 * but the countries dropdown shows "Select your country" without
 * actually loading the countries from the API.
 *
 * This test will:
 * 1. Monitor all network requests
 * 2. Check API responses
 * 3. Examine the dropdown state
 * 4. Debug the LoadCountriesAsync() function
 */

test.describe("Issue-114 Diagnostic: Countries API Loading Debug", () => {
  const baseURL = process.env.BASE_URL || "https://localhost:9091";

  test("should debug countries API loading after token validation", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("🔍 DIAGNOSTIC: Starting countries API loading debug...");

    // Monitor all network requests
    const networkRequests: Array<{
      method: string;
      url: string;
      status?: number;
      response?: string;
    }> = [];

    page.on("request", (request) => {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
      });
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
    });

    page.on("response", async (response) => {
      const requestIndex = networkRequests.findIndex(
        (req) => req.url === response.url() && !req.status,
      );

      if (requestIndex !== -1) {
        networkRequests[requestIndex].status = response.status();

        // Capture response for countries API
        if (response.url().includes("/api/host/countries")) {
          try {
            const responseText = await response.text();
            networkRequests[requestIndex].response = responseText;
            console.log(
              `🌐 COUNTRIES API RESPONSE: ${response.status()} - ${responseText.substring(0, 200)}...`,
            );
          } catch (error) {
            console.log(
              `🌐 COUNTRIES API ERROR: Could not read response - ${error}`,
            );
          }
        }
      }

      console.log(`🌐 RESPONSE: ${response.status()} ${response.url()}`);
    });

    // Navigate to UserLanding
    await page.goto(`${baseURL}/user/landing`);
    await page.waitForLoadState("networkidle");
    console.log("📍 Navigated to UserLanding page");

    // Verify token entry panel is visible
    const tokenInput = page.locator(
      'input[placeholder*="token"], input[placeholder*="Token"]',
    );
    await expect(tokenInput).toBeVisible({ timeout: 10000 });
    console.log("✅ Token input is visible");

    // Enter valid token
    const testToken = "TXZ25W6K";
    await tokenInput.fill(testToken);
    console.log(`🔑 Entered token: ${testToken}`);

    // Click submit button
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();
    console.log("🖱️ Clicked submit button");

    // Wait for token validation and registration panel
    console.log("⏳ Waiting for registration panel to appear...");

    // Look for registration form elements
    const nameInput = page.locator('input[placeholder*="name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    console.log("✅ Registration panel appeared - Name input is visible");

    const emailInput = page.locator('input[placeholder*="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    console.log("✅ Email input is visible");

    // Check for country dropdown
    const countryLabel = page.locator('label:has-text("Country")');
    await expect(countryLabel).toBeVisible({ timeout: 5000 });
    console.log("✅ Country label is visible");

    const countryDropdown = page.locator("select").filter({
      has: page.locator(
        'option:has-text("Select your country"), option:has-text("Loading countries")',
      ),
    });
    await expect(countryDropdown).toBeVisible({ timeout: 5000 });
    console.log("✅ Country dropdown is visible");

    // Wait a bit for potential API calls
    console.log("⏳ Waiting for potential countries API call...");
    await page.waitForTimeout(10000);

    // Analyze network requests
    console.log("\n📊 NETWORK ANALYSIS:");
    console.log(`Total requests made: ${networkRequests.length}`);

    const countriesRequests = networkRequests.filter((req) =>
      req.url.includes("/api/host/countries"),
    );
    console.log(`Countries API requests: ${countriesRequests.length}`);

    if (countriesRequests.length > 0) {
      countriesRequests.forEach((req, index) => {
        console.log(`  Countries Request ${index + 1}:`);
        console.log(`    Method: ${req.method}`);
        console.log(`    URL: ${req.url}`);
        console.log(`    Status: ${req.status || "No response yet"}`);
        if (req.response) {
          console.log(
            `    Response Preview: ${req.response.substring(0, 100)}...`,
          );
        }
      });
    } else {
      console.log("❌ NO COUNTRIES API REQUESTS MADE! This is the problem.");
    }

    // Check token validation requests
    const tokenValidationRequests = networkRequests.filter(
      (req) =>
        req.url.includes("/api/participant/session") &&
        req.url.includes("/validate"),
    );
    console.log(`Token validation requests: ${tokenValidationRequests.length}`);

    if (tokenValidationRequests.length > 0) {
      tokenValidationRequests.forEach((req, index) => {
        console.log(
          `  Token Validation ${index + 1}: ${req.status} ${req.url}`,
        );
      });
    }

    // Examine dropdown state
    console.log("\n🔍 DROPDOWN STATE ANALYSIS:");

    const allOptions = countryDropdown.locator("option");
    const optionCount = await allOptions.count();
    console.log(`Total dropdown options: ${optionCount}`);

    for (let i = 0; i < Math.min(5, optionCount); i++) {
      const optionText = await allOptions.nth(i).textContent();
      const optionValue = await allOptions.nth(i).getAttribute("value");
      console.log(`  Option ${i}: "${optionText}" (value: "${optionValue}")`);
    }

    // Check if dropdown is disabled or loading
    const isDisabled = await countryDropdown.isDisabled();
    console.log(`Dropdown disabled: ${isDisabled}`);

    // Look for loading indicators
    const loadingOption = page.locator('option:has-text("Loading countries")');
    const hasLoadingOption = await loadingOption.isVisible().catch(() => false);
    console.log(`Has loading option: ${hasLoadingOption}`);

    // Check browser console for errors
    console.log("\n🚨 CHECKING FOR JAVASCRIPT ERRORS...");
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Wait a bit more and check console
    await page.waitForTimeout(5000);

    if (logs.length > 0) {
      console.log("JavaScript Errors found:");
      logs.forEach((log) => console.log(`  ${log}`));
    } else {
      console.log("✅ No JavaScript errors detected");
    }

    // Manual check of the LoadCountriesAsync function
    console.log("\n🔧 MANUAL COUNTRIES API TEST:");
    try {
      const apiResult = await page.evaluate(async () => {
        try {
          // Simulate the exact same call as LoadCountriesAsync
          const response = await fetch("/api/host/countries", {
            method: "GET",
            headers: {
              Authorization: "Bearer demo-token-12345",
              "Content-Type": "application/json",
            },
          });

          const status = response.status;
          const text = await response.text();

          return {
            status: status,
            success: response.ok,
            response: text.substring(0, 500), // First 500 chars
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      console.log("Manual API test result:", apiResult);
    } catch (error) {
      console.log("Manual API test failed:", error);
    }

    // Final summary
    console.log("\n📋 DIAGNOSTIC SUMMARY:");
    console.log(`✅ Registration panel: WORKING`);
    console.log(
      `${countriesRequests.length > 0 ? "✅" : "❌"} Countries API called: ${countriesRequests.length > 0 ? "YES" : "NO"}`,
    );
    console.log(
      `${optionCount > 2 ? "✅" : "❌"} Countries loaded: ${optionCount > 2 ? "YES" : "NO"} (${optionCount} options)`,
    );

    if (countriesRequests.length === 0) {
      console.log(
        "🔥 ROOT CAUSE: LoadCountriesAsync() is not being called after token validation!",
      );
    } else if (
      countriesRequests.some((req) => req.status && req.status >= 400)
    ) {
      console.log("🔥 ROOT CAUSE: Countries API is failing!");
    } else if (optionCount <= 2) {
      console.log(
        "🔥 ROOT CAUSE: API succeeds but countries are not being added to dropdown!",
      );
    }
  });

  test("should test token validation workflow step by step", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("🔍 DIAGNOSTIC: Testing token validation workflow...");

    await page.goto(`${baseURL}/user/landing`);
    await page.waitForLoadState("networkidle");

    // Monitor console logs
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Enter token and submit
    const tokenInput = page.locator(
      'input[placeholder*="token"], input[placeholder*="Token"]',
    );
    await tokenInput.fill("TXZ25W6K");

    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    // Wait for registration panel
    const nameInput = page.locator('input[placeholder*="name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });

    console.log("\n📝 CONSOLE LOGS CAPTURED:");
    const relevantLogs = consoleLogs.filter(
      (log) =>
        log.includes("NOOR-DEBUG") ||
        log.includes("LoadCountriesAsync") ||
        log.includes("countries") ||
        log.includes("error"),
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach((log) => console.log(`  ${log}`));
    } else {
      console.log("  No relevant debug logs found");
      console.log("  All console logs:");
      consoleLogs.forEach((log) => console.log(`    ${log}`));
    }

    // Check if the LoadCountriesAsync function exists and is working
    const countriesLoadTest = await page.evaluate(() => {
      // Check if we can see the Blazor component state
      return {
        blazorComponents: document.querySelectorAll(
          "[data-blazor-component-id]",
        ).length,
        selects: document.querySelectorAll("select").length,
        hasCountrySelect:
          document.querySelector('select option[value="US"]') !== null,
        selectsWithOptions: Array.from(document.querySelectorAll("select")).map(
          (select) => ({
            optionCount: select.options.length,
            firstOption: select.options[0]?.text || "No options",
          }),
        ),
      };
    });

    console.log("\n🎭 BLAZOR COMPONENT STATE:");
    console.log("Blazor components:", countriesLoadTest.blazorComponents);
    console.log("Selects found:", countriesLoadTest.selects);
    console.log("Has US option:", countriesLoadTest.hasCountrySelect);
    console.log("Select details:", countriesLoadTest.selectsWithOptions);
  });
});
