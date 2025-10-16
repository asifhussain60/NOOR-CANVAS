# deploy

## Purpose
Deployment automation and production configuration validation for NoorCanvas and HostProvisioner.

## Status
In Progress

## Work Log

### 2025-10-16T08:45:00Z
- **Status**: In Progress
- **Issue**: HostProvisioner deployed with Development settings (KSESSIONS_DEV) instead of Production (KSESSIONS)
- **Root Cause**: ncdeploy.ps1 transforms XML config files but HostProvisioner reads ASPNETCORE_ENVIRONMENT from environment variables
- **Changes**: Adding post-deployment validation to ncdeploy.ps1
- **Files Affected**: Scripts/ncdeploy.ps1
- **Commit**: 296fa976
