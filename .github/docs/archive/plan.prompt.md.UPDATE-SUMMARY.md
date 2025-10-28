# Plan.prompt.md Update Summary

**Date**: 2025-10-27  
**Purpose**: Implement "write-first, iterate-continuously" workflow for plan.prompt.md

---

## 🎯 Key Changes

### 1. Paradigm Shift: Write Plan Files BEFORE User Interaction

**BEFORE (old workflow)**:
1. Generate draft in chat (30-50 lines)
2. Show draft to user
3. User approves
4. **THEN** write files to `.github/key-data-streams/{key}/`

**AFTER (new workflow)**:
1. Generate complete plan internally
2. **IMMEDIATELY** write files to `.github/key-data-streams/{key}/`
3. Show concise summary to user (≤100 lines)
4. User reviews/modifies → **UPDATE** files continuously
5. User approves → finalize plan

---

## 📝 Step Sequence Changes

### Updated Process Section

**New Step Flow**:
- **Step 0.0**: Key Data Stream Consultation (unchanged)
- **Step 0.1**: Validate key spelling/detection (unchanged)
- **Step 1**: Generate Plan Content (internal, not shown yet)
- **Step 1.5**: **Write Initial Plan Files** ← NEW - write v1.0 BEFORE user sees anything
- **Step 1.6**: Questionnaire Generation (if needed)
- **Step 1.75**: Show Concise Summary to User (≤100 lines)
- **Step 2**: User Review/Modification Loop
- **Step 2.5**: **Continuous Plan Updates** ← NEW - update files on EVERY modification
- **Step 2.75**: Read Questionnaire Answers (if applicable)
- **Step 3**: Finalize Approved Plan (status change: Draft → Approved)
- **Step 4**: Generate Auto-Execution Handoff (unchanged)
- **Step 4.5**: Update Indexes (unchanged)
- **Step 6**: Cleanup Phase (if applicable)
- **Step 7**: STOP and Present Key (unchanged)

---

## 🔄 Version Tracking System

### Plan File Version Header

**Every {key}.plan.md now includes**:
```markdown
# Plan: {key}
**Version**: 1.0
**Status**: Draft
**Created**: 2025-10-27 10:30:00
**Last Updated**: 2025-10-27 10:30:00
```

### Version Increment Rules

**Minor Changes** (1.0 → 1.1 → 1.2):
- Add/modify/remove phases
- Update test specifications
- Change file lists
- Modify enhancement recommendations

**Major Changes** (1.5 → 2.0):
- User approval (Draft → Approved)
- Complete plan restructure
- Approach pivot

---

## 🔒 New Step 2.5: Continuous Plan Update Algorithm

**Purpose**: Keep {key}.plan.md synchronized with user's iterative refinements

**Triggers**:
- User says "add {X}"
- User says "change {Y}"
- User says "remove {Z}"
- User says "make it {description}"

**Algorithm**:
1. Load current plan from `.github/key-data-streams/{key}/{key}.plan.md`
2. Extract current version (e.g., "1.0", "1.1")
3. Apply modification to plan content
4. Increment version (1.0 → 1.1)
5. Update version header and timestamp
6. Write updated plan to file
7. Append change entry to work-log.md
8. Update tracking JSON
9. Show concise summary to user (≤20 lines)
10. Return to Step 2 (User Review Loop)

**Benefits**:
- ✅ Complete audit trail in work-log.md
- ✅ Version history tracks every change
- ✅ {key}.plan.md always reflects latest state
- ✅ User sees updates immediately
- ✅ Resume-friendly for new chat sessions

---

## 🚀 Resume Work in New Chat Session

### New Feature: "continue with {key}"

**User Command Patterns**:
- "continue with {key}"
- "resume {key}"
- "load plan {key}"
- "@workspace /plan key:{key}" (without additional request)

**Behavior**:
1. Load complete plan from `.github/key-data-streams/{key}/{key}.plan.md`
2. Load execution history from `work-log.md`
3. Load tracking metadata from `{key}.plan.json`
4. Present context summary (≤20 lines):
   - Plan version and status
   - Current phase and progress
   - Completed phases (first 3)
   - Remaining phases (first 3)
   - Files modified and tests count
