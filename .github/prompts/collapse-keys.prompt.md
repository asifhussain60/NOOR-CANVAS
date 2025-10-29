# /collapse-keys

Scan the `.github/key-data-streams/` directory for all folders whose names match `<key-pattern>` and consolidate both folders AND files into a clean, standardized key structure.

**Two Modes:**
1. **Folder Merge Mode** (default) - Merges multiple keys into new consolidated key
2. **Internal-Only Mode** (`--internal-only: true`) - Consolidates files within single existing key (no folder merge)

## Syntax

```
/collapse-keys Key:<key-pattern> [--name <new-name>] [--dry-run: true/false] [--verbose: true/false] [--internal-only: true/false]
```

**Default Behavior** (folder merge + file consolidation):
```
/collapse-keys Key:prompt-* --name merged [--dry-run: true] [--verbose: true]
```
- Merges all `prompt-*` folders → `prompt-merged/`
- Consolidates files within merged folder

**Internal-Only Mode** (file consolidation without folder merge):
```
/collapse-keys Key:prompt-* --internal-only: true [--dry-run: true] [--verbose: true]
```
- Keeps all `prompt-*` folders separate
- Consolidates files within each folder independently

**Single Key Shorthand** (auto-detects internal-only):
```
/collapse-keys Key:prompt-merged [--dry-run: true] [--verbose: true]
```
- Exact key name (no wildcards) → auto-enables `--internal-only: true`
- Consolidates files in existing folder

## Behaviour

### Mode Selection

**Folder Merge + File Consolidation** (default when `--name` provided):
- Phase 1: Merge matching `{key}` folders → new consolidated folder
- Phase 2: Consolidate files within merged folder (work-logs, plans, JSON)
- Phase 3: Delete source folders
- **Requires**: `--name` parameter for wildcard patterns
- **Pattern**: Supports wildcards (`prompt-*`, `*-test`, `*.*`)
- **`--internal-only` flag**: When false (default), executes both folder + file operations

**Internal-Only Mode** (when `--internal-only: true`):
- Phase 1: SKIP (no folder merge)
- Phase 2: Consolidate files within **each matching folder independently**
- Phase 3: SKIP (no folder deletion)
- **Pattern**: Supports wildcards (`prompt-*`) or exact names (`prompt-merged`)
- **No `--name` required**: Works in-place on existing folders
- **`--name` parameter**: Ignored with warning if provided

**Auto-Detection Rules**:
1. Pattern + `--name` → Folder Merge + File Consolidation
2. Pattern + `--internal-only: true` → File Consolidation per folder (multiple folders processed)
3. Exact key name (no wildcards) + no `--name` → Auto-enables `--internal-only: true`

---

### Phase 1: Folder Consolidation

**When Executed**: `--internal-only: false` (default) AND `--name` provided

**Skipped When**: `--internal-only: true`

1. Collect all folders matching `<key-pattern>`
2. Create new consolidated folder: `.github/key-data-streams/<base-key>-<name>`
   - Example: `Key:prompt-*` + `--name merged` → `.github/key-data-streams/prompt-merged/`
3. Copy all files from source folders to new merged folder

### Phase 2: File Consolidation (Intelligent Merging)

**Applies to**:
- **Folder Merge Mode**: Files in the newly created merged folder (from Phase 1)
- **Internal-Only Mode**: Files in **each matching folder independently**

**Target Directory:**
- **Folder Merge Mode**: `.github/key-data-streams/{merged-key}/` (single new folder)
- **Internal-Only Mode**: Each `.github/key-data-streams/{key}/` folder separately (multiple folders)

**For Each Target Folder**:

3. **Merge work-log files** into single canonical `work-log.md`:
   - Detect all work-log variants: `work-log.md`, `work-log_*.md`
   - Chronologically merge content (oldest → newest based on file timestamps)
   - Preserve section headers and session markers
   - Add merge markers: `<!-- Merged from work-log_prompt-enhancements.md on 2025-10-29 -->`
   - Archive original files to `_ARCHIVE/work-logs/` subdirectory

4. **Consolidate plan files** into single primary plan:
   - Detect all plan variants: `*.plan.md`, `{key}.plan.md`
   - If multiple plans exist:
     - Use most recent as primary `{merged-key}.plan.md`
     - Archive others to `_ARCHIVE/plans/` with timestamps
   - Update plan metadata (version, key name, merged-from references)

5. **Merge JSON tracking files**:
   - Consolidate `*.plan.json` and `*.state.json` files
   - Preserve all phase tracking data
   - Merge execution history chronologically
   - Create single `{merged-key}.plan.json` and `state.json`

