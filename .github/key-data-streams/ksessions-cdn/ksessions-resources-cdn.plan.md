# KSESSIONS Resources CDN - Production Quickstart Plan v1.2

**Plan Key**: `ksessions-resources-cdn`  
**Created**: 2025-10-26  
**Updated**: 2025-10-26 (v1.2 - Production-only quickstart, IIS site already exists)  
**Status**: Ready for Execution  
**Complexity**: Low (3 phases, ~2-3 hours)

---

## Executive Summary

**Goal**: Serve `D:\Websites\KSESSIONS\Resources` via `https://resources.kashkole.com` for KSESSIONS and NoorCanvas production apps.

**Architecture**: Existing IIS Static Site + Cloudflare tunnel
- **Prod**: IIS site "KashkoleResources" (port 80) → `https://resources.kashkole.com` via Cloudflare tunnel
- **Dev**: Not in scope (production-only setup)

**Quickest Path Features**:
- ✅ Use existing IIS site (already created by user)
- ✅ Leverage existing ResourceCatalog table (1,184 resources)
- ✅ Simple static file serving (no token-based security initially)
- ✅ Basic CORS for session.kashkole.com
- ✅ Aggressive caching (1 year)
- ⏳ Token security deferred (Phase 4 - optional enhancement)

**Time Savings**: Reduced from 8-10 hours → **2-3 hours**

---

## Version History

- **v1.0** (2025-10-26): Initial plan with SessionAssets table
- **v1.1** (2025-10-26): Revised to use existing ResourceCatalog table
- **v1.2** (2025-10-26): Production-only quickstart (IIS site already exists)

---

## Current State Analysis

### Existing IIS Site (User Already Created)
- **Site Name**: KashkoleResources
- **Physical Path**: `D:\Websites\KSESSIONS\Resources`
- **Binding**: HTTP on port 80, hostname `resources.kashkole.com`
- **Status**: Running
- **Missing**: web.config, URL rewrites, CORS configuration

### Existing Database: ResourceCatalog Table
```sql
-- KSESSIONS.dbo.ResourceCatalog (production database)
ResourceID INT IDENTITY(1,1) PRIMARY KEY
ID INT NOT NULL                    -- Session ID
ResourceName VARCHAR(255) NOT NULL -- "{sessionId}/{guid}.{ext}" or "{guid}.{ext}"
ResourceType INT NOT NULL          -- 1 = Image, 2 = Audio
CreatedDate DATETIME NOT NULL
```

**Production Data**:
- **Total Resources**: 1,184 (966 images, 218 audio)
- **Physical Paths**: 
  - Images: `D:\Websites\KSESSIONS\Resources\IMAGES\{sessionId}\{guid}.jpg`
  - Audio: `D:\Websites\KSESSIONS\Resources\MP3\{guid}.mp3`

### Target State (Production Only)
```
https://resources.kashkole.com/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg
https://resources.kashkole.com/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3
```

**Simple, direct static file access** - No URL rewrites initially (keep paths as-is)

---

## Implementation Phases (Production-Only Quickstart)

### Phase 0: Validate Existing IIS Site
**Goal**: Confirm IIS site configuration and test basic static file serving
**Time**: 15 minutes

**Tasks**:

1. **Verify site status**:
   ```powershell
   Get-Website -Name "KashkoleResources"
   Get-WebBinding -Name "KashkoleResources"
   ```

2. **Test local static file access**:
   ```powershell
   # Test image
   Invoke-WebRequest "http://localhost/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg" -UseBasicParsing
   
   # Test audio
   Invoke-WebRequest "http://localhost/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3" -UseBasicParsing
   ```

3. **Verify application pool settings**:
   ```powershell
   $pool = Get-Item "IIS:\AppPools\KashkoleResources" -ErrorAction SilentlyContinue
   if ($null -eq $pool) {
       Write-Host "⚠️  Application pool not found - creating..."
       # Create if missing (covered in Phase 1)
   }
   ```

**Deliverables**:
- Confirmation that IIS site serves files locally
- Baseline performance test results

**Estimated Time**: 15 minutes

---

### Phase 1: Configure web.config for Production
**Goal**: Add CORS, caching, and MIME types to existing IIS site
**Time**: 30 minutes

