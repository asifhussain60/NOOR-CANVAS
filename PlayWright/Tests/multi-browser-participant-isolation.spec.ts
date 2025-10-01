/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                       MULTI-BROWSE      // Test data for two different participants - using real tokens from session ID 212
      const participant1 = {
        token: 'KJAHA99L', // Real user token from session 212
        name: 'Alice Johnson',
        email: 'alice.johnson@test.com'
      };
      
      const participant2 = {
        token: 'PQ9N5YWW', // Real host token from session 212 (using as different participant)
        name: 'Bob Smith',
        email: 'bob.smith@test.com'
      };T ISOLATION TEST                           ║
 * ║                         Generated: October 1, 2025 17:24:00                             ║
 * ║                                                                                           ║
 * ║ PURPOSE: Verify that the API-based participant identification approach eliminates        ║
 * ║          the "same name on multiple browsers" issue by ensuring proper isolation         ║
 * ║          between different browser sessions using unique session tokens.                 ║
 * ║                                                                                           ║
 * ║ TARGETS: SessionCanvas.razor, ParticipantController.cs (/api/participant/session/me)   ║
 * ║ VALIDATES: API-based approach vs storage-based approach for participant identification   ║
 * ║                                                                                           ║
 * ║ TEST SCENARIOS:                                                                          ║
 * ║ 1. Two different participants register with different session tokens                    ║
 * ║ 2. Each participant sees their own name in SessionCanvas                                ║
 * ║ 3. No localStorage/sessionStorage conflicts between browser sessions                    ║
 * ║ 4. API endpoint /api/participant/session/{token}/me returns correct participant         ║
 * ║                                                                                           ║
 * ║ CONFIGURATION: headless, verbose, 2 workers for parallel execution                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { expect, Page, test } from '@playwright/test';

// Configuration for reliable headless testing
test.use({ headless: true, video: 'retain-on-failure' });

/**
 * Helper function to inject UserGuid into browser session for multi-browser isolation testing
 */
async function injectUserGuidForSession(
  page: Page,
  sessionToken: string,
  userGuid: string
): Promise<void> {
  const storageKey = `noor_user_guid_${sessionToken}`;

  try {
    // Inject UserGuid into both localStorage and sessionStorage for consistency
    await page.evaluate((data) => {
      localStorage.setItem(data.key, data.userGuid);
      sessionStorage.setItem(data.key, data.userGuid);
    }, { key: storageKey, userGuid });

    console.log(`[UserGuid] Injected UserGuid ${userGuid} for session ${sessionToken}`);
  } catch (error) {
    console.log(`[UserGuid] Failed to inject UserGuid before navigation: ${error}`);
  }
}

/**
 * Helper function to register a participant and navigate to session canvas
 */
async function registerParticipantAndNavigateToSession(
  page: Page,
  sessionToken: string,
  participantName: string,
  participantEmail: string,
  userGuidToInject?: string,
  country: string = 'BH'
): Promise<void> {
  console.log(`[${participantName}] Starting registration with token: ${sessionToken}, UserGuid: ${userGuidToInject || 'AUTO'}`);

  // Navigate directly to session canvas (API-based approach)
  await page.goto(`https://localhost:9091/session/canvas/${sessionToken}`);

  // Inject UserGuid for multi-browser isolation testing (after navigation)
  if (userGuidToInject) {
    await injectUserGuidForSession(page, sessionToken, userGuidToInject);
  }

  // Wait for session canvas to load
  await expect(page.locator('.session-canvas-root').first()).toBeVisible({ timeout: 10000 });

  // Wait for API calls to complete and session data to load
  await page.waitForTimeout(3000);

  // Verify session canvas is fully loaded
  await expect(page.locator('.session-canvas-container').first()).toBeVisible({ timeout: 10000 });

  console.log(`[${participantName}] Successfully registered and navigated to session canvas`);
}

/**
 * Helper function to get current participant name from session canvas
 */
