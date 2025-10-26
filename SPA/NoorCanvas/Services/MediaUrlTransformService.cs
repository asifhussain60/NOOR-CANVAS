using HtmlAgilityPack;
using Microsoft.Extensions.Caching.Memory;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for transforming media URLs in HTML content to environment-appropriate paths.
    /// Converts between development (file:///) and production (CDN) URLs based on environment.
    /// Supports img, audio, and video tags with intelligent pattern detection.
    /// </summary>
    public class MediaUrlTransformService : IMediaUrlTransformService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<MediaUrlTransformService> _logger;
        private readonly IMemoryCache _cache;
        
        private const string CACHE_KEY_PREFIX = "media-transform:";
        private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(30);
        
        /// <summary>
        /// Initializes a new instance of the <see cref="MediaUrlTransformService"/> class.
        /// </summary>
        /// <param name="environment">Web host environment for detecting production vs development.</param>
        /// <param name="configuration">Configuration for reading Resources:BaseUrl settings.</param>
        /// <param name="logger">Logger for transformation tracking.</param>
        /// <param name="cache">Memory cache for storing transformed HTML.</param>
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
        
        /// <inheritdoc/>
        public async Task<string> TransformMediaUrlsAsync(string html, int? sessionId)
        {
            if (string.IsNullOrEmpty(html))
                return html ?? string.Empty;
            
            // Check cache first
            var cacheKey = $"{CACHE_KEY_PREFIX}{sessionId}:{html.GetHashCode()}";
            if (_cache.TryGetValue<string>(cacheKey, out var cachedResult))
            {
                _logger.LogDebug("[MediaUrlTransform] Cache hit for session {SessionId}", sessionId);
                return cachedResult!;
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
        
        /// <inheritdoc/>
        public void ClearCache()
        {
            _logger.LogInformation("[MediaUrlTransform] Cache cleared manually");
            // Note: IMemoryCache doesn't have a clear-all method
            // Individual entries expire based on CacheExpiry
        }
    }
}
