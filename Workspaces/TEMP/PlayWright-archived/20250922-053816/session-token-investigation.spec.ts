import { expect, test } from "@playwright/test";

test.describe("Session Token Investigation", () => {
  test("should test waiting room access with proper user token", async ({
    page,
  }) => {
    console.log("=== Testing waiting room access with user tokens ===");

    // Test 1: Direct access to /session/waiting (should show error)
    await page.goto("https://localhost:9091/session/waiting");
    await page.waitForLoadState("networkidle");

    const errorText = await page.textContent("body");
    console.log("Direct access result:", errorText);
    expect(errorText).toContain("Session Error - No session token provided");

    // Test 2: Access with a recent user token from database
    const userToken = "9HGUW8Z9"; // Recent token for session 220
    await page.goto(
      `https://localhost:9091/session/waiting?token=${userToken}`,
    );
    await page.waitForLoadState("networkidle");

    console.log(`Trying with user token: ${userToken}`);
    console.log("Current URL:", page.url());

    // Check if we get to waiting room or another error
    const pageContent = await page.textContent("body");
    console.log("Page content with token:", pageContent?.substring(0, 500));

    // Test 3: Try different token format
    await page.goto(`https://localhost:9091/session/waiting/${userToken}`);
    await page.waitForLoadState("networkidle");

    console.log("URL with token in path:", page.url());
    const pathContent = await page.textContent("body");
    console.log("Path format content:", pathContent?.substring(0, 500));

    // Test 4: Try another recent token
    const anotherToken = "RMBPANIE"; // Another recent token
    await page.goto(
      `https://localhost:9091/session/waiting?token=${anotherToken}`,
    );
    await page.waitForLoadState("networkidle");

    console.log(`Trying with token: ${anotherToken}`);
    const anotherContent = await page.textContent("body");
    console.log("Another token content:", anotherContent?.substring(0, 500));
  });

  test("should examine session creation response for waiting room URL", async ({
    page,
  }) => {
    console.log("=== Analyzing session creation response ===");

    // Navigate to host session opener
    const hostToken = "ADMIN123";
    await page.goto(`https://localhost:9091/host/session-opener/${hostToken}`);
    await page.waitForLoadState("networkidle");

    // Fill out the form completely
    await page.selectOption('select[name="Album"]', {
      label: "Quran Comprehension",
    });
    await page.waitForTimeout(1000);

    await page.selectOption('select[name="Category"]', {
      label: "Surah Ikhlas",
    });
    await page.waitForTimeout(1000);

    await page.selectOption('select[name="Session"]', {
      label: "Masculine vs Feminine Gender",
    });
    await page.waitForTimeout(1000);

    await page.fill('input[name="Title"]', "Token Investigation Test");
    await page.fill(
      'textarea[name="Description"]',
      "Testing session creation for token analysis",
    );
    await page.fill('input[name="MaxParticipants"]', "10");

    // Monitor network requests during session creation
    page.on("response", async (response) => {
      if (
        response.url().includes("/session/create") ||
        response.url().includes("/api/session")
      ) {
        console.log("Session creation response URL:", response.url());
        console.log("Response status:", response.status());

        if (response.status() === 200) {
          try {
            const responseBody = await response.text();
            console.log("Session creation response body:", responseBody);
          } catch (e) {
            console.log("Could not read response body");
          }
        }
      }
    });

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check what happens after submission
    console.log("Final URL after submission:", page.url());
    const finalContent = await page.textContent("body");
    console.log("Final page content:", finalContent?.substring(0, 1000));

    // Look for any links or buttons related to waiting room
    const waitingRoomElements = await page.$$(
      '*:has-text("waiting room"), *:has-text("Enter Waiting Room"), *:has-text("Waiting Room")',
    );
    console.log(
      `Found ${waitingRoomElements.length} waiting room related elements`,
    );

    for (const element of waitingRoomElements) {
      const text = await element.textContent();
      const href = await element.getAttribute("href");
      console.log(`Element text: "${text}", href: "${href}"`);
    }
  });
});
