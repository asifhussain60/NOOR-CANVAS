# KSESSIONS Resources CDN - Implementation Plan v1.0

**Plan Key**: `ksessions-resources-cdn`  
**Created**: 2025-10-26  
**Status**: Ready for Execution  
**Complexity**: Medium (5 phases, ~8-12 hours)

---

## Executive Summary

**Goal**: Serve `D:\Websites\KSESSIONS\Resources` (IMAGES/MEDIA/MP3) via public URL for NoorCanvas and other applications with token-based security.

**Architecture Selected**: IIS Static Site with Cloudflare subdomain
- **Dev**: Direct file system access (`file:///D:/Websites/KSESSIONS/Resources/`)
- **Prod**: IIS static site on port 9092 → `https://resources.kashkole.com` via Cloudflare tunnel

**Key Features**:
- GUID-based flat URL structure (`/images/{guid}.jpg`)
- Token-based signed URLs for security (prevent hotlinking)
- Aggressive caching (1 year) for performance
- Streaming support for MP3/MEDIA (range requests)
- CORS enabled for session.kashkole.com and localhost:8080

---

## Current State Analysis

### Resources Folder Structure
```
D:\Websites\KSESSIONS\Resources\
├── IMAGES\
│   ├── 1\        (session-based subdirectories)
│   ├── 10\
│   ├── 100\
│   └── ...
├── MEDIA\
└── MP3\
```

### Existing Infrastructure
- **NoorCanvas Dev**: Kestrel (localhost:9091), IIS (localhost:9090)
- **NoorCanvas Prod**: IIS → `noorcanvas.kashkole.com` (Cloudflare tunnel)
- **Additional Domain**: `session.kashkole.com` (Cloudflare tunnel active)
- **Database**: KSESSIONS (contains session-to-asset mappings)

### Target State
```
Development:
  file:///D:/Websites/KSESSIONS/Resources/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg

Production:
  https://resources.kashkole.com/images/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg?token=SIGNED_TOKEN
```

---

## Implementation Phases

### Phase 1: Database Schema Enhancement
**Goal**: Add asset tracking table to map GUIDs to physical files

**Tasks**:
1. Create `SessionAssets` table (if not exists):
   ```sql
   CREATE TABLE SessionAssets (
       AssetId BIGINT IDENTITY(1,1) PRIMARY KEY,
       SessionId INT NOT NULL,
       AssetGuid UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
       AssetType NVARCHAR(20) NOT NULL, -- 'image', 'audio', 'video'
       FileName NVARCHAR(255) NOT NULL,
       PhysicalPath NVARCHAR(500) NOT NULL,
       RelativePath NVARCHAR(500) NOT NULL,
       FileSize BIGINT NULL,
       MimeType NVARCHAR(100) NULL,
       CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
       CONSTRAINT UQ_AssetGuid UNIQUE (AssetGuid),
       CONSTRAINT FK_SessionAssets_Sessions FOREIGN KEY (SessionId) 
           REFERENCES CanvasSessions(Id) ON DELETE CASCADE
   );
   
   CREATE INDEX IX_SessionAssets_SessionId ON SessionAssets(SessionId);
   CREATE INDEX IX_SessionAssets_AssetType ON SessionAssets(AssetType);
   ```

