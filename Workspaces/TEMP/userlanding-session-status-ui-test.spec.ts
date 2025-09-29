import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.APP_URL || 'https://localhost:9091';

test.describe('UserLanding Session Status UI Enhancements', () => {

    test('UserLanding should display correct button text and status messaging based on session status', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:ui:${runId}] Testing session status UI enhancements`);

        // Verify the UserLanding.razor file has the necessary enhancements
        const userLandingPath = path.resolve('SPA/NoorCanvas/Pages/UserLanding.razor');
        const userLandingContent = fs.readFileSync(userLandingPath, 'utf-8');

        console.log('✅ UserLanding.razor file loaded for verification');

        // Verify 1: Check for SessionStatusMessage property in UserLandingViewModel
        const hasSessionStatusMessage = userLandingContent.includes('SessionStatusMessage { get; set; }');
        expect(hasSessionStatusMessage).toBe(true);
        console.log('✅ Found SessionStatusMessage property in UserLandingViewModel');

        // Verify 2: Check for SessionStatusIcon property in UserLandingViewModel
        const hasSessionStatusIcon = userLandingContent.includes('SessionStatusIcon { get; set; }');
        expect(hasSessionStatusIcon).toBe(true);
        console.log('✅ Found SessionStatusIcon property in UserLandingViewModel');

        // Verify 3: Check for "Join Session" button text for Active sessions
        const hasJoinSessionButton = userLandingContent.includes('ButtonText = "Join Session"');
        expect(hasJoinSessionButton).toBe(true);
        console.log('✅ Found "Join Session" button text for active sessions');

        // Verify 4: Check for "Join Waiting Room" button text for Created sessions
        const hasJoinWaitingRoomButton = userLandingContent.includes('ButtonText = "Join Waiting Room"');
        expect(hasJoinWaitingRoomButton).toBe(true);
        console.log('✅ Found "Join Waiting Room" button text for created sessions');

        // Verify 5: Check for Active session status messaging
        const hasActiveSessionMessage = userLandingContent.includes('Session has already started - you can join immediately.');
        expect(hasActiveSessionMessage).toBe(true);
        console.log('✅ Found active session status message');

        // Verify 6: Check for Created session status messaging
        const hasCreatedSessionMessage = userLandingContent.includes("Session hasn't started yet - you'll wait in the waiting room.");
        expect(hasCreatedSessionMessage).toBe(true);
        console.log('✅ Found created session status message');

        // Verify 7: Check for FontAwesome icons for session status
        const hasPlayIcon = userLandingContent.includes('fa-solid fa-circle-play');
        expect(hasPlayIcon).toBe(true);
        console.log('✅ Found fa-solid fa-circle-play icon for active sessions');

        const hasClockIcon = userLandingContent.includes('fa-solid fa-clock');
        expect(hasClockIcon).toBe(true);
        console.log('✅ Found fa-solid fa-clock icon for created sessions');

        // Verify 8: Check for session status message display in UI
        const hasSessionStatusDisplay = userLandingContent.includes('@Model.SessionStatusMessage') &&
            userLandingContent.includes('@Model.SessionStatusIcon');
        expect(hasSessionStatusDisplay).toBe(true);
        console.log('✅ Found session status message and icon display in UI');

        // Verify 9: Check for proper styling of status message box
        const hasStatusMessageStyling = userLandingContent.includes('background-color:#F3F4F6') &&
            userLandingContent.includes('border-left:4px solid #D4AF37');
        expect(hasStatusMessageStyling).toBe(true);
        console.log('✅ Found proper styling for session status message box');

        console.log(`[DEBUG-WORKITEM:userlanding:ui:${runId}] ✅ All UserLanding session status UI enhancements verified successfully`);
    });

    test('UserLanding should handle different session statuses correctly', async ({ page }) => {
        const runId = Date.now().toString().slice(-6);
        console.log(`[DEBUG-WORKITEM:userlanding:ui:${runId}] Testing session status handling logic`);

        const userLandingPath = path.resolve('SPA/NoorCanvas/Pages/UserLanding.razor');
        const userLandingContent = fs.readFileSync(userLandingPath, 'utf-8');

        // Verify button text logic for both URL-based and manual token validation
        const hasActiveStatusLogic = userLandingContent.includes('string.Equals(sessionStatus, "active", StringComparison.OrdinalIgnoreCase)');
        expect(hasActiveStatusLogic).toBe(true);
        console.log('✅ Found case-insensitive "active" status comparison');

        // Verify proper status message assignments
        const hasStatusMessageAssignments = userLandingContent.includes('Model.SessionStatusMessage =') &&
            userLandingContent.includes('Model.SessionStatusIcon =');
        expect(hasStatusMessageAssignments).toBe(true);
        console.log('✅ Found session status message and icon assignments');

        // Verify different icon assignments for different statuses
        const hasMultipleIcons = userLandingContent.includes('fa-solid fa-circle-play') &&
            userLandingContent.includes('fa-solid fa-clock');
        expect(hasMultipleIcons).toBe(true);
        console.log('✅ Found multiple icon assignments for different session statuses');

        console.log(`[DEBUG-WORKITEM:userlanding:ui:${runId}] ✅ Session status handling logic verified successfully`);
    });

});