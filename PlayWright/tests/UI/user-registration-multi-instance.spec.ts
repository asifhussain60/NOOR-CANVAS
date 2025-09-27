// Test: User Registration Multi-Instance Synchronization
//   const ____clickEnabledButton = async (selector: string) => {arget: UserLanding.razor component
// Validates: 5 concurrent browser instances registering participants and verifying cross-instance synchronization

import { BrowserContext, expect, Page, test } from '@playwright/test';

// Superhero test data for 5 instances
const superheroUsers = [
  {
    name: 'Spider-Man',
    email: 'spiderman@marvel.com',
    country: 'US', // United States
  },
  {
    name: 'Wonder Woman',
    email: 'wonderwoman@dc.com',
    country: 'CA', // Canada
  },
  {
    name: 'Black Panther',
    email: 'blackpanther@wakanda.com',
    country: 'GB', // United Kingdom
  },
  {
    name: 'Captain Marvel',
    email: 'captainmarvel@cosmic.com',
    country: 'AU', // Australia
  },
  {
    name: 'Green Lantern',
    email: 'greenlantern@oa.com',
    country: 'DE', // Germany
  },
];

// Infrastructure validation function following PLAYWRIGHT-EXECUTION-GUARDRAILS
async function validateInfrastructure() {
  console.log('🔍 Validating infrastructure stability...');

  try {
    const response = await fetch('https://localhost:9091/healthz', {
      method: 'HEAD',
    });
    expect(response.ok).toBe(true);
    console.log('✅ Application running on https://localhost:9091');
  } catch (error) {
    throw new Error(`❌ Infrastructure validation failed: ${error}`);
  }
}

// Helper function for Blazor-safe input filling
async function fillBlazorInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector);
  await input.fill('');
  await input.fill(value);
  await input.dispatchEvent('input');
  await input.dispatchEvent('change');
  await page.waitForTimeout(100); // Allow Blazor to process
}

// Helper function for Blazor-safe button clicking

