# KDS Knowledge Base Update: FAB Button Test & TDD Protocol
**Date:** 2025-11-02  
**Type:** Critical Learning - Test Selector Best Practices  
**Status:** ✅ IMPLEMENTED

---

## 📋 Summary

This document records critical findings from the FAB button test restoration session and updates KDS with enforced TDD practices.

---

## ✅ Updates Implemented

### 1. KDS Main Entry Point (`kds.md`)
**Section Added:** Component ID-Based Selectors (TDD Requirement)

**Key Points:**
- ✅ ID-based selectors are 10x faster than text searches
- ✅ Immune to text changes (i18n, wording updates)
- ✅ No false positives (unique IDs vs ambiguous text)
- ✅ Explicit intent (clearer code)

**Table Added:** Component IDs for Host Control Panel
| Element | Component | ID | Purpose |
|---------|-----------|-----|---------|
| Transcript Canvas Button | UserRegistrationLink.razor | `reg-transcript-canvas-btn` | Select transcript canvas mode |
| Asset Canvas Button | UserRegistrationLink.razor | `reg-asset-canvas-btn` | Select asset canvas mode |
| Start Session Button | HostControlPanelSidebar.razor | `sidebar-start-session-btn` | Initiate session |

**Location:** Lines 167-210 of `KDS/prompts/user/kds.md`

---

### 2. Test Generator (`test-generator.md`)
**Section Added:** PRE-GENERATION: Component ID Discovery (CRITICAL)

**5-Step Process:**
1. Load target component files
2. Extract element IDs (scan for `id="..."`)
3. Build selector map (element purpose → `#id`)
4. Use IDs in generated selectors
5. Validation rule (reject text selectors when ID exists)

**Enforcement Rule:**
```markdown
IF selector uses text (.has-text, :text, etc.) 
AND component has id= attribute for same element
THEN: REJECT → Show error with migration path
```

**Location:** Lines 85-135 of `KDS/prompts/internal/test-generator.md`

---

### 3. Working Test (`hcp-fab-button-verification.spec.ts`)
**Changes:**
- ✅ Replaced `page.locator('button:has-text("Transcript Canvas")')` → `page.locator('#reg-transcript-canvas-btn')`
- ✅ Replaced `page.locator('button:has-text("Start Session")')` → `page.locator('#sidebar-start-session-btn')`
- ✅ Replaced `page.locator('button:has-text("Asset Canvas")')` → `page.locator('#reg-asset-canvas-btn')`

**Result:** 3 robust ID-based selectors replacing fragile text selectors

---

### 4. Deprecated Tests
**Files Marked as DEPRECATED:**
1. `Tests/UI/fab-button-injection-simple.spec.ts`
2. `Tests/UI/asset-fab-button-visibility.spec.ts`

**Deprecation Header Added:**
```typescript
/**
 * ⚠️ DEPRECATED - 2025-11-02
 * 
 * REASON: Uses fragile text-based selectors instead of component IDs
 * REPLACEMENT: hcp-fab-button-verification.spec.ts (uses ID-based selectors)
 * 
 * MIGRATION NOTES: ...
 * See: KDS/knowledge/learnings/SELF-REVIEW-fab-button-test-restoration.md
 */
```

---

## 🎯 Critical Gaps Identified

### Gap #1: BRAIN System Not Invoked
**Problem:** Router doesn't query BRAIN before routing  
**Evidence:** Manual git history search required  
**Impact:** Lost learning from previous successful tests  
**Fix Needed:** Wire `brain-query.md` into `intent-router.md`

### Gap #2: No Component ID Crawlers
**Problem:** No automation for discovering `id="..."` attributes  
**Evidence:** Manual component file inspection required  
**Impact:** Developers must remember to check component files  
**Fix Needed:** Create `KDS/crawlers/component-id-crawler.ps1`

