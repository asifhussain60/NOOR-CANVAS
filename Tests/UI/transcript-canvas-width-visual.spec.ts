import { percySnapshot } from '@percy/playwright';
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://localhost:9091';

// NOTE: Provide a valid token in env or update this const for your environment
const VALID_TOKEN = process.env.TRANSCRIPT_TOKEN || 'demo-token';

async function captureConsoleErrors(page) {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    return errors;
}

async function gotoTranscript(page) {
    await page.goto(`${BASE_URL}/transcript/canvas/${VALID_TOKEN}`);
    await page.waitForSelector('.canvas-header', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('.canvas-main-grid', { state: 'visible', timeout: 30000 });
}

async function assertHeaderMatchesContentWidth(page) {
    const { headerWidth, gridWidth } = await page.evaluate(() => {
        const header = document.querySelector('.canvas-header') as HTMLElement | null;
        const grid = document.querySelector('.canvas-main-grid') as HTMLElement | null;
        if (!header || !grid) return { headerWidth: -1, gridWidth: -1 };
        const headerRect = header.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        return { headerWidth: Math.round(headerRect.width), gridWidth: Math.round(gridRect.width) };
    });

    // Allow small rounding differences
    expect(Math.abs(headerWidth - gridWidth)).toBeLessThanOrEqual(2);
}

async function assertLogoBottomMargin(page) {
    const mb = await page.evaluate(() => {
        const el = document.querySelector('.canvas-header-logo') as HTMLElement | null;
        if (!el) return null;
        return getComputedStyle(el).marginBottom;
    });
    expect(mb).toBe('20px');
}

// Desktop 1280px
test('TranscriptCanvas desktop: header/content width aligned + no console errors', async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTranscript(page);
    await assertHeaderMatchesContentWidth(page);
    await assertLogoBottomMargin(page);
    await percySnapshot(page, 'transcript-canvas-desktop-width-align', { widths: [1280], minHeight: 900, percyCSS: '.canvas-signalr-indicator{visibility:hidden;}' });
    expect(errors, `Console errors detected: ${errors.join('\n')}`).toHaveLength(0);
});

// iPad Portrait 768px
test('TranscriptCanvas iPad portrait: header/content width aligned + no console errors', async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoTranscript(page);
    await assertHeaderMatchesContentWidth(page);
    await assertLogoBottomMargin(page);
    await percySnapshot(page, 'transcript-canvas-ipad-portrait-width-align', { widths: [768], minHeight: 1024, percyCSS: '.canvas-signalr-indicator{visibility:hidden;}' });
    expect(errors, `Console errors detected: ${errors.join('\n')}`).toHaveLength(0);
});

// iPad Landscape 1024px
test('TranscriptCanvas iPad landscape: header/content width aligned + no console errors', async ({ page }) => {
    const errors = await captureConsoleErrors(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoTranscript(page);
    await assertHeaderMatchesContentWidth(page);
    await assertLogoBottomMargin(page);
    await percySnapshot(page, 'transcript-canvas-ipad-landscape-width-align', { widths: [1024], minHeight: 768, percyCSS: '.canvas-signalr-indicator{visibility:hidden;}' });
    expect(errors, `Console errors detected: ${errors.join('\n')}`).toHaveLength(0);
});
