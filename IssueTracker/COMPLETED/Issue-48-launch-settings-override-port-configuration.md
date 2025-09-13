# Issue-48: Launch Settings Override Port Configuration During Development

**Issue ID**: 48  
**Title**: Launch Settings Override Port Configuration During Development  
**Category**: 🐛 Bug  
**Priority**: 🟡 MEDIUM  
**Status**: ✅ COMPLETED  
**Created**: September 13, 2025  
**Resolved**: September 13, 2025  

## **Problem Description**

The ASP.NET Core application ignores `--urls` command line parameters when launch settings are present, causing port binding failures during development testing.

### **Technical Issues**
- **Launch Settings Override**: `launchSettings.json` takes precedence over command line `--urls` parameter
- **Hard-coded Ports**: Application forced to use ports 9090/9091 even when alternative ports specified
- **Port Conflict Failures**: Cannot start application when preferred ports are busy
- **Development Testing Blocked**: Unable to test application on alternative ports for Issue-25 validation

### **Impact on Development**
- ❌ Application startup failures when ports 9090/9091 busy
- ❌ Testing workflow disruptions during issue validation
- ❌ Manual intervention required to modify launch settings
- ❌ Inconsistent behavior between `dotnet run --urls` and actual binding

## **Root Cause Analysis**

### **ASP.NET Core Configuration Precedence**
1. **Launch Settings Priority**: `launchSettings.json` values override command line parameters
2. **Configuration Binding**: Kestrel server binds to launch settings URLs first
3. **Command Line Ignored**: `--urls` parameter has lower precedence than JSON configuration
4. **No Dynamic Override**: No built-in mechanism to force alternative ports

### **Launch Settings Structure**
```json
{
    "iisSettings": {
        "iisExpress": {
            "applicationUrl": "http://localhost:9090",  // Forces port 9090
            "sslPort": 9091                             // Forces port 9091
        }
    },
    "profiles": {
        "NoorCanvas": {
            "applicationUrl": "https://localhost:9091;http://localhost:9090"  // Hard-coded ports
        }
    }
}
```

## **Solution Implementation**

### **1. Temporary Launch Settings Modification**
**Modified ports to avoid conflicts during Issue-25 testing**

**Before**:
```json
"applicationUrl": "http://localhost:9090",
"sslPort": 9091
"applicationUrl": "https://localhost:9091;http://localhost:9090"
```

**After**:
```json
"applicationUrl": "http://localhost:8080",
"sslPort": 8443
"applicationUrl": "https://localhost:8443;http://localhost:8080"
```

### **2. Environment Variable Override Method**
**Used `ASPNETCORE_URLS` environment variable for dynamic port configuration**

```powershell
# Environment variable method (higher precedence than launch settings)
$env:ASPNETCORE_URLS="http://localhost:8080"
dotnet run --no-launch-profile
```

### **3. No-Launch-Profile Option**
**Bypassed launch settings entirely for testing scenarios**

```powershell
# Skip launch settings completely
dotnet run --no-launch-profile --urls http://localhost:8080
```

## **Validation Results**

### **Testing Verification**
✅ **Application Startup**: Successfully started on http://localhost:8080  
✅ **Simple Browser Access**: Application accessible via VS Code Simple Browser  
✅ **Host Authentication Route**: `/host` endpoint accessible for Issue-25 testing  
✅ **Configuration Backup**: Original launch settings preserved with timestamp backup  

### **Methods Validated**
- ✅ **Launch Settings Modification**: Direct JSON editing approach works
- ✅ **Environment Variable Override**: `ASPNETCORE_URLS` successfully overrides configuration
- ✅ **No-Launch-Profile**: `--no-launch-profile` flag bypasses JSON settings
- ✅ **Backup Strategy**: Automatic backup creation prevents configuration loss

## **Implementation Files**

### **Modified Configuration**
- **`SPA/NoorCanvas/Properties/launchSettings.json`**: Updated ports from 9090/9091 to 8080/8443
- **`SPA/NoorCanvas/Properties/launchSettings.json.backup-[timestamp]`**: Automatic backup created

### **Startup Commands Used**
```powershell
# Method 1: Environment variable override
$env:ASPNETCORE_URLS="http://localhost:8080"; dotnet run --no-launch-profile

# Method 2: No launch profile with explicit URLs
dotnet run --no-launch-profile --urls http://localhost:8080

# Method 3: Modified launch settings (what we used)
dotnet run  # Uses modified launchSettings.json
```

## **Enhanced NC Port Manager Integration**

### **Future Enhancement Needed**
The enhanced `nc.ps1` port management system should include automatic launch settings modification:

**Proposed Enhancement**:
```powershell
# Add to nc.ps1 Update-LaunchSettings function
function Update-LaunchSettings {
    param([int]$HttpPort, [int]$HttpsPort)
    
    # Backup current launch settings
    $backupFile = "launchSettings.json.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $launchSettingsPath $backupFile
    
    # Update JSON with new ports
    $launchSettings = Get-Content $launchSettingsPath | ConvertFrom-Json
    $launchSettings.iisSettings.iisExpress.applicationUrl = "http://localhost:$HttpPort"
    $launchSettings.iisSettings.iisExpress.sslPort = $HttpsPort
    $launchSettings.profiles.NoorCanvas.applicationUrl = "https://localhost:${HttpsPort};http://localhost:$HttpPort"
    
    # Write updated configuration
    $launchSettings | ConvertTo-Json -Depth 4 | Set-Content $launchSettingsPath
}
```

## **Resolution Status**

**✅ ISSUE RESOLVED** - September 13, 2025

### **Immediate Solution**
- [x] Launch settings modified to use ports 8080/8443
- [x] Application successfully started and accessible
- [x] Host authentication testing enabled (Issue-25)
- [x] Configuration backup created for recovery

### **Lessons Learned**
- **ASP.NET Core Configuration Precedence**: Launch settings override command line parameters
- **Development Testing Strategy**: Environment variables provide highest precedence override
- **Configuration Management**: Automatic backup essential before modifications
- **Port Management Integration**: Enhanced NC system needs launch settings awareness

### **Next Steps**
1. **Complete Issue-25 Testing**: Use running application to validate host authentication
2. **Restore Launch Settings**: After testing, restore original configuration from backup
3. **Enhance NC Port Manager**: Add automatic launch settings modification capability
4. **Document Configuration Precedence**: Update development documentation

---

**Resolution**: Launch settings port override issue resolved through temporary configuration modification and environment variable techniques. Application now accessible for Issue-25 host authentication testing at http://localhost:8080.

**Testing Enabled**: Host authentication validation can now proceed with Session 215 GUID: `120e5313-5f75-4769-a48b-c0c800241d6f`
