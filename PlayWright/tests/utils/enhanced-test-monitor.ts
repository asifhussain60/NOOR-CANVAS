/**
 * Enhanced Test Hooks with Application Monitoring and Fast Failure Recovery
 *
 * Provides efficient application health monitoring and rapid recovery mechanisms
 * for Playwright tests. Monitors app status after each test and takes corrective
 * action without rerunning entire test suites.
 *
 * Created: September 21, 2025
 * Purpose: Efficient test execution with smart failure handling
 */

import { test } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface TestHealth {
  applicationRunning: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  testExecutionTime: number;
}

export class EnhancedTestMonitor {
  private static readonly MAX_CONSECUTIVE_FAILURES = 2;
  private static readonly HEALTH_CHECK_TIMEOUT = 5000;
  private static readonly APP_START_TIMEOUT = 30000;
  public static testHealth: TestHealth = {
    applicationRunning: false,
    lastHealthCheck: new Date(),
    consecutiveFailures: 0,
    testExecutionTime: 0,
  };

  /**
   * Fast application health check using PowerShell (more reliable than Node.js fetch)
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      // Use a simple curl-like approach with PowerShell
      const healthCommand =
        'try { Invoke-WebRequest -Uri https://localhost:9091 -UseBasicParsing -SkipCertificateCheck -TimeoutSec 3 | Out-Null; Write-Output "HEALTHY" } catch { try { Invoke-WebRequest -Uri http://localhost:9090 -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Output "HEALTHY" } catch { Write-Output "UNHEALTHY" } }';

      const { stdout } = await execAsync(
        `powershell.exe -Command "${healthCommand}"`,
        {
          timeout: this.HEALTH_CHECK_TIMEOUT,
        },
      );

      const isHealthy = stdout.trim().includes("HEALTHY");
      this.testHealth.applicationRunning = isHealthy;
      this.testHealth.lastHealthCheck = new Date();

      if (isHealthy) {
        this.testHealth.consecutiveFailures = 0;
      }

      return isHealthy;
    } catch (error) {
      console.warn("⚠️ Quick health check failed:", error);
      this.testHealth.applicationRunning = false;
      return false;
    }
  }

  /**
   * Fast application startup using nc.ps1 script
   */
  static async quickStartApplication(): Promise<boolean> {
    try {
      console.log("🚀 Starting NOOR Canvas application using nc.ps1...");

      // Use nc.ps1 for clean application startup
      const startCommand = `
                Start-Process powershell.exe -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'd:\\PROJECTS\\NOOR CANVAS\\Workspaces\\Global\\nc.ps1' -WindowStyle Hidden
            `;

      await execAsync(`powershell.exe -Command "${startCommand}"`, {
        timeout: 10000,
      });

      // Wait for app to become available (realistic timing for ASP.NET Core startup)
      for (let attempt = 1; attempt <= 6; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second intervals

        if (await this.quickHealthCheck()) {
          console.log(`✅ Application started successfully (${attempt * 3}s)`);
          return true;
        }

        console.log(
          `⏳ Waiting for application startup... attempt ${attempt}/6`,
        );
      }

      throw new Error(
        "Application failed to start within 18 seconds using nc.ps1",
      );
    } catch (error) {
      console.error("❌ nc.ps1 application startup failed:", error);
      return false;
    }
  }

  /**
   * Smart test failure analysis and recovery
   */
  static async handleTestFailure(
    testInfo: any,
    error: Error,
  ): Promise<boolean> {
    console.log("🔍 Analyzing test failure...");

    // Check if failure is app-related
    const isAppFailure = this.isApplicationRelatedFailure(error);

    if (isAppFailure) {
      console.log("🎯 Application-related failure detected");
      this.testHealth.consecutiveFailures++;

      // Quick recovery for app issues
      if (
        this.testHealth.consecutiveFailures <= this.MAX_CONSECUTIVE_FAILURES
      ) {
        console.log("🛠️ Attempting quick recovery...");

        const recovered = await this.quickStartApplication();
        if (recovered) {
          console.log("✅ Quick recovery successful, test can retry");
          return true;
        }
      }
    }

    // Log failure details for analysis
    await this.logFailureForAnalysis(testInfo, error, isAppFailure);
    return false;
  }

