---
mode: agent
---

## Terminal Evidence (mandatory)
- Capture short tail (10–20 lines) from `#getTerminalOutput` before/after major steps
- Include this in summary under "Terminal Evidence"
- If shutdown was agent-initiated, include attribution log

## Database Guardrails
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:  
  `Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false`
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches

## Commit Policy
- Commit only after analyzers, lints, and tests pass
- Include RUN_ID in commit messages for traceability
- Respect `commit` parameter: `true`, `false`, or `force`

---

## /workitem — Implementation Agent (v2.10.0)

Implements scoped changes for a given `{key}` and stabilizes them with analyzers, cumulative Playwright tests, structured debug logs, and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior (`none`, `simple`, `trace`)
- **commit:** whether changes should be committed automatically (subject to Commit Policy)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run` or any variant.
- Launch only via:
  - `./Workspaces/Copilot/Global/nc.ps1`  (launch only)
  - `./Workspaces/Copilot/Global/ncb.ps1` (clean, build, then launch)
- If you stop or restart the app, self-attribute in logs:  
  `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Debug Logging Rules
- Marker: `[DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK`
- `{layer}` values: `impl`, `tests`, `pwtest`, `retrosync`, `refactor`, `cleanup`, `lifecycle`
- `RUN_ID`: short unique id (timestamp + suffix)
- Modes:
  - **none**: no debug lines
  - **simple**: logs only for key lifecycle events and checks
  - **trace**: logs for every step, including intermediate calculations and branching

## Analyzer & Linter Enforcement
Before tests, enforce analyzers and linters:

- **.NET**  
  - Run: `dotnet build --no-restore --warnaserror`  
  - Must succeed with **zero warnings** (Roslyn + StyleCop analyzers)

- **Playwright**  
  - Run: `npm run lint` → must pass with 0 warnings  
  - Run: `npm run format:check` → must pass with 0 formatting issues

If analyzers or lints fail, stop and fix violations before proceeding.

## Testing & Node.js Context
- App: ASP.NET Core 8.0 + Blazor Server + SignalR
- Node.js: **test-only**, used exclusively for Playwright E2E
- Tests run against the .NET app at `https://localhost:9091`
- Config: `playwright.config.js`  
- Setup: `PlayWright/tests/global-setup.ts`  
- Specs: `Tests/*.spec.ts`

## Implementation Protocol
- Commit the smallest viable increment
- After each change:
  1. Run analyzers (`dotnet build --warnaserror`)
  2. Run lints (`npm run lint`, `npm run format:check`)
  3. Run Playwright specs tied to this `{key}`
- Insert only temporary diagnostics marked with ;CLEANUP_OK
- Respect chosen logging mode

## Iterative Testing
- Specs must live under:  
  `Workspaces/Copilot/prompts.keys/{key}/tests/`

- Global config: `Workspaces/Copilot/config/playwright.config.ts` must set:
  - `testDir: "Workspaces/Copilot/prompts.keys/{key}/tests"`
  - `baseURL` from APP_URL (never hardcode)
  - HTML report → `Workspaces/Copilot/artifacts/playwright/report`

- Follow incremental accumulation:
  1. Implement change + spec → analyzers + lints → run spec1
  2. Add second change + spec → analyzers + lints → run spec1+spec2
  3. Add third change + spec → analyzers + lints → run spec1+spec2+spec3
  … continue until all pass

## Key Implementation Patterns (Migrated from IssueTracker)

### Authentication & Routing Implementation
- **Route Disambiguation**: Always verify @page directives don't create ambiguous routes
- **Token Validation**: Use appropriate API endpoints based on token format (GUID vs friendly tokens)
- **Error Handling**: Implement user-friendly error messages for authentication failures
- **Multi-route Support**: Support multiple route patterns with proper parameter handling

### Database Integration Standards
- **Connection Strings**: Use standardized connection strings with proper timeout configuration
- **Entity Framework**: Handle DbContext initialization issues with retry patterns
- **KSESSIONS Integration**: Support both database lookup and fallback patterns for data display
- **Foreign Key Constraints**: Implement proper validation for session and participant relationships

### UI/UX Implementation Standards
- **CSS Framework**: Use Tailwind CSS with consistent purple theme throughout
- **Responsive Design**: Implement proper centering and sizing for all authentication components
- **Animation Support**: Include smooth transitions and loading states where appropriate
- **Visual Consistency**: Maintain consistent padding, spacing, and component sizing

### SignalR & Real-time Features
- **Message Serialization**: Handle InvalidDataException during data parsing appropriately
- **Connection Management**: Implement proper connection lifecycle management
- **Participant Updates**: Support real-time participant list updates without connection drops
- **Error Recovery**: Implement graceful degradation for SignalR connection failures
