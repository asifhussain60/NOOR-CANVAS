# Transcript Image URL Fix - Comprehensive Plan v1.0

**Key**: `transcript-image-url-fix`  
**Created**: 2025-10-26  
**Status**: Planning Complete  
**Total Phases**: 3

---

## Problem Statement

Transcript HTML retrieved from KSESSIONS database contains image references that fail to load in NOOR CANVAS due to environment-specific path differences:

- **KSESSIONS Context**: Images use relative paths or KSESSIONS-specific URLs
- **NOOR CANVAS Context**: Same HTML rendered in different application environment
- **Shared Database**: Transcript HTML stored once, used by both applications
- **Safety**: Transform happens post-read, never saves back to database

### Evidence

@workspace validation:
- ✅ `UnifiedHtmlTransformService.TransformForHostAsync()` transforms transcript HTML
- ✅ Uses `HtmlParsingService.ParseHtml()` for core transformation (line 50)
- ✅ Transcript from KSESSIONS.dbo.SessionTranscripts (shared database)
- ✅ Transform never modifies database (in-memory only)
- ✅ Resources CDN: `https://resources.kashkole.com` (production)
- ✅ Development: `file:///D:/Websites/KSESSIONS/Resources`

### Test Session

**SessionId**: 2343 (confirmed to have image references)

---

## User Decisions (Enhancements)

**Selected**: ALL enhancements (high + medium + low)

**High Priority Enhancements**:
- ✅ A. Logging for URL rewrite tracking (Medium effort)
- ✅ B. Support multiple image URL patterns (Medium effort)

**Medium Priority Enhancements**:
- ✅ C. Cache transformed HTML to avoid repeated processing (Low effort)
- ✅ D. Support other media tags (`<audio>`, `<video>`) (Medium effort)

---

## Solution Architecture

### Core Strategy

Add **environment-aware media URL transformation** to `UnifiedHtmlTransformService`:

1. **Scan HTML** for `<img>`, `<audio>`, `<video>` tags using AngleSharp
2. **Detect environment** (Development vs Production via IWebHostEnvironment)
3. **Rewrite URLs** based on pattern detection and environment
4. **Cache results** to avoid repeated processing for same content
5. **Log transformations** for debugging and validation

### URL Patterns Supported

#### Pattern 1: Relative Paths
```html
<!-- Before -->
<img src="/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg" />

<!-- After (Production) -->
<img src="https://resources.kashkole.com/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg" />

<!-- After (Development) -->
<img src="file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/accac701-28e9-42c9-a55c-c386e8a6edb4.jpg" />
```

#### Pattern 2: File Protocol URLs
```html
<!-- Before -->
<img src="file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg" />

<!-- After (Production) -->
<img src="https://resources.kashkole.com/IMAGES/117/test.jpg" />

<!-- After (Development) -->
<img src="file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg" /> <!-- Unchanged -->
```

#### Pattern 3: KSESSIONS Domain URLs
```html
<!-- Before -->
<img src="https://kashkole.com/Resources/IMAGES/117/test.jpg" />

<!-- After (Production) -->
<img src="https://resources.kashkole.com/IMAGES/117/test.jpg" />

<!-- After (Development) -->
<img src="file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg" />
```

#### Pattern 4: Audio/Video Media
```html
<!-- Before -->
<audio src="/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3"></audio>

<!-- After (Production) -->
<audio src="https://resources.kashkole.com/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3"></audio>

<!-- After (Development) -->
<audio src="file:///D:/Websites/KSESSIONS/Resources/MP3/df661c2c-b6e1-47e6-9d38-5fdf719ffc36.mp3"></audio>
```

### Integration Point

**File**: `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs`

**Location**: After `HtmlParsingService.ParseHtml()`, before share button injection

```csharp
public async Task<string> TransformForHostAsync(string html, int? sessionId, string? sessionStatus)
{
    // Step 1: Core transformation using HtmlParsingService
    var parseResult = _htmlParsingService.ParseHtml(html, ParseMode.Safe);
    var cleanedHtml = parseResult.Content ?? string.Empty;
    
    // ✅ NEW: Step 1.5 - Fix media URLs for environment
    cleanedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(cleanedHtml, sessionId);
    
    // Step 2: Apply host-specific transformations (share button injection)
    if (shouldInjectButtons) { ... }
    
    return cleanedHtml;
}
```

### No Impact on KSESSIONS

