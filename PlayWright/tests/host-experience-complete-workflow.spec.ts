/**
 * Host Experience End-to-End Test
 * 
 * Comprehensive test covering the complete host workflow:
 * 1. Host authentication with real database tokens
 * 2. Session opener form with cascading dropdowns
 * 3. Session creation and URL generation
 * 4. Control panel access and data validation
 * 
 * Created: September 21, 2025
 * Purpose: Validate complete host experience using KSESSIONS_DEV database tokens
 */

import { expect, test, type Page } from '@playwright/test';
import { DatabaseTokenManager, type SessionTokenData } from './utils/database-token-manager';
import { EnhancedTestMonitor } from './utils/enhanced-test-monitor';

test.describe('Host Experience - Complete Workflow', () => {
    let sessionData: SessionTokenData | null = null;

    test.beforeEach(async ({ page }) => {
        console.log('🔍 Host Experience Test - Pre-test setup');

        // Get real session data from database
        sessionData = await DatabaseTokenManager.getRandomActiveSession();

        if (!sessionData) {
            console.log('⚠️ No active sessions found, creating test session...');
            sessionData = await DatabaseTokenManager.createTestSession(
                'Playwright Host Experience Test',
                'Playwright Test Suite'
            );
        }

        if (!sessionData) {
            throw new Error('❌ Could not obtain session data from database');
        }

        console.log(`✅ Using session ${sessionData.sessionId} with host token: ${sessionData.hostToken}`);
        console.log(`📊 Session title: ${sessionData.sessionTitle}`);
    });

    test('Complete Host Experience - Authentication to Control Panel', async ({ page }) => {
        test.setTimeout(120000); // Extended timeout for complete workflow

        // Optional: Quick health check before critical test
        const isHealthy = await EnhancedTestMonitor.quickHealthCheck();
        if (!isHealthy) {
            console.log('⚡ Application not responding - attempting restart...');
            const startSuccess = await EnhancedTestMonitor.quickStartApplication();
            if (!startSuccess) {
                throw new Error('❌ Failed to start application for host experience test');
            }
        }

        // ========================================
        // STEP 1: Host Authentication (HostLanding.razor)
        // ========================================
        console.log('🎯 STEP 1: Host Authentication');

        await test.step('Navigate directly to host session opener', async () => {
            // Navigate directly to session opener with host token
            await page.goto(`/host/session-opener/${sessionData!.hostToken}`);

            // Wait for page to load with extended timeout for Blazor Server
            await page.waitForLoadState('networkidle', { timeout: 15000 });

            // Verify we're on the host session opener page
            await expect(page).toHaveTitle(/NoorCanvas/);

            // Verify the session opener form is present
            await expect(page.locator('h1:has-text("Host Session Opener")')).toBeVisible();

            console.log(`✅ Successfully navigated to session opener with token: ${sessionData!.hostToken}`);
        });

        // ========================================
        // STEP 2: Session Opener Form (Host-SessionOpener.razor)
        // ========================================
        console.log('🎯 STEP 2: Session Opener Form');

        await test.step('Complete cascading dropdown selection', async () => {

            // Wait for cascading dropdowns to load (as mentioned in requirements)
            console.log('⏳ Waiting for cascading dropdowns to auto-load...');

            // Wait for Album dropdown to be populated
            await page.waitForSelector('select:has(option:not([value=""]))');
            const albumSelect = page.locator('select').first();
            await expect(albumSelect).toBeVisible();

            // Verify at least one album option is available (wait for options to be present)
            const albumOptions = albumSelect.locator('option:not([value=""])');
            await expect(albumOptions.nth(0)).toHaveAttribute('value', /.+/, { timeout: 10000 });

            console.log('✅ Album dropdown loaded with options');

            // Select the first available album by value
            const firstAlbumValue = await albumOptions.first().getAttribute('value');
            if (firstAlbumValue) {
                await albumSelect.selectOption(firstAlbumValue);
                console.log(`✅ Selected album: ${firstAlbumValue}`);

                // Wait for Category dropdown to populate
                await page.waitForTimeout(2000); // Allow cascading to complete
                const categorySelect = page.locator('select').nth(1);
                const categoryOptions = categorySelect.locator('option:not([value=""])');
                await expect(categoryOptions.nth(0)).toHaveAttribute('value', /.+/, { timeout: 10000 });

                // Select the first available category
                const firstCategoryValue = await categoryOptions.first().getAttribute('value');
                if (firstCategoryValue) {
                    await categorySelect.selectOption(firstCategoryValue);
                    console.log(`✅ Selected category: ${firstCategoryValue}`);

                    // Wait for Session dropdown to populate
                    await page.waitForTimeout(2000); // Allow cascading to complete
                    const sessionSelect = page.locator('select').nth(2);
                    const sessionOptions = sessionSelect.locator('option:not([value=""])');
                    await expect(sessionOptions.nth(0)).toHaveAttribute('value', /.+/, { timeout: 10000 });

                    // Select the first available session
                    const firstSessionValue = await sessionOptions.first().getAttribute('value');
                    if (firstSessionValue) {
                        await sessionSelect.selectOption(firstSessionValue);
                        console.log(`✅ Selected session: ${firstSessionValue}`);
                    }
                }
            }

            console.log('✅ Cascading dropdown selection completed');
        });

        // ========================================
        // STEP 3: Fill Session Details (Date, Time, Duration)
        // ========================================
        console.log('🎯 STEP 3: Session Details');

        await test.step('Fill session details (date, time, duration)', async () => {
            console.log('📅 Setting session date, time, and duration...');

            // Set date to 09/21/2025 (as shown in screenshot)
            const dateInput = page.locator('input[type="date"]');
            await expect(dateInput).toBeVisible();
            await dateInput.fill('2025-09-21');
            console.log('✅ Set date to 2025-09-21');

            // Set start time to 6:00 AM (as shown in screenshot)
            const timeInput = page.locator('input[id*="time"], input[placeholder*="time" i]');
            await expect(timeInput).toBeVisible();
            await timeInput.clear();
            await timeInput.fill('6:00 AM');
            console.log('✅ Set start time to 6:00 AM');

            // Set duration to 60 minutes (as shown in screenshot)
            const durationInput = page.locator('input[type="number"], input[placeholder*="duration" i]');
            await expect(durationInput).toBeVisible();
            await durationInput.clear();
            await durationInput.fill('60');
            console.log('✅ Set duration to 60 minutes');

            // Wait for form validation to complete
            await page.waitForTimeout(1000);

            // Verify all required fields are filled with expected values
            await expect(dateInput).toHaveValue('2025-09-21');
            await expect(timeInput).toHaveValue('6:00 AM');
            await expect(durationInput).toHaveValue('60');

            console.log('✅ All session details filled and validated successfully');
        });

        // ========================================
        // STEP 4: Session Creation
        // ========================================
        console.log('🎯 STEP 4: Session Creation');

        await test.step('Open session and validate URL generation', async () => {
            // Click the "Open Session" button
            const openSessionButton = page.locator('button:has-text("Open Session")');
            await expect(openSessionButton).toBeVisible();
            await openSessionButton.click();

            console.log('✅ Clicked Open Session button');

            // Wait for session URL panel to appear (as shown in pasted image)
            await expect(page.locator('text=Session URL')).toBeVisible({ timeout: 15000 });

            // Verify the generated URL contains a user token
            const sessionUrlElement = page.locator('text*=https://localhost:9091/user/landing/').first();
            await expect(sessionUrlElement).toBeVisible();

            const sessionUrlText = await sessionUrlElement.textContent();
            console.log(`📋 Generated session URL: ${sessionUrlText}`);

            // Validate URL format: should contain user token at the end
            expect(sessionUrlText).toMatch(/https:\/\/localhost:9091\/user\/landing\/[A-Z0-9]{8}/);

            // Extract the user token from the URL
            const userTokenMatch = sessionUrlText?.match(/\/user\/landing\/([A-Z0-9]{8})/);
            const extractedUserToken = userTokenMatch ? userTokenMatch[1] : null;

            console.log(`🎫 Extracted user token: ${extractedUserToken}`);

            // Verify Copy Link button is present
            await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();

            console.log('✅ Session URL generated successfully with user token');
        });

        // ========================================
        // STEP 5: Navigate to Control Panel (HostControlPanel.razor)
        // ========================================
        console.log('🎯 STEP 5: Control Panel Navigation');

        await test.step('Load control panel and validate data', async () => {
            // Click "Load Control Panel" button
            const controlPanelButton = page.locator('button:has-text("Load Control Panel")');
            await expect(controlPanelButton).toBeVisible();
            await controlPanelButton.click();

            console.log('✅ Clicked Load Control Panel button');

            // Wait for navigation to control panel
            await page.waitForURL(/.*\/host\/control-panel\/.*/);

            // Verify we're on the control panel page
            await expect(page).toHaveTitle(/NOOR Canvas.*Host Control Panel/);

            // Verify host control panel elements are loaded
            await expect(page.locator('h2:has-text("Host Control Panel"), h1:has-text("Host Control Panel")')).toBeVisible();

            console.log('✅ Successfully navigated to Host Control Panel');
        });

        await test.step('Validate control panel data and functionality', async () => {
            // Verify session information is displayed
            await expect(page.locator('text*="Session"')).toBeVisible();

            // Check for session management controls
            await expect(page.locator('button:has-text("Start Session"), button:has-text("Begin Session")')).toBeVisible();

            // Verify participants section (may be empty initially)
            const participantsSection = page.locator('text*="Participants", text*="Participant List"');
            if (await participantsSection.isVisible()) {
                console.log('✅ Participants section is visible');
            } else {
                console.log('ℹ️ Participants section not visible (may be empty)');
            }

            // Verify questions section (may be empty initially)
            const questionsSection = page.locator('text*="Questions", text*="Question List"');
            if (await questionsSection.isVisible()) {
                console.log('✅ Questions section is visible');
            } else {
                console.log('ℹ️ Questions section not visible (may be empty)');
            }

            // Check for transcript area (should be present even if empty)
            const transcriptArea = page.locator('[class*="transcript"], [id*="transcript"], text*="Transcript"');
            if (await transcriptArea.isVisible()) {
                console.log('✅ Transcript area is visible');
            }

            // Verify session status indicator
            const sessionStatus = page.locator('text*="Status", text*="Active", text*="Waiting"');
            if (await sessionStatus.isVisible()) {
                const statusText = await sessionStatus.first().textContent();
                console.log(`📊 Session status: ${statusText}`);
            }

            console.log('✅ Control panel validation completed successfully');
        });

        // ========================================
        // STEP 6: Final Validation
        // ========================================
        console.log('🎯 STEP 6: Final Validation');

        await test.step('Verify complete workflow success', async () => {
            // Verify we have successfully completed the entire host experience
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/.*\/host\/control-panel\/.*/);

            // Verify host token in URL matches our database token
            expect(currentUrl).toContain(sessionData!.hostToken);

            console.log(`✅ Complete host experience workflow validated successfully`);
            console.log(`📊 Session ID: ${sessionData!.sessionId}`);
            console.log(`🎫 Host Token: ${sessionData!.hostToken}`);
            console.log(`🔗 Final URL: ${currentUrl}`);
        });
    });

    test.afterEach(async () => {
        console.log('🔄 Host Experience Test - Post-test cleanup');

        if (sessionData) {
            console.log(`📝 Test completed with session ${sessionData.sessionId}`);
        }

        // Database connections are handled by global teardown
    });
});

/**
 * Utility Functions for Host Experience Testing
 */
export class HostExperienceTestUtils {
    /**
     * Wait for cascading dropdown to load with options
     */
    static async waitForDropdownOptions(page: Page, selectIndex: number, timeout: number = 10000): Promise<boolean> {
        try {
            const select = page.locator('select').nth(selectIndex);
            await select.waitFor({ state: 'visible', timeout });

            // Wait for options to be populated
            await expect(select.locator('option:not([value=""])').first()).toBeVisible({ timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Extract token from URL pattern
     */
    static extractTokenFromUrl(url: string, pattern: RegExp): string | null {
        const match = url.match(pattern);
        return match ? match[1] : null;
    }

    /**
     * Validate session URL format
     */
    static validateSessionUrl(url: string): boolean {
        const pattern = /https:\/\/localhost:9091\/user\/landing\/[A-Z0-9]{8}/;
        return pattern.test(url);
    }
}