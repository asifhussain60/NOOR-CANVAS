# KDS Overhaul Plan

**Key: `kds`** | **Status**: Ready for Execution | **Version**: 3.0.0

## Executive Summary
- **Key**: `kds` (KDS system enhancement and `.github` prompt governance)
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
- **Total Phases**: 10 (added Pre-Flight Audit + Plan Cohesion + Code Violation Fix phases)
- **Estimated Duration**: 5–6 hours of focused work

## Current State Analysis

### Critical Violations Discovered
**MANDATORY.md Rule #1 (Concise Output Format) - 100+ violations across `.github`:**

**Prompts with Code Block Violations (User-Facing Output Sections):**
1. **plan.prompt.md**: 12+ ```markdown blocks in Output Format section, 3+ ```powershell blocks showing examples
2. **route.prompt.md**: 3 ```bash Quick Start examples, 1 ```powershell state tracking (4 ```markdown blocks FIXED in Session 2)
3. **todo.prompt.md**: 2 ```markdown blocks, 1 FUNCTION pseudocode (lines 234-265), 2 ```bash examples
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

## Agentic Execution Rules (MANDATORY)

**Key: `kds`** | **Applies to**: All prompts in `.github/prompts/`

**ALL prompts must enforce these rules:**

### 1) Document First, Respond Later
**Enforcement:**
- plan.prompt.md Step 5.5 blocks output unless {key}.plan.md, {key}.plan.json, work-log.md, and all handoffs for Phase 1 exist
- task/todo/test-generation append to work-log.md BEFORE output
- **Verification**: File finalization verifier scans for required artifacts before allowing user-facing response

### 2) Per-Task Handoffs (One Handoff per Task)
**Files**: handoffs/phase-{N}-todo-{M}.json (M = 1..N tasks in phase)
**Fields**: key, phase, task, description, files, acceptanceCriteria, autoChain=true, nextTask, testFile
**Purpose**: Eliminate manual parameter construction; enable traceable handoff chain

### 3) TDD on Every Todo (Prefer Headless)
**Files**: handoffs/phase-{N}-test.json with acceptanceCriteria + assertCriteria=true
**Mode**: headless unless UI; headed only when UI/visual required
**Workflow**: Test → Implement → Validate (red-green-refactor)

### 4) Auto-Chain Defaults and Options
**Tasks**: autoChain=true; todos chain via nextTask until validate step
**Phases**: default manual; plan output offers:
  - **A.** Execute Phase by Phase (recommended - stop after each phase for review)
  - **B.** Execute All Phases E2E (auto-continue through all phases)
**Implementation**: todo JSON includes "autoChain": true and "nextTask" pointer

### 5) Central Playwright Test Index (Global Reuse)
**Path**: `.github/tests/playwright-index.json`
**Policy**: reuseStrategy=prefer-index; update index on new/changed tests
**Purpose**: Prevent duplicate tests; enforce test reuse across keys

### 6) Holistic File Regeneration (No Partial Edits)
**Problem**: Partial edits create duplicate/conflicting sections in plan.md, work-log.md
**Solution**: 
  - **Strategy A (plan.md)**: Delete and recreate entire file when significant changes occur
  - **Strategy B (work-log.md)**: Use structured merge with dedup (preserves session history)
**Implementation**: 
  - plan.prompt.md Step 4 regenerates complete plan.md from scratch
  - work-log uses append-with-dedup pattern (detect duplicate session entries, consolidate)
**Benefits**: Eliminates redundancy, maintains architectural coherence

### 7) Plan Conflict Detection (Routing to Existing Keys)
**Trigger**: When route.prompt.md detects existing plan file (`.github/key-data-streams/{key}/{key}.plan.md`)
**Process**:
  1. Load existing plan.md (phases, tasks, architecture)
  2. Analyze new user request for conflicts with existing plan
  3. If conflicts detected → HALT and present resolution options:
     - **A.** Merge new request into existing plan (extend - use todo)
     - **B.** Replace existing plan (regenerate - use plan with override)
     - **C.** Create new key (separate work - generate new key)
     - **D.** Review existing plan first (cancel - show plan to user)
**Output**: Architectural coherence report showing conflicts
**Purpose**: Preserve plan integrity; prevent contradictory instructions
**Location**: route.prompt.md Step 0.5 (after key consultation, before handoff)

### 8) KDS Governance (All .github/KDS Changes via kds.prompt.md)
**Rule**: No direct modifications to .github or KDS files without governance review
**Gatekeeper**: kds.prompt.md analyzes all requests for conflicts, regressions, rule violations
**Load Order**: MANDATORY.md → kds-handoff-protocol.md → SelfAwareness.instructions.md → active key context
**Enforcement**: Rejects changes that violate or nullify previous rules; requires compatibility reasoning
**Invocation**: `@workspace /kds action=<analyze|update|validate> target=<file-path> request="<change-description>"`

### 9) Key Display in User Output (Visibility Protocol)
**Rule**: All user-facing output must display the active key for traceability
**Implementation**:
  - **Section Headers**: Include key in format `**Key: \`{key}\`**` (subtle, right-aligned or piped)
  - **Phase/Task Output**: Show `Phase N (Key: {key})` in execution summaries
  - **Next Command**: Include key in handoff commands
  - **Work-Log Entries**: Always prefix with key
**Example**: `## 🧠 Analysis | Key: \`kds\``
**Purpose**: Users never lose context of which work stream they're in; prevents key confusion during multi-key work

## Implementation Plan

**Key: `kds`** | **Total Phases**: 10 | **Estimated Duration**: 5–6 hours

### Phase 0: Pre-Flight Audit (Code Violation Scan)
**Key: `kds`** | **Phase**: 0/10

**Goal**: Catalog ALL MANDATORY.md Rule #1 violations across `.github` before fixes
**Dependencies**: None
**Estimated Duration**: 20–25 minutes

**Tasks**:
1. **Task 0a** (Key: `kds`): Scan All Prompts for Code Blocks
   - Tool: grep_search with pattern for code blocks in .github/prompts/*.prompt.md
   - Scope: Output Format sections only (user-facing templates)
   - Output: Violation catalog with line numbers
   
2. **Task 0b** (Key: `kds`): Scan for Pseudocode (FUNCTION/IF/FOR)
   - Pattern: FUNCTION|PROCEDURE|IF.*THEN|FOR EACH|WHILE|END IF|END FOR
   - Focus: User-facing output sections (not algorithm references)
   
3. **Task 0c** (Key: `kds`): Generate Compliance Report
   - File: `.github/key-data-streams/kds/compliance-report.md`
   - Content: Prompt-by-prompt violations, severity, fix recommendations
   
4. **Task 0d** (Key: `kds`): Checkpoint
   - Commit: `doc(kds): Pre-flight audit complete`

**Acceptance Criteria**:
- Compliance report generated with 100+ violations cataloged
- Each violation tagged with: file, line, type (code block vs pseudocode), severity
- Fix recommendations provided (prose vs 7-10 line pseudocode exception)

---

### Phase 1: Establish KDS Governance + Handoff Protocol
**Key: `kds`** | **Phase**: 1/10

**Goal**: Define the standard and bootstrap governance artifacts
**Dependencies**: Phase 0
**Estimated Duration**: 35–45 minutes

**Tasks**:
1. **Task 1a** (Key: `kds`): Create Passing Test – KDS Route→Plan Handoff Pilot
   - Test File: `.github/key-data-streams/kds/tests/phase-1-pilot.spec.md`
   - Coverage: route-to-plan.json presence, work-log entry, Next Command pattern
   - Handoff: `handoffs/phase-1-test.json`
   
2. **Task 1b** (Key: `kds`): Create kds-handoff-protocol.md
   - Location: `.github/prompts/shared/kds-handoff-protocol.md`
   - Contents: JSON schemas, examples, workflow diagrams
   
3. **Task 1c** (Key: `kds`): Create kds.prompt.md (governance gatekeeper)
   - Role: Gate all .github and KDS modifications
   - Behavior: Conflict detection, non-regression enforcement
   
4. **Task 1d** (Key: `kds`): Seed Playwright Test Index
   - File: `.github/tests/playwright-index.json`
   - Initial entries: Existing test catalog with reuse metadata
   
5. **Task 1e** (Key: `kds`): Run & Fix Test
   - Validate pilot artifacts and protocol completeness
   
6. **Task 1f** (Key: `kds`): Checkpoint
   - Commit: `feat(kds/protocol): Add handoff protocol + governance gatekeeper`

**Acceptance Criteria**:
- kds-handoff-protocol.md created with JSON schemas for route-to-*, phase-{N}-test.json, phase-{N}-todo-{M}.json
- kds.prompt.md created with load order: MANDATORY.md → kds-handoff-protocol.md → SelfAwareness → active key
- Governance prompt rejects conflicting changes (non-regression), requires compatibility reasoning
- Playwright test index seeded with initial entries
- Phase 1 pilot test passes

---

### Phase 2: Fix All Code Violations (Compliance Sweep)
**Key: `kds`** | **Phase**: 2/10

**Goal**: Fix ALL 100+ MANDATORY.md Rule #1 violations cataloged in Phase 0
**Dependencies**: Phase 0 (compliance report), Phase 1 (protocol)
**Estimated Duration**: 60–75 minutes

**Tasks**:
1. **Task 2a** (Key: `kds`): Fix plan.prompt.md (12+ violations)
   - Replace code blocks in Output Format with architectural prose
   - Pseudocode: Keep IF/FOR blocks ≤7 lines if essential
   
2. **Task 2b** (Key: `kds`): Fix route.prompt.md (remaining violations)
   - Replace Quick Start code blocks with invocation descriptions
   
3. **Task 2c** (Key: `kds`): Fix todo.prompt.md (FUNCTION pseudocode)
   - Remove lines 234-265 FUNCTION block
   - Replace with algorithm reference
   
4. **Task 2d** (Key: `kds`): Fix task.prompt.md (14+ violations)
   - Replace all code blocks in Output Format sections
   
5. **Task 2e** (Key: `kds`): Fix test-generation.prompt.md (28+ violations)
   - Move C# examples to reference docs
   
6. **Task 2f** (Key: `kds`): Fix healthcheck.prompt.md (24+ violations)
   - Replace code blocks with prose descriptions
   
7. **Task 2g** (Key: `kds`): Fix drift/cohesion/collapse-keys/ask
   - Minor violations (1-5 each)
   
8. **Task 2h** (Key: `kds`): Validate Compliance
   - Re-run grep scan, verify ZERO violations
   
9. **Task 2i** (Key: `kds`): Checkpoint
   - Commit: `fix(kds/compliance): Remove all code blocks from prompt output sections`

**Acceptance Criteria**:
- ZERO code blocks in any prompt Output Format section
- Pseudocode limited to ≤10 lines where structural clarity essential
- All prompts reference shared algorithm docs instead of inline pseudocode
- Compliance scan passes with no violations

---

### Phase 3: Refactor route.prompt.md (Honest Handoff)
**Key: `kds`** | **Phase**: 3/10

**Goal**: Replace "EXECUTE AS AGENT" claims with handoff preparation + Next Command UX
**Dependencies**: Phase 1 (protocol), Phase 2 (compliance)
**Estimated Duration**: 30–40 minutes

**Tasks**:
1. **Task 3a** (Key: `kds`): Remove Misleading Language
   - Delete "EXECUTE AS AGENT", "TRANSITIONS CONTROL" claims
   - Replace with honest handoff behavior
   
2. **Task 3b** (Key: `kds`): Implement Handoff Preparation
   - Create route-to-{target}.json with parameters
   - Save to `.github/key-data-streams/{key}/handoffs/`
   
3. **Task 3c** (Key: `kds`): Add Next Command Section
   - Template: "Next Command: @workspace /{target} #file:handoffs/route-to-{target}.json"
   
4. **Task 3d** (Key: `kds`): Add Plan Conflict Detection (Agentic Rule #7)
   - Load existing plan.md if present
   - Analyze conflicts, HALT with resolution options
   
5. **Task 3e** (Key: `kds`): Work-Log Entry Pattern
   - Append to work-log.md BEFORE output
   
6. **Task 3f** (Key: `kds`): Checkpoint
   - Commit: `feat(kds/route): Honest handoff + plan conflict detection`

**Acceptance Criteria**:
- route.prompt.md creates route-to-{target}.json and HALTS
- Next Command shown in output (single line, copy-paste ready)
- Plan conflict detection active (loads existing plan, detects conflicts)
- Work-log append before output (document-first)
- No misleading "execute as agent" language

---

### Phase 4: Upgrade plan.prompt.md (Load Context + Produce Handoffs + Holistic Regeneration)
**Key: `kds`** | **Phase**: 4/10

**Goal**: Load route handoff context, create per-phase handoff JSONs, implement holistic file regeneration
**Dependencies**: Phase 3 (route handoff)
**Estimated Duration**: 40–50 minutes

**Tasks**:
1. **Task 4a** (Key: `kds`): Load Route Handoff Context
   - Check for handoff JSON, use routing analysis if present
   
2. **Task 4b** (Key: `kds`): Implement Holistic Plan Regeneration (Agentic Rule #6)
   - Delete existing {key}.plan.md, regenerate from scratch
   - Prevents duplication and conflicting sections
   
3. **Task 4c** (Key: `kds`): Generate Per-Phase Handoff JSONs
   - Create phase-{N}-test.json and phase-{N}-todo-{M}.json per phase
   - Fields: key, phase, task, acceptanceCriteria, autoChain, nextTask
   
4. **Task 4d** (Key: `kds`): Add Acceptance Criteria to Each Phase
   - 3–7 criteria per phase, test handoff asserts them
   
5. **Task 4e** (Key: `kds`): Add Next Command Section + Key Display (Agentic Rule #9)
   - Output includes key reference in section headers
   - Next Command shows: "@workspace /test-generation #file:handoffs/phase-1-test.json"
   
6. **Task 4f** (Key: `kds`): Maintain Step 5.5 File Finalization
   - Block output until all artifacts exist
   
7. **Task 4g** (Key: `kds`): Checkpoint
   - Commit: `feat(kds/plan): Load route context + holistic regeneration + handoffs`

**Acceptance Criteria**:
- plan.prompt.md loads route-to-plan.json if present
- plan.md regenerated from scratch (delete and recreate, no partial edits)
- Per-phase handoffs generated (test + todos with autoChain=true)
- Acceptance criteria added to each phase (3–7 per phase)
- Next Command shown in output
- Step 5.5 blocks output if artifacts missing

---

### Phase 5: Upgrade task/todo/test-generation (Load Handoff + Next Command + Work-Log Dedup)
**Key: `kds`** | **Phase**: 5/10

**Goal**: All execution prompts load handoff JSON, provide Next Command, implement work-log dedup
**Dependencies**: Phase 4 (plan handoffs)
**Estimated Duration**: 40–50 minutes

**Tasks**:
1. **Task 5a** (Key: `kds`): Add Handoff Context Loading (All Prompts)
   - Load handoff JSON if provided, skip re-analysis
   
2. **Task 5b** (Key: `kds`): Standardize Next Command Output + Key Display (Agentic Rule #9)
   - All prompts show Next Command with key reference
   - Format: "Next Command (Key: kds): @workspace /{next-prompt} #file:..."
   
3. **Task 5c** (Key: `kds`): Implement Work-Log Dedup (Agentic Rule #6 Strategy B)
   - Detect duplicate session entries, consolidate intelligently
   
4. **Task 5d** (Key: `kds`): Add Auto-Chain Support (todo.prompt.md)
   - Read autoChain and nextTask from handoff JSON
   - Continue until validate step
   
5. **Task 5e** (Key: `kds`): Add Test Index Integration (test-generation.prompt.md)
   - Consult Playwright index, prefer reuse
   
6. **Task 5f** (Key: `kds`): Checkpoint
   - Commit: `feat(kds/execution): Load handoffs + auto-chain + test index`

**Acceptance Criteria**:
- All execution prompts (task, todo, test-generation) load handoff JSON if provided
- Next Command shown in all outputs
- Work-log dedup active (consolidate duplicate session entries)
- todo auto-chains via nextTask (continues until validate step)
- test-generation consults/updates Playwright test index

---

### Phase 6: Update Governance Docs (MANDATORY.md + SelfAwareness)
**Key: `kds`** | **Phase**: 6/10

**Goal**: Codify manual invocation rule and KDS governance gatekeeper
**Dependencies**: Phase 1–5
**Estimated Duration**: 25–30 minutes

**Tasks**:
1. **Task 6a** (Key: `kds`): Add Rule 4 to MANDATORY.md
   - Title: "Manual Prompt Invocation + Honest JSON Handoff Protocol"
   - Reference: kds-handoff-protocol.md, kds.prompt.md
   
2. **Task 6b** (Key: `kds`): Update SelfAwareness.instructions.md
   - Add KDS governance flow, reference kds.prompt.md as gate
   
3. **Task 6c** (Key: `kds`): Update SystemIndex.md
   - Add kds.prompt.md and kds-handoff-protocol.md entries
   
4. **Task 6d** (Key: `kds`): Checkpoint
   - Commit: `docs(kds): Add Rule 4 + governance references`

**Acceptance Criteria**:
- MANDATORY.md Rule 4 added (Manual Prompt Invocation + Handoff Protocol)
- Prompts reference canonical docs (no duplicated rules)
- SelfAwareness updated to reflect KDS governance flow
- SystemIndex cross-links governance and KDS docs

---

### Phase 7: Cohesion + Duplication Cleanup
**Key: `kds`** | **Phase**: 7/10

**Goal**: Remove conflicts, consolidate rules, re-home analysis docs
**Dependencies**: Phase 6
**Estimated Duration**: 35–45 minutes

**Tasks**:
1. **Task 7a** (Key: `kds`): Scan for Duplicate Rules
   - Identify canonical source for each rule
   
2. **Task 7b** (Key: `kds`): Remove Duplicates
   - Replace with reference links (e.g., "See MANDATORY.md Rule #1")
   
3. **Task 7c** (Key: `kds`): Consolidate Algorithm References
   - Move pseudocode to `.github/prompts/shared/analysis/`
   
4. **Task 7d** (Key: `kds`): Resolve Conflicting Instructions
   - Identify contradictions, update canonical source
   
5. **Task 7e** (Key: `kds`): Update Prompts to Reference Canonical Sources
   - Replace inline algorithms with shared references
   
6. **Task 7f** (Key: `kds`): Checkpoint
   - Commit: `refactor(kds/cohesion): Remove duplicates + consolidate rules`

**Acceptance Criteria**:
- Conflicts removed (single canonical source per rule)
- Duplicate rule text replaced with reference links
- Analysis pseudocode re-homed to prompts/shared/analysis/
- All prompt examples match JSON handoff + Next Command UX

---

### Phase 8: Prompt Coordination Tests
**Key: `kds`** | **Phase**: 8/10

**Goal**: Validate the handoff chain and file finalization behaviors
**Dependencies**: Phase 7
**Estimated Duration**: 30–40 minutes

**Tasks**:
1. **Task 8a** (Key: `kds`): Create Route→Plan Handoff Test
   - Validate route creates JSON, shows Next Command, HALTS
   
2. **Task 8b** (Key: `kds`): Create Plan→Test Handoff Test
   - Validate plan creates phase-1-test.json with acceptanceCriteria
   
3. **Task 8c** (Key: `kds`): Create Test→Todo Auto-Chain Test
   - Validate todos chain via nextTask, work-log dedup active
   
4. **Task 8d** (Key: `kds`): Create File Finalization Test
   - Validate Step 5.5 blocks output if artifacts missing
   
5. **Task 8e** (Key: `kds`): Create Plan Conflict Detection Test
   - Validate route detects conflicts, shows resolution options
   
6. **Task 8f** (Key: `kds`): Document Test Run Instructions
   - File: `.github/key-data-streams/kds/tests/README.md`
   
7. **Task 8g** (Key: `kds`): Checkpoint
   - Commit: `test(kds): Add coordination tests + file finalization`

**Acceptance Criteria**:
- Analysis-based checks verify: per-task handoffs, nextTask chaining, assertCriteria in test handoffs, index reuse
- Route → Plan → Test → Todo chain validated
- File finalization verified (plan Step 5.5 blocks output)
- Plan conflict detection verified (loads existing, detects conflicts, HALTS)
- Test run instructions documented

---

### Phase 9: Rollout + Lockdown (Cherry-Pick Friendly)
**Key: `kds`** | **Phase**: 9/10

**Goal**: Finish, document, and enforce governance
**Dependencies**: Phase 8
**Estimated Duration**: 20–25 minutes

**Tasks**:
1. **Task 9a** (Key: `kds`): Update All READMEs
   - Add kds.prompt.md, KDS governance, handoff protocol references
   
2. **Task 9b** (Key: `kds`): Update SystemIndex.md
   - Add complete KDS overhaul summary with artifact links
   
3. **Task 9c** (Key: `kds`): Create Migration Guide
   - File: `.github/key-data-streams/kds/MIGRATION.md`
   - Content: Migrate existing keys to new handoff protocol
   
4. **Task 9d** (Key: `kds`): Mark Plan Complete
   - Update kds.plan.md status, note deferrals
   
5. **Task 9e** (Key: `kds`): Final Checkpoint
   - Commit: `docs(kds): Rollout complete + enforcement active`

**Acceptance Criteria**:
- Commits scoped and ordered for cherry-pick:
  - `doc(kds): Pre-flight audit complete` (Phase 0)
  - `feat(kds/protocol): Add handoff protocol + governance gatekeeper` (Phase 1)
  - `fix(kds/compliance): Remove all code blocks from prompt output sections` (Phase 2)
  - `feat(kds/route): Honest handoff + plan conflict detection` (Phase 3)
  - `feat(kds/plan): Load route context + holistic regeneration + handoffs` (Phase 4)
  - `feat(kds/execution): Load handoffs + auto-chain + test index` (Phase 5)
  - `docs(kds): Add Rule 4 + governance references` (Phase 6)
  - `refactor(kds/cohesion): Remove duplicates + consolidate rules` (Phase 7)
  - `test(kds): Add coordination tests + file finalization` (Phase 8)
  - `docs(kds): Rollout complete + enforcement active` (Phase 9)
- Indexes/READMEs updated
- Migration guide created
- Plan marked complete
- Enforcement: All .github/KDS changes must go through kds.prompt.md

---

## Test Strategy

**Key: `kds`** | **Test Approach**: Analysis-based verifications

- **Nature**: Analysis-based verifications (not runtime), checking for required files and sections
- **Handoffs**: Each phase specifies the first Next Command handoff JSON
- **File Finalization**: Verify plan.md/plan.json/work-log.md exist before user output
- **Code Violation Check**: Scan all .github/prompts/*.prompt.md for code blocks in user-facing output sections
- **Compliance Validation**: Re-run grep scan after Phase 2, verify ZERO violations
- **Handoff Chain**: Route → Plan → Test → Todo validated in Phase 8
- **Plan Conflict**: Existing plan detection + conflict analysis validated in Phase 8
- **Key Display**: Verify all output sections include key reference per Agentic Rule #9

---

## Rollback Plan

**Key: `kds`** | **Safety Strategy**: Per-phase checkpoints

- **Per-Phase Checkpoints**: Specific commit messages listed in each phase
- **Rollback Method**: `git reset --hard <commit-hash>` to specific checkpoint
- **Safe Points**: End of each phase (after checkpoint commit)
- **Critical Phases**: Phase 2 (code violations) and Phase 4 (holistic regeneration) are high-impact; extra caution recommended

---

## Deferred/Future Work

**Key: `kds`** | **Post-Implementation Enhancements**

**Explicitly EXCLUDED from current KDS plan** (out of scope):
- Percy Integration: Visual regression baseline creation for UI components
- Advanced Auto-Chain: Conditional branching based on test results
- KDS Analytics: Metrics dashboard for handoff success rates
- Prompt Version Control: Time-travel rollback for prompt changes

**Reason for Deferral**: Focus on core KDS governance and handoff protocol; advanced features can be separate keys after KDS stabilization

---

## Success Metrics

**Key: `kds`** | **Measurable Outcomes**

1. **Code Violations**: 100+ violations → 0 violations (100% MANDATORY.md Rule #1 compliance)
2. **Handoff Adoption**: All new keys use JSON handoff protocol (track in work-logs)
3. **Plan Coherence**: Zero conflicting plan updates (conflict detection prevents)
4. **File Duplication**: Zero duplicate sections in plan.md/work-log.md (holistic regeneration)
5. **Test Reuse**: Playwright test index consulted in 100% of test-generation invocations
6. **Key Visibility**: 100% of user-facing outputs display active key per Agentic Rule #9

---

**Key: `kds`** | **Version**: 3.1.0 | **Status**: Ready for Execution  
**Created**: 2025-10-31 | **Last Updated**: 2025-10-31  
**Scope**: KDS system enhancement and `.github` prompt governance ONLY
