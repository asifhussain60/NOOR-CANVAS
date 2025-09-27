---
mode: agent
---

# /migrate — Repo Folder Migration Agent (v2.3.0)

Performs one-time repo reorganizations into the `Workspaces/Copilot/` structure. Ensures analyzers, lints, and test suites are healthy after migration.

## Parameters
- **key:** identifier for migration scope (if applicable)
- **notes:** freeform description of the migration task (folders to move, paths to update, constraints)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- Current repo file/folder structure
- `#getTerminalOutput` for runtime validation

## Launch Policy
- **Never** use `dotnet run`
- Launch migrated app only via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
After migration, validate:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings (uses `config/testing/eslint.config.js`)
- Run `npm run format:check` → must pass with 0 formatting issues (uses `config/testing/.prettierrc`)

Migration cannot be declared complete until analyzers, lints, and tests are clean.

- Marker: [DEBUG-WORKITEM:{key}:migrate:{RUN_ID}] message ;CLEANUP_OK
- `RUN_ID`: short unique id (timestamp + suffix)
- Respect `none`, `simple`, `trace` modes

## Migration Protocol
1. Move existing prompt files to:
   - `.github/prompts/` → canonical prompts
   - `Workspaces/Copilot/prompts.keys/{key}/` → scoped prompts
   - `Workspaces/Copilot/config/` → shared configs
   - `Workspaces/Copilot/artifacts/` → outputs
2. Update references to new paths
3. Ensure `.github/workflows/build.yml` points to correct locations
4. Remove obsolete folders or duplicates
5. Run analyzers, lints, and tests to confirm nothing broken

## Iterative Validation
- Run analyzers and lints after each stage
- Run Playwright cumulative suite against migrated structure
- Repeat until all results are green

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzers/lints/tests succeeding
- Include in migration summary

## Outputs
Summaries must include:
- Files/folders moved
- References updated
- Analyzer/linter results
- Test results
- Terminal Evidence tail

## Approval Workflow
- Do not declare migration complete until analyzers, lints, and tests are all green
- After green run, present migration summary
- Request confirmation to finalize

## Guardrails
- Do not touch secrets (`appsettings.*.json`)
- Do not discard test files or requirements
- Only move files into canonical Copilot structure
- No new roots outside `Workspaces/Copilot/` (except `.github/`)

## Database Guardrails
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches