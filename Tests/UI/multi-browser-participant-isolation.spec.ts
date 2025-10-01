/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                       MULTI-BROWSER PARTICIPANT ISOLATION TEST                           ║
 * ║                         Generated: October 1, 2025 17:24:00                             ║
 * ║                                                                                           ║
 * ║ PURPOSE: Verify that the API-based participant identification approach eliminates        ║
 * ║          the "same name on multiple browsers" issue by ensuring proper isolation         ║
 * ║          between different browser sessions using unique session tokens.                 ║
 * ║                                                                                           ║
 * ║ TARGETS: SessionCanvas.razor, ParticipantController.cs (/api/participant/session/me)   ║
 * ║ VALIDATES: API-based approach vs storage-based approach for participant identification   ║
 * ║                                                                                           ║
 * ║ TEST SCENARIOS:                                                                          ║
 * ║ 1. Two different participants register with different session tokens                    ║
 * ║ 2. Each participant sees their own name in SessionCanvas                                ║
 * ║ 3. No localStorage/sessionStorage conflicts between browser sessions                    ║
 * ║ 4. API endpoint /api/participant/session/{token}/me returns correct participant         ║
 * ║                                                                                           ║
 * ║ CONFIGURATION: headless, verbose, 2 workers for parallel execution                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { expect, Page, test } from '@playwright/test';

// Configuration for reliable headless testing
test.use({ headless: true, video: 'retain-on-failure' });

/**
 * Helper function to register a participant and navigate to session canvas
 */
async function registerParticipantAndNavigateToSession(
    page: Page,
    sessionToken: string,
    participantName: string,
    participantEmail: string,
    country: string = 'BH'
): Promise<void> {
    console.log(`[${participantName}] Starting registration with token: ${sessionToken}`);

    // Navigate to participant registration page
    await page.goto(`https://localhost:9091/session/join/${sessionToken}`);

    // Wait for page to load and form to be visible
    await expect(page.locator('input[placeholder*="name" i]')).toBeVisible({ timeout: 10000 });

    // Fill registration form
    await page.fill('input[placeholder*="name" i]', participantName);
    await page.fill('input[placeholder*="email" i]', participantEmail);

    // Select country (if dropdown exists)
    const countrySelect = page.locator('select, input[list]').filter({ hasText: /country/i }).first();
    if (await countrySelect.isVisible()) {
        await countrySelect.selectOption(country);
    }

    // Submit registration
    await page.click('button[type="submit"], button:has-text("Join"), button:has-text("Register")');

    // Wait for successful registration and redirect to session canvas
    await expect(page).toHaveURL(/\/session\/canvas\/\w+/, { timeout: 15000 });

    // Wait for session canvas to load completely
    await expect(page.locator('.session-title, h1, h2').first()).toBeVisible({ timeout: 10000 });

    console.log(`[${participantName}] Successfully registered and navigated to session canvas`);
}

/**
 * Helper function to get current participant name from session canvas
 */
