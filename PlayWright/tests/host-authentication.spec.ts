// This file contains Playwright tests using @playwright/test
// Testing NOOR Canvas host authentication and session management flows

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

/**
 * NOOR Canvas - Host Authentication Flow Test Suite (TypeScript)
 *
 * Enhanced with TypeScript typing for optimal GitHub Copilot integration.
 *
 * Tests the complete host authentication workflow including:
 * - Landing page display with branding validation
 * - Token validation with proper error handling
 * - Navigation to session configuration
 * - API integration for token generation
 * - Styling consistency verification
 */

// Import shared TypeScript interfaces and utilities for better IntelliSense and Copilot suggestions
import { type TokenData, type TokenGenerationRequest } from "./test-utils";

test.describe("Host Authentication Flow", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to host landing page
    await page.goto("/");

    // Wait for page to fully load and verify Host Authentication page
    await expect(page.locator("h1")).toContainText("Host Authentication");
  });

  test("should display host landing page with proper branding", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Verify NOOR Canvas header image is loaded and visible
    const headerImage = page.locator('img[alt="NOOR Canvas"]');
    await expect(headerImage).toBeVisible();

    // Verify main heading shows Host Authentication
    const heading = page.locator('h1:has-text("Host Authentication")');
    await expect(heading).toBeVisible();

    // Verify descriptive text for Islamic learning context
    const description = page.locator(
      'p:has-text("Manage Islamic learning sessions")',
    );
    await expect(description).toBeVisible();

    // Verify host token input field with proper placeholder
    const tokenInput = page.locator('input[placeholder*="Host GUID Token"]');
    await expect(tokenInput).toBeVisible();

    // Verify access button for authentication flow
    const accessButton = page.locator(
      'button:has-text("Access Host Control Panel")',
    );
    await expect(accessButton).toBeVisible();
  });

  test("should show validation error for empty token", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attempt to proceed without entering any token
    await page.click('button:has-text("Access Host Control Panel")');

    // Wait for client-side validation error to appear
    const errorMessage = page.locator('text="Host token is required"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("should show validation error for invalid token format", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Enter malformed token to test format validation
    await page.fill('input[placeholder*="Host GUID Token"]', "invalid-token");
    await page.click('button:has-text("Access Host Control Panel")');

    // Wait for format validation error message
    const errorMessage = page.locator('text="Invalid token format"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("should generate new host token via API", async ({
    page,
    request,
  }: {
    page: Page;
    request: APIRequestContext;
  }): Promise<void> => {
    // Make API call to generate fresh host token for testing
    const tokenRequest: TokenGenerationRequest = {
      sessionId: 215,
      createdBy: "Playwright Test",
      title: "Test Session",
    };

    const response = await request.post("/api/host/generate-token", {
      data: tokenRequest,
    });

    expect(response.ok()).toBeTruthy();
    const tokenData: TokenData = await response.json();
    expect(tokenData.hostToken).toBeDefined();
    expect(tokenData.userToken).toBeDefined();

    // Use generated token in UI authentication flow
    await page.fill(
      'input[placeholder*="Host GUID Token"]',
      tokenData.hostToken,
    );
    await page.click('button:has-text("Proceed")');

    // Should successfully navigate to session opener page
    await expect(page).toHaveURL(/\/host\/session-opener\//, {
      timeout: 10000,
    });

    // Log token data for debugging (test functions should not return values)
    console.log("Generated token data:", tokenData);
  });

  test("should handle expired token gracefully", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Use a known expired token format for negative testing
    const expiredToken: string = "0000-0000-0000-0000";

    await page.fill('input[placeholder*="Host GUID Token"]', expiredToken);
    await page.click('button:has-text("Proceed")');

    // Should show appropriate error message for expired token
    const errorMessage = page.locator('text="Invalid or expired token"');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test("should maintain NOOR Canvas styling throughout flow", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Verify color scheme consistency with NOOR Canvas design system
    const card = page.locator('.card, [class*="card"]').first();
    const cardStyles = await card.evaluate((el: Element) =>
      getComputedStyle(el),
    );

    // Check for NOOR Canvas golden theme color palette
    expect(cardStyles.backgroundColor).toMatch(
      /(245, 241)|#F5F1E8|rgb\(245, 241, 232\)/,
    );

    // Verify card dimensions follow 28rem width specification from mock
    expect(cardStyles.maxWidth).toMatch(/28rem|448px/);
  });
});
