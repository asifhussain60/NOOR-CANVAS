````markdown
# KDS Shared Module: BRAIN Query

**Purpose:** Abstract BRAIN knowledge graph queries (Dependency Inversion Principle).

**Version:** 5.0 (SOLID Refactor)  
**Type:** Shared utility module  
**Single Responsibility:** BRAIN querying ONLY  
**Dependencies:** ✅ ZERO external dependencies (100% local YAML/JSON)

---

## 🎯 Purpose (DIP Compliance)

**Problem:** Agents hardcoded paths to knowledge-graph.yaml, creating tight coupling.

**Solution:** Abstract BRAIN access behind this interface.

**CRITICAL:** BRAIN is **100% local** (stored in KDS/kds-brain/). No external services, APIs, or cloud dependencies. Everything runs offline using local YAML/JSON files.

```markdown
# Before (Tight Coupling)
#file:KDS/kds-brain/knowledge-graph.yaml  # Concrete dependency

# After (Dependency Inversion)
#shared-module:brain-query.md  # Abstract interface
→ Can swap BRAIN storage format without affecting agents
```

---

## 📥 Interface

### Query Intent Confidence
```json
{
  "operation": "intent_confidence",
  "phrase": "string (user's natural language request)",
  "candidate_intents": ["array of possible intents"],
  "return": "IntentConfidence object"
}
```

### Query File Relationships
```json
{
  "operation": "file_relationships",
  "file": "string (file path)",
  "return": "Array of related files"
}
```

### Query Common Mistakes
```json
{
  "operation": "common_mistakes",
  "context": "string (what user is trying to do)",
  "return": "Array of mistake patterns"
}
```

### Query Architectural Patterns
```json
{
  "operation": "architectural_patterns",
  "feature_type": "string (e.g., 'export', 'authentication')",
  "return": "ArchitecturalPattern object"
}
```

### Query Test Patterns
```json
{
  "operation": "test_patterns",
  "test_type": "visual | unit | integration | e2e",
  "return": "Array of test pattern strategies"
}
```

---

## 📤 Response Object Schemas

### IntentConfidence
```json
{
  "results": [
    {
      "intent": "plan",
      "confidence": 0.95,
      "reason": "Matches pattern 'add a * button' (12 successful routings)",
      "occurrences": 12
    }
  ],
  "recommendation": {
    "intent": "plan",
    "confidence": 0.95,
    "auto_route": true,
    "meets_minimum_occurrences": true
  },
  "protection_check": {
    "confidence_valid": true,
    "occurrences_sufficient": true,
    "anomaly_detected": false
  }
}
```

### FileRelationships
```json
{
  "file": "Services/PdfExportService.cs",
  "relationships": [
    {
      "related_file": "Components/Canvas/PdfExportButton.razor",
      "relationship_type": "feature_implementation",
      "co_modification_count": 8,
      "confidence": 0.92
    }
  ],
  "suggestions": [
    "When modifying PdfExportService.cs, consider updating PdfExportButton.razor"
  ]
}
```

### CommonMistakes
```json
{
  "context": "adding export button",
  "mistakes": [
    {
      "mistake_pattern": "Components placed in wrong directory",
      "correct_approach": "Export buttons → Components/Canvas/",
      "learned_from": "user_correction",
      "occurrences": 3,
      "confidence": 0.85
    }
  ],
  "warnings": [
    "⚠️ Export components typically go in Components/Canvas/, not Components/UI/"
  ]
}
```

### ArchitecturalPattern
```json
{
  "feature_type": "export",
  "pattern": {
    "service_location": "Services/",
    "component_location": "Components/Canvas/",
    "test_location": "Tests/UI/",
    "naming_convention": "*ExportService.cs + *ExportButton.razor"
  },
  "examples": [
    "PdfExportService.cs + PdfExportButton.razor (8 successful implementations)"
  ],
  "confidence": 0.90
}
```

---

## 🔧 Implementation (100% Local)

