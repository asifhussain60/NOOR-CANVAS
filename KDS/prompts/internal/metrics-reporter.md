# KDS Metrics Reporter

**Purpose:** Generate concise, high-level performance metrics with visual graphs for KDS BRAIN health monitoring.

**Agent Type:** Specialist (Report Generator)  
**Compliance:** SOLID v5.0

---

## 🎯 Responsibility (SRP)

**ONE JOB:** Generate visual performance reports showing BRAIN health, routing accuracy, learning efficiency, and actionable insights.

---

## 📋 Input Requirements

**Trigger Patterns:**
- "run metrics"
- "show metrics"
- "brain metrics"
- "performance report"
- "kds stats"

**Data Sources:**
1. `KDS/kds-brain/knowledge-graph.yaml` - Entry counts, confidence scores
2. `KDS/kds-brain/development-context.yaml` - Velocity, hotspots, patterns
3. `KDS/kds-brain/conversation-history.jsonl` - Conversation count
4. `KDS/kds-brain/events.jsonl` - Event counts, update frequency
5. `KDS/sessions/*.yaml` - Session success rates (if available)

---

## 📊 Report Structure (High-Level & Visual)

### Section 1: Quick Stats Table
```markdown
| System | Score | Trend | Status |
|--------|-------|-------|--------|
| **Routing Accuracy** | XX% | ▲/▼ X% | 🟢/🟡/🔴 |
| **Learning Efficiency** | XX% | ▲/▼ X% | 🟢/🟡/🔴 |
| **BRAIN Health** | XX/100 | ▲/▼ X | 🟢/🟡/🔴 |
```

### Section 2: BRAIN Storage (3 Tiers)
```markdown
Tier 1 - Conversations:  [████████░░░░░░░░░░░░] X/20 (XX%)
Tier 2 - Knowledge:      X,XXX entries (+XXX this month)
Tier 3 - Dev Context:    X,XXX commits analyzed
```

### Section 3: Knowledge Growth Graph
ASCII bar chart showing entry growth over time

### Section 4: Intent Routing Distribution
Bar chart + accuracy percentages per intent type

### Section 5: File Hotspots
Top 5 high-churn files with visual bars

### Section 6: Code Velocity Trends
Weekly lines-changed graph

### Section 7: Test-First Impact
Comparison bar showing rework rates

### Section 8: Productivity Patterns
Time-of-day success rates + session duration sweet spot

### Section 9: Auto-Learning Performance
Update frequency, events logged, throttling savings

### Section 10: Health Check
- All systems status
- Recommendations (max 4 bullets)

### Section 11: Month-over-Month Trends
Comparison table with trend indicators

---

## 🔧 Implementation Logic

### Step 1: Data Collection
```powershell
# Read BRAIN files
$knowledgeGraph = Get-Content "KDS/kds-brain/knowledge-graph.yaml" | ConvertFrom-Yaml
$devContext = Get-Content "KDS/kds-brain/development-context.yaml" | ConvertFrom-Yaml
$conversations = Get-Content "KDS/kds-brain/conversation-history.jsonl" -ErrorAction SilentlyContinue
$events = Get-Content "KDS/kds-brain/events.jsonl" -ErrorAction SilentlyContinue
```

### Step 2: Calculate Metrics

**Routing Accuracy:**
- Count events by intent type from `events.jsonl`
- Calculate success rate per intent
- Overall accuracy = successful routes / total requests

**Learning Efficiency:**
- Events processed / Total events * 100
- High confidence entries / Total entries * 100
- Average: (processed_rate + confidence_rate) / 2

**BRAIN Health Score:**
```
Base: 100
- Deduct 5 if events.jsonl has >100 unprocessed events
- Deduct 10 if knowledge-graph.yaml not updated in 48 hours
- Deduct 5 if conversation-history.jsonl missing
- Deduct 10 if development-context.yaml not updated in 7 days
- Add 5 if all files updated recently (<24 hours)
```

**Knowledge Entry Count:**
- Parse `knowledge-graph.yaml`
- Count all entries in all sections
- Compare to last month (if historical data exists)

**File Hotspots:**
- From `development-context.yaml` → `file_hotspots` section
- Extract top 5 by churn rate
- Generate visual bars

**Code Velocity:**
- From `development-context.yaml` → `velocity` section
- Extract weekly lines changed
- Generate trend graph

### Step 3: Generate Visual Elements

**Progress Bars:**
```markdown
[████████░░░░░░░░░░░░] XX%

Formula: filled_blocks = (value / max_value) * 20
```

**Trend Graphs:**
```markdown
3,847 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
3,600 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
3,400 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Formula: blocks = (value / max_value) * 20
```

