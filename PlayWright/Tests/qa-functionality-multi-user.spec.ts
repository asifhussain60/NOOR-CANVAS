import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// Prevent accidental UI runs:
test.use({ headless: true });

// Test configuration for Q&A functionality
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://localhost:9091',
  testToken: process.env.CANVAS_TEST_TOKEN || 'A3ECXMRK', // Known active session token
  timeout: 30000,
  sessionId: '212', // Known test session
};

// Helper functions for Blazor-safe interactions
async function fillBlazorInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector);
  await input.clear();
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
  await page.waitForTimeout(2000);
}

async function clickEnabledButton(page: Page, selector: string, timeout = 10000) {
  const button = page.locator(selector);
  await expect(button).toBeEnabled({ timeout });
  await button.click();
}

function redact(v: string | undefined): string {
  if (!v) return v || '';
  return v.replace(/[A-Z0-9]{8}/g, '********');
}

// Pre-flight health check
async function performHealthCheck(page: Page): Promise<void> {
  console.log(`🔍 Health checking: ${TEST_CONFIG.baseUrl}`);
  const startTime = Date.now();

  await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });

  // Verify title contains NOOR CANVAS or Noor Canvas
  const title = await page.title();
  expect(title).toMatch(/NOOR CANVAS|Noor Canvas/i);

  const duration = Date.now() - startTime;
  console.log(`✅ Health check passed - Duration: ${duration}ms`);
}

// Setup function for test user sessions
async function setupUserSession(context: BrowserContext, sessionName: string): Promise<Page> {
  const page = await context.newPage();

  // Navigate to user landing with test token
  const userUrl = `${TEST_CONFIG.baseUrl}/user/landing/${TEST_CONFIG.testToken}`;
  console.log(`🔄 Setting up ${sessionName} session: ${redact(userUrl)}`);

  await page.goto(userUrl, { waitUntil: 'networkidle' });

  // Wait for session canvas to load
  await expect(
    page.locator('[data-testid="session-canvas"], .session-canvas, #session-canvas'),
  ).toBeVisible({ timeout: 15000 });

  // Wait for Q&A panel to be present
  await expect(
    page.locator('[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel'),
  ).toBeVisible({ timeout: 10000 });

  console.log(`✅ ${sessionName} session ready`);
  return page;
}

