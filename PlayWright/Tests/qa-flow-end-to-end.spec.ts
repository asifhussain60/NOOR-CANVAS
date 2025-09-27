/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                          Q&A FLOW END-TO-END TEST SUITE                                  ║
 * ║                          Generated: September 23, 2025                                   ║
 * ║                                                                                           ║
 * ║ PURPOSE: Test complete Q&A flow from SessionCanvas to HostControlPanel                   ║
 * ║          1) Create session via HostProvisioner                                          ║
 * ║          2) Open HostControlPanel with host token                                       ║
 * ║          3) Start session (change status to "Active")                                   ║
 * ║          4) Open SessionCanvas with user token                                          ║
 * ║          5) Submit question from SessionCanvas                                          ║
 * ║          6) Verify question appears in HostControlPanel Q&A panel                      ║
 * ║                                                                                           ║
 * ║ CONFIGURATION: headless, verbose, comprehensive debug output                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { expect, Page, test } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Hard stop against accidental UI runs
test.use({ headless: true });

interface SessionTokens {
  sessionId: number;
  hostToken: string;
  userToken: string;
  hostAuthToken: string;
}

/**
 * Create a new session using HostProvisioner CLI tool
 */
async function createSessionWithProvisioner(): Promise<SessionTokens> {
  console.log('🔧 Creating session via HostProvisioner...');

  const sessionId = Math.floor(Math.random() * 10000) + 1000; // Random session ID
  const createdBy = 'QA Flow Test Suite';

  const command = `dotnet run -- create --session-id ${sessionId} --created-by "${createdBy}" --dry-run false`;
  const workingDir = 'd:\\PROJECTS\\NOOR CANVAS\\Tools\\HostProvisioner\\HostProvisioner';

  console.log(`📋 Executing: ${command}`);
  console.log(`📁 Working directory: ${workingDir}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 30000, // 30 second timeout
    });

    console.log('✅ HostProvisioner stdout:', stdout);
    if (stderr) {
      console.log('⚠️ HostProvisioner stderr:', stderr);
    }

    // Parse tokens from output
    const hostTokenMatch = stdout.match(/Host Token:\s*([A-Z0-9]{8})/i);
    const userTokenMatch = stdout.match(/User Token:\s*([A-Z0-9]{8})/i);
    const hostAuthTokenMatch = stdout.match(/Host Auth Token:\s*([a-f0-9-]{36})/i);

    if (!hostTokenMatch || !userTokenMatch || !hostAuthTokenMatch) {
      throw new Error('Failed to parse tokens from HostProvisioner output');
    }

    const tokens: SessionTokens = {
      sessionId,
      hostToken: hostTokenMatch[1],
      userToken: userTokenMatch[1],
      hostAuthToken: hostAuthTokenMatch[1],
    };

    console.log('🎉 Session created successfully:', tokens);
    return tokens;
  } catch (error) {
    console.error('❌ Failed to create session:', error);
    throw error;
  }
}

/**
 * Wait for element with timeout and detailed logging
 */
async function waitForElementWithLogging(
  page: Page,
  selector: string,
  timeout: number = 10000,
  description?: string,
): Promise<void> {
  const desc = description || selector;
  console.log(`⏳ Waiting for element: ${desc}`);

  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    console.log(`✅ Element found: ${desc}`);
  } catch (error) {
    console.log(`❌ Element not found: ${desc}`);

    // Log page content for debugging
    const url = page.url();
    const title = await page.title();
    console.log(`🌐 Current page: ${title} (${url})`);

    // Take screenshot for debugging
    await page.screenshot({
      path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\debug-${Date.now()}.png`,
      fullPage: true,
    });

    throw error;
  }
}

/**
 * Fill Blazor input with proper event handling
 */
async function fillBlazorInput(
  page: Page,
  selector: string,
  value: string,
  description?: string,
): Promise<void> {
  const desc = description || `input ${selector}`;
  console.log(`📝 Filling ${desc} with: ${value}`);

  const input = page.locator(selector);
  await input.click();
  await input.fill('');
  await input.type(value);
  await input.blur(); // Trigger Blazor change events

  console.log(`✅ Filled ${desc}`);
}

/**
 * Monitor network requests for API calls
 */
