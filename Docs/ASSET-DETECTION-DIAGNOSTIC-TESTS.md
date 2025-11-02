# Asset Detection Diagnostic Tests - Session 212

## Overview

This document describes the comprehensive diagnostic test suite created to identify where asset detection is failing for Session 212's transcript HTML.

## Test File Location

**Path:** `Tests/Unit/AssetDetectionDiagnosticTests.cs`

## Purpose

The test suite processes the Session 212 transcript HTML (which contains an image asset) through each phase of the transformation pipeline to pinpoint exactly where the asset detection breaks down.

## Session 212 Asset Details

### Image Asset
- **File:** `Resources/IMAGES/212/34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg`
- **HTML Attributes:**
  - `data-type="image"`
  - `data-image-id="34fca08b-43b3-4d46-b346-0a50d8ceac6d"`
  - `data-session-id="212"`
  - `data-insertion-id="299a431f-3ed5-4560-904e-8f3d4aa36364"`
  - `data-content-type="image"`

### Expected CSS Selector
```css
img[data-type='image']
```

## Transformation Pipeline

The tests trace HTML through 4 phases:

### Phase 1: HtmlParsingService
- **Purpose:** Security validation, sanitization, Blazor compatibility
- **Test:** `Phase1_HtmlParsingService_ShouldPreserveImageAsset`
- **Validates:**
  - Image element is preserved
  - Image attributes remain intact
  - No unwanted transformations occur

### Phase 2: MediaUrlTransformService  
- **Purpose:** Transform KSESSIONS paths to NOOR CANVAS environment URLs
- **Test:** `Phase2_MediaUrlTransform_ShouldPreserveImageAsset`
- **Validates:**
  - Image element still exists after URL transformation
  - Image ID attributes preserved
  - URL may be transformed but element structure intact

### Phase 3: AssetProcessingService.MarkAssetLocationsAsync
- **Purpose:** Add location markers for asset discovery WITHOUT injecting buttons
- **Test:** `Phase3_MarkAssetLocations_ShouldDetectImageAsset`
- **Validates:**
  - CSS selector `img[data-type='image']` matches the image
  - Marker attributes added:
    - `data-noor-asset-marker="true"`
    - `data-asset-type="inserted-image"`
    - `data-share-id="asset-inserted-image-1"`
    - `data-display-name="Inserted Image"`
  - HTML comment marker inserted before element

**This is the CRITICAL phase - if this fails, asset is not being detected!**

### Phase 4: ShareButtonInjectionService  
- **Purpose:** Inject share buttons for detected assets
- **Test:** `Phase4_ShareButtonInjection_ShouldInjectButtonForImage`
- **Validates:**
  - Share button HTML injected
  - Button has correct ID: `share-btn-image-1`
  - Button has `data-share-button="asset"` attribute
  - Image wrapped in `asset-share-wrapper` div

## Full Pipeline Test

**Test:** `FullPipeline_UnifiedTransformService_ShouldDetectAndProcessImageAsset`

Tests the complete transformation through `UnifiedHtmlTransformService.TransformForHostAsync()`:
1. HTML parsing
2. Media URL transformation  
3. Asset location marking
4. Share button injection

**Expected Result:** Fully transformed HTML with image asset detected, marked, and share button injected.

## Diagnostic Helper Tests

### Asset Lookup API Test
**Test:** `Diagnostic_CheckAssetLookupApiResponse`
- Verifies the AssetLookup API returns correct data
- Confirms CSS selectors are properly configured

### CSS Selector Verification
**Test:** `Diagnostic_VerifyImageMatchesCssSelector`
- Tests multiple CSS selector variations
- Identifies which selector successfully matches the image
- Uses AngleSharp to parse HTML and query elements

Selector variations tested:
```css
img[data-type='image']
img[data-type="image"]
img
img[data-image-id]
img[data-session-id='212']
img[src*='34fca08b-43b3-4d46-b346-0a50d8ceac6d']
```

## How to Run Tests

### Automated Method (Recommended)

Use the provided PowerShell script that handles all setup automatically:

```powershell
# Run all diagnostic tests (stops app automatically)
.\Scripts\run-asset-detection-diagnostic-tests.ps1

# Run specific test phase
.\Scripts\run-asset-detection-diagnostic-tests.ps1 -Filter "Phase3_MarkAssetLocations"

# Keep app stopped after tests
.\Scripts\run-asset-detection-diagnostic-tests.ps1 -KeepAppStopped
```

