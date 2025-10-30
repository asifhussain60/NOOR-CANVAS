# meta-enhancements.plan.md (v1.0)

## Purpose
Introduce a non-destructive Enhancement Agent and integrate it with the Cohesion Agent via a safe handoff, improving maintainability and consistency of `.github/prompts/` and `.github/instructions/` without altering behavior.

## Scope
- Add `enhance-prompts.prompt.md` as a dedicated enhancement agent (report-only by default).
- Create shared indices for validation and integration references to reduce duplication.
- Update `cohesion.prompt.md` to optionally delegate to the enhancement agent in an approved auto-fix path.
- Enforce archival-not-deletion for any obsolete prompt content.
- Validate links, cross-refs, and rule compliance after changes.

## Assumptions
- Source of truth for agents remains `.github/prompts/` (per SelfAwareness guardrails).
- Agent-generated docs remain under `Workspaces/Copilot/_DOCS/`, while key data streams stay in `.github/key-data-streams/`.
- No runtime behavior or invocation syntax will change; this is clarity and hygiene only.

## Deliverables
- `.github/prompts/enhance-prompts.prompt.md` (from approved spec; report-only default)
- `.github/prompts/shared/validation-engine.md` (index referencing existing validation docs)
- `.github/prompts/shared/integration-protocol.md` (index for handoff/dependency docs)
- Updated `.github/prompts/cohesion.prompt.md` with a documented enhancement handoff seam
- Cohesion and Healthcheck reports confirming integrity post-change

## Phases

### Phase 1: Initialize and Checkpoint
1. Create checkpoint commit: `ckpt(meta-enhancements): pre-enhancement wiring`
2. Create key data stream folder and work-log entry (this file, plus work-log.md)

### Phase 2: Introduce Enhancement Agent (Report-Only by Default)
1. Add `.github/prompts/enhance-prompts.prompt.md` (use current spec in `Workspaces/Copilot/_DOCS/enhance-prompts.prompt.md`)
2. Set defaults: `report-only=true` and `apply-enhancements=false`
3. Record safety guarantees (non-destructive, traceable, reversible)

### Phase 3: Centralize Shared Indices (No duplication)
1. Create `shared/validation-engine.md` as a thin canonical index pointing to:
   - `shared/prompt-test-validation-framework.md`
   - `shared/validation-handoff-protocol.md`
   - `shared/framework-validation-checklists.md`
2. Create `shared/integration-protocol.md` to index:
   - `shared/agent-handoff-protocol.md`
   - `shared/execution-flow.md`
   - `shared/output-style-mandate.md`
3. Ensure all agent references use these indices instead of duplicating content

### Phase 4: Cohesion Integration (Delegated Enhancements)
1. Add an auto-fix option in `cohesion.prompt.md` to “Apply enhancement pack” (requires approval)
2. Default path: run enhancement agent in `report-only` to preview changes
3. Approved path: run enhancement agent with `apply-enhancements=true` (scoped)
4. Document that cohesion remains read-only by default; enhancements are a deliberate handoff

### Phase 5: Archival Policy (No Deletions)
1. For any obsolete intermediate prompt docs, move to `shared/archive/` with a deprecation stub
2. Do not delete; update links accordingly

### Phase 6: Link Audit and Validation
1. Run Cohesion with `scope=prompts` and `validation-level=cross-ref`
2. Run Cohesion with `validation-level=rules` to ensure SelfAwareness compliance
3. Run Healthcheck in prompts mode to verify guardrail consistency

### Phase 7: Finalization
1. Commit: `meta(prompts): enhance cohesion and clarity [sha={short}]`
2. Update key work-log with execution notes and reports
3. Schedule monthly “enhancements” sweep via Cohesion → Enhancement handoff

## Risks & Mitigations
- Risk: Duplicating existing shared validation docs → Mitigation: `validation-engine.md` as index only
- Risk: Overreach (behavior changes) → Mitigation: report-only default; explicit approval gates
- Risk: Broken relative links → Mitigation: mandatory cross-ref validation before and after changes

## Rollback Plan
1. Revert `meta(prompts)` enhancement commit
2. Restore archived files’ original locations if needed
3. Re-run Cohesion (syntax + cross-ref) to confirm stability
