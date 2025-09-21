/**
 * Application Health Checker Utilities
 *
 * Provides utilities to check if the NOOR Canvas application is running
 * and automatically start it if needed during test execution.
 *
 * Created: September 21, 2025
 * Purpose: Ensure application availability during Playwright test execution
 */

export class AppHealthChecker {
  private static readonly APP_URL = "https://localhost:9091";
  private static readonly APP_HTTP_URL = "http://localhost:9090";
  private static readonly HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
  private static readonly APP_START_TIMEOUT = 120000; // 2 minutes

  /**
   * Check if the application is running by making a health check request
   */
  static async isApplicationRunning(): Promise<boolean> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.APP_URL, {
        method: "GET",
        signal: controller.signal,
        // Accept self-signed certificates would be handled by the test runner
      });

      clearTimeout(timeoutId);
      return response.ok || response.status < 500;
    } catch (httpsError) {
      // Try HTTP fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(this.APP_HTTP_URL, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok || response.status < 500;
      } catch (httpError) {
        console.log("Application health check failed:", httpError);
        return false;
      }
    }
  }

  /**
   * Start the application using the run-with-iiskill script
   */
  static async startApplication(): Promise<void> {
    console.log("Starting NOOR Canvas application...");

    const { spawn } = require("child_process");
    const process = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "d:\\PROJECTS\\NOOR CANVAS\\run-with-iiskill.ps1",
      ],
      {
        detached: true,
        stdio: "ignore",
      },
    );

    // Don't wait for the process to finish, let it run in background
    process.unref();

    // Wait for application to become available
    await this.waitForApplication();
  }

  /**
   * Wait for the application to become available
   */
  static async waitForApplication(): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.APP_START_TIMEOUT) {
      if (await this.isApplicationRunning()) {
        console.log("Application is now running and available");
        return;
      }

      console.log("Waiting for application to start...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    throw new Error(
      `Application failed to start within ${this.APP_START_TIMEOUT / 1000} seconds`,
    );
  }

  /**
   * Ensure application is running before test execution
   */
  static async ensureApplicationRunning(): Promise<void> {
    console.log("Checking application health...");

    if (await this.isApplicationRunning()) {
      console.log("Application is already running");
      return;
    }

    console.log("Application is not running, attempting to start...");
    await this.startApplication();
  }

  /**
   * Perform post-test health check and restart if needed
   */
  static async postTestHealthCheck(): Promise<void> {
    console.log("Performing post-test health check...");

    if (await this.isApplicationRunning()) {
      console.log("Application is still running after test");
      return;
    }

    console.log("Application stopped during test execution, restarting...");
    await this.startApplication();
  }

  /**
   * Get application URLs for test configuration
   */
  static getApplicationUrls() {
    return {
      https: this.APP_URL,
      http: this.APP_HTTP_URL,
    };
  }
}
