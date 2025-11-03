# Development Context Collector

**Version:** 1.0  
**Purpose:** Collect development metrics from git, KDS events, tests, and builds to populate Tier 3 (Development Context)  
**Role:** Data collection agent for BRAIN intelligence  
**Trigger:** Hourly (automated) or on-demand via `#file:KDS/prompts/internal/development-context-collector.md`

---

## 🎯 Core Responsibility

**ONE JOB:** Gather development activity metrics and update `development-context.yaml`

**Sources:**
1. **Git repository** → Commit history, file changes, contributors
2. **KDS events** → `events.jsonl` → Session patterns, intent distribution, success rates
3. **Test results** → Playwright reports, test output → Pass rates, flaky tests
4. **Build logs** → Build time, deployment frequency, errors

---

## 📊 Collection Workflow

### Step 1: Git Activity Metrics

**Data to Collect:**
```powershell
# Run from workspace root
cd "d:\PROJECTS\NOOR CANVAS"

# Last 30 days of commits
git log --since="30 days ago" --pretty=format:"%H|%an|%ad|%s" --date=iso

# Files changed in last 30 days with stats
git log --since="30 days ago" --numstat --pretty=format:"%H"

# Active branches
git branch -a

# Current branch
git branch --show-current
```

**Calculations:**
- `total_commits`: Count of commits in last 30 days
- `commits_per_day_avg`: total_commits / 30
- `active_branches`: Branches with commits in last 30 days
- `contributors`: Unique authors in last 30 days
- `commits_by_component`: Group by path (UI/, Backend/, Tests/, Docs/)
- `files_most_changed`: Top 10 files by commit count
- `commit_patterns`: Count by conventional commit prefix (feat:, fix:, test:, docs:)

**Update:** `development-context.yaml` → `git_activity` section

---

### Step 2: Code Changes Metrics

**Data to Collect:**
```powershell
# Lines added/deleted in last 30 days
git log --since="30 days ago" --numstat --pretty=format:"" | 
    awk '{added+=$1; deleted+=$2} END {print "Added:", added, "Deleted:", deleted}'

# Weekly breakdown (4 weeks)
# Week 1: 29-22 days ago
# Week 2: 22-15 days ago
# Week 3: 15-8 days ago
# Week 4: 8-1 days ago
```

**Calculations:**
- `total_files_modified`: Unique files touched in last 30 days
- `lines_added`: Sum of all additions
- `lines_deleted`: Sum of all deletions
- `net_growth`: lines_added - lines_deleted
- `change_velocity`: Lines changed per week (trend analysis)
- `hotspots`: Files with high churn rate (changes / file size)

**Churn Rate Formula:**
```
churn_rate = total_lines_changed_in_file / current_file_size
```

**Stability Classification:**
- `high`: churn_rate < 0.10 (< 10% of file changed)
- `medium`: 0.10 <= churn_rate < 0.30
- `low`: churn_rate >= 0.30 (high instability)

**Update:** `development-context.yaml` → `code_changes` section

---

### Step 3: KDS Usage Metrics

**Data Source:** `KDS/kds-brain/events.jsonl`

**Data to Collect:**
```jsonl
# Filter events from last 30 days
{"timestamp":"2025-11-03T10:00:00Z","event":"session_started",...}
{"timestamp":"2025-11-03T10:35:00Z","event":"session_completed",...}
```

**Calculations:**
- `total_kds_invocations`: Count of `session_started` events
- `sessions_created`: Count of `session_started` events
- `sessions_completed`: Count of `session_completed` events
- `completion_rate`: sessions_completed / sessions_created
- `intent_distribution`: Count by intent type (PLAN, EXECUTE, TEST, etc.)
- `avg_session_duration`: Average time from `session_started` to `session_completed`
- `avg_tasks_per_session`: Average tasks completed per session
- `workflow_success`: Compare test-first vs test-skip success rates
- `kds_effectiveness`: Compare KDS vs manual task success

**Update:** `development-context.yaml` → `kds_usage` section

---

### Step 4: Testing Activity Metrics

**Data Sources:**
- `Tests/UI/playwright-report/` → Playwright test results
- `test-results/` → Test output files
- `KDS/kds-brain/events.jsonl` → Test creation events

