# KDS v5.0 Implementation Plan

**Date Created:** 2025-11-02  
**Status:** 📋 PLANNING  
**Target:** Complete SOLID v5.0 + Memory System Foundation

---

## 🎯 Current State Analysis

### ✅ COMPLETED (Already Implemented)

1. **BRAIN System Infrastructure**
   - ✅ `.github/kds-brain/` directory structure
   - ✅ `knowledge-graph.yaml` (schema defined)
   - ✅ `events.jsonl` (event logging system)
   - ✅ BRAIN README documentation
   - ✅ `brain-query.md` internal agent
   - ✅ `brain-updater.md` internal agent

2. **Specialist Agents (v5.0)**
   - ✅ `intent-router.md` (8 intents: PLAN, EXECUTE, TEST, VALIDATE, GOVERN, CORRECT, RESUME, ASK)
   - ✅ `work-planner.md` (planning only, no resume mode)
   - ✅ `code-executor.md` (execution only, no correction mode)
   - ✅ `error-corrector.md` (dedicated correction agent - ISP compliant)
   - ✅ `session-resumer.md` (dedicated resumption agent - ISP compliant)
   - ✅ `test-generator.md`
   - ✅ `health-validator.md`
   - ✅ `change-governor.md`
   - ✅ `knowledge-retriever.md`

3. **Shared Abstractions (DIP Compliance)**
   - ✅ `session-loader.md` (abstract session access)
   - ✅ `test-runner.md` (abstract test execution)
   - ✅ `file-accessor.md` (abstract file I/O)
   - ✅ `config-loader.md`
   - ✅ `validation.md`
   - ✅ `handoff.md`
   - ✅ `test-first.md`
   - ✅ `publish.md`
   - ✅ `mandatory-post-task.md`
   - ✅ `execution-tracer.md`

4. **User Interface (Entry Points)**
   - ✅ `kds.md` (universal entry point documented in v5.0)
   - ✅ `plan.md`
   - ✅ `execute.md`
   - ✅ `test.md`
   - ✅ `validate.md`
   - ✅ `govern.md`
   - ✅ `correct.md`
   - ✅ `resume.md`
   - ✅ `ask-kds.md`

### ⚠️ NEEDS VERIFICATION (May Be Partially Implemented)

1. **BRAIN Integration in Agents**
   - ⚠️ Does `intent-router.md` actually query BRAIN before pattern matching?
   - ⚠️ Do agents log events to `events.jsonl`?
   - ⚠️ Does `brain-updater.md` have working aggregation logic?
   - ⚠️ Does `brain-query.md` parse `knowledge-graph.yaml` correctly?

2. **Abstraction Integration**
   - ⚠️ Do agents use `session-loader.md` instead of direct file access?
   - ⚠️ Do agents use `test-runner.md` instead of hardcoded commands?
   - ⚠️ Do agents use `file-accessor.md` instead of direct I/O?

3. **SOLID Compliance**
   - ⚠️ Is `code-executor.md` truly execution-only (no correction logic)?
   - ⚠️ Is `work-planner.md` truly planning-only (no resumption logic)?
   - ⚠️ Is `error-corrector.md` fully functional as standalone agent?
   - ⚠️ Is `session-resumer.md` fully functional as standalone agent?

### ❌ NOT IMPLEMENTED (New Features)

1. **"Refresh Brain" Command**
   - ❌ User-facing command to trigger BRAIN knowledge refresh
   - ❌ Should consume recent session activity
   - ❌ Should modify/delete incorrect/redundant data intelligently
   - ❌ Should be callable via: `#file:.github/prompts/user/kds.md Refresh brain`

2. **"Setup Environment" Command**
   - ❌ User-facing command to install all dependencies
   - ❌ Should detect project type (.NET, Node.js, Python, etc.)
   - ❌ Should install required libraries/utilities/packages
   - ❌ Should use latest versions
   - ❌ Should be callable via: `#file:.github/prompts/user/kds.md Setup environment`
   - ⚠️ NOTE: `scripts/setup-kds-tooling.ps1` exists but may not be integrated into KDS command system

3. **Memory System (Future)**
   - ❌ 3-faculty system (retention, recollection, memorization)
   - ❌ `.github/kds-memory/thoughts.yaml` storage
   - ❌ `Remember: [thought]` command
   - ❌ `What ideas did I stash about [topic]?` command
   - ❌ `Show all my stashed ideas` command
   - ❌ Integration with BRAIN for context-aware suggestions
   - ⚠️ Currently documented as "Idea 1" in KDS-DESIGN.md Future Considerations