  /**
   * Determine if failure is application-related vs test logic issue
   */
  private static isApplicationRelatedFailure(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const appRelatedKeywords = [
      "connection refused",
      "timeout",
      "navigation timeout",
      "net::err_connection_refused",
      "page.goto",
      "waiting for selector",
      "element not found",
      "page crashed",
    ];

    return appRelatedKeywords.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Efficient failure logging for quick analysis
   */
  private static async logFailureForAnalysis(
    testInfo: any,
    error: Error,
    isAppFailure: boolean,
  ): Promise<void> {
    const failureLog = {
      timestamp: new Date().toISOString(),
      testName: testInfo.title,
      testFile: testInfo.file,
      errorMessage: error.message,
      isApplicationFailure: isAppFailure,
      consecutiveFailures: this.testHealth.consecutiveFailures,
      applicationStatus: this.testHealth.applicationRunning,
    };

    console.log("📊 Failure Analysis:", JSON.stringify(failureLog, null, 2));

    // Quick failure pattern detection
    if (
      isAppFailure &&
      this.testHealth.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES
    ) {
      console.log(
        "🚨 Multiple application failures detected - may need manual intervention",
      );
    }
  }

  /**
   * Get current test health status
   */
  static getHealthStatus(): TestHealth {
    return { ...this.testHealth };
  }

  /**
   * Reset health status (useful for new test runs)
   */
  static resetHealthStatus(): void {
    this.testHealth = {
      applicationRunning: false,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      testExecutionTime: 0,
    };
  }
}

/**
 * Enhanced beforeEach hook with smart app monitoring
 */
export const enhancedBeforeEach = test.beforeEach(
  async ({ page }, testInfo) => {
    const startTime = Date.now();
    console.log(`🎯 Starting test: ${testInfo.title}`);

    // Quick health check first
    const isHealthy = await EnhancedTestMonitor.quickHealthCheck();

    if (!isHealthy) {
      console.log("⚠️ Application not running, starting quickly...");
      const started = await EnhancedTestMonitor.quickStartApplication();

      if (!started) {
        throw new Error("❌ Could not start application for test execution");
      }
    }

    // Set test timeout based on health
    const healthStatus = EnhancedTestMonitor.getHealthStatus();
    if (healthStatus.consecutiveFailures > 0) {
      // Extend timeout for potentially unstable app
      testInfo.setTimeout(120000); // 2 minutes
      console.log("⏰ Extended timeout due to previous failures");
    }

    console.log("✅ Pre-test validation complete");
  },
);

/**
 * Enhanced afterEach hook with failure analysis
 */
export const enhancedAfterEach = test.afterEach(async ({ page }, testInfo) => {
  const endTime = Date.now();
  EnhancedTestMonitor.testHealth.testExecutionTime = endTime - Date.now();

  // Quick post-test health check
  const isStillHealthy = await EnhancedTestMonitor.quickHealthCheck();

  if (!isStillHealthy) {
    console.log("⚠️ Application stopped during test execution");

    // If test passed but app stopped, it's a concern
    if (testInfo.status === "passed") {
      console.log("🤔 Test passed but app stopped - investigating...");
    }
  }

  // Handle test failures with smart recovery
  if (testInfo.status === "failed" && testInfo.error) {
    const error = new Error(testInfo.error.message || "Test failed");
    const recovered = await EnhancedTestMonitor.handleTestFailure(
      testInfo,
      error,
    );

    if (recovered) {
      console.log("✨ Recovery successful - next test should proceed normally");
    }
  }

  console.log(
    `📊 Test completed: ${testInfo.title} - Status: ${testInfo.status} - Duration: ${EnhancedTestMonitor.testHealth.testExecutionTime}ms`,
  );
});

/**
 * Convenience function to use both enhanced hooks
 */
export const withEnhancedMonitoring = () => {
  enhancedBeforeEach;
  enhancedAfterEach;
};

/**
 * Fast application health check for use in individual tests
 */
export const ensureAppRunning = async (): Promise<void> => {
  const isRunning = await EnhancedTestMonitor.quickHealthCheck();
  if (!isRunning) {
    console.log("🔄 App check failed mid-test, attempting recovery...");
    const started = await EnhancedTestMonitor.quickStartApplication();
    if (!started) {
      throw new Error("❌ Application recovery failed during test");
    }
  }
};

// EnhancedTestMonitor already exported above
