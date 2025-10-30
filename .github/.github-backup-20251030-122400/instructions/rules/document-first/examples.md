# Examples: Document First

## ✅ Compliant Examples

### Example 1: New Feature Session (Correct Workflow)

**Context:** Starting work on share asset feature

**Compliant Workflow:**

**Step 1 - Update work-log.md:**
```markdown
## Session: 2025-10-30 (Share Asset Feature)

**Action:** Adding share link generation to AssetProcessingService  
**Status:** Phase 2 - Implementation  
**Context:** Enable users to create shareable links with expiry

**Objective:**
Implement ShareAsset method with link generation, expiry validation, and database persistence.

**Next:** Implement ShareAsset method
```

**Step 2 - Commit documentation:**
```bash
git add .github/key-data-streams/table-asset-enhancement/work-log.md
git commit -m "doc(table-asset-enhancement): Add session for share asset feature"
```

**Step 3 - Implement code:**
```csharp
// AssetProcessingService.cs
public async Task<Result<ShareLink>> ShareAsset(string shareId, string assetType)
{
    // Implementation...
}
```

**Step 4 - Commit code:**
```bash
git add SPA/NoorCanvas/Services/AssetProcessingService.cs
git commit -m "task(table-asset-enhancement): Implement ShareAsset method"
```

**Why Compliant:**
- Documentation commit BEFORE code commit
- work-log.md updated with session details
- Clear git history: doc → code

---

### Example 2: Bug Fix Session (Correct Workflow)

**Context:** Fixing null reference bug in share validation

**Compliant Workflow:**

**Step 1 - Document bug and fix approach:**
```markdown
## Session: 2025-10-30 (Bug Fix - Null ShareId)

**Action:** Fixing null reference exception in ShareAsset validation  
**Status:** Debugging  
**Issue:** ShareAsset throws NullReferenceException when shareId is null

**Root Cause:** Missing null check before validation logic

**Fix Approach:**
1. Add null/empty check at method entry
2. Return error result if invalid
3. Add unit test for null input

**Testing:** Run existing share asset tests + new null test
```

**Step 2 - Commit documentation:**
```bash
git commit -m "doc(table-asset-enhancement): Document null shareId bug fix"
```

**Step 3 - Implement fix and tests**

**Step 4 - Commit code:**
```bash
git commit -m "task(table-asset-enhancement): Fix null shareId validation + tests"
```

**Why Compliant:**
- Bug documented before fix
- Root cause and approach captured
- Testing plan included

---

### Example 3: Multi-Phase Session (Plan Update)

**Context:** Moving to Phase 3 of implementation plan

**Compliant Workflow:**

**Step 1 - Update work-log.md:**
```markdown
## Session: 2025-10-30 (Phase 3 - UI Integration)

**Action:** Integrating ShareAsset into UI components  
**Status:** Phase 3 - UI Integration  
**Context:** Backend complete, now adding UI controls

**Plan:**
- Add share button to AssetTable component
- Wire OnClick handler
- Show success/error notifications

**Next:** Update AssetTable.razor
```

**Step 2 - Update plan file (mark Phase 3 in-progress):**
```markdown
## Phase 3: UI Integration ⏳

**Status:** in-progress  
**Started:** 2025-10-30

**Tasks:**
- [ ] Add share button to AssetTable
- [ ] Implement OnClick handler
- [ ] Add notification system
```

**Step 3 - Commit documentation:**
```bash
git add .github/key-data-streams/table-asset-enhancement/work-log.md
git add .github/key-data-streams/table-asset-enhancement/table-asset-enhancement.plan.md
git commit -m "doc(table-asset-enhancement): Start Phase 3 - UI Integration"
```

**Step 4 - Implement UI changes**

**Why Compliant:**
- Both work-log AND plan updated
- Phase transition documented
- Documentation committed before UI code

---

## ❌ Non-Compliant Examples

### Example 1: Code Committed First (VIOLATION)

**Context:** Implementing share feature

**Violation:**

**Step 1 - Implement code:**
```csharp
// AssetProcessingService.cs
public async Task<Result<ShareLink>> ShareAsset(string shareId, string assetType)
{
    // Implementation...
}
```

**Step 2 - Commit code:**
```bash
git commit -m "task(table-asset-enhancement): Implement ShareAsset method"
```

**Step 3 - Update work-log.md (AFTER code):**
```markdown
## Session: 2025-10-30 (Share Asset Feature)

**Action:** Added ShareAsset method
```

**Step 4 - Commit documentation:**
```bash
git commit -m "doc(table-asset-enhancement): Update work-log"
```

**Why Non-Compliant:**
- Code committed BEFORE documentation
- Violates document-first principle
- Git history shows: code → doc (wrong order)

