# PUBLISH: Pattern Publishing Workflow

## Purpose
Shared workflow for publishing successful patterns to the knowledge base. Ensures consistency, validation, and deduplication.

## Invoked By
- `prompts/internal/test-generator.md` - After successful test
- `prompts/internal/code-executor.md` - After successful implementation
- `prompts/internal/health-validator.md` - After workflow validation
- Manual invocation by user

## Input Handoff
```json
{
  "type": "publish-pattern",
  "category": "test-patterns | test-data | ui-mappings | workflows",
  "pattern": {
    "name": "Pattern name",
    "context": "When to use this",
    "implementation": "Code/data/config",
    "whatWorked": ["Successful approach 1", "Successful approach 2"],
    "whatDidntWork": ["Failed approach 1", "Failed approach 2"],
    "successRate": "3/5 attempts",
    "relatedPatterns": ["path/to/related/pattern.md"]
  },
  "metadata": {
    "publishedBy": "test-generator | code-executor | user",
    "requestId": "unique-request-id",
    "timestamp": "2025-11-02T10:30:00Z"
  }
}
```

## Validation Steps

### Step 1: Capacity Check (NEW - Anti-Bloat Guardrail)
```python
def validate_capacity(category):
    """
    GUARDRAIL: Prevent knowledge/ folder bloat
    Max 10 patterns per category
    """
    current_count = count_patterns_in_category(category)
    
    if current_count >= 10:
        return {
            'status': 'ERROR',
            'message': f'Category at capacity: {current_count}/10 patterns',
            'action': 'CONSOLIDATE or ARCHIVE before publishing',
            'consolidation_candidates': find_similar_patterns(category, threshold=0.60)
        }
    
    if current_count >= 8:
        return {
            'status': 'WARNING',
            'message': f'Approaching capacity: {current_count}/10 patterns',
            'action': 'Consider consolidation',
            'consolidation_candidates': find_similar_patterns(category, threshold=0.60)
        }
    
    return {'status': 'PASS', 'current_count': current_count}
```

### Step 2: Quality Gates (NEW - Success Rate & Reuse Threshold)
```python
def validate_quality_gates(pattern):
    """
    GUARDRAIL: Ensure high-quality patterns only
    - Minimum 80% success rate
    - Minimum 3 reuse count
    - Evidence required
    """
    # Parse success rate (e.g., "4/5 attempts" → 80%)
    success_rate = parse_success_rate(pattern['successRate'])
    
    if success_rate < 0.80:
        return {
            'status': 'ERROR',
            'message': f'Success rate {success_rate:.0%} below 80% threshold',
            'action': 'Improve pattern reliability before publishing'
        }
    
    reuse_count = pattern.get('reuseCount', 0)
    if reuse_count < 3:
        return {
            'status': 'ERROR',
            'message': f'Reuse count {reuse_count} below minimum 3',
            'action': 'Pattern must be reused 3+ times before publishing'
        }
    
    if not pattern.get('metadata', {}).get('evidence'):
        return {
            'status': 'WARNING',
            'message': 'No evidence provided (git commits, test results)',
            'action': 'Include evidence for traceability'
        }
    
    return {'status': 'PASS'}
```

### Step 3: Required Sections
```python
def validate_required_sections(pattern):
    required = [
        "name",
        "context",
        "implementation",
        "whatWorked",
        "whatDidntWork",
        "successRate"
    ]
    
    missing = [field for field in required if not pattern.get(field)]
    
    if missing:
        return ERROR(f"Missing required sections: {missing}")
    
    return PASS
```

### Step 4: Content Quality
```python
def validate_content_quality(pattern):
    # Check "What Worked" has at least one item
    if not pattern["whatWorked"] or len(pattern["whatWorked"]) == 0:
        return ERROR("'What Worked' must have at least one entry")
    
    # Check "What Didn't Work" has at least one item
    if not pattern["whatDidntWork"] or len(pattern["whatDidntWork"]) == 0:
        return WARNING("'What Didn't Work' should document failures to avoid")
    
    # Check implementation is not empty
    if len(pattern["implementation"].strip()) < 50:
        return WARNING("Implementation section seems too short")
    
    return PASS
```

