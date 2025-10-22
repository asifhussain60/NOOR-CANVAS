# Plan Integration Protocol - Implementation Summary

**Date**: 2025-10-20  
**Status**: ✅ Complete  
**Files Updated**: `task.prompt.md`, `test-generation.prompt.md`

---

## Overview

Successfully implemented a cohesive three-agent system where:
- **create-plan.prompt.md** orchestrates (analyzes, recommends, prepares handoff)
- **task.prompt.md** executes (implements phases, updates tracking)
- **test-generation.prompt.md** verifies (generates tests from specifications)

All agents now work from shared, synchronized artifacts with bidirectional references.

---

## Changes to `task.prompt.md`

### 1. Plan Integration Protocol (NEW - Top of Document)

**Location**: After "Workflow Requirements", before "Execution Steps"

**Added**:
- Mandatory check for `.github/prompts.keys/{key}/{key}.plan.md`
- Load comprehensive plan when exists
- Load JSON tracking from `{key}.plan.json`
- Use plan's pre-gathered context (technology stack, architecture, System Context Pack)
- Fallback to lightweight planning when no plan exists
- Clear user warning when plan missing for complex work

**Benefits**:
- Zero redundant analysis
- Consistent execution across phases
- Technology-aware implementation

---

### 2. Step 2.12: Load System Context Pack (NEW)

**Location**: Step 2 (Context Gathering) - new conditional sub-phase

**Added**:
- Load "System Context Pack" section from plan
- Cache APIs, database schemas, SignalR hubs, test data
- Skip redundant exploration (context already gathered by feature planning agent)
- Output summary of loaded context

**Benefits**:
- Faster execution (no re-discovery)
- Pre-validated test data consistency
- Framework/version compatibility guaranteed

---

### 3. Step 3: Plan - Phase-Driven vs Lightweight (ENHANCED)

**Location**: Step 3 (Plan)

**Changed**:
- Split into **A. Phase-Driven Planning** and **B. Lightweight Planning**
- Phase-driven mode: Load phase details from plan document
- Parse `tasks` parameter for phase identifiers (`Phase 1:\n---\nPhase 2:`)
- Extract objectives, TODO items, validation checklists, test specs from plan
- Skip lightweight planning when plan exists

**Benefits**:
- Unified execution model (plan-driven or standalone)
- Clear phase orchestration
- Reduced planning overhead

---

### 4. Step 5: Execute - Phase Orchestration (ENHANCED)

**Location**: Step 5 (Execute)

