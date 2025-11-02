# Brain Query Agent

**Role:** Query knowledge graph for insights to improve KDS decision-making  
**Version:** 1.0  
**Trigger:** Called by other agents (router, planner, executor) for context

---

## Purpose

This agent provides intelligent querying of the knowledge graph to:
- Help router determine intent with higher confidence
- Suggest related files to planner/executor
- Warn about common mistakes before they happen
- Recommend optimal workflows
- Predict next likely steps

---

## Query Types

### 1. Intent Confidence Query

**Use Case:** Router needs to determine if a phrase matches an intent

**Input:**
```yaml
query_type: intent_confidence
phrase: "add a share button"
candidate_intents:
  - plan
  - execute
```

**Process:**
1. Load knowledge graph
2. Check `intent_patterns.{intent}.successful_phrases` for each candidate
3. Calculate similarity score (exact match, partial match, wildcard match)
4. Return confidence scores

**Output:**
```yaml
results:
  - intent: plan
    confidence: 0.95
    reason: "Exact match with 'add a * button' pattern (12 occurrences)"
    
  - intent: execute
    confidence: 0.15
    reason: "No matching patterns found"

recommendation:
  intent: plan
  confidence: 0.95
  auto_route: true  # Above threshold (0.70)
```

---

### 2. Related Files Query

**Use Case:** Executor needs to know which files are commonly modified together

**Input:**
```yaml
query_type: related_files
primary_file: "HostControlPanelContent.razor"
context: "UI feature modification"
```

**Process:**
1. Load knowledge graph
2. Check `file_relationships.{file}.common_changes_with`
3. Sort by co-modification rate
4. Filter by relevance (e.g., UI context → CSS/Razor files)

**Output:**
```yaml
related_files:
  - file: "wwwroot/css/noor-canvas.css"
    co_modification_rate: 0.75
    reason: "Modified together 75% of the time"
    
  - file: "HostControlPanel.razor"
    co_modification_rate: 0.60
    reason: "Parent component, often needs updates"

test_files:
  - "Tests/UI/host-control-panel.spec.ts"
  - "Tests/UI/fab-button-tests.spec.ts"

suggestion: "Consider reviewing noor-canvas.css - it's modified alongside this file in 75% of cases"
```

---

### 3. Correction Prevention Query

**Use Case:** Before modifying a file, check if it's commonly confused with another

**Input:**
```yaml
query_type: correction_prevention
target_file: "HostControlPanel.razor"
intent: "modify FAB button"
```

**Process:**
1. Load knowledge graph
2. Check `correction_history.file_mismatch.common_mistakes`
3. Find instances where `incorrect` matches target file

**Output:**
```yaml
warning: true
message: "⚠️ CAUTION: This file is frequently confused with another"

correction_history:
  incorrect_file: "HostControlPanel.razor"
  correct_file: "HostControlPanelContent.razor"
  occurrences: 12
  
recommendation:
  action: "verify"
  question: "Are you sure you want HostControlPanel.razor and not HostControlPanelContent.razor?"
  rationale: "FAB button is typically in HostControlPanelContent.razor (12 previous corrections)"
```

---

### 4. Workflow Prediction Query

**Use Case:** Planner needs to know typical workflow for a feature type

**Input:**
```yaml
query_type: workflow_prediction
feature_type: "UI feature"
intent: "plan"
```

**Process:**
1. Load knowledge graph
2. Check `workflow_patterns` for matching patterns
3. Return most successful workflow

**Output:**
```yaml
recommended_workflow:
  name: "UI_feature_workflow"
  phases:
    - plan
    - execute
    - test
    - validate
  success_rate: 0.92
  frequency: 45
  
  phase_details:
    plan:
      typical_tasks:
        - "Break down UI changes"
        - "Identify files to modify"
    execute:
      typical_tasks:
        - "Modify Razor component"
        - "Update CSS"
    test:
      typical_tasks:
        - "Create Playwright visual test"
        - "Run Percy snapshot"
    validate:
      typical_tasks:
        - "Check linting"
        - "Run build"

suggestion: "This workflow has 92% success rate for UI features. Recommend following it."
```

---

### 5. Validation Insights Query

**Use Case:** Validator needs to know common issues and fixes

**Input:**
```yaml
query_type: validation_insights
check_type: "linting"
files:
  - "HostControlPanelContent.razor"
```

**Process:**
1. Load knowledge graph
2. Check `validation_insights.common_failures`
3. Return failure rates and common fixes

**Output:**
```yaml
insights:
  - check: "linting"
    failure_rate: 0.15
    common_fix: "fix-copilotchats-violations.ps1"
    fix_success_rate: 0.95
    
  - files_prone_to_failure:
      - "*.razor"
    
  - typical_issues:
      - "Unused using statements"
      - "Inconsistent indentation"

recommendation:
  pre_check: "Run fix-copilotchats-violations.ps1 before validating"
  rationale: "Fixes 95% of linting issues automatically"
```