The script will:
1. ✅ Stop any running NoorCanvas instances
2. ✅ Verify fixture file exists
3. ✅ Build the test project
4. ✅ Run tests with detailed output
5. ✅ Display results and guidance

### Manual Method

If you prefer manual control:

#### Prerequisites
1. Stop the running NoorCanvas application
   ```powershell
   # Find and stop NoorCanvas processes
   Get-Process -Name "NoorCanvas" | Stop-Process -Force
   ```
2. Ensure Session 212 fixture file exists: `Tests/Fixtures/session-212-transcript.html`

### Run All Diagnostic Tests
```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tests\Unit"
dotnet test --filter "AssetDetectionDiagnosticTests"
```

### Run Specific Test
```powershell
dotnet test --filter "Phase3_MarkAssetLocations_ShouldDetectImageAsset"
```

### Run with Verbose Logging
```powershell
dotnet test --filter "AssetDetectionDiagnosticTests" --verbosity detailed
```

## Expected Diagnostic Output

Each test writes detailed diagnostic information to `System.Diagnostics.Debug`:

```
[DIAGNOSTIC] Image found at index 1234
[DIAGNOSTIC] Image HTML: <img src="Resources/IMAGES/212/..."

[PHASE 1 - PARSING] Input length: 5000
[PHASE 1 - PARSING] Output length: 4950
[PHASE 1 - PARSING] Image preserved: True

[PHASE 2 - MEDIA TRANSFORM] URL transformed: True

[PHASE 3 - MARK ASSETS] Has asset marker: True
[PHASE 3 - MARK ASSETS] Has asset type: True
[PHASE 3 - MARK ASSETS] Has share ID: True
[PHASE 3 - MARKED IMAGE]: <img data-noor-asset-marker="true"...

[PHASE 4 - SHARE BUTTONS] Has share button: True
[PHASE 4 - SHARE BUTTON]: <button id="share-btn-image-1"...

=== FULL PIPELINE DIAGNOSTIC ===
Input length: 5000
Output length: 5500
Has image: True
Has asset marker: True
Has share button: True
=== TRANSFORMED IMAGE CONTEXT ===
[200 chars before image] <img data-noor-asset-marker...> [600 chars total]
```

## Troubleshooting

### If Phase 1 Fails
- **Issue:** Image being stripped during HTML parsing
- **Check:** HtmlParsingService sanitization rules
- **Solution:** Ensure `<img>` elements with data attributes aren't being removed

### If Phase 2 Fails
- **Issue:** Media URL transformation corrupting image element
- **Check:** MediaUrlTransformService regex patterns
- **Solution:** Verify transformation preserves all image attributes

### If Phase 3 Fails ⚠️ MOST LIKELY FAILURE POINT
- **Issue:** CSS selector not matching the image element
- **Possible Causes:**
  1. AssetLookup table has incorrect CSS selector
  2. Image attributes changed during Phase 1/2
  3. AngleSharp query not finding the element
- **Debug Steps:**
  1. Run `Diagnostic_VerifyImageMatchesCssSelector` to see which selectors work
  2. Check AssetLookup database table for `inserted-image` entry
  3. Verify `CssSelector` column value matches actual HTML structure
  4. Enable detailed logging in `AssetProcessingService.MarkAssetLocationsAsync`

### If Phase 4 Fails
- **Issue:** Share button injection logic failing
- **Check:** ShareButtonInjectionService container detection
- **Solution:** Verify `data-asset-id` matching logic

## Mock Setup

The tests mock HTTP API responses for:

1. **AssetLookup API** (`/api/host/asset-lookup`):
```json
{
  "success": true,
  "assetLookups": [
    {
      "assetLookupId": 1,
      "assetIdentifier": "inserted-image",
      "assetType": "image",
      "cssSelector": "img[data-type='image']",
      "displayName": "Inserted Image",
      "isActive": true
    }
  ]
}
```

2. **SessionAssets API** (`/api/host/sessions/212/assets`):
```json
{
  "assets": [
    {
      "assetId": 1,
      "assetType": "image",
      "assetSelector": "<img[^>]*data-type=\"image\"[^>]*>",
      "position": 1
    }
  ]
}
```

