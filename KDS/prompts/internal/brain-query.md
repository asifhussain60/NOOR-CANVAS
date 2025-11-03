# Brain Query Agent

**Role:** Query BRAIN (3 tiers) for insights to improve KDS decision-making  
**Version:** 2.0 (Three-Tier BRAIN)  
**Trigger:** Called by other agents (router, planner, executor) for context

---

## Purpose

This agent provides intelligent querying of the **three-tier BRAIN system**:

**Tier 1 (Short-Term Memory):**
- Query conversation history for context
- Resolve pronouns and references
- NOT IMPLEMENTED YET (placeholder for future)

**Tier 2 (Long-Term Memory):**
- Help router determine intent with higher confidence
- Suggest related files to planner/executor
- Warn about common mistakes before they happen
- Recommend optimal workflows
- Predict next likely steps

**Tier 3 (Development Context):**
- Provide data-driven estimates for planning
- Surface proactive warnings (velocity drops, flaky tests, hotspots)
- Analyze work patterns for optimal scheduling
- Correlate metrics for insights

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
    occurrences: 12
    
  - intent: execute
    confidence: 0.15
    reason: "No matching patterns found"
    occurrences: 0

recommendation:
  intent: plan
  confidence: 0.95
  auto_route: true  # Above threshold (0.70)
  
protection_check:
  confidence_valid: true
  occurrences_check: 12
  meets_minimum_threshold: true  # >= 3 required
  anomaly_detected: false
  safety_level: "high"  # high | medium | low
```

**🛡️ PROTECTION: Validate confidence and occurrence data**

Load protection config from knowledge-graph.yaml:
```yaml
protection_config:
  learning_quality:
    min_confidence_threshold: 0.70
    min_occurrences_for_pattern: 3
    max_single_event_confidence: 0.50
    anomaly_confidence_threshold: 0.95
```

**Safety Validation Logic:**

1. **Confidence Score Validation**
   - ✅ Valid: 0.0 - 1.0 range
   - ❌ Invalid: Outside range or NaN → Log error, return fallback

2. **Occurrence Threshold Check**
   - ✅ High confidence (>= 0.70) + occurrences >= 3 → `safety_level: "high"`
   - ⚠️ High confidence (>= 0.70) + occurrences < 3 → `safety_level: "low"` (insufficient data)
   - ⚠️ Medium confidence (>= 0.50) + occurrences >= 3 → `safety_level: "medium"`
   - ❌ Low confidence (< 0.50) → `safety_level: "low"`

3. **Anomaly Detection**
   - 🚨 Confidence > 0.95 AND occurrences = 1 → `anomaly_detected: true`
   - 🚨 Confidence jumps > 0.30 in single update → `anomaly_detected: true`
   - 📝 Flag for manual review

4. **Safety Recommendations**
   ```yaml
   # High safety: Auto-route
   safety_level: "high"
   recommendation: "Auto-route with confidence"
   
   # Medium safety: Ask confirmation
   safety_level: "medium"
   recommendation: "Show intent, ask user confirmation"
   
   # Low safety: Fallback to pattern matching
   safety_level: "low"
   recommendation: "Use traditional pattern matching"
   
   # Anomaly detected: Override to manual
   anomaly_detected: true
   recommendation: "Manual review required - suspicious pattern"
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

## Tier 3 Query Types (Development Context)

### 8. Feature Estimate Query

**Use Case:** Planner needs data-driven estimates for feature completion time

**Input:**
```yaml
query_type: feature_estimate
feature_type: "UI feature"
complexity: "medium"  # low, medium, high
```

**Process:**
1. Load `development-context.yaml`
2. Query `work_patterns.feature_lifecycle`
3. Adjust for complexity and hotspots

**Output:**
```yaml
estimate:
  avg_days_from_start_to_deploy: 5.4
  complexity_multiplier: 1.2  # Medium complexity
  adjusted_estimate: 6.5 days
  
historical_data:
  similar_features_count: 12
  fastest_completion: 3 days
  slowest_completion: 9 days
  median_completion: 5 days
  
hotspot_warning:
  affected_files:
    - "HostControlPanelContent.razor"
  churn_rate: 0.28
  suggestion: "This file is a hotspot (28% churn). Add 1-2 days for potential rework."
  
recommendation:
  estimated_duration: "6-8 days"
  confidence: "medium"
  rationale: "Based on 12 similar UI features, avg 5.4 days, adjusted for medium complexity and hotspot file"
```

