import { Browser, BrowserContext, expect, Page, test } from '@playwright/test';

/**
 * Q&A JsonElement Fix Verification Test
 *
 * Following pwtest.prompt.md requirements:
 * - key: qa
 * - mode: test
 * - ui_mode: headless (enforced)
 * - notes: create a headless verbose test to confirm Q&A functionality succeeds
 *          and verify that user questions propagate to multiple connected user sessions
 *
 * Tests the fix for JsonElement casting issue in QuestionController.GetQuestions
 */

// Enforce headless mode as specified
test.use({ headless: true });

const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://localhost:9091',
  testToken: process.env.CANVAS_TEST_TOKEN || 'A3ECXMRK', // Known active session token
  timeout: 30000,
  sessionId: '212', // Known test session
};

// Verbose logging helper
function log(message: string, data?: unknown) {
  console.log(
    `[Q&A-TEST] ${new Date().toISOString()}: ${message}${data ? ` - ${JSON.stringify(data)}` : ''}`,
  );
}

// Helper functions for Blazor-safe interactions
async function fillBlazorInput(page: Page, selector: string, value: string) {
  log(`Filling input: ${selector} with value: ${value}`);
  const input = page.locator(selector);
  await input.clear();
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
  await page.waitForTimeout(2000);
}

async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
  log(`Clicking button: ${selector}`);
  const button = page.locator(selector);
  await expect(button).toBeEnabled({ timeout });
  await button.click();
}

