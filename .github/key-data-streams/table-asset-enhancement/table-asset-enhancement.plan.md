# table-asset-enhancement.plan.md

---
**Key**: table-asset-enhancement  
**Branch**: development  
**Created**: 2025-10-27  
**Status**: Draft  
**Plan Version**: v1.1
**Last Updated**: 2025-10-27
---

## Version History

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

**User Request**: 
> Enhance hcp session transcript to treat tables as an asset. Lookup the database protocol for dev and plan to update canvas.AssetLookup table. The html transform should inject a share asset button for tables similar to other assets. Clicking it should broadcast the asset to the receivers.

**Scope**: Verification + Enhancement of existing asset pipeline to support table sharing

**Impact**: 
- ✅ Database verification (AssetLookup already contains table entry)
- ✅ HTML transformation enhancement (AssetProcessingService)
- ✅ Share button injection (already supported via existing pipeline)
- ✅ Broadcasting validation (SessionHub.ShareAsset)
- ✅ Reception handling (SessionCanvas, TranscriptCanvas)

**Estimated Effort**: 2-3 hours (CSS update + verification + testing)

**Key Discovery**: Tables already exist in `canvas.AssetLookup` table (added in Migration `20250920222544_AddAssetLookupTable.cs`). The asset processing pipeline already supports tables, but current CSS selector `table[style="width: 100%;"]` is too restrictive.

**User Requirement (v1.1)**: Update CSS selector to just `table` (no style attribute requirement) so ALL tables can be shared, not just those with inline width styles.

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

## Implementation Plan

### Phase 1: Database Verification

**Objective**: Verify AssetLookup table entry exists and is active (SIMPLIFIED - selector update confirmed by user)

**Tasks**:

1. **Database Verification**
   - ✅ Confirm `canvas.AssetLookup` contains table entry (verified in migration)
   - ✅ Verify `IsActive = true` for table asset
   - Run query against DEV database:
     ```sql
     SELECT AssetId, AssetIdentifier, AssetType, CssSelector, DisplayName, IsActive
     FROM canvas.AssetLookup
     WHERE AssetIdentifier = 'table'
     ```
   - **Expected**: 1 row with CssSelector = `table[style="width: 100%;"]` (will be updated in Phase 2)

2. **Quick Session Check** (optional)
   - Identify test session with table content (e.g., session 213)
   - Will be used in Phase 3-5 for testing
   - No detailed HTML analysis needed (user confirmed selector needs simplification)

**Success Criteria**:
- ✅ Database query confirms table entry exists and is active
- ✅ Test session identified (optional)

**Files Modified**: None (verification only)

**Estimated Time**: 15 minutes

**Note**: Phase 1 simplified per v1.1 - user confirmed CSS selector update required, no need for extensive transcript analysis.

---

### Phase 2: CSS Selector Update (MANDATORY)

**Objective**: Update AssetLookup CSS selector to match ALL tables (remove style attribute requirement)

**User Requirement**: Simplify selector from `table[style="width: 100%;"]` to just `table`

**Rationale**: 
- Current selector too restrictive (only matches tables with specific inline style)
- User wants ALL tables in transcripts to be shareable
- Example table from user has NO inline styles, wouldn't match current selector

**Tasks**:

1. **Execute Database UPDATE**
   - Direct UPDATE statement (no migration needed for dev environment):
     ```sql
     UPDATE canvas.AssetLookup
     SET CssSelector = 'table'
     WHERE AssetIdentifier = 'table'
     ```
   - Verify update successful:
     ```sql
     SELECT AssetIdentifier, CssSelector FROM canvas.AssetLookup WHERE AssetIdentifier = 'table'
     -- Expected: CssSelector = 'table'
     ```

2. **Document Change**
   - Record in work-log.md:
     - Old selector: `table[style="width: 100%;"]`
     - New selector: `table`
     - Reason: User requirement to match all tables
     - Impact: All table elements in transcripts will now get share buttons

