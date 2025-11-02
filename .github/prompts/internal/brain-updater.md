# Brain Updater Agent

**Role:** Process event stream and update knowledge graph  
**Version:** 1.0  
**Trigger:** Periodic (after N events) or on-demand via `#file:.github/prompts/internal/brain-updater.md`

---

## Purpose

This agent reads raw events from `events.jsonl` and aggregates them into structured knowledge in `knowledge-graph.yaml`. It identifies patterns, relationships, and insights that improve KDS routing and decision-making.

---

## Execution Steps

### Step 1: Load Current Knowledge Graph

```yaml
#file:.github/kds-brain/knowledge-graph.yaml
```

**Store in memory:**
- Current intent patterns
- Existing file relationships
- Workflow patterns
- Correction history
- Validation insights

### Step 2: Read New Events

```jsonl
#file:.github/kds-brain/events.jsonl
```

**Filter events since last update:**
- Check `statistics.last_updated` timestamp
- Read only events newer than last update
- If first run, process all events

### Step 3: Process Events by Type

#### 3.1 Intent Detection Events
```json
{"event":"intent_detected","intent":"plan","phrase":"add share button","confidence":0.95,"success":true}
```

**Actions:**
- If `success:true` → Add to `intent_patterns.{intent}.successful_phrases`
- If `success:false` → Add to `intent_patterns.{intent}.failed_phrases`
- Update frequency count if pattern exists
- Calculate average confidence

#### 3.2 File Modification Events
```json
{"event":"file_modified","file":"HostControlPanelContent.razor","session":"fab-button","task":"Add pulse animation"}
```

**Actions:**
- Update `file_relationships.{file}.modification_count`
- Update `file_relationships.{file}.last_modified_for`
- Track which session modified it

#### 3.3 Co-Modification Events
```json
{"event":"files_modified_together","files":["HostControlPanelContent.razor","noor-canvas.css"],"session":"fab-button"}
```

**Actions:**
- Calculate co-modification rate
- Update `file_relationships.{file1}.common_changes_with.{file2}`
- Increase confidence score (max 1.0)

**Formula:**
```
co_mod_rate = times_modified_together / max(file1_modifications, file2_modifications)
```

#### 3.4 Correction Events
```json
{"event":"correction","type":"file_mismatch","incorrect":"HostControlPanel.razor","correct":"HostControlPanelContent.razor"}
```

**Actions:**
- Increment `correction_history.{type}.total_occurrences`
- Add to `correction_history.{type}.common_mistakes` (or increment frequency)
- Flag files prone to confusion

#### 3.5 Validation Events
```json
{"event":"validation_failed","check":"linting","file":"HostControlPanelContent.razor","fixed":true}
```

**Actions:**
- Update `validation_insights.common_failures.{check}.failure_rate`
- Track which files fail most often
- Record common fixes

#### 3.6 Workflow Events
```json
{"event":"task_completed","session":"fab-button","phase":"plan","next_phase":"execute"}
```

**Actions:**
- Track phase sequences
- Calculate success rates for workflows
- Identify common patterns (e.g., UI features always: plan → execute → test)

#### 3.7 Test Events
```json
{"event":"test_created","test_file":"Tests/UI/fab-button.spec.ts","target_file":"HostControlPanelContent.razor"}
```

**Actions:**
- Map test files to source files
- Update `file_relationships.{file}.test_files`

### Step 4: Aggregate and Deduplicate

**For each pattern type:**
1. Group similar phrases (fuzzy matching)
2. Calculate aggregate statistics
3. Remove low-confidence patterns (< threshold)
4. Sort by frequency/confidence

**Example Aggregation:**
```yaml
# Before (raw events):
- pattern: "add a share button"
  confidence: 0.95
  frequency: 1
- pattern: "add a export button"
  confidence: 0.93
  frequency: 1

# After (aggregated):
- pattern: "add a * button"  # Generalized pattern
  confidence: 0.94  # Average
  frequency: 2
  examples:
    - "add a share button"
    - "add a export button"
```

### Step 5: Update Knowledge Graph

Write updated data to:
```yaml
#file:.github/kds-brain/knowledge-graph.yaml
```

**Update:**
- All pattern collections
- File relationships
- Workflow sequences
- Correction history
- Statistics (increment `total_events_processed`, update `last_updated`)

### Step 6: Generate Update Summary

**Output:**
```markdown
🧠 **BRAIN Update Complete**

📊 **Events Processed:** 47 new events since last update

🎯 **Intent Patterns:**
- PLAN: +3 successful phrases (now 15 total)
- CORRECT: +2 correction triggers (now 8 total)

📁 **File Relationships:**
- HostControlPanelContent.razor ↔ noor-canvas.css: 0.75 co-mod rate (+0.15)
- New relationship discovered: HostSessionList.razor ↔ SessionHub.cs

🔧 **Correction Insights:**
- file_mismatch: 3 new occurrences (total: 18)
- Most common: HostControlPanel.razor → HostControlPanelContent.razor (12 times)

✅ **Validation Insights:**
- Linting failure rate: 0.12 (-0.03 improvement!)
- Common fix: fix-copilotchats-violations.ps1 (worked 95% of time)

🔄 **Workflow Patterns:**
- UI feature workflow: 92% success rate (45 instances)
- Bug fix workflow: 88% success rate (18 instances)

⚡ **Next Actions:**
- Router will use updated patterns for better intent detection
- File suggestions will prioritize high co-modification pairs
- Correction prevention for common file mistakes
```

---

## Advanced Features

### Pattern Generalization

**Detect wildcards in phrases:**
```yaml
# Input events:
- "add a share button"
- "add a export button"
- "add a print button"

# Generalized pattern:
- pattern: "add a {feature} button"
  confidence: 0.93
  frequency: 3
  wildcard_position: 2
```

### Confidence Decay

**Reduce confidence of old patterns:**
```python
# Patterns not seen in 30 days lose confidence
age_days = (now - pattern.last_seen).days
if age_days > 30:
    pattern.confidence *= 0.95  # 5% decay per update
```

### Anomaly Detection

**Flag unusual patterns:**
```yaml
anomalies:
  - type: "unexpected_file_modification"
    description: "Package.json modified during UI feature (unusual)"
    session: "fab-button"
    investigate: true
```

---

## Usage

### Automatic Updates (Recommended)
```markdown
# Triggered automatically by other agents when:
- 50+ new events accumulated
- End of session
- Before routing (if events > threshold)
```

### Manual Update
```markdown
#file:.github/prompts/internal/brain-updater.md

Update the BRAIN with all new events
```

### First-Time Population
```markdown
#file:.github/prompts/internal/brain-updater.md

Scan all existing session files in .github/sessions/ and populate BRAIN
```

---

## Event Logging Standard

**All KDS agents MUST log events using this format:**

```jsonl
{"timestamp":"ISO8601","event":"event_type","...additional_fields"}
```

**Required fields:**
- `timestamp` (ISO 8601 format)
- `event` (event type string)

**Common events:**
- `intent_detected`
- `file_modified`
- `files_modified_together`
- `correction`
- `validation_failed`
- `validation_passed`
- `task_completed`
- `test_created`
- `test_passed`
- `test_failed`
- `session_started`
- `session_completed`

---

## Output

Always output the update summary showing what changed in the knowledge graph.
