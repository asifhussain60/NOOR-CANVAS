import { FullConfig } from "@playwright/test";
import { DatabaseTokenManager } from "./database-token-manager";
import { EnhancedTestMonitor } from "./enhanced-test-monitor";

async function globalSetup(config: FullConfig) {
  console.log("🚀 NOOR Canvas Enhanced Global Setup Starting...");

  console.log("🔍 Checking NOOR Canvas application health...");
  const isHealthy = await EnhancedTestMonitor.quickHealthCheck();

  if (!isHealthy) {
    console.log(
      "⚡ Application not healthy - starting with nc.ps1 launcher...",
    );
    const startSuccess = await EnhancedTestMonitor.quickStartApplication();

    if (!startSuccess) {
      console.error("❌ Failed to start NOOR Canvas application using nc.ps1");
      process.exit(1);
    }

    console.log("✅ Application started successfully using nc.ps1");
  } else {
    console.log("✅ Application is healthy and ready");
  }

  console.log("🔗 Validating database connectivity to AHHOME server...");

  try {
    // Test database connection and validation (AHHOME server, SQL Server Authentication)
    const isValid = await DatabaseTokenManager.validateDatabaseAccess();

    if (!isValid) {
      throw new Error("Database validation failed");
    }

    // Verify token retrieval works
    const testSession = await DatabaseTokenManager.getRandomActiveSession();

    if (!testSession) {
      throw new Error("No active sessions available for testing");
    }

    console.log("✅ Database connectivity verified");
    console.log(`🔑 Host Token: ${testSession.hostToken.substring(0, 8)}...`);
    console.log(`🔑 User Token: ${testSession.userToken.substring(0, 8)}...`);
    console.log(
      `📋 Session: ${testSession.sessionTitle} (ID: ${testSession.sessionId})`,
    );
  } catch (error) {
    console.error("❌ Database connectivity failed:", error);
    process.exit(1);
  }

  console.log("🎯 Enhanced Global Setup Complete - All Systems Ready!");
}

export default globalSetup;
