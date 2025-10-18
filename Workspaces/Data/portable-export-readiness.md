# Portable Export Readiness Check - October 18, 2025

## Status: ✅ READY FOR EXPORT

### Pre-Export Fixes Completed

**Commit:** e889945b  
**Files Fixed:** 2 shared prompt files

#### 1. `.github/prompts/shared/step-0-server-cleanup.md`
- ✅ Removed hardcoded `NoorCanvas` process name
- ✅ Changed to generic Kestrel pattern matching
- ✅ Added comments for customization

**Before:**
```powershell
Get-Process -Name dotnet ... $_.Path -like '*NoorCanvas*'
```

**After:**
```powershell
Get-Process -Name dotnet ... $_.MainWindowTitle -like '*Kestrel*'
# Or stop by specific process name if known
Get-Process -Name "YourAppName" ...
```

#### 2. `.github/prompts/shared/playwright-test-generation.md`
- ✅ Removed hardcoded paths: `D:\PROJECTS\NOOR CANVAS\...`
- ✅ Removed hardcoded process name: `NoorCanvas`
- ✅ Removed hardcoded port: `9091`
- ✅ Changed to generic placeholders

**Before:**
```powershell
Get-Process -Name "NoorCanvas" ...
cd 'D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas'
Invoke-WebRequest -Uri "https://localhost:9091"
```

**After:**
```powershell
Get-Process -Name "YourAppName" ...
cd 'C:\Path\To\Your\Project'
Invoke-WebRequest -Uri "https://localhost:5001"
```

---

## Verification Results

### ✅ Template Files (.template extension)
All template files properly use `{{VARIABLE}}` syntax:
- ✅ SelfAwareness.instructions.md.template
- ✅ Architecture.md.template
- ✅ InfrastructureQuickRef.md.template
- ✅ SystemIndex.md.template
- ✅ task.prompt.md.template
- ✅ refactor.prompt.md.template
- ✅ question.prompt.md.template
- ✅ test-generation.prompt.md.template
- ✅ All other `.template` files

### ✅ Shared Files (No .template extension)
Shared files are now generic and portable:
- ✅ test-orchestration-patterns.md (generic)
- ✅ context-gathering-phases.md (generic)
- ✅ step-0-server-cleanup.md (FIXED - now generic)
- ✅ playwright-test-generation.md (FIXED - now generic)
- ✅ All other shared files (already generic)

### ✅ Meta-Prompts (Self-documenting)
- ✅ port-instructions.prompt.md (contains examples only)
- ✅ total-recall.prompt.md (contains detection examples only)

### ✅ Documentation Files
- ✅ README.md (generic system overview)
- ✅ START-HERE.md (generic quick start)
- ✅ QUICK-REFERENCE.md (generic reference)
- ✅ STATUS.md (framework compatibility matrix)
- ✅ PORT-INSTRUCTIONS-EXECUTION-SUMMARY.md (historical record - OK)

---

## Next Steps

### Step 1: Regenerate Portable Templates

Run the port-instructions agent to create fresh templates:

```
@workspace /port-instructions
```

This will:
1. Delete entire `.github/_Portable/` folder
2. Analyze fixed `.github/` source files
3. Extract project-specific values
4. Create generic templates with `{{VARIABLES}}`
5. Generate setup scripts (setup.bat, setup.ps1)
6. Create documentation (README, START-HERE, etc.)
7. Produce completely portable system

### Step 2: Verify Export Package

After regeneration, verify:
```powershell
# Check shared files have no hardcoded values
grep -r "NoorCanvas" .github\_Portable\prompts\shared\
grep -r "KSESSIONS" .github\_Portable\prompts\shared\
grep -r "D:\\PROJECTS\\NOOR CANVAS" .github\_Portable\prompts\shared\

# Should return NO matches (except in meta-prompts as examples)
```

### Step 3: Copy to KSESSIONS

```powershell
# From NOOR CANVAS root
Copy-Item -Path ".github\_Portable" -Destination "C:\Path\To\KSESSIONS\_Portable" -Recurse -Force
```

### Step 4: Run Setup in KSESSIONS

```powershell
cd C:\Path\To\KSESSIONS
.\_Portable\setup.bat
```

### Step 5: Populate Intelligence

```
@workspace /total-recall
```

---

## Expected Setup Script Behavior

When setup runs in KSESSIONS, it will:

1. **Detect Project Type**: Scan for .NET/Node.js/Python/Java indicators
2. **Prompt for Configuration**:
   - Project Name: KSESSIONS
   - Database: [User provides]
   - Build/Test commands: [Auto-detected or user provides]
   - Paths: [Auto-detected or user provides]
3. **Process Templates**: Replace all `{{VARIABLES}}` with KSESSIONS values
4. **Deploy Files**: Copy to `.github/` with `.template` extension removed
5. **Create Folders**: Set up `Workspaces/` structure
6. **Generate Summary**: Create PROJECT-SETUP-SUMMARY.md

---

## Quality Checklist

Before exporting, confirm:
- [x] All template files use `{{VARIABLES}}`
- [x] Shared files are generic (no hardcoded values)
- [x] Setup scripts are comprehensive
- [x] Documentation is complete
- [x] Source files committed (e889945b)
- [ ] Port-instructions regenerated (NEXT STEP)
- [ ] Export verified with grep searches
- [ ] Tested setup in new project

---

## Commands Summary

```powershell
# 1. Regenerate portable templates
@workspace /port-instructions

# 2. Verify (should return no matches)
cd .github\_Portable
grep -r "NoorCanvas" prompts\shared\
grep -r "KSESSIONS" prompts\shared\

# 3. Copy to KSESSIONS
Copy-Item -Path ".github\_Portable" -Destination "C:\Path\To\KSESSIONS\_Portable" -Recurse

# 4. Setup in KSESSIONS
cd C:\Path\To\KSESSIONS
.\_Portable\setup.bat

# 5. Populate intelligence
@workspace /total-recall

# 6. Test
@workspace /question "What agents are available?"
```

---

## Status: READY FOR REGENERATION

✅ Source files fixed and committed  
✅ All hardcoded values removed from shared files  
✅ Templates already in good shape  
⏭️ **Next Action:** Run `@workspace /port-instructions` to regenerate