### Load Knowledge Graph (LOCAL YAML)
```python
def load_knowledge_graph():
    """
    Load BRAIN knowledge graph from local YAML file.
    
    CRITICAL: 100% offline, no external dependencies.
    Uses standard YAML parsing (PowerShell/Python built-ins).
    """
    
    # LOCAL file path (in KDS/ directory)
    graph_path = "KDS/kds-brain/knowledge-graph.yaml"
    
    # Check if exists (first-time setup might have empty graph)
    if not file_exists(graph_path):
        return create_empty_knowledge_graph()
    
    # Parse LOCAL YAML file (no external calls)
    content = read_file(graph_path)
    graph = parse_yaml(content)  # PowerShell: ConvertFrom-Yaml
    
    return graph
```

### Query Intent Confidence
```python
def query_intent_confidence(phrase, candidate_intents):
    """
    Calculate confidence scores for intent detection.
    
    Uses learned patterns from knowledge graph to predict
    which intent the user's phrase matches.
    """
    
    # Load LOCAL knowledge graph
    graph = load_knowledge_graph()
    
    results = []
    
    for intent in candidate_intents:
        # Find matching patterns in graph
        patterns = graph.intent_patterns.get(intent, [])
        
        best_match = None
        highest_confidence = 0.0
        
        for pattern in patterns:
            # Check if phrase matches learned pattern
            if pattern_matches(phrase, pattern.pattern):
                if pattern.confidence > highest_confidence:
                    highest_confidence = pattern.confidence
                    best_match = pattern
        
        if best_match:
            results.append({
                'intent': intent,
                'confidence': best_match.confidence,
                'reason': f"Matches pattern '{best_match.pattern}' ({best_match.occurrences} successful routings)",
                'occurrences': best_match.occurrences
            })
    
    # Sort by confidence (highest first)
    results.sort(key=lambda r: r.confidence, reverse=True)
    
    # Apply protection thresholds
    recommendation = apply_protection_thresholds(results)
    
    return {
        'results': results,
        'recommendation': recommendation,
        'protection_check': validate_protection_rules(results)
    }
```

### Query File Relationships
```python
def query_file_relationships(file):
    """
    Find files commonly modified together with the given file.
    
    Uses co-modification history from knowledge graph.
    """
    
    graph = load_knowledge_graph()
    
    relationships = []
    
    for cluster in graph.file_relationships:
        if file in cluster.files:
            # Find other files in this cluster
            related = [f for f in cluster.files if f != file]
            
            for related_file in related:
                relationships.append({
                    'related_file': related_file,
                    'relationship_type': cluster.relationship,
                    'co_modification_count': cluster.occurrences,
                    'confidence': cluster.confidence
                })
    
    # Generate suggestions
    suggestions = []
    for rel in relationships:
        if rel.confidence > 0.80:
            suggestions.append(
                f"When modifying {file}, consider updating {rel.related_file}"
            )
    
    return {
        'file': file,
        'relationships': relationships,
        'suggestions': suggestions
    }
```

### Query Common Mistakes
```python
def query_common_mistakes(context):
    """
    Find mistakes commonly made in similar contexts.
    
    Enables proactive warnings before mistakes happen.
    """
    
    graph = load_knowledge_graph()
    
    mistakes = []
    warnings = []
    
    for mistake_pattern in graph.common_mistakes:
        # Check if context matches learned mistake pattern
        if context_matches(context, mistake_pattern.context):
            mistakes.append({
                'mistake_pattern': mistake_pattern.mistake,
                'correct_approach': mistake_pattern.correction,
                'learned_from': mistake_pattern.source,
                'occurrences': mistake_pattern.occurrences,
                'confidence': mistake_pattern.confidence
            })
            
            # Generate warning if high confidence
            if mistake_pattern.confidence > 0.75:
                warnings.append(
                    f"⚠️ {mistake_pattern.correction}"
                )
    
    return {
        'context': context,
        'mistakes': mistakes,
        'warnings': warnings
    }
```

