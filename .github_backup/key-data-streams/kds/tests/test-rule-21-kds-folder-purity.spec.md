# Test: Rule #21 KDS Folder Purity

**Rule**: `.github/key-data-streams/` MUST contain ONLY data streams (state.json, plan files, work-logs, test artifacts). NO architecture docs, design documentation, reference materials, validation scripts, or schemas.

**Severity**: HIGH

**Last Tested**: Never

---

## Assertion

KDS folder enforces strict separation: data streams (transient, execution-specific) vs design docs (permanent, reference material)

---

## Test Scope

**Directory Under Test**:
- `.github/key-data-streams/` (root and all subdirectories)

**Validation Function**: `ValidateKDSFolderPurity()` (kds-rulebook.json)

---

## Test Steps

### Step 1: Scan KDS Root Directory

**Search `.github/key-data-streams/` root** (not subdirectories):
```
Scan for prohibited file patterns:
  - README.md
  - *-INDEX.md
  - index.md
  - MIGRATION-REPORT-*.md
  - _SCHEMA/
  - validate-*.ps1
  - *.plan.md (orphaned plans not in key folders)
```

**Algorithm**:
```
FOR EACH file/folder in .github/key-data-streams/:
  IF matches prohibited pattern:
    Record violation with file path
    Suggest correct relocation path
```

### Step 2: Verify Key Directory Structure

**Check each key directory** (`.github/key-data-streams/{key}/`):
```
FOR EACH key_dir in .github/key-data-streams/*/:
  Verify allowed file types only:
    - {key}.plan.md OR plan.md
    - {key}.plan.json (optional)
    - work-log.md
    - state.json
    - rollback-index.md
    - tests/ (folder with *.spec.ts files)
    - handoffs/ (folder with *.json files)
    - scripts/ (folder with key-specific *.ps1 orchestration)
  
  Flag prohibited files:
    - README.md (design doc, belongs in .github/instructions/Links/)
    - schema.json (belongs in .github/schemas/key-data-streams/)
    - *.md (non-plan documentation)
```

### Step 3: Detect Misplaced Design Docs

**Search for design documentation patterns**:
```
Prohibited patterns in KDS:
  - README.md (overview/architecture docs)
  - DESIGN.md, ARCHITECTURE.md (design docs)
  - CDN-KEYS-INDEX.md (catalog/reference)
  - MIGRATION-REPORT-*.md (historical reports)
  - HOW-TO-*.md (instructional guides)
```

**Correct locations**:
```
README.md → .github/instructions/Links/KeyDataStreamsQuickRef.md
CDN-KEYS-INDEX.md → .github/instructions/Links/KeyDataStreamsCatalog.md
MIGRATION-REPORT-*.md → Workspaces/Documentation/Archives/
Design docs → .github/instructions/Links/ or Docs/
```

### Step 4: Detect Misplaced Schemas

**Search for schema files**:
```
Prohibited patterns in KDS:
  - _SCHEMA/ (folder)
  - schema.json, *-schema.json
  - *.xsd, *.proto (schema files)
```

**Correct location**:
```
All schemas → .github/schemas/key-data-streams/
Example:
  _SCHEMA/plan-schema.json → .github/schemas/key-data-streams/plan-schema.json
```

### Step 5: Detect Misplaced Scripts

**Search for validation/utility scripts**:
```
Prohibited patterns in KDS root:
  - validate-*.ps1 (validation scripts)
  - cleanup-*.ps1 (utility scripts)
  - analyze-*.ps1 (analysis scripts)
  - *.bat, *.sh (shell scripts)
```

**Correct location**:
```
All scripts → Workspaces/Scripts/ OR Scripts/ (workspace root)
EXCEPTION: Key-specific orchestration scripts allowed in {key}/scripts/
```

### Step 6: Verify _ARCHIVE and _template

**Check special folders**:
```
✅ ALLOWED:
  - _ARCHIVE/ (historical data streams only)
  - _template/ (template files for new keys)

❌ NOT ALLOWED in _ARCHIVE:
  - Design docs (should be in Workspaces/Documentation/Archives/)
  - Scripts (should be in Workspaces/Scripts/_ARCHIVE/)
  - Schemas (should be in .github/schemas/_ARCHIVE/)
```

---

## Expected Outcomes

### ✅ PASS Criteria

