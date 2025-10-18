# Test Validation Plan - transcript-canvas Refactoring
**Date:** 2025-10-18  
**Refactor Commit:** 3205c0ce  
**Scope:** Phase 1 - Debug Marker Cleanup (Phase 2 & 3 deferred)

## Summary of Changes
**Files Modified:**
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` - Removed ~10KB debug markers
- `Workspaces/Refactor/cleanup-debug-markers.ps1` - Cleanup automation script

**Impact Level:** LOW  
**Reason:** Cosmetic cleanup only - removed comments/debug markers, no functional code changed

---

## Critical Features to Test

### 1. **TranscriptCanvas Page Load & Rendering** ⭐⭐⭐
**Priority:** CRITICAL  
**Test Frequency:** Every refactoring iteration

#### Manual Test Steps:
1. Launch application: `nc` command
2. Navigate to: `https://localhost:9091/transcript/canvas/KJAHA99L`
3. **Expected Behavior:**
   - ✅ Page loads without errors
   - ✅ Purple-tinted background displays (distinguishes from SessionCanvas green)
   - ✅ "TRANSCRIPT VIEW" badge visible in header
   - ✅ NOOR Canvas logo displays correctly
   - ✅ Session title and description visible
   - ✅ Canvas content area renders full-width (no sidebar)

#### Automated Test:
```powershell
# Run existing Percy visual test
.\Scripts\run-transcript-canvas-percy-tests.ps1
```

#### Browser Console Checks:
- ✅ No JavaScript errors
- ✅ No CSS layout warnings
- ✅ SignalR connection establishes successfully

---

### 2. **Question Modal Functionality** ⭐⭐⭐
**Priority:** CRITICAL  
**Reason:** User interaction feature - must work flawlessly

#### Manual Test Steps:
1. Click "Ask a Question" button (purple button inline with welcome message)
2. **Expected:** Modal opens centered on screen
3. Enter question text (min 5 chars): "What is the meaning of Surah Al-Fatiha?"
4. Click "Submit" button (golden background)
5. **Expected:**
   - ✅ Question submits successfully
   - ✅ Toast notification appears ("Question submitted")
   - ✅ Modal closes automatically
   - ✅ Console shows: `[NOOR-QA-SUBMIT] Question submitted successfully`

#### Error Cases to Test:
- **Empty input:** Click Submit with no text → Should show validation error
- **Short input:** Enter 3 chars → Should show "minimum 5 characters" error
- **Network failure:** Disconnect network, submit → Should show error toast

#### Automated Test:
```powershell
# Run question broadcast test
.\.github\prompts.keys\transcript-canvas\scripts\run-question-broadcast-test.ps1
```

