# Phase 3: Consistency Consolidation Plan

**Status**: In Progress  
**Created**: 2025-10-29  
**Target**: Standardize output format, checkpoint protocol, and agent handoff across all 10 root agents

---

## Objectives

1. **Consolidate Output-Style-Mandate**: All 10 agents LOAD MODULE output-style-mandate.md
2. **Unify Checkpoint Protocol**: Remove inline checkpoint logic, LOAD MODULE checkpoint-protocol.md
3. **Standardize Agent Handoff**: Complete agent-handoff-protocol.md with missing patterns

---

## Task A: Consolidate Output-Style-Mandate

### Target Agents (10 root prompts)
1. plan.prompt.md ✅ (already references)
2. task.prompt.md ✅ (already references)
3. todo.prompt.md ✅ (already references)
4. test-generation.prompt.md ✅ (already references)
5. healthcheck.prompt.md ✅ (already references)
6. ask.prompt.md ✅ (already references)
7. cohesion.prompt.md ⚠️ (references but has inline duplicates)
8. drift.prompt.md ❌ (needs LOAD MODULE)
9. route.prompt.md ❌ (needs LOAD MODULE)
10. collapse-keys.prompt.md ❌ (needs LOAD MODULE)

### Actions

**For agents without LOAD MODULE (drift, route, collapse-keys):**
1. Add LOAD MODULE reference at top: "See `.github/prompts/shared/output-style-mandate.md`"
2. Remove any inline output format rules
3. Verify 🧠/📌/📊 structure present
4. Ensure "What would you like to do next?" with letter options (A/B/C/D)

**For cohesion.prompt.md (special case):**
1. Keep LOAD MODULE reference
2. Remove duplicate inline rules (lines mentioning 🧠/📌 format outside LOAD MODULE context)
3. Consolidate to single canonical reference

---

## Task B: Unify Checkpoint Protocol

### Current State Analysis

**Agents with inline checkpoint logic:**
1. task.prompt.md - Has inline PowerShell + LOAD MODULE reference ✅
2. todo.prompt.md - Has inline checkpoint mentions ❌
3. plan.prompt.md - Has checkpoint references ❌
4. test-generation.prompt.md - Has checkpoint logic ❌

**Canonical source:**
- `.github/prompts/shared/task-exec/checkpoint-protocol.md` (complete implementation)

### Actions

**For task.prompt.md:**
- Already has LOAD MODULE at Step 1 ✅
- Keep reference, verify no duplicate inline logic

**For todo.prompt.md:**
1. Replace inline checkpoint logic with LOAD MODULE reference
2. Section: "Step 1: Checkpoint Commit (MANDATORY)"
3. Add: `**LOAD MODULE:** .github/prompts/shared/task-exec/checkpoint-protocol.md`
4. Remove PowerShell snippets (delegate to module)

**For plan.prompt.md:**
1. Find checkpoint mentions (Step 0 likely)
2. Replace with LOAD MODULE reference
3. Remove inline PowerShell if present

**For test-generation.prompt.md:**
1. Replace checkpoint creation logic with LOAD MODULE reference
2. Keep test-specific SHA resolution logic (unique to test-generation)

---

## Task C: Standardize Agent Handoff Format

### Current Coverage (agent-handoff-protocol.md)

**Existing Patterns:**
1. plan → task (complete, well-documented)
2. build → todo (complete, documents `from-build` parameter)

**Missing Patterns:**
1. **task → test-generation** (partially implemented but not documented)
2. **SELF_INVOKE patterns** (agents calling themselves for continuation)
3. **Test context passing** (how test data flows between agents)
4. **route → * handoff** (generic routing patterns)

### Actions

**Add to agent-handoff-protocol.md:**

#### Section: task → test-generation Handoff

**Purpose**: Hand off UI changes to automated test generation  
**When**: After task completes Step 6 (implementation), before Step 7 (validation)  
**Format**:
```
@workspace /test-generation key={key} phase={phase} scope={ui-files-changed} test-type={e2e|unit|integration}
```

**Parameters**:
- `key` - Current work key (inherited from task)
- `phase` - Current phase number (for test organization)
- `scope` - Files modified in this phase (determines test coverage)
- `test-type` - Type of tests to generate (based on layer affected)

**Context Carried**:
- Task execution results from work-log.md
- Modified file list from git diff
- Technology stack from plan.md
- Phase objectives from plan.json

#### Section: SELF_INVOKE Patterns

