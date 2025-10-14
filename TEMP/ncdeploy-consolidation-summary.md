# NoorCanvas Deployment Script Consolidation

**Date:** October 14, 2025  
**Author:** GitHub Copilot

## Summary

Consolidated multiple ncdeploy scripts into a single, comprehensive deployment script that follows proper git workflow and ensures correct production configuration.

## Changes Made

### Removed Scripts
- ✅ **`Scripts/ncdeploy-clean.ps1`** - Deleted (functionality merged)
- ✅ **Old `Scripts/ncdeploy.ps1`** - Replaced with new version

### New Script
- ✅ **`Scripts/ncdeploy.ps1`** - Single, comprehensive deployment script

## New Workflow

The `ncdeploy.ps1` script now implements the complete production deployment workflow:

### 1. Git Branch Management ✅
- **Starts on:** `development` branch (always)
- **Checks for:** Uncommitted changes (requires commit or stash)
- **Switches to:** `master` branch
- **Merges:** `development` → `master` (with conflict detection)
- **Returns to:** `development` branch (always ends here)

### 2. Build & Publish ✅
- Builds from `master` branch in **Release** configuration
- Publishes to temporary directory: `Workspaces/publish-temp`
- **Web.config transformation:** `web.Release.config` applies Production settings

### 3. Web.config Transformations ✅
The Release build automatically applies transformations from `web.Release.config`:
- **ASPNETCORE_ENVIRONMENT:** Set to `Production`
- **Connection Strings:** Point to `KSESSIONS` (production database)
- **Database Server:** AHHOME
- **Database Name:** KSESSIONS (NOT KSESSIONS_DEV)

### 4. IIS Management ✅
- Stops IIS Application Pool: `NoorCanvas` (default)
- Deploys files to: `D:\Websites\NOOR-CANVAS`
- Starts IIS Application Pool

### 5. Backup & Safety ✅
- Creates timestamped backup before deployment
- Keeps last 5 backups (auto-cleanup)
- Preserves logs directory
- Error recovery with branch restoration

## Usage Examples

### Standard Production Deployment
```powershell
# From development branch (recommended workflow)
.\Scripts\ncdeploy.ps1
```

**This will:**
1. Start on `development` branch
2. Merge `development` → `master`
3. Build from `master` with Production config
4. Deploy to production with KSESSIONS database
5. Return to `development` branch

### Skip Git Merge (Deploy Existing Master)
```powershell
.\Scripts\ncdeploy.ps1 -SkipMerge
```

Use when you're already on `master` with the correct code.

### Quick Deploy (No Backup, No IIS)
```powershell
.\Scripts\ncdeploy.ps1 -SkipBackup -SkipIIS
```

For testing or when IIS management isn't needed.

### Deploy with Uncommitted Changes (Not Recommended)
```powershell
.\Scripts\ncdeploy.ps1 -AutoMerge
```

⚠️ **Use with caution** - deploys even with uncommitted changes.

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-SkipMerge` | Skip git merge step | `false` |
| `-SkipBuild` | Skip build step | `false` |
| `-SkipBackup` | Skip backup creation | `false` |
| `-SkipIIS` | Skip IIS operations | `false` |
| `-AutoMerge` | Continue with uncommitted changes | `false` |
| `-AppPool` | IIS Application Pool name | `"NoorCanvas"` |

## Configuration Files

### Production Configuration
The deployment ensures these files are configured for production:

#### `appsettings.Production.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS;..."
  }
}
```

#### `web.Release.config` (Transformation)
```xml
<connectionStrings xdt:Transform="Replace">
  <add name="DefaultConnection" 
       connectionString="Data Source=AHHOME;Initial Catalog=KSESSIONS;..." />
</connectionStrings>
<environmentVariables>
  <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
</environmentVariables>
```

## Deployment Locations

| Component | Location |
|-----------|----------|
| Production Website | `D:\Websites\NOOR-CANVAS` |
| Backups | `D:\Websites\NOOR-CANVAS-Backups` |
| Publish Temp | `D:\PROJECTS\NOOR CANVAS\Workspaces\publish-temp` |
| Logs | `D:\Websites\NOOR-CANVAS\logs` |

## Database Configuration

| Environment | Database | Connection String Location |
|-------------|----------|---------------------------|
| **Production** | `KSESSIONS` | `appsettings.Production.json` + `web.config` |
| Development | `KSESSIONS_DEV` | `appsettings.Development.json` |

## Error Handling

The script includes comprehensive error handling:

1. **Git conflicts:** Script stops, provides resolution instructions
2. **Build failures:** Stops deployment, preserves current state
3. **IIS errors:** Continues with warnings
4. **Deployment failures:** Attempts to restore IIS state and return to original branch

## Best Practices

### ✅ DO
- Always run from development branch
- Commit changes before deploying
- Review deployment summary
- Verify application after deployment
- Check logs: `D:\Websites\NOOR-CANVAS\logs`

### ❌ DON'T
- Don't modify master branch directly
- Don't deploy without testing in development
- Don't use `-AutoMerge` without understanding implications
- Don't skip backups in production

## Rollback

If deployment fails or issues are detected:

```powershell
# Option 1: Use backup
cd D:\Websites\NOOR-CANVAS-Backups
# Copy most recent backup back to D:\Websites\NOOR-CANVAS

# Option 2: Use ncrollback.ps1 (if available)
.\Scripts\ncrollback.ps1
```

## Verification Checklist

After running `ncdeploy.ps1`, verify:

- [ ] Application is accessible
- [ ] Logs show no errors: `D:\Websites\NOOR-CANVAS\logs`
- [ ] Database connection is to KSESSIONS (not KSESSIONS_DEV)
- [ ] Environment is Production (check logs for environment name)
- [ ] You're back on development branch: `git branch --show-current`

## Integration with SelfAwareness.instructions.md

This deployment script follows the **Branch Strategy** defined in `.github/instructions/SelfAwareness.instructions.md`:

- ✅ **`master`** - Production branch (PROTECTED)
- ✅ **`development`** - Active development branch (DEFAULT)
- ✅ All work done in `development`
- ✅ Deploy from `master` only
- ✅ Never modify `master` directly

## Related Files

- `Scripts/ncdeploy.ps1` - Main deployment script (NEW)
- `Scripts/ncrollback.ps1` - Rollback script (unchanged)
- `SPA/NoorCanvas/web.Release.config` - Production transformations
- `SPA/NoorCanvas/appsettings.Production.json` - Production settings
- `config/sharedsettings.json` - Shared connection strings
- `.github/instructions/SelfAwareness.instructions.md` - Branch strategy

## Notes

- The script automatically verifies web.config transformations were applied
- Backup retention: Last 5 backups are kept, older ones are auto-deleted
- IIS Application Pool wait time: 30 seconds max for stop/start operations
- The script preserves `logs/` and `appsettings.Production.json` during deployment

## Support

For issues or questions:
1. Review error messages in script output
2. Check deployment logs
3. Consult `.github/instructions/SelfAwareness.instructions.md`
4. Review this document for usage examples
