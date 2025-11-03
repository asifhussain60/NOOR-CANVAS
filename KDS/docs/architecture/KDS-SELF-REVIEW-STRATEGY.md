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

## � Critical KDS BRAIN Violations (MUST CHECK)

**As of 2025-11-03, these violations prevent automatic learning:**

### Violation 1: Event Logging ❌ CRITICAL

**Expected Behavior:**
- All agent actions MUST log events to `KDS/kds-brain/events.jsonl`
- Events follow standard format: `{"timestamp":"ISO8601","event":"event_type",...}`
- Common events: `intent_detected`, `file_modified`, `task_completed`, `correction`, etc.

**Detection Criteria:**
```
✅ COMPLIANT if:
   - events.jsonl exists in KDS/kds-brain/
   - New events appended after each agent action
   - Events contain session_id, timestamp, event type
   
❌ VIOLATED if:
   - events.jsonl missing or empty
   - No new events after agent actions
   - Event format incorrect or incomplete
```

**Impact if Violated:**
- 🚫 BRAIN cannot learn from interactions
- 🚫 Knowledge graph remains stale
- 🚫 Routing decisions don't improve over time
- 🚫 Pattern recognition disabled

**How to Fix:**
1. Verify `KDS/kds-brain/events.jsonl` exists
2. Check last event timestamp is recent
3. Review agent prompts for event logging code
4. Add missing event logging to non-compliant agents

---

### Violation 2: Conversation Memory System ❌ CRITICAL (NEW)

**Expected Behavior:**
- Conversation history tracks last 20 complete conversations
- Messages appended to active conversation with entity extraction
- FIFO deletion when conversation #21 starts (oldest removed)
- Boundary detection separates conversations automatically
- Patterns extracted before deletion, consolidated to long-term memory

**Detection Criteria:**
```
✅ COMPLIANT if:
   - conversation-history.jsonl exists in KDS/kds-brain/
   - Active conversation marked with "active": true
   - Messages contain extracted entities and context references
   - FIFO queue maintains exactly 20 conversations (or fewer if < 20 total)
   - Boundary detection working (new conversations created appropriately)
   - Pronoun resolution working ("it", "that" resolve to correct entities)
   
❌ VIOLATED if:
   - conversation-history.jsonl missing or empty
   - No active conversation (all conversations marked ended)
   - Messages missing entity extraction
   - More than 20 conversations stored (FIFO not working)
   - Fewer than expected conversations (premature deletion)
   - Boundary detection failing (all messages in one conversation OR new conversation every message)
   - Pronoun resolution failing (unable to resolve "it", "that")
```

**Impact if Violated:**
- 🚫 No conversation context (users must repeat themselves)
- 🚫 Pronoun resolution broken ("Make it purple" → "What should be purple?")
- 🚫 Storage bloat (if FIFO not working, file grows indefinitely)
- 🚫 Poor UX (arbitrary conversation boundaries)
- 🚫 No pattern learning (deleted conversations not mined for patterns)

**Health Metrics to Track:**
```json
{
  "conversation_memory_health": {
    "total_conversations": 12,
    "active_conversation": {
      "id": "conv-004",
      "title": "KDS Enhancement",
      "message_count": 4,
      "started": "2025-11-03T14:20:00Z",
      "duration_hours": 2.5,
      "entities_discussed": ["conversation memory", "FIFO queue"]
    },
    "last_boundary_detection": "2025-11-03T14:20:00Z",
    "boundary_accuracy": 0.92,
    "pronoun_resolution_accuracy": 0.89,
    "fifo_deletions_today": 2,
    "avg_conversation_length": 12.3,
    "storage_size_kb": 85,
    "patterns_extracted_today": 8,
    "violations": []
  }
}
```

