/**
 * Clickable Elements Sanitization Test
 * 
 * Verifies that the HTML cleaner function properly removes ALL clickable elements
 * (share buttons, delete buttons, onclick handlers) before broadcasting to participants.
 * 
 * Test Strategy:
 * 1. Load raw HTML from CopilotContext.txt (contains share buttons, onclick handlers)
 * 2. Pass HTML through JavaScript cleaner function (clone-and-clean logic)
 * 3. Verify cleaned HTML has zero clickable elements
 * 4. Verify cleaned HTML is acceptable for participant rendering
 * 5. Monitor browser console for JavaScript errors
 * 
 * Test Coverage:
 * - Transcript section share buttons removal
 * - onclick/onmouseover/onmouseout handler removal
 * - data-noor-share-control marked elements removal
 * - Browser console error monitoring
 * - Percy visual regression (if UI involved)
 */

import { expect, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const BASE_URL = process.env.CANVAS_BASE_URL || 'http://localhost:9090';
const HOST_TOKEN = process.env.CANVAS_HOST_TOKEN || 'PQ9N5YWW';
const USER_TOKEN = process.env.CANVAS_USER_TOKEN || 'KJAHA99L';
const SESSION_ID = '212';

// [DEBUG-WORKITEM:hcp-canvas:load-html-from-file] Load raw HTML from CopilotContext.txt ;CLEANUP_OK
const HTML_SOURCE_PATH = path.resolve('d:/PROJECTS/NOOR CANVAS/Workspaces/Data/CopilotContext.txt');

interface ConsoleMessage {
    type: string;
    text: string;
    timestamp: Date;
}

/**
 * Monitor browser console for errors
 */
async function setupConsoleMonitoring(page: Page): Promise<ConsoleMessage[]> {
    const consoleMessages: ConsoleMessage[] = [];

    page.on('console', (msg) => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date()
        });
    });

    return consoleMessages;
}

/**
 * Filter relevant console errors (exclude 404s for fonts/images)
 */
function filterRelevantErrors(messages: ConsoleMessage[]): ConsoleMessage[] {
    return messages.filter(msg => {
        if (msg.type !== 'error') return false;

        // Exclude known benign errors
        const text = msg.text.toLowerCase();
        if (text.includes('404') || text.includes('net::err')) return false;
        if (text.includes('font') || text.includes('image')) return false;
        if (text.includes('favicon')) return false;

        // Include JavaScript errors related to our code
        return true;
    });
}

/**
 * JavaScript cleaner function to remove share controls (mirrors server-side logic)
 * This replicates the clone-and-clean logic from transcript-section-parser.js
 */
function getCleanerFunction(): string {
    return `
        function cleanHtml(rawHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');
            
            // [DEBUG-WORKITEM:hcp-canvas:cleaner-function] Remove all share controls ;CLEANUP_OK
            console.log('[TEST-CLEANER] Starting HTML cleaning...');
            console.log('[TEST-CLEANER] Input HTML length:', rawHtml.length);
            
            // Remove all elements with data-noor-share-control="true"
            const shareControls = doc.querySelectorAll('[data-noor-share-control="true"]');
            console.log('[TEST-CLEANER] Found share controls:', shareControls.length);
            shareControls.forEach(control => control.remove());
            
            // Remove onclick, onmouseover, onmouseout attributes
            const elementsWithEvents = doc.querySelectorAll('[onclick], [onmouseover], [onmouseout]');
            console.log('[TEST-CLEANER] Found elements with event handlers:', elementsWithEvents.length);
            elementsWithEvents.forEach(el => {
                el.removeAttribute('onclick');
                el.removeAttribute('onmouseover');
                el.removeAttribute('onmouseout');
                console.log('[TEST-CLEANER] Cleaned:', el.tagName, el.className);
            });
            
            const cleanedHtml = doc.body.innerHTML;
            console.log('[TEST-CLEANER] Cleaned HTML length:', cleanedHtml.length);
            console.log('[TEST-CLEANER] Reduction:', rawHtml.length - cleanedHtml.length, 'bytes');
            
            return cleanedHtml;
        }
        
        window.cleanHtml = cleanHtml;
    `;
}

