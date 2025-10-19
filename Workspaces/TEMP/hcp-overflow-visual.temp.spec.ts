/**
 * Temp Visual Test: Host Control Panel Overflow Guard
 */
import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.CANVAS_BASE_URL ?? 'https://localhost:9091').replace(/\/$/, '');
const HOST_TOKEN = process.env.CANVAS_HOST_TOKEN ?? 'PQ9N5YWW';
const HOST_URL = `${BASE_URL}/host/control-panel/${HOST_TOKEN}`;

const takePercy = async (page: any, name: string, options?: any) => {
    if (process && (process as any).env && (process as any).env.PERCY === 'true') {
        await percySnapshot(page, name, options as any);
    }
};

test('HCP Overflow - Desktop', async ({ page }) => {
    await page.goto(HOST_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.host-main-container', { timeout: 20000 });
    await page.waitForSelector('.host-transcript-panel', { timeout: 20000 });
    await page.waitForSelector('.host-qa-panel', { timeout: 20000 });

    const transcriptSelector = '#transcript-content-container, .session-transcript-content';
    let transcriptVisible = await page.locator(transcriptSelector).first().isVisible().catch(() => false);
    if (!transcriptVisible) {
        const shareBtn = page.getByRole('button', { name: /Share Transcript/i });
        if (await shareBtn.isVisible().catch(() => false)) {
            await shareBtn.click();
            await page.waitForSelector(transcriptSelector, { timeout: 20000 });
            transcriptVisible = true;
        } else {
            const startBtn = page.getByRole('button', { name: /Start Session/i });
            if (await startBtn.isVisible().catch(() => false)) {
                await startBtn.click();
                await page.waitForSelector(transcriptSelector, { timeout: 20000 });
                transcriptVisible = true;
            }
        }
    }

    await page.waitForTimeout(800);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
    await takePercy(page, 'HCP - Desktop Overflow Guard (temp)');
});