**Data to Collect:**
```powershell
# Count test files
Get-ChildItem -Path "Tests" -Recurse -Filter "*.spec.ts" | Measure-Object

# Recent test runs (from playwright reports)
Get-ChildItem -Path "Tests/UI/playwright-report" -Recurse -Filter "*.json"
```

**Calculations:**
- `total_tests_created`: Count of test files created in last 30 days
- `total_test_runs`: Sum of test execution events
- `test_pass_rate`: passed / total_tests
- `test_coverage`: (from coverage reports if available)
- `test_types`: Count by type (unit, integration, ui_playwright)
- `flaky_tests`: Tests with intermittent failures

**Flaky Test Detection:**
```
flake_rate = failures / total_runs
If flake_rate > 0.10 and flake_rate < 0.90 → flaky
```

**Update:** `development-context.yaml` → `testing_activity` section

---

### Step 5: Project Health Metrics

**Data Sources:**
- Build output → `dotnet build` exit codes
- Deployment logs → Manual tracking or CI/CD logs
- Issue tracker → GitHub issues API (if available)
- Linting results → Roslynator output

**Data to Collect:**
```powershell
# Build status
dotnet build --no-restore 2>&1

# Last successful build
Get-ChildItem -Path "SPA/NoorCanvas/bin" -Directory | 
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

**Calculations:**
- `build_status`: passing/failing based on last build
- `last_build`: Timestamp of last build
- `build_time_avg`: Average build duration
- `deployment_frequency`: Count deployments in last 30 days
- `issue_tracking`: Open vs closed issues
- `code_quality`: Linting pass rate from Roslynator

**Update:** `development-context.yaml` → `project_health` section

---

### Step 6: Work Patterns Analysis

**Data Source:** `KDS/kds-brain/events.jsonl` + Git commit timestamps

**Calculations:**
- `most_productive_time`: Time ranges with most commits/sessions
- `avg_coding_hours_per_day`: Total session time / 30 days
- `session_patterns`: Distribution by time of day (morning/afternoon/evening)
- `focus_duration`: Average time between context switches
- `feature_lifecycle`: Days from first commit to deployment

**Time Classification:**
- Morning: 06:00-12:00
- Afternoon: 12:00-18:00
- Evening: 18:00-00:00

**Update:** `development-context.yaml` → `work_patterns` section

---

### Step 7: Correlations Discovery

**Analyze relationships between metrics:**

**Commit Size vs Success:**
```python
small_commits = [commits with 1-3 files]
large_commits = [commits with 10+ files]

small_success = count(small_commits without revert) / count(small_commits)
large_success = count(large_commits without revert) / count(large_commits)
```

**Test-First vs Rework:**
```python
# From KDS events
test_first_sessions = [sessions with test phase before execute]
test_skip_sessions = [sessions without test phase]

test_first_rework = count(test_first_sessions with correction) / count(test_first_sessions)
test_skip_rework = count(test_skip_sessions with correction) / count(test_skip_sessions)
```

**KDS Usage vs Velocity:**
```python
# By week
weekly_kds_usage = [kds invocations per week]
weekly_velocity = [lines changed per week]

correlation = pearson_correlation(weekly_kds_usage, weekly_velocity)
```

**Update:** `development-context.yaml` → `correlations` section

---

### Step 8: Proactive Insights Generation

**Generate warnings and recommendations based on metrics:**

**Velocity Drop Detection:**
```python
if current_week_velocity < avg_velocity * 0.5:
    warning = {
        "type": "velocity_drop",
        "severity": "medium",
        "message": f"Velocity dropped {drop_percent}% this week",
        "detected_at": now(),
        "suggestion": "Consider breaking work into smaller commits or increasing KDS usage"
    }
```

**High Churn Warning:**
```python
for file in hotspots:
    if file.churn_rate > 0.3:
        warning = {
            "type": "high_churn",
            "severity": "low",
            "message": f"{file.path} has high churn rate ({file.churn_rate})",
            "suggestion": "Consider refactoring this file to improve stability"
        }
