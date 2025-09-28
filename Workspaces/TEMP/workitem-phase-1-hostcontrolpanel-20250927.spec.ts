import { expect, test } from '@playwright/test';

test.describe('Host Control Panel Phase 1 - Enhanced Header and Container', () => {
    test('should display enhanced header with gradient background and elegant container', async ({ page }) => {
        // Navigate to host control panel with test token
        await page.goto('https://localhost:9091/host/control-panel/TESTHOST');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Verify enhanced header exists with gradient background
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // Check if header has the new gradient background styling
        const headerStyle = await header.getAttribute('style');
        expect(headerStyle).toContain('linear-gradient(135deg,#F8F5F1,#FFFFFF)');
        expect(headerStyle).toContain('border-radius:1.5rem');
        expect(headerStyle).toContain('box-shadow');

        // Verify the enhanced H1 title
        const title = header.locator('h1');
        await expect(title).toBeVisible();
        await expect(title).toContainText('HOST CONTROL PANEL');

        // Check if title has gradient text styling
        const titleStyle = await title.getAttribute('style');
        expect(titleStyle).toContain('font-weight:800');
        expect(titleStyle).toContain('linear-gradient(135deg,#006400,#059669)');

        // Verify the new subtitle
        const subtitle = header.locator('p');
        await expect(subtitle).toBeVisible();
        await expect(subtitle).toContainText('Manage your session with professional-grade controls');

        // Verify elegant session container exists with enhanced styling by looking for the container with specific styling
        const sessionContainer = page.locator('div[style*="background:linear-gradient(135deg,#FFFFFF,#F8F9FA)"]');
        await expect(sessionContainer).toBeVisible();

        // Check container styling
        const containerStyle = await sessionContainer.getAttribute('style');
        expect(containerStyle).toContain('background:linear-gradient(135deg,#FFFFFF,#F8F9FA)');
        expect(containerStyle).toContain('border-radius:2rem');
        expect(containerStyle).toContain('box-shadow:0 20px 40px -12px rgba(0,0,0,0.35)');

        // Verify decorative gradient overlay exists within the container
        const gradientOverlay = sessionContainer.locator('div[style*="background:linear-gradient(90deg,#D4AF37,#FFD700,#D4AF37)"]');
        await expect(gradientOverlay).toBeVisible();
        const overlayStyle = await gradientOverlay.getAttribute('style');
        expect(overlayStyle).toContain('position:absolute');
        expect(overlayStyle).toContain('background:linear-gradient(90deg,#D4AF37,#FFD700,#D4AF37)');
    });
});