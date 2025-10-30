# Host Provisioner Environment Configuration

## CRITICAL: Environment Isolation

**Host Provisioner MUST ALWAYS run in Development mode** unless explicitly deployed to production via `ncdeploy.ps1`.

### Why This Matters

The Host Provisioner is a **development tool** used to generate test sessions and tokens. It should:
- ✅ Default to KSESSIONS_DEV database (Development)
- ✅ Generate tokens for localhost:9091 (Development base URL)
- ❌ NEVER accidentally use Production database during development
- ❌ NEVER be affected by ASPNETCORE_ENVIRONMENT variable (that's for the web app)

### Environment Detection Order

The Host Provisioner uses this priority:

1. **app.config file** (`ASPNETCORE_ENVIRONMENT` key)
   - Modified by `ncdeploy.ps1` when deploying to production
   - Default value: `"Development"`
   
2. **Fallback**: `"Development"` (if config file missing)

**DOES NOT CHECK**: `ASPNETCORE_ENVIRONMENT` environment variable (used by web app only)

### Configuration Files

#### Development (Default)
```xml
<!-- Tools/HostProvisioner/HostProvisioner.WinForms/app.config -->
<add key="ASPNETCORE_ENVIRONMENT" value="Development" />
<add key="BaseUrl_Development" value="https://localhost:9091" />
```

#### Production (Set by ncdeploy only)
```xml
<!-- Modified by ncdeploy.ps1 during deployment -->
<add key="ASPNETCORE_ENVIRONMENT" value="Production" />
<add key="BaseUrl_Production" value="https://noorcanvas.servehttp.com" />
```

### Database Connections

| Environment | Database | Connection String |
|-------------|----------|-------------------|
| Development | KSESSIONS_DEV | Server=AHHOME;Database=KSESSIONS_DEV;... |
| Production | KSESSIONS | Server=AHHOME;Database=KSESSIONS;... |

### Deployment Process

When deploying Host Provisioner to production:

```powershell
# ncdeploy.ps1 will:
# 1. Modify app.config to set Production environment
# 2. Copy to production location
# 3. Host Provisioner.exe will then use KSESSIONS database
```

### Verification

To verify Host Provisioner environment:

1. **Launch the WinForms app**
   - Look for "Environment: Development" or "Environment: Production"
   - Look for "Database: KSESSIONS_DEV" or "Database: KSESSIONS"

2. **Check the CLI version**
   ```powershell
   cd Tools/HostProvisioner/HostProvisioner
   dotnet run
   # Output will show environment banner
   ```

### Common Issues

#### Issue: Host Provisioner shows "Production" but should be Development
**Cause**: app.config was modified or ASPNETCORE_ENVIRONMENT variable was checked (old behavior)
**Fix**: 
1. Check `Tools/HostProvisioner/HostProvisioner.WinForms/app.config`
2. Verify `ASPNETCORE_ENVIRONMENT` value is "Development"
3. Rebuild and run again

#### Issue: Tokens generated for wrong URL
**Cause**: BaseUrl detection using wrong environment
**Fix**: Verify app.config has correct BaseUrl_Development setting

### Implementation Details

See `Tools/HostProvisioner/Shared/HostProvisionerConfig.cs`:
- `DetectEnvironment()` method now ONLY reads app.config
- NEVER reads ASPNETCORE_ENVIRONMENT variable (web app only)
- Always defaults to "Development" if config missing

### Related Files

- **Config**: `Tools/HostProvisioner/HostProvisioner.WinForms/app.config`
- **Logic**: `Tools/HostProvisioner/Shared/HostProvisionerConfig.cs`
- **Deployment**: `Scripts/ncdeploy.ps1` (modifies config for production)
- **README**: `Tools/HostProvisioner/README.md`

---

**Last Updated**: October 22, 2025  
**Rule**: Host Provisioner = Development by default, Production only when deployed via ncdeploy