3. **Verify API Reflects Change**
   - Test endpoint: `GET /api/host/asset-lookup`
   - Verify response shows updated selector: `"cssSelector": "table"`

**Success Criteria**:
- ✅ CSS selector updated to `table` in database
- ✅ API returns updated selector
- ✅ Change documented in work-log.md

**Files Modified**:
- Database: `canvas.AssetLookup` table (UPDATE statement)
- Documentation: work-log.md (record selector change)

**Estimated Time**: 15 minutes

**Note**: Changed from CONDITIONAL to MANDATORY per user request (v1.1)
- Database: `canvas.AssetLookup` table (UPDATE statement)
- Documentation: work-log.md (record selector change rationale)

**Estimated Time**: 30 minutes (if needed)

---

### Phase 3: Asset Processing Verification

**Objective**: Verify AssetProcessingService correctly detects and injects share buttons for tables

**Tasks**:

1. **Code Review: AssetProcessingService**
   - File: `SPA/NoorCanvas/Services/AssetProcessingService.cs`
   - Verify `InjectAssetShareButtonsAsync()` loads all active AssetLookup entries
   - Verify `ProcessAssetType()` handles generic asset types (not hardcoded to specific types)
   - Verify `ProcessAssetElement()` assigns unique `data-asset-id` to each table
   - **Key check**: Ensure no type-specific filtering that excludes tables

2. **Test Asset Detection API**
   - Endpoint: `GET /api/host/asset-lookup`
   - Verify response includes table entry:
     ```json
     {
       "assetIdentifier": "table",
       "cssSelector": "table[style='width: 100%;']",  // or updated selector
       "displayName": "Table",
       "isActive": true
     }
     ```
   - File: `SPA/NoorCanvas/Controllers/HostController.cs` (Line 920)

3. **Manual Testing: Share Button Injection**
   - Start session with known transcript containing tables
   - Navigate to HostControlPanel for that session
   - Verify blue share buttons appear before/above tables
   - Verify button attributes:
     - `data-share-id="asset-table-1"` (first table)
     - `data-share-id="asset-table-2"` (second table)
     - Contains "SHARE TABLE" text (or "Share Table" per DisplayName)
   - Screenshot: Document button appearance

4. **Logging Validation**
   - Check logs for asset detection:
     ```
     [ASSETSHARE-API:{RunId}] Successfully loaded {Count} asset lookups from API
     ```
   - Verify table type is included in detection count

**Success Criteria**:
- ✅ AssetLookup API returns table entry
- ✅ AssetProcessingService detects tables in transcript
- ✅ Share buttons appear correctly positioned
- ✅ Buttons have correct data-share-id attributes

**Files Reviewed** (no modifications expected):
- `SPA/NoorCanvas/Services/AssetProcessingService.cs`
- `SPA/NoorCanvas/Controllers/HostController.cs`

**Estimated Time**: 1 hour

---

### Phase 4: Broadcasting & Reception E2E Test

**Objective**: Verify complete flow from share button click → broadcast → reception in SessionCanvas/TranscriptCanvas

**Tasks**:

1. **Manual E2E Test: HostControlPanel → SessionCanvas**
   - Setup:
     - Start session with transcript containing table
     - Open HostControlPanel in browser tab 1
     - Open SessionCanvas in browser tab 2 (as participant)
   - Action:
     - Click "SHARE TABLE" button in HostControlPanel
   - Verification:
     - Check browser console for SignalR logs
     - Verify table HTML appears in SessionCanvas
     - Verify table preserves formatting (headers, borders, content)
   - Screenshot: Capture before/after state in SessionCanvas

2. **SignalR Payload Inspection**
   - Monitor browser DevTools Network tab
   - Capture WebSocket frame for ShareAsset broadcast
   - Verify payload structure:
     ```json
     {
       "sessionId": 213,
       "asset": {
         "shareId": "asset-table-1",
         "assetType": "table",
         "instanceNumber": 1,
         "htmlContent": "<table>...</table>",
         "sharedAt": "2025-10-27T...",
         "sessionId": 213
       },
       "timestamp": "...",
       "sharedBy": "connection-id"
     }
     ```

