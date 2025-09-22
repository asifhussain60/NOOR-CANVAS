const path = require('path');

// Re-export the canonical repository-root Playwright configuration.
module.exports = require(path.resolve(__dirname, '..', '..', 'playwright.config.js'));