**Tasks**:

1. **Create web.config** in `D:\Websites\KSESSIONS\Resources\`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <!-- Static content configuration -->
       <staticContent>
         <mimeMap fileExtension=".mp3" mimeType="audio/mpeg" />
         <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
         <mimeMap fileExtension=".webm" mimeType="video/webm" />
         <mimeMap fileExtension=".wav" mimeType="audio/wav" />
         <mimeMap fileExtension=".jpg" mimeType="image/jpeg" />
         <mimeMap fileExtension=".jpeg" mimeType="image/jpeg" />
         <mimeMap fileExtension=".png" mimeType="image/png" />
         <mimeMap fileExtension=".gif" mimeType="image/gif" />
         <!-- 1 year caching -->
         <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
       </staticContent>
       
       <!-- CORS headers for session.kashkole.com and noorcanvas.kashkole.com -->
       <httpProtocol>
         <customHeaders>
           <add name="Access-Control-Allow-Origin" value="https://noorcanvas.kashkole.com,https://session.kashkole.com" />
           <add name="Access-Control-Allow-Methods" value="GET,HEAD,OPTIONS" />
           <add name="Access-Control-Allow-Headers" value="Content-Type,Range" />
           <add name="Cache-Control" value="public, max-age=31536000, immutable" />
           <add name="Accept-Ranges" value="bytes" />
         </customHeaders>
       </httpProtocol>
       
       <!-- Disable compression to support range requests (streaming) -->
       <httpCompression>
         <dynamicTypes>
           <clear />
         </dynamicTypes>
         <staticTypes>
           <clear />
         </staticTypes>
       </httpCompression>
       
       <!-- Default handler for static files -->
       <handlers>
         <clear />
         <add name="StaticFile" path="*" verb="*" modules="StaticFileModule" 
              resourceType="Either" requireAccess="Read" />
       </handlers>
     </system.webServer>
   </configuration>
   ```

2. **Apply web.config to IIS site**:
   ```powershell
   # Copy web.config to Resources folder
   $webConfigPath = "D:\Websites\KSESSIONS\Resources\web.config"
   # (File created in step 1)
   
   # Restart IIS site to apply changes
   Restart-WebAppPool -Name "KashkoleResources"
   Stop-Website -Name "KashkoleResources"
   Start-Sleep -Seconds 2
   Start-Website -Name "KashkoleResources"
   ```

3. **Test configuration**:
   ```powershell
   # Test CORS headers
   $response = Invoke-WebRequest "http://localhost/IMAGES/117/test.jpg" `
       -Headers @{"Origin"="https://session.kashkole.com"} `
       -Method OPTIONS `
       -UseBasicParsing
   
   # Verify Access-Control-Allow-Origin header
   $response.Headers["Access-Control-Allow-Origin"]
   
   # Test caching headers
   $response = Invoke-WebRequest "http://localhost/MP3/test.mp3" -UseBasicParsing
   $response.Headers["Cache-Control"]  # Should be "public, max-age=31536000, immutable"
   ```

**Deliverables**:
- `D:\Websites\KSESSIONS\Resources\web.config`
- CORS headers validated
- Caching headers configured

**Estimated Time**: 30 minutes

---

### Phase 2: Cloudflare Tunnel Configuration
**Goal**: Expose `resources.kashkole.com` via Cloudflare tunnel pointing to existing IIS site
**Time**: 1-1.5 hours

**Tasks**:

1. **Create Cloudflare DNS Record** (if not exists):
   - Type: `CNAME`
   - Name: `resources`
   - Target: Your existing Cloudflare tunnel (same as noorcanvas/session)
   - Proxied: Yes (orange cloud)

2. **Update Cloudflare Tunnel Config** to add resources.kashkole.com ingress:
   ```yaml
   # Locate your existing tunnel config file
   # (Usually in C:\Program Files\cloudflared\ or similar)
   
   ingress:
     # ADD THIS - Resources subdomain → IIS static site on port 80
     - hostname: resources.kashkole.com
       service: http://localhost:80
       originRequest:
         noTLSVerify: true
     
     # Existing entries (keep these)
     - hostname: noorcanvas.kashkole.com
       service: http://localhost:9090
       originRequest:
         noTLSVerify: true
     
     - hostname: session.kashkole.com
       service: http://localhost:80  # Or wherever session site is
       originRequest:
         noTLSVerify: true
     
     # Catch-all
     - service: http_status:404
   ```

3. **Restart Cloudflare Tunnel**:
   ```powershell
   # Option 1: If running as Windows Service
   Restart-Service cloudflared
   
   # Option 2: If running via command line, restart the tunnel process
   # Stop existing process and restart
   ```

4. **Validate DNS and HTTPS access**:
   ```powershell
   # Check DNS resolution
   nslookup resources.kashkole.com
   
   # Test HTTPS access (after tunnel restart and DNS propagation)
   Invoke-WebRequest "https://resources.kashkole.com/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg" -UseBasicParsing
   
   # Test from external location (browser or curl)
   # https://resources.kashkole.com/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3
   ```

**Deliverables**:
- Cloudflare DNS record created
- Tunnel configuration updated
- Production URL accessible: `https://resources.kashkole.com`

