# KDS Comprehensive System Test Prompt

**Version:** 1.0  
**Created:** 2025-11-02  
**Purpose:** Validate all KDS v5.0 SOLID capabilities, BRAIN learning, and architectural thinking  
**Status:** 🧪 Test Case for KDS System Validation

---

## 📋 Overview

This is a comprehensive test prompt designed to exercise every aspect of the KDS system in a single realistic scenario. It tests:

1. **Intent Detection & Routing** (8 intents)
2. **SOLID Architecture Compliance** (SRP, ISP, DIP, OCP)
3. **BRAIN System Learning** (knowledge graph, event logging, pattern recognition)
4. **Architectural Thinking Mandate** (pre-flight validation, pattern matching)
5. **Multi-Phase Planning** (planning → execution → testing → validation)
6. **Error Correction** (mid-execution corrections)
7. **Session Resumption** (context recovery after breaks)
8. **Abstraction Layer** (session-loader, test-runner, file-accessor)

---

## 🎯 Test Scenario: "PDF Export with Visual Tests"

**Fictional Feature Request:**
> "I want to add a PDF export feature to the canvas. When users click a button, it should export the current canvas content as a PDF with all questions and answers. The button should have a pulse animation when there are unsaved changes. Create visual regression tests to verify the button styling and the exported PDF preview."

### Why This Scenario?

This single request triggers:
- ✅ **PLAN** intent (new feature)
- ✅ **EXECUTE** intent (implementation)
- ✅ **TEST** intent (visual regression)
- ✅ **VALIDATE** intent (system health)
- ✅ **CORRECT** intent (deliberate mistake injection)
- ✅ **RESUME** intent (simulated break)
- ✅ **ASK** intent (mid-work question)
- ✅ **GOVERN** intent (if KDS rules are modified)

---

## 🧪 Test Execution Protocol

### Phase 0: Initial Setup (BRAIN Warm-up)

**Purpose:** Test BRAIN's ability to learn from architectural discovery

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

Analyze the existing component structure in the NOOR Canvas application. 
Where do button components typically live? How are export services organized?
```

**Expected KDS Behavior:**
1. ✅ Routes to **ASK** intent → knowledge-retriever.md
2. ✅ Queries **BRAIN** for existing patterns
3. ✅ Searches codebase for:
   - Component location patterns (`Components/Canvas/`, `Components/UI/`)
   - Service patterns (`Services/ExportService.cs`, etc.)
   - API controller patterns (`Controllers/API/`)
4. ✅ Logs **BRAIN event**: `architectural_query` with findings
5. ✅ Returns summary of architectural patterns

**BRAIN Validation:**
- Check `KDS/kds-brain/events.jsonl` for new event
- Verify event contains file paths and pattern relationships

**Success Criteria:**
- ✅ KDS identifies component locations without hardcoded assumptions
- ✅ BRAIN logs query event with codebase findings
- ✅ Response shows architectural awareness (not generic)

---

### Phase 1: Multi-Intent Planning (PLAN + TEST)

**Purpose:** Test intent router's ability to detect multiple intents and BRAIN's pattern matching

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

I want to add a PDF export feature to the canvas and create visual regression tests for it
```

**Expected KDS Behavior:**
1. ✅ Routes to **intent-router.md**
2. ✅ Detects **PRIMARY**: PLAN, **SECONDARY**: TEST
3. ✅ Queries **BRAIN** for:
   - Similar feature patterns (export features, button additions)
   - File relationship patterns (which files are modified together)
   - Test patterns (existing visual regression tests)
4. ✅ Routes to **work-planner.md** with TEST requirement noted
5. ✅ Creates multi-phase plan including:
   - Phase 0: Architectural Discovery (MANDATORY per Architectural Thinking Mandate)
   - Phase 1: Service layer implementation
   - Phase 2: Component creation
   - Phase 3: API endpoint
   - Phase 4: Visual regression tests (Percy)
   - Phase 5: Integration validation
6. ✅ Uses **session-loader** abstraction (DIP) to save plan
7. ✅ Logs **BRAIN event**: `plan_created` with intent combination