2. Create stored procedure to register assets:
   ```sql
   CREATE PROCEDURE usp_RegisterSessionAsset
       @SessionId INT,
       @AssetType NVARCHAR(20),
       @FileName NVARCHAR(255),
       @PhysicalPath NVARCHAR(500)
   AS
   BEGIN
       DECLARE @AssetGuid UNIQUEIDENTIFIER = NEWID();
       DECLARE @FileSize BIGINT;
       DECLARE @MimeType NVARCHAR(100);
       
       -- Determine MIME type based on extension
       SET @MimeType = CASE 
           WHEN @FileName LIKE '%.jpg' OR @FileName LIKE '%.jpeg' THEN 'image/jpeg'
           WHEN @FileName LIKE '%.png' THEN 'image/png'
           WHEN @FileName LIKE '%.gif' THEN 'image/gif'
           WHEN @FileName LIKE '%.mp3' THEN 'audio/mpeg'
           WHEN @FileName LIKE '%.mp4' THEN 'video/mp4'
           WHEN @FileName LIKE '%.webm' THEN 'video/webm'
           ELSE 'application/octet-stream'
       END;
       
       INSERT INTO SessionAssets (SessionId, AssetGuid, AssetType, FileName, PhysicalPath, RelativePath, MimeType)
       VALUES (@SessionId, @AssetGuid, @AssetType, @FileName, @PhysicalPath, 
               CONCAT(@AssetType, 's/', @AssetGuid, RIGHT(@FileName, CHARINDEX('.', REVERSE(@FileName)))), 
               @MimeType);
       
       SELECT @AssetGuid AS AssetGuid, @MimeType AS MimeType;
   END
   ```

3. Create data migration script to populate existing assets:
   ```sql
   -- Script: Scripts/populate-session-assets.sql
   -- Scan Resources folder and register existing files
   ```

**Deliverables**:
- `Migrations/create-sessionassets-table.sql`
- `Scripts/populate-session-assets.sql`
- Database migration documented in migration README

---

### Phase 2: IIS Static Site Configuration (Production)

**Goal**: Setup dedicated IIS site for Resources folder on port 9092

**Tasks**:

1. **Create IIS Application Pool**:
   ```powershell
   New-WebAppPool -Name "KSessionsResources" -Force
   Set-ItemProperty IIS:\AppPools\KSessionsResources -Name "managedRuntimeVersion" -Value ""
   Set-ItemProperty IIS:\AppPools\KSessionsResources -Name "startMode" -Value "AlwaysRunning"
   Set-ItemProperty IIS:\AppPools\KSessionsResources -Name "processModel.idleTimeout" -Value "00:00:00"
   ```

2. **Create IIS Website**:
   ```powershell
   New-Website -Name "KSessionsResources" `
       -PhysicalPath "D:\Websites\KSESSIONS\Resources" `
       -ApplicationPool "KSessionsResources" `
       -Port 9092 `
       -Force
   ```

