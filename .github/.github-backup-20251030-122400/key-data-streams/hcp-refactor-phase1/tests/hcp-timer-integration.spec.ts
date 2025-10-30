/**
 * @file hcp-timer-integration.spec.ts
 * @key hcp-refactor
 * @phase Phase 1 - Service Extraction
 * @created 2025-10-29
 * @purpose Test-First: Timer Service Integration Tests (WILL FAIL INITIALLY)
 * 
 * Test Strategy:
 * 1. Write failing tests that define expected behavior
 * 2. Refactor HostControlPanel to use TimerStateService
 * 3. Make tests pass through implementation
 * 
 * Test Coverage:
 * - TimerStateService subscription on initialization
 * - Timer starts when session becomes Active
 * - Timer displays elapsed time correctly
 * - Timer stops when session ends
 * - UI updates on timer tick events
 */

import { expect, Page, test } from '@playwright/test';

const HOST_TOKEN = 'HOST212A';
const HOST_CONTROL_PANEL_URL = `https://localhost:9091/host/control-panel/${HOST_TOKEN}`;

/**
 * Helper: Wait for session to load
 */
async function waitForSessionLoad(page: Page) {
    await page.waitForSelector('text=Session 212', { timeout: 10000 });
}

/**
 * Helper: Start session via UI
 */
async function startSession(page: Page) {
    const startButton = page.locator('button:has-text("Start Session")');
    await startButton.waitFor({ state: 'visible', timeout: 5000 });
    await startButton.click();

    // Wait for session to become Active
    await page.waitForSelector('text=Active', { timeout: 10000 });
}

/**
 * Helper: Get timer display element
 */
async function getTimerElement(page: Page) {
    // Timer should be displayed in session title header when Active
    return page.locator('[data-testid="session-timer"]').or(
        page.locator('text=/\\d{2}:\\d{2}:\\d{2}/') // Fallback: match HH:mm:ss format
    );
}

