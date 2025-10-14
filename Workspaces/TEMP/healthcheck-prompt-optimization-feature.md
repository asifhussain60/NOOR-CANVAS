# Healthcheck Agent - Prompt Optimization Feature

**Date:** October 14, 2025  
**Commit:** 1fe1ace2  
**Feature:** Prompt Optimization Mode

---

## Overview

The healthcheck agent now includes **Prompt Optimization Mode** - a comprehensive capability to holistically analyze prompt files, identify bloat/inefficiencies/conflicts, and automatically coordinate with the task agent to execute optimizations.

---

## New Capability

### Scope Parameter Enhancement

**Previous:**
```
scope = all | component-name
```

**New:**
```
scope = all | component-name | prompt-name
```

**Prompt-name values:**
- Short name: `task`, `refactor`, `sync`, `healthcheck`
- Full filename: `task.prompt.md`, `refactor.prompt.md`, `sync.prompt.md`

---

## Usage

### Standard Healthcheck (Unchanged)
```bash
@workspace /healthcheck scope=all
@workspace /healthcheck scope=SessionCanvas.razor notes="verify SignalR"
```

### NEW: Prompt Optimization Mode
```bash
# Analyze task.prompt.md holistically
@workspace /healthcheck scope=task notes="holistic analysis and optimization"

# Analyze refactor.prompt.md with detailed output
@workspace /healthcheck scope=refactor.prompt.md verbosity=detailed

# Identify competing instructions in sync.prompt.md
@workspace /healthcheck scope=sync notes="identify competing instructions"
```

---

## Workflow

### Phase 1: Analysis (Read-Only)
1. **Resolve prompt file** from scope parameter
2. **Read complete prompt** content
3. **Analyze for:**
   - **Competing Instructions & Conflicts**
     - Duplicate step numbering
     - Conflicting parameter definitions
     - Contradictory execution rules
     - Circular references between steps
   
   - **Bloat & Inefficiencies**
     - Duplicate content across sections
     - Overly verbose examples (50+ lines)
     - Inline protocols that should be shared files
     - Redundant framework validation checklists
   
   - **Structural Inefficiencies**
     - Steps duplicating content from referenced files
     - Overengineered workflows
     - Out-of-scope functionality
     - Missing critical guardrails
   
   - **Prompt-Specific Issues**
     - Unclear execution flow
     - Inconsistent output formatting
     - Missing conditional execution triggers
     - Outdated references

4. **Generate optimization report** with:
   - Critical issues identified
   - Optimization recommendations (quick wins, medium-term, structural)
   - Priority actions (high/medium/low)
   - Summary metrics (line reduction, modularity improvement)
   - Phased approach (time estimates per phase)

### Phase 2: User Approval
1. **Present report** to user (concise or detailed based on verbosity)
2. **Wait for approval**:
   - Approved → Continue to Phase 3
   - Declined → Save report and exit
   - Modifications requested → Adjust and re-present

### Phase 3: Execution via Task Agent
1. **Invoke task agent** with structured optimization instructions:
   ```
   @workspace /task key=prompt-optimization-{prompt-name} tasks="
   Phase 1: Fix Critical Conflicts (15 min)
   - {specific actions}
   ---
   Phase 2: Extract to Shared Library (1 hour)
   - {specific actions}
   ---
   Phase 3: Structural Improvements (30 min)
   - {specific actions}"
   ```

2. **Monitor task agent progress**
3. **Track optimization execution** across all phases

### Phase 4: Post-Optimization Validation
1. **Verify optimization results:**
   - Compare original vs optimized line counts
   - Validate all competing instructions eliminated
   - Confirm bloat removed
   - Check shared library files created

2. **Functional validation:**
   - Test optimized prompt with sample invocation
   - Verify all parameters still work
   - Confirm execution steps unchanged
   - Validate output quality maintained

3. **Generate optimization summary**
4. **Update key data stream** with results

---

## Optimization Report Structure

