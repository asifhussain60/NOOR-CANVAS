# Work Log: test-metadata

**Key:** `test-metadata`  
**Status:** Active  
**Created:** 2025-10-31

---

## Session: 2025-10-31 (Test Reverse-Engineering Metadata - Phase 0 Complete)

**Action:** Establishing KDS foundation for Test Reverse-Engineering Metadata pattern  
**Status:** Phase 0 - KDS Governance Updates (COMPLETE)  
**Context:** Enable automated Playwright test generation from production code by embedding structured metadata comments in UI/API files

**Objective:**
Reduce test creation time by 70% through automated metadata extraction, eliminate manual log analysis, and establish Session 212 as canonical test data reference.

**Phase 0 Deliverables (COMPLETED):**
- ✅ Updated kds-rulebook.md - Added Rule #2b with full specification
- ✅ Updated kds-rulebook.json - Added testMetadata sub-rule schema + ValidateTestMetadata function
- ✅ Updated document-first/rule.md - Added Step 2b with template and examples
- ✅ Created test-metadata.plan.md - 6-phase implementation plan
- ✅ Created 6 handoff JSON files for phase execution

**Remaining Work:**
- ⏳ Phase 1: Update task.prompt.md (Step 6.5 - auto-generation)
- ⏳ Phase 2: Update test-generation.prompt.md (Step 1.5 - metadata loading)
- ⏳ Phase 3: Update healthcheck.prompt.md (metadata completeness scan)
- ⏳ Phase 4: Update route.prompt.md (reverse-engineer route)
- ⏳ Phase 5: Enhance PlaywrightQuickRef.md (Session 212 canonical data)
- ⏳ Phase 6: Reverse-engineer 4 pilot files

**Next:** User approval to execute Phase 1-6 (sequential or E2E)

---

## Governance Updates (Rule #2b)

**Rule #2b Statement:**
All Razor components, controllers, and SignalR hubs MUST include structured PLAYWRIGHT TEST METADATA comments with API routes, database connections, test data, and selectors for automated test generation.

**Key Components:**

1. **Metadata Structure:**
   - Component name and KDS key
   - Test scenarios (3-7 items)
   - API routes (method + endpoint + stored procedure + database)
   - Database connections (DbContext + database + tables)
   - Test data (Session 212 tokens/IDs)
   - SignalR hubs (endpoint + connection groups)
   - Expected flow (step-by-step user journey)
   - Playwright selectors (data-testid attributes)
   - Related test files (existing + planned)

2. **Trigger Modes:**
   - **Automatic:** task.prompt.md detects UI/API file creation → auto-generates metadata
   - **Manual:** `@workspace /route key=reverse-engineer request="Add metadata to {file}"`
   - **Validation:** `@workspace /healthcheck` scans for missing metadata

3. **Benefits:**
   - Reverse-engineering: Automated Playwright test generation
   - API discovery: Quick reference for all endpoints
   - Database mapping: Clear UI → API → Database connections
   - Test data centralization: Session 212 as canonical reference
   - Selector consistency: Enforces data-testid usage

**Validation Function:** `ValidateTestMetadata()`

---

## Implementation Plan Summary

**6-Phase Execution:**

**Phase 1:** Update task.prompt.md - Add Step 6.5 (auto-generate metadata during code implementation)  
**Phase 2:** Update test-generation.prompt.md - Add Step 1.5 (load metadata before generating tests)  
**Phase 3:** Update healthcheck.prompt.md - Add metadata completeness scan  
**Phase 4:** Update route.prompt.md - Add reverse-engineer route handler  
**Phase 5:** Enhance PlaywrightQuickRef.md - Document Session 212 canonical test data  
**Phase 6:** Reverse-engineer 4 pilot files - Apply metadata to HostControlPanel, TranscriptCanvas, SessionOpener, CanvasHub

**Execution Options:**
- **A. SEQUENTIAL** (recommended) - Execute phase-by-phase with validation checkpoints
- **B. E2E** - Execute all 6 phases in single session (faster but higher risk)

---

## Success Metrics

**Quantitative:**
- ✅ Rule #2b added to KDS rulebook (governance complete)
- ⏳ 4 prompt files updated (task, test-generation, healthcheck, route)
- ⏳ 1 documentation file enhanced (PlaywrightQuickRef.md)
- ⏳ 4 pilot files reverse-engineered
- ⏳ 8-12 Playwright tests identified as automatable

**Qualitative:**
- ✅ KDS governance established for test metadata pattern
- ⏳ Test creation time reduced by 70% (after full implementation)
- ⏳ Session 212 established as canonical test data reference
- ⏳ Reverse-engineering workflow functional
- ⏳ Healthcheck validates metadata completeness
- ⏳ Future UI/API code auto-generates metadata

