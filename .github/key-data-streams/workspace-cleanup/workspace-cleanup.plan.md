# Workspace Cleanup Plan v1.0

**Key**: workspace-cleanup  
**Created**: 2025-10-26  
**Purpose**: Comprehensive workspace cleanup with default and aggressive modes  
**Status**: Draft

---

## Overview

This plan implements a thorough workspace cleanup system that:
- Analyzes all folders and subfolders for temporary, build, and unnecessary files
- Organizes documentation files under appropriate Workspaces folders
- Maintains .github folder cleanliness with strict guidelines
- Provides default (safe) and aggressive cleanup modes
- Includes recent findings from CDN implementation cleanup

## Cleanup Targets

### Build Artifacts (All Modes)
- `bin/` and `obj/` directories (all projects)
- `.vs/` Visual Studio cache
- `node_modules/.cache/` directories
- NuGet package cache for workspace
- Intermediate build outputs

### Test Results (Default Mode)
- `test-results/` folders (excluding `.last-run.json`)
- `PlayWright/test-results/`
- `PlayWright/results/`
- Percy snapshots cache
- Test coverage reports

### Test Results (Aggressive Mode)
- All test-results including `.last-run.json`
- All Playwright artifacts
- Complete test output history

### Temporary Files (All Modes)
- `*.tmp`, `*.temp` files
- Log files older than 7 days (default) / all logs (aggressive)
- PID files from server processes
- Backup files (`*.bak`, `*.backup`)
- OS temp files (Thumbs.db, .DS_Store)

### Documentation Organization
**Current Issues Identified:**
- MD files scattered across Scripts/, root, and various subdirectories
- Configuration docs mixed with implementation code
- No clear separation between user docs and dev docs

**Cleanup Actions:**
- Move implementation summaries to `Workspaces/Documentation/Implementation/`
- Move architecture docs to `Workspaces/Documentation/Architecture/`
- Move configuration guides to `Workspaces/Documentation/Configuration/`
- Keep quick-reference files in `.github/key-data-streams/{key}/`
- Preserve deployment docs in Scripts/ if actively used

### .github Folder Cleanliness
**Rules:**
- Only `instructions/`, `prompts/`, `key-data-streams/`, `workflows/` allowed
- No scattered MD files in root of .github
- Each key-data-stream must have: plan.md, plan.json, work-log.md
- Archive completed key-data-streams to `Workspaces/Archive/CompletedPlans/`

### Recent Findings Integration
Based on CDN implementation cleanup:
- Cloudflare service configuration scattered across Scripts/Resources-CDN/
- IIS configuration docs in .github/instructions/ (correct location)
- Test verification scripts in multiple locations
- Demo files (demo-cdn-image-load.html) need organization

---

## Cleanup Phases

### Phase 1: Analysis and Inventory
**Objective**: Scan workspace and generate cleanup report

**Steps:**
1. Traverse all directories from workspace root
2. Categorize files by type (build, test, temp, docs, code)
3. Calculate disk space usage per category
4. Identify orphaned files (no references)
5. Generate `cleanup-inventory.json` with findings
6. Create human-readable report in `Workspaces/Maintenance/cleanup-report-{timestamp}.md`

**Output:**
- Total files to clean
- Space to reclaim
- Documentation files to relocate
- Recommendations based on findings

### Phase 2: Safe Cleanup (Default Mode)
**Objective**: Remove obvious temporary and build artifacts

**Targets:**
- All `bin/` and `obj/` directories
- `.vs/` cache folders
- Test results (preserve .last-run.json)
- Logs older than 7 days
- Obvious temp files (*.tmp, *.bak)
- Empty directories

**Validations:**
- Verify no critical files in deletion list
- Preserve any files with git tracking
- Skip files modified in last 24 hours
- Create backup manifest before deletion

### Phase 3: Documentation Organization
**Objective**: Organize scattered MD files into proper structure

**Reorganization:**
```
Workspaces/Documentation/
├── Implementation/
│   ├── cdn-cloudflare-implementation.md
│   ├── image-transformation-summary.md
│   └── service-deployment.md
├── Architecture/
│   ├── cdn-architecture.md
│   ├── system-overview.md
│   └── component-diagrams.md
├── Configuration/
│   ├── iis-configuration.md
│   ├── cloudflare-setup.md
│   ├── cors-configuration.md
│   └── server-setup.md
├── QuickReference/
│   ├── cdn-quick-reference.md
│   ├── deployment-quick-reference.md
│   └── testing-quick-reference.md
└── Tools/
    ├── cleanup-scripts.md
    ├── diagnostic-tools.md
    └── utility-reference.md
```

**Actions:**
- Move files to appropriate folders
- Update internal links and references
- Create index.md in each folder
- Update README files with new locations

### Phase 4: .github Cleanup
**Objective**: Enforce .github folder standards

**Actions:**
- Archive completed key-data-streams to Workspaces/Archive/
- Verify each active key-data-stream has required files
- Remove any orphaned files
- Consolidate duplicate prompts
- Validate workflow files are up-to-date

**Standards Check:**
- Each key-data-stream: plan.md, plan.json, work-log.md exist
- No loose MD files in .github root
- Instructions folder contains only active guides
- Prompts folder has no duplicates

