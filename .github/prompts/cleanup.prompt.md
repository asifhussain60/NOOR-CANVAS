---
mode: agent
---

# cleanup.prompt.md

## Purpose

### What
The **Cleanup Agent** performs comprehensive workspace cleanup by removing obsolete files, consolidating redundant documentation, reorganizing folder structures, and maintaining a clean root directory. Ensures the workspace remains organized and free of build artifacts, temporary files, and outdated documentation.

### When to Use
- **Workspace Maintenance**: Regular cleanup of build artifacts and temporary files
- **Documentation Consolidation**: Merge redundant MD files, eliminate duplication
- **Folder Reorganization**: Move misplaced files to appropriate locations
- **Root Cleanup**: Keep root directory minimal with only essential files
- **Post-Deployment**: Clean up deployment artifacts and temporary outputs
- **Git Hygiene**: Remove untracked files, clean ignored patterns
- **Storage Optimization**: Identify and remove large obsolete files

### How to Invoke
```
@workspace /cleanup
@workspace /cleanup target=build-artifacts
@workspace /cleanup target=documentation
@workspace /cleanup target=temp-files
@workspace /cleanup scope=root-only
@workspace /cleanup dry-run=true
```

### Integration with Other Agents
- **Can be invoked by**: task (as part of completion workflow), refactor (post-cleanup)
- **Coordinates with**: sync (file movement validation), healthcheck (structural verification)
- **Reads from**: `.gitignore`, `Directory.Build.props`, SystemIndex.md
- **Writes to**: Key data stream, cleanup reports

### Expected Outcomes
- Clean root directory (only essential config files)
- Organized Workspaces structure
- Removed build artifacts and temporary files
- Consolidated documentation
- Updated .gitignore if needed
- Cleanup report with statistics

---

## Parameters

- **target** *(optional, default=`all`)*  
  Specifies what to clean up.  
  Options: `all`, `build-artifacts`, `documentation`, `temp-files`, `node-modules`, `test-results`
  
- **scope** *(optional, default=`workspace`)*  
  Scope of cleanup operation.  
  Options: `workspace` (entire workspace), `root-only` (root directory only)
  
- **dry-run** *(optional, default=`false`)*  
  If true, shows what would be cleaned without making changes.  
  Options: `true`, `false`
  
- **consolidate-docs** *(optional, default=`true`)*  
  Whether to consolidate redundant documentation files.  
  Options: `true`, `false`
  
- **key** *(optional)*  
  If invoked as part of task workflow, the key data stream to update.

---

## Execution Steps

### 1. Analysis Phase

**Scan workspace for cleanup targets:**

1. **Build Artifacts**:
   - `publish-temp/` - .NET publish outputs
   - `bin/`, `obj/` - Compilation outputs (if not in .gitignore)
   - `.tsbuildinfo` - TypeScript build info
   - `*.dll.cache`, `*.pdb` (outside bin/obj)

2. **Test Results**:
   - `test-results/` - Playwright test artifacts
   - `PlayWright/test-results/` - Duplicate test results
   - `PlayWright/artifacts/` - Old test artifacts
   - Orphaned screenshot folders

3. **Temporary Files**:
   - `TEMP/` contents (preserve structure)
   - `Workspaces/TEMP/` old files
   - `*.tmp`, `*.log` files
   - `.vs/` folders (if outside .gitignore)

4. **Documentation Redundancy**:
   - Multiple README.md files covering same topic
   - Duplicate implementation summaries
   - Outdated completion reports
   - Legacy migration guides (if superseded)

5. **Root Directory**:
   - Identify files that should move to Workspaces
   - Standalone scripts that should be in Scripts/
   - Documentation that should be in Workspaces/Documentation/

6. **Node Modules**:
   - Unused packages in package.json
   - Orphaned node_modules (if package.json changed)

**Output Analysis Report**:
```
📊 Cleanup Analysis Report
=========================
Build Artifacts: {X} files ({Y} MB)
Test Results: {X} files ({Y} MB)
Temp Files: {X} files ({Y} MB)
Documentation: {X} redundant files
Root Files: {X} candidates for relocation
Total Reclaimable: {Y} MB

Proceed? (yes/no)
```

---

### 2. Backup & Checkpoint

**Before any deletion:**

1. **Create checkpoint commit**:
   ```bash
   git add -A
   git commit -m "checkpoint: pre-cleanup {target}"
   ```