---

## 📋 Implementation TODO List

### Phase 1: Verification & Documentation (CURRENT PRIORITY)

**Before implementing new features, verify what exists:**

1. **BRAIN System Verification**
   - [ ] Read `brain-query.md` - Check if query logic is implemented
   - [ ] Read `brain-updater.md` - Check if aggregation logic is implemented
   - [ ] Read `intent-router.md` - Check if BRAIN query is integrated
   - [ ] Check `events.jsonl` - See if agents are actually logging events
   - [ ] Check `knowledge-graph.yaml` - See if it has real data or just schema

2. **Abstraction Verification**
   - [ ] Read `session-loader.md` - Check if abstraction logic exists
   - [ ] Read `test-runner.md` - Check if abstraction logic exists
   - [ ] Read `file-accessor.md` - Check if abstraction logic exists
   - [ ] Grep agents for direct file access patterns (violations)
   - [ ] Grep agents for hardcoded test commands (violations)

3. **SOLID Compliance Verification**
   - [ ] Read `code-executor.md` - Ensure no correction logic
   - [ ] Read `work-planner.md` - Ensure no resumption logic
   - [ ] Read `error-corrector.md` - Ensure fully standalone
   - [ ] Read `session-resumer.md` - Ensure fully standalone

4. **Documentation Alignment**
   - [ ] Update KDS-DESIGN.md if discrepancies found
   - [ ] Update `kds.md` if features are not implemented
   - [ ] Flag "aspirational documentation" vs "implemented features"

### Phase 2: Complete Existing v5.0 Features

**Fix any gaps found in Phase 1:**

1. **BRAIN Integration (If Incomplete)**
   - [ ] Implement BRAIN query in `intent-router.md`
   - [ ] Add event logging to all agents
   - [ ] Implement aggregation logic in `brain-updater.md`
   - [ ] Test BRAIN learning loop end-to-end

2. **Abstraction Migration (If Incomplete)**
   - [ ] Replace direct file access with `file-accessor.md` calls
   - [ ] Replace hardcoded test commands with `test-runner.md` calls
   - [ ] Replace direct session access with `session-loader.md` calls

3. **SOLID Compliance (If Violations Found)**
   - [ ] Remove correction logic from `code-executor.md`
   - [ ] Remove resumption logic from `work-planner.md`
   - [ ] Ensure `error-corrector.md` can halt execution
   - [ ] Ensure `session-resumer.md` loads full context

### Phase 3: New Commands (User Requested)

1. **"Refresh Brain" Command**
   - [ ] Add `REFRESH_BRAIN` intent to `intent-router.md`
   - [ ] Create routing logic to `brain-updater.md`
   - [ ] Enhance `brain-updater.md` with:
     - Scan all `.github/sessions/` files
     - Extract successful patterns
     - Detect and delete redundant knowledge
     - Detect and modify incorrect patterns
     - Report what was learned/changed/deleted
   - [ ] Add to `kds.md` documentation
   - [ ] Test: `#file:.github/prompts/user/kds.md Refresh brain`

2. **"Setup Environment" Command**
   - [ ] Add `SETUP_ENVIRONMENT` intent to `intent-router.md`
   - [ ] Create `environment-setup.md` internal agent
   - [ ] Implement logic:
     - Detect project type (check for .csproj, package.json, requirements.txt, etc.)
     - Read required dependencies from config or README
     - Install missing packages (npm, dotnet, pip, etc.)
     - Use latest versions (query package registries)
     - Validate installation success
     - Report installed packages
   - [ ] Integrate with existing `scripts/setup-kds-tooling.ps1` if applicable
   - [ ] Add to `kds.md` documentation
   - [ ] Test: `#file:.github/prompts/user/kds.md Setup environment`

### Phase 4: Memory System (Future - Not Immediate)

**Only implement when Phase 1-3 complete:**

1. **Design Decision**
   - [ ] User decides: Lightweight, Integrated, or External approach
   - [ ] Document chosen approach in KDS-DESIGN.md

