/**
 * Global Setup for NOOR Canvas Playwright Tests
 * 
 * Ensures the application is running before any tests execute.
 * This setup runs once before all test files.
 * 
 * Created: September 21, 2025
 * Purpose: Guarantee application availability for test execution
 */

import { AppHealthChecker } from './app-health-checker';
import { DatabaseTokenManager } from './database-token-manager';

async function globalSetup() {
    console.log('=== NOOR Canvas Test Suite - Global Setup ===');

    try {
        // Ensure application is running before tests begin
        await AppHealthChecker.ensureApplicationRunning();
        console.log('✅ Application health check passed - Ready for testing');

        // Validate database access and token availability
        console.log('🔗 Validating KSESSIONS_DEV database access...');
        const dbAccessible = await DatabaseTokenManager.validateDatabaseAccess();

        if (!dbAccessible) {
            throw new Error('KSESSIONS_DEV database is not accessible or has no session data');
        }

        // Get available sessions for testing
        const availableSessions = await DatabaseTokenManager.getAvailableSessionTokens();
        console.log(`📊 Found ${availableSessions.length} sessions with tokens available for testing`);

        if (availableSessions.length === 0) {
            console.warn('⚠️ No sessions with tokens found - creating test session...');
            const testSession = await DatabaseTokenManager.createTestSession('Playwright Test Session');
            if (testSession) {
                console.log(`✅ Created test session ${testSession.sessionId} with tokens: ${testSession.hostToken}/${testSession.userToken}`);
            } else {
                throw new Error('Failed to create test session');
            }
        } else {
            console.log('✅ Database validation passed - Sessions and tokens available');
        }

    } catch (error) {
        console.error('❌ Global setup failed:', error);
        throw error;
    }
}

export default globalSetup;