### Phase 5: Aggressive Cleanup (Optional)
**Objective**: Deep clean for maximum space recovery

**Additional Targets:**
- All test results including last-run markers
- All log files regardless of age
- All demo and example files
- Development databases (with confirmation)
- Archived SQL scripts older than 90 days
- All backup files

**Warnings:**
- Cannot be undone without git restore
- May remove useful reference materials
- Requires explicit user confirmation per category

### Phase 6: Validation and Reporting
**Objective**: Verify cleanup success and document results

**Validations:**
- Run build test to ensure no broken references
- Verify documentation links still work
- Check git status (nothing accidentally staged)
- Confirm .github structure compliance
- Run diagnostic scripts to verify app still works

**Report:**
- Files removed count
- Space reclaimed
- Documentation reorganization summary
- Any issues encountered
- Recommendations for maintenance

---

## Cleanup Rules Engine

### File Classification

**Build Artifacts:**
```
Patterns: **/bin/**, **/obj/**, **/.vs/**, **/node_modules/.cache/**
Action: Delete (all modes)
Validation: Not tracked in git or tracked with gitignore
```

**Test Results:**
```
Patterns: **/test-results/**, **/playwright-report/**
Action: Delete (default preserves .last-run.json)
Validation: Check if needed for debugging
```

**Temporary Files:**
```
Patterns: **/*.tmp, **/*.temp, **/*.log (>7 days default)
Action: Delete based on age threshold
Validation: Not referenced in active code
```

**Documentation Files:**
```
Patterns: **/*.md (outside standard locations)
Action: Relocate to Workspaces/Documentation/
Validation: Update all internal references
Exception: README.md, CHANGELOG.md in root
```

**Demo/Example Files:**
```
Patterns: **/demo-*.*, **/example-*.*, **/test-*.html
Action: Move to Workspaces/Examples/ or delete (aggressive)
Validation: Check if referenced in documentation
```

### Safety Mechanisms

**Pre-deletion Checks:**
1. File not in git index (unless specifically targeting git-ignored build files)
2. File not modified in last 24 hours (configurable)
3. File not referenced in any .csproj, .sln, or config files
4. File not part of active debugging session

**Backup Strategy:**
- Create manifest of all deleted files with paths
- Option to create zip backup before aggressive cleanup
- Ability to restore from manifest using git

**Dry Run Mode:**
- Show what would be deleted without deleting
- Generate detailed report of planned actions
- Allow user to exclude specific files/folders

---

## Configuration

### Default Mode Settings
```json
{
  "mode": "default",
  "preserveLogDays": 7,
  "preserveTestResults": true,
  "preserveLastRun": true,
  "backupBeforeClean": true,
  "dryRun": false,
  "excludePaths": [
    ".git",
    "node_modules",
    "packages",
    ".github/workflows"
  ]
}
```

### Aggressive Mode Settings
```json
{
  "mode": "aggressive",
  "preserveLogDays": 0,
  "preserveTestResults": false,
  "preserveLastRun": false,
  "backupBeforeClean": true,
  "dryRun": false,
  "includeArchives": true,
  "includeDemos": true,
  "excludePaths": [
    ".git",
    "node_modules",
    "packages"
  ]
}
```

---

## Execution Script

The `execute-plan.ps1` will provide:
- Interactive mode selection (default/aggressive/custom)
- Dry run option to preview changes
- Phase-by-phase execution with confirmation
- Progress reporting
- Rollback capability via manifest
- Final cleanup report generation

---

## Test Validation

### Post-Cleanup Tests
1. **Build Test**: `dotnet build` succeeds
2. **Link Validation**: All MD file links resolve
3. **App Start Test**: Application launches successfully
4. **Git Status**: No unintended changes
5. **Structure Validation**: .github folder complies with standards

### Success Criteria
- ✅ No build errors after cleanup
- ✅ All documentation accessible
- ✅ Space reclaimed >= 100MB (default) or >= 500MB (aggressive)
- ✅ No broken references in code
- ✅ .github folder meets standards
- ✅ Application runs successfully

---

## Integration with Recent Work

### CDN Implementation Files
**Current State:**
- Scripts/Resources-CDN/ contains mix of scripts, docs, and demos
- .github/key-data-streams/cdn-cloudflare-fix/ properly structured
- Test files in Tests/UI/ and Tests/Manual/

**Cleanup Actions:**
- Move README-SERVICE-FIX.md → Workspaces/Documentation/Configuration/
- Move cdn-test-links.md → Workspaces/Documentation/QuickReference/
- Keep scripts in Scripts/Resources-CDN/
- Move demo-cdn-image-load.html → Workspaces/Examples/CDN/
- Preserve test files in current locations

---

## Maintenance Recommendations

**Weekly:**
- Run default cleanup to remove build artifacts
- Check for scattered documentation files

**Monthly:**
- Review .github/key-data-streams for completed plans
- Archive old test results
- Validate documentation organization

**Quarterly:**
- Consider aggressive cleanup if disk space low
- Review and update cleanup rules
- Audit Workspaces folder structure

---

## Version History

### v1.0 (2025-10-26)
- Initial comprehensive cleanup plan
- Integrated CDN implementation findings
- Defined default and aggressive modes
- Created documentation organization structure
