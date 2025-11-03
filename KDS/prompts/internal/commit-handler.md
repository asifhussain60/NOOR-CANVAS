# Intelligent Commit Handler Agent

**Role:** Analyze changes and create optimal git commits with proper categorization  
**Version:** 1.0  
**Trigger:** User says "commit changes" or "commit my work" via `#file:KDS/prompts/user/kds.md`

---

## Purpose

This agent intelligently analyzes uncommitted changes and creates **optimal, categorized commits** that align with KDS design philosophy:

1. **Separate concerns** - KDS changes vs application changes vs context files
2. **Semantic commits** - Conventional commit format (feat/fix/docs/refactor/test)
3. **Atomic commits** - Each commit is self-contained and deployable
4. **Smart tagging** - Add git tags for milestones and KDS versions
5. **Branch awareness** - Enforce KDS branch isolation rules

---

## Execution Steps

**Overview:**
1. Analyze uncommitted changes and categorize
2. Validate branch compliance
3. Determine commit strategy (single/grouped/multiple)
4. Generate semantic commit messages
5. Detect milestone/tag opportunities
6. Execute commits (with pre-baseline tracking)
7. **Verify commit success (smart validation with baseline comparison)** ✅ **FIXED**
8. Generate post-commit summary

---

### Step 1: Analyze Uncommitted Changes

**Run git status and categorize files:**

```powershell
git status --short
```

**Categorize files into buckets:**

```yaml
categories:
  kds_enhancements:
    pattern: "^KDS/(prompts|governance|docs|scripts)/"
    commit_type: "feat(kds)" or "fix(kds)" or "docs(kds)"
    branch_required: "features/kds"
    
  kds_brain:
    pattern: "^KDS/kds-brain/"
    commit_type: "feat(kds-brain)" or "fix(kds-brain)"
    branch_required: "features/kds"
    
  application_features:
    pattern: "^(SPA|Tools|Migrations)/"
    commit_type: "feat" or "fix"
    branch_required: "features/* or development"
    
  tests:
    pattern: "^(Tests|PlayWright)/"
    commit_type: "test"
    branch_required: "any"
    
  context_files:
    pattern: "^(Docs|.copilot)/"
    commit_type: "docs"
    branch_required: "any"
    
  config_files:
    pattern: "\.(json|config|md)$ (root level)"
    commit_type: "chore"
    branch_required: "any"
    
  build_artifacts:
    pattern: "^(bin|obj|node_modules|.skip)$"
    commit_type: "SKIP"
    action: "add to .gitignore"
```

---

### Step 2: Validate Branch Compliance

**Check current branch and KDS isolation rules:**

```python
current_branch = git.current_branch()

if has_kds_changes AND current_branch != "features/kds":
    ERROR("❌ KDS changes detected but not on features/kds branch")
    SUGGEST("Switch branch: git checkout features/kds")
    HALT()
    
if current_branch == "features/kds" AND has_non_kds_changes:
    ERROR("❌ Non-KDS changes on features/kds branch")
    SUGGEST("Commit KDS changes first, then switch branch for other changes")
    HALT()
```

---

### Step 3: Determine Commit Strategy

**Based on change categories, choose strategy:**

#### **Strategy A: Single Category (Simple)**
```yaml
condition: All changes in ONE category
action: Create single commit
example:
  - All changes in KDS/prompts/ → feat(kds): Add intelligent commit handler
```

#### **Strategy B: Multiple Related Categories (Grouped)**
```yaml
condition: Changes span related categories (e.g., KDS + KDS-BRAIN)
action: Create single commit with multi-scope
example:
  - KDS/prompts/ + KDS/kds-brain/ → feat(kds): Add Tier 3 throttling optimization
```

#### **Strategy C: Separate Concerns (Multiple Commits)**
```yaml
condition: Changes span unrelated categories
action: Create separate commits in logical order
priority_order:
  1. KDS enhancements (features/kds branch)
  2. Application features (feature branch)
  3. Tests (feature branch)
  4. Documentation (any branch)
  5. Configuration (any branch)

example:
  Commit 1: feat(kds): Add commit handler agent
  Commit 2: feat: Add PDF export to canvas
  Commit 3: test: Add Percy visual tests for PDF export
  Commit 4: docs: Update deployment checklist
```