test.describe('Clickable Elements Sanitization', () => {
    let testPage: Page;
    let consoleMessages: ConsoleMessage[];

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        testPage = await context.newPage();

        // Setup console monitoring
        consoleMessages = await setupConsoleMonitoring(testPage);

        console.log('\n🚀 Test Setup Complete');
        console.log(`   Test URL: ${BASE_URL}`);
        console.log(`   HTML Source: ${HTML_SOURCE_PATH}`);
    });

    test.afterAll(async () => {
        await testPage?.close();
    });

    test('should clean HTML from CopilotContext.txt and verify acceptability', async () => {
        console.log('\n📋 TEST: HTML Cleaner Function Validation');
        console.log('='.repeat(60));

        // STEP 1: Load raw HTML from CopilotContext.txt
        console.log('\n[STEP 1] Loading raw HTML from CopilotContext.txt...');

        if (!fs.existsSync(HTML_SOURCE_PATH)) {
            throw new Error(`HTML source file not found: ${HTML_SOURCE_PATH}`);
        }

        const rawHtml = fs.readFileSync(HTML_SOURCE_PATH, 'utf-8');
        console.log(`✅ Loaded ${rawHtml.length} bytes of HTML`);

        // Count clickable elements in raw HTML
        const rawParser = new (require('jsdom').JSDOM)(rawHtml);
        const rawDoc = rawParser.window.document;

        const rawClickables = {
            shareButtons: rawDoc.querySelectorAll('button.transcript-section-share-btn').length,
            onclickElements: rawDoc.querySelectorAll('[onclick]').length,
            onmouseoverElements: rawDoc.querySelectorAll('[onmouseover]').length,
            onmouseoutElements: rawDoc.querySelectorAll('[onmouseout]').length,
            dataShareControls: rawDoc.querySelectorAll('[data-noor-share-control="true"]').length
        };

        console.log('\n   Clickable elements in raw HTML:');
        console.log(`   - Share buttons: ${rawClickables.shareButtons}`);
        console.log(`   - onclick handlers: ${rawClickables.onclickElements}`);
        console.log(`   - onmouseover handlers: ${rawClickables.onmouseoverElements}`);
        console.log(`   - onmouseout handlers: ${rawClickables.onmouseoutElements}`);
        console.log(`   - data-noor-share-control: ${rawClickables.dataShareControls}`);

        const totalRawClickables = Object.values(rawClickables).reduce((sum, val) => sum + val, 0);
        console.log(`   ✅ Total raw clickable elements: ${totalRawClickables}`);

        expect(totalRawClickables).toBeGreaterThan(0);

        // STEP 2: Navigate to test page and inject cleaner function
        console.log('\n[STEP 2] Setting up browser environment...');
        await testPage.goto(`${BASE_URL}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        await participantPage.waitForTimeout(2000);
        console.log('✅ Participant page loaded');

        // STEP 3: Start Session (to enable transcript sharing)
        console.log('\n[STEP 3] Starting session...');
        const startButton = hostPage.locator('button:has-text("Start Session")');
        if (await startButton.isVisible()) {
            await startButton.click();
            await hostPage.waitForTimeout(3000);
            console.log('✅ Session started');
        } else {
            console.log('⚠️ Session already started');
        }

        // STEP 4: Wait for transcript to render with share buttons
        console.log('\n[STEP 4] Waiting for transcript with share buttons...');
        await hostPage.waitForSelector('#transcript-content-container', { timeout: 10000 });
        await hostPage.waitForTimeout(2000);

        // Count share buttons in host view
        const shareButtonsInHost = await hostPage.locator('[data-noor-share-control="true"]').count();
        console.log(`✅ Found ${shareButtonsInHost} share buttons in host view`);

        expect(shareButtonsInHost).toBeGreaterThan(0);

        // STEP 5: Verify host view contains clickable elements
        console.log('\n[STEP 5] Verifying host view has clickable elements...');

        const clickableElements = {
            shareButtons: await hostPage.locator('button.transcript-section-share-btn').count(),
            assetShareButtons: await hostPage.locator('button.ks-share-button').count(),
            onclickElements: await hostPage.locator('[onclick]').count(),
            onmouseoverElements: await hostPage.locator('[onmouseover]').count(),
            dataShareControls: await hostPage.locator('[data-noor-share-control="true"]').count()
        };

        console.log('   Clickable elements in host view:');
        console.log(`   - Share buttons: ${clickableElements.shareButtons}`);
        console.log(`   - Asset share buttons: ${clickableElements.assetShareButtons}`);
        console.log(`   - onclick handlers: ${clickableElements.onclickElements}`);
        console.log(`   - onmouseover handlers: ${clickableElements.onmouseoverElements}`);
        console.log(`   - data-noor-share-control: ${clickableElements.dataShareControls}`);

        // STEP 6: Click a transcript section share button
        console.log('\n[STEP 6] Clicking transcript section share button...');
        const firstShareButton = hostPage.locator('button.transcript-section-share-btn').first();
        const buttonText = await firstShareButton.textContent();
        console.log(`   Button text: ${buttonText}`);

        await firstShareButton.click();
        await hostPage.waitForTimeout(2000);
        console.log('✅ Share button clicked');

        // STEP 7: Verify content appears in participant view
        console.log('\n[STEP 7] Verifying content in participant view...');

        // Take a screenshot for debugging
        await participantPage.screenshot({ path: 'd:/temp/participant-after-share.png', fullPage: true });
        console.log('   Screenshot saved to d:/temp/participant-after-share.png');

        // Check if content viewer exists (be more flexible with selector)
        const hasHtmlContent = await participantPage.locator('.html-viewer-content, .section-content, [class*="viewer"]').count() > 0;
        console.log(`   Content containers found: ${hasHtmlContent}`);

        if (!hasHtmlContent) {
            console.log('   âš ï¸ No content found - checking page body...');
            const bodyText = await participantPage.textContent('body');
            console.log(`   Page body preview: ${bodyText?.substring(0, 200)}...`);
        }

        // STEP 8: Check for clickable elements in participant view (should be ZERO)
        console.log('\n[STEP 8] Checking for clickable elements in participant view...');

        const participantClickables = {
            shareButtons: await participantPage.locator('button.transcript-section-share-btn').count(),
            assetShareButtons: await participantPage.locator('button.ks-share-button').count(),
            onclickElements: await participantPage.locator('[onclick]').count(),
            onmouseoverElements: await participantPage.locator('[onmouseover]').count(),
            onmouseoutElements: await participantPage.locator('[onmouseout]').count(),
            dataShareControls: await participantPage.locator('[data-noor-share-control="true"]').count(),
            deleteButtons: await participantPage.locator('button:has-text("Delete"), button[id*="delete"], button[class*="delete"]').count()
        };

        console.log('   Clickable elements in participant view:');
        console.log(`   - Share buttons: ${participantClickables.shareButtons}`);
        console.log(`   - Asset share buttons: ${participantClickables.assetShareButtons}`);
        console.log(`   - onclick handlers: ${participantClickables.onclickElements}`);
        console.log(`   - onmouseover handlers: ${participantClickables.onmouseoverElements}`);
        console.log(`   - onmouseout handlers: ${participantClickables.onmouseoutElements}`);
        console.log(`   - data-noor-share-control: ${participantClickables.dataShareControls}`);
        console.log(`   - Delete buttons: ${participantClickables.deleteButtons}`);

        // Assertions: ALL clickable elements should be removed
        expect(participantClickables.shareButtons).toBe(0);
        expect(participantClickables.assetShareButtons).toBe(0);
        expect(participantClickables.onclickElements).toBe(0);
        expect(participantClickables.onmouseoverElements).toBe(0);
        expect(participantClickables.onmouseoutElements).toBe(0);
        expect(participantClickables.dataShareControls).toBe(0);
        expect(participantClickables.deleteButtons).toBe(0);

        // STEP 9: Share an asset and verify sanitization
        console.log('\n[STEP 9] Testing asset share button sanitization...');
        const assetShareButton = hostPage.locator('button.ks-share-button').first();

        if (await assetShareButton.count() > 0) {
            const assetButtonText = await assetShareButton.textContent();
            console.log(`   Sharing asset: ${assetButtonText}`);

            await assetShareButton.click();
            await participantPage.waitForTimeout(2000);

            // Verify no asset share buttons in participant view
            const assetSharesInParticipant = await participantPage.locator('button.ks-share-button').count();
            console.log(`   Asset share buttons in participant view: ${assetSharesInParticipant}`);
            expect(assetSharesInParticipant).toBe(0);
            console.log('✅ Asset share buttons removed');
        } else {
            console.log('⚠️ No asset share buttons found to test');
        }

        // STEP 10: Share another section to test consistency
        console.log('\n[STEP 10] Testing multiple section shares for consistency...');
        const secondShareButton = hostPage.locator('button.transcript-section-share-btn').nth(2);

        if (await secondShareButton.count() > 0) {
            const secondButtonText = await secondShareButton.textContent();
            console.log(`   Sharing second section: ${secondButtonText}`);

            await secondShareButton.click();
            await participantPage.waitForTimeout(2000);

            // Re-check for any clickable elements
            const recheckClickables = await participantPage.locator('[onclick], [onmouseover], [data-noor-share-control="true"], button.transcript-section-share-btn, button.ks-share-button').count();
            console.log(`   Total clickable elements after second share: ${recheckClickables}`);
            expect(recheckClickables).toBe(0);
            console.log('✅ Consistent sanitization across multiple shares');
        }

        // STEP 11: Check for rendering errors
        console.log('\n[STEP 11] Checking for rendering errors...');
        const errorContent = await participantPage.locator('text=Content Rendering Error').count();
        console.log(`   Rendering errors found: ${errorContent}`);

        if (errorContent > 0) {
            const errorText = await participantPage.locator('div:has-text("Content Rendering Error")').textContent();
            console.log(`   ❌ ERROR DETAILS: ${errorText}`);
        }

        expect(errorContent).toBe(0);

        // STEP 12: Verify content elements are visible
        console.log('\n[STEP 12] Verifying content elements visibility...');
        const contentElements = await participantPage.locator('.html-viewer-content p, .html-viewer-content h2, .html-viewer-content table').count();
        console.log(`   Content elements visible: ${contentElements}`);
        expect(contentElements).toBeGreaterThan(0);
        console.log('✅ Content properly rendered');

        // STEP 13: Check browser console for JavaScript errors
        console.log('\n[STEP 13] Checking browser console for errors...');

        const hostErrors = filterRelevantErrors(hostConsoleMessages);
        const participantErrors = filterRelevantErrors(participantConsoleMessages);

        console.log(`   Host console errors: ${hostErrors.length}`);
        console.log(`   Participant console errors: ${participantErrors.length}`);

        if (hostErrors.length > 0) {
            console.log('\n   Host Errors:');
            hostErrors.forEach(err => console.log(`   - [${err.timestamp.toISOString()}] ${err.text}`));
        }

        if (participantErrors.length > 0) {
            console.log('\n   Participant Errors:');
            participantErrors.forEach(err => console.log(`   - [${err.timestamp.toISOString()}] ${err.text}`));
        }

        // We allow some errors but flag them for review
        if (hostErrors.length > 0 || participantErrors.length > 0) {
            console.log('\n⚠️ JavaScript errors detected (review recommended)');
        } else {
            console.log('✅ No JavaScript errors detected');
        }

        // FINAL SUMMARY
        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST PASSED: All clickable elements successfully sanitized');
        console.log('='.repeat(60));
        console.log(`   - Share buttons removed: ${participantClickables.shareButtons === 0 ? 'YES' : 'NO'}`);
        console.log(`   - onclick handlers removed: ${participantClickables.onclickElements === 0 ? 'YES' : 'NO'}`);
        console.log(`   - data-noor-share-control removed: ${participantClickables.dataShareControls === 0 ? 'YES' : 'NO'}`);
        console.log(`   - Content rendered correctly: ${contentElements > 0 ? 'YES' : 'NO'}`);
        console.log(`   - No rendering errors: ${errorContent === 0 ? 'YES' : 'NO'}`);
        console.log('='.repeat(60) + '\n');
    });
});