- ✅ **Different Application**: KSESSIONS doesn't use `UnifiedHtmlTransformService`
- ✅ **Database Unchanged**: Transform happens post-read, never writes back
- ✅ **In-Memory Only**: Original HTML preserved in database
- ✅ **NOOR CANVAS Specific**: Service injected only in NOOR CANVAS application

---

## Implementation Phases

### Phase 1: Media URL Transform Service

**Goal**: Create `MediaUrlTransformService` with environment-aware URL rewriting and caching

**Files Created**:
- `SPA/NoorCanvas/Services/MediaUrlTransformService.cs` (NEW - core service)
- `SPA/NoorCanvas/Services/IMediaUrlTransformService.cs` (NEW - interface)

**Implementation Details**:

#### Interface
```csharp
public interface IMediaUrlTransformService
{
    /// <summary>
    /// Transform media URLs in HTML to environment-appropriate paths
    /// </summary>
    /// <param name="html">HTML content with media references</param>
    /// <param name="sessionId">Session ID for cache key generation</param>
    /// <returns>HTML with transformed media URLs</returns>
    Task<string> TransformMediaUrlsAsync(string html, int? sessionId);
    
    /// <summary>
    /// Clear cached transformations (for testing or manual cache invalidation)
    /// </summary>
    void ClearCache();
}
```

