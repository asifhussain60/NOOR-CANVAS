# KDS Overhaul Plan (Key: kds)

## Executive Summary
- **Purpose**: Holistic redesign of the Key Data Stream (KDS) system and `.github` prompt suite to eliminate conflicts, remove duplication, and establish a governed, traceable handoff protocol
- **Scope**: All of `.github/` (prompts, instructions, shared docs), KDS directories, and workflow rules
- **Critical Fix**: MANDATORY.md Rule #1 violations across 100+ locations (code blocks in user-facing output sections)
- **Outcomes**:
  - New kds.prompt.md (governance gatekeeper for KDS/.github changes)
  - Standardized handoff JSON protocol used by all prompts
  - Honest routing (no simulated handoffs) with "Next Command" UX
  - Consolidated rules (no contradictions, no rule-over-rule confusion)
  - Cohesion across prompts with common patterns and loading of handoff context
  - **Holistic file regeneration strategy** (delete and recreate vs partial edits)
  - **Plan conflict detection** (when routing to existing keys)
- **Total Phases**: 9 (added Pre-Flight Audit + Plan Cohesion phases)
- **Estimated Duration**: 4–5 hours of focused work

## Current State Analysis

### Critical Violations Discovered
**MANDATORY.md Rule #1 (Concise Output Format) - 100+ violations across `.github`:**

**Prompts with Code Block Violations (User-Facing Output Sections):**
1. **plan.prompt.md**: 12+ ```markdown blocks in Output Format section, 3+ ```powershell blocks showing examples
2. **route.prompt.md**: 4 ```markdown blocks (FIXED in Session 2), 3 ```bash Quick Start examples, 1 ```powershell state tracking
3. **todo.prompt.md**: 2 ```markdown blocks, 1 FUNCTION pseudocode (lines 234-265), ```bash examples
4. **task.prompt.md**: 6 ```markdown blocks, 4 ```powershell blocks, 2 ```sql blocks, 2 ```bash blocks
5. **test-generation.prompt.md**: 15+ ```markdown blocks, 10+ ```powershell blocks, 3 ```csharp blocks (lines 1789-1823)
6. **healthcheck.prompt.md**: 10+ ```markdown blocks, 12+ ```powershell blocks, 2 ```bash blocks
7. **drift.prompt.md**: 5 ```markdown blocks, 4 ```powershell blocks, 1 ```bash block
8. **cohesion.prompt.md**: 1 ```markdown block, 5 ```bash blocks
9. **collapse-keys.prompt.md**: 2 ```markdown blocks
10. **ask.prompt.md**: 1 ```markdown structure example in output style section

**Instructions with Code Blocks (Reference Documents - ALLOWED):**
- PlaywrightQuickRef.md, PlaywrightTestOrchestration.md, ValidationFramework.md, etc. contain code blocks but these are REFERENCE docs, not user-facing output templates

**Distinction**: 
- ✅ **ALLOWED**: Code blocks in reference docs (HtmlServiceResponsibilities.md, API-Contract-Validation.md, PlaywrightQuickRef.md) - these are technical references
- ❌ **VIOLATION**: Code blocks in prompt "Output Format" sections - these define what Copilot shows to users

**Pseudocode Violations:**
- **todo.prompt.md** lines 234-265: Full FUNCTION pseudocode with IF/END IF blocks
- **plan.prompt.md** lines 289-293, 663-674: IF/FOR EACH/END blocks (≤7 lines - borderline acceptable)

### Architectural Issues

**Honest Handoff Problems:**
- route.prompt.md claims to "EXECUTE AS AGENT" and "TRANSITIONS CONTROL" but cannot (misleading)
- No actual JSON handoff file creation - all prompts simulate handoff via parameters
- No "Next Command" UX - users must manually construct next invocation

**File Mutation Issues (Partial Edits Create Duplication):**
- When updating plan.md/work-log.md, Copilot appends sections → creates duplicate/conflicting entries
- No holistic regeneration strategy → accumulates redundant instructions
- Example: Session 1 + Session 2 work-log entries accumulate rather than consolidate

**Plan Conflict Detection Missing:**
- When routing to existing key (e.g., `@workspace /route plan key=hcp`), no detection of conflicting old vs new instructions
- No architectural coherence validation before updating {key}.plan.md
- Users not prompted to resolve conflicts between existing plan and new request

**No Governance Gatekeeper:**
- MANDATORY.md lacks Rule 4: Manual Prompt Invocation + KDS Governance
- No single owner for .github/KDS modifications
- Changes made ad-hoc without conflict analysis

**No Handoff Context Loading:**
- plan/task/todo/test-generation prompts don't load handoff JSON context
- No reuse of routing analysis from route.prompt.md
- Each prompt re-analyzes from scratch

## Implementation Plan

### Phase 1: Establish KDS Governance + Handoff Protocol
Goal: Define the standard and bootstrap governance artifacts.
Dependencies: None
Estimated Duration: 35–45 minutes

