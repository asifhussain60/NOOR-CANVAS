---
mode: agent
---

# /imgreq — Image Request Agent (v3.0.0)

Generates visual artifacts (diagrams, UI mockups, workflows) for `{key}` while maintaining code quality.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier - auto-inferred if not provided
- **notes:** Image request description (artifacts, formats, context)

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD`
- Current implementation status and scope
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

### Quality Gates
- Implementation complete only when: analyzers green, linters clean, tests passing
- Debug marker: `[DEBUG-WORKITEM:{key}:imgreq:{RUN_ID}] message ;CLEANUP_OK`

## Execution Protocol
1. **Requirements Analysis:** Parse context and requirements for `{key}`
2. **Artifact Generation:** Create needed visuals:
   - UI mockups, workflow diagrams, architecture sketches
   - Use project standards (Mermaid, PlantUML, PNG/SVG)
   - Output location: `Workspaces/Copilot/artifacts/{key}/images/`
3. **Integration:** Link artifacts in requirements/test files for traceability
4. **Validation:** If supporting code modified, run analyzer → linter → test cycles

## Completion Criteria
- Visual artifacts generated and properly linked
- Supporting code passes all quality gates
- Clean terminal evidence captured
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
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._