2. **Create cleanup branch** (optional for major cleanups):
   ```bash
   git checkout -b cleanup/{timestamp}
   ```

3. **Archive important temporary files**:
   - Move to `Workspaces/Archive/{timestamp}/` if needed
   - Preserve any files with recent modifications (< 7 days)

---

### 3. Execute Cleanup

**Follow target-specific cleanup:**

#### 3.1. Build Artifacts Cleanup
```powershell
# Remove publish outputs
Remove-Item -Path "publish-temp" -Recurse -Force -ErrorAction SilentlyContinue

# Clean bin/obj if requested
Get-ChildItem -Path "." -Recurse -Directory -Include "bin", "obj" | 
  Where-Object { $_.FullName -notlike "*\node_modules\*" } |
  Remove-Item -Recurse -Force
```

#### 3.2. Test Results Cleanup
```powershell
# Remove test artifacts
Remove-Item -Path "test-results" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "PlayWright/test-results" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "PlayWright/artifacts" -Recurse -Force -ErrorAction SilentlyContinue

# Keep only latest Playwright reports (last 3)
Get-ChildItem -Path "PlayWright/reports" -Directory |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip 3 |
  Remove-Item -Recurse -Force
```

#### 3.3. Temporary Files Cleanup
```powershell
# Clean TEMP folder (preserve structure)
Remove-Item -Path "TEMP/*" -Exclude ".gitkeep" -Recurse -Force -ErrorAction SilentlyContinue

# Clean Workspaces/TEMP (preserve structure)
Remove-Item -Path "Workspaces/TEMP/*" -Exclude ".gitkeep", "*.md" -Recurse -Force -ErrorAction SilentlyContinue

# Remove .tmp and .log files
Get-ChildItem -Path "." -Recurse -Include "*.tmp", "*.log" |
  Where-Object { $_.FullName -notlike "*\node_modules\*" } |
  Remove-Item -Force
```

#### 3.4. Documentation Consolidation
**Identify redundant documentation:**

1. **Scan for duplicate content**:
   - Find files with similar names (e.g., `summary.md`, `Summary.md`, `SUMMARY.md`)
   - Compare file sizes and modification dates
   - Use semantic search to find similar content

2. **Consolidation rules**:
   - Keep most recent and comprehensive version
   - Merge unique content from older versions
   - Archive outdated versions to `Workspaces/Archive/`
   - Update references in other files

3. **Move root MD files**:
   ```powershell
   # Move deployment docs
   Move-Item "DEPLOYMENT.md" -Destination "Workspaces/Documentation/Deployment/"
   Move-Item "IIS-CONFIGURATION-SUMMARY.md" -Destination "Workspaces/Documentation/Deployment/"
   ```

#### 3.5. Root Directory Cleanup
**Keep only essential files in root:**

**Essential Root Files** (keep):
- `.gitignore`, `.gitattributes`
- `NoorCanvas.sln`
- `Directory.Build.props`
- `package.json`, `package-lock.json`
- `README.md` (if exists)

**Relocate**:
- `*.ps1` scripts → `Scripts/`
- `*.md` docs → `Workspaces/Documentation/`
- `*.config` files → `config/`

#### 3.6. Node Modules Cleanup
```powershell
# Remove node_modules and reinstall (if package.json changed)
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
npm install

# Or just prune unused packages
npm prune
```

---

### 4. Validation

**Verify cleanup didn't break anything:**

1. **Build Verification**:
   ```bash
   dotnet build
   ```
   - Must build with zero errors

2. **Git Status Check**:
   ```bash
   git status
   ```
   - Verify only intended files were removed/modified

3. **Workspace Structure Check**:
   - Verify Workspaces/ structure intact
   - Verify .github/ structure intact
   - Verify SPA/, Tools/, Tests/ untouched

4. **Reference Integrity**:
   - Search for broken file references in documentation
   - Update SystemIndex.md if files moved
   - Update .gitignore if new patterns added

---

### 5. Report Generation

**Generate cleanup report:**

