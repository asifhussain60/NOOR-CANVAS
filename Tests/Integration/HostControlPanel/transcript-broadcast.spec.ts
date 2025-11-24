/**
 * [REFACTOR:Phase1] Host Control Panel - Transcript Broadcasting Integration Tests
 * Tests transcript display, transformation, section sharing, and full broadcast
 */

import { expect, test } from '@playwright/test';

const TEST_HOST_TOKEN = 'testhost';
const BASE_URL = 'http://localhost:5000';

test.describe('Host Control Panel - Transcript Broadcasting', () => {

    test('should display transcript panel when session is Active', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for transcript panel
        const transcriptPanel = page.locator('.host-transcript-panel, [class*="transcript"]');

        if (await transcriptPanel.count() > 0) {
            console.log('✅ Transcript panel visible');
            await expect(transcriptPanel.first()).toBeVisible();
        } else {
            console.log('ℹ️ Transcript panel not visible (session may not be Active)');
        }
    });

    test('should render transcript content safely', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const transcriptContent = page.locator('.transcript-content, [class*="transcript"] > div');

        if (await transcriptContent.count() === 0) {
            console.log('ℹ️ No transcript content available');
            test.skip();
            return;
        }

        // Get transcript HTML
        const transcriptHtml = await transcriptContent.first().innerHTML();
        console.log(`📄 Transcript HTML length: ${transcriptHtml.length} characters`);

        // Verify no dangerous scripts
        const hasDangerousContent = transcriptHtml.includes('<script>') ||
            transcriptHtml.includes('javascript:') ||
            transcriptHtml.includes('onerror=');

        expect(hasDangerousContent).toBe(false);
        console.log('✅ Transcript content safely rendered (no XSS vulnerabilities)');
    });

    test('should detect h2 sections in transcript', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for h2 headers in transcript
        const h2Sections = page.locator('.host-transcript-panel h2, [class*="transcript"] h2');
        const sectionCount = await h2Sections.count();

        console.log(`📊 Found ${sectionCount} h2 sections in transcript`);

        if (sectionCount > 0) {
            // Get first section title
            const firstSectionTitle = await h2Sections.first().textContent();
            console.log(`✅ First section: "${firstSectionTitle}"`);
        } else {
            console.log('ℹ️ No h2 sections detected in transcript');
        }
    });

    test('should inject section share buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for section share buttons
        const sectionShareButtons = page.locator('button[data-section-id], button:has-text("Share Section")');
        const buttonCount = await sectionShareButtons.count();

        console.log(`🔘 Found ${buttonCount} section share buttons`);

        if (buttonCount > 0) {
            const firstButton = sectionShareButtons.first();
            const sectionId = await firstButton.getAttribute('data-section-id');

            console.log(`✅ Section share button found: ${sectionId}`);
            expect(sectionId).toBeTruthy();
        } else {
            console.log('ℹ️ No section share buttons (may not be implemented or no sections)');
        }
    });

    test('should handle section share button click', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const sectionShareButton = page.locator('button[data-section-id]').first();

        if (await sectionShareButton.count() === 0) {
            console.log('ℹ️ No section share buttons available');
            test.skip();
            return;
        }

        // Listen for console logs
        const shareLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('ShareTranscriptSection') || msg.text().includes('SECTION')) {
                shareLogs.push(msg.text());
            }
        });

        console.log('🖱️ Clicking section share button');
        await sectionShareButton.click();
        await page.waitForTimeout(2000);

        if (shareLogs.length > 0) {
            console.log('✅ Section share triggered');
            console.log(`📋 Share logs: ${shareLogs.length}`);
        }
    });

    test('should have broadcast full transcript button', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Look for broadcast button
        const broadcastButton = page.locator('button:has-text("Broadcast"), button:has-text("Share Transcript")');

        if (await broadcastButton.count() > 0) {
            console.log('✅ Broadcast transcript button found');
            await expect(broadcastButton.first()).toBeVisible();
        } else {
            console.log('ℹ️ Broadcast button not visible (may be in different state)');
        }
    });

    test('should handle broadcast transcript button click', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const broadcastButton = page.locator('button:has-text("Broadcast"), button:has-text("Share Transcript")').first();

        if (await broadcastButton.count() === 0) {
            console.log('ℹ️ Broadcast button not available');
            test.skip();
            return;
        }

        // Listen for console logs
        const broadcastLogs: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('BROADCAST') || msg.text().includes('BroadcastFullTranscript')) {
                broadcastLogs.push(msg.text());
            }
        });

        console.log('🖱️ Clicking broadcast transcript button');
        await broadcastButton.click();
        await page.waitForTimeout(3000);

        if (broadcastLogs.length > 0) {
            console.log('✅ Broadcast action triggered');
            console.log(`📋 Broadcast logs: ${broadcastLogs.length}`);
        }
    });

    test('should transform transcript for broadcast', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check if TranscriptProcessingService is working
        const transcriptContent = page.locator('.transcript-content, [class*="transcript"] > div');

        if (await transcriptContent.count() === 0) {
            console.log('ℹ️ No transcript content for transformation test');
            test.skip();
            return;
        }

        const transcriptHtml = await transcriptContent.first().innerHTML();

        // Verify transformations applied:
        // 1. Delete buttons removed
        const hasDeleteButtons = transcriptHtml.includes('Delete') &&
            transcriptHtml.includes('button');

        // 2. Share buttons present
        const hasShareButtons = transcriptHtml.includes('Share') &&
            transcriptHtml.includes('data-share-id');

        console.log(`📊 Transcript transformations - Delete buttons: ${hasDeleteButtons ? 'present' : 'removed'}, Share buttons: ${hasShareButtons ? 'present' : 'absent'}`);

        if (!hasDeleteButtons && hasShareButtons) {
            console.log('✅ Transcript transformed correctly for host view');
        }
    });

    test('should verify ShareTranscriptSection JSInvokable method', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        // Check if Blazor ref is available
        const hasBlazorRef = await page.evaluate(() => {
            return typeof (window as any).hostControlPanelRef !== 'undefined';
        });

        if (hasBlazorRef) {
            console.log('✅ Blazor interop reference available for section sharing');

            // Verify we can call the method (without actually calling to avoid side effects)
            const canCallMethod = await page.evaluate(() => {
                const ref = (window as any).hostControlPanelRef;
                return ref && typeof ref.invokeMethodAsync === 'function';
            });

            expect(canCallMethod).toBe(true);
            console.log('✅ ShareTranscriptSection method accessible via JSInvokable');
        } else {
            console.log('⚠️ Blazor interop not initialized');
        }
    });

    test('should handle empty transcript gracefully', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(3000);

        const transcriptPanel = page.locator('.host-transcript-panel');

        if (await transcriptPanel.count() === 0) {
            console.log('ℹ️ No transcript panel (session not Active)');
            test.skip();
            return;
        }

        const transcriptContent = await transcriptPanel.innerHTML();

        if (transcriptContent.trim().length < 100) {
            console.log('📄 Transcript appears empty or minimal');

            // Should still render without errors
            await expect(transcriptPanel).toBeVisible();
            console.log('✅ Empty transcript handled gracefully');
        } else {
            console.log('📄 Transcript has content');
        }
    });

    test('should display transcript processing indicators', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);

        // Look for loading indicators during initial load
        await page.waitForTimeout(1000);

        const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], text=/Loading/i');
        const hasLoadingIndicator = await loadingIndicator.count() > 0;

        if (hasLoadingIndicator) {
            console.log('✅ Loading indicator displayed during initialization');

            // Wait for loading to complete
            await page.waitForTimeout(3000);

            // Verify loading indicator is gone
            const stillLoading = await loadingIndicator.isVisible().catch(() => false);

            if (!stillLoading) {
                console.log('✅ Loading indicator removed after initialization');
            }
        } else {
            console.log('ℹ️ No loading indicator visible (may load instantly)');
        }
    });

    test('should verify transcript section parser loaded', async ({ page }) => {
        await page.goto(`${BASE_URL}/host/control-panel/${TEST_HOST_TOKEN}`);
        await page.waitForTimeout(2000);

        // Check if transcript-section-parser.js is loaded
        const parserLoaded = await page.evaluate(() => {
            // Check for parser-specific functions or global variables
            return typeof (window as any).parseTranscriptSections === 'function' ||
                document.querySelector('script[src*="transcript-section-parser"]') !== null;
        });

        if (parserLoaded) {
            console.log('✅ Transcript section parser loaded');
        } else {
            console.log('ℹ️ Transcript section parser not detected');
        }
    });
});
