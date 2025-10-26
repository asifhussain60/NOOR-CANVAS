# CDN Development CORS Configuration

## Overview

The Resources CDN (`resources.kashkole.com`) now supports **dual-mode CORS configuration**:
- **Production Mode** (default): Only production domains
- **Development Mode**: Production domains + localhost origins

## Configuration Modes

### Production Mode (Default)
```powershell
.\setup-resources-cdn.ps1
```

**Allowed Origins:**
- `https://noorcanvas.kashkole.com`
- `https://session.kashkole.com`

### Development Mode
```powershell
.\setup-resources-cdn.ps1 -IncludeDevelopment
```

**Allowed Origins:**
- `https://noorcanvas.kashkole.com`
- `https://session.kashkole.com`
- `http://localhost:5000`
- `http://localhost:5001`
- `https://localhost:5001`

## Implementation Details

### Script Changes
The `setup-resources-cdn.ps1` script has been enhanced with:

1. **New Parameter**: `-IncludeDevelopment` switch
2. **Conditional CORS Logic**: Dynamically builds origin list based on mode
3. **Clear Mode Indicators**: Output shows which mode is active and lists all origins

### web.config Template
The generated `web.config` includes:
```xml
<add name="Access-Control-Allow-Origin" value="[dynamic-origins]" />
```

Where `[dynamic-origins]` is replaced with the comma-separated origin list based on the selected mode.

## Deployment History

### Phase 1: Script Update (2025-10-26)
- ✅ Added `-IncludeDevelopment` parameter to `setup-resources-cdn.ps1`
- ✅ Implemented conditional CORS origin array
- ✅ Updated web.config template with dynamic `$corsValue`
- ✅ Added mode indicators in script output

### Phase 2: Production Application (2025-10-26)
- ✅ Executed `setup-resources-cdn.ps1 -IncludeDevelopment` on production CDN server
- ✅ Verified `web.config` contains all 5 CORS origins
- ✅ Confirmed IIS site configuration (KashkoleResources → D:\Websites\KSESSIONS\Resources)
- ✅ IIS site restarted to apply changes

## Verification

### web.config Verification
```powershell
Get-Content 'D:\Websites\KSESSIONS\Resources\web.config' | Select-String -Pattern 'Access-Control-Allow-Origin'
```

**Expected Output (Development Mode):**
```xml
<add name="Access-Control-Allow-Origin" 
     value="https://noorcanvas.kashkole.com,https://session.kashkole.com,http://localhost:5000,http://localhost:5001,https://localhost:5001" />
```

### CORS Testing
The CORS headers are only returned by IIS for actual cross-origin requests. Testing from `localhost` to `localhost` will NOT show CORS headers (same-origin).

**Test from actual app context:**
1. Run NoorCanvas locally: `dotnet run` (launches on `https://localhost:5001`)
2. Open browser dev tools → Network tab
3. Filter for requests to `resources.kashkole.com`
4. Check response headers for `Access-Control-Allow-Origin`
5. Should see the full comma-separated origin list

## Usage Guidelines

### When to Use Development Mode
- ✅ During local development
- ✅ When testing CDN resources from localhost
- ✅ For debugging CORS issues

### When to Use Production Mode
- ✅ In production environments
- ✅ When security requires limiting origins
- ✅ After development/testing is complete

## Switching Modes

### From Production → Development
```powershell
cd 'D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN'
.\setup-resources-cdn.ps1 -IncludeDevelopment
```

### From Development → Production
```powershell
cd 'D:\PROJECTS\NOOR CANVAS\Scripts\Resources-CDN'
.\setup-resources-cdn.ps1
```

**Note:** Script automatically restarts the IIS site to apply changes.

## Security Considerations

### Development Mode Risks
- Localhost origins can access CDN resources
- Only enable during active development
- Should NOT be used in production for security-sensitive deployments

### Mitigation
- The script defaults to production-only mode
- Explicit `-IncludeDevelopment` flag required
- Clear output indicates which mode is active

## Troubleshooting

### CORS Headers Not Appearing
**Symptom:** Browser console shows CORS errors

**Causes:**
1. IIS site not restarted after config change
2. Cloudflare tunnel not routing correctly
3. Testing same-origin (localhost → localhost)

**Solutions:**
1. Re-run `setup-resources-cdn.ps1` with appropriate flag
2. Verify IIS site state: `Get-Website -Name 'KashkoleResources'`
3. Check Cloudflare tunnel: `Test-NetConnection resources.kashkole.com -Port 443`
4. Test from actual cross-origin context (not localhost → localhost)

### web.config Not Updating
**Symptom:** Old CORS origins still in config

**Solutions:**
1. Check file permissions on `D:\Websites\KSESSIONS\Resources\web.config`
2. Run PowerShell as Administrator
3. Verify script executed without errors

## Related Files

- **Setup Script:** `Scripts/Resources-CDN/setup-resources-cdn.ps1`
- **web.config:** `D:\Websites\KSESSIONS\Resources\web.config` (on production server)
- **Test Spec:** `Tests/UI/cdn-cors-development-test.spec.ts`

## Task Reference

- **Task Key:** `cdn-dev-cors-extension`
- **Phases Completed:** 1-2 (Script Update, Production Application)
- **Date:** 2025-10-26
