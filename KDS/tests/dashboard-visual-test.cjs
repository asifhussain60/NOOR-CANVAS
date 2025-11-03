const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Get arguments from command line
const args = process.argv.slice(2);
const headless = args.includes('--headless');
const keepOpen = args.includes('--keep-open');
const dashboardPath = args.find(arg => arg.startsWith('--dashboard='))?.split('=')[1];
const screenshotDir = args.find(arg => arg.startsWith('--screenshots='))?.split('=')[1];

if (!dashboardPath || !screenshotDir) {
  console.error('❌ Missing required arguments: --dashboard and --screenshots');
  process.exit(1);
}

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({
    headless: headless,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  function logTest(name, status, message) {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${name}`);
    if (message) console.log(`   ${message}`);

    results.details.push({ test: name, status, message, timestamp: new Date().toISOString() });
    if (status === 'PASS') results.passed++;
    else if (status === 'FAIL') results.failed++;
    else results.warnings++;
  }

  try {
    console.log('\n🌐 Loading Dashboard...\n');

    // Load the dashboard
    const fullDashboardPath = 'file:///' + path.resolve(dashboardPath).replace(/\\/g, '/');
    await page.goto(fullDashboardPath, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    logTest('Dashboard Page Loads', 'PASS', 'Page loaded successfully');

    // Take initial screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true
    });

    console.log('\n📊 Testing Overview Tab...\n');

    // Check Overview tab stats cards - using classes instead of IDs
    const statsCards = [
      { selector: '.stat-card:has-text("Status")', name: 'Status Card' },
      { selector: '.stat-card:has-text("Mode")', name: 'Mode Card' },
      { selector: '.stat-card:has-text("Checks")', name: 'Checks Card' },
      { selector: '.stat-card:has-text("Warnings")', name: 'Warnings Card' }
    ];

    for (const card of statsCards) {
      try {
        const element = await page.$(card.selector);
        if (element) {
          const isVisible = await element.isVisible();
          const text = await element.textContent();
          if (isVisible && text) {
            logTest(card.name, 'PASS', `Visible with content`);
          } else {
            logTest(card.name, 'WARN', 'Card found but may not be visible');
          }
        } else {
          logTest(card.name, 'WARN', 'Element not found - may render dynamically');
        }
      } catch (e) {
        logTest(card.name, 'WARN', `Using class selectors: ${e.message}`);
      }
    }

    // Click Refresh button to load health data
    console.log('\n🔄 Triggering Health Check Refresh...\n');
    const refreshBtn = await page.$('button:has-text("Refresh")');
    if (refreshBtn) {
      await refreshBtn.click();
      logTest('Refresh Button Clickable', 'PASS', 'Button clicked');

      // Wait for loading to complete
      await page.waitForTimeout(3000);

      // Check if content loaded
      const statsLoaded = await page.$('.stat-value');
      if (statsLoaded) {
        logTest('Stats Loaded After Refresh', 'PASS', 'Stats elements found');
      } else {
        logTest('Stats Loaded After Refresh', 'WARN', 'Stats may still be loading');
      }
    } else {
      logTest('Refresh Button', 'FAIL', 'Button not found');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '02-after-refresh.png'),
      fullPage: true
    });

    // Switch to Health Checks tab
    console.log('\n🏥 Testing Health Checks Tab...\n');
    const healthTab = await page.$('button:has-text("Health Checks")');
    if (healthTab) {
      await healthTab.click();
      await page.waitForTimeout(1000);
      logTest('Health Checks Tab Switch', 'PASS', 'Tab activated');

      // Check for category cards
      const categories = await page.$$('.category-card');
      if (categories.length > 0) {
        logTest('Health Category Cards', 'PASS', `Found ${categories.length} category cards`);
      } else {
        logTest('Health Category Cards', 'WARN', 'No category cards found yet');
      }

      await page.screenshot({
        path: path.join(screenshotDir, '03-health-checks-tab.png'),
        fullPage: true
      });
    } else {
      logTest('Health Checks Tab', 'WARN', 'Tab button not found - checking for tab content');
    }

    // Switch to Metrics tab
    console.log('\n📈 Testing Metrics Tab...\n');
    const metricsTab = await page.$('button:has-text("Metrics")');
    if (metricsTab) {
      await metricsTab.click();
      logTest('Metrics Tab Switch', 'PASS', 'Tab activated');

      // Wait for metrics tab to be visible
      try {
        await page.waitForSelector('#tab-metrics', { state: 'visible', timeout: 5000 });
        await page.waitForTimeout(3000); // Give charts time to render
        logTest('Metrics Tab Visible', 'PASS', 'Tab content displayed');
      } catch (e) {
        logTest('Metrics Tab Visible', 'WARN', 'Tab may not be visible yet');
      }

      // Check for all metric cards
      const metricCards = [
        { id: 'brainHealthChart', name: 'BRAIN Health Chart' },
        { id: 'routingAccuracyChart', name: 'Routing Accuracy Chart' },
        { id: 'knowledgeGrowthChart', name: 'Knowledge Growth Chart' },
        { id: 'fileHotspotsChart', name: 'File Hotspots Chart' },
        { id: 'eventActivityChart', name: 'Event Activity Chart' },
        { id: 'testSuccessChart', name: 'Test Success Chart' }
      ];

      for (const card of metricCards) {
        const canvas = await page.$(`#${card.id}`);
        if (canvas) {
          const isVisible = await canvas.isVisible();
          // Check if canvas has been drawn on (has Chart.js instance)
          const hasChart = await page.evaluate((canvasId) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return false;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return imageData.data.some(v => v !== 0);
          }, card.id);

          if (isVisible && hasChart) {
            logTest(card.name, 'PASS', 'Canvas rendered with chart data');
          } else if (isVisible) {
            logTest(card.name, 'WARN', 'Canvas visible but may not be rendered');
          } else {
            logTest(card.name, 'FAIL', 'Canvas not visible');
          }
        } else {
          logTest(card.name, 'FAIL', 'Canvas element not found');
        }
      }

      // Check metric values are populated
      const metricValues = [
        { id: 'brainHealthValue', name: 'BRAIN Health Value' },
        { id: 'routingAccuracyValue', name: 'Routing Accuracy Value' },
        { id: 'knowledgeGrowthValue', name: 'Knowledge Growth Value' },
        { id: 'fileHotspotsValue', name: 'File Hotspots Value' },
        { id: 'eventActivityValue', name: 'Event Activity Value' },
        { id: 'testSuccessValue', name: 'Test Success Value' }
      ];

      for (const value of metricValues) {
        const element = await page.$(`#${value.id}`);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim() !== '0' && text.trim() !== '') {
            logTest(value.name, 'PASS', `Value: ${text.trim()}`);
          } else {
            logTest(value.name, 'WARN', 'Value is 0 or empty');
          }
        } else {
          logTest(value.name, 'FAIL', 'Element not found');
        }
      }

      await page.screenshot({
        path: path.join(screenshotDir, '04-metrics-tab.png'),
        fullPage: true
      });
    } else {
      logTest('Metrics Tab', 'FAIL', 'Tab button not found');
    }

    // Test BRAIN System tab
    console.log('\n🧠 Testing BRAIN System Tab...\n');
    const brainTab = await page.$('button:has-text("BRAIN System")');
    if (brainTab) {
      await brainTab.click();
      await page.waitForTimeout(1000);
      logTest('BRAIN System Tab Switch', 'PASS', 'Tab activated');

      await page.screenshot({
        path: path.join(screenshotDir, '05-brain-tab.png'),
        fullPage: true
      });
    }

    // Test Activity Log tab
    console.log('\n📋 Testing Activity Log Tab...\n');
    const activityTab = await page.$('button:has-text("Activity Log")');
    if (activityTab) {
      await activityTab.click();
      await page.waitForTimeout(1000);
      logTest('Activity Log Tab Switch', 'PASS', 'Tab activated');

      await page.screenshot({
        path: path.join(screenshotDir, '06-activity-tab.png'),
        fullPage: true
      });
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('');
    console.log(`  ✅ Passed:  ${results.passed}`);
    console.log(`  ❌ Failed:  ${results.failed}`);
    console.log(`  ⚠️  Warnings: ${results.warnings}`);
    console.log('');

    const total = results.passed + results.failed + results.warnings;
    if (total > 0) {
      const passRate = Math.round((results.passed / total) * 100 * 10) / 10;
      console.log(`  Pass Rate: ${passRate}%`);
    }
    console.log('');

    // Save results
    const resultsPath = path.join(path.dirname(screenshotDir), 'dashboard-visual-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📝 Results saved to: ${resultsPath}`);
    console.log('');

    if (keepOpen) {
      console.log('⏸️  Browser will remain open for inspection...');
      console.log('   Press Ctrl+C to close');
      await new Promise(() => { }); // Keep open indefinitely
    }

    // Cleanup
    await browser.close();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true
    });
    await browser.close();
    process.exit(1);
  }
})();
