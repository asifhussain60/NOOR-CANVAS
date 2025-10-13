# Execution Plan: [Key Name]

## Task Overview
**Key:** `[key-name]`  
**Mode:** [task | refactor | sync]  
**Complexity:** [Simple | Standard | Complex | Epic]  
**Estimated Duration:** [time estimate]

---

## Objectives
1. Primary objective
2. Secondary objective
3. Additional goals

---

## Prerequisites
- [ ] Checkpoint commit created
- [ ] Dependencies identified
- [ ] Test environment ready
- [ ] Backup/rollback strategy confirmed

---

## Execution Steps

### Phase 1: Analysis
**Duration:** ~X minutes

1. **Step 1.1:** [Description]
   - Action: [What to do]
   - Expected Result: [What should happen]
   - Validation: [How to verify]

2. **Step 1.2:** [Description]
   - Action: [What to do]
   - Expected Result: [What should happen]
   - Validation: [How to verify]

### Phase 2: Implementation
**Duration:** ~X minutes

1. **Step 2.1:** [Description]
   - Files: `path/to/file1.cs`, `path/to/file2.razor`
   - Changes: [Describe changes]
   - Tests: [Tests to run]

2. **Step 2.2:** [Description]
   - Files: `path/to/file3.json`
   - Changes: [Describe changes]
   - Tests: [Tests to run]

### Phase 3: Testing
**Duration:** ~X minutes

1. **Step 3.1:** Run Unit Tests
   ```bash
   dotnet test --filter Category=Unit
   ```

2. **Step 3.2:** Run Integration Tests
   ```bash
   dotnet test --filter Category=Integration
   ```

3. **Step 3.3:** Run Playwright Tests
   ```bash
   npx playwright test
   ```

### Phase 4: Validation
**Duration:** ~X minutes

1. **Step 4.1:** Verify Build
   ```bash
   dotnet build --no-incremental
   ```
   - Expected: Zero errors, zero warnings

2. **Step 4.2:** Verify Analyzers
   - Roslynator: Clean
   - ESLint: Clean
   - Prettier: Clean

3. **Step 4.3:** Manual Verification
   - Test scenario 1: [Description]
   - Test scenario 2: [Description]

---

## Risk Assessment

### High Risk Areas
- **Risk 1:** [Description]
  - Mitigation: [Strategy]
  - Rollback: [Plan]

### Medium Risk Areas
- **Risk 2:** [Description]
  - Mitigation: [Strategy]

### Low Risk Areas
- **Risk 3:** [Description]

---

## Rollback Plan
If execution fails at any point:

1. **Immediate Actions:**
   ```bash
   git reset --hard HEAD~1
   git clean -fd
   ```

2. **Verification:**
   - Confirm application builds
   - Confirm tests pass
   - Verify no data corruption

3. **Post-Rollback:**
   - Document failure reason
   - Update key status to 'failed'
   - Create issue for investigation

---

## Success Criteria
- [ ] All execution steps completed
- [ ] Zero errors, zero warnings
- [ ] All tests passing
- [ ] No analyzer violations
- [ ] Documentation updated
- [ ] Changes committed with proper message
- [ ] Key status updated

---

## Dependencies
- **Upstream:** Keys that must complete before this one
- **Downstream:** Keys that depend on this one
- **External:** External services or resources required

---

## Notes
Additional context, observations, or important information.

---

**Created:** YYYY-MM-DD  
**Plan Approved By:** [Name/Agent]  
**Execution Start:** YYYY-MM-DD HH:MM  
**Execution End:** YYYY-MM-DD HH:MM  
**Status:** [Draft | Approved | In Progress | Complete | Failed]
