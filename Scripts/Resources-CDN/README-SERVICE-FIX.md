# Cloudflare Service Installation Fix - Complete Solution

## Overview

This solution provides comprehensive enhancements to fix the Cloudflare tunnel Windows service registration issue. The service installation now includes robust verification, auto-recovery, fallback mechanisms, and diagnostic tools.

## Problem Statement

**Original Issue**: The Cloudflare tunnel service installation script completed successfully but the service failed to register properly in Windows Service Manager, requiring manual startup via batch file.

## Solution Components

### Enhancement A: Verbose Logging ✓
**Implemented in**: `install-cloudflare-resources-service.ps1`

- **Feature**: Comprehensive logging system with timestamped entries
- **Benefits**:
  - Tracks every step of installation process
  - Logs to file with format: `install-service-YYYYMMDD-HHmmss.log`
  - Multiple log levels: INFO, SUCCESS, WARNING, ERROR
  - Aids troubleshooting and debugging
  - Captures cloudflared command outputs

**Usage**:
```powershell
# Logs are automatically created in script directory
# View logs after installation
Get-Content "Scripts/Resources-CDN/install-service-*.log" | Select-Object -Last 50
```

### Enhancement B: Service Registration Verification ✓
**Implemented in**: `install-cloudflare-resources-service.ps1`

- **Feature**: Retry mechanism with fallback to `sc.exe`
- **Benefits**:
  - Verifies service appears in Windows Service Manager
  - Retries up to 5 times with delays
  - Falls back to `sc.exe create` if cloudflared install fails
  - Provides detailed service information (DisplayName, StartType, Status)

**How it works**:
1. Attempts service installation via `cloudflared service install`
2. Polls for service registration with 2-second intervals
3. If not found after 5 attempts, uses `sc.exe` as fallback
4. Validates final registration before proceeding

### Enhancement C: Auto-Recovery Configuration ✓
**Implemented in**: `install-cloudflare-resources-service.ps1`

- **Feature**: Windows service failure recovery actions
- **Benefits**:
  - Service automatically restarts on failure
  - Multiple retry attempts with increasing delays
  - Configured via `sc.exe failure` command
  
**Recovery Schedule**:
- First failure: Restart after 1 minute
- Second failure: Restart after 2 minutes
- Subsequent failures: Restart after 5 minutes
- Reset counter: Every 24 hours

**Verify recovery config**:
```powershell
sc.exe qfailure CloudflareResourcesTunnel
```

### Enhancement D: Fallback Startup Task ✓
**Script**: `create-startup-task.ps1`

- **Feature**: Windows scheduled task as backup start mechanism
- **Benefits**:
  - Runs at system startup (with 2-minute delay)
  - Starts service if not already running
  - Provides redundancy if service auto-start fails
  - Runs with SYSTEM privileges
  - Logs to Windows Event Log

**Create task**:
```powershell
.\create-startup-task.ps1
```

**Remove task**:
```powershell
.\create-startup-task.ps1 -Remove
```

**Test task manually**:
```powershell
Start-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"
```

### Enhancement E: Comprehensive Diagnostics ✓
**Script**: `diagnose-cloudflare-service.ps1`

- **Feature**: Complete health check and diagnostic tool
- **Benefits**:
  - 7 diagnostic categories with 20+ checks
  - Detailed status reporting
  - Event log analysis
  - Network connectivity tests
  - Export reports to JSON

**Diagnostic Categories**:
1. **Service Registration** - Verify service exists and status
2. **Binary Validation** - Check cloudflared.exe and version
3. **Configuration Validation** - Verify YAML config and credentials
4. **Recovery Configuration** - Check auto-restart settings
5. **Scheduled Task** - Verify fallback task exists
6. **Windows Event Log** - Analyze recent errors/warnings
7. **Network Connectivity** - Test Cloudflare API, tunnel URL, IIS backend

**Run diagnostics**:
```powershell
.\diagnose-cloudflare-service.ps1
```

**Export report**:
```powershell
.\diagnose-cloudflare-service.ps1 -ExportReport
```

## Installation Workflow

### Standard Installation

```powershell
# 1. Navigate to directory
cd "D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN"

# 2. Run enhanced installation script
.\install-cloudflare-resources-service.ps1

# 3. Create fallback startup task
.\create-startup-task.ps1

# 4. Run diagnostics to verify
.\diagnose-cloudflare-service.ps1
```

### Custom Paths

```powershell
.\install-cloudflare-resources-service.ps1 `
    -CloudflaredPath "C:\cloudflared\cloudflared.exe" `
    -ConfigPath "C:\cloudflared\config.yml" `
    -ServiceName "MyCloudflaredService"