---

## 📚 Usage Examples

### In intent-router.md
```markdown
# Query BRAIN before pattern matching
#shared-module:brain-query.md

result = brain_query.intent_confidence(
    phrase="I want to add a share button",
    candidate_intents=["plan", "execute", "test", "validate"]
)

if result.recommendation.auto_route:
    # High confidence - route immediately
    route_to(result.recommendation.intent)
else:
    # Low confidence - fall back to pattern matching
    use_traditional_routing()
```

### In work-planner.md
```markdown
# Check for architectural patterns
#shared-module:brain-query.md

pattern = brain_query.architectural_patterns(
    feature_type="export"
)

if pattern.confidence > 0.80:
    # Use learned pattern
    print(f"💡 Suggested structure: {pattern.pattern}")
    service_location = pattern.service_location
    component_location = pattern.component_location
```

### In code-executor.md
```markdown
# Check for file relationships
#shared-module:brain-query.md

relationships = brain_query.file_relationships(
    file="Services/PdfExportService.cs"
)

if relationships.suggestions:
    print("💡 BRAIN suggests also checking:")
    for suggestion in relationships.suggestions:
        print(f"   {suggestion}")
```

### In error-corrector.md
```markdown
# Check for common mistakes
#shared-module:brain-query.md

mistakes = brain_query.common_mistakes(
    context="adding export button to canvas"
)

if mistakes.warnings:
    print("⚠️ BRAIN warnings (based on past corrections):")
    for warning in mistakes.warnings:
        print(f"   {warning}")
```

---

## ✅ Benefits

### Intelligent Routing
- ✅ Learn from successful routings
- ✅ Improve accuracy over time
- ✅ Reduce ambiguity

### Proactive Warnings
- ✅ Prevent mistakes before they happen
- ✅ Learn from corrections
- ✅ Improve code quality

### Pattern Reuse
- ✅ Discover architectural patterns
- ✅ Suggest file locations
- ✅ Recommend naming conventions

### Offline Operation
- ✅ 100% local (no cloud dependencies)
- ✅ Works without internet
- ✅ Fast (no API latency)

---

## 🚨 Error Handling

### Knowledge Graph Not Found
```json
{
  "error": "BRAIN_NOT_INITIALIZED",
  "message": "Knowledge graph not found",
  "suggestion": "Run brain-updater.md to initialize BRAIN",
  "fallback": "Using pattern matching (no BRAIN assistance)"
}
```

### Invalid Query
```json
{
  "error": "INVALID_QUERY",
  "operation": "intent_confidence",
  "missing_params": ["phrase"],
  "suggestion": "Provide required parameters"
}
```

### Protection Threshold Violation
```json
{
  "error": "PROTECTION_VIOLATION",
  "message": "Anomaly detected in learning pattern",
  "details": "Confidence jumped to 0.98 after only 1 event",
  "action": "Downgrading to pattern matching (safety fallback)"
}
```

---

## 🔧 Protection Thresholds

### From knowledge-graph.yaml
```yaml
routing_safety:
  ask_user_threshold: 0.70      # Below this = ask user
  auto_route_threshold: 0.85    # Above this = auto-route
  minimum_occurrences: 3        # Minimum events to trust pattern
  anomaly_detection: true       # Detect suspicious learning
  anomaly_threshold: 0.95       # Confidence jump that triggers alert
```

