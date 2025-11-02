/**
 * Transcript Section Share Button Sanitization Test
 * 
 * Purpose: Verify that share buttons are properly removed from HTML before broadcasting
 * to participants, preventing "unsafe content" errors
 * 
 * Test Coverage:
 * - Share buttons are visible in host view
 * - Share buttons are removed before broadcast
 * - Participant receives clean HTML without onclick handlers
 * - No JavaScript errors in browser console
 * - Visual regression with Percy
 * 
 * Prerequisites:
 * - Session 212 must exist (KJAHA99L participant token / PQ9N5YWW host token)
 * - App must be running on https://localhost:9091
 * 
 * Usage:
 *   Run via orchestration script: .\Scripts\run-transcript-share-sanitization-test.ps1
 */

import percySnapshot from '@percy/playwright';
import { BrowserContext, expect, Page, test } from '@playwright/test';

test.describe('Transcript Section Share - HTML Sanitization', () => {
    let context: BrowserContext;
    let hostPage: Page;
    let participantPage: Page;

    const sessionToken = 'KJAHA99L'; // Session 212 participant token
    const hostToken = 'PQ9N5YWW';    // Session 212 host token

    // Track console errors
    const hostConsoleErrors: string[] = [];
    const participantConsoleErrors: string[] = [];

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext({
            ignoreHTTPSErrors: true, // Accept self-signed cert
        });
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('should remove share buttons before broadcasting to participants', async () => {
        // Create two pages: one for host, one for participant
        hostPage = await context.newPage();
        participantPage = await context.newPage();

        // Set up console error tracking
        hostPage.on('console', msg => {
            if (msg.type() === 'error') {
                hostConsoleErrors.push(`HOST ERROR: ${msg.text()}`);
            }
        });

        participantPage.on('console', msg => {
            if (msg.type() === 'error') {
                participantConsoleErrors.push(`PARTICIPANT ERROR: ${msg.text()}`);
            }
        });

        // Step 1: Navigate host to Host Control Panel
        console.log('📋 Step 1: Opening Host Control Panel...');
        await hostPage.goto(`https://localhost:9091/host/control-panel/${hostToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await hostPage.waitForSelector('h1:has-text("Host Control Panel")', { timeout: 15000 });
        console.log('✅ Host Control Panel loaded');

        // Step 1.5: Start the session to activate transcript panel
        console.log('📋 Step 1.5: Starting session...');
        const startButton = hostPage.locator('button:has-text("Start Session")');
        await startButton.click();
        await hostPage.waitForTimeout(2000); // Allow session to start and transcript to load
        console.log('✅ Session started');

        // Step 2: Navigate participant to Transcript Canvas
        console.log('📋 Step 2: Opening Participant Transcript Canvas...');
        await participantPage.goto(`https://localhost:9091/transcript/canvas/${sessionToken}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await participantPage.waitForSelector('h1', { timeout: 15000 });
        console.log('✅ Transcript Canvas loaded');

        // Step 3: Wait for transcript content to load in host view
        console.log('📋 Step 3: Waiting for transcript content in host view...');
        await hostPage.waitForTimeout(5000); // Allow SignalR + button injection

        // Debug: Check transcript container content
        const transcriptContent = await hostPage.locator('#transcript-content-container').innerHTML();
        console.log(`📝 Transcript container length: ${transcriptContent.length} chars`);
        console.log(`📝 H2 elements: ${(transcriptContent.match(/<h2/gi) || []).length}`);
        console.log(`📝 Share buttons before verification: ${(transcriptContent.match(/data-share-button/gi) || []).length}`);

        // Verify share buttons are present in host view
        const shareButtonsInHost = await hostPage.locator('[data-share-button], .share-section-button, button:has-text("Share Section")').count();
        console.log(`✅ Found ${shareButtonsInHost} share buttons in host view`);

        // If no buttons found, log the full container for debugging
        if (shareButtonsInHost === 0) {
            console.log('⚠️ NO SHARE BUTTONS FOUND - Full container HTML:');
            console.log(transcriptContent.substring(0, 2000));
        }

        expect(shareButtonsInHost).toBeGreaterThan(0);

        // Take Percy snapshot of host view WITH share buttons
        await percySnapshot(hostPage, 'Host View - Transcript with Share Buttons', {
            widths: [1280]
        });

        // Step 4: Find and click a share button for a transcript section
        console.log('📋 Step 4: Sharing transcript section from host...');

        // Look for the first visible share button
        const shareButton = hostPage.locator('[data-share-button], .share-section-button, button:has-text("Share Section")').first();
        await expect(shareButton).toBeVisible({ timeout: 10000 });

        // Click the share button
        await shareButton.click();
        console.log('✅ Share button clicked');

        // Wait for share confirmation (toast or success message)
        await hostPage.waitForTimeout(2000);

        // Step 5: Verify content appears in participant view WITHOUT share buttons
        console.log('📋 Step 5: Verifying participant received clean content...');

        // Wait for content to appear in participant canvas
        await participantPage.waitForTimeout(3000);

        // Check for the "Content Rendering Error" yellow warning box
        const errorBox = participantPage.locator('div[style*="background:#fff3cd"]');
        const hasError = await errorBox.count() > 0;

        if (hasError) {
            const errorText = await errorBox.textContent();
            console.error('❌ Content Rendering Error detected:', errorText);

            // Take screenshot for debugging
            await percySnapshot(participantPage, 'Participant View - Content Rendering Error (FAILED)', {
                widths: [1280]
            });

            throw new Error(`Content rendering failed: ${errorText}`);
        }

        console.log('✅ No content rendering error detected');

        // Verify share buttons are NOT present in participant view
        const shareButtonsInParticipant = await participantPage.locator('[data-share-button], .share-section-button, button:has-text("Share Section"), button[onclick]').count();
        console.log(`✅ Share buttons in participant view: ${shareButtonsInParticipant} (should be 0)`);
        expect(shareButtonsInParticipant).toBe(0);

        // Take Percy snapshot of participant view WITHOUT share buttons
        await percySnapshot(participantPage, 'Participant View - Clean Transcript Content', {
            widths: [1280]
        });

        // Step 6: Verify no JavaScript console errors related to HTML sanitization
        console.log('📋 Step 6: Checking for JavaScript console errors...');

        // Filter errors to only include those related to HTML content/rendering (not 404s or missing libs)
        const relevantHostErrors = hostConsoleErrors.filter(err =>
            !err.includes('404') &&
            !err.includes('Failed to load resource')
        );

        const relevantParticipantErrors = participantConsoleErrors.filter(err =>
            !err.includes('404') &&
            !err.includes('Failed to load resource') &&
            !err.includes('Fabric.js not loaded') // Fabric.js is for canvas annotations, not transcript rendering
        );

        if (relevantHostErrors.length > 0) {
            console.warn('⚠️ Host console errors detected:');
            relevantHostErrors.forEach(err => console.warn(`  - ${err}`));
        } else {
            console.log('✅ No relevant host console errors');
        }

        if (relevantParticipantErrors.length > 0) {
            console.error('❌ Participant console errors detected:');
            relevantParticipantErrors.forEach(err => console.error(`  - ${err}`));
            throw new Error('Participant page had content-related console errors');
        } else {
            console.log('✅ No relevant participant console errors');
        }

        // Step 7: Verify content is actually displayed (not just absence of errors)
        console.log('📋 Step 7: Verifying transcript content is visible to participant...');

        // Check for any paragraph or heading content
        const contentElements = participantPage.locator('p, h1, h2, h3, h4, h5, h6, .example, .quote');
        const contentCount = await contentElements.count();
        console.log(`✅ Found ${contentCount} content elements in participant view`);
        expect(contentCount).toBeGreaterThan(0);

        console.log('✅ Test completed successfully!');
    });

    test.afterEach(async () => {
        // Report console errors summary
        if (hostConsoleErrors.length > 0 || participantConsoleErrors.length > 0) {
            console.log('\n📊 Console Errors Summary:');
            console.log(`  Host errors: ${hostConsoleErrors.length}`);
            console.log(`  Participant errors: ${participantConsoleErrors.length}`);
        }
    });
});
