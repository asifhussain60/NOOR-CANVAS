# Test Reverse-Engineering Metadata Enhancement Plan

**Key:** `test-metadata`  
**Status:** Ready for Execution  
**Created:** 2025-10-31  
**Version:** 1.0.0

---

## 🎯 Executive Summary

**Goal:** Establish Test Reverse-Engineering Metadata pattern to enable automated Playwright test generation from production code by embedding structured metadata comments in UI/API files.

**Impact:** Reduces test creation time by 70% through automated metadata extraction, eliminates manual log analysis, and establishes Session 212 as canonical test data reference.

**Completion Criteria:**
- ✅ Rule #2b added to KDS rulebook (kds-rulebook.md + kds-rulebook.json)
- ✅ document-first/rule.md updated with Step 2b
- ⏳ task.prompt.md updated with Step 6.5 (auto-generation logic)
- ⏳ test-generation.prompt.md updated with Step 1.5 (metadata loading)
- ⏳ healthcheck.prompt.md updated with metadata completeness scan
- ⏳ route.prompt.md updated with reverse-engineer key handler
- ⏳ PlaywrightQuickRef.md enhanced with Session 212 canonical data
- ⏳ 4 pilot files reverse-engineered (HostControlPanel, TranscriptCanvas, SessionOpener, CanvasHub)

---

## 📊 Current Status

### Completed (Phase 0)
- ✅ kds-rulebook.md - Added Rule #2b with full specification
- ✅ kds-rulebook.json - Added testMetadata sub-rule schema + ValidateTestMetadata function
- ✅ document-first/rule.md - Added Step 2b with template and examples

### Remaining Work
- ⏳ Update 4 prompt files (task, test-generation, healthcheck, route)
- ⏳ Enhance PlaywrightQuickRef.md
- ⏳ Reverse-engineer 4 pilot files

---

## 🗺️ Implementation Phases

### Phase 1: Prompt Integration (task.prompt.md)
**Goal:** Auto-generate test metadata during code implementation

**Deliverables:**
1. Add Step 6.5: Generate Test Metadata Comments
   - Location: After Step 6 (code generation), before Step 7 (test validation)
   - Trigger: Detect UI/API file creation (`.razor`, `Controllers/*.cs`, `Hubs/*.cs`)
   - Actions:
     * Scan code for API routes (HTTP verbs, endpoints)
     * Scan code for database operations (DbContext, LINQ, stored procedures)
     * Scan code for SignalR usage (Hub inheritance, connection groups)
     * Load Session 212 test data from PlaywrightQuickRef.md
     * Generate PLAYWRIGHT TEST METADATA block
     * Insert at top of file (after usings/imports)

2. Validation checkpoint
   - Verify metadata block inserted
   - Verify all required fields populated
   - Warn if Session 212 data not used

**Acceptance Criteria:**
- ✅ Step 6.5 executes after every UI/API file creation
- ✅ Metadata block contains all required fields (Component, Key, Test Scenarios, etc.)
- ✅ Metadata references Session 212 test data
- ✅ Metadata inserted at correct location (after usings/imports)

---

### Phase 2: Test Generation Integration (test-generation.prompt.md)
**Goal:** Load metadata from source files before generating tests

**Deliverables:**
1. Add Step 1.5: Load Test Metadata from Source Files
   - Location: After Step 1 (loading test data), before Step 2 (generating test structure)
   - Actions:
     * Search for target file's PLAYWRIGHT TEST METADATA block
     * Extract API routes, database connections, test data
     * Extract SignalR hubs, expected flow, selectors
     * Use metadata to auto-populate test structure
     * Validate metadata completeness (warn if missing fields)

2. Auto-population logic
   - API routes → generate API call assertions
   - Database connections → generate database state verification
   - SignalR hubs → generate connection and broadcast tests
   - Selectors → generate UI interaction steps
   - Expected flow → generate test step structure

**Acceptance Criteria:**
- ✅ test-generation loads metadata before creating test
- ✅ Test structure auto-populated from metadata
- ✅ Warning displayed if metadata incomplete
- ✅ Test references same Session 212 data as metadata

---