**Validation Result:**
```json
{
  "violation": true,
  "type": "CODE_BEFORE_DOCS",
  "lastDoc": "2025-10-30 15:45:00",
  "lastCode": "2025-10-30 15:30:00",
  "message": "Code committed BEFORE documentation update"
}
```

**Fix:**
Create retroactive documentation entry:
```bash
# Update work-log.md with retroactive session entry
git add work-log.md
git commit -m "doc(table-asset-enhancement): Retroactive session documentation"
```

---

### Example 2: Stale work-log.md (VIOLATION)

**Context:** Continuing work after break

**Violation:**

**Last work-log.md update:** 2025-10-30 10:00 AM

**Current time:** 2025-10-30 3:00 PM (5 hours later)

**Action:** Start implementing new feature without updating work-log

**Why Non-Compliant:**
- work-log.md not updated in current session (>5 minutes threshold)
- No documentation of current work
- Crash recovery impossible

**Validation Result:**
```json
{
  "violation": true,
  "type": "STALE_WORKLOG",
  "lastModified": "2025-10-30 10:00:00",
  "currentTime": "2025-10-30 15:00:00",
  "message": "work-log.md not updated in this session"
}
```

**Fix:**
Update work-log.md with current session:
```markdown
## Session: 2025-10-30 (Afternoon - Continued Development)

**Action:** Continuing share asset feature (UI integration)  
**Status:** Phase 3 - UI Integration  
**Previous Session:** 2025-10-30 AM - Completed backend implementation

**Today's Focus:**
- Add share button to UI
- Wire event handlers

**Next:** Update AssetTable.razor
```

---

### Example 3: Missing work-log.md (VIOLATION)

**Context:** New key created, code committed without work-log

**Violation:**

**Key folder created:** `.github/key-data-streams/new-feature/`

**Files:**
- `new-feature.plan.md` ✅
- `state.json` ✅
- `work-log.md` ❌ MISSING

**Code committed:**
```bash
git commit -m "task(new-feature): Implement core functionality"
```

**Why Non-Compliant:**
- work-log.md required but missing
- No session documentation
- Violates KDS structure requirements

**Validation Result:**
```json
{
  "violation": true,
  "type": "MISSING_WORKLOG",
  "message": "work-log.md does not exist for key"
}
```

**Fix:**
Create work-log.md with initial session:
```markdown
# Work Log: new-feature

## Session: 2025-10-30 (Initial Implementation)

**Action:** Implementing core functionality for new feature  
**Status:** Phase 1 - Implementation  
**Context:** Created new key for feature development

**Work Done:**
- Created plan file
- Implemented core functionality
- Committed initial code

**Next:** Continue implementation
```

---

### Example 4: Documentation Commit Failed, Code Committed Anyway (VIOLATION)

**Context:** Git merge conflict in work-log.md

**Violation:**

**Step 1 - Try to commit documentation:**
```bash
git add work-log.md
git commit -m "doc(feature): Update session"
# CONFLICT: Merge conflict in work-log.md
```

**Step 2 - Ignore conflict, commit code anyway:**
```bash
git add Services/MyService.cs
git commit -m "task(feature): Implement functionality"
# SUCCESS
```

**Why Non-Compliant:**
- Documentation commit failed (conflict)
- Code committed anyway
- Violates "HALT if documentation fails"

**Correct Approach:**
1. HALT code work
2. Resolve merge conflict in work-log.md
3. Commit documentation
4. THEN proceed with code

```bash
# Fix conflict
# Edit work-log.md, resolve conflict markers
git add work-log.md
git commit -m "doc(feature): Update session (resolve conflict)"

# NOW commit code
git add Services/MyService.cs
git commit -m "task(feature): Implement functionality"
```

---

## 🔍 Edge Cases

### Edge Case 1: Documentation-Only Session

**Situation:**
Session only updates documentation (no code changes).

**Decision:**
COMPLIANT - No code means no violation.

**Rationale:**
Document-first applies to code implementation. Documentation-only work doesn't trigger rule.

**Example:**
```markdown
## Session: 2025-10-30 (Documentation Update)

**Action:** Updating plan file with Phase 4 details  
**Status:** Planning

(No code commits in this session)
```

---

### Edge Case 2: Multiple Code Commits, One Doc Commit

**Situation:**
One documentation commit, followed by multiple related code commits in quick succession.

**Decision:**
COMPLIANT (if all code commits after doc commit).

**Rationale:**
Documentation established intent. Multiple code commits implementing that intent is acceptable.

