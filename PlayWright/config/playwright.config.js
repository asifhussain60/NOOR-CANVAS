const path = require('path');

// Re-export the canonical Playwright configuration from config/testing/
module.exports = require(path.resolve(__dirname, '..', '..', 'config', 'testing', 'playwright.config.cjs'));
