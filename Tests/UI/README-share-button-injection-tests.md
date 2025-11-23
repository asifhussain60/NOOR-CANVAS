# TDD Test: Share Button Injection System

**Test File:** `Tests/UI/verify-share-button-injection.spec.ts`  
**Created:** 2025-11-23  
**Author:** Asif Hussain

---

## 🎯 Test Purpose

Comprehensive validation of the share button injection system in Host Control Panel:
- **Golden section buttons** on H2 transcript sections
- **Blue asset buttons** on asset containers (Ayah Cards, Hadees, etc.)
- Styling verification (colors, dimensions, icons)
- Functional click handler validation

---

## 📋 Test Coverage

### 1. Golden Section Button Tests
- ✅ Buttons injected on all H2 sections
- ✅ Golden background color (#FFD700)
- ✅ 200px width
- ✅ Share-alt icon (fa-share-alt)
- ✅ "Share Section" text
- ✅ Centered with flex display

### 2. Blue Asset Button Tests
- ✅ Buttons injected on asset containers
- ✅ Blue background color (#007bff)
- ✅ 200px width
- ✅ Lightbulb icon (fa-lightbulb)
- ✅ "Share Asset" text
- ✅ Centered with flex display

### 3. Functional Tests
- ✅ Golden button click triggers share modal with section context
- ✅ Blue button click triggers share modal with asset context
- ✅ Both button types open appropriate share dialogs

### 4. Integration Tests
- ✅ Button injection preserves existing transcript content
- ✅ Multiple buttons can coexist (golden + blue)
- ✅ No disruption to document structure

---

## 🚀 How to Run

### Run All Tests
```powershell
cd "D:\PROJECTS\NOOR CANVAS\Tests\UI"
npx playwright test verify-share-button-injection.spec.ts --headed
```

### Run Specific Test
```powershell
npx playwright test verify-share-button-injection.spec.ts -g "Golden section buttons"
```

### Debug Mode
```powershell
npx playwright test verify-share-button-injection.spec.ts --debug
```

---

## 🔍 Expected Results

**All 7 tests should PASS:**
1. ✅ Golden section buttons are injected on H2 transcript sections
2. ✅ Blue asset buttons are injected on asset containers
3. ✅ Golden buttons have functional click handlers
4. ✅ Blue buttons have functional click handlers
5. ✅ Both button types are centered and properly styled
6. ✅ Button injection does not break existing transcript content
7. ✅ (Bonus) Multiple button types coexist without conflicts

---

## 📊 Current Status

**Test File:** Created  
**Implementation Status:** Awaiting execution  
**Known Issues:** Golden button injection may not be working (per user report)

---

## 🐛 Debugging Guide

### If Golden Buttons Don't Appear:
1. Check `transcript-section-parser.js` is loaded
2. Verify `transcriptUpdated` event is fired
3. Check JavaScript console for errors
4. Verify H2 elements exist in DOM before parser runs

### If Blue Buttons Don't Appear:
1. Check `AssetProcessingService.cs` is generating wrapper HTML
2. Verify `.asset-container` elements exist
3. Check server-side HTML transformation logs
4. Verify SignalR connection for real-time updates

### If Click Handlers Don't Work:
1. Check `noor-share-system.js` is loaded
2. Verify global click handlers are registered
3. Check share modal/dialog implementation
4. Verify event propagation not blocked

---

## 📝 Next Steps

1. **Run test to identify failures**
2. **Fix golden button injection** (likely `transcript-section-parser.js` issue)
3. **Verify blue button injection** (recently updated in `AssetProcessingService.cs`)
4. **Validate click handlers** (check `noor-share-system.js`)
5. **Re-run test until all 7 tests pass**

---

## 🔗 Related Files

- `SPA/NoorCanvas/wwwroot/js/transcript-section-parser.js` - Golden button injection
- `SPA/NoorCanvas/Services/AssetProcessingService.cs` - Blue button generation
- `SPA/NoorCanvas/wwwroot/js/noor-share-system.js` - Click handlers
- `SPA/NoorCanvas/Pages/HostControlPanel.razor` - Host control panel UI

---

**Copyright:** © 2024-2025 Asif Hussain. All rights reserved.
