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
5. Scanning codebase for 18+ affected Scripts/run-*.ps1 files

**Files Modified**:
- `.github/prompts/shared/test-orchestration-patterns.md` - Updated canonical pattern documentation

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

**Validation**:
- [ ] Build successful
- [x] Documentation updated
- [ ] Deprecated test scripts identified (18+ files)
- [ ] Deprecated test scripts updated
- [ ] All tests passing with new pattern

---

## Affected Files (Scan Results)

**Deprecated Pattern Found In:**
- `Scripts/run-debug-panel-toast-error-test.ps1`
- `Scripts/run-hcp-question-percy-tests.ps1`
- `Scripts/run-hcp-fab-button-percy-tests.ps1`
- `Scripts/run-portrait-orientation-tests.ps1`
- `Scripts/run-section-share-buttons-test.ps1`
- `Scripts/run-third-participant-bug-test.ps1`
- `Scripts/run-transcript-broadcast-percy-tests.ps1`
- `Scripts/run-transcript-canvas-percy-tests.ps1`
- `Scripts/Validation/pre-flight-check.ps1`
- `Scripts/run-use-landing-tests.ps1`
- `Scripts/run-share-transcript-test.ps1`
- `Scripts/run-debug-panel-visual-tests.ps1`
- `Scripts/run-debug-panel-percy-tests.ps1`
- `Scripts/run-debug-panel-e2e-visual-test.ps1`
- `Scripts/run-debug-panel-diagnostics.ps1`
- `Scripts/run-annotation-laser-test.ps1`
- `.github/key-data-streams/_ARCHIVE/transcript-canvas/scripts/run-transcript-modal-submit-console-e2e-test.ps1`
- `.github/key-data-streams/_ARCHIVE/hcp-tcanvas/scripts/run-transcript-section-broadcast-test.ps1`

**Total**: 18 files requiring migration

---

## Next Steps

1. Update each affected script with direct dotnet.exe pattern
2. Test updated scripts to ensure functionality preserved
3. Remove any webServer/PW_MODE references from config files
4. Update SelfAwareness.instructions.md Playwright section
5. Document lessons learned in parent key (hcp-cleanup)

---

## Status: 🔄 In Progress

**Completed:**
- ✅ Pattern documentation updated
- ✅ Breaking change documented
- ✅ Migration guide created
- ✅ Affected files identified

**Remaining:**
- ⏳ Update 18 test orchestration scripts
- ⏳ Validate all tests pass with new pattern
- ⏳ Update instructions/prompts with new pattern
- ⏳ Mark drift resolved and pop stack

