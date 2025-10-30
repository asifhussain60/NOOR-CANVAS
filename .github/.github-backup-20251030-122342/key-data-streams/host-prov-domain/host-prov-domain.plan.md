# Host Provisioner Domain Fix Plan

**Key**: `host-provisioner-domain-fix`  
**Version**: 1.0  
**Created**: 2025-10-26  
**Branch**: `zoom-integration/major-20251025`  
**Status**: Planning Complete

---

## Summary

Update Host Provisioner GUI application to use correct production domain (kashkole.com instead of servehttp.com) and add quality-of-life enhancements including clipboard error handling, environment indicators, and automated validation tests.

---

## User Decisions (from questionnaire)

**Enhancement Selection**: ALL
- **Chosen**: Include all high-priority (A, B) and medium-priority (C) enhancements
- **Rationale**: Comprehensive fix with future-proofing and improved UX
- **Implementation**: Integrated into Phases 2-4

---

## Root Cause Analysis

### Issue 1: Copy Token Button Error
**Symptom**: Error dialog showing "Could not load file or assembly 'System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'"

**Root Cause**: 
- Clipboard access in WinForms .NET 8 requires proper runtime references
- Current implementation lacks error handling for clipboard API failures
- Missing fallback mechanism when clipboard is unavailable

### Issue 2: Open In Browser Wrong Domain
**Symptom**: Browser opens with servehttp.com instead of kashkole.com in production

**Root Cause**:
- `DetectEnvironment()` in `HostProvisionerConfig.cs` reads `BaseUrl_Production` from `app.config`
- CLI (`HostProvisioner/app.config`) still has `BaseUrl_Production = "https://noorcanvas.servehttp.com"`
- Avalonia (`HostProvisioner.Avalonia/app.config`) still has `BaseUrl_Production = "https://noorcanvas.servehttp.com"`
- WinForms already corrected to `https://noorcanvas.kashkole.com`

### Issue 3: Documentation Drift
**Symptom**: README files reference old servehttp.com domain

**Impact**: Confuses users and developers; inconsistent with production reality

---

## Phases

### Phase 1: Fix Production App.Config Files
**Duration**: 5 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Update `Tools/HostProvisioner/HostProvisioner/app.config`
   - Change `BaseUrl_Production` from `https://noorcanvas.servehttp.com` to `https://noorcanvas.kashkole.com`
2. Update `Tools/HostProvisioner/HostProvisioner.Avalonia/app.config`
   - Change `BaseUrl_Production` from `https://noorcanvas.servehttp.com` to `https://noorcanvas.kashkole.com`
3. Verify `BaseUrl_Development` remains `https://localhost:9091` in all files

**Files Modified**:
- `Tools/HostProvisioner/HostProvisioner/app.config`
- `Tools/HostProvisioner/HostProvisioner.Avalonia/app.config`

**Acceptance Criteria**:
- ✅ All app.config files have `BaseUrl_Production = "https://noorcanvas.kashkole.com"`
- ✅ Development URLs unchanged (`https://localhost:9091`)
- ✅ No XML syntax errors in config files

**Commit Message**: `fix(host-provisioner-domain-fix): Update production BaseUrl to kashkole.com in CLI and Avalonia configs`

---

### Phase 2: Add Clipboard Error Handling Enhancement
**Duration**: 15 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Improve `CopyToClipboard` method in `MainForm.cs` (line ~545)
   - Add try-catch with specific exception handling
   - On clipboard failure, show URL in MessageBox with instruction to manually copy
   - Log error details for debugging
2. Add fallback UI when clipboard unavailable
   - Display URL in read-only TextBox
   - Auto-select text for easier manual copy
   - Show tooltip: "Clipboard unavailable - press Ctrl+C to copy"