---

### 9. Proactive Warnings Query

**Use Case:** Surface current development warnings to user

**Input:**
```yaml
query_type: proactive_warnings
severity: "all"  # low, medium, high, all
```

**Process:**
1. Load `development-context.yaml`
2. Return `proactive_insights.current_warnings`
3. Sort by severity

**Output:**
```yaml
warnings:
  - type: "velocity_drop"
    severity: "medium"
    message: "Development velocity dropped 68% this week"
    detected_at: "2025-11-03T14:00:00Z"
    suggestion: "Consider breaking work into smaller commits or increasing KDS usage"
    metrics:
      current_week: 140 lines
      avg_week: 437 lines
      drop_percent: 68
      
  - type: "flaky_test"
    severity: "high"
    message: "Test 'fab-button.spec.ts' fails 15% of time"
    detected_at: "2025-11-03T10:30:00Z"
    suggestion: "Investigate and fix or mark as unstable"
    metrics:
      test_name: "fab-button.spec.ts"
      flake_rate: 0.15
      total_runs: 20
      failures: 3
      
  - type: "high_churn"
    severity: "low"
    message: "HostControlPanelContent.razor has high churn rate (28%)"
    detected_at: "2025-11-03T11:00:00Z"
    suggestion: "Consider refactoring this file to improve stability"
    metrics:
      file: "HostControlPanelContent.razor"
      churn_rate: 0.28
      total_changes: 340 lines
      
recommendation:
  action: "address_high_severity"
  priority_warning: "flaky_test"
  rationale: "Fix flaky test before it blocks development"
```

---

### 10. Productivity Pattern Query

**Use Case:** Planner wants to schedule work during productive hours

**Input:**
```yaml
query_type: productivity_pattern
scope: "weekly"  # daily, weekly, monthly
```

**Process:**
1. Load `development-context.yaml`
2. Return `work_patterns` data
3. Analyze session distribution

**Output:**
```yaml
productivity:
  most_productive_time: "10:00-12:00, 14:00-17:00"
  avg_coding_hours_per_day: 4.2
  
  session_distribution:
    morning_sessions: 0.35    # 35% morning
    afternoon_sessions: 0.52  # 52% afternoon
    evening_sessions: 0.13    # 13% evening
    
  focus_duration:
    avg_without_interruption: "1.8 hours"
    longest_session: "6.2 hours"
    longest_session_date: "2025-11-01"
    
  workflow_success_by_time:
    morning: 0.94   # 94% success in morning
    afternoon: 0.91 # 91% success in afternoon
    evening: 0.78   # 78% success in evening
    
recommendation:
  optimal_schedule:
    - "Schedule complex work: 10am-12pm (highest focus)"
    - "Schedule collaborative work: 2pm-5pm (high productivity, afternoon)"
    - "Avoid evening sessions for critical tasks (lower success rate)"
  
  session_planning:
    recommended_duration: "2 hours"  # Below avg focus duration
    break_frequency: "Every 90 minutes"
    
suggestion: "Plan sessions during 10am-12pm and 2pm-5pm for highest success rate (94% and 91%)"
```

---

### 11. Correlation Insights Query

**Use Case:** Understanding relationships between development metrics

**Input:**
```yaml
query_type: correlation_insights
focus: "all"  # all, velocity, quality, workflow
```

**Process:**
1. Load `development-context.yaml`
2. Return `correlations` data
3. Highlight actionable insights

**Output:**
```yaml
correlations:
  commit_size_vs_success:
    small_commits_range: "1-3 files"
    small_commit_success_rate: 0.94
    large_commits_range: "10+ files"
    large_commit_success_rate: 0.68
    insight: "Smaller commits 38% more successful than large commits"
    recommendation: "Break current work into 1-3 file commits for higher success"
    
  test_first_vs_rework:
    test_first_rework_rate: 0.12   # Only 12% need rework
    test_skip_rework_rate: 0.38    # 38% need rework
    insight: "Test-first reduces rework by 68%"
    recommendation: "Create tests BEFORE implementation to reduce rework"
    
  kds_usage_vs_velocity:
    high_kds_weeks: ["week_1", "week_2", "week_3"]
    high_kds_velocity: 437  # lines/week avg
    low_kds_weeks: ["week_4"]
    low_kds_velocity: 140   # lines/week
    correlation: 0.87       # Strong positive correlation
    insight: "KDS usage strongly correlates with development velocity (r=0.87)"
    recommendation: "Use KDS for planning and execution to maintain high velocity"
    
actionable_insights:
  - "Use KDS for all tasks (increases velocity by 3x)"
  - "Write tests before code (reduces rework by 68%)"
  - "Keep commits small (1-3 files for 94% success rate)"
```

