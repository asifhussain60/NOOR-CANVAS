# Deployment Cleanup Action Plan
**Created:** October 12, 2025  
**Status:** Ready for Implementation

## Overview

This action plan addresses the critical deployment structure issues identified in `deployment-structure-analysis.md`. The current deployment has significant duplication (HostProvisioner folder duplicates ~77 files) and poor organization (67 DLLs scattered at root level).

## Key Deliverables

✅ **Created:**
1. `TEMP/deployment-structure-analysis.md` - Comprehensive analysis of current issues
2. `Scripts/reorganize-deployment.ps1` - PowerShell script to reorganize deployments
3. This action plan document

🔄 **To Create:**
1. Updated `ncdeploy.ps1` that uses reorganization script
2. Testing validation script
3. Rollback procedure documentation

## Implementation Phases

### Phase 1: Testing & Validation (Current)

#### 1.1 Test Reorganization Script (DRY RUN)
```powershell
# Test on current TEMP deployment
cd "D:\PROJECTS\NOOR CANVAS\Scripts"

# Dry run to see what would happen
.\reorganize-deployment.ps1 `
    -SourcePath "D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS" `
    -TargetPath "D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS-CLEAN" `
    -DryRun

# If looks good, run for real
.\reorganize-deployment.ps1 `
    -SourcePath "D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS" `
    -TargetPath "D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS-CLEAN" `
    -SeparateHostProvisioner
```

**Expected Results:**
- Organized bin/ folder structure
- HostProvisioner deployed separately to `D:\Tools\HostProvisioner`
- Clean root folder with only essential files
- Reduced deployment size by ~30-40%

#### 1.2 Validate Application Still Works
```powershell
# Start application from new organized structure
cd "D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS-CLEAN"
dotnet NoorCanvas.dll

# Test key functionality:
# - Application starts without errors
# - Database connection works
# - SignalR connections work
# - Static files serve correctly
# - Admin features accessible
```

#### 1.3 Test HostProvisioner Separately
```powershell
# Test HostProvisioner from separate location
cd "D:\Tools\HostProvisioner"
.\HostProvisioner.exe create --session-id 999 --created-by "Test" --dry-run true

# Verify it can:
# - Run independently
# - Connect to database
# - Access required resources
```

### Phase 2: Update Deployment Scripts

#### 2.1 Create New Integrated Deployment Script
Create `Scripts/ncdeploy-v2.ps1`:

```powershell
# High-level flow:
1. Build application (existing logic)
2. Publish to temp folder (existing logic)
3. [NEW] Run reorganize-deployment.ps1 to create clean structure
4. [NEW] Deploy HostProvisioner to D:\Tools\HostProvisioner
5. Stop IIS (existing logic)
6. Backup current deployment (existing logic)
7. Deploy reorganized files to D:\Websites\NOOR-CANVAS
8. Start IIS (existing logic)
9. Verify deployment (existing logic)
```

#### 2.2 Update Configuration If Needed

Check if application needs configuration updates:

```csharp
// Check Program.cs or Startup.cs for hardcoded paths
// May need to update probing paths for bin/Dependencies

// Option 1: Add to Program.cs
builder.Services.Configure<RouteOptions>(options => {
    // Check for any path dependencies
});

// Option 2: Update .deps.json or .runtimeconfig.json
// These are auto-generated, but verify they handle bin/ subfolder
```

### Phase 3: Production Deployment

#### 3.1 Pre-Deployment Checklist
- [ ] All tests pass in reorganized structure
- [ ] HostProvisioner works from separate location
- [ ] Backup of current production deployment created
- [ ] Rollback script tested and ready
- [ ] Deployment window scheduled
- [ ] Stakeholders notified

#### 3.2 Deployment Steps
```powershell
# 1. Build and reorganize
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\ncdeploy-v2.ps1 -SeparateHostProvisioner

# 2. Verify deployment
# - Check application starts
# - Check all features work
# - Check HostProvisioner accessible

# 3. Monitor logs
Get-Content "D:\Websites\NOOR-CANVAS\logs\noor-canvas-prod-*.txt" -Wait
```

#### 3.3 Rollback Procedure (If Needed)
```powershell
# Use existing rollback script
cd "D:\PROJECTS\NOOR CANVAS\Scripts"
.\ncrollback.ps1

# Or manual rollback:
# 1. Stop IIS App Pool
# 2. Restore from D:\Websites\NOOR-CANVAS-Backups\backup-[TIMESTAMP]
# 3. Start IIS App Pool
```

