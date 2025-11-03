const { chromium } = require('@playwright/test');
const path = require('path');

const dashboardPath = process.argv[2];
if (!dashboardPath) {
    console.error('Usage: node test-metrics-charts.cjs <dashboard-path>');
    process.exit(1);
}

(async () => {
    const browser = await chromium.launch({
        headless: true,
        slowMo: 50
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    let passed = 0;
    let failed = 0;

    function log(icon, message) {
        console.log(`${icon} ${message}`);
    }

    try {
        // Load dashboard
        const fullPath = 'file:///' + path.resolve(dashboardPath).replace(/\\/g, '/');
        await page.goto(fullPath, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);

        log('✅', 'Dashboard loaded');

        // Click refresh to load data
        const refreshBtn = await page.$('button:has-text("Refresh")');
        if (refreshBtn) {
            await refreshBtn.click();
            await page.waitForTimeout(3000);
            log('✅', 'Health data loaded');
        }

        // Switch to Metrics tab
        const metricsTab = await page.$('button:has-text("Metrics")');
        if (!metricsTab) {
            log('❌', 'Metrics tab button not found');
            process.exit(1);
        }

        await metricsTab.click();
        await page.waitForTimeout(1000);

        // Wait for metrics tab to be visible
        await page.waitForSelector('#tab-metrics', { state: 'visible', timeout: 5000 });
        await page.waitForTimeout(4000); // Give charts time to render

        log('✅', 'Metrics tab opened');
        console.log('');

        // Test 1: Check if Chart.js is loaded
        const chartJsLoaded = await page.evaluate(() => {
            return typeof Chart !== 'undefined';
        });

        if (chartJsLoaded) {
            log('✅', 'Chart.js library loaded');
            passed++;
        } else {
            log('❌', 'Chart.js library NOT loaded');
            failed++;
        }

        // Test 2: Check if metricsCharts object exists
        const metricsChartsExists = await page.evaluate(() => {
            return typeof metricsCharts !== 'undefined';
        });

        if (metricsChartsExists) {
            log('✅', 'metricsCharts object exists');
            passed++;
        } else {
            log('❌', 'metricsCharts object NOT found');
            failed++;
        }

        console.log('');
        console.log('🔍 Testing Individual Charts...\n');

        // Test each chart
        const charts = [
            { id: 'brainHealthChart', valueId: 'brainHealthValue', name: 'BRAIN Health' },
            { id: 'routingAccuracyChart', valueId: 'routingAccuracyValue', name: 'Routing Accuracy' },
            { id: 'knowledgeGrowthChart', valueId: 'knowledgeGrowthValue', name: 'Knowledge Growth' },
            { id: 'fileHotspotsChart', valueId: 'fileHotspotsValue', name: 'File Hotspots' },
            { id: 'eventActivityChart', valueId: 'eventActivityValue', name: 'Event Activity' },
            { id: 'testSuccessChart', valueId: 'testSuccessValue', name: 'Test Success' }
        ];

        for (const chart of charts) {
            console.log(`\n📈 ${chart.name}:`);

            // Check canvas exists
            const canvasExists = await page.$(`#${chart.id}`);
            if (!canvasExists) {
                log('  ❌', 'Canvas element not found');
                failed++;
                continue;
            }
            log('  ✅', 'Canvas element exists');

            // Check if canvas is visible
            const isVisible = await canvasExists.isVisible();
            if (!isVisible) {
                log('  ❌', 'Canvas not visible');
                failed++;
                continue;
            }
            log('  ✅', 'Canvas is visible');

            // Check if Chart.js instance exists
            const hasChartInstance = await page.evaluate((canvasId) => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) return false;

                // Check if Chart.js instance is attached
                return canvas.chart !== undefined ||
                    (typeof Chart !== 'undefined' && Chart.getChart(canvas) !== undefined);
            }, chart.id);

            if (hasChartInstance) {
                log('  ✅', 'Chart.js instance found');
                passed++;
            } else {
                log('  ❌', 'Chart.js instance NOT found');
                failed++;
            }

            // Check if canvas has been drawn on
            const hasDrawing = await page.evaluate((canvasId) => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) return false;

                const ctx = canvas.getContext('2d');
                // Sample the entire canvas, not just top-left corner
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Check if any pixels are non-zero (meaning something was drawn)
                let nonZeroPixels = 0;
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    if (r !== 0 || g !== 0 || b !== 0 || a !== 0) {
                        nonZeroPixels++;
                    }
                }

                // For debugging: log pixel count
                if (nonZeroPixels > 0) {
                    console.log(`${canvasId}: ${nonZeroPixels} non-zero pixels found`);
                }

                return nonZeroPixels > 100; // At least 100 pixels changed
            }, chart.id);

            if (hasDrawing) {
                log('  ✅', 'Chart rendered (pixels drawn)');
                passed++;
            } else {
                log('  ❌', 'Chart NOT rendered (blank canvas)');
                failed++;
            }

            // Check value element
            const valueElement = await page.$(`#${chart.valueId}`);
            if (valueElement) {
                const value = await valueElement.textContent();
                if (value && value.trim() !== '--' && value.trim() !== '0' && value.trim() !== '') {
                    log('  ✅', `Value: ${value.trim()}`);
                    passed++;
                } else {
                    log('  ⚠️ ', `Value not populated: '${value.trim()}'`);
                    // Don't fail, just warn
                }
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Results');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
        console.log('');

        await browser.close();
        process.exit(failed > 0 ? 1 : 0);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        await browser.close();
        process.exit(1);
    }
})();