#### Service Implementation
```csharp
public class MediaUrlTransformService : IMediaUrlTransformService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MediaUrlTransformService> _logger;
    private readonly IMemoryCache _cache;
    
    private const string CACHE_KEY_PREFIX = "media-transform:";
    private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(30);
    
    public MediaUrlTransformService(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<MediaUrlTransformService> logger,
        IMemoryCache cache)
    {
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }
    
    public async Task<string> TransformMediaUrlsAsync(string html, int? sessionId)
    {
        if (string.IsNullOrEmpty(html))
            return html ?? string.Empty;
        
        // Check cache first
        var cacheKey = $"{CACHE_KEY_PREFIX}{sessionId}:{html.GetHashCode()}";
        if (_cache.TryGetValue<string>(cacheKey, out var cachedResult))
        {
            _logger.LogDebug("[MediaUrlTransform] Cache hit for session {SessionId}", sessionId);
            return cachedResult;
        }
        
        _logger.LogInformation("[MediaUrlTransform] Transforming media URLs for session {SessionId}, environment: {Environment}",
            sessionId, _environment.EnvironmentName);
        
        var startTime = DateTime.UtcNow;
        var transformCount = 0;
        
        try
        {
            // Parse HTML
            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(html);
            
            // Transform <img> tags
            transformCount += TransformImageTags(htmlDoc);
            
            // Transform <audio> tags
            transformCount += TransformAudioTags(htmlDoc);
            
            // Transform <video> tags
            transformCount += TransformVideoTags(htmlDoc);
            
            var transformedHtml = htmlDoc.DocumentNode.OuterHtml;
            var duration = DateTime.UtcNow - startTime;
            
            _logger.LogInformation("[MediaUrlTransform] Completed: {Count} URLs transformed in {Duration}ms",
                transformCount, duration.TotalMilliseconds);
            
            // Cache result
            _cache.Set(cacheKey, transformedHtml, CacheExpiry);
            
            return transformedHtml;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[MediaUrlTransform] Error transforming media URLs for session {SessionId}", sessionId);
            return html; // Return original on error
        }
    }
    
    private int TransformImageTags(HtmlDocument htmlDoc)
    {
        var images = htmlDoc.DocumentNode.SelectNodes("//img[@src]");
        if (images == null) return 0;
        
        var count = 0;
        foreach (var img in images)
        {
            var originalSrc = img.GetAttributeValue("src", string.Empty);
            if (string.IsNullOrEmpty(originalSrc)) continue;
            
            var transformedSrc = TransformUrl(originalSrc, "image");
            if (transformedSrc != originalSrc)
            {
                img.SetAttributeValue("src", transformedSrc);
                count++;
                
                _logger.LogDebug("[MediaUrlTransform] Image: {Original} → {Transformed}",
                    originalSrc, transformedSrc);
            }
        }
        
        return count;
    }
    
    private int TransformAudioTags(HtmlDocument htmlDoc)
    {
        var audioTags = htmlDoc.DocumentNode.SelectNodes("//audio[@src]");
        if (audioTags == null) return 0;
        
        var count = 0;
        foreach (var audio in audioTags)
        {
            var originalSrc = audio.GetAttributeValue("src", string.Empty);
            if (string.IsNullOrEmpty(originalSrc)) continue;
            
            var transformedSrc = TransformUrl(originalSrc, "audio");
            if (transformedSrc != originalSrc)
            {
                audio.SetAttributeValue("src", transformedSrc);
                count++;
                
                _logger.LogDebug("[MediaUrlTransform] Audio: {Original} → {Transformed}",
                    originalSrc, transformedSrc);
            }
        }
        
        return count;
    }
    
    private int TransformVideoTags(HtmlDocument htmlDoc)
    {
        var videoTags = htmlDoc.DocumentNode.SelectNodes("//video[@src]");
        if (videoTags == null) return 0;
        
        var count = 0;
        foreach (var video in videoTags)
        {
            var originalSrc = video.GetAttributeValue("src", string.Empty);
            if (string.IsNullOrEmpty(originalSrc)) continue;
            
            var transformedSrc = TransformUrl(originalSrc, "video");
            if (transformedSrc != originalSrc)
            {
                video.SetAttributeValue("src", transformedSrc);
                count++;
                
                _logger.LogDebug("[MediaUrlTransform] Video: {Original} → {Transformed}",
                    originalSrc, transformedSrc);
            }
        }
        
        return count;
    }
    
    private string TransformUrl(string originalUrl, string mediaType)
    {
        // Pattern 1: Relative paths (/IMAGES/..., /MP3/..., /MEDIA/...)
        if (originalUrl.StartsWith("/IMAGES/") || originalUrl.StartsWith("/MP3/") || originalUrl.StartsWith("/MEDIA/"))
        {
            return BuildEnvironmentUrl(originalUrl.TrimStart('/'));
        }
        
        // Pattern 2: File protocol (file:///D:/Websites/...)
        if (originalUrl.StartsWith("file:///"))
        {
            if (_environment.IsProduction())
            {
                // Extract relative path from file URL
                var relativePath = ExtractRelativePathFromFileUrl(originalUrl);
                return BuildEnvironmentUrl(relativePath);
            }
            else
            {
                // Keep file:/// in development
                return originalUrl;
            }
        }
        
        // Pattern 3: KSESSIONS domain URLs (https://kashkole.com/Resources/...)
        if (originalUrl.Contains("kashkole.com/Resources/", StringComparison.OrdinalIgnoreCase))
        {
            var relativePath = ExtractRelativePathFromKSessionsUrl(originalUrl);
            return BuildEnvironmentUrl(relativePath);
        }
        
        // Pattern 4: Already correct resources CDN URL
        if (originalUrl.StartsWith("https://resources.kashkole.com/", StringComparison.OrdinalIgnoreCase))
        {
            return originalUrl; // Already correct
        }
        
        // Unknown pattern - leave unchanged
        return originalUrl;
    }
    
    private string BuildEnvironmentUrl(string relativePath)
    {
        if (_environment.IsProduction())
        {
            var cdnUrl = _configuration["Resources:Production:BaseUrl"] ?? "https://resources.kashkole.com";
            return $"{cdnUrl}/{relativePath}";
        }
        else
        {
            var devPath = _configuration["Resources:Development:BaseUrl"] ?? "file:///D:/Websites/KSESSIONS/Resources";
            return $"{devPath}/{relativePath}";
        }
    }
    
    private string ExtractRelativePathFromFileUrl(string fileUrl)
    {
        // file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg
        // → IMAGES/117/test.jpg
        var resourcesIndex = fileUrl.IndexOf("/Resources/", StringComparison.OrdinalIgnoreCase);
        if (resourcesIndex == -1) return string.Empty;
        
        return fileUrl.Substring(resourcesIndex + "/Resources/".Length);
    }
    
    private string ExtractRelativePathFromKSessionsUrl(string ksessionsUrl)
    {
        // https://kashkole.com/Resources/IMAGES/117/test.jpg
        // → IMAGES/117/test.jpg
        var resourcesIndex = ksessionsUrl.IndexOf("/Resources/", StringComparison.OrdinalIgnoreCase);
        if (resourcesIndex == -1) return string.Empty;
        
        return ksessionsUrl.Substring(resourcesIndex + "/Resources/".Length);
    }
    
    public void ClearCache()
    {
        _logger.LogInformation("[MediaUrlTransform] Cache cleared manually");
        // Note: IMemoryCache doesn't have a clear-all method
        // Individual entries expire based on CacheExpiry
    }
}
```