---

### 12. Hotspot Analysis Query

**Use Case:** Identify unstable files before modification

**Input:**
```yaml
query_type: hotspot_analysis
file: "HostControlPanelContent.razor"  # Optional, or analyze all
```

**Process:**
1. Load `development-context.yaml`
2. Return `code_changes.hotspots` data
3. Calculate stability metrics

**Output:**
```yaml
hotspot:
  file: "HostControlPanelContent.razor"
  total_changes: 340 lines
  current_size: 1200 lines
  churn_rate: 0.28  # 28% of file changed frequently
  stability: "low"  # high/medium/low
  
  change_history:
    last_30_days:
      commits: 12
      lines_added: 180
      lines_deleted: 160
      net_growth: 20
      
  related_hotspots:
    - file: "noor-canvas.css"
      churn_rate: 0.22
      co_modification_rate: 0.75
      
  impact_assessment:
    risk_level: "medium-high"
    reasons:
      - "High churn rate (28%)"
      - "Modified 12 times in 30 days"
      - "Co-modified with another hotspot (noor-canvas.css)"
      
recommendation:
  action: "proceed_with_caution"
  suggestions:
    - "Add extra time for potential rework"
    - "Create comprehensive tests (file is unstable)"
    - "Consider refactoring after this change"
  estimated_rework_probability: 0.35  # 35% chance of needing rework
```

---

## Usage by Other Agents

### Intent Router
```markdown
#file:KDS/prompts/internal/intent-router.md

Before routing, query BRAIN (Tier 2):

#shared-module:brain-query.md
query_type: intent_confidence
phrase: "{user_request}"
candidate_intents: [plan, execute, resume, correct, test, validate, ask, govern]

If confidence > 0.70:
  Auto-route to recommended intent
Else:
  Ask user for clarification
  
Also check for warnings (Tier 3):

#shared-module:brain-query.md
query_type: proactive_warnings
severity: "medium"  # or higher

If warnings exist:
  Surface to user before routing
```

### Code Executor
```markdown
#file:KDS/prompts/internal/code-executor.md

Before modifying file (Tier 2 + Tier 3):

# Check for common file confusion
#shared-module:brain-query.md
query_type: correction_prevention
target_file: "{file_to_modify}"
intent: "{current_task}"

If warning:
  Confirm with user before proceeding
  
# Check if file is a hotspot
#shared-module:brain-query.md
query_type: hotspot_analysis
file: "{file_to_modify}"

If high_churn:
  Warn user about potential rework
  Recommend extra testing
  
# Suggest related files
#shared-module:brain-query.md
query_type: related_files
primary_file: "{file_to_modify}"

Suggest related files to user
```

### Work Planner
```markdown
#file:KDS/prompts/internal/work-planner.md

When creating plan (Tier 2 + Tier 3):

# Get recommended workflow (Tier 2)
#shared-module:brain-query.md
query_type: workflow_prediction
feature_type: "{detected_type}"
intent: "plan"

# Get data-driven estimates (Tier 3)
#shared-module:brain-query.md
query_type: feature_estimate
feature_type: "{detected_type}"
complexity: "{estimated_complexity}"

# Check current warnings (Tier 3)
#shared-module:brain-query.md
query_type: proactive_warnings
severity: "all"

# Get productivity patterns (Tier 3)
#shared-module:brain-query.md
query_type: productivity_pattern
scope: "weekly"

# Get correlation insights (Tier 3)
#shared-module:brain-query.md
query_type: correlation_insights
focus: "all"

Use all insights to create:
- Data-driven timeline estimates
- Optimal workflow based on past success
- Scheduled during productive hours
- Include warnings upfront
- Recommend test-first approach (if correlation shows benefit)
```

### Health Validator
```markdown
#file:KDS/prompts/internal/health-validator.md

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
