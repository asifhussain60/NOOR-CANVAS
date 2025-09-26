/**
 * NOOR Canvas Test Utilities
 * 
 * Shared utility functions for Playwright tests in the debug suite.
 * Provides consistent patterns for Blazor interaction, SignalR monitoring,
 * and test data management.
 */

import { Page, expect } from '@playwright/test';

export interface TestUser {
    name: string;
    email: string;
    country: string;
    countryCode: string;
}

export interface SignalRMessage {
    hubName: string;
    methodName: string;
    payload: any;
    timestamp: string;
}

/**
 * Superhero test users with geographic diversity
 */
export const TEST_USERS: TestUser[] = [
    { name: 'Clark Kent', email: 'superman@dailyplanet.com', country: 'United States', countryCode: 'US' },
    { name: 'Diana Prince', email: 'wonder.woman@themyscira.com', country: 'United Kingdom', countryCode: 'GB' },
    { name: 'Bruce Wayne', email: 'batman@wayneent.com', country: 'Australia', countryCode: 'AU' },
    { name: 'Barry Allen', email: 'flash@starlabs.com', country: 'India', countryCode: 'IN' },
    { name: 'Arthur Curry', email: 'aquaman@atlantis.com', country: 'Pakistan', countryCode: 'PK' }
];

/**
 * Islamic education focused test questions
 */
export const TEST_QUESTIONS = [
    "What are the five pillars of Islam?",
    "How do we perform proper Wudu?",
    "What is the significance of Ramadan?",
    "Can you explain the concept of Zakat?",
    "What are the times for daily prayers?"
];

/**
 * Test configuration constants
 */
export const TEST_CONFIG = {
    APP_BASE_URL: 'https://localhost:9091',
    TEST_SESSION_ID: '215',
    TEST_HOST_TOKEN: 'TEST_H215',
    TIMEOUTS: {
        PAGE_LOAD: 10000,
        SIGNALR_PROPAGATION: 3000,
        BLAZOR_BINDING: 500,
        USER_REGISTRATION: 5000,
        SESSION_START: 15000
    }
};

/**
 * Infrastructure validation to ensure app is running
 */
export async function validateInfrastructure(): Promise<void> {
    console.log('🔍 [DEBUG-WORKITEM:debug:infra] Validating infrastructure');

    try {
        const https = require('https');
        const { URL } = require('url');

        const url = new URL(`${TEST_CONFIG.APP_BASE_URL}/healthz`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'HEAD',
            rejectUnauthorized: false
        };

        const response = await new Promise<{ ok: boolean; status: number }>((resolve, reject) => {
            const req = https.request(options, (res: any) => {
                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
            });
            req.on('error', reject);
            req.end();
        });

        expect(response.ok).toBe(true);
        console.log('✅ [DEBUG-WORKITEM:debug:infra] Application running on https://localhost:9091');
    } catch (error) {
        throw new Error(`❌ [DEBUG-WORKITEM:debug:infra] Infrastructure validation failed: ${error}`);
    }
}

/**
 * Blazor-safe input filling that properly triggers binding events
 */
export async function fillBlazorInput(page: Page, selector: string, value: string): Promise<void> {
    const input = page.locator(selector);
    await input.fill('');
    await input.fill(value);
    await input.dispatchEvent('input');
    await input.dispatchEvent('change');
    await page.waitForTimeout(TEST_CONFIG.TIMEOUTS.BLAZOR_BINDING);
}

/**
 * Setup SignalR message monitoring for a page
 */
export async function setupSignalRMonitoring(page: Page, contextLabel: string): Promise<void> {
    page.on('console', msg => {
        if (msg.text().includes('SignalR') ||
            msg.text().includes('NOOR-HUB') ||
            msg.text().includes('DEBUG-WORKITEM')) {
            console.log(`[${contextLabel}-SIGNALR] ${msg.text()}`);
        }
    });

    // Inject SignalR message capture
    await page.evaluate(() => {
        (window as any).capturedSignalRMessages = [];

        // Override SignalR connection methods if available
        const originalOn = console.log; // Placeholder for actual SignalR hook
    });
}

/**
 * Register a test user through the UserLanding page
 */
