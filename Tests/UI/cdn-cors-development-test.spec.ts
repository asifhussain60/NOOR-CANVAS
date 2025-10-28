/**
 * CDN CORS Development Access Test
 * 
 * Purpose: Verify that resources.kashkole.com CDN allows CORS access
 *          from localhost development origins after applying -IncludeDevelopment
 * 
 * Test Scenarios:
 * 1. Direct fetch from localhost:5000 origin
 * 2. Direct fetch from localhost:5001 origin
 * 3. Direct fetch from https://localhost:5001 origin
 * 
 * Expected: All requests succeed with proper CORS headers
 * 
 * Related: cdn-dev-cors-extension task
 */

import { expect, test } from '@playwright/test';

test.describe('CDN CORS Development Access', () => {

    test('should allow CORS from http://localhost:5000', async ({ page }) => {
        // Navigate to a localhost:5000 context
        await page.goto('http://localhost:5000');

        // Attempt to fetch a CDN resource
        const response = await page.evaluate(async () => {
            try {
                const res = await fetch('https://resources.kashkole.com/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html'
                    }
                });

                return {
                    ok: res.ok,
                    status: res.status,
                    corsAllowed: true
                };
            } catch (error: any) {
                return {
                    ok: false,
                    status: 0,
                    corsAllowed: false,
                    error: error.message
                };
            }
        });

        expect(response.corsAllowed).toBe(true);
        expect(response.ok).toBe(true);
    });

    test('should allow CORS from http://localhost:5001', async ({ page }) => {
        // Navigate to a localhost:5001 context
        await page.goto('http://localhost:5001');

        // Attempt to fetch a CDN resource
        const response = await page.evaluate(async () => {
            try {
                const res = await fetch('https://resources.kashkole.com/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html'
                    }
                });

                return {
                    ok: res.ok,
                    status: res.status,
                    corsAllowed: true
                };
            } catch (error: any) {
                return {
                    ok: false,
                    status: 0,
                    corsAllowed: false,
                    error: error.message
                };
            }
        });

        expect(response.corsAllowed).toBe(true);
        expect(response.ok).toBe(true);
    });

    test('should allow CORS from https://localhost:5001', async ({ page }) => {
        // Navigate to a localhost:5001 HTTPS context
        await page.goto('https://localhost:5001');

        // Attempt to fetch a CDN resource
        const response = await page.evaluate(async () => {
            try {
                const res = await fetch('https://resources.kashkole.com/', {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html'
                    }
                });

                return {
                    ok: res.ok,
                    status: res.status,
                    corsAllowed: true
                };
            } catch (error: any) {
                return {
                    ok: false,
                    status: 0,
                    corsAllowed: false,
                    error: error.message
                };
            }
        });

        expect(response.corsAllowed).toBe(true);
        expect(response.ok).toBe(true);
    });

    test('should verify CORS headers are present in response', async ({ request }) => {
        const response = await request.get('https://resources.kashkole.com/', {
            headers: {
                'Origin': 'http://localhost:5000'
            }
        });

        const corsHeader = response.headers()['access-control-allow-origin'];

        // Verify the CORS header contains all required origins
        expect(corsHeader).toBeDefined();
        expect(corsHeader).toContain('localhost:5000');
        expect(corsHeader).toContain('localhost:5001');
        expect(corsHeader).toContain('noorcanvas.kashkole.com');
        expect(corsHeader).toContain('session.kashkole.com');
    });
});
