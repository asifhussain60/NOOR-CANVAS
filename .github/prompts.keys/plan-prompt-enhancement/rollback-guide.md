# Rollback Guide - plan-prompt-enhancement

**Purpose**: Consolidated rollback instructions for all phases with safety checks

**Key**: plan-prompt-enhancement  
**Last Updated**: 2025-10-20

---

## Quick Reference

| Phase | Checkpoint Tag | Rollback Command |
|-------|---------------|------------------|
| Phase 1 | `checkpoint/plan-prompt-enhancement/20251020-000000` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-000000` |
| Phase 2 | `checkpoint/plan-prompt-enhancement/20251020-001500` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-001500` |
| Phase 3 | `checkpoint/plan-prompt-enhancement/20251020-004500` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-004500` |
| Phase 4 | `checkpoint/plan-prompt-enhancement/20251020-010000` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-010000` |
| Phase 5 | `checkpoint/plan-prompt-enhancement/20251020-011500` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-011500` |
| Phase 6 | `checkpoint/plan-prompt-enhancement/20251020-013000` | `git reset --hard checkpoint/plan-prompt-enhancement/20251020-013000` |

---

## Safety Checklist (Run BEFORE Rollback)

### 1. Verify Current State
```powershell
# Check current branch
git branch --show-current
# Expected: development

# Check current commit
git log -1 --oneline
# Shows: current commit SHA and message

# Check for uncommitted changes
git status
# Should show: clean working tree OR list of uncommitted files
```

### 2. Backup Uncommitted Changes (if any)
```powershell
# Stash uncommitted changes
git stash push -m "Backup before rollback to Phase X"

# Verify stash created
git stash list
# Should show: stash@{0}: On development: Backup before rollback to Phase X
```

### 3. Verify Checkpoint Exists
```powershell
# List all checkpoints for this key
git tag -l "checkpoint/plan-prompt-enhancement/*"

# Verify specific checkpoint exists
git tag -l "checkpoint/plan-prompt-enhancement/20251020-XXXXXX"
# Should show: checkpoint/plan-prompt-enhancement/20251020-XXXXXX
```

---

## Rollback Procedures

### Rollback to Phase 1

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-000000`  
**Commit**: `6d793292`

**What This Includes**:
- github-branch parameter added
- Enhanced Step 0.5 (technology stack discovery, architecture layer detection)
- Cross-key dependency scanner
- {key}.plan.md template structure
- Updated work-log.md template

**What This REMOVES** (if rolling back from later phase):
- Phase 2: Phase breakdown algorithm, enhancement recommendations, JSON tracking
- Phase 3: Test generation integration, orchestration library
- Phase 4: Progress tracking, dependency validation
- Phase 5: Final validation, breakage detection
- Phase 6: Documentation artifacts

**Rollback Command**:
```powershell
# Safety checks first (see above)
git branch --show-current  # Verify: development
git status                  # Check for uncommitted changes
git stash push -m "Backup before rollback to Phase 1"  # If needed

# Rollback
git reset --hard checkpoint/plan-prompt-enhancement/20251020-000000

# Verify
git log -1 --oneline
# Should show: 6d793292 [plan-prompt-enhancement] Phase 1: Parameter Enhancement...
```

---

### Rollback to Phase 2

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-001500`  
**Commit**: `0791c0eb`

**What This Includes**:
- Everything from Phase 1
- Phase breakdown algorithm (6-step process)
- Intelligent enhancement recommendation system (5 analysis criteria)
- JSON tracking structure ({key}.plan.json schema)

**What This REMOVES** (if rolling back from later phase):
- Phase 3: Test generation integration, orchestration library
- Phase 4: Progress tracking, dependency validation
- Phase 5: Final validation, breakage detection
- Phase 6: Documentation artifacts

**Rollback Command**:
```powershell
# Safety checks first
git branch --show-current
git status
git stash push -m "Backup before rollback to Phase 2"  # If needed

# Rollback
git reset --hard checkpoint/plan-prompt-enhancement/20251020-001500

