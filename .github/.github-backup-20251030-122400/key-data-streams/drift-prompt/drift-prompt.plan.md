# drift-prompt.plan.md

---
**Key**: drift-prompt  
**Branch**: development  
**Created**: 2025-10-25  
**Status**: Completed  
**Plan Version**: v1.0
---

## Executive Summary

**Objective**: Create comprehensive drift management system integrated with existing prompt ecosystem

**Scope**: 
- Transform CopilotChats.txt drift spec into formal drift.prompt.md
- Integrate drift workflow with continue.prompt.md and plan.prompt.md
- Implement auto-commit checkpoints and stack management

**Impact**: Enables multi-threaded workflow management with automatic issue isolation and resolution

**Estimated Effort**: 1-2 hours (completed)

---

## Technology Context

### Framework
- **System**: GitHub Copilot prompt management system
- **Pattern**: Agent mode with YAML frontmatter
- **Storage**: `.github/prompts/` and `.github/prompts.keys/{key}/`
- **Integration**: Shared guidance from `.github/prompts/shared/`

### Current Architecture
- **plan.prompt.md**: Planning agent (request → executable plan)
- **continue.prompt.md**: Extension agent (preserve context, extend work)
- **task.prompt.md**: Execution agent (implement phases)
- **drift.prompt.md**: NEW - Multi-threaded drift management

### Cross-Prompt Intelligence
- **Output style**: Max 15 bullets per `.github/prompts/shared/output-style-mandate.md`
- **Commits**: Checkpoint protocol per `.github/prompts/shared/commit-checkpoint-protocol.md`
- **Key naming**: lowercase-with-dashes, preserve ALL-CAPS

---

## Implementation Plan

### Phase 1: Agent Specification
**Objective**: Define drift.prompt.md agent mode structure

**Actions**:
1. Create YAML frontmatter with metadata
2. Define purpose, inputs, outputs
3. Establish critical rules (15 bullets, auto-commit, max stack 3)
4. Reference shared guidance files

**Files Modified**:
- `.github/prompts/drift.prompt.md`

**Success Criteria**:
- YAML frontmatter complete
- Agent mode clearly defined
- Critical rules stated upfront

---

### Phase 2: Core Protocol Implementation
**Objective**: Implement key-linked drift stack system

**Actions**:
1. **Primary Key Context**
   - Every workflow tracked under unique key
   - Key acts as anchor for all drifts

2. **Drift Creation (Automatic Naming)**
   - No key provided → `drift-{topic-or-timestamp}`
   - Key without "drift-" → `drift-{providedKey}`
   - Key with "drift-" → keep as-is

3. **Stack Management**
   - Max depth: 3 levels
   - Parent-child lineage tracking
   - Push/pop operations on drift resolution

4. **Automatic Drift Detection**
   - Auto-trigger on unrelated issues
   - Register in stack without blocking main work
   - Track dependency chains

5. **Context Integrity**
   - Active key awareness
   - Stack state tracking
   - Restoration rules

6. **Completion Handling**
   - Mark original key complete when stack empty
   - Generate drift summary report
   - Create completion checkpoint commit

**Files Modified**:
- `.github/prompts/drift.prompt.md`

**Success Criteria**:
- All 6 core behaviors documented
- Automatic naming rules clear
- Stack operations defined
- Max depth enforced (3 levels)

---

### Phase 3: Integration with Existing Prompts
**Objective**: Align drift.prompt.md with ecosystem standards

**Actions**:
1. **Align with plan.prompt.md**
   - Follow agent mode pattern
   - Use same output format structure
   - Reference shared guidance

2. **Follow output-style-mandate.md**
   - Max 15 bullets per response
   - 🧠 Analysis (5 bullets)
   - 📌 Summary (10 bullets)
   - 📊 Final (status line)

3. **Implement commit-checkpoint-protocol.md**
   - Drift registration commit format
   - Drift resolution commit format
   - Stack empty commit format

4. **Create Example Workflows**
   - Multi-level drift scenario
   - Resolution sequence
   - Auto-commit checkpoints

5. **Error Handling**
   - Stack corruption recovery
   - Missing parent key handling
   - Circular dependency detection

**Files Modified**:
- `.github/prompts/drift.prompt.md`

**Success Criteria**:
- Output format matches mandate
- Commit protocol documented
- Example workflow clear
- Error handling comprehensive

---

### Phase 4: Continue/Plan Integration
**Objective**: Add drift detection and handoff to continue.prompt.md

