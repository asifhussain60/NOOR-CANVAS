# Optimization Report Template

**For use by:** healthcheck.prompt.md (Prompt Optimization Mode)

---

## Report Structure

```markdown
# Prompt Optimization Analysis: {prompt-name}

**Date:** {ISO-8601 timestamp}
**Prompt File:** .github/prompts/{prompt-name}.prompt.md
**Current Size:** {line count} lines
**Additional Request (notes):** {notes content if provided}

---

## Holistic Evaluation of Additional Request (if notes provided)

**Request:** {notes content}

**Contextual Analysis:**
- **Workflow Integration:** {Where this fits in existing execution flow}
- **Architectural Alignment:** {How this aligns with prompt patterns}
- **Parameter Impact:** {Effects on existing parameters}
- **Conflict Assessment:** {Potential conflicts with existing functionality}
- **Implementation Approach:** {Recommended approach within prompt architecture}

**Recommendations:**
1. **Primary Recommendation:** {Main approach for implementing notes request}
2. **Alternative Approach:** {Alternative if primary has conflicts}
3. **Integration Points:** {Specific steps/sections to modify}
4. **Guardrails to Add:** {New guardrails needed for this functionality}
5. **Cross-Functional Impacts:** {Effects on other parts of prompt}

**Priority:** {High/Medium/Low based on alignment with existing architecture}

---

## Critical Issues Identified

### 1. Competing Instructions & Conflicts
- **Issue 1.1:** {Description}
  - **Location:** Line {X}-{Y}
  - **Impact:** {How this confuses AI parsing}
  - **Recommendation:** {Specific fix}

### 2. Bloat & Inefficiencies
- **Issue 2.1:** {Description}
  - **Size:** {line count}
  - **Recommendation:** Extract to shared/{file}.md
  - **Savings:** {estimated line reduction}

### 3. Structural Inefficiencies
- **Issue 3.1:** {Description}
  - **Problem:** {Why this is inefficient}
  - **Recommendation:** {Specific refactor}

### 4. Missing Critical Guardrails
- **Issue 4.1:** {Description}
  - **Risk:** {Potential failure mode}
  - **Recommendation:** {Add specific guardrail}

---

## Optimization Recommendations

### Quick Wins (Immediate Implementation)
1. **{Recommendation 1}** → {Time estimate}, {Line savings}
2. **{Recommendation 2}** → {Time estimate}, {Line savings}

### Medium-Term Refactoring (1-2 hours)
1. **{Recommendation 1}** → {Description}, {Line savings}
2. **{Recommendation 2}** → {Description}, {Line savings}

### Structural Improvements
1. **{Recommendation 1}** → {Description}
2. **{Recommendation 2}** → {Description}

---

## Priority Actions

### High Priority (Do First)
1. ✅ {Action 1} - {Reason}
2. ✅ {Action 2} - {Reason}

### Medium Priority (Do Next)
1. {Action 1} - {Reason}
2. {Action 2} - {Reason}

### Low Priority (Optional)
1. {Action 1} - {Reason}
2. {Action 2} - {Reason}

---

## Summary Metrics

| Metric | Current | After Optimization | Improvement |
|--------|---------|-------------------|-------------|
| **Total Lines** | {X} | {Y} | {-Z%} |
| **Duplicate Sections** | {X} | 0 | -100% |
| **Competing Instructions** | {X} | 0 | -100% |
| **External References** | {X} | {Y} | +{Z}% modularity |
| **Avg Section Length** | {X} | {Y} | {-Z}% cognitive load |

---

## Recommended Approach

**Phase 1 (15 minutes):** Fix critical conflicts
- {List specific actions}

**Phase 2 (1 hour):** Extract to shared library
- {List specific actions}

**Phase 3 (30 minutes):** Polish
- {List specific actions}

**Result:** {Summary of expected improvements}
```

---

## Usage Notes

- Replace all `{placeholder}` values with actual content
- Include "Holistic Evaluation" section only if `notes` parameter was provided
- Adjust issue categories based on actual findings (may have 0 issues in some categories)
- Summary Metrics table should show realistic projections based on analysis
- Phase timings should reflect actual complexity of recommended changes