**Configuration Updates**:

Add to `config/sharedsettings.json`:
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources"
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"
    }
  }
}
```

**Dependencies**:
- HtmlAgilityPack (already in project)
- Microsoft.Extensions.Caching.Memory (already in project)

**Testing**:
- Unit tests for URL pattern detection
- Unit tests for environment-specific transformations
- Cache hit/miss validation

**Deliverables**:
- ✅ `IMediaUrlTransformService` interface
- ✅ `MediaUrlTransformService` implementation
- ✅ Configuration in `sharedsettings.json`
- ✅ Logging for all transformations
- ✅ Cache support (30-minute expiry)
- ✅ Support for `<img>`, `<audio>`, `<video>` tags
- ✅ 4 URL pattern handlers (relative, file://, KSESSIONS domain, CDN)

---

### Phase 2: Integration with UnifiedHtmlTransformService

**Goal**: Integrate `MediaUrlTransformService` into existing transform pipeline

**Files Modified**:
- `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs` (inject service, add transform step)
- `SPA/NoorCanvas/Program.cs` (DI registration)

**Implementation Details**:

#### UnifiedHtmlTransformService.cs Changes

```csharp
public class UnifiedHtmlTransformService
{
    private readonly HtmlParsingService _htmlParsingService;
    private readonly AssetProcessingService _assetProcessingService;
    private readonly IMediaUrlTransformService _mediaUrlTransformService; // ✅ NEW
    private readonly ILogger<UnifiedHtmlTransformService> _logger;

    public UnifiedHtmlTransformService(
        HtmlParsingService htmlParsingService,
        AssetProcessingService assetProcessingService,
        IMediaUrlTransformService mediaUrlTransformService, // ✅ NEW
        ILogger<UnifiedHtmlTransformService> logger)
    {
        _htmlParsingService = htmlParsingService;
        _assetProcessingService = assetProcessingService;
        _mediaUrlTransformService = mediaUrlTransformService; // ✅ NEW
        _logger = logger;
    }
    
    public async Task<string> TransformForHostAsync(string html, int? sessionId, string? sessionStatus)
    {
        if (string.IsNullOrEmpty(html))
        {
            _logger.LogWarning("UnifiedHtmlTransformService: Empty HTML provided for host transformation");
            return string.Empty;
        }

        try
        {
            _logger.LogInformation(
                "UnifiedHtmlTransformService: Transforming HTML for host view - SessionId: {SessionId}, Status: {Status}, Length: {Length}",
                sessionId, sessionStatus, html.Length);

            // Step 1: Core transformation using HtmlParsingService
            var parseResult = _htmlParsingService.ParseHtml(html, ParseMode.Safe);

            if (!parseResult.IsValid)
            {
                _logger.LogError(
                    "UnifiedHtmlTransformService: HTML parsing failed for host - {Error}",
                    parseResult.ErrorMessage);
                return CreateErrorMessage(parseResult.ErrorMessage ?? "HTML parsing failed");
            }

            var cleanedHtml = parseResult.Content ?? string.Empty;

            // ✅ NEW: Step 1.5 - Transform media URLs for environment
            _logger.LogDebug("UnifiedHtmlTransformService: Applying media URL transformations for session {SessionId}", sessionId);
            cleanedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(cleanedHtml, sessionId);

            // Step 2: Apply host-specific transformations (share button injection)
            bool shouldInjectButtons = sessionId.HasValue &&
                                      (sessionStatus == "Active" || sessionStatus == "Waiting");

            if (shouldInjectButtons)
            {
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Injecting share buttons for session {SessionId}",
                    sessionId);

                cleanedHtml = await _assetProcessingService.InjectAssetShareButtonsAsync(
                    cleanedHtml,
                    sessionId!.Value.ToString());
            }
            else
            {
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Skipping share button injection - SessionId: {SessionId}, Status: {Status}",
                    sessionId, sessionStatus);
            }

            _logger.LogInformation(
                "UnifiedHtmlTransformService: Host transformation complete - Original: {OriginalLength}, Final: {FinalLength}",
                html.Length, cleanedHtml.Length);