6. **Handle duplicate files**:
   - For identical content: Keep one, archive duplicates
   - For different content: 
     - Preserve most recent version in root
     - Archive older versions to `_ARCHIVE/` with source key prefix
     - Example: `analysis.md` → `_ARCHIVE/analysis_prompt-port.md`

7. **Standardize final structure**:
   ```
   .github/key-data-streams/{merged-key}/
   ├── {merged-key}.plan.md           # Primary consolidated plan
   ├── {merged-key}.plan.json         # Consolidated JSON tracking
   ├── work-log.md                    # Single merged work log
   ├── state.json                     # Consolidated state (if exists)
   ├── rollback-index.md              # Merged rollback history
   ├── README.md                      # Auto-generated merge summary
   ├── _ARCHIVE/                      # Historical artifacts
   │   ├── work-logs/
   │   │   ├── work-log_prompt-enhancements.md
   │   │   ├── work-log_prompt-port.md
   │   │   └── work-log_prompt-system-gaps.md
   │   ├── plans/
   │   │   ├── prompt-enhancements.plan.md
   │   │   └── prompt-port.plan.md
   │   └── duplicates/
   │       └── analysis_prompt-port.md
   ```

### Phase 3: Cleanup

**When Executed**: `--internal-only: false` (default, Folder Merge Mode)

**Skipped When**: `--internal-only: true`

8. After folder merge + file consolidation completes successfully:
   - Delete all original key folders that matched the search pattern
   - Verify **only the single new merged folder** exists
   - Validate canonical files present: `work-log.md`, `{merged-key}.plan.md`

**Internal-Only Mode**: No cleanup phase (all original folders remain intact, files consolidated in-place)

### Phase 4: Validation (BOTH MODES)
9. Post-consolidation validation (per target folder):
   - Ensure `work-log.md` contains all historical sessions
   - Verify no duplicate content in merged files
   - Confirm all source files archived (nothing lost)
   - Check file count: Root should contain ≤10 files (rest in _ARCHIVE)

10. Output a summary report including:
   - **Folder Merge Mode**: List of merged folders, source keys deleted, single new folder path
   - **Internal-Only Mode**: List of folders processed, files consolidated per folder, no folders affected
   - Total number of files processed (across all folders)
   - Work-log merge statistics (sessions combined, files merged per folder)
   - Plan consolidation summary (per folder)
   - Files archived (count and paths per folder)
   - Path(s) to key folder(s) (new merged folder or existing folders)
   - Validation checklist results

## Flags

- **--dry-run: true/false** (default: false) - Simulate the collapse without making changes. Display what would be merged, created, archived, or deleted.
- **--verbose: true/false** (default: false) - Provide detailed logging during execution (shows file-by-file merge operations).
- **--name \<new-name\>** - Specify the suffix for the new merged key folder name (required for Folder Merge Mode, ignored in Internal-Only Mode).
- **--internal-only: true/false** (default: false) - Enable Internal-Only Mode (file consolidation within each matching folder independently, no folder merge). Supports wildcards to process multiple folders.
- **--no-archive: true/false** (default: false) - Delete duplicate/old files instead of archiving (use with caution).
- **--keep-structure: true/false** (default: false) - Preserve original file names without consolidation (skip Phase 2 intelligent merging).

## Merge Rules

### Work-Log Consolidation
- **Primary file**: `work-log.md` (canonical)
- **Merge strategy**: Chronological append (oldest → newest)
- **Section preservation**: Keep all session headers, timestamps, commit references
- **Conflict resolution**: If timestamps overlap, use file modification time
- **Markers**: Add `<!-- Merged from {source-file} on {date} -->` before each merged section

### Plan File Consolidation
- **Primary file**: `{merged-key}.plan.md`
- **Selection criteria**: Most recent file by modification date
- **Version handling**: Increment version number (v1.0 → v2.0 merged)
- **Metadata update**: Add "Merged From" section listing source keys
- **Archived plans**: Preserve in `_ARCHIVE/plans/` with original names

### JSON Tracking Consolidation
- **plan.json**: Merge all phase tracking arrays, deduplicate by phase ID
- **state.json**: Combine request logs chronologically, preserve all handoffs
- **Conflict resolution**: Most recent timestamp wins for duplicate entries

### File Naming Conventions
- **Root files**: Use merged key name (e.g., `prompt-merged.plan.md`)
- **Archived files**: Preserve original names or add source prefix if conflict
- **Duplicates**: `{filename}_{source-key}.{ext}` (e.g., `analysis_prompt-port.md`)

## Validation Checklist

### Folder Merge Mode
After collapse completes, verify:
- ✅ Single `work-log.md` exists in root (not multiple work-log_*.md files)
- ✅ Single `{merged-key}.plan.md` exists (most recent plan)
- ✅ All historical work-logs archived to `_ARCHIVE/work-logs/`
- ✅ Root directory contains ≤10 files (canonical files only)
- ✅ No duplicate content in merged work-log.md
- ✅ All source keys deleted (original folders removed)
- ✅ README.md created with merge summary
- ✅ File count matches expected (original count = root + archived)