**KDS Root Directory**:
1. NO README.md, index.md, or *-INDEX.md files
2. NO _SCHEMA/ directory
3. NO validation scripts (validate-*.ps1)
4. NO orphaned plan files (*.plan.md not in key directory)
5. ONLY allowed: _ARCHIVE/, _template/, {key}/ directories

**Key Directories**:
1. ONLY data files: plan.md, work-log.md, state.json, rollback-index.md
2. ONLY data folders: tests/, handoffs/, scripts/ (key-specific orchestration)
3. NO design docs (README.md, DESIGN.md)
4. NO schemas (schema.json)
5. NO general-purpose scripts

**Example PASS**:
```
✅ KDS root clean (no prohibited files)
✅ _ARCHIVE/ contains only historical data streams
✅ All key directories contain only data files
✅ No design docs found in KDS
✅ No schemas found in KDS
✅ No utility scripts found in KDS root
```

### ❌ FAIL Criteria

**HIGH Violations**:
1. Design documentation found in KDS (README.md, DESIGN.md, *-INDEX.md)
2. Schemas found in KDS (_SCHEMA/, schema.json)
3. Orphaned plan files in KDS root (not in key directory)

**MEDIUM Violations**:
1. Utility scripts in KDS root (validate-*.ps1, cleanup-*.ps1)
2. Historical reports in KDS (MIGRATION-REPORT-*.md)
3. Instructional guides in KDS (HOW-TO-*.md)

---

## Violation Examples

### Example 1: Design Doc in KDS Root (HIGH)

**File**: `.github/key-data-streams/README.md`  
**Type**: Architecture documentation  
**Size**: 5 KB

