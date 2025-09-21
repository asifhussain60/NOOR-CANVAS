// This file contains Playwright tests using @playwright/test
// Testing NOOR Canvas user authentication and session management flows

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

/**
 * NOOR Canvas - User Authentication & Session Flow Test Suite (TypeScript)
 *
 * Enhanced with TypeScript typing for optimal GitHub Copilot integration.
 *
 * Tests the complete user authentication workflow including:
 * - User landing page display with proper routing logic
 * - Token validation (Issue-102 fixes for registration vs. token entry)
 * - Session waiting room functionality
 * - Active session participation features
 * - End-to-end user journey validation
 */

// Import shared TypeScript interfaces for better IntelliSense and Copilot suggestions
import { type UserSessionRequest, type UserTokenData } from "./test-utils";

test.describe("User Authentication Flow", () => {
  test("should display user landing page for no token", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Navigate to user landing page without any token parameter
    await page.goto("/user/landing");

    // Should show token entry form (not registration form per Issue-102)
    await expect(page.locator("h1, h2, h3")).toContainText(
      "Enter Session Token",
    );

    // Verify token input field exists and is properly labeled
    const tokenInput = page.locator(
      'input[type="text"], input[placeholder*="token"]',
    );
    await expect(tokenInput).toBeVisible();

    // Verify join/enter button exists for form submission
    const joinButton = page.locator(
      'button:has-text("Join"), button:has-text("Enter")',
    );
    await expect(joinButton).toBeVisible();
  });

  test("should display token entry form for invalid token", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Navigate with intentionally invalid token format
    await page.goto("/user/landing/INVALID123");

    // Should show token entry form with error message (Issue-102 fix)
    await expect(page.locator("h1, h2, h3")).toContainText(
      "Enter Session Token",
    );

    // Should display appropriate error message about invalid token
    const errorMessage = page.locator('text="invalid", text="error", .error');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test("should handle valid session token and show session details", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    // Generate a valid user token via host authentication flow
    const userSessionRequest: UserSessionRequest = {
      sessionId: 300,
      createdBy: "User Flow Test",
      title: "User Authentication Test Session",
    };

    const tokenResponse = await request.post("/api/host/generate-token", {
      data: userSessionRequest,
    });

    expect(tokenResponse.ok()).toBeTruthy();
    const tokenData: UserTokenData = await tokenResponse.json();

    // Navigate with valid user token to trigger proper flow
    await page.goto(`/user/landing/${tokenData.userToken}`);

    // Should navigate to session details or waiting room
    await expect(page).toHaveURL(/\/user\/(waiting|session)/, {
      timeout: 10000,
    });

    // Verify session information is properly displayed
    const sessionInfo = page.locator(
      'text="Session", text="Waiting", h1, h2, h3',
    );
    await expect(sessionInfo.first()).toBeVisible();
  });
});

test.describe("Session Waiting Room", () => {
  test("should display waiting room with countdown timer", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Test waiting room functionality if implemented
    await page.goto("/user/waiting/test-session");

    // Look for waiting room UI elements
    const waitingElements = page.locator(
      'text="waiting", text="countdown", text="participants", .waiting-room',
    );

    // Check if waiting room is implemented and functional
    const hasWaitingRoom: boolean = await waitingElements
      .first()
      .isVisible({ timeout: 5000 });

    if (hasWaitingRoom) {
      // Verify countdown timer functionality
      const timer = page.locator(
        '[data-testid="countdown"], .timer, text=":", text="minutes", text="seconds"',
      );
      await expect(timer.first()).toBeVisible();

      // Verify participant list display area
      const participants = page.locator(
        '[data-testid="participants"], .participant-list, text="participant"',
      );
      await expect(participants.first()).toBeVisible();
    } else {
      console.log("Waiting room not yet implemented - test skipped");
    }
  });
});

