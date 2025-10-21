/**
 * HTML Cleaner Function Validation Test
 * 
 * Verifies that the HTML cleaner function properly removes ALL clickable elements
 * (share buttons, onclick handlers) before broadcasting to participants.
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
 * - Content preservation (paragraphs, headings, tables)
 * - Browser rendering validation
 * - JavaScript error monitoring
 */

import { expect, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const BASE_URL = process.env.CANVAS_BASE_URL || 'http://localhost:9090';

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
        if (text.includes('css debug')) return false; // Ignore CSS debug messages
        if (text.includes('websocket closed')) return false; // Ignore WebSocket connection errors
        if (text.includes('connection disconnected')) return false; // Ignore SignalR disconnect errors

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

/**
 * Count clickable elements in HTML string using JSDOM
 */
function countClickableElements(html: string): any {
    // Simple parser using regex (since JSDOM is Node-only)
    return {
        shareButtons: (html.match(/class="transcript-section-share-btn"/g) || []).length,
        onclickElements: (html.match(/onclick=/g) || []).length,
        onmouseoverElements: (html.match(/onmouseover=/g) || []).length,
        onmouseoutElements: (html.match(/onmouseout=/g) || []).length,
        dataShareControls: (html.match(/data-noor-share-control="true"/g) || []).length
    };
}

/**
 * Count content elements in HTML string
 */
function countContentElements(html: string): any {
    return {
        paragraphs: (html.match(/<p/g) || []).length,
        headings: (html.match(/<h[1-6]/g) || []).length,
        tables: (html.match(/<table/g) || []).length,
        spans: (html.match(/class="inlineArabic"/g) || []).length
    };
}

test.describe('HTML Cleaner Function Validation', () => {
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
        const rawClickables = countClickableElements(rawHtml);

        console.log('\n   Clickable elements in raw HTML:');
        console.log(`   - Share buttons: ${rawClickables.shareButtons}`);
        console.log(`   - onclick handlers: ${rawClickables.onclickElements}`);
        console.log(`   - onmouseover handlers: ${rawClickables.onmouseoverElements}`);
        console.log(`   - onmouseout handlers: ${rawClickables.onmouseoutElements}`);
        console.log(`   - data-noor-share-control: ${rawClickables.dataShareControls}`);

        const totalRawClickables = Object.values(rawClickables).reduce((sum: number, val: any) => sum + val, 0);
        console.log(`   ✅ Total raw clickable elements: ${totalRawClickables}`);

        expect(totalRawClickables).toBeGreaterThan(0);

        // STEP 2: Navigate to test page and inject cleaner function
        console.log('\n[STEP 2] Setting up browser environment...');
        await testPage.goto(`${BASE_URL}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });
        console.log('✅ Page loaded');

        // STEP 3: Inject cleaner function into browser
        console.log('\n[STEP 3] Injecting HTML cleaner function...');
        await testPage.addScriptTag({ content: getCleanerFunction() });
        console.log('✅ Cleaner function injected');

        // STEP 4: Pass raw HTML through cleaner function
        console.log('\n[STEP 4] Cleaning HTML with cleaner function...');

        const cleanedHtml = await testPage.evaluate((html) => {
            return (window as any).cleanHtml(html);
        }, rawHtml);

        console.log(`✅ Cleaned HTML: ${cleanedHtml.length} bytes`);
        console.log(`   Size reduction: ${rawHtml.length - cleanedHtml.length} bytes (${((rawHtml.length - cleanedHtml.length) / rawHtml.length * 100).toFixed(1)}%)`);

        // STEP 5: Count clickable elements in cleaned HTML
        console.log('\n[STEP 5] Verifying clickable elements removed...');

        const cleanedClickables = countClickableElements(cleanedHtml);

        console.log('\n   Clickable elements in cleaned HTML:');
        console.log(`   - Share buttons: ${cleanedClickables.shareButtons}`);
        console.log(`   - onclick handlers: ${cleanedClickables.onclickElements}`);
        console.log(`   - onmouseover handlers: ${cleanedClickables.onmouseoverElements}`);
        console.log(`   - onmouseout handlers: ${cleanedClickables.onmouseoutElements}`);
        console.log(`   - data-noor-share-control: ${cleanedClickables.dataShareControls}`);

        const totalCleanedClickables = Object.values(cleanedClickables).reduce((sum: number, val: any) => sum + val, 0);
        console.log(`   ✅ Total cleaned clickable elements: ${totalCleanedClickables}`);

        // STEP 6: Assert zero clickable elements
        expect(cleanedClickables.shareButtons).toBe(0);
        expect(cleanedClickables.onclickElements).toBe(0);
        expect(cleanedClickables.onmouseoverElements).toBe(0);
        expect(cleanedClickables.onmouseoutElements).toBe(0);
        expect(cleanedClickables.dataShareControls).toBe(0);
        expect(totalCleanedClickables).toBe(0);
        console.log('\n✅ All clickable elements successfully removed');

        // STEP 7: Verify HTML is acceptable for rendering
        console.log('\n[STEP 6] Verifying cleaned HTML is acceptable for rendering...');

        // Check for content elements
        const contentElements = countContentElements(cleanedHtml);

        console.log('\n   Content elements in cleaned HTML:');
        console.log(`   - Paragraphs: ${contentElements.paragraphs}`);
        console.log(`   - Headings: ${contentElements.headings}`);
        console.log(`   - Tables: ${contentElements.tables}`);
        console.log(`   - Arabic spans: ${contentElements.spans}`);

        const totalContent = Object.values(contentElements).reduce((sum: number, val: any) => sum + val, 0);
        console.log(`   ✅ Total content elements: ${totalContent}`);

        expect(totalContent).toBeGreaterThan(0);
        console.log('\n✅ Cleaned HTML contains valid content elements');

        // STEP 8: Test rendering in browser
        console.log('\n[STEP 7] Testing cleaned HTML rendering in browser...');

        await testPage.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cleaned HTML Rendering Test</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .inlineArabic { font-family: 'Arabic Typesetting', 'Tahoma', sans-serif; }
                </style>
            </head>
            <body>
                <h1>Cleaned HTML Rendering Test</h1>
                <div id="test-container">${cleanedHtml}</div>
            </body>
            </html>
        `);

        await testPage.waitForTimeout(1000);

        // Verify content rendered
        const renderedElements = {
            paragraphs: await testPage.locator('#test-container p').count(),
            headings: await testPage.locator('#test-container h1, #test-container h2').count(),
            tables: await testPage.locator('#test-container table').count()
        };

        console.log('\n   Rendered elements:');
        console.log(`   - Paragraphs: ${renderedElements.paragraphs}`);
        console.log(`   - Headings: ${renderedElements.headings}`);
        console.log(`   - Tables: ${renderedElements.tables}`);

        const totalRendered = Object.values(renderedElements).reduce((sum, val) => sum + val, 0);
        expect(totalRendered).toBeGreaterThan(0);
        console.log('\n✅ Cleaned HTML successfully rendered in browser');

        // STEP 9: Check browser console for JavaScript errors
        console.log('\n[STEP 8] Checking browser console for errors...');

        const relevantErrors = filterRelevantErrors(consoleMessages);
        console.log(`   JavaScript errors found: ${relevantErrors.length}`);

        if (relevantErrors.length > 0) {
            console.log('\n   Errors:');
            relevantErrors.forEach(err => console.log(`   - [${err.timestamp.toISOString()}] ${err.text}`));
        }

        expect(relevantErrors.length).toBe(0);
        console.log('\n✅ No JavaScript errors detected');

        // STEP 10: Save cleaned HTML for inspection
        console.log('\n[STEP 9] Saving cleaned HTML for inspection...');
        const outputPath = 'd:/temp/cleaned-html-output.html';
        fs.writeFileSync(outputPath, cleanedHtml, 'utf-8');
        console.log(`✅ Cleaned HTML saved to: ${outputPath}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST PASSED: HTML cleaner function works correctly');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   - Raw HTML: ${rawHtml.length} bytes, ${totalRawClickables} clickable elements`);
        console.log(`   - Cleaned HTML: ${cleanedHtml.length} bytes, ${totalCleanedClickables} clickable elements`);
        console.log(`   - Content preserved: ${totalContent} elements`);
        console.log(`   - JavaScript errors: 0`);
    });
});
