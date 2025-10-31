# /collapse-keys

**⚠️ LOAD FIRST:** `.github/MANDATORY.md` (Enforce: No code in chat | Document first | Playwright orchestration)

---

## 🛡️ Step -1: KDS Governance Enforcement

**BEFORE processing any request, check:**

IF user request contains modifications to `.github/prompts/*.md` OR `.github/instructions/*.md`:
  - **HALT execution immediately**
  - Display enforcement message below
  - **STOP** (do not proceed to Step 0+)

**⚠️ GOVERNANCE ENFORCEMENT**

Changes to `.github` prompts/instructions must go through the KDS gatekeeper for compatibility analysis.

**Please use this command instead:**

```markdown
@workspace /kds request="[your change request here]"
```

**Why?** Ensures compatibility checks, prevents rule conflicts, and maintains architectural coherence.

**See:** `.github/prompts/kds.prompt.md` for governance protocol.

---

ELSE: Proceed to key consolidation

---

Scan the `.github/key-data-streams/` directory for all folders whose names match `<key-pattern>` and consolidate both folders AND files into a clean, standardized key structure.

**Two Modes:**
1. **Folder Merge Mode** (default) - Merges multiple keys into new consolidated key
2. **Internal-Only Mode** (`--internal-only: true`) - Consolidates files within single existing key (no folder merge)

---

## User-Facing Output Style (MANDATORY)
Must follow `.github/prompts/shared/output-style-mandate.md`.

- Use "🧠 Copilot Analysis" for internal reasoning (concise, no code).
- Use "📌 Summary for You" for user-facing bullets only.
- **MANDATORY**: Always end with "**What would you like to do next?**" with letter-based options (A, B, C, D).
- MAX 15 bullets total per response.

---

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

---

## Behavior

### Mode Selection

**Folder Merge + File Consolidation** (default when `--name` provided):
- Phase 1: Merge matching `{key}` folders → new consolidated folder
- Phase 2: Consolidate files within merged folder (work-logs, plans, JSON)
- Phase 3: Delete source folders
- Phase 4: Validate result
- **Requires**: `--name` parameter for wildcard patterns
- **Pattern**: Supports wildcards (`prompt-*`, `*-test`, `*.*`)

**Internal-Only Mode** (when `--internal-only: true`):
- Phase 1: SKIP (no folder merge)
- Phase 2: Consolidate files within **each matching folder independently**
- Phase 3: SKIP (no folder deletion)
- Phase 4: Validate each folder
- **Pattern**: Supports wildcards (`prompt-*`) or exact names (`prompt-merged`)
- **No `--name` required**: Works in-place on existing folders

**Auto-Detection Rules**:
1. Pattern + `--name` → Folder Merge + File Consolidation
2. Pattern + `--internal-only: true` → File Consolidation per folder
3. Exact key name (no wildcards) + no `--name` → Auto-enables `--internal-only: true`

---

## Parameters

### Key (required)
Pattern or exact name of keys to consolidate:
- Wildcards: `prompt-*`, `*-test`, `session-*`
- Exact: `prompt-merged`, `user-landing`

### --name (conditional)
New merged key suffix. **Required** for Folder Merge Mode with wildcards.

Example: `Key:prompt-* --name merged` → `.github/key-data-streams/prompt-merged/`

### --internal-only (optional, default: false)
Enable Internal-Only Mode (file consolidation within each folder, no merge).

### --dry-run (optional, default: false)
Simulate operation without making changes. Shows preview of:
- Which folders would merge (Folder Merge Mode)
- Which files would consolidate
- What would be archived
- Final structure preview

### --verbose (optional, default: false)
Detailed logging during execution (file-by-file operations).

### --no-archive (optional, default: false)
**USE WITH CAUTION**: Delete duplicate/old files instead of archiving.

### --keep-structure (optional, default: false)
Preserve original file names without consolidation (skip Phase 2 intelligent merging).

---

## Phase Execution

### Phase 1: Folder Consolidation

**LOAD MODULE:** `.github/prompts/shared/collapse-keys/folder-merge-protocol.md`

**When Executed**: Folder Merge Mode only (`--internal-only: false` AND `--name` provided)