### Internal-Only Mode
After consolidation completes, verify (per folder):
- ✅ Single `work-log.md` exists in each folder root (not multiple work-log_*.md files)
- ✅ Single `{key}.plan.md` exists in each folder (most recent plan)
- ✅ All historical work-logs archived to `{folder}/_ARCHIVE/work-logs/`
- ✅ Each folder root contains ≤10 files (canonical files only)
- ✅ No duplicate content in merged work-log.md per folder
- ✅ **All source folders intact** (no folders deleted)
- ✅ README.md updated in each folder with consolidation note
- ✅ File count matches expected per folder (original count = root + archived)

## Auto-Generated README.md

### Folder Merge Mode
After successful collapse, create `README.md` in merged key folder:

```markdown
# Key: {merged-key}

**Created**: {merge-date}  
**Type**: Consolidated Key  
**Source Keys**: {list-of-merged-keys}

## Merge Summary

**Total Files Processed**: {count}  
**Work-Logs Merged**: {count} files → 1 canonical work-log.md  
**Plans Consolidated**: {count} plans → 1 primary plan  
**Files Archived**: {count} files in _ARCHIVE/
```

### Internal-Only Mode
After successful consolidation, update or create `README.md` in key folder:

```markdown
# Key: {key}

**Last Consolidated**: {consolidation-date}  
**Type**: Internal Consolidation  
**Mode**: In-Place File Cleanup

## Consolidation Summary

**Total Files Processed**: {count}  
**Work-Logs Merged**: {count} files → 1 canonical work-log.md  
**Plans Consolidated**: {count} plans → 1 primary plan  
**Files Archived**: {count} files in _ARCHIVE/  
**Folder Changes**: None (in-place consolidation)
```

## Source Keys

- `{key-1}` - {brief-description}
- `{key-2}` - {brief-description}
- `{key-3}` - {brief-description}

## Current Structure

- **Primary Plan**: {merged-key}.plan.md (v{version})
- **Work Log**: work-log.md ({session-count} sessions)
- **Tracking**: {merged-key}.plan.json, state.json
- **Archive**: _ARCHIVE/ ({archived-file-count} files)

## Quick Navigation

**View Work Log**: `.github/key-data-streams/{merged-key}/work-log.md`  
**View Plan**: `.github/key-data-streams/{merged-key}/{merged-key}.plan.md`  
**Historical Artifacts**: `.github/key-data-streams/{merged-key}/_ARCHIVE/`

---