---

### Step 4: Generate Commit Messages

**Follow Conventional Commits format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code change that neither fixes nor adds
- `test` - Adding or correcting tests
- `chore` - Build process, dependencies, tooling
- `perf` - Performance improvement

**KDS-Specific Scopes:**
- `kds` - KDS system enhancements
- `kds-brain` - BRAIN learning system
- `kds-governance` - Rules and policies

**Message Generation Logic:**

```python
def generate_commit_message(category, files):
    # Analyze file changes
    added_files = [f for f in files if f.status == "??" or f.status == "A"]
    modified_files = [f for f in files if f.status == "M"]
    deleted_files = [f for f in files if f.status == "D"]
    
    # Determine commit type
    if category == "kds_enhancements":
        if any("new" in f.lower() for f in added_files):
            commit_type = "feat(kds)"
        elif any("fix" in f.lower() or "bug" in f.lower() for f in modified_files):
            commit_type = "fix(kds)"
        elif all(f.endswith(".md") for f in files):
            commit_type = "docs(kds)"
        else:
            commit_type = "feat(kds)"
    
    # Extract feature name from files
    feature_name = extract_feature_name(files)
    
    # Generate subject (50 chars max)
    subject = f"{commit_type}: {feature_name}"
    
    # Generate body (list changes, impacts, reasoning)
    body = generate_body(files)
    
    # Generate footer (tags, references, breaking changes)
    footer = generate_footer(category)
    
    return f"{subject}\n\n{body}\n\n{footer}"
```

**Example Messages:**

**KDS Enhancement:**
```
feat(kds): Intelligent commit handler with categorization

- Analyze uncommitted changes and categorize by type
- Separate KDS changes from application changes
- Generate semantic commit messages automatically
- Enforce branch isolation rules
- Smart git tagging for milestones

Modified files:
- KDS/prompts/internal/commit-handler.md (new agent)
- KDS/prompts/user/kds.md (added commit intent detection)
- KDS/prompts/internal/intent-router.md (route commit requests)

Design philosophy: Optimal commits for KDS workflow efficiency
```

**Application Feature:**
```
feat: PDF export for transcript canvas

- Add PdfExportService.cs for server-side generation
- Add PdfExportButton.razor component to canvas toolbar
- Add /api/pdf/export endpoint with session validation
- Support custom page sizes and orientations

Tests:
- Tests/Unit/PdfExportServiceTests.cs
- Tests/UI/pdf-export-visual.spec.ts

Closes #123
```

**Multiple Commits Example:**
```
# Commit 1 (on features/kds)
feat(kds): Tier 3 throttling optimization - 50% efficiency gain

- Throttle Tier 3 collection to >1 hour intervals
- Reduces daily overhead from 4-20 min to 2-10 min
- Zero accuracy impact (1-hour freshness sufficient)

Modified files:
- KDS/prompts/internal/brain-updater.md
- KDS/prompts/user/kds.md
- KDS/kds-brain/README.md
- KDS/docs/architecture/TIER-3-THROTTLING-OPTIMIZATION.md

# Commit 2 (switch to features/fab-button)
test: Add Percy visual tests for FAB button states

- Test normal, hover, pulse, and disabled states
- Baseline screenshots captured
- Integration with CI/CD pipeline

Files:
- Tests/UI/fab-button-percy.spec.ts
- Scripts/run-fab-button-percy-tests.ps1
```

---

### Step 5: Detect Milestone/Tag Opportunities

**Check if changes warrant a git tag:**