**Architectural Thinking Validation:**
- ✅ Plan includes "Phase 0: Architectural Discovery"
- ✅ File paths match existing conventions (not temporary/monolithic)
- ✅ No "refactoring phase" exists (architecture-aligned from start)
- ✅ Services, components, APIs in correct locations

**SOLID Validation:**
- ✅ **SRP**: work-planner.md only does planning (no execution)
- ✅ **ISP**: No mode switches (dedicated planner agent)
- ✅ **DIP**: Uses session-loader abstraction (not hardcoded file paths)

**BRAIN Validation:**
- ✅ events.jsonl contains `plan_created` event
- ✅ knowledge-graph.yaml updated with new intent pattern
- ✅ File relationships logged (services + components + APIs)

**Success Criteria:**
- ✅ Plan is architecturally sound (no refactoring needed)
- ✅ Test phase included automatically
- ✅ BRAIN learns the intent combination
- ✅ Session created via abstraction

---

### Phase 2: Execution Start (EXECUTE)

**Purpose:** Test code-executor isolation and test-first workflow

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

continue
```

**Expected KDS Behavior:**
1. ✅ Routes to **EXECUTE** intent → code-executor.md
2. ✅ Uses **session-loader** to retrieve active session
3. ✅ Queries **BRAIN** for:
   - Common mistakes in similar tasks
   - File dependencies (what files typically change together)
   - Test patterns for validation
4. ✅ Implements Phase 0 (Architectural Discovery):
   - Searches for existing export services
   - Identifies component patterns
   - Reviews API structure
5. ✅ Implements Phase 1 (Service):
   - Creates `PdfExportService.cs` in `Services/` (correct location from start)
   - Follows existing service patterns
   - Uses **test-runner** abstraction to run unit tests
6. ✅ Logs **BRAIN event**: `task_executed` with files modified

**SOLID Validation:**
- ✅ **SRP**: code-executor.md only executes (no correction logic)
- ✅ **DIP**: Uses test-runner abstraction (not hardcoded `dotnet test`)

**BRAIN Validation:**
- ✅ events.jsonl contains `task_executed` event
- ✅ File modification patterns logged
- ✅ Test execution results logged

**Success Criteria:**
- ✅ Files created in correct locations (no temp/placeholder)
- ✅ Tests run via abstraction
- ✅ BRAIN learns file co-modification patterns

---

### Phase 3: Mid-Execution Correction (CORRECT)

**Purpose:** Test error-corrector agent isolation and BRAIN's mistake learning

**Setup:** Wait for executor to start Phase 2 (Component creation)

**Deliberate Injection:**
Copilot should start creating `PdfExportButton.razor` in the wrong location (simulate common mistake)

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

Wrong location! PDF export buttons should be in Components/Canvas/, not Components/UI/
```

**Expected KDS Behavior:**
1. ✅ Routes to **CORRECT** intent → error-corrector.md (dedicated agent)
2. ✅ **HALTS** code-executor.md immediately
3. ✅ Queries **BRAIN** for:
   - Similar correction patterns
   - File location conventions
4. ✅ Performs correction:
   - Reverts changes to wrong location
   - Creates file in correct location
   - Updates session state via **session-loader**
5. ✅ Logs **BRAIN event**: `correction_applied` with:
   - Mistake type: FILE_LOCATION_MISMATCH
   - Incorrect path: `Components/UI/PdfExportButton.razor`
   - Correct path: `Components/Canvas/PdfExportButton.razor`
   - Correction reason: User feedback
6. ✅ Updates **knowledge-graph.yaml**:
   - Adds pattern: "Export buttons → Components/Canvas/"
   - Flags common mistake to prevent future occurrences

**SOLID Validation:**
- ✅ **SRP**: error-corrector.md handles ONLY corrections
- ✅ **ISP**: Dedicated correction agent (not executor in correction mode)
- ✅ **DIP**: Uses session-loader and file-accessor abstractions

**BRAIN Learning Validation:**
- ✅ events.jsonl contains `correction_applied` event
- ✅ knowledge-graph.yaml updated with mistake pattern
- ✅ Future similar tasks should warn: "Export buttons typically go in Components/Canvas/"

**Success Criteria:**
- ✅ Correction applied immediately
- ✅ Execution resumes from correct state
- ✅ BRAIN learns to prevent this mistake in future

