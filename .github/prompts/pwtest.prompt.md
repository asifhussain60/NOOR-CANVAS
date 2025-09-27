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
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- Existing specs under `Workspaces/Copilot/prompts.keys/{key}/tests/`
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run` or any variant.
- Launch the .NET app only via:
  - `./Workspaces/Copilot/Global/nc.ps1`  (launch only)
  - `./Workspaces/Copilot/Global/ncb.ps1` (clean, build, then launch)
- If you stop or restart the app, self-attribute the lifecycle event in logs:
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Before writing or executing tests:
- **.NET analyzers** — run `dotnet build --no-restore --warnaserror` and require **zero warnings**.
- **Playwright lints/format** — run `npm run lint` and `npm run format:check` and require **0 warnings / 0 formatting issues**.
If analyzers or lints fail, stop and fix violations before proceeding.

## Debug Logging Rules
- Use the marker: [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- `{layer}` values: `pwtest` (test authoring/execution), `tests` (shared test layer), `lifecycle`
- `RUN_ID`: short unique id (timestamp + random suffix)
- Modes:
  - **none**: no debug lines
  - **simple**: major milestones (start, discovered specs, run complete, pass/fail summary)
  - **trace**: every significant step (navigation, waits, assertions, artifact saves)

## Node.js Usage & App Context
- The NOOR Canvas app is **ASP.NET Core 8.0 + Blazor Server + SignalR**.
- Node.js is **test-only** and used exclusively for Playwright E2E.
- Tests run against the running .NET app at `https://localhost:9091` (or from `APP_URL` if provided).

## Playwright Configuration (expected rails)
- Global config file: `Workspaces/Copilot/config/playwright.config.ts`
  - `testDir`: `Workspaces/Copilot/prompts.keys/{key}/tests`
  - `baseURL`: read from `APP_URL` (never hardcode)
  - Reporter: HTML to `Workspaces/Copilot/artifacts/playwright/report`
  - Traces/Screenshots: enable on failure and save under `Workspaces/Copilot/artifacts/playwright/`
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
- Prefer headed/trace-on-failure in development; CI may run headless parallel.
- Do not hardcode ports/URLs; derive from `APP_URL` or config.
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
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches