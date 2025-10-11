# Action Item 04: Consolidate Test Generation

**Priority**: HIGH (Phase 1 - Week 1)  
**Effort**: 3 Story Points  
**Impact**: Single source of truth for test creation, eliminate duplication

---

## Description

Make task.prompt.md delegate all test generation to test-generation.prompt.md instead of duplicating test creation logic. Currently, task.prompt.md has embedded test generation in Step 7, duplicating logic from test-generation.prompt.md.

**Current State**:
- task.prompt.md Step 7: Has ~100 lines of test generation logic
- test-generation.prompt.md: Has comprehensive test generation logic
- Result: Duplicate logic, inconsistent test patterns

**Target State**:
- task.prompt.md: Routes to test-generation.prompt.md with clear parameters
- test-generation.prompt.md: Single source of truth for all test creation
- Result: Consistent tests, easier maintenance

---

## Files Affected

**Prompts to Update**:
- `.github/prompts/task.prompt.md` - Simplify Step 7 to routing logic
- `.github/prompts/test-generation.prompt.md` - Ensure can be invoked standalone or from task
- `.github/prompts/question.prompt.md` - Already routes correctly ✅

---

## Implementation Steps

### Step 1: Analyze Current Duplication

**In task.prompt.md Step 7** (~lines 550-650):
- Playwright test creation logic
- Multi-browser scenarios
- Token handling
- File naming patterns
- Test structure

**In test-generation.prompt.md** (~lines 1-292):
- Same Playwright logic
- Same multi-browser scenarios
- Same token handling
- More comprehensive, better examples

### Step 2: Update task.prompt.md Step 7

Replace embedded test generation with routing logic:

**OLD** (embedded logic):
```markdown
### 7. Test Generation & Validation
#### 7.1. Generate Playwright Tests
[100 lines of test creation logic]

#### 7.2. Run Tests
[Test execution logic]
```

**NEW** (routing logic):
```markdown
### 7. Test Generation & Validation

#### 7.1. Determine if Tests Needed
Evaluate if Playwright E2E tests are required:

**Generate Tests When**:
- ✅ New user interaction flow (buttons, forms, navigation, modals)
- ✅ API endpoint creation/modification affecting UI
- ✅ SignalR real-time feature changes
- ✅ Bug fixes affecting user-visible behavior
- ✅ Multi-user/multi-browser scenarios

**Skip Tests For**:
- ❌ CSS/styling tweaks without functional changes
- ❌ Debug logging additions/removals
- ❌ Documentation updates
- ❌ Internal refactoring without behavior change

#### 7.2. Route to Test Generation Agent

**If tests needed**:

```markdown
## 🔄 Routing to Test Generation Agent

This implementation requires E2E test validation. Please invoke the **Test Generation Agent**:

### Recommended Invocation:
Follow instructions in test-generation.prompt.md.
key: {current_key}
feature: {feature_name}
scenario: {specific_scenario}
endpoints: {api_endpoints_involved}

### Context:
- Implementation completed: {summary_of_changes}
- Files modified: {list_of_files}
- API changes: {endpoints_added_or_modified}
- UI changes: {components_modified}

### Expected Test:
- Test file: Tests/UI/{key}-{feature}.spec.ts
- Validation: {what_should_be_tested}
- Multi-browser: {true|false}
- Tokens needed: {true|false}

**Next Step**: Invoke test-generation.prompt.md with above parameters, or proceed if tests not needed.
```

**If tests not needed**:
```markdown
✅ Tests not required for this change (reason: {explanation})
Proceeding to commit.
```

#### 7.3. Test Execution (if tests created)

**After test-generation.prompt.md completes**:

1. Run newly created test:
   ```bash
   npx playwright test {test-file} --headed
   ```

2. Verify test passes
3. Document test results in key metadata
4. Proceed to commit

**See**: [Test Generation Agent](test-generation.prompt.md) for complete test creation workflow.
```

### Step 3: Update test-generation.prompt.md

Ensure it can be invoked both standalone and from task.prompt.md:

**Add invocation patterns section**:
```markdown
## Invocation Patterns

### Pattern 1: Direct User Invocation
User directly requests test creation:
```
Follow instructions in test-generation.prompt.md.
key: canvas
feature: question-delete
scenario: verify delete button removes question
```

### Pattern 2: Routed from task.prompt.md
task.prompt.md completes implementation and routes to test generation:
```
Follow instructions in test-generation.prompt.md.
key: {key}
feature: {feature}
scenario: {scenario}
endpoints: {endpoints}
# Context automatically loaded from key metadata
```

### Pattern 3: Routed from question.prompt.md
User asks question about testing, routes here:
```
Follow instructions in test-generation.prompt.md.
# Parameters inferred from question context
```
```

