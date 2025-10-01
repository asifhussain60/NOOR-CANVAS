# Playwright Test Paths — Canonical Test Data Reference

## Required Test Data (Proven Working Patterns)

### Standard Test Tokens & IDs
**Session ID**: `212` (canonical test session with transcript data)
**Host Token**: `PQ9N5YWW` (working host control panel token)
**User Token**: `KJAHA99L` (working participant token)

### Core Test URLs
- **Host Control Panel**: `https://localhost:9091/host/control-panel/PQ9N5YWW`
- **Session Canvas**: `https://localhost:9091/session/KJAHA99L`
- **Base URL**: `https://localhost:9091`

### API Endpoints & Expected Responses

#### Asset Lookup API
**Endpoint**: `/api/host/asset-lookup`
**Method**: GET
**Expected Response Structure**:
```json
{
  "success": true,
  "assetLookups": [
    {
      "assetId": 1,
      "assetIdentifier": "ayah-card", 
      "cssSelector": ".ayah-card",
      "displayName": "Quranic Verse Card",
      "isActive": true
    }
  ],
  "totalCount": 8
}
```

#### Session Details API
**Endpoint**: `/api/host/session-details/212`
**Method**: GET
**Query Parameter**: `guid=debug-asset-detection`
**Expected Response**: Contains session transcript with HTML content for asset detection

#### Asset Patterns API
**Endpoint**: `/api/host/asset-patterns/212`
**Method**: GET
**Query Parameter**: `guid={hostToken}`
**Expected Response**: Asset detection patterns for CSS selector matching

### Database Schema References

#### AssetLookup Table
Contains 8 active asset types:
- `ayah-card` - CSS: `.ayah-card`
- `inserted-hadees` - CSS: `.inserted-hadees`
- `etymology-card` - CSS: `.etymology-card`
- `inserted-dua` - CSS: `.inserted-dua`
- `islamic-table` - CSS: `.islamic-table`
- `inlineArabic` - CSS: `.inlineArabic`
- `img` - CSS: `img`
- `audio` - CSS: `audio`

#### SessionTranscripts Table
- Session 212 contains valid transcript data with detectable assets
- Used for asset detection validation via AngleSharp parsing

### Proven Test Patterns

#### Asset Detection Tests
```typescript
// Navigate to Host Control Panel
await page.goto('https://localhost:9091/host/control-panel/PQ9N5YWW');
await page.waitForLoadState('networkidle');

// Verify NOOR Canvas branding loads
await expect(page.locator('text=NOOR Canvas')).toBeVisible();

// Start session to activate features
const startButton = page.locator('button:has-text("Start Session")');
if (await startButton.isVisible({ timeout: 3000 })) {
    await startButton.click();
    await page.waitForTimeout(3000);
}
```

#### API Integration Tests
```typescript
// Test AssetLookup API directly
await page.goto('https://localhost:9091/api/host/asset-lookup');
const responseText = await page.textContent('body');
const response = JSON.parse(responseText || '{}');
expect(response.success).toBe(true);
expect(response.assetLookups).toBeDefined();
```

#### Share Button Tests
```typescript
// Wait for share buttons to be injected
await page.waitForSelector('.ks-share-button', { timeout: 10000 });

// Validate data attributes
const shareButtons = await page.locator('.ks-share-button').all();
for (const button of shareButtons) {
    const shareId = await button.getAttribute('data-share-id');
    const assetType = await button.getAttribute('data-asset-type');
    expect(shareId).toBeTruthy();
    expect(assetType).toBeTruthy();
}
```

### Environment Setup

#### Required Mode
**PW_MODE**: `standalone` (enables webServer automatic .NET app management)
**Command**: `$env:PW_MODE="standalone"` (PowerShell)

#### Configuration File
**Path**: `config/testing/playwright.config.cjs`
**webServer Settings**:
- `command: 'dotnet run'`
- `cwd: '../../SPA/NoorCanvas'`
- `port: 9091`
- `timeout: 60000`

### Common Failure Scenarios (Avoid These)

#### Invalid Tokens
- ❌ `TEST1234` (causes authentication failures)
- ❌ `HOST212A` (deprecated token format)
- ❌ Random session IDs (use only Session 212 for consistency)

#### Incorrect API Calls
- ❌ Direct database access in tests (use API endpoints only)
- ❌ Missing query parameters (`guid` parameter required for most endpoints)
- ❌ Wrong session ID (use 212 for asset detection tests)

#### App Lifecycle Issues
- ❌ Manual app startup via PowerShell scripts
- ❌ Missing `PW_MODE=standalone` environment variable
- ❌ Not waiting for `networkidle` state after navigation

### Test File Organization

#### Working Test Locations
- `Tests/UI/assetlookup-database-detection.spec.ts` ✅
- `Tests/UI/focused-assetshare-test.spec.ts` ✅
- `PlayWright/Tests/assetlookup-api-test.spec.ts` ✅

#### Temporary Test Location
- `Workspaces/TEMP/` (for development/debug tests)

### Asset Detection Validation

#### Expected Asset Counts (Session 212)
Based on successful test runs:
- Multiple ayah-card instances detected
- Various Islamic content elements present
- Total assets > 0 when properly detected

#### CSS Selector Testing
Use AngleSharp parsing with selectors from AssetLookup table:
```csharp
var elements = document.QuerySelectorAll(lookup.CssSelector ?? "");
if (elements.Length > 0) {
    totalAssetsFound += elements.Length;
}
```

---
## Sync Protocol
This file consolidates **PROVEN working patterns** from successful test implementations.  
- Update with new working patterns as they are validated
- Remove obsolete or failing test approaches
- Maintain Session 212 and PQ9N5YWW as canonical test data unless specified otherwise
- All patterns must be validated against actual working code before inclusion
