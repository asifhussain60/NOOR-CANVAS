# Global Test Registry

**Purpose**: Centralized knowledge base of all Playwright tests for cross-agent discovery and reuse.

**Created**: 2025-10-29  
**Key**: hcp-refactor (Session 5)  
**Protocol**: `.github/prompts/shared/test-gen/test-registry-protocol.md`

---

## Overview

This directory contains the **global test index** - a machine-readable catalog of all Playwright E2E tests in the NOOR Canvas project. This enables:

✅ **Test Discovery** - Agents (plan, todo, drift) can query existing tests  
✅ **Test Reuse** - Avoid duplicate test creation across keys  
✅ **Test Orchestration** - Find orchestration scripts for test execution  
✅ **Test Metadata** - Track scenarios, tags, status, last run results

---

## Files

### `test-index.json`
**Primary global test registry** - JSON database of all tests

**Structure:**
```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "ISO-8601-timestamp",
    "totalTests": 130,
    "reusableTests": 85,
    "testsByType": {
      "functional": 95,
      "visual": 25,
      "multi-browser": 10
    }
  },
  "tests": [
    {
      "id": "hcp-refactor-baseline",
      "key": "hcp-refactor-phase1",
      "file": "Tests/UI/hcp-refactor-baseline.spec.ts",
      "feature": "HostControlPanel",
      "scenarios": ["10-phase baseline validation", "transcript loading"],
      "tags": ["baseline", "refactoring", "host-control-panel", "signalr"],
      "similarityHash": "hostcontrolpanel-baseline-refactoring-signalr",
      "reusable": true,
      "created": "2025-10-29T00:00:00Z",
      "orchestration": ".github/key-data-streams/hcp-refactor-phase1/scripts/run-hcp-baseline-test.ps1",
      "lastRun": null,
      "status": "active"
    }
  ]
}
```

### `README.md`
This file - Documentation for global test registry

---

## Usage for Agents

### Plan Agent (plan.prompt.md)

**When creating a plan that includes testing:**

```markdown
**Step 2.5**: Query global test registry for existing tests

1. Read `.github/tests/test-index.json`
2. Search for tests matching planned feature:
   - Filter by `feature` field (fuzzy match)
   - Filter by `tags` (overlap detection)
   - Check `similarityHash` for exact duplicates
3. If reusable test found:
   - **Include in plan**: "Reuse existing test: {file} (orchestration: {script})"
   - **Do NOT plan new test creation**
4. If no match:
   - **Plan new test creation** with unique `id`
   - **Document in plan**: Test will be added to global registry
```

### Todo Agent (todo.prompt.md)

**When executing test-related tasks:**

```markdown
**Before creating test file:**

1. Load `.github/tests/test-index.json`
2. Check if test already exists (by `id`, `file`, or `similarityHash`)
3. If exists:
   - **Skip creation**
   - Update todo: "✅ Test already exists: {file}"
   - Reference orchestration script
4. If not exists:
   - Create test file
   - **Immediately update test-index.json** with new entry
   - Update per-key test registry (`.github/key-data-streams/{key}/tests/test-registry.md`)
```

### Drift Agent (drift.prompt.md)

**When detecting test-related drift:**

```markdown
**Drift Type**: Duplicate Test Detection

1. Load `.github/tests/test-index.json`
2. For each test in `Tests/UI/`:
   - Calculate `similarityHash`
   - Search global index for matches
3. If duplicate found:
   - **Report drift**: "Duplicate test detected"
   - **Remediation**: Archive one test, update registry
4. If orphaned test (not in registry):
   - **Report drift**: "Orphaned test (not registered)"
   - **Remediation**: Add to registry OR delete if obsolete
```

---

## Similarity Hash Algorithm

**Purpose**: Detect similar tests across different keys for reuse opportunities.

**Calculation**:
```typescript
function calculateSimilarityHash(feature: string, tags: string[]): string {
    // 1. Normalize feature name (lowercase, no spaces)
    const normalizedFeature = feature.toLowerCase().replace(/\s+/g, '');
    
    // 2. Sort tags alphabetically, take top 3
    const topTags = tags.sort().slice(0, 3);
    
    // 3. Concatenate
    const combined = `${normalizedFeature}-${topTags.join('-')}`;
    
    // 4. Return (no hashing for readability)
    return combined;
}
```

**Example**:
- Feature: "Host Control Panel"
- Tags: ["signalr", "baseline", "refactoring", "host"]
- Hash: `hostcontrolpanel-baseline-host-refactoring`

**Matching Logic**:
- **Exact match**: Same hash → Identical test scenario
- **Partial match**: Same feature, different tags → Similar test, check for reuse
- **No match**: Unique test scenario

---

## Maintenance

### Adding New Test

1. **Generate test file** (using test-generation.prompt.md)
2. **Create orchestration script** (Scripts/{key}-test.ps1)
3. **Update global registry**:
   ```bash
   # Manually or via automation
   node .github/scripts/update-test-index.js --add Tests/UI/new-test.spec.ts
   ```
4. **Update per-key registry**:
   - Add entry to `.github/key-data-streams/{key}/tests/test-registry.md`

### Archiving Test

1. **Mark as archived** in test-index.json:
   ```json
   {
     "status": "archived",
     "archivedDate": "2025-10-29T00:00:00Z",
     "archivedReason": "Duplicate of {replacement-test}"
   }
   ```
2. **Move test file**:
   ```bash
   mv Tests/UI/old-test.spec.ts Tests/UI/_ARCHIVE/old-test.spec.ts
   ```
3. **Update per-key registry** (move to "Archived Tests" section)

### Regenerating Index

```powershell
# Scan all tests and rebuild index
.\.github\scripts\rebuild-test-index.ps1
```

---

## Integration Points

### Protocol Files
- `.github/prompts/shared/test-gen/test-registry-protocol.md` - Registration protocol
- `.github/prompts/shared/step-7-5-test-registry-auto-update.md` - Auto-update workflow

### Agent Files
- `.github/prompts/plan.prompt.md` - Plan agent (test reuse detection)
- `.github/prompts/todo.prompt.md` - Todo agent (test creation guard)
- `.github/prompts/drift.prompt.md` - Drift agent (duplicate detection)

### Per-Key Registries
- `.github/key-data-streams/{key}/tests/test-registry.md` - Key-specific test log

---

## Statistics (Auto-Updated)

**Total Tests**: 130+ (as of 2025-10-29)  
**Reusable Tests**: TBD (after initial indexing)  
**Orphaned Tests**: TBD (tests without orchestration scripts)  
**Duplicate Tests**: TBD (duplicate scenarios across keys)

---

## Next Steps

1. ✅ Create test-index.json (initial scan)
2. 🔲 Create automation script (rebuild-test-index.ps1)
3. 🔲 Integrate into agent prompts (plan, todo, drift)
4. 🔲 Backfill per-key test registries
5. 🔲 Set up CI/CD validation (registry must be updated with new tests)

---

*Global Test Registry - Enabling intelligent test reuse across the NOOR Canvas project*
