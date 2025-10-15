# Pattern Schema

This document defines the standard schema for documenting patterns in the learning system.

---

## Purpose

Ensures consistency across all pattern files, making them easy to query, analyze, and apply.

---

## Pattern Structure

### JSON Schema

```json
{
  "pattern_name": "descriptive-kebab-case",
  "category": "success|failure|performance",
  "occurrences": 0,
  "context": "When and where this pattern applies",
  "symptoms": ["Observable indicators that pattern applies"],
  "solution": "How to handle or what to do",
  "examples": ["Specific instances from work logs"],
  "related_patterns": ["other-pattern-name"],
  "tags": ["tag1", "tag2"],
  "last_seen": "YYYY-MM-DD",
  "severity": "low|medium|high|critical",
  "confidence": 0.0
}
```

---

## Field Definitions

### pattern_name *(required)*
**Type**: string  
**Format**: kebab-case  
**Description**: Unique identifier for the pattern  
**Example**: `api-endpoint-validation-success`

### category *(required)*
**Type**: enum  
**Values**: `success` | `failure` | `performance`  
**Description**: Pattern category  
- `success` - Proven successful approach
- `failure` - Known failure or anti-pattern
- `performance` - Performance optimization

### occurrences *(required)*
**Type**: integer  
**Description**: Number of times pattern observed  
**Note**: Increment each time pattern is seen

### context *(required)*
**Type**: string  
**Description**: When, where, and why this pattern applies  
**Example**: "When creating API endpoints with input validation"

### symptoms *(required for failures)*
**Type**: array of strings  
**Description**: Observable indicators that pattern applies  
**Example**: ["Build error CS1234", "Test failure in validation", "NullReferenceException"]

### solution *(required)*
**Type**: string  
**Description**: How to handle the pattern  
- For success: What to do
- For failure: How to avoid or fix
- For performance: How to optimize

### examples *(optional)*
**Type**: array of strings  
**Description**: Specific instances from work logs  
**Format**: "Key: description - outcome"  
**Example**: ["task-123: Added validation - 0 bugs", "refactor-456: Extracted service - tests passed"]

### related_patterns *(optional)*
**Type**: array of strings  
**Description**: Names of related patterns  
**Use**: To link patterns that often appear together

### tags *(optional)*
**Type**: array of strings  
**Description**: Keywords for searching/filtering  
**Example**: ["api", "validation", "database", "ui"]

### last_seen *(required)*
**Type**: string  
**Format**: YYYY-MM-DD  
**Description**: Most recent occurrence date

### severity *(optional, for failures)*
**Type**: enum  
**Values**: `low` | `medium` | `high` | `critical`  
**Description**: Impact severity for failure patterns

### confidence *(optional)*
**Type**: float  
**Range**: 0.0 to 1.0  
**Description**: Confidence in pattern (based on occurrences and consistency)  
**Calculation**: min(occurrences / 10, 1.0)

---

## Example Patterns

### Success Pattern

```json
{
  "pattern_name": "api-first-architecture",
  "category": "success",
  "occurrences": 12,
  "context": "When creating new features requiring database access",
  "symptoms": ["Need to display database data in UI", "Real-time updates required"],
  "solution": "Create API endpoint first, then use HTTP client in UI components. Never inject DbContext directly in UI layer.",
  "examples": [
    "hostcontrolpanel: Used API endpoints for session data - clean separation",
    "participant-list: API-based participant loading - tests easy to write"
  ],
  "related_patterns": ["dto-mapping", "service-layer-pattern"],
  "tags": ["architecture", "api", "database", "ui"],
  "last_seen": "2025-01-15",
  "confidence": 1.0
}
```

### Failure Pattern

```json
{
  "pattern_name": "direct-dbcontext-in-ui",
  "category": "failure",
  "occurrences": 5,
  "context": "When injecting DbContext directly into Razor components",
  "symptoms": [
    "Build error: Cannot resolve DbContext",
    "Tight coupling between UI and database",
    "Difficult to test components"
  ],
  "solution": "Use API-first architecture. Create controller endpoint, use HttpClient in component.",
  "examples": [
    "hostcontrolpanel-old: Direct DbContext injection - rollback required",
    "session-canvas-attempt: DbContext in component - architecture violation"
  ],
  "related_patterns": ["api-first-architecture"],
  "tags": ["anti-pattern", "architecture", "database", "ui"],
  "last_seen": "2025-01-10",
  "severity": "high",
  "confidence": 0.5
}
```

### Performance Pattern

```json
{
  "pattern_name": "bulk-database-operations",
  "category": "performance",
  "occurrences": 8,
  "context": "When inserting/updating multiple records",
  "symptoms": ["Slow database operations", "Multiple round-trips"],
  "solution": "Use bulk operations (AddRange, UpdateRange) instead of individual Add/Update in loops.",
  "examples": [
    "participant-import: Switched to AddRange - 10x faster",
    "question-sync: Used bulk update - reduced time from 5s to 500ms"
  ],
  "related_patterns": ["database-optimization"],
  "tags": ["performance", "database", "optimization"],
  "last_seen": "2025-01-12",
  "confidence": 0.8
}
```

---

## Pattern File Structure

Each pattern file (e.g., `task-patterns.json`) should contain an array of pattern objects:

```json
{
  "schema_version": "1.0.0",
  "last_updated": "2025-01-15",
  "patterns": [
    {
      "pattern_name": "pattern-1",
      ...
    },
    {
      "pattern_name": "pattern-2",
      ...
    }
  ]
}
```

---

## Maintenance

### Adding Patterns
1. Use `/analyze-learning` agent to extract from work logs
2. Or manually add following this schema
3. Ensure `pattern_name` is unique within file
4. Set `occurrences` to 1 for new patterns

### Updating Patterns
1. Increment `occurrences` when pattern seen again
2. Update `last_seen` date
3. Add new examples
4. Adjust `confidence` if needed

### Removing Patterns
1. Remove if obsolete (technology/architecture changed)
2. Document removal reason in git commit
3. Consider archiving instead of deleting

---

## Best Practices

1. **Be Specific**: Patterns should be actionable, not vague
2. **Use Examples**: Real examples are more valuable than descriptions
3. **Keep Current**: Remove obsolete patterns promptly
4. **Link Patterns**: Use `related_patterns` to build knowledge graph
5. **Tag Well**: Tags make patterns discoverable

---

## Version History

- **v1.0.0** (Setup): Initial schema from portable template
  - Standard pattern structure defined
  - Field definitions documented
  - Example patterns provided
