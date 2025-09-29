import { FullConfig } from '@playwright/test';

/**
 * Global teardown for participant name display tests
 * 
 * Cleans up any test data or resources after all tests complete.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for participant name tests...');

  try {
    // Clean up any test questions that were submitted during testing
    console.log('Cleaning up test data...');

    // You could add cleanup logic here if needed, such as:
    // - Removing test questions from the database
    // - Resetting session state
    // - Clearing temporary files

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test results
  }
}

export default globalTeardown;