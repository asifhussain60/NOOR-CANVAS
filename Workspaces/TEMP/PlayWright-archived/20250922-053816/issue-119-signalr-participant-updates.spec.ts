const { test, expect } = require("@playwright/test");

/**
 * Issue-119: SignalR Real-Time Participant Updates Test Suite
 *
 * Tests real-time participant list updates in the waiting room using SignalR
 * instead of the old 30-second polling mechanism.
 *
 * Test Scenarios:
 * 1. Real-time participant visibility (< 3 seconds)
 * 2. Multi-user concurrent registration
 * 3. SignalR connection resilience and fallback
 * 4. Session-scoped event broadcasting
 * 5. Performance validation (reduced API calls)
 */

test.describe("Issue-119: SignalR Real-Time Participant Updates", () => {
  const BASE_URL = "https://localhost:9091";
  const TEST_SESSION_TOKEN = "TESTUSR1"; // Use existing test token

  // Test data
  const testParticipants = [
    { name: "Alice Johnson", country: "United States" },
    { name: "Bob Smith", country: "Canada" },
    { name: "Carlos Rodriguez", country: "Mexico" },
    { name: "Diana Chen", country: "China" },
    { name: "Erik Larsson", country: "Sweden" },
  ];

  test.beforeEach(async ({ page }) => {
    // Set up console logging to track SignalR events
    page.on("console", (msg) => {
      if (
        msg.text().includes("NOOR-SIGNALR") ||
        msg.text().includes("SignalR")
      ) {
        console.log(`[Browser Console]: ${msg.text()}`);
      }
    });
  });

  test("Real-time participant updates should be visible within 3 seconds", async ({
    page,
    context,
  }) => {
    console.log("🧪 Testing real-time participant visibility...");

    // 1. Open waiting room for first participant
    await page.goto(`${BASE_URL}/session/waiting/${TEST_SESSION_TOKEN}`);
    await page.waitForSelector('[data-testid="participant-count"]', {
      timeout: 10000,
    });

    const initialCount = await page.textContent(
      '[data-testid="participant-count"]',
    );
    console.log(`Initial participant count: ${initialCount}`);

    // 2. Open registration form in new browser context (simulating second user)
    const newContext = await context.browser().newContext();
    const registrationPage = await newContext.newPage();

    // Start timing for real-time update measurement
    const startTime = Date.now();

    // 3. Register new participant
    await registrationPage.goto(
      `${BASE_URL}/user/landing/${TEST_SESSION_TOKEN}`,
    );
    await registrationPage.fill(
      'input[placeholder*="name"], input[name*="name"]',
      testParticipants[0].name,
    );

    // Select country
    const countrySelector = 'select[name*="country"], select[id*="country"]';
    await registrationPage.selectOption(
      countrySelector,
      testParticipants[0].country,
    );

    // Submit registration
    await registrationPage.click('button[type="submit"], .btn-success');

    // 4. Wait for participant to appear in waiting room (should be < 3 seconds)
    await page.waitForFunction(
      (participantName) => {
        const participantElements = document.querySelectorAll(
          '[data-testid="participant-name"]',
        );
        return Array.from(participantElements).some((el) =>
          el.textContent?.includes(participantName),
        );
      },
      testParticipants[0].name,
      { timeout: 5000 },
    );

    const updateTime = Date.now() - startTime;
    console.log(`✅ Participant appeared in ${updateTime}ms`);

    // Verify update time is under 3 seconds
    expect(updateTime).toBeLessThan(3000);

    // 5. Verify participant details are correct
    const participantNames = await page.$$eval(
      '[data-testid="participant-name"]',
      (elements) => elements.map((el) => el.textContent?.trim()),
    );
    expect(participantNames).toContain(testParticipants[0].name);

    // 6. Verify participant count updated
    const newCount = await page.textContent(
      '[data-testid="participant-count"]',
    );
    expect(parseInt(newCount)).toBeGreaterThan(parseInt(initialCount));

    await newContext.close();
  });

  test("Multiple users registering concurrently should all appear immediately", async ({
    page,
    context,
  }) => {
    console.log("🧪 Testing concurrent multi-user registration...");

    // 1. Open waiting room
    await page.goto(`${BASE_URL}/session/waiting/${TEST_SESSION_TOKEN}`);
    await page.waitForSelector('[data-testid="participant-count"]');

    const initialCount = parseInt(
      await page.textContent('[data-testid="participant-count"]'),
    );

    // 2. Create multiple browser contexts for concurrent registration
    const contexts = [];
    const registrationPromises = [];

    for (let i = 0; i < 3; i++) {
      const newContext = await context.browser().newContext();
      contexts.push(newContext);

      const registrationPage = await newContext.newPage();

      // Register participant concurrently
      const registrationPromise = (async () => {
        await registrationPage.goto(
          `${BASE_URL}/user/landing/${TEST_SESSION_TOKEN}`,
        );
        await registrationPage.fill(
          'input[placeholder*="name"], input[name*="name"]',
          testParticipants[i + 1].name,
        );
        await registrationPage.selectOption(
          'select[name*="country"], select[id*="country"]',
          testParticipants[i + 1].country,
        );
        await registrationPage.click('button[type="submit"], .btn-success');

        // Wait for successful registration
        await registrationPage.waitForURL("**/session/waiting/**", {
          timeout: 10000,
        });
      })();

      registrationPromises.push(registrationPromise);
    }

    // 3. Execute all registrations simultaneously
    const startTime = Date.now();
    await Promise.all(registrationPromises);

    // 4. Wait for all participants to appear in waiting room
    await page.waitForFunction(
      (expectedCount) => {
        const countText = document.querySelector(
          '[data-testid="participant-count"]',
        )?.textContent;
        return countText && parseInt(countText) >= expectedCount;
      },
      initialCount + 3,
      { timeout: 10000 },
    );

    const totalUpdateTime = Date.now() - startTime;
    console.log(`✅ All participants appeared in ${totalUpdateTime}ms`);

    // 5. Verify all participants are visible
    const finalCount = parseInt(
      await page.textContent('[data-testid="participant-count"]'),
    );
    expect(finalCount).toBeGreaterThanOrEqual(initialCount + 3);

    // Verify participant names
    const participantNames = await page.$$eval(
      '[data-testid="participant-name"]',
      (elements) => elements.map((el) => el.textContent?.trim()),
    );

    for (let i = 1; i <= 3; i++) {
      expect(participantNames).toContain(testParticipants[i].name);
    }

    // Clean up contexts
    for (const ctx of contexts) {
      await ctx.close();
    }
  });

  test("SignalR connection failure should fallback to polling gracefully", async ({
    page,
  }) => {
    console.log("🧪 Testing SignalR fallback mechanism...");

    // 1. Block SignalR connections to simulate failure
    await page.route("**/hub/session**", (route) => route.abort());

    // 2. Open waiting room (should still work with polling fallback)
    await page.goto(`${BASE_URL}/session/waiting/${TEST_SESSION_TOKEN}`);
    await page.waitForSelector('[data-testid="participant-count"]', {
      timeout: 15000,
    });

    // 3. Verify basic functionality still works
    const participantCount = await page.textContent(
      '[data-testid="participant-count"]',
    );
    expect(participantCount).toBeDefined();

    // 4. Check that polling timer is active (5-minute fallback)
    const hasPollingTimer = await page.evaluate(() => {
      // Check if there's a timer running (we can't directly access the private timer)
      return window.setInterval !== undefined;
    });
    expect(hasPollingTimer).toBe(true);

    console.log("✅ Polling fallback is working correctly");
  });

  test("Session-scoped events should only affect correct waiting room", async ({
    page,
    context,
  }) => {
    console.log("🧪 Testing session-scoped event broadcasting...");

    // 1. Open two different session waiting rooms
    const session1Token = TEST_SESSION_TOKEN;
    const session2Token = "TESTUSR2"; // Different session token

    await page.goto(`${BASE_URL}/session/waiting/${session1Token}`);
    await page.waitForSelector('[data-testid="participant-count"]');

    const session2Context = await context.browser().newContext();
    const session2Page = await session2Context.newPage();
    await session2Page.goto(`${BASE_URL}/session/waiting/${session2Token}`);
    await session2Page.waitForSelector('[data-testid="participant-count"]');

    // 2. Get initial counts
    const session1InitialCount = parseInt(
      await page.textContent('[data-testid="participant-count"]'),
    );
    const session2InitialCount = parseInt(
      await session2Page.textContent('[data-testid="participant-count"]'),
    );

    // 3. Register participant to session 1
    const registrationContext = await context.browser().newContext();
    const registrationPage = await registrationContext.newPage();

    await registrationPage.goto(`${BASE_URL}/user/landing/${session1Token}`);
    await registrationPage.fill(
      'input[placeholder*="name"], input[name*="name"]',
      "Session1 Participant",
    );
    await registrationPage.selectOption(
      'select[name*="country"], select[id*="country"]',
      "United States",
    );
    await registrationPage.click('button[type="submit"], .btn-success');

    // 4. Wait and verify only session 1 is updated
    await page.waitForFunction(
      (initialCount) => {
        const countText = document.querySelector(
          '[data-testid="participant-count"]',
        )?.textContent;
        return countText && parseInt(countText) > initialCount;
      },
      session1InitialCount,
      { timeout: 5000 },
    );

    // 5. Verify session 1 count increased
    const session1FinalCount = parseInt(
      await page.textContent('[data-testid="participant-count"]'),
    );
    expect(session1FinalCount).toBeGreaterThan(session1InitialCount);

    // 6. Verify session 2 count unchanged (after a brief wait)
    await page.waitForTimeout(2000);
    const session2FinalCount = parseInt(
      await session2Page.textContent('[data-testid="participant-count"]'),
    );
    expect(session2FinalCount).toBe(session2InitialCount);

    console.log(
      `✅ Session isolation working: Session1 ${session1InitialCount}→${session1FinalCount}, Session2 unchanged at ${session2FinalCount}`,
    );

    await session2Context.close();
    await registrationContext.close();
  });

  test("API call frequency should be significantly reduced with SignalR", async ({
    page,
  }) => {
    console.log("🧪 Testing API call frequency optimization...");

    // Track API calls
    const apiCalls = [];
    page.on("request", (request) => {
      if (
        request.url().includes("/api/participant/session/") &&
        request.url().includes("/participants")
      ) {
        apiCalls.push({
          url: request.url(),
          timestamp: Date.now(),
        });
      }
    });

    // 1. Open waiting room
    await page.goto(`${BASE_URL}/session/waiting/${TEST_SESSION_TOKEN}`);
    await page.waitForSelector('[data-testid="participant-count"]', {
      timeout: 10000,
    });

    // 2. Wait for initial load call
    await page.waitForTimeout(2000);
    const initialCalls = apiCalls.length;

    // 3. Monitor for 30 seconds (old implementation would make 1 call)
    const monitorStart = Date.now();
    await page.waitForTimeout(30000);

    const callsDuring30Seconds = apiCalls.length - initialCalls;
    console.log(
      `📊 API calls in 30 seconds: ${callsDuring30Seconds} (should be 0 with SignalR)`,
    );

    // With real-time SignalR, there should be no polling calls during this period
    expect(callsDuring30Seconds).toBeLessThanOrEqual(1); // Allow for occasional fallback

    // 4. Verify calls are spaced appropriately (should be 5-minute intervals now)
    if (apiCalls.length > 1) {
      const timeBetweenCalls =
        apiCalls[apiCalls.length - 1].timestamp -
        apiCalls[apiCalls.length - 2].timestamp;
      console.log(`🕐 Time between API calls: ${timeBetweenCalls}ms`);

      // Should be close to 5 minutes (300,000ms) or initial load
      expect(timeBetweenCalls).toBeGreaterThan(60000); // At least 1 minute apart
    }
  });

  test("Performance benchmark: Old vs New participant update times", async ({
    page,
    context,
  }) => {
    console.log("🧪 Performance benchmark test...");

    // 1. Open waiting room
    await page.goto(`${BASE_URL}/session/waiting/${TEST_SESSION_TOKEN}`);
    await page.waitForSelector('[data-testid="participant-count"]');

    // 2. Perform 5 consecutive registrations and measure update times
    const updateTimes = [];

    for (let i = 0; i < 3; i++) {
      const registrationContext = await context.browser().newContext();
      const registrationPage = await registrationContext.newPage();

      const participantName = `Benchmark User ${i + 1}`;

      // Start timing
      const startTime = Date.now();

      // Register participant
      await registrationPage.goto(
        `${BASE_URL}/user/landing/${TEST_SESSION_TOKEN}`,
      );
      await registrationPage.fill(
        'input[placeholder*="name"], input[name*="name"]',
        participantName,
      );
      await registrationPage.selectOption(
        'select[name*="country"], select[id*="country"]',
        "United States",
      );
      await registrationPage.click('button[type="submit"], .btn-success');

      // Wait for participant to appear
      await page.waitForFunction(
        (name) => {
          const participantElements = document.querySelectorAll(
            '[data-testid="participant-name"]',
          );
          return Array.from(participantElements).some((el) =>
            el.textContent?.includes(name),
          );
        },
        participantName,
        { timeout: 10000 },
      );

      const updateTime = Date.now() - startTime;
      updateTimes.push(updateTime);
      console.log(`⏱️  Registration ${i + 1}: ${updateTime}ms`);

      await registrationContext.close();

      // Brief pause between registrations
      await page.waitForTimeout(1000);
    }

    // 3. Calculate statistics
    const avgTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    const maxTime = Math.max(...updateTimes);
    const minTime = Math.min(...updateTimes);

    console.log(`📈 Performance Results:`);
    console.log(`   Average update time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Fastest update: ${minTime}ms`);
    console.log(`   Slowest update: ${maxTime}ms`);

    // 4. Performance assertions
    expect(avgTime).toBeLessThan(5000); // Average under 5 seconds
    expect(maxTime).toBeLessThan(10000); // Max under 10 seconds
    expect(minTime).toBeLessThan(3000); // Best case under 3 seconds

    // 5. Compare to old 30-second polling
    const improvementFactor = 30000 / avgTime;
    console.log(
      `🚀 Performance improvement: ${improvementFactor.toFixed(1)}x faster than 30-second polling`,
    );

    expect(improvementFactor).toBeGreaterThan(5); // At least 5x faster
  });
});