---

### Phase 4: Session Interruption (RESUME)

**Purpose:** Test session-resumer agent and BRAIN's context recovery

**Setup:** 
1. Close conversation or start new chat (simulate day break)
2. Wait 5 minutes (simulate time passage)

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

where was I?
```

**Expected KDS Behavior:**
1. ✅ Routes to **RESUME** intent → session-resumer.md (dedicated agent)
2. ✅ Uses **session-loader** abstraction to find active sessions
3. ✅ Queries **BRAIN** for:
   - Recent activity patterns
   - Session context
   - Related file changes
4. ✅ Displays detailed progress:
   ```
   Session: pdf-export-feature
   Progress: 5/12 tasks (42%)
   
   📊 Detailed Progress:
   Phase 0: ✅ Complete (Architectural Discovery)
   Phase 1: ✅ Complete (PdfExportService.cs)
   Phase 2: 🔄 In Progress (2/3 tasks)
     ✅ Task 2.1: Component created (Components/Canvas/PdfExportButton.razor)
     ✅ Task 2.2: Pulse animation CSS added
     ⬜ Task 2.3: Wire up to service
   Phase 3: ⬜ Not started (API endpoint)
   Phase 4: ⬜ Not started (Visual tests)
   Phase 5: ⬜ Not started (Validation)
   
   📝 Recent Activity:
   - Correction applied: Component moved to correct location
   - BRAIN learned: Export buttons → Components/Canvas/
   
   Next: #file:KDS/prompts/user/kds.md continue
   ```
5. ✅ Logs **BRAIN event**: `session_resumed` with context

**SOLID Validation:**
- ✅ **SRP**: session-resumer.md handles ONLY resumption
- ✅ **ISP**: Dedicated agent (not planner in resume mode)
- ✅ **DIP**: Uses session-loader abstraction

**BRAIN Validation:**
- ✅ Context recovery includes learned patterns
- ✅ Shows correction history
- ✅ Suggests next action based on session state

**Success Criteria:**
- ✅ Accurate progress shown
- ✅ Context fully recovered
- ✅ Correction history included
- ✅ BRAIN insights shown

---

### Phase 5: Mid-Work Knowledge Query (ASK)

**Purpose:** Test knowledge-retriever and BRAIN's accumulated learnings

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

How do I test canvas PDF exports with Percy?
```

**Expected KDS Behavior:**
1. ✅ Routes to **ASK** intent → knowledge-retriever.md
2. ✅ Queries **BRAIN** for:
   - Percy test patterns
   - Canvas testing patterns
   - PDF testing patterns
3. ✅ Searches codebase for:
   - Existing Percy tests
   - Canvas-related tests
   - Test configurations
4. ✅ Returns comprehensive answer:
   - Existing Percy test examples
   - Canvas testing patterns
   - Recommended approach
   - BRAIN-learned patterns (if any Percy tests exist)
5. ✅ Suggests: "Ready to generate tests? Say 'continue' to proceed with Phase 4"

**BRAIN Validation:**
- ✅ Query leverages accumulated knowledge
- ✅ Answers incorporate learned patterns
- ✅ Suggests next action based on session context

**Success Criteria:**
- ✅ Answer is codebase-specific (not generic)
- ✅ BRAIN knowledge incorporated
- ✅ Context-aware suggestion provided

---

### Phase 6: Test Generation (TEST)

**Purpose:** Test test-generator agent and test-runner abstraction

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