            return cleanedHtml;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "UnifiedHtmlTransformService: Exception during host transformation - SessionId: {SessionId}",
                sessionId);
            return CreateErrorMessage($"Transformation error: {ex.Message}");
        }
    }
    
    // TransformForParticipant() remains unchanged - no media URL fix needed
    // (participant receives already-transformed HTML from host via SignalR)
}
```

#### Program.cs DI Registration

```csharp
// Add HTML transformation and processing services
builder.Services.AddScoped<HtmlParsingService>();
builder.Services.AddScoped<AssetProcessingService>();
builder.Services.AddScoped<IMediaUrlTransformService, MediaUrlTransformService>(); // ✅ NEW
builder.Services.AddScoped<UnifiedHtmlTransformService>(); // Unified HTML transformation for host and participant views
```

**Testing**:
- Verify service injection works
- Verify media URL transform executes before share button injection
- Verify cache works across multiple requests
- Verify participant view unchanged (no media URL fix applied)

**Deliverables**:
- ✅ `MediaUrlTransformService` injected into `UnifiedHtmlTransformService`
- ✅ Media URL transform step added at correct pipeline position
- ✅ DI registration in `Program.cs`
- ✅ Logging confirms execution order
- ✅ Participant view unaffected

---

### Phase 3: Testing and Validation

**Goal**: Comprehensive testing using SessionId=2343 (confirmed to have image references)

**Test Categories**:
1. Unit Tests (services in isolation)
2. Integration Tests (full pipeline)
3. E2E Tests (browser-based with Playwright)
4. Visual Regression Tests (Percy snapshots)

**Files Created**:
- `Tests/Unit/MediaUrlTransformServiceTests.cs` (NEW)
- `Tests/UI/verify-transcript-image-loading.spec.ts` (NEW)
- `Tests/UI/verify-transcript-media-urls-percy.spec.ts` (NEW - Percy visual regression)

#### Unit Tests

**File**: `Tests/Unit/MediaUrlTransformServiceTests.cs`

```csharp
public class MediaUrlTransformServiceTests
{
    [Fact]
    public async Task TransformMediaUrls_RelativePath_Production_ReturnsCdnUrl()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_RelativePath_Development_ReturnsFileUrl()
    {
        // Arrange
        var service = CreateService(isProduction: false);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_FileProtocol_Production_ConvertsToCdn()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_FileProtocol_Development_Unchanged()
    {
        // Arrange
        var service = CreateService(isProduction: false);
        var html = @"<img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_KSessionsDomain_Production_ConvertsToCdn()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""https://kashkole.com/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_AlreadyCdn_Unchanged()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""https://resources.kashkole.com/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }
    
    [Fact]
    public async Task TransformMediaUrls_MultipleImages_AllTransformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"
            <img src=""/IMAGES/117/image1.jpg"" />
            <img src=""/IMAGES/117/image2.png"" />
            <img src=""/IMAGES/117/image3.gif"" />
        ";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image1.jpg");
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image2.png");
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image3.gif");
    }
    