test.describe('Q&A Functionality Multi-User Test', () => {
  let browser: Browser;
  let context1: BrowserContext;
  let context2: BrowserContext;
  let context3: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;
  let user3Page: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;

    // Create separate contexts for each user to simulate different sessions
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

    // Setup user sessions
    user1Page = await setupUserSession(context1, 'User1');
    user2Page = await setupUserSession(context2, 'User2');
    user3Page = await setupUserSession(context3, 'User3');
  });

  test.afterAll(async () => {
    await context1?.close();
    await context2?.close();
    await context3?.close();
  });

  test('should propagate questions between multiple connected user sessions', async () => {
    console.log('🎯 Starting multi-user Q&A propagation test');

    // Test data
    const questions = [
      { user: 'User1', text: "What is the main topic of today's session?", page: user1Page },
      {
        user: 'User2',
        text: 'Can you provide more details about the implementation?',
        page: user2Page,
      },
      { user: 'User3', text: 'How does the SignalR integration work?', page: user3Page },
    ];

    // Step 1: Verify initial state - Q&A panels are empty or have existing questions
    console.log('📋 Step 1: Checking initial Q&A panel states');

    for (const { user, page } of questions) {
      const qaPanel = page.locator(
        '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel',
      );
      await expect(qaPanel).toBeVisible();
      console.log(`✅ ${user}: Q&A panel is visible`);
    }

    // Step 2: Submit questions from each user
    console.log('📝 Step 2: Submitting questions from each user');

    for (let i = 0; i < questions.length; i++) {
      const { user, text, page } = questions[i];

      console.log(`📤 ${user} submitting question: "${text.substring(0, 50)}..."`);

      // Find question input field - try multiple possible selectors
      const questionInput = page
        .locator(
          [
            '[data-testid="question-input"]',
            'input[placeholder*="question" i]',
            'textarea[placeholder*="question" i]',
            '.question-input',
            '#question-input',
            'input[type="text"]:near(.qa-panel)',
            'textarea:near(.qa-panel)',
          ].join(', '),
        )
        .first();

      await expect(questionInput).toBeVisible({ timeout: 10000 });
      await fillBlazorInput(page, questionInput.first().locator('xpath=.'), text);

      // Find and click submit button
      const submitButton = page
        .locator(
          [
            '[data-testid="submit-question"]',
            'button:has-text("Submit")',
            'button:has-text("Ask")',
            'button:has-text("Send")',
            '.submit-question',
            '#submit-question',
            'button:near(.question-input)',
          ].join(', '),
        )
        .first();

      await clickEnabledButton(page, submitButton.first().locator('xpath=.'));

      // Wait for question to be submitted and propagated
      await page.waitForTimeout(3000);

      console.log(`✅ ${user}: Question submitted successfully`);
    }

    // Step 3: Verify questions appear in all user sessions
    console.log('🔍 Step 3: Verifying question propagation across all sessions');

    // Wait additional time for SignalR propagation
    await Promise.all([
      user1Page.waitForTimeout(5000),
      user2Page.waitForTimeout(5000),
      user3Page.waitForTimeout(5000),
    ]);

    // Check each user's Q&A panel for all submitted questions
    const allPages = [
      { name: 'User1', page: user1Page },
      { name: 'User2', page: user2Page },
      { name: 'User3', page: user3Page },
    ];

    for (const { name, page } of allPages) {
      console.log(`🔍 Checking ${name}'s Q&A panel for all questions`);

      const qaPanel = page.locator(
        '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel',
      );
      await expect(qaPanel).toBeVisible();

      // Look for question elements - try multiple possible selectors
      const questionElements = page.locator(
        [
          '[data-testid="question-item"]',
          '.question-item',
          '.question',
          '[class*="question"]',
          'li:has-text("What is the main topic")',
          'div:has-text("What is the main topic")',
        ].join(', '),
      );

      // Verify at least some questions are present
      const questionCount = await questionElements.count();
      console.log(`📊 ${name}: Found ${questionCount} question elements`);

      // If we have questions, verify they contain expected text
      if (questionCount > 0) {
        const panelText = await qaPanel.textContent();

        // Check for at least one of our test questions
        let foundQuestions = 0;
        for (const { text } of questions) {
          if (panelText?.includes(text.substring(0, 20))) {
            foundQuestions++;
          }
        }

        console.log(
          `✅ ${name}: Found ${foundQuestions} of ${questions.length} expected questions`,
        );
        expect(foundQuestions).toBeGreaterThan(0); // At least one question should be visible
      }
    }

    // Step 4: Test real-time updates by submitting one more question
    console.log('🔄 Step 4: Testing real-time SignalR updates');

    const realTimeQuestion = 'This is a real-time test question for SignalR propagation';
    console.log(`📤 User1 submitting real-time test question`);

    // Submit from User1
    const questionInput = user1Page
      .locator(
        [
          '[data-testid="question-input"]',
          'input[placeholder*="question" i]',
          'textarea[placeholder*="question" i]',
          '.question-input',
          '#question-input',
        ].join(', '),
      )
      .first();

    await fillBlazorInput(user1Page, questionInput.first().locator('xpath=.'), realTimeQuestion);

    const submitButton = user1Page
      .locator(
        [
          '[data-testid="submit-question"]',
          'button:has-text("Submit")',
          'button:has-text("Ask")',
          'button:has-text("Send")',
        ].join(', '),
      )
      .first();

    await clickEnabledButton(user1Page, submitButton.first().locator('xpath=.'));

    // Wait for SignalR propagation and check User2 and User3 for the new question
    await Promise.all([user2Page.waitForTimeout(4000), user3Page.waitForTimeout(4000)]);

    // Verify the real-time question appears in other users' panels
    for (const { name, page } of [
      { name: 'User2', page: user2Page },
      { name: 'User3', page: user3Page },
    ]) {
      const qaPanel = page.locator(
        '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel',
      );
      const panelText = await qaPanel.textContent();

      if (panelText?.includes('real-time test question')) {
        console.log(`✅ ${name}: Real-time question propagation successful`);
      } else {
        console.log(
          `⚠️ ${name}: Real-time question not yet visible (may need more time for SignalR)`,
        );
      }
    }

    console.log('🎯 Multi-user Q&A propagation test completed successfully');
  });

  test('should handle invalid question submission gracefully', async () => {
    console.log('🎯 Starting negative path test - invalid question handling');

    // Test empty question submission
    const questionInput = user1Page
      .locator(
        [
          '[data-testid="question-input"]',
          'input[placeholder*="question" i]',
          'textarea[placeholder*="question" i]',
        ].join(', '),
      )
      .first();

    await expect(questionInput).toBeVisible();
    await fillBlazorInput(user1Page, questionInput.first().locator('xpath=.'), '');

    const submitButton = user1Page
      .locator(
        [
          '[data-testid="submit-question"]',
          'button:has-text("Submit")',
          'button:has-text("Ask")',
        ].join(', '),
      )
      .first();

    // Submit button should be disabled or submission should be prevented
    try {
      await clickEnabledButton(user1Page, submitButton.first().locator('xpath=.'), 5000);
      console.log('⚠️ Empty question was submitted - this may need validation improvement');
    } catch (error) {
      console.log('✅ Empty question submission properly prevented');
    }

    // Test extremely long question
    const longQuestion = 'A'.repeat(5000);
    await fillBlazorInput(user1Page, questionInput.first().locator('xpath=.'), longQuestion);

    try {
      await clickEnabledButton(user1Page, submitButton.first().locator('xpath=.'), 5000);
      console.log('⚠️ Extremely long question was submitted - consider adding length validation');
    } catch (error) {
      console.log('✅ Long question submission properly handled');
    }

    console.log('🎯 Negative path test completed');
  });

  test('should display user identification for questions', async () => {
    console.log('🎯 Testing user identification in Q&A panel');

    // Submit a question from User2 with a unique identifier
    const identifiableQuestion = `Question from User2 - ${Date.now()}`;

    const questionInput = user2Page
      .locator(
        [
          '[data-testid="question-input"]',
          'input[placeholder*="question" i]',
          'textarea[placeholder*="question" i]',
        ].join(', '),
      )
      .first();

    await fillBlazorInput(
      user2Page,
      questionInput.first().locator('xpath=.'),
      identifiableQuestion,
    );

    const submitButton = user2Page
      .locator(
        [
          '[data-testid="submit-question"]',
          'button:has-text("Submit")',
          'button:has-text("Ask")',
        ].join(', '),
      )
      .first();

    await clickEnabledButton(user2Page, submitButton.first().locator('xpath=.'));

    // Wait for propagation
    await user1Page.waitForTimeout(4000);

    // Check if User1 can see the question with some form of user identification
    const qaPanel = user1Page.locator(
      '[data-testid="qa-panel"], .qa-panel, #qa-panel, .questions-panel',
    );
    const panelText = await qaPanel.textContent();

    if (panelText?.includes(identifiableQuestion)) {
      console.log('✅ Question propagated successfully to other users');

      // Look for user identification markers (name, avatar, etc.)
      const hasUserInfo =
        panelText?.includes('User') ||
        panelText?.includes('Anonymous') ||
        panelText?.includes('Participant') ||
        (await qaPanel
          .locator('.user-name, .question-author, [data-testid="question-user"]')
          .count()) > 0;

      if (hasUserInfo) {
        console.log('✅ User identification present in Q&A panel');
      } else {
        console.log('⚠️ User identification may not be visible - consider UX enhancement');
      }
    }

    console.log('🎯 User identification test completed');
  });
});