3. **Configure web.config** for static files:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <staticContent>
         <mimeMap fileExtension=".mp3" mimeType="audio/mpeg" />
         <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
         <mimeMap fileExtension=".webm" mimeType="video/webm" />
         <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
       </staticContent>
       
       <httpProtocol>
         <customHeaders>
           <add name="Access-Control-Allow-Origin" value="https://noorcanvas.kashkole.com,https://session.kashkole.com,http://localhost:8080" />
           <add name="Access-Control-Allow-Methods" value="GET,HEAD,OPTIONS" />
           <add name="Access-Control-Allow-Headers" value="Authorization,Content-Type" />
           <add name="Cache-Control" value="public, max-age=31536000, immutable" />
         </customHeaders>
       </httpProtocol>
       
       <!-- Enable range requests for streaming -->
       <httpCompression>
         <dynamicTypes>
           <clear />
         </dynamicTypes>
         <staticTypes>
           <clear />
         </staticTypes>
       </httpCompression>
       
       <handlers>
         <clear />
         <add name="StaticFile" path="*" verb="*" modules="StaticFileModule" resourceType="Either" requireAccess="Read" />
       </handlers>
     </system.webServer>
   </configuration>
   ```

4. **Configure URL Rewrite** (for GUID-based routing):
   ```xml
   <rewrite>
     <rules>
       <!-- Rewrite /images/{guid}.jpg → /IMAGES/{sessionId}/{guid}.jpg -->
       <rule name="FlatImageToSessionPath" stopProcessing="true">
         <match url="^images/([a-f0-9\-]{36})\.(jpg|jpeg|png|gif)$" ignoreCase="true" />
         <action type="Rewrite" url="IMAGES/{R:1}.{R:2}" />
       </rule>
       
       <rule name="FlatAudioToSessionPath" stopProcessing="true">
         <match url="^audio/([a-f0-9\-]{36})\.(mp3|wav|ogg)$" ignoreCase="true" />
         <action type="Rewrite" url="MP3/{R:1}.{R:2}" />
       </rule>
       
       <rule name="FlatVideoToSessionPath" stopProcessing="true">
         <match url="^video/([a-f0-9\-]{36})\.(mp4|webm|avi)$" ignoreCase="true" />
         <action type="Rewrite" url="MEDIA/{R:1}.{R:2}" />
       </rule>
     </rules>
   </rewrite>
   ```

**Deliverables**:
- `Scripts/setup-resources-iis.ps1` (automated IIS setup script)
- `D:\Websites\KSESSIONS\Resources\web.config`
- IIS site configured and tested locally

---

### Phase 3: Cloudflare Tunnel Configuration

**Goal**: Expose resources.kashkole.com via Cloudflare tunnel

**Tasks**:

1. **Create Cloudflare DNS Record**:
   - Type: `CNAME`
   - Name: `resources`
   - Target: `{tunnel-id}.cfargotunnel.com` (use existing tunnel)
   - Proxied: Yes (orange cloud)

2. **Update Cloudflare Tunnel Config**:
   ```yaml
   tunnel: <your-tunnel-id>
   credentials-file: /path/to/credentials.json
   
   ingress:
     # Resources subdomain → IIS static site
     - hostname: resources.kashkole.com
       service: http://localhost:9092
       originRequest:
         noTLSVerify: true
     
     # NoorCanvas (existing)
     - hostname: noorcanvas.kashkole.com
       service: http://localhost:9090
       originRequest:
         noTLSVerify: true
     
     # Session site (existing)
     - hostname: session.kashkole.com
       service: http://localhost:80  # Or wherever session site is hosted
       originRequest:
         noTLSVerify: true
     
     # Catch-all
     - service: http_status:404
   ```

3. **Restart Cloudflare Tunnel**:
   ```powershell
   Restart-Service cloudflared  # Or restart the tunnel service
   ```

4. **Validate DNS propagation**:
   ```powershell
   nslookup resources.kashkole.com
   Test-NetConnection resources.kashkole.com -Port 443
   ```

**Deliverables**:
- Updated Cloudflare tunnel configuration
- DNS record created
- Production URL accessible: `https://resources.kashkole.com`

---

### Phase 4: Token-Based Security Implementation

**Goal**: Implement signed URL generation to prevent hotlinking and control access

**Tasks**:

1. **Create ResourceTokenService** (NoorCanvas backend):
   ```csharp
   // Services/ResourceTokenService.cs
   public interface IResourceTokenService
   {
       string GenerateSignedUrl(Guid assetGuid, string assetType, int expiryMinutes = 60);
       bool ValidateToken(string token, Guid assetGuid);
   }
   
   public class ResourceTokenService : IResourceTokenService
   {
       private readonly IConfiguration _configuration;
       private readonly string _secretKey;
       
       public ResourceTokenService(IConfiguration configuration)
       {
           _configuration = configuration;
           _secretKey = _configuration["Resources:SigningKey"] ?? GenerateDefaultKey();
       }
       
       public string GenerateSignedUrl(Guid assetGuid, string assetType, int expiryMinutes = 60)
       {
           var baseUrl = _configuration["Resources:BaseUrl"] ?? "https://resources.kashkole.com";
           var expiry = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes).ToUnixTimeSeconds();
           
           // Create signature: HMAC-SHA256(assetGuid + expiry + secretKey)
           var payload = $"{assetGuid}|{expiry}";
           var signature = ComputeHmacSha256(payload, _secretKey);
           
           // Determine file extension based on asset type
           var extension = assetType.ToLower() switch
           {
               "image" => ".jpg",  // Default, can be overridden
               "audio" => ".mp3",
               "video" => ".mp4",
               _ => ""
           };
           
           var resourceType = assetType.ToLower() + "s";
           return $"{baseUrl}/{resourceType}/{assetGuid}{extension}?token={signature}&exp={expiry}";
       }
       
       public bool ValidateToken(string token, Guid assetGuid)
       {
           // Parse token and expiry from query string
           // Recompute signature and compare
           // Check expiry
           return true; // Implement validation logic
       }
       
       private string ComputeHmacSha256(string data, string key)
       {
           using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(key));
           var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
           return Convert.ToBase64String(hash).Replace("+", "-").Replace("/", "_").TrimEnd('=');
       }
       
       private string GenerateDefaultKey()
       {
           // Generate a random key if none configured (development only)
           return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
       }
   }
   ```