3. **Reception Logging Validation**
   - Check SessionCanvas logs:
     ```
     [DEBUG-WORKITEM:hcp-questions:reception:TRACE] Asset element found in payload
     [DEBUG-WORKITEM:hcp-questions:reception:TRACE] Received HTML content: {Length} chars
     ```
   - Verify `assetType = "table"` in logs

4. **Visual Verification**
   - Compare shared table in SessionCanvas with original in transcript
   - Verify table structure preserved (thead, tbody, rows, cells)
   - Verify Arabic/special characters render correctly
   - Verify table width/styling matches expected appearance

**Success Criteria**:
- ✅ Share button click triggers ShareAsset() method
- ✅ SessionHub broadcasts AssetShared event
- ✅ SessionCanvas receives and displays table HTML
- ✅ Table formatting preserved in reception
- ✅ No console errors during broadcast/reception

**Files Verified** (no modifications expected):
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` (ShareAsset method)
- `SPA/NoorCanvas/Hubs/SessionHub.cs` (ShareAsset hub method)
- `SPA/NoorCanvas/Pages/SessionCanvas.razor` (AssetShared listener)

**Estimated Time**: 1 hour

---

### Phase 5: Playwright Automated Test

**Objective**: Create Playwright E2E test to automate table sharing validation

**Tasks**:

1. **Create Test File**
   - File: `PlayWright/Tests/table-asset-share-e2e.spec.ts`
   - Pattern: Follow existing `continue-assetshare-e2e-broadcast.spec.ts` structure
   - Test structure:
     ```typescript
     test.describe('TABLE-ASSET-SHARE: End-to-End Table Sharing', () => {
       test('Complete table sharing from HostControlPanel to SessionCanvas', async ({ context }) => {
         // 1. Setup: Create host and canvas pages
         // 2. Navigate to HostControlPanel with table-containing session
         // 3. Start session to activate share buttons
         // 4. Verify table share button appears
         // 5. Click table share button
         // 6. Verify AssetShared broadcast in SessionCanvas
         // 7. Verify table HTML appears in SessionCanvas
         // 8. Validate table structure (thead, tbody, row count)
       });
     });
     ```

2. **Test Implementation Details**
   - Use session ID with known table content (e.g., session 213 or create test session)
   - Selectors:
     - Share button: `button[data-share-id^="asset-table-"]`
     - Received content: `[data-testid="shared-content"], .shared-asset-content`
   - Assertions:
     - Table element exists in SessionCanvas
     - Row count matches original table
     - Cell content matches (sample cells)
     - No JavaScript errors in console

3. **Console Logging**
   - Capture console messages for debugging
   - Filter for:
     - `AssetShared` events
     - `HCP-QUESTIONS:reception` logs
     - SignalR connection messages
   - Log to test output for CI/CD analysis

4. **Test Execution**
   - Run locally: `npx playwright test table-asset-share-e2e.spec.ts --headed`
   - Verify test passes consistently (3+ runs)
   - Add to test registry: `table-asset-enhancement/tests/test-registry.md`

**Success Criteria**:
- ✅ Test file created and runs successfully
- ✅ Test validates full E2E flow (share → broadcast → receive)
- ✅ Test assertions cover table structure validation
- ✅ Test documented in test-registry.md

**Files Created**:
- `PlayWright/Tests/table-asset-share-e2e.spec.ts` (new test)
- `.github/key-data-streams/table-asset-enhancement/tests/test-registry.md` (updated)

**Estimated Time**: 1 hour

---

### Phase 6: Documentation & Cleanup

**Objective**: Document findings, update KSESSIONS-HUB.md, and record verification results

**Tasks**:

1. **Update KSESSIONS-HUB.md**
   - File: `Workspaces/Documentation/KSESSIONS-HUB.MD`
   - Section: "Asset Types Configuration" (Line 92)
   - Add note confirming table asset is fully functional:
     ```markdown
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
