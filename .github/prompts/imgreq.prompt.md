---
mode: agent
---

# /imgreq — Image Request Agent (v2.8.0)

Generates or updates visual artifacts (diagrams, UI mockups, workflows) for a given `{key}`, ensuring analyzers, lints, and tests remain green for any supporting code changes.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **notes:** freeform description of the image request (artifacts needed, formats, files to update, context)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- Any design references or test files under `Workspaces/Copilot/prompts.keys/{key}/`

## Launch Policy
- **Never** use `dotnet run`
- Launch only via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Before or after generating image-related artifacts:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings
- Run `npm run format:check` → must pass with 0 formatting issues

If analyzers or lints fail, stop and fix violations before finalizing image tasks.

- Marker: [DEBUG-WORKITEM:{key}:imgreq:{RUN_ID}] message ;CLEANUP_OK
- `RUN_ID`: unique id (timestamp + suffix)
- Modes: respect `none`, `simple`, `trace`

## Image Request Protocol
1. Parse requirements and context for `{key}`
2. Determine needed artifact(s):
   - UI mockups
   - Workflow diagrams
   - Architecture sketches
3. Generate visuals using project standards (e.g., Mermaid, PlantUML, or PNG/SVG exports)
4. Place outputs in:
   - `Workspaces/Copilot/artifacts/{key}/images/`
5. Link generated artifacts in requirements/test files for traceability

## Iterative Validation
- If supporting code is touched (e.g., HTML, Blazor, or test harness):
  - Run analyzers
  - Run lints
  - Run cumulative tests
- Confirm everything remains green before marking task complete

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzer/linter/test status
- Include this in summary with artifact references

## Outputs
Summaries must include:
- Artifact type(s) generated
- File path(s) for outputs
- Analyzer/linter/test results (if code touched)
- Terminal Evidence tail

## Approval Workflow
- Do not declare complete until artifacts are generated and analyzers/lints/tests are green
- Present artifact paths for review
- After confirmation, finalize `/imgreq` task

## Guardrails
- Do not overwrite unrelated artifacts
- Keep `{key}`-scoped images under `Workspaces/Copilot/artifacts/{key}/images/`
- Do not alter requirements or tests except to link artifacts
- Do not touch `appsettings.*.json` or secrets

## Database Guardrails
- Never use LocalDB for any database operations
- Always use the specified SQL Server instance:
```
Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false
```
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches