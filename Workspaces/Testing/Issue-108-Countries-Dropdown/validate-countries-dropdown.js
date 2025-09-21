// Simple validation test for Issue-108: UserLanding Countries Dropdown
// This validates that the countries count matches SQL database expectation

const { chromium } = require("playwright");

async function validateCountriesDropdown() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    console.log("🔍 Opening NoorCanvas application...");
    await page.goto("https://localhost:9091");

    // First try to find Join Session link
    console.log("🔍 Looking for navigation to UserLanding...");
    const joinButton = page.locator('text="Join Session"').first();
    if (await joinButton.isVisible()) {
      console.log("🔍 Clicking Join Session button...");
      await joinButton.click();
      await page.waitForLoadState("networkidle");
    } else {
      console.log(
        "🔍 Join Session button not found, looking for Join as User option...",
      );
      // Try alternative selectors
      const userButton = page
        .locator(':has-text("Join")')
        .or(page.locator(':has-text("User")'))
        .first();
      if (await userButton.isVisible()) {
        await userButton.click();
        await page.waitForLoadState("networkidle");
      }
    }

    console.log("🔍 Looking for countries dropdown...");
    // Wait for countries dropdown with multiple selectors
    const countriesSelect = page
      .locator("select")
      .filter({ hasText: "Select your country" })
      .or(page.locator("select").filter({ hasText: "country" }))
      .or(page.locator('select[name*="Country"]'))
      .or(
        page
          .locator("select")
          .filter({ has: page.locator('option:has-text("United States")') }),
      )
      .or(page.locator("InputSelect"))
      .or(page.locator("select"))
      .first();

    // Debug: show page content
    console.log("🔍 Page URL:", page.url());
    const pageTitle = await page.title();
    console.log("🔍 Page title:", pageTitle);

    // Check for any select elements
    const allSelects = page.locator("select");
    const selectCount = await allSelects.count();
    console.log(`🔍 Found ${selectCount} select elements on page`);

    if (selectCount > 0) {
      for (let i = 0; i < selectCount; i++) {
        const selectText = await allSelects.nth(i).textContent();
        console.log(`  Select ${i}: "${selectText?.substring(0, 100)}..."`);
      }
    }

    if (await countriesSelect.isVisible()) {
      console.log("✅ Countries dropdown found");

      // Wait for loading to complete
      await page.waitForTimeout(3000); // Give time for API call

      // Count options
      const options = countriesSelect.locator("option");
      const optionCount = await options.count();

      console.log(`📊 Total dropdown options: ${optionCount}`);

      // Get first few country names for verification
      const countryNames = [];
      for (let i = 0; i < Math.min(5, optionCount); i++) {
        const text = await options.nth(i).textContent();
        if (
          text &&
          text !== "Select your country" &&
          text !== "Loading countries..."
        ) {
          countryNames.push(text);
        }
      }

      console.log(`📋 Sample countries: ${countryNames.join(", ")}`);

      // Validate count (should be 239 countries + 1 default option = 240, or just 239)
      if (optionCount >= 239) {
        console.log(
          `✅ SUCCESS: Countries dropdown has ${optionCount} options (expected ≥239)`,
        );
        return true;
      } else {
        console.log(
          `❌ FAIL: Countries dropdown has only ${optionCount} options (expected ≥239)`,
        );
        return false;
      }
    } else {
      console.log("❌ Countries dropdown not found");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during validation:", error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// API validation
async function validateAPI() {
  console.log("🔍 Testing API endpoint directly...");

  const { request } = require("playwright");
  const context = await request.newContext({ ignoreHTTPSErrors: true });

  try {
    const response = await context.get(
      "https://localhost:9091/api/host/countries?guid=demo-token-12345",
    );

    if (response.ok()) {
      const countries = await response.json();
      console.log(`✅ API returned ${countries.length} countries`);

      if (countries.length >= 239) {
        console.log(
          `✅ SUCCESS: API returns ${countries.length} countries (expected 239)`,
        );
        return true;
      } else {
        console.log(
          `❌ FAIL: API returns only ${countries.length} countries (expected 239)`,
        );
        return false;
      }
    } else {
      console.log(`❌ API request failed: ${response.status()}`);
      return false;
    }
  } catch (error) {
    console.error("❌ API error:", error.message);
    return false;
  } finally {
    await context.dispose();
  }
}

// Main validation
async function main() {
  console.log("🚀 Issue-108 Countries Dropdown Validation Test");
  console.log("================================================");

  const apiResult = await validateAPI();
  const uiResult = await validateCountriesDropdown();

  console.log("\n📋 SUMMARY:");
  console.log(`API Test: ${apiResult ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`UI Test: ${uiResult ? "✅ PASS" : "❌ FAIL"}`);

  if (apiResult && uiResult) {
    console.log(
      "\n🎉 Issue-108 VALIDATION SUCCESSFUL! Countries dropdown is working correctly.",
    );
    process.exit(0);
  } else {
    console.log("\n❌ Issue-108 VALIDATION FAILED! Some tests did not pass.");
    process.exit(1);
  }
}

main().catch(console.error);
