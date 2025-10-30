# Agent Integration: Global Test Registry

**Purpose**: Enable plan, todo, and drift agents to discover and reuse existing Playwright tests.

**Created**: 2025-10-29 (hcp-refactor:session5)  
**Location**: `.github/tests/test-index.json`  
**Documentation**: `.github/tests/README.md`  
**Auto-Update**: `.github/tests/AUTO-UPDATE.md` ⚡ (Registry updates automatically!)

---

## 🔄 IMPORTANT: Registry Auto-Updates

The test registry **automatically updates** when:
- Test orchestration scripts run (using `.github/templates/test-orchestration-template.ps1`)
- Post-test creation hook is invoked (`.github/hooks/post-test-creation.ps1`)
- Manual rebuild is triggered (`.github/scripts/rebuild-test-index.ps1`)

**This means**: Always query the registry for current test data. It's kept up-to-date automatically.

See `.github/tests/AUTO-UPDATE.md` for complete details.

---

## Quick Reference

### For Plan Agent (plan.prompt.md)

**MANDATORY CHECK before planning new tests:**

```markdown
Step 2.5: Query Global Test Registry

1. Read: .github/tests/test-index.json
2. Search tests array for feature match:
   - Filter where feature contains {planned-feature-name}
   - Filter where tags overlap with {planned-tags}
   - Check similarityHash for exact duplicates

3. If match found:
   ✅ Reuse existing test
   - Add to plan: "Use existing test: {file}"
   - Reference orchestration: {orchestration}
   - Mark as "no new test creation needed"
   
4. If no match:
   ✅ Plan new test creation
   - Document: "New test will be registered in test-index.json"
   - Include orchestration script in plan
```

**Example Query (PowerShell)**:
```powershell
$testIndex = Get-Content ".github/tests/test-index.json" | ConvertFrom-Json
$matches = $testIndex.tests | Where-Object { 
    $_.feature -like "*HostControlPanel*" -or 
    ($_.tags | Where-Object { $_ -in @("host", "control", "panel") }).Count -gt 0
}
```

**Example Query (Node.js/TypeScript)**:
```typescript
import testIndex from './.github/tests/test-index.json';

const matches = testIndex.tests.filter(test => 
    test.feature.toLowerCase().includes('hostcontrolpanel') ||
    test.tags.some(tag => ['host', 'control', 'panel'].includes(tag))
);
```

---

### For Todo Agent (todo.prompt.md)

**MANDATORY CHECK before creating test files:**

```markdown
Pre-Creation Validation:

1. Load: .github/tests/test-index.json
2. Check if test exists:
   - By id: testIndex.tests.find(t => t.id === {planned-id})
   - By file: testIndex.tests.find(t => t.file === {planned-file})
   - By similarity: testIndex.tests.find(t => t.similarityHash === {calculated-hash})

3. If exists:
   ❌ SKIP creation
   - Update todo: "✅ Test exists: {file}"
   - Reference orchestration script
   - Mark task complete

4. If not exists:
   ✅ CREATE test file
   - Generate test code
   - Create orchestration script
   - **Immediately update test-index.json** (append new entry)
   - Update per-key registry (.github/key-data-streams/{key}/tests/test-registry.md)
```

**Update Test Index Example**:
```powershell
# Load existing index
$testIndex = Get-Content ".github/tests/test-index.json" | ConvertFrom-Json

# Create new entry
$newTest = @{
    id = "new-test-id"
    key = "hcp-refactor"
    file = "Tests/UI/new-test.spec.ts"
    feature = "New Feature"
    scenarios = @("scenario 1")
    tags = @("tag1", "tag2")
    similarityHash = "newfeature-tag1-tag2"
    reusable = $true
    created = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    orchestration = "Scripts/run-new-test.ps1"
    lastRun = $null
    status = "active"
}

# Append and save
$testIndex.tests += $newTest
$testIndex.metadata.totalTests++
$testIndex.metadata.lastUpdated = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

$testIndex | ConvertTo-Json -Depth 10 | Set-Content ".github/tests/test-index.json"
```

---

### For Drift Agent (drift.prompt.md)

**Drift Detection Scenarios:**

#### Scenario 1: Duplicate Tests (Same Feature/Tags)
```markdown
Detection:
1. Load test-index.json
2. Group tests by similarityHash
3. If count > 1 for any hash:
   - **DRIFT DETECTED**: Duplicate test scenarios

Remediation:
- Review duplicate tests
- Archive older/redundant test
- Update test-index.json (set status="archived")
- Update per-key registries
```

#### Scenario 2: Orphaned Tests (Not in Registry)
```markdown
Detection:
1. Scan Tests/UI/*.spec.ts files
2. Load test-index.json
3. For each file, check if exists in index:
   - If missing: **DRIFT DETECTED**: Orphaned test

Remediation:
- Add to test-index.json via rebuild-test-index.ps1
- OR delete if obsolete
```

#### Scenario 3: Missing Orchestration Scripts
```markdown
Detection:
1. Load test-index.json
2. Filter tests where orchestration === null
3. For each test, search for potential orchestration script
4. If found but not registered:
   - **DRIFT DETECTED**: Missing orchestration link

Remediation:
- Update test-index.json with correct orchestration path
- OR create orchestration script if missing
```

