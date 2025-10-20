# Global Test Index

**Location**: `.github/tests/test-index.json`  
**Purpose**: Centralized registry of all reusable Playwright tests across all keys  
**Version**: 1.0

---

## Overview

The global test index enables test reuse across different keys by tracking test metadata, features, scenarios, and similarity patterns. This prevents duplicate test creation and promotes test consistency.

---

## Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": "string",
  "lastUpdated": "ISO 8601 timestamp",
  "tests": [
    {
      "id": "unique-test-identifier",
      "key": "originating-key-name",
      "file": "relative/path/to/test.spec.ts",
      "feature": "Feature Name",
      "description": "What this test validates",
      "scenarios": ["scenario 1", "scenario 2"],
      "reusable": true|false,
      "tags": ["tag1", "tag2"],
      "similarityHash": "feature-keyword-pattern",
      "created": "ISO 8601 timestamp",
      "lastUsed": "ISO 8601 timestamp",
      "usageCount": number,
      "complexity": "low|medium|high",
      "dependencies": ["dependency1", "dependency2"]
    }
  ],
  "metadata": {
    "totalTests": number,
    "reusableTests": number,
    "averageSimilarityThreshold": 0.75,
    "lastValidation": "ISO 8601 timestamp"
  }
}
```

---

## Field Descriptions

### Test Entry Fields

- **id**: Unique identifier (format: `{key}-{feature-slug}`)
- **key**: Key that created this test
- **file**: Relative path from workspace root
- **feature**: High-level feature being tested
- **description**: What the test validates (1-2 sentences)
- **scenarios**: List of test scenarios/cases
- **reusable**: Whether test can be reused in other keys
- **tags**: Keywords for searching/filtering
- **similarityHash**: Pattern for similarity matching (lowercase, hyphen-separated keywords)
- **created**: When test was first added
- **lastUsed**: Most recent usage timestamp
- **usageCount**: Number of times test has been referenced
- **complexity**: Test complexity (low/medium/high)
- **dependencies**: External dependencies (localStorage, sessionStorage, API calls, etc.)

### Metadata Fields

- **totalTests**: Total number of tests in index
- **reusableTests**: Number of tests marked reusable
- **averageSimilarityThreshold**: Threshold for test similarity matching (default: 0.75)
- **lastValidation**: Last time index was validated

---

## Usage

### Querying for Reusable Tests (Plan Agent)

During planning (Step 0.5 - Cross-Key Dependency Detection):

```javascript
// Pseudocode for similarity matching
const requestedFeature = "registration guard";
const requestedTags = ["authentication", "authorization"];

const matches = testIndex.tests.filter(test => {
  if (!test.reusable) return false;
  
  const similarityScore = calculateSimilarity(
    requestedFeature,
    test.feature,
    test.tags
  );
  
  return similarityScore >= 0.75; // Threshold
});
```

**Output to User**:
```
🔗 Reusable Tests Found

Similar to your requirements:
- userlanding-registration-guard (similarity: 0.85)
  Feature: Registration Guard
  File: Tests/UI/phase1-session-waiting-guard.spec.ts
  Tags: authentication, authorization, registration, guard
  
Consider adapting this test instead of creating from scratch.
```

### Adding New Test (Test-Generation Agent)

After creating a new test:

1. Generate test metadata
2. Append to test-index.json
3. Update metadata.totalTests counter
4. Commit updated index

```javascript
// Pseudocode for adding test
const newTest = {
  id: `${key}-${featureSlug}`,
  key: key,
  file: testFilePath,
  feature: featureName,
  description: testDescription,
  scenarios: testScenarios,
  reusable: true,
  tags: extractedTags,
  similarityHash: generateHash(featureName, tags),
  created: new Date().toISOString(),
  lastUsed: new Date().toISOString(),
  usageCount: 1,
  complexity: determineComplexity(),
  dependencies: extractDependencies()
};

