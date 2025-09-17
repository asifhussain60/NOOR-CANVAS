# 🧪 **NOOR Canvas Post-Cleanup Testing Checklist**

**Purpose**: Comprehensive testing protocol to verify all critical functionality remains intact after project cleanup operations  
**Created**: September 17, 2025  
**Context**: Safety validation before and after removing duplicate files, backup files, and build artifacts

---

## **🔬 CRITICAL APPLICATIONS & FEATURES TO TEST**

### **1. Global Command System (HIGH PRIORITY)**
**Location**: PowerShell Profile Integration  
**Test Commands**:
```powershell
nc -Help        # NOOR Canvas application launcher
nct -Help       # Host token generator  
ncdoc -Help     # Documentation server
iiskill -Help   # IIS process killer
```

**Expected Results**:
- ✅ All commands should display help information
- ✅ Commands should be available from any directory
- ✅ No "command not found" errors

**Critical Files Dependencies**:
- `Workspaces/Global/*.ps1` files (primary implementations)
- PowerShell `$PROFILE` (global command registration)
- **NOTE**: `.cmd` and `.bat` wrappers are candidates for removal

---

### **2. Application Build & Startup (CRITICAL)**
**Components**: Main Blazor Server Application  
**Test Procedures**:
```powershell
# Test build process
dotnet build SPA/NoorCanvas/NoorCanvas.csproj

# Test application startup
nc    # Should launch on https://localhost:9091

# Test host token generation  
nct   # Should launch interactive token generator
```

**Expected Results**:
- ✅ Clean build without errors
- ✅ Application starts without port conflicts
- ✅ HTTPS certificate validation works
- ✅ Host token generation functional

**Critical File Dependencies**:
- `SPA/NoorCanvas/` (entire application source)
- `Tools/HostProvisioner/` (token generation)
- Configuration files (appsettings.json, launchSettings.json)

---

### **3. Host Authentication & Token System (CRITICAL)**
**Components**: Host Landing, Token Validation, Session Creation  
**Test Procedures**:
```
1. Navigate to https://localhost:9091/host/landing
2. Test with invalid token (should show error)
3. Generate valid token using nct command
4. Test with valid 8-character friendly token
5. Verify redirect to CreateSession page
6. Test session creation workflow
```

**Expected Results**:
- ✅ Host landing page loads correctly
- ✅ Token validation works (both valid/invalid)
- ✅ Friendly token system functional (8-character format)
- ✅ Session creation completes successfully
- ✅ Database integration working

**Critical File Dependencies**:
- `SPA/NoorCanvas/Pages/HostLanding.razor`
- `SPA/NoorCanvas/Controllers/HostController.cs`
- `SPA/NoorCanvas/Pages/CreateSession.razor`
- Database connection (KSESSIONS_DEV)

---

### **4. Documentation System (MEDIUM PRIORITY)**
**Components**: DocFX Documentation Site  
**Test Procedures**:
```powershell
ncdoc   # Should launch documentation server on port 8050
```

**Expected Results**:
- ✅ DocFX server starts successfully
- ✅ Documentation site accessible at http://localhost:8050
- ✅ API documentation generates correctly
- ✅ Articles and technical docs display properly

**Critical File Dependencies**:
- `DocFX/` source files (docfx.json, index.md, etc.)
- **NOTE**: `DocFX/_site/` is generated and safe to clean

---

### **5. Database Connectivity (CRITICAL)**
**Components**: KSESSIONS_DEV and KQUR_DEV Integration  
**Test Procedures**:
```powershell
# Test via Host Token Generation (tests database writes)
nct 215

# Test via application health endpoint
# Navigate to https://localhost:9091/healthz
```

**Expected Results**:
- ✅ Token generation writes to database successfully
- ✅ Health endpoint reports database connectivity
- ✅ Session data retrievable from database
- ✅ No connection string errors

**Critical File Dependencies**:
- Configuration files with connection strings
- `Tools/HostProvisioner/` database integration
- Host authentication controllers

---

