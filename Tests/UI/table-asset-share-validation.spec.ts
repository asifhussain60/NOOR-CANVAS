/**
 * table-asset-share-validation.spec.ts
 * Comprehensive E2E validation for table asset sharing + all other asset types
 * 
 * Coverage:
 * - 10 table share buttons (new functionality)
 * - 12 existing asset type share buttons (ayah-card, hadees, imgResponsive, esotericBlock)
 * - Attribute validation (data-share-id, data-asset-type, data-instance-number)
 * - Click handlers and SignalR broadcasting
 * - Visual regression with Percy snapshots (optional)
 */

import { expect, test } from '@playwright/test';

// Percy is optional - only import if available
let percySnapshot: any;
try {
    percySnapshot = require('@percy/playwright').default;
} catch (e) {
    console.log('[TEST] Percy not available - visual snapshots disabled');
    percySnapshot = async () => { }; // no-op function
}

const TEST_SESSION_ID = 212;
const TEST_SESSION_TOKEN = 'PQ9N5YWW';
const HOST_URL = 'https://localhost:9091';
const HCP_URL = `${HOST_URL}/hcp/${TEST_SESSION_TOKEN}`;

// Expected asset counts (validated by validate-asset-detection-session212.ps1)
const EXPECTED_COUNTS = {
    table: 10,
    'ayah-card': 4,
    'inserted-hadees': 3,
    imgResponsive: 4,
    esotericBlock: 1,
    TOTAL: 22
};

test.describe('Table Asset Share Validation - Session 212', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to HCP for session 212
        await page.goto(HCP_URL, { waitUntil: 'networkidle' });

        // Wait for transcript to load and asset processing to complete
        await page.waitForSelector('.ks-transcript', { timeout: 15000 });

        // Wait for share buttons to be injected
        await page.waitForSelector('[data-share-button="asset"]', { timeout: 10000 });

        console.log(`[TEST] HCP loaded for session ${TEST_SESSION_ID}`);
    });

    test('HCP renders all 22 share buttons (10 table + 12 other assets)', async ({ page }) => {
        // Count ALL share buttons injected by AssetProcessingService
        const allButtons = page.locator('[data-share-button="asset"]');
        const totalCount = await allButtons.count();

        console.log(`[TEST] Total share buttons detected: ${totalCount}`);
        expect(totalCount).toBe(EXPECTED_COUNTS.TOTAL);

        // Count table share buttons specifically
        const tableButtons = page.locator('[data-share-button="asset"][data-asset-type="table"]');
        const tableCount = await tableButtons.count();

        console.log(`[TEST] Table share buttons: ${tableCount}`);
        expect(tableCount).toBe(EXPECTED_COUNTS.table);

        // Visual regression snapshot
        await percySnapshot(page, 'HCP Session 212 - All Share Buttons Rendered');
    });

    test('Table share buttons have correct attributes', async ({ page }) => {
        const tableButtons = page.locator('[data-share-button="asset"][data-asset-type="table"]');

        // Validate first table button attributes
        const firstButton = tableButtons.first();

        const shareId = await firstButton.getAttribute('data-share-id');
        const assetType = await firstButton.getAttribute('data-asset-type');
        const instanceNumber = await firstButton.getAttribute('data-instance-number');

        expect(shareId).toBe('asset-table-1');
        expect(assetType).toBe('table');
        expect(instanceNumber).toBe('1');

        console.log(`[TEST] First table button attributes validated: ${shareId}, ${assetType}, instance ${instanceNumber}`);

        // Validate last table button (should be asset-table-10)
        const lastButton = tableButtons.last();
        const lastShareId = await lastButton.getAttribute('data-share-id');
        const lastInstance = await lastButton.getAttribute('data-instance-number');

        expect(lastShareId).toBe('asset-table-10');
        expect(lastInstance).toBe('10');

        console.log(`[TEST] Last table button validated: ${lastShareId}, instance ${lastInstance}`);
    });

    test('Ayah-card share buttons rendered correctly', async ({ page }) => {
        const ayahButtons = page.locator('[data-share-button="asset"][data-asset-type="ayah-card"]');
        const count = await ayahButtons.count();

        expect(count).toBe(EXPECTED_COUNTS['ayah-card']);
        console.log(`[TEST] Ayah-card buttons: ${count} (PASS)`);

        // Validate attributes
        const firstButton = ayahButtons.first();
        const shareId = await firstButton.getAttribute('data-share-id');
        expect(shareId).toBe('asset-ayah-card-1');
    });

    test('Inserted-hadees share buttons rendered correctly', async ({ page }) => {
        const hadeesButtons = page.locator('[data-share-button="asset"][data-asset-type="inserted-hadees"]');
        const count = await hadeesButtons.count();

        expect(count).toBe(EXPECTED_COUNTS['inserted-hadees']);
        console.log(`[TEST] Inserted-hadees buttons: ${count} (PASS)`);

        const firstButton = hadeesButtons.first();
        const shareId = await firstButton.getAttribute('data-share-id');
        expect(shareId).toBe('asset-inserted-hadees-1');
    });

    test('ImgResponsive share buttons rendered correctly', async ({ page }) => {
        const imgButtons = page.locator('[data-share-button="asset"][data-asset-type="imgResponsive"]');
        const count = await imgButtons.count();

        expect(count).toBe(EXPECTED_COUNTS.imgResponsive);
        console.log(`[TEST] ImgResponsive buttons: ${count} (PASS)`);

        const firstButton = imgButtons.first();
        const shareId = await firstButton.getAttribute('data-share-id');
        expect(shareId).toBe('asset-imgResponsive-1');
    });

    test('EsotericBlock share buttons rendered correctly', async ({ page }) => {
        const esotericButtons = page.locator('[data-share-button="asset"][data-asset-type="esotericBlock"]');
        const count = await esotericButtons.count();

        expect(count).toBe(EXPECTED_COUNTS.esotericBlock);
        console.log(`[TEST] EsotericBlock buttons: ${count} (PASS)`);

        const firstButton = esotericButtons.first();
        const shareId = await firstButton.getAttribute('data-share-id');
        expect(shareId).toBe('asset-esotericBlock-1');
    });

    test('Table share button click triggers console log (functional validation)', async ({ page }) => {
        const consoleLogs: string[] = [];

        // Listen for console messages from noor-share-system.js
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[NOOR-SHARE]')) {
                consoleLogs.push(text);
                console.log(`[CONSOLE] ${text}`);
            }
        });

        // Click first table share button
        const tableButton = page.locator('[data-share-button="asset"][data-asset-type="table"]').first();
        await tableButton.click();

        // Wait for click handler to execute
        await page.waitForTimeout(1000);

        // Verify console logs show share button click detected
        const clickLog = consoleLogs.find(log => log.includes('Share button clicked') && log.includes('asset-table-1'));
        expect(clickLog).toBeTruthy();

        console.log(`[TEST] Table share button click handler functional (console log detected)`);
    });

    test('Visual regression - Percy snapshot of all asset types with share buttons', async ({ page }) => {
        // Scroll to ensure all assets visible
        await page.evaluate(() => window.scrollTo(0, 0));
        await percySnapshot(page, 'Session 212 - Top of Transcript with Table Buttons');

        // Scroll to middle (more tables)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await percySnapshot(page, 'Session 212 - Middle Tables and Assets');

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await percySnapshot(page, 'Session 212 - Bottom Assets with Share Buttons');

        console.log(`[TEST] Percy snapshots captured for visual regression`);
    });
});

