# table-asset-enhancement.plan.md

---
**Key**: table-asset-enhancement  
**Branch**: development  
**Created**: 2025-10-27  
**Status**: In Progress (Phase 3)
**Plan Version**: v1.2
**Last Updated**: 2025-10-27
---

## Version History

**v1.3** (2025-10-27):
- **Extension**: Added Phase 2.5 (Database Validation) + Phase 2.6 (E2E Test Suite)
- Focus: Retrieve session 212 transcript from dbo.SessionTranscripts, validate AssetProcessingService detection
- Create comprehensive Playwright tests for ALL asset types (table, ayah-card, hadees, imgResponsive, esotericBlock)
- Headless test execution with Percy snapshots

**v1.2** (2025-10-27):
- **Phases 1-2 COMPLETE**: Database verification + CSS selector update
- Revised plan to focus on remaining verification phases
- Updated status: Ready for Phase 3 (E2E Testing)
- Removed Production Migration phase (dev-only for now)

**v1.1** (2025-10-27):
- Changed Phase 2 from CONDITIONAL to MANDATORY
- User confirmed CSS selector update required
- Selector change: `table[style="width: 100%;"]` → `table` (match all tables)
- Shortened Phase 1 (verification focus shifted)

**v1.0** (2025-10-27):
- Initial plan creation
- Conditional Phase 2 pending verification

## Executive Summary

**Objective**: Enable HTML tables in HCP session transcripts to be treated as shareable assets with inject share buttons and SignalR broadcasting to receivers (SessionCanvas, TranscriptCanvas).

**Current Status**: ✅ **Database Update Complete**
- CSS selector updated from `table[style="width: 100%;"]` → `table`
- All tables in transcripts will now be detected (not just styled tables)

**Completed Phases**:
- ✅ Phase 1: Database verification (table entry confirmed active)
- ✅ Phase 2: CSS selector update (now matches ALL tables)

**Remaining Work**: 
- 🔄 Phase 2.5: Database validation (retrieve session 212 transcript, verify AssetProcessingService detection)
- 🔄 Phase 2.6: E2E automated test suite (Playwright + Percy for all asset types)
- 🔄 Phase 3: E2E manual verification (HostControlPanel → SessionCanvas)
- 🔄 Phase 4: Playwright automated test creation (DEPRECATED - merged into Phase 2.6)
- 🔄 Phase 5: Documentation updates

**Estimated Remaining Effort**: 3-4 hours (database validation + automated tests + manual verification + documentation)

**Key Achievement**: Tables already supported in asset pipeline - only needed selector simplification to enable sharing of ALL table types (not just those with specific inline styles).

---

## Technology Context

### Framework & Libraries
- **Framework**: ASP.NET Core 8.0 (Blazor Server)
- **ORM**: Entity Framework Core 8.0.0
- **SignalR**: 8.0.0 (real-time broadcasting)
- **HTML Parsing**: AngleSharp 1.1.2 (CSS selector matching)
- **Testing**: Playwright (E2E) + Percy (Visual Regression)
- **Database**: SQL Server (KSESSIONS_DEV, canvas schema)

### Current Architecture

**Asset Detection Pipeline**:
```
SessionTranscript (HTML) → AssetProcessingService.TransformTranscriptHtmlAsync()
  ↓
InjectAssetShareButtonsAsync() - Loads AssetLookup from API
  ↓
ProcessAssetType() - For each active asset type (including table)
  ↓
ProcessAssetElement() - Injects share button before each matched element
  ↓
CreateShareButtonHtml() - Generates blue-themed button with data-share-id
```

**Broadcasting Pipeline**:
```
Host clicks share button → HostControlPanel.ShareAsset(shareId, assetType, instanceNumber)
  ↓
ExtractRawAssetHtml(shareId) - Uses HtmlAgilityPack to find element by data-asset-id
  ↓
SessionHub.ShareAsset(sessionId, assetData) - Broadcasts to session group
  ↓
Receivers (SessionCanvas, TranscriptCanvas) - Listen to "AssetShared" event
  ↓
Display asset HTML in Model.SharedAssetContent
```