### **6. Test Suite Execution (MEDIUM PRIORITY)**
**Components**: Automated Test Projects  
**Test Procedures**:
```powershell
# Run core tests
dotnet test Tests/NoorCanvas.Core.Tests/

# Run implementation tests  
dotnet test Tests/NC-ImplementationTests/
```

**Expected Results**:
- ✅ Test projects build successfully
- ✅ Tests execute without assembly loading errors
- ✅ Core functionality tests pass
- ✅ No missing dependency errors

**Critical File Dependencies**:
- `Tests/` project files and source code
- **NOTE**: `Tests/*/bin/` and `Tests/*/obj/` are generated and safe to clean

---

### **7. Issue Tracking System (LOW PRIORITY)**
**Components**: Issue Tracker Files and Validation  
**Test Procedures**:
```powershell
# Validate issue tracker consistency
Workspaces/Global/validate-tracker-consistency.ps1 -Fix
```

**Expected Results**:
- ✅ Issue tracker validates successfully
- ✅ No broken file references
- ✅ Statistics calculations work correctly
- ✅ Status folder organization intact

**Critical File Dependencies**:
- `IssueTracker/` folder structure
- `IssueTracker/ncIssueTracker.MD`
- Issue status folders (NOT STARTED/, COMPLETED/, etc.)

---

## **🔍 PRE-CLEANUP VERIFICATION CHECKLIST**

**Run these tests BEFORE cleanup to establish baseline:**
- [ ] `nc -Help` displays help information
- [ ] `nct -Help` shows token generation help
- [ ] `ncdoc -Help` shows documentation server help
- [ ] `iiskill -Help` shows process killer help (may fail - expected)
- [ ] `dotnet build SPA/NoorCanvas/NoorCanvas.csproj` succeeds
- [ ] `nc` launches application on https://localhost:9091
- [ ] Host landing page loads at /host/landing
- [ ] Documentation server starts with `ncdoc`
- [ ] `nct 215` generates tokens successfully
- [ ] Core tests run: `dotnet test Tests/NoorCanvas.Core.Tests/`

---

## **🧹 CLEANUP TARGETS - SAFE TO REMOVE**

### **High Confidence Removals:**
- **Duplicate Command Wrappers**: `Workspaces/Global/*.cmd` and `Workspaces/Global/*.bat` files (keep .ps1)
- **Backup Configuration**: `SPA/NoorCanvas/Properties/launchSettings.json.backup`
- **Stale PID Files**: `Workspaces/Global/*.pid` files
- **Old Development Logs**: Keep recent 5-10 files, remove older logs from `SPA/NoorCanvas/logs/`

### **System Generated (Optional):**
- **Build Artifacts**: All `bin/` and `obj/` directories (will regenerate)
- **Generated Documentation**: `DocFX/_site/` (will regenerate)

---

## **🔬 POST-CLEANUP VERIFICATION CHECKLIST**

**Run these tests AFTER cleanup to verify integrity:**
- [ ] All pre-cleanup tests still pass
- [ ] No "file not found" errors during application startup
- [ ] Global commands still function correctly
- [ ] Build process works without missing file errors
- [ ] Application launches and operates normally
- [ ] Host authentication workflow intact
- [ ] Documentation generation successful

---

## **🚨 EMERGENCY RECOVERY PROCEDURE**

**If cleanup breaks functionality:**
```powershell
# Restore from safety commit
git reset --hard 39ab18a

# Alternative: Restore specific files
git checkout 39ab18a -- [specific-file-path]

# Verify recovery
nc -Help  # Should work after recovery
```

**Contact Information**: 
- **Safety Commit**: `39ab18a` - "SAFETY: Pre-cleanup commit"  
- **Recovery Command**: `git reset --hard 39ab18a`

---

## **📊 SUCCESS CRITERIA**

**Cleanup considered successful when:**
- ✅ All critical applications launch correctly
- ✅ No functionality degradation observed
- ✅ Build process remains clean
- ✅ Global commands work as expected
- ✅ Database connectivity maintained
- ✅ Test suites execute successfully

**If any test fails, immediately execute emergency recovery procedure.**