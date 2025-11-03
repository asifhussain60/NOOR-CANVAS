# KDS Testing System - Complete Plan Summary

**Session ID:** kds-testing-system-2025-11-03  
**Created:** 2025-11-03T19:30:00Z  
**Status:** PLANNING  
**Total Estimate:** 31.25 hours  

---

## 📊 Executive Summary

Comprehensive testing system for KDS BRAIN, agents, and all system components. Designed with **simplicity first** - minimal complexity in user-facing prompts, detailed implementation in test suite.

**Core Philosophy:**
- ✅ Test-first approach for all components
- ✅ 3 foundational tests (brain integrity, intent routing, learning effectiveness)
- ✅ Unified test runner with quick/full modes
- ✅ Optional dashboard integration (Phase 5 - deferrable)
- ✅ Complete automation with Playwright
- ✅ Zero complexity added to kds.md (1 line max)

---

## 🎯 Plan Structure

### Phase 1: Foundation - BRAIN Integrity Test (4 hours)
**Goal:** Validate BRAIN files, structure, and data integrity

**Tasks:**
1. Create `test-brain-integrity.ps1` - File validation, FIFO queue check, confidence scores
2. Test with real KDS data - Verify against current healthy state
3. Create Playwright automation - Automated execution and result validation
4. Document usage - README with examples and troubleshooting

**Deliverables:**
- ✅ test-brain-integrity.ps1 (working, tested)
- ✅ Playwright automation test
- ✅ Test documentation

**Success Criteria:**
- All BRAIN files validated (JSON/YAML syntax)
- FIFO queue limit enforced (max 20 conversations)
- Confidence scores in valid range (0.50-1.00)
- Completes in < 10 seconds

---

### Phase 2: Intent Router Accuracy Test (6 hours)
**Goal:** Validate intent routing accuracy across all 8 intents

**Tasks:**
1. Create `test-intent-routing.ps1` - Router accuracy validation
2. Create test data - Canonical and variant phrases for all intents
3. Test with current knowledge graph - Validate accuracy >= 95%
4. Create Playwright automation - Automated validation
5. Update documentation - Add intent routing test section

**Deliverables:**
- ✅ test-intent-routing.ps1 (working, tested)
- ✅ intent-test-phrases.json (test data)
- ✅ Playwright automation test
- ✅ Updated documentation

**Success Criteria:**
- 8 canonical intent phrases tested
- 3+ variant phrases per intent
- Overall accuracy >= 95%
- Confidence >= 0.85 for all canonical phrases
- Completes in < 20 seconds

---

### Phase 3: BRAIN Learning Effectiveness Test (8.5 hours)
**Goal:** Validate BRAIN's ability to learn from events

**Tasks:**
1. Create `test-brain-learning.ps1` - Learning validation
2. Create synthetic event generator - Helper for test events
3. Test with backup/restore - No permanent BRAIN changes
4. Create Playwright automation - Automated learning validation
5. Update documentation - Add learning effectiveness section

**Deliverables:**
- ✅ test-brain-learning.ps1 (working, tested)
- ✅ New-SyntheticEvent.ps1 (helper)
- ✅ Playwright automation test
- ✅ Updated documentation

**Success Criteria:**
- Logs 10+ synthetic events
- Validates events processed count increases
- Validates pattern count maintained/increased
- Validates knowledge graph version increments
- No regression in confidence scores
- Completes in < 45 seconds with backup/restore

---

### Phase 4: Unified Test Runner (4 hours)
**Goal:** Single command to run all tests with multiple modes

**Tasks:**
1. Create `run-kds-tests.ps1` - Unified test suite runner
2. Add VS Code tasks - Quick and full mode tasks
3. Test unified runner - Verify all modes work
4. Create comprehensive documentation - Complete usage guide

**Deliverables:**
- ✅ run-kds-tests.ps1 (unified runner)
- ✅ VS Code tasks integration
- ✅ Complete test documentation

**Success Criteria:**
- Quick mode (skip learning test) < 30 seconds
- Full mode (all tests) < 60 seconds
- Aggregates results (pass/fail/skip counts)
- Color-coded output (green/yellow/red)
- JSON output option for programmatic use
- VS Code tasks work correctly

---

### Phase 5: Dashboard Integration - OPTIONAL (5 hours)
**Goal:** Run tests from KDS dashboard UI

**Tasks:**
1. Add test endpoint to API server - `/api/tests/run`
2. Add test button to dashboard - "🧪 Run KDS Tests"
3. Test end-to-end - Validate button → API → results flow
4. Create Playwright test - Automated dashboard test validation
5. Update dashboard documentation - Test feature docs

**Deliverables:**
- ✅ Dashboard API test endpoint
- ✅ Dashboard UI test button
- ✅ Playwright automation test
- ✅ Updated dashboard documentation

**Success Criteria:**
- Button triggers tests successfully
- Results display in < 35 seconds
- Pass/fail counts shown with color coding
- Error handling works (API down scenario)

