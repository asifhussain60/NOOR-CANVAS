using Microsoft.Extensions.Logging;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Unified HTML transformation service that provides consistent HTML processing
    /// for both host (HostControlPanel) and participant (SessionCanvas) views.
    /// Eliminates code duplication and ensures transformation consistency.
    /// </summary>
    public class UnifiedHtmlTransformService
    {
        private readonly HtmlParsingService _htmlParsingService;
        private readonly AssetProcessingService _assetProcessingService;
        private readonly IMediaUrlTransformService _mediaUrlTransformService;
        private readonly ShareButtonInjectionService _shareButtonInjectionService;
        private readonly ILogger<UnifiedHtmlTransformService> _logger;

        public UnifiedHtmlTransformService(
            HtmlParsingService htmlParsingService,
            AssetProcessingService assetProcessingService,
            IMediaUrlTransformService mediaUrlTransformService,
            ShareButtonInjectionService shareButtonInjectionService,
            ILogger<UnifiedHtmlTransformService> logger)
        {
            _htmlParsingService = htmlParsingService;
            _assetProcessingService = assetProcessingService;
            _mediaUrlTransformService = mediaUrlTransformService;
            _shareButtonInjectionService = shareButtonInjectionService;
            _logger = logger;
        }

        /// <summary>
        /// Transform HTML for host view (HostControlPanel).
        /// Applies full transformation pipeline including share button injection.
        /// </summary>
        /// <param name="html">Raw HTML content from session transcript</param>
        /// <param name="sessionId">Session ID for asset tracking</param>
        /// <param name="sessionStatus">Session status (Active, Waiting, etc.)</param>
        /// <returns>Transformed HTML with share buttons and asset detection</returns>
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
                // This handles security validation, Blazor compatibility, and base transformations
                var parseResult = _htmlParsingService.ParseHtml(html, ParseMode.Safe);

                if (!parseResult.IsValid)
                {
                    _logger.LogError(
                        "UnifiedHtmlTransformService: HTML parsing failed for host - {Error}",
                        parseResult.ErrorMessage);
                    return CreateErrorMessage(parseResult.ErrorMessage ?? "HTML parsing failed");
                }

                var cleanedHtml = parseResult.Content ?? string.Empty;

                // Step 1.5: Transform media URLs for environment
                // Convert KSESSIONS-specific paths to NOOR CANVAS environment-appropriate URLs
                _logger.LogDebug("UnifiedHtmlTransformService: Applying media URL transformations for session {SessionId}", sessionId);
                cleanedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(cleanedHtml, sessionId);

                // Step 2: Mark asset locations
                // Add location markers for asset discovery
                bool shouldProcessAssets = sessionId.HasValue &&
                                          (sessionStatus == "Active" || sessionStatus == "Waiting");

            if (shouldProcessAssets)
            {
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Processing assets for session {SessionId}",
                    sessionId);

                // Step 2a: Mark asset locations
                cleanedHtml = await _assetProcessingService.MarkAssetLocationsAsync(
                    cleanedHtml,
                    sessionId!.Value.ToString());

                // Step 2b: Inject share buttons for session assets
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Injecting share buttons for session {SessionId}",
                    sessionId);
                cleanedHtml = await _shareButtonInjectionService.InjectShareButtonsAsync(
                    cleanedHtml,
                    sessionId.Value);
            }
            else
            {
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Skipping asset processing - SessionId: {SessionId}, Status: {Status}",
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

        /// <summary>
        /// Transform HTML for participant view (SessionCanvas).
        /// Applies core transformation pipeline WITHOUT share button injection.
        /// Focuses on safe HTML rendering and validation.
        /// </summary>
        /// <param name="html">HTML content received via SignalR broadcast</param>
        /// <returns>Safe, validated HTML ready for display</returns>
        public string TransformForParticipant(string html)
        {
            if (string.IsNullOrEmpty(html))
            {
                _logger.LogWarning("UnifiedHtmlTransformService: Empty HTML provided for participant transformation");
                return string.Empty;
            }

            try
            {
                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Transforming HTML for participant view - Length: {Length}",
                    html.Length);

                // Core transformation using HtmlParsingService
                // Handles security validation, Blazor compatibility, and safe rendering
                var parseResult = _htmlParsingService.ParseHtml(html, ParseMode.Safe);

                if (!parseResult.IsValid)
                {
                    _logger.LogError(
                        "UnifiedHtmlTransformService: HTML parsing failed for participant - {Error}",
                        parseResult.ErrorMessage);
                    return CreateErrorMessage(parseResult.ErrorMessage ?? "HTML parsing failed");
                }

                var cleanedHtml = parseResult.Content ?? string.Empty;

                _logger.LogInformation(
                    "UnifiedHtmlTransformService: Participant transformation complete - Original: {OriginalLength}, Final: {FinalLength}",
                    html.Length, cleanedHtml.Length);

            return cleanedHtml;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "UnifiedHtmlTransformService: Exception during participant transformation");
                return CreateErrorMessage($"Transformation error: {ex.Message}");
            }
        }

        /// <summary>
        /// Create a safe error message for display when transformation fails.
        /// </summary>
        private static string CreateErrorMessage(string errorMessage)
        {
            var safeError = System.Web.HttpUtility.HtmlEncode(errorMessage);
            return $@"<div style=""padding:20px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;margin:10px 0;"">
                <p style=""margin:0;color:#856404;""><strong>⚠️ Content Rendering Error</strong></p>
                <p style=""margin:10px 0 0 0;color:#856404;font-size:14px;"">{safeError}</p>
            </div>";
        }
    }
}
