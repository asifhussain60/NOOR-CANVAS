# CDN Architecture - Resources CDN Context

**Purpose**: Ensure GitHub Copilot always understands the CDN architecture for serving media resources (images, audio, video) in NOOR CANVAS and KSESSIONS applications.

**Last Updated**: 2025-10-26  
**Related Keys**: `ksessions-cdn`, `transcript-img-fix`, `cdn-dev-cors`

---

## 🎯 Critical Context

### **WHY CDN EXISTS**

The `file://` protocol was a **temporary development workaround** that has been **REPLACED** by a proper CDN architecture. 

**The CDN was created specifically to:**
1. ✅ Serve resources over HTTP/HTTPS (not file protocol)
2. ✅ Enable cross-domain access with CORS
3. ✅ Provide consistent URLs across dev and production
4. ✅ Support caching, streaming, and performance optimization
5. ✅ Allow both KSESSIONS and NOOR CANVAS to share the same media assets

**DO NOT** suggest using `file://` URLs unless there is an explicit, documented reason why the CDN cannot be used.

---

## 📐 Architecture Overview

### **Physical Resources Location**
```
D:\Websites\KSESSIONS\Resources\
├── IMAGES\
│   ├── {sessionId}\
│   │   └── {guid}.jpg
├── MP3\
│   ├── {sessionId}\
│   │   └── {guid}.mp3
└── MEDIA\
    ├── {sessionId}\
        └── {guid}.mp4
```

### **IIS Static Site Configuration**
- **Site Name**: KashkoleResources
- **Physical Path**: `D:\Websites\KSESSIONS\Resources`
- **Binding**: HTTP port 80, hostname `resources.kashkole.com`
- **Application Pool**: KashkoleResources (v4.0, Integrated)
- **CORS**: Configured via `web.config` for `noorcanvas.kashkole.com`, `session.kashkole.com`, localhost
- **Caching**: 1-year max-age (public, immutable)
- **Streaming**: Range requests enabled for MP3/MEDIA

### **Cloudflare Tunnel**
- **Tunnel Name**: noorcanvas
- **Tunnel ID**: `5474d3b4-50ea-4588-8763-5fc7da533d6c`
- **Ingress Rules**:
  - `resources.kashkole.com` → `localhost:80` (KashkoleResources IIS site)
  - `noorcanvas.kashkole.com` → `localhost:80` (NoorCanvas IIS site)
  - `session.kashkole.com` → `localhost:8080` (KSESSIONS app)
- **Management**: `D:\PROJECTS\__CLOUDFLARE\` (START/STOP/STATUS scripts)

### **URL Structure**

**Production**:
```
https://resources.kashkole.com/IMAGES/{sessionId}/{guid}.jpg
https://resources.kashkole.com/MP3/{sessionId}/{guid}.mp3
https://resources.kashkole.com/MEDIA/{sessionId}/{guid}.mp4
```

**Development** (DEPRECATED - Use CDN instead):
```
file:///D:/Websites/KSESSIONS/Resources/IMAGES/{sessionId}/{guid}.jpg
```

**⚠️ Development Should Use CDN Too**:
- Configure CORS to allow `localhost` origins (see `cdn-dev-cors` key)
- Use `https://resources.kashkole.com` URLs in development
- Fallback to `file://` ONLY if CDN is unreachable

---

## 🔧 Configuration

### **sharedsettings.json**
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources"  // DEPRECATED
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"  // CORRECT
    }
  }
}
```

**⚠️ PROBLEM WITH CURRENT CONFIG**:
- Development still uses `file://` protocol
- This defeats the purpose of the CDN
- Should be updated to use CDN in development too

**RECOMMENDED FIX**:
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "https://resources.kashkole.com",  // Use CDN in dev
      "FallbackUrl": "file:///D:/Websites/KSESSIONS/Resources"  // Fallback only
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"
    }
  }
}
```

---

## 🛠️ MediaUrlTransformService - Current Implementation

**File**: `SPA/NoorCanvas/Services/MediaUrlTransformService.cs`

**Purpose**: Transform image/audio/video URLs in transcript HTML to environment-appropriate paths.

### **Current URL Pattern Handling**

1. **Relative paths** (`/IMAGES/...`, `Resources/IMAGES/...`)
   - ✅ Transforms to CDN in production
   - ⚠️ Transforms to `file://` in development (SHOULD USE CDN)

2. **File protocol** (`file:///D:/Websites/...`)
   - ✅ Transforms to CDN in production
   - ⚠️ Kept as `file://` in development (SHOULD USE CDN)

3. **KSESSIONS domain** (`https://kashkole.com/Resources/...`)
   - ✅ Transforms to CDN (`resources.kashkole.com`)

4. **CDN URLs** (`https://resources.kashkole.com/...`)
   - ✅ Kept unchanged (already correct)

### **Problem with Current Logic**

```csharp
private string BuildEnvironmentUrl(string relativePath)
{
    if (_environment.IsProduction())
    {
        var cdnUrl = _configuration["Resources:Production:BaseUrl"] ?? "https://resources.kashkole.com";
        return $"{cdnUrl}/{relativePath}";
    }
    else
    {
        // ❌ PROBLEM: Uses file:// in development instead of CDN
        var devPath = _configuration["Resources:Development:BaseUrl"] ?? "file:///D:/Websites/KSESSIONS/Resources";
        return $"{devPath}/{relativePath}";
    }
}
```

**Why This Is Wrong**:
- The CDN exists at `https://resources.kashkole.com` in ALL environments
- Development should use the CDN too (with CORS configured for localhost)
- `file://` URLs bypass CORS, caching, and streaming features
- Inconsistent behavior between dev and prod

