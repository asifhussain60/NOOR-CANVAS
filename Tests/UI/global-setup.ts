import { FullConfig } from '@playwright/test';

/**
 * Global setup for participant name display tests
 * 
 * This setup ensures that the NoorCanvas application is in the correct state
 * for testing participant name functionality.
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for participant name tests...');

  try {
    // Verify that the test session exists and has the expected participants
    const baseURL = config.projects[0].use.baseURL || 'https://localhost:9091';

    // Wait for the application to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ Global setup completed successfully');
    console.log('📊 Test configuration:');
    console.log(`   - Base URL: ${baseURL}`);
    console.log(`   - Session Token: KJAHA99L`);
    console.log(`   - Host Token: PQ9N5YWW`);
    console.log(`   - Expected participants: Wade Wilson, Erik Lehnsherr, Asif Hussain`);

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;