import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared Blazor interaction helpers for Playwright tests.
 * Extracted to eliminate code duplication across test files.
 */

/**
 * Safely fills a Blazor input field by triggering necessary events for Blazor's change detection.
 * Supports both CSS selector strings and Locator objects.
 * @param page - Playwright Page object
 * @param selectorOrLocator - CSS selector string or Locator object for the input element
 * @param value - Value to fill into the input
 */
export async function fillBlazorInput(
  page: Page,
  selectorOrLocator: string | Locator,
  value: string,
): Promise<void> {
  const input =
    typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
  await input.clear();
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
  await page.waitForTimeout(2000); // Allow Blazor to process changes
}

/**
 * Clicks a button only after ensuring it's enabled, with configurable timeout.
 * Supports both CSS selector strings and Locator objects.
 * @param page - Playwright Page object
 * @param selectorOrLocator - CSS selector string or Locator object for the button element
 * @param timeout - Maximum time to wait for button to be enabled (default: 10000ms)
 */
export async function clickEnabledButton(
  page: Page,
  selectorOrLocator: string | Locator,
  timeout = 10000,
): Promise<void> {
  const button =
    typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator) : selectorOrLocator;
  await expect(button).toBeEnabled({ timeout });
  await button.click();
}

/**
 * Redacts sensitive data from strings (e.g., tokens, GUIDs) for logging purposes.
 * Replaces 8-character uppercase alphanumeric sequences with asterisks.
 * @param value - String value to redact
 * @returns Redacted string with sensitive data masked
 */
export function redact(value: string | undefined): string {
  if (!value) return value || '';
  return value.replace(/[A-Z0-9]{8}/g, '********');
}