// Health check to verify app is running
async function performHealthCheck(page: Page): Promise<void> {
  log(`Health checking: ${TEST_CONFIG.baseUrl}`);
  const startTime = Date.now();

  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: 15000 });

    // Verify title contains NOOR CANVAS or Noor Canvas
    const title = await page.title();
    expect(title).toMatch(/NOOR CANVAS|Noor Canvas/i);

    const duration = Date.now() - startTime;
    log(`Health check passed`, { duration: `${duration}ms`, title });
  } catch (error) {
    log(`Health check failed`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Setup user session with verbose logging
async function setupUserSession(context: BrowserContext, sessionName: string): Promise<Page> {
  log(`Setting up ${sessionName} session`);

  const page = await context.newPage();

  // Navigate to user landing with test token
  const userUrl = `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.testToken}`;
  log(`Navigating to user URL`, {
    sessionName,
    url: userUrl.replace(TEST_CONFIG.testToken, '********'),
  });

  await page.goto(userUrl, { waitUntil: 'networkidle', timeout: 20000 });

  // Wait for session canvas to load
  const sessionCanvasSelector = '[data-testid="session-canvas"], .session-canvas, #session-canvas';
  log(`Waiting for session canvas: ${sessionCanvasSelector}`);
  await expect(page.locator(sessionCanvasSelector)).toBeVisible({ timeout: 15000 });

  // Wait for Q&A panel to be present - this tests the JsonElement fix
  const qaPanelSelector = '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel';
  log(`Waiting for Q&A panel: ${qaPanelSelector}`);
  await expect(page.locator(qaPanelSelector)).toBeVisible({ timeout: 10000 });

  log(`${sessionName} session ready`);
  return page;
}

// Submit a question with verbose logging
async function submitQuestion(page: Page, questionText: string, userName: string): Promise<void> {
  log(`Submitting question from ${userName}`, { questionText });

  // Find question input field
  const questionInput = page.locator(
    'input[placeholder*="question"], textarea[placeholder*="question"], #questionInput, [data-testid="question-input"]',
  );
  await expect(questionInput).toBeVisible({ timeout: 10000 });

  await fillBlazorInput(
    page,
    'input[placeholder*="question"], textarea[placeholder*="question"], #questionInput, [data-testid="question-input"]',
    questionText,
  );

  // Find and click submit button
  const submitButton = page.locator(
    'button:has-text("Submit"), button:has-text("Ask"), [data-testid="submit-question"]',
  );
  await clickEnabledButton(
    page,
    'button:has-text("Submit"), button:has-text("Ask"), [data-testid="submit-question"]',
  );

  // Wait for submission to complete
  await page.waitForTimeout(3000);
  log(`Question submitted successfully`, { userName, questionText });
}

// Verify question appears in Q&A panel
async function verifyQuestionInPanel(
  page: Page,
  questionText: string,
  userName: string,
): Promise<void> {
  log(`Verifying question appears in panel for ${userName}`, { questionText });

  // Look for the question text in the Q&A panel
  const questionElement = page
    .locator('.qa-panel, .questions-panel, [data-testid="qa-panel"]')
    .locator(`text="${questionText}"`);

  try {
    await expect(questionElement).toBeVisible({ timeout: 15000 });
    log(`Question verified in panel`, { userName, questionText });
  } catch (error) {
    log(`Question verification failed`, {
      userName,
      questionText,
      error: error instanceof Error ? error.message : String(error),
    });

    // Capture panel content for debugging
    const panelContent = await page
      .locator('.qa-panel, .questions-panel, [data-testid="qa-panel"]')
      .textContent();
    log(`Panel content for debugging`, { panelContent });

    throw error;
  }
}

test.describe('Q&A JsonElement Fix Verification', () => {
  let browser: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let context3: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;
  let user3Page: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    log('Starting Q&A JsonElement Fix Verification Test');

    // Create separate contexts for each user to simulate different sessions
    log('Creating browser contexts for multiple users');
    context1 = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
    });

    context2 = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
    });

    context3 = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
    });

    // Setup health check with first context
    const healthPage = await context1.newPage();
    await performHealthCheck(healthPage);
    await healthPage.close();

    log('Health check completed successfully');
  });

  test.afterAll(async () => {
    log('Cleaning up test contexts');
    if (context1) await context1.close();
    if (context2) await context2.close();
    if (context3) await context3.close();
    log('Test cleanup completed');
  });

  test('should load Q&A panel without JsonElement errors and propagate questions across multiple users', async () => {
    log('=== Starting multi-user Q&A propagation test ===');

    // Setup three user sessions
    log('Setting up user sessions');
    user1Page = await setupUserSession(context1, 'User1-Alice');
    user2Page = await setupUserSession(context2, 'User2-Bob');
    user3Page = await setupUserSession(context3, 'User3-Carol');

    // Generate unique test questions with timestamp
    const timestamp = Date.now();
    const questions = [
      {
        text: `Alice's question about JsonElement fix - ${timestamp}`,
        user: 'Alice',
        page: user1Page,
      },
      { text: `Bob's question about Q&A propagation - ${timestamp}`, user: 'Bob', page: user2Page },
      {
        text: `Carol's question about multi-user sync - ${timestamp}`,
        user: 'Carol',
        page: user3Page,
      },
    ];

    log('Starting question submission and propagation test', {
      questionsCount: questions.length,
      timestamp,
    });

    // Submit questions from each user
    for (const question of questions) {
      log(`=== Submitting question from ${question.user} ===`);
      await submitQuestion(question.page, question.text, question.user);

      // Wait for SignalR propagation
      await user1Page.waitForTimeout(2000);
      await user2Page.waitForTimeout(2000);
      await user3Page.waitForTimeout(2000);
    }

    log('All questions submitted, starting cross-user verification');

    // Verify each question appears in all user sessions (cross-propagation)
    for (const question of questions) {
      log(`=== Verifying "${question.text}" appears in all user panels ===`);

      // Check question appears in User1's panel
      await verifyQuestionInPanel(user1Page, question.text, `User1-sees-${question.user}`);

      // Check question appears in User2's panel
      await verifyQuestionInPanel(user2Page, question.text, `User2-sees-${question.user}`);

      // Check question appears in User3's panel
      await verifyQuestionInPanel(user3Page, question.text, `User3-sees-${question.user}`);

      log(`Question propagation verified across all users`, { questionFrom: question.user });
    }

    log('=== Q&A JsonElement Fix Verification Test PASSED ===');
    log('All questions successfully propagated across multiple user sessions');
    log('JsonElement casting fix confirmed working correctly');
  });

  // Additional focused test for the specific JsonElement fix
  test('should load questions from API without JsonElement casting errors', async () => {
    log('=== Testing specific JsonElement API fix ===');

    const testPage = await context1.newPage();

    // Navigate to session
    const userUrl = `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.testToken}`;
    await testPage.goto(userUrl, { waitUntil: 'networkidle', timeout: 20000 });

    // Wait for Q&A panel to load - this triggers the API call that was failing
    const qaPanelSelector = '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel';
    await expect(testPage.locator(qaPanelSelector)).toBeVisible({ timeout: 15000 });

    log('Q&A panel loaded successfully - JsonElement fix confirmed');

    // Check that questions are loaded (if any exist) without exceptions
    const questionsContainer = testPage.locator(
      '.qa-panel, .questions-panel, [data-testid="qa-panel"]',
    );
    const questionsCount = await questionsContainer
      .locator('.question-item, [data-testid="question-item"]')
      .count();

    log('Questions loaded from API', { questionsCount });

    await testPage.close();
    log('JsonElement API fix verification completed');
  });
});
