# Auto-Drift Detection Implementation Plan

**Version**: 1.1  
**Key**: `auto-drift-detection`  
**Branch**: `development`  
**Created**: 2025-10-25  
**Status**: In Progress

---

## Executive Summary

Implement dual-mode drift detection system:
1. **Agent Auto-Detection**: Silent, non-blocking drift registration during work
2. **User Manual Invocation**: Explicit `@workspace /drift` for user-identified tangents
3. **Unified Resolution**: Both modes feed same drift stack, same resolution protocol via continue.prompt.md

---

## Assumptions Validated

1. @workspace: drift.prompt.md exists with registration/resolution protocol
2. @workspace: continue.prompt.md has drift queue detection for post-completion
3. @workspace: All prompts (plan/task/test-generation/healthcheck) can detect unrelated issues
4. @workspace: User can manually invoke drift for explicit tangent tracking
5. @codebase: Git history supports drift commit pattern queries

---

## Phase 1: Dual-Mode Drift Detection

### 1.1 Update drift.prompt.md

**Add Dual-Mode Support**:
- Document agent auto-detection mode (silent, non-blocking)
- Document user manual invocation mode (explicit, interactive)
- Add severity levels: `critical`, `high`, `medium`, `low`, `informational`
- Add queue limits: max 10 auto-detected drifts per parent key
- Add drift summary generation at completion

**Severity Classification**:
```
critical       - Blocks parent workflow completion (e.g., build-breaking bug)
high           - Significant issue, should resolve before completion
medium         - Notable issue, can defer to post-completion
low            - Minor issue, optional resolution
informational  - Observation only, no action required
```

**Auto-Detection Commit Format**:
```
drift({parent-key}): Register {drift-key} - {description}
Mode: auto | Severity: {level} | Triggered by: {agent-name}
```

**Manual Invocation Commit Format**:
```
drift({parent-key}): Register {drift-key} - {description}
Mode: manual | Severity: {level} | Triggered by: user
```

### 1.2 Update plan.prompt.md

**Add Auto-Drift Detection Section** (after "Evidence and Validation"):
```markdown
## Auto-Drift Detection (MANDATORY)

During planning, if unrelated issues are discovered:

**Detection Triggers**:
- Missing files/dependencies unrelated to current plan
- Architectural inconsistencies in existing code
- Security/performance concerns in reviewed code
- Documentation gaps discovered during evidence gathering

**Auto-Registration**:
FUNCTION PlanDetectDrift(currentKey, issue)
  IF IsUnrelatedToCurrentPlan(issue) THEN
    severity = ClassifyIssueSeverity(issue)
    driftKey = GenerateDriftKey(issue)
    
    RegisterDrift(
      parentKey: currentKey,
      driftKey: driftKey,
      description: issue,
      severity: severity,
      mode: "auto",
      triggeredBy: "plan.prompt.md"
    )
    
    LogSilent("Drift registered: {driftKey} (severity: {severity})")
  END IF
  
  CONTINUE_PLANNING()
END FUNCTION
```

**User Notification** (silent, non-blocking):
- Add to work-log.md: "🔍 Drift detected: {drift-key} (severity: {level})"
- No chat interruption during planning
- Summary presented at plan completion

### 1.3 Update task.prompt.md

**Add Auto-Drift Detection Section** (after "Parameters"):
```markdown
## Auto-Drift Detection (MANDATORY)

During execution, if unrelated issues are discovered:

**Detection Triggers**:
- Build errors unrelated to current phase
- Runtime exceptions in unchanged code
- Test failures in unrelated test suites
- Dependency conflicts discovered during implementation

**Auto-Registration**:
FUNCTION TaskDetectDrift(currentKey, currentPhase, issue)
  IF IsUnrelatedToCurrentPhase(issue) THEN
    severity = ClassifyIssueSeverity(issue)
    
    // Block if critical
    IF severity == "critical" THEN
      PresentUserChoice:
        A. Fix drift now (pause current work)
        B. Register and continue (risk acceptance)
        C. Abort current work
    ELSE
      // Auto-register non-critical
      RegisterDrift(
        parentKey: currentKey,
        driftKey: GenerateDriftKey(issue),
        description: issue,
        severity: severity,
        mode: "auto",
        triggeredBy: "task.prompt.md",
        phase: currentPhase
      )
      
      CONTINUE_EXECUTION()
    END IF
  END IF
END FUNCTION
```

**Critical Drift Handling**:
- `critical` severity blocks execution, requires user decision
- Non-critical drifts queue silently, continue main work

### 1.4 Update test-generation.prompt.md

**Add Auto-Drift Detection Section** (after "Initial Validation"):
```markdown
## Auto-Drift Detection (MANDATORY)

During test generation, if unrelated issues are discovered:

**Detection Triggers**:
- Test infrastructure issues (missing Playwright deps, Percy keys)
- Broken fixtures unrelated to current test scope
- Database schema inconsistencies discovered during test setup
- Existing test failures in unrelated test suites

**Auto-Registration**:
FUNCTION TestGenDetectDrift(currentKey, issue)
  IF IsUnrelatedToCurrentTestScope(issue) THEN
    severity = ClassifyIssueSeverity(issue)
    
    RegisterDrift(
      parentKey: currentKey,
      driftKey: GenerateDriftKey(issue),
      description: issue,
      severity: severity,
      mode: "auto",
      triggeredBy: "test-generation.prompt.md"
    )
    
    LogSilent("Test infrastructure drift: {driftKey}")
  END IF
  
  CONTINUE_TEST_GENERATION()
END FUNCTION
```

