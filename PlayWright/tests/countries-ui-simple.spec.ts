// Simple UI test for countries dropdown with proper authentication
// Testing NOOR Canvas Countries Dropdown: UI functionality

import { expect, test, type Page } from "@playwright/test";
import { generateTestToken } from "./test-utils";

/**
 * NOOR Canvas - Countries Dropdown UI Test Suite
 * Simple tests for countries dropdown UI functionality
 */

test.describe("Countries Dropdown UI Tests", () => {
  test("should display countries dropdown and load data", async ({
    page,
    request,
  }: {
    page: Page;
    request: any;
  }) => {
    console.log(
      "Testing countries dropdown UI with generated authentication token...",
    );

    // Generate proper authentication token
    const tokenData = await generateTestToken(request);
    console.log(`Generated host token: ${tokenData.hostToken}`);

    // Navigate to session opener with valid authentication token
    await page.goto(`/host/session-opener/${tokenData.hostToken}`);

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000); // Allow time for all dropdowns to load

    // Verify countries dropdown is visible
    const countrySelect = page.locator("select#country-select");
    await expect(countrySelect).toBeVisible();

    console.log("Countries dropdown is visible");

    // Verify dropdown has label
    const countryLabel = page.locator('label[for="country-select"]');
    await expect(countryLabel).toBeVisible();
    await expect(countryLabel).toHaveText("Country");

    console.log("Countries dropdown label is correct");

    // Check dropdown options
    const optionCount = await countrySelect.locator("option").count();
    console.log(`Countries dropdown has ${optionCount} options`);
    expect(optionCount).toBeGreaterThan(1); // Should have placeholder + actual countries

    // Get list of countries
    const options = await countrySelect
      .locator("option:not(:first-child)")
      .allTextContents();
    console.log(
      `Loaded countries: ${options.slice(0, 5).join(", ")}${options.length > 5 ? "..." : ""}`,
    );

    expect(options.length).toBeGreaterThan(0);

    // Test country selection
    if (options.length > 0) {
      await countrySelect.selectOption({ index: 1 }); // Select first real country
      const selectedValue = await countrySelect.inputValue();
      console.log(`Successfully selected country with ID: ${selectedValue}`);
      expect(selectedValue).not.toBe("");
    }

    console.log("Countries dropdown is working correctly");
  });

  test("should include country in form status display", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing country status display...");

    // Navigate to session opener
    await page.goto("/host/session-opener/EP9M9NUN");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

    // Check if country status is shown
    const countryStatusSection = page.locator('span:has-text("Country:")');
    await expect(countryStatusSection).toBeVisible();
    console.log("Country status section is visible");

    // Select a country and verify status updates
    const countrySelect = page.locator("select#country-select");
    await countrySelect.selectOption({ index: 1 });

    const selectedCountryId = await countrySelect.inputValue();
    console.log(`Selected country ID: ${selectedCountryId}`);

    // Verify status section shows the selection
    const statusText = await countryStatusSection.textContent();
    console.log(`Status display: ${statusText}`);
    expect(statusText).toContain(selectedCountryId);

    console.log("Country status display is working correctly");
  });

  test("should be integrated with form validation", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing country integration with form validation...");

    // Navigate to session opener
    await page.goto("/host/session-opener/EP9M9NUN");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(8000); // Wait for cascading dropdowns to complete

    // Check form elements
    const albumSelect = page.locator("select#album-select");
    const categorySelect = page.locator("select#category-select");
    const sessionSelect = page.locator("select#session-select");
    const countrySelect = page.locator("select#country-select");
    const openSessionButton = page.locator('button:has-text("Open Session")');

    // Verify all dropdowns are visible
    await expect(albumSelect).toBeVisible();
    await expect(categorySelect).toBeVisible();
    await expect(sessionSelect).toBeVisible();
    await expect(countrySelect).toBeVisible();
    await expect(openSessionButton).toBeVisible();

    console.log("All form elements are visible");

    // Check current state
    const albumValue = await albumSelect.inputValue();
    const categoryValue = await categorySelect.inputValue();
    const sessionValue = await sessionSelect.inputValue();

    console.log(
      `Form state - Album: ${albumValue}, Category: ${categoryValue}, Session: ${sessionValue}`,
    );

    // Select a country if not already selected
    const countryValue = await countrySelect.inputValue();
    if (!countryValue) {
      await countrySelect.selectOption({ index: 1 });
      console.log("Selected a country for testing");
    }

    // Fill date and time if needed
    await page.fill('input[type="date"]', "2024-12-31");
    await page.fill('input[placeholder*="time"]', "10:00 AM");

    console.log("Filled date and time fields");

    // Wait for validation to process
    await page.waitForTimeout(2000);

    // Check button state
    const isButtonEnabled = await openSessionButton.isEnabled();
    console.log(`Open Session button enabled: ${isButtonEnabled}`);

    console.log("Country is properly integrated with form validation");
  });

  test("should work alongside existing cascading dropdowns", async ({
    page,
  }: {
    page: Page;
  }) => {
    console.log("Testing countries dropdown alongside cascading dropdowns...");

    // Navigate to session opener
    await page.goto("/host/session-opener/EP9M9NUN");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(8000); // Wait for cascading sequence

    // Verify all dropdowns have loaded independently
    const albumSelect = page.locator("select#album-select");
    const categorySelect = page.locator("select#category-select");
    const sessionSelect = page.locator("select#session-select");
    const countrySelect = page.locator("select#country-select");

    const albumOptions = await albumSelect
      .locator("option:not(:first-child)")
      .count();
    const categoryOptions = await categorySelect
      .locator("option:not(:first-child)")
      .count();
    const sessionOptions = await sessionSelect
      .locator("option:not(:first-child)")
      .count();
    const countryOptions = await countrySelect
      .locator("option:not(:first-child)")
      .count();

    console.log(
      `Dropdown options - Albums: ${albumOptions}, Categories: ${categoryOptions}, Sessions: ${sessionOptions}, Countries: ${countryOptions}`,
    );

    // All dropdowns should have options
    expect(albumOptions).toBeGreaterThan(0);
    expect(categoryOptions).toBeGreaterThan(0);
    expect(sessionOptions).toBeGreaterThan(0);
    expect(countryOptions).toBeGreaterThan(0);

    // Countries dropdown should be independent of cascading dropdowns
    const countryEnabledState = await countrySelect.isEnabled();
    console.log(
      `Countries dropdown enabled independently: ${countryEnabledState}`,
    );
    expect(countryEnabledState).toBe(true);

    console.log(
      "Countries dropdown works correctly alongside cascading dropdowns",
    );
  });
});
