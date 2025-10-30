# Host Provisioner Avalonia Migration Plan

**Key**: `hp-avalonia-migration`  
**Version**: 1.0  
**Created**: 2025-10-27  
**Branch**: development  
**Status**: Planning Complete  
**Complexity**: Medium (3 phases, multi-layer cleanup + domain migration)

---

## Executive Summary

Migrate from old WinForms Host Provisioner to modern Avalonia version by:
1. Removing deprecated WinForms project and all references
2. Fixing clipboard functionality in Avalonia (access/permissions issue)
3. Global domain migration: `*.servehttp.com` → `*.kashkole.com` across entire codebase

**Impact**: 92 files with servehttp.com references (historical docs, tests, configs)  
**Timeline**: ~60 minutes total

---

## Root Cause Analysis

### Issue 1: Duplicate Host Provisioner Versions
**Symptom**: Two GUI versions exist (WinForms and Avalonia)

**Root Cause**:
- WinForms was initial implementation (legacy)
- Avalonia created as modern cross-platform replacement
- WinForms never removed after migration
- References and documentation still point to old version

**Impact**:
- User confusion (which version to use?)
- Maintenance burden (two codebases)
- Documentation drift between versions
- Deployment scripts may deploy old version

### Issue 2: Clipboard Not Working (Avalonia)
**Symptom**: Copy button fails silently or shows permission error

**Root Cause**:
- Avalonia clipboard API requires platform-specific permissions
- Possible threading issue (clipboard access from non-UI thread)
- Fallback to System.Windows.Forms clipboard may fail on non-Windows platforms
- No error handling or fallback UI

**Current Code** (`MainWindowViewModel.cs` line 163):
```csharp
await Dispatcher.UIThread.InvokeAsync(() =>
{
    System.Windows.Forms.Clipboard.SetText(HostToken);  // ❌ Platform-specific, may fail
    ShowStatus("📋 Token copied to clipboard!", "#006400");
});
```

**Issues**:
1. Uses WinForms clipboard (not Avalonia-native)
2. No try-catch for clipboard failures
3. No fallback when clipboard unavailable
4. Cross-platform compatibility broken

### Issue 3: Domain Migration Incomplete
**Symptom**: 92 files still reference servehttp.com

**Root Cause**:
- Previous migration (`host-provisioner-domain-fix`) only updated app.config files
- Documentation, tests, and historical records not updated
- Search/replace needed across entire workspace

