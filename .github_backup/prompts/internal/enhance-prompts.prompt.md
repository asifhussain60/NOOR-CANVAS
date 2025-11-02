# enhance-prompts.prompt.md (Copilot Enhancement Agent v1.0 – INTERNAL)

---
mode: agent
purpose: Perform a non-destructive enhancement pass on `.github/prompts` and `.github/instructions`, improving consistency and maintainability without changing behavior; invoked by cohesion in approved auto-fix paths.
inputs: scope (prompts|instructions|all|specific-file), apply-enhancements (true|false), report-only (true|false)
outputs: Enhancement report and (when approved) updated prompt/instruction files with unified metadata and references; updates SYSTEM-REGISTRY.md
lastUpdated: 2025-10-28
acceptsFrom: [cohesion]
calls: [update-registry]
relatedFiles: [.github/prompts/shared/validation-engine.md, .github/prompts/shared/integration-protocol.md, .github/prompts/shared/output-style-mandate.md, .github/instructions/SelfAwareness.instructions.md, .github/SYSTEM-REGISTRY.md]
validationLevel: none
visibility: internal
---

## Purpose
Refactor and optimize prompt/instruction files under `.github/prompts/` and `.github/instructions/` while preserving existing behavior and invocation semantics. Designed to be invoked by `cohesion.prompt.md` in an approved auto-fix path; direct user invocation is discouraged.

## Objectives
1. Preserve all existing functionality and workflows (non-destructive).
2. Unify frontmatter and metadata fields across files.
3. Centralize duplicated validation and integration content via shared indices.
4. Standardize integration handoff metadata (`acceptsFrom`, `calls`, `relatedFiles`).
5. Normalize formatting and heading structure for maintainability.
6. Ensure all links are valid and files end with a newline.
7. Archive obsolete intermediate docs instead of deleting them.
8. **Update SYSTEM-REGISTRY.md** after prompt infrastructure changes.

## Defaults and Safety
- report-only: true (preview changes, do not write)
- apply-enhancements: false (requires explicit approval)
- archival policy: move superseded docs to `shared/archive/` with a deprecation stub
- key logging: record activity under a dedicated meta key (e.g., `meta-enhancements`) in `.github/key-data-streams/`

## Inputs
- scope: prompts | instructions | all | specific-file path
- apply-enhancements: true | false (default false)
- report-only: true | false (default true)

## Enhancement Algorithm (Pseudocode)

```
FUNCTION EnhancePromptSystem(scope, applyEnhancements, reportOnly)
  files = DiscoverFiles(scope)
  FOR EACH file IN files
    ValidateMetadata(file)
    HarmonizeHeadings(file)
    ReplaceDuplicateBlocks(file, sharedReferences)
    InsertIntegrationMetadata(file)
    ApplyFormattingStandards(file)
    IF applyEnhancements AND NOT reportOnly THEN
      RefactorForReadability(file)
      UpdateLastUpdatedDate(file)
    END IF
  END FOR
  GenerateCohesionReport(files)
  IF reportOnly THEN
    OutputSummaryOnly()
  ELSE
    WriteEnhancedFiles()
    InvokeUpdateRegistry(scope=prompts)  // Update system registry after prompt changes
  END IF
END FUNCTION
```

## Shared Indices (Do Not Duplicate Content)
- `.github/prompts/shared/validation-engine.md` – canonical index referencing:
  - `shared/prompt-test-validation-framework.md`
  - `shared/validation-handoff-protocol.md`
  - `shared/framework-validation-checklists.md`
- `.github/prompts/shared/integration-protocol.md` – canonical index referencing:
  - `shared/agent-handoff-protocol.md`
  - `shared/execution-flow.md`
  - `shared/output-style-mandate.md`

## Output Example (Report-Only)

```markdown
📊 Copilot Enhancement Report (Preview)

Enhanced Files (planned): 9
Shared Modules Created (planned): 2 (validation-engine.md, integration-protocol.md)
Removed Duplications (estimated): 30+
Cohesion Score (post-run target): ≥ 95/100
Compliance: CONCISE-MANDATE, output-style-mandate

✅ No logic changes planned
✅ Formatting and metadata standardization only
✅ Centralized references via shared indices
```

## Invocation
- By design, invoked by `cohesion.prompt.md` in an approved auto-fix workflow:
  - Preview: run with `report-only=true` to present a change plan
  - Apply: run with `apply-enhancements=true` after user approval

## Safety & Reversibility
- Create a checkpoint commit before application (e.g., `ckpt(meta-enhancements): pre-enhancement wiring`).
- All changes are reversible by reverting the enhancement commit.
- Archive superseded content; do not delete.

## Notes
- Keep `.github/prompts/` as the source of truth; do not create agent-generated docs there.
- Record enhancement activity under `.github/key-data-streams/{key}/` (e.g., `meta-enhancements`).
- After application, run `cohesion` (rules) and `healthcheck` to validate integrity and guardrail compliance.
