---
mode: agent
---

## Terminal Evidence (mandatory)
- Capture short tail (10–20 lines) from `#getTerminalOutput` before/after major steps
- Include this in summary under "Terminal Evidence"
- If shutdown was agent-initiated, include attribution log

## Documentation Placement (CRITICAL)
- **NEVER** create analysis or summary files in project root
- **ALL** documentation must go in: `Workspaces/Copilot/_DOCS/`
- Use appropriate subdirectory: `/summaries/`, `/analysis/`, `/configs/`, `/migrations/`
- Follow SelfAwareness.instructions.md File Organization Rules

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

## Commit Policy
- Commit only after analyzers, lints, and tests pass
- Include RUN_ID in commit messages for traceability
- Respect `commit` parameter: `true`, `false`, or `force`
- **When `commit:true` or `commit:force`**: Clean up uncommitted files:
  - Add all modified files: `git add .`
  - Reset/ignore untracked files that shouldn't be committed
  - Ensure clean working tree after commit: `git status --porcelain` should be empty
  - If conflicts arise, resolve by either committing or explicitly ignoring via `.gitignore`

---

## /workitem — Implementation Agent (v2.11.0)

Implements scoped changes for a given `{key}` and stabilizes them with analyzers, cumulative Playwright tests, structured debug logs, and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior (`none`, `simple`, `trace`)
- **commit:** whether changes should be committed automatically (subject to Commit Policy)
  - `true` → commit after analyzers, lints, and tests succeed  
  - `false` → do not commit  
  - `force` → bypass analyzer/linter/test checks (manual override only)
- **mode:** operation mode (`analyze`, `apply`, `test`)
  - **analyze** → analyze requested work and document in MD file
  - **apply** → (default) perform the work without docs
  - **test** → apply + generate Playwright test
- **notes:** freeform description of the requested work (scope, files, details, edge cases)

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run` or any variant.
- Launch only via:
  - `./Workspaces/Global/nc.ps1`  (launch only)
  - `./Workspaces/Global/ncb.ps1` (clean, build, then launch)
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
**See SelfAwareness.instructions.md for complete analyzer and linter rules.**

If analyzers or lints fail, stop and fix violations before proceeding.

## Testing & Node.js Context
- App: ASP.NET Core 8.0 + Blazor Server + SignalR
- Node.js: **test-only**, used exclusively for Playwright E2E
- Tests run against the .NET app at `https://localhost:9091`
- Config: `config/testing/playwright.config.cjs`  
- Setup: `PlayWright/tests/global-setup.ts`  
- Specs: `Tests/*.spec.ts`

## Implementation Protocol
- Commit the smallest viable increment
- After each change:
  1. Run analyzers (`dotnet build --warnaserror`)
  2. Run lints (`npm run lint`, `npm run format:check`) using configs in `config/testing/`
  3. Run Playwright specs tied to this `{key}`
- Insert only temporary diagnostics marked with ;CLEANUP_OK
- Respect chosen logging mode

## Cleanup Protocol (when `commit:true` or `commit:force`)
1. **Pre-commit validation**: Ensure all checks pass (unless `force`)
2. **Stage relevant changes**: `git add .` for all work-related modifications
3. **Handle untracked files**:
   - Temporary/build artifacts → Add to `.gitignore` if not already covered
   - Test artifacts → Keep in appropriate `artifacts/` or `TEMP/` directories
   - Logs/debug files → Remove or add to `.gitignore`
4. **Commit with attribution**: Include `{key}` and `RUN_ID` in commit message
5. **Verify clean state**: `git status --porcelain` should return empty
6. **Document any ignored files** in commit message if new .gitignore entries added

## Iterative Testing
- Specs must live under:  
  `Workspaces/Copilot/prompts.keys/{key}/tests/`

- Global config: Use centralized `config/testing/playwright.config.cjs` or create specific config for key-based testing:
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