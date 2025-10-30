# Questionnaire: workspace-cleanup

**Status**: Awaiting Answers  
**Created**: 2025-10-26  
**Plan Version**: v1.0

---

## Instructions

1. **Mark your choice** with an `X` between the brackets: `[X]`
2. **Save the file** after marking answers
3. **Tell agent** "questionnaire complete" or "proceed" to continue

---

## Questions

### Q1: Cleanup Mode Selection

**Why we're asking**: Different cleanup modes balance safety vs. disk space recovery. Your choice determines how aggressive the cleanup will be.

**Options** (mark ONE with X):
- [ ] **A.** Default Mode (Recommended)
  - *Pros*: Safe, preserves debugging info, keeps recent logs, maintains test history
  - *Cons*: Moderate space savings (~100-300MB)
  - *Effort*: Low
  - *Deletes*: Build artifacts, old logs (>7 days), test results except last run

- [ ] **B.** Aggressive Mode
  - *Pros*: Maximum space recovery (~500MB-2GB), complete cleanup
  - *Cons*: Removes all logs, test history, demos - harder to debug recent issues
  - *Effort*: Low
  - *Deletes*: Everything in default mode + all logs, all test results, demo files, archives

- [ ] **C.** Custom Mode (You'll be asked specific questions)
  - *Pros*: Full control over what gets cleaned
  - *Cons*: More decisions to make
  - *Effort*: Medium

**Your Answer**: *(will be extracted after you mark X)*

---

### Q2: Test Results Handling

**Why we're asking**: Test results can accumulate quickly but may be useful for debugging test failures or visual regression analysis.

**Options** (mark ONE with X):
- [ ] **A.** Preserve Last Run Only
  - *Pros*: Can debug most recent test failures, saves space
  - *Cons*: Lose historical test failure context
  - *Effort*: Low

- [ ] **B.** Delete All Test Results
  - *Pros*: Maximum space savings, clean slate
  - *Cons*: Cannot review past test failures or Percy snapshots
  - *Effort*: Low

- [ ] **C.** Keep Last 3 Test Runs
  - *Pros*: Good balance for recent debugging
  - *Cons*: Less space savings
  - *Effort*: Low

**Your Answer**: *(will be extracted after you mark X)*

---

### Q3: Log File Retention

**Why we're asking**: Log files help with debugging but can grow large over time.

**Options** (mark ONE with X):
- [ ] **A.** Keep Logs from Last 7 Days
  - *Pros*: Recent debugging capability maintained
  - *Cons*: Some space used
  - *Effort*: Low

- [ ] **B.** Delete All Logs
  - *Pros*: Maximum space recovery
  - *Cons*: Cannot debug issues from past week
  - *Effort*: Low

- [ ] **C.** Keep Logs from Last 30 Days
  - *Pros*: Extended debugging window
  - *Cons*: More space used
  - *Effort*: Low

**Your Answer**: *(will be extracted after you mark X)*

---

### Q4: Documentation Reorganization

**Why we're asking**: MD files are scattered across the workspace. Organizing them improves discoverability but requires updating references.

**Options** (mark ONE with X):
- [ ] **A.** Full Reorganization (Recommended)
  - *Pros*: Clean structure, easy to find docs, follows best practices
  - *Cons*: Takes time to organize, must update links
  - *Effort*: Medium
  - *Actions*: Move all scattered MD files to Workspaces/Documentation/ with proper categorization

- [ ] **B.** Partial Reorganization (Active Docs Only)
  - *Pros*: Organizes recent work, less link updating
  - *Cons*: Some docs still scattered
  - *Effort*: Low
  - *Actions*: Only move docs from recent CDN work and .github folder

- [ ] **C.** No Reorganization (Clean Only)
  - *Pros*: No link breakage risk
  - *Cons*: Docs remain scattered
  - *Effort*: None
  - *Actions*: Skip documentation organization phase

**Your Answer**: *(will be extracted after you mark X)*

---

### Q5: Demo and Example Files

**Why we're asking**: Files like demo-cdn-image-load.html are useful for testing but not needed in production workspace.

**Options** (mark ONE with X):
- [ ] **A.** Move to Workspaces/Examples/
  - *Pros*: Preserved for reference, organized location
  - *Cons*: Still takes space
  - *Effort*: Low

- [ ] **B.** Delete All Demo Files
  - *Pros*: Clean workspace, space savings
  - *Cons*: Must recreate if needed later
  - *Effort*: Low

- [ ] **C.** Keep Demo Files in Current Location
  - *Pros*: No changes, easy access
  - *Cons*: Workspace clutter
  - *Effort*: None

**Your Answer**: *(will be extracted after you mark X)*

---

### Q6: .github Folder Cleanup

**Why we're asking**: .github should only contain active plans, prompts, and workflows. Completed plans can be archived.

**Options** (mark ONE with X):
- [ ] **A.** Archive Completed Plans (Recommended)
  - *Pros*: Clean .github folder, preserved history in Archive
  - *Cons*: Must navigate to Archive for old plans
  - *Effort*: Low
  - *Actions*: Move completed key-data-streams to Workspaces/Archive/CompletedPlans/

- [ ] **B.** Keep All Plans in .github
  - *Pros*: Easy access to all plans
  - *Cons*: .github folder becomes cluttered
  - *Effort*: None

- [ ] **C.** Delete Completed Plans
  - *Pros*: Maximum cleanup
  - *Cons*: Lose plan history (still in git)
  - *Effort*: Low

**Your Answer**: *(will be extracted after you mark X)*

---

### Q7: Backup Before Cleanup

**Why we're asking**: Creating a backup provides safety net but takes time and space.

**Options** (mark ONE with X):
- [ ] **A.** Create Manifest Only (Recommended)
  - *Pros*: Quick, allows git-based restore, minimal space
  - *Cons*: Cannot restore files not in git
  - *Effort*: Low

- [ ] **B.** Create Full Zip Backup
  - *Pros*: Complete safety, can restore anything
  - *Cons*: Takes time, uses disk space temporarily
  - *Effort*: Medium

- [ ] **C.** No Backup (I trust git)
  - *Pros*: Fastest cleanup
  - *Cons*: Cannot restore non-git files
  - *Effort*: None

**Your Answer**: *(will be extracted after you mark X)*

---

### Q8: Dry Run First

**Why we're asking**: A dry run shows what would be deleted without actually deleting anything.

**Options** (mark ONE with X):
- [ ] **A.** Yes, show me what would be deleted first (Recommended)
  - *Pros*: See impact before committing, catch issues
  - *Cons*: Requires running cleanup twice
  - *Effort*: Low

- [ ] **B.** No, execute cleanup immediately
  - *Pros*: Faster, single execution
  - *Cons*: No preview of changes
  - *Effort*: Low

**Your Answer**: *(will be extracted after you mark X)*

---

## Summary

Once you've marked your answers with `X`, save this file and tell me "questionnaire complete" or "proceed". I'll read your choices and incorporate them into the final cleanup plan and execution script.

**Quick Recommendations for Most Users:**
- Q1: **A** (Default Mode)
- Q2: **A** (Preserve Last Run Only)
- Q3: **A** (Keep Last 7 Days)
- Q4: **A** (Full Reorganization)
- Q5: **A** (Move to Examples)
- Q6: **A** (Archive Completed Plans)
- Q7: **A** (Manifest Only)
- Q8: **A** (Dry Run First)