**Operations**:
1. Discover and analyze all keys matching pattern
2. Create new consolidated folder: `.github/key-data-streams/<base-key>-<name>/`
3. Copy all files from source folders to merged folder
4. Handle file conflicts (archive duplicates)
5. Prepare for file consolidation

**Skipped When**: Internal-Only Mode (`--internal-only: true`)

**See Module**: folder-merge-protocol.md for complete discovery, merge, and cleanup algorithms

---

### Phase 2: File Consolidation (Intelligent Merging)

**LOAD MODULE:** `.github/prompts/shared/collapse-keys/file-consolidation-protocol.md`

**Always Executed**: Both Folder Merge Mode and Internal-Only Mode

**Applies To**:
- **Folder Merge Mode**: Files in newly created merged folder (from Phase 1)
- **Internal-Only Mode**: Files in **each matching folder independently**

**Operations**:
1. **Merge work-log files** into canonical `work-log.md`:
   - Chronologically merge all `work-log*.md` variants
   - Add merge markers: `<!-- Merged from {file} on {date} -->`
   - Archive originals to `_ARCHIVE/work-logs/`

2. **Consolidate plan files** into `{key}.plan.md`:
   - Select most recent as primary
   - Update metadata (key name, version, merged-from)
   - Archive superseded plans to `_ARCHIVE/plans/`

3. **Merge JSON tracking files**:
   - Consolidate `*.plan.json` → `{key}.plan.json`
   - Consolidate `*.state.json` → `state.json`
   - Deduplicate phases, preserve history

4. **Handle duplicate files**:
   - Archive to `_ARCHIVE/duplicates/` with source key prefix

5. **Consolidate rollback-index**:
   - Merge checkpoint history chronologically

6. **Enforce final structure**:
   ```
   .github/key-data-streams/{key}/
   ├── {key}.plan.md           # Primary plan
   ├── {key}.plan.json         # JSON tracking
   ├── work-log.md             # Canonical work log
   ├── state.json              # Current state
   ├── rollback-index.md       # Checkpoint history
   ├── tests/
   │   └── test-registry.md    # Test inventory
   └── _ARCHIVE/               # Historical artifacts
       ├── work-logs/
       ├── plans/
       ├── json/
       ├── duplicates/
       └── rollback/
   ```

**See Module**: file-consolidation-protocol.md for complete merging algorithms

**Related Specs**:
- `shared/work-log-format.md` - Work-log entry format and chronology
- `shared/json-tracking-schema.md` - JSON structure and validation

---

### Phase 3: Cleanup

**LOAD MODULE:** `.github/prompts/shared/collapse-keys/folder-merge-protocol.md` (Cleanup Section)

**When Executed**: Folder Merge Mode only

**Operations**:
1. Validate merged folder integrity
2. Delete all source folders that matched search pattern
3. Verify only single new merged folder exists

**Skipped When**: Internal-Only Mode (all original folders preserved)

**See Module**: folder-merge-protocol.md for cleanup and rollback procedures

---

### Phase 4: Validation

**LOAD MODULE:** `.github/prompts/shared/collapse-keys/validation-checklist.md`

**Always Executed**: Both modes (per target folder)

**Folder Merge Mode Checks**:
- ✅ Single `work-log.md` exists (no variants)
- ✅ Primary `{merged-key}.plan.md` exists
- ✅ All historical files archived
- ✅ Root directory ≤10 files
- ✅ No duplicate content in merged files
- ✅ All source folders deleted
- ✅ README.md generated
- ✅ File count matches expected (no data loss)

**Internal-Only Mode Checks** (per folder):
- ✅ Single `work-log.md` per folder (no variants)
- ✅ Single `{key}.plan.md` per folder
- ✅ Each folder root ≤10 files
- ✅ **All source folders intact** (no deletion)
- ✅ README.md updated per folder
- ✅ No duplicate content per folder

**See Module**: validation-checklist.md for complete integrity checks

---

## Output

### Auto-Generated README.md

After successful consolidation, creates or updates `README.md` in target folder(s):

