import { expect, test } from '@playwright/test';

/**
 * DEBUG: Focused test to understand exactly why share buttons aren't being injected
 * This test will check the AssetHtmlProcessingService step by step
 */
test.describe('Asset Share Debug - Step by Step Analysis', () => {
    test('Debug AssetHtmlProcessingService and share button injection chain', async ({ page }) => {
        const trackingId = `step-by-step-${Date.now()}`;
        console.log(`[DEBUG-STEPWISE:${trackingId}] Starting step-by-step analysis`);

        // Navigate to session 212 (confirmed to have ayah-card assets and Active status)
        await page.goto('https://localhost:44301/host?sessionId=212');
        await expect(page.locator('.host-control-panel')).toBeVisible({ timeout: 10000 });

        console.log(`[DEBUG-STEPWISE:${trackingId}] Host Control Panel loaded for session 212`);

        // Wait for the transcript to be processed
        await page.waitForTimeout(3000);

        // Step 1: Check raw transcript content BEFORE any processing
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 1: Raw Transcript Analysis ===`);
        const rawTranscript = await page.evaluate(() => {
            // Look for the original transcript data before processing
            const transcriptDiv = document.querySelector('.ks-transcript');
            return transcriptDiv ? transcriptDiv.innerHTML : 'NOT_FOUND';
        });

        if (rawTranscript !== 'NOT_FOUND') {
            console.log(`[DEBUG-STEPWISE:${trackingId}] Raw transcript length: ${rawTranscript.length}`);
            console.log(`[DEBUG-STEPWISE:${trackingId}] Contains ayah-card: ${rawTranscript.includes('ayah-card')}`);
            console.log(`[DEBUG-STEPWISE:${trackingId}] Contains data-asset-id: ${rawTranscript.includes('data-asset-id')}`);
            console.log(`[DEBUG-STEPWISE:${trackingId}] Contains share button: ${rawTranscript.includes('ks-share-btn')}`);
        }

        // Step 2: Check if AssetHtmlProcessingService is being used
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 2: Service Usage Check ===`);
        const assetProcessingCheck = await page.evaluate(() => {
            // Check if the service has been loaded/used
            return {
                hasProcessedAssets: document.querySelectorAll('[data-asset-id]').length > 0,
                hasShareableClass: document.querySelectorAll('.noor-shareable-asset').length > 0,
                hasAyahCards: document.querySelectorAll('.ayah-card').length,
                totalElements: document.querySelectorAll('*').length
            };
        });

        console.log(`[DEBUG-STEPWISE:${trackingId}] AssetHtmlProcessingService signs:`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Elements with data-asset-id: ${assetProcessingCheck.hasProcessedAssets}`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Elements with noor-shareable-asset: ${assetProcessingCheck.hasShareableClass}`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Ayah card elements found: ${assetProcessingCheck.hasAyahCards}`);

        // Step 3: Check network calls for asset processing
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 3: Network Activity Check ===`);

        // Monitor network activity for asset-related calls
        const networkLogs: string[] = [];
        page.on('response', response => {
            if (response.url().includes('assets') || response.url().includes('session')) {
                networkLogs.push(`${response.status()} ${response.url()}`);
            }
        });

        // Trigger any processing by scrolling or interacting
        await page.evaluate(() => window.scrollTo(0, 100));
        await page.waitForTimeout(1000);

        console.log(`[DEBUG-STEPWISE:${trackingId}] Network activity: ${networkLogs.join(', ')}`);

        // Step 4: Look for any JavaScript errors in console
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 4: Console Error Check ===`);

        const jsErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        // Wait a bit more to catch any delayed errors
        await page.waitForTimeout(2000);

        if (jsErrors.length > 0) {
            console.log(`[DEBUG-STEPWISE:${trackingId}] JavaScript errors found: ${jsErrors.join(' | ')}`);
        } else {
            console.log(`[DEBUG-STEPWISE:${trackingId}] No JavaScript errors detected`);
        }

        // Step 5: Check the exact HTML structure of ayah-card elements
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 5: Ayah Card Structure Analysis ===`);

        const ayahCardAnalysis = await page.evaluate(() => {
            const ayahCards = document.querySelectorAll('.ayah-card');
            if (ayahCards.length === 0) return { count: 0, samples: [] };

            const samples = Array.from(ayahCards).slice(0, 2).map((card, idx) => ({
                index: idx,
                id: card.id || 'NO_ID',
                classes: card.className,
                hasDataAssetId: card.hasAttribute('data-asset-id'),
                dataAssetId: card.getAttribute('data-asset-id') || 'NONE',
                hasShareButton: card.previousElementSibling?.classList.contains('ks-share-btn') || false,
                outerHtmlStart: card.outerHTML.substring(0, 200) + '...'
            }));

            return {
                count: ayahCards.length,
                samples
            };
        });

        console.log(`[DEBUG-STEPWISE:${trackingId}] Ayah cards found: ${ayahCardAnalysis.count}`);
        ayahCardAnalysis.samples.forEach((sample, idx) => {
            console.log(`[DEBUG-STEPWISE:${trackingId}] Card ${idx + 1}: ID=${sample.id}, data-asset-id=${sample.dataAssetId}, hasShareButton=${sample.hasShareButton}`);
            console.log(`[DEBUG-STEPWISE:${trackingId}] Card ${idx + 1} HTML: ${sample.outerHtmlStart}`);
        });

        // Step 6: Manual check of the session status in the UI
        console.log(`[DEBUG-STEPWISE:${trackingId}] === STEP 6: Session Status Verification ===`);

        const sessionStatus = await page.evaluate(() => {
            // Look for session status indicators in the UI
            const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"]');
            const statusTexts = Array.from(statusElements).map(el => el.textContent?.trim()).filter(Boolean);

            return {
                statusElementsFound: statusElements.length,
                statusTexts: statusTexts.slice(0, 5), // First 5 status texts
                pageTitle: document.title,
                hasActiveIndicator: document.body.innerHTML.toLowerCase().includes('active')
            };
        });

        console.log(`[DEBUG-STEPWISE:${trackingId}] Session status check:`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Status elements found: ${sessionStatus.statusElementsFound}`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Status texts: ${sessionStatus.statusTexts.join(', ')}`);
        console.log(`[DEBUG-STEPWISE:${trackingId}] - Page has 'active' text: ${sessionStatus.hasActiveIndicator}`);

        console.log(`[DEBUG-STEPWISE:${trackingId}] === ANALYSIS COMPLETE ===`);

        // The test passes regardless - we're just debugging
        expect(true).toBe(true);
    });
});