*Auto-generated by collapse-keys on {merge-date}*
```

## Examples

### Example 1: Merge all prompt-related keys (Full Consolidation)
```
/collapse-keys Key:prompt-* --name merged --verbose
```

**What happens:**
1. Finds all keys matching `prompt-*` (prompt-enhancements, prompt-port, prompt-system-gaps, etc.)
2. Creates `.github/key-data-streams/prompt-merged/`
3. Merges all `work-log.md` and `work-log_*.md` files into single `work-log.md`
4. Consolidates all `*.plan.md` files into `prompt-merged.plan.md` (most recent)
5. Archives old plans, work-logs, duplicates to `_ARCHIVE/`
6. Deletes original `prompt-*` folders
7. Generates `README.md` with merge summary

**Result:** Clean structure with single `work-log.md`, single plan, all history preserved in `_ARCHIVE/`

---

### Example 2: Dry-run to preview merge (Safe Preview)
```
/collapse-keys Key:api-* --name consolidated --dry-run --verbose
```

**What happens:**
1. Simulates merge without making changes
2. Shows detailed report:
   - Which work-logs would merge (chronological order preview)
   - Which plan would become primary
   - What files would be archived
   - Final structure preview
3. No files created or deleted

**Result:** Complete preview of consolidation with file-by-file breakdown

---

### Example 3: Merge session-related keys (With Archive)
```
/collapse-keys Key:session-* --name unified --verbose
```

**What happens:**
1. Merges all `session-*` folders into `.github/key-data-streams/session-unified/`
2. Creates canonical `work-log.md` from all work-log variants
3. Archives historical files to `_ARCHIVE/work-logs/`, `_ARCHIVE/plans/`
4. Generates README.md with source key references

**Result:** Single unified key with clean root directory and organized archive

---

### Example 4: Quick merge without archiving (Aggressive Cleanup)
```
/collapse-keys Key:test-* --name consolidated --no-archive
```

**Warning:** Uses `--no-archive` flag - deletes duplicates instead of archiving

**What happens:**
1. Merges work-logs into single `work-log.md`
2. Keeps most recent plan file only
3. **Deletes** older plans and duplicate files (not archived)
4. Results in minimal file count

**Result:** Ultra-clean structure with only essential files (historical data lost)

---

### Example 5: Preserve structure (No consolidation)
```
/collapse-keys Key:debug-* --name merged --keep-structure
```

**What happens:**
1. Merges folders into single `debug-merged/` directory
2. **Skips** work-log consolidation (keeps `work-log_*.md` files as-is)
3. **Skips** plan consolidation (preserves all `*.plan.md` files)
4. Simple folder merge without intelligent file merging

**Result:** All files from all keys in single folder, no consolidation applied

---

### Example 6: Internal-only consolidation across multiple keys ⭐ NEW
```
/collapse-keys Key:prompt-* --internal-only: true --verbose: true
```

**What happens:**
1. Finds all folders matching `prompt-*` (prompt-enhancements, prompt-port, prompt-system-gaps, etc.)
2. **No folder merge** - each folder processed independently
3. For **each folder**:
   - Consolidates `work-log*.md` → `work-log.md`
   - Consolidates `*.plan.md` → `{key}.plan.md`
   - Merges JSON tracking files
   - Archives duplicates to `_ARCHIVE/` within that folder
4. **All original folders remain** (no deletion)

**Result:** Each `prompt-*` folder now has clean structure with single work-log, single plan

**Use Cases:**
- Cleanup multiple active keys without merging them
- Standardize file structure across all keys
- Maintenance on active development streams

---

### Example 7: Single key file cleanup (Auto-detected internal-only) ⭐ NEW
```
/collapse-keys Key:prompt-merged
```

**Auto-detects:**
- Exact key name (no wildcards)
- No `--name` provided
- **Automatically enables** `--internal-only: true`

**What happens:**
1. Consolidates files in existing `prompt-merged/` folder only
2. No folder creation/deletion
3. Merges work-logs, plans, JSON files
4. Archives duplicates to `_ARCHIVE/`
5. Updates README.md with consolidation note

**Result:** Clean file structure in single existing key

**Use Cases:**
- Quick cleanup of specific key without typing `--internal-only`
- Maintenance on single active key
- Re-consolidate existing merged keys

---

### Example 8: Dry-run internal consolidation (Safe Preview)
```
/collapse-keys Key:prompt-* --internal-only: true --dry-run: true --verbose: true
```

**What happens:**
1. Simulates internal consolidation across all `prompt-*` folders without making changes
2. For each folder, shows:
   - Which work-logs would merge
   - Which plan would become primary
   - What files would be archived
   - Final structure preview
3. **No files modified, no folders touched**

**Result:** Complete preview of what internal consolidation would do across multiple folders

---

## Implementation Algorithm

### Step 0: Mode Detection & Validation
```
FUNCTION ValidateAndDetectMode(pattern, internalOnly, name)
  
  // Auto-detect internal-only when exact key name + no --name
  IF NOT pattern.CONTAINS("*") AND NOT pattern.CONTAINS("?") AND name IS NULL THEN
    internalOnly = true
    LOG("Auto-detected exact key name, enabling --internal-only mode")
  END IF
  
  // Validate Internal-Only Mode
  IF internalOnly == true THEN
    IF name IS PROVIDED THEN
      WARN("--name parameter ignored in internal-only mode")
    END IF
    
    // Find all matching keys (wildcards allowed)
    basePath = ".github/key-data-streams/"
    matchedKeys = FindDirectories(basePath + pattern)
    
    IF matchedKeys.COUNT == 0 THEN
      HALT("ERROR: No keys found matching pattern '" + pattern + "'")
    END IF
    
    LOG("Internal-only mode: Will process " + matchedKeys.COUNT + " folder(s) independently")
    
    RETURN {
      mode: "internal-only",
      keys: matchedKeys,  // Multiple keys allowed
      operation: "consolidate-files-per-folder"
    }
  END IF
  
  // Folder Merge Mode validation
  IF name IS NOT PROVIDED THEN
    HALT("ERROR: --name required for folder merge mode (or use --internal-only for file consolidation)")
  END IF
  
  matchedKeys = FindDirectories(".github/key-data-streams/" + pattern)
  
  IF matchedKeys.COUNT == 0 THEN
    HALT("ERROR: No keys found matching pattern '" + pattern + "'")
  END IF
  
  LOG("Folder merge mode: Will merge " + matchedKeys.COUNT + " folder(s) into new key")
  
  RETURN {
    mode: "folder-merge",
    keys: matchedKeys,
    newKeyName: ExtractBaseName(pattern) + "-" + name,
    operation: "merge-folders-then-consolidate-files"
  }
  