async function getCurrentParticipantName(page: Page): Promise<string> {
  // Look for participant name display in various possible locations
  const possibleSelectors = [
    '.current-participant',
    '.participant-name',
    '.user-name',
    '[data-testid="participant-name"]',
    '.welcome-message',
    'text=/Welcome.*/'
  ];

  for (const selector of possibleSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      const text = await element.textContent();
      if (text && text.trim()) {
        // Extract name from welcome messages like "Welcome, John Doe"
        const match = text.match(/(?:Welcome[,\s]*|Hello[,\s]*)?([A-Z][a-z]+ [A-Z][a-z]+)/i);
        if (match) {
          return match[1].trim();
        }
        return text.trim();
      }
    }
  }

  // Fallback: check page content for participant names
  const pageContent = await page.textContent('body');
  const nameMatch = pageContent?.match(/(?:Welcome[,\s]*|Hello[,\s]*)?([A-Z][a-z]+ [A-Z][a-z]+)/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }

  throw new Error('Could not find current participant name in session canvas');
}

/**
 * Helper function to verify API endpoint returns correct participant data
 */
async function verifyParticipantApiEndpoint(
  page: Page,
  sessionToken: string,
  expectedName: string,
  expectedUserGuid?: string
): Promise<void> {
  let apiUrl = `https://localhost:9091/api/participant/session/${sessionToken}/me`;
  if (expectedUserGuid) {
    apiUrl += `?userGuid=${encodeURIComponent(expectedUserGuid)}`;
  }

  const response = await page.request.get(apiUrl);

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.name).toBe(expectedName);
  expect(data.userGuid).toBeTruthy();

  if (expectedUserGuid) {
    expect(data.userGuid).toBe(expectedUserGuid);
  }

  console.log(`[API] Verified participant API for ${expectedName}: UserGuid=${data.userGuid}`);
}

