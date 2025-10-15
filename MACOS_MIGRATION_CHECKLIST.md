# macOS Migration - Files Changed

## Summary
Updated all database connection strings from `AHHOME` to `192.168.1.58,1433` to enable remote database access from macOS.

## Modified Configuration Files

### Shared Configuration
- ✅ `config/sharedsettings.json`

### Main Application (NoorCanvas)
- ✅ `SPA/NoorCanvas/appsettings.json`
- ✅ `SPA/NoorCanvas/appsettings.Development.json`
- ✅ `SPA/NoorCanvas/appsettings.Production.json`

### HostProvisioner Tool
- ✅ `Tools/HostProvisioner/HostProvisioner/appsettings.json`
- ✅ `Tools/HostProvisioner/HostProvisioner/appsettings.Development.json`
- ✅ `Tools/HostProvisioner/HostProvisioner/appsettings.Production.json`

### HostProvisioner WinForms
- ✅ `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.json`
- ✅ `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.Development.json`
- ✅ `Tools/HostProvisioner/HostProvisioner.WinForms/appsettings.Production.json`
- ✅ `Tools/HostProvisioner/HostProvisioner.WinForms/app.config`

### Deployment Scripts
- ✅ `Scripts/publish-hostprovisioner.ps1`

### Documentation
- ✅ `SETUP_MACOS.md` (NEW - macOS setup guide)

## Connection String Changes

### Before
```
Server=AHHOME;Database=KSESSIONS_DEV;...
Server=AHHOME;Database=KSESSIONS;...
```

### After
```
Server=192.168.1.58,1433;Database=KSESSIONS_DEV;...
Server=192.168.1.58,1433;Database=KSESSIONS;...
```

## Files NOT Modified (Build Artifacts - Ignored by Git)

The following files in `bin/` and `obj/` directories contain connection strings but are excluded by `.gitignore`:
- All files in `Tools/HostProvisioner/HostProvisioner/bin/**`
- All files in `Tools/HostProvisioner/HostProvisioner.WinForms/bin/**`
- All files in `SPA/NoorCanvas/bin/**`
- All files in `SPA/NoorCanvas/obj/**`

These will be regenerated when building on macOS with the updated source configuration files.

## Required Windows SQL Server Configuration

To allow connections from macOS (192.168.1.x network):

1. **SQL Server Configuration Manager**
   - Enable TCP/IP protocol
   - Set TCP Port to 1433
   - Restart SQL Server service

2. **Windows Firewall**
   - Allow inbound connections on port 1433
   - Allow SQL Server Browser service

3. **SQL Server Authentication**
   - Ensure SQL Server and Windows Authentication mode is enabled
   - Verify `sa` account is enabled (or create a new SQL user)

4. **Test Connection from macOS**
   ```bash
   ping 192.168.1.58
   telnet 192.168.1.58 1433
   ```

## Next Steps

1. **Review Changes**
   ```powershell
   git diff
   ```

2. **Stage Changes**
   ```powershell
   git add config/sharedsettings.json
   git add SPA/NoorCanvas/appsettings*.json
   git add Tools/HostProvisioner/HostProvisioner/appsettings*.json
   git add Tools/HostProvisioner/HostProvisioner.WinForms/appsettings*.json
   git add Tools/HostProvisioner/HostProvisioner.WinForms/app.config
   git add Scripts/publish-hostprovisioner.ps1
   git add SETUP_MACOS.md
   git add MACOS_MIGRATION_CHECKLIST.md
   ```

3. **Commit Changes**
   ```powershell
   git commit -m "Update database connection strings for macOS remote access

   - Changed server from AHHOME to 192.168.1.58,1433
   - Updated all appsettings*.json files
   - Updated HostProvisioner configurations
   - Added SETUP_MACOS.md guide for macBook setup
   - Updated deployment scripts
   
   This enables development from macOS while maintaining Windows SQL Server connection."
   ```

4. **Push to Development Branch**
   ```powershell
   git push origin development
   ```

5. **On macOS**
   ```bash
   git clone https://github.com/asifhussain60/NOOR-CANVAS.git
   cd NOOR-CANVAS
   git checkout development
   # Follow SETUP_MACOS.md
   ```

## Verification

After cloning on macOS, verify:
- [ ] .NET 8 SDK installed
- [ ] Can ping 192.168.1.58
- [ ] Can telnet to 192.168.1.58:1433
- [ ] `dotnet restore` succeeds
- [ ] `dotnet build` succeeds
- [ ] `dotnet run` connects to database
- [ ] Application accessible at https://localhost:9091

## Rollback Plan

If you need to revert to `AHHOME`:
```powershell
git checkout HEAD -- config/sharedsettings.json
git checkout HEAD -- SPA/NoorCanvas/appsettings*.json
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner/appsettings*.json
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner.WinForms/appsettings*.json
git checkout HEAD -- Tools/HostProvisioner/HostProvisioner.WinForms/app.config
git checkout HEAD -- Scripts/publish-hostprovisioner.ps1
```

## Notes

- All changes are in the `development` branch
- Production deployment on Windows will continue to work
- The IP address `192.168.1.58` should be accessible from both Windows and macOS on your local network
- If the Windows machine IP changes, update `config/sharedsettings.json` and rebuild