### Apply Thresholds
```python
def apply_protection_thresholds(results):
    """Apply safety thresholds to prevent overconfident routing"""
    
    config = load_protection_config()
    
    if not results:
        return {
            'intent': None,
            'confidence': 0.0,
            'auto_route': False,
            'meets_minimum_occurrences': False
        }
    
    top_result = results[0]
    
    # Check minimum occurrences
    meets_minimum = top_result.occurrences >= config.minimum_occurrences
    
    # Check anomaly detection
    anomaly = False
    if config.anomaly_detection:
        anomaly = detect_anomaly(top_result, results)
    
    # Determine auto-route eligibility
    auto_route = (
        top_result.confidence >= config.auto_route_threshold and
        meets_minimum and
        not anomaly
    )
    
    return {
        'intent': top_result.intent,
        'confidence': top_result.confidence,
        'auto_route': auto_route,
        'meets_minimum_occurrences': meets_minimum,
        'anomaly_detected': anomaly
    }
```

---

## 📝 Knowledge Graph Schema

### Structure (LOCAL YAML)
```yaml
# KDS/kds-brain/knowledge-graph.yaml

intent_patterns:
  plan:
    - pattern: "add a * button"
      confidence: 0.95
      occurrences: 12
      last_updated: "2025-11-02T10:30:00Z"
    - pattern: "create a * feature"
      confidence: 0.92
      occurrences: 8
  
file_relationships:
  - files:
      - "Services/PdfExportService.cs"
      - "Components/Canvas/PdfExportButton.razor"
    relationship: "feature_implementation"
    occurrences: 8
    confidence: 0.92
    last_updated: "2025-11-02T10:35:00Z"

common_mistakes:
  - context: "adding export functionality"
    mistake: "Components placed in wrong directory"
    correction: "Export buttons → Components/Canvas/"
    source: "user_correction"
    occurrences: 3
    confidence: 0.85
    last_updated: "2025-11-02T10:40:00Z"

architectural_patterns:
  export:
    service_location: "Services/"
    component_location: "Components/Canvas/"
    test_location: "Tests/UI/"
    naming_convention: "*ExportService.cs + *ExportButton.razor"
    confidence: 0.90
    occurrences: 8

routing_safety:
  ask_user_threshold: 0.70
  auto_route_threshold: 0.85
  minimum_occurrences: 3
  anomaly_detection: true
  anomaly_threshold: 0.95
```

---

## 🎯 Pattern Matching Logic

### Intent Pattern Matching
```python
def pattern_matches(phrase, pattern):
    """
    Check if user phrase matches learned pattern.
    
    Uses simple wildcard matching (* = any text).
    Could be enhanced with regex or NLP in future.
    """
    
    # Convert pattern to regex
    # "add a * button" → "add a .* button"
    regex_pattern = pattern.replace("*", ".*")
    regex_pattern = f"^{regex_pattern}$"
    
    # Case-insensitive match
    return re.match(regex_pattern, phrase, re.IGNORECASE) is not None
```

### Context Matching
```python
def context_matches(context, learned_context):
    """
    Check if current context matches learned mistake context.
    
    Uses keyword overlap and semantic similarity.
    """
    
    # Extract keywords
    context_keywords = extract_keywords(context)
    learned_keywords = extract_keywords(learned_context)
    
    # Calculate overlap
    overlap = len(set(context_keywords) & set(learned_keywords))
    total = len(set(context_keywords) | set(learned_keywords))
    
    similarity = overlap / total if total > 0 else 0.0
    
    # Threshold for match
    return similarity > 0.60
```

---

## 🔄 Integration with brain-updater.md

**BRAIN Query (this module) is READ-ONLY.**

**brain-updater.md handles WRITES** (updating knowledge graph).

```markdown
# Division of responsibilities:

brain-query.md (THIS):
  ✅ Read knowledge graph
  ✅ Calculate confidence scores
  ✅ Apply protection thresholds
  ❌ Does NOT modify graph

brain-updater.md:
  ✅ Process events.jsonl
  ✅ Update knowledge-graph.yaml
  ✅ Aggregate learnings
  ❌ Does NOT query for routing decisions
```

This separation ensures:
- **Thread safety** (queries don't conflict with updates)
- **Single Responsibility** (each module has ONE job)
- **Testability** (mock query without affecting updates)

---

**BRAIN Query: Intelligent routing from learned patterns!** 🧠

````