2. **Add IIS URL Rewrite Module** for token validation:
   ```xml
   <!-- Option 1: Use IIS URL Rewrite to validate tokens (requires custom module) -->
   <!-- Option 2: Use reverse proxy to ASP.NET Core middleware for validation -->
   <!-- Option 3: Accept tokens at application level (recommended) -->
   ```

3. **Configure appsettings.json**:
   ```json
   {
     "Resources": {
       "BaseUrl": "https://resources.kashkole.com",
       "SigningKey": "YOUR_SECRET_KEY_HERE_GENERATE_RANDOM_256BIT",
       "TokenExpiryMinutes": 60,
       "EnableSigning": true
     }
   }
   ```

4. **Update NoorCanvas components** to use signed URLs:
   ```csharp
   // Example usage in Blazor component
   @inject IResourceTokenService ResourceTokenService
   
   private string GetAssetUrl(Guid assetGuid, string assetType)
   {
       return ResourceTokenService.GenerateSignedUrl(assetGuid, assetType, expiryMinutes: 120);
   }
   ```

**Deliverables**:
- `Services/ResourceTokenService.cs`
- `appsettings.json` with Resources section
- Token validation middleware (if using ASP.NET Core validation)

---

### Phase 5: Configuration and Integration

**Goal**: Update NoorCanvas and other apps to consume resources via new URLs

**Tasks**:

1. **Update sharedsettings.json**:
   ```json
   {
     "Resources": {
       "Development": {
         "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources",
         "EnableSigning": false,
         "AllowDirectAccess": true
       },
       "Production": {
         "BaseUrl": "https://resources.kashkole.com",
         "EnableSigning": true,
         "AllowDirectAccess": false,
         "SigningKey": "PRODUCTION_SECRET_KEY"
       }
     }
   }
   ```

2. **Create ResourceUrlBuilder** helper service:
   ```csharp
   public interface IResourceUrlBuilder
   {
       string BuildImageUrl(Guid assetGuid, string fileName = null);
       string BuildAudioUrl(Guid assetGuid, string fileName = null);
       string BuildVideoUrl(Guid assetGuid, string fileName = null);
   }
   
   public class ResourceUrlBuilder : IResourceUrlBuilder
   {
       private readonly IConfiguration _configuration;
       private readonly IResourceTokenService _tokenService;
       private readonly IWebHostEnvironment _environment;
       
       public ResourceUrlBuilder(
           IConfiguration configuration,
           IResourceTokenService tokenService,
           IWebHostEnvironment environment)
       {
           _configuration = configuration;
           _tokenService = tokenService;
           _environment = environment;
       }
       
       public string BuildImageUrl(Guid assetGuid, string fileName = null)
       {
           var baseUrl = GetBaseUrl();
           var extension = fileName != null ? Path.GetExtension(fileName) : ".jpg";
           
           if (_environment.IsDevelopment())
           {
               // Direct file system access
               return $"{baseUrl}/IMAGES/{assetGuid}{extension}";
           }
           else
           {
               // Production: Signed URL
               return _tokenService.GenerateSignedUrl(assetGuid, "image");
           }
       }
       
       public string BuildAudioUrl(Guid assetGuid, string fileName = null)
       {
           var baseUrl = GetBaseUrl();
           var extension = fileName != null ? Path.GetExtension(fileName) : ".mp3";
           
           if (_environment.IsDevelopment())
           {
               return $"{baseUrl}/MP3/{assetGuid}{extension}";
           }
           else
           {
               return _tokenService.GenerateSignedUrl(assetGuid, "audio");
           }
       }
       
       public string BuildVideoUrl(Guid assetGuid, string fileName = null)
       {
           var baseUrl = GetBaseUrl();
           var extension = fileName != null ? Path.GetExtension(fileName) : ".mp4";
           
           if (_environment.IsDevelopment())
           {
               return $"{baseUrl}/MEDIA/{assetGuid}{extension}";
           }
           else
           {
               return _tokenService.GenerateSignedUrl(assetGuid, "video");
           }
       }
       
       private string GetBaseUrl()
       {
           var section = _environment.IsDevelopment() ? "Development" : "Production";
           return _configuration[$"Resources:{section}:BaseUrl"];
       }
   }
   ```