### Database Schema

**canvas.AssetLookup Table** (verified in Migration `20250920222544_AddAssetLookupTable.cs`):
```sql
CREATE TABLE [canvas].[AssetLookup] (
    [AssetId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AssetIdentifier] NVARCHAR(100) NOT NULL,
    [AssetType] NVARCHAR(50) NOT NULL,
    [CssSelector] NVARCHAR(200) NULL,
    [DisplayName] NVARCHAR(100) NULL,
    [IsActive] BIT NOT NULL,
    [DetectedAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL
)
```

**Seeded Table Entry** (from migration):
```csharp
{ 
    "table",                          // AssetIdentifier
    "table",                          // AssetType
    "table[style=\"width: 100%;\"]", // CssSelector
    "Table",                          // DisplayName
    true,                             // IsActive
    migrationDate                     // DetectedAt, CreatedAt
}
```

### Cross-Key Intelligence

**Related Keys**:
- `transcript-canvas` - TranscriptCanvas.razor UI component (receiver)
- `hcp` - Host Control Panel components (has test/script subdirs)

**Existing Asset Types** (8 total):
1. ayah-card (`.ayah-card`)
2. inserted-hadees (`.inserted-hadees`)
3. etymology-card (`.etymology-card`)
4. etymology-derivative-card (`.etymology-derivative-card`)
5. esotericBlock (`.esotericBlock`)
6. verse-container (`.verse-container`)
7. **table** (`table[style="width: 100%;"]`) ← OUR FOCUS
8. imgResponsive (`.imgResponsive`)

**Asset Processing Files**:
- `SPA/NoorCanvas/Services/AssetProcessingService.cs` - HTML transformation
- `SPA/NoorCanvas/Services/HostAssetService.cs` - Asset detection and sharing
- `SPA/NoorCanvas/Hubs/SessionHub.cs` - SignalR broadcasting
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Share button click handler
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` - Asset reception (AssetShared listener)
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` - Asset reception (AssetShared listener)

---

## Current State Analysis

### Database Status ✅

**Verified**: `canvas.AssetLookup` table exists with table entry

**Migration File**: `SPA/NoorCanvas/Migrations/20250920222544_AddAssetLookupTable.cs` (Line 136)

**Seeded Data**:
```csharp
{ "table", "table", "table[style=\"width: 100%;\"]", "Table", true, migrationDate }
```

**Status**: ✅ **NO DATABASE CHANGES REQUIRED** - Table asset already defined and active

### HTML Transformation Status 🔍

**Service**: `AssetProcessingService.cs`

**Detection Method**: `InjectAssetShareButtonsAsync()` (Line 109)
- Loads AssetLookup entries from API endpoint `/api/host/asset-lookup`
- Uses AngleSharp to parse HTML with CSS selectors
- Should automatically detect tables matching `table[style="width: 100%;"]`

**Share Button Injection**: `ProcessAssetElement()` (Line ~200)
- Injects blue-themed share button before each asset
- Assigns unique `data-asset-id` attribute (format: `asset-{assetType}-{instanceNumber}`)
- Button HTML: `CreateShareButtonHtml()` method

**Potential Issue**: 
- CSS selector `table[style="width: 100%;"]` is very specific
- User's example table has NO inline styles (just `<table><thead>...</table>`)
- **Hypothesis**: Current selector WON'T match tables without inline width style
- **Verification needed**: Check actual transcript HTML for table styling patterns

### Broadcasting Status ✅

**Hub Method**: `SessionHub.ShareAsset()` (Line 200 in SessionHub.cs)
- Accepts: `int sessionId`, `object assetData`
- Broadcasts to group: `session_{sessionId}`
- Event name: `"AssetShared"`

**Payload Structure**:
```csharp
{
    sessionId = sessionId,
    asset = assetData,
    timestamp = DateTime.UtcNow,
    sharedBy = Context.ConnectionId
}
```

**Status**: ✅ **BROADCASTING ALREADY SUPPORTS ALL ASSET TYPES** - No changes needed

### Reception Status ✅