### Phase 3: Healthcheck Integration (healthcheck.prompt.md)
**Goal:** Scan codebase for missing/incomplete test metadata

**Deliverables:**
1. Add Test Metadata Completeness Scan
   - Location: New scan section (after existing health checks)
   - Actions:
     * Scan all `.razor`, `Controllers/*.cs`, `Hubs/*.cs` files
     * For each file, check for testable code patterns:
       - HttpClient usage (API calls)
       - DbContext usage (database operations)
       - Hub inheritance (SignalR)
       - [HttpGet]/[HttpPost] attributes
     * If testable patterns found, verify PLAYWRIGHT TEST METADATA block exists
     * If metadata missing, report violation with suggested fix
     * If metadata incomplete, report missing fields

2. Violation reporting
   - Missing metadata: `@workspace /route key=reverse-engineer request="Add test metadata to {file}"`
   - Incomplete metadata: List missing fields
   - Outdated test data: Suggest updating to Session 212

**Acceptance Criteria:**
- ✅ Healthcheck scans all testable files
- ✅ Reports missing metadata with fix commands
- ✅ Reports incomplete metadata with missing fields
- ✅ Warns about outdated test data (non-Session 212)

---

### Phase 4: Route Integration (route.prompt.md)
**Goal:** Add reverse-engineer route for manual metadata generation

**Deliverables:**
1. Add reverse-engineer route handler
   - Key: `reverse-engineer`
   - Target: `task.prompt.md` (metadata generation only, no code changes)
   - Handoff: `reverse-engineer-metadata.json`
   
2. Reverse-engineering workflow
   - Parse user request (extract file path)
   - Load file contents
   - Scan for API routes (regex patterns for HTTP verbs, endpoints)
   - Scan for database operations (regex patterns for DbContext, LINQ)
   - Scan for SignalR usage (regex patterns for Hub, connection groups)
   - Load Session 212 test data from PlaywrightQuickRef.md
   - Generate PLAYWRIGHT TEST METADATA block
   - Insert at top of file (after usings/imports)
   - Update test-registry.md (link to existing tests or mark as planned)

**Acceptance Criteria:**
- ✅ `@workspace /route key=reverse-engineer request="Add metadata to {file}"` works
- ✅ Metadata generated from code analysis
- ✅ Session 212 test data loaded and inserted
- ✅ Metadata inserted at correct location
- ✅ Test registry updated

---

### Phase 5: PlaywrightQuickRef Enhancement
**Goal:** Document Session 212 as canonical test data reference

**Deliverables:**
1. Create/enhance `.github/instructions/Links/PlaywrightQuickRef.md`
   - Document Session 212 test scenario
   - List all test data elements:
     * Session ID: 212
     * Session Title: "Peter Parker session"
     * Host Token: KJAHA99L
     * Participant Token: PQ9N5YWW
     * Album ID: 1 (Group 1)
     * Category ID: 2 (Category for Group 1)
     * Database connections (KSESSIONS, canvas)
     * SignalR connection groups (session-212)
   
2. Test flow documentation
   - Host authentication flow
   - Participant registration flow
   - Waiting room entry
   - Transcript canvas load
   - Bi-directional SignalR broadcast

**Acceptance Criteria:**
- ✅ PlaywrightQuickRef.md contains complete Session 212 data
- ✅ All test data elements documented
- ✅ Test flow documented step-by-step
- ✅ Referenced in all PLAYWRIGHT TEST METADATA blocks

---

### Phase 6: Pilot Reverse-Engineering
**Goal:** Apply metadata to 4 existing files as proof-of-concept

**Deliverables:**
1. **File 1: HostControlPanel.razor**
   - Add PLAYWRIGHT TEST METADATA block
   - Document API routes (/api/host/albums, /api/host/categories, /api/host/sessions)
   - Document database connections (KSESSIONS, canvas)
   - Document test data (Session 212 tokens/IDs)
   - Document selectors (album-dropdown, category-dropdown, session-dropdown)

2. **File 2: TranscriptCanvas.razor**
   - Add PLAYWRIGHT TEST METADATA block
   - Document API routes (/api/participant/validate-token, /api/questions/submit)
   - Document SignalR hub (/hubs/canvas)
   - Document test data (Session 212, PQ9N5YWW token)
   - Document selectors (question-input, submit-button, transcript-area)

