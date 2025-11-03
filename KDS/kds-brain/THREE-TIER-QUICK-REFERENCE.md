# Three-Tier BRAIN Quick Reference

**Quick guide for using KDS BRAIN v6.0 (Three-Tier Architecture)**

---

## 🎯 Quick Start

### Run Your First Collection

```powershell
# From workspace root
cd "d:\PROJECTS\NOOR CANVAS"

# Run collection
.\KDS\scripts\collect-development-context.ps1
```

**Expected output:**
```
✅ Development Context Collection Complete
📊 Metrics Collected: Git activity, KDS usage, Testing
⚠️  Warnings Generated: 0-3 (depending on current state)
📁 Updated: KDS/kds-brain/development-context.yaml
```

### View Collected Data

```powershell
# View the YAML file
code KDS\kds-brain\development-context.yaml

# OR use brain-query
#file:KDS/prompts/internal/brain-query.md
query_type: proactive_warnings
severity: "all"
```

---

## 🧠 Three Tiers Explained

```
Tier 1: Conversation History (Short-Term Memory)
├─ File: conversation-history.jsonl
├─ Content: Last 20 complete conversations
├─ Purpose: Cross-chat continuity, reference resolution
└─ Status: Designed but not yet implemented

Tier 2: Knowledge Graph (Long-Term Memory)
├─ File: knowledge-graph.yaml
├─ Content: Intent patterns, file relationships, workflows
├─ Purpose: Learning from KDS interactions
└─ Status: ✅ ACTIVE

Tier 3: Development Context (Holistic Metrics)
├─ File: development-context.yaml
├─ Content: Git, code, KDS, test, health, pattern metrics
├─ Purpose: Data-driven planning, proactive warnings
└─ Status: ✅ IMPLEMENTED
```

---

## 📊 What Each Tier Provides

### Tier 1: Conversation History (Future)
```
"Make it purple" → Knows "it" = FAB button from earlier conversation
"Test that feature" → Resolves "that" = user auth from conversation #3
```

### Tier 2: Knowledge Graph (Current)
```
"Add share button" → Routes to PLAN (learned from 12 similar phrases)
Modifying HostControlPanel.razor → Warns: Often confused with HostControlPanelContent.razor
UI feature → Suggests workflow: plan → execute → test (92% success rate)
```

### Tier 3: Development Context (New!)
```
Planning feature → "Similar features took 5.4 days on average"
Modifying file → "⚠️ This file has 28% churn rate (unstable)"
Starting work → "⚠️ Velocity dropped 68% this week"
Scheduling → "Work 10am-12pm for highest success rate (94%)"
```

---

## 🔍 Query Types Reference

### Tier 2 Queries (Knowledge Graph)

```yaml
# Intent confidence
query_type: intent_confidence
phrase: "add a share button"
candidate_intents: [plan, execute]
# Returns: confidence scores for each intent

# Related files
query_type: related_files
primary_file: "HostControlPanel.razor"
# Returns: Files commonly modified together

# Correction prevention
query_type: correction_prevention
target_file: "HostControlPanel.razor"
# Returns: Warning if file often confused with another

# Workflow prediction
query_type: workflow_prediction
feature_type: "UI feature"
# Returns: Most successful workflow pattern

# Validation insights
query_type: validation_insights
check_type: "linting"
# Returns: Common failures and fixes
```

### Tier 3 Queries (Development Context)

```yaml
# Feature estimate
query_type: feature_estimate
feature_type: "UI feature"
complexity: "medium"
# Returns: Data-driven time estimate

# Proactive warnings
query_type: proactive_warnings
severity: "all"  # or "high", "medium", "low"
# Returns: Current development warnings

# Productivity pattern
query_type: productivity_pattern
scope: "weekly"
# Returns: Optimal work times and patterns

# Correlation insights
query_type: correlation_insights
focus: "all"  # or "velocity", "quality", "workflow"
# Returns: Relationships between metrics

# Hotspot analysis
query_type: hotspot_analysis
file: "HostControlPanel.razor"
# Returns: File stability and churn metrics
```

---

## 🚀 Common Workflows

### 1. Planning a New Feature

```markdown
# Step 1: Collect latest metrics
.\KDS\scripts\collect-development-context.ps1

# Step 2: Plan with KDS (it queries Tier 3 automatically)
#file:KDS/prompts/user/kds.md
I want to add user authentication

# KDS will:
- Query feature_estimate → "5.4 days based on 12 similar features"
- Query productivity_pattern → "Schedule 10am-12pm, 2pm-5pm"
- Query correlation_insights → "Use test-first (reduces rework 68%)"
- Query proactive_warnings → Surface any current issues

# Creates plan with data-driven estimates
```

