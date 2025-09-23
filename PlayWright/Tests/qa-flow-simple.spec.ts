/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      SIMPLIFIED Q&A FLOW TEST (DATABASE DRIVEN)                          ║
 * ║                          Generated: September 23, 2025                                   ║
 * ║                                                                                           ║
 * ║ PURPOSE: Test Q&A flow using existing database session                                   ║
 * ║          1) Use hardcoded session tokens from database                                   ║
 * ║          2) Open HostControlPanel with host token                                        ║
 * ║          3) Start session (change status to "Active")                                    ║
 * ║          4) Open SessionCanvas with user token                                           ║
 * ║          5) Submit question from SessionCanvas                                           ║
 * ║          6) Verify question appears in HostControlPanel Q&A panel                       ║
 * ║                                                                                           ║
 * ║ CONFIGURATION: headless, uses existing database session                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { expect, Page, test } from '@playwright/test';

// Hard stop against accidental UI runs
test.use({ headless: true });

// Use hardcoded session tokens for testing (session 215 from previous tests)
const TEST_SESSION = {
    sessionId: 215,
    hostToken: 'M6DFT51K', // Known host token from database
    userToken: 'QWE12345', // Known user token from database
    hostAuthToken: '9a156a41-1710-4d88-9c78-c3c7b690092d' // Known host auth token
};

/**
 * Wait for element with timeout and detailed logging
 */
async function waitForElementWithLogging(page: Page, selector: string, timeout: number = 10000, description?: string): Promise<void> {
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

        // Log page content
        const bodyText = await page.textContent('body');
        console.log(`📄 Page content: ${bodyText?.substring(0, 500)}...`);

        throw error;
    }
}

/**
 * Fill Blazor input with proper event handling
 */
async function fillBlazorInput(page: Page, selector: string, value: string, description?: string): Promise<void> {
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
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('/hub/')) {
            console.log(`🌐 [${testName}] API Request: ${request.method()} ${url}`);
        }
    });

    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('/hub/')) {
            const status = response.status();
            const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`${statusIcon} [${testName}] API Response: ${response.status()} ${url}`);
        }
    });
}

/**
 * Wait for application to be ready
 */
async function waitForAppReady(page: Page, timeout: number = 15000): Promise<void> {
    console.log('⏳ Waiting for application to be ready...');

    // Wait for basic page load
    await page.waitForLoadState('domcontentloaded');

    // Wait for SignalR scripts to load
    await page.waitForFunction(() => {
        return typeof window !== 'undefined' && document.readyState === 'complete';
    }, { timeout });

    // Small delay for Blazor components to initialize
    await page.waitForTimeout(2000);

    console.log('✅ Application appears ready');
}