# Verify
git log -1 --oneline
# Should show: 0791c0eb [plan-prompt-enhancement] Phase 2: {key}.plan.md Document...
```

---

### Rollback to Phase 3

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-004500`  
**Commit**: `c15cd04a`

**What This Includes**:
- Everything from Phases 1-2
- Test type decision matrix
- Orchestration script generation with shared library
- Enhancement D: Automated test selector strategy
- Enhancement E: Percy baseline management
- Enhancement B: Test flakiness detection
- Browser log validation strategy

**What This REMOVES** (if rolling back from later phase):
- Phase 4: Progress tracking, dependency validation
- Phase 5: Final validation, breakage detection
- Phase 6: Documentation artifacts

**Rollback Command**:
```powershell
# Safety checks first
git branch --show-current
git status
git stash push -m "Backup before rollback to Phase 3"  # If needed

# Rollback
git reset --hard checkpoint/plan-prompt-enhancement/20251020-004500

# Verify
git log -1 --oneline
# Should show: c15cd04a [plan-prompt-enhancement] Phase 3: Test Generation Integration...
```

---

### Rollback to Phase 4

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-010000`  
**Commit**: `75771f43`

**What This Includes**:
- Everything from Phases 1-3
- Dynamic progress tracker template (comprehensive checklist)
- Phase completion verification protocol (7-step quality gates)
- Phase dependency validation protocol (4-step prerequisite checks)
- Enhanced approval gate & sequential execution

**What This REMOVES** (if rolling back from later phase):
- Phase 5: Final validation, breakage detection
- Phase 6: Documentation artifacts

**Rollback Command**:
```powershell
# Safety checks first
git branch --show-current
git status
git stash push -m "Backup before rollback to Phase 4"  # If needed

# Rollback
git reset --hard checkpoint/plan-prompt-enhancement/20251020-010000

# Verify
git log -1 --oneline
# Should show: 75771f43 [plan-prompt-enhancement] Phase 4: Progress Tracking...
```

---

### Rollback to Phase 5

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-011500`  
**Commit**: `ada82013`

**What This Includes**:
- Everything from Phases 1-4
- Incremental breakage detection (3x isolation tests)
- Percy visual regression tracking (phase-specific baselines)
- Flakiness summary report (aggregate data with recommendations)
- Final validation phase template
- Enhanced master orchestration script

**What This REMOVES** (if rolling back from later phase):
- Phase 6: Documentation artifacts

**Rollback Command**:
```powershell
# Safety checks first
git branch --show-current
git status
git stash push -m "Backup before rollback to Phase 5"  # If needed

# Rollback
git reset --hard checkpoint/plan-prompt-enhancement/20251020-011500

# Verify
git log -1 --oneline
# Should show: ada82013 [plan-prompt-enhancement] Phase 5: Final Validation...
```

---

### Rollback to Phase 6 (Current/Complete State)

**Checkpoint**: `checkpoint/plan-prompt-enhancement/20251020-013000`  
**Commit**: `[pending]`

**What This Includes**:
- Everything from Phases 1-5
- User-facing implementation summary
- Testing guidelines document
- Rollback guide (this document)
- Interactive preview mode guide
- Cross-key analysis report
- Test results archive

**Rollback Command**:
```powershell
# This is the complete state - rollback not typically needed
# However, if you've made changes after Phase 6:

git reset --hard checkpoint/plan-prompt-enhancement/20251020-013000

# Verify
git log -1 --oneline
# Should show: [SHA] [plan-prompt-enhancement] Phase 6: Documentation...
```

---

## Recovery Procedures

### Recover Stashed Changes (After Rollback)
```powershell
# List stashes
git stash list

# Apply most recent stash (keep stash)
git stash apply stash@{0}

# OR: Pop most recent stash (remove stash)
git stash pop stash@{0}

# Resolve conflicts if any
git status
# Edit conflicting files, then:
git add <resolved-files>
```

