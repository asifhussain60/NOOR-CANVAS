# KDS Self-Learning Intelligence

**Purpose**: Automated performance analysis and rulebook improvement recommendations

**Components**:
1. Weekly Review (after 7+ Review Mode executions)
2. Monthly Health Check (30+ days of metrics)
3. Quarterly Rulebook Audit (major refactoring proposals)

---

## Weekly Review

**Trigger**: Automatically generated when `review_mode_executions >= 7` in past 7 days

**Algorithm**:
```
IF performance-trends.json.review_mode_executions >= 7 AND last_weekly_review > 7 days ago:
  Generate weekly-review-{timestamp}.md
  Analyze last 7 days of metrics
  Identify declining compliance areas
  Propose actionable improvements
```

**Report Sections**:
1. **Weekly Summary**
   - Review Mode executions this week
   - Average compliance score (vs last week)
   - Trend direction (improving/declining/stable)

2. **Most Violated Rules (Top 5)**
   - Rule ID, violation count, compliance rate
   - Common issues observed
   - Recommended fixes

3. **Friction Points**
   - User workflow obstacles detected
   - Rules that slowed productivity unnecessarily

4. **Quick Wins**
   - Low-effort, high-impact improvements
   - Priority: P0 (critical), P1 (high), P2 (medium)

5. **Action Items**
   - Specific tasks to improve compliance
   - Assigned to: kds.prompt.md governance review

---

## Monthly Health Check

**Trigger**: Automatically generated on 1st day of month if metrics exist for prior month

**Algorithm**:
```
IF CURRENT_DATE.day == 1 AND performance-trends.json has 30+ days data:
  Generate monthly-health-check-{YYYY-MM}.md
  Calculate 30-day compliance trends
  Measure rule effectiveness
  Propose rulebook adjustments
```

**Report Sections**:
1. **Monthly Metrics**
   - Total Review Mode executions
   - Average compliance score (30-day rolling)
   - Auto-fix success rate
   - Trend analysis (improving/declining/stable)

2. **Rule Effectiveness Scoring**
   - Each rule (1-21) scored on:
     - Violations prevented
     - Compliance rate
     - User friction level
     - Effectiveness: high/medium/low/unknown

3. **Compliance Trends**
   - Chart: Compliance score over time (30 days)
   - Improvement rate (% per week)
   - Declining areas (rules with <70% compliance)

4. **Recommendations**
   - Rule clarifications needed
   - New rules to add (based on patterns)
   - Rules to relax/remove (if <20% compliance for 30+ days)
   - Validation function enhancements

5. **Health Score**
   - Overall KDS health: 0-100
   - Components:
     - Average compliance (40%)
     - Trend direction (30%)
     - Rule effectiveness (20%)
     - Auto-fix success (10%)

---

## Quarterly Rulebook Audit

**Trigger**: Manually invoked or auto-generated every 90 days

**Algorithm**:
```
IF CURRENT_DATE - last_quarterly_audit >= 90 days:
  Generate quarterly-rulebook-audit-{YYYY-QN}.md
  Comprehensive rule analysis
  Propose major refactoring
  Identify rule sunset candidates
```

**Report Sections**:
1. **Quarterly Summary**
   - Total Review Mode executions (90 days)
   - Compliance score trajectory
   - Major governance changes made
   - Rules added/modified/removed

2. **Rule Sunset Analysis**
   - Rules with <20% compliance for 90+ days
   - Rationale for low compliance
   - Recommendation: Relax, clarify, or remove

3. **New Rule Proposals**
   - Patterns detected in violations
   - Gaps in current rulebook
   - Proposed new rules (with draft text)

4. **Major Refactoring Opportunities**
   - Prompt consolidation candidates
   - Validation function improvements
   - Architecture simplifications

5. **Strategic Recommendations**
   - Long-term governance improvements
   - Tooling investments needed
   - Documentation gaps

6. **Action Plan**
   - Prioritized list of improvements (P0, P1, P2)
   - Estimated effort per task
   - Expected impact on compliance

---

## Auto-Generation Logic

**Weekly Review**:
```powershell
# Run after each Review Mode execution
$metrics = Get-Content ".github/key-data-streams/kds/metrics/performance-trends.json" | ConvertFrom-Json

if ($metrics.review_mode_executions -ge 7) {
    $lastWeeklyReview = Get-ChildItem ".github/key-data-streams/kds/learning/weekly-review-*.md" | 
                        Sort-Object LastWriteTime -Descending | 
                        Select-Object -First 1
    
    $daysSinceLastReview = (Get-Date) - $lastWeeklyReview.LastWriteTime).Days
    
    if ($daysSinceLastReview -ge 7) {
        # Generate weekly review
        & GenerateWeeklyReview -MetricsPath $metrics
    }
}
```

**Monthly Health Check**:
```powershell
# Run on 1st day of month
if ((Get-Date).Day -eq 1) {
    $metrics = Get-Content ".github/key-data-streams/kds/metrics/performance-trends.json" | ConvertFrom-Json
    
    $dataAge = ($metrics.historical_scores | Measure-Object).Count
    
    if ($dataAge -ge 30) {
        # Generate monthly health check
        & GenerateMonthlyHealthCheck -MetricsPath $metrics -Month (Get-Date).AddMonths(-1).ToString("yyyy-MM")
    }
}
```

**Quarterly Audit**:
```powershell
# Run every 90 days or manual invocation
$lastAudit = Get-ChildItem ".github/key-data-streams/kds/learning/quarterly-rulebook-audit-*.md" | 
             Sort-Object LastWriteTime -Descending | 
             Select-Object -First 1

if (!$lastAudit -or ((Get-Date) - $lastAudit.LastWriteTime).Days -ge 90) {
    # Generate quarterly audit
    & GenerateQuarterlyAudit -StartDate (Get-Date).AddDays(-90) -EndDate (Get-Date)
}
```

