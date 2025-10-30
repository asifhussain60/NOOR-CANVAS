# Enhancement Pack Report (Report-Only)

Date: 2025-10-27
Scope: all (prompts + instructions + shared)
Mode: preview (no file modifications)
Key: meta-enhancements

---

## Executive Summary
- Objective: Standardize metadata, centralize shared references, and harmonize formatting across `.github/prompts` and `.github/instructions` without altering agent behavior.
- Result: No critical conflicts detected. Multiple low-risk standardization opportunities identified.
- Apply Policy: Preview-first. Any application requires checkpoint commit and archival-not-deletion for superseded docs.

## Discovery Overview
- Prompts scanned: plan.prompt.md, task.prompt.md, todo.prompt.md, test-generation.prompt.md, cohesion.prompt.md, drift.prompt.md, healthcheck.prompt.md, ask.prompt.md, internal/*
- Shared scanned: 30+ guidance files (validation, output, handoff, execution, etc.)
- Instructions scanned: SelfAwareness.instructions.md and selected index/links docs

## Proposed Enhancements (Non-Destructive)

1) Frontmatter normalization (all prompts/instructions)
- Ensure presence of: mode, purpose, inputs, outputs, lastUpdated
- Add optional: acceptsFrom, calls, relatedFiles, version, validationLevel
- Preserve existing fields; do not change invocation semantics

2) Shared indices adoption
- Replace inline repeated validation/integration text with links to:
  - shared/validation-engine.md (index)
  - shared/integration-protocol.md (index)

3) Output/link hygiene
- Confirm all prompt files end with newline
- Validate intra-repo links resolve; fix only if broken
- Maintain alphabetical ordering in shared reference lists

4) Deprecation/archival protocol
- If obsolete docs found, move to shared/archive/ with stub; do not delete
- Confirm `handoff.prompt.md` remains archived with deprecation notes

5) Handoff metadata coherence
- Add acceptsFrom/calls to execution agents to clarify orchestration
- Ensure planning/test/healthcheck agents cross-reference shared indices

## File-Level Suggestions (Representative)

- ask.prompt.md
  - Add frontmatter fields: purpose, inputs, outputs, lastUpdated; acceptsFrom:[build], calls:[plan]
  - Reference validation-engine.md, integration-protocol.md in See Also (if present)

- plan.prompt.md
  - Verify calls:[task, test-generation]; acceptsFrom:[build, ask, drift]
  - Ensure See Also references include validation-engine.md and integration-protocol.md

- task.prompt.md
  - Ensure references to commit-checkpoint-protocol.md and execution-flow.md; add calls:[test-generation] where applicable

- test-generation.prompt.md
  - Confirm references to playwright-test-generation.md and test-orchestration-patterns.md; add acceptsFrom:[task, plan]

- cohesion.prompt.md (already updated)
  - No changes required in this pass; uses enhancement handoff (preview-first) and new shared indices

- drift.prompt.md / healthcheck.prompt.md
  - Verify shared indices linked; normalize frontmatter metadata

- instructions/SelfAwareness.instructions.md
  - No structural changes; ensure See Also references remain accurate

## Safety & Process
- Checkpoint commit before any apply run: `ckpt(meta-enhancements): pre-enhancement apply`
- Archive deprecated docs under shared/archive/ with deprecation stub
- Apply minimal diffs; avoid reformatting unrelated sections
- Re-run:
  - Cohesion (validation-level=rules)
  - Healthcheck (prompt scope) after apply

## Estimated Impact
- Behavior: unchanged
- Review overhead: low
- Risk: low (link hygiene and metadata-only changes)

## Next Steps (Choose One)
- A. Approve apply-preview: generate per-file diffs (no write) for your review
- B. Approve targeted apply for prompts only
- C. Approve targeted apply for instructions only
- D. Defer; keep the report on file