3. **File 3: SessionOpener.razor**
   - Add PLAYWRIGHT TEST METADATA block
   - Document API routes (/api/host/validate-token, /api/session/details)
   - Document test data (Session 212, KJAHA99L token)
   - Document selectors (token-input, validate-button, session-title)

4. **File 4: CanvasHub.cs**
   - Add PLAYWRIGHT TEST METADATA block
   - Document SignalR methods (SendToSession, JoinSession, LeaveSession)
   - Document connection groups (session-{sessionId})
   - Document test data (Session 212 tokens)

**Acceptance Criteria:**
- ✅ All 4 files have complete PLAYWRIGHT TEST METADATA blocks
- ✅ All metadata references Session 212
- ✅ All metadata includes complete API routes, database connections, selectors
- ✅ Test-registry.md updated with links to related tests

---

## 🔄 Execution Strategy

**Recommended Approach:** Phase-by-phase execution with validation checkpoints

### Option A: SEQUENTIAL PHASES (Recommended)
- Execute Phase 1 → validate → approve Phase 2 → validate → etc.
- Enables course correction after each phase
- Lower risk of cascading failures

### Option B: E2E Execution
- Execute all 6 phases in single session
- Faster but higher risk
- Use only if confident in implementation plan

**Next Command (Phase 1):**
```
@workspace /kds request="Update task.prompt.md to add Step 6.5 (Test Metadata Generation) per test-metadata.plan.md Phase 1"
```

---

## 📋 Handoff Files

### Phase 1 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-1-update-task-prompt.json`

```json
{
  "key": "test-metadata",
  "phase": 1,
  "task": "1a",
  "description": "Add Step 6.5 to task.prompt.md for auto-generating test metadata",
  "files": [".github/prompts/task.prompt.md"],
  "acceptanceCriteria": [
    "Step 6.5 added after Step 6 (code generation)",
    "Detects UI/API file creation (.razor, Controllers/*.cs, Hubs/*.cs)",
    "Scans code for API routes, database operations, SignalR usage",
    "Loads Session 212 test data from PlaywrightQuickRef.md",
    "Generates PLAYWRIGHT TEST METADATA block",
    "Inserts at top of file (after usings/imports)"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-2-update-test-generation.json",
  "testFile": null
}
```

### Phase 2 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-2-update-test-generation.json`

```json
{
  "key": "test-metadata",
  "phase": 2,
  "task": "2a",
  "description": "Add Step 1.5 to test-generation.prompt.md for loading test metadata",
  "files": [".github/prompts/test-generation.prompt.md"],
  "acceptanceCriteria": [
    "Step 1.5 added after Step 1 (loading test data)",
    "Searches for PLAYWRIGHT TEST METADATA block in target file",
    "Extracts API routes, database connections, test data, selectors",
    "Auto-populates test structure from metadata",
    "Warns if metadata incomplete"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-3-update-healthcheck.json",
  "testFile": null
}
```

### Phase 3 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-3-update-healthcheck.json`

```json
{
  "key": "test-metadata",
  "phase": 3,
  "task": "3a",
  "description": "Add test metadata completeness scan to healthcheck.prompt.md",
  "files": [".github/prompts/healthcheck.prompt.md"],
  "acceptanceCriteria": [
    "Scans all .razor, Controllers/*.cs, Hubs/*.cs files",
    "Detects testable code patterns (API, database, SignalR)",
    "Reports missing PLAYWRIGHT TEST METADATA blocks",
    "Reports incomplete metadata with missing fields",
    "Provides fix commands (@workspace /route key=reverse-engineer)"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-4-update-route.json",
  "testFile": null
}
```

### Phase 4 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-4-update-route.json`