END FUNCTION
```

### Step 1: Discovery & Analysis
```
FUNCTION DiscoverKeys(pattern, mode)
  basePath = ".github/key-data-streams/"
  matchedKeys = FindDirectories(basePath + pattern)
  
  LOG("Found " + matchedKeys.COUNT + " key(s) matching pattern '" + pattern + "'")
  
  FOR EACH key IN matchedKeys
    metadata = AnalyzeKeyStructure(key)
    metadata.workLogs = FindFiles(key + "/work-log*.md")
    metadata.plans = FindFiles(key + "/*.plan.md")
    metadata.jsonFiles = FindFiles(key + "/*.json")
    metadata.allFiles = ListAllFiles(key)
    
    LOG("  - " + key.name + ": " + metadata.workLogs.COUNT + " work-logs, " + metadata.plans.COUNT + " plans")
  END FOR
  
  RETURN matchedKeys, metadata
END FUNCTION
```

### Step 2: Work-Log Consolidation
```
FUNCTION ConsolidateWorkLogs(targetFolders, mode)
  stats = { totalProcessed: 0, totalMerged: 0 }
  
  FOR EACH folder IN targetFolders
    workLogFiles = FindFiles(folder + "/work-log*.md")
    
    // Skip if already consolidated
    IF workLogFiles.COUNT == 1 AND GetFileName(workLogFiles[0]) == "work-log.md" THEN
      LOG("✓ " + GetKeyName(folder) + ": work-log.md already consolidated")
      CONTINUE
    END IF
    
    // Sort chronologically (oldest first)
    workLogFiles = SortByTimestamp(workLogFiles, ascending=true)
    
    // Merge content
    keyName = GetKeyName(folder)
    mergedContent = "# Work Log: " + keyName + "\n\n"
    
    IF mode == "internal-only" THEN
      mergedContent += "**Last Consolidated**: " + GetCurrentDate() + " (Internal-Only Mode)\n\n"
      mergedContent += "---\n\n"
    END IF
    
    FOR EACH logFile IN workLogFiles
      mergedContent += "<!-- Merged from " + GetFileName(logFile) + " on " + GetCurrentDate() + " -->\n"
      mergedContent += ReadFile(logFile) + "\n\n"
      mergedContent += "---\n\n"
    END FOR
    
    // Write consolidated work-log
    WriteFile(folder + "/work-log.md", mergedContent)
    
    // Archive originals (skip if it's already work-log.md)
    FOR EACH logFile IN workLogFiles
      IF GetFileName(logFile) != "work-log.md" THEN
        archivePath = folder + "/_ARCHIVE/work-logs/" + GetFileName(logFile)
        CreateDirectory(GetDirectoryName(archivePath))
        CopyFile(logFile, archivePath)
        
        // Delete original after archiving
        DeleteFile(logFile)
      END IF
    END FOR
    
    stats.totalProcessed += 1
    stats.totalMerged += workLogFiles.COUNT
    LOG("✓ " + keyName + ": Consolidated " + workLogFiles.COUNT + " work-log files")
  END FOR
  
  RETURN stats
END FUNCTION
```
```