async function getCurrentParticipantName(page: Page): Promise<string> {
    // Look for participant name display in various possible locations
    const possibleSelectors = [
        '.current-participant',
        '.participant-name',
        '.user-name',
        '[data-testid="participant-name"]',
        '.welcome-message',
        'text=/Welcome.*/'
    ];

    for (const selector of possibleSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
            const text = await element.textContent();
            if (text && text.trim()) {
                // Extract name from welcome messages like "Welcome, John Doe"
                const match = text.match(/(?:Welcome[,\s]*|Hello[,\s]*)?([A-Z][a-z]+ [A-Z][a-z]+)/i);
                if (match) {
                    return match[1].trim();
                }
                return text.trim();
            }
        }
    }

    // Fallback: check page content for participant names
    const pageContent = await page.textContent('body');
    const nameMatch = pageContent?.match(/(?:Welcome[,\s]*|Hello[,\s]*)?([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (nameMatch) {
        return nameMatch[1].trim();
    }

    throw new Error('Could not find current participant name in session canvas');
}

/**
 * Helper function to verify API endpoint returns correct participant data
 */
async function verifyParticipantApiEndpoint(
    page: Page,
    sessionToken: string,
    expectedName: string
): Promise<void> {
    const response = await page.request.get(`https://localhost:9091/api/participant/session/${sessionToken}/me`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.name).toBe(expectedName);
    expect(data.userGuid).toBeTruthy();

    console.log(`[API] Verified participant API for ${expectedName}: UserGuid=${data.userGuid}`);
}

test.describe('Multi-Browser Participant Isolation', () => {

    test('should show different participant names in separate browser sessions with different tokens', async ({ browser }) => {
        // Create two separate browser contexts to simulate different users
        const context1 = await browser.newContext({
            ignoreHTTPSErrors: true,
            storageState: undefined // Ensure clean state
        });
        const context2 = await browser.newContext({
            ignoreHTTPSErrors: true,
            storageState: undefined // Ensure clean state
        });

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        try {
            // Test data for two different participants
            const participant1 = {
                token: 'TEST01AA', // 8-character session token
                name: 'Alice Johnson',
                email: 'alice.johnson@test.com'
            };

            const participant2 = {
                token: 'TEST02BB', // Different 8-character session token
                name: 'Bob Smith',
                email: 'bob.smith@test.com'
            };

            console.log('=== MULTI-BROWSER ISOLATION TEST START ===');
            console.log(`Participant 1: ${participant1.name} with token ${participant1.token}`);
            console.log(`Participant 2: ${participant2.name} with token ${participant2.token}`);

            // Register both participants in parallel using different session tokens
            await Promise.all([
                registerParticipantAndNavigateToSession(
                    page1,
                    participant1.token,
                    participant1.name,
                    participant1.email
                ),
                registerParticipantAndNavigateToSession(
                    page2,
                    participant2.token,
                    participant2.name,
                    participant2.email
                )
            ]);

            // Wait a moment for both sessions to fully load
            await page1.waitForTimeout(2000);
            await page2.waitForTimeout(2000);

            // Verify each participant sees their own name (not the other's)
            const displayedName1 = await getCurrentParticipantName(page1);
            const displayedName2 = await getCurrentParticipantName(page2);

            console.log(`Browser 1 shows participant: "${displayedName1}"`);
            console.log(`Browser 2 shows participant: "${displayedName2}"`);

            // CRITICAL ASSERTION: Each browser should show its own participant name
            expect(displayedName1).toBe(participant1.name);
            expect(displayedName2).toBe(participant2.name);

            // Additional verification: Names should be different (no "same name" issue)
            expect(displayedName1).not.toBe(displayedName2);

            // Verify API endpoints return correct participant data
            await Promise.all([
                verifyParticipantApiEndpoint(page1, participant1.token, participant1.name),
                verifyParticipantApiEndpoint(page2, participant2.token, participant2.name)
            ]);

            console.log('✅ MULTI-BROWSER ISOLATION TEST PASSED');
            console.log('✅ API-based approach successfully eliminated "same name on multiple browsers" issue');

        } finally {
            await context1.close();
            await context2.close();
        }
    });

    test('should handle localStorage/sessionStorage clearance gracefully with API-based approach', async ({ browser }) => {
        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            storageState: undefined
        });

        const page = await context.newPage();

        try {
            const participant = {
                token: 'TEST03CC',
                name: 'Charlie Brown',
                email: 'charlie.brown@test.com'
            };

            console.log('=== STORAGE CLEARANCE TEST START ===');

            // Register participant
            await registerParticipantAndNavigateToSession(
                page,
                participant.token,
                participant.name,
                participant.email
            );

            // Verify initial state
            const initialName = await getCurrentParticipantName(page);
            expect(initialName).toBe(participant.name);
            console.log(`Initial participant name: ${initialName}`);

            // Clear all browser storage (localStorage, sessionStorage, cookies)
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
                // Clear cookies would require different approach, but localStorage/sessionStorage are key
            });

            console.log('Cleared localStorage and sessionStorage');

            // Reload the page to test API-based recovery
            await page.reload();
            await page.waitForTimeout(3000); // Allow time for API calls

            // Verify participant name is still correct after storage clearance
            const nameAfterClearance = await getCurrentParticipantName(page);
            expect(nameAfterClearance).toBe(participant.name);

            // Verify API still works correctly
            await verifyParticipantApiEndpoint(page, participant.token, participant.name);

            console.log(`✅ Participant name after storage clearance: ${nameAfterClearance}`);
            console.log('✅ API-based approach works correctly without localStorage/sessionStorage');

        } finally {
            await context.close();
        }
    });

    test('should maintain correct participant identity across page refreshes', async ({ browser }) => {
        const context = await browser.newContext({
            ignoreHTTPSErrors: true,
            storageState: undefined
        });

        const page = await context.newPage();

        try {
            const participant = {
                token: 'TEST04DD',
                name: 'Diana Prince',
                email: 'diana.prince@test.com'
            };

            console.log('=== PAGE REFRESH PERSISTENCE TEST START ===');

            // Register participant
            await registerParticipantAndNavigateToSession(
                page,
                participant.token,
                participant.name,
                participant.email
            );

            // Verify initial state
            const initialName = await getCurrentParticipantName(page);
            expect(initialName).toBe(participant.name);

            // Refresh the page multiple times
            for (let i = 1; i <= 3; i++) {
                console.log(`Refresh ${i}/3`);
                await page.reload();
                await page.waitForTimeout(3000);

                const nameAfterRefresh = await getCurrentParticipantName(page);
                expect(nameAfterRefresh).toBe(participant.name);

                console.log(`  ✅ Name after refresh ${i}: ${nameAfterRefresh}`);
            }

            // Final API verification
            await verifyParticipantApiEndpoint(page, participant.token, participant.name);

            console.log('✅ Participant identity maintained correctly across page refreshes');

        } finally {
            await context.close();
        }
    });
});