```markdown
# Prompt Optimization Analysis: {prompt-name}

**Date:** {ISO-8601 timestamp}
**Prompt File:** .github/prompts/{prompt-name}.prompt.md
**Current Size:** {line count} lines

---

## Critical Issues Identified

### 1. Competing Instructions & Conflicts
- **Issue 1.1:** Duplicate Step 2.4 (different purposes)
  - **Location:** Line 856, Line 1115
  - **Impact:** AI cannot determine which to execute
  - **Recommendation:** Renumber to create linear sequence

### 2. Bloat & Inefficiencies
- **Issue 2.1:** UI Debugging Protocol (254 lines inline)
  - **Size:** 254 lines
  - **Recommendation:** Extract to shared/ui-debugging-protocol.md
  - **Savings:** 249 lines

### 3. Structural Inefficiencies
- **Issue 3.1:** Step 10 (Self-Improvement) out of scope
  - **Problem:** Task agent should focus on execution, not meta-improvement
  - **Recommendation:** Remove Step 10 entirely (118 lines)

### 4. Missing Critical Guardrails
- **Issue 4.1:** No token budget enforcement
  - **Risk:** AI context overflow on large tasks
  - **Recommendation:** Add max token budget check at start

---

## Optimization Recommendations

### Quick Wins (15 minutes)
1. Fix duplicate step numbering → 5 min
2. Remove Step 10 → 5 min
3. Consolidate orchestration scripts → 5 min

**Total Savings:** ~200 lines

### Medium-Term Refactoring (1 hour)
1. Extract UI debugging → shared file (249 lines saved)
2. Extract framework validation → shared file (100 lines saved)
3. Extract Playwright patterns → shared file (140 lines saved)
4. Simplify completion workflow (160 lines saved)

**Total Savings:** ~590 lines

### Structural Improvements (30 minutes)
1. Create execution flow diagram
2. Add two-tier architecture (core + shared library)
3. Enforce verbosity consistently

---

## Summary Metrics

| Metric | Current | After Optimization | Improvement |
|--------|---------|-------------------|-------------|
| **Total Lines** | 2,436 | ~900 | **-63%** |
| **Duplicate Sections** | 6 | 0 | **-100%** |
| **Competing Instructions** | 3 | 0 | **-100%** |
| **External References** | 8 | 15 | **+87% modularity** |

---

## Phased Approach

**Phase 1 (15 minutes):** Fix critical conflicts
**Phase 2 (1 hour):** Extract to shared library
**Phase 3 (30 minutes):** Structural improvements

**Result:** 63% line reduction, zero conflicts, improved maintainability
```

---

## Optimization Summary (After Execution)

```markdown
# Optimization Summary: {prompt-name}

**Status:** ✅ Complete
**Original Size:** 2,436 lines
**Optimized Size:** 561 lines
**Reduction:** 77.0% (1,875 lines removed)

**Issues Resolved:**
- ✅ 6 competing instructions eliminated
- ✅ 6 duplicate sections removed
- ✅ 3 structural inefficiencies fixed
- ✅ 2 critical guardrails added

**Files Created:**
- .github/prompts/shared/ui-debugging-protocol.md (217 lines)
- .github/prompts/shared/framework-validation-checklists.md (149 lines)
- .github/prompts/shared/playwright-test-generation.md (214 lines)
- .github/prompts/shared/completion-workflow-template.md (286 lines)
- .github/prompts/shared/execution-flow.md (228 lines)

**Commit:** 881bbdb6

**Validation:** All tests passed, functionality preserved
```

---

## Key Data Stream Integration

### Standard Healthcheck Entry
```markdown
**Scope**: all
**Audit Results**: Healthy | Issues Found
**Validation Levels Checked**: [6 levels]
**Handoff**: sync/refactor for remediation
```

### Prompt Optimization Entry
```markdown
**Scope**: prompt/{prompt-name}
**Optimization Results**: Successful
**Original Size**: {X} lines
**Optimized Size**: {Y} lines
**Reduction**: {Z}%
**Task Agent Invocation**: key=prompt-optimization-{prompt-name}
**Validation**: Functionality preserved, tests passed
**Learning Patterns Updated**: prompt-bloat-{pattern-id}
```

---

## Benefits

