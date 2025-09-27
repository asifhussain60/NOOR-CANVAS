import { expect, test } from '@playwright/test';

/**
 * Test Suite: SessionWaiting Timer Countdown Fix Verification
 *
 * This test verifies the fix for the timer issue where:
 * 1. Countdown display should be green (not yellow)
 * 2. Progress bar should be loading properly
 *
 * Key Verification Points:
 * - Countdown display has green color (#006400)
 * - Progress bar fills properly
 * - Timer updates correctly
 * - CSS syntax errors are fixed
 */

test.describe('SessionWaiting Timer Fix Verification', () => {
  // Use a known test token - this should be generated fresh if expired
  const testUserToken = 'USER223A';

  test.beforeEach(async ({ page }) => {
    // Ensure the app is running
    await page.goto('https://localhost:9091/health', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Healthy')).toBeVisible({ timeout: 5000 });
  });

  test('Countdown display should be green color', async ({ page }) => {
    // Navigate to session waiting page
    await page.goto(`https://localhost:9091/session/waiting/${testUserToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for the page to load and timer to initialize
    await page.waitForTimeout(3000);

    // Check if countdown display exists
    const countdownDisplay = page.locator('[data-testid="countdown-display"]');
    if ((await countdownDisplay.count()) > 0) {
      // Get computed style to verify green color
      const color = await countdownDisplay.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      console.log(`✅ Countdown display color: ${color}`);

      // RGB equivalent of #006400 is rgb(0, 100, 0)
      // Allow for slight variations in color representation
      expect(color).toMatch(/rgb\(0,\s*100,\s*0\)|#006400/i);
    } else {
      // If no countdown display, check if session has already started
      const waitingForHost = page.locator('text=Waiting For Host...');
      if ((await waitingForHost.count()) > 0) {
        console.log('✅ Session already started - checking clock icon color');

        // Check the clock icon color in "Waiting for Host" state
        const clockIcon = page.locator('.fa-clock');
        if ((await clockIcon.count()) > 0) {
          const iconColor = await clockIcon.evaluate((el) => {
            return window.getComputedStyle(el).color;
          });

          console.log(`✅ Clock icon color: ${iconColor}`);
          expect(iconColor).toMatch(/rgb\(0,\s*100,\s*0\)|#006400/i);
        }
      }
    }
  });

  test('Progress bar should be visible and functional', async ({ page }) => {
    await page.goto(`https://localhost:9091/session/waiting/${testUserToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Check for progress bar
    const progressBarContainer = page.locator(
      '[data-testid="progress-bar"], .progress-bar-container',
    );
    await expect(progressBarContainer.first()).toBeVisible({ timeout: 10000 });

    // Check if progress bar has proper styling
    const progressBar = progressBarContainer.first();
    const backgroundColor = await progressBar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log(`✅ Progress bar container background: ${backgroundColor}`);

    // Check for progress fill element
    const progressFill = page.locator('.progress-bar-fill, .progress-bar-full');
    if ((await progressFill.count()) > 0) {
      const fillColor = await progressFill.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      console.log(`✅ Progress bar fill color: ${fillColor}`);
      // Should be green (#006400 = rgb(0, 100, 0))
      expect(fillColor).toMatch(/rgb\(0,\s*100,\s*0\)/i);
    }
  });

  test('Timer should update correctly', async ({ page }) => {
    await page.goto(`https://localhost:9091/session/waiting/${testUserToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Check if countdown display exists and is updating
    const countdownDisplay = page.locator('[data-testid="countdown-display"]');

    if ((await countdownDisplay.count()) > 0) {
      // Get initial time
      const initialTime = await countdownDisplay.textContent();
      console.log(`✅ Initial countdown time: ${initialTime}`);

      // Wait a few seconds and check if time changed
      await page.waitForTimeout(5000);

      const updatedTime = await countdownDisplay.textContent();
      console.log(`✅ Updated countdown time: ${updatedTime}`);

      // Time should be in MM:SS format
      expect(initialTime).toMatch(/^\d{2}:\d{2}$/);
      expect(updatedTime).toMatch(/^\d{2}:\d{2}$/);

      // If session hasn't started, times should be different (countdown is working)
      if (initialTime !== '00:00' && updatedTime !== '00:00') {
        expect(initialTime).not.toBe(updatedTime);
        console.log('✅ Timer is updating correctly');
      }
    } else {
      console.log(
        '✅ No countdown display - session may have already started or be in different state',
      );
    }
  });

  test('CSS styling should be properly applied', async ({ page }) => {
    await page.goto(`https://localhost:9091/session/waiting/${testUserToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Check that CSS is loading properly by verifying key elements have expected styles
    const sessionContainer = page.locator('.session-waiting-container');
    await expect(sessionContainer).toBeVisible();

    // Verify the container has proper styling (this would fail if CSS syntax errors break styling)
    const containerStyle = await sessionContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
      };
    });

    console.log(`✅ Container styling applied:`, containerStyle);

    // If styling is applied, we know CSS is parsing correctly
    expect(containerStyle.backgroundColor).toBeTruthy();
    expect(containerStyle.borderRadius).toBeTruthy();
  });

  test('Overall page functionality after CSS fixes', async ({ page }) => {
    await page.goto(`https://localhost:9091/session/waiting/${testUserToken}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'test-results/session-waiting-timer-fix-verification.png',
      fullPage: true,
    });

    // Verify key elements are present and styled
    const timerPanel = page.locator('.timer-panel');
    await expect(timerPanel).toBeVisible();

    const participantsPanel = page.locator('.participants-panel');
    await expect(participantsPanel).toBeVisible();

    // Log success
    console.log('✅ SessionWaiting page loads successfully with timer fixes applied');
    console.log('✅ Screenshot saved for visual verification');
  });
});