```json
{
  "key": "test-metadata",
  "phase": 4,
  "task": "4a",
  "description": "Add reverse-engineer route handler to route.prompt.md",
  "files": [".github/prompts/route.prompt.md"],
  "acceptanceCriteria": [
    "reverse-engineer key routes to task.prompt.md",
    "Extracts file path from user request",
    "Scans file for API routes, database ops, SignalR",
    "Loads Session 212 test data from PlaywrightQuickRef.md",
    "Generates and inserts PLAYWRIGHT TEST METADATA block",
    "Updates test-registry.md"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-5-enhance-playwright-quickref.json",
  "testFile": null
}
```

### Phase 5 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-5-enhance-playwright-quickref.json`

```json
{
  "key": "test-metadata",
  "phase": 5,
  "task": "5a",
  "description": "Enhance PlaywrightQuickRef.md with Session 212 canonical test data",
  "files": [".github/instructions/Links/PlaywrightQuickRef.md"],
  "acceptanceCriteria": [
    "Session 212 documented as canonical test scenario",
    "All test data elements listed (tokens, IDs, etc.)",
    "Test flow documented step-by-step",
    "Referenced in PLAYWRIGHT TEST METADATA examples"
  ],
  "autoChain": true,
  "nextTask": "handoffs/phase-6-pilot-reverse-engineering.json",
  "testFile": null
}
```

### Phase 6 Handoff
**File:** `.github/key-data-streams/test-metadata/handoffs/phase-6-pilot-reverse-engineering.json`

```json
{
  "key": "test-metadata",
  "phase": 6,
  "task": "6a",
  "description": "Reverse-engineer 4 pilot files with test metadata",
  "files": [
    "SPA/NoorCanvas/Components/Pages/Host-HostControlPanel.razor",
    "SPA/NoorCanvas/Components/Pages/Participant-TranscriptCanvas.razor",
    "SPA/NoorCanvas/Components/Pages/Host-SessionOpener.razor",
    "SPA/NoorCanvas/Hubs/CanvasHub.cs"
  ],
  "acceptanceCriteria": [
    "All 4 files have complete PLAYWRIGHT TEST METADATA blocks",
    "All metadata references Session 212",
    "All metadata includes API routes, database connections, selectors",
    "Test-registry.md updated with related test links"
  ],
  "autoChain": false,
  "nextTask": "complete",
  "testFile": null
}
```

---

## 🎯 Success Metrics

**Quantitative:**
- ✅ 4 prompt files updated (task, test-generation, healthcheck, route)
- ✅ 1 documentation file enhanced (PlaywrightQuickRef.md)
- ✅ 4 pilot files reverse-engineered
- ✅ 8-12 Playwright tests identified as automatable

**Qualitative:**
- ✅ Test creation time reduced by 70% (metadata eliminates manual log analysis)
- ✅ Session 212 established as canonical test data reference
- ✅ Reverse-engineering workflow functional (`@workspace /route key=reverse-engineer`)
- ✅ Healthcheck validates metadata completeness
- ✅ Future UI/API code auto-generates metadata (no manual intervention)

---

## 📚 Related Documentation

**KDS Governance:**
- `.github/governance/kds-rulebook.md` - Rule #2b specification (COMPLETED)
- `.github/governance/kds-rulebook.json` - testMetadata schema (COMPLETED)
- `.github/instructions/rules/document-first/rule.md` - Step 2b workflow (COMPLETED)

**Prompts to Update:**
- `.github/prompts/task.prompt.md` - Step 6.5 (auto-generation)
- `.github/prompts/test-generation.prompt.md` - Step 1.5 (metadata loading)
- `.github/prompts/healthcheck.prompt.md` - Metadata completeness scan
- `.github/prompts/route.prompt.md` - reverse-engineer route handler

**Test Data Reference:**
- `.github/instructions/Links/PlaywrightQuickRef.md` - Session 212 canonical data

**Pilot Files:**
- `SPA/NoorCanvas/Components/Pages/Host-HostControlPanel.razor`
- `SPA/NoorCanvas/Components/Pages/Participant-TranscriptCanvas.razor`
- `SPA/NoorCanvas/Components/Pages/Host-SessionOpener.razor`
- `SPA/NoorCanvas/Hubs/CanvasHub.cs`

---

**This plan is ready for execution. Proceed with Phase 1 when approved.**

**Created:** 2025-10-31  
**Key:** `test-metadata`  
**Version:** 1.0.0