**SessionCanvas.razor** (Line 3255):
- Listens to `"AssetShared"` event
- Extracts `htmlContent` from payload
- Sets `Model.SharedAssetContent` and triggers `StateHasChanged()`

**TranscriptCanvas.razor** (Line 3313):
- Also listens to `"AssetShared"` event
- Same reception logic as SessionCanvas

**Status**: ✅ **RECEIVERS ALREADY HANDLE ALL ASSET TYPES** - No changes needed

---

## Implementation Plan (REVISED)

### ✅ Phase 1: Database Verification (COMPLETE)

**Status**: ✅ COMPLETE (2025-10-27)  
**Duration**: 10 minutes

**Executed**:
- Connected to KSESSIONS_DEV database
- Verified `canvas.AssetLookup` table contains active table entry
- Confirmed CSS selector was `table[style="width: 100%;"]` (required update)

**Results**:
- AssetId: 10
- AssetIdentifier: `table`
- CssSelector: `table[style="width: 100%;"]` → **needs simplification**
- IsActive: `true` ✅

---

### ✅ Phase 2: CSS Selector Update (COMPLETE)

**Status**: ✅ COMPLETE (2025-10-27)  
**Duration**: 5 minutes

**Executed**:
```sql
UPDATE canvas.AssetLookup
SET CssSelector = 'table'
WHERE AssetIdentifier = 'table'
```

**Verification**:
```sql
SELECT AssetIdentifier, CssSelector, DisplayName, IsActive
FROM canvas.AssetLookup
WHERE AssetIdentifier = 'table'
-- Result: CssSelector = 'table' ✅
```

**Impact**:
- ALL `<table>` elements now detected (previously only styled tables)
- Share buttons will appear for all table types in transcripts

---

### 🔄 Phase 2.5: Database Validation with Session 212 Transcript (NEW)

**Objective**: Retrieve actual session transcript from database, validate AssetProcessingService correctly identifies ALL asset types (tables, ayah-cards, hadees, images, etc.) with updated CSS selectors.

**Tasks**:

1. **Database Query Script**
   - File: `Scripts/validate-asset-detection-session-212.ps1`
   - Query: `SELECT TranscriptHtml FROM dbo.SessionTranscripts WHERE SessionId = 212`
   - Save to: `Tests/Fixtures/session-212-transcript.html`

2. **Asset Detection Validation**
   - Create C# console app or script to test `AssetProcessingService.InjectAssetShareButtonsAsync()`
   - Load session 212 transcript HTML from fixture file
   - Call asset processing methods with current AssetLookup data
   - Verify detection counts:
     - Tables: Expected 10 (asset-table-1 through asset-table-10)
     - Ayah-cards: Expected ~4
     - Hadees: Expected ~3
     - Images (imgResponsive): Expected ~4
     - EsotericBlocks: Expected ~1

3. **Output Analysis**
   - Log all detected assets with data-share-id, data-asset-type, data-instance-number
   - Compare against CopilotContext.md findings (10 table buttons confirmed)
   - Identify any missing assets or incorrect CSS selector matches

**Success Criteria**:
- ✅ Session 212 transcript retrieved and saved to fixture file
- ✅ Validation script created and executed
- ✅ ALL asset types detected correctly (tables + existing assets)
- ✅ Detection counts match expected values from HTML analysis
- ✅ Share button injection produces well-formed HTML