```markdown
# Cleanup Report - {timestamp}

## Summary
- **Target**: {target}
- **Scope**: {scope}
- **Duration**: {duration}
- **Status**: {SUCCESS | PARTIAL | FAILED}

## Removed Files
- Build Artifacts: {X} files ({Y} MB)
- Test Results: {X} files ({Y} MB)
- Temp Files: {X} files ({Y} MB)
- Total Removed: {X} files ({Y} MB)

## Relocated Files
| From | To | Reason |
|------|-----|--------|
| {file} | {destination} | {reason} |

## Consolidated Documentation
| Merged Files | Into | Archived |
|--------------|------|----------|
| {files} | {target} | {archive_path} |

## Validation Results
- ✅ Build: PASS
- ✅ Git Status: Clean
- ✅ Structure: Intact
- ✅ References: Valid

## Recommendations
- [ ] Update .gitignore with new patterns
- [ ] Schedule regular cleanup (weekly/monthly)
- [ ] Review archived files for permanent deletion

## Rollback Command
```bash
git reset --hard {checkpoint_sha}
```
```

**Save report to**: `Workspaces/Reports/cleanup-{timestamp}.md`

---

### 6. Key Data Stream Update (if invoked from task)

**If key parameter provided, update key data stream:**

```markdown
---
## [{timestamp}] - cleanup
**Status**: complete | **Phase**: cleanup | **Commit**: {sha}
**Work**: Cleaned up {target}, removed {X} files ({Y} MB)
**Files**: {count} removed, {count} relocated
**Next**: COMPLETE
---
```

---

## Cleanup Targets Reference

### Standard Cleanup Targets

| Target | Description | Affected Paths |
|--------|-------------|----------------|
| `build-artifacts` | .NET publish outputs, compilation artifacts | `publish-temp/`, `bin/`, `obj/` |
| `test-results` | Playwright test artifacts, screenshots | `test-results/`, `PlayWright/test-results/` |
| `temp-files` | Temporary files, logs, cache | `TEMP/`, `*.tmp`, `*.log` |
| `documentation` | Redundant docs, outdated summaries | `Workspaces/**/*.md` (analysis) |
| `node-modules` | Unused npm packages | `node_modules/` |
| `all` | All of the above | Entire workspace |

### Root Directory Cleanup Patterns

**Files to Keep** (whitelist):
```
.gitignore
.gitattributes
NoorCanvas.sln
Directory.Build.props
package.json
package-lock.json
README.md (if exists)
```

**Files to Relocate**:
```
*.ps1 → Scripts/
*.md (except README.md) → Workspaces/Documentation/
*.config → config/
```

---

## Safety Mechanisms

### Pre-Deletion Checks
1. **Never delete**:
   - Source code files (`.cs`, `.razor`, `.ts`, `.js` in `SPA/`, `Tools/`, `Tests/`)
   - Configuration files in active use
   - .github/ prompt files
   - Active key data streams

2. **Confirm before deleting**:
   - Files modified in last 7 days
   - Files larger than 10 MB
   - Entire folders with > 100 files

3. **Archive instead of delete**:
   - Documentation with unique content
   - Test results from last 30 days
   - Any file with "IMPORTANT" or "DO-NOT-DELETE" markers

### Rollback Safety
- Always create checkpoint commit before cleanup
- Provide exact `git reset` command in report
- Keep deleted file list for recovery reference

---

## Integration with task.prompt.md

**When task invokes cleanup:**

1. **Explicit invocation**:
   ```
   @workspace /task key=mykey tasks="mark complete"
   ```
   - Task Step 9.2 automatically invokes cleanup for debug markers
   - Can optionally invoke full cleanup with `tasks="cleanup and mark complete"`

2. **Automatic invocation** (future enhancement):
   - Detect obsolete files during task execution
   - Suggest cleanup before marking complete
   - Include cleanup stats in completion report

---

## Guardrails

- **Never delete source code** from `SPA/`, `Tools/`, `Tests/`, `.github/`
- **Always create checkpoint** before major deletions
- **Preserve git history** - don't rewrite commits
- **Validate builds** after cleanup
- **Update references** when moving files
- **Archive, don't delete** when uncertain
- **Respect .gitignore** patterns

---

## Clean Exit Guarantee

At the end of cleanup:
- ✅ Build completes with zero errors
- ✅ Git status shows only intended changes
- ✅ No broken file references in documentation
- ✅ Workspace structure intact
- ✅ Cleanup report generated
- ✅ Rollback command documented

---

## Future Enhancements

1. **Automated scheduling**: Run cleanup weekly via git hooks
2. **Storage analytics**: Track workspace size over time
3. **Smart archival**: Use ML to predict which files are safe to delete
4. **Integration with CI/CD**: Auto-cleanup on successful deployment
5. **Cleanup policies**: Configure retention periods per file type