**Note:** This phase is **OPTIONAL** - can be deferred if time-constrained

---

### Phase 6: Validation & Knowledge Graph Update (3.75 hours)
**Goal:** Final validation and BRAIN knowledge capture

**Tasks:**
1. Run complete validation - All tests pass with current KDS
2. Update knowledge graph - Add testing patterns
3. Log session completion - Events, conversation, session history
4. Update kds.md (minimal) - Single phrase: "run tests" → VALIDATE
5. Create implementation summary - Complete project documentation

**Deliverables:**
- ✅ Validated test suite
- ✅ Updated knowledge graph
- ✅ Session completion artifacts
- ✅ Implementation summary

**Success Criteria:**
- All tests pass
- Quick mode < 30 seconds
- Full mode < 60 seconds
- Knowledge graph updated with 3+ testing patterns
- kds.md updated (1 line max)
- Zero false positives/negatives

---

## 📁 Files Created (12 files)

```
KDS/tests/
├── test-brain-integrity.ps1
├── test-brain-integrity.spec.ts
├── test-intent-routing.ps1
├── test-intent-routing.spec.ts
├── test-brain-learning.ps1
├── test-brain-learning.spec.ts
├── run-kds-tests.ps1
├── test-dashboard-kds-tests.spec.ts
├── README.md
├── IMPLEMENTATION-SUMMARY.md
├── helpers/
│   └── New-SyntheticEvent.ps1
└── test-data/
    └── intent-test-phrases.json
```

---

## 📝 Files Modified (10 files)

```
.vscode/tasks.json                          # Add test runner tasks
KDS/scripts/dashboard-api-server.ps1        # Add /api/tests/run endpoint
KDS/kds-dashboard.html                      # Add "Run KDS Tests" button
KDS/dashboard/README.md                     # Document test feature
KDS/kds-brain/knowledge-graph.yaml          # Add testing patterns
KDS/prompts/user/kds.md                     # Add "run tests" intent (1 line)
KDS/sessions/current-session.json           # Track session progress
KDS/sessions/session-history.json           # Session completion
KDS/kds-brain/events.jsonl                  # Log testing events
KDS/kds-brain/conversation-history.jsonl    # Conversation boundary
```

---

## ✅ Acceptance Criteria (Global)

- [x] **Plan Created:** 6 phases, 29 tasks, complete acceptance criteria
- [ ] **Core Tests:** 3 foundational tests working (integrity, routing, learning)
- [ ] **Performance:** Quick mode < 30s, Full mode < 60s
- [ ] **Unified Runner:** Single command with clear pass/fail summary
- [ ] **VS Code Integration:** Tasks for quick and full test execution
- [ ] **Dashboard Integration:** Optional - working test button and API endpoint
- [ ] **Playwright Automation:** All tests automated for CI/CD
- [ ] **Documentation:** Complete README in KDS/tests/
- [ ] **Knowledge Graph:** Updated with testing patterns
- [ ] **Zero False Results:** No false positives or false negatives
- [ ] **Correct Exit Codes:** 0 = success, non-zero = failure count
- [ ] **Simple kds.md:** 1 line addition maximum

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| BRAIN updater integration complexity | Use backup/restore for test isolation, validate manually first |
| Intent router invocation in tests | Use similar pattern to existing test scripts, validate output structure |
| Dashboard API server conflicts | Use different port for tests or check port availability |
| Synthetic events corrupting production BRAIN | Tag synthetic events, clean up after tests, use backup/restore |

---

## 📌 Key Notes

1. **Phase 5 is optional** - Dashboard integration can be deferred
2. **Tests run independently** - Failure in one doesn't block others
3. **Playwright automation included** - All tests CI/CD ready
4. **Quick mode for pre-commit** - Fast validation before commits
5. **Full mode for weekly validation** - Comprehensive health check
6. **Documentation prioritizes action** - Actionable guidance over theory
7. **Keep kds.md simple** - Detailed docs in KDS/tests/README.md

---

## 🚀 Next Steps

**Immediate Action:** Begin Phase 1, Task 1.1

```powershell
# Create test-brain-integrity.ps1
# Location: KDS/tests/test-brain-integrity.ps1
# Validates: File existence, JSON/YAML syntax, FIFO queue, confidence scores
# Target: < 10 second execution time
```

**Ready to start implementation?**
- Yes → Create test-brain-integrity.ps1
- Need clarification → Ask questions
- Want to adjust plan → Identify changes

---

**Plan Status:** ✅ Complete and tracked in KDS BRAIN  
**Session File:** `KDS/sessions/kds-testing-system-session.json`  
**Current Session:** `KDS/sessions/current-session.json`  
**Events Logged:** 3 events in `KDS/kds-brain/events.jsonl`  
**Conversation Tracked:** `KDS/kds-brain/conversation-history.jsonl`
