# KDS BRAIN Protection - Test Scenarios

**Version:** 1.0 (Phase 1)  
**Date:** 2025-11-02  
**Purpose:** Verify protection system prevents bad routing and learning

---

## Test Scenario 1: High Confidence Auto-Route ✅

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    plan:
      phrases:
        - pattern: "add [X] button"
          confidence: 0.95
          occurrences: 12
```

### User Input
```
#file:.github/prompts/user/kds.md
I want to add a download button
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ✅ BRAIN returns: confidence=0.95, occurrences=12
3. ✅ Protection validates: HIGH safety level (>= 0.70 + >= 3 occurrences)
4. ✅ Auto-routes to work-planner.md WITHOUT asking user

### Success Criteria
- No user prompt required
- Routes to work-planner.md immediately
- Response time < 200ms

---

## Test Scenario 2: Low Confidence Fallback ⚠️

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    plan:
      phrases:
        - pattern: "add [X] button"
          confidence: 0.45
          occurrences: 2
```

### User Input
```
#file:.github/prompts/user/kds.md
I want to add a download button
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ✅ BRAIN returns: confidence=0.45, occurrences=2
3. ⚠️ Protection validates: LOW safety level (< 0.70 OR < 3 occurrences)
4. ⚠️ Falls back to pattern matching
5. ✅ Pattern matching detects "I want to add" → PLAN intent
6. ✅ Routes to work-planner.md

### Success Criteria
- Does NOT auto-route from BRAIN
- Falls back to pattern matching
- Still routes correctly (via fallback)
- Logs event for BRAIN to learn

---

## Test Scenario 3: Anomaly Detection 🚨

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    execute:
      phrases:
        - pattern: "download report"
          confidence: 0.98
          occurrences: 1  # SUSPICIOUS!
```

### User Input
```
#file:.github/prompts/user/kds.md
download report
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ✅ BRAIN returns: confidence=0.98, occurrences=1
3. 🚨 Protection detects: ANOMALY (confidence > 0.95 with only 1 occurrence)
4. 🚨 Override to pattern matching (safety fallback)
5. ⚠️ Pattern matching checks "download report" → No clear match
6. ❓ Asks user for clarification

### Success Criteria
- Anomaly detected and flagged
- Does NOT auto-route despite high confidence
- Asks user for clarification
- Logs anomaly for manual review

---

## Test Scenario 4: Medium Confidence Confirmation ⚠️

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    plan:
      phrases:
        - pattern: "add [X] feature"
          confidence: 0.75
          occurrences: 5
```

### User Input
```
#file:.github/prompts/user/kds.md
add dark mode feature
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ✅ BRAIN returns: confidence=0.75, occurrences=5
3. ⚠️ Protection validates: MEDIUM safety level (>= 0.70 but < 0.85)
4. ⚠️ Shows intent to user, asks confirmation:
   ```
   Detected: PLAN intent
   Route to: work-planner.md
   Proceed? (Y/n)
   ```
5. ✅ User responds "Y" → Routes to work-planner.md
6. ✅ Logs confirmation (reinforces learning)

### Success Criteria
- Shows detected intent
- Asks for user confirmation
- Routes correctly on "Y"
- Logs user response for learning

---

## Test Scenario 5: Insufficient Occurrences ⚠️

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    test:
      phrases:
        - pattern: "visual test for [X]"
          confidence: 0.85
          occurrences: 2  # Less than minimum (3)
```

### User Input
```
#file:.github/prompts/user/kds.md
visual test for share button
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ✅ BRAIN returns: confidence=0.85, occurrences=2
3. ⚠️ Protection validates: LOW safety level (occurrences < 3)
4. 🔒 Protection downgrades to pattern matching
5. ✅ Pattern matching detects "test" → TEST intent
6. ✅ Routes to test-generator.md

### Success Criteria
- Insufficient occurrences detected
- Downgrades to pattern matching
- Still routes correctly
- Requires 1 more occurrence to enable BRAIN routing

---

## Test Scenario 6: Correction Memory Alert 🚨

### Setup
```yaml
knowledge-graph.yaml:
  correction_history:
    file_mismatch:
      - incorrect: "HostControlPanel.razor"
        correct: "HostControlPanelContent.razor"
        occurrences: 3  # Threshold reached
```