### Phase 4: Long-term Optimizations

#### 4.1 Reduce Language Packs (Optional)
If only specific languages are needed:

```xml
<!-- Update NoorCanvas.csproj -->
<PropertyGroup>
  <SatelliteResourceLanguages>en;es;fr</SatelliteResourceLanguages>
</PropertyGroup>
```

This would reduce from 14 languages to just 3, saving ~8-10 MB.

#### 4.2 Consider Assembly Linking
For even smaller deployments:

```xml
<PropertyGroup>
  <PublishTrimmed>true</PublishTrimmed>
  <PublishSingleFile>false</PublishSingleFile>
</PropertyGroup>
```

#### 4.3 Implement Shared Dependency Strategy
If HostProvisioner truly needs same dependencies as main app:

```
D:\Shared\
  └── NoorCanvas-Dependencies\
      ├── Azure.*.dll
      ├── Microsoft.*.dll
      └── ...

D:\Websites\NOOR-CANVAS\
  └── (symlink or reference to shared)

D:\Tools\HostProvisioner\
  └── (symlink or reference to shared)
```

But this adds complexity and is only worthwhile if:
- Both apps truly need identical versions
- Deployment happens frequently
- Storage is severely constrained

## Decision Points

### Decision 1: HostProvisioner Deployment Strategy

**Option A: Separate Deployment (RECOMMENDED)**
✅ Pros:
- Clean separation of concerns
- Independent versioning possible
- Smaller main application deployment
- Easier to maintain

❌ Cons:
- Need to manage two deployment locations
- Slightly more complex deployment script

**Option B: Embedded in Tools Folder**
✅ Pros:
- Single deployment location
- Simpler deployment script

❌ Cons:
- Still duplicates dependencies
- Larger deployment package
- Tighter coupling

**Recommendation:** Use Option A (Separate Deployment)

### Decision 2: Bin Folder Organization

**Option A: bin/Dependencies (RECOMMENDED)**
```
NOOR-CANVAS\
├── bin\
│   ├── Dependencies\  (all third-party DLLs)
│   ├── Resources\     (language folders)
│   └── runtimes\      (platform binaries)
├── NoorCanvas.dll
├── NoorCanvas.exe
└── ...
```