3. **Register services in Program.cs**:
   ```csharp
   // Add Resource services
   builder.Services.AddScoped<IResourceTokenService, ResourceTokenService>();
   builder.Services.AddScoped<IResourceUrlBuilder, ResourceUrlBuilder>();
   ```

4. **Update existing components** that reference Resources:
   - Search for hardcoded paths to `D:\Websites\KSESSIONS\Resources`
   - Replace with `IResourceUrlBuilder` service calls

**Deliverables**:
- `Services/ResourceUrlBuilder.cs`
- Updated `sharedsettings.json`
- Updated components using new URL builder

---

### Phase 6: Deployment and Testing

**Goal**: Deploy to production and validate all functionality

**Tasks**:

1. **Development Testing**:
   ```bash
   # Test file system access
   - Open browser to: file:///D:/Websites/KSESSIONS/Resources/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg
   - Verify image loads
   - Test MP3/MEDIA files
   ```

2. **Local IIS Testing**:
   ```powershell
   # Start local resources site
   Start-Website -Name "KSessionsResources"
   
   # Test URLs
   Invoke-WebRequest http://localhost:9092/IMAGES/1/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg
   Invoke-WebRequest http://localhost:9092/images/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg  # Flat URL
   ```

3. **Production Deployment**:
   ```powershell
   # Update ncdeploy.ps1 to include Resources site setup
   .\ncdeploy.ps1
   
   # Manually configure Cloudflare tunnel (one-time)
   # Add resources.kashkole.com ingress rule
   ```

4. **Production Smoke Tests**:
   ```bash
   # Test public URL (with token)
   curl -I https://resources.kashkole.com/images/dd004eb0-fd39-4207-b1da-32b3e3c48269.jpg?token=VALID_TOKEN
   
   # Verify CORS headers
   curl -H "Origin: https://session.kashkole.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://resources.kashkole.com/images/test.jpg
   
   # Test streaming (range requests)
   curl -H "Range: bytes=0-1024" \
        https://resources.kashkole.com/audio/test.mp3?token=VALID_TOKEN
   ```

5. **Integration Tests**:
   - Create Playwright test: `Tests/UI/resources-cdn-access.spec.ts`
   - Validate image loading in NoorCanvas
   - Validate audio playback
   - Validate CORS from session.kashkole.com

**Deliverables**:
- Updated `ncdeploy.ps1` with Resources site deployment
- `Tests/UI/resources-cdn-access.spec.ts`
- Production smoke test checklist
- Deployment documentation update

---

## Configuration Files

### appsettings.json (NoorCanvas)
```json
{
  "Resources": {
    "BaseUrl": "https://resources.kashkole.com",
    "SigningKey": "REPLACE_WITH_PRODUCTION_SECRET",
    "TokenExpiryMinutes": 60,
    "EnableSigning": true,
    "AllowedOrigins": [
      "https://noorcanvas.kashkole.com",
      "https://session.kashkole.com",
      "http://localhost:8080"
    ]
  }
}
```

### appsettings.local.json (Development)
```json
{
  "Resources": {
    "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources",
    "EnableSigning": false,
    "AllowDirectAccess": true
  }
}
```

### web.config (IIS Resources Site)
See Phase 2, Task 3 for full configuration.

### Cloudflare Tunnel Config
See Phase 3, Task 2 for full ingress rules.

---

## Testing Strategy