```yaml
tag_criteria:
  kds_version_bump:
    condition: "Major KDS enhancement (new agent, architecture change)"
    tag_format: "kds-v{major}.{minor}.{patch}"
    example: "kds-v5.2.0"
    
  kds_milestone:
    condition: "Significant KDS milestone (BRAIN complete, SOLID refactor)"
    tag_format: "kds-{milestone-name}"
    example: "kds-brain-complete"
    
  application_release:
    condition: "Production deployment ready"
    tag_format: "v{major}.{minor}.{patch}"
    example: "v1.2.0"
    
  feature_complete:
    condition: "Feature fully implemented, tested, validated"
    tag_format: "{feature-name}-complete"
    example: "fab-button-animation-complete"
```

**Tag Decision Logic:**

```python
def should_create_tag(commits):
    # Check for KDS version bump
    if any("feat(kds)" in c.message and is_major_change(c) for c in commits):
        version = increment_kds_version()
        return f"kds-v{version}"
    
    # Check for KDS milestone
    if any(milestone_keyword(c.message) for c in commits):
        milestone = extract_milestone_name(commits)
        return f"kds-{milestone}"
    
    # Check for feature completion
    if all_tasks_complete() and all_tests_passing():
        feature = get_current_feature_name()
        return f"{feature}-complete"
    
    return None
```

---

### Step 6: Execute Commits (with Pre/Post Validation)

**Create commits in optimal order with baseline tracking:**

```powershell
# STEP 6a: Baseline uncommitted files BEFORE commit
baseline_uncommitted = get_uncommitted_files(exclude_artifacts=True)
log_debug(f"Baseline: {len(baseline_uncommitted)} uncommitted files before commit")

# STEP 6b: For each commit category (in priority order):

# 1. Stage files for this category
git add <files>

# 2. Create commit with generated message
git commit -m "<generated_message>"

# 3. Log event to BRAIN
log_event({
  "event": "commit_created",
  "type": commit_type,
  "scope": commit_scope,
  "files_count": files.length,
  "branch": current_branch,
  "timestamp": now()
})

# 4. If tag needed, create it
if tag_name:
    git tag -a <tag_name> -m "<tag_message>"
    log_event({
      "event": "tag_created",
      "tag": tag_name,
      "commit": commit_hash
    })
```

---

### Step 7: Verify Commit Success (Smart Validation)

**🎯 CRITICAL: Ensure all committable files were committed, differentiate from build artifacts**

```powershell
# Check for remaining uncommitted files AFTER commit
after_commit = git status --short

# Exclude build artifacts from both checks
$uncommitted_after = after_commit | Where-Object {
    $_ -notmatch '^\?\? .*(bin/|obj/|node_modules/|\.skip|test-results/|playwright-report/)'
}
```

**Smart Validation Logic:**

```python
# Get uncommitted files AFTER commit
uncommitted_after = get_uncommitted_files(exclude_artifacts=True)

# Compare with baseline
still_uncommitted = set(uncommitted_after) & set(baseline_uncommitted)  # Intersection
new_during_commit = set(uncommitted_after) - set(baseline_uncommitted)  # New files

# VALIDATION CHECKS

# Check 1: Files that SHOULD have been committed but weren't
if len(still_uncommitted) > 0:
    ERROR("❌ Commit operation failed - files still uncommitted!")
    
    # Categorize remaining files
    remaining_kds = [f for f in still_uncommitted if f.startswith("KDS/")]
    remaining_app = [f for f in still_uncommitted if not f.startswith("KDS/")]
    
    if remaining_kds:
        ERROR(f"KDS files not committed: {remaining_kds}")
        SUGGEST("File categorization may have failed. Check commit-handler logic.")
    
    if remaining_app:
        ERROR(f"Application files not committed: {remaining_app}")
        SUGGEST("These files were in baseline but not committed.")
    
    HALT()  # Do not proceed with summary until fixed

# Check 2: New files created DURING commit (informational, not error)
elif len(new_during_commit) > 0:
    WARN(f"⚠️ New files appeared during commit: {new_during_commit}")
    
    # Likely build artifacts or pre-commit hook outputs
    SUGGEST("Check if these should be in .gitignore:")
    for file in new_during_commit:
        print(f"  - {file}")
    
    # Log but don't halt
    log_event({
      "event": "files_created_during_commit",
      "files": new_during_commit,
      "timestamp": now()
    })
    
    SUCCESS("✅ Original files committed successfully")
    PROCEED_TO_SUMMARY()

# Check 3: Perfect commit - all files committed, none created
else:
    SUCCESS("✅ Verified: All committable files committed (0 uncommitted)")
    PROCEED_TO_SUMMARY()
```