**Estimated Time**: 1-1.5 hours (includes DNS propagation wait time)

---

### Phase 3: Production Smoke Tests and Validation
**Goal**: Verify resources are accessible from KSESSIONS and NoorCanvas production apps
**Time**: 30 minutes

**Tasks**:

1. **Test static file access**:
   ```powershell
   # Test image loading
   $imageUrl = "https://resources.kashkole.com/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg"
   $response = Invoke-WebRequest $imageUrl -UseBasicParsing
   Write-Host "Image Status: $($response.StatusCode)"
   Write-Host "Content-Type: $($response.Headers['Content-Type'])"
   Write-Host "Cache-Control: $($response.Headers['Cache-Control'])"
   
   # Test audio loading
   $audioUrl = "https://resources.kashkole.com/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3"
   $response = Invoke-WebRequest $audioUrl -UseBasicParsing
   Write-Host "Audio Status: $($response.StatusCode)"
   Write-Host "Accept-Ranges: $($response.Headers['Accept-Ranges'])"
   ```

2. **Test CORS from production applications**:
   ```javascript
   // Test from browser console on https://session.kashkole.com
   fetch('https://resources.kashkole.com/IMAGES/117/test.jpg')
     .then(response => {
       console.log('CORS Success:', response.status);
       console.log('Headers:', response.headers);
     })
     .catch(error => console.error('CORS Error:', error));
   ```

3. **Test range requests (streaming)**:
   ```powershell
   # Test partial content request for MP3 streaming
   $headers = @{
       "Range" = "bytes=0-1024"
   }
   $response = Invoke-WebRequest "https://resources.kashkole.com/MP3/test.mp3" `
       -Headers $headers `
       -UseBasicParsing
   
   if ($response.StatusCode -eq 206) {
       Write-Host "✅ Partial content (streaming) supported"
       Write-Host "Content-Range: $($response.Headers['Content-Range'])"
   }
   ```

4. **Performance baseline**:
   ```powershell
   # Measure response time for sample resources
   Measure-Command {
       Invoke-WebRequest "https://resources.kashkole.com/IMAGES/1/sample.jpg" -UseBasicParsing
   } | Select-Object TotalMilliseconds
   ```

5. **Update application references** (if needed):
   - Update KSESSIONS app to use `https://resources.kashkole.com/...`
   - Update NoorCanvas app to use `https://resources.kashkole.com/...`
   - Test image/audio loading in both applications

**Deliverables**:
- Smoke test results documented
- CORS validation confirmed
- Streaming support verified
- Applications updated and tested

**Estimated Time**: 30 minutes

