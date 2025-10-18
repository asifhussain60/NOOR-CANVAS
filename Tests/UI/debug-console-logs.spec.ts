import { test } from '@playwright/test';

test('Debug: Capture console logs during Share Transcript', async ({ page }) => {
    // Capture all console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
        console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
    });

    // Navigate to host control panel
    await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
    await page.waitForLoadState('networkidle');

    console.log('\n=== CLICKING SHARE TRANSCRIPT ===\n');

    // Click Share Transcript
    const shareBtn = page.locator('button:has-text("Share Transcript")');
    await shareBtn.click();

    // Wait a bit for processing
    await page.waitForTimeout(8000);

    console.log('\n=== CHECKING DOM STATE ===\n');

    // Check container
    const containerExists = await page.evaluate(() => {
        const container = document.getElementById('transcript-content-container');
        return {
            exists: container !== null,
            innerHTMLLength: container?.innerHTML.length || 0,
            h2Count: container?.querySelectorAll('h2').length || 0,
            buttonCount: document.querySelectorAll('.transcript-section-share-btn').length
        };
    });

    console.log('Container State:', containerExists);

    // Check if script loaded
    const scriptLoaded = await page.evaluate(() => {
        return typeof (window as any).TranscriptSectionParser !== 'undefined';
    });

    console.log('TranscriptSectionParser loaded:', scriptLoaded);

    // Filter and display relevant logs
    console.log('\n=== RELEVANT CONSOLE LOGS ===\n');
    const relevantLogs = consoleLogs.filter(log =>
        log.includes('hcp-tcanvas') ||
        log.includes('TranscriptSectionParser') ||
        log.includes('TRACE') ||
        log.includes('section') ||
        log.includes('button')
    );

    relevantLogs.forEach(log => console.log(log));

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-console-logs.png', fullPage: true });

    console.log(`\n=== TOTAL CONSOLE MESSAGES: ${consoleLogs.length} ===`);
    console.log(`=== RELEVANT MESSAGES: ${relevantLogs.length} ===\n`);
});