**File Categories**:
- Historical documentation (Workspaces/Archive, Workspaces/Data)
- Test files (Tests/UI/*)
- Instruction files (.github/instructions)
- Database scripts (Workspaces/Data/*.sql)
- Work logs (.github/key-data-streams)

---

## Solution Architecture

### Phase 1: Remove WinForms Version
- Delete `Tools/HostProvisioner/HostProvisioner.WinForms/` folder
- Update README.md references
- Update deployment scripts (if any)
- Update UserDictionary.md shortcut

### Phase 2: Fix Avalonia Clipboard
- Replace System.Windows.Forms.Clipboard with Avalonia.Input.Clipboard
- Add proper error handling with fallback dialog
- Create manual copy test (headless Playwright)
- Verify cross-platform compatibility

### Phase 3: Global Domain Migration
- Find all `*.servehttp.com` references (92 files)
- Replace with `*.kashkole.com` equivalents
- Preserve git history (mark as historical in docs)
- Create validation test

---

## Phases

### Phase 1: Remove WinForms Host Provisioner
**Duration**: 15 minutes  
**Risk**: Low  
**Status**: Not Started

**Tasks**:

1. **Delete WinForms project folder**
   ```powershell
   Remove-Item -Path "Tools/HostProvisioner/HostProvisioner.WinForms" -Recurse -Force
   ```

2. **Update README files**
   - `Tools/HostProvisioner/README.md` - Remove WinForms references
   - `Tools/HostProvisioner/Shared/README.md` - Remove WinForms examples
   - Update "Quick Start" to reference Avalonia only

3. **Update UserDictionary.md**
   - Change `hp` shortcut from WinForms to Avalonia
   - Current: `#file:Tools/HostProvisioner/HostProvisioner.WinForms/Program.cs`
   - New: `#file:Tools/HostProvisioner/HostProvisioner.Avalonia/Program.cs`

4. **Check deployment scripts**
   - Search for `HostProvisioner.WinForms` references in Scripts/
   - Update `ncdeploy.ps1` if it deploys WinForms version
   - Update `publish-hostprovisioner.ps1` if exists

**Files Modified**:
- DELETE: `Tools/HostProvisioner/HostProvisioner.WinForms/` (entire folder)
- `Tools/HostProvisioner/README.md`
- `Tools/HostProvisioner/Shared/README.md`
- `.github/prompts/shared/UserDictionary.md`
- Possibly: `Scripts/ncdeploy.ps1`, `Scripts/publish-hostprovisioner.ps1`

**Acceptance Criteria**:
- ✅ WinForms folder deleted
- ✅ No build errors (WinForms project removed from solution)
- ✅ README files reference Avalonia only
- ✅ UserDictionary shortcut updated
- ✅ No deployment script references to WinForms

**Commit Message**: `chore(hp-avalonia-migration): Remove deprecated WinForms Host Provisioner`

---

### Phase 2: Fix Avalonia Clipboard Functionality
**Duration**: 25 minutes  
**Risk**: Medium (cross-platform compatibility)  
**Status**: Not Started

**Tasks**:

1. **Replace clipboard implementation in MainWindowViewModel.cs**
   
   Current (line 163):
   ```csharp
   [RelayCommand]
   private async Task CopyHostToken()
   {
       try
       {
           if (string.IsNullOrWhiteSpace(HostToken))
               return;

           await Dispatcher.UIThread.InvokeAsync(() =>
           {
               System.Windows.Forms.Clipboard.SetText(HostToken);  // ❌ OLD
               ShowStatus("📋 Token copied to clipboard!", "#006400");
           });
       }
       catch (Exception ex)
       {
           ShowError($"Failed to copy: {ex.Message}");
       }
   }
   ```

   **New Implementation**:
   ```csharp
   [RelayCommand]
   private async Task CopyHostToken()
   {
       try
       {
           if (string.IsNullOrWhiteSpace(HostToken))
               return;

           // Use Avalonia clipboard (cross-platform)
           var clipboard = TopLevel.GetTopLevel(this)?Clipboard;
           if (clipboard != null)
           {
               await clipboard.SetTextAsync(HostToken);
               ShowStatus("📋 Token copied to clipboard!", "#006400");
           }
           else
           {
               // Fallback: Show manual copy dialog
               ShowManualCopyDialog(HostToken, "Host Token");
           }
       }
       catch (Exception ex)
       {
           // Graceful fallback on clipboard failure
           ShowManualCopyDialog(HostToken, "Host Token", ex.Message);
       }
   }

   private void ShowManualCopyDialog(string text, string label, string error = null)
   {
       var message = error != null 
           ? $"⚠️ Clipboard unavailable: {error}\n\nPlease copy manually:\n\n{text}"
           : $"Please copy manually:\n\n{text}";
       
       ShowError(message);
   }
   ```

2. **Add missing using directive**
   ```csharp
   using Avalonia.Input.Platform;
   using Avalonia.Controls;
   ```

3. **Remove System.Windows.Forms dependency**
   - Remove from `HostProvisioner.Avalonia.csproj` (line 36)
   - Current: `<PackageReference Include="System.Windows.Forms" Version="4.0.0" />`
   - This causes cross-platform issues and NU1701 warnings

**Files Modified**:
- `Tools/HostProvisioner/HostProvisioner.Avalonia/ViewModels/MainWindowViewModel.cs`
- `Tools/HostProvisioner/HostProvisioner.Avalonia/HostProvisioner.Avalonia.csproj`

**Testing** (Phase 2.5):

Create headless Playwright test: `Tests/UI/hp-avalonia-clipboard-test.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Host Provisioner Avalonia - Clipboard Test', () => {
  test('clipboard copy functionality works or shows fallback', async ({ page }) => {
    // Launch Avalonia app (requires Playwright Avalonia adapter or manual testing)
    // For now, this is a manual test specification
    
    // Manual Test Steps:
    // 1. Launch: dotnet run --project Tools/HostProvisioner/HostProvisioner.Avalonia
    // 2. Enter Session ID: 212
    // 3. Click "Generate Tokens"
    // 4. Wait for tokens to generate
    // 5. Click "Copy" button next to Host Token
    // 6. Verify one of:
    //    a. Success message: "📋 Token copied to clipboard!"
    //    b. Fallback dialog with manual copy instructions
    // 7. If (a), paste clipboard content and verify it matches Host Token
    // 8. If (b), verify token is displayed in error dialog
    
    console.log('⚠️  This is a manual test - Avalonia apps require desktop automation');
    console.log('📋 Test Steps:');
    console.log('1. Launch: dotnet run --project Tools/HostProvisioner/HostProvisioner.Avalonia');
    console.log('2. Generate tokens for Session 212');
    console.log('3. Click Copy button');
    console.log('4. Verify clipboard copy or fallback dialog');
  });
});
```

**Acceptance Criteria**:
- ✅ Avalonia.Input.Platform.Clipboard used (not WinForms)
- ✅ System.Windows.Forms dependency removed
- ✅ Try-catch handles clipboard failures
- ✅ Fallback dialog shows on clipboard failure
- ✅ No NU1701 warnings in build
- ✅ Manual test passes (copy works or shows fallback)

**Commit Message**: `fix(hp-avalonia-migration): Replace WinForms clipboard with Avalonia cross-platform clipboard`

---

### Phase 3: Global Domain Migration (servehttp.com → kashkole.com)
**Duration**: 20 minutes  
**Risk**: Low (find/replace in documentation/tests)  
**Status**: Not Started

**Tasks**:

1. **Find all servehttp.com references** (92 matches found)

   **Categories**:
   - Historical documentation (40 files): Workspaces/Archive, Workspaces/Data
   - Test files (5 files): Tests/UI/
   - Instruction files (3 files): .github/instructions/
   - Key data streams (10 files): .github/key-data-streams/
   - Database scripts (1 file): Workspaces/Data/KSESSIONS_Schema_Data.sql
   - Work logs (33 files): Workspaces/Copilot/

2. **Automated replacement via PowerShell**

   ```powershell
   # Find all files with servehttp.com references
   $files = Get-ChildItem -Path "D:\PROJECTS\NOOR CANVAS" -Recurse -File |
       Where-Object { $_.Extension -match '\.(md|ts|sql|json|cs|txt)$' } |
       Where-Object { (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match 'servehttp\.com' }

   # Replace servehttp.com with kashkole.com
   foreach ($file in $files) {
       $content = Get-Content $file.FullName -Raw
       $newContent = $content -replace '([a-zA-Z0-9-]+)\.servehttp\.com', '$1.kashkole.com'
       Set-Content -Path $file.FullName -Value $newContent -NoNewline
       Write-Host "✓ Updated: $($file.FullName)"
   }

   Write-Host "`n✅ Replaced servehttp.com in $($files.Count) files"
   ```

3. **Verification**

   ```powershell
   # Verify no servehttp.com references remain
   git grep -i "servehttp\.com" | Measure-Object -Line
   # Expected: 0 lines

   # Verify kashkole.com references added
   git grep -i "noorcanvas\.kashkole\.com" | Measure-Object -Line
   # Expected: 90+ lines
   ```

4. **Update validation test**

   Modify `Tests/UI/url-migration-validation.spec.ts` (already exists):
   - Add comprehensive check for ALL file types
   - Ensure no servehttp.com in .md, .ts, .sql, .cs files

**Files Modified**:
- 92 files across workspace (automated replacement)
- `Tests/UI/url-migration-validation.spec.ts` (validation enhancement)

**Acceptance Criteria**:
- ✅ 0 servehttp.com references remain (except in this plan file)
- ✅ All replacements preserve context (noorcanvas.kashkole.com, session.kashkole.com, resources.kashkole.com)
- ✅ Database scripts updated (SystemConfiguration table)
- ✅ Test files updated
- ✅ Documentation updated
- ✅ Validation test passes

**Commit Message**: `chore(hp-avalonia-migration): Global domain migration servehttp.com → kashkole.com`

---

## Testing Strategy

### Phase 1 Testing
- ✅ Build succeeds without WinForms project
- ✅ No references to WinForms in codebase (grep search)
- ✅ UserDictionary shortcut resolves correctly

### Phase 2 Testing
- ✅ Manual test: Launch Avalonia app, generate tokens, copy to clipboard
- ✅ Manual test: Verify fallback dialog on clipboard failure (deny permissions)
- ✅ Build succeeds without NU1701 warnings
- ✅ No System.Windows.Forms references in Avalonia project

### Phase 3 Testing
- ✅ Automated validation: `git grep "servehttp\.com"` returns 0 results
- ✅ Automated validation: `git grep "kashkole\.com"` returns 90+ results
- ✅ Test suite passes: `npx playwright test url-migration-validation.spec.ts`
- ✅ Database scripts validate (no syntax errors)

---

## Rollback Plan

### Phase 1 Rollback
```powershell
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner.WinForms
git checkout HEAD -- .github/prompts/shared/UserDictionary.md
git checkout HEAD -- Tools/HostProvisioner/README.md
```

### Phase 2 Rollback
```powershell
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner.Avalonia/ViewModels/MainWindowViewModel.cs
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner.Avalonia/HostProvisioner.Avalonia.csproj
```

### Phase 3 Rollback
```powershell
# Automated rollback of all file changes
git diff --name-only HEAD | ForEach-Object {
    git checkout HEAD -- $_
}
```

---

## Dependencies

### Prerequisites
- Avalonia app already has domain fixes (`host-provisioner-domain-fix` completed)
- Clipboard functionality needs native Avalonia APIs

### External Dependencies
- None (all changes internal to workspace)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WinForms still deployed in production | Low | Medium | Check deployment folder before deletion |
| Clipboard breaks on non-Windows | Medium | Low | Fallback dialog provides manual copy |
| Regex replacement breaks code | Low | Low | Test after replacement, targeted file types only |
| Historical docs lose context | Low | Low | Preserve "was servehttp.com" notes in migration docs |

---

## Success Criteria

- ✅ WinForms project deleted, no build errors
- ✅ Avalonia clipboard works or shows graceful fallback
- ✅ 0 servehttp.com references remain in codebase
- ✅ All tests pass (manual + automated)
- ✅ User can successfully generate tokens and copy to clipboard
- ✅ Documentation reflects Avalonia as primary GUI
- ✅ Cross-platform compatibility maintained

---

## Post-Migration Validation

**Checklist**:
1. [ ] Launch Avalonia app: `dotnet run --project Tools/HostProvisioner/HostProvisioner.Avalonia`
2. [ ] Generate tokens for Session 212
3. [ ] Copy Host Token to clipboard (or see fallback)
4. [ ] Open in browser → verify kashkole.com domain used
5. [ ] Build solution → verify no WinForms errors
6. [ ] Run: `git grep "servehttp\.com"` → expect 0 results
7. [ ] Run: `git grep "WinForms" Tools/HostProvisioner/` → expect 0 results (except archived docs)

---

## Related Keys

- `host-provisioner-domain-fix` - Previous domain fix (app.config only)
- `url-migration-production` - Original URL migration plan (incomplete)

---

## Notes

- This is a **cleanup + completion** plan
- WinForms was already deprecated by Avalonia
- Domain migration was started but never finished workspace-wide
- Clipboard issue discovered during user testing

**Estimated Total Time**: 60 minutes  
**Phases**: 3  
**Files Affected**: ~95 (1 deleted folder, 92 domain replacements, 2 clipboard fixes)