### Test Registry Structure
```
Tests/
├── UI/
│   ├── resources-cdn-access.spec.ts
│   ├── resources-cors-validation.spec.ts
│   └── resources-streaming.spec.ts
├── Integration/
│   ├── ResourceTokenServiceTests.cs
│   ├── ResourceUrlBuilderTests.cs
│   └── AssetGuidMappingTests.cs
└── Smoke/
    └── production-resources-smoke-test.ps1
```

### Test Scenarios

#### Test 1: Basic Resource Access
```typescript
// Tests/UI/resources-cdn-access.spec.ts
test('should load image from resources CDN', async ({ page }) => {
  await page.goto('https://noorcanvas.kashkole.com/host/TESTTOKEN');
  
  const imageUrl = await page.evaluate(() => {
    const img = document.querySelector('img[data-resource-type="session-asset"]');
    return img?.src;
  });
  
  expect(imageUrl).toContain('resources.kashkole.com');
  
  // Verify image actually loads
  const response = await page.request.get(imageUrl);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image');
});
```

#### Test 2: CORS Validation
```typescript
// Tests/UI/resources-cors-validation.spec.ts
test('should allow CORS from session.kashkole.com', async ({ request }) => {
  const response = await request.fetch('https://resources.kashkole.com/images/test.jpg', {
    headers: {
      'Origin': 'https://session.kashkole.com',
      'Access-Control-Request-Method': 'GET'
    },
    method: 'OPTIONS'
  });
  
  expect(response.headers()['access-control-allow-origin']).toBeTruthy();
});
```

#### Test 3: Token Validation
```csharp
// Tests/Integration/ResourceTokenServiceTests.cs
[Fact]
public void GenerateSignedUrl_ShouldCreateValidToken()
{
    var service = new ResourceTokenService(_configuration);
    var assetGuid = Guid.NewGuid();
    
    var url = service.GenerateSignedUrl(assetGuid, "image", expiryMinutes: 60);
    
    Assert.Contains("resources.kashkole.com", url);
    Assert.Contains("token=", url);
    Assert.Contains("exp=", url);
    
    // Extract token and validate
    var token = ExtractTokenFromUrl(url);
    Assert.True(service.ValidateToken(token, assetGuid));
}

[Fact]
public void ValidateToken_ShouldRejectExpiredTokens()
{
    var service = new ResourceTokenService(_configuration);
    var assetGuid = Guid.NewGuid();
    
    var url = service.GenerateSignedUrl(assetGuid, "image", expiryMinutes: -1); // Expired
    var token = ExtractTokenFromUrl(url);
    
    Assert.False(service.ValidateToken(token, assetGuid));
}
```

#### Test 4: Streaming Support
```powershell
# Tests/Smoke/production-resources-smoke-test.ps1

# Test range request for MP3 streaming
$headers = @{
    "Range" = "bytes=0-1024"
    "Authorization" = "Bearer VALID_TOKEN"
}

$response = Invoke-WebRequest `
    -Uri "https://resources.kashkole.com/audio/test-audio.mp3" `
    -Headers $headers `
    -Method GET

if ($response.StatusCode -eq 206) {
    Write-Host "✅ Partial content (range request) supported"
} else {
    Write-Error "❌ Range requests not working"
}

# Verify Content-Range header
if ($response.Headers['Content-Range']) {
    Write-Host "✅ Content-Range header present: $($response.Headers['Content-Range'])"
}
```

---

## Deployment Scripts

### Scripts/setup-resources-iis.ps1
```powershell
<#
.SYNOPSIS
    Setup IIS static site for KSESSIONS Resources
    
.DESCRIPTION
    Creates IIS application pool and website for serving Resources folder
    Configures CORS, caching, and streaming support
    
.PARAMETER Port
    Port number for the resources site (default: 9092)
    
.PARAMETER RemoveExisting
    Remove existing site and app pool before creating new one
    
.EXAMPLE
    .\setup-resources-iis.ps1 -Port 9092
    .\setup-resources-iis.ps1 -RemoveExisting
#>

