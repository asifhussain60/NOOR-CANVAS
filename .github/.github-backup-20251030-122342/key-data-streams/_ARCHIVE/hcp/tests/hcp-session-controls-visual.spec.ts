import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

/**
 * Visual regression test for Host Control Panel SESSION CONTROLS panel
 * Tests:
 * 1. FontAwesome icons render correctly (no garbled Unicode)
 * 2. Session details panel has proper border styling
 * 3. SESSION CONTROLS panel collapses smoothly when Start Session clicked
 * 4. Browser console has no JavaScript errors
 */

const HOST_TOKEN = 'PQ9N5YWW'; // Session 212 host token
const BASE_URL = 'http://localhost:9090'; // NoorCanvas default port

test.describe('Host Control Panel - Session Controls Visual Regression', () => {

    test.beforeEach(async ({ page }) => {
        // Monitor browser console for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Browser Error: ${msg.text()}`);
            }
        });

        // Navigate to Host Control Panel
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Allow for animations
    });

    test('should render SESSION CONTROLS with correct icons and borders', async ({ page }) => {
        // Verify FontAwesome icons loaded (not Unicode fallback)
        const slidersIcon = page.locator('.fa-solid.fa-sliders').first();
        await expect(slidersIcon).toBeVisible();

        // Verify session details panel has proper border
        const sessionDetailsPanel = page.locator('div').filter({ hasText: /Need For Messengers|Kitty Pryde/ }).first();
        const borderStyle = await sessionDetailsPanel.evaluate(el => window.getComputedStyle(el).border);
        expect(borderStyle).toContain('2px'); // Should be 2px solid #C5A84C

        // Percy snapshot - Before Start Session
        await percySnapshot(page, 'HCP Session Controls - Before Start', {
            widths: [1280],
            minHeight: 1024
        });
    });

    test('should collapse SESSION CONTROLS panel smoothly when Start Session clicked', async ({ page }) => {
        // Locate Start Session button
        const startButton = page.locator('button', { hasText: 'Start Session' });
        await expect(startButton).toBeVisible();

        // Get initial height of SESSION CONTROLS panel
        const controlsPanel = page.locator('div').filter({ hasText: 'SESSION CONTROLS' }).first();
        const initialHeight = await controlsPanel.boundingBox();

        // Click Start Session
        await startButton.click();
        await page.waitForTimeout(1000); // Wait for transition (0.5s transition + buffer)

        // Percy snapshot - During Transition
        await percySnapshot(page, 'HCP Session Controls - After Start (Collapsed)', {
            widths: [1280],
            minHeight: 1024
        });

        // Verify panel collapsed (opacity should be 0, max-height should be 0)
        const finalOpacity = await controlsPanel.evaluate(el => window.getComputedStyle(el).opacity);
        const finalMaxHeight = await controlsPanel.evaluate(el => window.getComputedStyle(el).maxHeight);

        expect(parseFloat(finalOpacity)).toBeLessThanOrEqual(0.1); // Should be 0 or very close
        expect(finalMaxHeight).toBe('0px');
    });

    test('should not have JavaScript errors in browser console', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Navigate and interact
        await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
        await page.waitForLoadState('networkidle');

        const startButton = page.locator('button', { hasText: 'Start Session' });
        await startButton.click();
        await page.waitForTimeout(2000);

        // Verify no console errors
        expect(consoleErrors.length).toBe(0);
        if (consoleErrors.length > 0) {
            console.error('Console Errors Found:', consoleErrors);
        }
    });

    test('should render play icon correctly in Start Session button', async ({ page }) => {
        // Verify play icon present (not garbled Unicode)
        const playIcon = page.locator('button:has-text("Start Session") .fa-play');
        await expect(playIcon).toBeVisible();

        // Verify no Unicode fallback text visible
        const buttonText = await page.locator('button:has-text("Start Session")').textContent();
        expect(buttonText).not.toContain('▶'); // Should not have Unicode fallback
    });
});
