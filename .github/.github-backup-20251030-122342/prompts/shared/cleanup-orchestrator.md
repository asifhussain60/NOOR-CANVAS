# Cleanup Orchestrator Algorithm

**Purpose:** Coordinate post-execution cleanup tasks

**Used by:** plan.prompt.md (Step 5 - Optional Cleanup)

---

## Algorithm

**Input:** key, completed_work, files_modified[]

**Output:** cleanup_tasks[]

---

## Cleanup Categories

**1. Code Cleanup**
- Remove unused imports
- Delete commented code
- Remove debug statements
- Consolidate duplicates
- Fix formatting inconsistencies

**2. File Cleanup**
- Delete temporary files
- Remove .bak files
- Clean test artifacts
- Remove generated files
- Archive obsolete files

**3. Configuration Cleanup**
- Remove unused settings
- Clean appsettings overrides
- Delete test configurations
- Archive old config versions

**4. Documentation Cleanup**
- Update README files
- Remove outdated docs
- Update code comments
- Generate API docs
- Update change logs

**5. Test Cleanup**
- Remove obsolete tests
- Update test data
- Clean test results
- Remove debugging tests
- Archive old snapshots

**6. Database Cleanup**
- Remove test data
- Clean migration history (if safe)
- Update seed data
- Optimize indexes
- Vacuum/compact if needed

---

## Cleanup Detection

**Scan for:**
- `// TODO:` comments from this work
- `console.log()` debugging statements
- `#if DEBUG` blocks left active
- Unused variables/methods
- Empty files
- Duplicate code patterns

**Check:**
- Unused npm packages
- Unused NuGet packages
- Orphaned files (not referenced)
- Broken links in docs
- Missing documentation

---

## Cleanup Prioritization

**Critical (must do):**
- Remove security vulnerabilities
- Delete exposed secrets
- Remove debug endpoints
- Clean production configs

**High (should do):**
- Remove unused imports
- Delete commented code
- Update documentation
- Fix lint warnings

**Medium (nice to do):**
- Code formatting
- Consolidate duplicates
- Optimize imports
- Update comments

**Low (optional):**
- File organization
- Naming improvements
- Comment formatting
- Visual spacing

---

## Cleanup Execution

**Safe cleanups (auto):**
- Remove unused imports (Roslynator)
- Fix formatting (dotnet format)
- Update package versions (within minor)
- Organize usings

**Require confirmation:**
- Delete files
- Remove code blocks
- Update configurations
- Modify database

**Never auto-cleanup:**
- Production configs
- Migration files
- Test data (might be reference)
- Documentation (might be historical)

---

## Cleanup Tools

**C# Code:**
```bash
dotnet format
roslynator analyze --fix
dotnet remove package {unused-package}
```

**JavaScript/TypeScript:**
```bash
npm prune
eslint --fix
prettier --write
```

**Files:**
```bash
Remove-Item **/*.bak -Recurse
Remove-Item **/bin, **/obj -Recurse
```

---

## Cleanup Validation

**Before cleanup:**
- ✓ Backup current state
- ✓ Run tests
- ✓ Create checkpoint commit
- ✓ Get user approval

**After cleanup:**
- ✓ Run tests again
- ✓ Check no functionality broken
- ✓ Verify files compile
- ✓ Commit cleanup changes

---

## Cleanup Report

```markdown
## 🧹 Cleanup Summary

**Code Cleanup:**
- Removed 15 unused imports
- Deleted 3 commented code blocks
- Fixed 8 formatting issues

**File Cleanup:**
- Deleted 2 .bak files
- Removed 1 temporary file
- Archived 1 obsolete file

**Documentation:**
- Updated SessionCanvas.md
- Added code comments (5 methods)

**Tests Passed:** ✓ All green

**Commit:** `[{key}] Post-work cleanup`
```

---

## Cleanup Options

```markdown
## 🧹 Optional Cleanup

**A.** Run all recommended cleanups
**B.** Run code cleanup only
**C.** Run file cleanup only
**D.** Skip cleanup (manual later)

**Recommended:** A (comprehensive cleanup)
```

---

## See Also

- `../plan.prompt.md` - Step 5 implementation
- `mandatory-lint-validation.md` - Code quality checks
- `../internal/util/cleanup.prompt.md` - Dedicated cleanup agent
