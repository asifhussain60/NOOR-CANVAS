# Test Registry Protocol

**Purpose**: Prevent duplicate test generation through per-key registries and global test index.

**When to Load**: Before generating any test (Step 3-6), after test generation completion.

**Integration Point**: Called by test-generation.prompt.md during duplicate detection phase.

---

## Deduplication Workflow (MANDATORY)

**Before generating any test:**

1. **Check if test registry exists**: `.github/key-data-streams/{key}/tests/test-registry.md`
   - If missing → Create new registry using template below
   - If exists → Load and parse for duplicate detection

2. **Search for duplicate scenarios**:
   - Match by feature + scenario combination
   - Match by test file name pattern
   - If exact match found → **Skip generation**, inform user:
     ```
     ⚠️ Test already exists for this scenario
     
     Existing test: {test-file-name}.spec.ts
     Created: {timestamp}
     Last Run: {timestamp} ({PASS|FAIL})
     
     Skipping duplicate test generation.
     ```
   - If similar match found → Warn user, offer to generate variant

3. **Generate test** (if no duplicates found)

4. **Update test registry** immediately after generation:
   ```markdown
   ### {test-file-name}.spec.ts
   - **Created**: {ISO-8601-timestamp}
   - **Type**: Functional E2E | Visual Regression (Percy)
   - **Scenario**: {scenario-description}
   - **Phase**: Phase {N} (if from plan, otherwise "Ad-hoc")
   - **Status**: Active
   - **Last Run**: N/A (not yet executed)
   - **Orchestration**: scripts/{orchestration-script-name}.ps1
   ```

5. **Update global test index** (`.github/tests/test-index.json`) for cross-key reuse:
   - Read existing test-index.json
   - Generate test metadata:
     ```json
     {
       "id": "{key}-{test-identifier}",
       "key": "{key}",
       "file": "Tests/UI/{test-file-name}.spec.ts",
       "feature": "{primary-feature-name}",
       "scenarios": ["{scenario-1}", "{scenario-2}"],
       "tags": ["{tag1}", "{tag2}", "{tag3}"],
       "similarityHash": "{feature-name}-{primary-tags-concatenated}",
       "reusable": true|false,
       "created": "{ISO-8601-timestamp}",
       "orchestration": "Scripts/{orchestration-script}.ps1"
     }
     ```
   - Append to `tests` array
   - Update `metadata.totalTests` and `metadata.reusableTests` counters
   - Write updated test-index.json
   - **See**: `.github/tests/README.md` for similarity calculation algorithm

---

## Benefits

- ✅ Prevents duplicate test creation (per-key and global)
- ✅ Clear test inventory per key (test-registry.md)
- ✅ Cross-key test discovery and reuse (test-index.json)
- ✅ Facilitates test cleanup during Step 9 completion
- ✅ Enables test reuse across phases and keys

---

## Directory Structure Example

```
.github/key-data-streams/canvas/
├── canvas.md (key data stream)
├── tests/
│   ├── test-registry.md (log of all tests)
│   ├── share-button-functional.spec.ts
│   ├── share-button-visual.spec.ts
│   └── question-deletion-functional.spec.ts
└── scripts/
    ├── run-share-button-test.ps1
    └── run-question-deletion-test.ps1
```

---

## Test Registry Template

**File**: `.github/key-data-streams/{key}/tests/test-registry.md`

```markdown
# Test Registry: {key}

## Active Tests

### {test-file-name}.spec.ts
- **Created**: {ISO-8601-timestamp}
- **Type**: Functional E2E | Visual Regression (Percy)
- **Scenario**: {scenario-description}
- **Phase**: Phase {N} | Ad-hoc
- **Status**: Active | Archived | Deprecated
- **Last Run**: {ISO-8601-timestamp} (PASS|FAIL) | N/A
- **Orchestration**: scripts/{orchestration-script}.ps1
- **Notes**: Optional notes about test coverage, known issues, etc.

## Archived Tests

### {deprecated-test-name}.spec.ts
- **Created**: {ISO-8601-timestamp}
- **Archived**: {ISO-8601-timestamp}
- **Reason**: Duplicate of {replacement-test}.spec.ts | Feature deprecated | Merged into {test-name}
- **Orchestration**: scripts/{orchestration-script}.ps1 (REMOVED)

## Registry Metadata

- **Total Active Tests**: {count}
- **Total Archived Tests**: {count}
- **Last Updated**: {ISO-8601-timestamp}
- **Key**: {key}
```

---

## Global Test Index Format

**File**: `.github/tests/test-index.json`

```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "ISO-8601-timestamp",
    "totalTests": 0,
    "reusableTests": 0
  },
  "tests": [
    {
      "id": "{key}-{test-identifier}",
      "key": "{key}",
      "file": "Tests/UI/{test-file-name}.spec.ts",
      "feature": "{primary-feature-name}",
      "scenarios": ["scenario-1", "scenario-2"],
      "tags": ["tag1", "tag2", "tag3"],
      "similarityHash": "{feature-name}-{primary-tags-concatenated}",
      "reusable": true,
      "created": "ISO-8601-timestamp",
      "orchestration": "Scripts/{orchestration-script}.ps1"
    }
  ]
}
```

---

## Similarity Hash Calculation

**Purpose**: Detect reusable tests across keys by comparing feature/tag combinations.

**Algorithm** (from `.github/tests/README.md`):

1. Extract primary feature name (lowercase, no spaces)
2. Extract top 3 most relevant tags (alphabetically sorted)
3. Concatenate: `{feature}-{tag1}-{tag2}-{tag3}`
4. Hash using SHA-256 (first 16 characters)

**Example**:
- Feature: "Share Button"
- Tags: ["share", "permissions", "ui"]
- Similarity Hash: `sharebutton-permissions-share-ui` → `a3f2c1e4d5b6a7c8`

**Reuse Detection**:
- If `similarityHash` matches existing test in different key → Suggest reuse/adaptation
- If `feature` matches but hash differs → Suggest reviewing existing tests for overlap

---

## Integration Notes

**Call this protocol**:
- **Before** Step 3 (Functional Test Generation)
- **Before** Step 4 (Visual Regression Generation)
- **Before** Step 6 (Multi-Browser Generation)

**Update registries**:
- **After** each successful test file creation
- **After** orchestration script generation

**Reference**:
- See validation-protocol.md for key folder validation
- See drift-detection-protocol.md for handling duplicate detection as drift
- See test-generation.prompt.md for main execution flow