**If validation fails (Check 1):**
```markdown
❌ **COMMIT VERIFICATION FAILED**

Files from baseline still uncommitted:
  - KDS/prompts/internal/test-agent.md
  - SPA/NoorCanvas/Components/NewComponent.razor

These files existed BEFORE commit but were NOT committed.

**Root Causes:**
1. ❌ File categorization logic failed (didn't match any category)
2. ❌ Branch switching mid-commit caused stage failure
3. ❌ Git operation failed silently

**Action Required:**
1. Check file paths match categorization patterns
2. Verify correct branch active
3. Re-run commit handler with verbose logging
```

**If new files appear (Check 2):**
```markdown
⚠️ **NEW FILES DURING COMMIT**

Files created during commit operation:
  - Tests/bin/Debug/test.dll
  - .vs/config/cache.json
  
These files were NOT in baseline but appeared after commit.

**Likely Causes:**
✅ Pre-commit hooks generated files
✅ Build artifacts from compilation
✅ IDE cache files

**Action:**
✓ Original files committed successfully
⚠️ Consider adding to .gitignore:
  echo "Tests/bin/" >> .gitignore
  echo ".vs/" >> .gitignore
```

---

### Step 8: Post-Commit Summary

**Only generate summary after Step 7 verification passes:**

```markdown
✅ **Commits Created Successfully**

📊 **Summary:**
- Total commits: 3
- Total files: 12
- Git tags: 1
- **Uncommitted files: 0** ✅ **VERIFIED**

---

**Commit 1:** feat(kds): Intelligent commit handler
- Branch: features/kds
- Files: 4 added, 2 modified
- Hash: a1b2c3d
- BRAIN: Event logged ✅

**Commit 2:** feat: PDF export for canvas
- Branch: features/fab-button
- Files: 3 added, 1 modified
- Hash: e4f5g6h
- BRAIN: Event logged ✅

**Commit 3:** test: Percy visual tests for PDF export
- Branch: features/fab-button
- Files: 2 added
- Hash: i7j8k9l
- BRAIN: Event logged ✅

---

**Git Tag Created:** kds-v5.2.0
- Commit: a1b2c3d
- Message: "KDS v5.2.0 - Intelligent commit handler"

---

**Final Verification:**
✅ All committable files committed (0 uncommitted)
✅ Build artifacts correctly ignored: 4 files
   - Tests/Unit/*.skip (2 files)
   - Tests/Unit/bin/ (directory)
   - Tests/Unit/obj/ (directory)

**Next Actions:**
✅ Ready to push: git push origin features/kds features/fab-button --tags
✅ Consider: Merge features/kds to development when ready

**BRAIN Status:**
- 3 commit events logged
- 1 tag event logged
- Tier 2 update pending (48 events, will trigger at 50)
```

---

## Intelligent Features

### **1. Build Artifact Detection**

Automatically detect and handle build artifacts:

```python
build_artifacts = [
    "bin/", "obj/", "node_modules/", ".vs/",
    "*.user", "*.suo", "*.cache",
    "*.skip", "test-results/", "playwright-report/"
]

if any(pattern_match(f, build_artifacts) for f in uncommitted):
    WARN("Build artifacts detected (not committed)")
    
    # Check if .gitignore covers them
    if not in_gitignore(artifacts):
        SUGGEST("Add to .gitignore:")
        for artifact in artifacts:
            print(f"  echo '{artifact}' >> .gitignore")
```

### **2. Commit Size Optimization**

Warn about commits that are too large:

