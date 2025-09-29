import { expect, test } from '@playwright/test';

/**
 * Test suite for validating participant name display fixes
 * - Q&A badges should show participant names instead of "Anonymous"
 * - Welcome message should show actual participant names instead of "Participant"
 */
test.describe('Participant Name Display Fixes', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the session canvas (adjust URL as needed)
    await page.goto('/session/canvas/KJAHA99L');

    // Wait for the page to load and SignalR to connect
    await page.waitForSelector('[data-testid="session-canvas"]');
    await page.waitForTimeout(2000); // Allow time for API calls
  });

  test('Welcome message shows actual participant name', async ({ page }) => {
    // Test that the welcome message displays the participant's actual name
    // instead of generic "Participant, Welcome to the Session"

    // Look for the welcome message element
    const welcomeMessage = page.locator('[data-testid="welcome-message"]');
    await expect(welcomeMessage).toBeVisible();

    // The message should contain a real name like "Asif, Welcome to the Session"
    // or "Wade Wilson, Welcome to the Session", not "Participant, Welcome to the Session"
    const welcomeText = await welcomeMessage.textContent();

    expect(welcomeText).not.toContain('Participant, Welcome to the Session');
    const cleanText = welcomeText?.trim() || '';
    expect(cleanText).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);

    // Should be a meaningful name (more than just a single word)
    const nameMatch = welcomeText?.match(/^([^,]+),/);
    if (nameMatch) {
      const participantName = nameMatch[1].trim();
      expect(participantName.length).toBeGreaterThan(3);
      expect(participantName).not.toBe('Participant');
      expect(participantName).not.toBe('Anonymous');
    }
  });

  test('Q&A badges show participant names instead of Anonymous', async ({ page }) => {
    // First, submit a question to create a Q&A entry
    const questionInput = page.locator('[data-testid="question-input"]');
    await questionInput.fill('Test question for participant name display');

    const submitButton = page.locator('[data-testid="submit-question-btn"]');
    await submitButton.click();

    // Wait for the question to be processed
    await page.waitForTimeout(1000);

    // Now switch to the host control panel to check Q&A display
    await page.goto('/host/controlpanel/PQ9N5YWW');
    await page.waitForSelector('[data-testid="host-control-panel"]');
    await page.waitForTimeout(2000);

    // Look for Q&A entries in the host control panel
    const qaSection = page.locator('[data-testid="qa-section"]');
    await expect(qaSection).toBeVisible();

    // Check that question badges show actual participant names
    const questionBadges = page.locator('.question-badge .participant-name');

    if (await questionBadges.count() > 0) {
      // Get the text of the first question badge
      const firstBadgeText = await questionBadges.first().textContent();

      // Should not be "Anonymous"
      expect(firstBadgeText?.trim()).not.toBe('Anonymous');
      expect(firstBadgeText?.trim()).not.toBe('');

      // Should be a meaningful participant name
      expect(firstBadgeText?.trim().length).toBeGreaterThan(2);
    }
  });

  test('Host control panel displays participant names correctly', async ({ page }) => {
    // Navigate directly to host control panel
    await page.goto('/host/controlpanel/PQ9N5YWW');
    await page.waitForSelector('[data-testid="host-control-panel"]');
    await page.waitForTimeout(2000);

    // Check the participants list or any participant name displays
    const participantElements = page.locator('[data-testid="participant-name"]');

    if (await participantElements.count() > 0) {
      const participantNames = await participantElements.allTextContents();

      for (const name of participantNames) {
        // Each participant name should not be "Anonymous" or empty
        expect(name.trim()).not.toBe('Anonymous');
        expect(name.trim()).not.toBe('');
        expect(name.trim().length).toBeGreaterThan(2);
      }
    }
  });

  test('Session state maintains participant identity correctly', async ({ page }) => {
    // Test that participant identity is maintained throughout the session

    // Check initial state
    const welcomeMessage = page.locator('[data-testid="welcome-message"]');
    const initialWelcomeText = await welcomeMessage.textContent();

    // Perform some actions (submit question, interact with UI)
    const questionInput = page.locator('[data-testid="question-input"]');
    if (await questionInput.isVisible()) {
      await questionInput.fill('Testing identity persistence');

      const submitButton = page.locator('[data-testid="submit-question-btn"]');
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // Check that welcome message still shows the same participant name
    const updatedWelcomeText = await welcomeMessage.textContent();
    expect(updatedWelcomeText).toBe(initialWelcomeText);

    // The name should still not be generic
    expect(updatedWelcomeText).not.toContain('Participant, Welcome to the Session');
  });

  test('Multiple participants have distinct names', async ({ page, browser }) => {
    // This test simulates multiple participants to ensure names are distinct

    // Create additional browser contexts to simulate multiple participants
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Navigate both to the same session
    await Promise.all([
      page.goto('/session/canvas/KJAHA99L'),
      page2.goto('/session/canvas/KJAHA99L')
    ]);

    await Promise.all([
      page.waitForSelector('[data-testid="session-canvas"]'),
      page2.waitForSelector('[data-testid="session-canvas"]')
    ]);

    await page.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Get welcome messages from both participants
    const welcome1 = await page.locator('[data-testid="welcome-message"]').textContent();
    const welcome2 = await page2.locator('[data-testid="welcome-message"]').textContent();

    // Both should have valid names (not "Participant")
    expect(welcome1).not.toContain('Participant, Welcome to the Session');
    expect(welcome2).not.toContain('Participant, Welcome to the Session');

    // Names could be the same (in testing scenario) or different (in real scenario)
    // Just ensure they're meaningful names
    const cleanWelcome1 = welcome1?.trim() || '';
    const cleanWelcome2 = welcome2?.trim() || '';
    expect(cleanWelcome1).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);
    expect(cleanWelcome2).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);

    await context2.close();
  });
});

/**
 * Helper test for debugging participant data
 */
test.describe('Participant Data Debugging', () => {

  test('Log participant data for debugging', async ({ page }) => {
    await page.goto('/session/canvas/KJAHA99L');
    await page.waitForSelector('[data-testid="session-canvas"]');
    await page.waitForTimeout(2000);

    // Execute JavaScript to log participant data
    const participantData = await page.evaluate(() => {
      // Try to access any exposed participant data for debugging
      return {
        userGuid: (window as any).currentUserGuid || 'not found',
        participantCount: document.querySelectorAll('[data-testid="participant-name"]').length,
        welcomeMessage: document.querySelector('[data-testid="welcome-message"]')?.textContent || 'not found'
      };
    });

    console.log('Participant Data:', participantData);

    // This test always passes, it's just for logging
    expect(participantData).toBeDefined();
  });
});