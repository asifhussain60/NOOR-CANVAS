````markdown
# KDS Self-Test: Intent Router Classification

**Purpose:** Validate intent detection accuracy and routing decisions  
**Version:** 5.0  
**Type:** Regression test (ensures KDS core functionality)  
**Duration:** 5-10 minutes

---

## 🎯 What This Tests

1. ✅ **Intent Classification Accuracy** - Does router detect correct intent?
2. ✅ **Multi-Intent Handling** - Can it detect multiple intents?
3. ✅ **Ambiguity Resolution** - Does it ask when unclear?
4. ✅ **Priority Ordering** - Are conflicts resolved correctly?
5. ✅ **BRAIN Integration** - Does confidence-based routing work?
6. ✅ **Session State Awareness** - Does it check session before routing?

---

## 📋 Test Cases

### Test 1: PLAN Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
I want to add a share button to the canvas
```

**Expected Behavior:**
```yaml
intent_detected: plan
confidence: high
routes_to: work-planner.md
reason: "Pattern matches 'I want to add'"
session_check: creates_new_session
```

**Success Criteria:**
- ✅ Intent = PLAN
- ✅ Routes to work-planner.md
- ✅ No errors or ambiguity warnings

---

### Test 2: EXECUTE Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
continue
```

**Expected Behavior:**
```yaml
intent_detected: execute
confidence: high
routes_to: code-executor.md
reason: "Pattern matches 'continue'"
session_check: requires_active_session
```

**Success Criteria:**
- ✅ Intent = EXECUTE
- ✅ Routes to code-executor.md (if session exists)
- ✅ OR shows error "No active session" (if no session)

---

### Test 3: RESUME Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
Show me where I left off
```

**Expected Behavior:**
```yaml
intent_detected: resume
confidence: high
routes_to: session-resumer.md  # SOLID v5.0 (dedicated agent)
reason: "Pattern matches 'where I left off'"
session_check: loads_current_session
```

**Success Criteria:**
- ✅ Intent = RESUME
- ✅ Routes to session-resumer.md (NOT work-planner)
- ✅ Shows session progress summary

---

### Test 4: CORRECT Intent Detection (Highest Priority)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
Wrong file! The FAB button is in HostControlPanelContent.razor
```

**Expected Behavior:**
```yaml
intent_detected: correct
priority: highest  # Overrides all other intents
routes_to: error-corrector.md  # SOLID v5.0 (dedicated agent)
reason: "Pattern matches 'Wrong file!'"
action: halt_current_work
```

**Success Criteria:**
- ✅ Intent = CORRECT
- ✅ Routes to error-corrector.md (NOT code-executor)
- ✅ Halts current work immediately
- ✅ Applies correction before continuing

---

### Test 5: TEST Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
Create visual regression tests for the share button
```

**Expected Behavior:**
```yaml
intent_detected: test
confidence: high
routes_to: test-generator.md
reason: "Pattern matches 'visual regression tests'"
test_type: visual_regression
```

**Success Criteria:**
- ✅ Intent = TEST
- ✅ Routes to test-generator.md
- ✅ Identifies test type = visual regression

---

### Test 6: VALIDATE Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
Run all validations and show me the health status
```

**Expected Behavior:**
```yaml
intent_detected: validate
confidence: high
routes_to: health-validator.md
reason: "Pattern matches 'run all validations'"
scope: full_system_health
```

**Success Criteria:**
- ✅ Intent = VALIDATE
- ✅ Routes to health-validator.md
- ✅ Runs comprehensive health checks

---

### Test 7: ASK Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
How do I test canvas elements with Playwright?
```

**Expected Behavior:**
```yaml
intent_detected: ask
confidence: high
routes_to: knowledge-retriever.md
reason: "Pattern matches 'How do I'"
query_type: technical_question
```

**Success Criteria:**
- ✅ Intent = ASK
- ✅ Routes to knowledge-retriever.md
- ✅ Searches knowledge base

---

### Test 8: GOVERN Intent Detection

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
I updated the test-generator to support Percy visual testing
```

**Expected Behavior:**
```yaml
intent_detected: govern
confidence: high
routes_to: change-governor.md
reason: "Pattern matches 'I updated' + KDS file"
review_type: kds_modification
```

**Success Criteria:**
- ✅ Intent = GOVERN
- ✅ Routes to change-governor.md
- ✅ Reviews KDS changes

---

### Test 9: Multi-Intent Detection (PLAN + TEST)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
I want to add dark mode and create Percy visual tests for it
```

**Expected Behavior:**
```yaml
intents_detected:
  primary: plan
  secondary: test