**Example:**
```bash
# 1. Document session
git commit -m "doc(feature): Add session for multi-file refactor"

# 2-5. Multiple code commits (all valid)
git commit -m "task(feature): Refactor Service A"
git commit -m "task(feature): Refactor Service B"
git commit -m "task(feature): Update unit tests"
git commit -m "ckpt(feature): Complete refactor checkpoint"
```

---

### Edge Case 3: Hotfix Without KDS

**Situation:**
Critical production bug fix needed immediately. No time for full KDS workflow?

**Decision:**
STILL REQUIRED - Document first, even for hotfixes.

**Rationale:**
Hotfixes need documentation MORE than features (for post-mortem, rollback).

**Fast Workflow:**
```bash
# 1. Minimal work-log entry (30 seconds)
echo "## Session: {date} (HOTFIX - {issue})" >> work-log.md
echo "**Action:** Fixing {bug}" >> work-log.md
git commit -m "doc(hotfix): Emergency fix for {issue}"

# 2. Fix code
git commit -m "task(hotfix): Fix {issue}"

# 3. Update work-log with details (after deployment)
```

---

### Edge Case 4: Retroactive Documentation (Code Already Committed)

**Situation:**
Code committed before documentation (violation detected after fact).

**Decision:**
VIOLATION - But recoverable.

**Rationale:**
Violation occurred, but can be fixed retroactively.

**Recovery Workflow:**
```markdown
## Session: 2025-10-30 (Retroactive Documentation)

**Action:** Documenting previously committed work  
**Status:** Documentation catch-up  
**Context:** Code committed on 2025-10-29 without documentation

**Work Committed (Retroactive):**
- Implemented ShareAsset method (commit abc123)
- Added validation logic (commit def456)
- Updated UI (commit ghi789)

**Lessons Learned:** Document before coding
```

```bash
git commit -m "doc(feature): Retroactive session documentation"
```

---

## 📊 Common Patterns

### Pattern 1: Standard Session Start

**When to Use:**
Starting any work session.

**How to Apply:**
1. Open work-log.md
2. Add session header with date
3. Fill in action, status, context
4. Commit before ANY code changes

**Example:**
```markdown
## Session: 2025-10-30 ({session-name})

**Action:** {what-you're-doing}  
**Status:** {phase/step}  
**Context:** {why-needed}

**Next:** {next-action}
```

```bash
git add work-log.md
git commit -m "doc({key}): Start session - {session-name}"
```

---

### Pattern 2: Phase Transition

**When to Use:**
Moving from one plan phase to another.

**How to Apply:**
1. Update work-log.md with new session
2. Update plan.md (mark old phase complete, new phase in-progress)
3. Commit both files
4. Proceed with phase implementation

**Example:**
```markdown
# work-log.md
## Session: 2025-10-30 (Phase 3 Start)

**Action:** Starting Phase 3 - UI Integration  
**Status:** Phase 3 - In Progress  
**Context:** Backend complete, moving to UI

# plan.md
## Phase 2: Backend Implementation ✅
**Status:** completed

## Phase 3: UI Integration ⏳
**Status:** in-progress  
**Started:** 2025-10-30
```

```bash
git add work-log.md {key}.plan.md
git commit -m "doc({key}): Start Phase 3 - UI Integration"
```

---

### Pattern 3: Bug Fix Documentation

**When to Use:**
Fixing bugs (not planned features).

**How to Apply:**
1. Document bug symptoms
2. Document root cause (if known)
3. Document fix approach
4. Commit
5. Implement fix
6. Update work-log with outcome

**Example:**
```markdown
## Session: 2025-10-30 (Bug Fix - {issue})

**Action:** Fixing {bug-description}  
**Issue:** {symptoms}  
**Root Cause:** {identified-cause}

**Fix Approach:**
1. {step}
2. {step}

**Next:** Implement fix
```

```bash
git commit -m "doc({key}): Document bug fix for {issue}"
# ... implement fix ...
git commit -m "task({key}): Fix {issue}"
```

---

### Pattern 4: Completion Session

**When to Use:**
Finishing a phase, key, or feature.

**How to Apply:**
1. Update work-log.md with completion summary
2. Mark phase/key complete in plan
3. Commit documentation
4. Finalize code (if any remaining)
5. Create completion report (if end of key)

**Example:**
```markdown
## Session: 2025-10-30 (Completion - Share Asset Feature)

**Action:** Completing share asset implementation  
**Status:** Complete

**Deliverables:**
- ✅ ShareAsset method (backend)
- ✅ Share button (UI)
- ✅ Unit tests
- ✅ Integration tests

**Outcome:** Users can now create shareable links with expiry

**Next Steps:** None (feature complete)
```

```bash
git commit -m "doc({key}): Complete share asset feature"
```
