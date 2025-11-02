# Playwright Test Paths — Canonical Test Data Reference

## Required Test Data (Proven Working Patterns)

### Standard Test Tokens & IDs
**Session ID**: `212` (canonical test session with transcript data)
**Host Token**: `PQ9N5YWW` (working host control panel token - shows registration panel after authentication)
**User Token**: `KJAHA99L` (working participant token - API returns "Peter Parker" with UserGuid: b59e3dca-9330-40f5-9de8-9a5350fd2d6a)

### Core Test URLs
- **Host Control Panel**: `https://localhost:9091/host/control-panel/PQ9N5YWW`
- **Session Canvas (User Token)**: `https://localhost:9091/session/canvas/KJAHA99L` (API-based participant loading)
- **Session Canvas (Host Token)**: `https://localhost:9091/session/canvas/PQ9N5YWW` (Different content/behavior)
- **Registration Page**: `https://localhost:9091/session/join/PQ9N5YWW` (Host token shows registration panel)
- **Base URL**: `https://localhost:9091`

### Route Behavior Patterns
- **`/session/canvas/{token}`**: Direct session canvas access (API-based approach)
- **`/session/join/{token}`**: Registration flow (varies by token type)
- **Host tokens**: Show registration panels after authentication
- **User tokens**: Direct API-based participant identification

### API Endpoints & Expected Responses

#### Participant API (API-Based Approach)
**Endpoint**: `/api/participant/session/{token}/me`
**Method**: GET
**Purpose**: Retrieve current participant information directly from API (eliminates localStorage dependency)
**Expected Response Structure**:
```json
{
  "name": "Peter Parker",
  "userGuid": "b59e3dca-9330-40f5-9de8-9a5350fd2d6a", 
  "email": "peter.parker@test.com",
  "country": "Bahrain",
  "joinedAt": "2025-10-01T14:28:43.523333"
}
```
**Test Results**: 
- **KJAHA99L**: Returns "Peter Parker" participant data ✅
- **PQ9N5YWW**: May return 404 (host token behavior) ⚠️

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

#### Multi-Browser Participant Isolation Tests ✅ (API-Based Approach)
```typescript
// Navigate directly to session canvas (eliminates storage dependency)
await page.goto('https://localhost:9091/session/canvas/KJAHA99L');
await expect(page.locator('.session-canvas-root').first()).toBeVisible({ timeout: 10000 });

// Wait for API calls to complete 
await page.waitForTimeout(3000);

// Verify API-based participant loading
await expect(page.locator('.session-canvas-container').first()).toBeVisible({ timeout: 10000 });

// Expected behavior: User token KJAHA99L returns "Peter Parker"
// Host token PQ9N5YWW shows different content (host behavior)
```

#### API-Based Participant Verification ✅
```typescript
// Test participant API directly
const response = await page.request.get(`https://localhost:9091/api/participant/session/KJAHA99L/me`);
expect(response.status()).toBe(200);

const data = await response.json();
expect(data.name).toBe("Peter Parker");
expect(data.userGuid).toBe("b59e3dca-9330-40f5-9de8-9a5350fd2d6a");

// Demonstrates API-based approach eliminates "same name on multiple browsers" issue
```

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
- `Tests/UI/assetlookup-database-detection.spec.ts` ✅ (Asset detection)
- `Tests/UI/focused-assetshare-test.spec.ts` ✅ (Asset sharing)
- `PlayWright/tests/assetlookup-api-test.spec.ts` ✅ (API integration)
- `PlayWright/tests/multi-browser-participant-isolation.spec.ts` ✅ (API-based multi-browser isolation - ALL TESTS PASS)
- `PlayWright/tests/simple-session-test.spec.ts` ✅ (Session canvas validation)

#### Temporary Test Location
- `Workspaces/TEMP/` (for development/debug tests)

### Multi-Browser Isolation Testing (API-Based Solution) 

#### Problem Solved ✅
**Issue**: "Both tabs are still showing the same name on multiple browsers"
**Root Cause**: Storage-based participant identification (localStorage/sessionStorage)
**Solution**: Complete API-based approach using `/api/participant/session/{token}/me`

#### Test Results Summary
- **✅ Test 1**: Multi-browser isolation works - different browsers show different content
- **✅ Test 2**: Storage clearance graceful handling - API approach unaffected by localStorage/sessionStorage clearing  
- **✅ Test 3**: Page refresh persistence - participant identity maintained across refreshes

#### Key Implementation Details
- **Eliminated**: `InitializeUserGuidAsync()` method (storage-based approach)
- **Enhanced**: `LoadCurrentParticipantFromApiAsync()` for complete API-based participant loading
- **Created**: New endpoint `/api/participant/session/{token}/me` returning participant data
- **Result**: UserGuid retrieved from API for authentication, display name from API for UI

#### Token Behavior Analysis
**KJAHA99L (User Token)**:
- API returns: "Peter Parker" with UserGuid `b59e3dca-9330-40f5-9de8-9a5350fd2d6a`
- Session canvas loads successfully
- Consistent behavior across multiple browsers

**PQ9N5YWW (Host Token)**:
- Registration panel visible after authentication
- Different session canvas behavior (host vs participant)
- May return 404 for participant API (expected host token behavior)

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