---

### 6. Feature Component Query

**Use Case:** Understanding which files belong to a feature

**Input:**
```yaml
query_type: feature_components
feature_name: "fab_button"
```

**Process:**
1. Load knowledge graph
2. Check `feature_components.{feature}`
3. Return all related files

**Output:**
```yaml
feature: "fab_button"
primary_files:
  - "SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor"
  
style_files:
  - "SPA/NoorCanvas/wwwroot/css/noor-canvas.css"
  
test_files:
  - "Tests/UI/fab-button-tests.spec.ts"
  
sessions:
  - "fab-button-animation"
  - "fab-button-pulse-fix"
  
total_modifications: 23
last_modified: "2025-11-02"

suggestion: "This feature has been modified 23 times across 2 sessions"
```

---

### 7. Pattern Similarity Query

**Use Case:** Find similar past requests

**Input:**
```yaml
query_type: pattern_similarity
phrase: "create a download button"
limit: 5
```

**Process:**
1. Load knowledge graph
2. Extract keywords from phrase
3. Search all successful phrases for similar patterns
4. Rank by similarity

**Output:**
```yaml
similar_patterns:
  - pattern: "add a share button"
    similarity: 0.85
    intent: plan
    confidence: 0.95
    outcome: "success"
    
  - pattern: "create export feature"
    similarity: 0.70
    intent: plan
    confidence: 0.90
    outcome: "success"

recommendation:
  intent: plan
  confidence: 0.88  # Weighted average based on similarity
  rationale: "Similar to 2 successful PLAN patterns"
```

---

## Usage by Other Agents

### Intent Router
```markdown
#file:.github/prompts/internal/intent-router.md

Before routing, query BRAIN:

#shared-module:brain-query.md
query_type: intent_confidence
phrase: "{user_request}"
candidate_intents: [plan, execute, resume, correct, test, validate, ask, govern]

If confidence > 0.70:
  Auto-route to recommended intent
Else:
  Ask user for clarification
```

### Code Executor
```markdown
#file:.github/prompts/internal/code-executor.md

Before modifying file:

#shared-module:brain-query.md
query_type: correction_prevention
target_file: "{file_to_modify}"
intent: "{current_task}"

If warning:
  Confirm with user before proceeding
  
Also query:
query_type: related_files
primary_file: "{file_to_modify}"

Suggest related files to user
```

### Work Planner
```markdown
#file:.github/prompts/internal/work-planner.md

When creating plan:

#shared-module:brain-query.md
query_type: workflow_prediction
feature_type: "{detected_type}"
intent: "plan"

Use recommended workflow as template
Customize based on specific request
```

### Health Validator
```markdown
#file:.github/prompts/internal/health-validator.md

Before running checks:

#shared-module:brain-query.md
query_type: validation_insights
check_type: "all"

Apply recommended pre-fixes
Run validation
Report results
```

---

## Query Interface

**Shared Module Declaration:**
```markdown
<!-- In other agent files, use this syntax: -->

#shared-module:brain-query.md
query_type: {type}
{...query_parameters}
```

**The brain-query agent will:**
1. Parse parameters
2. Load knowledge graph
3. Execute query
4. Return structured results

---

## Performance Optimization

### Caching
```yaml
# Cache knowledge graph in memory for 5 minutes
cache:
  enabled: true
  ttl: 300  # seconds
  invalidate_on: 
    - brain_update
```

### Fast Lookups
```yaml
# Use indexed access for O(1) lookups
indexes:
  intent_patterns_by_keyword: 
    "add": [plan]
    "continue": [execute]
    "wrong": [correct]
  
  files_by_extension:
    ".razor": [...]
    ".css": [...]
```

---

## Error Handling

**If knowledge graph is empty:**
```yaml
result:
  status: "no_data"
  message: "BRAIN not yet populated. Using default routing logic."
  fallback: true
```

**If query fails:**
```yaml
result:
  status: "error"
  message: "Failed to parse knowledge graph"
  fallback: true
  error_details: "..."
```

**Fallback behavior:**
- Router uses static keyword matching
- Executor proceeds without warnings
- Planner uses default workflow templates

---

## Output Format

All queries return:
```yaml
status: "success" | "no_data" | "error"
query_type: "{type}"
results: {...}
recommendation: {...}  # Optional
warning: {...}  # Optional
suggestion: {...}  # Optional
```

---

## Integration with Event Logging

**When query is executed, log the usage:**
```json
{"timestamp":"2025-11-02T10:30:00Z","event":"brain_query","query_type":"intent_confidence","phrase":"add share button","confidence":0.95,"intent":"plan"}
```

This creates a feedback loop:
- Brain Query → Used for routing
- Event logged → Processed by Brain Updater
- Knowledge graph updated → Improves future queries