**Impact**:
- Violates data-only principle
- Creates confusion about what's authoritative (KDS data vs design docs)
- Makes cleanup difficult (unclear if it's transient or permanent)

**Fix**:
```powershell
# Move to correct location
Move-Item ".github/key-data-streams/README.md" ".github/instructions/Links/KeyDataStreamsQuickRef.md"

# Update references (if any)
grep -r "key-data-streams/README.md" .github/prompts/
# Update file paths in prompts

# Commit
git add .github/instructions/Links/KeyDataStreamsQuickRef.md
git commit -m "refactor(kds): Move README to Links/ per Rule #21 (KDS Folder Purity)"
```

### Example 2: Schema Directory in KDS (HIGH)

**Folder**: `.github/key-data-streams/_SCHEMA/`  
**Contents**: plan-schema.json, state-schema.json, handoff-schema.json

**Impact**:
- Schemas are design artifacts, not data streams
- Violates separation of concerns

**Fix**:
```powershell
# Move entire _SCHEMA/ directory
Move-Item ".github/key-data-streams/_SCHEMA" ".github/schemas/key-data-streams"

# Verify schemas accessible
Test-Path ".github/schemas/key-data-streams/plan-schema.json"  # Should be True

# Update references
grep -r "_SCHEMA/" .github/prompts/
# Update paths to .github/schemas/key-data-streams/

# Commit
git add .github/schemas/key-data-streams/
git commit -m "refactor(kds): Move schemas to .github/schemas/ per Rule #21"
```

### Example 3: Utility Script in KDS Root (MEDIUM)

**File**: `.github/key-data-streams/validate-kds.ps1`  
**Type**: Validation script

**Impact**:
- Scripts are tooling, not data
- Belongs in Workspaces/Scripts/ for discoverability

**Fix**:
```powershell
# Move to correct location
Move-Item ".github/key-data-streams/validate-kds.ps1" "Workspaces/Scripts/validate-kds.ps1"

# Update task references (if any)
# Check .vscode/tasks.json for script paths

# Commit
git add Workspaces/Scripts/validate-kds.ps1
git commit -m "refactor(kds): Move validation script to Workspaces/Scripts/ per Rule #21"
```

### Example 4: Orphaned Plan File (HIGH)

**File**: `.github/key-data-streams/cdn-integration.plan.md`  
**Location**: KDS root (not in cdn-integration/ directory)

**Impact**:
- Violates key directory structure
- Plan file should be in `.github/key-data-streams/cdn-integration/plan.md`

**Fix**:
```powershell
# Create key directory if missing
New-Item -ItemType Directory -Force -Path ".github/key-data-streams/cdn-integration"

# Move plan to correct location
Move-Item ".github/key-data-streams/cdn-integration.plan.md" ".github/key-data-streams/cdn-integration/plan.md"

# Commit
git add .github/key-data-streams/cdn-integration/
git commit -m "fix(kds): Move orphaned plan to key directory per Rule #21"
```

---

## Rollback on Failure

### Automated Cleanup Workflow:

**Step 1: Identify Violations**
```powershell
$violations = @()

# Scan KDS root for prohibited files
$prohibitedPatterns = @(
    "README.md", "*-INDEX.md", "index.md", "MIGRATION-REPORT-*.md",
    "_SCHEMA", "validate-*.ps1", "*.plan.md"
)

Get-ChildItem ".github/key-data-streams/" -File | ForEach-Object {
    if ($prohibitedPatterns | Where-Object { $_.Name -like $_ }) {
        $violations += @{
            File = $_.FullName
            Type = "Prohibited file in KDS root"
            Recommendation = "Move to correct location"
        }
    }
}
```

**Step 2: Suggest Relocations**
```powershell
foreach ($violation in $violations) {
    $file = $violation.File
    $recommendation = switch -Wildcard ($file) {
        "*README.md" { ".github/instructions/Links/KeyDataStreamsQuickRef.md" }
        "*-INDEX.md" { ".github/instructions/Links/KeyDataStreamsCatalog.md" }
        "*MIGRATION-REPORT*" { "Workspaces/Documentation/Archives/" }
        "*_SCHEMA*" { ".github/schemas/key-data-streams/" }
        "*.ps1" { "Workspaces/Scripts/" }
        default { "Unknown relocation" }
    }
    
    Write-Host "⚠️ $file → $recommendation"
}
```

**Step 3: Execute Relocations (Dry Run)**
```powershell
# Present relocations to user for approval
Write-Host "Found $($violations.Count) violations. Relocate? (Y/N)"
$approve = Read-Host

if ($approve -eq "Y") {
    # Execute moves (implement actual relocation logic)
    foreach ($violation in $violations) {
        # Move files to recommended locations
        # Update references in prompts
        # Create manifest of changes
    }
}
```

---

## Automated Checks

**Pre-Commit Hook**:
```powershell
# Block commits with prohibited files in KDS
$kdsFiles = git diff --cached --name-only | Where-Object { $_ -match "^.github/key-data-streams/" }

foreach ($file in $kdsFiles) {
    if ($file -match "README.md|INDEX.md|_SCHEMA|validate-.*.ps1") {
        Write-Error "HIGH: Rule #21 violation - Prohibited file in KDS: $file"
        Write-Error "KDS folder must contain ONLY data streams, not design docs/schemas/scripts"
        exit 1
    }
}
```

**KDS Review Mode Integration**:
- Execute this test during kds.prompt.md Review Mode Step 2 (Scan Folder Structure)
- Report purity violations in Step 4 (Consolidate Findings)
- Auto-fix available: Relocate files to correct locations with manifest

---

## Test Metadata

**Test ID**: test-rule-21-kds-folder-purity  
**Category**: Governance  
**Frequency**: Every KDS Review Mode + Pre-commit  
**Auto-Fix**: Supported (relocate files with manifest)  
**Related Tests**: test-rule-10-kds-governance, test-rule-8-holistic-regeneration  
**Estimated Runtime**: <10 seconds (folder scan)

---

## Correct KDS Structure Reference

```
.github/key-data-streams/
├── _ARCHIVE/                    # Historical data streams ONLY
│   └── {archived-key}/
│       ├── plan.md
│       ├── work-log.md
│       └── state.json
├── _template/                   # Template files for new keys
│   ├── plan.md
│   └── work-log.md
├── {key}/                       # Active key directories
│   ├── plan.md                  # ✅ ALLOWED (data)
│   ├── work-log.md              # ✅ ALLOWED (data)
│   ├── state.json               # ✅ ALLOWED (data)
│   ├── rollback-index.md        # ✅ ALLOWED (data)
│   ├── tests/                   # ✅ ALLOWED (data)
│   │   └── *.spec.ts
│   ├── handoffs/                # ✅ ALLOWED (data)
│   │   └── *.json
│   └── scripts/                 # ✅ ALLOWED (key-specific orchestration)
│       └── run-{key}-test.ps1
└── [NO OTHER FILES]             # ❌ Design docs, schemas, scripts go elsewhere

CORRECT LOCATIONS for prohibited items:
- Design docs → .github/instructions/Links/
- Schemas → .github/schemas/key-data-streams/
- Validation scripts → Workspaces/Scripts/
- Historical reports → Workspaces/Documentation/Archives/
```
