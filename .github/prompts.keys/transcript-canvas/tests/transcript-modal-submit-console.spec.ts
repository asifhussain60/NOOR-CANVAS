import { test, expect } from '@playwright/test';

// Minimal smoke that opens the modal and clicks submit to assert console breadcrumbs are emitted.
// Uses relative routes and assumes Playwright webServer config manages app start.

test.describe('TranscriptCanvas modal submit console breadcrumbs', () => {
  test('logs click and completion markers', async ({ page }) => {
    // NOTE: Replace the token with the canonical Session 212 user token if needed
    const token = process.env.PW_SESSION_TOKEN ?? 'KJAHA99L';

    const messages: string[] = [];
    const errors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[TRANSCRIPT-CANVAS]')) {
        messages.push(text);
      }
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    await page.goto(`https://localhost:9091/transcript/canvas/${token}`);
    await page.waitForLoadState('networkidle');

    // Open modal via welcome panel button
    await page.getByTitle('Ask a Question').click();

    // Type a sample question
    const textarea = page.getByPlaceholder('Type your question here...');
    await textarea.fill('Playwright smoke question');

    // Click Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Give a short time for logs to appear
    await page.waitForTimeout(500);

    // Validate that our console markers were emitted
    const hasClicked = messages.some((m) => m.includes('Modal Submit clicked'));
    const hasCompleted = messages.some((m) => m.includes('Submit completed'));

    expect(hasClicked, 'Expected click marker to be logged').toBeTruthy();
    expect(hasCompleted, 'Expected completion marker to be logged').toBeTruthy();

    // Ensure no critical console errors surfaced
    const critical = errors.filter((e) =>
      e.includes('SignalR') || e.includes('TypeError') || e.includes('Uncaught')
    );
    expect(critical, `Unexpected console errors: ${critical.join('\n')}`).toHaveLength(0);
  });
});