confidence: high
routes_to: work-planner.md
planner_instructions: include_testing_phase
```

**Success Criteria:**
- ✅ Primary intent = PLAN
- ✅ Secondary intent = TEST
- ✅ Routes to work-planner.md
- ✅ Planner includes testing phase in plan

---

### Test 10: Ambiguous Intent (Ask for Clarification)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
do something
```

**Expected Behavior:**
```yaml
intent_detected: ambiguous
confidence: none
action: ask_for_clarification
suggestions:
  - "Continue current work? (execute)"
  - "Check progress? (resume)"
  - "Start new feature? (plan)"
```

**Success Criteria:**
- ✅ Detects ambiguity
- ✅ Does NOT route to agent
- ✅ Asks user for clarification
- ✅ Provides 3+ suggestions

---

### Test 11: EXECUTE Without Active Session (Error)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
continue
```

**Precondition:** No active session exists

**Expected Behavior:**
```yaml
intent_detected: execute
session_check: failed
error: "No active session found"
suggestion: "Start new work with 'I want to [feature]'"
routes_to: none
```

**Success Criteria:**
- ✅ Detects EXECUTE intent
- ✅ Checks for active session
- ✅ Shows error (not crash)
- ✅ Suggests alternative action

---

### Test 12: BRAIN Confidence-Based Routing (High Confidence)

**Precondition:** BRAIN has learned pattern "add a * button" → PLAN (0.95 confidence, 12 occurrences)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
add a logout button
```

**Expected Behavior:**
```yaml
brain_query: executed
confidence: 0.95
occurrences: 12
protection_check: passed
auto_route: true
routes_to: work-planner.md
routing_speed: < 0.5s  # Fast (BRAIN cached)
```

**Success Criteria:**
- ✅ Queries BRAIN before pattern matching
- ✅ High confidence detected (≥ 0.85)
- ✅ Minimum occurrences met (≥ 3)
- ✅ Auto-routes immediately
- ✅ Faster than pattern matching

---

### Test 13: BRAIN Confidence-Based Routing (Low Confidence - Fallback)

**Precondition:** BRAIN has no patterns for "refactor the database layer"

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
refactor the database layer
```

**Expected Behavior:**
```yaml
brain_query: executed
confidence: < 0.70
fallback: pattern_matching
intent_detected: plan  # Via traditional pattern matching
routes_to: work-planner.md
routing_speed: normal  # Slower (full pattern match)
```

**Success Criteria:**
- ✅ Queries BRAIN first
- ✅ Low confidence detected
- ✅ Falls back to pattern matching
- ✅ Still routes correctly

---

### Test 14: BRAIN Protection - Insufficient Data

**Precondition:** BRAIN pattern has high confidence (0.90) but only 2 occurrences

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
add sharing capabilities
```

**Expected Behavior:**
```yaml
brain_query: executed
confidence: 0.90  # High
occurrences: 2  # Below minimum (3)
protection_check: failed  # Insufficient data
fallback: pattern_matching
routes_to: work-planner.md
```

**Success Criteria:**
- ✅ Detects high confidence
- ✅ Checks minimum occurrences
- ✅ Rejects due to insufficient data
- ✅ Falls back to pattern matching

---

### Test 15: BRAIN Protection - Anomaly Detection

**Precondition:** BRAIN pattern jumps to 0.98 confidence after only 1 event (suspicious)

**Input:**
```markdown
#file:KDS/prompts/user/kds.md
implement quantum encryption
```

**Expected Behavior:**
```yaml
brain_query: executed
confidence: 0.98  # Suspiciously high
occurrences: 1  # Single event
anomaly_detected: true  # Confidence jump too fast
protection_action: downgrade_to_pattern_matching
warning: "Anomaly detected in BRAIN learning"
```

**Success Criteria:**
- ✅ Detects anomalous confidence
- ✅ Flags suspicious learning
- ✅ Downgrades to pattern matching
- ✅ Logs anomaly for review

---

## 🎯 Running the Tests

### Manual Execution

1. **Setup:**
   ```powershell
   # Ensure KDS is in known state
   cd "D:\PROJECTS\NOOR CANVAS"
   
   # Clear any active sessions (optional)
   Remove-Item KDS\sessions\current-session.json -ErrorAction SilentlyContinue
   ```

2. **Execute each test:**
   ```powershell
   # Test 1: PLAN intent
   # Type in GitHub Copilot Chat:
   #file:KDS/prompts/user/kds.md
   I want to add a share button to the canvas
   
   # Verify: Should route to work-planner.md
   ```

