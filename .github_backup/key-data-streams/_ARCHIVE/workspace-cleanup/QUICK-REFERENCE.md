# Workspace Cleanup - Quick Reference

**Key**: `workspace-cleanup` | **Version**: 1.0 | **Status**: ✅ Ready

---

## 🚀 Quick Commands

### Recommended First Run
```powershell
cd "d:\PROJECTS\NOOR CANVAS\.github\key-data-streams\workspace-cleanup"
.\execute-plan.ps1 -DryRun -Mode default
```

### Using Questionnaire
```powershell
# 1. Fill out questionnaire.md with your preferences
# 2. Run cleanup
.\execute-plan.ps1
```

### Using Defaults
```powershell
# Safe cleanup with default settings
.\execute-plan.ps1 -UseDefaults -Mode default

# Aggressive cleanup
.\execute-plan.ps1 -UseDefaults -Mode aggressive

# Custom with backup
.\execute-plan.ps1 -Mode default -CreateBackup
```

---

## 📊 What Gets Cleaned

| Category | Default Mode | Aggressive Mode |
|----------|-------------|-----------------|
| Build Artifacts (bin/obj/.vs) | ✅ All | ✅ All |
| Test Results | ✅ Except last run | ✅ All |
| Log Files | ✅ Older than 7 days | ✅ All |
| Temp Files | ✅ All | ✅ All |
| Demo Files | ❌ Keep | ✅ Delete |
| Documentation | 📁 Reorganize | 📁 Reorganize |
| Completed Plans | 📦 Archive | 📦 Archive |

**Expected Space Reclaimed:**
- Default: 100-300 MB
- Aggressive: 500MB-2GB

---

## 📁 Documentation Organization

Files will be moved to:
```
Workspaces/Documentation/
├── Implementation/     (summary, implementation docs)
├── Architecture/       (diagrams, overview docs)
├── Configuration/      (setup, config guides)
├── QuickReference/     (quick refs, cheat sheets)
└── Tools/             (utility, script docs)
```

---

## ✅ Pre-Cleanup Checklist

Before running cleanup:
- [ ] Close Visual Studio
- [ ] Stop any running NoorCanvas processes
- [ ] Commit or stash important changes
- [ ] Review dry run output
- [ ] (Optional) Create git branch for safety

---

## 🔍 Modes Explained

### Default Mode (Recommended)
**Best for**: Regular maintenance, safe cleanup
- Preserves debugging information
- Keeps recent test results
- Organizes documentation
- Low risk

### Aggressive Mode
**Best for**: Major space recovery, fresh start
- Removes all test history
- Deletes all logs
- Removes demo files
- Requires rebuild

### Custom Mode
**Best for**: Fine-grained control
- Answer questionnaire for each category
- Choose exactly what to clean
- Balance safety and space

---

## 🛡️ Safety Features

1. **Dry Run** - Preview before deleting
2. **Manifest** - Track all deleted files
3. **Git Safety** - Won't delete tracked code
4. **Validation** - Post-cleanup build test
5. **Backup** - Optional full backup

---

## 🔧 Troubleshooting

### Access Denied Errors
```powershell
# Stop processes first
Get-Process | Where-Object { $_.ProcessName -like "*NoorCanvas*" } | Stop-Process -Force
# Then run cleanup
.\execute-plan.ps1
```

### Dry Run Shows Unexpected Files
```powershell
# Review the generated report
notepad "d:\PROJECTS\NOOR CANVAS\Workspaces\Maintenance\cleanup-report-*.md"
```

### Need to Restore Deleted Files
```powershell
# If files were in git
git restore <file-path>

# Check manifest for deleted file list
notepad "Workspaces\Maintenance\cleanup-manifest-*.txt"
```

---

## 📈 Validation

After cleanup, script automatically:
- ✅ Runs `dotnet build` to verify build works
- ✅ Checks git status for unintended changes
- ✅ Generates detailed cleanup report
- ✅ Validates .github folder structure

---

## 📚 Full Documentation

- **Complete Plan**: `workspace-cleanup.plan.md`
- **Questionnaire**: `questionnaire.md`
- **Test Registry**: `tests/test-registry.md`
- **Work Log**: `work-log.md`
- **This Guide**: `QUICK-REFERENCE.md`

---

## 🎯 Common Scenarios

### "Just clean build files"
```powershell
.\execute-plan.ps1 -DryRun
# Review, then:
.\execute-plan.ps1 -UseDefaults -Mode default
```

### "I need maximum space back"
```powershell
.\execute-plan.ps1 -Mode aggressive -CreateBackup -DryRun
# Review, then:
.\execute-plan.ps1 -Mode aggressive -CreateBackup
```

### "Organize docs but don't delete much"
```powershell
# Edit questionnaire.md:
# - Q1: Mark A (Default Mode)
# - Q2: Mark C (Keep Last 3 Test Runs)
# - Q3: Mark C (Keep Last 30 Days)
# - Q4: Mark A (Full Reorganization)
# Then run:
.\execute-plan.ps1
```

---

## 🔄 Maintenance Schedule

**Recommended:**
- **Weekly**: Run default mode
- **Monthly**: Review .github folder
- **Quarterly**: Consider aggressive mode

---

**Created**: 2025-10-26  
**Key**: workspace-cleanup  
**Version**: 1.0