### Step 3: Plan Consolidation
```
FUNCTION ConsolidatePlans(targetFolders, mode)
  stats = { totalProcessed: 0, totalMerged: 0 }
  
  FOR EACH folder IN targetFolders
    planFiles = FindFiles(folder + "/*.plan.md")
    
    // Exclude archived plans
    planFiles = planFiles.WHERE(file => NOT file.path.CONTAINS("_ARCHIVE"))
    
    keyName = GetKeyName(folder)
    
    // Skip if already consolidated
    IF planFiles.COUNT == 1 AND GetFileName(planFiles[0]) == keyName + ".plan.md" THEN
      LOG("✓ " + keyName + ": " + keyName + ".plan.md already consolidated")
      CONTINUE
    END IF
    
    // Sort chronologically (oldest first)
    planFiles = SortByTimestamp(planFiles, ascending=true)
    
    // Merge into single plan file
    mergedContent = "# Plan: " + keyName + "\n\n"
    
    IF mode == "internal-only" THEN
      mergedContent += "**Last Consolidated**: " + GetCurrentDate() + " (Internal-Only Mode)\n\n"
      mergedContent += "---\n\n"
    END IF
    
    FOR EACH planFile IN planFiles
      mergedContent += "<!-- Merged from " + GetFileName(planFile) + " on " + GetCurrentDate() + " -->\n"
      mergedContent += ReadFile(planFile) + "\n\n"
      mergedContent += "---\n\n"
    END FOR
    
    // Write consolidated plan with key name
    WriteFile(folder + "/" + keyName + ".plan.md", mergedContent)
    
    // Archive originals (skip if it's already {keyName}.plan.md)
    FOR EACH planFile IN planFiles
      IF GetFileName(planFile) != keyName + ".plan.md" THEN
        archivePath = folder + "/_ARCHIVE/plans/" + GetFileName(planFile)
        CreateDirectory(GetDirectoryName(archivePath))
        CopyFile(planFile, archivePath)
        
        // Delete original after archiving
        DeleteFile(planFile)
      END IF
    END FOR
    
    stats.totalProcessed += 1
    stats.totalMerged += planFiles.COUNT
    LOG("✓ " + keyName + ": Consolidated " + planFiles.COUNT + " plan files")
  END FOR
  
  RETURN stats
END FUNCTION
```
```
FUNCTION ConsolidatePlans(matchedKeys, mergedKeyPath, mergedKeyName)
  planFiles = []
  
  // Collect all plan files
  FOR EACH key IN matchedKeys
    files = FindFiles(key.path + "/*.plan.md")
    FOR EACH file IN files
      planFiles.APPEND({
        path: file,
        sourceKey: key.name,
        timestamp: GetFileModificationTime(file),
        version: ExtractVersion(file),
        content: ReadFile(file)
      })
    END FOR
  END FOR
  
  // Select most recent as primary
  planFiles = SortByTimestamp(planFiles, descending=true)
  primaryPlan = planFiles[0]
  
  // Update plan metadata
  updatedContent = primaryPlan.content
  updatedContent = UpdatePlanVersion(updatedContent, "v2.0 (merged)")
  updatedContent = UpdatePlanKey(updatedContent, mergedKeyName)
  
  // Add merged-from section
  mergedFromSection = "\n## Merged From\n\n"
  FOR EACH plan IN planFiles
    mergedFromSection += "- `" + plan.sourceKey + "` - " + plan.version + " (merged on " + GetCurrentDate() + ")\n"
  END FOR
  updatedContent = InsertAfterMetadata(updatedContent, mergedFromSection)
  
  // Write primary plan
  WriteFile(mergedKeyPath + "/" + mergedKeyName + ".plan.md", updatedContent)
  
  // Archive other plans
  FOR EACH plan IN planFiles.Skip(1)
    archivePath = mergedKeyPath + "/_ARCHIVE/plans/" + GetFileName(plan.path)
    CreateDirectory(GetDirectoryName(archivePath))
    CopyFile(plan.path, archivePath)
  END FOR
  
  RETURN planFiles.COUNT
END FUNCTION
```

### Step 4: Validation & Cleanup
```
FUNCTION ValidateAndCleanup(matchedKeys, targetFolders, mode, stats)
  issues = []
  
  // === VALIDATION (Per Target Folder) ===
  
  FOR EACH folder IN targetFolders
    keyName = GetKeyName(folder)
    
    // Check work-log exists
    IF NOT FileExists(folder + "/work-log.md") THEN
      issues.APPEND("ERROR [" + keyName + "]: work-log.md not created")
    END IF
    
    // Check archive structure for archived files
    IF stats.workLogsArchived > 0 THEN
      IF NOT DirectoryExists(folder + "/_ARCHIVE/work-logs") THEN
        issues.APPEND("ERROR [" + keyName + "]: work-logs archive missing")
      END IF
    END IF
    
    IF stats.plansArchived > 0 THEN
      IF NOT DirectoryExists(folder + "/_ARCHIVE/plans") THEN
        issues.APPEND("ERROR [" + keyName + "]: plans archive missing")
      END IF
    END IF
    
    // Check file counts (root should be ≤10 files/folders)
    rootFiles = CountRootFiles(folder)
    IF rootFiles > 10 THEN
      issues.APPEND("WARNING [" + keyName + "]: Root has " + rootFiles + " files (exceeds 10-file limit)")
    END IF
  END FOR
  
  // === MODE-SPECIFIC CLEANUP ===
  
  IF mode == "folder-merge" THEN
    // Remove source key folders (folder-merge mode only)
    FOR EACH key IN matchedKeys
      IF DirectoryExists(key.path) THEN
        DeleteDirectory(key.path, recursive=true)
        LOG("Deleted source folder: " + key.name)
      END IF
    END FOR
    
  ELSE IF mode == "internal-only" THEN
    // No folder deletion - verify all folders still exist
    FOR EACH folder IN targetFolders
      IF NOT DirectoryExists(folder) THEN
        issues.APPEND("ERROR: Folder disappeared: " + folder)
      END IF
    END FOR
    
    LOG("✓ All " + targetFolders.COUNT + " source folders intact (internal-only mode)")
  END IF
  
  // Report validation results
  IF issues.COUNT > 0 THEN
    LOG("Validation completed with issues:")
    FOR EACH issue IN issues
      LOG("  - " + issue)
    END FOR
  ELSE
    LOG("✓ All validation checks passed")
  END IF
  
  RETURN issues.COUNT == 0
END FUNCTION
```

