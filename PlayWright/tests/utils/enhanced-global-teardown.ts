import { DatabaseTokenManager } from './database-token-manager';

async function globalTeardown() {
    console.log('🧹 NOOR Canvas Enhanced Global Teardown Starting...');

    try {
        // Clean up database connections
        await DatabaseTokenManager.closeConnection();
        console.log('✅ Database connections cleaned up');
    } catch (error) {
        console.error('⚠️ Error during database cleanup:', error);
    }

    console.log('🏁 Enhanced Global Teardown Complete');
}

export default globalTeardown;