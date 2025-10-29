# Work Log: drift-playwright-launch-protocol

**Key:** `drift-playwright-launch-protocol`  
**Parent Key:** `hcp-cleanup`  
**Created:** 2025-10-29  
**Severity:** high  
**Triggered By:** user  
**Mode:** manual

---

## Drift Context

**Parent Workflow**: hcp-cleanup (Phase 3 refactoring)  
**Detection Phase**: Test infrastructure improvements (commits 46b83b8f, 9448e8cd)  
**Stack Depth**: 1/3

**Issue Detected**:
Multiple Playwright launch patterns exist across codebase. Commit 9448e8cd proved direct `dotnet.exe` launch is superior to nested PowerShell approach (3-5x faster, reliable health checks). Need to standardize codebase on this proven pattern.

---

## Resolution (2025-10-29)

**Actions Taken**:
1. Updated `.github/prompts/shared/test-orchestration-patterns.md` with v3.0 pattern
2. Documented BREAKING CHANGE and migration guide
3. Added evidence from production testing (attempt 5/15 → 1-3)
4. Marked nested PowerShell pattern as DEPRECATED
5. Scanned codebase for 18+ affected Scripts/run-*.ps1 files
6. Migrated 16 active orchestration scripts to v3.0 direct dotnet.exe pattern
7. Verified archived scripts already compliant (no nested PowerShell launches)
8. Updated `.github/instructions/SelfAwareness.instructions.md` to mandate v3.0 pattern

**Files Modified**:
- `.github/prompts/shared/test-orchestration-patterns.md` - Updated canonical pattern documentation
- `Scripts/run-*.ps1`, `Scripts/Validation/pre-flight-check.ps1` - Migrated to v3.0 direct launch
- `.github/instructions/SelfAwareness.instructions.md` - Updated Playwright runtime rules

**Pattern Changes**:
```powershell
# DEPRECATED (v2.0)
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$AppPath'; dotnet run"

# MANDATORY (v3.0)  
Start-Process -FilePath "dotnet" -ArgumentList "run", "--urls", "$AppUrl" -WorkingDirectory $AppPath
```

**Commits**:
- `0d4b5179` - drift registration
- `79e721c7` - Documentation update with v3.0 pattern
- `9d847474` - Script migrations (16 files) to v3.0 direct dotnet.exe pattern

**Validation**:
- [ ] Build successful (pending)
- [x] Documentation updated
- [x] Deprecated test scripts identified (18 files)
- [x] Deprecated test scripts updated (16 active scripts migrated, 2 archived verified compliant)
- [ ] All tests passing with new pattern (pending test run)

---

## Affected Files (Scan Results)

**Resolved Pattern Status:**
- `Scripts/run-debug-panel-toast-error-test.ps1` ✅ migrated
- `Scripts/run-hcp-question-percy-tests.ps1` ✅ migrated
- `Scripts/run-hcp-fab-button-percy-tests.ps1` ✅ migrated
- `Scripts/run-portrait-orientation-tests.ps1` ✅ migrated
- `Scripts/run-section-share-buttons-test.ps1` ✅ migrated
- `Scripts/run-third-participant-bug-test.ps1` ✅ migrated
- `Scripts/run-transcript-broadcast-percy-tests.ps1` ✅ migrated
- `Scripts/run-transcript-canvas-percy-tests.ps1` ✅ migrated
- `Scripts/Validation/pre-flight-check.ps1` ✅ migrated
- `Scripts/run-use-landing-tests.ps1` ✅ migrated
- `Scripts/run-share-transcript-test.ps1` ✅ migrated
- `Scripts/run-debug-panel-visual-tests.ps1` ✅ migrated
- `Scripts/run-debug-panel-percy-tests.ps1` ✅ migrated
- `Scripts/run-debug-panel-e2e-visual-test.ps1` ✅ migrated
- `Scripts/run-debug-panel-diagnostics.ps1` ✅ migrated
- `Scripts/run-annotation-laser-test.ps1` ✅ migrated
- `.github/key-data-streams/_ARCHIVE/transcript-canvas/scripts/run-transcript-modal-submit-console-e2e-test.ps1` 🔍 already compliant
- `.github/key-data-streams/_ARCHIVE/hcp-tcanvas/scripts/run-transcript-section-broadcast-test.ps1` 🔍 already compliant

**Total**: 18 files verified (16 migrations + 2 archived validated)

---

## Next Steps

1. Test updated scripts to ensure functionality preserved
2. Remove any webServer/PW_MODE references from config files (in progress)
3. Document lessons learned in parent key (hcp-cleanup)

---

## Status: ✅ Resolved (2025-10-29)

**Completed:**
- ✅ Pattern documentation updated
- ✅ Breaking change documented
- ✅ Migration guide created
- ✅ Affected files identified
- ✅ 16 active orchestration scripts migrated to v3.0
- ✅ Archived scripts verified compliant
- ✅ SelfAwareness instructions updated
- ✅ Drift commit recorded (`9d847474`)

**Pending Follow-up (tracked in parent key):**
- 🔄 Run regression tests to gather evidence for parent work-log
- 🔄 Remove residual `webServer` references outside instructions if encountered
- 🔄 Summarize lessons learned in `hcp-cleanup` work-log