### 1.5 Update healthcheck.prompt.md

**Add Auto-Drift Detection Section** (after "Purpose"):
```markdown
## Auto-Drift Detection (MANDATORY)

During validation, if issues are discovered:

**Detection Triggers**:
- Contract mismatches across layers
- Architectural drift from documented patterns
- Missing error handling in unrelated code paths
- Prompt/instruction file inconsistencies

**Auto-Registration**:
FUNCTION HealthcheckDetectDrift(scope, issue)
  // Healthcheck operates on existing key or generates healthcheck-{timestamp}
  parentKey = DetectActiveKey() OR "healthcheck-" + timestamp
  
  severity = ClassifyIssueSeverity(issue)
  
  RegisterDrift(
    parentKey: parentKey,
    driftKey: GenerateDriftKey(issue),
    description: issue,
    severity: severity,
    mode: "auto",
    triggeredBy: "healthcheck.prompt.md",
    scope: scope
  )
  
  CONTINUE_VALIDATION()
END FUNCTION
```

---

## Phase 2: Standardize Drift Registration

### 2.1 Unified Drift Commit Protocol

**Auto-Detection Commit**:
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: auto | Severity: {critical|high|medium|low|informational}
Triggered by: {plan|task|test-generation|healthcheck}.prompt.md
Phase: {current-phase-if-applicable}
```

**Manual Invocation Commit**:
```
drift({parent-key}): Register {drift-key} - {one-line-description}
Mode: manual | Severity: {user-specified or auto-classified}
Triggered by: user
Context: {user-provided-context}
```

**Drift Resolution Commit** (unchanged):
```
ckpt({drift-key}): Resolved - {one-line-summary}
Parent: {parent-key} | Remaining: {count} drifts
```

### 2.2 Queue Overflow Protection

**Max Auto-Detected Drifts**: 10 per parent key

**Overflow Behavior**:
```
IF auto_drift_count >= 10 THEN
  LogWarning("Drift queue full for {parent-key}")
  
  PresentUserChoice:
    A. Pause work and review drift queue
    B. Increase limit to 20 (one-time)
    C. Stop auto-detection for this key
    D. Continue (ignore new drifts)
END IF
```

### 2.3 Drift Summary at Completion

When `continue.prompt.md` detects work completion:

**Drift Summary Format**:
```markdown
## 📋 Drift Summary for {parent-key}

**Total Drifts Detected**: {count}

**By Severity**:
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}
- Informational: {count}

**By Source**:
- plan.prompt.md: {count}
- task.prompt.md: {count}
- test-generation.prompt.md: {count}
- healthcheck.prompt.md: {count}
- user: {count}

**Unresolved Drifts**:
1. {drift-key-1} (severity: {level}) - {description}
2. {drift-key-2} (severity: {level}) - {description}
...

## 🎯 What Would You Like To Do Next?

**A.** Resolve all critical/high drifts now
**B.** Resolve specific drifts (specify keys)
**C.** Defer all to future work
**D.** Mark {parent-key} complete (accept drift risk)
```

---

## Phase 3: Update Cohesion Validation

### 3.1 Add Drift Detection Validation to cohesion.prompt.md

**New Validation Check**: "Drift Auto-Detection Compliance"

```markdown
### 6. Drift Auto-Detection Compliance

**All Prompts Must Include**:
- Auto-drift detection section (after main purpose/parameters)
- Detection trigger definitions
- Auto-registration algorithm (pseudocode)
- Severity classification logic
- Silent logging behavior (no user interruption)

**Execution Agents (task.prompt.md)**:
- Critical drift handling (block execution, present choices)
- Phase context in drift registration

**Planning Agents (plan.prompt.md)**:
- Evidence gathering drift detection
- Architectural inconsistency detection

**Validation Agents (healthcheck.prompt.md)**:
- System-wide issue detection
- Prompt/instruction drift detection

**Test Agents (test-generation.prompt.md)**:
- Test infrastructure drift detection
- Fixture/setup issue detection
```

**Validation Algorithm**:
```
FUNCTION ValidateDriftDetectionCompliance(prompt)
  issues = []
  
  IF NOT HasSection(prompt, "Auto-Drift Detection") THEN
    issues += {
      type: "missing-drift-detection-section",
      severity: HIGH,
      fix: "Add Auto-Drift Detection section after main purpose"
    }
  END IF
  
  IF NOT HasFunction(prompt, "DetectDrift") THEN
    issues += {
      type: "missing-drift-detection-function",
      severity: MEDIUM,
      fix: "Add drift detection algorithm (pseudocode)"
    }
  END IF
  
  IF NOT HasDriftCommitFormat(prompt) THEN
    issues += {
      type: "missing-drift-commit-format",
      severity: HIGH,
      fix: "Document drift commit format with mode/severity"
    }
  END IF
  
  RETURN issues
