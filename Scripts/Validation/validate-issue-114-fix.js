// Quick validation script for Issue-114 fix
// Testing the fix to ensure countries dropdown loads only after submit

const { chromium } = require("playwright");

async function validateIssue114Fix() {
  console.log(
    "🧪 Testing Issue-114 Fix: Countries Dropdown Loading After Submit",
  );

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("📋 Step 1: Navigate to user landing page...");
    await page.goto("https://localhost:9091/user/landing");
    await page.waitForLoadState("networkidle");

    console.log("📋 Step 2: Verify token entry form is visible...");
    const tokenInput = await page
      .locator('input[placeholder*="token"], input[type="text"]')
      .first();
    if (await tokenInput.isVisible()) {
      console.log("✅ Token entry form is visible");
    } else {
      console.log("❌ Token entry form not found");
      return false;
    }

    console.log(
      "📋 Step 3: Check that countries dropdown is NOT loaded yet...",
    );
    const countryDropdown = await page.locator("select").first();

    if (await countryDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await page.locator(
        'select option:not(:has-text("Select")):not(:has-text("Loading"))',
      );
      const optionCount = await options.count();
      if (optionCount === 0) {
        console.log(
          "✅ Countries dropdown exists but has no countries (correct behavior)",
        );
      } else {
        console.log(
          `❌ Countries dropdown has ${optionCount} countries loaded too early`,
        );
        return false;
      }
    } else {
      console.log(
        "✅ Countries dropdown not visible during token entry (correct behavior)",
      );
    }

    console.log("📋 Step 4: Enter valid token and submit...");
    await tokenInput.fill("ADMIN123");

    const submitButton = await page
      .locator('button:has-text("Submit"), button:has-text("Enter")')
      .first();
    await submitButton.click();

    console.log("📋 Step 5: Wait for registration form to appear...");
    const registrationForm = await page
      .locator('input[placeholder*="name"], input[placeholder*="email"]')
      .first();

    if (await registrationForm.isVisible({ timeout: 15000 })) {
      console.log(
        "✅ Registration form appeared - token validation successful",
      );

      console.log("📋 Step 6: Verify countries dropdown NOW loads...");

      // Wait for countries to actually load
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
        { timeout: 20000 },
      );

      const options = await page.locator(
        'select option:not(:has-text("Select")):not(:has-text("Loading"))',
      );
      const optionCount = await options.count();

      if (optionCount > 50) {
        console.log(
          `✅ SUCCESS: Countries dropdown loaded ${optionCount} countries AFTER token validation`,
        );
        return true;
      } else {
        console.log(
          `❌ Countries dropdown only has ${optionCount} options after token validation`,
        );
        return false;
      }
    } else {
      console.log(
        "❌ Registration form did not appear - token validation may have failed",
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Error during validation:", error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the validation
validateIssue114Fix()
  .then((success) => {
    if (success) {
      console.log(
        "\n🎉 Issue-114 Fix VALIDATED: Countries dropdown correctly loads only after submit!",
      );
      process.exit(0);
    } else {
      console.log(
        "\n❌ Issue-114 Fix FAILED: Countries dropdown behavior is incorrect",
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Validation script failed:", error);
    process.exit(1);
  });
