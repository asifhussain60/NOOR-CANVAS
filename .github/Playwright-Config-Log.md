# Playwright Configuration & Test Attempt Log

This document tracks the configurations and results of Playwright test runs for the `pw` work item.

## Attempt 1 (Initial Failure)

*   **Configuration:**
    *   `playwright.config.js`: `webServer` configured to run `dotnet run --project SPA/NoorCanvas/NoorCanvas.csproj`.
    *   `PW_MODE`: `standalone`
    *   Test Script: `canvas-e2e.spec.ts` (initial version)
*   **Result:** **FAILURE** - `Test timeout`. The application server started, but the tests timed out, indicating the app wasn't ready or accessible within the time limit.

## Attempt 2 (Headed Mode Failure)

*   **Configuration:**
    *   Test run with `--headed` flag.
    *   Tokens manually provisioned and passed as environment variables.
    *   Test Script: Used incorrect URLs (`/${sessionCode}?userToken=${userToken}` and `/HostControlPanel/...`).
*   **Result:** **FAILURE**
    *   `should display the participant list`: Failed because the page was blank. The URL was incorrect.
    *   `should receive shared content in real-time`: Failed because the host page URL was incorrect.
    *   `should allow submitting a question`: Failed because the participant page URL was incorrect.

## Attempt 3 (Corrected Routes)

*   **Configuration:**
    *   Test Script: Updated with correct routes from `ROUTE-DEFINITIONS.md`:
        *   Participant: `/session/canvas/{userToken}`
        *   Host: `/host/control-panel/{hostToken}`
*   **Result:** **FAILURE**
    *   `should display the participant list`: Failed with a strict mode violation. The locator `text=Participants` was not specific enough.
    *   `should receive shared content in real-time`: Timed out waiting for the 'Share Content' button.
    *   `should allow submitting a question`: Timed out trying to fill the question input.

---