**How to Fix:**
1. **Missing File:** Create `KDS/kds-brain/conversation-history.jsonl`
2. **No Active Conversation:** Mark most recent conversation as `"active": true`
3. **Missing Entity Extraction:** Update Intent Router to extract entities
4. **FIFO Not Working:** Implement deletion logic (delete conversation #1 when #21 starts)
5. **Boundary Detection Failing:** Review algorithm, adjust confidence thresholds
6. **Pronoun Resolution Failing:** Verify entity extraction, implement fallback clarification
7. **Patterns Not Extracted:** Implement consolidation hook before FIFO deletion

**Validation Tests:**
```python
def test_conversation_memory_health():
    history = load_conversation_history()
    
    # Test 1: FIFO capacity
    assert len(history) <= 20, f"FIFO violated: {len(history)} conversations"
    
    # Test 2: Active conversation exists
    active_convs = [c for c in history if c.get("active")]
    assert len(active_convs) == 1, f"Expected 1 active conversation"
    
    # Test 3: Entity extraction present
    active = active_convs[0]
    for msg in active["messages"]:
        assert "entities" in msg, f"Message missing entity extraction"
    
    # Test 4: Storage size reasonable
    file_size_kb = get_file_size_kb("conversation-history.jsonl")
    assert file_size_kb < 500, f"Storage bloat: {file_size_kb} KB"
    
    return {"status": "HEALTHY", "tests_passed": 4}
```

---

### Violation 3: Automatic BRAIN Update ❌ CRITICAL

**Expected Behavior:**
- BRAIN updater runs automatically when:
  - 50+ new events accumulated, OR
  - End of session (task completion), OR
  - Before routing (if events > threshold)
- Knowledge graph updated with new patterns
- No manual intervention required

**Detection Criteria:**
```
✅ COMPLIANT if:
   - knowledge-graph.yaml updated after sessions
   - Event count resets after BRAIN update
   - Version number increments in knowledge-graph.yaml
   
❌ VIOLATED if:
   - knowledge-graph.yaml timestamp is old (>24 hours)
   - events.jsonl has 50+ unprocessed events
   - Manual update required to integrate learnings
```

**Impact if Violated:**
- 📚 Learnings documented but not integrated
- 🔄 Manual knowledge graph updates needed
- ⏱️ BRAIN effectiveness delayed
- 📉 Decision quality doesn't improve automatically

**How to Fix:**
1. Check `knowledge-graph.yaml` last modified date
2. Count unprocessed events in `events.jsonl`
3. Run manual BRAIN update: `#file:KDS/prompts/internal/brain-updater.md`
4. Add automatic trigger to end-of-task workflow

---

### Violation 3: Agent Workflow Integration ⚠️ MODERATE

**Expected Workflow:**
```
Agent Action
    ↓
Log Event to events.jsonl
    ↓
Check event threshold (50+?)
    ↓
IF threshold reached → Run brain-updater.md
    ↓
Update knowledge-graph.yaml
    ↓
Continue execution
```

**Detection Criteria:**
```
✅ COMPLIANT if:
   - All agents import brain event logging
   - Event threshold check exists in core workflow
   - brain-updater triggered automatically
   
⚠️ PARTIALLY VIOLATED if:
   - Some agents log events, others don't
   - Threshold check exists but not enforced
   - Manual triggers work, automatic don't
   
❌ FULLY VIOLATED if:
   - No agents log events
   - No automatic triggers exist
   - Knowledge captured only in review docs
```

**Impact if Violated:**
- 📝 Knowledge captured in review docs but not BRAIN
- 🧠 BRAIN learns from some actions, misses others
- 🎯 Inconsistent decision quality

**How to Fix:**
1. Audit all agents in `KDS/prompts/internal/` for event logging
2. Add standardized event logging module
3. Implement threshold check in Rule #16 Step 5
4. Test automatic BRAIN update triggers

---

## �📊 Three-Pillar Strategy

### Pillar 1: Violation Tracking (Enhance Rule #16 Step 5)

**Current State:**
- Rule #16 Step 5 runs KDS verification after every task
- Checks: redundancy, conflicts, performance, consistency
- Results displayed but not tracked over time

**NEW: Add BRAIN Violations Check:**
- ✅ Check if events.jsonl exists and has recent events
- ✅ Check if knowledge-graph.yaml updated in last 24 hours
- ✅ Count unprocessed events (warn if >50)
- ✅ Verify agent event logging compliance
- ✅ Alert if automatic BRAIN update didn't trigger

**Enhancement:**
```json
// KDS/sessions/current-session.json (ENHANCED)
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
      },
      {
        "timestamp": "2025-11-03T09:00:00Z",
        "task_id": "task-3.1",
        "violation_type": "brain_event_logging",
        "severity": "CRITICAL",
        "details": "No events logged to events.jsonl in last 4 hours",
        "auto_fixed": false,
        "resolution": "Agent event logging not implemented"
      },
      {
        "timestamp": "2025-11-03T09:05:00Z",
        "task_id": "task-3.2",
        "violation_type": "brain_automatic_update",
        "severity": "CRITICAL",
        "details": "knowledge-graph.yaml last updated 48 hours ago, 73 unprocessed events",
        "auto_fixed": false,
        "resolution": "Automatic BRAIN updater not triggered"
      }
    ],
    "metrics_history": [
      {
        "timestamp": "2025-11-02T10:30:00Z",
        "rule_count": 16,
        "prompt_count": 13,
        "total_files": 68,
        "redundancy_score": 0.95,  // 1.0 = perfect (no duplicates)
        "consistency_score": 1.0,   // 1.0 = perfect (all rules followed)
        "brain_health": {
          "events_logged_today": 8,
          "last_event_timestamp": "2025-11-02T10:25:00Z",
          "knowledge_graph_version": "1.1",
          "last_brain_update": "2025-11-02T09:00:00Z",
          "unprocessed_events": 8,
          "event_logging_active": true,
          "automatic_updates_working": true
        },
        "conversation_memory_health": {
          "total_conversations": 8,
          "active_conversation_id": "conv-008",
          "active_conversation_messages": 4,
          "boundary_accuracy": 0.91,
          "pronoun_resolution_accuracy": 0.88,
          "fifo_deletions_today": 0,
          "storage_size_kb": 42,
          "patterns_extracted_today": 0
        }
      },
      {
        "timestamp": "2025-11-02T11:45:00Z",
        "rule_count": 18,
        "prompt_count": 14,
        "total_files": 72,
        "redundancy_score": 0.92,
        "consistency_score": 0.98,
        "brain_health": {
          "events_logged_today": 15,
          "last_event_timestamp": "2025-11-02T11:40:00Z",
          "knowledge_graph_version": "1.1",
          "last_brain_update": "2025-11-02T09:00:00Z",
          "unprocessed_events": 15,
          "event_logging_active": true,
          "automatic_updates_working": false  // ⚠️ VIOLATION: Should have triggered at 50 events
        },
        "conversation_memory_health": {
          "total_conversations": 10,
          "active_conversation_id": "conv-010",
          "active_conversation_messages": 6,
          "boundary_accuracy": 0.93,
          "pronoun_resolution_accuracy": 0.90,
          "fifo_deletions_today": 1,
          "storage_size_kb": 58,
          "patterns_extracted_today": 3
        }
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

### BRAIN System Health 🧠
- **Event Logging:** ✅ ACTIVE (127 events this week)
- **Last Event:** 2025-11-02 11:40:00Z (2 hours ago)
- **Knowledge Graph Version:** 1.2 (updated 2025-11-02)
- **Unprocessed Events:** 8/50 (16% threshold)
- **Automatic Updates:** ✅ WORKING (3 automatic updates this week)
- **BRAIN Violations:** 0 ✅

### Conversation Memory System 🧠💬 (NEW)
- **Status:** ✅ HEALTHY
- **Total Conversations:** 12/20 (60% capacity)
- **Active Conversation:** "KDS Enhancement" (4 messages, 2.5 hours)
- **Storage:** 85 KB / 500 KB max (17%)
- **Boundary Detection Accuracy:** 92% ✅
- **Pronoun Resolution Accuracy:** 89% ✅
- **FIFO Deletions This Week:** 8 conversations
- **Patterns Extracted:** 24 patterns (avg 3 per deleted conversation)
- **Recent Issues:** 
  - 1 boundary detection failure (10 messages not split)
  - 2 pronoun resolution failures (user clarification requested, 100% resolved)
- **Example Success:**
  ```
  User: "Add a FAB button"              → Conversation #4 created
  User: "Make it purple"                → "it" resolved to "FAB button" ✅
  User: "Actually, work on dark mode"   → Boundary detected, Conversation #5 created ✅
  ```

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
- **Total:** 5 violations
- **Auto-Fixed:** 2 (redundancy extraction)
- **Manual Required:** 3 (1 performance, 2 BRAIN system)
- **Severity:** 2 LOW, 1 MEDIUM, 2 CRITICAL

---

## 🔍 Violation Details

### 🚨 CRITICAL VIOLATIONS (Action Required)

#### 1. BRAIN Event Logging - No Events for 4 Hours
- **Detected:** 2025-11-03 09:00
- **Type:** brain_event_logging
- **Location:** All agents (system-wide)
- **Issue:** No events appended to events.jsonl despite agent activity
- **Impact:** BRAIN cannot learn from recent interactions
- **Root Cause:** Event logging code not implemented in agents
- **Resolution Required:** 
  1. Add event logging to all agent prompts
  2. Verify events.jsonl write permissions
  3. Test event logging with sample action
- **Severity:** CRITICAL
- **Status:** MANUAL ACTION REQUIRED

#### 2. BRAIN Automatic Update - 73 Unprocessed Events
- **Detected:** 2025-11-03 09:05
- **Type:** brain_automatic_update
- **Location:** brain-updater.md (not triggered)
- **Issue:** knowledge-graph.yaml last updated 48 hours ago, 73 events accumulated
- **Impact:** Knowledge graph stale, routing decisions not improving
- **Root Cause:** Automatic BRAIN updater trigger not implemented
- **Resolution Required:**
  1. Implement 50-event threshold check
  2. Add brain-updater.md trigger to Rule #16 Step 5
  3. Run manual update immediately: `#file:KDS/prompts/internal/brain-updater.md`
- **Severity:** CRITICAL
- **Status:** MANUAL ACTION REQUIRED

---

### ⚠️ MEDIUM VIOLATIONS

#### 3. Redundancy - Duplicate Validation Logic (AUTO-FIXED)
- **Detected:** 2025-11-02 10:30
- **Location:** work-planner.md, code-executor.md
- **Duplicate Lines:** 12 lines identical (session validation)
- **Resolution:** Extracted to prompts/shared/validation.md
- **Severity:** LOW

#### 4. Redundancy - Similar Test Setup (AUTO-FIXED)
- **Detected:** 2025-11-02 11:15
- **Location:** test-generator.md, health-validator.md
- **Duplicate Lines:** 8 lines (Playwright config)
- **Resolution:** Moved to shared/test-first.md
- **Severity:** LOW

#### 5. Performance - Approaching Prompt Limit (MANUAL)
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
# KDS/scripts/kds-metrics.ps1
# Track KDS health over time using git history

param(
    [int]$DaysBack = 90
)

# Extract metrics from git history
$commits = git log --since="$DaysBack days ago" --pretty=format:"%H|%ai|%s" -- KDS/

# Parse commit messages for KDS changes
$metrics = @()
foreach ($commit in $commits) {
    $hash, $date, $message = $commit -split '\|'
    
    # Count rules, prompts, files at each commit
    git checkout $hash -q
    $ruleCount = (Select-String -Path KDS/governance/rules.md -Pattern "^## RULE #").Count
    $promptCount = (Get-ChildItem KDS/prompts -Recurse -Filter *.md).Count
    $fileCount = (Get-ChildItem KDS -Recurse -File).Count
    
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
$metrics | ConvertTo-Json | Out-File KDS/knowledge/kds-performance/historical-metrics.json
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

## � How to Make BRAIN Learning Automatic

### Solution 1: Implement Event Logging in All Agents (CRITICAL)

**Current Problem:**
- Agents perform actions but don't log to `events.jsonl`
- BRAIN updater has nothing to process
- Knowledge graph doesn't learn

**Fix: Standardize Event Logging**

Create shared event logging module:

```markdown
<!-- File: KDS/prompts/shared/event-logger.md -->

# Event Logger Module

**Purpose:** Standard event logging for all KDS agents

## How to Use

Import this module in any agent prompt:
```
#shared-module:event-logger.md
```

Then call logging function:
```
log_kds_event(
  event_type="file_modified",
  session_id=current_session,
  file="HostControlPanelContent.razor",
  task="Add component IDs",
  lines_changed=20
)
```

## Event Schema

**Required Fields:**
- `timestamp` - ISO8601 format (auto-generated)
- `event` - Event type (see Common Events below)
- `session_id` - Current session identifier

**Common Events:**
- `intent_detected` - Router identified user intent
- `file_modified` - File changed by agent
- `files_modified_together` - Multiple files changed in same action
- `correction` - Error corrector fixed mistake
- `validation_failed` - Health check found issue
- `validation_passed` - Health check succeeded
- `task_completed` - Task finished successfully
- `test_created` - New test generated
- `test_passed` - Test executed successfully
- `test_failed` - Test execution failed
- `session_started` - New work session begun
- `session_completed` - Work session finished

## Implementation

Agent logs event by appending to `KDS/kds-brain/events.jsonl`:

```jsonl
{"timestamp":"2025-11-03T10:30:00Z","event":"file_modified","session_id":"playwright-ids","file":"HostControlPanelContent.razor","task":"Add IDs","lines_changed":20}
```

**CRITICAL:** Always append (never overwrite) events.jsonl
```

**Update All Agent Prompts:**

Each agent in `KDS/prompts/internal/` must import and use event logger:

```markdown
<!-- Example: work-planner.md -->

# Work Planner Agent

#shared-module:event-logger.md  <!-- IMPORT -->
#shared-module:session-loader.md

## Step 1: Load Session State
...

## Step 2: Create Plan
...

## Step 3: Save Plan
...

## Step 4: Log Event  <!-- NEW STEP -->
```
log_kds_event(
  event_type="plan_created",
  session_id=current_session_id,
  phases=plan.phases.length,
  total_tasks=plan.total_tasks,
  estimated_duration=plan.duration
)
```

**Next: Tell user how to proceed**
```

---

### Solution 2: Automatic BRAIN Update Hook

**Current Problem:**
- Events accumulate in `events.jsonl`
- No automatic trigger to process them
- Manual update required

**Fix: Add Threshold Check to Rule #16 Step 5**

Update `KDS/governance/rules.md` Rule #16 Step 5:

```markdown
## RULE #16: MANDATORY POST-TASK CHECKLIST

### Step 5: KDS Verification (ENHANCED)

**After every task, check:**

1. ✅ Redundancy check
2. ✅ Conflict check
3. ✅ Performance check
4. ✅ Consistency check
5. **✅ BRAIN health check (NEW)**

**BRAIN Health Check:**

```python
# Pseudo-code for BRAIN health verification

def check_brain_health():
    events_file = "KDS/kds-brain/events.jsonl"
    knowledge_graph = "KDS/kds-brain/knowledge-graph.yaml"
    
    # Check 1: Event logging active?
    if not file_exists(events_file):
        log_violation("CRITICAL", "brain_event_logging", "events.jsonl missing")
        return FAILED
    
    last_event = get_last_line(events_file)
    last_event_time = parse_timestamp(last_event["timestamp"])
    
    if (now() - last_event_time) > 4_hours:
        log_violation("CRITICAL", "brain_event_logging", "No events for 4+ hours")
        return FAILED
    
    # Check 2: Count unprocessed events
    kg_last_modified = file_modified_time(knowledge_graph)
    events_since_update = count_events_after(events_file, kg_last_modified)
    
    if events_since_update >= 50:
        # AUTO-TRIGGER BRAIN UPDATE
        log_info("BRAIN threshold reached (50 events), triggering automatic update")
        run_brain_updater()  # Calls brain-updater.md
        events_since_update = 0  # Reset counter
    
    # Check 3: Knowledge graph stale?
    if (now() - kg_last_modified) > 24_hours and events_since_update > 10:
        log_violation("CRITICAL", "brain_automatic_update", 
                     f"{events_since_update} unprocessed events, KG last updated {kg_last_modified}")
        # AUTO-TRIGGER if <50 but >24 hours old
        run_brain_updater()
    
    # Check 4: Agent compliance
    agents_without_logging = check_agent_event_logging()
    if len(agents_without_logging) > 0:
        log_violation("MEDIUM", "brain_agent_compliance", 
                     f"Agents not logging: {', '.join(agents_without_logging)}")
    
    return PASSED

def run_brain_updater():
    # Load and execute brain-updater.md
    execute_internal_agent("brain-updater.md")
    log_event("brain_automatic_update", success=True, events_processed=count)
```

**When to Trigger BRAIN Update:**
1. **Event threshold:** 50+ unprocessed events
2. **Time threshold:** 24+ hours since last update AND 10+ events
3. **End of session:** Session marked complete
4. **Manual request:** User calls `#file:KDS/prompts/internal/brain-updater.md`

---

### Solution 3: Post-Session Hook

**Current Problem:**
- Session completes but BRAIN doesn't update
- Learnings stay in review docs, not knowledge graph

**Fix: Add to Session Completion Workflow**

When session ends (all tasks complete):

```python
def complete_session(session_id):
    # Existing steps
    mark_session_complete(session_id)
    archive_session_state(session_id)
    
    # NEW: Trigger BRAIN update
    log_info(f"Session {session_id} complete, updating BRAIN with learnings")
    run_brain_updater()
    
    # Log completion event
    log_kds_event(
        event_type="session_completed",
        session_id=session_id,
        success=True,
        brain_updated=True
    )
```

---

### Solution 4: Manual Fix for This Session

**Immediate Actions (Fix Current Violations):**

**Step 1: Verify Events File**
```bash
# Check if events.jsonl exists and has recent data
cat KDS/kds-brain/events.jsonl | tail -5
```

Expected: Recent timestamps (within last few hours)

**Step 2: Run Manual BRAIN Update**
```markdown
#file:KDS/prompts/internal/brain-updater.md
```

This will:
- Process all events in `events.jsonl`
- Update `knowledge-graph.yaml` with patterns
- Increment version number
- Archive processed events (optional)

**Step 3: Audit Agent Event Logging**

Check each agent in `KDS/prompts/internal/`:
- [ ] `intent-router.md` - Logs `intent_detected`? 
- [ ] `work-planner.md` - Logs `plan_created`?
- [ ] `code-executor.md` - Logs `file_modified`?
- [ ] `error-corrector.md` - Logs `correction`?
- [ ] `test-generator.md` - Logs `test_created`?
- [ ] `health-validator.md` - Logs `validation_passed/failed`?
- [ ] `session-resumer.md` - Logs `session_resumed`?

**Step 4: Implement Missing Event Logging**

For each agent missing logging:
1. Import `#shared-module:event-logger.md`
2. Add `log_kds_event()` call after key actions
3. Test with sample action
4. Verify event appears in `events.jsonl`

**Step 5: Enable Automatic BRAIN Updates**

Update Rule #16 Step 5 with threshold check:
1. Add brain health verification code
2. Implement 50-event threshold trigger
3. Test automatic update with 60-event batch
4. Verify knowledge graph updates

---

## 📋 Implementation Checklist

### Phase 0: Fix BRAIN Violations (CRITICAL - Do First)
- [ ] Create `KDS/prompts/shared/event-logger.md` module
- [ ] Audit all agents for event logging compliance
- [ ] Add event logging to non-compliant agents
- [ ] Test event logging with sample actions
- [ ] Verify events appear in `events.jsonl`
- [ ] Run manual BRAIN update to process backlog
- [ ] Add automatic trigger to Rule #16 Step 5
- [ ] Test automatic BRAIN update with 60-event batch
- [ ] Document BRAIN learning flow in KDS-DESIGN.md

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
@workspace #file:KDS/prompts/user/validate.md

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
KDS/scripts/kds-metrics.ps1 -DaysBack 90
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