### Verify Rollback Success
```powershell
# Check current commit matches checkpoint
git log -1 --oneline
# Compare SHA to checkpoint table above

# Check file contents
cat .github/prompts/plan.prompt.md | Select-String "Phase Breakdown Algorithm"
# Should show line if rolled back to Phase 2 or later
# Should NOT show line if rolled back to Phase 1

# Check work-log reflects correct phase
cat .github/prompts.keys/plan-prompt-enhancement/work-log.md | Select-String "Phase.*Complete"
# Should show only phases up to rollback point
```

### Re-execute from Checkpoint
```powershell
# After rollback, you can re-run remaining phases
# Example: Rolled back to Phase 3, want to redo Phases 4-6

# Current state: Phase 3 complete
# Next: Say "proceed" to re-execute Phase 4 with different approach
```

---

## Common Rollback Scenarios

### Scenario 1: Phase 4 introduced breaking change
**Symptom**: Phase completion verification failing  
**Action**: Rollback to Phase 3, investigate Phase 4 changes  
**Command**: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-004500`

### Scenario 2: Flakiness detection unreliable
**Symptom**: Phase 3 tests not detecting flakiness correctly  
**Action**: Rollback to Phase 2, redesign flakiness detection in Phase 3  
**Command**: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-001500`

### Scenario 3: Enhancement recommendation logic incorrect
**Symptom**: Phase 2 recommendations don't match analysis criteria  
**Action**: Rollback to Phase 1, fix recommendation algorithm in Phase 2  
**Command**: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-000000`

### Scenario 4: Need to adjust phase boundaries
**Symptom**: Phase 3 too large, want to split into 3A and 3B  
**Action**: Rollback to Phase 2, adjust phase breakdown in plan  
**Command**: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-001500`

### Scenario 5: Documentation artifacts incorrect
**Symptom**: Phase 6 summary missing information  
**Action**: Rollback to Phase 5, regenerate Phase 6 documentation  
**Command**: `git reset --hard checkpoint/plan-prompt-enhancement/20251020-011500`

---

## Rollback Impact Analysis

### Phase 1 → Start: Full Rollback
- **Impact**: All enhancements removed
- **Time to Re-implement**: ~90 minutes (all 6 phases)
- **Files Affected**: 1 file (plan.prompt.md)
- **Documentation Lost**: All phase documentation

### Phase 3 → Phase 2: Moderate Rollback
- **Impact**: Test integration removed, keep planning enhancements
- **Time to Re-implement**: ~60 minutes (Phases 3-6)
- **Files Affected**: 1 file (plan.prompt.md)
- **Documentation Lost**: Phases 3-6 documentation

### Phase 5 → Phase 4: Minimal Rollback
- **Impact**: Final validation removed, keep all phase work
- **Time to Re-implement**: ~30 minutes (Phases 5-6)
- **Files Affected**: 1 file (plan.prompt.md) + documentation
- **Documentation Lost**: Phases 5-6 documentation

---

## Prevent Need for Rollback

### Best Practices
1. **Review before committing**: Check changes carefully
2. **Test each phase**: Verify enhancements work as intended
3. **Manual validation**: Complete validation checklist per phase
4. **Incremental commits**: One commit per phase (enables targeted rollback)
5. **Checkpoint tags**: Always create tags (enables easy rollback)

### Early Detection
1. **Phase completion verification**: Catches issues before proceeding
2. **Dependency validation**: Ensures prerequisites met
3. **Manual validation**: Human review catches logic errors
4. **Documentation review**: Ensures accuracy and completeness

---

## Emergency Rollback (Critical Failure)

If all phases corrupted or repository in bad state:

```powershell
# Option 1: Rollback to start of key work
git reset --hard HEAD~10  # Adjust number based on commits made

# Option 2: Rollback to before key work began
git log --oneline  # Find commit before plan-prompt-enhancement started
git reset --hard <commit-sha-before-work>

# Option 3: Restore from remote (if pushed)
git fetch origin development
git reset --hard origin/development
```

---

## Support

For rollback assistance:
1. Check this guide first
2. Review work-log.md for phase history
3. Consult plan-prompt-enhancement.plan.md for phase details
4. Check git log for commit history

---

**Last Updated**: 2025-10-20  
**Key**: plan-prompt-enhancement  
**Phase**: 6/6 Complete  
**Total Checkpoints**: 6