test.describe('Table Share Button Position Validation', () => {

    test('Share buttons appear BEFORE table elements (not inside)', async ({ page }) => {
        await page.goto(HCP_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-share-button="asset"][data-asset-type="table"]', { timeout: 10000 });

        // Get first table share button and corresponding table
        const firstTableButton = page.locator('[data-share-button="asset"][data-asset-type="table"]').first();
        const firstTable = page.locator('table[data-asset-id="asset-table-1"]').first();

        // Verify table has data-asset-id attribute (injected by AssetProcessingService)
        const tableAssetId = await firstTable.getAttribute('data-asset-id');
        expect(tableAssetId).toBe('asset-table-1');

        // Get bounding boxes to verify button appears BEFORE table (higher y-coordinate)
        const buttonBox = await firstTableButton.boundingBox();
        const tableBox = await firstTable.boundingBox();

        expect(buttonBox).not.toBeNull();
        expect(tableBox).not.toBeNull();

        // Button should be above table (smaller y-coordinate)
        if (buttonBox && tableBox) {
            expect(buttonBox.y).toBeLessThan(tableBox.y);
            console.log(`[TEST] Share button correctly positioned BEFORE table element`);
            console.log(`  Button Y: ${buttonBox.y}, Table Y: ${tableBox.y}`);
        }
    });
});

test.describe('SignalR Broadcast Validation (Multi-Context)', () => {

    test('Table share broadcasts to SessionCanvas receiver', async ({ browser }) => {
        // Create two contexts: Host (HCP) and Receiver (SessionCanvas)
        const hostContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const receiverContext = await browser.newContext({ ignoreHTTPSErrors: true });

        const hostPage = await hostContext.newPage();
        const receiverPage = await receiverContext.newPage();

        // Load HCP (host)
        await hostPage.goto(HCP_URL, { waitUntil: 'networkidle' });
        await hostPage.waitForSelector('[data-share-button="asset"][data-asset-type="table"]', { timeout: 10000 });

        // Load SessionCanvas (receiver)
        const sessionCanvasUrl = `${HOST_URL}/session/${TEST_SESSION_TOKEN}`;
        await receiverPage.goto(sessionCanvasUrl, { waitUntil: 'networkidle' });

        // Wait for SignalR connection to establish
        await receiverPage.waitForTimeout(2000);

        // Listen for shared asset on receiver
        const sharedAssetPromise = receiverPage.waitForSelector('.shared-asset-container', { timeout: 15000 });

        // Host clicks table share button
        const tableButton = hostPage.locator('[data-share-button="asset"][data-asset-type="table"]').first();
        await tableButton.click();

        console.log(`[TEST] Host clicked table share button (asset-table-1)`);

        // Verify receiver displays shared table
        const sharedAsset = await sharedAssetPromise;
        expect(sharedAsset).toBeTruthy();

        // Verify shared content contains table element
        const sharedContent = receiverPage.locator('.shared-asset-container table');
        const tableExists = await sharedContent.count() > 0;
        expect(tableExists).toBe(true);

        console.log(`[TEST] Table successfully broadcast and received via SignalR`);

        // Cleanup
        await hostContext.close();
        await receiverContext.close();
    });
});
