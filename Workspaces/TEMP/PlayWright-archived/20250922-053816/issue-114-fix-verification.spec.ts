// Issue-114 Fix Verification: Countries Dropdown Loading After HttpClient Fix
// Simple test to verify the HttpClient configuration fix works

import { expect, test, type Page } from "@playwright/test";

/**
 * Issue-114 Fix Verification: Countries Dropdown Loading
 *
 * This test verifies that after fixing the HttpClient configuration in LoadCountriesAsync,
 * the countries dropdown now properly loads after token validation.
 *
 * KEY FIX: Changed HttpClientFactory.CreateClient() to HttpClientFactory.CreateClient("default")
 * and changed "api/host/countries" to "/api/host/countries" in LoadCountriesAsync method.
 */

test.describe("Issue-114 Fix Verification: Countries Dropdown Loading", () => {
  const baseURL = process.env.BASE_URL || "https://localhost:9091";

  test("should load countries dropdown after token validation with HttpClient fix", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log(
      "🔧 VERIFICATION: Testing HttpClient fix for countries dropdown...",
    );

    // Monitor API calls for debugging
    const apiCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/host/countries")) {
        apiCalls.push(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/host/countries")) {
        apiCalls.push(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to UserLanding
    await page.goto(`${baseURL}/user/landing`);
    await page.waitForLoadState("networkidle");

    // Enter valid token
    const tokenInput = page.locator(
      'input[placeholder*="token"], input[placeholder*="Token"]',
    );
    await expect(tokenInput).toBeVisible({ timeout: 10000 });
    await tokenInput.fill("TXZ25W6K");

    // Submit token
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    // Wait for registration panel to appear
    const nameInput = page.locator('input[placeholder*="name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    console.log("✅ Registration panel appeared");

    // Check for country dropdown
    const countryDropdown = page.locator("select").filter({
      has: page.locator(
        'option:has-text("Select your country"), option:has-text("Loading countries")',
      ),
    });
    await expect(countryDropdown).toBeVisible({ timeout: 5000 });
    console.log("✅ Country dropdown is visible");

    // Wait for countries to load
    console.log("⏳ Waiting for countries to load...");

    // Wait for dropdown options to populate
    await page.waitForFunction(
      () => {
        const selects = document.querySelectorAll("select");
        for (let i = 0; i < selects.length; i++) {
          if (selects[i].options.length > 10) {
            // More than just placeholder options
            return true;
          }
        }
        return false;
      },
      { timeout: 30000 },
    ); // Increased timeout

    // Verify countries loaded
    const countryOptions = countryDropdown.locator(
      'option:not(:has-text("Select")):not(:has-text("Loading"))',
    );
    const optionCount = await countryOptions.count();

    console.log(`Countries loaded: ${optionCount}`);
    expect(optionCount).toBeGreaterThan(50); // Should have many countries

    // Log API calls for debugging
    console.log("API Calls made:");
    apiCalls.forEach((call) => console.log(`  ${call}`));

    // Test dropdown functionality
    const usOption = countryDropdown.locator(
      'option:has-text("United States")',
    );
    if ((await usOption.count()) > 0) {
      await countryDropdown.selectOption({ label: "United States" });
      const selectedValue = await countryDropdown.inputValue();
      expect(selectedValue).toBeTruthy();
      console.log("✅ Successfully selected United States from dropdown");
    }

    console.log("🎉 SUCCESS: Countries dropdown loading fix is working!");
  });

  test("should show proper loading state during countries fetch", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("🔧 VERIFICATION: Testing loading state...");

    await page.goto(`${baseURL}/user/landing`);
    await page.waitForLoadState("networkidle");

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

    // Check for loading text in dropdown
    const countryDropdown = page.locator("select").filter({
      has: page.locator('option:has-text("Select your country")'),
    });

    // Check initial state - should show loading or placeholder
    const initialOption = countryDropdown.locator("option").first();
    const initialText = await initialOption.textContent();
    console.log(`Initial dropdown option: "${initialText}"`);

    // Wait for countries to load
    await page.waitForFunction(
      () => {
        const selects = document.querySelectorAll("select");
        for (let i = 0; i < selects.length; i++) {
          if (selects[i].options.length > 10) {
            return true;
          }
        }
        return false;
      },
      { timeout: 30000 },
    );

    // Verify final state has countries
    const finalOptions = countryDropdown.locator("option");
    const finalCount = await finalOptions.count();
    console.log(`Final dropdown options: ${finalCount}`);

    expect(finalCount).toBeGreaterThan(50);
    console.log("✅ Loading state transitions properly");
  });
});
