# Deployment Structure Analysis
**Date:** October 12, 2025  
**Target Folder:** `D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS`

## Executive Summary

The current deployment structure has **critical organizational issues** that need to be addressed:

### 🔴 Major Issues Identified

1. **Massive File Duplication**
   - Root folder contains **67 DLL files** scattered loosely
   - **HostProvisioner subfolder duplicates ALL dependencies** (77 files)
   - This duplication approximately **doubles the deployment size unnecessarily**

2. **Poor Folder Organization**
   - 14 language resource folders (`cs/`, `de/`, `es/`, `fr/`, `it/`, `ja/`, `ko/`, `pl/`, `pt-BR/`, `ru/`, `tr/`, `zh-Hans/`, `zh-Hant/`) at root level
   - No logical grouping of binaries vs. static content
   - Configuration files mixed with binaries at root

3. **Embedded Separate Application**
   - `HostProvisioner/` is a complete separate application embedded within the main deployment
   - Contains its own copies of: NoorCanvas.dll, NoorCanvas.exe, all dependencies
   - Should be deployed separately or in a proper tools/utilities directory

## Current Structure Breakdown

### Root Level (87 items)
```
├── 67 DLL files (dependencies, Azure, EF Core, Serilog, etc.)
├── 4 Configuration files (appsettings.*.json)
├── 4 Application files (NoorCanvas.dll, .exe, .pdb, .deps.json, .runtimeconfig.json)
├── 3 Web config files (web.config, web.Debug.config, web.Release.config)
├── 14 Language folders (cs/, de/, es/, fr/, it/, ja/, ko/, pl/, pt-BR/, ru/, tr/, zh-Hans/, zh-Hant/)
├── 1 Runtime binaries folder (runtimes/)
├── 1 Web content folder (wwwroot/)
├── 1 Logs folder (logs/)
└── 1 Tools folder (HostProvisioner/) ⚠️ CONTAINS FULL DUPLICATE SET OF DEPENDENCIES
```

### HostProvisioner Subfolder Issues
- **77 files** - almost identical to root folder
- Contains duplicate copies of:
  - All Microsoft.* DLLs
  - All Azure.* DLLs
  - All Serilog.* DLLs
  - All language resource folders
  - NoorCanvas.dll and NoorCanvas.exe (!)
  - Configuration files

### wwwroot/ Structure
```
wwwroot/
├── css/
├── fonts/
├── images/
├── js/
├── lib/
├── Resources/
├── favicon.ico
└── NoorCanvas.styles.css
```
This appears properly organized.

## Recommended Clean Structure

### Option 1: Separate Deployments (Recommended)

```
D:\Websites\NOOR-CANVAS\
├── bin/                              # All runtime DLLs grouped
│   ├── Dependencies/                 # Third-party DLLs
│   │   ├── AngleSharp.dll
│   │   ├── Azure.*.dll
│   │   ├── Microsoft.*.dll
│   │   ├── Serilog.*.dll
│   │   └── ...
│   ├── Resources/                    # Language resources
│   │   ├── cs/
│   │   ├── de/
│   │   ├── es/
│   │   └── ...
│   └── runtimes/                     # Platform-specific binaries
│       ├── win-x64/
│       ├── win-x86/
│       └── ...
├── Config/                           # Configuration files
│   ├── appsettings.json
│   ├── appsettings.Production.json
│   └── web.config
├── wwwroot/                          # Static web content
│   ├── css/
│   ├── fonts/
│   ├── images/
│   ├── js/
│   ├── lib/
│   └── Resources/
├── logs/                             # Application logs
├── NoorCanvas.dll                    # Main application
├── NoorCanvas.exe
├── NoorCanvas.pdb
├── NoorCanvas.deps.json
├── NoorCanvas.runtimeconfig.json
└── NoorCanvas.staticwebassets.endpoints.json

D:\Tools\HostProvisioner\             # SEPARATE DEPLOYMENT
├── bin/
│   └── Dependencies/
├── Config/
│   └── appsettings.json
├── HostProvisioner.exe
├── HostProvisioner.dll
└── ...
```