**Drift Report Template**:
```markdown
## Drift Report: Test Registry

**Date**: {timestamp}
**Type**: Duplicate Tests | Orphaned Tests | Missing Orchestration

### Issue
- Test: {file}
- Problem: {description}
- Similarity Hash: {hash}
- Duplicates: [{duplicate-files}]

### Recommended Action
1. {action-1}
2. {action-2}

### Impact
- **High**: Test duplication wastes CI/CD time
- **Medium**: Orphaned tests not tracked or maintained
- **Low**: Missing orchestration reduces reusability
```

---

## Similarity Hash Calculation

**Purpose**: Detect similar tests for reuse/deduplication

**Algorithm**:
```typescript
function calculateSimilarityHash(feature: string, tags: string[]): string {
    const normalized = feature.toLowerCase().replace(/\s+/g, '');
    const topTags = tags.sort().slice(0, 3).join('-');
    return `${normalized}-${topTags}`;
}
```

**Example**:
- Feature: "Host Control Panel"
- Tags: ["signalr", "baseline", "refactoring", "host"]
- Hash: `hostcontrolpanel-baseline-host-refactoring`

**Matching Logic**:
- **Exact match** (hash identical): Same test scenario → Reuse or merge
- **Partial match** (same feature, different tags): Similar test → Review for overlap
- **No match**: Unique test scenario → Create new

---

## Test Index Schema

```typescript
interface TestIndex {
    metadata: {
        version: string;
        lastUpdated: string; // ISO-8601
        totalTests: number;
        reusableTests: number;
        testsByType: {
            withOrchestration: number;
            withoutOrchestration: number;
        };
    };
    tests: TestEntry[];
}

interface TestEntry {
    id: string;                  // Unique identifier
    key: string;                 // KDS key (or "unknown")
    file: string;                // Relative path from workspace root
    feature: string;             // Primary feature name
    scenarios: string[];         // Test scenarios covered
    tags: string[];              // Tags for filtering/search
    similarityHash: string;      // For duplicate detection
    reusable: boolean;           // Has orchestration script?
    created: string;             // ISO-8601 timestamp
    orchestration: string | null; // Relative path to orchestration script
    lastRun: string | null;      // ISO-8601 timestamp of last run
    status: "active" | "archived" | "deprecated";
}
```

---

## Maintenance Scripts

### Rebuild Test Index
```powershell
# Scan all tests and regenerate index
.\.github\scripts\rebuild-test-index.ps1
```

### Search Tests
```powershell
# Search by feature
$testIndex = Get-Content ".github/tests/test-index.json" | ConvertFrom-Json
$testIndex.tests | Where-Object { $_.feature -like "*Debug*" } | Select-Object file, feature, tags

# Search by tag
$testIndex.tests | Where-Object { $_.tags -contains "percy" } | Select-Object file, tags

# Search without orchestration
$testIndex.tests | Where-Object { $null -eq $_.orchestration } | Select-Object file, feature
```

### Find Duplicates
```powershell
# Group by similarity hash
$testIndex = Get-Content ".github/tests/test-index.json" | ConvertFrom-Json
$testIndex.tests | Group-Object -Property similarityHash | Where-Object { $_.Count -gt 1 } | ForEach-Object {
    Write-Host "Duplicate hash: $($_.Name)" -ForegroundColor Yellow
    $_.Group | Select-Object file, feature, tags
}
```

---

## Integration Checklist

### For New Test Creation
- [ ] Query test-index.json for duplicates
- [ ] If no duplicates, create test file
- [ ] Create orchestration script
- [ ] Update test-index.json (append new entry)
- [ ] Update per-key test registry
- [ ] Commit both files together

### For Test Archival
- [ ] Update test-index.json (set status="archived")
- [ ] Move test file to Tests/UI/_ARCHIVE/
- [ ] Update per-key test registry (move to "Archived Tests")
- [ ] Remove orchestration script (or move to archive)
- [ ] Commit all changes together

### For Plan Review
- [ ] Load test-index.json
- [ ] Search for reusable tests matching planned features
- [ ] Include findings in plan (reuse vs. create new)
- [ ] Document decision rationale

---

## Statistics (Current)

**Total Tests**: 64  
**Reusable Tests**: 12 (with orchestration scripts)  
**Orphaned Tests**: 52 (without orchestration, needs investigation)  
**Last Updated**: 2025-10-29

---

## Next Steps

1. ✅ Test index created (.github/tests/test-index.json)
2. ✅ README documentation complete
3. ✅ Agent integration guide complete (this file)
4. 🔲 Update agent prompts to reference this file:
   - `.github/prompts/plan.prompt.md` - Add Step 2.5 (query test registry)
   - `.github/prompts/todo.prompt.md` - Add pre-creation validation
   - `.github/prompts/drift.prompt.md` - Add test drift detection
5. 🔲 Backfill key fields in test-index.json for known tests
6. 🔲 Create orchestration scripts for orphaned tests (or archive)
7. 🔲 Set up CI/CD validation (test-index.json must be updated with new tests)

---

*Enabling intelligent test discovery and reuse across NOOR Canvas development*
