import { expect, test } from "@playwright/test";

test.describe("Debug Button Click Issue", () => {
  test("test button click API call debugging", async ({ page }) => {
    // Monitor network requests
    const requestPromises: Promise<any>[] = [];

    page.on("request", (request) => {
      console.log(`🌐 Request made: ${request.method()} ${request.url()}`);
      if (request.url().includes("/api/")) {
        requestPromises.push(Promise.resolve(request));
      }
    });

    page.on("response", (response) => {
      console.log(
        `📥 Response received: ${response.status()} ${response.url()}`,
      );
    });

    // Go to UserLanding page
    await page.goto("https://localhost:9091/user/landing");

    // Wait for page to load
    await expect(
      page.locator('h1:has-text("User Authentication")'),
    ).toBeVisible();

    // Enter test token
    const tokenInput = page.locator(
      'input[placeholder="Enter your Unique User Token"]',
    );
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill("YWCWDL7N");

    console.log("🔧 Token entered, about to click button...");

    // Click submit button and monitor network
    const submitButton = page.locator('button:has-text("Submit")');
    await expect(submitButton).toBeVisible();

    // Start monitoring for API calls before clicking
    const apiCallPromise = page
      .waitForRequest(
        (request) => request.url().includes("/api/participant/session/"),
        { timeout: 10000 },
      )
      .catch(() => null);

    await submitButton.click();

    console.log("🔧 Button clicked, waiting for API call...");

    // Wait for potential API call
    const apiRequest = await apiCallPromise;

    if (apiRequest) {
      console.log("✅ API call detected:", apiRequest.url());
    } else {
      console.log("❌ No API call detected within 10 seconds");

      // Check for any console errors
      page.on("console", (msg) => {
        console.log(`🚨 Console ${msg.type()}: ${msg.text()}`);
      });

      // Check for any JavaScript errors
      page.on("pageerror", (error) => {
        console.log(`🚨 Page error: ${error.message}`);
      });

      // Wait a bit more and check what happened
      await page.waitForTimeout(2000);

      // Take screenshot for debugging
      await page.screenshot({ path: "debug-button-click.png" });

      // Check if the UI changed at all
      const errorMessage = page.locator(
        'div[style*="background-color:#FEE2E2"]',
      );
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log("🚨 Error message displayed:", errorText);
      }

      // Check if loading state is active
      const loadingSpinner = page.locator("i.fa-spin");
      if (await loadingSpinner.isVisible()) {
        console.log(
          "🔄 Loading spinner is visible - request may be in progress",
        );
      }
    }

    console.log("🔧 Test completed");
  });
});
