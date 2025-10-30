/**
 * Visual Regression Test: Host Control Panel Overflow Fix
 * Key: hcp-canvas
 * Feature: host-control-panel-overflow
 *
 * Verifies that dynamic content (e.g., Share Transcript, injected buttons) does not cause horizontal overflow
 * in HostControlPanel. Applies min-width:0 strategy similar to TranscriptCanvas.
 */

import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.CANVAS_BASE_URL ?? 'https://localhost:9091').replace(/\/$/, '');
const HOST_TOKEN = process.env.CANVAS_HOST_TOKEN ?? 'PQ9N5YWW'; // default for session 212
const HOST_URL = `${BASE_URL}/host/control-panel/${HOST_TOKEN}`;

// Percy guard
const takePercy = async (page: any, name: string, options?: any) => {
    if (process && (process as any).env && (process as any).env.PERCY === 'true') {
        await percySnapshot(page, name, options as any);
    } else {
        console.log(`[percy] skipped snapshot: ${name}`);
    }
};

const VIEWPORTS = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 1024, height: 768 },
    mobile: { width: 375, height: 667 },
};

test.describe('Host Control Panel - Overflow Guard', () => {
    test('Desktop: No horizontal overflow after transcript visible', async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });

        // Trigger content render first (Share Transcript or Start Session), then wait for containers
        const transcriptSelector = '#transcript-content-container, .session-transcript-content';
        const shareBtn = page.getByRole('button', { name: /Share Transcript/i });
        if (await shareBtn.isVisible().catch(() => false)) {
            await shareBtn.click();
        } else {
            const startBtn = page.getByRole('button', { name: /Start Session/i });
            if (await startBtn.isVisible().catch(() => false)) {
                await startBtn.click();
            }
        }

        // Wait for transcript content and containers to appear
        await page.waitForSelector(transcriptSelector, { timeout: 20000 });
        await page.waitForSelector('.host-main-container', { timeout: 20000 });
        await page.waitForSelector('.host-transcript-panel', { timeout: 20000 });
        await page.waitForSelector('.host-qa-panel', { timeout: 20000 });

        // Allow any dynamic content (like injected buttons) to settle
        await page.waitForTimeout(1000);

        // Overflow check at document level
        const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasOverflow).toBe(false);

        await takePercy(page, 'HCP - Desktop 1920x1080');
    });

    test('Tablet: No horizontal overflow', async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.tablet);
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });
        const transcriptSelector = '#transcript-content-container, .session-transcript-content';
        const shareBtn = page.getByRole('button', { name: /Share Transcript/i });
        if (await shareBtn.isVisible().catch(() => false)) {
            await shareBtn.click();
        }
        await page.waitForSelector(transcriptSelector, { timeout: 20000 });
        await page.waitForSelector('.host-main-container', { timeout: 20000 });
        await page.waitForTimeout(500);

        const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasOverflow).toBe(false);

        await takePercy(page, 'HCP - Tablet 1024x768');
    });

    test('Mobile: No horizontal overflow', async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.mobile);
        await page.goto(HOST_URL, { waitUntil: 'networkidle' });
        const transcriptSelector = '#transcript-content-container, .session-transcript-content';
        const shareBtn = page.getByRole('button', { name: /Share Transcript/i });
        if (await shareBtn.isVisible().catch(() => false)) {
            await shareBtn.click();
        }
        await page.waitForSelector(transcriptSelector, { timeout: 20000 });
        await page.waitForSelector('.host-main-container', { timeout: 20000 });
        await page.waitForTimeout(500);

        const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasOverflow).toBe(false);

        await takePercy(page, 'HCP - Mobile 375x667');
    });
});