### 2. Modifying a File

```markdown
# Step 1: Query for hotspot warning
#shared-module:brain-query.md
query_type: hotspot_analysis
file: "HostControlPanel.razor"

# Returns stability info:
# ⚠️ Churn rate: 28% (low stability)
# → Add extra testing

# Step 2: Proceed with caution
# Step 3: Create comprehensive tests (file is unstable)
```

### 3. Checking Project Health

```markdown
# Check for warnings
#shared-module:brain-query.md
query_type: proactive_warnings
severity: "all"

# Returns:
# ⚠️ Velocity dropped 68%
# ⚠️ Flaky test: fab-button.spec.ts

# Address warnings before starting new work
```

### 4. Optimizing Your Schedule

```markdown
# Query productivity patterns
#shared-module:brain-query.md
query_type: productivity_pattern
scope: "weekly"

# Returns:
# Most productive: 10am-12pm (94% success)
# Afternoon: 2pm-5pm (91% success)
# Evening: 6pm-12am (78% success)

# Schedule complex work in morning slots
```

---

## 📈 Interpreting Metrics

### Churn Rate
```
churn_rate = lines_changed / current_file_size

< 0.10 = High stability (good!)
0.10-0.30 = Medium stability (normal)
> 0.30 = Low stability (unstable, needs refactoring)
```

### Success Rate
```
success_rate = completed_without_rework / total_attempts

> 0.90 = Excellent (highly reliable pattern)
0.70-0.90 = Good (generally works)
< 0.70 = Needs improvement
```

### Correlation
```
-1.0 to 1.0 scale

 0.8 to 1.0 = Strong positive (use this!)
 0.5 to 0.8 = Moderate positive
-0.5 to 0.5 = Weak/no correlation
-0.8 to -0.5 = Moderate negative
-1.0 to -0.8 = Strong negative (avoid this!)
```

### Flake Rate
```
flake_rate = intermittent_failures / total_runs

< 0.05 = Stable test
0.05-0.10 = Monitor
0.10-0.20 = Needs attention (fix soon)
> 0.20 = Unstable (fix immediately or disable)
```

---

## ⚠️ Proactive Warnings Explained

### Velocity Drop
```yaml
type: "velocity_drop"
severity: "medium"
message: "Velocity dropped 68% this week"

What it means:
  - You're producing less code than usual
  - Could indicate: larger WIP, fewer KDS sessions, complexity spike
  
Action:
  - Break work into smaller commits (1-3 files)
  - Use KDS for all tasks (increases velocity 3x)
  - Check if you're blocked on something
```

### Flaky Test
```yaml
type: "flaky_test"
severity: "high"
message: "Test fab-button.spec.ts fails 15% of time"

What it means:
  - Test has intermittent failures (race condition, timing issue)
  - Blocks development when it fails unexpectedly
  
Action:
  - Investigate root cause (async issues, selectors, timing)
  - Fix or mark as unstable
  - Don't ignore (will waste time debugging later)
```

### High Churn
```yaml
type: "high_churn"
severity: "low"
message: "HostControlPanel.razor has 28% churn rate"

What it means:
  - File is frequently modified (unstable)
  - High rework probability (35%)
  
Action:
  - Add comprehensive tests before modifying
  - Consider refactoring after this change
  - Expect 1-2 days extra for potential rework
```

---

## 🔄 Update Frequency

### Automatic (Recommended)
```
Every BRAIN Update (brain-updater.md):
  1. Process events → Update Tier 2 (knowledge graph)
  2. Trigger development-context-collector.md
  3. Collect metrics → Update Tier 3 (development context)
  
Frequency: Every 50 events OR 24 hours
```

### Manual (On-Demand)
```powershell
# Quick collection (skip expensive git operations)
.\KDS\scripts\collect-development-context.ps1 -Quick

# Full collection (comprehensive metrics)
.\KDS\scripts\collect-development-context.ps1

# Force (even if recently collected)
.\KDS\scripts\collect-development-context.ps1 -Force
```

### Scheduled (Optional)
```powershell
# Windows Task Scheduler: Run every hour
schtasks /create /tn "KDS-Tier3-Hourly" `
  /tr "powershell.exe -File 'd:\PROJECTS\NOOR CANVAS\KDS\scripts\collect-development-context.ps1' -Quick" `
  /sc hourly
```

---

## 📁 File Locations