END FUNCTION
```

### 3.2 Cross-Prompt Drift Protocol Validation

**Validate Drift Stack Integration**:
- `drift.prompt.md` defines dual-mode support ✅
- All prompts reference drift.prompt.md for registration ✅
- `continue.prompt.md` handles drift queue at completion ✅
- Drift commit format consistent across all prompts ✅

**Validate Severity Levels**:
- All prompts use same severity enum ✅
- Critical drifts block execution in task.prompt.md ✅
- Non-critical drifts queue silently ✅

**Validate Queue Limits**:
- Max 10 auto-detected drifts enforced ✅
- Overflow handling present in all prompts ✅

---

## Phase 4: Style "Next Steps" Headers

### 4.1 Update All Prompts

**Replace**: `## 📋 NEXT STEPS` or `**What would you like to do next?**`

**With**: `## 🎯 What Would You Like To Do Next?`

**Files to Update**:
1. plan.prompt.md
2. continue.prompt.md
3. task.prompt.md
4. test-generation.prompt.md
5. healthcheck.prompt.md
6. drift.prompt.md
7. cohesion.prompt.md

**Format Standards**:
```markdown
## 🎯 What Would You Like To Do Next?

**Current Key**: `{key}`

**A.** {Primary action}
**B.** {Secondary action}
**C.** {Tertiary action}
**D.** {Alternative/Cancel action}
```

---

## Exit Criteria

**Phase 1**:
- [ ] drift.prompt.md supports dual-mode (auto + manual)
- [ ] plan.prompt.md has auto-drift detection
- [ ] task.prompt.md has auto-drift detection with critical blocking
- [ ] test-generation.prompt.md has auto-drift detection
- [ ] healthcheck.prompt.md has auto-drift detection
- [ ] All prompts use severity levels

**Phase 2**:
- [ ] Unified commit format documented
- [ ] Queue overflow protection implemented
- [ ] Drift summary format defined
- [ ] continue.prompt.md generates drift summary at completion

**Phase 3**:
- [ ] cohesion.prompt.md validates drift detection compliance
- [ ] Cross-prompt drift protocol validated
- [ ] Severity level consistency validated
- [ ] Queue limit enforcement validated

**Phase 4**:
- [ ] All 7 prompts use styled "Next Steps" header
- [ ] Consistent formatting across all prompts
- [ ] Visual separation from content

---

## Risk Mitigation

**Risk**: Drift queue overflow (too many auto-detected issues)
- **Mitigation**: 10 drift limit per key, overflow handling

**Risk**: Critical drifts ignored during execution
- **Mitigation**: Critical severity blocks task execution, requires user decision

**Risk**: User overwhelmed by drift summary
- **Mitigation**: Group by severity, present high-priority first, allow selective resolution

**Risk**: Inconsistent drift detection across prompts
- **Mitigation**: cohesion.prompt.md validates compliance, shared pseudocode patterns

---

## Testing Plan

**Manual Testing**:
1. Trigger auto-drift detection in plan.prompt.md (discover missing file)
2. Trigger auto-drift detection in task.prompt.md (build error in unrelated code)
3. User manual drift invocation: `@workspace /drift key:main-work description:"Schema issue"`
4. Verify drift queue at completion (continue.prompt.md)
5. Test queue overflow (register 11 drifts)
6. Test critical drift blocking (severity: critical in task.prompt.md)

**Validation Testing**:
1. Run `@workspace /cohesion scope=prompts validation-level=rules`
2. Verify drift detection compliance check passes
3. Verify severity level consistency
4. Verify commit format compliance

---

## Rollback Plan

**If Phase 1 Fails**:
- Revert drift.prompt.md to v1.0
- Remove auto-drift detection sections from prompts
- Keep manual drift invocation only

**If Phase 2 Fails**:
- Fall back to simple drift registration (no severity, no queue limits)
- Manual drift summary generation

**Rollback Command**:
```bash
git log --grep="auto-drift-detection" --format="%h" -1
git revert <commit-sha>
```

---

## Success Metrics

- ✅ All 5 prompts have auto-drift detection (plan, task, test-generation, healthcheck, drift)
- ✅ Drift queue overflow protection works (max 10 limit enforced)
- ✅ Critical drifts block execution, require user decision
- ✅ Drift summary generated at completion with severity breakdown
- ✅ cohesion.prompt.md validates drift compliance
- ✅ All prompts use styled "Next Steps" header
- ✅ Zero false positives (issues correctly classified as drift vs current work)
- ✅ User can manually invoke drift for explicit tracking

---

## Documentation Updates

**Files to Update**:
- `.github/prompts/shared/agent-handoff-protocol.md` - Add drift detection protocol
- `.github/prompts/shared/commit-message-format.md` - Add drift commit formats
- `.github/instructions/SelfAwareness.instructions.md` - Reference drift auto-detection

---

## Version History

- **v1.0** (2025-10-25): Initial plan created
- **v1.1** (2025-10-25): Added severity levels, queue limits, drift summary