continue
```

**Expected KDS Behavior:**
1. ✅ Routes to **EXECUTE** intent → code-executor.md
2. ✅ Recognizes Phase 4 is TEST phase
3. ✅ Delegates to **test-generator.md** specialist
4. ✅ test-generator.md:
   - Queries **BRAIN** for Percy test patterns
   - Uses **file-accessor** to read test templates
   - Creates visual regression test:
     ```typescript
     // Tests/UI/pdf-export-button-visual.spec.ts
     test('PDF export button styling', async ({ page }) => {
       await page.goto('/session/PQ9N5YWW');
       await percySnapshot(page, 'PDF Export Button - Default');
       await page.click('[data-testid="pdf-export-button"]');
       await percySnapshot(page, 'PDF Export Button - Active');
     });
     ```
   - Uses **test-runner** abstraction to execute Percy tests
5. ✅ Logs **BRAIN event**: `test_generated` with:
   - Test type: visual_regression
   - Framework: Percy
   - Feature: pdf-export
   - Files created

**SOLID Validation:**
- ✅ **SRP**: test-generator.md handles ONLY test creation
- ✅ **DIP**: Uses test-runner abstraction (not hardcoded `npx percy`)
- ✅ **OCP**: Easy to add new test types without modifying existing code

**BRAIN Validation:**
- ✅ Test patterns learned and reused
- ✅ Framework detection automatic
- ✅ Test execution logged

**Success Criteria:**
- ✅ Test created following existing patterns
- ✅ Test runs via abstraction
- ✅ Results logged to BRAIN

---

### Phase 7: System Validation (VALIDATE)

**Purpose:** Test health-validator agent and comprehensive system checks

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

validate everything
```

**Expected KDS Behavior:**
1. ✅ Routes to **VALIDATE** intent → health-validator.md
2. ✅ Queries **BRAIN** for:
   - Common validation failures
   - System health patterns
3. ✅ Runs comprehensive checks:
   - ✅ Build validation (`dotnet build`)
   - ✅ Unit tests (`dotnet test`)
   - ✅ Percy visual tests (`npx percy exec`)
   - ✅ Schema validation (if applicable)
   - ✅ Linting checks
4. ✅ Uses **test-runner** abstraction for all test executions
5. ✅ Generates health report:
   ```
   🎯 System Health Report
   
   ✅ Build: PASSED
   ✅ Unit Tests: 124/124 passed
   ✅ Visual Tests: 3/3 passed (0 diffs)
   ✅ Linting: PASSED
   ⚠️ Warnings: 2 unused imports
   
   📊 BRAIN Insights:
   - Similar features had 94% success rate
   - 0 corrections needed (architecture-aligned from start)
   - Pattern reuse: 3 existing patterns leveraged
   ```
6. ✅ Logs **BRAIN event**: `validation_complete` with results

**SOLID Validation:**
- ✅ **SRP**: health-validator.md handles ONLY validation
- ✅ **DIP**: Uses test-runner abstraction for all tests

**BRAIN Validation:**
- ✅ Validation results contribute to knowledge
- ✅ Success patterns logged
- ✅ Future validations informed by history

**Success Criteria:**
- ✅ All validations pass
- ✅ BRAIN insights included
- ✅ Abstract test runner used

---

### Phase 8: KDS Self-Modification (GOVERN)

**Purpose:** Test change-governor agent and KDS meta-awareness

**Setup:** Simulate KDS improvement suggestion

**Command:**
```markdown
#file:KDS/prompts/user/kds.md

I want to update the intent-router to better detect PDF export requests. 
When users say "export as PDF" or "download PDF", it should recognize this as a PLAN intent for export features.
```

**Expected KDS Behavior:**
1. ✅ Routes to **GOVERN** intent → change-governor.md
2. ✅ Queries **BRAIN** for:
   - Intent detection patterns
   - Routing accuracy metrics
   - Similar modifications
3. ✅ Analyzes proposed change:
   - ✅ Validates against KDS Rulebook
   - ✅ Checks for breaking changes
   - ✅ Assesses impact on existing sessions
4. ✅ Provides governance review:
   ```
   🛡️ KDS Governance Review
   
   Proposed Change: Add PDF export intent patterns
   Impact: Low (keyword addition, no structural change)
   
   ✅ Compliance Checks:
   - ✅ Follows SOLID principles
   - ✅ No breaking changes
   - ✅ Backward compatible
   - ✅ Improves intent detection accuracy
   
   📊 BRAIN Analysis:
   - Current detection rate: 78% for export features
   - Expected improvement: +15% accuracy
   - Similar patterns exist for "share", "download"
   
   Recommendation: APPROVED
   ```
5. ✅ Logs **BRAIN event**: `kds_modification_reviewed`

**SOLID Validation:**
- ✅ **SRP**: change-governor.md handles ONLY governance
- ✅ **OCP**: Validates that KDS remains open for extension

