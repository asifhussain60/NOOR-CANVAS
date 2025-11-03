# Brain Updater Agent

**Role:** Process event stream and update knowledge graph (Tier 2) + trigger development context collection (Tier 3)  
**Version:** 2.0 (Three-Tier BRAIN)  
**Trigger:** Periodic (after N events) or on-demand via `#file:KDS/prompts/internal/brain-updater.md`

---

## Purpose

This agent manages the KDS BRAIN update cycle for **Tier 2 (Knowledge Graph)** and **Tier 3 (Development Context)**:

**Tier 1 (Short-Term Memory):**
- Conversation history (last 20 conversations)
- Managed separately by conversation-context-manager.md
- Not updated by this agent

**Tier 2 (Long-Term Memory):**
- Reads raw events from `events.jsonl`
- Aggregates them into structured knowledge in `knowledge-graph.yaml`
- Identifies patterns, relationships, and insights
- Improves KDS routing and decision-making

**Tier 3 (Development Context):**
- Collects holistic project metrics from git, tests, builds
- Updates `development-context.yaml` with development activity
- Generates proactive warnings and correlations
- Enables data-driven planning and velocity tracking

---

## Execution Steps

### Step 1: Load Current Knowledge Graph

```yaml
#file:KDS/kds-brain/knowledge-graph.yaml
```

**Store in memory:**
- Current intent patterns
- Existing file relationships
- Workflow patterns
- Correction history
- Validation insights

### Step 2: Read New Events (WITH PROTECTION)

🛡️ **PROTECTION: Validate event stream integrity first**

#### 2.1 Validate Event Stream
```powershell
.\KDS\scripts\protect-event-append.ps1 -Mode validate
```

**Checks:**
- ✅ All events have valid structure
- ✅ Timestamps are valid (not future, not too old)
- ✅ Checksums match (if present)
- ✅ No corrupted lines

#### 2.2 Read Events
```jsonl
#file:KDS/kds-brain/events.jsonl
```

**Filter events since last update:**
- Check `statistics.last_updated` timestamp
- Read only events newer than last update
- If first run, process all events

**Validation per event:**
- ✅ Required fields present (timestamp, event)
- ✅ Timestamp in valid range
- ⚠️ Skip corrupted events (log warning)

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

### Step 5: Update Knowledge Graph (WITH PROTECTION)

🛡️ **PROTECTION: Run backup and validation BEFORE updating**

#### 5.1 Create Backup
```powershell
.\KDS\scripts\protect-brain-update.ps1 -Mode backup
```

**This creates:**
- Timestamped backup in `KDS/kds-brain/backups/`
- Keeps 10 most recent backups
- Enables rollback if update fails

#### 5.2 Validate New Data (Phase 3 - Learning Quality)

**🔒 PROTECTION: Enforce occurrence thresholds**

Before updating confidence scores, validate:

```yaml
protection_config:
  learning_quality:
    min_occurrences_for_pattern: 3
    max_single_event_confidence: 0.50
```

**For each intent pattern:**
```python
if pattern.occurrences < min_occurrences_for_pattern:
    # Don't allow high confidence with insufficient data
    if new_confidence > max_single_event_confidence:
        new_confidence = max_single_event_confidence
        flag_as_low_quality = true
        log_warning("Pattern has insufficient occurrences - capping confidence")
```

**Anomaly Detection (Phase 3):**
```python
if new_confidence > 0.95 and pattern.occurrences == 1:
    # ANOMALY: Suspiciously high confidence with 1 occurrence
    log_anomaly({
        "type": "high_confidence_low_occurrences",
        "pattern": pattern,
        "confidence": new_confidence,
        "occurrences": pattern.occurrences,
        "action": "flagged_for_review"
    })
    # Cap confidence or flag for manual review
    new_confidence = 0.70  # Safe fallback
```

**Confidence Jump Detection (Phase 3):**
```python
confidence_jump = new_confidence - pattern.previous_confidence

if confidence_jump > 0.30:
    # ANOMALY: Confidence jumped too much in one update
    log_anomaly({
        "type": "confidence_jump",
        "pattern": pattern,
        "previous": pattern.previous_confidence,
        "new": new_confidence,
        "jump": confidence_jump,
        "action": "flagged_for_review"
    })
    # Moderate the jump
    new_confidence = pattern.previous_confidence + 0.15  # Max +15% per update
```

#### 5.3 Validate Structure
```powershell
.\KDS\scripts\protect-brain-update.ps1 -Mode validate
```

**Validates:**
- ✅ YAML structure is valid
- ✅ All required sections present
- ✅ Confidence scores in 0.0-1.0 range
- ✅ Protection config intact
- ✅ Statistics section correct