```python
if len(files) > 20:
    WARN("Large commit detected (20+ files)")
    SUGGEST("Consider breaking into smaller commits:")
    
    # Suggest logical groupings
    print("Suggested breakdown:")
    for category, category_files in grouped_files:
        print(f"  - {category}: {len(category_files)} files")
```

### **3. Semantic Version Detection**

Auto-increment versions based on commit types:

```python
def calculate_version_bump(commits):
    if any("BREAKING CHANGE" in c.body for c in commits):
        return "major"  # 1.0.0 → 2.0.0
    elif any(c.type == "feat" for c in commits):
        return "minor"  # 1.0.0 → 1.1.0
    elif any(c.type == "fix" for c in commits):
        return "patch"  # 1.0.0 → 1.0.1
    else:
        return "none"
```

### **4. Cross-Reference Detection**

Link commits to issues, sessions, and features:

```python
def extract_references(files, session):
    references = []
    
    # Check for issue numbers in file names or content
    issues = find_issue_numbers(files)
    references.extend([f"Closes #{n}" for n in issues])
    
    # Link to active KDS session
    if session:
        references.append(f"Session: {session.id}")
    
    # Link to related commits
    related = find_related_commits(files)
    references.extend([f"Related: {c}" for c in related])
    
    return references
```

---

## Error Handling

### **Uncommitted Changes on Wrong Branch**

```yaml
error: "KDS changes on features/fab-button"
resolution:
  1. Stash changes: git stash
  2. Switch branch: git checkout features/kds
  3. Apply stash: git stash pop
  4. Commit: (re-run commit handler)
```

### **Conflicting Change Categories**

```yaml
error: "Both KDS and application changes (requires separate commits)"
resolution:
  1. Commit KDS changes first (features/kds)
  2. Merge to development
  3. Switch to feature branch
  4. Commit application changes
```

### **Dirty Working Directory**

```yaml
error: "Merge conflicts or unresolved changes"
resolution:
  1. Resolve conflicts
  2. Stage resolved files
  3. Re-run commit handler
```

---

## Integration with KDS Workflow

### **Intent Detection (intent-router.md)**

Add new intent pattern:

```yaml
commit_intent:
  patterns:
    - "commit changes"
    - "commit my work"
    - "git commit"
    - "save changes to git"
    - "create commits"
  
  route_to: commit-handler.md
  confidence: 0.95
```

### **BRAIN Event Logging**

All commits trigger BRAIN events:

```json
{
  "timestamp": "2025-11-03T10:30:00Z",
  "event": "commit_created",
  "type": "feat",
  "scope": "kds",
  "branch": "features/kds",
  "files_count": 4,
  "lines_added": 145,
  "lines_deleted": 12,
  "commit_hash": "a1b2c3d"
}
```

### **Health Validator Integration**

Commit handler can be called from validator:

```markdown
#file:KDS/prompts/user/validate.md

After validation passes:
  ✅ All checks passed
  📦 Ready to commit
  
  Next: #file:KDS/prompts/user/kds.md commit changes
```

---

## Configuration

**File:** `KDS/config/commit-handler.yaml`

```yaml
commit_handler:
  # Commit message format
  message_format:
    max_subject_length: 50
    max_body_width: 72
    include_file_list: true
    include_statistics: true
  
  # Categorization rules
  categories:
    kds_enhancements:
      patterns: ["^KDS/(prompts|governance|docs|scripts)/"]
      branch: "features/kds"
      type: "feat(kds)"
    
    kds_brain:
      patterns: ["^KDS/kds-brain/"]
      branch: "features/kds"
      type: "feat(kds-brain)"
  
  # Tagging rules
  auto_tag:
    enabled: true
    kds_version_bump: true
    milestone_detection: true
    feature_completion: true
  
  # Build artifact handling
  ignore_artifacts: true
  suggest_gitignore_updates: true
  
  # Commit size limits
  warn_file_count: 20
  error_file_count: 50
```

---

## Example Workflow