**BRAIN Validation:**
- ✅ Modification logged for future reference
- ✅ Impact prediction based on history
- ✅ Pattern library updated

**Success Criteria:**
- ✅ Governance review comprehensive
- ✅ BRAIN insights inform decision
- ✅ Modification approved/rejected with reasoning

---

## 📊 Test Success Metrics

### Primary Metrics

| Metric | Target | Validation |
|--------|--------|------------|
| **Intent Detection Accuracy** | 100% | All 8 intents routed correctly |
| **SOLID Compliance** | 100% | No SRP/ISP/DIP violations |
| **Architectural Alignment** | 100% | Zero refactoring phases in plans |
| **BRAIN Events Logged** | 8+ | Every major action logged |
| **Abstraction Usage** | 100% | No hardcoded paths/commands |
| **Session State Accuracy** | 100% | Resume shows exact state |
| **Test Execution** | 100% | All tests pass via abstraction |

### BRAIN Learning Metrics

| Learning Type | Expected Events | Validation |
|---------------|----------------|------------|
| **Intent Patterns** | 3+ | PLAN+TEST, CORRECT, ASK combinations |
| **File Relationships** | 5+ | Service+Component+API, Test patterns |
| **Mistake Patterns** | 1+ | File location correction |
| **Architectural Patterns** | 3+ | Component locations, service patterns |
| **Test Patterns** | 2+ | Percy visual, unit test patterns |

### SOLID Architecture Metrics

| Principle | Validation | Expected Outcome |
|-----------|------------|------------------|
| **SRP** | Agent role isolation | Each agent has ONE responsibility |
| **ISP** | No mode switches | Dedicated agents (no executor in correction mode) |
| **DIP** | Abstraction usage | session-loader, test-runner, file-accessor used |
| **OCP** | Extension ease | New intents/agents add without modifying existing |

---

## 🧠 BRAIN Validation Checklist

### Events to Verify in `KDS/kds-brain/events.jsonl`

```jsonl
{"type":"architectural_query","timestamp":"...","intent":"ask","patterns_found":["Components/Canvas/","Services/"]}
{"type":"plan_created","timestamp":"...","intent":"plan+test","phases":5,"files_estimated":7}
{"type":"task_executed","timestamp":"...","phase":1,"files":["Services/PdfExportService.cs"],"tests_run":true}
{"type":"correction_applied","timestamp":"...","mistake":"file_location","incorrect":"Components/UI/","correct":"Components/Canvas/"}
{"type":"session_resumed","timestamp":"...","progress":"5/12","context_recovered":true}
{"type":"test_generated","timestamp":"...","type":"visual_regression","framework":"percy"}
{"type":"validation_complete","timestamp":"...","result":"pass","warnings":2}
{"type":"kds_modification_reviewed","timestamp":"...","decision":"approved"}
```

### Knowledge Graph Updates to Verify in `KDS/kds-brain/knowledge-graph.yaml`

```yaml
intent_patterns:
  - pattern: "I want to add .* and create .* tests"
    primary_intent: plan
    secondary_intent: test
    confidence: 0.95
    examples: 3

file_relationships:
  - files: ["Services/PdfExportService.cs", "Components/Canvas/PdfExportButton.razor", "Controllers/API/PdfExportController.cs"]
    relationship: feature_implementation
    co_modification_frequency: 1.0

common_mistakes:
  - mistake: "Export buttons in Components/UI/"
    correction: "Export buttons in Components/Canvas/"
    occurrences: 1
    learned_from: user_correction
    
architectural_patterns:
  - pattern: "Export features"
    service_location: "Services/"
    component_location: "Components/Canvas/"
    api_location: "Controllers/API/"
    confidence: 1.0
```

---

## 🔄 Test Execution Instructions

### Automated Test Run

```powershell
# Run comprehensive KDS test
KDS\tests\run-comprehensive-test.ps1

# What it does:
# 1. Resets BRAIN state (soft reset)
# 2. Executes all 8 test phases
# 3. Validates BRAIN events
# 4. Checks knowledge graph updates
# 5. Verifies SOLID compliance
# 6. Generates test report
```

