# deploy

## Purpose
Deployment automation and production configuration validation for NoorCanvas and HostProvisioner.

## Status
In Progress

## Work Log

### 2025-10-16T08:45:00Z
- **Status**: Complete
- **Issue**: HostProvisioner deployed with Development settings (KSESSIONS_DEV) instead of Production (KSESSIONS)
- **Root Cause**: ncdeploy.ps1 transforms XML config files but HostProvisioner reads ASPNETCORE_ENVIRONMENT from environment variables
- **Solution**: Added comprehensive post-deployment validation (Step 7.6)
- **Changes**: 
  - Added 4-part validation: NoorCanvas web.config, NoorCanvas appsettings.json, HostProvisioner appsettings.Production.json, ASPNETCORE_ENVIRONMENT system variable
  - Validation halts deployment if any configuration incorrect
  - Provides detailed remediation steps with exact commands
  - Debug logging with `;CLEANUP_OK` markers
- **Files Affected**: Scripts/ncdeploy.ps1, .github/prompts.keys/deploy/deploy.md
- **Tests**: Build validation passed (zero errors/warnings)
- **Commit**: 46b0179f08928454ae841537a4b504a7bbe0ba09
- **Checkpoint**: checkpoint/deploy/2025-10-16_0847

### 2025-10-16T14:35:00Z
- **Status**: Complete
- **Issue**: ncdeploy failing - appsettings.json deleted during clean deployment and not restored
- **Root Cause**: Clean deployment removes ALL files, dotnet publish no longer includes appsettings.json (template pattern), no preservation logic
- **Solution**: Preserve configuration files before clean, restore after deployment
- **Changes**:
  - Save appsettings.json, appsettings.Production.json before cleaning directory
  - Restore preserved configs after copying new files
  - Still removes appsettings.local.json (development override)
  - Validation now passes with all required files present
- **Files Affected**: Scripts/ncdeploy.ps1
- **Tests**: Deployment validation caught missing file (validation working correctly)
- **Commit**: fca156539fae483d583392f208c1e7b97f68abcc
- **Checkpoint**: checkpoint/deploy/2025-10-16_1435