test.describe('Q&A Flow End-to-End Tests (Database Driven)', () => {

    test('Complete Q&A Flow: SessionCanvas → HostControlPanel (Using Database Session)', async ({ browser }) => {
        console.log('🎯 Starting Q&A flow test with database session...');
        console.log('📋 Using session:', TEST_SESSION);

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

            const hostUrl = `http://localhost:9091/host/control-panel/${TEST_SESSION.hostToken}`;
            console.log(`🌐 Navigating to: ${hostUrl}`);

            await hostPage.goto(hostUrl);
            await waitForAppReady(hostPage);

            // Verify host panel loaded
            await waitForElementWithLogging(hostPage, 'text=HOST CONTROL PANEL', 10000, 'Host Control Panel header');

            // Verify session info loaded
            await waitForElementWithLogging(hostPage, `text=Session ${TEST_SESSION.sessionId}`, 10000, 'Session title');

            // Look for Start Session button and click it
            const startButton = hostPage.locator('button:has-text("Start Session")');
            const startButtonVisible = await startButton.isVisible({ timeout: 5000 });

            if (startButtonVisible) {
                console.log('🚀 Clicking Start Session button...');
                await startButton.click();

                // Wait for session status to change to "Active"
                await waitForElementWithLogging(hostPage, 'text=Active', 15000, 'Session status Active');
                console.log('✅ Session is now Active');
            } else {
                console.log('ℹ️ Start Session button not found - session may already be active');
                // Check if session is already active
                const activeStatus = await hostPage.locator('text=Active').isVisible({ timeout: 2000 });
                if (activeStatus) {
                    console.log('✅ Session is already Active');
                } else {
                    console.log('⚠️ Session status unclear - proceeding with test');
                }
            }

            // ====================================================================
            // STEP 2: Open SessionCanvas in user context  
            // ====================================================================
            console.log('\n👤 STEP 2: Opening SessionCanvas for user');

            const userUrl = `http://localhost:9091/session/canvas/${TEST_SESSION.userToken}`;
            console.log(`🌐 Navigating to: ${userUrl}`);

            await userPage.goto(userUrl);
            await waitForAppReady(userPage);

            // Verify session canvas loaded
            await waitForElementWithLogging(userPage, 'text=NOOR Canvas', 10000, 'Session Canvas header');

            // Verify session info
            await waitForElementWithLogging(userPage, `text=Session ${TEST_SESSION.sessionId}`, 10000, 'User session title');

            // ====================================================================
            // STEP 3: Submit question from SessionCanvas
            // ====================================================================
            console.log('\n❓ STEP 3: Submitting question from SessionCanvas');

            // Look for Q&A panel - it might be collapsed initially
            try {
                const qaToggle = userPage.locator('button:has-text("I have a question"), button:has-text("Q&A")');
                if (await qaToggle.isVisible({ timeout: 5000 })) {
                    console.log('🔧 Expanding Q&A panel...');
                    await qaToggle.click();
                    await userPage.waitForTimeout(1000);
                }
            } catch (error) {
                console.log('ℹ️ Q&A panel toggle not found or already expanded');
            }

            // Look for question input field with multiple possible selectors
            const inputSelectors = [
                'textarea[placeholder*="question"]',
                'input[placeholder*="question"]',
                'textarea[name*="question"]',
                'textarea[id*="question"]',
                'textarea:visible',
                'input[type="text"]:visible'
            ];

            let questionInput = null;
            for (const selector of inputSelectors) {
                try {
                    questionInput = userPage.locator(selector);
                    if (await questionInput.isVisible({ timeout: 2000 })) {
                        console.log(`📝 Found question input with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Question input not found with selector: ${selector}`);
                }
            }

            if (!questionInput || !(await questionInput.isVisible())) {
                // Log page structure for debugging
                console.log('🔍 Searching for form elements...');
                const formElements = await userPage.$$eval('textarea, input[type="text"], input[type="search"]', elements =>
                    elements.map(el => {
                        const htmlEl = el as HTMLElement;
                        return {
                            tagName: htmlEl.tagName,
                            placeholder: (htmlEl as HTMLInputElement).placeholder || '',
                            name: (htmlEl as HTMLInputElement).name || '',
                            id: htmlEl.id,
                            visible: htmlEl.offsetParent !== null
                        };
                    })
                );
                console.log('📋 Form elements found:', formElements);

                throw new Error('Question input field not found');
            }

            const testQuestion = `Test question from QA flow - ${new Date().getTime()}`;
            console.log(`📝 Entering question: ${testQuestion}`);

            await questionInput.fill(testQuestion);

            // Look for submit button
            const submitSelectors = [
                'button:has-text("Submit Question")',
                'button:has-text("Submit")',
                'button[type="submit"]',
                'input[type="submit"]',
                'button:near(textarea)',
                'button:visible'
            ];

            let submitButton = null;
            for (const selector of submitSelectors) {
                try {
                    submitButton = userPage.locator(selector);
                    if (await submitButton.isVisible({ timeout: 2000 })) {
                        console.log(`🎯 Found submit button with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Submit button not found with selector: ${selector}`);
                }
            }

            if (!submitButton || !(await submitButton.isVisible())) {
                throw new Error('Submit button not found');
            }

            console.log('📤 Submitting question...');
            await submitButton.click();

            // Wait a moment for the API call to complete
            await userPage.waitForTimeout(3000);

            // ====================================================================
            // STEP 4: Verify question appears in HostControlPanel
            // ====================================================================
            console.log('\n✅ STEP 4: Verifying question appears in HostControlPanel');

            // Switch back to host panel
            await hostPage.bringToFront();

            // Wait for question to appear in Q&A panel
            console.log('🔍 Looking for question in host Q&A panel...');

            // Look for the question text in various possible locations
            const questionTextSelectors = [
                `text="${testQuestion}"`,
                `text*="${testQuestion.substring(0, 20)}"`, // Partial match
                '[class*="question"] >> text*="Test question"',
                '[id*="qa"] >> text*="Test question"',
                '.qa-panel >> text*="Test question"',
                '*[class*="Questions"] >> text*="Test question"',
                'text*="Test question"'
            ];

            let questionFound = false;
            for (const selector of questionTextSelectors) {
                try {
                    await hostPage.waitForSelector(selector, { timeout: 15000 });
                    console.log(`✅ Question found using selector: ${selector}`);
                    questionFound = true;
                    break;
                } catch (error) {
                    console.log(`❌ Question not found using selector: ${selector}`);
                }
            }

            if (!questionFound) {
                // Log page content for debugging
                console.log('📋 Host page content for debugging:');
                const hostContent = await hostPage.textContent('body');
                console.log('Host page full content:', hostContent);

                // Take screenshots
                await hostPage.screenshot({
                    path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\host-panel-debug-${Date.now()}.png`,
                    fullPage: true
                });

                await userPage.screenshot({
                    path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\user-canvas-debug-${Date.now()}.png`,
                    fullPage: true
                });

                // Check for any error messages in user page
                console.log('📋 User page content for debugging:');
                const userContent = await userPage.textContent('body');
                console.log('User page content snippet:', userContent?.substring(0, 1000));

                throw new Error(`Question "${testQuestion}" was not found in HostControlPanel after submission`);
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
            console.log(`   - Session used: ${TEST_SESSION.sessionId}`);
            console.log(`   - Host token: ${TEST_SESSION.hostToken}`);
            console.log(`   - User token: ${TEST_SESSION.userToken}`);
            console.log(`   - Question submitted: ${testQuestion}`);
            console.log('   - Question successfully displayed in HostControlPanel');

        } catch (error) {
            console.error('❌ Q&A Flow test failed:', error);

            // Take final screenshots for debugging
            try {
                await hostPage.screenshot({
                    path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\error-host-final-${Date.now()}.png`,
                    fullPage: true
                });

                await userPage.screenshot({
                    path: `d:\\PROJECTS\\NOOR CANVAS\\Workspaces\\TEMP\\playwright-artifacts\\error-user-final-${Date.now()}.png`,
                    fullPage: true
                });

                // Log network activity
                console.log('📡 Final network check - checking for failed API calls...');

            } catch (screenshotError) {
                console.log('Failed to take error screenshots:', screenshotError);
            }

            throw error;
        } finally {
            await hostContext.close();
            await userContext.close();
        }
    });
});