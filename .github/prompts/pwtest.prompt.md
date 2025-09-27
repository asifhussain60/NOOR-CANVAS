---
mode: agent
---

# /pwtest — Playwright Test Agent (v2.9.0)

Creates and maintains Playwright tests for a given `{key}`. Validates implementation changes **iteratively** with analyzers, lints, cumulative test runs, structured debug logs, and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** logging mode (`none`, `simple`, `trace`) controlling debug verbosity
- **notes:** freeform description of the test work (scenarios, files under test, considerations)

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- Current test structure and coverage
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- Existing specs under `Workspaces/Copilot/prompts.keys/{key}/tests/`
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Playwright manages application lifecycle automatically via webServer configuration**
- **Never** use PowerShell scripts (`nc.ps1`/`ncb.ps1`) for Playwright test runs
- **Always** use `PW_MODE=standalone` environment variable to enable automatic app startup
- Playwright's `webServer` configuration in `config/testing/playwright.config.cjs` handles:
  - Starting .NET app with `dotnet run` in correct directory
  - Waiting for port 9091 to be ready
  - Shutting down app after tests complete
- If manual restart is needed, set environment variable and re-run Playwright:
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] playwright_webserver_restart=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
**See SelfAwareness.instructions.md for complete analyzer and linter rules.**

Test creation cannot be marked complete until analyzers, lints, and tests are green.

## Debug Logging Rules
- Use marker: `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`
- `{layer}` values: `pwtest` (test authoring/execution), `tests` (shared test layer), `lifecycle`
- `RUN_ID`: short unique id (timestamp + random suffix)
- Modes:
  - **none**: no debug lines
  - **simple**: major milestones (start, discovered specs, run complete, pass/fail summary)
  - **trace**: every significant step (navigation, waits, assertions, artifact saves)

## Node.js Usage & App Context
- The NOOR Canvas app is **ASP.NET Core 8.0 + Blazor Server + SignalR**.
- Node.js is **test-only** and used exclusively for Playwright E2E.
- **Playwright's webServer manages the .NET app lifecycle** - starts with `dotnet run`, monitors port 9091, shuts down after tests
- Tests run against Playwright-managed app at `https://localhost:9091`
- **Use `PW_MODE=standalone`** to enable webServer automatic management

## Playwright Configuration (expected rails)
- **Primary config**: `config/testing/playwright.config.cjs` (centralized configuration)
  - `webServer` configuration handles automatic .NET app startup/shutdown
  - `testDir`: `Workspaces/Copilot/prompts.keys/{key}/tests`
  - `baseURL`: automatically set to `https://localhost:9091` when webServer starts
  - Reporter: HTML to `Workspaces/Copilot/artifacts/playwright/report`
  - Traces/Screenshots: enable on failure and save under `Workspaces/Copilot/artifacts/playwright/`
- **webServer Configuration**: Automatically handles:
  - `command: 'dotnet run'` in `SPA/NoorCanvas` directory
  - `port: 9091` with readiness detection
  - `reuseExistingServer: !process.env.CI` for development efficiency
  - `timeout: 60000` for app startup
- Global setup (if used): `PlayWright/tests/global-setup.ts`

## Test Authoring Rules
- Place all specs for this `{key}` in:
  `Workspaces/Copilot/prompts.keys/{key}/tests/`
- Each spec file:
  - One primary concern per file (keep tests focused and readable)
  - Top-level `describe` includes an `@{key}` tag for filtering
  - Prefer resilient selectors (role, label, test-id) over brittle CSS
  - Avoid sleeps; use `await page.waitFor*` and expect polling

## Iterative Accumulation Protocol
Write and run tests **incrementally**, always accumulating:
1. Add `spec1` for the smallest slice of behavior → run analyzers → run lints → run `spec1`
2. Add `spec2` expanding coverage → run analyzers → lints → run `spec1 + spec2`
3. Add `spec3` … continue accumulating until targeted behavior is fully covered
- Fix failures **before** adding new specs.
- Keep specs deterministic; remove hidden state between tests (isolate via fixtures or fresh pages).

## Execution Rules
- **Always use `PW_MODE=standalone`** to enable webServer automatic app management
- **Never manually start the .NET app** - let Playwright's webServer handle it
- Use environment variable: `$env:PW_MODE="standalone"` (PowerShell) or `PW_MODE=standalone` (bash)
- Prefer headed/trace-on-failure in development; CI may run headless parallel
- Ports/URLs automatically configured via webServer (https://localhost:9091)
- Save artifacts relative to repo:
  - HTML report → `Workspaces/Copilot/artifacts/playwright/report`
  - Traces → `Workspaces/Copilot/artifacts/playwright/traces`
  - Screenshots → `Workspaces/Copilot/artifacts/playwright/screenshots`

## Terminal Evidence (mandatory)
- Capture and include a short tail (10–20 lines) from `#getTerminalOutput` that shows:
  - The analyzer/linter pass prior to test execution
  - The summary of the latest Playwright run (passed/failed, retries, artifacts)
- If you initiated a restart/stop, include the attribution line in the evidence section.

## Outputs
Provide a summary containing:
- Specs created/updated (filenames, brief intent)
- Analyzer/linter results (pass/fail + counts)
- Test run results (per-browser if relevant), with artifact locations
- Terminal Evidence tail (10–20 lines)
- Next incremental spec(s) to add for broader coverage

## Approval Workflow
- Do **not** prompt for user approval until:
  - Analyzers and lints are green
  - The accumulated test suite for `{key}` is green
- After a fully green run, prompt for one manual verification pass
- Then request approval to mark the `/pwtest` task complete

## Key Test Patterns (Migrated from IssueTracker)

### Authentication & Routing Tests
- **Token Validation**: Test both valid and invalid token scenarios with appropriate error handling
- **Route Conflicts**: Verify no ambiguous route exceptions during app startup
- **Authentication Flows**: Test complete workflows from landing → authentication → session access
- **Multi-route Support**: Validate all supported route patterns for each component

### Infrastructure & Integration Tests
- **Port Binding**: Validate app starts successfully on dynamically assigned ports
- **Database Connectivity**: Test KSESSIONS integration with proper connection string validation
- **SignalR Integration**: Test real-time features without connection drops or parsing errors
- **Asset Loading**: Verify CSS, JS, and other static assets load correctly

### UI Component Tests
- **Responsive Design**: Test component rendering across different viewport sizes
- **Visual Consistency**: Validate purple theme, Tailwind CSS classes, and spacing
- **Animation Support**: Test smooth transitions and loading states
- **Error States**: Validate user-friendly error messages for common failure scenarios

### Session Management Tests
- **Session Creation**: Test host provisioner workflow with proper GUID generation
- **Participant Management**: Test real-time participant updates via SignalR
- **Session Name Display**: Test both database lookup and fallback display patterns
- **Token Consistency**: Validate token persistence throughout session workflows

### Data Integration Tests
- **Album & Category Loading**: Test dynamic data loading from KSESSIONS database
- **Flag Display**: Test ISO2 country code mapping for participant countries
- **Session Transcripts**: Test validation logic and proper storage
- **Empty States**: Test graceful handling of empty or missing data

## Guardrails
- Do not edit `Workspaces/Copilot/config/environments/appsettings.*.json` or secrets unless explicitly requested
- Respect canonical layout: keep all `{key}`-scoped tests under `prompts.keys/{key}/tests/`
- Do not create new roots outside `Workspaces/Copilot/` (except `.github/`)

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**