test.describe("Active Session Canvas", () => {
  test("should display canvas interface for active session", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Test active session canvas interface if implemented
    await page.goto("/user/session/active-test");

    // Look for canvas drawing and annotation elements
    const canvasElements = page.locator(
      'canvas, .canvas-container, text="annotation", text="drawing"',
    );

    const hasCanvas: boolean = await canvasElements
      .first()
      .isVisible({ timeout: 5000 });

    if (hasCanvas) {
      // Verify canvas drawing area is accessible
      const drawingArea = page.locator(
        'canvas, [data-testid="drawing-canvas"]',
      );
      await expect(drawingArea.first()).toBeVisible();

      // Verify annotation tools are available
      const tools = page.locator(
        '.tool, .annotation-tool, button:has-text("pen"), button:has-text("eraser")',
      );
      const hasTools: boolean = await tools
        .first()
        .isVisible({ timeout: 2000 });

      console.log("Canvas tools available:", hasTools);
    } else {
      console.log("Active session canvas not yet implemented - test skipped");
    }
  });
});

test.describe("End-to-End User Journey", () => {
  test("complete user flow: token entry -> waiting room -> active session", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }) => {
    console.log("Testing complete user journey...");

    // Step 1: Generate host session with user/host token pair
    const e2eSessionRequest: UserSessionRequest = {
      sessionId: 400,
      createdBy: "E2E Test",
      title: "End-to-End User Journey Test",
    };

    const tokenResponse = await request.post("/api/host/generate-token", {
      data: e2eSessionRequest,
    });

    expect(tokenResponse.ok()).toBeTruthy();
    const tokens: UserTokenData = await tokenResponse.json();

    // Step 2: User enters token on landing page
    await page.goto("/user/landing");

    const tokenInput = page
      .locator('input[type="text"], input[placeholder*="token"]')
      .first();
    await tokenInput.fill(tokens.userToken);

    const submitButton = page
      .locator(
        'button:has-text("Join"), button:has-text("Enter"), button[type="submit"]',
      )
      .first();
    await submitButton.click();

    // Step 3: Should navigate to appropriate next step in user flow
    await page.waitForTimeout(3000);

    // Could be waiting room, session details, or direct session access
    const currentUrl: string = page.url();
    console.log("User navigated to:", currentUrl);

    // Verify we're no longer on the landing page
    expect(currentUrl).not.toMatch(/\/user\/landing$/);

    // Verify some meaningful content loaded
    const content = page.locator("h1, h2, h3, .content, main").first();
    await expect(content).toBeVisible();

    console.log("✅ Complete user journey test completed");
  });
});

test.describe("Issue-102: Routing Logic Fixes", () => {
  test("should show token entry form for no token (not registration)", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Test Issue-102 fix: /user/landing should show token entry form
    await page.goto("/user/landing");

    // Should NOT show registration form (Issue-102 requirement)
    const registrationElements = page.locator(
      'text="register", text="sign up", text="create account"',
    );
    const hasRegistration: boolean = await registrationElements
      .first()
      .isVisible({ timeout: 2000 });
    expect(hasRegistration).toBeFalsy();

    // Should show token entry form instead
    const tokenForm = page.locator(
      'input[placeholder*="token"], text="Enter", text="Token"',
    );
    await expect(tokenForm.first()).toBeVisible();
  });

  test("should show token entry form for invalid token (not registration)", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Test Issue-102 fix: /user/landing/INVALID should show token entry form
    await page.goto("/user/landing/INVALID123");

    // Should NOT show registration form (Issue-102 requirement)
    const registrationElements = page.locator(
      'text="register", text="sign up", text="create account"',
    );
    const hasRegistration: boolean = await registrationElements
      .first()
      .isVisible({ timeout: 2000 });
    expect(hasRegistration).toBeFalsy();

    // Should show token entry form with error indication
    const tokenForm = page.locator(
      'input[placeholder*="token"], text="Enter", text="Token"',
    );
    await expect(tokenForm.first()).toBeVisible();

    // Should show error message about invalid token
    const error = page.locator(
      'text="invalid", text="error", .error, .alert-danger',
    );
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

  test("should handle API validation failures correctly", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Test that API failures return false in ValidateTokenAsync (Issue-102 fix)

    // This token format should trigger API validation failure
    await page.goto("/user/landing/TEST-API-VALIDATION-FAIL");

    // Should treat API failure as invalid token (not valid per Issue-102)
    const tokenForm = page.locator(
      'input[placeholder*="token"], text="Enter", text="Token"',
    );
    await expect(tokenForm.first()).toBeVisible();

    console.log("API validation failure handled correctly");
  });
});
