const path = require('path');

// Import the canonical repository-root config
const baseConfig = require(path.resolve(__dirname, 'playwright.config.js'));

// Minimal standalone overrides (headful, HTML reporter for local debugging)
const standaloneOverrides = {
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, 'Workspaces', 'TEMP', 'playwright-report', 'standalone-html') }],
    ['json', { outputFile: path.resolve(__dirname, 'Workspaces', 'TEMP', 'playwright-report', 'test-results.json') }],
  ],
  use: Object.assign({}, baseConfig.use || {}, { headless: false }),
};

module.exports = Object.assign({}, baseConfig, standaloneOverrides);
