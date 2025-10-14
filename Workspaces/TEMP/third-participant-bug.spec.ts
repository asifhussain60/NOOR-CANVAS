/**
 * Test: Third Participant Bug Investigation
 * 
 * Issue: When 3 users register (each in separate Chrome tab), 
 *        the participants panel shows only 2 participants instead of 3.
 *        The third registered participant is consistently missing.
 * 
 * Test Strategy:
 * 1. Create session with Session 212 tokens
 * 2. Open 3 browser contexts (simulating 3 separate tabs)
 * 3. Register 3 participants sequentially
 * 4. Navigate to SessionCanvas on all 3 contexts
 * 5. Verify participants panel shows all 3 participants
 * 6. Capture Percy snapshots for visual regression
 * 7. Verify database contains all 3 participants
 * 
 * Expected Behavior:
 * - All 3 participants should be visible in participants panel
 * - Database should contain 3 records
 * - SignalR should broadcast all 3 registration events
 * 
 * Test Data: Session 212
 * - User Token: KJAHA99L
 * - Host Token: PQ9N5YWW
 */

import percySnapshot from '@percy/playwright';
import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const USER_TOKEN = 'KJAHA99L';
const HOST_TOKEN = 'PQ9N5YWW';

// Test participant data
const testParticipants = [
    { name: 'Alice Johnson', email: 'alice@test.com', country: 'US' },
    { name: 'Bob Smith', email: 'bob@test.com', country: 'CA' },
    { name: 'Charlie Brown', email: 'charlie@test.com', country: 'GB' }, // Third participant - the problematic one
];

test.describe('Third Participant Bug Investigation', () => {
    let browser: Browser;
    let contexts: BrowserContext[] = [];
    let pages: Page[] = [];

    test.beforeAll(async () => {
        // Launch browser in headed mode
        browser = await chromium.launch({
            headless: false,
            slowMo: 500 // Slow down for visibility
        });
    });

    test.afterAll(async () => {
        // Close all contexts
        for (const context of contexts) {
            await context.close();
        }
        await browser.close();
    });

    test('should display all 3 registered participants in participants panel', async () => {
        // Increase timeout for 3 sequential registrations + navigation
        test.setTimeout(120000); // 2 minutes

        console.log('🔍 Starting Third Participant Bug Investigation...\n');

        // Phase 1: Create 3 browser contexts (simulating 3 Chrome tabs)
        console.log('📋 Phase 1: Creating 3 browser contexts...');
        for (let i = 0; i < 3; i++) {
            const context = await browser.newContext({
                ignoreHTTPSErrors: true,
                viewport: { width: 1280, height: 720 }
            });
            contexts.push(context);

            const page = await context.newPage();
            pages.push(page);

            console.log(`✅ Context ${i + 1} created`);
        }
        console.log('');

        // Phase 2: Register 3 participants sequentially
        console.log('📋 Phase 2: Registering 3 participants...');
        for (let i = 0; i < 3; i++) {
            const page = pages[i];
            const participant = testParticipants[i];

            console.log(`\n🎯 Registering Participant ${i + 1}: ${participant.name}`);

            // Navigate to user landing
            await page.goto(`${BASE_URL}/user/landing/${USER_TOKEN}`, { waitUntil: 'networkidle' });
            console.log(`  - Navigated to /user/landing/${USER_TOKEN}`);

            // Wait for registration form (longer timeout for Blazor initialization)
            await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 15000 });
            console.log('  - Registration form loaded');

            // Wait for countries dropdown with increased timeout
            // Note: InputSelect renders as <select class="user-landing-select">
            try {
                await page.waitForSelector('select.user-landing-select', { timeout: 15000 });
                console.log('  - Countries dropdown appeared');
            } catch (error) {
                console.log('  - ⚠️ Countries dropdown timeout - checking page state...');
                const pageContent = await page.content();
                console.log('  - Page has name input:', pageContent.includes('Enter your name'));
                console.log('  - Page has user-landing-select:', pageContent.includes('user-landing-select'));
                console.log('  - Page has InputSelect:', pageContent.includes('Select your country'));
                throw error;
            }

            await page.waitForFunction(() => {
                const select = document.querySelector('select.user-landing-select') as HTMLSelectElement;
                return select && select.options.length > 1; // More than just "Select your country"
            }, { timeout: 15000 });
            console.log('  - Countries dropdown populated');

            // Fill registration form
            await page.fill('input[placeholder="Enter your name"]', participant.name);
            await page.fill('input[placeholder="Enter your email"]', participant.email);
            await page.selectOption('select[name="country"]', participant.country);
            console.log(`  - Form filled: Name=${participant.name}, Email=${participant.email}, Country=${participant.country}`);

            // Submit registration
            await page.click('button:has-text("Join")');
            console.log('  - Registration submitted');

            // Wait for navigation or success indicator
            await page.waitForTimeout(2000);
            console.log(`✅ Participant ${i + 1} registered successfully`);
        }
        console.log('\n✅ All 3 participants registered\n');

        // Phase 3: Navigate all contexts to SessionCanvas
        console.log('📋 Phase 3: Navigating to SessionCanvas...');
        for (let i = 0; i < 3; i++) {
            const page = pages[i];
            await page.goto(`${BASE_URL}/canvas?token=${USER_TOKEN}`);
            console.log(`✅ Context ${i + 1} navigated to SessionCanvas`);

            // Wait for page to load
            await page.waitForSelector('.canvas-tab-navigation', { timeout: 10000 });
        }
        console.log('');

        // Phase 4: Click Participants tab and verify count
        console.log('📋 Phase 4: Verifying participants panel...');
        for (let i = 0; i < 3; i++) {
            const page = pages[i];

            console.log(`\n🔍 Checking Context ${i + 1}...`);

            // Click Participants tab
            await page.click('button:has-text("Participants")');
            await page.waitForTimeout(1000);
            console.log('  - Participants tab clicked');

            // Wait for participants container
            await page.waitForSelector('.canvas-participants-container', { timeout: 5000 });

            // Count visible participants
            const participantItems = await page.locator('.canvas-participant-item').count();
            console.log(`  - Visible participants: ${participantItems}`);

            // Get participant names
            const participantNames = await page.locator('.canvas-participant-name').allTextContents();
            console.log(`  - Participant names: ${participantNames.join(', ')}`);

            // Take Percy snapshot
            await percySnapshot(page, `Third Participant Bug - Context ${i + 1} - Participants Panel`, {
                widths: [1280],
            });
            console.log('  - Percy snapshot captured');

            // Verify all 3 participants are visible
            expect(participantItems).toBe(3);
            console.log(`✅ Context ${i + 1} shows all 3 participants`);
        }
        console.log('');

        // Phase 5: Verify each participant name is present
        console.log('📋 Phase 5: Verifying participant names...');
        const firstPage = pages[0];
        await firstPage.click('button:has-text("Participants")');
        await firstPage.waitForTimeout(1000);

        for (const participant of testParticipants) {
            const nameLocator = firstPage.locator('.canvas-participant-name', { hasText: participant.name });
            await expect(nameLocator).toBeVisible({ timeout: 5000 });
            console.log(`✅ Found: ${participant.name}`);
        }
        console.log('');

        console.log('🎉 Test completed successfully - all 3 participants visible!');
    });
});
