# Workspace Cleanup Plan

**Key**: `workspace-cleanup`  
**Version**: 1.0  
**Status**: Ready for Execution  
**Created**: 2025-10-26

---

## Quick Start

### Option 1: Use Questionnaire (Recommended)
1. Open `.github/key-data-streams/workspace-cleanup/questionnaire.md`
2. Mark your answers with `X` for each question
3. Save the file
4. Run: `.\execute-plan.ps1`

### Option 2: Use Defaults
```powershell
.\execute-plan.ps1 -UseDefaults -Mode default
```

### Option 3: Dry Run First
```powershell
.\execute-plan.ps1 -DryRun -Mode default
```

---

## Files in This Plan

| File | Purpose |
|------|---------|
| `workspace-cleanup.plan.md` | Complete plan with all phases and details |
| `workspace-cleanup.plan.json` | Machine-readable plan metadata |
| `questionnaire.md` | User decision questionnaire |
| `execute-plan.ps1` | Main cleanup execution script |
| `work-log.md` | Plan creation and execution log |
| `tests/test-registry.md` | Validation test specifications |
| `README.md` | This file |

---

## What Gets Cleaned

### Default Mode
- ✅ All `bin/` and `obj/` directories
- ✅ `.vs/` Visual Studio cache
- ✅ Test results (preserves last run)
- ✅ Logs older than 7 days
- ✅ Temporary files (*.tmp, *.bak, etc.)
- ✅ Organizes scattered documentation
- ✅ Archives completed plans from .github

### Aggressive Mode
Everything in default mode, plus:
- ✅ All test results including last run
- ✅ All log files
- ✅ Demo and example files
- ✅ More thorough documentation cleanup

---

## Expected Results

### Default Mode
- **Space Reclaimed**: 100-300 MB
- **Files Cleaned**: ~500-1000 files
- **Documentation Organized**: All scattered MD files
- **Build Time**: Unaffected
- **Risk Level**: Very Low

### Aggressive Mode
- **Space Reclaimed**: 500MB-2GB
- **Files Cleaned**: ~1000-3000 files
- **Documentation Organized**: Complete reorganization
- **Build Time**: May require initial rebuild
- **Risk Level**: Low (with backup)

---

## Safety Features

1. **Dry Run**: See what would be deleted without deleting
2. **Backup**: Option to create full backup before cleanup
3. **Manifest**: Tracks all deleted files for reference
4. **Git Safety**: Won't delete tracked files (except build artifacts)
5. **Validation**: Post-cleanup build and app tests
6. **Rollback**: Can restore from git or backup

---

## Common Issues

### "Access Denied" Errors
- **Cause**: Files locked by running processes
- **Solution**: Close Visual Studio, stop app, run cleanup again

### "Build Failed" After Cleanup
- **Cause**: Cached package references
- **Solution**: Run `dotnet restore` and rebuild

### Documentation Links Broken
- **Cause**: MD files moved but links not updated
- **Solution**: Check work-log.md for moved file locations

---

## Integration with Recent Work

This cleanup plan incorporates findings from:
- ✅ CDN/Cloudflare implementation cleanup
- ✅ IIS configuration documentation
- ✅ Test results from Percy visual regression
- ✅ Build artifact accumulation patterns

---

## Next Steps

1. **Review questionnaire** and mark your preferences
2. **Run dry run** to see what would happen
3. **Execute cleanup** with chosen mode
4. **Validate results** using test registry
5. **Commit changes** if satisfied

---

## Support

For questions or issues:
1. Check `work-log.md` for plan evolution
2. Review `workspace-cleanup.plan.md` for detailed specs
3. Run with `-DryRun` to preview without changes
4. Create git backup before aggressive cleanup

---

**Last Updated**: 2025-10-26  
**Plan Version**: 1.0  
**Status**: ✅ Ready for Execution