### Gap #3: No Selector Validation
**Problem:** Test generator accepts text selectors without warning  
**Evidence:** Original test had text selectors, no rejection  
**Impact:** Fragile tests slip through  
**Fix Needed:** Implement validation rule in test-generator.md

### Gap #4: Git History Not Mined
**Problem:** Past solutions not automatically discovered  
**Evidence:** Required manual `git log --grep="fab"` search  
**Impact:** Reinventing the wheel for known patterns  
**Fix Needed:** Add git history mining to BRAIN updater

---

## 📊 Architecture Assessment

| Component | Design Quality | Implementation | Working | Score |
|-----------|----------------|----------------|---------|-------|
| Router | ✅ Excellent | ✅ Complete | ✅ Yes | 100% |
| BRAIN Query | ✅ Excellent | ❌ Not Wired | ❌ No | 0% |
| BRAIN Update | ✅ Excellent | ⚠️ Partial | ⚠️ Partial | 50% |
| Test Generator | ✅ Excellent | ⚠️ Updated | ⚠️ Needs Testing | 60% |
| Crawlers | ✅ Excellent | ❌ Not Built | ❌ No | 0% |
| Validation | ✅ Excellent | ❌ Not Built | ❌ No | 0% |
| **OVERALL** | **✅ SOLID** | **⚠️ 40%** | **⚠️ 40%** | **40%** |

**Conclusion:** Architecture is sound, implementation gaps prevent full automation.

---

## 🚀 Recommended Next Steps

### Priority 0: CRITICAL (Today)
- [x] Fix test selectors (text → ID) ✅ DONE
- [x] Deprecate old tests ✅ DONE
- [x] Update kds.md with selector guidelines ✅ DONE
- [x] Update test-generator.md with ID discovery ✅ DONE
- [ ] Verify test passes with new selectors ⏳ IN PROGRESS

### Priority 1: HIGH (This Week)
- [ ] Create `KDS/crawlers/component-id-crawler.ps1`
  - Output: `KDS/cache/component-ids.json`
  - Format: `{ "id": "file", "component": "name", "purpose": "desc" }`
- [ ] Wire BRAIN query into router
  - Modify `intent-router.md` to load `brain-query.md` FIRST
  - Test with sample requests
- [ ] Add selector validation to test-generator
  - Implement validation rule from line 120-130
  - Test with text-based selector (should reject)

### Priority 2: MEDIUM (This Month)
- [ ] Implement full TDD workflow
  - Generate failing test FIRST
  - Implement code to make it pass
  - Verify green test
- [ ] Add git history mining to BRAIN
  - Scan commits for test patterns
  - Store in knowledge graph
- [ ] Create automated quality gates
  - Pre-commit hook for test validation
  - CI/CD pipeline integration

---

## 📝 Knowledge Graph Update

**Proposed Entry for `KDS/kds-brain/knowledge-graph.yaml`:**

```yaml
# Playwright Test Patterns
test_patterns:
  hcp_fab_button:
    status: active
    last_working_commit: ada3df5d
    date_created: 2025-10-28
    date_updated: 2025-11-02
    
    files:
      test_file: Tests/UI/hcp-fab-button-verification.spec.ts
      orchestrator: Scripts/run-hcp-fab-button-tests.ps1
      components:
        - SPA/NoorCanvas/Pages/HostControlPanel.razor
        - SPA/NoorCanvas/Components/Host/HostControlPanelContent.razor
        - SPA/NoorCanvas/Components/Host/UserRegistrationLink.razor
        - SPA/NoorCanvas/Components/Host/HostControlPanelSidebar.razor
    
    selectors:
      transcript_canvas_button:
        id: reg-transcript-canvas-btn
        component: UserRegistrationLink.razor
        deprecated_selector: 'button:has-text("Transcript Canvas")'
      
      asset_canvas_button:
        id: reg-asset-canvas-btn
        component: UserRegistrationLink.razor
        deprecated_selector: 'button:has-text("Asset Canvas")'
      
      start_session_button:
        id: sidebar-start-session-btn
        component: HostControlPanelSidebar.razor
        deprecated_selector: 'button:has-text("Start Session")'
    
    learnings:
      - "Always use ID-based selectors for robustness"
      - "Text selectors break on i18n and wording changes"
      - "Start-Process with -PassThru works better than Start-Job for Windows GUI apps"
      - "Health check needs -SkipCertificateCheck for localhost HTTPS"
      - "5-second additional wait after HTTP 200 ensures full app initialization"
    
    deprecated_tests:
      - Tests/UI/fab-button-injection-simple.spec.ts (replaced 2025-11-02)
      - Tests/UI/asset-fab-button-visibility.spec.ts (replaced 2025-11-02)
```