## Key Assertions

### Phase 3 (Asset Location Marking)
```csharp
Assert.True(hasAssetMarker, "Image should have data-noor-asset-marker attribute");
Assert.True(hasAssetType, "Image should have data-asset-type attribute");
Assert.True(hasShareId, "Image should have data-share-id attribute");
```

### Phase 4 (Share Button Injection)
```csharp
Assert.True(hasShareButton, "Share button should be injected for image asset");
Assert.True(hasButtonId, "Share button should have unique ID");
Assert.True(hasAssetWrapper, "Image should be wrapped in asset-share-wrapper");
```

## Next Steps After Running Tests

1. **Identify failing phase** from test results
2. **Review diagnostic output** for that phase
3. **Check service logs** in application for corresponding errors
4. **Fix root cause** based on diagnostic information
5. **Re-run tests** to verify fix

## Related Files

- **Test File:** `Tests/Unit/AssetDetectionDiagnosticTests.cs`
- **Test Project:** `Tests/Unit/NoorCanvas.Tests.Unit.csproj`
- **Automation Script:** `Scripts/run-asset-detection-diagnostic-tests.ps1`
- **Fixture:** `Tests/Fixtures/session-212-transcript.html`
- **Services Tested:**
  - `SPA/NoorCanvas/Services/HtmlParsingService.cs`
  - `SPA/NoorCanvas/Services/MediaUrlTransformService.cs`
  - `SPA/NoorCanvas/Services/AssetProcessingService.cs`
  - `SPA/NoorCanvas/Services/ShareButtonInjectionService.cs`
  - `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs`

## Improvements & Robustness Features

### ✅ Enhanced Fixture Path Resolution
The tests now use robust path discovery with fallback:
- Primary: `AppContext.BaseDirectory` with relative navigation
- Fallback: `Directory.GetCurrentDirectory()` with relative path
- Detailed error messages showing all attempted paths

### ✅ Configuration Mocking
`MediaUrlTransformService` now receives properly configured mock:
```csharp
configMock.Setup(c => c["MediaStorage:BaseUrl"]).Returns("https://localhost:9091");
configMock.Setup(c => c["MediaStorage:CDN:Enabled"]).Returns("false");
```

### ✅ Integration Test for Database Configuration
New test verifies AssetLookup API configuration:
```csharp
Integration_AssetLookupApi_ShouldReturnImageConfiguration()
```
This ensures the CSS selector configured in the database matches expectations.

### ✅ Automated Test Execution Script
PowerShell script handles:
- Process detection and termination
- Fixture validation
- Build orchestration
- Test execution with proper filtering
- Results display with guidance

## Test Enhancements

### Additional Tests Added

**`Integration_AssetLookupApi_ShouldReturnImageConfiguration`**
- Validates AssetLookup API returns correct configuration
- Verifies CSS selector: `img[data-type='image']`
- Confirms asset type, display name, and active status
- Provides diagnostic output for configuration validation

## Database Tables Referenced

- **AssetLookup:** Stores CSS selectors for asset types
- **SessionAssets:** Stores detected assets per session

## CSS Selector Deep Dive

The critical selector that should match Session 212's image:

```css
img[data-type='image']
```

**Matches:**
```html
<img src="Resources/IMAGES/212/34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg" 
     style="width: 547px;" 
     class="fr-fic fr-dib imgResponsive fr-bordered" 
     data-type="image" 
     data-image-id="34fca08b-43b3-4d46-b346-0a50d8ceac6d" 
     data-session-id="212" 
     data-insertion-id="299a431f-3ed5-4560-904e-8f3d4aa36364" 
     data-content-type="image">
```

**Why this selector:**
- ✅ Specific enough to target only inserted images
- ✅ Excludes decorative/UI images
- ✅ Matches FroalaEditor's data attribute pattern
- ✅ Compatible with AngleSharp CSS query engine

## Conclusion

This comprehensive test suite provides complete visibility into the asset detection pipeline for Session 212. By running these tests, you can pinpoint exactly where and why the image asset is not being detected and processed correctly.

The most likely failure point is **Phase 3** (asset location marking), where the CSS selector needs to successfully match the image element in the parsed and transformed HTML.
