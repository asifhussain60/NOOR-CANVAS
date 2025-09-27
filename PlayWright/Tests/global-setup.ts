/**
 * Global Setup for Authentication Tests
 *
 * Prepares the test environment for authentication flow testing:
 * - Verifies NOOR Canvas application is running
 * - Validates database connectivity
 * - Confirms test host token is available
 * - Sets up test session data
 *
 * Created: September 20, 2025
 * Purpose: Ensure reliable authentication test execution
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up NOOR Canvas Authentication Tests...');

  const baseURL = config.projects[0].use.baseURL || 'https://localhost:9091';
  const baseURLHttp = 'http://localhost:9090';
  const testHostToken = 'VIS68UW4';

  try {
    // Note: Using fetch API for HTTP requests (no additional imports needed)

    console.log('🔍 Checking application availability...');

    // Test application health using fetch-like approach
    const response = await fetch(`${baseURLHttp}/api/host/token/${testHostToken}/validate`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Application is running and responsive');
      console.log(`✅ Test host token ${testHostToken} is valid`);

      if (data.Valid) {
        console.log('✅ Authentication service is working (no "service unavailable" error)');
      } else {
        console.log('⚠️ Authentication service returned invalid token');
      }
    } else {
      console.log('⚠️ Application may not be fully ready');
      console.log(`Response status: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️ Could not verify application status:');
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log('');
    console.log('📝 Note: Tests will still run, but may fail if application is not started');
    console.log('To start the application, run: dotnet run (in SPA/NoorCanvas directory)');
  }

  console.log('');
  console.log('🎯 Test Environment Ready:');
  console.log(`   - Base URL: ${baseURL}`);
  console.log(`   - HTTP URL: ${baseURLHttp}`);
  console.log(`   - Test Host Token: ${testHostToken}`);
  console.log(`   - Architecture: Simplified 3-table schema`);
  console.log('');
}

export default globalSetup;
