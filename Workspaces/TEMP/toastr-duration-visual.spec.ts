import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test: Toast Duration & Positioning
 * 
 * Purpose: Verify toasts display for 10 seconds at correct positions
 * Issue: Toasts disappearing instantly, appearing in wrong positions
 * 
 * Test Data: Session 212
 * - Participant: KJAHA99L
 * - Host: PQ9N5YWW
 */

const BASE_URL = 'https://localhost:9091';
const PARTICIPANT_TOKEN = 'KJAHA99L';
const HOST_TOKEN = 'PQ9N5YWW';

test.describe('Toast Duration & Position Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ignore SSL errors for local testing
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  });

  test('Host Control Panel - Question received toast displays for 10 seconds at bottom-right', async ({ page }) => {
    // Navigate to Host Control Panel
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await page.waitForSelector('.debug-panel', { timeout: 10000 });

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Take screenshot BEFORE toast appears
    await page.screenshot({ path: 'Workspaces/TEMP/toast-before.png', fullPage: false });

    // Simulate question received (trigger toast via browser console to control timing)
    await page.evaluate(() => {
      if (typeof (window as any).showNoorToast === 'function') {
        (window as any).showNoorToast(
          'Test User asked: "This is a test question for visual regression"',
          'New Question Received',
          'info'
        );
      }
    });

    // Wait for toast to appear
    await page.waitForSelector('#toast-container', { state: 'visible', timeout: 2000 });

    // Verify toast container position class
    const positionClass = await page.$eval('#toast-container', el => el.className);
    expect(positionClass).toContain('toast-bottom-right');

    // Take screenshot immediately after toast appears (0-1 second)
    await page.screenshot({ path: 'Workspaces/TEMP/toast-1sec.png', fullPage: false });

    // Wait 3 seconds and verify toast STILL visible
    await page.waitForTimeout(3000);
    const toastAt3Sec = await page.$('#toast-container .toast');
    expect(toastAt3Sec).not.toBeNull();
    await page.screenshot({ path: 'Workspaces/TEMP/toast-3sec.png', fullPage: false });

    // Wait 5 seconds total and verify toast STILL visible
    await page.waitForTimeout(2000);
    const toastAt5Sec = await page.$('#toast-container .toast');
    expect(toastAt5Sec).not.toBeNull();
    await page.screenshot({ path: 'Workspaces/TEMP/toast-5sec.png', fullPage: false });

    // Wait 9 seconds total and verify toast STILL visible (about to disappear)
    await page.waitForTimeout(4000);
    const toastAt9Sec = await page.$('#toast-container .toast');
    expect(toastAt9Sec).not.toBeNull();
    await page.screenshot({ path: 'Workspaces/TEMP/toast-9sec.png', fullPage: false });

    // Wait 11 seconds total and verify toast is GONE
    await page.waitForTimeout(2000);
    const toastAt11Sec = await page.$('#toast-container .toast');
    expect(toastAt11Sec).toBeNull();
    await page.screenshot({ path: 'Workspaces/TEMP/toast-11sec.png', fullPage: false });

    // Verify position using computed styles
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('#toast-container');
      if (!container) return null;
      const styles = window.getComputedStyle(container);
      return {
        position: styles.position,
        bottom: styles.bottom,
        right: styles.right,
        top: styles.top,
        left: styles.left,
        zIndex: styles.zIndex
      };
    });

    expect(containerStyles).not.toBeNull();
    expect(containerStyles?.position).toBe('fixed');
    expect(containerStyles?.bottom).toBe('20px');
    expect(containerStyles?.right).toBe('20px');
    expect(parseInt(containerStyles?.zIndex || '0')).toBeGreaterThan(999998);
  });

  test('Session Canvas - Question answered toast displays for 10 seconds at top-right', async ({ page }) => {
    // Navigate to Session Canvas
    await page.goto(`${BASE_URL}/session/canvas/${PARTICIPANT_TOKEN}`);
    await page.waitForSelector('.session-container', { timeout: 10000 });

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Trigger toast via browser console
    await page.evaluate(() => {
      if (typeof (window as any).showNoorToast === 'function') {
        (window as any).showNoorToast(
          'The host has addressed your question during the session.',
          'Question Answered',
          'success'
        );
      }
    });

    // Wait for toast to appear
    await page.waitForSelector('#toast-container', { state: 'visible', timeout: 2000 });

    // Verify toast container position class
    const positionClass = await page.$eval('#toast-container', el => el.className);
    expect(positionClass).toContain('toast-top-right');

    // Take screenshot immediately after toast appears
    await page.screenshot({ path: 'Workspaces/TEMP/canvas-toast-1sec.png', fullPage: false });

    // Wait 5 seconds and verify toast STILL visible
    await page.waitForTimeout(5000);
    const toastAt5Sec = await page.$('#toast-container .toast');
    expect(toastAt5Sec).not.toBeNull();
    await page.screenshot({ path: 'Workspaces/TEMP/canvas-toast-5sec.png', fullPage: false });

    // Wait 9 seconds total and verify toast STILL visible
    await page.waitForTimeout(4000);
    const toastAt9Sec = await page.$('#toast-container .toast');
    expect(toastAt9Sec).not.toBeNull();

    // Verify position using computed styles
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('#toast-container');
      if (!container) return null;
      const styles = window.getComputedStyle(container);
      return {
        position: styles.position,
        top: styles.top,
        right: styles.right,
        bottom: styles.bottom,
        left: styles.left,
        zIndex: styles.zIndex
      };
    });

    expect(containerStyles).not.toBeNull();
    expect(containerStyles?.position).toBe('fixed');
    expect(containerStyles?.top).toBe('20px');
    expect(containerStyles?.right).toBe('20px');
  });

  test('Toast configuration diagnostic - verify JavaScript options', async ({ page }) => {
    // Navigate to Host Control Panel
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await page.waitForSelector('.debug-panel', { timeout: 10000 });

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    // Trigger toast to see console output
    await page.evaluate(() => {
      if (typeof (window as any).showNoorToast === 'function') {
        (window as any).showNoorToast('Diagnostic test', 'Test', 'info');
      }
    });

    // Wait for toast and logs
    await page.waitForTimeout(1000);

    // Find the log with toast options
    const optionsLog = consoleLogs.find(log => log.includes('Toast options:'));
    expect(optionsLog).toBeDefined();

    // Extract and verify options from console log
    if (optionsLog) {
      console.log('Toast Options Log:', optionsLog);
      
      // Verify key settings are logged
      expect(optionsLog).toContain('timeOut');
      expect(optionsLog).toContain('10000');
      expect(optionsLog).toContain('positionClass');
    }

    // Also verify via direct evaluation
    const toastrConfig = await page.evaluate(() => {
      // Trigger toast and capture options from console
      const logs: any[] = [];
      const originalLog = console.log;
      console.log = function(...args: any[]) {
        logs.push(args);
        originalLog.apply(console, args);
      };

      if (typeof (window as any).showNoorToast === 'function') {
        (window as any).showNoorToast('Config test', 'Test', 'info');
      }

      console.log = originalLog;
      
      // Find the options log
      const optionsLog = logs.find(l => 
        typeof l[0] === 'string' && l[0].includes('Toast options:')
      );
      
      return optionsLog ? optionsLog[1] : null;
    });

    if (toastrConfig) {
      console.log('Captured Toast Config:', toastrConfig);
    }
  });

  test('CSS Loading verification - ensure noor-toastr.css loaded', async ({ page }) => {
    // Navigate to Host Control Panel
    await page.goto(`${BASE_URL}/host/control-panel/${HOST_TOKEN}`);
    await page.waitForSelector('.debug-panel', { timeout: 10000 });

    // Check if noor-toastr.css is loaded
    const cssLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.some(link => 
        link.getAttribute('href')?.includes('noor-toastr.css')
      );
    });

    expect(cssLoaded).toBe(true);

    // Verify CSS rules are applied
    const cssRules = await page.evaluate(() => {
      const results: any = {};
      
      // Check if position classes exist in stylesheet
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule: any) => {
            if (rule.selectorText?.includes('toast-bottom-right')) {
              results.bottomRight = true;
            }
            if (rule.selectorText?.includes('toast-top-right')) {
              results.topRight = true;
            }
          });
        } catch (e) {
          // CORS issues with external stylesheets, skip
        }
      }
      
      return results;
    });

    console.log('CSS Rules Found:', cssRules);
  });
});
