# table-asset-enhancement

**Status**: Draft v1.1 (Updated)  
**Created**: 2025-10-27  
**Last Updated**: 2025-10-27  
**Branch**: development

---

## Purpose

Enable HTML tables in HCP session transcripts to be treated as shareable assets with share button injection and SignalR broadcasting to receivers (SessionCanvas, TranscriptCanvas).

**Update (v1.1)**: User confirmed CSS selector needs simplification - change from `table[style="width: 100%;"]` to just `table` to match ALL tables.

---

## Quick Start

### Execute Plan
```powershell
.github/key-data-streams/table-asset-enhancement/execute-plan.ps1
```

### Run Specific Phase
```powershell
.github/key-data-streams/table-asset-enhancement/execute-plan.ps1 -StartPhase 3 -EndPhase 3
```

### Dry Run
```powershell
.github/key-data-streams/table-asset-enhancement/execute-plan.ps1 -DryRun
```

---

## Key Discovery

**Tables already exist in `canvas.AssetLookup` table!**

This was added in Migration `20250920222544_AddAssetLookupTable.cs` with:
- AssetIdentifier: `"table"`
- CssSelector: `"table[style=\"width: 100%;\"]"` ← **TOO RESTRICTIVE**
- DisplayName: `"Table"`
- IsActive: `true`

**v1.1 Update**: User confirmed selector needs changing to just `"table"` (no style requirement) so ALL tables can be shared.

**Implication**: This work is **CSS selector update + verification** rather than new implementation.

---

## Phases

1. **Database Verification** (15 min) - Verify AssetLookup entry exists
2. **CSS Selector Update** (15 min, **MANDATORY**) - Update selector to `table` (user confirmed)
3. **Asset Processing Verification** (1 hour) - Verify share buttons inject correctly
4. **E2E Manual Test** (1 hour) - Test complete broadcast/reception flow
5. **Playwright Test** (1 hour) - Automate E2E test
6. **Documentation** (30 min) - Update docs and create verification report

**Total Estimated Time**: 2-3 hours

**Change in v1.1**: Phase 2 changed from CONDITIONAL to MANDATORY per user request

---

## Files

### Plan Files
- `table-asset-enhancement.plan.md` - Complete technical plan (633 lines)
- `table-asset-enhancement.plan.json` - Phase tracking metadata
- `work-log.md` - Execution timeline and notes
- `execute-plan.ps1` - Auto-execution script

### Tests
- `tests/test-registry.md` - Test tracking (manual + automated)
- (Future) `PlayWright/Tests/table-asset-share-e2e.spec.ts` - E2E test

---

## Architecture Context

**Asset Processing Pipeline**:
```
SessionTranscript HTML
  ↓
AssetProcessingService.TransformTranscriptHtmlAsync()
  ↓
InjectAssetShareButtonsAsync() - Loads AssetLookup from API
  ↓
ProcessAssetType() - For each asset type (including table)
  ↓
ProcessAssetElement() - Injects share button before element
  ↓
CreateShareButtonHtml() - Generates blue-themed button
```

**Broadcasting Pipeline**:
```
Host clicks share button
  ↓
HostControlPanel.ShareAsset(shareId, assetType, instanceNumber)
  ↓
SessionHub.ShareAsset(sessionId, assetData)
  ↓
Broadcast to group: session_{sessionId}
  ↓
SessionCanvas/TranscriptCanvas - "AssetShared" listener
  ↓
Display in Model.SharedAssetContent
```

---

## Related Keys

- **transcript-canvas** - TranscriptCanvas.razor UI component
- **hcp** - Host Control Panel components

---

## References

**Database**:
- Migration: `SPA/NoorCanvas/Migrations/20250920222544_AddAssetLookupTable.cs`
- Model: `SPA/NoorCanvas/Models/Simplified/AssetLookup.cs`
- Table: `canvas.AssetLookup`

**Services**:
- `SPA/NoorCanvas/Services/AssetProcessingService.cs`
- `SPA/NoorCanvas/Services/HostAssetService.cs`

**SignalR**:
- `SPA/NoorCanvas/Hubs/SessionHub.cs`

**UI**:
- `SPA/NoorCanvas/Pages/HostControlPanel.razor`
- `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**Documentation**:
- `Workspaces/Documentation/KSESSIONS-HUB.MD` (Line 92 - Asset Types)

---

## Success Criteria

- ✅ Table entry verified in canvas.AssetLookup
- ✅ Share buttons appear for tables in HostControlPanel
- ✅ Clicking share button successfully broadcasts table
- ✅ SessionCanvas/TranscriptCanvas receive and display table
- ✅ Playwright E2E test passes consistently (100% pass rate)
- ✅ Documentation updated with verification results

---

**For detailed implementation plan, see `table-asset-enhancement.plan.md`**
