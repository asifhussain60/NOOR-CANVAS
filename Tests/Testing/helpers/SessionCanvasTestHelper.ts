import { Page, expect } from '@playwright/test';

/**
 * Helper class for SessionCanvas testing operations
 */
export class SessionCanvasTestHelper {
    constructor(private page: Page) { }

    /**
     * Navigate to SessionCanvas with a given token
     */
    async navigateToSessionCanvas(token: string): Promise<void> {
        const url = `https://localhost:9091/session/canvas/${token}`;
        console.log(`[HELPER] Navigating to SessionCanvas: ${url}`);
        await this.page.goto(url);
    }

    /**
     * Wait for SessionCanvas to load completely
     */
    async waitForSessionCanvasLoad(): Promise<void> {
        // Wait for key elements that indicate page is loaded
        await this.page.waitForSelector('textarea[placeholder="Ask a question..."]', { timeout: 10000 });
        await this.page.waitForSelector('button:has-text("Submit")', { timeout: 5000 });
    }

    /**
     * Submit a question via the form
     */
    async submitQuestion(questionText: string): Promise<void> {
        const textarea = this.page.locator('textarea[placeholder="Ask a question..."]');
        await textarea.fill(questionText);

        const submitButton = this.page.locator('button:has-text("Submit")').first();
        await submitButton.click();
    }

    /**
     * Verify no page navigation occurred (for form submission prevention tests)
     */
    async verifyNoNavigation(initialUrl: string): Promise<void> {
        const currentUrl = this.page.url();
        expect(currentUrl).toBe(initialUrl);
    }
}