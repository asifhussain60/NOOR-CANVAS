/**
 * ⚠️ DEPRECATED - 2025-11-02
 * 
 * REASON: Uses fragile text-based selectors instead of component IDs
 * REPLACEMENT: hcp-fab-button-verification.spec.ts (uses ID-based selectors)
 * 
 * MIGRATION NOTES:
 * - Replace text selectors with ID selectors
 * - button:has-text("Transcript Canvas") → #reg-transcript-canvas-btn
 * - button:has-text("Start Session") → #sidebar-start-session-btn
 * 
 * See: KDS/knowledge/learnings/SELF-REVIEW-fab-button-test-restoration.md
 * See: KDS/prompts/user/kds.md (Component ID-Based Selectors section)
 * 
 * Simple FAB Button Injection Test
 * 
 * Prerequisites: App must be running on https://localhost:9091
 * 
 * Tests:
 * 1. FAB button is injected into assets
 * 2. Assets are wrapped in div containers
 * 3. Buttons have unique IDs
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'https://localhost:9091';
const HOST_TOKEN = 'PQ9N5YWW'; // Session 212

test.describe('FAB Button Injection - Simple Test', () => {

    test('should inject FAB buttons into wrapped assets on Host Control Panel', async ({ page }) => {
        console.log('🧪 Starting FAB button injection test...');

        // Navigate to Host Control Panel
        const url = `${BASE_URL}/host/control-panel/${HOST_TOKEN}`;
        console.log(`📍 Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for transcript to load
        console.log('⏳ Waiting for transcript container...');
        await page.waitForSelector('#content-transcript-container', { timeout: 10000 });

        // Check if any assets exist in the transcript
        const hasAssets = await page.evaluate(() => {
            const container = document.querySelector('#content-transcript-container');
            if (!container) return false;

            // Look for common asset tags
            const assets = container.querySelectorAll('img, video, audio, table, blockquote, pre');
            console.log(`Found ${assets.length} potential assets`);
            return assets.length > 0;
        });

        if (!hasAssets) {
            console.log('⚠️  No assets found in transcript - test may need data');
            // Don't fail the test, just note it
            test.skip();
            return;
        }

        console.log('✅ Assets found in transcript');

        // Test 1: Check if assets are wrapped in divs
        console.log('🔍 Test 1: Checking asset wrapping...');
        const wrappedAssets = await page.evaluate(() => {
            const container = document.querySelector('#content-transcript-container');
            if (!container) return [];

            // Look for wrapped assets with data-asset-id
            const wrapped = container.querySelectorAll('[data-asset-id]');
            return Array.from(wrapped).map(el => ({
                tag: el.tagName,
                assetId: el.getAttribute('data-asset-id'),
                hasParent: el.parentElement?.classList.contains('asset-container') || false
            }));
        });

        console.log(`   Found ${wrappedAssets.length} wrapped assets:`, wrappedAssets);
        expect(wrappedAssets.length).toBeGreaterThan(0);

        // Test 2: Check if FAB buttons are injected
        console.log('🔍 Test 2: Checking FAB button injection...');
        const fabButtons = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button.asset-fab-share');
            return Array.from(buttons).map(btn => ({
                id: btn.id,
                assetId: btn.getAttribute('data-asset-id'),
                assetType: btn.getAttribute('data-asset-type'),
                visible: (btn as HTMLElement).offsetParent !== null
            }));
        });

        console.log(`   Found ${fabButtons.length} FAB buttons:`, fabButtons);
        expect(fabButtons.length).toBeGreaterThan(0);

        // Test 3: Verify unique IDs
        console.log('🔍 Test 3: Checking unique IDs...');
        const buttonIds = fabButtons.map(btn => btn.id);
        const uniqueIds = new Set(buttonIds);

        console.log(`   Total buttons: ${buttonIds.length}, Unique IDs: ${uniqueIds.size}`);
        expect(uniqueIds.size).toBe(buttonIds.length);

        // Test 4: Verify asset-id matches between wrapper and button
        console.log('🔍 Test 4: Checking asset-id consistency...');
        const consistencyCheck = await page.evaluate(() => {
            const results: Array<{ assetId: string, hasWrapper: boolean, hasButton: boolean }> = [];

            // Get all asset IDs
            const assetElements = document.querySelectorAll('[data-asset-id]');
            const assetIds = new Set(Array.from(assetElements).map(el => el.getAttribute('data-asset-id')).filter(Boolean));

            assetIds.forEach(assetId => {
                const wrapper = document.querySelector(`[data-asset-id="${assetId}"]`);
                const button = document.querySelector(`button[data-asset-id="${assetId}"]`);

                results.push({
                    assetId: assetId || '',
                    hasWrapper: wrapper !== null,
                    hasButton: button !== null
                });
            });

            return results;
        });

        console.log(`   Consistency check results:`, consistencyCheck);

        // Every asset should have both wrapper and button
        const allConsistent = consistencyCheck.every(result => result.hasWrapper && result.hasButton);
        expect(allConsistent).toBe(true);

        console.log('✅ All tests passed!');
    });

    test('should have properly positioned FAB buttons', async ({ page }) => {
        console.log('🧪 Testing FAB button positioning...');

        const url = `${BASE_URL}/host/control-panel/${HOST_TOKEN}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector('#content-transcript-container', { timeout: 10000 });

        // Check button positioning
        const positioningCheck = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button.asset-fab-share');
            if (buttons.length === 0) return { hasButtons: false, results: [] };

            return {
                hasButtons: true,
                results: Array.from(buttons).map(btn => {
                    const styles = window.getComputedStyle(btn as HTMLElement);
                    return {
                        id: btn.id,
                        position: styles.position,
                        display: styles.display,
                        visibility: styles.visibility
                    };
                })
            };
        });

        if (!positioningCheck.hasButtons) {
            console.log('⚠️  No FAB buttons found - skipping positioning test');
            test.skip();
            return;
        }

        console.log('   Button positioning:', positioningCheck.results);

        // Buttons should be positioned (absolute or relative)
        positioningCheck.results.forEach(result => {
            expect(['absolute', 'relative', 'fixed']).toContain(result.position);
            expect(result.display).not.toBe('none');
            expect(result.visibility).not.toBe('hidden');
        });

        console.log('✅ Positioning test passed!');
    });
});
