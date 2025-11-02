# CDN-Related Keys - Quick Reference

**Purpose**: Index of all plan keys related to the Resources CDN architecture for serving media (images, audio, video) in NOOR CANVAS and KSESSIONS.

**Last Updated**: 2025-10-26

---

## 🔑 Primary Keys

### `ksessions-cdn`
**Status**: ✅ COMPLETE  
**Location**: `.github/key-data-streams/ksessions-cdn/`  
**Purpose**: Core CDN infrastructure setup - IIS static site, Cloudflare tunnel, CORS configuration

**What It Does**:
- Created IIS static site "KashkoleResources" (port 80, hostname `resources.kashkole.com`)
- Configured `web.config` with CORS headers and 1-year caching
- Set up Cloudflare tunnel for production access
- Created management scripts (`START/STOP/STATUS-CLOUDFLARED-TUNNEL`)

**Key Deliverables**:
- ✅ Production CDN URL: `https://resources.kashkole.com`
- ✅ IIS site serving `D:\Websites\KSESSIONS\Resources`
- ✅ CORS enabled for `noorcanvas.kashkole.com`, `session.kashkole.com`
- ✅ Cloudflare tunnel configuration and management scripts

**Files Created**:
- `D:\Websites\KSESSIONS\Resources\web.config`
- `D:\PROJECTS\__CLOUDFLARE\START-CLOUDFLARED-TUNNEL.bat`
- `D:\PROJECTS\__CLOUDFLARE\STOP-CLOUDFLARED-TUNNEL.ps1`
- `D:\PROJECTS\__CLOUDFLARE\STATUS-CLOUDFLARED-TUNNEL.ps1`
- `Scripts/Resources-CDN/setup-resources-cdn.ps1`

**Plan Files**:
- `ksessions-resources-cdn.plan.md` - Complete architecture plan (v1.2, production-only quickstart)
- `work-log.md` - Implementation timeline and decisions
- `tests/test-registry.md` - Infrastructure smoke tests

---

### `transcript-img-fix`
**Status**: ✅ COMPLETE  
**Location**: `.github/key-data-streams/transcript-img-fix/`  
**Purpose**: Transform image/audio/video URLs in transcript HTML to use CDN instead of file:// or legacy paths

**What It Does**:
- Created `MediaUrlTransformService` to transform media URLs in transcript HTML
- Supports 4 URL patterns: relative, file://, KSESSIONS domain, CDN
- Integrates into `UnifiedHtmlTransformService` pipeline
- Caches transformed HTML (30-minute TTL)
- Comprehensive logging for all transformations

**Key Deliverables**:
- ✅ `IMediaUrlTransformService` interface
- ✅ `MediaUrlTransformService` implementation with URL pattern detection
- ✅ Integration into NOOR CANVAS HTML transform pipeline
- ✅ Unit tests for URL transformations
- ✅ E2E tests using real session data (SessionId=2343)

**Files Created**:
- `SPA/NoorCanvas/Services/IMediaUrlTransformService.cs`
- `SPA/NoorCanvas/Services/MediaUrlTransformService.cs`
- `Tests/Unit/MediaUrlTransformServiceTests.cs`
- `Tests/UI/verify-transcript-image-loading.spec.ts`

**Files Modified**:
- `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs` - Added media URL transform step
- `SPA/NoorCanvas/Program.cs` - Registered service in DI
- `config/sharedsettings.json` - Added Resources configuration

**Known Issue**:
- ⚠️ **Development still uses `file://` URLs instead of CDN**
- Current config: `Resources:Development:BaseUrl = "file:///D:/Websites/KSESSIONS/Resources"`
- Should use: `https://resources.kashkole.com` (with CORS for localhost)
- See: `cdn-dev-cors` key for fix

---

### `cdn-dev-cors`
**Status**: ✅ COMPLETE  
**Location**: `.github/key-data-streams/cdn-dev-cors/`  
**Purpose**: Extend CORS configuration to allow localhost (development) access to CDN

**What It Does**:
- Updated `setup-resources-cdn.ps1` with `-IncludeDevelopment` parameter
- Extended CORS origins to include `http://localhost:*`
- Enables CDN usage in development environment (no more file://)

**Key Deliverables**:
- ✅ Development CORS enabled for localhost origins
- ✅ IIS configuration script supports dev mode
- ✅ Production CORS preserved (no changes to existing origins)

**Files Modified**:
- `Scripts/Resources-CDN/setup-resources-cdn.ps1` - Added development mode flag
- `D:\Websites\KSESSIONS\Resources\web.config` - Extended CORS origins (when `-IncludeDevelopment` used)

**Usage**:
```powershell
# Enable development CORS
.\Scripts\Resources-CDN\setup-resources-cdn.ps1 -IncludeDevelopment

# Rollback to production-only CORS
.\Scripts\Resources-CDN\setup-resources-cdn.ps1
```

---

## 🔗 Related Infrastructure

### Database
**Table**: `KSESSIONS_DEV.dbo.ResourceCatalog`  
**Purpose**: Maps session-specific resources to physical files

```sql
-- Total resources: 1,184 (966 images, 218 audio)
SELECT 
    ResourceType,
    COUNT(*) as Count
FROM ResourceCatalog
GROUP BY ResourceType
-- 1 = Images (966)
-- 2 = Audio/MP3 (218)
```

**Schema**:
- `ResourceID` (int, PK) - Auto-incrementing ID
- `ID` (int) - Session ID reference
- `ResourceName` (varchar(255)) - "{sessionId}/{guid}.{ext}"
- `ResourceType` (int) - 1 = Images, 2 = Audio
- `CreatedDate` (datetime) - Timestamp

---

### Configuration Files

**`config/sharedsettings.json`**:
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources"  // ⚠️ SHOULD USE CDN
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"  // ✅ CORRECT
    }
  }
}
```

**Recommended Fix** (NOT YET IMPLEMENTED):
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "https://resources.kashkole.com",  // Use CDN in dev too
      "FallbackUrl": "file:///D:/Websites/KSESSIONS/Resources"  // Fallback only
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"
    }
  }
}
```