```
KDS/kds-brain/
├── development-context.yaml        # Tier 3 data
├── knowledge-graph.yaml            # Tier 2 data
├── conversation-history.jsonl      # Tier 1 data (future)
├── events.jsonl                    # Raw event stream
├── THREE-TIER-IMPLEMENTATION-SUMMARY.md
└── THREE-TIER-QUICK-REFERENCE.md (this file)

KDS/prompts/internal/
├── development-context-collector.md  # Tier 3 collector agent
├── brain-updater.md                  # Updates Tier 2 + triggers Tier 3
└── brain-query.md                    # Queries all 3 tiers

KDS/scripts/
└── collect-development-context.ps1   # PowerShell collection script
```

---

## 🎓 Best Practices

### 1. Collect Regularly
```
✅ DO: Let brain-updater trigger collection automatically
✅ DO: Run manual collection before major planning sessions
❌ DON'T: Collect too frequently (< 1 hour) - wastes time
```

### 2. Act on Warnings
```
✅ DO: Address high-severity warnings before new work
✅ DO: Monitor medium-severity warnings
❌ DON'T: Ignore flaky tests (fix or disable)
❌ DON'T: Ignore velocity drops (investigate cause)
```

### 3. Use Correlations
```
✅ DO: Write tests first (68% less rework)
✅ DO: Keep commits small (1-3 files = 94% success)
✅ DO: Use KDS for all tasks (3x velocity increase)
❌ DON'T: Skip tests to save time (costs more in rework)
```

### 4. Schedule Wisely
```
✅ DO: Schedule complex work during productive hours (10am-12pm)
✅ DO: Use afternoon for collaborative work (2pm-5pm)
❌ DON'T: Work on critical tasks during low-success times (evening)
```

### 5. Monitor Hotspots
```
✅ DO: Add extra tests for high-churn files
✅ DO: Plan refactoring for unstable files
✅ DO: Budget extra time for rework (35% probability)
❌ DON'T: Assume unstable files will be easy to modify
```

---

## 🚨 Troubleshooting

### Collection Fails
```powershell
# Check if git is available
git --version

# Check if events.jsonl exists
Test-Path "KDS\kds-brain\events.jsonl"

# Run with error details
.\KDS\scripts\collect-development-context.ps1 -Verbose
```

### No Metrics Collected
```
Possible causes:
- No commits in last 30 days (git_activity = 0)
- No KDS sessions (kds_usage = 0)
- Fresh repository

Action: Keep working, metrics accumulate over time
```

### YAML Parse Errors
```powershell
# Validate YAML syntax
Get-Content "KDS\kds-brain\development-context.yaml" | 
  ConvertFrom-Yaml

# If corrupt, restore from backup or recreate
.\KDS\scripts\collect-development-context.ps1 -Force
```

---

## 💡 Tips & Tricks

### Tip 1: Pre-Planning Check
```markdown
Before creating any plan:

#shared-module:brain-query.md
query_type: proactive_warnings
severity: "medium"

Address warnings BEFORE planning new work
```

### Tip 2: File Modification Check
```markdown
Before modifying any file:

#shared-module:brain-query.md
query_type: hotspot_analysis
file: "{target_file}"

If high churn → add extra testing
```

### Tip 3: Velocity Tracking
```markdown
Check velocity trend weekly:

#shared-module:brain-query.md
query_type: correlation_insights
focus: "velocity"

Adjust practices based on what works
```

### Tip 4: Quick Health Check
```powershell
# See current warnings
.\KDS\scripts\collect-development-context.ps1
# Read proactive_insights.current_warnings section
```

---

## 📚 Further Reading

- **Full implementation details:** `THREE-TIER-IMPLEMENTATION-SUMMARY.md`
- **Collector agent spec:** `../prompts/internal/development-context-collector.md`
- **Query reference:** `../prompts/internal/brain-query.md`
- **Master KDS doc:** `../prompts/user/kds.md`
- **Design rationale:** `../docs/architecture/KDS-HOLISTIC-REVIEW-AND-RECOMMENDATIONS.md`

---

**Quick Summary:**

```
🧠 Three-Tier BRAIN = Smart + Adaptive + Proactive

Tier 1: Conversation memory (future)
Tier 2: Learning from interactions (active)
Tier 3: Development intelligence (new!)

Collect: .\KDS\scripts\collect-development-context.ps1
Query: #shared-module:brain-query.md
Use: Automatic in planning, execution, routing

Benefits:
✓ Data-driven estimates
✓ Proactive warnings
✓ Optimal scheduling
✓ Correlation insights
✓ Continuous improvement
```