### Step 4: Update Automated Test Generation Mandate

**In task.prompt.md** - Keep mandate, simplify execution:

```markdown
## Automated Test Generation Mandate

When implementing changes, evaluate if Playwright E2E tests are needed.

**See Step 7.1** for criteria (when to generate vs. when to skip).

**If tests needed**: Route to test-generation.prompt.md (see Step 7.2).

**If tests not needed**: Document reason and proceed.

**Never**: Duplicate test generation logic inline - always delegate to test-generation.prompt.md.
```

### Step 5: Create Agent Routing Response Template

Create reusable routing response in `shared/agent-routing-response.md`:

```markdown
# Agent Routing Response Template

## Format

```markdown
## 🔄 Routing to {Agent Name}

{Reason for routing}

### Recommended Invocation:
Follow instructions in {target-prompt}.prompt.md.
{parameter1}: {value1}
{parameter2}: {value2}

### Context Being Passed:
- {context_item_1}
- {context_item_2}
- {context_item_3}

### Expected Output:
{what_target_agent_should_produce}

**Next Step**: {what_user_should_do}
```

## Examples

### task → test-generation
[Example from Step 2 above]

### task → refactor
```markdown
## 🔄 Routing to Refactor Agent

Implementation complete, but code quality could be improved.

### Recommended Invocation:
Follow instructions in refactor.prompt.md.
key: canvas
scope: SessionCanvas.razor
notes: Reduce component complexity, extract helper methods

### Context Being Passed:
- Implementation: Question delete feature complete
- Technical debt: Component now 450 lines (threshold: 300)
- Duplication: 3 similar methods could be consolidated

### Expected Output:
- Refactored SessionCanvas.razor (< 350 lines)
- Extracted helper methods to separate service
- All tests still passing

**Next Step**: Invoke refactor.prompt.md if you want to improve code quality, or commit as-is.
```

### question → test-generation
[Example from question.prompt.md]
```

---

## Validation

### Success Criteria

1. ✅ task.prompt.md Step 7 simplified to routing logic (~30 lines vs. ~100 lines)
2. ✅ test-generation.prompt.md supports both standalone and routed invocation
3. ✅ Routing response template created
4. ✅ All tests still work when invoked through new pattern
5. ✅ Documentation updated in both prompts

### Testing

1. **Test standalone invocation**:
   ```
   Follow instructions in test-generation.prompt.md.
   key: canvas
   feature: test-consolidation-verification
   scenario: verify routing pattern works
   ```

2. **Test routed invocation** (simulate task.prompt.md routing):
   - Complete a feature implementation
   - Verify routing response is clear
   - Invoke test-generation.prompt.md with routing parameters
   - Verify test is created correctly

3. **Test skipping tests**:
   - Make CSS-only change
   - Verify Step 7.1 correctly identifies no tests needed
   - Verify proceeds to commit

---

## Dependencies

- **action-02-agent-protocols** (2 SP): Routing response format defined there
- Recommend implementing action-02 first for consistent routing pattern

---

## Estimated Timeline

- **Analyze duplication**: 20 minutes
- **Update task.prompt.md Step 7**: 45 minutes
- **Update test-generation.prompt.md**: 30 minutes
- **Create routing template**: 30 minutes
- **Testing**: 45 minutes
- **Documentation**: 20 minutes
- **Commit**: 10 minutes
- **Total**: ~3.5 hours (3 story points)

---

## ROI

**Immediate Benefits**:
- Eliminate ~70 lines of duplicate test generation logic
- Single source of truth for test creation
- Consistent test patterns across all invocations

**Long-Term Benefits**:
- Easier to improve test generation (only one place to update)
- Better separation of concerns (task implements, test-generation tests)
- Clearer agent responsibilities

**Risk Reduction**:
- No more inconsistent test patterns
- No more outdated duplicate logic
- Easier to maintain and extend

---

## Notes

- **Clean Separation**: task.prompt.md focuses on implementation, test-generation.prompt.md focuses on testing
- **User Choice**: Routing response gives user choice to invoke or skip
- **Backward Compatible**: Existing tests don't need to change
- **Pattern for Others**: This routing pattern can be used for task→refactor, task→healthcheck, etc.