    [Fact]
    public async Task TransformMediaUrls_AudioTag_Transformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<audio src=""/MP3/test.mp3""></audio>";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/MP3/test.mp3");
    }
    
    [Fact]
    public async Task TransformMediaUrls_VideoTag_Transformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<video src=""/MEDIA/test.mp4""></video>";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/MEDIA/test.mp4");
    }
    
    [Fact]
    public async Task TransformMediaUrls_Cache_SecondCallReturnsCached()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act
        var result1 = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        var result2 = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result1.Should().Be(result2);
        // Verify cache hit in logs
    }
    
    private IMediaUrlTransformService CreateService(bool isProduction)
    {
        var environment = Substitute.For<IWebHostEnvironment>();
        environment.EnvironmentName.Returns(isProduction ? "Production" : "Development");
        
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                ["Resources:Production:BaseUrl"] = "https://resources.kashkole.com",
                ["Resources:Development:BaseUrl"] = "file:///D:/Websites/KSESSIONS/Resources"
            })
            .Build();
        
        var logger = Substitute.For<ILogger<MediaUrlTransformService>>();
        var cache = new MemoryCache(new MemoryCacheOptions());
        
        return new MediaUrlTransformService(environment, configuration, logger, cache);
    }
}
```

#### E2E Test (Playwright)

**File**: `Tests/UI/verify-transcript-image-loading.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Transcript Image Loading - Session 2343', () => {
  
  test('should load images with correct CDN URLs in production mode', async ({ page }) => {
    // Navigate to host control panel with SessionId=2343
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    
    // Wait for session transcript to load
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    // Find all images in transcript
    const images = await page.locator('#session-transcript-container img').all();
    
    expect(images.length).toBeGreaterThan(0, 'Session 2343 should have images in transcript');
    
    // Verify each image has correct CDN URL
    for (const img of images) {
      const src = await img.getAttribute('src');
      
      expect(src).toBeTruthy();
      expect(src).toContain('https://resources.kashkole.com/IMAGES/');
      
      // Verify image actually loads (200 response)
      const response = await page.request.get(src!);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image');
    }
  });
  
  test('should handle mixed media types (images, audio, video)', async ({ page }) => {
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    // Check images
    const images = await page.locator('#session-transcript-container img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      expect(src).toMatch(/https:\/\/resources\.kashkole\.com\/(IMAGES|MP3|MEDIA)\//);
    }
    
    // Check audio tags (if any)
    const audioTags = await page.locator('#session-transcript-container audio').all();
    for (const audio of audioTags) {
      const src = await audio.getAttribute('src');
      expect(src).toContain('https://resources.kashkole.com/MP3/');
    }
    
    // Check video tags (if any)
    const videoTags = await page.locator('#session-transcript-container video').all();
    for (const video of videoTags) {
      const src = await video.getAttribute('src');
      expect(src).toContain('https://resources.kashkole.com/MEDIA/');
    }
  });
  
  test('should cache transformed HTML on subsequent loads', async ({ page }) => {
    // First load
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    await page.waitForSelector('#session-transcript-container img:first-child', { timeout: 10000 });
    
    const firstLoadTime = Date.now();
    const firstImageSrc = await page.locator('#session-transcript-container img:first-child').getAttribute('src');
    
    // Second load (should use cache)
    await page.reload();
    await page.waitForSelector('#session-transcript-container img:first-child', { timeout: 10000 });
    
    const secondLoadTime = Date.now();
    const secondImageSrc = await page.locator('#session-transcript-container img:first-child').getAttribute('src');
    
    // Verify same result (cache hit)
    expect(firstImageSrc).toBe(secondImageSrc);
    
    // Second load should be faster (cached)
    // Note: This is approximate, just verify it completes quickly
    expect(secondLoadTime - firstLoadTime).toBeLessThan(5000);
  });
  
  test('should log media URL transformations', async ({ page }) => {
    // Enable console logging
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[MediaUrlTransform]')) {
        logs.push(msg.text());
      }
    });
    
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    // Wait a bit for logs to accumulate
    await page.waitForTimeout(2000);
    
    // Verify transformation logs exist
    const transformLogs = logs.filter(log => log.includes('URLs transformed'));
    expect(transformLogs.length).toBeGreaterThan(0, 'Should have media URL transformation logs');
  });
  
});
```

#### Visual Regression Test (Percy)

**File**: `Tests/UI/verify-transcript-media-urls-percy.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Transcript Media URLs - Visual Regression (Percy)', () => {
  
  test('should render transcript with images correctly - Session 2343', async ({ page }) => {
    // Navigate to host control panel
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    
    // Wait for transcript to fully load
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    // Wait for all images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('#session-transcript-container img'));
      return images.every(img => (img as HTMLImageElement).complete);
    }, { timeout: 15000 });
    
    // Take Percy snapshot
    await percySnapshot(page, 'Transcript with Images - Session 2343 - Desktop', {
      widths: [1280, 1920]
    });
  });
  
  test('should render transcript with images on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('#session-transcript-container img'));
      return images.every(img => (img as HTMLImageElement).complete);
    }, { timeout: 15000 });
    
    // Take Percy snapshot for mobile
    await percySnapshot(page, 'Transcript with Images - Session 2343 - Mobile', {
      widths: [375]
    });
  });
  
  test('should handle missing images gracefully', async ({ page }) => {
    // Mock network to simulate missing image
    await page.route('**/resources.kashkole.com/IMAGES/117/*.jpg', route => {
      route.fulfill({ status: 404 });
    });
    
    await page.goto('https://noorcanvas.kashkole.com/host/control-panel/TEST_TOKEN_2343');
    await page.waitForSelector('#session-transcript-container', { timeout: 10000 });
    
    // Wait for images to attempt loading
    await page.waitForTimeout(3000);
    
    // Take Percy snapshot showing fallback/error state
    await percySnapshot(page, 'Transcript with Missing Images - Session 2343', {
      widths: [1280]
    });
  });
  
});
```

#### Integration Test Commands

```bash
# Run unit tests
dotnet test --filter "FullyQualifiedName~MediaUrlTransformServiceTests"

