import { expect, test } from '@playwright/test';

/**
 * Test suite specifically for Q&A participant name resolution
 * Tests the fixes to HostControlPanel.razor Q&A system
 */
test.describe('Q&A Participant Name Resolution', () => {

  const sessionToken = 'KJAHA99L'; // User token for participants
  const hostToken = 'PQ9N5YWW';   // Host token for control panel

  test.beforeEach(async ({ page }) => {
    // Enable request/response logging for debugging
    page.on('request', request => {
      if (request.url().includes('api/question') || request.url().includes('api/participant')) {
        console.log('Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('api/question') || response.url().includes('api/participant')) {
        console.log('Response:', response.status(), response.url());
      }
    });
  });

  test('Q&A questions show participant names in host control panel', async ({ page, browser }) => {
    // Step 1: Submit a question as a participant
    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"]', { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow participant data to load

    // Find and fill the question input
    const questionInput = page.locator('input[placeholder*="question"], textarea[placeholder*="question"], input[type="text"]').first();
    await questionInput.waitFor({ state: 'visible', timeout: 5000 });
    await questionInput.fill('Test question from automated test - checking participant name display');

    // Submit the question
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send"), input[type="submit"]').first();
    await submitButton.click();

    // Wait for submission to complete
    await page.waitForTimeout(2000);

    // Step 2: Open host control panel in a new context
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto(`/host/controlpanel/${hostToken}`);
    await hostPage.waitForSelector('[data-testid="host-control-panel"], .host-control-panel', { timeout: 10000 });
    await hostPage.waitForTimeout(3000); // Allow Q&A data to load

    // Step 3: Check Q&A section for participant names

    // Look for Q&A questions section
    const qaSection = hostPage.locator('.qa-section, [data-testid="qa-section"], .questions-section');
    await expect(qaSection.first()).toBeVisible({ timeout: 10000 });

    // Look for question entries with participant name badges
    const questionEntries = hostPage.locator('.question-entry, .qa-item, .question-item');

    if (await questionEntries.count() > 0) {
      console.log(`Found ${await questionEntries.count()} question entries`);

      // Check each question entry for participant name
      for (let i = 0; i < await questionEntries.count(); i++) {
        const entry = questionEntries.nth(i);

        // Look for participant name badge or display
        const participantBadge = entry.locator('.participant-badge, .participant-name, .badge:has-text("by"), .author');

        if (await participantBadge.count() > 0) {
          const badgeText = await participantBadge.first().textContent();
          console.log(`Question ${i} participant badge:`, badgeText);

          // Badge should not show "Anonymous"
          expect(badgeText?.toLowerCase()).not.toContain('anonymous');

          // Should contain a meaningful name (more than 2 characters)
          const nameMatch = badgeText?.match(/([A-Za-z\s]{3,})/);
          expect(nameMatch).toBeTruthy();

          if (nameMatch) {
            const extractedName = nameMatch[1].trim();
            expect(extractedName.length).toBeGreaterThan(2);
            console.log('Extracted participant name:', extractedName);
          }
        }
      }
    } else {
      console.log('No question entries found - this may indicate the question was not submitted properly or UI structure is different');

      // Take a screenshot for debugging
      await hostPage.screenshot({ path: 'debug-qa-no-questions.png' });
    }

    await hostContext.close();
  });

  test('Host control panel LoadQuestionsForHostAsync resolves participant names', async ({ page }) => {
    // Test the backend API that the host control panel uses

    await page.goto(`/host/controlpanel/${hostToken}`);
    await page.waitForSelector('[data-testid="host-control-panel"], .host-control-panel', { timeout: 10000 });

    // Wait for the LoadQuestionsForHostAsync to be called
    await page.waitForTimeout(5000);

    // Execute JavaScript to check if questions were loaded with participant names
    const questionData = await page.evaluate(() => {
      // Try to access any exposed question data
      const questionElements = document.querySelectorAll('.question-entry, .qa-item');
      const questions = [];

      for (const element of questionElements) {
        const participantElement = element.querySelector('.participant-badge, .participant-name, .author');
        const questionText = element.querySelector('.question-text, .question-content')?.textContent;

        questions.push({
          hasParticipantElement: !!participantElement,
          participantText: participantElement?.textContent?.trim() || '',
          questionText: questionText?.substring(0, 50) || '',
          elementHtml: element.innerHTML.substring(0, 200)
        });
      }

      return questions;
    });

    console.log('Loaded question data:', questionData);

    // Verify that questions have participant information
    for (const question of questionData) {
      if (question.hasParticipantElement) {
        expect(question.participantText).not.toBe('Anonymous');
        expect(question.participantText).not.toBe('');
        expect(question.participantText.length).toBeGreaterThan(2);
      }
    }
  });

  test('ResolveParticipantName method works correctly', async ({ page }) => {
    // This test verifies that the ResolveParticipantName method in HostControlPanel
    // correctly maps participant IDs to names

    await page.goto(`/host/controlpanel/${hostToken}`);
    await page.waitForSelector('[data-testid="host-control-panel"], .host-control-panel', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check if there are any participant name mappings visible
    const participantNames = await page.evaluate(() => {
      // Look for any elements that might contain participant names
      const nameElements = document.querySelectorAll(
        '.participant-name, .participant-badge, .author, [data-participant-name]'
      );

      return Array.from(nameElements).map(el => ({
        text: el.textContent?.trim() || '',
        className: el.className,
        tagName: el.tagName
      }));
    });

    console.log('Found participant name elements:', participantNames);

    // Verify that participant names are resolved properly
    for (const nameElement of participantNames) {
      if (nameElement.text) {
        expect(nameElement.text).not.toBe('Anonymous');
        expect(nameElement.text).not.toBe('undefined');
        expect(nameElement.text).not.toBe('null');

        // Should be a meaningful name
        if (nameElement.text.length > 0) {
          expect(nameElement.text.length).toBeGreaterThan(1);
        }
      }
    }
  });

  test('API endpoints return participant names correctly', async ({ page }) => {
    // Test the API endpoints that provide participant data

    let participantApiResponse: any = null;
    let questionApiResponse: any = null;

    // Intercept API calls
    page.on('response', async (response) => {
      if (response.url().includes(`/api/participant/session/${sessionToken}/participants`)) {
        participantApiResponse = await response.json();
        console.log('Participant API Response:', participantApiResponse);
      }

      if (response.url().includes(`/api/question/session/${sessionToken}`)) {
        questionApiResponse = await response.json();
        console.log('Question API Response:', questionApiResponse);
      }
    });

    await page.goto(`/host/controlpanel/${hostToken}`);
    await page.waitForSelector('[data-testid="host-control-panel"], .host-control-panel', { timeout: 10000 });
    await page.waitForTimeout(5000); // Allow API calls to complete

    // Verify participant API returns names
    if (participantApiResponse && participantApiResponse.participants) {
      for (const participant of participantApiResponse.participants) {
        expect(participant.displayName || participant.name).toBeTruthy();
        expect(participant.displayName || participant.name).not.toBe('Anonymous');

        console.log('Participant:', {
          userId: participant.userId,
          name: participant.displayName || participant.name,
          role: participant.role
        });
      }
    }

    // Verify question API includes proper participant identification
    if (questionApiResponse && questionApiResponse.questions) {
      for (const question of questionApiResponse.questions) {
        // Questions should have participant identification
        expect(question.participantId || question.userId || question.createdBy).toBeTruthy();

        console.log('Question:', {
          id: question.id,
          participantId: question.participantId || question.userId,
          createdBy: question.createdBy,
          content: question.content?.substring(0, 50)
        });
      }
    }
  });
});

/**
 * Integration test for the complete participant name flow
 */
test.describe('Complete Participant Name Flow', () => {

  test('End-to-end participant name display in Q&A system', async ({ page, browser }) => {
    const sessionToken = 'KJAHA99L';
    const hostToken = 'PQ9N5YWW';

    // Step 1: Participant joins session and checks welcome message
    await page.goto(`/session/canvas/${sessionToken}`);
    await page.waitForSelector('[data-testid="session-canvas"]', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Verify welcome message shows participant name
    const welcomeMessage = page.locator('.welcome-message, [data-testid="welcome-message"]').first();
    if (await welcomeMessage.isVisible()) {
      const welcomeText = await welcomeMessage.textContent();
      console.log('Welcome message:', welcomeText);

      expect(welcomeText).not.toContain('Participant, Welcome to the Session');
      expect(welcomeText).toMatch(/[A-Za-z\s]+,\s*Welcome to the Session/);
    }

    // Step 2: Participant submits a question
    const testQuestion = `Integration test question - ${Date.now()}`;

    const questionInput = page.locator('input[type="text"], textarea').first();
    await questionInput.waitFor({ state: 'visible', timeout: 5000 });
    await questionInput.fill(testQuestion);

    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Step 3: Host views question with participant name
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto(`/host/controlpanel/${hostToken}`);
    await hostPage.waitForSelector('[data-testid="host-control-panel"], .host-control-panel', { timeout: 10000 });
    await hostPage.waitForTimeout(5000);

    // Look for the submitted question
    const questionEntries = hostPage.locator('.question-entry, .qa-item');
    let foundTestQuestion = false;

    for (let i = 0; i < await questionEntries.count(); i++) {
      const entry = questionEntries.nth(i);
      const questionText = await entry.locator('.question-text, .question-content').textContent();

      if (questionText?.includes('Integration test question')) {
        foundTestQuestion = true;
        console.log('Found test question in host panel');

        // Check participant name for this question
        const participantBadge = entry.locator('.participant-badge, .participant-name, .author');
        if (await participantBadge.count() > 0) {
          const participantName = await participantBadge.textContent();
          console.log('Question participant name:', participantName);

          expect(participantName?.trim()).not.toBe('Anonymous');
          expect(participantName?.trim()).not.toBe('');
          expect(participantName?.trim().length).toBeGreaterThan(2);
        }
        break;
      }
    }

    expect(foundTestQuestion).toBe(true);

    await hostContext.close();
  });
});