5. Offer options:
   - **A.** Continue execution
   - **B.** Modify plan
   - **C.** Review plan details
   - **D.** Mark complete

**Integration with todo.prompt.md**:
- Auto-detects whether work is in planning or execution phase
- Routes to appropriate agent (plan vs. task)
- Preserves complete context across chat sessions

---

## 📋 Updated Critical Rules

**New Rules** (added to existing 6):
1. MAX 15 bullets per response (unchanged)
2. **WRITE {key}.plan.md v1.0 FIRST** ← NEW - document plan BEFORE showing to user
3. **Show concise summary** in chat (max 100 lines) ← MODIFIED - NOT full plan content
4. **Update {key}.plan.md continuously** ← NEW - increment version on each modification
5. Present handoff command (unchanged)
6. NO execution - planning only (unchanged)
7. Pseudocode preferred (unchanged)
8. **Enable resume in new chat** ← NEW - user can say "continue with {key}"

---

## 🚨 Updated OUTPUT ENFORCEMENT CHECKPOINT

**Key Changes**:
1. **Paradigm Shift**: Write plan files FIRST, then show summary to user
2. **Step 1.5**: Write initial plan files BEFORE user sees anything
3. **Step 1.75**: Show concise summary (≤100 lines) in chat
4. **Step 2.5**: Update files on EVERY user modification
5. **Version Tracking**: Every modification increments version number

**Self-Check Questions**:
- ✅ Files written BEFORE user interaction?
- ✅ Version tracked in plan header?
- ✅ Summary ≤100 lines in chat?
- ✅ work-log.md updated with change entry?

---

## 📊 File Structure Changes

### Files Created in Step 1.5 (BEFORE user sees plan)

**BEFORE**: No files created until Step 3 (after user approval)

**AFTER**: All files created in Step 1.5 (before user sees summary)
1. `.github/key-data-streams/{key}/{key}.plan.md` v1.0 (FULL technical details)
2. `.github/key-data-streams/{key}/{key}.plan.json` (tracking metadata)
3. `.github/key-data-streams/{key}/work-log.md` (initialization entry)
4. `.github/key-data-streams/{key}/tests/test-registry.md` (test structure)

### Files Updated in Step 2.5 (on EVERY modification)

1. **{key}.plan.md**: Version incremented, content modified, timestamp updated
2. **work-log.md**: Change entry appended
3. **{key}.plan.json**: Version and modification history updated

---

## 🎯 Benefits of New Workflow

### For Users
✅ **Zero context loss** - Plan documented immediately, no risk of losing work  
✅ **Session independence** - Resume work in new chat with "continue with {key}"  
✅ **Transparent iteration** - See updates as they happen  
✅ **Complete audit trail** - Every modification tracked in work-log.md  
✅ **Concise chat** - Only see summaries, full details in files

### For Agents
✅ **Consistent state** - {key}.plan.md always reflects current plan  
✅ **Version tracking** - Know exactly which version user is reviewing  
✅ **Resume capability** - Load complete context from files in new session  
✅ **Atomic updates** - Each modification is self-contained  
✅ **Drift-friendly** - Can pause/resume without losing context

### For Development Workflow
✅ **Git-friendly** - Can commit plan evolution if desired  
✅ **Review-friendly** - Reviewers see complete version history  
✅ **Rollback-friendly** - Can revert to any previous version  
✅ **Multi-agent friendly** - Other agents can read latest plan state  
✅ **CI/CD friendly** - Plan files available for automation

---

## 🔧 Implementation Details

### Version Header Template

```markdown
# Plan: {key}
**Version**: 1.0
**Status**: Draft | Approved | In Progress | Complete
**Created**: 2025-10-27 10:30:00
**Last Updated**: 2025-10-27 10:30:00

---

## Purpose
{one-paragraph-description}

## Phases
...
```

### Work-Log Entry Template

```markdown
## v1.1 - Added Phase 4 - Accessibility Validation
**Timestamp**: 2025-10-27 14:15:00
**Requested by**: User (during plan review)
**Changes**: Added new phase after UI implementation to validate accessibility with axe-core tests, ARIA labels, and keyboard navigation.
```