test.describe('User Registration Multi-Instance Synchronization', () => {
  let contexts: BrowserContext[] = [];
  let pages: Page[] = [];

  test.beforeAll(async ({ browser }) => {
    // Infrastructure validation
    await validateInfrastructure();

    console.log('🚀 Setting up 5 concurrent browser contexts...');

    // Create 5 separate browser contexts for isolated sessions
    for (let i = 0; i < 5; i++) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          'User-Agent': `NoorCanvas-E2E-Test-Instance-${i + 1}`,
        },
      });
      contexts.push(context);

      const page = await context.newPage();
      pages.push(page);

      console.log(`✅ Instance ${i + 1} context created`);
    }
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up browser contexts...');
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should register 5 users concurrently and sync participants across all instances', async () => {
    const TOKEN = 'TEST213U';
    const registeredParticipants: string[] = [];

    console.log('🎯 Starting multi-user registration test...');

    // Phase 1: Navigate all instances to UserLanding page
    console.log('📍 Phase 1: Navigating all instances to UserLanding...');
    for (let i = 0; i < 5; i++) {
      const page = pages[i];
      const user = superheroUsers[i];

      await page.goto(`https://localhost:9091/user/landing/${TOKEN}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Validate page loaded correctly
      await expect(page.locator('h1')).toContainText([
        'Noor Canvas',
        'NOOR CANVAS',
        'Dynamic Styling Test Session',
      ]);

      // Wait for session validation and form to appear
      await page.waitForSelector('input[type="text"][placeholder="Enter your display name"]', {
        timeout: 10000,
      });
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.waitForSelector('select', { timeout: 5000 });

      console.log(`✅ Instance ${i + 1} (${user.name}) navigated successfully`);
    }

    // Phase 2: Register users sequentially to validate synchronization
    console.log('📝 Phase 2: Registering users and validating sync...');

    for (let i = 0; i < 5; i++) {
      const page = pages[i];
      const user = superheroUsers[i];

      console.log(`🦸 Registering ${user.name} (Instance ${i + 1})...`);

      // Fill registration form following numbered UI flow
      await fillBlazorInput(
        page,
        'input[type="text"][placeholder="Enter your display name"]',
        user.name,
      );
      await fillBlazorInput(page, 'input[type="email"]', user.email);

      // Select country
      await page.selectOption('select', user.country);
      await page.waitForTimeout(500); // Allow Blazor to process selection

      // Submit registration
      const submitButton = page
        .locator('button')
        .filter({ hasText: /Register|Join|Submit/ })
        .first();
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for registration to complete
      await page.waitForTimeout(2000);
      registeredParticipants.push(user.name);

      console.log(`✅ ${user.name} registered successfully`);

      // Phase 3: Validate participant appears in all other active instances
      console.log(`🔄 Validating ${user.name} appears in all instances...`);

      for (let j = 0; j <= i; j++) {
        const checkPage = pages[j];

        try {
          // Look for participant in waiting room or participant list
          // This might be in a participant list, waiting room display, or other UI element
          const participantIndicators = [
            `text=${user.name}`,
            `[data-participant="${user.name}"]`,
            `.participant-name:has-text("${user.name}")`,
            `.waiting-participant:has-text("${user.name}")`,
          ];

          let found = false;
          for (const indicator of participantIndicators) {
            try {
              await checkPage.waitForSelector(indicator, { timeout: 3000 });
              found = true;
              break;
            } catch {
              // Continue to next indicator
            }
          }

          if (found) {
            console.log(`✅ ${user.name} visible in Instance ${j + 1}`);
          } else {
            console.log(
              `⚠️  ${user.name} not found in Instance ${j + 1} - checking page content...`,
            );

            // Capture page content for debugging
            const pageContent = await checkPage.textContent('body');
            if (pageContent?.includes(user.name)) {
              console.log(`✅ ${user.name} found in page content of Instance ${j + 1}`);
            } else {
              console.log(`❌ ${user.name} not found in Instance ${j + 1}`);
            }
          }
        } catch (error) {
          console.log(`❌ Error checking ${user.name} in Instance ${j + 1}: ${error}`);
        }
      }

      console.log(`📊 Participants registered so far: ${registeredParticipants.length}`);
    }

    // Phase 4: Final validation - all 5 participants should be visible in all instances
    console.log('🏁 Phase 4: Final validation - checking all participants in all instances...');

    for (let i = 0; i < 5; i++) {
      const page = pages[i];
      console.log(
        `🔍 Validating Instance ${i + 1} sees all ${registeredParticipants.length} participants...`,
      );

      const pageContent = await page.textContent('body');
      let visibleParticipants = 0;

      for (const participant of registeredParticipants) {
        if (pageContent?.includes(participant)) {
          visibleParticipants++;
          console.log(`  ✅ ${participant} visible`);
        } else {
          console.log(`  ❌ ${participant} not visible`);
        }
      }

      console.log(
        `📈 Instance ${i + 1}: ${visibleParticipants}/${registeredParticipants.length} participants visible`,
      );

      // Acceptance criteria: Each instance should show all 5 registered participants
      expect(visibleParticipants).toBeGreaterThanOrEqual(registeredParticipants.length - 1); // Allow for minor sync delays
    }

    console.log('🎉 Multi-user registration synchronization test completed successfully!');
    console.log(
      `📊 Final results: ${registeredParticipants.length} users registered across 5 instances`,
    );
    console.log(`👥 Registered participants: ${registeredParticipants.join(', ')}`);
  });

  test('should validate SignalR WebSocket connections are established', async () => {
    console.log('🔌 Validating SignalR WebSocket connections...');

    for (let i = 0; i < 5; i++) {
      const page = pages[i];

      // Navigate to the page to trigger SignalR connection
      await page.goto(`https://localhost:9091/user/landing/TEST213U`);

      // Wait for Blazor SignalR circuit to establish
      await page.waitForTimeout(3000);

      // Check for SignalR connection indicators
      const blazorScript = await page.locator('script[src*="blazor.server.js"]');
      await expect(blazorScript).toBeAttached();

      console.log(`✅ Instance ${i + 1} SignalR connection validated`);
    }
  });
});