export async function registerTestUser(page: Page, user: TestUser, userIndex: number): Promise<string> {
    console.log(`📝 [DEBUG-WORKITEM:debug:user-${userIndex}] Registering user: ${user.name}`);

    // Navigate to user landing page
    await page.goto(`${TEST_CONFIG.APP_BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Fill registration form
    await fillBlazorInput(page, '#user-name', user.name);
    await fillBlazorInput(page, '#user-email', user.email);

    // Select country from dropdown
    await page.selectOption('#country-select', user.countryCode);
    await page.waitForTimeout(TEST_CONFIG.TIMEOUTS.BLAZOR_BINDING);

    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should navigate to waiting room
    await expect(page).toHaveURL(/\/session\/waiting\//, { timeout: TEST_CONFIG.TIMEOUTS.USER_REGISTRATION });
    await expect(page.locator('text=Waiting Room')).toBeVisible();

    // Extract user token from URL
    const currentUrl = page.url();
    const tokenMatch = currentUrl.match(/\/session\/waiting\/([^?]+)/);
    const userToken = tokenMatch ? tokenMatch[1] : '';

    console.log(`✅ [DEBUG-WORKITEM:debug:user-${userIndex}] User ${user.name} registered with token: ${userToken}`);

    return userToken;
}

/**
 * Submit a question from a participant in SessionCanvas
 */
export async function submitQuestion(page: Page, question: string, userIndex: number): Promise<void> {
    console.log(`❓ [DEBUG-WORKITEM:debug:user-${userIndex}] Posting question: "${question}"`);

    // Fill question input
    await fillBlazorInput(page, '#question-input', question);

    // Submit question
    await page.click('button:has-text("Submit Question")');
    await page.waitForTimeout(1000);

    // Validate question appears in participant's view
    await expect(page.locator('text=' + question)).toBeVisible({ timeout: 5000 });

    console.log(`✅ [DEBUG-WORKITEM:debug:user-${userIndex}] Question submitted: "${question}"`);
}

/**
 * Setup host control panel context
 */
export async function setupHostControlPanel(page: Page): Promise<void> {
    console.log('📋 [DEBUG-WORKITEM:debug:host] Setting up host control panel');

    await page.goto(`${TEST_CONFIG.APP_BASE_URL}/host/control-panel/${TEST_CONFIG.TEST_HOST_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Validate host control panel loads
    await expect(page.locator('text=Host Control Panel')).toBeVisible({ timeout: TEST_CONFIG.TIMEOUTS.PAGE_LOAD });
    await expect(page.locator('text=Session')).toBeVisible();

    console.log('✅ [DEBUG-WORKITEM:debug:host] Host control panel ready');
}

/**
 * Validate asset sharing message contract
 */
export async function validateAssetSharingContract(payload: any): Promise<void> {
    expect(payload).toHaveProperty('shareId');
    expect(payload).toHaveProperty('assetType');
    expect(payload).toHaveProperty('testContent');

    if (payload.testContent) {
        expect(typeof payload.testContent).toBe('string');
        expect(payload.testContent.length).toBeGreaterThan(0);
    }

    console.log('✅ [DEBUG-WORKITEM:debug:contract] Asset sharing contract validated');
}

/**
 * Validate Q&A message contract
 */
export async function validateQAContract(payload: any, expectedQuestion: string): Promise<void> {
    expect(payload).toHaveProperty('questionId');
    expect(payload).toHaveProperty('questionText');
    expect(payload).toHaveProperty('userName');
    expect(payload).toHaveProperty('timestamp');

    expect(payload.questionText).toBe(expectedQuestion);

    console.log('✅ [DEBUG-WORKITEM:debug:contract] Q&A contract validated');
}

/**
 * Generate a random superhero user (for dynamic testing)
 */
export function getRandomTestUser(): TestUser {
    return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

/**
 * Generate a random Islamic education question
 */
export function getRandomTestQuestion(): string {
    return TEST_QUESTIONS[Math.floor(Math.random() * TEST_QUESTIONS.length)];
}

/**
 * Wait for SignalR propagation with retry logic
 */
export async function waitForSignalRPropagation(timeoutMs: number = TEST_CONFIG.TIMEOUTS.SIGNALR_PROPAGATION): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}

/**
 * Capture page errors for debugging
 */
export async function setupErrorCapture(page: Page, contextLabel: string): Promise<void> {
    page.on('pageerror', error => {
        console.error(`[${contextLabel}-ERROR] Page error: ${error.message}`);
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`[${contextLabel}-CONSOLE-ERROR] ${msg.text()}`);
        }
    });
}