### Option 2: Unified Deployment with Proper Structure

```
D:\Websites\NOOR-CANVAS\
├── App/                              # Main application
│   ├── bin/
│   │   ├── Dependencies/
│   │   ├── Resources/
│   │   └── runtimes/
│   ├── Config/
│   ├── wwwroot/
│   ├── logs/
│   └── NoorCanvas.*
├── Tools/                            # Utility applications
│   └── HostProvisioner/
│       ├── bin/
│       ├── Config/
│       └── HostProvisioner.*
└── Shared/                           # Shared dependencies (if applicable)
    └── Common/
```

### Option 3: Minimal Restructure (Quick Fix)

```
D:\Websites\NOOR-CANVAS\
├── bin/                              # Move all DLLs here
│   ├── cs/
│   ├── de/
│   ├── ... (language folders)
│   ├── runtimes/
│   └── *.dll
├── wwwroot/
├── logs/
├── Tools/                            # Rename HostProvisioner
│   └── HostProvisioner/
├── appsettings.*.json
├── web.config
├── NoorCanvas.dll
├── NoorCanvas.exe
└── ...
```

## Specific Issues Requiring Immediate Attention

### 1. HostProvisioner Duplication
**Problem:** HostProvisioner folder contains ~77 files, many duplicating root dependencies.

**Impact:**
- Wastes disk space (~50-100 MB)
- Confusing deployment structure
- Version mismatch risks
- Maintenance overhead

**Recommendation:**
- Deploy HostProvisioner as a separate application in `D:\Tools\HostProvisioner\`
- OR move to `Tools/` subfolder with only its unique dependencies
- Share common dependencies via PATH or assembly binding

### 2. Language Resource Folders
**Problem:** 14 language folders at root level clutter the deployment.

**Current:**
```
D:\Websites\NOOR-CANVAS\cs\
D:\Websites\NOOR-CANVAS\de\
D:\Websites\NOOR-CANVAS\es\
... (14 folders)
```

**Recommended:**
```
D:\Websites\NOOR-CANVAS\bin\Resources\cs\
D:\Websites\NOOR-CANVAS\bin\Resources\de\
D:\Websites\NOOR-CANVAS\bin\Resources\es\
```

### 3. Root-Level Binary Clutter
**Problem:** 67 DLL files at root level.

**Recommended:** Group into `bin/` or `bin/Dependencies/` folder.

### 4. Configuration File Organization
**Problem:** Multiple config files at root (appsettings.*.json, web.*.config).

**Recommended:** Keep appsettings.json at root for .NET Core conventions, but consider grouping web.config variants.

## Implementation Plan

### Phase 1: Immediate Fixes (Low Risk)
1. ✅ Create analysis documentation (this document)
2. 🔄 Create deployment reorganization script
3. 🔄 Test on staging/temp environment
4. 🔄 Validate application still runs correctly

### Phase 2: HostProvisioner Separation
1. 🔄 Determine if HostProvisioner can be separate deployment
2. 🔄 Create separate deployment path for HostProvisioner
3. 🔄 Update deployment scripts to handle both applications
4. 🔄 Remove HostProvisioner from main app deployment

### Phase 3: Binary Organization
1. 🔄 Update .csproj or publish profile to organize binaries
2. 🔄 Test bin/ subfolder structure
3. 🔄 Update any hardcoded paths in application code

### Phase 4: Deployment Script Updates
1. 🔄 Update `ncdeploy.ps1` to handle new structure
2. 🔄 Update `ncrollback.ps1` for compatibility
3. 🔄 Update any IIS configuration references

## Deployment Script Considerations

The current `ncdeploy.ps1` script needs updates:

### Current Issues:
- Publishes to `Workspaces\publish-temp`
- Copies everything recursively without organization
- Excludes specific dev files but doesn't restructure

### Recommended Updates:
```powershell
# After publish, reorganize before deployment
$publishOutput = "$PublishPath"
$organizedOutput = "$PublishPath-Organized"