testIndex.tests.push(newTest);
testIndex.metadata.totalTests++;
if (newTest.reusable) testIndex.metadata.reusableTests++;
testIndex.metadata.lastValidation = new Date().toISOString();
```

### Updating Existing Test Usage

When a test is reused in another key:

```javascript
const test = testIndex.tests.find(t => t.id === testId);
test.lastUsed = new Date().toISOString();
test.usageCount++;
```

---

## Similarity Calculation Algorithm

**Threshold**: 0.75 (configurable in metadata)

```javascript
function calculateSimilarity(requestedFeature, testFeature, testTags) {
  const requested = requestedFeature.toLowerCase().split(/\s+/);
  const feature = testFeature.toLowerCase().split(/\s+/);
  
  // Feature name overlap
  const featureOverlap = requested.filter(word => 
    feature.includes(word)
  ).length / requested.length;
  
  // Tag overlap
  const requestedTagsLower = requestedTags.map(t => t.toLowerCase());
  const testTagsLower = testTags.map(t => t.toLowerCase());
  const tagOverlap = requestedTagsLower.filter(tag =>
    testTagsLower.includes(tag)
  ).length / Math.max(requestedTagsLower.length, 1);
  
  // Weighted score (70% feature, 30% tags)
  return (featureOverlap * 0.7) + (tagOverlap * 0.3);
}
```

**Example**:
- Requested: "registration guard"
- Test: "Registration Guard" with tags ["authentication", "authorization", "registration"]
- Feature overlap: 2/2 = 1.0
- Tag overlap: 2/2 = 1.0 (if requested tags = ["authentication", "registration"])
- Score: (1.0 * 0.7) + (1.0 * 0.3) = **1.0** (perfect match)

---

## Validation

### JSON Schema Validation

```bash
# Using ajv-cli (if available)
ajv validate -s test-index-schema.json -d test-index.json

# Manual validation (PowerShell)
$index = Get-Content .github/tests/test-index.json | ConvertFrom-Json
$index.tests | ForEach-Object {
  if (-not $_.id) { Write-Error "Test missing id" }
  if (-not $_.key) { Write-Error "Test missing key" }
  # ... additional validation
}
```

### Periodic Cleanup

Periodically remove stale tests:
- Tests not used in >6 months
- Tests from archived keys
- Tests with usageCount = 0 (never reused)

---

## Integration Points

### Plan Agent (plan.prompt.md)

**Step 0.5 Enhancement**: Query test index for reusable tests

```markdown
### Step 0.5.7: Query Global Test Index (NEW)

**Purpose**: Find reusable tests before planning new tests

1. Read .github/tests/test-index.json
2. Extract requested feature and tags from user_request
3. Calculate similarity scores for all reusable tests
4. Return tests with score >= 0.75
5. Present to user: "Consider reusing these existing tests"
```

### Test-Generation Agent (test-generation.prompt.md)

**New Step After Test Creation**: Update global index

```markdown
### Step 7: Update Global Test Index (NEW)

**After creating test file**:

1. Read .github/tests/test-index.json
2. Generate test metadata (id, feature, tags, hash)
3. Append to tests array
4. Update metadata counters
5. Write updated index
6. Commit with test creation
```

### Commit Agent (commit.prompt.md)

**Validation Step**: Ensure test-index.json committed

```markdown
### Pre-Commit Validation

- Validate test-index.json syntax
- Ensure totalTests count matches array length
- Check for duplicate IDs
- Verify all referenced test files exist
```

---

## Example Queries

### Find Tests by Feature

```bash
# PowerShell
$index = Get-Content .github/tests/test-index.json | ConvertFrom-Json
$index.tests | Where-Object { $_.feature -like "*Registration*" }
```

### Find Tests by Tag

```bash
$index.tests | Where-Object { $_.tags -contains "authentication" }
```

### Find Most Reused Tests

```bash
$index.tests | Sort-Object usageCount -Descending | Select-Object -First 10
```

### Find Tests Never Reused

```bash
$index.tests | Where-Object { $_.usageCount -eq 1 }
```

---

## Maintenance

### Monthly Tasks

1. **Validate Index**:
   - Check all file paths still exist
   - Remove tests from archived keys
   - Update lastValidation timestamp

2. **Cleanup Stale Tests**:
   - Remove tests not used in >6 months
   - Archive low-usage tests (usageCount < 3 after 6 months)

3. **Analyze Reuse Patterns**:
   - Identify most reused tests
   - Update similarity thresholds if needed
   - Document successful reuse cases

---

## Benefits

✅ **Prevents Duplicate Tests**: Find existing tests before creating new ones  
✅ **Promotes Consistency**: Reuse proven test patterns  
✅ **Saves Time**: Adapt existing tests instead of starting from scratch  
✅ **Knowledge Sharing**: Cross-key test discovery  
✅ **Quality Improvement**: More test reuse = better coverage  

---

## Future Enhancements

- **Search API**: CLI tool `nc-test-search "feature name"`
- **Visual Dashboard**: HTML view of test index with search/filter
- **Auto-Tagging**: AI-powered tag generation from test content
- **Similarity Tuning**: Machine learning to optimize similarity threshold
- **Test Templates**: Extract reusable test templates from high-usage tests

---

**Maintained By**: Plan agent, test-generation agent, commit agent  
**Last Updated**: 2025-10-20