**Algorithm**:
```
FUNCTION CopyToClipboard(text, label)
  TRY
    Clipboard.SetText(text)
    ShowSuccess("{label} copied!")
    CloseApplication()
  CATCH ClipboardException
    // Fallback: Show URL in dialog with manual copy instruction
    ShowFallbackDialog(text, label)
  CATCH SystemException ex
    // Log unexpected error
    LogError("Clipboard failed: {ex.Message}")
    ShowFallbackDialog(text, label)
  END TRY
END FUNCTION

FUNCTION ShowFallbackDialog(text, label)
  dialog = CreateDialog(title: "Manual Copy Required")
  dialog.AddLabel("Clipboard unavailable. Please copy manually:")
  textBox = dialog.AddTextBox(text, readOnly: true, autoSelect: true)
  dialog.AddInstructions("1. Press Ctrl+C to copy\n2. Paste in browser address bar")
  dialog.ShowModal()
END FUNCTION
```

**Files Modified**:
- `Tools/HostProvisioner/HostProvisioner.WinForms/MainForm.cs`

**Acceptance Criteria**:
- ✅ Clipboard errors caught and handled gracefully
- ✅ Fallback dialog shows URL when clipboard fails
- ✅ Text auto-selected in fallback dialog for easy Ctrl+C
- ✅ User-friendly instructions displayed
- ✅ No unhandled exceptions

**Commit Message**: `feat(host-provisioner-domain-fix): Add robust clipboard error handling with manual copy fallback`

---