**Changed**:
- Split into **5a. Documentation Mode**, **5b. Phase-Driven Execution**, **5c. Lightweight Execution**
- Phase-driven mode: Execute TODO items from plan's "Implementation Tasks"
- Follow validation checklist from plan
- Apply commit format template from plan
- Update JSON tracking after each phase
- Wait for user approval between phases (per plan's "Approval Gate")

**Benefits**:
- Explicit phase-by-phase execution
- Plan compliance guaranteed
- JSON tracking synchronized with work

---

### 5. Step 8.1: Update JSON Tracking (NEW)

**Location**: Step 8 (Update Key Data Stream) - new first sub-step

**Added**:
- Check for `.github/prompts.keys/{key}/{key}.plan.json`
- Update phase status (`in-progress` → `complete`)
- Record validation results (build, lint, tests)
- Record commit info (SHA, message, timestamp)
- Record checkpoint tag
- Update metrics (completed phases, passing tests, LOC changes)
- Synchronization rule: Both markdown AND JSON updated in same commit

**Benefits**:
- Machine-readable progress tracking
- Programmatic progress queries
- CI/CD integration ready
- Historical metrics aggregation

---

### 6. Renumbered Sections

**Changed**:
- `8.1` (was "Key Data Stream Bloat Detection") → `8.2`
- `8.2` (was "Key Data Stream Update Requirements") → `8.3`
- `8.3` (was "Functionality Registry Validation") → `8.4`
- `8.4` (was "Checkpoint Commit & Tag") → `8.5`

---

### 7. Guardrails (ENHANCED)

**Location**: Guardrails section near end

**Added**:
- Check for comprehensive plan first (if key provided)
- Load System Context Pack (if plan exists)
- Update JSON tracking (if plan exists)
- Synchronize markdown + JSON in same commit

---

## Changes to `test-generation.prompt.md`

### 1. Plan Integration Protocol (NEW - Top of Document)

**Location**: Before "Role" section

**Added**:
- Check for test specification in `.github/prompts.keys/{key}/{key}.plan.md`
- Load current phase's "Playwright Test Specification" section
- Use plan's test scenarios, logging behavior, selector strategy
- Use plan's mode (headed/headless), Percy requirements
- Use plan's orchestration script template
- Update test registry with duplicate detection
- Fallback to parameter-driven generation when no plan

**Benefits**:
- Tests match approved plan specifications
- Consistent test coverage across phases
- No duplication (registry prevents re-creation)

---

### 2. Test Registry Deduplication (ENHANCED)

**Location**: "Test Location" section

**Changed**:
- Mandatory duplicate check before generation
- Search registry for feature + scenario + test type match
- Skip generation if duplicate found (inform user)
- Offer variant generation if similar match found
- Update registry immediately after generation
- Include phase reference from plan (if applicable)

**Benefits**:
- Prevents duplicate test creation
- Clear test inventory per key
- Test reuse across phases

---

### 3. Orchestration Script Generation (NEW)

**Location**: After "Input Parameters" section

**Added**:
- Load orchestration script specification from plan (if exists)
- Use plan's customized PowerShell template
- Generate at `.github/prompts.keys/{key}/scripts/run-{feature}-phase{N}-test.ps1`
- Fallback to canonical template when no plan
- Different naming convention: plan-driven vs parameter-driven
- Update test registry with script location

**Benefits**:
- Plan-aware orchestration scripts
- Customized for phase requirements
- Consistent script generation

---

### 4. Percy Visual Test Coordination (ENHANCED)

**Location**: "Percy Visual Regression Test Template" section

**Changed**:
- Check plan's "Playwright Test Specification" for Percy requirement
- Use plan's visual change rationale
- Capture plan-specified screens/flows
- Follow plan's viewport specifications
- Apply plan's percyCSS hiding rules
- Fallback to decision matrix when no plan

**Benefits**:
- Plan-approved visual testing
- Consistent Percy usage across phases
- No redundant visual tests

---

### 5. Output Format - Plan-Driven Generation (ENHANCED)

**Location**: "Output Format" section

**Changed**:
- Split into **A. Plan-Driven Generation** and **B. Parameter-Driven Generation**
- Plan-driven: Load test spec from plan's current phase
- Use plan's scenarios verbatim
- Apply plan's System Context Pack for test data
- Parameter-driven: Use decision matrix and canonical patterns

---

### 6. Test Registry Update (ENHANCED)

**Location**: "Output Format" → "3. Test Registry Update"

**Changed**:
- Mandatory deduplication check before generation
- Skip generation if duplicate found (return existing test details)
- Add phase reference to registry entry (from plan or "Ad-hoc")
- Add plan reference link (`{key}.plan.md Phase {N}`)
- Update registry after test execution (by task agent)

---

### 7. Workflow Integration (ENHANCED)

**Location**: "Workflow Integration" section

**Changed**:
- Added `feature.prompt.md` as invoker
- Added `phase` parameter (from plan)
- Added context sources (primary: plan, fallback: parameters)
- Added test registry duplicate detection results to returns

---

### 8. Key Data Stream Entry Template (ENHANCED)

**Location**: End of document

**Changed**:
- Added "Plan Reference" field
- Added "Test Generation Context" section
- Document source (plan-driven vs parameter-driven)
- Document duplicate check result
- Document orchestration template source

---

## Integration Workflow

```
┌────────────────────────────────┐
│   @workspace /feature             │
│   • Technology stack discovery │
│   • Phase breakdown            │
│   • Test specifications        │
│   • System Context Pack        │
│   OUTPUT: {key}.plan.md        │
│           {key}.plan.json      │
└────────────────────────────────┘
              ↓
      🛑 feature planning agent STOPS
              ↓
┌────────────────────────────────┐
│ USER RUNS HANDOFF COMMAND      │
│ @workspace /task key={key}     │
│   tasks="Phase 1\n---Phase 2"  │
└────────────────────────────────┘
              ↓
┌────────────────────────────────┐
│   @workspace /task             │
│   • Load {key}.plan.md         │
│   • Load {key}.plan.json       │
│   • Load System Context Pack   │
│   • Execute Phase 1            │
│   • Delegate test generation → │
│   • Update JSON tracking       │
│   • Repeat for Phase 2, 3...   │
└────────────────────────────────┘
              ↓
┌────────────────────────────────┐
│ @workspace /test-generation    │
│   • Load test spec from plan   │
│   • Check test registry        │
│   • Generate test + script     │
│   • Update registry            │
│   • Return to task agent       │
└────────────────────────────────┘
```

---

## Key Benefits

### For Users:
- ✅ **No redundant questions** - feature planning agent asks once, task agent uses answers
- ✅ **Consistent implementation** - Task agent follows approved architecture
- ✅ **Progress visibility** - JSON tracking enables "what's the status?" queries
- ✅ **Safety** - Phase-by-phase approval with rollback capability

### For Development:
- ✅ **Technology-aware** - Plan validates framework/library compatibility upfront
- ✅ **Pattern reuse** - Cross-key analysis identifies proven solutions
- ✅ **Test consistency** - Same test data across all phases (Session 212)
- ✅ **No duplication** - Test registry prevents duplicate test creation

### For Maintenance:
- ✅ **Machine-readable** - JSON tracking for programmatic queries
- ✅ **Historical tracking** - Metrics aggregation (LOC, tests, phases)
- ✅ **Clean separation** - Each agent has clear boundaries
- ✅ **Single source of truth** - Plan document + JSON tracking synchronized

---

## Migration Notes

### Backward Compatibility:
- ✅ **Task agent** still supports lightweight mode (no plan required)
- ✅ **Test generation** still supports parameter-driven generation
- ✅ **Existing keys** work unchanged (plan integration is additive)

### New Capabilities:
- ✅ **Plan-driven execution** - Multi-phase orchestration
- ✅ **JSON progress tracking** - Machine-readable metrics
- ✅ **Test registry** - Duplicate detection and prevention
- ✅ **System Context Pack** - Pre-gathered execution context

### Recommended Workflow:
1. **Complex work** (3+ phases) → Use `@workspace /feature` first
2. **Simple tasks** (1-2 steps) → Use `@workspace /task` directly
3. **Multi-phase projects** → Always generate plan for consistency

---

## Testing Recommendations

### Verify Plan Integration:
1. Create a test plan with 2-3 phases
2. Run task agent with plan-driven mode
3. Verify JSON tracking updates after each phase
4. Verify test generation uses plan specifications
5. Verify test registry prevents duplicates

### Verify Backward Compatibility:
1. Run task agent without plan (lightweight mode)
2. Verify test generation without plan (parameter mode)
3. Verify existing keys still work

---

## Next Steps

### Optional Enhancements:
1. **Plan validation** - JSON schema validation for {key}.plan.json
2. **Progress dashboard** - Query JSON tracking for status reports
3. **Cross-plan analysis** - Identify common patterns across keys
4. **Automated rollback** - Script to revert to checkpoint on failure

### Documentation Updates:
1. Update execution-flow.md with plan integration decision points
2. Create plan-integration-workflow.md with complete examples
3. Update SelfAwareness.instructions.md with plan protocol references

---

**Status**: ✅ Ready for use. All changes implemented and backward compatible.