param(
    [int]$Port = 9092,
    [switch]$RemoveExisting
)

$ErrorActionPreference = "Stop"

$appPoolName = "KSessionsResources"
$siteName = "KSessionsResources"
$physicalPath = "D:\Websites\KSESSIONS\Resources"

Write-Host "=== KSESSIONS Resources IIS Setup ===" -ForegroundColor Cyan

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction Stop

# Remove existing if requested
if ($RemoveExisting) {
    Write-Host "Removing existing site and app pool..." -ForegroundColor Yellow
    
    if (Test-Path "IIS:\Sites\$siteName") {
        Remove-Website -Name $siteName
        Write-Host "✅ Removed existing website" -ForegroundColor Green
    }
    
    if (Test-Path "IIS:\AppPools\$appPoolName") {
        Remove-WebAppPool -Name $appPoolName
        Write-Host "✅ Removed existing app pool" -ForegroundColor Green
    }
}

# Create Application Pool
Write-Host "`nCreating application pool: $appPoolName" -ForegroundColor Cyan

New-WebAppPool -Name $appPoolName -Force | Out-Null
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "processModel.idleTimeout" -Value ([TimeSpan]::Zero)

Write-Host "✅ Application pool created" -ForegroundColor Green

# Create Website
Write-Host "`nCreating website: $siteName" -ForegroundColor Cyan

New-Website -Name $siteName `
    -PhysicalPath $physicalPath `
    -ApplicationPool $appPoolName `
    -Port $Port `
    -Force | Out-Null

Write-Host "✅ Website created on port $Port" -ForegroundColor Green

# Create web.config
$webConfigPath = Join-Path $physicalPath "web.config"
$webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".mp3" mimeType="audio/mpeg" />
      <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
      <mimeMap fileExtension=".webm" mimeType="video/webm" />
      <mimeMap fileExtension=".wav" mimeType="audio/wav" />
      <mimeMap fileExtension=".ogg" mimeType="audio/ogg" />
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
    
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="https://noorcanvas.kashkole.com,https://session.kashkole.com,http://localhost:8080,https://localhost:9091" />
        <add name="Access-Control-Allow-Methods" value="GET,HEAD,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Authorization,Content-Type,Range" />
        <add name="Cache-Control" value="public, max-age=31536000, immutable" />
        <add name="Accept-Ranges" value="bytes" />
      </customHeaders>
    </httpProtocol>
    
    <httpCompression>
      <dynamicTypes>
        <clear />
      </dynamicTypes>
      <staticTypes>
        <clear />
      </staticTypes>
    </httpCompression>
    
    <handlers>
      <clear />
      <add name="StaticFile" path="*" verb="*" modules="StaticFileModule" resourceType="Either" requireAccess="Read" />
    </handlers>
    
    <rewrite>
      <rules>
        <!-- Flat URL routing: /images/{guid}.ext → /IMAGES/{sessionId}/{guid}.ext -->
        <!-- Note: Requires lookup in SessionAssets table or file system search -->
        <rule name="FlatImageToPhysical" stopProcessing="true">
          <match url="^images/([a-f0-9\-]{36})\.(jpg|jpeg|png|gif)$" ignoreCase="true" />
          <action type="Rewrite" url="IMAGES/lookup/{R:1}.{R:2}" />
        </rule>
        
        <rule name="FlatAudioToPhysical" stopProcessing="true">
          <match url="^audio/([a-f0-9\-]{36})\.(mp3|wav|ogg)$" ignoreCase="true" />
          <action type="Rewrite" url="MP3/lookup/{R:1}.{R:2}" />
        </rule>
        
        <rule name="FlatVideoToPhysical" stopProcessing="true">
          <match url="^video/([a-f0-9\-]{36})\.(mp4|webm|avi)$" ignoreCase="true" />
          <action type="Rewrite" url="MEDIA/lookup/{R:1}.{R:2}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@

Set-Content -Path $webConfigPath -Value $webConfigContent -Force
Write-Host "✅ web.config created" -ForegroundColor Green