### Phase 3: Add Environment Indicator Badge to GUI
**Duration**: 20 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Add environment badge to header panel in `InitializeComponent()` (line ~77)
   - Create circular badge control (40x40 px)
   - Position: Top-right corner next to close button
   - Green (#006400) for Development
   - Red (#DC143C) for Production
   - Gold (#C5B358) for unknown environments
2. Add tooltip showing full environment details
   - Environment name
   - Base URL
   - Database name
3. Update `ShowEnvironmentInfo()` to set badge color and tooltip

**Algorithm**:
```
FUNCTION CreateEnvironmentBadge(environment)
  badge = NEW Panel(Size: 40x40, BorderRadius: 20)
  
  IF environment == "Production" THEN
    badge.BackColor = CrimsonRed  // #DC143C
    badge.ToolTip = "🔴 PRODUCTION\n⚠️ Changes affect live system"
  ELSE IF environment == "Development" THEN
    badge.BackColor = NoorGreen  // #006400
    badge.ToolTip = "🟢 DEVELOPMENT\nSafe to experiment"
  ELSE
    badge.BackColor = NoorGold  // #C5B358
    badge.ToolTip = "⚪ UNKNOWN\nVerify environment"
  END IF
  
  badge.Position = TopRight(offset: -60, 10)  // Next to close button
  RETURN badge
END FUNCTION
```

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│ ⚙ NOOR Canvas Host Provisioner      🟢  ✕ │  ← Green badge for DEV
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚙ NOOR Canvas Host Provisioner      🔴  ✕ │  ← Red badge for PROD
└─────────────────────────────────────────────┘
```

**Files Modified**:
- `Tools/HostProvisioner/HostProvisioner.WinForms/MainForm.cs`

**Acceptance Criteria**:
- ✅ Badge displays in top-right corner of header
- ✅ Green badge shown for Development environment
- ✅ Red badge shown for Production environment
- ✅ Tooltip shows environment details on hover
- ✅ Badge does not overlap close button
- ✅ Circular shape with smooth rendering (anti-aliasing)

**Commit Message**: `feat(host-provisioner-domain-fix): Add environment indicator badge to GUI header`

---

### Phase 4: Update Documentation Files
**Duration**: 10 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Update `Tools/HostProvisioner/Shared/README.md`
   - Replace all `noorcanvas.servehttp.com` with `noorcanvas.kashkole.com`
2. Update `Tools/HostProvisioner/README-PRETTY-UI.md`
   - Replace all `noorcanvas.servehttp.com` with `noorcanvas.kashkole.com`
3. Update `Tools/HostProvisioner/README.md`
   - Replace all `noorcanvas.servehttp.com` with `noorcanvas.kashkole.com`
4. Verify localhost:9091 references remain unchanged

**Files Modified**:
- `Tools/HostProvisioner/Shared/README.md`
- `Tools/HostProvisioner/README-PRETTY-UI.md`
- `Tools/HostProvisioner/README.md`

**Acceptance Criteria**:
- ✅ All production URLs updated to kashkole.com
- ✅ Development URLs remain localhost:9091
- ✅ No broken links in documentation
- ✅ Consistent domain references across all docs

**Commit Message**: `docs(host-provisioner-domain-fix): Update documentation to reflect kashkole.com production domain`

---

### Phase 5: Create URL Validation Test
**Duration**: 25 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Create PowerShell test script: `Tools/HostProvisioner/Tests/Validate-Production-URLs.ps1`
   - Parse all app.config files
   - Extract BaseUrl_Production values
   - Verify all match kashkole.com
   - Check BaseUrl_Development matches localhost:9091
2. Create xUnit test: `Tools/HostProvisioner/HostProvisioner.Tests/ConfigValidationTests.cs`
   - Test BaseUrl_Production consistency
   - Test BaseUrl_Development consistency
   - Test HostProvisionerConfig.DetectEnvironment() fallback
3. Add test to CI/CD pipeline (optional)

**Algorithm**:
```
FUNCTION ValidateProductionURLs()
  configFiles = FindFiles("**/app.config")
  errors = []
  
  FOR EACH file IN configFiles
    xml = ParseXML(file)
    prodUrl = xml.SelectNode("//add[@key='BaseUrl_Production']/@value")
    devUrl = xml.SelectNode("//add[@key='BaseUrl_Development']/@value")
    
    IF prodUrl != "https://noorcanvas.kashkole.com" THEN
      errors.ADD("❌ {file}: Wrong production URL: {prodUrl}")
    END IF
    
    IF devUrl != "https://localhost:9091" THEN
      errors.ADD("❌ {file}: Wrong development URL: {devUrl}")
    END IF
  END FOR
  
  IF errors.Count > 0 THEN
    THROW "URL validation failed:\n" + JoinLines(errors)
  ELSE
    PRINT "✅ All URLs valid (kashkole.com for prod, localhost:9091 for dev)"
  END IF
END FUNCTION
```

**Files Created**:
- `Tools/HostProvisioner/Tests/Validate-Production-URLs.ps1`
- `Tools/HostProvisioner/HostProvisioner.Tests/ConfigValidationTests.cs` (optional xUnit)

**Acceptance Criteria**:
- ✅ PowerShell test script validates all app.config files
- ✅ Script detects incorrect production URLs
- ✅ Script detects incorrect development URLs
- ✅ Test passes on current codebase
- ✅ Clear error messages when validation fails

**Commit Message**: `test(host-provisioner-domain-fix): Add URL validation test to prevent domain drift`

---

### Phase 6: Rebuild and Verify
**Duration**: 10 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:
1. Rebuild Host Provisioner WinForms app
   ```powershell
   dotnet build Tools/HostProvisioner/HostProvisioner.WinForms/HostProvisioner.WinForms.csproj --configuration Release
   ```
2. Manually test Production URL detection
   - Modify `HostProvisioner.WinForms.dll.config` to set `ASPNETCORE_ENVIRONMENT = "Production"`
   - Run app, verify Base URL shows `https://noorcanvas.kashkole.com`
   - Generate token for session 212
   - Verify Copy Token button copies correct URL
   - Verify Open In Browser button opens correct URL
3. Test Development URL detection
   - Restore `ASPNETCORE_ENVIRONMENT = "Development"`
   - Run app, verify Base URL shows `https://localhost:9091`
4. Test clipboard error handling
   - Simulate clipboard failure (if possible)
   - Verify fallback dialog appears
5. Test environment badge
   - Verify green badge for Development
   - Verify red badge for Production
   - Verify tooltip content

**Files Modified**: None (verification only)

**Acceptance Criteria**:
- ✅ App builds without errors
- ✅ Production environment shows kashkole.com URL
- ✅ Development environment shows localhost:9091 URL
- ✅ Copy Token button copies correct URL
- ✅ Open In Browser button opens correct URL
- ✅ Clipboard error handling works gracefully
- ✅ Environment badge displays correctly
- ✅ Badge tooltip shows environment details

**Commit Message**: `chore(host-provisioner-domain-fix): Verify production domain fix and enhancements`

---

## Test Specifications

### Manual Test Plan

**Test 1: Production URL Detection**
1. Locate `Tools/HostProvisioner/HostProvisioner.WinForms/bin/Release/net8.0-windows/HostProvisioner.WinForms.dll.config`
2. Set `<add key="ASPNETCORE_ENVIRONMENT" value="Production" />`
3. Run `HostProvisioner.WinForms.exe`
4. **Expected**: Base URL label shows `https://noorcanvas.kashkole.com`
5. **Expected**: Red badge visible in top-right corner

**Test 2: Token Copy and Browser Launch**
1. Enter Session ID: 212
2. Click "Generate Host Token"
3. Click "Copy Token" button
4. **Expected**: URL copied is `https://noorcanvas.kashkole.com/host/{TOKEN}`
5. Click "Open in Browser" button
6. **Expected**: Browser opens `https://noorcanvas.kashkole.com/host/{TOKEN}`

**Test 3: Clipboard Error Handling**
1. Simulate clipboard unavailability (if possible via registry/permissions)
2. Click "Copy Token" button
3. **Expected**: Fallback dialog appears with URL in read-only textbox
4. **Expected**: Text auto-selected, instructions visible
5. Press Ctrl+C
6. **Expected**: URL copied to clipboard manually

**Test 4: Development Environment**
1. Set `<add key="ASPNETCORE_ENVIRONMENT" value="Development" />`
2. Run app
3. **Expected**: Base URL shows `https://localhost:9091`
4. **Expected**: Green badge visible
5. Generate token for session 212
6. **Expected**: URL contains `https://localhost:9091/host/{TOKEN}`

**Test 5: Environment Badge Tooltip**
1. Hover over environment badge
2. **Expected (DEV)**: Tooltip shows "🟢 DEVELOPMENT\nSafe to experiment"
3. Switch to Production environment
4. Hover over badge
5. **Expected (PROD)**: Tooltip shows "🔴 PRODUCTION\n⚠️ Changes affect live system"

### Automated Test Plan

**Test 6: URL Validation Script**
```powershell
# Run validation test
.\Tools\HostProvisioner\Tests\Validate-Production-URLs.ps1

# Expected output:
# ✅ All URLs valid (kashkole.com for prod, localhost:9091 for dev)
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Clipboard API compatibility issues | Low | Medium | Enhanced error handling with fallback UI |
| Environment badge rendering issues | Low | Low | Use standard WinForms Panel with rounded borders |
| Config file XML syntax errors | Low | High | Manual verification + automated test |
| Production deployment overwrites fixed config | Medium | High | Document in ncdeploy.ps1 comments |

---

## Rollback Plan

If issues discovered after deployment:

1. **Immediate**: Revert app.config files to previous version
2. **Verify**: Run `git diff` to confirm only intended changes reverted
3. **Test**: Rebuild and verify production URL detection
4. **Document**: Log rollback reason in work-log.md

**Rollback Commands**:
```powershell
# Revert config files only
git checkout HEAD~1 -- Tools/HostProvisioner/HostProvisioner/app.config
git checkout HEAD~1 -- Tools/HostProvisioner/HostProvisioner.Avalonia/app.config

# Rebuild
dotnet build Tools/HostProvisioner/HostProvisioner.WinForms/HostProvisioner.WinForms.csproj --configuration Release
```

---

## Dependencies

- .NET 8 SDK
- Windows Forms runtime
- System.Windows.Forms assembly (clipboard access)
- XML parsing for config file validation

---

## Success Metrics

- ✅ 0 references to servehttp.com in app.config files
- ✅ 0 references to servehttp.com in README files
- ✅ 100% success rate for Copy Token button (with fallback)
- ✅ 100% correct domain in Open Browser button
- ✅ Automated URL validation test passing
- ✅ Visual environment indicator visible and accurate

---

## Post-Deployment Checklist

- [ ] Verify production deployment uses kashkole.com
- [ ] Test token generation on production server
- [ ] Verify clipboard functionality on production workstation
- [ ] Confirm environment badge shows red in production
- [ ] Run automated URL validation test
- [ ] Update deployment documentation if needed

---

## Notes

- WinForms app.config already had kashkole.com - this fix brings CLI and Avalonia into sync
- HostProvisionerConfig.cs line 61 already has correct fallback logic
- Enhancement badge uses existing color scheme from HostLanding.razor
- Clipboard error is unrelated to domain but impacts UX - fixed proactively

---

**Plan approved and ready for execution.**
