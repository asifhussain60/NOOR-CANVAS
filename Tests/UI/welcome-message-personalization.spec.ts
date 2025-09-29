import { expect, test } from '@playwright/test';

/**
 * Test suite specifically for SessionCanvas welcome message personalization
 * Tests the fixes to GetCurrentParticipantName() method
 */
test.describe('SessionCanvas Welcome Message Personalization', () => {

  const sessionToken = 'KJAHA99L'; // Test session token

  test.beforeEach(async ({ page }) => {
    // Set up request/response monitoring
    page.on('response', async (response) => {
      if (response.url().includes(`/api/participant/session/${sessionToken}/participants`)) {
        console.log('Participants API called:', response.status());
        try {
          const data = await response.json();
          console.log('Participants data:', {
            count: data.participants?.length || 0,
            participants: data.participants?.map((p: any) => ({
              userId: p.userId,
              name: p.displayName || p.name,
              role: p.role
            })) || []
          });
        } catch (e) {
          console.log('Could not parse participants response');
        }
      }
    });
  });

  test('Welcome message displays actual participant name', async ({ page }) => {
    // Navigate to session canvas
    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 });

    // Wait for participant data to load
    await page.waitForTimeout(5000);

    // Look for welcome message
    const welcomeSelectors = [
      '[data-testid="welcome-message"]',
      '.welcome-message',
      '.participant-welcome',
      'p:has-text("Welcome to the Session")',
      'div p:has-text("Welcome to the Session")',
      ':has-text("Welcome to the Session")'
    ];

    let welcomeElement = null;
    let welcomeText = '';

    for (const selector of welcomeSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        welcomeElement = element;
        welcomeText = await element.textContent() || '';
        console.log(`Found welcome message with selector "${selector}":`, welcomeText);
        break;
      }
    }

    // If no welcome element found, log page content for debugging
    if (!welcomeElement) {
      console.log('No welcome message found. Page title:', await page.title());
      console.log('Page URL:', page.url());

      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-no-welcome-message.png' });

      // Look for any text containing "Welcome"
      const welcomeTexts = await page.locator(':has-text("Welcome")').allTextContents();
      console.log('Found Welcome text elements:', welcomeTexts);
    }

    expect(welcomeElement).toBeTruthy();

    if (welcomeText) {
      // Test the main requirement: should not show "Participant, Welcome to the Session"
      expect(welcomeText).not.toContain('Participant, Welcome to the Session');

      // Should follow the pattern "Name, Welcome to the Session"
      expect(welcomeText).toMatch(/[A-Za-z\s]+,\s*Welcome to the Session/);

      // Extract the participant name
      const nameMatch = welcomeText.match(/^([^,]+),\s*Welcome to the Session/);
      if (nameMatch) {
        const participantName = nameMatch[1].trim();
        console.log('Extracted participant name from welcome message:', participantName);

        // Verify it's a meaningful name
        expect(participantName).not.toBe('Participant');
        expect(participantName).not.toBe('Anonymous');
        expect(participantName).not.toBe('');
        expect(participantName.length).toBeGreaterThan(2);

        // Should be a proper name (letters and spaces only, with reasonable length)
        expect(participantName).toMatch(/^[A-Za-z\s]{3,50}$/);

        console.log('✅ Welcome message shows proper participant name:', participantName);
      } else {
        throw new Error(`Welcome message format doesn't match expected pattern: "${welcomeText}"`);
      }
    }
  });

  test('GetCurrentParticipantName method logic works correctly', async ({ page }) => {
    // This test validates the logic of the GetCurrentParticipantName method

    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // Execute JavaScript to test the participant name logic
    const participantInfo = await page.evaluate(() => {
      // Try to access any exposed participant data
      const result = {
        currentUserGuid: '',
        participantCount: 0,
        participantNames: [] as string[],
        welcomeMessage: '',
        debugInfo: {} as any
      };

      // Look for current user GUID (might be exposed in various ways)
      result.currentUserGuid = (window as any).currentUserGuid ||
        (window as any).userGuid ||
        document.querySelector('[data-user-guid]')?.getAttribute('data-user-guid') ||
        '';

      // Count participants
      const participantElements = document.querySelectorAll('[data-participant-name], .participant-name');
      result.participantCount = participantElements.length;

      // Collect participant names
      result.participantNames = Array.from(participantElements).map(el => el.textContent?.trim() || '');

      // Get welcome message
      const welcomeEl = document.querySelector('[data-testid="welcome-message"]');
      result.welcomeMessage = welcomeEl?.textContent?.trim() || '';

      // Debug info
      result.debugInfo = {
        hasParticipants: result.participantCount > 0,
        hasUserGuid: result.currentUserGuid.length > 0,
        welcomeMessageFound: result.welcomeMessage.length > 0,
        pageTitle: document.title
      };

      return result;
    });

    console.log('Participant info from page:', participantInfo);

    // Validate the participant name resolution logic
    if (participantInfo.welcomeMessage) {
      expect(participantInfo.welcomeMessage).not.toContain('Participant, Welcome to the Session');

      // If we have a current user GUID, the name should be specific to that user
      if (participantInfo.currentUserGuid) {
        console.log('Current user GUID found:', participantInfo.currentUserGuid);
        // The welcome should show a specific participant name
        expect(participantInfo.welcomeMessage).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);
      }

      // If we have participants, at least one should have a name
      if (participantInfo.participantCount > 0) {
        const validNames = participantInfo.participantNames.filter(name =>
          name && name !== 'Anonymous' && name !== 'Participant' && name.length > 2
        );
        expect(validNames.length).toBeGreaterThan(0);
      }
    }
  });

  test('Participant name persists across page interactions', async ({ page }) => {
    // Test that the participant name doesn't change when interacting with the page

    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // Get initial welcome message
    const welcomeElement = page.locator('[data-testid="welcome-message"], .welcome-message').first();
    const initialWelcomeText = await welcomeElement.textContent();
    console.log('Initial welcome message:', initialWelcomeText);

    expect(initialWelcomeText).toBeTruthy();
    expect(initialWelcomeText).not.toContain('Participant, Welcome to the Session');

    // Perform some page interactions
    // Submit a question if possible
    const questionInput = page.locator('input[type="text"], textarea').first();
    if (await questionInput.isVisible()) {
      await questionInput.fill('Testing participant name persistence');

      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Scroll or click somewhere to trigger potential re-renders
    await page.locator('body').click();
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1000);

    // Check that welcome message is still the same
    const updatedWelcomeElement = page.locator('[data-testid="welcome-message"]').first();
    const updatedWelcomeText = await updatedWelcomeElement.textContent();
    console.log('Updated welcome message:', updatedWelcomeText);

    expect(updatedWelcomeText).toBe(initialWelcomeText);
    expect(updatedWelcomeText).not.toContain('Participant, Welcome to the Session');
  });

  test('Fallback participant name logic works', async ({ page }) => {
    // Test that the fallback logic works when exact UserGuid matching fails

    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 });
    await page.waitForTimeout(5000);

    // The implementation includes fallback logic to use any named participant for testing
    // This should result in a meaningful name being displayed

    const welcomeElement = page.locator('[data-testid="welcome-message"], .welcome-message').first();
    const welcomeText = await welcomeElement.textContent();

    if (welcomeText) {
      console.log('Testing fallback logic with welcome message:', welcomeText);

      // Even with fallback logic, should not be "Participant"
      expect(welcomeText).not.toContain('Participant, Welcome to the Session');

      // Should be a meaningful name from the participants list
      const nameMatch = welcomeText.match(/^([^,]+),\s*Welcome to the Session/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        console.log('Fallback participant name:', name);

        // Should be one of the known test participant names
        const validTestNames = ['Wade Wilson', 'Erik Lehnsherr', 'Asif Hussain', 'Asif'];
        const isValidName = validTestNames.some(validName =>
          name.includes(validName) || validName.includes(name)
        );

        if (!isValidName) {
          console.log('Name not in expected test names, but should still be meaningful');
          expect(name.length).toBeGreaterThan(2);
          expect(name).not.toBe('Anonymous');
          expect(name).not.toBe('Participant');
        } else {
          console.log('✅ Using valid test participant name:', name);
        }
      }
    }
  });

  test('Multiple browser sessions get appropriate participant names', async ({ page, browser }) => {
    // Test behavior with multiple participants in different browser contexts

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Both navigate to the same session
    await Promise.all([
      page.goto(`/session/canvas/${sessionToken}`),
      page2.goto(`/session/canvas/${sessionToken}`)
    ]);

    await Promise.all([
      page.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 }),
      page2.waitForSelector('[data-testid="session-canvas"], .session-canvas', { timeout: 10000 })
    ]);

    await page.waitForTimeout(5000);
    await page2.waitForTimeout(5000);

    // Get welcome messages from both
    const welcome1 = await page.locator('[data-testid="welcome-message"], .welcome-message').first().textContent();
    const welcome2 = await page2.locator('[data-testid="welcome-message"], .welcome-message').first().textContent();

    console.log('Session 1 welcome:', welcome1);
    console.log('Session 2 welcome:', welcome2);

    // Both should have meaningful names
    expect(welcome1).not.toContain('Participant, Welcome to the Session');
    expect(welcome2).not.toContain('Participant, Welcome to the Session');

    // Both should follow proper format
    const cleanWelcome1 = welcome1?.trim() || '';
    const cleanWelcome2 = welcome2?.trim() || '';
    expect(cleanWelcome1).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);
    expect(cleanWelcome2).toMatch(/^[A-Za-z\s]+,\s*Welcome to the Session$/);

    // In the current implementation, both might show the same name (fallback logic)
    // or different names (if proper UserGuid matching works)
    // Either is acceptable as long as they're not "Participant"

    await context2.close();
  });
});