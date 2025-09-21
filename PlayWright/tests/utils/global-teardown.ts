/**
 * Global Teardown for NOOR Canvas Playwright Tests
 *
 * Performs cleanup and final health checks after all tests complete.
 * This teardown runs once after all test files have finished.
 *
 * Created: September 21, 2025
 * Purpose: Clean up resources and verify application state
 */

import { AppHealthChecker } from "./app-health-checker";
import { DatabaseTokenManager } from "./database-token-manager";

async function globalTeardown() {
  console.log("=== NOOR Canvas Test Suite - Global Teardown ===");

  try {
    // Final health check to ensure application is still responsive
    const isRunning = await AppHealthChecker.isApplicationRunning();

    if (isRunning) {
      console.log("✅ Application is still running after all tests");
    } else {
      console.log(
        "⚠️ Application appears to have stopped during test execution",
      );
    }

    // Clean up database connections
    await DatabaseTokenManager.closeConnection();

    console.log(
      "📊 Test artifacts available in: PlayWright/reports/ and PlayWright/artifacts/",
    );
    console.log(
      "🔄 Application continues running for potential manual testing",
    );
  } catch (error) {
    console.error("⚠️ Global teardown encountered an issue:", error);
    // Don't throw - teardown issues shouldn't fail the entire test suite
  }
}

export default globalTeardown;
