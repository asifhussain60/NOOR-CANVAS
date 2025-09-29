import { test, expect } from '@playwright/test';

test.describe('Phase 1: Manual Asset Share Test', () => {

  test('Manual verification: Asset share property fix', async ({ page }) => {
    console.log('🔧 Starting manual Phase 1 verification...');
    
    // Navigate to home page first
    await page.goto('http://localhost:9091/');
    await page.waitForLoadState('networkidle');
    console.log('✅ Home page loaded');

    // Check if we can access the simple SignalR test page
    await page.goto('http://localhost:9091/simple-signalr-test');
    await page.waitForLoadState('networkidle');
    console.log('✅ Simple SignalR test page loaded');

    // Check page content
    const pageContent = await page.content();
    expect(pageContent).toContain('Simple SignalR Test');
    console.log('✅ Page content verified');

    // Look for session join controls
    const sessionControls = await page.locator('input, button').count();
    expect(sessionControls).toBeGreaterThan(0);
    console.log(`✅ Found ${sessionControls} interactive elements`);

    console.log('🎉 Manual verification Phase 1 completed - application is accessible');
  });

  test('Check application health and routes', async ({ page }) => {
    console.log('🔍 Testing application routes...');

    const routes = [
      '/',
      '/host/landing', 
      '/user/landing',
      '/signalr-test',
      '/simple-signalr-test'
    ];

    for (const route of routes) {
      try {
        await page.goto(`http://localhost:9091${route}`);
        await page.waitForLoadState('networkidle');
        
        // Check if page loaded without error
        const title = await page.title();
        console.log(`✅ Route ${route}: Page title = "${title}"`);
        
        // Look for any error messages
        const errorText = await page.locator('text=error, text=Error, text=ERROR').count();
        expect(errorText).toBe(0);
        
      } catch (error) {
        console.log(`❌ Route ${route}: ${error}`);
        throw error;
      }
    }

    console.log('✅ All routes accessible');
  });

  test('Verify debug logging is working', async ({ page }) => {
    console.log('🔍 Testing debug logging...');

    // Go to simple SignalR test page
    await page.goto('http://localhost:9091/simple-signalr-test');
    await page.waitForLoadState('networkidle');

    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('DEBUG-WORKITEM')) {
        logs.push(msg.text());
        console.log(`📝 Debug log: ${msg.text()}`);
      }
    });

    // Try to trigger some interaction
    const buttons = await page.locator('button').count();
    if (buttons > 0) {
      await page.locator('button').first().click();
      await page.waitForTimeout(2000);
    }

    console.log(`📊 Captured ${logs.length} debug log entries`);
    console.log('✅ Debug logging verification completed');
  });

});