**Estimated Time**: 2 hours

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
       string GenerateSignedUrl(string resourceGuid, string fileExtension = null, int expiryMinutes = 60);
       bool ValidateToken(string token, string resourceGuid, long expiry);
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
       
       public string GenerateSignedUrl(string resourceGuid, string fileExtension = null, int expiryMinutes = 60)
       {
           var baseUrl = _configuration["Resources:BaseUrl"] ?? "https://resources.kashkole.com";
           var expiry = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes).ToUnixTimeSeconds();
           
           // Create signature: HMAC-SHA256(resourceGuid + expiry + secretKey)
           var payload = $"{resourceGuid}|{expiry}";
           var signature = ComputeHmacSha256(payload, _secretKey);
           
           // Build URL with extension (if provided)
           var urlPath = string.IsNullOrEmpty(fileExtension)
               ? $"/resource/{resourceGuid}"
               : $"/resource/{resourceGuid}{fileExtension}";
           
           return $"{baseUrl}{urlPath}?token={signature}&exp={expiry}";
       }
       
       public bool ValidateToken(string token, string resourceGuid, long expiry)
       {
           try
           {
               // Check if token has expired
               var expiryTime = DateTimeOffset.FromUnixTimeSeconds(expiry);
               if (DateTimeOffset.UtcNow > expiryTime)
                   return false;
               
               // Recompute signature
               var payload = $"{resourceGuid}|{expiry}";
               var expectedSignature = ComputeHmacSha256(payload, _secretKey);
               
               // Constant-time comparison to prevent timing attacks
               return CryptographicEquals(token, expectedSignature);
           }
           catch
           {
               return false;
           }
       }
       
       private string ComputeHmacSha256(string data, string key)
       {
           using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(key));
           var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
           return Convert.ToBase64String(hash).Replace("+", "-").Replace("/", "_").TrimEnd('=');
       }
       
       private bool CryptographicEquals(string a, string b)
       {
           if (a.Length != b.Length) return false;
           var result = 0;
           for (int i = 0; i < a.Length; i++)
               result |= a[i] ^ b[i];
           return result == 0;
       }
       
       private string GenerateDefaultKey()
       {
           // Generate a random key if none configured (development only)
           return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
       }
   }
   ```

2. **Create ResourceCatalogRepository** (Data access layer):
   ```csharp
   // Data/ResourceCatalogRepository.cs
   public interface IResourceCatalogRepository
   {
       Task<ResourceCatalogEntry> GetByGuidAsync(string guid);
       Task<IEnumerable<ResourceCatalogEntry>> GetBySessionIdAsync(int sessionId);
   }
   
   public class ResourceCatalogRepository : IResourceCatalogRepository
   {
       private readonly KSessionsDbContext _context;
       
       public ResourceCatalogRepository(KSessionsDbContext context)
       {
           _context = context;
       }
       
       public async Task<ResourceCatalogEntry> GetByGuidAsync(string guid)
       {
           // Query vw_ResourceCatalogWithGuids view
           var entry = await _context.Database
               .SqlQueryRaw<ResourceCatalogEntry>(
                   @"SELECT TOP 1 * FROM vw_ResourceCatalogWithGuids 
                     WHERE ResourceGuid = @p0 
                     ORDER BY CreatedDate DESC",
                   guid)
               .FirstOrDefaultAsync();
           
           return entry;
       }
       
       public async Task<IEnumerable<ResourceCatalogEntry>> GetBySessionIdAsync(int sessionId)
       {
           return await _context.Database
               .SqlQueryRaw<ResourceCatalogEntry>(
                   @"SELECT * FROM vw_ResourceCatalogWithGuids 
                     WHERE SessionId = @p0 
                     ORDER BY CreatedDate ASC",
                   sessionId)
               .ToListAsync();
       }
   }
   
   public class ResourceCatalogEntry
   {
       public int ResourceID { get; set; }
       public int SessionId { get; set; }
       public string ResourceName { get; set; }
       public int ResourceType { get; set; }
       public DateTime CreatedDate { get; set; }
       public string ResourceGuid { get; set; }
       public string FileExtension { get; set; }
       public string PhysicalPath { get; set; }
       public string MimeType { get; set; }
   }
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
   @inject IResourceCatalogRepository ResourceCatalog
   
   private async Task<string> GetAssetUrlAsync(string resourceGuid)
   {
       // Fetch resource details from database
       var resource = await ResourceCatalog.GetByGuidAsync(resourceGuid);
       if (resource == null) return null;
       
       // Generate signed URL
       return ResourceTokenService.GenerateSignedUrl(
           resourceGuid, 
           resource.FileExtension, 
           expiryMinutes: 120
       );
   }
   ```

**Deliverables**:
- `Services/ResourceTokenService.cs`
- `Data/ResourceCatalogRepository.cs`
- `Models/ResourceCatalogEntry.cs`
- `appsettings.json` with Resources section

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
       Task<string> BuildResourceUrlAsync(string resourceGuid);
       Task<string> BuildResourceUrlByIdAsync(int resourceId);
       Task<List<string>> BuildSessionResourceUrlsAsync(int sessionId);
   }
   
   public class ResourceUrlBuilder : IResourceUrlBuilder
   {
       private readonly IConfiguration _configuration;
       private readonly IResourceTokenService _tokenService;
       private readonly IResourceCatalogRepository _catalogRepo;
       private readonly IWebHostEnvironment _environment;
       
       public ResourceUrlBuilder(
           IConfiguration configuration,
           IResourceTokenService tokenService,
           IResourceCatalogRepository catalogRepo,
           IWebHostEnvironment environment)
       {
           _configuration = configuration;
           _tokenService = tokenService;
           _catalogRepo = catalogRepo;
           _environment = environment;
       }
       
       public async Task<string> BuildResourceUrlAsync(string resourceGuid)
       {
           // Fetch resource metadata from ResourceCatalog
           var resource = await _catalogRepo.GetByGuidAsync(resourceGuid);
           if (resource == null)
               return null;
           
           var baseUrl = GetBaseUrl();
           
           if (_environment.IsDevelopment())
           {
               // Direct file system access
               return $"{baseUrl}/{GetResourceFolder(resource.ResourceType)}/{resource.ResourceName}";
           }
           else
           {
               // Production: Signed URL
               return _tokenService.GenerateSignedUrl(
                   resourceGuid, 
                   resource.FileExtension, 
                   expiryMinutes: GetTokenExpiry()
               );
           }
       }
       
       public async Task<string> BuildResourceUrlByIdAsync(int resourceId)
       {
           // Query by ResourceID (primary key)
           var resource = await _catalogRepo.GetByIdAsync(resourceId);
           if (resource == null)
               return null;
           
           return await BuildResourceUrlAsync(resource.ResourceGuid);
       }
       
       public async Task<List<string>> BuildSessionResourceUrlsAsync(int sessionId)
       {
           var resources = await _catalogRepo.GetBySessionIdAsync(sessionId);
           var urls = new List<string>();
           
           foreach (var resource in resources)
           {
               var url = await BuildResourceUrlAsync(resource.ResourceGuid);
               if (url != null)
                   urls.Add(url);
           }
           
           return urls;
       }
       
       private string GetBaseUrl()
       {
           var section = _environment.IsDevelopment() ? "Development" : "Production";
           return _configuration[$"Resources:{section}:BaseUrl"];
       }
       
       private int GetTokenExpiry()
       {
           return _configuration.GetValue<int>("Resources:TokenExpiryMinutes", 60);
       }
       
       private string GetResourceFolder(int resourceType)
       {
           return resourceType switch
           {
               1 => "IMAGES",
               2 => "MP3",
               _ => "MEDIA"
           };
       }
   }
   ```

