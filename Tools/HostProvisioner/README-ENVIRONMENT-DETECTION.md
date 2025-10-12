# HostProvisioner Environment Detection System

## Overview
The HostProvisioner automatically detects whether to use **Production** (KSESSIONS) or **Development** (KSESSIONS_DEV) databases based on configuration files. **No manual environment variable setup required.**

## How It Works

### Environment Detection Priority (Automatic)

The system checks for the environment setting in this order:

1. **Environment Variable** (highest priority)
   - Set by PowerShell scripts (`create-token-prod.ps1`)
   - Temporary - only for that execution

2. **app.config File** (automatic - recommended)
   - `HostProvisioner.dll.config` in the same folder as the EXE
   - Automatically switched by `ncdeploy.ps1` during deployment
   - **Production deployment: automatically set to "Production"**
   - **Development build: defaults to "Development"**

3. **Default Fallback**
   - If nothing is set: defaults to "Development"

### Configuration Files

#### app.config (Source)
Located: `Tools/HostProvisioner/HostProvisioner/app.config`

```xml
<configuration>
  <appSettings>
    <add key="ASPNETCORE_ENVIRONMENT" value="Development" />
    <add key="ConnectionString_Development" value="Server=AHHOME;Database=KSESSIONS_DEV;..." />
    <add key="ConnectionString_Production" value="Server=AHHOME;Database=KSESSIONS;..." />
  </appSettings>
</configuration>
```

#### HostProvisioner.dll.config (Deployed)
Located: Same folder as `HostProvisioner.exe`

- **Development Build:** `value="Development"` → connects to KSESSIONS_DEV
- **Production Deployment:** ncdeploy.ps1 changes to `value="Production"` → connects to KSESSIONS

## Usage

### Production (D:\Websites\NOOR-CANVAS\HostProvisioner)

Just run the executable directly - no setup needed:

```powershell
cd D:\Websites\NOOR-CANVAS\HostProvisioner
.\HostProvisioner.exe create --session-id 212 --created-by "Your Name"
```

**Result:** Automatically connects to **KSESSIONS** (production database)

The deployed `HostProvisioner.dll.config` has already been switched to Production by ncdeploy.ps1.

### Development (Local Build)

```powershell
cd "d:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner\bin\Release\net8.0"
.\HostProvisioner.exe create --session-id 217 --created-by "Dev Test"
```

**Result:** Automatically connects to **KSESSIONS_DEV** (development database)

The local build uses the source `app.config` with Development setting.

### Using PowerShell Script (Optional)

If you want to override the app.config setting temporarily:

```powershell
cd D:\Websites\NOOR-CANVAS\HostProvisioner
.\create-token-prod.ps1 -SessionId 212 -CreatedBy "Admin"
```

This sets the environment variable which takes priority over app.config.

## Deployment Process

When you run `ncdeploy.ps1`:

1. ✅ Publishes HostProvisioner with app.config
2. ✅ **Automatically switches app.config to Production**
3. ✅ Copies to D:\Websites\NOOR-CANVAS\HostProvisioner
4. ✅ Ready to use - no manual configuration needed

### ncdeploy.ps1 Logic

```powershell
# Automatically switch app.config environment to Production
$appConfigPath = "$provisionerDest\HostProvisioner.dll.config"
if (Test-Path $appConfigPath) {
    [xml]$configXml = Get-Content $appConfigPath
    $envNode = $configXml.configuration.appSettings.add | 
        Where-Object { $_.key -eq "ASPNETCORE_ENVIRONMENT" }
    if ($envNode) {
        $envNode.value = "Production"  # Switches to Production
        $configXml.Save($appConfigPath)
    }
}
```

## Trace Logging

The HostProvisioner shows where the environment setting came from:

```
[TRACE] Environment from app.config: Production
[DEBUG-WORKITEM:deploy:connection-resolution] Environment: Production ;CLEANUP_OK
[DEBUG-WORKITEM:deploy:connection-resolution] Target Database: KSESSIONS ;CLEANUP_OK
```

or

```
[TRACE] Environment from environment variable: Production
[DEBUG-WORKITEM:deploy:connection-resolution] Environment: Production ;CLEANUP_OK
[DEBUG-WORKITEM:deploy:connection-resolution] Target Database: KSESSIONS ;CLEANUP_OK
```

## Troubleshooting

### HostProvisioner connects to wrong database

**Check the config file:**

```powershell
cd D:\Websites\NOOR-CANVAS\HostProvisioner
Get-Content HostProvisioner.dll.config
```

Look for:
```xml
<add key="ASPNETCORE_ENVIRONMENT" value="Production" />
```

If it says "Development", manually change it to "Production" or redeploy.

### Manually switch to Production

```powershell
cd D:\Websites\NOOR-CANVAS\HostProvisioner
$config = [xml](Get-Content 'HostProvisioner.dll.config')
$env = $config.configuration.appSettings.add | 
    Where-Object { $_.key -eq 'ASPNETCORE_ENVIRONMENT' }
$env.value = 'Production'
$config.Save((Resolve-Path 'HostProvisioner.dll.config').Path)
```

### Verify database connection

Run a test session and check the logs:

```powershell
.\HostProvisioner.exe create --session-id 212 --created-by "Test"
```

Look for:
- `[TRACE] Environment from app.config: Production`
- `[DEBUG-WORKITEM:deploy:connection-resolution] Target Database: KSESSIONS`

## Summary

✅ **No manual intervention needed** - just run `HostProvisioner.exe`
✅ **Production automatically uses KSESSIONS** via app.config
✅ **Development automatically uses KSESSIONS_DEV** via app.config
✅ **ncdeploy.ps1 handles all configuration** during deployment
✅ **Trace logs show exactly where environment came from**

The system is now **fully automatic** with proper environment detection! 🎉