### Step 5: Deduplication (ENHANCED - Auto-Reject >85%)
```python
def check_duplicate_patterns(new_pattern, category):
    """
    GUARDRAIL: Prevent duplicate and near-duplicate patterns
    - 85%+ similarity: AUTO-REJECT
    - 60-84% similarity: CONSOLIDATE
    """
    existing_patterns = list_files(f"knowledge/{category}/")
    
    for existing in existing_patterns:
        similarity = calculate_similarity(new_pattern, existing)
        
        if similarity > 0.85:
            return {
                "status": "DUPLICATE_AUTO_REJECT",
                "existing_file": existing,
                "similarity": similarity,
                "action": "REJECTED - Use existing pattern instead",
                "message": f"❌ Duplicate detected ({similarity:.0%} similar) - AUTO-REJECTED"
            }
        elif similarity > 0.60:
            return {
                "status": "CONSOLIDATE_REQUIRED",
                "existing_file": existing,
                "similarity": similarity,
                "action": "CONSOLIDATE patterns into one comprehensive pattern",
                "message": f"⚠️ Similar pattern exists ({similarity:.0%}) - Consolidation recommended"
            }
    
    return {"status": "UNIQUE"}
```

### Step 6: Sunset Check (NEW - Archive Unused Patterns)
```python
def check_sunset_eligibility(category):
    """
    GUARDRAIL: Auto-archive patterns unused for 90+ days
    Uses git history, not status flags
    """
    patterns = list_files(f"knowledge/{category}/")
    sunset_candidates = []
    
    for pattern in patterns:
        last_used_date = extract_last_used_date(pattern)
        days_since_use = (datetime.now() - last_used_date).days
        
        if days_since_use > 90:
            # Auto-archive to .archived/ folder
            archive_path = f".archived/{category}/{os.path.basename(pattern)}"
            git_mv(pattern, archive_path)
            
            sunset_candidates.append({
                'pattern': pattern,
                'last_used': last_used_date,
                'days_unused': days_since_use,
                'action': f'ARCHIVED to {archive_path}'
            })
    
    return {
        'status': 'COMPLETE',
        'archived_count': len(sunset_candidates),
        'archived_patterns': sunset_candidates
    }
```

### Step 7: Category Validation
```python
def validate_category(category):
    allowed = [
        "test-patterns",
        "test-data",
        "ui-mappings",
        "workflows"
    ]
    
    if category not in allowed:
        return ERROR(f"Invalid category. Must be one of: {allowed}")
    
    return PASS
```

### Step 8: Success Rate Format
```python
def validate_success_rate(success_rate):
    # Format: "X/Y attempts" or "X/Y runs" or "100%"
    patterns = [
        r"^\d+/\d+ (attempts|runs|tests)$",
        r"^\d+%$"
    ]
    
    if not any(re.match(p, success_rate) for p in patterns):
        return WARNING(f"Success rate format unclear: {success_rate}")
    
    return PASS
```

## Categorization Logic

### Auto-Categorization
```python
def determine_category(pattern):
    name_lower = pattern["name"].lower()
    impl_lower = pattern["implementation"].lower()
    
    # Test patterns
    if any(keyword in name_lower for keyword in ["test", "playwright", "spec", "assertion"]):
        if "selector" in impl_lower or "getByTestId" in impl_lower:
            return "test-patterns"
    
    # Test data
    if any(keyword in name_lower for keyword in ["session", "data", "fixture"]):
        if "sessionId" in impl_lower or "test data" in impl_lower:
            return "test-data"
    
    # UI mappings
    if "data-testid" in impl_lower or "mapping" in name_lower:
        return "ui-mappings"
    
    # Workflows
    if any(keyword in name_lower for keyword in ["workflow", "flow", "process", "integration"]):
        return "workflows"
    
    # Default: test-patterns
    return "test-patterns"
```

## File Naming Convention

```python
def generate_filename(pattern_name):
    # Convert to lowercase, replace spaces with hyphens
    filename = pattern_name.lower()
    filename = re.sub(r'[^a-z0-9\s-]', '', filename)
    filename = re.sub(r'\s+', '-', filename)
    filename = re.sub(r'-+', '-', filename)
    
    return f"{filename}.md"
```

## Pattern Template Generation

```python
def generate_pattern_markdown(pattern, category):
    template = f"""# Pattern: {pattern['name']}

**Category**: {category}
**Published**: {datetime.now().strftime('%Y-%m-%d')}
**Success Rate**: {pattern['successRate']}
**Reuse Count**: 0

## Context
{pattern['context']}

## Implementation
{pattern['implementation']}

## What Worked
{format_list(pattern['whatWorked'])}

## What Didn't Work
{format_list(pattern['whatDidntWork'])}

## Related Patterns
{format_related_links(pattern.get('relatedPatterns', []))}

---

**Last Updated**: {datetime.now().strftime('%Y-%m-%d')}
**Published By**: {pattern.get('publishedBy', 'manual')}
"""
    
    return template

def format_list(items):
    return '\n'.join(f"- {item}" for item in items)

def format_related_links(patterns):
    if not patterns:
        return "(None)"
    return '\n'.join(f"- [{p}]({p})" for p in patterns)
```