3. **Register services in Program.cs**:
   ```csharp
   // Add Resource services
   builder.Services.AddScoped<IResourceTokenService, ResourceTokenService>();
   builder.Services.AddScoped<IResourceCatalogRepository, ResourceCatalogRepository>();
   builder.Services.AddScoped<IResourceUrlBuilder, ResourceUrlBuilder>();
   ```

4. **Update existing components** that reference Resources:
   ```csharp
   // Before (hardcoded path):
   var imagePath = $"D:\\Websites\\KSESSIONS\\Resources\\IMAGES\\{sessionId}\\{filename}";
   
   // After (using ResourceUrlBuilder):
   @inject IResourceUrlBuilder ResourceUrlBuilder
   
   var imageUrl = await ResourceUrlBuilder.BuildResourceUrlAsync(resourceGuid);
   ```

**Deliverables**:
- `Services/ResourceUrlBuilder.cs`
- Updated `sharedsettings.json`
- Updated components using new URL builder
- Service registration in `Program.cs`
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

## Success Criteria (Production Quickstart)

- [ ] IIS site "KashkoleResources" running on port 80
- [ ] web.config deployed with CORS and caching headers
- [ ] Production URL `https://resources.kashkole.com` resolves via Cloudflare
- [ ] CORS headers present for session.kashkole.com and noorcanvas.kashkole.com
- [ ] Image URLs work: `https://resources.kashkole.com/IMAGES/117/{guid}.jpg`
- [ ] Audio URLs work: `https://resources.kashkole.com/MP3/{guid}.mp3`
- [ ] Streaming works with range requests (206 Partial Content)
- [ ] Cache headers set to 1 year (`max-age=31536000, immutable`)
- [ ] KSESSIONS and NoorCanvas apps can load resources from production URL

