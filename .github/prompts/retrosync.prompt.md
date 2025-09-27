---
mode: agent
---

# /retrosync — Requirements/Test Synchronization Agent (v2.7.0)

Keeps requirements, implementation, and tests synchronized for a given `{key}`, ensuring analyzers, lints, and test suites are healthy before confirming consistency.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **notes:** freeform description of the synchronization scope (requirements/tests to reconcile, files to compare, drift details)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (if present)
- Test specs under `Workspaces/Copilot/prompts.keys/{key}/tests/`
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run`.
- Launch via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Before reconciling requirements/tests:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings (uses `config/testing/eslint.config.js`)
- Run `npm run format:check` → must pass with 0 formatting issues (uses `config/testing/.prettierrc`)

Retrosync cannot proceed until analyzers and lints are clean.

- Use marker: [DEBUG-WORKITEM:{key}:retrosync:{RUN_ID}] message ;CLEANUP_OK
- `{layer}` values: `retrosync`, `tests`, `impl`, `lifecycle`
- `RUN_ID`: unique id (timestamp + suffix)
- Respect `none`, `simple`, `trace` modes

## Synchronization Protocol
1. Parse requirements file and extract acceptance criteria
2. Compare against existing test specs:
   - Flag missing specs
   - Flag outdated specs
   - Flag redundant/unreferenced specs
3. Compare against implementation notes in `SelfReview-{key}.md`
   - Identify drift between requirements and implementation
4. Suggest changes:
   - Add/update/remove tests
   - Update requirements docs if implementation differs
   - Highlight gaps where implementation is missing coverage
5. Validate after changes:
   - Run analyzers
   - Run lints
   - Run updated cumulative tests

## Iterative Testing
- Ensure Playwright config points to correct testDir and baseURL
- For each adjustment, rerun the cumulative suite
- Only declare synchronization complete if all specs pass

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` that show analyzer/linter passes and test run summary
- Include attribution line if retrosync triggered a restart

## Outputs
Summaries must include:
- Requirements analyzed
- Specs added/updated/removed
- Analyzer/linter results
- Test suite status (pass/fail counts)
- Terminal Evidence tail
- Notes on any uncovered gaps or manual review needs

## Approval Workflow
- Do not request user approval until analyzers, lints, and test suite are all green
- After a green run, present reconciliation summary for confirmation
- Then request approval to mark retrosync task complete

## Guardrails
- Do not edit or remove `Requirements-{key}.md` unless explicitly updating synced requirements
- Do not alter `appsettings.*.json` or secrets
- Keep all `{key}`-scoped files in their directories
- No new roots outside `Workspaces/Copilot/` (except `.github/`)

## Database Guardrails
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches
- Keep all `{key}`-scoped requirements, self-reviews, and tests inside their respective directories
- Do not create new roots outside `Workspaces/Copilot/` (except `.github/`)

## Key Techstack Synchronization (Migrated from IssueTracker)

### Infrastructure Monitoring
- **Port Management**: Track changes to nc.ps1/ncb.ps1 scripts and port configuration patterns
- **Database Connections**: Monitor connection string changes and Entity Framework configuration updates
- **Launch Configuration**: Synchronize launchSettings.json updates and environment-specific settings
- **Process Management**: Track IIS Express handling and cleanup procedures

### Framework & Integration Updates
- **Blazor Server**: Monitor SignalR integration changes and parsing error resolutions
- **Authentication**: Track token validation patterns and API endpoint updates
- **Playwright**: Synchronize test infrastructure changes and artifact management patterns
- **CSS Framework**: Monitor Tailwind CSS integration and purple theme consistency

### Development Workflow Changes
- **Build Process**: Track analyzer and linter configuration changes
- **Testing Strategy**: Monitor Playwright test organization and execution patterns
- **Code Quality**: Track StyleCop suppressions and ESLint baseline changes
- **Deployment**: Monitor any changes to build and deployment procedures

# Additional Responsibilities
- Detect and record newly introduced libraries, frameworks, or dependencies.
- Identify changes in the technology stack or infrastructure.
- Sync these updates into **SelfAwareness.instructions.md** so Copilot has the latest context.