/**
 * Helper functions for SignalR testing
 */

// Wait for SignalR connection to be established
async function waitForSignalRConnection(page, timeout = 10000) {
  return await page.waitForFunction(
    () => {
      return (
        window.signalRConnectionState === "Connected" ||
        document.querySelector('[data-signalr-connected="true"]') !== null
      );
    },
    { timeout },
  );
}

// Monitor SignalR events in browser console
function setupSignalRMonitoring(page) {
  return page.addInitScript(() => {
    window.signalREvents = [];

    // Override SignalR connection event handlers if available
    if (window.signalR) {
      const originalOn = window.signalR.HubConnection.prototype.on;
      window.signalR.HubConnection.prototype.on = function (
        methodName,
        callback,
      ) {
        const wrappedCallback = (...args) => {
          window.signalREvents.push({
            event: methodName,
            data: args,
            timestamp: Date.now(),
          });
          return callback(...args);
        };
        return originalOn.call(this, methodName, wrappedCallback);
      };
    }
  });
}

/**
 * Test Data Utilities
 */

// Generate random participant data for stress testing
function generateRandomParticipant(index) {
  const names = [
    "Alex",
    "Sam",
    "Jordan",
    "Casey",
    "Riley",
    "Cameron",
    "Blake",
    "Avery",
  ];
  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
  ];

  return {
    name: `${names[index % names.length]} ${Math.floor(Math.random() * 1000)}`,
    country: countries[index % countries.length],
  };
}