# Start website
Start-Website -Name $siteName
Write-Host "`n✅ Website started successfully" -ForegroundColor Green

# Test URL
Write-Host "`n=== Testing ===" -ForegroundColor Cyan
Write-Host "Local URL: http://localhost:$Port" -ForegroundColor White

try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Website is responding (Status: $($testResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Warning "⚠️  Website test failed: $($_.Exception.Message)"
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Cloudflare tunnel for resources.kashkole.com" -ForegroundColor White
Write-Host "2. Test: http://localhost:$Port/IMAGES/1/test.jpg" -ForegroundColor White
Write-Host "3. Deploy to production with ncdeploy.ps1" -ForegroundColor White
```

---

## Rollback Plan

If issues occur in production:

1. **Disable Cloudflare tunnel ingress** for resources.kashkole.com
2. **Stop IIS site**: `Stop-Website -Name "KSessionsResources"`
3. **Revert NoorCanvas components** to use old resource paths (if any)
4. **Roll back database changes**: Drop SessionAssets table if causing issues

**Quick Rollback Command**:
```powershell
Stop-Website -Name "KSessionsResources"
# Update Cloudflare tunnel config to remove resources.kashkole.com
# Restart tunnel
```

---

## Success Criteria

- [ ] IIS Resources site accessible at `http://localhost:9092`
- [ ] Production URL `https://resources.kashkole.com` resolves via Cloudflare
- [ ] CORS headers present for session.kashkole.com and localhost:8080
- [ ] Image URLs work: `/images/{guid}.jpg`
- [ ] Audio streaming works with range requests
- [ ] Token-based URLs prevent unauthorized access
- [ ] Cache headers set to 1 year (`max-age=31536000`)
- [ ] Development uses file:/// URLs without network overhead
- [ ] SessionAssets table populated with existing resources
- [ ] Integration tests pass in CI/CD pipeline

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database Schema | 2 hours | None |
| Phase 2: IIS Configuration | 2 hours | None |
| Phase 3: Cloudflare Tunnel | 1 hour | Phase 2 |
| Phase 4: Token Security | 3 hours | Phase 1 |
| Phase 5: Integration | 2 hours | Phases 1-4 |
| Phase 6: Testing & Deployment | 2 hours | All phases |
| **Total** | **12 hours** | Sequential execution |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cloudflare DNS propagation delay | Medium | Low | Use Cloudflare's "orange cloud" proxy for instant routing |
| GUID lookup performance | Low | Medium | Index SessionAssets.AssetGuid, cache lookups |
| Token validation overhead | Low | Low | Use fast HMAC-SHA256, cache valid tokens |
| CORS misconfiguration | Medium | High | Thorough testing with actual origins, OPTIONS preflight |
| URL rewrite complexity | Medium | Medium | Fallback to session-based paths if GUID lookup fails |
| File system permissions | Low | High | Ensure IIS_IUSRS has Read access to Resources folder |

---

## Dependencies

- **IIS 10+** with URL Rewrite Module
- **Cloudflare account** with tunnel access
- **SQL Server** (KSESSIONS database)
- **.NET 8** (for NoorCanvas services)
- **PowerShell 7+** (for deployment scripts)

---

## Post-Implementation

### Monitoring
- Track 404 errors for missing resources
- Monitor Cloudflare analytics for bandwidth usage
- Alert on high token validation failures (possible attack)

### Optimization
- Consider CDN caching layer (Cloudflare's edge caching)
- Implement lazy loading for images in NoorCanvas
- Compress images on upload (reduce file sizes)

### Documentation
- Update NoorCanvas developer guide with resource URL patterns
- Document token generation for third-party integrations
- Create quickref for common resource operations

---

## Handoff Commands

After plan approval, execute tasks via:

```bash
# Task agent for implementation
@task key:ksessions-resources-cdn work="Implement Phase 1: Database schema for SessionAssets"

# Test generation
@test key:ksessions-resources-cdn generate-tests
```

**Plan Version**: 1.0  
**Last Updated**: 2025-10-26  
**Status**: Ready for execution (awaiting user approval)
