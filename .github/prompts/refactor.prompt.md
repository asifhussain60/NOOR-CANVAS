---
mode: agent
---

# /refactor — Structural Integrity Agent (v1.2.0)

Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with industry standards — while ensuring analyzers, lints, and test suites remain green.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **notes:** freeform description of the refactor task (areas to target, files/modules, rationale)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- Code and tests under `Workspaces/Copilot/prompts.keys/{key}/`
- Requirements and self-review files for `{key}`
- `#getTerminalOutput` for evidence

## Launch Policy
- **Never** use `dotnet run`
- Launch only via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
- If restart occurs, self-attribute:  
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Before and after refactor:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings (uses `config/testing/eslint.config.js`)
- Run `npm run format:check` → must pass with 0 formatting issues (uses `config/testing/.prettierrc`)

If analyzers or lints fail, resolve violations as part of the refactor.

- Marker: [DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK
- Respect `none`, `simple`, `trace` modes
- `RUN_ID`: unique id (timestamp + suffix)

## Refactor Protocol
1. **Survey & Identify**  
   - Detect duplicate, dead, or bloated code

2. **Systematic Updates**  
   Apply industry-standard refactorizations:
   - **Code deduplication** → extract shared methods/classes
   - **Dead code elimination** → remove unused imports, methods, variables
   - **Encapsulation** → strengthen data hiding, reduce surface area
   - **Separation of concerns** → isolate UI, business, and data layers
   - **Naming conventions** → apply StyleCop and ESLint standards
   - **Formatting/consistency** → Prettier for Playwright, StyleCop for .NET
   - **Test improvements** → remove brittle waits, improve resilience

3. **Validation Pass**  
   - Run analyzers
   - Run lints
   - Run full test suite

4. **Iterative Refinement**  
   - Repeat until no violations or warnings remain
   - Ensure refactored code compiles cleanly and all tests pass

## Iterative Testing
- Validate changes against full Playwright suite
- Run cumulative suite after each major refactor stage
- Require all green before proceeding

## Terminal Evidence
- Include 10–20 lines from `#getTerminalOutput` showing analyzers, lints, and test results

## Outputs
Summaries must include:
- Code areas refactored (files, methods, modules)
- Types of refactor applied (deduplication, cleanup, renaming, etc.)
- Analyzer/linter results
- Test outcomes
- Terminal Evidence tail

## Approval Workflow
- Do not mark refactor complete until analyzers, lints, and tests are green
- Present detailed summary of refactors performed
- Request user confirmation before closing task

## Guardrails
- Do not remove or alter requirement files unless explicitly instructed
- Do not touch `appsettings.*.json` or secrets
- Keep all `{key}`-scoped files in their directories
- No new roots outside `Workspaces/Copilot/` (except `.github/`)

## Database Guardrails
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches
## Database Guardrails
- **Never use LocalDB for any database operations.**
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches.
- Do not change `appsettings.*.json` or secrets
- Do not alter requirements without explicit approval
- Keep `{key}`-scoped work inside its directories
- No new roots outside `Workspaces/Copilot/` (except `.github/`)