---

## Integration with KDS Review Mode

**kds.prompt.md Enhancements**:

1. **After Review Mode Execution** (Step 7b):
   - Update performance-trends.json with new compliance score
   - Check weekly review trigger (7+ executions?)
   - If triggered: Generate weekly-review-{timestamp}.md
   - Display summary to user

2. **Monthly Check** (1st of month):
   - Auto-detect if monthly health check needed
   - Generate monthly-health-check-{YYYY-MM}.md
   - Email/notify stakeholders (if configured)

3. **Quarterly Audit**:
   - Manual trigger via: `@workspace /kds --quarterly-audit`
   - Or auto-trigger after 90 days since last audit

---

## Report Templates

**Weekly Review Template**:
```markdown
# KDS Weekly Review ({Start Date} - {End Date})

**Generated**: {Timestamp}  
**Review Mode Executions This Week**: {Count}

## 📊 Weekly Summary

- **Average Compliance**: {Score}/100 (vs {Last Week Score} last week)
- **Trend**: {Improving/Declining/Stable}
- **Auto-Fix Success Rate**: {Rate}%

## ⚠️ Most Violated Rules (Top 5)

1. **Rule #{ID}** ({Title}) - {Compliance Rate}% compliance
   - Violations: {Count} instances
   - Common Issue: {Description}
   - Recommendation: {Fix}

(... repeat for top 5)

## 🚧 Friction Points

- {Friction Point 1}
- {Friction Point 2}
- {Friction Point 3}

## ✅ Quick Wins

### P0 (Critical)
- {Action Item 1}

### P1 (High)
- {Action Item 2}
- {Action Item 3}

### P2 (Medium)
- {Action Item 4}

## 📋 Action Items

1. [ ] {Task 1} (Priority: P0, Est: {Hours}h)
2. [ ] {Task 2} (Priority: P1, Est: {Hours}h)
3. [ ] {Task 3} (Priority: P2, Est: {Hours}h)

---

**Next Weekly Review**: {Next Week Date}
```

**Monthly Health Check Template**:
```markdown
# KDS Monthly Health Check ({Month YYYY})

**Generated**: {Timestamp}  
**Data Period**: {Start Date} - {End Date}

## 📈 Monthly Metrics

- **Review Mode Executions**: {Count}
- **Average Compliance Score**: {Score}/100 (30-day rolling)
- **Trend**: {Improving/Declining/Stable} ({Improvement Rate}% per week)
- **Auto-Fix Success Rate**: {Rate}%

## 🎯 Rule Effectiveness (Top 10)

| Rule # | Title | Compliance | Effectiveness | Violations Prevented |
|--------|-------|------------|---------------|---------------------|
| 10     | KDS Governance | 95% | High | 15 |
| 18     | Router Exemption | 88% | High | 8 |
| ...    | ...   | ...% | ...  | ... |

## 📉 Declining Areas (< 70% Compliance)

- **Rule #{ID}** ({Title}): {Compliance Rate}%
  - Issue: {Description}
  - Recommendation: {Fix}

## 💡 Recommendations

### Rule Clarifications Needed
- {Rule} - {Clarification}

### New Rules to Consider
- **Proposed Rule #{New ID}**: {Title}
  - Rationale: {Pattern detected}
  - Draft: {Rule statement}

### Rules to Relax/Remove
- **Rule #{ID}**: {Reason for low compliance}

## 🏥 Overall Health Score: {Score}/100

**Components**:
- Average Compliance: {Score}/40
- Trend Direction: {Score}/30
- Rule Effectiveness: {Score}/20
- Auto-Fix Success: {Score}/10

---

**Next Monthly Check**: {Next Month}
```

**Quarterly Audit Template**:
```markdown
# KDS Quarterly Rulebook Audit (Q{Quarter} {Year})

**Generated**: {Timestamp}  
**Data Period**: {Start Date} - {End Date} (90 days)

## 📊 Quarterly Summary

- **Total Review Mode Executions**: {Count}
- **Average Compliance**: {Score}/100
- **Compliance Trajectory**: {Direction} ({Rate}% improvement)
- **Rules Added/Modified/Removed**: {Count}

## 🌅 Rule Sunset Analysis

### Candidates for Removal (< 20% compliance for 90+ days)

- **Rule #{ID}** ({Title}): {Compliance Rate}%
  - Low compliance reason: {Analysis}
  - Recommendation: {Remove/Relax/Clarify}

## 🆕 New Rule Proposals

1. **Rule #{New ID}**: {Proposed Title}
   - **Rationale**: {Pattern detected in violations}
   - **Draft Statement**: {Rule text}
   - **Severity**: {CRITICAL/HIGH/MEDIUM/LOW}
   - **Enforcement**: {Automated/Workflow/Manual}

## 🔧 Major Refactoring Opportunities

- **Prompt Consolidation**: {Prompts to merge}
- **Validation Enhancements**: {Functions to improve}
- **Architecture Simplifications**: {Complexity to remove}

## 📋 Strategic Action Plan

### P0 (Critical) - {Estimated Effort}h
1. [ ] {Task 1}
2. [ ] {Task 2}

### P1 (High) - {Estimated Effort}h
1. [ ] {Task 3}
2. [ ] {Task 4}

### P2 (Medium) - {Estimated Effort}h
1. [ ] {Task 5}
2. [ ] {Task 6}

**Total Estimated Effort**: {Total}h across {Phases} phases

---

**Next Quarterly Audit**: {Next Quarter}
```

---

## Maintenance

**Last Updated**: 2025-11-01  
**Owner**: KDS governance system  
**Integration**: kds.prompt.md Review Mode + Automated triggers