---

## 📊 CDN Architecture Summary

### URL Structure
```
Production:  https://resources.kashkole.com/IMAGES/{sessionId}/{guid}.jpg
Development: file:///D:/Websites/KSESSIONS/Resources/IMAGES/{sessionId}/{guid}.jpg  ⚠️ LEGACY
```

### Physical Structure
```
D:\Websites\KSESSIONS\Resources\
├── IMAGES\{sessionId}\{guid}.jpg
├── MP3\{sessionId}\{guid}.mp3
└── MEDIA\{sessionId}\{guid}.mp4
```

### Transformation Pipeline
```
1. Transcript HTML (from KSESSIONS database)
   ↓
2. HtmlParsingService.ParseHtml() - Core HTML cleanup
   ↓
3. MediaUrlTransformService.TransformMediaUrlsAsync() - URL rewriting
   ↓
4. Transformed HTML (CDN URLs for production, file:// for dev)
   ↓
5. Rendered in NOOR CANVAS
```

---

## 🧪 Testing

### Test Sessions
- **SessionId=2343** - Used for E2E image loading tests (verified to have image references)

### Test Files
- `Tests/Unit/MediaUrlTransformServiceTests.cs` - Unit tests for URL pattern detection
- `Tests/UI/verify-transcript-image-loading.spec.ts` - E2E tests for image loading
- `Tests/UI/verify-transcript-media-urls-percy.spec.ts` - Visual regression tests

### Smoke Tests
```powershell
# Test CDN accessibility (production)
curl -I https://resources.kashkole.com/IMAGES/2343/test.jpg

# Test local IIS site
curl -I http://localhost/IMAGES/2343/test.jpg

# Verify Cloudflare tunnel
.\.github\key-data-streams\ksessions-cdn\Scripts\STATUS-CLOUDFLARED-TUNNEL.ps1
```

---

## 🚨 Known Issues & TODOs

### 1. Development Still Uses `file://` URLs
**Issue**: `sharedsettings.json` has `Resources:Development:BaseUrl = "file:///..."`  
**Impact**: Development doesn't test CDN code path, inconsistent with production  
**Fix**: Update config to use `https://resources.kashkole.com` with CORS for localhost  
**Status**: CORS enabled via `cdn-dev-cors`, config update pending

### 2. MediaUrlTransformService Environment Logic
**Issue**: `BuildEnvironmentUrl()` returns `file://` in development instead of CDN  
**Impact**: Defeats purpose of CDN architecture  
**Fix**: Always prefer CDN, use `file://` as fallback only  
**Status**: Not yet implemented

**Current Code**:
```csharp
private string BuildEnvironmentUrl(string relativePath)
{
    if (_environment.IsProduction())
    {
        return $"https://resources.kashkole.com/{relativePath}";
    }
    else
    {
        return $"file:///D:/Websites/KSESSIONS/Resources/{relativePath}";  // ❌ WRONG
    }
}
```

**Recommended Fix**:
```csharp
private string BuildEnvironmentUrl(string relativePath)
{
    // Always prefer CDN (production-ready architecture)
    return $"https://resources.kashkole.com/{relativePath}";
    
    // Optional: Fallback to file:// only if CDN unreachable
    // (requires connectivity check, not currently implemented)
}
```

### 3. Cloudflared Windows Service Not Registering
**Issue**: Service install command completes but doesn't register  
**Workaround**: Manual startup via `START-CLOUDFLARED-TUNNEL.bat`  
**Drift Key**: `cloudflared-windows-service`  
**Status**: Deferred (manual startup works)

---

## 📖 Documentation

### Primary Documentation
- **`.github/instructions/CDN-Architecture.md`** - Comprehensive CDN architecture guide (THIS IS THE SOURCE OF TRUTH)
- **`Docs/CDN-DEVELOPMENT-CORS.md`** - CORS configuration guide
- **`Scripts/Resources-CDN/README.md`** - IIS configuration scripts documentation

### Key Plans
- `.github/key-data-streams/ksessions-cdn/ksessions-resources-cdn.plan.md` - CDN infrastructure plan
- `.github/key-data-streams/transcript-img-fix/transcript-image-url-fix.plan.md` - URL transformation plan
- `.github/key-data-streams/cdn-dev-cors/cdn-dev-cors-extension.plan.md` - Development CORS plan

---

## 🎯 For GitHub Copilot

**When you see `file://` URLs in the codebase:**
1. ❓ Ask: "Should this use the CDN instead?"
2. ✅ Check if CDN is accessible (`https://resources.kashkole.com`)
3. ✅ Verify CORS is configured for the origin
4. ✅ Use `MediaUrlTransformService` for transformations
5. ⚠️ Only use `file://` as explicit fallback

**Quick Verification**:
```powershell
# Is CDN accessible?
curl -I https://resources.kashkole.com/IMAGES/2343/test.jpg

# Is Cloudflare tunnel running?
.\D:\PROJECTS\__CLOUDFLARE\STATUS-CLOUDFLARED-TUNNEL.ps1

# What CORS origins are configured?
Get-Content D:\Websites\KSESSIONS\Resources\web.config | Select-String "Access-Control-Allow-Origin"
```

**Default Assumption**: CDN is available and should be used in all environments.