### User Input (via executor)
```
About to modify: HostControlPanel.razor
Intent: "Add FAB button pulse"
```

### Expected Behavior
1. ✅ Executor queries BRAIN (correction_prevention)
2. ✅ BRAIN returns: WARNING
   ```yaml
   warning: true
   message: "This file is frequently confused with another"
   occurrences: 3
   correct_file: "HostControlPanelContent.razor"
   ```
3. ⚠️ Executor shows warning to user:
   ```
   ⚠️ CAUTION: HostControlPanel.razor is frequently confused with HostControlPanelContent.razor (3 past corrections)
   
   Are you sure you want to modify HostControlPanel.razor?
   FAB button is typically in HostControlPanelContent.razor.
   
   Proceed? (Y/n)
   ```
4. ❌ User responds "n" → Switches to correct file
5. ✅ Logs correction prevented (successful protection)

### Success Criteria
- Correction warning shown
- User given chance to cancel
- Prevents repeated mistake
- Logs success for metrics

---

## Test Scenario 7: Empty Knowledge Graph (Cold Start) ℹ️

### Setup
```yaml
knowledge-graph.yaml:
  intent_patterns:
    plan: {}
    execute: {}
    # Empty patterns
```

### User Input
```
#file:.github/prompts/user/kds.md
I want to add a share button
```

### Expected Behavior
1. ✅ Router queries BRAIN
2. ℹ️ BRAIN returns: no_data (empty knowledge graph)
3. ℹ️ Router falls back to pattern matching
4. ✅ Pattern matching detects "I want to add" → PLAN intent
5. ✅ Routes to work-planner.md
6. ✅ Logs event to populate BRAIN

### Success Criteria
- Gracefully handles empty BRAIN
- Falls back to pattern matching
- Routes correctly
- Begins building knowledge

---

## Protection Metrics to Track

After implementing Phase 1, monitor these metrics:

### Accuracy Metrics
- ✅ **Auto-route success rate**: % of high-confidence routes that were correct
- ⚠️ **Fallback rate**: % of queries that fell back to pattern matching
- 🚨 **Anomaly detection rate**: # of anomalies caught
- ❌ **False positive rate**: # of high-confidence routes that were wrong

### Performance Metrics
- ⏱️ **BRAIN query time**: Average time for brain-query.md to return
- ⏱️ **Total routing time**: Average time from user input to agent load
- 📊 **Cache hit rate**: % of queries served from cache

### Learning Metrics
- 📈 **Knowledge growth**: # of patterns learned over time
- 🎯 **Confidence improvement**: Average confidence increase for patterns
- 🔁 **Correction prevention**: # of mistakes prevented by warnings

---

## Expected Results (Phase 1)

After Phase 1 implementation, expect:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Auto-route accuracy | > 95% | High confidence should = high accuracy |
| Fallback rate | 20-30% | Expected while BRAIN learns |
| Anomaly detection | > 0 | Should catch suspicious patterns |
| Avg routing time | < 200ms | Including BRAIN query |
| False positives | < 5% | Protection should reduce errors |
| Correction prevention | > 50% | Warnings should prevent mistakes |

---

## Next Steps (Phase 2 & 3)

**Phase 2: Safety Net**
- Add `protect-brain-update.ps1` script
- Implement backup before updates
- Add schema validation

**Phase 3: Learning Quality**
- Implement min occurrence enforcement in brain-updater
- Add confidence jump detection
- Create manual review queue for anomalies

---

## Manual Testing Checklist

- [ ] Test high confidence auto-route (Scenario 1)
- [ ] Test low confidence fallback (Scenario 2)
- [ ] Test anomaly detection (Scenario 3)
- [ ] Test medium confidence confirmation (Scenario 4)
- [ ] Test insufficient occurrences (Scenario 5)
- [ ] Test correction memory alert (Scenario 6)
- [ ] Test empty knowledge graph (Scenario 7)
- [ ] Measure routing performance (< 200ms)
- [ ] Verify protection config loaded correctly
- [ ] Check event logging works

---

**Status:** Ready for testing ✅