### Tracking JSON Structure

```json
{
  "key": "ui-refresh",
  "version": "1.1",
  "status": "Draft",
  "created": "2025-10-27T10:30:00Z",
  "lastUpdated": "2025-10-27T14:15:00Z",
  "modifications": [
    {
      "version": "1.1",
      "type": "add",
      "summary": "Added Phase 4 - Accessibility Validation",
      "timestamp": "2025-10-27T14:15:00Z"
    }
  ],
  "phases": {
    "total": 4,
    "completed": 0,
    "current": null
  },
  "files": {
    "toModify": [],
    "modified": []
  },
  "tests": {
    "total": 0,
    "passed": 0,
    "failed": 0
  }
}
```

---

## 🔄 Integration with Other Prompts

### todo.prompt.md
- When user says "continue with {key}" in todo context:
  - Load plan from {key}.plan.md
  - Determine if planning or execution phase
  - Route to appropriate agent

### task.prompt.md
- Reads approved plan from {key}.plan.md
- Uses version number to track plan evolution
- Can detect if plan changed during execution

### drift.prompt.md
- Registers drifts in work-log.md
- Reads current plan version
- Can spawn new plans without losing parent context

### test-generation.prompt.md
- Reads test specifications from {key}.plan.md
- Uses version number to track test spec evolution
- Updates test registry continuously

---

## 📚 Documentation Updates Required

### Files Modified
- ✅ `plan.prompt.md` - Complete rewrite of workflow steps
- 🔄 `todo.prompt.md` - Add resume capability documentation (already compatible)
- 🔄 `task.prompt.md` - Document version-aware plan reading (future enhancement)
- 🔄 `test-generation.prompt.md` - Document version-aware test spec reading (future enhancement)

### Files to Create (Future)
- `.github/prompts/shared/plan-versioning-protocol.md` - Standardize version tracking
- `.github/prompts/shared/plan-file-structure.md` - Document file format requirements
- `.github/prompts/shared/resume-work-protocol.md` - Standardize "continue with {key}" behavior

---

## ✅ Verification Checklist

**For plan.prompt.md implementer (agent or human)**:

- [x] Critical Rules updated with new workflow
- [x] OUTPUT ENFORCEMENT CHECKPOINT rewritten
- [x] Process section completely rewritten with new step sequence
- [x] Step 1.5 added (Write Initial Plan Files)
- [x] Step 2.5 added (Continuous Plan Updates) with full algorithm
- [x] Step 1.75 renamed (Show Concise Summary)
- [x] Version tracking system documented
- [x] Resume capability added ("continue with {key}")
- [x] Integration with todo.prompt.md documented
- [x] Version header template provided
- [x] Work-log entry format specified
- [x] Tracking JSON structure defined
- [x] Benefits section added
- [x] Examples provided for version updates

---

## 🚀 Next Steps

### For plan.prompt.md Agent
When invoked by user:
1. ✅ **Step 0.0**: Consult key data stream
2. ✅ **Step 0.1**: Validate key spelling
3. ✅ **Step 1**: Generate plan internally
4. ✅ **Step 1.5**: **WRITE FILES** (v1.0)
5. ✅ **Step 1.75**: Show summary (≤100 lines)
6. ⏸️ **Step 2**: Wait for user review
7. 🔄 **Step 2.5**: Update files on modifications (loop until approved)
8. ✅ **Step 3**: Finalize (Draft → Approved)
9. ✅ **Step 4**: Generate execute-plan.ps1
10. ✅ **Step 4.5**: Update indexes
11. ✅ **Step 7**: STOP and present key

### For Users
- Use "continue with {key}" to resume work in new chat
- Expect plan files to be created immediately
- Receive concise summaries in chat (≤100 lines)
- See version increments on each modification
- Review full plan in `.github/key-data-streams/{key}/{key}.plan.md`

### For Future Enhancements
- Add plan diff visualization (show changes between versions)
- Implement plan rollback ("revert to v1.2")
- Add plan branching (experimental versions)
- Create plan comparison tool (compare two versions)
- Integrate with git for automatic plan commits

---

**End of Summary**
