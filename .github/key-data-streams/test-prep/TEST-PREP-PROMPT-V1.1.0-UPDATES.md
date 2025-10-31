# Test-Prep Prompt Updates - KDS Integration

**Date**: October 31, 2025, 4:40 PM  
**Version**: 1.1.0  
**Changes**: Auto-cleanup of old markers + Full KDS integration

---

## 🎯 Changes Summary

### 1. Auto-Cleanup of Old Markers

**Problem**: Old markers from previous sessions caused confusion and prevented proper log correlation

**Solution**: Added Step 2 to `action=prep` workflow:

**Before**: Injected markers directly (could stack multiple sessions)  
**After**: Scans for and removes ALL old markers before injecting fresh ones

**Algorithm**:
```
FOR EACH file IN files:
  content = ReadFile(file)
  oldMarkers = Regex.FindAll(content, 'data-playwright-log-marker="[^"]*"')
  
  IF oldMarkers.Count > 0:
    FOR EACH marker IN oldMarkers:
      content = content.Replace(marker, "")
      Log(marker.ID, "removed")
    END FOR
    WriteFile(file, content)
  END IF
  
  # Proceed with fresh injection
END FOR
```

**Benefits**:
- ✅ Only ONE active session at a time
- ✅ No marker collision
- ✅ Clear log correlation
- ✅ Automatic cleanup report

---

### 2. KDS Browser Console Log Placeholder

**Problem**: Browser logs existed outside KDS system, making cross-session analysis difficult

**Solution**: Create structured placeholder in KDS during prep

**File Created**: `.github/key-data-streams/test-prep/sessions/{session}/browser-console-logs.md`

**Content**:
- Session metadata (ID, timestamp, components)
- Capture instructions (how to save console)
- Expected content checklist
- Status tracking

**Benefits**:
- ✅ Browser logs tied to KDS
- ✅ Session context preserved
- ✅ User knows where to save logs
- ✅ Placeholder prevents "file not found" errors

---

### 3. Enhanced Tracking File (KDS Links)

**Problem**: Tracking file didn't reference KDS structure

**Solution**: Added `kds` section to `injected-files.json`

**Before**:
```json
{
  "session": "212",
  "timestamp": "...",
  "files": [...],
  "status": "prepped"
}
```

**After**:
```json
{
  "session": "212",
  "timestamp": "...",
  "approach": "manual-dual-stream",
  "kds": {
    "sessionPlan": "../SESSION-212.md",
    "browserLogs": "./browser-console-logs.md",
    "serverLogs": "../../../../SPA/NoorCanvas/playwright-server-logs.txt",
    "trackingFile": "./injected-files.json"
  },
  "files": [...],
  "cleanup": {
    "oldMarkersFound": 11,
    "oldMarkersRemoved": 11,
    "previousSessions": ["20251031150100", "20251031150200"]
  },
  "status": "prepped"
}
```

**Benefits**:
- ✅ All session files discoverable
- ✅ Relative paths for portability
- ✅ Cleanup audit trail
- ✅ Previous session tracking

---

### 4. KDS-Integrated Cleanup

**Problem**: Cleanup deleted logs without archiving

**Solution**: Archive entire session folder to KDS `_ARCHIVE`

**Before**:
- Removed markers
- Deleted log files
- Lost all context

**After**:
```
Move: sessions/{session}/ → _ARCHIVE/session-{session}-archived-{timestamp}/

Archived:
- injected-files.json (tracking)
- browser-console-logs.md (logs)
- server-logs.txt (copy from wwwroot)
- SESSION-{session}.md (plan)
- generated-tests/*.spec.ts (if any)
```

**Benefits**:
- ✅ No data loss
- ✅ Full audit trail
- ✅ Reproducible debugging
- ✅ Cross-session comparison

---

### 5. Enhanced Output Messages

**Before**: Generic completion message  
**After**: Detailed KDS integration report

**New Output Includes**:
- Old markers cleaned count
- KDS file locations
- Session plan link
- Browser log placeholder path
- Cleanup report (if old markers removed)

**Example**:
```
🎯 Test Prep Complete

Session: 20251031163501
Files Prepped: 3 components
Old Markers Cleaned: 11 removed from 2 previous sessions
Tracking File: .github/key-data-streams/test-prep/sessions/20251031163501/injected-files.json

📁 KDS Integration:
- Session Plan: .github/key-data-streams/test-prep/SESSION-20251031163501.md
- Browser Logs Placeholder: sessions/20251031163501/browser-console-logs.md
- Server Logs: Copy from SPA/NoorCanvas/playwright-server-logs.txt
- Tracking: sessions/20251031163501/injected-files.json

📊 Cleanup Report:
- Previous sessions cleaned: 20251031150100, 20251031150200
- Total markers removed: 11
- Files affected: TranscriptCanvas.razor (4), SessionCanvas.razor (7)
```

---

## 📁 KDS Directory Structure

**Complete KDS Integration**:

