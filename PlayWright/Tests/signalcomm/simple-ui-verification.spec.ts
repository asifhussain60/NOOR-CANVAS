/**
 * [WORKITEM:signalcomm:test] Simple verification test for broadcast template functionality
 * This test confirms the UI changes have been implemented correctly
 * ;CLEANUP_OK
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9090';

test.describe('Broadcast Template UI Verification - signalcomm', () => {
  test('Verify new template buttons and inline broadcast button are present', async ({ page }) => {
    console.log('[WORKITEM:signalcomm:test] Verifying new UI elements are present ;CLEANUP_OK');

    // Navigate to host control panel
    await page.goto(`${BASE_URL}/host-control`);
    await page.waitForLoadState('networkidle');

    // Wait for the page to fully load
    await expect(page.locator('h1')).toContainText('Host Control Panel', { timeout: 10000 });

    // Find the broadcast panel
    const broadcastPanel = page.locator('.card').filter({ hasText: 'Broadcast HTML to Sessions' });
    await expect(broadcastPanel).toBeVisible();

    // Verify new buttons are present
    const simpleHtmlButton = broadcastPanel.locator('button', { hasText: 'Simple HTML' });
    const complexHtmlButton = broadcastPanel.locator('button', { hasText: 'Complex HTML' });
    const broadcastButton = broadcastPanel.locator('button', { hasText: 'Broadcast' });

    await expect(simpleHtmlButton).toBeVisible();
    await expect(complexHtmlButton).toBeVisible();
    await expect(broadcastButton).toBeVisible();

    console.log(
      '[WORKITEM:signalcomm:test] ✅ All new UI elements are present and visible ;CLEANUP_OK',
    );
  });

  test('Verify old buttons have been removed', async ({ page }) => {
    console.log('[WORKITEM:signalcomm:test] Verifying old UI elements are removed ;CLEANUP_OK');

    await page.goto(`${BASE_URL}/host-control`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Host Control Panel', { timeout: 10000 });

    const broadcastPanel = page.locator('.card').filter({ hasText: 'Broadcast HTML to Sessions' });
    await expect(broadcastPanel).toBeVisible();

    // Verify old buttons are NOT present
    // Note: Using count() to check if elements exist
    const oldBroadcastButtons = broadcastPanel
      .locator('button')
      .filter({ hasText: 'Broadcast HTML' });
    const deleteButtons = broadcastPanel.locator('button').filter({ hasText: 'Delete' });
    const testShareButtons = broadcastPanel
      .locator('button')
      .filter({ hasText: 'Test Share Asset' });

    await expect(oldBroadcastButtons).toHaveCount(0);
    await expect(deleteButtons).toHaveCount(0);
    await expect(testShareButtons).toHaveCount(0);

    console.log(
      '[WORKITEM:signalcomm:test] ✅ All old UI elements have been successfully removed ;CLEANUP_OK',
    );
  });

  test('Verify Simple HTML template button functionality', async ({ page }) => {
    console.log('[WORKITEM:signalcomm:test] Testing Simple HTML template button ;CLEANUP_OK');

    await page.goto(`${BASE_URL}/host-control`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Host Control Panel', { timeout: 10000 });

    const broadcastPanel = page.locator('.card').filter({ hasText: 'Broadcast HTML to Sessions' });
    const simpleHtmlButton = broadcastPanel.locator('button', { hasText: 'Simple HTML' });
    const textarea = broadcastPanel.locator('textarea');

    // Click the Simple HTML button
    await simpleHtmlButton.click();
    await page.waitForTimeout(1000); // Wait for any async operations

    // Check that textarea has been populated
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('Welcome to NOOR Canvas');
    expect(textareaContent).toContain('<div');
    expect(textareaContent).toContain('</div>');

    console.log('[WORKITEM:signalcomm:test] ✅ Simple HTML template loads correctly ;CLEANUP_OK');
  });

  test('Verify Complex HTML template button functionality', async ({ page }) => {
    console.log('[WORKITEM:signalcomm:test] Testing Complex HTML template button ;CLEANUP_OK');

    await page.goto(`${BASE_URL}/host-control`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Host Control Panel', { timeout: 10000 });

    const broadcastPanel = page.locator('.card').filter({ hasText: 'Broadcast HTML to Sessions' });
    const complexHtmlButton = broadcastPanel.locator('button', { hasText: 'Complex HTML' });
    const textarea = broadcastPanel.locator('textarea');

    // Click the Complex HTML button
    await complexHtmlButton.click();
    await page.waitForTimeout(1000); // Wait for any async operations

    // Check that textarea has been populated with complex content
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('ayah-card');
    expect(textareaContent).toContain('card-header');
    expect(textareaContent).toContain('card-body');
    expect(textareaContent).toContain('Complex HTML Template');

    console.log('[WORKITEM:signalcomm:test] ✅ Complex HTML template loads correctly ;CLEANUP_OK');
  });
});