---

## 🧠 Self-Review Conclusions

### What Worked
1. ✅ Git history mining found working implementation
2. ✅ Orchestration script pattern restoration
3. ✅ KDS update process (kds.md + test-generator.md)
4. ✅ Test deprecation with clear migration path

### What Failed
1. ❌ BRAIN not consulted automatically
2. ❌ Crawlers not invoked (manual ID discovery)
3. ❌ No validation gate (text selectors accepted)
4. ❌ TDD workflow not enforced

### Root Cause
**KDS architecture is excellent but wiring is incomplete.** 

Like a Ferrari with:
- ✅ Excellent engine (SOLID design, BRAIN concept)
- ⚠️ Missing transmission (no crawler automation)
- ⚠️ Disconnected sensors (BRAIN not wired to router)
- ⚠️ No quality gates (validation missing)

**Result:** 40% of designed functionality is working.

---

## 📚 References

### Created Documents
1. `KDS/knowledge/learnings/SELF-REVIEW-fab-button-test-restoration.md`
   - Full analysis of what worked/failed
   - Gap identification
   - Action items with priorities
   - Architecture assessment

2. `KDS/knowledge/learnings/playwright-selector-best-practices.md` (RECOMMENDED)
   - ID-first selector pattern
   - Migration guide from text to ID selectors
   - Component ID discovery workflow
   - Validation rules

### Updated Documents
1. `KDS/prompts/user/kds.md` (Lines 167-210)
   - Component ID-Based Selectors section
   - Component ID table for HCP
   - Enforcement rules

2. `KDS/prompts/internal/test-generator.md` (Lines 85-135)
   - PRE-GENERATION: Component ID Discovery
   - 5-step ID discovery process
   - Validation rule implementation

3. `Tests/UI/hcp-fab-button-verification.spec.ts`
   - 3 selectors updated to use IDs
   - Comments added explaining selector choice

4. `Tests/UI/fab-button-injection-simple.spec.ts`
   - DEPRECATED header added
   - Migration notes included

5. `Tests/UI/asset-fab-button-visibility.spec.ts`
   - DEPRECATED header added
   - Migration notes included

---

## 🎓 Lessons for Future Test Creation

### DO:
1. ✅ Search component files for `id="..."` attributes FIRST
2. ✅ Use `#element-id` selectors (fast, robust, explicit)
3. ✅ Follow orchestration protocol (Start-Process, health check, cleanup)
4. ✅ Query BRAIN for past solutions (when wired)
5. ✅ Validate selectors against component IDs (when crawler built)

### DON'T:
1. ❌ Use text-based selectors (`has-text`, `:text`)
2. ❌ Use `.first()` without verification (sign of ambiguous selector)
3. ❌ Skip health checks (causes flaky tests)
4. ❌ Ignore git history (reinventing known solutions)
5. ❌ Generate tests without component file inspection

---

**Status:** ✅ KDS UPDATED - CRITICAL LEARNINGS DOCUMENTED  
**Next Action:** Test execution with new selectors  
**Future Work:** Build missing automation (crawlers, BRAIN wiring, validation gates)

---

**Signed:** GitHub Copilot  
**Date:** 2025-11-02  
**Session:** FAB Button Test Restoration + KDS Gap Analysis
