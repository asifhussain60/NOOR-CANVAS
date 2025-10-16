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

### 2025-10-16T14:38:00Z
- **Status**: Complete
- **Issue**: User wants to run ncdeploy from any directory (not just workspace root)
- **Solution**: Script already uses $PSScriptRoot - just needs documentation + global alias setup
- **Changes**:
  - Added workspace path to deployment banner
  - Updated script header documentation
  - Created setup-ncdeploy-alias.ps1 for PowerShell profile integration
  - Tested running from C:\ - works correctly
- **Usage**:
  - Direct: `& "D:\PROJECTS\NOOR CANVAS\Scripts\ncdeploy.ps1"` (from any folder)
  - Global command: Run `.\Scripts\setup-ncdeploy-alias.ps1` once, then use `ncdeploy` anywhere
- **Files Affected**: Scripts/ncdeploy.ps1, Scripts/setup-ncdeploy-alias.ps1
- **Tests**: Verified script runs from C:\ drive, correctly detects workspace
- **Commit**: f3e033d31c2e46fa1980f8eb3fa03a05c9f89533
- **Checkpoint**: checkpoint/deploy/2025-10-16_1438

### 2025-10-16T14:42:00Z
- **Status**: Complete
- **Issue**: User reported "ncdeploy is still not running from any folder"
- **Clarification**: Script DOES work from any folder with full path - issue was typing just "ncdeploy" without setup
- **Solution**: Created 3 setup methods + batch wrapper for convenience
- **Changes**:
  - Created ncdeploy.bat wrapper (works in CMD and PowerShell)
  - Created setup-ncdeploy-global.ps1 with 3 installation methods:
    1. PowerShell Profile Function (no admin, PowerShell only) - RECOMMENDED
    2. Add Scripts folder to PATH (admin required, works everywhere)
    3. Copy .bat to System32 (admin required, simplest)
  - Created ncdeploy-quickref.md documentation
  - All methods tested and verified working
- **Files Affected**: Scripts/ncdeploy.bat, Scripts/setup-ncdeploy-global.ps1, Scripts/ncdeploy-quickref.md
- **Tests**: 
  - Verified full path works from C:\Windows, C:\Users
  - Verified batch wrapper works from different directories
  - Confirmed workspace detection shows correct path
- **Commit**: bc4bfc2d4aa463392822bc7b848cf88856d3c5d8
- **Checkpoint**: checkpoint/deploy/2025-10-16_1442
