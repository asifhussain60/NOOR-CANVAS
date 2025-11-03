# Conversation Memory Self-Review & Validation

**Version:** 1.0  
**Date:** November 3, 2025  
**Status:** Design Specification  
**Related Docs:**
- `BRAIN-CONVERSATION-MEMORY-DESIGN.md` - Full architecture design
- `KDS-SELF-REVIEW-STRATEGY.md` - Self-review integration

---

## 🎯 Purpose

This document specifies how KDS self-review (Rule #16 Step 5) will track and validate the conversation memory system to ensure it's working effectively.

---

## 📊 Health Metrics Tracked

### 1. FIFO Queue Health

**What We Track:**
- Total conversations in history (should be ≤20)
- Storage size in KB (should be <500 KB)
- FIFO deletions per day
- Oldest conversation age (in days)

**Success Criteria:**
```
✅ HEALTHY if:
   - Total conversations ≤ 20
   - Storage < 500 KB
   - FIFO working (oldest deleted when #21 starts)
   - No storage bloat (size stable or decreasing)

⚠️ WARNING if:
   - Total conversations > 20 (FIFO not triggering)
   - Storage > 300 KB (approaching limit)
   - No FIFO deletions despite heavy usage

❌ CRITICAL if:
   - Total conversations > 25 (FIFO completely broken)
   - Storage > 500 KB (unbounded growth)
   - FIFO disabled or misconfigured
```

**Tracking Method:**
```python
def check_fifo_queue_health():
    history = load_conversation_history()
    file_size_kb = get_file_size_kb("conversation-history.jsonl")
    
    return {
        "total_conversations": len(history),
        "storage_kb": file_size_kb,
        "oldest_conversation_age_days": get_age_in_days(history[0]),
        "fifo_working": len(history) <= 20,
        "storage_healthy": file_size_kb < 500
    }
```

---

### 2. Boundary Detection Accuracy

**What We Track:**
- Boundary detection events logged
- Automatic detections vs. user-triggered
- False positives (split when shouldn't)
- False negatives (didn't split when should)
- Overall accuracy percentage

**Success Criteria:**
```
✅ HEALTHY if:
   - Accuracy > 90%
   - Avg conversation length: 5-30 messages
   - False positive rate < 5%
   - False negative rate < 10%

⚠️ WARNING if:
   - Accuracy 80-90%
   - Avg conversation length < 5 (too aggressive) or > 50 (too passive)
   - False positive rate 5-10%

❌ CRITICAL if:
   - Accuracy < 80%
   - All messages in one conversation (never triggers)
   - New conversation every message (always triggers)
```

**Tracking Method:**
```python
def check_boundary_detection_accuracy():
    # Load boundary detection events from events.jsonl
    events = load_events(event_type="conversation_boundary_detected")
    
    # Calculate accuracy from user corrections
    corrections = load_events(event_type="conversation_boundary_correction")
    
    total_detections = len(events)
    incorrect_detections = len(corrections)
    accuracy = 1.0 - (incorrect_detections / total_detections)
    
    # Calculate avg conversation length
    history = load_conversation_history()
    avg_length = sum(c["message_count"] for c in history) / len(history)
    
    return {
        "accuracy": accuracy,
        "avg_conversation_length": avg_length,
        "false_positives": count_false_positives(corrections),
        "false_negatives": count_false_negatives(corrections)
    }
```

**How to Log Corrections:**
```python
# When user says "This should be same conversation as previous"
log_kds_event({
    "event": "conversation_boundary_correction",
    "boundary_id": "boundary-123",
    "should_have_split": False,  # False positive
    "actual_boundary": None,
    "user_feedback": "These are related, same conversation"
})

# When user says "This should have been new conversation"
log_kds_event({
    "event": "conversation_boundary_correction",
    "boundary_id": None,
    "should_have_split": True,  # False negative
    "actual_boundary": "after_message_15",
    "user_feedback": "Topic changed, should be new conversation"
})
```

---

### 3. Pronoun Resolution Accuracy

**What We Track:**
- Pronoun resolution attempts (count of "it", "that", "this" in messages)
- Successful resolutions (context_ref populated)
- Failed resolutions (clarification requested)
- User corrections (resolution was wrong)
- Overall accuracy percentage

**Success Criteria:**
```
✅ HEALTHY if:
   - Accuracy > 85%
   - Clarification rate < 15%
   - Correction rate < 5%
   - Context lookback working (finds entity in last 2-3 messages)

⚠️ WARNING if:
   - Accuracy 75-85%
   - Clarification rate 15-25%
   - Correction rate 5-10%

❌ CRITICAL if:
   - Accuracy < 75%
   - Clarification rate > 25% (annoying users)
   - Correction rate > 10% (resolving incorrectly)
```

**Tracking Method:**
```python
def check_pronoun_resolution_accuracy():
    history = load_conversation_history()
    
    total_pronouns = 0
    successful_resolutions = 0
    clarifications_requested = 0
    incorrect_resolutions = 0
    
    for conv in history:
        for msg in conv["messages"]:
            # Check if message contains pronouns
            pronouns = detect_pronouns(msg["user"])  # ["it", "that", ...]
            
            if pronouns:
                total_pronouns += len(pronouns)
                
                # Successful if context_ref present
                if "context_ref" in msg:
                    successful_resolutions += 1
                
                # Clarification if asked user
                if "clarification_requested" in msg:
                    clarifications_requested += 1
                
                # Incorrect if user corrected
                if "resolution_correction" in msg:
                    incorrect_resolutions += 1
    
    accuracy = successful_resolutions / total_pronouns if total_pronouns > 0 else 1.0
    
    return {
        "accuracy": accuracy,
        "total_pronouns": total_pronouns,
        "successful": successful_resolutions,
        "clarifications": clarifications_requested,
        "corrections": incorrect_resolutions
    }
```

**How to Log Corrections:**
```python
# When user corrects pronoun resolution
# Example: User said "Make it purple" → KDS thought "it" = "header"
#          User corrected: "No, the FAB button not the header"

log_kds_event({
    "event": "pronoun_resolution_correction",
    "message_id": "msg-042",
    "pronoun": "it",
    "incorrect_resolution": "header",
    "correct_resolution": "FAB button",
    "user_feedback": "No, the FAB button not the header"
})

# Update message with correction
msg["resolution_correction"] = {
    "pronoun": "it",
    "incorrect": "header",
    "correct": "FAB button"
}
```

---

### 4. Pattern Extraction Effectiveness

**What We Track:**
- Conversations deleted via FIFO (count per day/week)
- Patterns extracted before deletion
- Patterns successfully added to knowledge graph
- Patterns rejected (duplicate, low confidence)
- Average patterns per conversation

**Success Criteria:**
```
✅ HEALTHY if:
   - Avg 2-5 patterns per deleted conversation
   - Pattern acceptance rate > 70%
   - No extraction failures (patterns lost)

⚠️ WARNING if:
   - Avg < 2 patterns (not extracting enough)
   - Pattern acceptance rate 50-70%
   - 1-2 extraction failures per week

❌ CRITICAL if:
   - Avg < 1 pattern (no learning from conversations)
   - Pattern acceptance rate < 50%
   - Frequent extraction failures (patterns lost)
```

**Tracking Method:**
```python
def check_pattern_extraction_effectiveness():
    # Load FIFO deletion events
    deletion_events = load_events(event_type="conversation_fifo_deletion")
    
    total_deleted = len(deletion_events)
    total_patterns_extracted = 0
    total_patterns_accepted = 0
    extraction_failures = 0
    
    for event in deletion_events:
        if "patterns_extracted" in event:
            total_patterns_extracted += event["patterns_extracted"]
            total_patterns_accepted += event["patterns_accepted"]
        else:
            extraction_failures += 1
    
    avg_patterns = total_patterns_extracted / total_deleted if total_deleted > 0 else 0
    acceptance_rate = total_patterns_accepted / total_patterns_extracted if total_patterns_extracted > 0 else 0
    
    return {
        "conversations_deleted": total_deleted,
        "avg_patterns_per_conversation": avg_patterns,
        "pattern_acceptance_rate": acceptance_rate,
        "extraction_failures": extraction_failures
    }
```

**How to Log Pattern Extraction:**
```python
# When FIFO deletes conversation #1 to make room for #21
log_kds_event({
    "event": "conversation_fifo_deletion",
    "conversation_id": "conv-001",
    "title": "Session 215 Implementation",
    "message_count": 12,
    "patterns_extracted": 4,
    "patterns_accepted": 3,
    "patterns_rejected": 1,
    "rejection_reasons": ["duplicate_85%_similar"],
    "deleted_timestamp": "2025-11-03T14:30:00Z"
})
```

---

### 5. Storage Efficiency

**What We Track:**
- File size over time (growth trend)
- Avg bytes per conversation
- Avg bytes per message
- Compression ratio (if implemented)

**Success Criteria:**
```
✅ HEALTHY if:
   - File size stable (±10% week-over-week)
   - Avg conversation size: 2-10 KB
   - Total size < 500 KB
   - Growth asymptotic (approaching stable max)

⚠️ WARNING if:
   - File size growing >10% per week
   - Avg conversation size > 10 KB
   - Total size 300-500 KB (approaching limit)

❌ CRITICAL if:
   - File size growing >25% per week (unbounded growth)
   - Avg conversation size > 20 KB (bloated)
   - Total size > 500 KB (exceeded limit)
```

**Tracking Method:**
```python
def check_storage_efficiency():
    history = load_conversation_history()
    file_size_kb = get_file_size_kb("conversation-history.jsonl")
    
    total_conversations = len(history)
    total_messages = sum(c["message_count"] for c in history)
    
    avg_kb_per_conversation = file_size_kb / total_conversations if total_conversations > 0 else 0
    avg_bytes_per_message = (file_size_kb * 1024) / total_messages if total_messages > 0 else 0
    
    # Get historical sizes for trend
    weekly_sizes = get_weekly_storage_sizes(weeks=4)
    growth_rate = calculate_growth_rate(weekly_sizes)
    
    return {
        "total_size_kb": file_size_kb,
        "avg_kb_per_conversation": avg_kb_per_conversation,
        "avg_bytes_per_message": avg_bytes_per_message,
        "weekly_growth_rate": growth_rate,
        "approaching_limit": file_size_kb > 300
    }
```

---

## 🔍 Automated Validation Tests

### Test Suite: Conversation Memory Health

Run automatically in Rule #16 Step 5:

```python
def run_conversation_memory_health_checks():
    """
    Comprehensive health check for conversation memory system
    Runs after every task as part of Rule #16 Step 5
    """
    
    results = {
        "fifo_queue": check_fifo_queue_health(),
        "boundary_detection": check_boundary_detection_accuracy(),
        "pronoun_resolution": check_pronoun_resolution_accuracy(),
        "pattern_extraction": check_pattern_extraction_effectiveness(),
        "storage_efficiency": check_storage_efficiency()
    }
    
    # Calculate overall health score
    health_score = calculate_conversation_memory_health_score(results)
    
    # Detect violations
    violations = detect_conversation_memory_violations(results)
    
    # Log to session state
    log_to_session_metrics({
        "conversation_memory_health": {
            "timestamp": now(),
            "health_score": health_score,
            "metrics": results,
            "violations": violations
        }
    })
    
    return {
        "status": "HEALTHY" if health_score > 85 else "WARNING" if health_score > 70 else "CRITICAL",
        "health_score": health_score,
        "violations": violations,
        "recommendations": generate_recommendations(results)
    }

def calculate_conversation_memory_health_score(results):
    """
    Calculate 0-100 health score for conversation memory
    """
    weights = {
        "fifo_queue": 0.25,           # 25% - Critical infrastructure
        "boundary_detection": 0.25,   # 25% - Core UX feature
        "pronoun_resolution": 0.20,   # 20% - Important for context
        "pattern_extraction": 0.15,   # 15% - Learning effectiveness
        "storage_efficiency": 0.15    # 15% - Operational health
    }
    
    scores = {}
    
    # FIFO Queue Score
    fifo = results["fifo_queue"]
    fifo_score = 100
    if fifo["total_conversations"] > 20:
        fifo_score -= 50  # Major violation
    if fifo["storage_kb"] > 500:
        fifo_score -= 30  # Storage bloat
    elif fifo["storage_kb"] > 300:
        fifo_score -= 10  # Warning
    scores["fifo_queue"] = max(0, fifo_score)
    
    # Boundary Detection Score
    boundary = results["boundary_detection"]
    boundary_score = boundary["accuracy"] * 100
    if boundary["avg_conversation_length"] < 5 or boundary["avg_conversation_length"] > 50:
        boundary_score -= 10  # Suspect length
    scores["boundary_detection"] = boundary_score
    
    # Pronoun Resolution Score
    pronoun = results["pronoun_resolution"]
    scores["pronoun_resolution"] = pronoun["accuracy"] * 100
    
    # Pattern Extraction Score
    pattern = results["pattern_extraction"]
    pattern_score = 100
    if pattern["avg_patterns_per_conversation"] < 2:
        pattern_score -= 20
    if pattern["pattern_acceptance_rate"] < 0.7:
        pattern_score -= 20
    if pattern["extraction_failures"] > 0:
        pattern_score -= 10 * pattern["extraction_failures"]
    scores["pattern_extraction"] = max(0, pattern_score)
    
    # Storage Efficiency Score
    storage = results["storage_efficiency"]
    storage_score = 100
    if storage["weekly_growth_rate"] > 0.25:
        storage_score -= 30  # Unbounded growth
    elif storage["weekly_growth_rate"] > 0.10:
        storage_score -= 10  # Warning
    if storage["approaching_limit"]:
        storage_score -= 10
    scores["storage_efficiency"] = max(0, storage_score)
    
    # Weighted average
    overall_score = sum(scores[k] * weights[k] for k in weights.keys())
    
    return round(overall_score, 1)
```

---

## 📈 Weekly Report Example

**Added to `knowledge/kds-performance/weekly-health-report-*.md`:**

```markdown
### Conversation Memory System Health 🧠💬

**Status:** ✅ HEALTHY  
**Health Score:** 91/100  

#### Capacity & Storage
- **Total Conversations:** 12/20 (60% capacity) ✅
- **Storage:** 85 KB / 500 KB max (17%) ✅
- **Oldest Conversation:** "Session 215" (4 days ago)
- **FIFO Deletions This Week:** 8 conversations
- **Trend:** Stable (12-15 conversations typical)

#### Quality Metrics
- **Boundary Detection Accuracy:** 92% ✅ (+2% from last week)
- **Pronoun Resolution Accuracy:** 89% ✅ (+3% from last week)
- **Avg Conversation Length:** 12.3 messages ✅
- **Pattern Extraction Rate:** 3.0 patterns/conversation ✅
- **Pattern Acceptance Rate:** 75% ✅

#### This Week's Activity
- **Conversations Started:** 10
- **Conversations Ended:** 8 (2 still active)
- **Boundary Detections:** 10 automatic, 0 manual
- **Pronoun Resolutions:** 45 successful, 6 clarifications, 1 correction
- **Patterns Extracted:** 24 (from 8 deleted conversations)

#### Issues & Resolutions
1. **Boundary Detection Failure** (Nov 2, 10:15am)
   - **Issue:** 10 consecutive messages not split into conversations
   - **Root Cause:** Entity overlap >70% triggered "same conversation" logic
   - **Resolution:** Adjusted time gap threshold from 1 hour to 30 minutes
   - **Status:** ✅ RESOLVED

2. **Pronoun Resolution Failures** (2 instances)
   - **Instance 1:** User said "Test it" with no prior entity in context
   - **Action:** Requested clarification "What should I test?"
   - **User Response:** "Test the FAB button"
   - **Status:** ✅ RESOLVED via clarification

   - **Instance 2:** User said "Make it purple" but "it" resolved to "header" instead of "FAB button"
   - **User Correction:** "No, the FAB button"
   - **Action:** Logged correction event, updated pattern learning
   - **Status:** ✅ RESOLVED, pattern learned

#### Example Success Stories

**Success 1: Multi-Step Conversation**
```
Conv #8 "FAB Button Design" (18 messages, 3 days):
  User: "Add a FAB button"              → Conv #8 created
  User: "Make it purple"                → "it" resolved to "FAB button" ✅
  User: "Add pulse animation"           → Entity extracted ✅
  User: "Test that feature"             → "that" resolved to "pulse animation" ✅
  ... (14 more messages)
  User: "Actually, let's work on dark mode" → Boundary detected, Conv #9 created ✅
```

**Success 2: Cross-Conversation Reference**
```
Conv #10 "Dark Mode Refinement":
  User: "Make the FAB button from conversation #8 adapt to dark mode"
  → KDS queried conversation history
  → Found Conv #8 "FAB Button Design"
  → Extracted context: "purple FAB button in HostControlPanel.razor"
  → Routed to EXECUTE with full context ✅
```

**Success 3: FIFO Working Correctly**
```
Storage before: 20 conversations, 195 KB
New conversation started: Conv #21 "User Authentication"
FIFO triggered:
  - Deleted Conv #1 "Session 215 Implementation" (12 messages)
  - Extracted 4 patterns → knowledge-graph.yaml
  - Storage after: 20 conversations, 187 KB ✅
```

#### Recommendations
- ✅ Boundary detection working well (92% accuracy)
- ⚠️ Consider lowering pronoun resolution confidence threshold from 0.70 to 0.65
  - Would reduce clarification requests from 6/week to ~4/week
  - Trade-off: Slight increase in incorrect resolutions (1% → 2%)
- ✅ FIFO queue stable, no action needed
- ✅ Pattern extraction effective, keep current settings
```

---

## 🎯 Success Criteria Summary

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Overall Health Score** | >85 | 70-85 | <70 |
| **FIFO Conversations** | ≤20 | 21-25 | >25 |
| **Storage Size** | <300 KB | 300-500 KB | >500 KB |
| **Boundary Accuracy** | >90% | 80-90% | <80% |
| **Pronoun Accuracy** | >85% | 75-85% | <75% |
| **Pattern Extraction** | 2-5/conv | 1-2/conv | <1/conv |
| **Storage Growth** | <10%/week | 10-25%/week | >25%/week |

---

## 🚀 Implementation Checklist

### Phase 1: Basic Health Tracking (Week 1)
- [ ] Implement `check_fifo_queue_health()`
- [ ] Implement `check_storage_efficiency()`
- [ ] Add conversation memory metrics to session state
- [ ] Test FIFO queue monitoring

### Phase 2: Quality Metrics (Week 2)
- [ ] Implement `check_boundary_detection_accuracy()`
- [ ] Implement `check_pronoun_resolution_accuracy()`
- [ ] Add correction logging mechanisms
- [ ] Test accuracy tracking

### Phase 3: Pattern Extraction (Week 3)
- [ ] Implement `check_pattern_extraction_effectiveness()`
- [ ] Add pattern extraction logging to FIFO deletion
- [ ] Track patterns added to knowledge graph
- [ ] Test end-to-end pattern flow

### Phase 4: Integration & Reporting (Week 4)
- [ ] Integrate all checks into Rule #16 Step 5
- [ ] Add conversation memory section to weekly reports
- [ ] Add conversation memory section to monthly reports
- [ ] Create dashboard/summary view
- [ ] Document troubleshooting procedures

---

## 📋 Quick Reference: Event Logging

**Events to Log for Conversation Memory Tracking:**

```jsonl
// Message added to conversation
{"timestamp":"2025-11-03T14:23:00Z","event":"conversation_message_added","conversation_id":"conv-004","message_id":"msg-012","entities_extracted":["FAB button"],"pronoun_resolution":{"pronoun":"it","resolved_to":"FAB button","confidence":0.92}}

// Conversation boundary detected
{"timestamp":"2025-11-03T14:30:00Z","event":"conversation_boundary_detected","old_conversation_id":"conv-004","new_conversation_id":"conv-005","detection_method":"explicit_marker","marker":"actually, let's","confidence":0.98}

// User corrects boundary detection
{"timestamp":"2025-11-03T14:35:00Z","event":"conversation_boundary_correction","boundary_id":"boundary-123","should_have_split":false,"user_feedback":"Same topic, keep in one conversation"}

// Pronoun resolution clarification
{"timestamp":"2025-11-03T14:40:00Z","event":"pronoun_resolution_clarification","message_id":"msg-015","pronoun":"it","clarification_question":"What should I test?","user_response":"Test the FAB button"}

// Pronoun resolution correction
{"timestamp":"2025-11-03T14:45:00Z","event":"pronoun_resolution_correction","message_id":"msg-018","pronoun":"it","incorrect_resolution":"header","correct_resolution":"FAB button","user_feedback":"No, the FAB button"}

// FIFO deletion
{"timestamp":"2025-11-03T15:00:00Z","event":"conversation_fifo_deletion","conversation_id":"conv-001","title":"Session 215 Implementation","message_count":12,"patterns_extracted":4,"patterns_accepted":3,"storage_freed_kb":8}
```

---

## 🎓 Summary

**How Self-Review Tracks Conversation Memory:**

1. **Automatic Health Checks** - Run after every task (Rule #16 Step 5)
2. **Five Key Metrics** - FIFO, boundary detection, pronoun resolution, pattern extraction, storage
3. **Violation Detection** - Automatic alerts for CRITICAL, WARNING, and LOW issues
4. **Weekly/Monthly Reports** - Trend analysis and recommendations
5. **Event Logging** - Track corrections, failures, and successes
6. **Overall Health Score** - 0-100 score calculated from weighted metrics

**Benefits:**
- ✅ Continuous monitoring (no manual checks needed)
- ✅ Early warning system (violations detected immediately)
- ✅ Trend analysis (improving or degrading over time?)
- ✅ Evidence-based tuning (adjust thresholds based on data)
- ✅ User feedback loop (corrections improve accuracy)

**Next Steps:**
1. Approve this validation strategy
2. Implement health check functions
3. Integrate into Rule #16 Step 5
4. Add to weekly/monthly reports
5. Monitor for 2-4 weeks, tune thresholds as needed

---

**Last Updated:** November 3, 2025  
**Status:** Design Specification (pending implementation)