```

**Test Flake Alert:**
```python
for test in flaky_tests:
    if test.flake_rate > 0.15:
        warning = {
            "type": "flaky_test",
            "severity": "high",
            "message": f"{test.name} fails {test.flake_rate*100}% of time",
            "suggestion": "Investigate and fix or mark as unstable"
        }
```

**Update:** `development-context.yaml` → `proactive_insights` section

---

## 🔄 Execution Flow

**When invoked:**

```
Step 1: Load development-context.yaml
    ↓
Step 2: Collect Git metrics
    → Parse git log output
    → Calculate commit stats
    → Identify hotspots
    ↓
Step 3: Collect Code change metrics
    → Analyze numstat data
    → Calculate velocity trend
    → Compute churn rates
    ↓
Step 4: Collect KDS usage metrics
    → Parse events.jsonl
    → Group by session
    → Calculate success rates
    ↓
Step 5: Collect Testing metrics
    → Count test files
    → Parse test reports
    → Detect flaky tests
    ↓
Step 6: Collect Project health metrics
    → Check build status
    → Count deployments
    → Analyze quality metrics
    ↓
Step 7: Analyze Work patterns
    → Extract time patterns
    → Calculate focus duration
    → Identify productive times
    ↓
Step 8: Discover Correlations
    → Compute relationships
    → Generate insights
    ↓
Step 9: Generate Proactive insights
    → Detect anomalies
    → Create warnings
    → Suggest improvements
    ↓
Step 10: Update development-context.yaml
    → Write all metrics
    → Update timestamps
    → Increment version
    ↓
Step 11: Log collection event
    → Append to events.jsonl
    → Record metrics count
    ↓
Done ✅
```

---

## 📝 Output Format

**Log event to `events.jsonl`:**
```jsonl
{
  "timestamp": "2025-11-03T15:00:00Z",
  "event": "development_context_collected",
  "metrics_collected": 47,
  "warnings_generated": 2,
  "sources": ["git", "kds-events", "test-results", "build-logs"],
  "duration_ms": 1250,
  "success": true
}
```

**Console output:**
```
✅ Development Context Collection Complete

📊 Metrics Collected:
   - Git Activity: 15 commits, 3 contributors
   - Code Changes: 1,450 lines added, 890 deleted
   - KDS Usage: 23 sessions, 91% completion rate
   - Testing: 28 tests created, 88% pass rate
   - Project Health: Build passing, 0 vulnerabilities
   - Work Patterns: Most productive 10am-12pm, 2pm-5pm

⚠️  Warnings Generated:
   1. Velocity dropped 68% this week (medium)
   2. Test 'fab-button.spec.ts' has 15% flake rate (high)

📁 Updated: KDS/kds-brain/development-context.yaml
⏱️  Duration: 1.25 seconds
```

---

## 🛠️ Implementation Notes

### PowerShell Integration

**Call from PowerShell script:**
```powershell
# KDS/scripts/collect-development-context.ps1

Write-Host "🧠 Collecting Development Context..." -ForegroundColor Cyan

# This would be implemented as a PowerShell script that:
# 1. Runs git commands
# 2. Parses events.jsonl
# 3. Analyzes test results
# 4. Updates development-context.yaml

# For now, invoke via Copilot
#file:KDS/prompts/internal/development-context-collector.md
```

### Automation

**Scheduled collection (optional):**
```powershell
# Windows Task Scheduler or cron job
# Every hour: Run collect-development-context.ps1
```

**Manual collection:**
```markdown
#file:KDS/prompts/internal/development-context-collector.md
```

---

## ✅ Success Criteria

**Collection successful if:**
- ✅ All 7 metric sections updated
- ✅ Timestamps current (within last hour)
- ✅ No negative numbers or invalid data
- ✅ At least 1 proactive insight generated (if data exists)
- ✅ Event logged to events.jsonl
- ✅ development-context.yaml is valid YAML

**Partial collection acceptable:**
- ⚠️ Some git data missing (if no commits in last 30 days)
- ⚠️ Test metrics unavailable (if no tests run recently)
- ⚠️ Build status unknown (if build never run)

---

## 🚨 Error Handling

**If git command fails:**
```
⚠️ Warning: Git metrics unavailable
   → Set git_activity.last_updated = null
   → Continue with other metrics