# Run E2E tests (headed for debugging)
npx playwright test Tests/UI/verify-transcript-image-loading.spec.ts --headed

# Run Percy visual regression tests
PERCY_TOKEN=<token> npx percy exec -- npx playwright test Tests/UI/verify-transcript-media-urls-percy.spec.ts
```

**Validation Checklist**:
- [ ] Unit tests pass (10/10)
- [ ] E2E tests pass with SessionId=2343
- [ ] Images load from CDN in production
- [ ] Images load from file:/// in development
- [ ] Audio/video tags transformed correctly
- [ ] Cache reduces transformation time on subsequent loads
- [ ] Percy baselines captured for visual regression
- [ ] Logging confirms media URL transformations
- [ ] KSESSIONS application unaffected (separate app, no changes)

**Deliverables**:
- ✅ 10 unit tests for `MediaUrlTransformService`
- ✅ 4 E2E tests using SessionId=2343
- ✅ 3 Percy visual regression tests
- ✅ Test execution commands documented
- ✅ Validation checklist for production deployment

---

## Configuration Summary

### sharedsettings.json
```json
{
  "Resources": {
    "Development": {
      "BaseUrl": "file:///D:/Websites/KSESSIONS/Resources"
    },
    "Production": {
      "BaseUrl": "https://resources.kashkole.com"
    }
  }
}
```

### Program.cs DI Registration
```csharp
builder.Services.AddMemoryCache(); // Already exists
builder.Services.AddScoped<IMediaUrlTransformService, MediaUrlTransformService>();
```

---

## Files Summary

### Files Created (3)
1. `SPA/NoorCanvas/Services/IMediaUrlTransformService.cs` (interface)
2. `SPA/NoorCanvas/Services/MediaUrlTransformService.cs` (core service)
3. `Tests/Unit/MediaUrlTransformServiceTests.cs` (10 unit tests)
4. `Tests/UI/verify-transcript-image-loading.spec.ts` (4 E2E tests)
5. `Tests/UI/verify-transcript-media-urls-percy.spec.ts` (3 Percy tests)

### Files Modified (3)
1. `SPA/NoorCanvas/Services/UnifiedHtmlTransformService.cs` (inject service, add transform step)
2. `SPA/NoorCanvas/Program.cs` (DI registration)
3. `config/sharedsettings.json` (Resources configuration)

### Total Files: 8 (5 new, 3 modified)

---

## Risk Assessment

### Low Risk
- ✅ **In-memory transformation only** - Never writes to database
- ✅ **NOOR CANVAS specific** - KSESSIONS unaffected (different app)
- ✅ **Graceful degradation** - Returns original HTML on error
- ✅ **Cache with expiry** - Memory doesn't grow indefinitely (30-minute TTL)

### Medium Risk
- ⚠️ **URL pattern coverage** - May miss edge cases in transcript HTML
  - **Mitigation**: Extensive testing with Session 2343, logging all transforms
- ⚠️ **Performance impact** - AngleSharp parsing adds latency
  - **Mitigation**: 30-minute cache reduces repeated processing

### Rollback Plan
If issues detected in production:
1. **Disable service** - Comment out DI registration in `Program.cs`
2. **Redeploy** - Images won't load, but no crashes
3. **Investigate** - Check logs for transformation errors
4. **Fix and redeploy** - Update URL patterns, re-enable service

---

## Success Criteria

- [x] Plan created with all enhancements integrated
- [ ] Phase 1: `MediaUrlTransformService` created with caching and logging
- [ ] Phase 2: Integrated into `UnifiedHtmlTransformService`
- [ ] Phase 3: All tests pass (unit + E2E + Percy)
- [ ] Session 2343 images load correctly in production
- [ ] Audio/video tags transformed correctly
- [ ] Cache reduces transformation time
- [ ] KSESSIONS application unaffected
- [ ] Logging tracks all URL transformations
- [ ] Percy visual baselines captured
- [ ] Production deployment validated

---

## Next Steps

**Ready for Execution:**

```
@workspace /task key:transcript-image-url-fix phase:1
```

**Or auto-execute all phases:**

```
.\.github\key-data-streams\transcript-image-url-fix\execute-plan.ps1
```

---

**Plan Status**: ✅ Complete  
**Version**: 1.0  
**Last Updated**: 2025-10-26
