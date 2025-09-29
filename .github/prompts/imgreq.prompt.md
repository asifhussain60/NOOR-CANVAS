---
mode: agent
---

# /imgreq — Image Request & Annotation Interpretation Agent (v3.1.0)

Generates visual artifacts (diagrams, UI mockups, workflows) for `{key}` **and** interprets annotated screenshots to drive UI updates while maintaining code quality.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier – auto‑inferred if not provided
- **notes:** Image request description (artifacts, formats, context).  For annotated screenshots, describe any additional context not obvious from the image.

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/Ref/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/NOOR‑CANVAS_ARCHITECTURE.MD`
- Current implementation status and scope
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files
- Annotated screenshots provided by the user

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

### Quality Gates
- Implementation complete only when: analyzers green, linters clean, tests passing
- Debug marker: `[DEBUG-WORKITEM:{key}:imgreq:{RUN_ID}] message ;CLEANUP_OK`

## Execution Protocol

1. **Requirements Analysis:** Parse context and requirements for `{key}`.
2. **Annotation Interpretation (if an annotated screenshot is supplied):**
   - **Black box with white text and arrow:** Indicates a change request to the element the arrow points at.  Extract the text as the requested change and identify the target element.
   - **Red “X” symbol:** Indicates the element under the X should be **deleted**.
   - **Purple dotted arrow:** Indicates the element should be **moved** to the location pointed at by the arrow.
   - **Purple or red rectangle around a group of elements:** Indicates these elements should be **wrapped** in a beautifully styled `<div>` aligned with the current page theme.
3. **Reflect Back to User:** Summarise the interpreted annotations in plain language.  For each annotation, describe:
   - Which element(s) will be modified, deleted, moved, or wrapped.
   - The nature of the modification based on the annotation colour/shape.
   Ask the user to confirm whether this interpretation is correct before any implementation begins.
4. **Wait for Explicit Approval:** Do not proceed until the user explicitly approves the interpretation.  If the user requests changes to the interpretation, update and re‑summarise.
5. **Work Item Dispatch:** Once approved, call `/workitem` using the same `{key}` and a `notes` value that summarises the approved changes.  This will create or continue a work‑stream to apply the requested UI updates.
6. **Artifact Generation (if requested):** If the `notes` parameter requests diagrams or mockups, generate those artifacts using project standards (Mermaid, PlantUML, PNG/SVG) and save them to `Workspaces/Copilot/artifacts/{key}/images/`.  Link the artifacts in requirements/test files for traceability.
7. **Integration:** Link generated artifacts in requirements or test files as needed.  If code is modified, run analyzer → linter → test cycles to ensure no regressions.
8. **Validation:** Confirm that all quality gates pass (analyzers, linters, tests).  Capture relevant terminal evidence.

## Completion Criteria
- Annotated changes interpreted and confirmed by the user.
- `/workitem` invoked with the same key once approval is granted.
- Visual artifacts generated (if requested) and properly linked.
- Supporting code passes all quality gates.
- Terminal evidence (10–20 lines) captured and included in the summary.
- Clean git status and undo log updated.

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzer/linter/test status.
- Include this evidence in the summary along with artifact references.

## Outputs
Summaries must include:
- Interpreted annotation descriptions and the resulting plan of action.
- Artifact type(s) generated and file path(s).
- Analyzer/linter/test results (if code was touched).
- Terminal evidence tail.

## Approval Workflow
- Do not mark the `/imgreq` task complete until:
  - Annotations have been interpreted and approved by the user.
  - All requested artifacts are generated.
  - Analyzers, linters, and tests are green.
- After confirmation, finalise the `/imgreq` task.  
- **Important:** Implementation changes must occur through `/workitem` after user approval; `/imgreq` itself does not modify code.

## Guardrails
- Do not overwrite unrelated artifacts.
- Keep `{key}`‑scoped images under `Workspaces/Copilot/artifacts/{key}/images/`.
- Do not alter requirements or tests except to link artifacts.
- Do not touch `appsettings.*.json` or secrets.

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

---

_Note: This file depends on the central `Ref/SystemStructureSummary.md`.  If structural changes are made, update that summary._

---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the user**._

---

### Approval Checklist (required before commit)
- [ ] User has reviewed the interpreted annotations and requested artifacts
- [ ] User has explicitly approved the plan and subsequent `/workitem` invocation
- [ ] All instructions in Ref/SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._