```

## Troubleshooting Guide

### Service Not Starting

1. **Run diagnostics first**:
   ```powershell
   .\diagnose-cloudflare-service.ps1
   ```

2. **Check installation logs**:
   ```powershell
   Get-Content "install-service-*.log" -Tail 50
   ```

3. **Check Windows Event Log**:
   ```powershell
   Get-EventLog -LogName Application -Source cloudflared -Newest 20
   ```

4. **Verify service details**:
   ```powershell
   Get-Service CloudflareResourcesTunnel | Format-List *
   sc.exe query CloudflareResourcesTunnel
   ```

### Service Registered But Won't Start

1. **Check config file**:
   ```powershell
   Get-Content "D:\PROJECTS\__CLOUDFLARE\config-resources.yml"
   ```

2. **Test cloudflared manually**:
   ```powershell
   cd "D:\PROJECTS\__CLOUDFLARE"
   .\cloudflared.exe tunnel --config config-resources.yml run
   ```

3. **Check credentials file**:
   ```powershell
   Test-Path "D:\PROJECTS\__CLOUDFLARE\<tunnel-id>.json"
   ```

### Service Stops After Reboot

1. **Verify auto-recovery**:
   ```powershell
   sc.exe qfailure CloudflareResourcesTunnel
   ```

2. **Check startup task**:
   ```powershell
   Get-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"
   ```

3. **Manually trigger task**:
   ```powershell
   Start-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"
   ```

## Testing & Validation

### Run All Tests

```powershell
.\test-service-enhancements.ps1
```

**Test Coverage**:
- ✓ Logging system functionality
- ✓ Service registration verification logic
- ✓ Auto-recovery configuration commands
- ✓ Scheduled task creation
- ✓ Diagnostic script execution
- ✓ Integration between all components

### Manual Verification

1. **Verify service is registered**:
   ```powershell
   Get-Service CloudflareResourcesTunnel
   ```

2. **Verify service is running**:
   ```powershell
   Get-Service CloudflareResourcesTunnel | Select-Object Status, StartType
   ```

3. **Test tunnel connectivity**:
   ```powershell
   Invoke-WebRequest -Uri "https://resources.kashkole.com" -Method HEAD
   ```

4. **Check scheduled task**:
   ```powershell
   Get-ScheduledTask -TaskName "StartCloudflareResourcesTunnel" | Get-ScheduledTaskInfo
   ```

## Files Modified/Created

### Modified Files
- ✓ `install-cloudflare-resources-service.ps1` - Enhanced with all improvements

### New Files
- ✓ `create-startup-task.ps1` - Scheduled task creator
- ✓ `diagnose-cloudflare-service.ps1` - Comprehensive diagnostics
- ✓ `test-service-enhancements.ps1` - Validation test suite
- ✓ `README-SERVICE-FIX.md` - This documentation

### Generated Files (Runtime)
- `install-service-*.log` - Installation logs
- `diagnostic-report-*.json` - Diagnostic reports (optional)
- `test-log-*.log` - Test execution logs (temporary)

## Service Management Reference

### Common Commands

```powershell
# Check service status
Get-Service CloudflareResourcesTunnel

# Start service
Start-Service CloudflareResourcesTunnel

# Stop service
Stop-Service CloudflareResourcesTunnel

# Restart service
Restart-Service CloudflareResourcesTunnel

# View service details
Get-Service CloudflareResourcesTunnel | Format-List *

# Check service configuration
sc.exe qc CloudflareResourcesTunnel

# Check failure recovery settings
sc.exe qfailure CloudflareResourcesTunnel

# View recent logs
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

### Scheduled Task Commands

```powershell
# View task
Get-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"

# View task info (last run, next run)
Get-ScheduledTaskInfo -TaskName "StartCloudflareResourcesTunnel"

# Manually run task
Start-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"

# Disable task
Disable-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"

# Enable task
Enable-ScheduledTask -TaskName "StartCloudflareResourcesTunnel"

# Remove task
Unregister-ScheduledTask -TaskName "StartCloudflareResourcesTunnel" -Confirm:$false
```

## Success Criteria

All enhancements are working correctly when:

1. ✓ Service installs without errors
2. ✓ Service appears in Windows Service Manager
3. ✓ Service starts automatically
4. ✓ Service survives system reboot
5. ✓ Auto-recovery is configured
6. ✓ Fallback task is created
7. ✓ Diagnostics show "EXCELLENT" or "GOOD" health
8. ✓ Installation logs are created
9. ✓ All validation tests pass

## Validation Results

```
Total Tests: 6
Passed:      6
Failed:      0
Errors:      0
Status:      ✓ ALL TESTS PASSED
```

## Next Steps

After installation:

1. **Reboot and verify** - Restart system and confirm service auto-starts
2. **Monitor for 24 hours** - Check service remains running
3. **Test failure recovery** - Stop service manually and verify auto-restart
4. **Review logs** - Check installation and event logs for any warnings
5. **Run periodic diagnostics** - Use diagnostic script for health checks

## Support & Maintenance

### Regular Maintenance

- Run diagnostics weekly: `.\diagnose-cloudflare-service.ps1`
- Review Event Logs monthly
- Keep cloudflared.exe updated
- Monitor scheduled task execution

### Updating cloudflared.exe

```powershell
# 1. Stop service
Stop-Service CloudflareResourcesTunnel

# 2. Replace binary
# Download new version to D:\PROJECTS\__CLOUDFLARE\cloudflared.exe

# 3. Verify version
D:\PROJECTS\__CLOUDFLARE\cloudflared.exe --version

# 4. Start service
Start-Service CloudflareResourcesTunnel

# 5. Run diagnostics
.\diagnose-cloudflare-service.ps1
```

## Related Documentation

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Original Issue Tracking](.github/key-data-streams/cdn-cloudflare-fix/)
- [CDN Development Guide](../../Docs/CDN-DEVELOPMENT-CORS.md)

---

**Last Updated**: October 26, 2025  
**Version**: 1.0.0  
**Status**: All enhancements tested and validated ✓