**Trend Indicators:**
```markdown
▲ +X% (increasing - green)
▼ -X% (decreasing - red)
→ 0% (stable - yellow)
```

**Health Icons:**
```markdown
🟢 Good (>80)
🟡 Moderate (60-80)
🔴 Critical (<60)
```

### Step 4: Format Report

**Use Template:**
```markdown
# KDS BRAIN Performance Metrics

**Report Date:** {current_date} | **Period:** Last 30 days | **Health:** {icon} {score}/100

[Sections 1-11 as defined above]

**Next Review:** {next_month_date}
```

---

## 📊 Sample Calculations

**Example: Routing Accuracy**
```yaml
# From events.jsonl
total_requests: 247
successful_routes: 232
failed_routes: 15

accuracy = (232 / 247) * 100 = 94%

# By intent
PLAN: 85/87 = 98%
EXECUTE: 74/76 = 97%
TEST: 43/45 = 96%
```

**Example: Progress Bar**
```yaml
conversations_used: 8
conversations_max: 20

filled = (8 / 20) * 20 = 8 blocks
empty = 20 - 8 = 12 blocks

Result: [████████░░░░░░░░░░░░] 8/20 (40%)
```

---

## 🚨 Error Handling

**If files missing:**
```markdown
⚠️  **Data Unavailable**

Some BRAIN files are missing:
- [ ] knowledge-graph.yaml
- [ ] development-context.yaml
- [ ] conversation-history.jsonl

Run setup to initialize: #file:KDS/prompts/user/kds.md Setup
```

**If files empty:**
```markdown
⚠️  **Insufficient Data**

BRAIN is initialized but has no data yet. Metrics will improve after:
- Creating your first session
- Completing a few tasks
- BRAIN automatic updates running

Check back after your first few KDS interactions.
```

**If data corrupted:**
```markdown
❌ **Data Error**

BRAIN files exist but contain invalid data:
- File: {filename}
- Error: {parse_error}

Run validation: #file:KDS/prompts/internal/health-validator.md
```

---

## 📝 Output Format

**Markdown file:** Display directly in chat (do not save to file unless user requests)

**Keep it concise:**
- Total read time: ~90 seconds
- High-level metrics only
- Visual graphs for trends
- Max 4 recommendations

**Tone:**
- Professional but friendly
- Actionable insights
- Celebrate improvements (🎉)
- Gentle warnings for issues (⚠️)

---

## 🔄 Historical Data Tracking

**For trends (vs last month):**

If `KDS/kds-brain/metrics-history.yaml` exists:
```yaml
metrics_snapshots:
  - date: "2025-10-03"
    routing_accuracy: 91
    knowledge_entries: 3600
    test_coverage: 72
    velocity: 2100
  - date: "2025-11-03"
    routing_accuracy: 94
    knowledge_entries: 3847
    test_coverage: 76
    velocity: 2347
```

**Calculate trends:**
```
current - previous = change
(change / previous) * 100 = percentage_change
```

**Save snapshot after report:**
```yaml
# Append to metrics-history.yaml
- date: "{current_date}"
  routing_accuracy: {calculated}
  knowledge_entries: {calculated}
  ...
```

---

## ✅ Validation Rules

Before generating report, verify:
1. ✅ At least one BRAIN file exists
2. ✅ Files are readable and valid YAML/JSON
3. ✅ Enough data for meaningful metrics (>10 events or >50 knowledge entries)

If validation fails → Show helpful error message with recovery steps

---

## 🎯 Success Criteria

Report is successful when:
- ✅ Generated in <5 seconds
- ✅ All sections populated (or gracefully show "N/A")
- ✅ Visual graphs render correctly
- ✅ Recommendations are actionable
- ✅ Trends show directional indicators
- ✅ Read time ~90 seconds

---

## 📋 Agent Handoff

**After generating report:**

No automatic handoff - this is a read-only report.

User might follow up with:
- "Run validation" → health-validator.md
- "Update BRAIN" → brain-updater.md  
- "Show me [specific metric]" → knowledge-retriever.md

---

## 🔒 SOLID Compliance

**Single Responsibility:** Only generates metrics reports (no updates, no validation)

**Dependencies:**
- `brain-query.md` - For querying knowledge graph
- `file-accessor.md` - For reading BRAIN files

**No side effects:** Read-only operation, doesn't modify BRAIN

---

## 📊 Example Output

See `KDS/prompts/user/kds.md` → Search for "KDS BRAIN Performance Metrics" sample report.

---

**Version:** 1.0  
**Last Updated:** 2025-11-03  
**Status:** ✅ Active