```
.github/key-data-streams/test-prep/
├── README.md                                    ← System guide
├── E2E-TEST-CAPTURE-GUIDE.md                   ← Manual workflow
├── ROLLBACK-SUMMARY.md                         ← Why manual approach
├── SESSION-{session}.md                        ← Current session plan
├── PRE-FLIGHT-CHECK-{session}.md               ← Validation report
│
├── sessions/                                    ← Active sessions
│   └── {session}/
│       ├── injected-files.json                 ← Tracking + KDS links
│       ├── browser-console-logs.md             ← Captured/placeholder
│       └── test-generation-report.md           ← Review output
│
└── _ARCHIVE/                                    ← Historical sessions
    └── session-{session}-archived-{timestamp}/
        ├── injected-files.json                 ← Session metadata
        ├── browser-console-logs.md             ← Captured logs
        ├── server-logs.txt                     ← Server events
        ├── SESSION-{session}.md                ← Session plan
        └── generated-tests/                    ← Test files
            ├── hcp-asset-broadcast.spec.ts
            ├── sc-question-submit.spec.ts
            └── tc-transcript-share.spec.ts
```

---

## 🎯 Workflow Changes

### Before (v1.0.0)
1. User: `@workspace /test-prep #file:A.razor #file:B.razor`
2. Agent: Inject markers (may stack on old markers)
3. User: Run app, test manually
4. User: Save console manually (outside KDS)
5. User: `@workspace /test-prep action=generate`
6. Agent: Generate test
7. User: `@workspace /test-prep action=cleanup`
8. Agent: Delete logs, remove markers

### After (v1.1.0)
1. User: `@workspace /test-prep #file:A.razor #file:B.razor`
2. Agent: 
   - **Scan and remove old markers** (auto-cleanup)
   - Inject fresh markers
   - **Create KDS browser log placeholder**
   - Create session tracking with KDS links
   - Report cleanup stats
3. User: Run app, test manually
4. User: Save console to **KDS placeholder location**
5. User: `@workspace /test-prep action=review`
6. Agent: Analyze logs, report test potential
7. User: Approve test generation
8. User: `@workspace /test-prep action=generate`
9. Agent: Generate test
10. User: `@workspace /test-prep action=cleanup`
11. Agent: **Archive entire session to KDS** (preserve all context)

---

## ✅ Benefits

### For Users
- ✅ **No manual cleanup needed**: Old markers auto-removed
- ✅ **Clear save location**: Browser logs have designated KDS path
- ✅ **Audit trail**: All sessions archived with full context
- ✅ **Error prevention**: Placeholder prevents "file not found"

### For System
- ✅ **KDS compliance**: Rule #2b test metadata requirements met
- ✅ **Traceability**: Every session fully documented
- ✅ **Reproducibility**: Archives enable debugging old sessions
- ✅ **Cross-session analysis**: Compare logs across time

### For Test Quality
- ✅ **No marker collision**: Only one active session
- ✅ **Clean correlation**: Logs match markers exactly
- ✅ **Complete context**: Session plan + logs + tests linked
- ✅ **Historical comparison**: Archive enables regression analysis

---

## 🔄 Migration Path

**Existing Old Markers** (like current session):
- Next `/test-prep` run will auto-remove them
- Cleanup report shows what was removed
- No manual intervention needed

**Existing Logs Outside KDS**:
- Move manually to KDS placeholder locations
- Or re-run test scenarios with new session
- Future sessions auto-integrate with KDS

---

## 📚 Documentation Updated

**File**: `.github/prompts/test-prep.prompt.md`

**Sections Modified**:
1. **Execution Steps → Action: prep**
   - Added Step 2: Clean Up Old Markers
   - Renamed Step 2→3: Inject Fresh Logging
   - Added Step 4: Create KDS Browser Console Log Placeholder
   - Updated Step 5: Enhanced tracking file with KDS links
   - Updated Step 6: Enhanced output with cleanup report

2. **Execution Steps → Action: cleanup**
   - Updated Step 1: Load from KDS
   - Updated Step 3: Archive to KDS (not delete)
   - Added Step 4: Archive server logs
   - Updated Step 5: Enhanced output with archive stats

3. **Integration Points**
   - Added "With KDS System" section
   - Directory structure diagram
   - KDS benefits list
   - Rulebook compliance mapping

---

## 🚀 Next Steps

**For Current Session** (20251031163501):
1. Run updated `/test-prep` workflow
2. Old markers will be auto-removed
3. Fresh markers injected
4. KDS structure created
5. Browser log placeholder ready

**Command**:
```
@workspace /test-prep #file:HostControlPanel.razor #file:SessionCanvas.razor #file:TranscriptCanvas.razor
```

**Expected Output**:
- 11 old markers removed (4 from TranscriptCanvas, 7 from SessionCanvas)
- 3 fresh markers injected
- KDS structure created under `sessions/20251031163501/`
- Browser log placeholder at `sessions/20251031163501/browser-console-logs.md`

---

**Status**: ✅ test-prep.prompt.md fully updated and KDS-integrated  
**Version**: 1.1.0  
**Backward Compatible**: Yes (auto-cleanup handles migration)