---

## Related Files

**Governance (UPDATED):**
- `.github/governance/kds-rulebook.md` - Rule #2b specification ✅
- `.github/governance/kds-rulebook.json` - testMetadata schema ✅
- `.github/instructions/rules/document-first/rule.md` - Step 2b workflow ✅

**Plan (CREATED):**
- `.github/key-data-streams/test-metadata/test-metadata.plan.md` - 6-phase implementation plan ✅

**Handoffs (CREATED):**
- `.github/key-data-streams/test-metadata/handoffs/phase-1-update-task-prompt.json` ✅
- `.github/key-data-streams/test-metadata/handoffs/phase-2-update-test-generation.json` ✅
- `.github/key-data-streams/test-metadata/handoffs/phase-3-update-healthcheck.json` ✅
- `.github/key-data-streams/test-metadata/handoffs/phase-4-update-route.json` ✅
- `.github/key-data-streams/test-metadata/handoffs/phase-5-enhance-playwright-quickref.json` ✅
- `.github/key-data-streams/test-metadata/handoffs/phase-6-pilot-reverse-engineering.json` ✅

**Prompts (TO BE UPDATED):**
- `.github/prompts/task.prompt.md` - Phase 1
- `.github/prompts/test-generation.prompt.md` - Phase 2
- `.github/prompts/healthcheck.prompt.md` - Phase 3
- `.github/prompts/route.prompt.md` - Phase 4

**Documentation (TO BE UPDATED):**
- `.github/instructions/Links/PlaywrightQuickRef.md` - Phase 5

**Pilot Files (TO BE REVERSE-ENGINEERED):**
- `SPA/NoorCanvas/Components/Pages/Host-HostControlPanel.razor` - Phase 6
- `SPA/NoorCanvas/Components/Pages/Participant-TranscriptCanvas.razor` - Phase 6
- `SPA/NoorCanvas/Components/Pages/Host-SessionOpener.razor` - Phase 6
- `SPA/NoorCanvas/Hubs/CanvasHub.cs` - Phase 6

---

**Session Complete:** Phase 0 (KDS Governance Updates)  
**Next Action:** User approval to proceed with Phase 1-6

---

## Session: 2025-10-31 (Rule #2b Enforcement - GOVERNANCE COMPLETE)

**Action:** Officially enforcing Rule #2b as mandatory KDS governance rule  
**Status:** Governance Enforcement (COMPLETE)  
**Context:** User requested `/kds add rule: test reverse engineering metadata in current context`

**Deliverables (COMPLETED):**
- ✅ Updated kds-rulebook.md v1.2.1 - Added Rule #2b to Quick Reference, updated enforcement count to 14 rules
- ✅ Updated kds-rulebook.json v1.2.1 - Added Test Metadata First to core principles, updated enforcement list
- ✅ Version history updated in both files
- ✅ Rule #2b officially promoted from "planned" to "enforced" status

**Changes:**

**kds-rulebook.md:**
```diff
+ Version: 1.2.1 (was 1.1.1)
+ Quick Reference > Core Principles:
+   - Test Metadata First - UI/API files include PLAYWRIGHT TEST METADATA for reverse-engineering (Rule #2b)
+ Quick Reference > Enforcement:
+   - 14 Rules (was 13 Rules)
+   - Test Metadata - ValidateTestMetadata() scans UI/API files for PLAYWRIGHT TEST METADATA blocks
+ Version History:
+   v1.2.1: ENFORCED Rule #2b - Test Reverse-Engineering Metadata now mandatory
```

**kds-rulebook.json:**
```diff
+ version: "1.2.1" (was "1.2.0")
+ quickReference.corePrinciples[2]: "Test Metadata First..." (new entry)
+ quickReference.enforcement[0]: "14 Rules" (was "13 Rules")
+ quickReference.enforcement[3]: "Test Metadata - ValidateTestMetadata()..." (new entry)
+ versionHistory[0]: v1.2.1 enforcement entry
```

**Impact:**
- Rule #2b now appears in Quick Reference (high visibility)
- All UI/API files (.razor, Controllers/*.cs, Hubs/*.cs) MUST include PLAYWRIGHT TEST METADATA
- ValidateTestMetadata() function now part of validation suite
- Enforcement aligned with existing document-first workflow

**Next:** Proceed with reverse-engineering 6 target files (HostControlPanel, TranscriptCanvas, SessionCanvas, UserLanding, SessionOpener, CanvasHub)

---

**Created:** 2025-10-31  
**Last Updated:** 2025-10-31  
**Key:** `test-metadata`
