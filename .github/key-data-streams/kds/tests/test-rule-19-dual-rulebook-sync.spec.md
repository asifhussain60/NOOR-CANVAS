# Test: Rule #19 Dual Rulebook Sync

**Rule**: kds-rulebook.json and kds-rulebook.md MUST be updated together atomically in the same commit

**Severity**: CRITICAL

**Last Tested**: Never

---

## Assertion

Machine-readable (JSON) and human-readable (MD) rulebooks must stay perfectly synchronized to prevent governance trust model breakdown

---

## Test Scope

**Files Under Test**:
- `.github/governance/kds-rulebook.json` (canonical machine-readable source)
- `.github/governance/kds-rulebook.md` (human-readable documentation)

**Validation Function**: `ValidateDualRulebookSync()` (kds-rulebook.json)

---

## Test Steps

### Step 1: Parse Both Rulebooks

**JSON Parsing**:
```
Read kds-rulebook.json
Extract:
  - version
  - lastUpdated
  - rules array (id, number, statement, category, severity)
  - Total rule count
```

**Markdown Parsing**:
```
Read kds-rulebook.md
Extract:
  - version (from "Version:" line)
  - lastUpdated (from "Last Updated:" line)
  - rules (from "### Rule #N:" headings)
  - Total rule count
```

### Step 2: Compare Metadata

**Version Numbers**:
```
IF JSON.version != MD.version:
  Record CRITICAL violation: "Version mismatch - JSON: {json_ver}, MD: {md_ver}"
```

**Last Updated Timestamps**:
```
IF JSON.lastUpdated != MD.lastUpdated:
  Record HIGH violation: "Timestamp mismatch - JSON: {json_ts}, MD: {md_ts}"
```

### Step 3: Compare Rule Count

**Total Rules**:
```
json_count = LENGTH(JSON.mandatoryRules) + LENGTH(JSON.agenticRules) + LENGTH(JSON.handoffProtocol)
md_count = COUNT("### Rule #" patterns in MD)

IF json_count != md_count:
  Record CRITICAL violation: "Rule count mismatch - JSON: {json_count}, MD: {md_count}"
```

### Step 4: Compare Rule Content

**For each rule ID (1-21)**:
```
FOR rule_id in 1..21:
  json_rule = FIND rule in JSON by rule_id
  md_rule = FIND "### Rule #{rule_id}:" in MD
  
  Compare:
    - Rule title/statement
    - Category
    - Severity
    - Enforcement type
  
  IF ANY field mismatches:
    Record HIGH violation: "Rule #{rule_id} content mismatch - Field: {field}, JSON: {json_val}, MD: {md_val}"
```

### Step 5: Check Git Commit History (Retroactive Sync)

**Algorithm**:
```
Get last commit modifying kds-rulebook.json → commit_json
Get last commit modifying kds-rulebook.md → commit_md

IF commit_json != commit_md:
  Record HIGH violation: "Rulebooks modified in separate commits - JSON: {commit_json}, MD: {commit_md}"
```

**Rationale**: Rule #19 requires atomic updates (same commit)

---

## Expected Outcomes

### ✅ PASS Criteria

1. **Version Match**: JSON.version == MD.version
2. **Timestamp Match**: JSON.lastUpdated == MD.lastUpdated
3. **Rule Count Match**: JSON total rules == MD total rules (currently 21)
4. **Content Match**: All 21 rules have identical titles, categories, severities
5. **Commit Sync**: Last modification to both files in same commit

**Example PASS**:
```
✅ Version: 2.2.0 (JSON) == 2.2.0 (MD)
✅ Last Updated: 2025-11-01 (JSON) == 2025-11-01 (MD)
✅ Rule Count: 21 (JSON) == 21 (MD)
✅ Rule Content: 100% match across all fields
✅ Last Commit: abc1234 (both files)
```

### ❌ FAIL Criteria

**CRITICAL Violations**:
1. Version mismatch (different governance states)
2. Rule count mismatch (missing or extra rules)
3. Rule content mismatch (conflicting rule definitions)

**HIGH Violations**:
1. Timestamp mismatch (unclear which is current)
2. Commit desync (modified in separate commits)

---

## Violation Examples

### Example 1: Version Mismatch (CRITICAL)

**Detected**:
```
❌ Version: 2.2.0 (JSON) != 2.1.0 (MD)
```

**Impact**: 
- Agents reading MD trained on v2.1.0 rules
- Validation functions enforcing v2.2.0 rules
- Undefined behavior when rules conflict

**Fix**:
```
Update kds-rulebook.md version to 2.2.0
Regenerate MD from JSON (canonical source)
Commit both files together: "sync(kds): Update rulebook MD to v2.2.0 (sync with JSON)"
```