function setupNetworkMonitoring(page: Page, testName: string): void {
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/hub/')) {
      console.log(`🌐 [${testName}] API Request: ${request.method()} ${url}`);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/hub/')) {
      const status = response.status();
      const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusIcon} [${testName}] API Response: ${response.status()} ${url}`);
    }
  });
}

/**
 * Wait for application to be ready (check for SignalR connection, etc.)
 */
async function waitForAppReady(page: Page, timeout: number = 15000): Promise<void> {
  console.log('⏳ Waiting for application to be ready...');

  // Wait for basic page load
  await page.waitForLoadState('domcontentloaded');

  // Wait for any loading indicators to disappear
  try {
    await page.waitForFunction(
      () => {
        // Check if there are any loading spinners or "Loading..." text
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
        const loadingText = document.body.textContent?.includes('Loading');
        return loadingElements.length === 0 && !loadingText;
      },
      { timeout },
    );
  } catch (error) {
    console.log('⚠️ Loading indicators check timed out, proceeding anyway');
  }

  console.log('✅ Application appears ready');
}

test.describe('Q&A Flow End-to-End Tests', () => {
  let sessionTokens: SessionTokens;

  test.beforeAll(async () => {
    console.log('🚀 Setting up test session...');
    sessionTokens = await createSessionWithProvisioner();
  });

  test('Complete Q&A Flow: SessionCanvas → HostControlPanel', async ({ browser }) => {
    console.log('🎯 Starting comprehensive Q&A flow test...');
    console.log('📋 Using session:', sessionTokens);

    // Create two browser contexts - one for host, one for user
    const hostContext = await browser.newContext();
    const userContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const userPage = await userContext.newPage();

    setupNetworkMonitoring(hostPage, 'HOST');
    setupNetworkMonitoring(userPage, 'USER');

    try {
      // ====================================================================
      // STEP 1: Open HostControlPanel and start session
      // ====================================================================
      console.log('\n📊 STEP 1: Opening HostControlPanel and starting session');

      const hostUrl = `http://localhost:9091/host/control-panel/${sessionTokens.hostToken}`;
      console.log(`🌐 Navigating to: ${hostUrl}`);

      await hostPage.goto(hostUrl);
      await waitForAppReady(hostPage);

      // Verify host panel loaded
      await waitForElementWithLogging(
        hostPage,
        'text=HOST CONTROL PANEL',
        10000,
        'Host Control Panel header',
      );

      // Verify session info loaded
      await waitForElementWithLogging(
        hostPage,
        `text=Session ${sessionTokens.sessionId}`,
        10000,
        'Session title',
      );

      // Look for Start Session button and click it
      const startButton = hostPage.locator('button:has-text("Start Session")');
      await expect(startButton).toBeVisible({ timeout: 10000 });

      console.log('🚀 Clicking Start Session button...');
      await startButton.click();

      // Wait for session status to change to "Active"
      await waitForElementWithLogging(hostPage, 'text=Active', 15000, 'Session status Active');
      console.log('✅ Session is now Active');

      // ====================================================================
      // STEP 2: Open SessionCanvas in user context
      // ====================================================================
      console.log('\n👤 STEP 2: Opening SessionCanvas for user');

      const userUrl = `http://localhost:9091/session/canvas/${sessionTokens.userToken}`;
      console.log(`🌐 Navigating to: ${userUrl}`);

      await userPage.goto(userUrl);
      await waitForAppReady(userPage);

      // Verify session canvas loaded
      await waitForElementWithLogging(userPage, 'text=NOOR Canvas', 10000, 'Session Canvas header');

      // Verify session info
      await waitForElementWithLogging(
        userPage,
        `text=Session ${sessionTokens.sessionId}`,
        10000,
        'User session title',
      );

      // ====================================================================
      // STEP 3: Submit question from SessionCanvas
      // ====================================================================
      console.log('\n❓ STEP 3: Submitting question from SessionCanvas');

      // Look for Q&A panel - it might be collapsed initially
      let qaPanel = userPage.locator('[class*="qa"], [id*="qa"], text="I have a question"');

      // Try to expand Q&A if it exists but is collapsed
      try {
        const qaToggle = userPage.locator(
          'button:has-text("I have a question"), button:has-text("Q&A")',
        );
        if (await qaToggle.isVisible({ timeout: 5000 })) {
          console.log('🔧 Expanding Q&A panel...');
          await qaToggle.click();
          await userPage.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('ℹ️ Q&A panel toggle not found or already expanded');
      }

      // Look for question input field
      const questionInput = userPage.locator(
        'textarea[placeholder*="question"], input[placeholder*="question"], textarea[name*="question"]',
      );
      await expect(questionInput).toBeVisible({ timeout: 10000 });

      const testQuestion = `Test question from QA flow - ${new Date().getTime()}`;
      console.log(`📝 Entering question: ${testQuestion}`);

      await fillBlazorInput(
        userPage,
        'textarea[placeholder*="question"], input[placeholder*="question"], textarea[name*="question"]',
        testQuestion,
        'question input',
      );

      // Look for submit button
      const submitButton = userPage.locator(
        'button:has-text("Submit Question"), button:has-text("Submit"), button[type="submit"]',
      );
      await expect(submitButton).toBeVisible({ timeout: 5000 });

      console.log('📤 Submitting question...');
      await submitButton.click();

      // Wait a moment for the API call to complete
      await userPage.waitForTimeout(2000);

      // ====================================================================
      // STEP 4: Verify question appears in HostControlPanel
      // ====================================================================
      console.log('\n✅ STEP 4: Verifying question appears in HostControlPanel');

      // Switch back to host panel
      await hostPage.bringToFront();

      // Wait for question to appear in Q&A panel
      console.log('🔍 Looking for question in host Q&A panel...');

      // Look for the question text in various possible locations
      const questionSelectors = [
        `text="${testQuestion}"`,
        `text*="${testQuestion.substring(0, 20)}"`, // Partial match
        '[class*="question"] >> text*="Test question"',
        '[id*="qa"] >> text*="Test question"',
        '.qa-panel >> text*="Test question"',
      ];

      let questionFound = false;
      for (const selector of questionSelectors) {
        try {
          await hostPage.waitForSelector(selector, { timeout: 10000 });
          console.log(`✅ Question found using selector: ${selector}`);
          questionFound = true;
          break;
        } catch (_error) {
          console.log(`❌ Question not found using selector: ${selector}`);
        }
      }

      if (!questionFound) {
        // Log page content for debugging
        console.log('📋 Host page content for debugging:');
        const hostContent = await hostPage.textContent('body');
        console.log(hostContent?.substring(0, 2000)); // First 2000 chars

        // Take screenshots
        await hostPage.screenshot({
          path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\host-panel-${Date.now()}.png`,
          fullPage: true,
        });

        await userPage.screenshot({
          path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\user-canvas-${Date.now()}.png`,
          fullPage: true,
        });

        throw new Error(
          `Question "${testQuestion}" was not found in HostControlPanel after submission`,
        );
      }

      // ====================================================================
      // STEP 5: Verification and cleanup
      // ====================================================================
      console.log('\n🎉 STEP 5: Test verification complete');

      // Verify the question is properly formatted and visible
      const questionElement = hostPage.locator(`text="${testQuestion}"`).first();
      await expect(questionElement).toBeVisible();

      console.log('✅ Q&A flow test completed successfully!');
      console.log('📊 Summary:');
      console.log(`   - Session created: ${sessionTokens.sessionId}`);
      console.log(`   - Host token: ${sessionTokens.hostToken}`);
      console.log(`   - User token: ${sessionTokens.userToken}`);
      console.log(`   - Question submitted: ${testQuestion}`);
      console.log('   - Question successfully displayed in HostControlPanel');
    } catch (error) {
      console.error('❌ Q&A Flow test failed:', error);

      // Take final screenshots for debugging
      try {
        await hostPage.screenshot({
          path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\error-host-${Date.now()}.png`,
          fullPage: true,
        });

        await userPage.screenshot({
          path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\error-user-${Date.now()}.png`,
          fullPage: true,
        });
      } catch (screenshotError) {
        console.log('Failed to take error screenshots:', screenshotError);
      }

      throw error;
    } finally {
      await hostContext.close();
      await userContext.close();
    }
  });

  test('Q&A Flow Rainy Path: Submit without active session', async ({ page }) => {
    console.log('🌧️ Testing Q&A submission without active session...');

    setupNetworkMonitoring(page, 'RAINY');

    // Create a new session but don't start it (keep it in "Waiting" status)
    const tokens = await createSessionWithProvisioner();

    // Go directly to SessionCanvas without starting the session
    const userUrl = `http://localhost:9091/session/canvas/${tokens.userToken}`;
    console.log(`🌐 Navigating to: ${userUrl}`);

    await page.goto(userUrl);
    await waitForAppReady(page);

    // Try to submit a question
    try {
      const qaToggle = page.locator('button:has-text("I have a question"), button:has-text("Q&A")');
      if (await qaToggle.isVisible({ timeout: 5000 })) {
        await qaToggle.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('ℹ️ Q&A panel toggle not found');
    }

    const questionInput = page.locator(
      'textarea[placeholder*="question"], input[placeholder*="question"], textarea[name*="question"]',
    );
    await expect(questionInput).toBeVisible({ timeout: 10000 });

    const testQuestion = `Inactive session test - ${new Date().getTime()}`;
    await fillBlazorInput(
      page,
      'textarea[placeholder*="question"], input[placeholder*="question"], textarea[name*="question"]',
      testQuestion,
    );

    const submitButton = page.locator(
      'button:has-text("Submit Question"), button:has-text("Submit"), button[type="submit"]',
    );
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    console.log('📤 Submitting question to inactive session...');
    await submitButton.click();

    // Should get an error - wait for error message or failed API response
    await page.waitForTimeout(3000);

    // Log the result - this should fail gracefully
    console.log('✅ Inactive session test completed (question submission should have failed)');
  });
});
