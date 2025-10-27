# Prompt System Verbosity Analysis & Remediation

**Date:** 2025-10-27  
**Analyzed By:** ask.prompt.md (per user request)  
**Scope:** Build, Plan, Todo, and supporting shared algorithm files

---

## Executive Summary

**Finding:** Severe verbosity violations across all user-facing prompt outputs despite explicit mandates.

**Root Causes:**
1. **No enforcement mechanism** between CONCISE-MANDATE.md rules and actual output
2. **Missing algorithm files** (4 referenced but non-existent) prevented modular implementation
3. **Code dumping loophole** - "Plan drafts special case" abused to show 100+ lines of code
4. **Architecture checks referenced but not executed** - context-loader.md didn't exist

**Remediation Status:**
- ✅ Created 4 missing algorithm files (task-detector, work-classifier, context-loader, request-analyzer)
- ✅ Updated integration-protocol.md with new references
- ⚠️ Enforcement mechanism still missing (bullet counter, code block validator)
- ⚠️ Architecture consultation flow not verified in execution

---

## Detailed Findings

### 1. Code Dumping Violation (CRITICAL)

**Evidence from CopilotChats.md:**
```
Lines 100-200: 200+ lines of SQL, C#, TypeScript plan draft
Lines 300-500: Full code implementations shown in chat
Lines 500-700: Complete migration scripts + test code displayed
```

**Rule Violated:**
> CONCISE-MANDATE.md: "NO code/pseudocode/JSON in chat"

**Actual Behavior:**
- Build prompt shows full plan drafts (100+ lines)
- Plan prompt dumps SQL migrations, C# code, TypeScript tests
- Task execution shows complete file contents in responses

**Loophole Exploited:**
> output-style-mandate.md: "Plan drafts: Maximum 100 lines (up from 30-50 for complex plans)"

**Recommendation:** Remove "plan draft in chat" exception entirely. ALL implementation details → `{key}.plan.md` files only.

---

### 2. Bullet Count Violation

**Rule:**
> CONCISE-MANDATE.md: "MAX 15 bullets total per response"

**Actual Behavior:**
- Build responses: 30-50 bullets (nested lists compound count)
- Plan responses: 40+ bullets across multiple sections
- Task responses: 25+ bullets with nested sub-tasks

**Why It Happens:**
- No pre-response counter
- Nested lists not counted against limit
- Section headers not counted
- "Just one more detail" mentality

**Recommendation:** Implement pre-response validation:
```
BEFORE responding:
  1. Count ALL bullets (including nested)
  2. If > 15: Consolidate or defer to plan file
  3. If unavoidable: Explain why limit exceeded
```

---

### 3. Architecture Checks Missing (INFRASTRUCTURE RISK)