**Recommended Fix**:
```csharp
private string BuildEnvironmentUrl(string relativePath)
{
    // Always prefer CDN (production-ready architecture)
    var cdnUrl = _configuration["Resources:Production:BaseUrl"] ?? "https://resources.kashkole.com";
    return $"{cdnUrl}/{relativePath}";
    
    // Optional: Fallback to file:// only if CDN unreachable
    // (requires connectivity check, not currently implemented)
}
```

---

## 📊 Database Schema

**Table**: `KSESSIONS_DEV.dbo.ResourceCatalog` (exists in production too)

```sql
CREATE TABLE ResourceCatalog (
    ResourceID INT IDENTITY(1,1) PRIMARY KEY,
    ID INT NOT NULL,  -- Session ID
    ResourceName VARCHAR(255) NOT NULL,  -- "{sessionId}/{guid}.{ext}"
    ResourceType INT NOT NULL,  -- 1 = Images, 2 = Audio/MP3
    CreatedDate DATETIME DEFAULT GETDATE()
)
```

**Current Data**:
- Total resources: 1,184
- Images: 966
- Audio files: 218
- Session IDs range from 1 to 2343

**Usage**:
- Maps session-specific resources to physical files
- Used for GUID → file path lookups
- Shared between KSESSIONS and NOOR CANVAS

---

## 🧪 Testing

### **Related Test Keys**
- `transcript-img-fix` - E2E tests for image URL transformations
- `ksessions-cdn` - CDN infrastructure smoke tests

### **Test Coverage**
1. **Unit Tests**: `MediaUrlTransformServiceTests.cs`
   - Pattern detection (relative, file://, KSESSIONS domain, CDN)
   - Environment-specific transformations
   - Caching behavior

2. **E2E Tests**: `verify-transcript-image-loading.spec.ts`
   - Real session data (SessionId=2343)
   - Image loading from CDN
   - CORS validation
   - Cache header verification

3. **Percy Visual Tests**: `verify-transcript-media-urls-percy.spec.ts`
   - Screenshot comparisons
   - Image rendering validation

---

## 🚨 Common Mistakes to Avoid

### ❌ **DO NOT**
1. ❌ Suggest using `file://` URLs in production
2. ❌ Add `file://` URL handling without checking CDN first
3. ❌ Modify `Resources:Production:BaseUrl` config (always `resources.kashkole.com`)
4. ❌ Create new static file serving mechanisms (use existing CDN)
5. ❌ Bypass `MediaUrlTransformService` for media URL transformations
6. ❌ Hardcode resource paths (use configuration)

### ✅ **DO**
1. ✅ Always prefer CDN URLs (`https://resources.kashkole.com`)
2. ✅ Use `MediaUrlTransformService` for all media URL transformations
3. ✅ Configure CORS if new origins need access (via `web.config`)
4. ✅ Test in production environment (CDN is production-ready)
5. ✅ Use `sharedsettings.json` for resource configuration
6. ✅ Verify Cloudflare tunnel is running for production access

---

## 🔗 Related Documentation

### **Key Data Streams**
- `.github/key-data-streams/ksessions-cdn/` - CDN infrastructure setup
- `.github/key-data-streams/transcript-img-fix/` - Media URL transformation
- `.github/key-data-streams/cdn-dev-cors/` - CORS extension for development

### **Management Scripts**
- `D:\PROJECTS\__CLOUDFLARE\START-CLOUDFLARED-TUNNEL.bat` - Start tunnel
- `D:\PROJECTS\__CLOUDFLARE\STOP-CLOUDFLARED-TUNNEL.ps1` - Stop tunnel
- `D:\PROJECTS\__CLOUDFLARE\STATUS-CLOUDFLARED-TUNNEL.ps1` - Health check
- `Scripts/Resources-CDN/setup-resources-cdn.ps1` - IIS configuration

### **Infrastructure Documentation**
- `Docs/CDN-DEVELOPMENT-CORS.md` - CORS configuration guide
- `.github/key-data-streams/ksessions-cdn/ksessions-resources-cdn.plan.md` - Complete CDN architecture plan

---

## 🎓 For GitHub Copilot Agents

When you encounter requests related to:
- **Image loading issues** → Check if using CDN URLs
- **CORS errors** → Verify `web.config` CORS headers
- **File path transformations** → Use `MediaUrlTransformService`
- **Resource URL configuration** → Check `sharedsettings.json`
- **Media serving** → Use existing CDN, don't create new endpoints

**Always ask yourself**:
1. Is the CDN being used correctly?
2. Should this use `https://resources.kashkole.com` instead of `file://`?
3. Is `MediaUrlTransformService` handling the transformation?
4. Are CORS headers configured for the origin?
5. Is the Cloudflare tunnel running?

**Quick Verification Commands**:
```powershell
# Check CDN accessibility
curl -I https://resources.kashkole.com/IMAGES/2343/test.jpg

# Check Cloudflare tunnel status
.\.github\key-data-streams\ksessions-cdn\Scripts\STATUS-CLOUDFLARED-TUNNEL.ps1

# Verify IIS site
Get-IISSite -Name "KashkoleResources"
```

---

## 📌 Summary

**The CDN (`resources.kashkole.com`) was created to REPLACE `file://` URLs.**

When you see `file://` in code:
1. ✅ Verify if CDN can be used instead
2. ✅ Check if CORS needs configuration
3. ✅ Update code to prefer CDN
4. ✅ Only use `file://` as last resort fallback

**Default assumption**: CDN is available and should be used in all environments.