---

## Edge Cases & Error Handling

### Case 1: Empty Work-Logs
**Scenario:** Some work-log files are empty or contain only headers  
**Handling:** Skip empty files, add note in merged work-log: `<!-- work-log_empty.md was empty, skipped -->`

### Case 2: Conflicting Plan Versions
**Scenario:** Multiple plans with same version number  
**Handling:** Use file modification timestamp as tiebreaker, increment version to v2.0

### Case 3: Missing Canonical Files
**Scenario:** No work-log.md exists in any source key  
**Handling:** Create new work-log.md with initialization header:
```markdown
# Work Log: {merged-key}

**Created**: {merge-date}  
**Type**: Consolidated Key  
**Note**: No work-logs found in source keys

## Merge Summary
- Source keys: {list}
- Files merged: {count}
```

### Case 4: Circular Dependencies (Folder Merge Mode)
**Scenario:** Pattern matches merged key itself (`prompt-merged` matches `prompt-*`)  
**Handling:** Detect self-reference, apply re-consolidation mode (Example 6)

### Case 5: Large File Consolidation
**Scenario:** Combined work-log would exceed 500KB  
**Handling:** 
1. Warn user about large file
2. Offer to split by year: `work-log-2024.md`, `work-log-2025.md`
3. Create work-log.md with index pointing to yearly logs

### Case 6: JSON Merge Conflicts
**Scenario:** plan.json files have conflicting phase IDs  
**Handling:** Assign new sequential IDs, preserve original in metadata:
```json
{
  "phases": [
    {"id": 1, "originalId": "phase-1-key-a", "sourceKey": "prompt-enhancements"},
    {"id": 2, "originalId": "phase-1-key-b", "sourceKey": "prompt-port"}
  ]
}
```

### Case 7: Wildcard Pattern in Internal-Only Mode ⭐ UPDATED
**Scenario:** User runs `/collapse-keys Key:prompt-* --internal-only: true`  
**Handling:** 
- ✅ **Allowed**: Wildcard patterns now supported in internal-only mode
- **Behavior**: Processes each matching folder independently
- **Result**: All `prompt-*` folders have consolidated files, no folders merged/deleted

**Example:**
```
Input: /collapse-keys Key:prompt-* --internal-only: true
Matches: prompt-enhancements, prompt-port, prompt-system-gaps
Action: Consolidate files within each folder separately
Result: 3 folders, each with clean file structure
```

### Case 8: Single Key Already Consolidated (Internal-Only Mode)
**Scenario:** Key has only canonical files: `work-log.md`, `{key}.plan.md`  
**Handling:** 
- Skip consolidation, report: "Key 'documentation' already consolidated (only canonical files present)"
- Return success with 0 files merged

### Case 9: Empty Key Directory (Internal-Only Mode)
**Scenario:** Key exists but contains no work-log or plan files  
**Handling:** 
- Create minimal work-log.md: `# Work Log: {key}\n\n**Initialized**: {date}\n**Note**: No existing work-logs found`
- Report: "Created new work-log.md for empty key"

---

## Output Report Format

### Folder Merge Mode Report
```
╔════════════════════════════════════════════════════════════╗
║        COLLAPSE-KEYS CONSOLIDATION REPORT                  ║
║                   (FOLDER MERGE MODE)                      ║
╠════════════════════════════════════════════════════════════╣
║ Pattern:     prompt-*                                      ║
║ Merged Key:  prompt-merged                                 ║
║ Date:        2025-10-29 07:15:32                          ║
╚════════════════════════════════════════════════════════════╝

📦 SOURCE KEYS (4 matched)
  ✓ prompt-enhancements
  ✓ prompt-port
  ✓ prompt-system-gaps
  ✓ prompt-system-audit

📄 FILE CONSOLIDATION
  Work-Logs:
    ✓ work-log.md (primary)
    ✓ work-log_prompt-enhancements.md
    ✓ work-log_prompt-port.md
    ✓ work-log_prompt-system-gaps.md
    → Merged into: work-log.md (42 sessions, 15.2 KB)
    → Archived: 3 files to _ARCHIVE/work-logs/

  Plans:
    ✓ prompt-enhancements.plan.md (most recent, selected as primary)
    ✓ prompt-port.plan.md
    → Primary: prompt-merged.plan.md (v2.0)
    → Archived: 1 file to _ARCHIVE/plans/

  JSON Tracking:
    ✓ Merged 4 plan.json files (18 phases total)
    ✓ Merged 4 state.json files (67 requests tracked)

🗂️  FINAL STRUCTURE
  Root Files (7):
    ✓ prompt-merged.plan.md
    ✓ work-log.md
    ✓ prompt-merged.plan.json
    ✓ state.json
    ✓ rollback-index.md
    ✓ README.md
    ✓ test-file-finalization.ps1

  Archived Files (8):
    ✓ _ARCHIVE/work-logs/ (3 files)
    ✓ _ARCHIVE/plans/ (1 file)
    ✓ _ARCHIVE/duplicates/ (4 files)

✅ VALIDATION
  ✓ Single work-log.md exists
  ✓ Single plan file exists
  ✓ All source keys deleted (4 folders removed)
  ✓ Root file count: 7 (under limit)
  ✓ No content loss (all files archived)
  ✓ README.md generated

📊 STATISTICS
  Total Files Processed: 23
  Files in Root: 7
  Files Archived: 8
  Files Deleted: 8 (duplicates)
  Source Keys Deleted: 4
  Work-Log Sessions: 42
  Plan Version: v2.0 (merged)

📍 LOCATION
  Path: .github/key-data-streams/prompt-merged/
  README: .github/key-data-streams/prompt-merged/README.md
  Work-Log: .github/key-data-streams/prompt-merged/work-log.md

╔════════════════════════════════════════════════════════════╗
║ STATUS: ✅ CONSOLIDATION COMPLETE                          ║
╚════════════════════════════════════════════════════════════╝
```