2. **Implementation (If Approved)**
   - [ ] Create `.github/kds-memory/thoughts.yaml`
   - [ ] Create `memory-stash.md` internal agent
   - [ ] Create `memory-recall.md` internal agent
   - [ ] Add `REMEMBER`, `RECALL`, `LIST_IDEAS` intents to router
   - [ ] Integrate with BRAIN for context suggestions
   - [ ] Add to `kds.md` documentation

---

## 🎯 Execution Strategy

### Step 1: Document First (Rule #7)
Before any code changes:
1. ✅ Create this implementation plan
2. Update KDS-DESIGN.md with current state
3. Flag aspirational vs implemented features

### Step 2: Verify Current State
Read all agents and check:
1. What's actually implemented vs documented
2. What's partially done
3. What's completely missing

### Step 3: Prioritize Fixes
1. Fix SOLID violations (if any)
2. Complete BRAIN integration (if incomplete)
3. Migrate to abstractions (if hardcoded)

### Step 4: Implement New Features
1. Refresh Brain command
2. Setup Environment command
3. (Later) Memory System if approved

### Step 5: Test End-to-End
1. Test all 8 intents through universal entry point
2. Test BRAIN learning loop
3. Test new commands
4. Update documentation with actual behavior

---

## 🚦 Success Criteria

### Phase 1 Complete When:
- [ ] All agents verified and gaps documented
- [ ] KDS-DESIGN.md reflects actual implementation state
- [ ] Clear list of what needs fixing vs what needs building

### Phase 2 Complete When:
- [ ] All agents follow SOLID principles (verified)
- [ ] All agents use abstractions (no hardcoded paths/commands)
- [ ] BRAIN learning loop works end-to-end
- [ ] All integration tests pass

### Phase 3 Complete When:
- [ ] `#file:.github/prompts/user/kds.md Refresh brain` works
- [ ] `#file:.github/prompts/user/kds.md Setup environment` works
- [ ] Both commands documented in user-facing docs
- [ ] Both commands tested successfully

### Phase 4 Complete When:
- [ ] Memory System design chosen and documented
- [ ] Implementation complete (if approved)
- [ ] Integration with BRAIN verified
- [ ] User commands tested

---

## ⚠️ Risks & Mitigations

### Risk 1: Aspirational Documentation
**Problem:** KDS docs describe features not yet implemented  
**Mitigation:** Phase 1 verification explicitly flags this  
**Action:** Update docs to match reality, create roadmap for aspirational features

### Risk 2: SOLID Violations Hidden
**Problem:** Agents may still have mode-switch logic  
**Mitigation:** Phase 1 grep for patterns like "if mode == 'correction'"  
**Action:** Refactor to dedicated agents

### Risk 3: Hardcoded Dependencies
**Problem:** Abstractions may not be fully adopted  
**Mitigation:** Phase 1 grep for direct file/command access  
**Action:** Migrate to abstraction layer

### Risk 4: Scope Creep (Memory System)
**Problem:** User wants many features simultaneously  
**Mitigation:** Phase 4 is explicitly "Future - Not Immediate"  
**Action:** Complete Phases 1-3 first, get approval before Phase 4

---

## 📊 Current Metrics

| Category | Count | Notes |
|----------|-------|-------|
| **Specialist Agents** | 9 | intent-router + 8 specialists |
| **Shared Abstractions** | 10 | DIP compliance modules |
| **User Commands** | 9 | Including universal kds.md |
| **BRAIN Files** | 4 | knowledge-graph, events, query, updater |
| **Verification Status** | 0% | Phase 1 not started |
| **New Commands** | 0/2 | Refresh brain, Setup environment pending |
| **Memory System** | 0% | Future phase, design not chosen |

---

## 🎓 Next Actions

**Immediate (Today):**
1. ✅ Document implementation plan (this file)
2. Read key agents to verify implementation state
3. Update KDS-DESIGN.md with findings
4. Create Phase 1 verification checklist

**Short-Term (This Week):**
1. Complete Phase 1 verification
2. Fix any SOLID violations found
3. Complete BRAIN integration if incomplete
4. Begin Phase 3 (new commands)

**Medium-Term (This Month):**
1. Complete "Refresh brain" command
2. Complete "Setup environment" command
3. Test end-to-end
4. Update all documentation

**Long-Term (Future):**
1. Get approval for Memory System approach
2. Implement if approved
3. Integrate with BRAIN

---

**END OF IMPLEMENTATION PLAN**

**Status:** 📋 DOCUMENTED  
**Next:** Phase 1 Verification  
**Owner:** GitHub Copilot + User
