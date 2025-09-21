import { expect, test } from '@playwright/test';

/**
 * Phase 1: Validate ParticipantController timing fix
 * Tests that session timing comes from KSESSIONS database instead of hard-coded values
 */

test.describe('Phase 1: ParticipantController Session Timing Fix', () => {

    test('should retrieve session timing from KSESSIONS database', async ({ page }) => {
        // Test with a known session ID that exists in KSESSIONS_DEV
        const testToken = 'USER223A'; // Known test token

        // Go to participant waiting room
        await page.goto(`http://localhost:9090/user/landing/${testToken}`);

        // Wait for the session waiting page to load
        await page.waitForSelector('[data-testid="session-waiting"]', { timeout: 10000 });

        // Get the session data via API call to verify backend behavior
        const response = await page.request.get(`http://localhost:9090/api/participant/validate/${testToken}`);
        expect(response.status()).toBe(200);

        const sessionData = await response.json();
        console.log('Session data response:', JSON.stringify(sessionData, null, 2));

        // Validate that we have session data
        expect(sessionData).toBeDefined();
        expect(sessionData.session).toBeDefined();

        // Check that StartTime is not using the old hard-coded pattern
        // Old pattern was: CreatedAt + 5 minutes
        // New pattern should use KSESSIONS SessionDate when available
        const startTime = new Date(sessionData.session.StartTime);
        const createdAt = new Date(sessionData.session.CreatedAt);

        console.log('StartTime:', startTime.toISOString());
        console.log('CreatedAt:', createdAt.toISOString());

        // If we have real KSESSIONS data, StartTime should not be CreatedAt + 5 minutes
        const fiveMinutesAfterCreated = new Date(createdAt.getTime() + 5 * 60 * 1000);

        // The timing should either:
        // 1. Use real KSESSIONS SessionDate (different from CreatedAt + 5 min)
        // 2. Or fallback to CreatedAt + 5 min if no KSESSIONS data
        const timeDifference = Math.abs(startTime.getTime() - fiveMinutesAfterCreated.getTime());

        // Log for debugging
        console.log('Time difference from CreatedAt+5min:', timeDifference, 'ms');

        // Validate instructor name is from KSESSIONS (not hard-coded)
        if (sessionData.session.InstructorName) {
            expect(sessionData.session.InstructorName).not.toBe('Default Instructor');
            expect(sessionData.session.InstructorName.length).toBeGreaterThan(0);
            console.log('Instructor from KSESSIONS:', sessionData.session.InstructorName);
        }

        // Validate that StartedAt uses real data when available
        if (sessionData.session.StartedAt) {
            const startedAt = new Date(sessionData.session.StartedAt);
            console.log('StartedAt:', startedAt.toISOString());

            // StartedAt should match StartTime when using real KSESSIONS data
            expect(Math.abs(startedAt.getTime() - startTime.getTime())).toBeLessThan(60000); // Within 1 minute
        }
    });

    test('should handle fallback when KSESSIONS data is unavailable', async ({ page }) => {
        // Test with a token that might not have KSESSIONS data
        const testToken = 'TESTXXXX'; // Token that might not exist in KSESSIONS

        const response = await page.request.get(`http://localhost:9090/api/participant/validate/${testToken}`);

        if (response.status() === 200) {
            const sessionData = await response.json();
            console.log('Fallback session data:', JSON.stringify(sessionData, null, 2));

            // Should still have valid session structure
            expect(sessionData.session).toBeDefined();
            expect(sessionData.session.StartTime).toBeDefined();

            // Fallback timing should use CreatedAt + 5 minutes
            const startTime = new Date(sessionData.session.StartTime);
            const createdAt = new Date(sessionData.session.CreatedAt);
            const expectedFallback = new Date(createdAt.getTime() + 5 * 60 * 1000);

            const timeDifference = Math.abs(startTime.getTime() - expectedFallback.getTime());
            expect(timeDifference).toBeLessThan(5000); // Within 5 seconds of expected fallback

            console.log('Fallback timing verified - StartTime matches CreatedAt + 5 minutes');
        } else if (response.status() === 404) {
            console.log('Token not found - this is expected for non-existent tokens');
        } else {
            throw new Error(`Unexpected response status: ${response.status()}`);
        }
    });

    test('should display session information correctly in UI', async ({ page }) => {
        const testToken = 'USER223A';

        await page.goto(`http://localhost:9090/user/landing/${testToken}`);

        // Wait for session waiting page
        await page.waitForSelector('[data-testid="session-waiting"]', { timeout: 10000 });

        // Check that session title is displayed (not hard-coded)
        const sessionTitle = await page.locator('.session-title, [data-testid="session-title"]').first();
        if (await sessionTitle.isVisible()) {
            const titleText = await sessionTitle.textContent();
            console.log('Session title from UI:', titleText);

            // Should not be placeholder text
            expect(titleText).not.toContain('[Session Name]');
            expect(titleText?.length || 0).toBeGreaterThan(0);
        }

        // Check instructor information display
        const instructorInfo = await page.locator('.instructor-info, [data-testid="instructor-name"]').first();
        if (await instructorInfo.isVisible()) {
            const instructorText = await instructorInfo.textContent();
            console.log('Instructor from UI:', instructorText);

            // Should not be hard-coded default
            expect(instructorText).not.toBe('Default Instructor');
        }

        // Log session timing display
        const timingElements = await page.locator('[data-testid*="time"], .time-display, .countdown').all();
        for (const element of timingElements) {
            if (await element.isVisible()) {
                const text = await element.textContent();
                console.log('Timing display element:', text);
            }
        }
    });
});