#### 5.4 Perform Update
```powershell
# Only if validation passes
.\KDS\scripts\protect-brain-update.ps1 -Mode update -NewContent $updatedYaml
```

**Automatic rollback if update fails:**
- ❌ Update fails validation → Restores from backup
- ❌ File write error → Restores from backup
- ✅ Update succeeds → Backup kept for 10 iterations

Write updated data to:
```yaml
#file:KDS/kds-brain/knowledge-graph.yaml
```

**Update:**
- All pattern collections (with occurrence enforcement)
- File relationships
- Workflow sequences
- Correction history
- Statistics (increment `total_events_processed`, update `last_updated`)
- Anomalies queue (Phase 3 - for manual review)

### Step 6: Trigger Development Context Collection (Tier 3)

**⚡ EFFICIENCY OPTIMIZATION: Throttled Tier 3 collection to balance accuracy vs performance**

**Check if Tier 3 update is needed:**

```yaml
# Read development-context.yaml
last_collection_time = development-context.yaml.metadata.last_updated

# Calculate time since last collection
time_since_collection = now() - last_collection_time
```

**Decision Logic:**
```python
if time_since_collection > 1_hour OR manual_trigger:
    # Tier 3 collection needed
    trigger_tier3_collection()
else:
    # Skip Tier 3 - data is still fresh
    log_skip("Tier 3 skipped - last collection was {time_since_collection} ago")
    proceed_to_step_7()
```

**Rationale:**
- ✅ **Accuracy preserved:** 1-hour freshness sufficient for velocity/git metrics
- ✅ **Efficiency improved:** Reduces 2-5 min operations from 2-4x/day to 1-2x/day
- ✅ **User experience:** Still runs in background, zero user impact
- 📊 **Data type justification:** Git commits, test patterns, and build metrics don't change every 50 events

**If Tier 3 collection needed, invoke:**

```markdown
#file:KDS/prompts/internal/development-context-collector.md
```

**This updates:**
- `development-context.yaml` with latest git, KDS, test, and build metrics
- Proactive insights and warnings
- Work patterns and correlations
- `metadata.last_updated` timestamp (used for throttling)

**Frequency:**
- ✅ **Throttled:** Only if last_collection > 1 hour
- ✅ **On-demand:** Manual trigger always runs
- ✅ **Smart:** Skips redundant collections

### Step 7: Generate Update Summary

**Output format varies based on Tier 3 status:**

#### **If Tier 3 was updated:**
```markdown
🧠 **BRAIN Update Complete** (3 Tiers Updated)

📊 **Events Processed:** 47 new events since last update

**Tier 2: Knowledge Graph (Long-Term Memory)**

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

**Tier 3: Development Context (Holistic Metrics)**

📈 **Git Activity:**
- 47 commits in last 30 days (1.6/day avg)
- 3 contributors active
- Hotspot: HostControlPanelContent.razor (12 commits, churn rate 28%)

⚡ **Development Velocity:**
- Week 4: 437 lines (up from 380)
- Trend: Increasing ✅
- KDS correlation: 0.87 (strong positive)

🧪 **Testing Activity:**
- 28 tests created, 88% pass rate
- ⚠️ Flaky test detected: fab-button.spec.ts (15% failure rate)

⏰ **Work Patterns:**
- Most productive: 10am-12pm, 2pm-5pm
- Avg session duration: 2.4 hours
- Test-first success: 96% vs test-skip: 67%

⚠️  **Proactive Warnings (2):**
1. High churn file: HostControlPanelContent.razor (consider refactoring)
2. Flaky test: fab-button.spec.ts needs investigation

⚡ **Next Actions:**
- Router will use Tier 2 patterns for better intent detection
- Planner will use Tier 3 metrics for data-driven estimates
- File suggestions will prioritize high co-modification pairs
- Warnings will surface proactively during planning
```

#### **If Tier 3 was skipped (throttled):**
```markdown
🧠 **BRAIN Update Complete** (Tier 2 Updated, Tier 3 Skipped)

📊 **Events Processed:** 47 new events since last update

**Tier 2: Knowledge Graph (Long-Term Memory)**

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

**Tier 3: Development Context (Holistic Metrics)**

⏭️ **Skipped** (last collection: 23 minutes ago - still fresh)
ℹ️  Tier 3 only updates every 1+ hour to optimize performance
📊 Using cached metrics from last collection

⚡ **Next Actions:**
- Router will use Tier 2 patterns for better intent detection
- Planner will use cached Tier 3 metrics for estimates
- File suggestions will prioritize high co-modification pairs
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
#file:KDS/prompts/internal/brain-updater.md

Update the BRAIN with all new events
```

### First-Time Population
```markdown
#file:KDS/prompts/internal/brain-updater.md

Scan all existing session files in KDS/sessions/ and populate BRAIN
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
