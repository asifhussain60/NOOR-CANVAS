// Issue-114 Validation Test with Valid Token
// Testing that countries dropdown loads successfully AFTER token validation

const { chromium } = require("playwright");

async function validateIssue114WithValidToken() {
  console.log(
    "🧪 Issue-114 Validation: Testing countries dropdown with valid user token",
  );

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slow down for visual verification
  });
  const page = await browser.newPage();

  try {
    // Test with known valid tokens from previous testing
    const validTokens = ["ADMIN123", "JHINFLXN", "TEST1234"];

    for (const token of validTokens) {
      console.log(`\n📋 Testing with token: ${token}`);

      console.log("Step 1: Navigate to UserLanding page...");
      await page.goto("https://localhost:9091/user/landing");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      console.log("Step 2: Verify initial state - NO countries loaded...");
      const tokenInput = page
        .locator('input[placeholder*="token"], input[type="text"]')
        .first();
      await tokenInput.waitFor({ state: "visible", timeout: 10000 });

      // Check countries are NOT loaded initially
      const selectElements = await page.locator("select").count();
      console.log(`Found ${selectElements} select elements initially`);

      if (selectElements > 0) {
        const options = await page.locator(
          'select option:not(:has-text("Select")):not(:has-text("Loading"))',
        );
        const initialOptionCount = await options.count();
        console.log(
          `Initial country options: ${initialOptionCount} (should be 0 or very few)`,
        );

        if (initialOptionCount < 10) {
          console.log("✅ PASS: Countries not loaded during token entry phase");
        } else {
          console.log(
            `❌ FAIL: ${initialOptionCount} countries loaded too early`,
          );
          continue; // Try next token
        }
      } else {
        console.log("✅ PASS: No select elements visible during token entry");
      }

      console.log("Step 3: Enter valid token and submit...");
      await tokenInput.clear();
      await tokenInput.fill(token);

      const submitButton = page
        .locator('button:has-text("Submit"), button:has-text("Enter")')
        .first();
      await submitButton.waitFor({ state: "visible" });
      await submitButton.click();

      console.log("Step 4: Wait for token validation response...");
      await page.waitForTimeout(3000); // Wait for API response

      // Check for registration form OR error message
      const registrationForm = page.locator(
        'input[placeholder*="name"], input[placeholder*="email"]',
      );
      const errorMessage = page.locator(
        '.error, .alert-danger, text="Invalid token"',
      );

      const hasRegistrationForm = await registrationForm
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasErrorMessage = await errorMessage
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasRegistrationForm) {
        console.log(
          "✅ Registration form appeared - token validation successful!",
        );

        console.log("Step 5: Verify countries dropdown NOW loads...");

        // Wait for countries to load (with generous timeout)
        let countriesLoaded = false;
        let optionCount = 0;

        try {
          await page.waitForFunction(
            () => {
              const selects = document.querySelectorAll("select");
              for (let i = 0; i < selects.length; i++) {
                if (selects[i].options.length > 50) {
                  return true;
                }
              }
              return false;
            },
            { timeout: 20000 },
          );

          countriesLoaded = true;
          const options = page.locator(
            'select option:not(:has-text("Select")):not(:has-text("Loading"))',
          );
          optionCount = await options.count();
        } catch (timeoutError) {
          console.log(
            "⚠️  Timeout waiting for countries to load, checking current state...",
          );
          const options = page.locator(
            'select option:not(:has-text("Select")):not(:has-text("Loading"))',
          );
          optionCount = await options.count();
        }

        if (optionCount > 50) {
          console.log(
            `✅ SUCCESS: Countries dropdown loaded ${optionCount} countries AFTER token validation!`,
          );

          // Test that we can select a country
          const countrySelect = page.locator("select").first();
          await countrySelect.selectOption({ label: "United States" });
          const selectedValue = await countrySelect.inputValue();

          if (selectedValue) {
            console.log(
              `✅ SUCCESS: Can select countries (selected: ${selectedValue})`,
            );
            console.log(`\n🎉 Issue-114 Fix VALIDATED with token: ${token}`);
            await browser.close();
            return true;
          }
        } else {
          console.log(
            `❌ FAIL: Only ${optionCount} countries loaded after token validation`,
          );

          // Debug: Check if there are loading indicators
          const loadingText = await page
            .locator('text="Loading", option:has-text("Loading")')
            .count();
          if (loadingText > 0) {
            console.log("⚠️  Countries still loading, may need more time...");
          }
        }
      } else if (hasErrorMessage) {
        console.log(`❌ Token ${token} was rejected - trying next token...`);
        continue;
      } else {
        console.log(
          `⚠️  Unclear response for token ${token} - no registration form or clear error`,
        );
        continue;
      }
    }

    console.log("❌ None of the test tokens worked for validation");
    return false;
  } catch (error) {
    console.error("❌ Error during validation:", error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the validation
validateIssue114WithValidToken()
  .then((success) => {
    if (success) {
      console.log(
        "\n🎉 Issue-114 Fix FULLY VALIDATED: Countries dropdown correctly loads only after successful token validation!",
      );
      process.exit(0);
    } else {
      console.log(
        "\n❌ Issue-114 Fix validation failed - need to investigate further",
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Validation script failed:", error);
    process.exit(1);
  });
