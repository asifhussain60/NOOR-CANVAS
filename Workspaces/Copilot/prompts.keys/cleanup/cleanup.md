# Key: cleanup

## Metadata
- **Status**: complete
- **Created**: 2025-10-12T12:00:00Z
- **Last Updated**: 2025-10-12T12:00:00Z
- **Agent**: task
- **Priority**: high

## Description
Comprehensive workspace cleanup system with reusable cleanup.prompt.md for ongoing maintenance. Removes build artifacts, temporary files, and organizes documentation into proper folder structure.

## File Mappings

### Prompts
- `.github/prompts/cleanup.prompt.md` - Reusable cleanup agent with comprehensive cleanup workflows

### Root Structure (Essential Files Only)
- `.gitignore` - Git ignore patterns
- `Directory.Build.props` - MSBuild properties
- `NoorCanvas.sln` - Solution file
- `package.json` - Node packages
- `package-lock.json` - Package lock

### Scripts (Relocated from Root)
- `Scripts/cleanup-production-wwwroot.ps1` - Production cleanup script
- `Scripts/debug-asset-detection.ps1` - Asset debugging script
- `Scripts/diagnose-iis.ps1` - IIS diagnostics
- `Scripts/ncdeploy.ps1` - Deployment script
- `Scripts/ncrollback.ps1` - Rollback script
- `Scripts/setup-iis.ps1` - IIS setup
- `Scripts/setup-iis-ssl.ps1` - IIS SSL configuration

### Documentation (Organized)
- `Workspaces/Documentation/Deployment/DEPLOYMENT.md` - Deployment guide (moved from root)
- `Workspaces/Documentation/Deployment/IIS-CONFIGURATION-SUMMARY.md` - IIS config summary (moved from root)
- `Workspaces/Global/cohesion-review-latest.md` - Latest cohesion review (consolidated)

### Archive
- `Workspaces/Archive/2025-10-12-pre-cleanup/` - Archived old summaries and dated files

## Functionality Registry

### Core Behaviors
- ✅ **Cleanup Agent**: cleanup.prompt.md provides reusable workspace cleanup workflows
- ✅ **Root Cleanliness**: Only essential config files remain in root directory
- ✅ **Documentation Organization**: All MD files moved to appropriate Workspaces subfolders
- ✅ **Script Organization**: All PowerShell scripts moved to Scripts/ folder
- ✅ **Archival System**: Old summaries and dated files archived with timestamps

### File Watch
- `.github/prompts/cleanup.prompt.md` - Cleanup agent definition
- `Scripts/*.ps1` - Relocated PowerShell scripts
- `Workspaces/Documentation/Deployment/*.md` - Deployment documentation
- `Workspaces/Archive/` - Archive directory structure

### Related Test Coverage
- Manual validation: Build succeeds after cleanup
- Manual validation: Root directory contains only essential files
- Manual validation: Scripts accessible from Scripts/ folder

### Last Validation
- **Date**: 2025-10-12T12:00:00Z
- **Method**: manual
- **Result**: PASS
- **Commit**: 4a2e5a8d

## Dependencies
- None

## Related Keys
- None
