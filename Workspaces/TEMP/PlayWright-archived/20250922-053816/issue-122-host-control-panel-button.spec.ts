import { expect, test } from "@playwright/test";

test.describe("Issue-122: Host Control Panel Button", () => {
  test("Host control panel button displays correct text and icon", async ({
    page,
  }) => {
    // Navigate to host session opener
    await page.goto("http://localhost:9091/host");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Create a session first to enable the button
    await page.fill("#sessionNameInput", "Test Session for Control Panel");
    await page.click("#createSessionBtn");

    // Wait for session creation to complete
    await page.waitForSelector("#loadControlPanelBtn", { state: "visible" });

    // Validate button text
    const buttonText = await page.textContent("#loadControlPanelBtn span");
    expect(buttonText).toBe("Load Control Panel");

    // Validate button icon is fa-gear
    const icon = page.locator("#loadControlPanelBtn i.fa-solid.fa-gear");
    await expect(icon).toBeVisible();

    // Validate button is enabled after session creation
    const button = page.locator("#loadControlPanelBtn");
    await expect(button).toBeEnabled();
  });

  test("Load control panel button routes correctly to host control panel", async ({
    page,
  }) => {
    // Navigate to host session opener
    await page.goto("http://localhost:9091/host");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Create a session to enable the button
    await page.fill("#sessionNameInput", "Test Session for Routing");
    await page.click("#createSessionBtn");

    // Wait for session creation and button to be enabled
    await page.waitForSelector("#loadControlPanelBtn", { state: "visible" });

    // Click the Load Control Panel button
    await page.click("#loadControlPanelBtn");

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle");

    // Validate we're on the host control panel route
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/host\/control-panel\/[^\/]+$/);

    // Validate the control panel page has loaded correctly
    // Look for elements specific to the control panel
    await expect(page.locator("h1, h2, h3")).toContainText(
      /Control Panel|Session Management/i,
    );
  });

  test("Button remains disabled when no session is created", async ({
    page,
  }) => {
    // Navigate to host session opener
    await page.goto("http://localhost:9091/host");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that the button exists but is disabled initially
    const button = page.locator("#loadControlPanelBtn");
    await expect(button).toBeVisible();

    // The button should be disabled when no session is created
    // Note: We need to check if there's a disabled attribute or style
    const isDisabled = await button.evaluate((btn) => {
      return btn.hasAttribute("disabled") || btn.style.pointerEvents === "none";
    });

    // If the button uses style-based disabling, check opacity or pointer-events
    if (!isDisabled) {
      const opacity = await button.evaluate(
        (btn) => getComputedStyle(btn).opacity,
      );
      const pointerEvents = await button.evaluate(
        (btn) => getComputedStyle(btn).pointerEvents,
      );
      expect(opacity === "0.5" || pointerEvents === "none").toBeTruthy();
    } else {
      expect(isDisabled).toBeTruthy();
    }
  });

  test("Button icon change from hourglass to gear", async ({ page }) => {
    // Navigate to host session opener
    await page.goto("http://localhost:9091/host");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify the old hourglass icon is NOT present
    const hourglassIcon = page.locator(
      "#loadControlPanelBtn i.fa-hourglass-half",
    );
    await expect(hourglassIcon).not.toBeVisible();

    // Verify the new gear icon IS present
    const gearIcon = page.locator("#loadControlPanelBtn i.fa-gear");
    await expect(gearIcon).toBeVisible();
  });

  test("Control panel loads with session data after routing", async ({
    page,
  }) => {
    // Navigate to host session opener
    await page.goto("http://localhost:9091/host");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    const testSessionName = "Test Session Data Load";

    // Create a session with a specific name
    await page.fill("#sessionNameInput", testSessionName);
    await page.click("#createSessionBtn");

    // Wait for session creation
    await page.waitForSelector("#loadControlPanelBtn", { state: "visible" });

    // Click the Load Control Panel button
    await page.click("#loadControlPanelBtn");

    // Wait for navigation and control panel to load
    await page.waitForLoadState("networkidle");

    // Validate the control panel has loaded and shows session information
    // This might include session name, participant count, etc.
    const pageContent = await page.textContent("body");

    // Check for typical control panel elements
    const hasControlPanelContent =
      pageContent &&
      (pageContent.includes("Session") ||
        pageContent.includes("Participants") ||
        pageContent.includes("Control") ||
        pageContent.includes("Host"));

    expect(hasControlPanelContent).toBeTruthy();
  });
});