```markdown
User: #file:KDS/prompts/user/kds.md
      commit changes

Commit Handler:
  
  🔍 Analyzing uncommitted changes...
  
  📊 Found 12 files across 3 categories:
  
  **Category 1: KDS Enhancements** (4 files)
    - KDS/prompts/internal/commit-handler.md (new)
    - KDS/prompts/user/kds.md (modified)
    - KDS/prompts/internal/intent-router.md (modified)
    - KDS/docs/architecture/COMMIT-STRATEGY.md (new)
  
  **Category 2: Application Features** (6 files)
    - SPA/NoorCanvas/Services/PdfExportService.cs (new)
    - SPA/NoorCanvas/Components/Canvas/PdfExportButton.razor (new)
    - SPA/NoorCanvas/Controllers/PdfExportController.cs (new)
    - SPA/NoorCanvas/Pages/TranscriptCanvas.razor (modified)
    - Tests/Unit/PdfExportServiceTests.cs (new)
    - Tests/UI/pdf-export-visual.spec.ts (new)
  
  **Category 3: Build Artifacts** (2 files - SKIP)
    - Tests/Unit/bin/ (ignore)
    - Tests/Unit/obj/ (ignore)
  
  ⚠️  **Branch Check:** Currently on features/fab-button
  ⚠️  **Issue:** KDS changes detected on non-KDS branch
  
  🔄 **Suggested Actions:**
  1. Commit KDS changes on features/kds
  2. Commit application changes on features/fab-button
  
  **Proceed with 2-stage commit? (Y/n)**

User: Y

Commit Handler:
  
  📦 Stage 1: KDS Changes (features/kds branch)
  
  Switching to features/kds...
  ✅ Switched to branch 'features/kds'
  
  Staging 4 files...
  Creating commit...
  
  ✅ Commit created: a1b2c3d
  📝 Message: feat(kds): Intelligent commit handler with auto-categorization
  
  🏷️  Creating tag: kds-v5.2.0
  ✅ Tag created: kds-v5.2.0
  
  📦 Stage 2: Application Changes (features/fab-button branch)
  
  Switching to features/fab-button...
  ✅ Switched to branch 'features/fab-button'
  
  Staging 6 files...
  Creating commit...
  
  ✅ Commit created: e4f5g6h
  📝 Message: feat: PDF export for transcript canvas with tests
  
  🎉 **All Changes Committed!**
  
  📊 Summary:
  - 2 commits created
  - 10 files committed (2 build artifacts ignored)
  - 1 git tag created
  - 0 uncommitted files remaining
  
  **Next Actions:**
  ✅ Push commits: git push origin features/kds features/fab-button --tags
  ✅ Merge features/kds → development when ready
  
  **BRAIN Events Logged:** ✅ (2 commits, 1 tag)
```

---

## Benefits

### **For Users**
- 🚀 **Automatic** - No need to remember commit message format
- 🎯 **Optimal** - Changes grouped intelligently
- ✅ **Validated** - Branch rules enforced automatically
- 📊 **Informative** - Detailed summaries of what was committed

### **For KDS System**
- 🧠 **Learning** - Commit patterns feed BRAIN
- 📈 **Metrics** - Track commit frequency, size, quality
- 🔍 **Traceability** - Link commits to sessions, features, issues
- 🏷️ **Milestones** - Auto-tag important changes

### **For Git History**
- 📚 **Clean** - Semantic, well-formatted messages
- 🔀 **Atomic** - Each commit is self-contained
- 🏗️ **Structured** - Consistent patterns across project
- 🔎 **Searchable** - Easy to find commits by type/scope

---

## See Also

- **Intent Router:** `KDS/prompts/internal/intent-router.md`
- **BRAIN Updater:** `KDS/prompts/internal/brain-updater.md`
- **Health Validator:** `KDS/prompts/internal/health-validator.md`
- **KDS Design:** `KDS/KDS-DESIGN.md` (Git Workflow section)
- **Git Hooks:** `KDS/hooks/pre-commit`, `KDS/hooks/post-merge`