### Internal-Only Mode Report
```
╔════════════════════════════════════════════════════════════╗
║        COLLAPSE-KEYS CONSOLIDATION REPORT                  ║
║                  (INTERNAL-ONLY MODE)                      ║
╠════════════════════════════════════════════════════════════╣
║ Pattern:     prompt-*                                      ║
║ Folders:     3 processed independently                     ║
║ Date:        2025-10-29 07:22:18                          ║
║ Mode:        In-Place File Consolidation                   ║
╚════════════════════════════════════════════════════════════╝

� FOLDERS PROCESSED (3)
  ✓ prompt-enhancements
  ✓ prompt-port
  ✓ prompt-system-gaps

�📄 FILE CONSOLIDATION (Per Folder)

  [prompt-enhancements]
  Work-Logs:
    ✓ work-log_2024-Q1.md
    ✓ work-log_2024-Q2.md
    → Merged into: work-log.md (12 sessions, 6.2 KB)
    → Archived: 2 files to _ARCHIVE/work-logs/
    → Deleted: 2 original files

  Plans:
    ✓ prompt-enhancements-draft.plan.md
    → Primary: prompt-enhancements.plan.md
    → Archived: 1 file to _ARCHIVE/plans/
    → Deleted: 1 original file

  [prompt-port]
  Work-Logs:
    ✓ work-log.md (already consolidated, skipped)
  
  Plans:
    ✓ prompt-port.plan.md (already consolidated, skipped)

  [prompt-system-gaps]
  Work-Logs:
    ✓ work-log_draft.md
    ✓ work-log_review.md
    → Merged into: work-log.md (8 sessions, 4.1 KB)
    → Archived: 2 files to _ARCHIVE/work-logs/
    → Deleted: 2 original files

🗂️  FINAL STRUCTURE (Per Folder)
  
  prompt-enhancements/ (Root: 4 files)
    ✓ prompt-enhancements.plan.md
    ✓ work-log.md
    ✓ state.json
    ✓ README.md
    ✓ _ARCHIVE/ (3 files)

  prompt-port/ (Root: 4 files)
    ✓ prompt-port.plan.md
    ✓ work-log.md
    ✓ state.json
    ✓ README.md

  prompt-system-gaps/ (Root: 4 files)
    ✓ prompt-system-gaps.plan.md
    ✓ work-log.md
    ✓ state.json
    ✓ README.md
    ✓ _ARCHIVE/ (2 files)

✅ VALIDATION
  ✓ All folders have single work-log.md
  ✓ All folders have primary plan file
  ✓ Root file counts: 4-4 files (under limit)
  ✓ All fragmented files archived
  ✓ Original files deleted (no duplicates)
  ✓ **All 3 source folders intact** (no folders deleted)
  ✓ README.md updated in each folder

📊 STATISTICS
  Total Folders Processed: 3
  Total Files Consolidated: 7
  Total Files Archived: 5
  Total Files Deleted: 5 (originals after archiving)
  Folders Modified: 2 (prompt-enhancements, prompt-system-gaps)
  Folders Skipped: 1 (prompt-port - already clean)

📍 LOCATIONS
  Path: .github/key-data-streams/
  Folders: prompt-enhancements/, prompt-port/, prompt-system-gaps/

╔════════════════════════════════════════════════════════════╗
║ STATUS: ✅ INTERNAL CONSOLIDATION COMPLETE                 ║
║ NOTE: No folders merged/deleted (internal-only mode)      ║
╚════════════════════════════════════════════════════════════╝
```