# Create organized structure
New-Item -Path "$organizedOutput/bin/Dependencies" -ItemType Directory -Force
New-Item -Path "$organizedOutput/bin/Resources" -ItemType Directory -Force
New-Item -Path "$organizedOutput/Config" -ItemType Directory -Force

# Move DLLs to bin/Dependencies
Get-ChildItem "$publishOutput/*.dll" | 
    Where-Object { $_.Name -ne "NoorCanvas.dll" } |
    Move-Item -Destination "$organizedOutput/bin/Dependencies"

# Move language folders to bin/Resources
@('cs','de','es','fr','it','ja','ko','pl','pt-BR','ru','tr','zh-Hans','zh-Hant') |
    ForEach-Object {
        if (Test-Path "$publishOutput/$_") {
            Move-Item "$publishOutput/$_" "$organizedOutput/bin/Resources"
        }
    }

# Move runtimes to bin/runtimes
Move-Item "$publishOutput/runtimes" "$organizedOutput/bin/runtimes"

# Move configs to Config/
Move-Item "$publishOutput/appsettings*.json" "$organizedOutput/Config"
Move-Item "$publishOutput/web*.config" "$organizedOutput/Config"

# Copy main app files to root
Copy-Item "$publishOutput/NoorCanvas.*" "$organizedOutput"
Copy-Item "$publishOutput/wwwroot" "$organizedOutput" -Recurse

