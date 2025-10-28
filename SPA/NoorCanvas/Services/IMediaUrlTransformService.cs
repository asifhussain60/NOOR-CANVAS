namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for transforming media URLs in HTML content to environment-appropriate paths.
    /// Handles conversion between development (file:///) and production (CDN) URLs.
    /// </summary>
    public interface IMediaUrlTransformService
    {
        /// <summary>
        /// Transform media URLs in HTML to environment-appropriate paths.
        /// Rewrites img, audio, and video src attributes based on current environment.
        /// </summary>
        /// <param name="html">HTML content with media references.</param>
        /// <param name="sessionId">Session ID for cache key generation.</param>
        /// <returns>HTML with transformed media URLs.</returns>
        Task<string> TransformMediaUrlsAsync(string html, int? sessionId);
        
        /// <summary>
        /// Clear cached transformations (for testing or manual cache invalidation).
        /// Note: IMemoryCache doesn't support clear-all, entries expire based on configured expiry time.
        /// </summary>
        void ClearCache();
    }
}