#### Test Data:
- **Session ID:** 212 (canonical test session)
- **UserToken:** `KJAHA99L`
- **Status:** "Created" (must allow question submission per Issue #67 fix)

---

### 3. **SignalR Real-Time Communication** ⭐⭐⭐
**Priority:** CRITICAL  
**Reason:** Core functionality for live session updates

#### Manual Test Steps:
1. Open **Host Control Panel**: `https://localhost:9091/host/PQ9N5YWW`
2. Open **TranscriptCanvas** (participant view): `https://localhost:9091/transcript/canvas/KJAHA99L`
3. In Host view, broadcast asset or annotation
4. **Expected in Participant View:**
   - ✅ Content updates in real-time (no page refresh)
   - ✅ SignalR status indicator shows "Connected" (green pulse)
   - ✅ Canvas content updates dynamically

#### SignalR Events to Verify:
- `AssetShared` - Asset broadcasts to canvas
- `QuestionReceived` - New questions appear in host Q&A panel
- `AnnotationReceived` - Annotations overlay on canvas
- `ParticipantJoined` - Participant list updates

#### Browser Console Monitoring:
```javascript
// Check SignalR connection status
console.log(window.signalRStatus); // Should be "Connected"

// Monitor SignalR events
// Look for: [SignalR] Connection established
// Look for: [SignalR] Asset received
```

#### Retry Logic Test:
- Disconnect network temporarily
- **Expected:** Status changes to "Reconnecting" (yellow spinner)
- Reconnect network
- **Expected:** Auto-reconnects, status returns to "Connected" (green)

---

### 4. **Session Validation & Error Handling** ⭐⭐
**Priority:** HIGH  
**Reason:** Security and data integrity

#### Test Cases:
| Scenario | URL | Expected Result |
|----------|-----|-----------------|
| **Valid Token** | `/transcript/canvas/KJAHA99L` | ✅ Session loads successfully |
| **Invalid Token** | `/transcript/canvas/INVALID123` | ✅ Shows "Session Not Found" error |
| **Empty Token** | `/transcript/canvas/` | ✅ Redirects or shows error |
| **Expired Session** | Use expired token | ✅ Shows appropriate error message |

#### Manual Steps:
1. Navigate to invalid token URL
2. **Expected:**
   - ✅ Error container displays with gold "Home" button
   - ✅ Error icon (⚠️) visible
   - ✅ Message: "Session not found" or similar
   - ✅ Can click "Home" to return to landing page

---

### 5. **Content Rendering & HTML Transformation** ⭐⭐
**Priority:** HIGH  
**Reason:** Islamic content must display correctly (Arabic text, formatting)

#### Test Content Types:
- **Arabic Text:** Quranic verses (RTL rendering, proper font)
- **HTML Assets:** Images, tables, formatted text
- **Mixed Content:** English + Arabic with proper bidirectional text
- **Special Characters:** Diacritics, Islamic symbols

#### Visual Checks:
- ✅ Arabic text renders right-to-left
- ✅ Font: Scheherazade New or Amiri (not default system font)
- ✅ Diacritics display correctly (not stripped or garbled)
- ✅ Line breaks and spacing appropriate
- ✅ No horizontal scrollbars (content fits canvas width)

#### Automated Test:
```powershell
# Percy visual regression - checks pixel-perfect rendering
.\Scripts\run-transcript-canvas-percy-tests.ps1
```

---

### 6. **Responsive Layout & Mobile View** ⭐⭐
**Priority:** HIGH  
**Reason:** Multi-device accessibility

#### Device Test Matrix:
| Device | Viewport | Key Checks |
|--------|----------|------------|
| **Desktop** | 1280x720 | Full-width canvas, purple theme, Ask button inline |
| **Tablet (iPad)** | 768x1024 | Canvas full-width, modal centered, button accessible |
| **Mobile (Portrait)** | 375x667 | Vertical layout, canvas top, button below, font readable |
| **Mobile (Landscape)** | 667x375 | Canvas full-width, modal overlay, scroll disabled |

#### Manual Test Steps:
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test each viewport size
4. **Verify:**
   - ✅ No horizontal scroll
   - ✅ All buttons reachable/clickable
   - ✅ Text readable (no cut-off)
   - ✅ Modal fits screen
   - ✅ Canvas content visible

---

### 7. **Browser Compatibility** ⭐
**Priority:** MEDIUM  
**Reason:** Cross-browser consistency

#### Test Browsers:
- ✅ **Chrome** (latest) - Primary browser
- ✅ **Edge** (Chromium) - Windows default
- ✅ **Firefox** (latest) - Gecko engine
- ✅ **Safari** (if available) - WebKit engine

#### Features to Verify Per Browser:
- Page load performance
- SignalR WebSocket connection
- Modal animations (smooth open/close)
- CSS grid layout rendering
- Font rendering (Arabic text)

---

### 8. **Performance & Load Time** ⭐
**Priority:** MEDIUM  
**Reason:** User experience quality

#### Metrics to Measure:
- **Initial Page Load:** < 2 seconds
- **SignalR Connection:** < 500ms
- **Modal Open Animation:** Smooth (60fps)
- **Content Update (SignalR):** < 100ms latency

#### Tools:
- Chrome DevTools → Performance tab
- Network tab → Check waterfall chart
- Lighthouse → Run audit

#### Test Script:
```javascript
// Browser console performance check
console.time('PageLoad');
window.addEventListener('load', () => {
    console.timeEnd('PageLoad');
    console.log('SignalR Status:', window.signalRStatus);
});
```

---

## Regression Test Suite

### Automated Tests to Run:
```powershell
# 1. Question Submission & Broadcast
.\.github\prompts.keys\transcript-canvas\scripts\run-question-broadcast-test.ps1

# 2. Visual Regression (Percy)
.\Scripts\run-transcript-canvas-percy-tests.ps1

# 3. HTML Structure Validation
npx playwright test transcript-canvas-html-structure.spec.ts

# 4. Modal Submit Flow
.\.github\prompts.keys\transcript-canvas\scripts\run-transcript-modal-submit-console-test.ps1

# 5. Full UI Test Suite
cd Tests/UI
npx playwright test transcript*.spec.ts --headed
```

### Build Validation:
```powershell
# Clean build (both configurations)
dotnet clean
dotnet build --configuration Debug --verbosity normal
dotnet build --configuration Release --verbosity normal

# Code formatting
dotnet format --verify-no-changes

# Static analysis
.\Workspaces\CodeQuality\run-roslynator.ps1
```

---

## Known Issues & Edge Cases

### Issue #67: Question Submission for "Created" Status
**Status:** FIXED (commit e460b61b)  
**Test:** Ensure questions submit successfully for sessions with `Status="Created"`
- Session 212 has this status - use for testing

### Issue #80: (If applicable)
**Status:** Check `.guards/Issue-80-Protection.ps1` for protection requirements

### Edge Cases:
1. **Long Questions:** Test with 500+ character question → Should handle gracefully
2. **Rapid Submissions:** Click Submit 5 times quickly → Should prevent duplicates
3. **Network Interruption:** Disconnect during submit → Should retry or show error
4. **Concurrent Users:** Multiple participants submit questions → All should appear
5. **Session Transitions:** Session status changes mid-use → UI updates appropriately

---

## Test Execution Checklist

### Pre-Deployment Testing:
- [ ] Run all automated Playwright tests
- [ ] Execute Percy visual regression tests
- [ ] Verify build succeeds (Debug + Release)
- [ ] Check browser console for errors
- [ ] Test question submission flow
- [ ] Verify SignalR connection stability
- [ ] Test responsive layouts (mobile/tablet/desktop)

### Manual QA Checklist:
- [ ] Load TranscriptCanvas with valid token
- [ ] Verify purple theme and badge display
- [ ] Open question modal and submit question
- [ ] Check toast notifications appear
- [ ] Monitor SignalR real-time updates
- [ ] Test on multiple browsers
- [ ] Verify mobile responsive behavior
- [ ] Check Arabic text rendering
- [ ] Test error states (invalid tokens)
- [ ] Verify network retry logic

### Performance Validation:
- [ ] Page load < 2 seconds
- [ ] SignalR connection < 500ms
- [ ] No memory leaks (run for 30+ minutes)
- [ ] Smooth animations (60fps)

---

## Contacts for Issues
- **Developer:** GitHub Copilot (refactor agent)
- **Test Framework:** `.github/prompts.keys/transcript-canvas/tests/test-registry.md`
- **Issue Tracker:** Check `.guards/` folder for protection scripts

---

## Notes
- **Phase 1 Complete:** Debug markers removed, no functional changes
- **Phase 2 & 3 Deferred:** CSS consolidation and SignalR service extraction recommended for future tasks
- **Risk Level:** LOW - Cosmetic changes only, existing functionality intact
- **Rollback:** Use checkpoint commit if issues arise: `checkpoint: pre-refactor transcript-canvas`

---

## Approval
**Refactor Agent:** GitHub Copilot  
**Date:** 2025-10-18  
**Status:** ✅ Phase 1 Complete, Build Clean, Ready for Testing
