# Work Log: hp-avalonia-migration

**Key**: `hp-avalonia-migration`  
**Created**: 2025-10-27  
**Status**: Planning Complete

---

## 2025-10-27 - Planning Session

### User Request
User requested three related tasks:
1. Delete old HostProvisioner WinForms version and cleanup
2. Fix clipboard functionality in Avalonia (not working, possibly access/permissions)
3. Find and replace all `*.servehttp.com` references with `*.kashkole.com` across workspace

### Analysis

**Evidence Gathered**:
- Found 92 files with servehttp.com references via grep search
- WinForms folder exists at `Tools/HostProvisioner/HostProvisioner.WinForms/`
- Avalonia clipboard uses System.Windows.Forms.Clipboard (line 163, MainWindowViewModel.cs)
- Previous migration `host-provisioner-domain-fix` only updated app.config files

**Root Causes**:
1. **WinForms Not Removed**: Legacy version kept after Avalonia migration
2. **Clipboard Issue**: Using WinForms clipboard API in Avalonia (cross-platform failure)
3. **Incomplete Migration**: Previous domain fix didn't update docs/tests/historical files

### Plan Structure
- **3 phases**: WinForms removal (15min) → Clipboard fix (25min) → Domain migration (20min)
- **Medium complexity**: Multi-layer cleanup + API replacement
- **95 files affected**: 1 folder deletion, 2 code files, 92 domain replacements

### Files Created
- `hp-avalonia-migration.plan.md` - Complete technical plan
- `hp-avalonia-migration.plan.json` - Progress tracking metadata
- `work-log.md` - This file

---

## Execution Log

### Phase 1: Remove WinForms (Pending)
- [ ] Delete Tools/HostProvisioner/HostProvisioner.WinForms/
- [ ] Update README references
- [ ] Update UserDictionary.md
- [ ] Check deployment scripts

### Phase 2: Fix Clipboard (Pending)
- [ ] Replace System.Windows.Forms.Clipboard with Avalonia.Input.Platform.Clipboard
- [ ] Add error handling and fallback dialog
- [ ] Remove System.Windows.Forms dependency
- [ ] Create manual test specification

### Phase 3: Domain Migration (Pending)
- [ ] Automated PowerShell replacement (92 files)
- [ ] Verification (0 servehttp.com refs)
- [ ] Update validation test

---

## Notes
- User launched Avalonia app during conversation (clipboard issue confirmed)
- Plan approved: waiting for execution command
- Auto-execute in 5 seconds unless "review" or "cancel"