## Publishing Workflow

### Full Workflow (UPDATED with Guardrails)
```
1. Receive publish handoff
2. CHECK capacity (max 10 per category, warn at 8)
3. VALIDATE quality gates (80% success rate, 3+ reuse count)
4. Validate required sections
5. Validate content quality
6. CHECK for sunset candidates (archive patterns >90 days unused)
7. Validate category
8. Validate success rate format
9. CHECK for duplicates (auto-reject >85%, consolidate 60-84%)
10. If duplicate >85% similarity:
    - AUTO-REJECT (no user prompt)
    - Return existing pattern path
11. If similar 60-84% similarity:
    - CONSOLIDATE patterns
    - Merge into comprehensive pattern
    - Archive old patterns
12. If unique AND passes all gates:
    - Generate filename
    - Generate markdown from template
    - Save to knowledge/{category}/{filename}
    - Update knowledge index
    - Update health metrics (weekly/monthly)
    - Create success handoff
13. Output: Pattern published message with health metrics
```

## Guardrail Enforcement

### Capacity Guardrail
```
⚠️ Category Approaching Capacity

Category: test-patterns
Current: 8/10 patterns
Status: CONSOLIDATION RECOMMENDED

Consolidation Candidates (>60% similar):
1. playwright-button-click.md ↔ playwright-element-selection.md (68% similar)
2. api-retry-pattern.md ↔ api-error-handling.md (72% similar)

Action Required:
- CONSOLIDATE similar patterns before publishing more
- OR ARCHIVE unused patterns (>90 days)

Unused Patterns (candidates for archival):
- old-test-pattern.md (120 days since last use) → ARCHIVED
```

### Quality Gate Rejection
```
❌ Pattern Quality Below Threshold

Pattern: flaky-test-pattern
Success Rate: 60% (below 80% minimum)
Reuse Count: 1 (below 3 minimum)

Action Required:
- Improve pattern reliability to 80%+
- Reuse pattern at least 3 times
- Then resubmit for publishing

Pattern NOT published.
```

### Auto-Reject Duplicate
```
❌ Duplicate Pattern AUTO-REJECTED

New Pattern: playwright-button-selection
Existing: knowledge/test-patterns/playwright-element-selection.md
Similarity: 92%

Action: Use existing pattern instead

Pattern NOT published (use existing).
```

### Consolidation Required
```
⚠️ Consolidation Required

New Pattern: api-timeout-handling (similarity: 74%)
Existing: knowledge/test-patterns/api-error-handling.md

Action: CONSOLIDATE into comprehensive pattern
- Merge "api-timeout-handling" into "api-error-handling.md"
- Update existing pattern with new timeout strategies
- Archive old pattern to .archived/

Consolidation in progress...
✅ Consolidated: knowledge/test-patterns/api-error-handling.md (updated)
✅ Archived: .archived/test-patterns/api-timeout-handling.md
```

## Health Metrics Tracking

### Weekly Report (Auto-Generated)
```json
{
  "reportType": "weekly",
  "reportDate": "2025-11-02",
  "categories": {
    "test-patterns": {
      "count": 8,
      "capacity": "8/10 (80%)",
      "status": "WARN - Approaching capacity",
      "unusedLast30Days": 1,
      "duplicateCandidates": 2
    },
    "test-data": {
      "count": 5,
      "capacity": "5/10 (50%)",
      "status": "OK",
      "unusedLast30Days": 0,
      "duplicateCandidates": 0
    },
    "ui-mappings": {
      "count": 6,
      "capacity": "6/10 (60%)",
      "status": "OK",
      "unusedLast30Days": 1,
      "duplicateCandidates": 1
    },
    "workflows": {
      "count": 3,
      "capacity": "3/10 (30%)",
      "status": "OK",
      "unusedLast30Days": 0,
      "duplicateCandidates": 0
    }
  },
  "consolidationOpportunities": [
    {
      "pattern1": "playwright-button-click.md",
      "pattern2": "playwright-element-selection.md",
      "similarity": 0.68,
      "category": "test-patterns"
    }
  ],
  "archivedThisWeek": [
    {
      "pattern": "old-pattern.md",
      "category": "test-patterns",
      "daysUnused": 120,
      "archivedTo": ".archived/test-patterns/old-pattern.md"
    }
  ]
}
```