3. **Track results:**
   ```markdown
   Test 1: ✅ PASS (routed to work-planner)
   Test 2: ✅ PASS (routed to code-executor)
   Test 3: ❌ FAIL (routed to work-planner instead of session-resumer)
   ...
   ```

### Semi-Automated Execution

```powershell
# Run test script
.\KDS\tests\run-intent-router-tests.ps1 -Verbose

# Script will:
# - Show test input
# - Wait for you to execute
# - Validate routing decision
# - Generate pass/fail report
```

---

## ✅ Success Criteria (Overall)

**PASS Threshold: 90% (14/15 tests must pass)**

### Must Pass (Critical):
- ✅ Test 1-8: All 8 primary intents detected correctly (100%)
- ✅ Test 9: Multi-intent detection works
- ✅ Test 10: Ambiguity resolution works
- ✅ Test 11: Session validation works

### Should Pass (Quality):
- ✅ Test 12-13: BRAIN integration works
- ✅ Test 14-15: BRAIN protection works

### Metrics to Track:
- **Accuracy:** % of tests passed (target: ≥ 90%)
- **BRAIN Speed:** Routing time for high-confidence patterns (target: < 0.5s)
- **Protection Efficacy:** Anomalies caught (target: 100%)

---

## 📊 Reporting

### Generate Report

```powershell
.\KDS\tests\run-intent-router-tests.ps1 -GenerateReport

# Output: KDS/tests/reports/intent-router-test-YYYY-MM-DD-HHmmss.md
```

### Sample Report Format

```markdown
# Intent Router Test Report

**Date:** 2025-11-02 10:45:00  
**Version:** KDS v5.0  
**Tester:** Automated

## Results Summary

- **Total Tests:** 15
- **Passed:** 14 ✅
- **Failed:** 1 ❌
- **Accuracy:** 93% (PASS)

## Failed Tests

### Test 3: RESUME Intent Detection ❌

**Expected:** Routes to session-resumer.md  
**Actual:** Routed to work-planner.md  
**Issue:** SOLID v5.0 routing not updated in intent-router.md  
**Action:** Update intent-router.md line 234

## Performance Metrics

- **Average Routing Time:** 0.35s
- **BRAIN High-Confidence Routing:** 0.12s (65% faster)
- **Pattern Matching Fallback:** 0.48s

## Recommendations

1. Fix Test 3 routing (session-resumer.md)
2. Consider caching pattern matches for speed
3. Add more BRAIN training data (only 8 patterns learned)
```

---

## 🔄 Test Evolution Over Time

### Month 1 (Baseline)
- **Accuracy:** 87% (13/15 pass)
- **BRAIN Routing:** 0% (no patterns learned yet)
- **Avg Speed:** 0.48s

### Month 3 (Learning)
- **Accuracy:** 93% (14/15 pass)
- **BRAIN Routing:** 40% (6/15 tests use BRAIN)
- **Avg Speed:** 0.35s ⚡ (27% faster)

### Month 6 (Mature)
- **Accuracy:** 100% (15/15 pass) 🎯
- **BRAIN Routing:** 73% (11/15 tests use BRAIN)
- **Avg Speed:** 0.18s ⚡⚡ (62% faster)

**The test stays the same, but KDS gets smarter!** 🧠

---

## 🛠️ Troubleshooting

### Test Fails Unexpectedly

**Symptom:** Test that previously passed now fails

**Debugging:**
1. Check intent-router.md for recent changes
2. Verify BRAIN knowledge-graph.yaml hasn't been corrupted
3. Review events.jsonl for anomalies
4. Test with BRAIN disabled (pattern matching only)

### BRAIN Tests Fail

**Symptom:** Tests 12-15 (BRAIN-related) all fail

**Debugging:**
1. Verify KDS/kds-brain/knowledge-graph.yaml exists
2. Check if brain-query.md is loaded correctly
3. Ensure protection thresholds are configured
4. Test brain-query.md independently

### Routing Too Slow

**Symptom:** Routing takes > 1s consistently

**Possible Causes:**
1. BRAIN query overhead (check knowledge-graph.yaml size)
2. Pattern matching inefficient (too many patterns)
3. File I/O bottleneck (session loading)

**Fix:**
- Cache BRAIN queries
- Optimize pattern regex
- Use in-memory session storage for tests

---

**Intent Router Tests: Ensure KDS routing stays accurate!** 🎯

````
