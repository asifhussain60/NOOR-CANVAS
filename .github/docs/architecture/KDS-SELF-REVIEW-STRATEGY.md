# KDS Self-Review Strategy

**Version:** 1.0  
**Created:** 2025-11-02  
**Purpose:** Enable KDS to track its own performance and continuously improve  
**Philosophy:** Extend existing mechanisms (Rule #16, publish system) instead of creating new prompts

---

## 🎯 Core Philosophy

**DO NOT create `kds-self-review.md` prompt** - This would violate:
- Rule #10 (Single Source of Truth) - duplicates Rule #16 Step 5
- Rule #17 (Challenge Requests) - existing mechanism already handles this

**INSTEAD:** Enhance existing infrastructure to provide self-review capabilities automatically.

---

## 📊 Three-Pillar Strategy

### Pillar 1: Violation Tracking (Enhance Rule #16 Step 5)

**Current State:**
- Rule #16 Step 5 runs KDS verification after every task
- Checks: redundancy, conflicts, performance, consistency
- Results displayed but not tracked over time

**Enhancement:**
```json
// .github/sessions/current-session.json (ENHANCED)
{
  "sessionId": "2025-11-02-fab-button",
  "kds_health_tracking": {
    "violations_log": [
      {
        "timestamp": "2025-11-02T10:30:00Z",
        "task_id": "task-1.2",
        "violation_type": "redundancy",
        "severity": "LOW",
        "details": "Duplicate logic found in work-planner.md and code-executor.md",
        "auto_fixed": true,
        "resolution": "Extracted to prompts/shared/validation.md"
      },
      {
        "timestamp": "2025-11-02T11:45:00Z",
        "task_id": "task-2.1",
        "violation_type": "performance",
        "severity": "MEDIUM",
        "details": "Rule count at 18/20 (soft limit exceeded)",
        "auto_fixed": false,
        "resolution": "Manual consolidation required"
      }
    ],
    "metrics_history": [
      {
        "timestamp": "2025-11-02T10:30:00Z",
        "rule_count": 16,
        "prompt_count": 13,
        "total_files": 68,
        "redundancy_score": 0.95,  // 1.0 = perfect (no duplicates)
        "consistency_score": 1.0    // 1.0 = perfect (all rules followed)
      },
      {
        "timestamp": "2025-11-02T11:45:00Z",
        "rule_count": 18,
        "prompt_count": 14,
        "total_files": 72,
        "redundancy_score": 0.92,
        "consistency_score": 0.98
      }
    ]
  }
}
```

**Implementation:**
- Rule #16 Step 5 logs violations to `current-session.json`
- Tracks metrics over time (rule count, file count, redundancy score)
- Auto-generates improvement recommendations
- Archives to `session-history.json` when session completes

---

### Pillar 2: Performance Publishing (Extend Publish System)

**New Category:**
```json
// prompts/shared/publish.md (ENHANCED)
{
  "categories": {
    "test-patterns": {...},
    "test-data": {...},
    "ui-mappings": {...},
    "workflows": {...},
    "kds-performance": {  // NEW
      "location": "knowledge/kds-performance/",
      "purpose": "Track KDS self-review metrics and improvements over time",
      "examples": [
        "weekly-health-report-2025-11-02.md",
        "monthly-performance-2025-11.md",
        "violation-trend-analysis.md"
      ]
    }
  }
}
```

**Auto-Published Reports:**

#### Weekly Report (Auto-Generated Friday EOD)
```markdown
# KDS Weekly Health Report - 2025-11-02

**Period:** 2025-10-27 to 2025-11-02  
**Sessions:** 3 (fab-button, dark-mode, pdf-export)  
**Total Tasks:** 24  
**KDS Health Score:** 92/100 ✅

---

## 📊 Metrics Summary

### Rule Governance
- **Rule Count:** 16/20 (80% capacity) ✅
- **Prompt Count:** 13/15 (87% capacity) ⚠️
- **Total Files:** 68/80 (85% capacity) ⚠️
- **Trend:** Stable (0 new rules, +1 prompt, +3 files)

### Code Quality
- **Redundancy Score:** 0.95/1.00 ✅ (5% duplication detected)
- **Consistency Score:** 0.98/1.00 ✅ (98% rule compliance)
- **Conflicts:** 0 ✅
- **Trend:** Improving (+0.02 from last week)

### Pattern Effectiveness
- **Patterns Published:** 4 (2 test-patterns, 1 ui-mapping, 1 workflow)
- **Patterns Reused:** 12 instances (avg 3 reuses per pattern)
- **Success Rate:** 88% (7/8 patterns worked first try)
- **Auto-Rejected:** 1 (duplicate >85% similarity)

### Violations Detected
- **Total:** 3 violations
- **Auto-Fixed:** 2 (redundancy extraction)
- **Manual Required:** 1 (performance - approaching soft limit)
- **Severity:** 2 LOW, 1 MEDIUM

---

## 🔍 Violation Details

### 1. Redundancy - Duplicate Validation Logic (AUTO-FIXED)
- **Detected:** 2025-11-02 10:30
- **Location:** work-planner.md, code-executor.md
- **Duplicate Lines:** 12 lines identical (session validation)
- **Resolution:** Extracted to prompts/shared/validation.md
- **Severity:** LOW

### 2. Redundancy - Similar Test Setup (AUTO-FIXED)
- **Detected:** 2025-11-02 11:15
- **Location:** test-generator.md, health-validator.md
- **Duplicate Lines:** 8 lines (Playwright config)
- **Resolution:** Moved to shared/test-first.md
- **Severity:** LOW

### 3. Performance - Approaching Prompt Limit (MANUAL)
- **Detected:** 2025-11-02 11:45
- **Current:** 13/15 prompts (87% capacity)
- **Trigger:** Soft limit at 14, hard limit at 15
- **Recommendation:** Consolidate or deprecate underused prompts
- **Severity:** MEDIUM
- **Action Required:** Review prompt usage, identify consolidation candidates

---

## 📈 Trend Analysis

### Week-over-Week Comparison
| Metric | Last Week | This Week | Change |
|--------|-----------|-----------|--------|
| Rule Count | 16 | 16 | 0 ✅ |
| Prompt Count | 12 | 13 | +1 ⚠️ |
| File Count | 65 | 68 | +3 ⚠️ |
| Redundancy | 0.93 | 0.95 | +0.02 ✅ |
| Consistency | 0.96 | 0.98 | +0.02 ✅ |

### Observations
- ✅ **Redundancy improving** - Auto-extraction to shared/ working well
- ✅ **Consistency improving** - Rule #16 enforcement effective
- ⚠️ **Prompt count increasing** - May need consolidation next month
- ⚠️ **File count growing** - Within limits but monitor

---

## 💡 Recommendations

### High Priority
1. **Review prompt usage analytics** - Identify underused prompts for consolidation
2. **Monitor file growth** - Approaching 80% capacity, consider doc cleanup

### Medium Priority
3. **Consolidate test patterns** - 3 similar patterns detected (>60% similarity)
4. **Update documentation** - 2 stale docs in knowledge/update-requests/

### Low Priority
5. **Optimize session state** - Consider pruning old metrics (keep last 30 days)

---

## 🎯 Next Week Goals

- Keep rule count ≤16
- Consolidate 1-2 prompts to stay under 15
- Maintain redundancy score >0.93
- Achieve 100% consistency (fix 2% violations)

---

**Published By:** Rule #16 Step 5 (automatic)  
**Next Report:** 2025-11-09
```

#### Monthly Report (Auto-Generated End of Month)
```markdown
# KDS Monthly Performance - November 2025

**Period:** 2025-11-01 to 2025-11-30  
**Sessions:** 12  
**Total Tasks:** 98  
**KDS Health Score:** 89/100 ✅

---

## 📊 Monthly Summary

### Governance Metrics
- **Avg Rule Count:** 16.2/20 (81% capacity)
- **Avg Prompt Count:** 13.5/15 (90% capacity) ⚠️
- **Avg File Count:** 70/80 (88% capacity) ⚠️
- **Peak Capacity:** Week 3 (14 prompts, 74 files)

### Quality Metrics
- **Avg Redundancy Score:** 0.94/1.00 ✅
- **Avg Consistency Score:** 0.97/1.00 ✅
- **Total Violations:** 12 (10 auto-fixed, 2 manual)
- **Violation Trend:** Decreasing (15 in Oct → 12 in Nov)

### Pattern Effectiveness
- **Patterns Published:** 18
- **Patterns Reused:** 52 instances
- **Avg Reuse Per Pattern:** 2.9 reuses
- **Success Rate:** 85% (patterns work first try)
- **Auto-Rejected Duplicates:** 4
- **Consolidated Patterns:** 3

### Session Continuity
- **Avg Session Length:** 8.2 tasks
- **Resume Success Rate:** 100% (all sessions resumed successfully)
- **Cross-Chat Transitions:** 24 (avg 2 per session)

---

## 🔍 Top Violations

1. **Redundancy** - 7 occurrences (58% of violations)
   - All auto-fixed via extraction to shared/
   - Trend: Decreasing (10 in Oct)

2. **Performance** - 3 occurrences (25%)
   - 2 prompt limit warnings
   - 1 file limit warning
   - Manual consolidation performed

3. **Consistency** - 2 occurrences (17%)
   - Missing validation in 2 internal prompts
   - Fixed via Rule #1 enforcement

---

## 📈 Trend Analysis (3-Month View)

| Metric | Sep | Oct | Nov | Trend |
|--------|-----|-----|-----|-------|
| Health Score | 85 | 87 | 89 | ↗️ Improving |
| Violations | 18 | 15 | 12 | ↗️ Improving |
| Redundancy | 0.90 | 0.92 | 0.94 | ↗️ Improving |
| Consistency | 0.94 | 0.96 | 0.97 | ↗️ Improving |

### Insights
- ✅ **Overall improvement** - Health score up 4 points in 3 months
- ✅ **Fewer violations** - Auto-fixing working effectively
- ⚠️ **Capacity pressure** - Prompt/file counts growing slowly but steadily

---

## 💡 Strategic Recommendations

### Architecture
1. **Consolidate prompts** - Consider merging `correct.md` into `execute.md` (similar functionality)
2. **Pattern consolidation** - Merge 3 similar test patterns into comprehensive guide

### Process
3. **Stricter deduplication** - Lower similarity threshold from 85% to 80%
4. **Proactive archival** - Reduce sunset policy from 90 days to 60 days

### Tooling
5. **Automated consolidation** - Build tool to suggest prompt merges
6. **Usage analytics** - Track which prompts are rarely used

---

## 🎯 December Goals

- Maintain health score ≥88
- Reduce prompt count to ≤12 (consolidate 2 prompts)
- Achieve redundancy score ≥0.95
- Zero manual violations (100% auto-fix rate)

---

**Published By:** Rule #16 Step 5 (automatic)  
**Next Report:** 2025-12-31
```

---

### Pillar 3: Historical Trend Analysis

**Git-Based Metrics:**
```bash
# .github/scripts/kds-metrics.ps1
# Track KDS health over time using git history

param(
    [int]$DaysBack = 90
)

# Extract metrics from git history
$commits = git log --since="$DaysBack days ago" --pretty=format:"%H|%ai|%s" -- .github/

# Parse commit messages for KDS changes
$metrics = @()
foreach ($commit in $commits) {
    $hash, $date, $message = $commit -split '\|'
    
    # Count rules, prompts, files at each commit
    git checkout $hash -q
    $ruleCount = (Select-String -Path .github/governance/rules.md -Pattern "^## RULE #").Count
    $promptCount = (Get-ChildItem .github/prompts -Recurse -Filter *.md).Count
    $fileCount = (Get-ChildItem .github -Recurse -File).Count
    
    $metrics += [PSCustomObject]@{
        Date = $date
        RuleCount = $ruleCount
        PromptCount = $promptCount
        FileCount = $fileCount
        Message = $message
    }
}

# Return to current commit
git checkout - -q

# Generate trend chart (ASCII art)
$metrics | Format-Table -AutoSize

# Export to JSON for publishing
$metrics | ConvertTo-Json | Out-File .github/knowledge/kds-performance/historical-metrics.json
```

**Output Example:**
```
Date                RuleCount PromptCount FileCount Message
----                --------- ----------- --------- -------
2025-11-02 10:30    16        13          68        feat: Add universal entry point (kds.md)
2025-10-28 14:15    16        12          65        refactor: Extract validation to shared/
2025-10-25 09:00    15        12          64        feat: Add challenge authority (Rule #17)
2025-10-20 11:30    15        12          62        docs: Update KDS-DESIGN.md
...
```

---

## 🚀 Automatic Execution Flow

### When KDS Self-Review Runs

**Trigger Points:**
1. **After EVERY task** - Rule #16 Step 5 logs violations and metrics
2. **Weekly** - Friday EOD, auto-publish weekly report
3. **Monthly** - Last day of month, auto-publish monthly report
4. **On-Demand** - User runs `@workspace /validate` (uses health-validator.md)

**Execution Flow:**
```
Task Complete
    ↓
Rule #16 Step 5: KDS Verification
    ↓
Detect violations (redundancy, conflicts, performance, consistency)
    ↓
Auto-fix if possible (extract to shared/, update docs)
    ↓
Log violations to current-session.json
    ↓
Update metrics_history (rule count, file count, scores)
    ↓
Check if weekly/monthly report due
    ↓
IF report due:
    Generate report from session history
    Publish to knowledge/kds-performance/
    ↓
Return to user with summary
```

---

## 📊 Integration with Existing Rules

### Rule #16 Step 5 Enhancement

**Before (Current):**
```python
def execute_mandatory_post_task(task_result):
    # ... existing steps ...
    
    # STEP 5: KDS Verification
    verification = {
        'redundancy': check_redundancy(),
        'conflicts': check_conflicts(),
        'performance': check_performance(),
        'consistency': check_consistency()
    }
    
    # Display results
    return SUCCESS(verification)
```

**After (Enhanced):**
```python
def execute_mandatory_post_task(task_result):
    # ... existing steps ...
    
    # STEP 5: KDS Verification (ENHANCED)
    verification = {
        'redundancy': check_redundancy(),
        'conflicts': check_conflicts(),
        'performance': check_performance(),
        'consistency': check_consistency()
    }
    
    # NEW: Log violations to session state
    log_violations_to_session(verification)
    
    # NEW: Update metrics history
    update_metrics_history(verification)
    
    # NEW: Check if report due
    if is_weekly_report_due():
        generate_and_publish_weekly_report()
    
    if is_monthly_report_due():
        generate_and_publish_monthly_report()
    
    # Display results with historical context
    return SUCCESS(verification)
```

### Publish System Enhancement

**Add to `prompts/shared/publish.md`:**
```yaml
kds_performance:
  location: knowledge/kds-performance/
  purpose: Track KDS self-review metrics and improvements
  auto_publish_triggers:
    - Weekly report (Friday EOD)
    - Monthly report (End of month)
    - Violation threshold exceeded
  
  format: |
    # KDS {Report Type} - {Date}
    
    **Period:** {start} to {end}
    **KDS Health Score:** {score}/100
    
    ## Metrics Summary
    {metrics_table}
    
    ## Violations Detected
    {violations_list}
    
    ## Trend Analysis
    {trends_chart}
    
    ## Recommendations
    {improvement_suggestions}
```

---

## 🎯 Benefits of This Approach

### Architectural Benefits
- ✅ **No duplication** - Uses existing Rule #16 Step 5
- ✅ **Fully automated** - Runs without user intervention
- ✅ **Extensible** - Leverages publish system's guardrails
- ✅ **Git-based history** - Follows "Delete Over Archive" principle

### Operational Benefits
- ✅ **Continuous monitoring** - Tracks every task execution
- ✅ **Trend analysis** - Historical metrics via git + session state
- ✅ **Proactive alerts** - Warns before hitting hard limits
- ✅ **Self-improvement** - Recommends consolidations, cleanup

### Design Consistency
- ✅ **Follows Rule #10** - No new prompts (single source of truth)
- ✅ **Follows Rule #17** - Challenges duplication automatically
- ✅ **Follows Rule #14** - Uses publish mechanism correctly
- ✅ **Follows Rule #2** - Updates KDS-DESIGN.md automatically

---

## 🚫 What NOT to Do

### ❌ Do NOT Create `kds-self-review.md` Prompt

**Why?**
- Violates Rule #10 (duplication of Rule #16 Step 5)
- Violates Rule #17 (should challenge this request)
- Adds complexity without benefit
- Existing mechanism already handles this

### ❌ Do NOT Create Manual Review Process

**Why?**
- Violates automation principles
- Rule #16 already runs automatically
- Manual processes get forgotten

### ❌ Do NOT Use Status Flags in Files

**Why?**
- Violates git-based tracking principle
- Git history is source of truth
- Status flags become stale

---

## 📝 Implementation Checklist

### Phase 1: Enhance Session State (Week 1)
- [ ] Add `kds_health_tracking` object to `current-session.json`
- [ ] Add `violations_log` array
- [ ] Add `metrics_history` array
- [ ] Update Rule #16 Step 5 to log violations
- [ ] Test violation logging

### Phase 2: Extend Publish System (Week 2)
- [ ] Add `kds-performance` category to `publish.md`
- [ ] Create `knowledge/kds-performance/` folder
- [ ] Create weekly report template
- [ ] Create monthly report template
- [ ] Test auto-publishing

### Phase 3: Historical Analysis (Week 3)
- [ ] Create `kds-metrics.ps1` script
- [ ] Test git history extraction
- [ ] Generate trend charts
- [ ] Integrate with weekly/monthly reports

### Phase 4: Validation & Docs (Week 4)
- [ ] Update `KDS-DESIGN.md` with self-review strategy
- [ ] Update `governance/rules.md` with enhanced Rule #16
- [ ] Test end-to-end workflow
- [ ] Document usage in README.md

---

## 🎓 Usage Examples

### View Current KDS Health
```markdown
@workspace #file:.github/prompts/user/validate.md

Validation Scope: full
```

**Output:**
```
🏥 HEALTH CHECK COMPLETE

Status: ✅ HEALTHY

KDS Metrics:
  ✅ Rule Count: 16/20 (80%)
  ⚠️ Prompt Count: 13/15 (87%)
  ✅ Redundancy: 0.95/1.00
  ✅ Consistency: 0.98/1.00

Recent Violations (Last 7 Days):
  - 2 redundancy (auto-fixed)
  - 1 performance warning (manual action needed)

Trend: ↗️ Improving (health score +2 from last week)

Next Report: Weekly report on 2025-11-08
```

### View Historical Trends
```markdown
@workspace Read knowledge/kds-performance/weekly-health-report-2025-11-02.md
```

### Trigger Manual Metrics Collection
```powershell
# Run from terminal
.github/scripts/kds-metrics.ps1 -DaysBack 90
```

---

## 🔄 Continuous Improvement Loop

```
1. Task Execution
       ↓
2. Rule #16 Step 5 (KDS Verification)
       ↓
3. Detect Violations → Auto-Fix if possible
       ↓
4. Log to Session State
       ↓
5. Update Metrics History
       ↓
6. Generate Reports (weekly/monthly)
       ↓
7. Publish to knowledge/kds-performance/
       ↓
8. Review Recommendations
       ↓
9. Implement Improvements
       ↓
10. Return to Step 1
```

---

## 📈 Success Metrics

**KDS is improving when:**
- ✅ Health score trending upward (>85)
- ✅ Violations decreasing over time
- ✅ Redundancy score increasing (>0.95)
- ✅ Consistency score increasing (>0.98)
- ✅ Auto-fix rate increasing (>90%)
- ✅ Manual interventions decreasing
- ✅ Rule count stable or decreasing
- ✅ Prompt count stable or decreasing

---

## 🎯 Summary

**Instead of creating a new `kds-self-review.md` prompt:**

1. **Enhance Rule #16 Step 5** with violation tracking and metrics history
2. **Extend publish system** with `kds-performance` category for automated reporting
3. **Use git history** for long-term trend analysis
4. **Automate everything** - No manual processes, no user reminders needed

**This approach:**
- ✅ Follows all existing KDS rules
- ✅ Uses existing infrastructure
- ✅ Provides comprehensive self-review capabilities
- ✅ Maintains design consistency
- ✅ Enables continuous improvement

---

**Last Updated:** 2025-11-02  
**Version:** 1.0  
**Status:** PROPOSED (awaiting implementation)