**Purpose**: Agent calls itself for iterative refinement or continuation  
**When**: Multi-part work requiring same agent repeatedly

**Examples**:
```
# plan.prompt.md refining draft
@workspace /plan key={key} user_request="Refine Phase 3 based on feedback: {feedback}"

# todo.prompt.md continuing work
@workspace /todo key={key} "Next todo item from backlog"

# test-generation.prompt.md adding coverage
@workspace /test-generation key={key} phase={phase} scope={additional-files}
```

**Parameters**: Inherit all original parameters + new request text

#### Section: Test Context Passing

**Purpose**: Pass test execution results and coverage data between agents  
**Format**: Via test-registry.md in key data stream

**Structure**:
```
.github/key-data-streams/{key}/tests/
├── test-registry.md          # Test inventory and status
├── coverage-report.json      # Coverage data
└── run-all-tests.ps1         # Execution script
```

**Consuming Agents**:
- healthcheck.prompt.md - Reads test-registry for validation
- task.prompt.md - Reads for phase validation (auto-chain mode)
- plan.prompt.md - Uses for acceptance criteria definition

#### Section: route → * Handoff

**Purpose**: Generic routing from route.prompt.md to any specialized agent  
**When**: After route.prompt.md classifies request and user approves target

**Format**:
```
@workspace /{target-agent} from-route=true {original-request-parameters}
```

**Parameters**:
- `from-route` - Set to `true` to indicate routing origin
- Original request parameters passed through unchanged

**Target Agents**:
- plan, task, todo, test-generation, healthcheck, cohesion, drift, collapse-keys, ask

**Approval Flow**:
1. route.prompt.md shows classification + target agent
2. User approves with option A
3. route.prompt.md invokes target with `from-route=true`
4. Target agent knows request was pre-classified (can skip redundant analysis)

---

## Validation Checklist

**After completing all three tasks:**

- [ ] All 10 root agents have LOAD MODULE output-style-mandate.md
- [ ] No inline output format rules duplicating output-style-mandate.md
- [ ] All agents with checkpoint logic LOAD MODULE checkpoint-protocol.md
- [ ] No inline checkpoint PowerShell duplicating checkpoint-protocol.md
- [ ] agent-handoff-protocol.md documents all 6 patterns (plan→task, build→todo, task→test-generation, SELF_INVOKE, test context, route→*)
- [ ] No conflicting handoff documentation across prompts
- [ ] Healthcheck.prompt.md updated to validate new structure

---

## Success Metrics

**Before Phase 3:**
- 10 agents with mixed inline/external rules
- Duplicate checkpoint logic in 4 agents
- Incomplete handoff documentation (2 of 6 patterns)

**After Phase 3:**
- 10 agents consistently reference shared modules
- Single canonical checkpoint protocol source
- Complete handoff documentation (6 of 6 patterns)
- Healthcheck validates modular structure

**Reduction Potential:**
- Estimated 200-300 lines of duplicate content eliminated
- Clearer separation of concerns
- Easier to update global patterns (single source of truth)

---

## Execution Order

1. **Task A** (Output-Style-Mandate) - Highest impact, touches all 10 agents
2. **Task B** (Checkpoint Protocol) - Medium impact, 4 agents affected
3. **Task C** (Agent Handoff) - Low impact, 1 file updated
4. **Healthcheck Update** - Validates all changes

**Estimated Time**: 30-45 minutes total

---

## Commit Strategy

**Three separate commits:**

1. `feat(prompts): Consolidate output-style-mandate across all 10 agents (Phase 3A)`
2. `refactor(prompts): Unify checkpoint protocol with LOAD MODULE pattern (Phase 3B)`
3. `docs(prompts): Complete agent-handoff-protocol with missing patterns (Phase 3C)`
4. `feat(healthcheck): Add validation for modular prompt structure (Phase 3 enforcement)`

**Final commit:**
```
feat(prompts): Complete Phase 3 consistency consolidation

- All 10 agents LOAD MODULE output-style-mandate.md
- Checkpoint protocol unified via LOAD MODULE
- Agent handoff documentation complete (6 patterns)
- Healthcheck validates modular structure

Eliminates ~250 lines of duplicate content.
Establishes single source of truth for:
- Output formatting (🧠/📌/📊 pattern)
- Checkpoint commits (rollback-index.md protocol)
- Agent handoffs (6 documented patterns)

Phase 3 of 3-phase prompt system enhancement complete.
```