Tasks:
1. Task 1a: Create Passing Test (handoff) – KDS Route→Plan Handoff Pilot
   - Test File: `.github/key-data-streams/kds/tests/phase-1-pilot.spec.md` (analysis-based validation)
   - Coverage: Presence of route-to-plan.json, work-log entry, and "Next Command" output pattern
   - Handoff: `handoffs/phase-1-test.json`
2. Task 1b: Create kds-handoff-protocol.md (shared)
   - Location: `.github/prompts/shared/kds-handoff-protocol.md`
   - Contents: Standard JSON schema, examples, workflow diagrams
   - Handoff: `handoffs/phase-1-todo-1.json`
3. Task 1c: Create kds.prompt.md (governance gatekeeper)
   - Role: All changes to .github and KDS go through this prompt
   - Behavior: Loads context, detects conflicts, enforces non-regression of rules
   - Handoff: `handoffs/phase-1-todo-2.json`
4. Task 1d: Run & Fix Test – Validate pilot artifacts and protocol completeness
5. Task 1e: Checkpoint & Commit – `ckpt(kds): Phase 1 complete`

### Phase 2: Refactor route.prompt.md (Honest Handoff + Fix Code Violations)
Goal: Replace "EXECUTE AS AGENT" claims with handoff preparation + Next Command UX. **FIX MANDATORY.md Rule #1 violations** in Output Format section.
Dependencies: Phase 1 protocol
Estimated Duration: 30–40 minutes

Tasks:
- Task 2a: **Remove Code Block Violations** - Replace all ```markdown output templates with architectural prose descriptions (max 7-10 lines pseudocode IF structural clarity needed, otherwise pure prose)
- Task 2b: Replace "transition control/execute as agent" language with honest handoff behavior
- Task 2c: Implement handoff preparation section + output template with Next Command (architectural description, NO code blocks)
- Task 2d: Create route-to-{target}.json handoff generation spec
- Task 2e: Add work-log entry pattern and halt behavior
- Task 2f: Validate compliance with MANDATORY.md Rule #1 (zero code blocks in Output Format section)

### Phase 3: Upgrade plan.prompt.md (Load Context + Produce Handoffs)
Goal: Load route handoff context and create per-phase handoff JSONs.
Dependencies: Phase 1 protocol
Estimated Duration: 35–45 minutes

Tasks:
- Add Step 0.1: Load handoff context from `route-to-plan.json`
- Generate `handoffs/phase-{N}-test.json` and `phase-{N}-todo-{M}.json`
- Add Next Command section (start Phase 1 test)
- Maintain file finalization verification (Step 5.5)

### Phase 4: Upgrade task/todo/test-generation (Load Handoff + Next Command)
Goal: All execution prompts load handoff JSON; provide Next Command.
Dependencies: Phase 3 handoff
Estimated Duration: 35–45 minutes

Tasks:
- Add Step 0: Load handoff context if `#file:` provided
- Standardize output with Next Command
- Preserve document-first and checkpoint patterns

### Phase 5: Update Governance Docs (MANDATORY.md + SelfAwareness)
Goal: Codify manual invocation rule and KDS governance gatekeeper.
Dependencies: Phase 1–4
Estimated Duration: 25–30 minutes

Tasks:
- Add Rule 4: Manual Prompt Invocation + Handoff Protocol reference
- Reference kds.prompt.md as the ONLY gate for .github/KDS modifications
- Cross-link in SelfAwareness and SystemIndex

### Phase 6: Cohesion + Duplication Cleanup
Goal: Remove conflicts, consolidate rules, re-home analysis docs.
Dependencies: Phase 5
Estimated Duration: 35–45 minutes

Tasks:
- Remove contradictory sections across prompts
- Ensure a single canonical source per rule (no duplicates)
- Move ad-hoc analysis to `prompts/shared/analysis/`

### Phase 7: Prompt Coordination Tests
Goal: Validate the handoff chain and file finalization behaviors.
Dependencies: Phase 6
Estimated Duration: 25–40 minutes

Tasks:
- Create analysis-based test specs for route→plan→test→todo chain
- Add a validator for existence and structure of handoff JSONs
- Document run instructions in tests’ README

### Phase 8: Rollout + Lockdown
Goal: Finish, document, and enforce governance.
Dependencies: Phase 7
Estimated Duration: 15–20 minutes

Tasks:
- Update indexes, READMEs, and finalize docs
- Mark plan complete; note any deferrals
- kds.prompt.md becomes mandatory path for .github/KDS changes

## Test Strategy
- Nature: Analysis-based verifications (not runtime), checking for required files and sections
- Handoffs: Each phase specifies the first Next Command handoff JSON
- File Finalization: Verify plan.md/plan.json/work-log.md exist before user output
- **Code Violation Check**: Scan all .github/prompts/*.prompt.md for ```markdown, ```csharp, ```javascript, ```sql, ```html blocks in user-facing output sections; flag violations

## Rollback Plan
- Checkpoint after each phase: `ckpt(kds): Phase {N} complete`
- Rollback via git reset to specific checkpoint if needed