**Actions**:
1. **Add Drift Detection Section**
   - Check drift stack on work completion
   - Query git history for drift registrations
   - Identify unresolved drifts

2. **Create Handoff Workflow**
   - Present pending drifts to user
   - Format handoff command for plan.prompt.md
   - Wait for user approval

3. **Drift Resolution Process**
   - Invoke plan.prompt.md with drift key
   - Execute drift work
   - Auto-commit resolution
   - Pop drift from stack
   - Repeat until stack empty

4. **Git Query Commands**
   - Find all drifts for current key
   - Check if drift resolved
   - Count remaining drifts

5. **Update Success Criteria**
   - Add drift stack checking
   - Add pending drift handoff
   - Add auto-commit requirement
   - Add stack depth enforcement

**Files Modified**:
- `.github/prompts/continue.prompt.md`

**Success Criteria**:
- Drift detection on completion
- Handoff to plan.prompt.md documented
- Git queries provided
- Stack enforcement clear

---

## User Decisions

### Auto-commit at drift resolution?
**Decision**: YES
- Create checkpoint commit after each drift resolved
- Format: `ckpt({drift-key}): Resolved - {summary}`

### Priority levels (critical/blocking/info)?
**Decision**: DEFER
- Not implemented in v1.0
- Noted in "Future Enhancements" section
- Keep initial implementation simple

### Max drift stack depth?
**Decision**: 3 levels
- Enforce maximum depth of 3
- Block new drifts if exceeded
- Force resolution of deepest drift first

---

## Testing Plan

### Manual Validation
1. Create test scenario with nested drifts (depth 3)
2. Verify automatic naming rules
3. Test stack push/pop operations
4. Validate auto-commit creation
5. Confirm continue → drift → plan handoff

### Integration Tests
1. Test drift detection on work completion
2. Verify git query commands work
3. Validate handoff command format
4. Test stack overflow handling (depth > 3)

### Documentation Review
1. Check output format compliance (15 bullets max)
2. Verify commit message formats
3. Validate example workflow accuracy
4. Review error handling completeness

---

## Completion Criteria

### Phase 1 ✓
- [x] YAML frontmatter created
- [x] Agent mode defined
- [x] Critical rules established

### Phase 2 ✓
- [x] Primary key context documented
- [x] Automatic naming rules implemented
- [x] Stack management defined (max depth 3)
- [x] Automatic drift detection specified
- [x] Context integrity rules established
- [x] Completion handling documented

### Phase 3 ✓
- [x] Output format aligned with mandate
- [x] Commit protocol implemented
- [x] Example workflow created
- [x] Error handling comprehensive
- [x] Integration with plan.prompt.md confirmed

### Phase 4 ✓
- [x] Drift detection added to continue.prompt.md
- [x] Handoff workflow documented
- [x] Git query commands provided
- [x] Auto-commit enforcement added
- [x] Stack depth validation implemented

---

## Files Created/Modified

### Created
- `.github/prompts/drift.prompt.md` (comprehensive drift agent specification)
- `.github/prompts.keys/drift-prompt/work-log.md` (execution log)
- `.github/prompts.keys/drift-prompt/drift-prompt.plan.md` (this file)

### Modified
- `.github/prompts/continue.prompt.md` (added drift detection and handoff section)

---

## Next Steps (Post-Completion)

1. **Create Git Commit**
   ```
   ckpt(drift-prompt): All phases complete - drift management system implemented
   - Created drift.prompt.md with auto-commit and stack management
   - Integrated drift detection into continue.prompt.md
   - Max stack depth: 3 | Priority levels: deferred
   ```

2. **Test with Real Scenario**
   - Create actual drift during active work
   - Validate automatic naming
   - Test stack operations
   - Verify auto-commits

3. **Update Documentation**
   - Add drift system overview to `Workspaces/Copilot/_DOCS/`
   - Create quick reference guide
   - Document handoff chain: continue → drift → plan

4. **Future Enhancements** (deferred)
   - Implement priority levels (critical/blocking/info)
   - Add timestamp tracking
   - Context memory limits and archiving
   - Drift analytics and reporting

---

## Success Metrics

- ✓ Drift system fully specified in drift.prompt.md
- ✓ Auto-commit protocol implemented
- ✓ Max stack depth enforced (3 levels)
- ✓ Continue.prompt.md drift-aware
- ✓ Handoff to plan.prompt.md documented
- ✓ All user decisions incorporated
- ✓ Integration with existing prompt ecosystem complete