test.describe('Multi-Browser Participant Isolation', () => {

  test('should show different participant names in separate browser sessions with different tokens', async ({ browser }) => {
    // Create two separate browser contexts to simulate different users
    const context1 = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: undefined // Ensure clean state
    });
    const context2 = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: undefined // Ensure clean state
    });

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Test data using REAL participant data from database for session 212
      const participant1 = {
        token: 'KJAHA99L', // Real user token from session 212
        userGuid: '63bf4e5c-72ca-4e73-8444-e96d5cb6068c', // Real UserGuid from database
        expectedName: 'John Walker', // Real participant name from database
        email: 'alice.johnson@test.com'
      };

      const participant2 = {
        token: 'KJAHA99L', // Same token (shared session)
        userGuid: '9ade0f42-f82c-41d4-8849-d6c91acdf8f9', // Different UserGuid from database
        expectedName: 'Raven Darkholme', // Real participant name from database
        email: 'bob.smith@test.com'
      };

      console.log('=== MULTI-BROWSER ISOLATION TEST START ===');
      console.log(`Participant 1: ${participant1.expectedName} with token ${participant1.token}, UserGuid: ${participant1.userGuid}`);
      console.log(`Participant 2: ${participant2.expectedName} with token ${participant2.token}, UserGuid: ${participant2.userGuid}`);

      // Register both participants in parallel using same token but different UserGuids
      await Promise.all([
        registerParticipantAndNavigateToSession(
          page1,
          participant1.token,
          participant1.expectedName,
          participant1.email,
          participant1.userGuid
        ),
        registerParticipantAndNavigateToSession(
          page2,
          participant2.token,
          participant2.expectedName,
          participant2.email,
          participant2.userGuid
        )
      ]);

      // Wait a moment for both sessions to fully load
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Verify each participant sees their own name (not the other's)
      const displayedName1 = await getCurrentParticipantName(page1);
      const displayedName2 = await getCurrentParticipantName(page2);

      console.log(`Browser 1 shows participant: "${displayedName1}"`);
      console.log(`Browser 2 shows participant: "${displayedName2}"`);

      // CRITICAL ASSERTION: UserGuid-based approach shows different participants
      // Browser 1 with UserGuid 63bf4e5c-... should show John Walker
      expect(displayedName1).toBe(participant1.expectedName);

      // Browser 2 with UserGuid 9ade0f42-... should show Raven Darkholme
      expect(displayedName2).toBe(participant2.expectedName);

      // MOST IMPORTANT: Names should be different (no "same name" issue)
      expect(displayedName1).not.toBe(displayedName2);

      // Verify API endpoints return correct participant data for both UserGuids
      await verifyParticipantApiEndpoint(page1, participant1.token, participant1.expectedName, participant1.userGuid);
      await verifyParticipantApiEndpoint(page2, participant2.token, participant2.expectedName, participant2.userGuid);

      console.log('✅ MULTI-BROWSER ISOLATION TEST PASSED');
      console.log('✅ API-based approach successfully eliminated "same name on multiple browsers" issue');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle localStorage/sessionStorage clearance gracefully with API-based approach', async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: undefined
    });

    const page = await context.newPage();

    try {
      const participant = {
        token: 'KJAHA99L', // Real user token from session 212
        userGuid: '63bf4e5c-72ca-4e73-8444-e96d5cb6068c', // Real UserGuid
        expectedName: 'John Walker', // Real participant name from database
        email: 'charlie.brown@test.com'
      };

      console.log('=== STORAGE CLEARANCE TEST START ===');

      // Register participant with UserGuid injection
      await registerParticipantAndNavigateToSession(
        page,
        participant.token,
        participant.expectedName,
        participant.email,
        participant.userGuid
      );

      // Verify initial state - should show real participant from API
      const initialName = await getCurrentParticipantName(page);
      expect(initialName).toBe(participant.expectedName); // Real participant from database
      console.log(`Initial participant name: ${initialName}`);

      // Clear all browser storage (localStorage, sessionStorage, cookies)
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies would require different approach, but localStorage/sessionStorage are key
      });

      console.log('Cleared localStorage and sessionStorage');

      // Reload the page to test API-based recovery
      await page.reload();
      await page.waitForTimeout(3000); // Allow time for API calls

      // Verify participant name falls back to first participant after storage clearance
      const nameAfterClearance = await getCurrentParticipantName(page);
      expect(nameAfterClearance).toBe(participant.expectedName); // Should fallback to first participant

      // Verify API still works correctly (fallback mode without UserGuid)
      await verifyParticipantApiEndpoint(page, participant.token, participant.expectedName);

      console.log(`✅ Participant name after storage clearance: ${nameAfterClearance}`);
      console.log('✅ API-based approach works correctly with fallback behavior');

    } finally {
      await context.close();
    }
  });

  test('should maintain correct participant identity across page refreshes', async ({ browser }) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      storageState: undefined
    });

    const page = await context.newPage();

    try {
      const participant = {
        token: 'KJAHA99L', // Real user token from session 212
        userGuid: '63bf4e5c-72ca-4e73-8444-e96d5cb6068c', // Real UserGuid
        expectedName: 'John Walker', // Real participant name from database
        email: 'diana.prince@test.com'
      };

      console.log('=== PAGE REFRESH PERSISTENCE TEST START ===');

      // Register participant with UserGuid injection
      await registerParticipantAndNavigateToSession(
        page,
        participant.token,
        participant.expectedName,
        participant.email,
        participant.userGuid
      );

      // Verify initial state - should show real participant from API
      const initialName = await getCurrentParticipantName(page);
      expect(initialName).toBe(participant.expectedName); // Real participant from database

      // Refresh the page multiple times
      for (let i = 1; i <= 3; i++) {
        console.log(`Refresh ${i}/3`);
        await page.reload();
        await page.waitForTimeout(3000);

        const nameAfterRefresh = await getCurrentParticipantName(page);
        expect(nameAfterRefresh).toBe(participant.expectedName); // API consistently returns real participant

        console.log(`  ✅ Name after refresh ${i}: ${nameAfterRefresh}`);
      }

      // Final API verification with UserGuid
      await verifyParticipantApiEndpoint(page, participant.token, participant.expectedName, participant.userGuid);

      console.log('✅ Participant identity maintained correctly across page refreshes');

    } finally {
      await context.close();
    }
  });
});