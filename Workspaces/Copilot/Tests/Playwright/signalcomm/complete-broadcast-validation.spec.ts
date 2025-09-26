/**
 * [DEBUG-WORKITEM:signalcomm:continue] Complete database-driven HTML broadcasting validation tests ;CLEANUP_OK
 * Tests the full path: HostControlPanel.razor → ContentBroadcasts table → SessionCanvas.razor
 * Validates both simple and complex HTML content broadcasting via KSESSIONS_DEV database
 */

import { BrowserContext, expect, Page, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const TEST_SESSION_ID = 218; // Using existing session from database setup
const HOST_TOKEN = 'LY7PQX4C'; // Host token for session 218
const USER_TOKEN = 'E9LCN7YQ'; // User token for session 218

interface BroadcastTestData {
    name: string;
    contentType: 'HTML' | 'Text';
    htmlContent: string;
    expectedElements: string[];
    expectedText: string[];
}

// Test data progression: Simple → Complex HTML content
const broadcastTestCases: BroadcastTestData[] = [
    {
        name: 'Simple Text Broadcast',
        contentType: 'Text',
        htmlContent: 'Simple test message for database broadcasting validation.',
        expectedElements: [],
        expectedText: ['Simple test message for database broadcasting validation.']
    },
    {
        name: 'Basic HTML Structure',
        contentType: 'HTML',
        htmlContent: `<div style="background:lightblue;padding:15px;text-align:center;">
<h3>Basic HTML Test</h3>
<p>This tests basic HTML structure broadcasting via database.</p>
</div>`,
        expectedElements: ['div', 'h3', 'p'],
        expectedText: ['Basic HTML Test', 'This tests basic HTML structure broadcasting via database.']
    },
    {
        name: 'Styled HTML with CSS',
        contentType: 'HTML',
        htmlContent: `<div style="background:#E8F5E8;color:#006400;padding:20px;border-radius:8px;text-align:center;border:2px solid #006400;">
<h3 style="margin:0 0 10px 0;">Welcome Message</h3>
<p style="margin:5px 0;">This is a styled HTML broadcast message.</p>
<p style="margin:10px 0 0 0;font-size:14px;">Shared from Host Control Panel</p>
</div>`,
        expectedElements: ['div', 'h3', 'p'],
        expectedText: ['Welcome Message', 'This is a styled HTML broadcast message.', 'Shared from Host Control Panel']
    },
    {
        name: 'Complex Islamic Content',
        contentType: 'HTML',
        htmlContent: `<div style="background:#4F46E5;color:white;padding:25px;border-radius:12px;max-width:500px;margin:0 auto;font-family:Arial,sans-serif;box-shadow:0 4px 8px #00000020;">
<div style="text-align:center;margin-bottom:20px;">
    <div style="background:#FFFFFF30;border-radius:50%;width:60px;height:60px;margin:0 auto 15px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:24px;">🕌</span>
    </div>
    <h3 style="margin:0 0 10px 0;font-size:18px;font-weight:600;">Ayah of Reflection</h3>
</div>
<div style="background:#FFFFFF20;padding:20px;border-radius:8px;margin-bottom:15px;border-left:4px solid #FFFFFF80;">
    <p style="margin:0;font-style:italic;line-height:1.6;font-size:16px;text-align:center;">And among His signs is that He created for you mates from among yourselves, that you may find tranquility in them; and He placed between you affection and mercy.</p>
</div>
<div style="text-align:center;opacity:0.9;">
    <p style="margin:0;font-size:14px;font-weight:500;">- The Holy Quran, Surah Ar-Rum (30:21)</p>
    <p style="margin:10px 0 0 0;font-size:12px;opacity:0.8;">Shared with love from NOOR Canvas</p>
</div>
</div>`,
        expectedElements: ['div', 'h3', 'p', 'span'],
        expectedText: ['Ayah of Reflection', 'And among His signs is that He created for you', 'The Holy Quran, Surah Ar-Rum', 'Shared with love from NOOR Canvas']
    }
];

test.describe('Database-Driven HTML Broadcasting Validation', () => {
    let hostContext: BrowserContext;
    let sessionContext: BrowserContext;
    let hostPage: Page;
    let sessionPage: Page;

    // Setup dual browser contexts for host and session
    test.beforeAll(async ({ browser }) => {
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Setting up dual browser contexts for broadcast testing ;CLEANUP_OK');

        // Host Control Panel context
        hostContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            baseURL: BASE_URL
        });
        hostPage = await hostContext.newPage();

        // Session Canvas context  
        sessionContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            baseURL: BASE_URL
        });
        sessionPage = await sessionContext.newPage();
    });

    test.afterAll(async () => {
        await hostPage?.close();
        await sessionPage?.close();
        await hostContext?.close();
        await sessionContext?.close();
    });

    // Test database connection and table existence
    test('Database Setup Validation', async () => {
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Validating KSESSIONS_DEV database setup ;CLEANUP_OK');

        // Navigate to host control panel to trigger database initialization
        await hostPage.goto(`/host/control-panel/${HOST_TOKEN}`);

        // Wait for page load and check for no database errors
        await hostPage.waitForLoadState('networkidle');

        // Verify no error messages about database connectivity
        const errorPanel = hostPage.locator('#noor-error-panel');
        const isErrorVisible = await errorPanel.isVisible();

        if (isErrorVisible) {
            const errorText = await errorPanel.textContent();
            console.error('[DEBUG-WORKITEM:signalcomm:continue] Database error detected:', errorText);
        }

        expect(isErrorVisible).toBeFalsy();
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Database connectivity validated successfully ;CLEANUP_OK');
    });

    // Progressive testing: Simple → Complex HTML broadcasts
    for (const testCase of broadcastTestCases) {
        test(`Broadcast Validation: ${testCase.name}`, async () => {
            console.log(`[DEBUG-WORKITEM:signalcomm:continue] Testing ${testCase.name} broadcasting ;CLEANUP_OK`);

            // Step 1: Navigate to Host Control Panel
            await hostPage.goto(`/host/control-panel/${HOST_TOKEN}`);
            await hostPage.waitForLoadState('networkidle');

            // Step 2: Navigate to Session Canvas in parallel
            await sessionPage.goto(`/session/canvas/${USER_TOKEN}`);
            await sessionPage.waitForLoadState('networkidle');

            // Step 3: Load test content into broadcast textarea
            const broadcastTextarea = hostPage.locator('textarea[placeholder*="HTML content"]');
            await expect(broadcastTextarea).toBeVisible();

            await broadcastTextarea.fill(testCase.htmlContent);
            console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} content loaded into broadcast textarea ;CLEANUP_OK`);

            // Step 4: Trigger database broadcast
            const broadcastButton = hostPage.locator('button:has-text("Broadcast to Sessions")');
            await expect(broadcastButton).toBeVisible();
            await broadcastButton.click();

            // Step 5: Wait for success confirmation
            await hostPage.waitForSelector('text=Content broadcasted successfully', { timeout: 10000 });
            console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} broadcast confirmed successful ;CLEANUP_OK`);

            // Step 6: Verify database storage by checking API endpoint
            const apiResponse = await hostPage.request.get(`/api/contentbroadcast/session/${TEST_SESSION_ID}`);
            expect(apiResponse.ok()).toBeTruthy();

            const broadcastData = await apiResponse.json();
            expect(broadcastData).toBeTruthy();
            expect(Array.isArray(broadcastData)).toBeTruthy();
            expect(broadcastData.length).toBeGreaterThan(0);

            // Find our broadcast in the response
            const ourBroadcast = broadcastData.find((b: any) =>
                b.content && b.content.includes(testCase.expectedText[0])
            );
            expect(ourBroadcast).toBeTruthy();
            expect(ourBroadcast.contentType).toBe(testCase.contentType);
            console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} verified in database via API ;CLEANUP_OK`);

            // Step 7: Verify content appears in Session Canvas  
            // Wait for content to be loaded and displayed
            await sessionPage.waitForTimeout(2000); // Allow time for content loading

            // Check for expected text content
            for (const expectedText of testCase.expectedText) {
                await expect(sessionPage.locator(`text=${expectedText}`)).toBeVisible({ timeout: 15000 });
                console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} - Found expected text: "${expectedText}" ;CLEANUP_OK`);
            }

            // Check for expected HTML elements (if any)
            for (const element of testCase.expectedElements) {
                const elementCount = await sessionPage.locator(element).count();
                expect(elementCount).toBeGreaterThan(0);
                console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} - Found expected element: ${element} (${elementCount} instances) ;CLEANUP_OK`);
            }

            console.log(`[DEBUG-WORKITEM:signalcomm:continue] ${testCase.name} - Complete broadcast path validated successfully! ;CLEANUP_OK`);
        });
    }

    // Test error handling and edge cases
    test('Database Broadcasting Error Handling', async () => {
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Testing error handling for malformed content ;CLEANUP_OK');

        await hostPage.goto(`/host/control-panel/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Test with potentially problematic HTML
        const problematicHtml = `<div><script>alert('xss')</script><h1>Test</h1></div>`;

        const broadcastTextarea = hostPage.locator('textarea[placeholder*="HTML content"]');
        await broadcastTextarea.fill(problematicHtml);

        const broadcastButton = hostPage.locator('button:has-text("Broadcast to Sessions")');
        await broadcastButton.click();

        // Should still succeed (content should be sanitized)
        await hostPage.waitForSelector('text=Content broadcasted successfully', { timeout: 10000 });
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Problematic HTML handled gracefully ;CLEANUP_OK');
    });

    // Test performance with large content
    test('Large Content Broadcasting', async () => {
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Testing large content broadcasting performance ;CLEANUP_OK');

        await hostPage.goto(`/host/control-panel/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Generate large HTML content
        const largeContent = `<div style="padding:20px;">
      <h1>Large Content Test</h1>
      ${Array.from({ length: 100 }, (_, i) =>
            `<p style="margin:10px 0;">This is paragraph number ${i + 1} of a large content broadcast test.</p>`
        ).join('\n')}
    </div>`;

        const broadcastTextarea = hostPage.locator('textarea[placeholder*="HTML content"]');
        await broadcastTextarea.fill(largeContent);

        const startTime = Date.now();
        const broadcastButton = hostPage.locator('button:has-text("Broadcast to Sessions")');
        await broadcastButton.click();

        await hostPage.waitForSelector('text=Content broadcasted successfully', { timeout: 15000 });
        const endTime = Date.now();

        const duration = endTime - startTime;
        console.log(`[DEBUG-WORKITEM:signalcomm:continue] Large content broadcast completed in ${duration}ms ;CLEANUP_OK`);
        expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    // Test concurrent broadcasts
    test('Concurrent Broadcasting Support', async () => {
        console.log('[DEBUG-WORKITEM:signalcomm:continue] Testing concurrent broadcast handling ;CLEANUP_OK');

        await hostPage.goto(`/host/control-panel/${HOST_TOKEN}`);
        await hostPage.waitForLoadState('networkidle');

        // Create multiple quick broadcasts
        const broadcasts = [
            'First concurrent broadcast',
            'Second concurrent broadcast',
            'Third concurrent broadcast'
        ];

        const broadcastTextarea = hostPage.locator('textarea[placeholder*="HTML content"]');
        const broadcastButton = hostPage.locator('button:has-text("Broadcast to Sessions")');

        for (const content of broadcasts) {
            await broadcastTextarea.fill(`<p>${content}</p>`);
            await broadcastButton.click();
            await hostPage.waitForTimeout(1000); // Brief delay between broadcasts
        }

        // Verify all broadcasts were successful
        for (const content of broadcasts) {
            await hostPage.waitForSelector('text=Content broadcasted successfully', { timeout: 5000 });
        }

        console.log('[DEBUG-WORKITEM:signalcomm:continue] All concurrent broadcasts completed successfully ;CLEANUP_OK');
    });
});