---

## Estimated Timeline (Production Quickstart)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 0: Validate IIS Site | 15 min | None (IIS already created) |
| Phase 1: Configure web.config | 30 min | Phase 0 |
| Phase 2: Cloudflare Tunnel | 1-1.5 hours | Phase 1 |
| Phase 3: Smoke Tests | 30 min | Phase 2 |
| **Total** | **2-3 hours** | Sequential execution |

**Time Savings**: 6-7 hours compared to v1.1 (removed dev setup, database optimization, token security)

---

## Deferred Features (Optional Enhancements)

The following features from v1.1 are **deferred** for quickest production deployment:

### Not Included in Quickstart:
- ❌ Development environment setup (file:/// URLs)
- ❌ Token-based signed URLs (security enhancement)
- ❌ Database indexes and views for ResourceCatalog
- ❌ GUID-based flat URLs (using existing session-based paths)
- ❌ ResourceUrlBuilder service in NoorCanvas
- ❌ ResourceCatalogRepository for database queries

### Can Be Added Later (Phase 4+):
If needed, these enhancements can be implemented after production is live:
- Token-based security (prevent hotlinking) - 3 hours
- Database optimization for fast GUID lookups - 2 hours  
- NoorCanvas/KSESSIONS service integration - 2 hours
- URL rewrites for flat GUID structure - 1 hour

**Current Focus**: Get `https://resources.kashkole.com` serving static files ASAP
| **Total** | **12 hours** | Sequential execution |

---

## Risk Assessment (Production Quickstart)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cloudflare DNS propagation delay | Medium | Low | Use Cloudflare's "orange cloud" proxy for instant routing |
| CORS misconfiguration | Medium | High | Thorough testing with actual origins, OPTIONS preflight |
| File system permissions | Low | High | Ensure IIS_IUSRS has Read access to Resources folder |
| Missing MIME types | Low | Medium | Add explicit MIME types for .jpg, .mp3 in web.config |

---

## Dependencies (Production Quickstart)

- **IIS 10+** (already installed, site already created)
- **Cloudflare account** with tunnel access (tunnel already active)
- **PowerShell 7+** (for validation scripts)

---

## Post-Implementation

### Monitoring
- Track 404 errors for missing resources
- Monitor Cloudflare analytics for bandwidth usage
- Check IIS logs for CORS errors

### Optimization (Deferred)
- Token-based security to prevent hotlinking
- Database indexes for faster GUID lookups
- Flat URL structure (`/images/{guid}.jpg`)

### Documentation
- Update KSESSIONS/NoorCanvas to use `https://resources.kashkole.com`
- Create quickref for common resource URL patterns

---

## Handoff Commands

After plan approval, execute tasks via:

```bash
# Validate IIS site (Phase 0)
@task key:ksessions-resources-cdn work="Validate existing IIS KashkoleResources site configuration"

# Configure web.config (Phase 1)
@task key:ksessions-resources-cdn work="Deploy web.config with CORS and caching to D:\Websites\KSESSIONS\Resources"

# Cloudflare tunnel (Phase 2)
@task key:ksessions-resources-cdn work="Add resources.kashkole.com ingress rule to Cloudflare tunnel"

# Smoke tests (Phase 3)
@task key:ksessions-resources-cdn work="Run production smoke tests for resources.kashkole.com"
```

**Plan Version**: 1.2 (Production Quickstart)  
**Last Updated**: 2025-10-26  
**Status**: Ready for execution (awaiting user approval)