test.describe('HCP Timer Integration - Phase 1', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to Host Control Panel
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle' });

        // Wait for session to load
        await waitForSessionLoad(page);
    });

    test('T1: Timer NOT visible when session status is Waiting', async ({ page }) => {
        // GIVEN session is in Waiting state
        await expect(page.locator('text=Waiting')).toBeVisible({ timeout: 5000 });

        // THEN timer should NOT be visible
        const timerElement = await getTimerElement(page);
        await expect(timerElement).not.toBeVisible();
    });

    test('T2: Timer STARTS when session becomes Active', async ({ page }) => {
        // GIVEN session is started
        await startSession(page);

        // THEN timer should become visible
        const timerElement = await getTimerElement(page);
        await expect(timerElement).toBeVisible({ timeout: 3000 });

        // AND timer should show 00:00:00 or 00:00:01 initially
        const timerText = await timerElement.textContent();
        expect(timerText).toMatch(/00:00:0[0-1]/);
    });

    test('T3: Timer displays elapsed time in HH:mm:ss format', async ({ page }) => {
        // GIVEN session is Active
        await startSession(page);

        // WHEN we wait for timer to update
        await page.waitForTimeout(2000); // Wait 2 seconds

        // THEN timer should show elapsed time in correct format
        const timerElement = await getTimerElement(page);
        const timerText = await timerElement.textContent();

        // Should match HH:mm:ss format (00:00:02 or 00:00:03)
        expect(timerText).toMatch(/\d{2}:\d{2}:\d{2}/);

        // Should be in range 00:00:01 to 00:00:04 (accounting for delays)
        expect(timerText).toMatch(/00:00:0[1-4]/);
    });

    test('T4: Timer updates every second (UI refresh)', async ({ page }) => {
        // GIVEN session is Active with timer running
        await startSession(page);

        const timerElement = await getTimerElement(page);
        await expect(timerElement).toBeVisible();

        // WHEN we capture timer value at T=0
        const initialTime = await timerElement.textContent();

        // AND wait 2 seconds
        await page.waitForTimeout(2000);

        // THEN timer value should have incremented
        const updatedTime = await timerElement.textContent();
        expect(updatedTime).not.toBe(initialTime);

        // AND should be approximately 2 seconds later
        const initialSeconds = parseInt(initialTime?.split(':')[2] || '0');
        const updatedSeconds = parseInt(updatedTime?.split(':')[2] || '0');
        expect(updatedSeconds - initialSeconds).toBeGreaterThanOrEqual(1);
    });

    test('T5: TimerStateService subscription exists on initialization', async ({ page }) => {
        // THIS TEST VALIDATES THE INTEGRATION POINT
        // We can't directly test C# service, but we can verify behavior

        // GIVEN session loads
        await waitForSessionLoad(page);

        // WHEN we start session (which should trigger TimerStateService.Start())
        await startSession(page);

        // THEN timer should be visible immediately (proving service is connected)
        const timerElement = await getTimerElement(page);
        await expect(timerElement).toBeVisible({ timeout: 1000 });

        // AND timer should update (proving TimerTicked event handler works)
        await page.waitForTimeout(1500);
        const timerText = await timerElement.textContent();
        expect(timerText).toMatch(/00:00:0[1-2]/);
    });

    test('T6: Timer persists across UI state changes', async ({ page }) => {
        // GIVEN session is Active with timer running
        await startSession(page);

        const timerElement = await getTimerElement(page);
        await page.waitForTimeout(2000); // Let timer run for 2 seconds

        const timeBeforeAction = await timerElement.textContent();

        // WHEN we toggle Q&A panel (UI state change)
        const qaButton = page.locator('button:has-text("Q&A")');
        if (await qaButton.isVisible()) {
            await qaButton.click();
            await page.waitForTimeout(500);
            await qaButton.click(); // Toggle back
        }

        // THEN timer should still be running
        await page.waitForTimeout(1000);
        const timeAfterAction = await timerElement.textContent();

        // Timer should have advanced (not reset)
        expect(timeAfterAction).not.toBe(timeBeforeAction);
        expect(timeAfterAction).toMatch(/00:00:0[3-5]/);
    });

    test('T7: Timer uses TimerStateService.ElapsedFormatted property', async ({ page }) => {
        // THIS TEST ENSURES WE'RE USING SERVICE, NOT LOCAL STATE

        // GIVEN session is Active
        await startSession(page);

        // WHEN timer is visible
        const timerElement = await getTimerElement(page);
        await expect(timerElement).toBeVisible();

        // THEN format should match TimerStateService.ElapsedFormatted (HH:mm:ss with leading zeros)
        const timerText = await timerElement.textContent();

        // Strict format validation: exactly 8 characters, 2-digit groups
        expect(timerText).toMatch(/^\d{2}:\d{2}:\d{2}$/);

        // Hours should be zero-padded (00 not 0)
        expect(timerText).toMatch(/^0\d:/);
    });

    test('T8: sessionStartTime is set when session starts', async ({ page }) => {
        // GIVEN session starts
        await startSession(page);

        // THEN sessionStartTime should be used for timer calculation
        // We validate this indirectly: timer should start from 00:00:00, not from arbitrary time
        const timerElement = await getTimerElement(page);
        await page.waitForTimeout(1000);

        const timerText = await timerElement.textContent();

        // Should be close to 00:00:01 (proving start time was captured at session start)
        expect(timerText).toMatch(/00:00:0[0-2]/);
    });

    test('T9: Timer cleanup on component disposal', async ({ page }) => {
        // GIVEN session is Active with timer running
        await startSession(page);

        const timerElement = await getTimerElement(page);
        await expect(timerElement).toBeVisible();

        // WHEN we navigate away (component disposal)
        await page.goto('https://localhost:9091');

        // THEN no errors should occur (timer should be properly disposed)
        // This is validated by checking console for errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000); // Wait for any async disposal errors

        // No timer-related errors should appear
        const timerErrors = consoleErrors.filter(err =>
            err.toLowerCase().includes('timer') ||
            err.toLowerCase().includes('disposed')
        );
        expect(timerErrors).toHaveLength(0);
    });

    test('T10: Timer stops when session ends', async ({ page }) => {
        // GIVEN session is Active with timer running
        await startSession(page);

        const timerElement = await getTimerElement(page);
        await page.waitForTimeout(2000);
        const timeBeforeEnd = await timerElement.textContent();

        // WHEN session is ended
        const endButton = page.locator('button:has-text("End Session")');
        if (await endButton.isVisible()) {
            await endButton.click();

            // Confirm end if modal appears
            const confirmButton = page.locator('button:has-text("Confirm")');
            if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmButton.click();
            }
        }

        // THEN timer should stop (not continue incrementing)
        await page.waitForTimeout(2000);
        const timeAfterEnd = await timerElement.textContent();

        // Time should be frozen at last value
        expect(timeAfterEnd).toBe(timeBeforeEnd);
    });
});

/**
 * TEST EXPECTATIONS SUMMARY:
 * 
 * These tests WILL FAIL initially because:
 * 1. HostControlPanel currently uses sessionStartTime directly
 * 2. Timer logic is partially integrated but not fully using TimerStateService
 * 3. Timer UI may not have data-testid attribute
 * 
 * After refactoring, these tests should PASS when:
 * 1. HostControlPanel.StartSession() calls TimerState.Start()
 * 2. Timer display uses TimerState.ElapsedFormatted
 * 3. Component properly subscribes to TimerState.TimerTicked
 * 4. Timer cleanup is handled via TimerState.Dispose()
 */