**Folder Merge Mode**:
```markdown
# Key: {merged-key}

**Created**: {merge-date}  
**Type**: Consolidated Key  
**Source Keys**: {count} merged

## Merge Summary
**Total Files Processed**: {count}  
**Work-Logs Merged**: {count} files → 1 canonical work-log.md  
**Plans Consolidated**: {count} plans → 1 primary plan  
**Files Archived**: {count} files in _ARCHIVE/

## Source Keys
- `{key-1}` - {description}
- `{key-2}` - {description}

## Current Structure
- **Primary Plan**: {merged-key}.plan.md
- **Work Log**: work-log.md ({session-count} sessions)
- **Tracking**: {merged-key}.plan.json, state.json
- **Archive**: _ARCHIVE/ ({archived-count} files)

*Auto-generated by collapse-keys on {date}*
```

**Internal-Only Mode**:
```markdown
# Key: {key}

**Last Consolidated**: {date}  
**Type**: Internal Consolidation  
**Mode**: In-Place File Cleanup

## Consolidation Summary
**Work-Logs Merged**: {count} → 1 canonical  
**Plans Consolidated**: {count} → 1 primary  
**Files Archived**: {count} in _ARCHIVE/  
**Folder Changes**: None (in-place)

*Auto-generated by collapse-keys on {date}*
```

---

## Examples

### Example 1: Merge all prompt-related keys
```
/collapse-keys Key:prompt-* --name merged --verbose
```

**Result**: Single `prompt-merged/` folder with:
- Consolidated `work-log.md` from all sources
- Primary `prompt-merged.plan.md`
- All history in `_ARCHIVE/`
- Original `prompt-*` folders deleted

---

### Example 2: Dry-run preview
```
/collapse-keys Key:api-* --name consolidated --dry-run --verbose
```

**Result**: Complete preview without changes:
- Shows which files would merge
- Displays final structure
- No actual modifications

---

### Example 3: Internal consolidation across multiple keys
```
/collapse-keys Key:prompt-* --internal-only: true --verbose: true
```

**Result**: Each `prompt-*` folder independently cleaned:
- Each has single `work-log.md`
- Each has `{key}.plan.md`
- All folders preserved (no merge/deletion)

---

### Example 4: Single key cleanup (auto-detected)
```
/collapse-keys Key:prompt-merged
```

**Auto-detects**: Exact key name → enables `--internal-only: true`

**Result**: Consolidates files in `prompt-merged/` only (no folder changes)

---

## Error Handling

### Validation Failures

If Phase 4 validation fails:
1. Display validation report with specific issues
2. **DO NOT** delete source folders (Folder Merge Mode)
3. **DO NOT** proceed to cleanup
4. Preserve all data (no rollback needed)
5. User can fix issues and retry

### Critical Errors

**Data Loss Prevention**:
- Pre-flight file count check
- Archive before delete
- Validation before cleanup
- Source folders deleted only after validation passes

**Rollback Capability**:
- Folder Merge Mode: Can delete partial merged folder if validation fails
- Internal-Only Mode: Changes are in-place but reversible from `_ARCHIVE/`

**See Module**: folder-merge-protocol.md (Rollback Section)

---

## Related Documentation

- **Modules**:
  - `shared/collapse-keys/folder-merge-protocol.md` - Phase 1 & 3 algorithms
  - `shared/collapse-keys/file-consolidation-protocol.md` - Phase 2 merging
  - `shared/collapse-keys/validation-checklist.md` - Phase 4 validation

- **Specifications**:
  - `shared/work-log-format.md` - Work-log entry format
  - `shared/json-tracking-schema.md` - JSON structure specs
  - `.github/key-data-streams/README.md` - KDS canonical structure

---

## Version History

### v2.0.0 (2025-01-19)
- **MODULARIZATION**: Extracted algorithms to 3 shared modules
- folder-merge-protocol.md (350+ lines) - Discovery, merge, cleanup
- file-consolidation-protocol.md (450+ lines) - Work-log, plan, JSON merging
- validation-checklist.md (350+ lines) - Post-operation validation
- **REDUCTION**: 1,008 lines → 250 lines (75.2% reduction)
- All algorithms preserved with zero rule loss
- Enhanced documentation with module cross-references

### v1.0.0 (2025-10-29)
- Initial collapse-keys implementation
- Folder merge and internal-only modes
- Work-log/plan/JSON consolidation
- Archive management
