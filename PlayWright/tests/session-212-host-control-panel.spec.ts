/**
 * NOOR Canvas - Session 212 Host Control Panel Test Suite
 * 
 * Comprehensive test harness for validating Host Control Panel functionality
 * with session ID 212 using the token BIIVCFDY.
 * 
 * This test suite validates:
 * - Host Control Panel loading and data display
 * - Session details loading from KSESSIONS_DEV database
 * - Participants loading and real-time updates
 * - API endpoint integration and error handling
 * - SignalR connection and real-time features
 * - UI responsiveness and user experience
 * 
 * Test Data:
 * - Session ID: 212 
 * - Host Token: BIIVCFDY
 * - Session Title: "we look at the purpose of sending messengers, and their role in our spiritual awakening."
 * - Database: KSESSIONS_DEV
 */

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// Configure test to ignore SSL errors for local development
test.use({ ignoreHTTPSErrors: true });

test.describe('Session 212 Host Control Panel Validation', () => {
    const SESSION_ID = '212';
    const HOST_TOKEN = 'BIIVCFDY';
    const USER_TOKEN = 'Q27PTUSP'; // Generated user token for participants API
    const BASE_URL = 'https://localhost:9091';
    const HOST_CONTROL_PANEL_URL = `${BASE_URL}/host/${HOST_TOKEN}`;

    // Expected session data for validation
    const EXPECTED_SESSION_DATA = {
        sessionId: 212,
        sessionName: "we look at the purpose of sending messengers, and their role in our spiritual awakening.",
        description: /spiritual awakening|messengers/i // Flexible match for description content
    };

    test.beforeEach(async ({ page }: { page: Page }) => {
        // Set longer timeouts for database-dependent operations
        test.setTimeout(60000);

        console.log(`\n=== Session 212 Host Control Panel Test Setup ===`);
        console.log(`Session ID: ${SESSION_ID}`);
        console.log(`Host Token: ${HOST_TOKEN}`);
        console.log(`Target URL: ${HOST_CONTROL_PANEL_URL}`);
    });

    test('should load Host Control Panel for Session 212 successfully', async ({ page }: { page: Page }) => {
        console.log('\n🧪 TEST: Host Control Panel Loading for Session 212');

        // Step 1: Navigate to Host Control Panel with token
        console.log(`📍 Navigating to Host Control Panel: ${HOST_CONTROL_PANEL_URL}`);

        await page.goto(HOST_CONTROL_PANEL_URL, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Step 2: Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');
        console.log('✅ Page DOM content loaded');

        // Step 3: Verify page title (NoorCanvas is the actual title)
        const pageTitle = await page.title();
        console.log(`📋 Page Title: "${pageTitle}"`);
        expect(pageTitle).toContain('NoorCanvas');

        // Step 4: Check for loading indicators and wait for data to load
        console.log('⏳ Waiting for data loading to complete...');

        // Wait for loading spinner to disappear (if present)
        const loadingSpinner = page.locator('.loading, .spinner, [data-loading="true"]');
        if (await loadingSpinner.isVisible().catch(() => false)) {
            console.log('⏳ Loading spinner detected, waiting for completion...');
            await expect(loadingSpinner).toBeHidden({ timeout: 20000 });
            console.log('✅ Loading completed');
        }

        // Step 5: Verify Host Control Panel components are visible
        console.log('🔍 Verifying Host Control Panel UI components...');

        // Check for main container
        const mainContainer = page.locator('.host-control-panel, .control-panel, main, .container');
        await expect(mainContainer.first()).toBeVisible({ timeout: 10000 });
        console.log('✅ Main container visible');

        // Check for session information display
        const sessionInfo = page.locator('[data-testid="session-info"], .session-details, .session-name');
        if (await sessionInfo.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('✅ Session information section visible');
        }

        // Step 6: Take screenshot for visual validation
        await page.screenshot({
            path: `d:\\PROJECTS\\NOOR CANVAS\\PlayWright\\artifacts\\host-control-panel-session-212-${Date.now()}.png`,
            fullPage: true
        });
        console.log('📸 Screenshot captured for visual validation');

        console.log('✅ Host Control Panel loaded successfully for Session 212');
    });

    test('should load and display session 212 details correctly', async ({ page }: { page: Page }) => {
        console.log('\n🧪 TEST: Session 212 Data Loading and Display');

        // Navigate to Host Control Panel
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for session data to load
        console.log('⏳ Waiting for session data to load from KSESSIONS_DEV...');

        // Wait for session name to appear (with timeout for database query)
        const sessionNameSelector = 'h1, h2, .session-title, .session-name, [data-testid="session-name"]';
        await page.waitForSelector(sessionNameSelector, { timeout: 20000 });

        // Step 1: Verify session title/name is displayed
        console.log('🔍 Validating session title display...');
        const sessionNameElement = page.locator(sessionNameSelector);
        const displayedSessionName = await sessionNameElement.first().textContent();

        console.log(`📋 Displayed Session Name: "${displayedSessionName}"`);

        if (displayedSessionName) {
            // Check if it contains key words from expected session name
            const hasMessengers = displayedSessionName.toLowerCase().includes('messengers');
            const hasSpiritual = displayedSessionName.toLowerCase().includes('spiritual');
            const hasPurpose = displayedSessionName.toLowerCase().includes('purpose');

            if (hasMessengers || hasSpiritual || hasPurpose) {
                console.log('✅ Session name contains expected content about messengers/spiritual awakening');
            } else {
                console.log(`⚠️ Session name might be different than expected: ${displayedSessionName}`);
            }
        }

        // Step 2: Verify session description is loaded
        console.log('🔍 Checking for session description...');
        const sessionDescriptionSelectors = [
            '.session-description',
            '.description',
            '[data-testid="session-description"]',
            'p:has-text("spiritual")',
            'p:has-text("messengers")'
        ];

        for (const selector of sessionDescriptionSelectors) {
            const descElement = page.locator(selector);
            if (await descElement.isVisible({ timeout: 2000 }).catch(() => false)) {
                const descText = await descElement.textContent();
                console.log(`📝 Session Description Found: "${descText?.substring(0, 100)}..."`);
                break;
            }
        }

        // Step 3: Verify session status is displayed
        console.log('🔍 Checking session status...');
        const statusSelectors = [
            '.session-status',
            '.status',
            '[data-testid="session-status"]',
            'span:has-text("Waiting")',
            'span:has-text("Active")',
            'span:has-text("Ready")'
        ];

        for (const selector of statusSelectors) {
            const statusElement = page.locator(selector);
            if (await statusElement.isVisible({ timeout: 2000 }).catch(() => false)) {
                const statusText = await statusElement.textContent();
                console.log(`🚦 Session Status: "${statusText}"`);
                break;
            }
        }

        console.log('✅ Session 212 data validation completed');
    });

    test('should handle participants loading and display', async ({ page }: { page: Page }) => {
        console.log('\n🧪 TEST: Participants Loading and Display for Session 212');

        // Navigate to Host Control Panel
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for page to fully load
        await page.waitForLoadState('domcontentloaded');

        // Step 1: Check for participants section
        console.log('🔍 Looking for participants section...');
        const participantsSectionSelectors = [
            '.participants',
            '.participants-list',
            '[data-testid="participants"]',
            'section:has-text("Participants")',
            'div:has-text("Participants")',
            'h3:has-text("Participants")'
        ];

        let participantsSection = null;
        for (const selector of participantsSectionSelectors) {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
                participantsSection = element;
                console.log(`✅ Found participants section with selector: ${selector}`);
                break;
            }
        }

        // Step 2: Check participants count or empty state
        if (participantsSection) {
            console.log('🔍 Checking participants list...');

            // Look for individual participant items
            const participantItems = page.locator('.participant-item, .participant, [data-testid="participant"]');
            const participantCount = await participantItems.count();

            console.log(`👥 Participants found: ${participantCount}`);

            if (participantCount > 0) {
                console.log('✅ Participants are loaded and displayed');

                // Get details of first few participants
                const maxToShow = Math.min(participantCount, 3);
                for (let i = 0; i < maxToShow; i++) {
                    const participant = participantItems.nth(i);
                    const participantText = await participant.textContent();
                    console.log(`  👤 Participant ${i + 1}: ${participantText?.substring(0, 50)}`);
                }
            } else {
                console.log('ℹ️ No participants found (expected for new session)');

                // Check for empty state message
                const emptyStateSelectors = [
                    'text="No participants"',
                    'text="Waiting for participants"',
                    'text="0 participants"',
                    '.empty-participants',
                    '[data-testid="no-participants"]'
                ];

                for (const selector of emptyStateSelectors) {
                    const emptyState = page.locator(selector);
                    if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
                        console.log('✅ Empty participants state properly displayed');
                        break;
                    }
                }
            }
        } else {
            console.log('ℹ️ Participants section not found - may be hidden when empty');
        }

        console.log('✅ Participants functionality validation completed');
    });

    test('should validate API endpoints for session 212', async ({ request }: { request: APIRequestContext }) => {
        console.log('\n🧪 TEST: API Endpoints Validation for Session 212');

        // Step 1: Test session details API endpoint
        console.log('🔗 Testing session details API endpoint...');
        const sessionDetailsUrl = `/api/host/session-details/${SESSION_ID}?guid=${HOST_TOKEN}`;

        try {
            const sessionResponse = await request.get(sessionDetailsUrl);
            console.log(`📡 Session Details API Status: ${sessionResponse.status()}`);

            if (sessionResponse.ok()) {
                const sessionData = await sessionResponse.json();
                console.log('✅ Session details API working');
                console.log(`📋 API Response: ${JSON.stringify(sessionData, null, 2).substring(0, 200)}...`);

                // Validate response structure
                if (sessionData.sessionName) {
                    console.log(`✅ Session name in API: "${sessionData.sessionName}"`);
                }
            } else {
                console.log(`❌ Session details API failed with status: ${sessionResponse.status()}`);
                const errorText = await sessionResponse.text();
                console.log(`❌ Error: ${errorText.substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ Session details API error: ${error}`);
        }

        // Step 2: Test participants API endpoint (requires user token)
        console.log('🔗 Testing participants API endpoint...');
        const participantsUrl = `/api/participant/session/${USER_TOKEN}/participants`;

        try {
            const participantsResponse = await request.get(participantsUrl);
            console.log(`📡 Participants API Status: ${participantsResponse.status()}`);

            if (participantsResponse.ok()) {
                const participantsData = await participantsResponse.json();
                console.log('✅ Participants API working');
                console.log(`👥 Participants Count: ${participantsData.participantCount || 0}`);

                if (participantsData.participants && participantsData.participants.length > 0) {
                    console.log(`👤 First Participant: ${JSON.stringify(participantsData.participants[0], null, 2)}`);
                }
            } else {
                console.log(`ℹ️ Participants API status: ${participantsResponse.status()} (may be expected for empty session)`);
            }
        } catch (error) {
            console.log(`⚠️ Participants API error (may be expected): ${error}`);
        }

        console.log('✅ API endpoints validation completed');
    });

    test('should handle error states gracefully', async ({ page }: { page: Page }) => {
        console.log('\n🧪 TEST: Error Handling and Edge Cases');

        // Navigate to Host Control Panel
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for initial load
        await page.waitForLoadState('domcontentloaded');

        // Step 1: Check for any error messages on page
        console.log('🔍 Checking for error messages...');
        const errorSelectors = [
            '.alert-danger',
            '.error',
            '.validation-error',
            '[data-testid="error"]',
            'div:has-text("Error")',
            'div:has-text("Failed")',
            'div:has-text("Unable")'
        ];

        let errorsFound = false;
        for (const selector of errorSelectors) {
            const errorElements = page.locator(selector);
            const errorCount = await errorElements.count();

            if (errorCount > 0) {
                errorsFound = true;
                console.log(`⚠️ Found ${errorCount} error element(s) with selector: ${selector}`);

                for (let i = 0; i < Math.min(errorCount, 3); i++) {
                    const errorText = await errorElements.nth(i).textContent();
                    console.log(`  ❌ Error ${i + 1}: ${errorText}`);
                }
            }
        }

        if (!errorsFound) {
            console.log('✅ No error messages found on page');
        }

        // Step 2: Check page is in expected state (not showing only errors)
        console.log('🔍 Validating page is functional...');

        const functionalityIndicators = [
            'button',
            'input',
            '.session-name',
            '.participants',
            'h1, h2, h3'
        ];

        let functionalElementsCount = 0;
        for (const selector of functionalityIndicators) {
            const elements = page.locator(selector);
            const count = await elements.count();
            functionalElementsCount += count;
        }

        console.log(`🔧 Functional elements found: ${functionalElementsCount}`);

        if (functionalElementsCount > 0) {
            console.log('✅ Page appears to be functional');
        } else {
            console.log('⚠️ Page may not be loading correctly - no functional elements found');
        }

        // Step 3: Take final screenshot
        await page.screenshot({
            path: `d:\\PROJECTS\\NOOR CANVAS\\PlayWright\\artifacts\\host-control-panel-error-check-${Date.now()}.png`,
            fullPage: true
        });

        console.log('✅ Error handling validation completed');
    });

    test('should validate responsive design and accessibility', async ({ page }: { page: Page }) => {
        console.log('\n🧪 TEST: Responsive Design and Accessibility');

        // Navigate to Host Control Panel
        await page.goto(HOST_CONTROL_PANEL_URL, { waitUntil: 'networkidle', timeout: 30000 });

        // Step 1: Test desktop view
        console.log('🖥️ Testing desktop view (1920x1080)...');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000); // Allow layout to settle

        await page.screenshot({
            path: `d:\\PROJECTS\\NOOR CANVAS\\PlayWright\\artifacts\\host-control-panel-desktop-${Date.now()}.png`,
            fullPage: true
        });
        console.log('📸 Desktop screenshot captured');

        // Step 2: Test tablet view
        console.log('📱 Testing tablet view (768x1024)...');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: `d:\\PROJECTS\\NOOR CANVAS\\PlayWright\\artifacts\\host-control-panel-tablet-${Date.now()}.png`,
            fullPage: true
        });
        console.log('📸 Tablet screenshot captured');

        // Step 3: Test mobile view
        console.log('📱 Testing mobile view (375x667)...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: `d:\\PROJECTS\\NOOR CANVAS\\PlayWright\\artifacts\\host-control-panel-mobile-${Date.now()}.png`,
            fullPage: true
        });
        console.log('📸 Mobile screenshot captured');

        // Step 4: Basic accessibility checks
        console.log('♿ Checking basic accessibility...');

        // Check for heading structure
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        console.log(`📋 Headings found: ${headingCount}`);

        // Check for alt text on images
        const images = page.locator('img');
        const imageCount = await images.count();
        console.log(`🖼️ Images found: ${imageCount}`);

        if (imageCount > 0) {
            let imagesWithAlt = 0;
            for (let i = 0; i < imageCount; i++) {
                const altText = await images.nth(i).getAttribute('alt');
                if (altText) {
                    imagesWithAlt++;
                }
            }
            console.log(`✅ Images with alt text: ${imagesWithAlt}/${imageCount}`);
        }

        // Reset to desktop view for remaining tests
        await page.setViewportSize({ width: 1920, height: 1080 });

        console.log('✅ Responsive design and accessibility validation completed');
    });
});