# test-registry.md - table-asset-enhancement

---
**Key**: table-asset-enhancement  
**Purpose**: Track all tests for table asset sharing functionality  
**Created**: 2025-10-27
---

## Test Overview

**Testing Strategy**: Verification-focused with E2E automation

**Test Layers**:
1. Database Verification (SQL queries)
2. API Testing (AssetLookup endpoint)
3. Manual E2E Testing (HostControlPanel → SessionCanvas)
4. Automated E2E Testing (Playwright)

---

## Manual Tests

### MT-1: Database Verification

**Purpose**: Confirm table entry exists in canvas.AssetLookup table

**Test Steps**:
1. Connect to KSESSIONS_DEV database
2. Execute query:
   ```sql
   SELECT AssetId, AssetIdentifier, AssetType, CssSelector, DisplayName, IsActive
   FROM canvas.AssetLookup
   WHERE AssetIdentifier = 'table'
   ```
3. Verify results:
   - 1 row returned
   - IsActive = 1 (true)
   - CssSelector = 'table[style="width: 100%;"]' (or updated value)
   - DisplayName = 'Table'

**Expected Result**: ✅ Table entry exists and is active

**Status**: Not Run  
**Last Run**: -  
**Pass/Fail**: -

---

### MT-2: AssetLookup API Test

**Purpose**: Verify API endpoint returns table asset configuration

**Test Steps**:
1. Start NoorCanvas application (dotnet run)
2. Send GET request: `https://localhost:9091/api/host/asset-lookup`
3. Inspect JSON response
4. Verify table entry present:
   ```json
   {
     "assetIdentifier": "table",
     "cssSelector": "table[style='width: 100%;']",
     "displayName": "Table",
     "isActive": true
   }
   ```

**Expected Result**: ✅ API returns table asset in list

**Status**: Not Run  
**Last Run**: -  
**Pass/Fail**: -

---

### MT-3: Share Button Injection Test

**Purpose**: Verify blue share buttons appear above tables in HostControlPanel

**Test Steps**:
1. Start NoorCanvas application
2. Navigate to HostControlPanel for session with table transcript (e.g., session 213)
3. Start session (status = "Active")
4. Inspect transcript HTML in browser DevTools
5. Verify share buttons present:
   - Button selector: `button[data-share-id^="asset-table-"]`
   - Button text: "SHARE TABLE" or "Share Table"
   - Button positioned above/before table element
6. Verify data-asset-id attribute on table:
   - Table selector: `table[data-asset-id^="asset-table-"]`

**Expected Result**: ✅ Share buttons appear for each table

**Status**: Not Run  
**Last Run**: -  
**Pass/Fail**: -  
**Screenshot**: -

---

### MT-4: Manual E2E Sharing Test

**Purpose**: Verify complete flow from share button click to SessionCanvas reception

**Test Steps**:
1. Setup:
   - Open HostControlPanel in browser tab 1
   - Open SessionCanvas (as participant) in browser tab 2
   - Use same session for both (e.g., session 213)
2. Action:
   - In tab 1 (Host): Click first table share button
3. Verification:
   - Check tab 1 console for SignalR broadcast logs
   - Check tab 2 console for AssetShared reception logs
   - Verify table HTML appears in tab 2 SessionCanvas
   - Verify table structure preserved (thead, tbody, rows, cells)
   - Verify Arabic text renders correctly

**Expected Result**: ✅ Table broadcasts successfully and appears in SessionCanvas

**Status**: Not Run  
**Last Run**: -  
**Pass/Fail**: -  
**Screenshot Before**: -  
**Screenshot After**: -

---

## Automated Tests

### AT-1: Playwright E2E Table Sharing Test

**File**: `PlayWright/Tests/table-asset-share-e2e.spec.ts`

**Purpose**: Automate end-to-end table sharing validation

**Test Spec**:
```typescript
test.describe('TABLE-ASSET-SHARE: End-to-End Table Sharing', () => {
  test('Complete table sharing from HostControlPanel to SessionCanvas', async ({ context }) => {
    // 1. Setup: Create host and canvas pages
    // 2. Navigate to HostControlPanel with table session
    // 3. Start session to activate share buttons
    // 4. Verify table share button appears
    // 5. Click table share button
    // 6. Verify AssetShared broadcast in SessionCanvas
    // 7. Verify table HTML appears in SessionCanvas
    // 8. Validate table structure (thead, tbody, row count)
  });
});
```

**Assertions**:
- ✅ Share button detected: `button[data-share-id^="asset-table-"]`
- ✅ Share button clicked successfully
- ✅ SessionCanvas receives AssetShared event (console log check)
- ✅ Table element appears in SessionCanvas: `table`
- ✅ Table has expected structure: `thead`, `tbody`
- ✅ Row count matches original table
- ✅ Sample cell content matches (e.g., "First Repetition")

**Status**: Not Created  
**Last Run**: -  
**Pass Rate**: -  
**Flakiness**: -

---

### AT-2: Percy Visual Regression Test (Optional)

**File**: `PlayWright/Tests/table-asset-share-percy.spec.ts` (optional)

**Purpose**: Visual validation of table appearance in SessionCanvas

**Snapshots**:
1. Table share button in HostControlPanel
2. Received table in SessionCanvas
3. Table with Arabic text rendering

**Status**: Deferred (optional enhancement)

---

## Test Execution Log

### Run 1: TBD
- **Date**: -
- **Environment**: Development (localhost:9091)
- **Session Used**: -
- **Results**: -
- **Issues**: -

---

## Known Issues

*(None yet - populate after test execution)*

---

## Test Data

### Test Session Requirements

**Criteria**:
- Session must have transcript with at least one table
- Table should contain:
  - Header row (thead)
  - Multiple body rows (tbody)
  - Arabic/special characters (for rendering validation)
- Preferred session IDs: 213 (if contains table)

**Sample Table HTML** (from user):
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

---

## References

**Existing Test Patterns**:
- `PlayWright/Tests/continue-assetshare-e2e-broadcast.spec.ts` (Asset broadcasting pattern)
- `PlayWright/Tests/continue-assetshare-enhanced-broadcast.spec.ts` (Enhanced hub matching)

**Documentation**:
- `.github/key-data-streams/table-asset-enhancement/table-asset-enhancement.plan.md` (Phase 5: Testing)

---

**END OF TEST REGISTRY**