**Referenced but Not Executed:**
- plan.prompt.md Step 1: "See context-loader.md" (file didn't exist until today)
- Database connection string verification: Mentioned but not performed
- API endpoint catalog check: Referenced but skipped
- appsettings.json validation: Not evidenced in chat logs

**Why This Matters:**
1. **Duplicate endpoints** - Without Architecture.md check, may recreate existing 52 endpoints
2. **Schema violations** - Without InfrastructureQuickRef.md, may write to dbo.* (READ-ONLY)
3. **Connection errors** - Without appsettings.json validation, wrong database targeted
4. **Test pattern violations** - Without TESTING_FRAMEWORK_V2_SUMMARY.md, incorrect test structure

**Evidence of Violation:**
- CopilotChats.md shows NO Architecture.md loading before plan creation
- NO connection string verification against appsettings.json
- NO schema access validation (canvas.* vs dbo.*)

**Remediation:**
- ✅ Created context-loader.md with MANDATORY loading protocol
- ⚠️ Not yet verified that plan.prompt.md actually executes it
- ⚠️ No validation hook to BLOCK plan generation if context not loaded

---

### 4. Handoff Chain Issues

**Build → Plan Handoff:**
- ✅ Exists and documented in agent-handoff-protocol.md
- ✅ Shows approval prompt to user
- ⚠️ Unclear if auto-execute actually transitions control

**Plan → Todo Intelligence:**
- ✅ Documented: Plan should recommend todo for extensions
- ❓ Not demonstrated in CopilotChats.md logs
- ⚠️ Build prompt has intelligent routing but plan prompt doesn't suggest todo

**Build Auto-Routing:**
- ✅ Specified: Single task → todo, Multiple → plan
- ⚠️ Now has algorithm (task-detector.md) but execution unclear
- ⚠️ todo.prompt.md has `from-build=true` to prevent dual approval gates (good design)

**Recommendation:** Add execution traces to verify handoffs:
```
[HANDOFF] build.prompt.md → plan.prompt.md (target=plan, reason=multiple tasks)
[HANDOFF] plan.prompt.md → task.prompt.md (key=my-feature, phases=4)
[HANDOFF] build.prompt.md → todo.prompt.md (target=todo, from-build=true, auto-approved)
```

---

## What's Working Well

### ✅ Key Data Stream Architecture
- `.github/key-data-streams/{key}/` structure used correctly
- work-log.md, plan.md files created in right locations
- Checkpoint commits with `ckpt({key}):` format present in git history
- Global index maintained

### ✅ Routing Logic (Partial)
- Build prompt detects active key from git history successfully
- Todo prompt preserves context from recent work
- Plan prompt generates structured phases
- Multi-task detection logic defined (now has algorithm file)

### ✅ Instructions Reference
- SelfAwareness.instructions.md loaded and database schema rules followed
- Database access violations not observed (canvas.* vs dbo.* respected)
- UserDictionary.md referenced (though expansion not shown in logs)

---

## Critical Gaps Remediated

### ✅ FIXED: Missing Shared Algorithm Files

**Created 4 Files:**

1. **task-detector.md** - Single vs multiple task detection
   - Detection patterns: numbered lists, conjunctions, multiple file actions
   - Routing: single → todo (auto-approved), multiple → plan (requires approval)
   - Edge case handling: "update X and test it" still single task

2. **work-classifier.md** - Work type classification
   - Classifies into: ask, todo, plan, test-generation, healthcheck, drift
   - Priority order for multi-indicator requests
   - Override warning system when user chooses wrong target

3. **context-loader.md** - Required reading protocol
   - MANDATORY: Architecture.md, InfrastructureQuickRef.md, index.md
   - Conditional: Testing, Zoom, Logging, CDN, Cloudflare docs
   - Work characteristic detection (UI, API, DB, SignalR, Services)
   - Connection string & API verification protocols

4. **request-analyzer.md** - Complexity estimation
   - Layer detection (UI, API, Service, Database, SignalR)
   - Feature type classification (new-feature, bug-fix, refactor, etc.)
   - Phase count estimation (1-2 simple, 3-4 moderate, 5+ complex)
   - Test requirements mapping (E2E, integration, unit, visual-regression)
   - Dependency detection (related keys, external systems)
   - Unknown/ambiguity identification

**Integration:**
- Updated integration-protocol.md with references to all 4 files
- Files follow same pattern as existing shared docs (validation-engine.md style)
- Algorithms defined in pseudocode for clarity and enforcement

---

## Critical Gaps Remaining

### ❌ STILL MISSING: Enforcement Mechanisms

**No Pre-Response Validation:**
- Bullet counter: Not implemented
- Code block detector: Not implemented
- Nested list flattener: Not implemented

**Recommendation:** Create `output-validator.md`:
```
FUNCTION ValidateResponse(response)
  violations = []
  
  // Count bullets
  bulletCount = CountBullets(response)  // Include nested
  IF bulletCount > 15 THEN
    violations.add("Bullet limit exceeded: " + bulletCount + "/15")
  END IF
  
  // Detect code blocks
  codeBlocks = FindCodeBlocks(response)  // ``` markers
  IF codeBlocks.length > 0 THEN
    violations.add("Code block detected (prohibited by CONCISE-MANDATE)")
  END IF
  
  // Check nested lists
  nestedLists = FindNestedLists(response)
  IF nestedLists.length > 0 THEN
    violations.add("Nested list detected (flat bullets only)")
  END IF
  
  IF violations.isEmpty THEN
    RETURN { valid: true }
  ELSE
    RETURN { valid: false, violations: violations }
  END IF
END FUNCTION
```

### ❌ STILL MISSING: Architecture Consultation Verification

**No Evidence of Execution:**
- context-loader.md created but not yet proven to execute
- No logs showing "Loaded Architecture.md (52 endpoints)"
- No evidence of appsettings.json verification
- No schema access validation traces

**Recommendation:** Add execution markers:
```
[CONTEXT-LOAD] Architecture.md loaded (52 endpoints, 15 pages, 10 components)
[CONTEXT-LOAD] InfrastructureQuickRef.md loaded (DB: KSESSIONS_DEV, API: localhost:9091)
[CONTEXT-LOAD] TESTING_FRAMEWORK_V2_SUMMARY.md loaded (UI work detected)
[VERIFY] Connection string matches appsettings.json: ✅
[VERIFY] Schema access rules: canvas.* READ-WRITE, dbo.* READ-ONLY ✅
```

---

## Recommendations Priority

### HIGH PRIORITY (Immediate)

**A. Create output-validator.md**
- Pre-response bullet counter
- Code block detector
- Nested list flattener
- Integrate into build, plan, todo, task prompts

**B. Add execution tracing to context-loader.md**
- Verify Architecture.md actually loads
- Verify appsettings.json validation runs
- Verify schema access rules checked
- Add BLOCKING requirement (plan fails if context not loaded)

**C. Remove code dumping loopholes**
- Eliminate "plan drafts special case" from output-style-mandate.md
- Strict rule: ALL code → plan files, ZERO code in chat
- Pseudocode allowed only for algorithms (not implementations)

### MEDIUM PRIORITY (Next Phase)

**D. Add handoff execution traces**
- Verify build → plan transition actually happens
- Verify plan → task handoff with all context
- Verify todo auto-approval when from-build=true

**E. Create prompt compliance test suite**
- Automated validation of all prompt files
- Check for CONCISE-MANDATE violations
- Verify all "See algorithm.md" references resolve
- Test that required reading actually executes

### LOW PRIORITY (Future Enhancement)

**F. User education on prompt usage**
- Quick reference guide for when to use /build vs /plan vs /todo
- Examples of optimal invocations
- Common anti-patterns to avoid

**G. Prompt optimization**
- Consolidate duplicate instructions
- Streamline step definitions
- Reduce prompt token count while maintaining clarity

---

## Testing Protocol

### Validation Test Cases

**Test 1: Bullet Count Enforcement**
```
Given: User request requiring detailed response
When: Agent generates response
Then: Response should have ≤15 bullets OR explain why limit exceeded
```

**Test 2: Code Block Prohibition**
```
Given: User request for implementation
When: Agent generates response
Then: Response should have ZERO code blocks, ALL code in plan files
```

**Test 3: Architecture Consultation**
```
Given: User request affecting database/API
When: Plan agent invoked
Then: Architecture.md + InfrastructureQuickRef.md MUST load before plan generation
```

**Test 4: Intelligent Routing**
```
Given: Single task request
When: Build agent invoked without target
Then: Should route to todo (auto-approved), not plan
```

**Test 5: Multi-Task Detection**
```
Given: Request with numbered list (3 items)
When: Build agent invoked without target
Then: Should route to plan (requires approval), not todo
```

---

## Success Metrics

**Before Remediation:**
- ❌ Bullet count violations: ~80% of responses
- ❌ Code dumping violations: ~90% of responses
- ❌ Architecture checks: 0% execution rate
- ❌ Missing algorithm files: 4/4 referenced files

**After Phase 1 (Today):**
- ✅ Missing algorithm files: 0/4 (all created)
- ⚠️ Bullet count violations: Not yet measured
- ⚠️ Code dumping violations: Not yet measured
- ⚠️ Architecture checks: Not yet verified

**Target State:**
- ✅ Bullet count violations: <10% (with explanation)
- ✅ Code dumping violations: 0% (strict enforcement)
- ✅ Architecture checks: 100% execution for plan/task agents
- ✅ All referenced algorithm files: Exist and execute

---

## Next Steps

**Immediate (Today):**
1. ✅ Create missing algorithm files (COMPLETE)
2. ✅ Update integration-protocol.md (COMPLETE)
3. ✅ Commit changes with descriptive message (COMPLETE)

**Next Session:**
1. Create output-validator.md with enforcement logic
2. Add execution tracing to context-loader.md
3. Test build → plan → task handoff chain
4. Verify intelligent routing (single → todo, multiple → plan)
5. Remove code dumping loophole from output-style-mandate.md

**Future Sessions:**
1. Create prompt compliance test suite
2. Add automated validation to pre-commit hooks
3. Document optimal prompt usage patterns
4. Optimize prompt token counts

---

## References

**Created Files:**
- `.github/prompts/shared/task-detector.md`
- `.github/prompts/shared/work-classifier.md`
- `.github/prompts/shared/context-loader.md`
- `.github/prompts/shared/request-analyzer.md`

**Updated Files:**
- `.github/prompts/shared/integration-protocol.md`

**Referenced Mandates:**
- `.github/prompts/shared/CONCISE-MANDATE.md`
- `.github/prompts/shared/output-style-mandate.md`
- `.github/instructions/SelfAwareness.instructions.md`

**Related Prompts:**
- `.github/prompts/build.prompt.md`
- `.github/prompts/plan.prompt.md`
- `.github/prompts/todo.prompt.md`
- `.github/prompts/ask.prompt.md`

**Git Commit:**
- cba37cee - feat(prompts): Create missing shared algorithm files
