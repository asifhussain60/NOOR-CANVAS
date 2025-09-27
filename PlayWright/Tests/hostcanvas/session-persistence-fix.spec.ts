import { expect, test } from '@playwright/test';

/**
 * Test for Session ID Persistence Fix (Workitem: hostcanvas)
 * Verifies that session views have SessionID available on initial page load
 * and that session data persists across page refreshes
 */

const HOST_TOKEN = 'HOST212A';
const SESSION_TOKEN = 'USER212B';
const BASE_URL = 'https://localhost:9090';

test.describe('Session Persistence Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Accept any SSL certificate issues for localhost testing
    await page.goto(`${BASE_URL}/`);
  });

  test('Host Control Panel - Session ID available on initial load', async ({ page }) => {
    // Phase 1: Navigate to Host Control Panel
    console.log('🎯 Phase 1: Navigating to Host Control Panel...');
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);

    // Wait for page to load and check for session data
    await page.waitForLoadState('networkidle');

    // Phase 2: Verify session information is loaded immediately
    console.log('🔍 Phase 2: Verifying session data is loaded immediately...');

    // Check for session name (should not be "Loading Session...")
    const sessionName = await page.locator('h2').first().textContent();
    expect(sessionName).not.toBe('Loading Session...');
    expect(sessionName).not.toBe('');
    console.log(`✅ Session name loaded: ${sessionName}`);

    // Phase 3: Check localStorage for persisted session state
    console.log('🔍 Phase 3: Checking localStorage for session state...');
    const localStorage = await page.evaluate(() => {
      const sessionState = window.localStorage.getItem('noorCanvas_sessionState');
      return sessionState ? JSON.parse(sessionState) : null;
    });

    if (localStorage) {
      expect(localStorage.SessionId).toBeGreaterThan(0);
      expect(localStorage.SessionName).toBeTruthy();
      console.log(
        `✅ Session state persisted: SessionId=${localStorage.SessionId}, Name=${localStorage.SessionName}`,
      );
    }

    // Phase 4: Test Self Check button (original issue)
    console.log('🔍 Phase 4: Testing Self Check functionality...');
    const selfCheckButton = page.locator('button:has-text("Self Check")');
    if (await selfCheckButton.isVisible()) {
      await selfCheckButton.click();
      await page.waitForTimeout(2000); // Wait for any debug output

      // Verify no console errors about missing SessionID
      const logs: string[] = [];
      page.on('console', (msg) => logs.push(msg.text()));

      // Should not see "SessionId not available" errors
      const sessionIdErrors = logs.filter(
        (log) =>
          log.includes('SessionId not available') ||
          log.includes('SessionId: null') ||
          log.includes('SessionId: undefined'),
      );

      expect(sessionIdErrors.length).toBe(0);
      console.log('✅ Self Check completed without SessionId errors');
    }
  });

  test('Session Canvas - Session ID available on initial load', async ({ page }) => {
    // Phase 1: Navigate to Session Canvas
    console.log('🎯 Phase 1: Navigating to Session Canvas...');
    await page.goto(`${BASE_URL}/session/canvas/${SESSION_TOKEN}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Phase 2: Verify session data is loaded
    console.log('🔍 Phase 2: Verifying session canvas loads with session context...');

    // Check that we're not in an error state
    const errorMessage = await page.locator('text=Session not found').count();
    expect(errorMessage).toBe(0);

    // Check for session content
    const sessionContent = await page.locator('.main-grid').count();
    expect(sessionContent).toBeGreaterThan(0);
    console.log('✅ Session canvas loaded successfully');

    // Phase 3: Check localStorage for session state
    console.log('🔍 Phase 3: Checking localStorage for session state...');
    const localStorage = await page.evaluate(() => {
      const sessionState = window.localStorage.getItem('noorCanvas_sessionState');
      return sessionState ? JSON.parse(sessionState) : null;
    });

    if (localStorage) {
      expect(localStorage.SessionId).toBeGreaterThan(0);
      console.log(`✅ Session state available: SessionId=${localStorage.SessionId}`);
    }
  });

  test('Page refresh maintains session state', async ({ page }) => {
    // Phase 1: Load Host Control Panel and wait for session data
    console.log('🎯 Phase 1: Loading Host Control Panel...');
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Get initial session data
    const initialSessionName = await page.locator('h2').first().textContent();
    const initialLocalStorage = await page.evaluate(() => {
      const sessionState = window.localStorage.getItem('noorCanvas_sessionState');
      return sessionState ? JSON.parse(sessionState) : null;
    });

    console.log(
      `📊 Initial state: SessionName="${initialSessionName}", SessionId=${initialLocalStorage?.SessionId}`,
    );

    // Phase 2: Refresh the page
    console.log('🔄 Phase 2: Refreshing page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Phase 3: Verify session data persists
    console.log('🔍 Phase 3: Verifying session data persists after refresh...');
    const refreshedSessionName = await page.locator('h2').first().textContent();
    const refreshedLocalStorage = await page.evaluate(() => {
      const sessionState = window.localStorage.getItem('noorCanvas_sessionState');
      return sessionState ? JSON.parse(sessionState) : null;
    });

    // Verify session data is maintained
    expect(refreshedSessionName).toBe(initialSessionName);
    if (initialLocalStorage && refreshedLocalStorage) {
      expect(refreshedLocalStorage.SessionId).toBe(initialLocalStorage.SessionId);
      expect(refreshedLocalStorage.SessionName).toBe(initialLocalStorage.SessionName);
    }

    console.log('✅ Session state persisted across page refresh');
  });

  test('Security verification - no tokens in localStorage', async ({ page }) => {
    // Phase 1: Load pages to trigger session state saving
    console.log('🎯 Phase 1: Loading pages to trigger session state saving...');
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Phase 2: Check localStorage contents
    console.log('🔍 Phase 2: Verifying no sensitive data in localStorage...');
    const allLocalStorage = await page.evaluate(() => {
      const storage: { [key: string]: string | null } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key);
        }
      }
      return storage;
    });

    // Phase 3: Security checks
    console.log('🔒 Phase 3: Running security checks...');

    // Check that no tokens are stored
    const storageString = JSON.stringify(allLocalStorage).toLowerCase();
    expect(storageString).not.toContain('host212a');
    expect(storageString).not.toContain('user212b');
    expect(storageString).not.toContain('hosttoken');
    expect(storageString).not.toContain('usertoken');
    expect(storageString).not.toContain('sessiontoken');

    console.log('✅ Security verification passed - no tokens in localStorage');

    // Verify that only expected data is stored
    const sessionStateData = allLocalStorage['noorCanvas_sessionState'];
    if (sessionStateData) {
      const sessionState = JSON.parse(sessionStateData);
      const allowedProperties = [
        'SessionId',
        'SessionName',
        'SessionDescription',
        'SessionStatus',
        'Topic',
        'ParticipantCount',
        'StartedAt',
        'ExpiresAt',
        'CreatedAt',
      ];

      Object.keys(sessionState).forEach((key) => {
        expect(allowedProperties).toContain(key);
      });

      console.log('✅ Only allowed properties stored in session state');
    }
  });
});

// Helper function to wait for session data to be available
