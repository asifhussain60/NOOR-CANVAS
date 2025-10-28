# NCDEPLOY Quick Reference Card

## TL;DR - Just Run This
```powershell
.\Scripts\ncdeploy.ps1
```

**What it does:**
1. ✅ Merges `development` → `master`
2. ✅ Deploys to production with KSESSIONS database
3. ✅ Returns to `development` branch
4. ✅ Always starts and ends on `development`

---

## The Complete Workflow

```
[development] → merge → [master] → build → deploy → return → [development]
     ↑                                                              ↓
     └──────────────── You're always here ────────────────────────┘
```

---

## Quick Host Provisioning (HCT) ⚡

**Fastest way to reset a session and get host URLs:**

```powershell
hct 212
```

**What it does:**
- ✅ Clears canvas.Participants and canvas.SessionData
- ✅ Generates fresh host and user tokens
- ✅ Displays clickable URLs for immediate access
- ✅ ~2 seconds vs 10+ seconds for GUI
- ✅ Works from any directory (global command)

**Examples:**
```powershell
# Basic usage (Development environment)
hct 212

# Production environment
hct 215 -Environment Production

# Auto-open in browser
hct 212 -OpenBrowser

# With audit tracking
hct 212 -CreatedBy "John Doe"

# Show help
hct -Help
```

**See also:** `nct` command for interactive provisioning

---

## Common Scenarios

### 1. Standard Deployment (Most Common)
```powershell
cd "D:\PROJECTS\NOOR CANVAS"
.\Scripts\ncdeploy.ps1
```

### 2. Already on Master? Skip Merge
```powershell
.\Scripts\ncdeploy.ps1 -SkipMerge
```

### 3. Quick Test Deploy (No Backup)
```powershell
.\Scripts\ncdeploy.ps1 -SkipBackup
```

### 4. Manual IIS Control
```powershell
.\Scripts\ncdeploy.ps1 -SkipIIS
```

---

## What Gets Configured Automatically

| Setting | Value |
|---------|-------|
| **Environment** | Production |
| **Database** | KSESSIONS |
| **Server** | AHHOME |
| **Deploy Path** | D:\Websites\NOOR-CANVAS |
| **App Pool** | NoorCanvas |
| **Branch** | master (during deploy) |
| **Return To** | development (after deploy) |

---

## Pre-Flight Checklist

Before running `ncdeploy.ps1`:

- [ ] Are you on `development` branch? (Script will switch if not)
- [ ] Have you committed your changes? (Required unless using `-AutoMerge`)
- [ ] Did you test in development environment?
- [ ] Is production ready for deployment?

---

## Post-Deployment Verification

1. **Check the app:** Browse to production URL
2. **Check logs:** `D:\Websites\NOOR-CANVAS\logs`
3. **Verify database:** Ensure connecting to KSESSIONS (not KSESSIONS_DEV)
4. **Check branch:** Run `git branch --show-current` (should be `development`)

---

## Error Recovery

### If Merge Conflicts Occur
```powershell
# 1. Script will stop and show you the conflicts
git status                    # See conflicting files
# 2. Edit the files, resolve conflicts
git add <resolved-files>      # Stage resolved files
git commit                    # Complete the merge
# 3. Re-run deployment
.\Scripts\ncdeploy.ps1 -SkipMerge
```

### If Deployment Fails
```powershell
# Script auto-restores IIS and returns to development branch
# Check backup if needed:
cd D:\Websites\NOOR-CANVAS-Backups
ls | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

---

## Important Flags

| Flag | Use When |
|------|----------|
| `-SkipMerge` | Already on master with correct code |
| `-SkipBuild` | Testing deployment with existing build |
| `-SkipBackup` | No backup needed (testing only) |
| `-SkipIIS` | Manual IIS control preferred |
| `-AutoMerge` | ⚠️ Deploying with uncommitted changes (NOT recommended) |

---

## File Locations

| What | Where |
|------|-------|
| Script | `Scripts/ncdeploy.ps1` |
| Deployment | `D:\Websites\NOOR-CANVAS` |
| Backups | `D:\Websites\NOOR-CANVAS-Backups` |
| Temp Build | `Workspaces/publish-temp` |
| Logs | `D:\Websites\NOOR-CANVAS\logs` |

---

## Remember

✅ **Always begins on:** `development` branch  
✅ **Always deploys from:** `master` branch  
✅ **Always returns to:** `development` branch  
✅ **Always connects to:** KSESSIONS database (production)  

❌ **Never modify** `master` branch manually  
❌ **Never commit to** `master` directly  
❌ **Never deploy from** `development` branch  

---

## One-Liner for Lazy People

```powershell
cd "D:\PROJECTS\NOOR CANVAS"; .\Scripts\ncdeploy.ps1
```

That's it! 🚀