### For Prompt Maintenance
- ✅ **Prevents bloat accumulation** over time
- ✅ **Identifies competing instructions** before they cause confusion
- ✅ **Automates optimization execution** (no manual file editing)
- ✅ **Quarterly maintenance capability** (prevent prompt drift)

### For AI Performance
- ✅ **Faster parsing** (fewer lines to process)
- ✅ **Better clarity** (no conflicting instructions)
- ✅ **Improved efficiency** (modular structure with shared library)

### For Development Team
- ✅ **Single source of truth** (shared library prevents duplication)
- ✅ **Easier maintenance** (update once, benefits all prompts)
- ✅ **100% backward compatibility** (validation ensures no functionality lost)
- ✅ **Documented patterns** (reuse optimization techniques across prompts)

---

## Integration with Other Agents

### Triggers Task Agent
- **Automatic invocation** with structured optimization instructions
- **Phase-by-phase execution** (quick wins → extraction → structural)
- **Validation handoff** (task agent validates each phase)

### Updates Learning Patterns
- **Documents optimization techniques** in `.github/learning/`
- **Tracks metrics** for trend analysis
- **Pattern reuse** for future prompt optimizations

### Coordinates with Sync/Refactor
- **Standard healthcheck** still hands off issues to sync/refactor
- **Prompt optimization** is self-contained (healthcheck → task → validation)

---

## When to Use

### Recommended Scenarios
- ✅ **After major prompt revisions** (accumulated bloat over time)
- ✅ **When AI parsing seems slow** or inconsistent
- ✅ **After discovering competing instructions** in usage
- ✅ **Periodic maintenance** (quarterly optimization reviews)
- ✅ **Before promoting prompt to production** use

### Not Recommended For
- ❌ Working, concise prompts (<500 lines, clear structure)
- ❌ Prompts with no duplicate content
- ❌ Prompts already using shared library extensively
- ❌ Prompts with clear, linear execution flow

---

## Success Criteria

After optimization, prompt should have:
- ✅ **Zero competing instructions**
- ✅ **Zero duplicate sections**
- ✅ **Modular structure** (core + shared library)
- ✅ **Clear execution flow diagram**
- ✅ **100% backward compatible**
- ✅ **Improved maintainability** (single source of truth)

---

## Example: Task.Prompt.md Optimization

### Before
- **Size:** 2,436 lines
- **Issues:** 6 duplicate sections, 3 competing instructions, 254 lines of inline UI debugging
- **Structure:** Monolithic, everything inline

### After
- **Size:** 561 lines (-77%)
- **Issues:** 0 duplicates, 0 conflicts
- **Structure:** Two-tier (core 561 lines + shared library 1,094 lines)
- **Shared Files:** 5 new modular files
- **Result:** Faster parsing, easier maintenance, 100% backward compatible

---

## Metrics to Track

### Optimization Effectiveness
- **Line Reduction:** Target >30% for bloated prompts
- **Shared Library Reuse:** Target >5 external references
- **Duplicate Elimination:** Target 100%
- **Cognitive Load:** Target sections <100 lines avg

### Validation Success
- **Functionality:** 100% preserved (no breaking changes)
- **Reference Resolution:** 100% (all links work)
- **Sample Invocation:** Pass (prompt works identically)
- **Backward Compatibility:** 100% (existing usage unaffected)

---

## Future Enhancements

### Potential Additions
- **Automated schedule:** Monthly prompt health checks
- **Cross-prompt analysis:** Identify common bloat patterns across all prompts
- **Template generation:** Auto-create new prompts from optimized patterns
- **Metric dashboards:** Track prompt bloat trends over time

---

## Summary

The healthcheck agent's **Prompt Optimization Mode** provides:
1. **Comprehensive analysis** of prompt files (bloat, conflicts, inefficiencies)
2. **Automatic coordination** with task agent for execution
3. **Post-optimization validation** (functionality, compatibility, metrics)
4. **Learning pattern updates** for future reuse
5. **100% backward compatibility** guarantee

**Result:** Healthier, more maintainable prompts with faster AI parsing and clearer execution flow.

**Usage:** `@workspace /healthcheck scope={prompt-name} notes="holistic analysis"`
