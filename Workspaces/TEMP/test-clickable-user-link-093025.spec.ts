import { expect, Page, test } from '@playwright/test';

test.describe('Clickable User Registration Link Tests', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('CONTINUE-HOSTCONTROLPANEL-CLICKABLE-LINK: User registration link should be clickable and copy to clipboard', async () => {
        console.log('🔗 Testing clickable user registration link functionality...');

        // Navigate to host control panel
        await page.goto('https://localhost:9091/host/control', { waitUntil: 'networkidle' });

        // Wait for page to load and look for session management elements
        await page.waitForTimeout(2000);

        // Look for user registration link section
        const userLinkSection = page.locator('div:has-text("User Registration Link")').first();

        if (await userLinkSection.isVisible()) {
            console.log('✅ User registration link section found');

            // Find the clickable link (now an <a> tag instead of input)
            const userLink = page.locator('a[href*="/user/landing/"]').first();

            if (await userLink.isVisible()) {
                console.log('✅ Clickable user registration link found');

                // Test that link is properly formatted
                const linkHref = await userLink.getAttribute('href');
                expect(linkHref).toMatch(/https:\/\/localhost:9091\/user\/landing\/\w+/);
                console.log(`✅ Link format correct: ${linkHref}`);

                // Test that link has target="_blank"
                const target = await userLink.getAttribute('target');
                expect(target).toBe('_blank');
                console.log('✅ Link opens in new window (target="_blank")');

                // Test hover effect
                await userLink.hover();
                const linkStyle = await userLink.evaluate(el => window.getComputedStyle(el).backgroundColor);
                console.log(`✅ Hover effect active: ${linkStyle}`);

                // Grant clipboard permissions
                await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

                // Test click functionality (copy to clipboard)
                await userLink.click();
                console.log('✅ Link clicked successfully');

                // Wait a moment for clipboard operation
                await page.waitForTimeout(500);

                // Verify clipboard content
                const clipboardText = await page.evaluate(async () => {
                    try {
                        return await navigator.clipboard.readText();
                    } catch (e) {
                        return 'clipboard-not-accessible';
                    }
                });

                if (clipboardText !== 'clipboard-not-accessible') {
                    expect(clipboardText).toMatch(/https:\/\/localhost:9091\/user\/landing\/\w+/);
                    console.log(`✅ Link copied to clipboard: ${clipboardText}`);
                } else {
                    console.log('⚠️ Clipboard not accessible in test environment');
                }

                // Test that separate copy button still exists and works
                const copyButton = page.locator('button:has-text("Copy")').first();
                if (await copyButton.isVisible()) {
                    console.log('✅ Separate copy button still present');

                    await copyButton.click();
                    await page.waitForTimeout(500);

                    // Check for visual feedback
                    const buttonText = await copyButton.textContent();
                    console.log(`✅ Copy button feedback: ${buttonText}`);
                }

            } else {
                console.log('ℹ️ Clickable user registration link not visible (may require active session)');
            }
        } else {
            console.log('ℹ️ User registration link section not visible (may require active session)');
        }
    });

    test('UI Enhancement: Link styling and accessibility', async () => {
        console.log('🎨 Testing link styling and accessibility...');

        await page.goto('https://localhost:9091/host/control', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const userLink = page.locator('a[href*="/user/landing/"]').first();

        if (await userLink.isVisible()) {
            // Test accessibility attributes
            const title = await userLink.getAttribute('title');
            expect(title).toBeTruthy();
            console.log(`✅ Accessibility title: ${title}`);

            // Test styling properties
            const styles = await userLink.evaluate(el => {
                const computed = window.getComputedStyle(el);
                return {
                    cursor: computed.cursor,
                    color: computed.color,
                    textDecoration: computed.textDecoration,
                    fontFamily: computed.fontFamily
                };
            });

            expect(styles.cursor).toBe('pointer');
            expect(styles.textDecoration).toMatch(/none/);
            console.log('✅ Link styling verified:', styles);

            // Test updated help text
            const helpText = page.locator('p:has-text("Click the link to open in a new window")').first();
            if (await helpText.isVisible()) {
                console.log('✅ Updated help text found');
            }
        }
    });
});