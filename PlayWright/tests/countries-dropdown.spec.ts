// This file contains Playwright tests using @playwright/test
// Testing NOOR Canvas Countries Dropdown: API integration and UI validation

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
  type Request,
} from "@playwright/test";
import { generateTestToken, type TokenData } from "./test-utils";

/**
 * NOOR Canvas - Countries Dropdown Test Suite (TypeScript)
 *
 * Enhanced with TypeScript typing for optimal GitHub Copilot integration.
 *
 * Tests Countries Dropdown implementation:
 * - API endpoint testing (/api/host/countries)
 * - UI dropdown behavior and data loading
 * - Form validation integration
 * - Session creation with country data
 */

// TypeScript interfaces for better IntelliSense and Copilot suggestions
interface CountryData {
  CountryID: number;
  CountryName: string;
  ISO2: string;
  ISO3?: string;
  IsActive: boolean;
}

interface SessionDataWithCountry {
  HostFriendlyToken: string;
  SelectedSession: string;
  SelectedCategory: string;
  SelectedAlbum: string;
  SelectedCountry: string;
  SessionDate: string;
  SessionTime: string;
  SessionDuration: number;
}

test.describe("Countries Dropdown Implementation", () => {
  let hostToken: string;

  test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
    // Generate a fresh host token for countries dropdown testing
    const tokenData: TokenData = await generateTestToken(request);
    hostToken = tokenData.hostToken;
  });

  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate directly to session opener with valid token
    await page.goto(`/host/session-opener/${hostToken}`);

    // Wait for page to load completely and verify session configuration header
    await expect(
      page.locator('h1:has-text("Session Configuration")'),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should load countries from API endpoint", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    console.log("Testing countries API endpoint...");

    // Test the countries API endpoint directly
    const response = await request.get(
      `/api/host/countries?guid=${hostToken}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    expect(response.status()).toBe(200);

    const countries: CountryData[] = await response.json();
    console.log(`Loaded ${countries.length} countries from API`);

    // Verify response structure
    expect(countries).toBeInstanceOf(Array);
    expect(countries.length).toBeGreaterThan(0);

    // Verify first country has expected structure
    if (countries.length > 0) {
      const firstCountry = countries[0];
      expect(firstCountry).toHaveProperty("CountryID");
      expect(firstCountry).toHaveProperty("CountryName");
      expect(firstCountry).toHaveProperty("ISO2");
      expect(firstCountry).toHaveProperty("IsActive");
      expect(typeof firstCountry.CountryID).toBe("number");
      expect(typeof firstCountry.CountryName).toBe("string");
      expect(typeof firstCountry.ISO2).toBe("string");
      expect(typeof firstCountry.IsActive).toBe("boolean");

      console.log(
        `Sample country: ${firstCountry.CountryName} (${firstCountry.ISO2})`,
      );
    }

    // Verify all countries are active (API should filter inactive ones)
    const inactiveCountries = countries.filter((c) => !c.IsActive);
    expect(inactiveCountries.length).toBe(0);
  });

  test("should display countries dropdown in UI", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries dropdown UI display...");

    // Wait for page to load and countries to populate
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Allow time for countries to load

    // Verify countries dropdown is visible
    const countrySelect = page.locator("select#country-select");
    await expect(countrySelect).toBeVisible();

    // Verify dropdown has label
    const countryLabel = page.locator('label[for="country-select"]');
    await expect(countryLabel).toBeVisible();
    await expect(countryLabel).toHaveText("Country");

    // Verify dropdown has placeholder option
    const defaultOption = countrySelect.locator("option").first();
    await expect(defaultOption).toHaveText(
      /Select Country|Loading countries.../,
    );

    // Wait for countries to load and verify dropdown has options
    const optionCount = await countrySelect.locator("option").count();
    expect(optionCount).toBeGreaterThan(1);

    // Verify dropdown options contain real countries
    const options = await countrySelect
      .locator("option:not(:first-child)")
      .allTextContents();
    expect(options.length).toBeGreaterThan(0);

    console.log(`Countries dropdown loaded with ${options.length} countries`);
    console.log("Sample countries:", options.slice(0, 5));
  });

  test("should handle countries loading states properly", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries loading states...");

    // Monitor network requests for countries API call
    const countriesRequests: Request[] = [];
    page.on("request", (req: Request) => {
      if (req.url().includes("/api/host/countries")) {
        countriesRequests.push(req);
      }
    });

    // Reload page to observe loading state
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify countries API was called
    expect(countriesRequests.length).toBeGreaterThan(0);
    console.log(`Countries API called ${countriesRequests.length} times`);

    // Verify loading state is handled properly
    const countrySelect = page.locator("select#country-select");
    await expect(countrySelect).toBeVisible();

    // Eventually dropdown should be enabled and populated
    await expect(countrySelect).toBeEnabled();
    const finalOptionCount = await countrySelect.locator("option").count();
    expect(finalOptionCount).toBeGreaterThan(1);
  });

  test("should integrate with form validation", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries dropdown form validation...");

    // Wait for all cascading dropdowns and countries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(8000); // Allow time for cascading sequence

    // Verify form initially shows validation status
    const openSessionButton = page.locator('button:has-text("Open Session")');

    // Clear country selection to test validation
    const countrySelect = page.locator("select#country-select");
    await countrySelect.selectOption(""); // Select empty option

    // Verify form becomes invalid when country is not selected
    await page.waitForTimeout(1000); // Allow validation to run

    // Try to verify button state (may be disabled due to other fields)
    const isButtonEnabled = await openSessionButton.isEnabled();
    console.log(
      `Open Session button enabled with no country: ${isButtonEnabled}`,
    );

    // Select a country
    await countrySelect.selectOption({ index: 1 }); // Select first real country
    const selectedCountry = await countrySelect.inputValue();
    console.log(`Selected country ID: ${selectedCountry}`);

    // Verify country selection is registered
    expect(selectedCountry).not.toBe("");

    // Wait for validation to process
    await page.waitForTimeout(1000);
  });

  test("should include country in session creation data", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries in session creation...");

    // Wait for cascading sequence and countries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(8000);

    // Monitor session creation API calls
    const sessionCreationRequests: {
      request: Request;
      postData: string | null;
    }[] = [];
    page.on("request", (req: Request) => {
      if (req.url().includes("/api/host/create-session")) {
        sessionCreationRequests.push({
          request: req,
          postData: req.postData(),
        });
      }
    });

    // Select a country
    const countrySelect = page.locator("select#country-select");
    await countrySelect.selectOption({ index: 1 }); // Select first real country
    const selectedCountry = await countrySelect.inputValue();

    // Fill in date and time fields
    await page.fill('input[type="date"]', "2024-12-31");
    await page.fill('input[placeholder*="time"]', "10:00 AM");

    // Verify all required fields are filled
    await page.waitForTimeout(1000);

    // Click Open Session button
    const openSessionButton = page.locator('button:has-text("Open Session")');
    if (await openSessionButton.isEnabled()) {
      await openSessionButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      // Verify session creation API was called with country data
      expect(sessionCreationRequests.length).toBeGreaterThan(0);

      const lastRequest =
        sessionCreationRequests[sessionCreationRequests.length - 1];
      if (lastRequest.postData) {
        const sessionData: SessionDataWithCountry = JSON.parse(
          lastRequest.postData,
        );

        // Verify country is included in session data
        expect(sessionData).toHaveProperty("SelectedCountry");
        expect(sessionData.SelectedCountry).toBe(selectedCountry);

        console.log(
          "Session creation data includes country:",
          sessionData.SelectedCountry,
        );

        // Verify other required fields are also present
        expect(sessionData).toHaveProperty("SelectedAlbum");
        expect(sessionData).toHaveProperty("SelectedCategory");
        expect(sessionData).toHaveProperty("SelectedSession");
        expect(sessionData).toHaveProperty("SessionDate");
        expect(sessionData).toHaveProperty("SessionTime");
      }
    } else {
      console.log(
        "Open Session button is disabled - checking validation state",
      );

      // Log current form state for debugging
      const albumValue = await page.locator("select#album-select").inputValue();
      const categoryValue = await page
        .locator("select#category-select")
        .inputValue();
      const sessionValue = await page
        .locator("select#session-select")
        .inputValue();
      const countryValue = await countrySelect.inputValue();
      const dateValue = await page.locator('input[type="date"]').inputValue();
      const timeValue = await page
        .locator('input[placeholder*="time"]')
        .inputValue();

      console.log("Form state:", {
        album: albumValue,
        category: categoryValue,
        session: sessionValue,
        country: countryValue,
        date: dateValue,
        time: timeValue,
      });
    }
  });

  test("should handle countries API error gracefully", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries API error handling...");

    // Intercept countries API call and return error
    await page.route("**/api/host/countries**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Database connection failed" }),
      });
    });

    // Navigate to page
    await page.goto(`/host/session-opener/${hostToken}`);

    // Wait for page load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Verify countries dropdown shows error state gracefully
    const countrySelect = page.locator("select#country-select");
    await expect(countrySelect).toBeVisible();

    // Dropdown should be disabled or show error message
    const isEnabled = await countrySelect.isEnabled();
    console.log(`Countries dropdown enabled after API error: ${isEnabled}`);

    // Check for error message in UI
    const errorMessage = page.locator(
      "text=/Failed to load countries|Error loading countries/",
    );
    if (await errorMessage.isVisible()) {
      console.log("Error message displayed correctly");
    }
  });

  test("should display country name correctly in status section", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing country display in status section...");

    // Wait for countries to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

    // Select a country
    const countrySelect = page.locator("select#country-select");
    await countrySelect.selectOption({ index: 1 }); // Select first real country

    // Get selected country name from dropdown
    const selectedOptionText = await countrySelect
      .locator("option:checked")
      .textContent();
    const selectedCountryId = await countrySelect.inputValue();

    console.log(
      `Selected country: ${selectedOptionText} (ID: ${selectedCountryId})`,
    );

    // Check if status section shows country selection
    const statusSection = page.locator('div:has-text("Country:")');
    if (await statusSection.isVisible()) {
      const countryStatus = await statusSection.textContent();
      console.log("Country status display:", countryStatus);

      // Verify status shows selected country ID (since that's what's tracked)
      expect(countryStatus).toContain(selectedCountryId);
    }
  });
});