### Monthly Report (Auto-Generated)
```json
{
  "reportType": "monthly",
  "reportDate": "2025-11-02",
  "kdsHealthScore": 85,
  "metrics": {
    "ruleCount": 16,
    "ruleLimit": 20,
    "ruleTrend": "stable",
    "promptCount": 13,
    "promptLimit": 15,
    "promptTrend": "stable",
    "totalFiles": 68,
    "fileLimit": 80,
    "fileTrend": "+2 from last month"
  },
  "archiveSummary": {
    "patternsArchived": 3,
    "categoriesAffected": ["test-patterns", "ui-mappings"],
    "spaceReclaimed": "30% reduction in test-patterns/"
  },
  "publishingActivity": {
    "patternsPublished": 12,
    "patternsRejected": 3,
    "consolidationsPerformed": 2
  }
}
```

## Publishing Workflow

### Full Workflow
```
1. Receive publish handoff
2. Validate category
3. Validate required sections
4. Validate content quality
5. Validate success rate format
6. Check for duplicates
7. If duplicate > 85% similarity:
   - Ask user: MERGE or SKIP?
8. If similar > 60% similarity:
   - Show user existing pattern
   - Ask user: PUBLISH_ANYWAY or SKIP?
9. If unique:
   - Generate filename
   - Generate markdown from template
   - Save to knowledge/{category}/{filename}
   - Update knowledge index
   - Create success handoff
10. Output: Pattern published message
```

## Duplicate Handling

### High Similarity (>85%)
```
⚠️ Duplicate Pattern Detected

Existing: knowledge/test-patterns/playwright-button-click.md
Similarity: 92%

OPTION A: MERGE with existing (update existing pattern)
OPTION B: SKIP (don't publish, use existing)

Your choice: [A/B]
```

### Medium Similarity (60-85%)
```
⚠️ Similar Pattern Found

Existing: knowledge/test-patterns/playwright-element-selection.md
Similarity: 68%

Your pattern focuses on: {new pattern focus}
Existing pattern covers: {existing pattern summary}

OPTION A: PUBLISH_ANYWAY (patterns differ enough)
OPTION B: SKIP (existing pattern sufficient)
OPTION C: VIEW_EXISTING (show full existing pattern)

Your choice: [A/B/C]
```

## Index Update

After publishing, update `knowledge/index.json`:

```json
{
  "patterns": [
    {
      "id": "playwright-element-selection",
      "name": "Playwright Element Selection Strategies",
      "category": "test-patterns",
      "file": "knowledge/test-patterns/playwright-element-selection.md",
      "published": "2025-11-02",
      "successRate": "4/5 attempts",
      "reuseCount": 0,
      "tags": ["playwright", "selectors", "testing"],
      "description": "Reliable strategies for selecting UI elements in Playwright tests"
    }
  ],
  "lastUpdated": "2025-11-02T10:30:00Z"
}
```

## Output Handoff

### Success
```json
{
  "type": "publish-complete",
  "status": "SUCCESS",
  "pattern": {
    "name": "Pattern name",
    "file": "knowledge/{category}/{filename}",
    "category": "test-patterns"
  },
  "message": "✅ Pattern published successfully",
  "nextCommand": null
}
```

### Duplicate Skipped
```json
{
  "type": "publish-complete",
  "status": "SKIPPED_DUPLICATE",
  "existingFile": "knowledge/{category}/{existing}.md",
  "message": "ℹ️ Pattern already exists, publication skipped"
}
```

### Validation Failed
```json
{
  "type": "publish-failed",
  "status": "VALIDATION_ERROR",
  "errors": ["Missing 'What Didn't Work' section"],
  "message": "❌ Pattern validation failed",
  "nextCommand": "Fix validation errors and retry"
}
```

## Error Handling

- **Category invalid**: Return error, suggest valid categories
- **Missing required sections**: Return error with list of missing sections
- **File write fails**: Log error, return failure handoff
- **Index update fails**: Log warning, pattern still published
- **Duplicate detection fails**: Log warning, proceed with publish

## Integration Points

- **Receives from**: test-generator.md, code-executor.md, health-validator.md
- **Sends to**: User (completion message)
- **Updates**: knowledge/index.json, knowledge/{category}/
- **Validates against**: schemas/publishing/pattern-schema.json

---

**Last Updated**: 2025-11-02  
**Version**: 1.0  
**Workflow Type**: Shared  
**Governed By**: Rule #14 (Publishing Mechanism)