```

**If events.jsonl is empty:**
```
⚠️ Warning: No KDS usage data
   → Set kds_usage metrics to 0
   → Mark last_updated = null
```

**If development-context.yaml is corrupt:**
```
❌ Error: Cannot parse development-context.yaml
   → Restore from backup (development-context.yaml.bak)
   → If no backup, recreate from template
```

---

## 📊 Metric Definitions

### Churn Rate
```
churn_rate = total_lines_changed / current_file_size

Example:
File: HostControlPanel.razor (1,200 lines)
Changes: 340 lines added/deleted
Churn rate: 340 / 1,200 = 0.28 (28%)
Classification: Low stability (high churn)
```

### Correlation Coefficient
```
Pearson correlation: -1.0 to 1.0
  1.0  = Perfect positive correlation
  0.5  = Moderate positive correlation
  0.0  = No correlation
 -0.5  = Moderate negative correlation
 -1.0  = Perfect negative correlation
```

### Flake Rate
```
flake_rate = intermittent_failures / total_runs

Example:
Test: fab-button.spec.ts
Runs: 20
Failures: 3 (non-consecutive)
Flake rate: 3 / 20 = 0.15 (15%)
Status: needs_attention (threshold > 10%)
```

---

## 🎓 Usage Examples

### Example 1: Hourly Automated Collection

**Trigger:** Windows Task Scheduler runs script every hour

```powershell
# Automated task
.\KDS\scripts\collect-development-context.ps1
```

**Output:**
```
✅ Development Context Collection Complete
📊 47 metrics collected
⚠️  2 warnings generated
```

### Example 2: Manual Collection Before Planning

**User wants to plan new feature:**
```markdown
#file:KDS/prompts/user/kds.md
Collect latest development context, then plan user authentication feature
```

**KDS Process:**
```
1. Routes to development-context-collector.md
2. Collects fresh metrics
3. Updates development-context.yaml
4. Routes to work-planner.md
5. Planner queries Tier 3 for insights
6. Creates plan with data-driven estimates
```

### Example 3: Check Warnings

**User wants to see current state:**
```markdown
#file:KDS/prompts/internal/development-context-collector.md
Show current warnings only
```

**Output:**
```
⚠️  Current Warnings (2):

1. Velocity Drop (Medium Severity)
   Detected: 2025-11-03T14:00:00Z
   Message: Velocity dropped 68% this week
   Suggestion: Break work into smaller commits or increase KDS usage

2. Flaky Test (High Severity)
   Detected: 2025-11-03T10:30:00Z
   Message: fab-button.spec.ts fails 15% of time
   Suggestion: Investigate and fix or mark as unstable
```

---

## 🔗 Integration with Other Agents

**Work Planner queries Tier 3:**
```markdown
# work-planner.md

BEFORE creating plan:
  1. Load development-context.yaml
  2. Check current warnings
  3. Query avg_days_from_start_to_deploy for estimates
  4. Use most_productive_time for scheduling
  5. Incorporate correlations (e.g., test-first success rate)
```

**Intent Router uses Tier 3:**
```markdown
# intent-router.md

BEFORE routing:
  1. Load development-context.yaml
  2. Check files_most_changed for hotspot warnings
  3. Use workflow_success rates for recommendations
  4. Surface proactive insights to user
```

**Brain Query accesses Tier 3:**
```markdown
# brain-query.md

User: "What's my average feature completion time?"
Query: development-context.yaml → work_patterns.feature_lifecycle.avg_days_from_start_to_deploy
Response: "Your features typically take 5.4 days from start to deploy"
```

---

## 📚 Summary

**Development Context Collector = Data gathering agent for BRAIN Tier 3**

**Responsibilities:**
1. ✅ Collect git activity metrics
2. ✅ Analyze code change patterns
3. ✅ Track KDS usage statistics
4. ✅ Monitor testing activity
5. ✅ Assess project health
6. ✅ Identify work patterns
7. ✅ Discover correlations
8. ✅ Generate proactive insights

**Output:** Updated `development-context.yaml` with fresh metrics

**Frequency:** Hourly (automated) or on-demand

**Integration:** Used by work-planner, intent-router, brain-query for intelligent decisions

**Value:** Enables data-driven planning, proactive warnings, and continuous improvement
