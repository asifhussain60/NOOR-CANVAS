// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * NOOR Canvas Playwright Configuration (Centralized)
 * 
 * This configuration file redirects to the centralized PlayWright directory structure.
 * All Playwright tests, artifacts, and configurations are now organized under PlayWright/
 * 
 * Issue-119: Playwright Reorganization - Centralized test management
 */

// Load the main configuration from centralized location
module.exports = require('./PlayWright/config/playwright.config.js');