### Example 2: Rule Count Mismatch (CRITICAL)

**Detected**:
```
❌ Rule Count: 21 (JSON) != 20 (MD)
```

**Impact**: 
- Missing rule documentation (Rule #21 not in MD)
- Agents unaware of new rule enforcement

**Fix**:
```
Identify missing rule: grep "Rule #21" kds-rulebook.md → Not found
Add Rule #21 to kds-rulebook.md (copy from JSON)
Commit both files together: "sync(kds): Add Rule #21 to MD (KDS Folder Purity)"
```

### Example 3: Commit Desync (HIGH)

**Detected**:
```
❌ Last Commit: abc1234 (JSON) != def5678 (MD)
```

**Impact**: 
- Rulebooks modified in separate commits (violates atomic update requirement)
- Unclear which file is authoritative

**Fix**:
```
Identify which file has correct content (JSON is canonical)
Regenerate MD from JSON
Commit both together: "fix(kds): Sync rulebook MD with JSON (atomic update)"
```

---

## Rollback on Failure

### If Desync Detected:

**Step 1: Determine Canonical Source**
- JSON is ALWAYS canonical (machine-readable, used by validation functions)
- MD is derived from JSON (human-readable documentation)

**Step 2: Regenerate MD from JSON**
```
Algorithm: GenerateMarkdownFromJSON(kds-rulebook.json)
  - Parse JSON rules array
  - Generate "### Rule #N:" sections for each rule
  - Populate metadata (version, lastUpdated, description)
  - Write to kds-rulebook.md
```

**Step 3: Verify Sync**
```
Run test-rule-19-dual-rulebook-sync.spec.md again
Verify 100% match across all fields
```

**Step 4: Commit Both Files**
```
git add .github/governance/kds-rulebook.json .github/governance/kds-rulebook.md
git commit -m "fix(kds): Sync rulebook MD with JSON per Rule #19 (atomic update)"
```

---

## Automated Checks

**Pre-Commit Hook**:
```powershell
# Prevent single-file rulebook commits
$stagedFiles = git diff --cached --name-only

$jsonModified = $stagedFiles -contains ".github/governance/kds-rulebook.json"
$mdModified = $stagedFiles -contains ".github/governance/kds-rulebook.md"

if ($jsonModified -xor $mdModified) {
    Write-Error "CRITICAL: Rule #19 violation - Both rulebooks must be updated together"
    Write-Error "Modified: $(if ($jsonModified) { 'JSON only' } else { 'MD only' })"
    Write-Error "Required: Commit kds-rulebook.json AND kds-rulebook.md in same commit"
    exit 1
}

if ($jsonModified -and $mdModified) {
    # Verify sync before allowing commit
    $jsonContent = Get-Content ".github/governance/kds-rulebook.json" -Raw | ConvertFrom-Json
    $mdContent = Get-Content ".github/governance/kds-rulebook.md" -Raw
    
    $jsonVersion = $jsonContent.version
    $mdVersion = ($mdContent -match 'Version:\s*(\S+)')[0] -replace 'Version:\s*', ''
    
    if ($jsonVersion -ne $mdVersion) {
        Write-Error "CRITICAL: Version mismatch - JSON: $jsonVersion, MD: $mdVersion"
        exit 1
    }
}
```

**KDS Review Mode Integration**:
- Execute this test during kds.prompt.md Review Mode Step 3 (Validate Against Rulebook)
- Report sync status in compliance summary
- Auto-fix available: Regenerate MD from JSON

---

## Test Metadata

**Test ID**: test-rule-19-dual-rulebook-sync  
**Category**: Governance  
**Frequency**: Every commit modifying rulebooks + Every KDS Review Mode  
**Auto-Fix**: Supported (regenerate MD from JSON)  
**Related Tests**: test-rule-10-kds-governance, test-rule-18-router-exemption  
**Estimated Runtime**: <10 seconds (file parsing + comparison)

---

## Sync Algorithm Reference

**Function**: `GenerateMarkdownFromJSON(jsonPath, mdPath)`

**Steps**:
1. Parse kds-rulebook.json
2. Extract metadata (version, lastUpdated, description)
3. Extract all rules (mandatoryRules, agenticRules, handoffProtocol)
4. Generate markdown sections:
   - Header with version/date
   - Quick Reference summary
   - Rule sections grouped by category
   - Validation functions table
   - Version history
5. Write to kds-rulebook.md
6. Verify sync (re-run this test)

**Usage**:
```
When JSON updated:
  1. Modify kds-rulebook.json (canonical source)
  2. Run GenerateMarkdownFromJSON()
  3. Review generated kds-rulebook.md
  4. Commit both files together
```