# Deploy HostProvisioner separately (if needed)
if (Test-Path "$publishOutput/HostProvisioner") {
    # Deploy to separate location
}
```

## Questions to Answer

1. **Is HostProvisioner meant to be deployed with the main app or separately?**
   - If separate: Should be deployed to `D:\Tools\HostProvisioner\`
   - If together: Should share dependencies, not duplicate

2. **Are all 14 language resource packs needed in production?**
   - Could reduce deployment size by including only required languages
   - Current languages: Czech, German, Spanish, French, Italian, Japanese, Korean, Polish, Portuguese (Brazil), Russian, Turkish, Chinese (Simplified & Traditional)

3. **Does the application require DLLs at root level or can they be in bin/?**
   - .NET Core typically supports bin/ subfolder organization
   - May need AssemblyLoadContext or probing paths configuration

4. **What is the actual deployment target?**
   - Current script targets: `D:\Websites\NOOR-CANVAS`
   - This temp folder is: `D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS`

## File Size Analysis

### Current Deployment Size Estimate
- **Root DLLs:** ~50-80 MB
- **HostProvisioner DLLs (duplicate):** ~50-80 MB
- **Language Resources:** ~5-10 MB
- **Runtimes:** ~10-20 MB
- **wwwroot:** ~Variable (static content)
- **Total:** ~150-250 MB (with significant duplication)

### Optimized Deployment Size Estimate
- **Organized bin/Dependencies:** ~50-80 MB
- **Language Resources (organized):** ~5-10 MB
- **Runtimes:** ~10-20 MB
- **wwwroot:** ~Variable
- **HostProvisioner (separate):** ~50-80 MB in separate location
- **Total (main app):** ~100-150 MB
- **Space saved:** ~30-40% by eliminating duplication

## Next Steps

1. **Review this analysis** with the development team
2. **Make decisions** on the questions above
3. **Create reorganization script** based on chosen structure (Option 1, 2, or 3)
4. **Test in staging** environment before production deployment
5. **Update deployment documentation** and scripts
6. **Implement gradual rollout** with rollback plan

## References

- Deployment script: `Scripts\ncdeploy.ps1`
- Rollback script: `Scripts\ncrollback.ps1`
- Current deployment: `D:\PROJECTS\NOOR CANVAS\TEMP\NOOR-CANVAS`
- Production target: `D:\Websites\NOOR-CANVAS`

---

## Appendix: Complete File Listing

### Root Level Files (67 DLLs)
- AngleSharp.dll
- appsettings.Development.json
- appsettings.json
- appsettings.Production.json
- Azure.AI.OpenAI.dll
- Azure.Core.dll
- Azure.Identity.dll
- HtmlAgilityPack.dll
- Humanizer.dll
- Microsoft.AspNetCore.Http.Connections.Client.dll
- Microsoft.AspNetCore.SignalR.Client.Core.dll
- Microsoft.AspNetCore.SignalR.Client.dll
- Microsoft.Bcl.AsyncInterfaces.dll
- Microsoft.CodeAnalysis.CSharp.dll
- Microsoft.CodeAnalysis.CSharp.Workspaces.dll
- Microsoft.CodeAnalysis.dll
- Microsoft.CodeAnalysis.Workspaces.dll
- Microsoft.Data.SqlClient.dll
- Microsoft.EntityFrameworkCore.Abstractions.dll
- Microsoft.EntityFrameworkCore.Design.dll
- Microsoft.EntityFrameworkCore.dll
- Microsoft.EntityFrameworkCore.InMemory.dll
- Microsoft.EntityFrameworkCore.Relational.dll
- Microsoft.EntityFrameworkCore.SqlServer.dll
- Microsoft.Extensions.DependencyModel.dll
- Microsoft.Identity.Client.dll
- Microsoft.Identity.Client.Extensions.Msal.dll
- Microsoft.IdentityModel.Abstractions.dll
- Microsoft.IdentityModel.JsonWebTokens.dll
- Microsoft.IdentityModel.Logging.dll
- Microsoft.IdentityModel.Protocols.dll
- Microsoft.IdentityModel.Protocols.OpenIdConnect.dll
- Microsoft.IdentityModel.Tokens.dll
- Microsoft.SqlServer.Server.dll
- Microsoft.Win32.SystemEvents.dll
- Mono.TextTemplating.dll
- NoorCanvas.deps.json
- NoorCanvas.dll
- NoorCanvas.exe
- NoorCanvas.pdb
- NoorCanvas.runtimeconfig.json
- NoorCanvas.staticwebassets.endpoints.json
- OpenAI.dll
- Serilog.AspNetCore.dll
- Serilog.dll
- Serilog.Extensions.Hosting.dll
- Serilog.Extensions.Logging.dll
- Serilog.Formatting.Compact.dll
- Serilog.Settings.Configuration.dll
- Serilog.Sinks.Console.dll
- Serilog.Sinks.Debug.dll
- Serilog.Sinks.File.dll
- System.ClientModel.dll
- System.CodeDom.dll
- System.Composition.AttributedModel.dll
- System.Composition.Convention.dll
- System.Composition.Hosting.dll
- System.Composition.Runtime.dll
- System.Composition.TypedParts.dll
- System.Configuration.ConfigurationManager.dll
- System.Drawing.Common.dll
- System.IdentityModel.Tokens.Jwt.dll
- System.Memory.Data.dll
- System.Runtime.Caching.dll
- System.Security.Cryptography.ProtectedData.dll
- System.Security.Permissions.dll
- System.Windows.Extensions.dll
- web.config
- web.Debug.config
- web.Release.config

### Directories
- cs/ (4 resource DLLs)
- de/ (4 resource DLLs)
- es/ (4 resource DLLs)
- fr/ (4 resource DLLs)
- it/ (4 resource DLLs)
- ja/ (4 resource DLLs)
- ko/ (4 resource DLLs)
- pl/ (4 resource DLLs)
- pt-BR/ (4 resource DLLs)
- ru/ (4 resource DLLs)
- tr/ (4 resource DLLs)
- zh-Hans/ (4 resource DLLs)
- zh-Hant/ (4 resource DLLs)
- runtimes/ (platform-specific binaries for multiple platforms)
- wwwroot/ (web static content - properly organized)
- logs/ (application logs - properly organized)
- **HostProvisioner/** ⚠️ **77 duplicate files**

### HostProvisioner Duplication Details
The HostProvisioner folder contains nearly identical copies of most root-level files, including:
- All the same DLL dependencies
- Language resource folders (cs/, de/, es/, etc.)
- runtimes/ folder
- Configuration files
- **NoorCanvas.dll and NoorCanvas.exe** (shouldn't be in a separate tool's deployment)
- Plus its own HostProvisioner.dll, HostProvisioner.exe, etc.

This represents approximately **100% duplication** of dependencies, nearly **doubling** the deployment footprint unnecessarily.
