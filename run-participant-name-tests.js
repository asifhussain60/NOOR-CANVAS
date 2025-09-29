#!/usr/bin/env node

/**
 * Test runner for participant name display fixes
 * 
 * This script runs the complete test suite for validating:
 * 1. Welcome message personalization in SessionCanvas
 * 2. Q&A participant name resolution in HostControlPanel
 * 3. Integration between front-end and back-end participant data
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Participant Name Display Test Suite');
console.log('=====================================\n');

console.log('This test suite validates the fixes for:');
console.log('• Issue: Q&A badges showing "Anonymous" instead of participant names');
console.log('• Issue: Welcome message showing "Participant" instead of actual names');
console.log('• Solution: Enhanced participant name resolution in both SessionCanvas and HostControlPanel\n');

// Configuration
const config = {
  configFile: 'playwright.config.participant-names.ts',
  testFiles: [
    'Tests/UI/participant-name-display.spec.ts',
    'Tests/UI/qa-participant-names.spec.ts',
    'Tests/UI/welcome-message-personalization.spec.ts'
  ],
  outputDir: 'test-results/participant-names',
  timeout: 300000 // 5 minutes
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Build the command
const playwrightCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  'playwright', 'test',
  '--config', config.configFile,
  '--reporter', 'html',
  '--reporter', 'line',
  ...config.testFiles
];

console.log(`📋 Running command: ${playwrightCmd} ${args.join(' ')}\n`);

// Run the tests
const testProcess = spawn(playwrightCmd, args, {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    PLAYWRIGHT_HTML_REPORT: config.outputDir,
    NODE_ENV: 'test'
  }
});

testProcess.on('close', (code) => {
  console.log('\n=====================================');

  if (code === 0) {
    console.log('✅ All participant name tests passed!');
    console.log('\nTest Results Summary:');
    console.log('• ✅ Welcome message shows actual participant names');
    console.log('• ✅ Q&A badges show participant names (not "Anonymous")');
    console.log('• ✅ Participant name resolution works correctly');
    console.log('• ✅ API integration provides proper participant data');

    console.log(`\n📊 Detailed results: ${config.outputDir}/index.html`);
  } else {
    console.log('❌ Some participant name tests failed!');
    console.log('\nPlease check the test output above and fix any issues.');
    console.log('Common issues:');
    console.log('• Application not running on https://localhost:9091');
    console.log('• Test session (KJAHA99L) not available');
    console.log('• Participant data not loading correctly');
    console.log('• UI elements not matching expected selectors');

    console.log(`\n📊 Detailed results: ${config.outputDir}/index.html`);
  }

  console.log('\n🔧 For debugging:');
  console.log('• Check screenshots in test-results/ for visual debugging');
  console.log('• Review browser console logs in the HTML report');
  console.log('• Verify that the session has participants with names');
  console.log('• Ensure GetCurrentParticipantName() and ResolveParticipantName() methods are working');

  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to start test process:', error);
  process.exit(1);
});