**Files Created**:
- `Scripts/validate-asset-detection-session-212.ps1`
- `Tests/Fixtures/session-212-transcript.html`
- `Scripts/AssetDetectionValidator/Program.cs` (optional C# console app)

**Estimated Time**: 45 minutes

**Debug Markers**:
- `[DEBUG-WORKITEM:table-asset-enhancement:phase2.5:database-query]`
- `[DEBUG-WORKITEM:table-asset-enhancement:phase2.5:asset-detection]`

---

### 🔄 Phase 2.6: Comprehensive E2E Test Suite (Playwright + Percy) (NEW)

**Objective**: Create headless automated tests for ALL asset types (table, ayah-card, inserted-hadees, imgResponsive, esotericBlock) using session 212 transcript. Tests must verify share button injection, click handling, and SignalR broadcast.

**Tasks**:

1. **Test Specification File**
   - File: `Tests/UI/comprehensive-asset-share-validation.spec.ts`
   - Structure:
     - Setup: Load HostControlPanel with session 212
     - Test 1: Verify share buttons for ALL asset types (count + attributes)
     - Test 2: Click table share button → verify SignalR broadcast
     - Test 3: Click ayah-card button → verify broadcast
     - Test 4: Click hadees button → verify broadcast
     - Test 5: Click imgResponsive button → verify broadcast
     - Test 6: Verify receiver (SessionCanvas) displays shared assets
     - Test 7: Percy snapshots at each stage

2. **Fixture Data**
   - Use `Tests/Fixtures/session-212-transcript.html` from Phase 2.5
   - Mock AssetLookup API response with all 10 asset types
   - Mock SessionHub SignalR connection (if needed)

3. **Test Execution**
   - Run headless (no UI)
   - Capture console logs for share system diagnostics
   - Verify `[NOOR-SHARE] 🎯 Share button clicked:` messages
   - Assert SignalR `ShareAsset` method called with correct parameters
   - Percy snapshots: Share buttons visible, asset broadcast received

**Percy Snapshot Points**:
1. Initial load (all share buttons visible)
2. After clicking table share button
3. After clicking ayah-card share button
4. Receiver view showing table asset
5. Receiver view showing ayah-card asset

**Success Criteria**:
- ✅ Test spec created with 7+ test scenarios
- ✅ All tests pass in headless mode
- ✅ Share buttons detected for ALL asset types
- ✅ SignalR broadcasts verified for each asset type
- ✅ Percy snapshots captured and uploaded
- ✅ Console logs show proper click handling and DotNetRef initialization

**Files Created**:
- `Tests/UI/comprehensive-asset-share-validation.spec.ts`
- `Tests/Fixtures/session-212-transcript.html` (from Phase 2.5)
- `Tests/Fixtures/mock-asset-lookup.json` (optional - AssetLookup API mock)

**Estimated Time**: 1.5 hours

**Debug Markers**:
- `[DEBUG-WORKITEM:table-asset-enhancement:phase2.6:test-creation]`
- `[DEBUG-WORKITEM:table-asset-enhancement:phase2.6:headless-execution]`

---

### 🔄 Phase 3: E2E Manual Verification (NEXT)

**Objective**: Verify table sharing works end-to-end (HostControlPanel → SessionCanvas)

**Tasks**:

1. **Start Application with Test Session**
   - Use session 212 or 213 (contains table content)
   - Command: `nc 212` or navigate to HostControlPanel manually
   - Verify session transcript loads with table(s)

2. **Verify Share Button Injection**
   - Check HostControlPanel for blue "SHARE TABLE" buttons
   - Verify buttons appear above/before each `<table>` element
   - Inspect button attributes: `data-share-id="asset-table-1"`, etc.
   - Screenshot: Document button appearance

3. **Test Broadcasting Flow**
   - Open HostControlPanel in browser tab 1
   - Open SessionCanvas in browser tab 2 (as participant for same session)
   - Click "SHARE TABLE" button in HostControlPanel
   - Verify table appears in SessionCanvas `Model.SharedAssetContent` area
   - Check browser console for:
     - SignalR AssetShared event
     - No JavaScript errors
     - Asset reception logs

4. **Validate Table Structure**
   - Compare received table vs original transcript table
   - Verify: headers, rows, cells, content preserved
   - Verify: Arabic/special characters render correctly
   - Verify: styling/formatting intact

**Success Criteria**:
- ✅ Share buttons visible for ALL tables (not just styled ones)
- ✅ Button click triggers ShareAsset method
- ✅ SessionCanvas receives table HTML
- ✅ Table structure and content preserved
- ✅ No console errors during flow

**Files Verified** (no code changes expected):
- `SPA/NoorCanvas/Services/AssetProcessingService.cs`
- `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- `SPA/NoorCanvas/Hubs/SessionHub.cs`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`

**Estimated Time**: 45 minutes

**Debug Markers**:
- `[DEBUG-WORKITEM:table-asset-enhancement:phase3:share-buttons]`
- `[DEBUG-WORKITEM:table-asset-enhancement:phase3:e2e-broadcast]`

---

### 🔄 Phase 4: Playwright Automated Test

**Objective**: Create E2E test for table asset sharing

**Tasks**:

1. **Create Test Specification**
   - File: `PlayWright/Tests/table-asset-share-e2e.spec.ts`
   - Pattern: Follow `continue-assetshare-e2e-broadcast.spec.ts` structure

2. **Test Implementation**
```typescript
import { test, expect } from '@playwright/test';

test.describe('TABLE-ASSET-SHARE: E2E Table Sharing', () => {
  test('Host shares table → SessionCanvas receives it', async ({ context }) => {
    // 1. Setup pages
    const hostPage = await context.newPage();
    const canvasPage = await context.newPage();
    
    // 2. Navigate to HCP (session with table content)
    await hostPage.goto('https://localhost:9091/host/control-panel/212');
    
    // 3. Start session to activate share buttons
    await hostPage.click('button:has-text("Start Session")');
    await hostPage.waitForTimeout(2000);
    
    // 4. Verify table share button appears
    const shareButton = hostPage.locator('button[data-share-id^="asset-table-"]').first();
    await expect(shareButton).toBeVisible({ timeout: 10000 });
    
    // 5. Open SessionCanvas as participant
    await canvasPage.goto('https://localhost:9090/session/212/participant-token');
    
    // 6. Click share button
    await shareButton.click();
    
    // 7. Verify table appears in SessionCanvas
    const sharedTable = canvasPage.locator('.shared-asset-content table').first();
    await expect(sharedTable).toBeVisible({ timeout: 5000 });
    
    // 8. Validate table structure
    const rowCount = await sharedTable.locator('tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
```

3. **Test Execution**
   - Run: `npx playwright test table-asset-share-e2e.spec.ts --headed`
   - Verify test passes 3+ consecutive runs
   - Document in test registry

**Success Criteria**:
- ✅ Test runs successfully (no flakiness)
- ✅ Test validates complete E2E flow
- ✅ Test asserts table structure preservation
- ✅ Test documented in test-registry.md

**Files Created**:
- `PlayWright/Tests/table-asset-share-e2e.spec.ts`
- `.github/key-data-streams/table-asset-enhancement/tests/test-registry.md`

**Estimated Time**: 1 hour

---

### 🔄 Phase 5: Documentation & Finalization

**Objective**: Document verification results and update global documentation

**Tasks**:

1. **Update KSESSIONS-HUB.md**
   - File: `Workspaces/Documentation/KSESSIONS-HUB.MD`
   - Section: Asset Types Configuration (Line ~92)
   - Add verification note:
     ```markdown
     | Asset Type | Identifier | CSS Selector | Status |
     |------------|------------|--------------|--------|
     | `table` | `table` | `table` | ✅ VERIFIED: E2E sharing functional (selector updated 2025-10-27) |
     ```

2. **Create Verification Report**
   - File: `.github/key-data-streams/table-asset-enhancement/VERIFICATION-REPORT.md`
   - Contents:
     - Database update summary
     - Manual E2E test results
     - Playwright test results
     - Screenshots (optional)
     - Recommendations

3. **Update Work Log**
   - File: `.github/key-data-streams/table-asset-enhancement/work-log.md`
   - Mark all phases complete
   - Record final status: ✅ COMPLETE

4. **Update Global Index**
   - File: `.github/key-data-streams/index.md`
   - Update status for `table-asset-enhancement` key

**Success Criteria**:
- ✅ KSESSIONS-HUB.md updated with table verification
- ✅ Verification report created
- ✅ Work log marked complete
- ✅ Global index updated

**Files Modified**:
- `Workspaces/Documentation/KSESSIONS-HUB.MD`
- `.github/key-data-streams/table-asset-enhancement/work-log.md`
- `.github/key-data-streams/table-asset-enhancement/VERIFICATION-REPORT.md` (new)
- `.github/key-data-streams/index.md`

**Estimated Time**: 30 minutes

---

## Total Remaining Effort

- Phase 3: 45 minutes (E2E verification)
- Phase 4: 1 hour (Playwright test)
- Phase 5: 30 minutes (documentation)

**Total**: ~2 hours 15 minutes
     | `table` | `table` | Table | ✅ VERIFIED: Full E2E support (share button + broadcast) |
     ```
   - Update table selector documentation if changed in Phase 2

2. **Work Log Final Update**
   - File: `.github/key-data-streams/table-asset-enhancement/work-log.md`
   - Record all phase completions
   - Document any selector changes
   - Include test results and screenshots

3. **Create Verification Report**
   - File: `.github/key-data-streams/table-asset-enhancement/VERIFICATION-REPORT.md`
   - Contents:
     - Database verification results (AssetLookup query)
     - CSS selector analysis findings
     - Manual E2E test results (with screenshots)
     - Playwright test results
     - Any issues discovered and resolutions

4. **Update Key Index**
   - File: `.github/key-data-streams/index.md`
   - Add entry:
     ```markdown
     table-asset-enhancement: plan → task → test-generation → healthcheck
     ```

**Success Criteria**:
- ✅ KSESSIONS-HUB.md updated with table verification
- ✅ Work log complete with all phase records
- ✅ Verification report created
- ✅ Global index updated

**Files Modified**:
- `Workspaces/Documentation/KSESSIONS-HUB.MD`
- `.github/key-data-streams/table-asset-enhancement/work-log.md`
- `.github/key-data-streams/table-asset-enhancement/VERIFICATION-REPORT.md` (new)
- `.github/key-data-streams/index.md`

**Estimated Time**: 30 minutes

---

## Test Strategy

### Manual Testing

**Test Session Setup**:
1. Identify or create session with table-containing transcript
2. Verify table HTML matches expected patterns
3. Use session ID throughout manual testing for consistency

**Test Scenarios**:
1. **Share Button Appearance**
   - Load HostControlPanel with table transcript
   - Verify blue share buttons appear above each table
   - Verify button text: "SHARE TABLE" or "Share Table"

2. **Share Button Click**
   - Click first table share button
   - Verify no JavaScript errors
   - Verify SignalR broadcast in Network tab

3. **Reception in SessionCanvas**
   - Open SessionCanvas as participant
   - Verify table appears after host shares
   - Verify table structure matches original

4. **Reception in TranscriptCanvas**
   - Same as SessionCanvas test
   - Verify TranscriptCanvas also receives table

### Automated Testing (Playwright)

**Test File**: `PlayWright/Tests/table-asset-share-e2e.spec.ts`

**Test Coverage**:
- ✅ Share button detection
- ✅ Share button click action
- ✅ SignalR broadcast verification
- ✅ SessionCanvas reception
- ✅ Table structure validation (thead, tbody, row count)
- ✅ Content accuracy (sample cell validation)

**Percy Visual Testing** (Optional):
- Snapshot: Table share button in HostControlPanel
- Snapshot: Received table in SessionCanvas
- Compare against baseline

### Database Testing

**Verification Queries**:

```sql
-- Verify table entry exists
SELECT * FROM canvas.AssetLookup WHERE AssetIdentifier = 'table'

-- Verify table is active
SELECT IsActive FROM canvas.AssetLookup WHERE AssetIdentifier = 'table'
-- Expected: 1 (true)

-- Find sessions with tables in transcript
SELECT TOP 10 SessionId, 
       SUBSTRING(Transcript, CHARINDEX('<table', Transcript), 100) as TableSnippet
FROM canvas.SessionTranscripts
WHERE Transcript LIKE '%<table%'
ORDER BY CreatedAt DESC
```

---

## Rollback Plan

### If Database Changes Made (Phase 2)

**Rollback SQL**:
```sql
-- Restore original CSS selector
UPDATE canvas.AssetLookup
SET CssSelector = 'table[style="width: 100%;"]',
    ChangedDate = GETUTCDATE()
WHERE AssetIdentifier = 'table'
```

### If Code Changes Made (Unlikely)

**Rollback via Git**:
```bash
# Identify commit before table-asset-enhancement work
git log --oneline --grep="table-asset"

# Revert specific commit
git revert <commit-hash>

# Or reset branch (if no other work)
git reset --hard origin/development
```

### If Tests Fail

**Investigation Steps**:
1. Check AssetLookup API response (verify table entry returned)
2. Inspect HostControlPanel HTML (verify share buttons present)
3. Check SignalR connection logs (verify hub connection active)
4. Verify session status = "Active" (share buttons only appear when active)
5. Check browser console for JavaScript errors

**Fallback**: Document failure in work-log.md and create follow-up key for fixes

---

## Risk Analysis

### Low Risk Items ✅

- **Database verification**: Read-only queries, no impact
- **Code review**: No modifications, just analysis
- **Broadcasting**: Existing pipeline already supports generic asset types
- **Reception**: SessionCanvas/TranscriptCanvas already handle all asset types

### Medium Risk Items ⚠️

- **CSS Selector mismatch**: Current selector might not match real-world tables
  - **Mitigation**: Phase 1 analysis will identify mismatch early
  - **Resolution**: Update selector in Phase 2 (low-risk database UPDATE)

- **Table HTML complexity**: Tables with nested elements might not render correctly
  - **Mitigation**: Test with real transcript tables (not synthetic examples)
  - **Resolution**: Document any rendering issues for future enhancement

### Unlikely Issues 🔍

- **Performance degradation**: Table detection adds minimal overhead (CSS selector query)
- **False positives**: Generic `table` selector might match layout tables
  - **Note**: Session transcripts unlikely to have layout tables (content is structured)

---

## Dependencies

### Upstream Dependencies
- ✅ AssetLookup table exists (Migration `20250920222544_AddAssetLookupTable`)
- ✅ AssetProcessingService implemented
- ✅ SessionHub.ShareAsset method exists
- ✅ SessionCanvas/TranscriptCanvas AssetShared listeners exist

### Downstream Dependencies
- None (this work is self-contained verification/enhancement)

### Related Keys
- `transcript-canvas` - May need coordination if CSS changes affect TranscriptCanvas display
- `hcp` - HostControlPanel components (no changes expected)

---

## Success Metrics

### Functional Metrics
- ✅ Table entry exists in canvas.AssetLookup with IsActive = true
- ✅ Share buttons appear for all tables in transcript
- ✅ Clicking share button successfully broadcasts table to SessionCanvas
- ✅ Received table matches original structure and content
- ✅ Playwright E2E test passes consistently (100% pass rate)

### Performance Metrics
- Table detection adds <100ms to transcript transformation
- Broadcasting latency <500ms (same as other asset types)
- No memory leaks during repeated sharing

### Quality Metrics
- Zero console errors during share/receive cycle
- Table formatting preserved (no layout corruption)
- Arabic/special characters render correctly

---

## Enhancement Recommendations (Post-Verification)

### Optional Enhancements

1. **Table Styling Preservation**
   - Current: Tables might lose inline styles during extraction
   - Enhancement: Preserve original table styles in broadcast payload
   - Effort: 1-2 hours

2. **Table Caption Support**
   - Current: Only `<table>` element shared
   - Enhancement: Include `<caption>` if present
   - Effort: 30 minutes

3. **Table-Specific Display Options**
   - Current: Generic asset display in SessionCanvas
   - Enhancement: Add table-specific CSS (e.g., striped rows, hover effects)
   - Effort: 1 hour

4. **Multi-Select Table Sharing**
   - Current: Share one table at a time
   - Enhancement: Allow host to select and share multiple tables
   - Effort: 2-3 hours

### Future Considerations

- **Table Editing**: Allow hosts to edit table content before sharing
- **Table Search**: Add search functionality for finding specific tables in transcripts
- **Table Analytics**: Track which tables are shared most frequently

---

## Appendix A: Example Table HTML

**User-Provided Example**:
```html
<table>
  <thead>
    <tr>
      <th style="text-align: center;">First Repetition</th>
      <th style="text-align: center;">Second Repetition</th>
      <th style="text-align: center;">Third Repetition</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align: center;">Gnosis of the <span class="inlineArabic">داعی</span>(Guide)</td>
      <td style="text-align: center;">Gnosis of (Guardianship) of <span class="inlineArabic">إمام الزمان</span></td>
      <td style="text-align: center;">Gnosis of the <span class="inlineArabic">ناطق</span> (Prophet)</td>
    </tr>
    <tr>
      <td style="text-align: center;">Outward Purity</td>
      <td style="text-align: center;">Inward Purity</td>
      <td style="text-align: center;">Perfection</td>
    </tr>
  </tbody>
</table>
```

**Observations**:
- No inline `width` style on `<table>` element
- Inline styles on `<th>` and `<td>` (text-align)
- Contains Arabic text in `<span class="inlineArabic">`
- Standard HTML5 table structure (thead, tbody)

**CSS Selector Analysis**:
- Current selector: `table[style="width: 100%;"]` → **WON'T MATCH**
- Recommended selector: `table` → **WILL MATCH**

---

## Appendix B: File Reference

**Key Files**:

| File | Purpose | Changes Expected |
|------|---------|------------------|
| `SPA/NoorCanvas/Models/Simplified/AssetLookup.cs` | Entity model | None (verification only) |
| `SPA/NoorCanvas/Migrations/20250920222544_AddAssetLookupTable.cs` | Database migration | None (read-only) |
| `SPA/NoorCanvas/Services/AssetProcessingService.cs` | HTML transformation | None (verification only) |
| `SPA/NoorCanvas/Services/HostAssetService.cs` | Asset detection | None (verification only) |
| `SPA/NoorCanvas/Controllers/HostController.cs` | AssetLookup API | None (verification only) |
| `SPA/NoorCanvas/Hubs/SessionHub.cs` | SignalR broadcasting | None (verification only) |
| `SPA/NoorCanvas/Pages/HostControlPanel.razor` | Share button handler | None (verification only) |
| `SPA/NoorCanvas/Pages/SessionCanvas.razor` | Asset reception | None (verification only) |
| `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` | Asset reception | None (verification only) |
| `Workspaces/Documentation/KSESSIONS-HUB.MD` | Asset documentation | Update table entry |
| `PlayWright/Tests/table-asset-share-e2e.spec.ts` | E2E test | **NEW FILE** |

**Database**:
- Table: `canvas.AssetLookup`
- Potential UPDATE: CssSelector field (if Phase 1 reveals mismatch)

---

## Appendix C: Phase Checklist

**Phase 1: Database Verification**
- [ ] Run AssetLookup query for table entry
- [ ] Analyze sample transcript HTML for table patterns
- [ ] Test CSS selector compatibility
- [ ] Document findings in work-log.md

**Phase 2: CSS Selector Update** (conditional)
- [ ] Choose optimal selector based on Phase 1
- [ ] Execute UPDATE statement on AssetLookup
- [ ] Verify selector matches sample transcripts
- [ ] Document selector change rationale

**Phase 3: Asset Processing Verification**
- [ ] Review AssetProcessingService code
- [ ] Test AssetLookup API endpoint
- [ ] Manual test: Share button injection
- [ ] Capture screenshot of share buttons

**Phase 4: E2E Manual Test**
- [ ] Setup: HostControlPanel + SessionCanvas tabs
- [ ] Click table share button
- [ ] Verify broadcast in Network tab
- [ ] Verify table appears in SessionCanvas
- [ ] Screenshot before/after states

**Phase 5: Playwright Test**
- [ ] Create test-asset-share-e2e.spec.ts
- [ ] Implement test with assertions
- [ ] Run test locally (3+ passes)
- [ ] Add to test-registry.md

**Phase 6: Documentation**
- [ ] Update KSESSIONS-HUB.md
- [ ] Complete work-log.md
- [ ] Create VERIFICATION-REPORT.md
- [ ] Update index.md

---

**END OF PLAN v1.0**