### Manual Test Run

1. **Prepare:**
   ```powershell
   # Soft reset BRAIN (optional - preserves logic, clears data)
   KDS\scripts\brain-reset.ps1 -Mode soft
   ```

2. **Execute Phases:** Copy/paste commands from each phase above

3. **Validate After Each Phase:**
   ```powershell
   # Check BRAIN events
   Get-Content .\KDS\kds-brain\events.jsonl | Select-Object -Last 5
   
   # Check knowledge graph
   Get-Content .\KDS\kds-brain\knowledge-graph.yaml
   ```

---

## 📈 Expected Evolution

### After 1st Test Run

**BRAIN should learn:**
- PDF export features involve Services + Components + APIs
- Visual regression tests needed for button features
- Components/Canvas/ is correct location for canvas-related UI

### After 5th Test Run (Different Features)

**BRAIN should predict:**
- When user says "add X feature", suggest architecturally-aligned approach
- Warn about common mistakes BEFORE they happen
- Auto-route complex intents with high confidence

### After 20th Test Run

**BRAIN should optimize:**
- Intent detection near-instant (high confidence routing)
- File location suggestions automatic
- Test patterns reused with minimal generation time
- Architectural violations prevented proactively

---

## 🎯 Success Definition

**This test is SUCCESSFUL if:**

1. ✅ **All 8 intents route correctly** (no mis-routing)
2. ✅ **Zero SOLID violations** (SRP, ISP, DIP, OCP maintained)
3. ✅ **BRAIN logs 8+ events** (learning from every action)
4. ✅ **knowledge-graph.yaml updated** (patterns learned)
5. ✅ **Architectural alignment 100%** (no refactoring phases)
6. ✅ **Session state perfect** (resume shows exact context)
7. ✅ **All abstractions used** (no hardcoded paths/commands)
8. ✅ **Tests pass via abstractions** (test-runner works)
9. ✅ **Correction works instantly** (error-corrector isolated)
10. ✅ **Governance prevents bad changes** (change-governor functional)

**This test is FAILED if:**

- ❌ Any intent mis-routed
- ❌ SOLID violation detected (mode switch, hardcoded dependency)
- ❌ BRAIN events missing or incomplete
- ❌ Plan includes "refactoring phase"
- ❌ Session state inaccurate on resume
- ❌ Hardcoded `dotnet test` or `npx percy` used (abstraction bypassed)

---

## 🔧 Maintenance

### When to Update This Test

**Update when:**
- ✅ New KDS intent added (add Phase 9)
- ✅ New abstraction added (validate in existing phases)
- ✅ BRAIN capabilities expanded (add validation checks)
- ✅ New agent added (create dedicated test phase)

### Test Self-Learning

**This test should evolve:**
- ✅ BRAIN learns optimal test execution patterns
- ✅ Test suggestions improve based on history
- ✅ Edge cases discovered and added
- ✅ Performance benchmarks track improvements

**See:** `#file:KDS/prompts/internal/brain-updater.md` for test evolution logic

---

## 📝 Notes

### Why This Test Is Comprehensive

1. **Covers ALL 8 intents** in realistic workflow
2. **Tests SOLID at every level** (agents, abstractions)
3. **Validates BRAIN learning** (events, knowledge graph)
4. **Exercises architectural thinking** (pre-flight validation)
5. **Simulates real-world usage** (corrections, interruptions)
6. **Tests meta-awareness** (KDS self-modification)

### Why This Test Is Realistic

- Real feature request developers would make
- Natural correction flow (users do correct Copilot)
- Session interruptions happen (breaks, new chats)
- Questions mid-work are common
- Multi-intent requests are frequent
- Governance reviews necessary for KDS evolution

### Future Enhancements

**Potential additions:**
- Performance benchmarking (execution time per phase)
- Multi-session concurrency test (2+ features simultaneously)
- Conflict resolution test (overlapping file modifications)
- BRAIN amnesia recovery test (restore from events.jsonl)
- Distributed team test (multiple developers, same session)

---

**Test Status:** Ready for Execution  
**Next Step:** Run test and validate all success criteria  
**Estimated Duration:** 30-45 minutes (manual), 10 minutes (automated)