**Option B: All in bin/**
```
NOOR-CANVAS\
├── bin\
│   ├── AngleSharp.dll
│   ├── Azure.*.dll
│   ├── NoorCanvas.dll  (mixed with dependencies)
│   └── ...
```

**Recommendation:** Use Option A for better organization.

### Decision 3: Language Resources

**Keep All 14 Languages?**
- Current: cs, de, es, fr, it, ja, ko, pl, pt-BR, ru, tr, zh-Hans, zh-Hant
- Cost: ~10 MB
- Impact: Low if storage not constrained

**Recommendation:** Keep all unless specific requirement to reduce size.

## Testing Checklist

### Before Production Deployment
- [ ] Application starts successfully from reorganized structure
- [ ] Database connections work (SQL Server)
- [ ] SignalR hubs connect properly
- [ ] Admin authentication works
- [ ] Session management works
- [ ] Drawing canvas loads and functions
- [ ] Image uploads work
- [ ] Content broadcasts deliver
- [ ] Static files (CSS, JS, images) load correctly
- [ ] Logging to logs/ folder works
- [ ] HostProvisioner can run from separate location
- [ ] HostProvisioner can create sessions
- [ ] HostProvisioner can access database

### After Production Deployment
- [ ] Application accessible via URL
- [ ] No errors in application logs
- [ ] No errors in IIS logs
- [ ] Performance acceptable (compare to baseline)
- [ ] All user features functional
- [ ] HostProvisioner tools accessible to admins

## Rollback Criteria

Trigger rollback if:
1. Application fails to start
2. Critical features broken (auth, sessions, drawing)
3. Performance degraded >20%
4. Database connectivity issues
5. Multiple user-reported errors within 15 minutes

## Metrics to Monitor

### Before Deployment (Baseline)
- Deployment folder size: ~_____ MB
- Application startup time: ~_____ seconds
- First page load time: ~_____ seconds
- Memory usage (idle): ~_____ MB

### After Deployment (Compare)
- Deployment folder size: ~_____ MB (expect 30-40% reduction)
- Application startup time: ~_____ seconds (should be same or better)
- First page load time: ~_____ seconds (should be same)
- Memory usage (idle): ~_____ MB (should be same)

## Communication Plan

### Before Deployment
**Email to stakeholders:**
> Subject: NoorCanvas Deployment Optimization - [DATE]
> 
> We will be deploying an optimized version of NoorCanvas that:
> - Improves deployment structure organization
> - Reduces deployment size by ~30-40%
> - Separates HostProvisioner tool for better maintainability
> 
> Expected downtime: 5-10 minutes
> Rollback plan: Available if issues arise
> 
> No user-facing changes expected.

### After Deployment
**Success notification:**
> Subject: NoorCanvas Deployment Complete - [DATE]
> 
> Deployment completed successfully.
> New structure provides:
> - Cleaner organization
> - Reduced disk usage
> - Improved maintainability
> 
> All systems operational.

## Files Created/Modified

### New Files
1. ✅ `TEMP/deployment-structure-analysis.md` - Analysis document
2. ✅ `Scripts/reorganize-deployment.ps1` - Reorganization script
3. ✅ `TEMP/deployment-cleanup-action-plan.md` - This file
4. 🔄 `Scripts/ncdeploy-v2.ps1` - Updated deployment script (to create)
5. 🔄 `Docs/deployment-structure.md` - Documentation (to create)

### Modified Files
- 🔄 `Scripts/ncdeploy.ps1` - May deprecate in favor of ncdeploy-v2.ps1
- 🔄 `Scripts/ncrollback.ps1` - May need updates for new structure
- 🔄 `.github/prompts/deploy.prompt.md` - Update deployment docs (if exists)

## Timeline Estimate

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1: Testing | 2-4 hours | Test reorganization script, validate application |
| Phase 2: Script Updates | 2-3 hours | Create ncdeploy-v2.ps1, test integration |
| Phase 3: Production Deploy | 1 hour | Execute deployment, monitor, verify |
| **Total** | **5-8 hours** | Complete project timeline |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App won't start from new structure | Low | High | Thorough testing, rollback ready |
| DLL loading issues | Low | High | Test probing paths, validate .deps.json |
| HostProvisioner can't find resources | Medium | Medium | Test separately first, document paths |
| IIS configuration issues | Low | Medium | Keep web.config at root |
| Performance degradation | Very Low | Medium | Monitor metrics, rollback if needed |
| User disruption | Low | Low | Deploy during low-usage window |

## Success Criteria

Deployment is successful if:
1. ✅ Application starts without errors
2. ✅ All features functional (verified via smoke tests)
3. ✅ Deployment size reduced by at least 25%
4. ✅ No increase in startup time or memory usage
5. ✅ HostProvisioner functional from separate location
6. ✅ No critical issues within 24 hours post-deployment
7. ✅ Clean folder structure matching design

## Next Steps

1. **Immediate (Today):**
   - [x] Review analysis and action plan
   - [ ] Run dry-run test of reorganization script
   - [ ] Validate reorganized structure works

2. **Short-term (This Week):**
   - [ ] Create ncdeploy-v2.ps1
   - [ ] Test full deployment cycle in staging
   - [ ] Update documentation

3. **Production (Next Week):**
   - [ ] Schedule deployment window
   - [ ] Execute production deployment
   - [ ] Monitor for 24-48 hours
   - [ ] Document lessons learned

## Questions & Answers

**Q: Will this break existing deployments?**  
A: No, this only affects new deployments. Existing installations continue working.

**Q: Can we roll back if there are issues?**  
A: Yes, standard rollback procedures apply using ncrollback.ps1.

**Q: Why separate HostProvisioner?**  
A: It's a separate tool with different lifecycle and shouldn't duplicate 77 files.

**Q: Will this affect application performance?**  
A: No, bin/ subfolder organization is standard .NET practice with no performance impact.

**Q: Do we need to update IIS configuration?**  
A: No, web.config remains at root, IIS settings unchanged.

**Q: What about existing production deployment?**  
A: Next deployment will reorganize it automatically.

## References

- Analysis: `TEMP/deployment-structure-analysis.md`
- Reorganization script: `Scripts/reorganize-deployment.ps1`
- Current deployment script: `Scripts/ncdeploy.ps1`
- Rollback script: `Scripts/ncrollback.ps1`

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** Ready for Implementation Review
