// KDS BRAIN Integrity Test - Playwright Automation
// Purpose: Automated testing of test-brain-integrity.ps1 execution
// Usage: npx playwright test KDS/test-brain-integrity.spec.ts

import { expect, test } from '@playwright/test';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('KDS BRAIN Integrity Test', () => {
    const kdsTestsPath = path.join(process.cwd(), 'KDS', 'tests');
    const testScript = path.join(kdsTestsPath, 'test-brain-integrity.ps1');
    const screenshotsPath = path.join(kdsTestsPath, 'screenshots');

    test.beforeAll(async () => {
        // Ensure screenshots directory exists
        if (!fs.existsSync(screenshotsPath)) {
            fs.mkdirSync(screenshotsPath, { recursive: true });
        }
    });

    test('should execute test-brain-integrity.ps1 successfully', async () => {
        // Run the PowerShell test script
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}"`;

        const startTime = Date.now();
        const { stdout, stderr } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });
        const executionTime = Date.now() - startTime;

        // Validate execution time < 10 seconds
        expect(executionTime).toBeLessThan(10000);
        console.log(`✅ Execution time: ${executionTime}ms (< 10000ms)`);

        // Validate output contains success indicators
        expect(stdout).toContain('KDS BRAIN Integrity Test');
        expect(stdout).toContain('Overall Status: PASS');
        expect(stdout).toContain('Passed:');

        // Validate no failures
        expect(stdout).toContain('Failed:      0');

        console.log('✅ Test script executed successfully');
    });

    test('should return exit code 0 on success', async () => {
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}"`;

        try {
            const { stdout } = await execAsync(command, {
                cwd: kdsTestsPath,
                encoding: 'utf8'
            });

            // If we get here, exit code was 0 (success)
            expect(stdout).toContain('Overall Status: PASS');
            console.log('✅ Exit code 0 (success)');
        } catch (error: any) {
            // If command fails, we should not reach here for a passing test
            throw new Error(`Test failed with exit code ${error.code}: ${error.message}`);
        }
    });

    test('should return valid JSON output with -JsonOutput flag', async () => {
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}" -JsonOutput`;

        const { stdout } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });

        // Parse JSON output
        const result = JSON.parse(stdout.trim());

        // Validate JSON structure
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('overall_status');
        expect(result).toHaveProperty('total_checks');
        expect(result).toHaveProperty('passed');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('execution_time_ms');
        expect(result).toHaveProperty('checks');

        // Validate overall status is PASS
        expect(result.overall_status).toBe('PASS');

        // Validate all expected checks are present
        expect(result.total_checks).toBeGreaterThanOrEqual(13);
        expect(result.checks).toBeInstanceOf(Array);
        expect(result.checks.length).toBe(result.total_checks);

        // Validate execution time
        expect(result.execution_time_ms).toBeGreaterThan(0);
        expect(result.execution_time_ms).toBeLessThan(10000);

        console.log('✅ JSON output validated');
        console.log(`   Total Checks: ${result.total_checks}`);
        console.log(`   Passed: ${result.passed}`);
        console.log(`   Failed: ${result.failed}`);
        console.log(`   Warnings: ${result.warnings}`);
        console.log(`   Execution Time: ${result.execution_time_ms}ms`);
    });

    test('should validate all expected check categories are present', async () => {
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}" -JsonOutput`;

        const { stdout } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });

        const result = JSON.parse(stdout.trim());

        // Expected categories
        const expectedCategories = [
            'File Existence',
            'File Size',
            'JSONL Syntax',
            'YAML Syntax',
            'Conversation FIFO',
            'Confidence Scores',
            'Event Log'
        ];

        const actualCategories = [...new Set(result.checks.map((c: any) => c.category))];

        for (const expectedCategory of expectedCategories) {
            expect(actualCategories).toContain(expectedCategory);
            console.log(`✅ Category present: ${expectedCategory}`);
        }
    });

    test('should validate all BRAIN files are checked', async () => {
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}" -JsonOutput`;

        const { stdout } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });

        const result = JSON.parse(stdout.trim());

        // Expected file checks
        const expectedFileChecks = [
            'conversation-history.jsonl exists',
            'knowledge-graph.yaml exists',
            'development-context.yaml exists',
            'events.jsonl exists'
        ];

        const actualChecks = result.checks.map((c: any) => c.check);

        for (const expectedCheck of expectedFileChecks) {
            expect(actualChecks).toContain(expectedCheck);

            const check = result.checks.find((c: any) => c.check === expectedCheck);
            expect(check.status).toBe('PASS');
            console.log(`✅ File check passed: ${expectedCheck}`);
        }
    });

    test('should complete in less than 10 seconds (performance)', async () => {
        const runs = 5;
        const executionTimes: number[] = [];

        for (let i = 0; i < runs; i++) {
            const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}"`;

            const startTime = Date.now();
            await execAsync(command, {
                cwd: kdsTestsPath,
                encoding: 'utf8'
            });
            const executionTime = Date.now() - startTime;

            executionTimes.push(executionTime);
            expect(executionTime).toBeLessThan(10000);
        }

        const avgTime = executionTimes.reduce((a, b) => a + b, 0) / runs;
        const maxTime = Math.max(...executionTimes);
        const minTime = Math.min(...executionTimes);

        console.log(`✅ Performance test (${runs} runs):`);
        console.log(`   Average: ${Math.round(avgTime)}ms`);
        console.log(`   Min: ${minTime}ms`);
        console.log(`   Max: ${maxTime}ms`);
        console.log(`   All runs < 10000ms: ${executionTimes.every(t => t < 10000)}`);

        expect(avgTime).toBeLessThan(10000);
    });

    test('should run in verbose mode and show detailed output', async () => {
        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${testScript}" -Verbose`;

        const { stdout } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });

        // Validate verbose output shows file paths
        expect(stdout).toContain('Found at:');
        expect(stdout).toContain('KDS\\kds-brain');

        // Validate all categories are displayed
        expect(stdout).toContain('Category: File Existence');
        expect(stdout).toContain('Category: File Size Validation');
        expect(stdout).toContain('Category: JSONL Syntax Validation');
        expect(stdout).toContain('Category: YAML Syntax Validation');
        expect(stdout).toContain('Category: Conversation History FIFO');
        expect(stdout).toContain('Category: Knowledge Graph Confidence Scores');
        expect(stdout).toContain('Category: Event Log Integrity');

        console.log('✅ Verbose mode output validated');
    });

    test('should detect missing file corruption', async ({ page }) => {
        const corruptionTestScript = path.join(kdsTestsPath, 'test-brain-corruption-scenarios.ps1');

        // Verify corruption test script exists
        expect(fs.existsSync(corruptionTestScript)).toBe(true);

        const command = `pwsh -NoProfile -ExecutionPolicy Bypass -File "${corruptionTestScript}"`;

        const { stdout } = await execAsync(command, {
            cwd: kdsTestsPath,
            encoding: 'utf8'
        });

        // Validate corruption scenarios were detected
        expect(stdout).toContain('Corruption Detection Summary');
        expect(stdout).toContain('ALL CORRUPTION SCENARIOS DETECTED CORRECTLY');

        console.log('✅ Corruption detection validated');

        // Take screenshot of final state
        const screenshotPath = path.join(screenshotsPath, 'brain-integrity-test-complete.png');
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.setContent(`
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #0d1117; color: #c9d1d9; }
                    h1 { color: #58a6ff; }
                    .success { color: #3fb950; }
                    .info { color: #79c0ff; }
                    pre { background: #161b22; padding: 20px; border-radius: 6px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <h1>🧠 KDS BRAIN Integrity Test - Complete</h1>
                <div class="success">✅ All tests passed</div>
                <div class="info">📊 Test execution validated via Playwright</div>
                <pre>${stdout.substring(0, 1000)}...</pre>
            </body>
            </html>
        `);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
    });
});
