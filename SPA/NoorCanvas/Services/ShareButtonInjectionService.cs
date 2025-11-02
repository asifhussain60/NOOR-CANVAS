using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace NoorCanvas.Services;

/// <summary>
/// Service responsible for injecting share buttons into HTML content for session assets.
/// Loads session assets from API and injects buttons with unique IDs above asset containers.
/// </summary>
public class ShareButtonInjectionService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ShareButtonInjectionService> _logger;

    public ShareButtonInjectionService(
        IHttpClientFactory httpClientFactory,
        ILogger<ShareButtonInjectionService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Inject share buttons into HTML for all session assets.
    /// Main entry point called by UnifiedHtmlTransformService.
    /// </summary>
    public async Task<string> InjectShareButtonsAsync(string html, long sessionId)
    {
        try
        {
            var buildTimestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
            _logger.LogInformation("🏗️ [BUILD-TRACKER] ShareButtonInjectionService executing - Build Time: {BuildTime} UTC", buildTimestamp);
            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Starting injection for session {SessionId}", sessionId);
            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Input HTML length: {Length}", html.Length);

            // Load pre-detected assets from SessionAssets table
            var sessionAssets = await LoadSessionAssetsAsync(sessionId);
            if (sessionAssets == null || sessionAssets.Count == 0)
            {
                _logger.LogInformation("[SHARE-BUTTON-INJECTION] No assets found for session {SessionId}", sessionId);
                return html;
            }

            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Loaded {Count} assets from lookup table", sessionAssets.Count);

            // Phase 1: Inject data-asset-id attributes into asset containers
            var htmlWithAssetIds = InjectAssetIdentifiers(html, sessionAssets);

            // Phase 2: Add share buttons above identified containers
            var htmlWithButtons = InjectShareButtons(htmlWithAssetIds, sessionAssets);

            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Enhancement complete - HTML length: {Original} → {Final}",
                html.Length, htmlWithButtons.Length);

            return htmlWithButtons;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SHARE-BUTTON-INJECTION] Failed to inject share buttons, returning original HTML");
            return html; // Graceful degradation
        }
    }

    /// <summary>
    /// Load session assets from the SessionAssets API.
    /// </summary>
    private async Task<List<SessionAssetDto>?> LoadSessionAssetsAsync(long sessionId)
    {
        try
        {
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync($"/api/host/sessions/{sessionId}/assets");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[SHARE-BUTTON-INJECTION] Failed to load assets from API, status: {StatusCode}", response.StatusCode);
                return new List<SessionAssetDto>();
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var assetsResponse = JsonSerializer.Deserialize<SessionAssetsResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            return assetsResponse?.Assets ?? new List<SessionAssetDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SHARE-BUTTON-INJECTION] Exception loading assets from API");
            return new List<SessionAssetDto>();
        }
    }

    /// <summary>
    /// Inject data-asset-id attributes into HTML asset containers.
    /// </summary>
    private string InjectAssetIdentifiers(string html, List<SessionAssetDto> assets)
    {
        try
        {
            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Injecting data-asset-id attributes for {Count} assets", assets.Count);

            foreach (var asset in assets)
            {
                var pattern = asset.AssetSelector;
                var regex = new System.Text.RegularExpressions.Regex(pattern);
                var match = regex.Match(html);

                if (match.Success)
                {
                    var openingTag = match.Value;
                    var enhancedTag = InjectDataAssetId(openingTag, asset.AssetId);
                    html = html.Replace(openingTag, enhancedTag);

                    _logger.LogDebug("[SHARE-BUTTON-INJECTION] Injected data-asset-id for asset {AssetId} ({AssetType})",
                        asset.AssetId, asset.AssetType);
                }
            }

            return html;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SHARE-BUTTON-INJECTION] Failed to inject asset identifiers");
            return html;
        }
    }

    /// <summary>
    /// Inject SHARE buttons above containers with data-asset-id attributes.
    /// </summary>
    private string InjectShareButtons(string html, List<SessionAssetDto> assets)
    {
        try
        {
            var buildTimestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
            _logger.LogInformation("🏗️ [BUILD-TRACKER] InjectShareButtons executing - Build Time: {BuildTime} UTC", buildTimestamp);
            _logger.LogInformation("[SHARE-BUTTON-INJECTION] Injecting SHARE buttons for {Count} assets", assets.Count);

            // Process in reverse position order to maintain HTML positions during injection
            foreach (var asset in assets.OrderByDescending(a => a.Position ?? int.MaxValue))
            {
                var shareButton = GenerateShareButton(asset.AssetId, asset.AssetType);

                _logger.LogInformation("🔍 [INJECTION-DEBUG] About to inject button for AssetId={AssetId}, Type={AssetType}, Button HTML length={Length}",
                    asset.AssetId, asset.AssetType, shareButton.Length);

                // Find container and inject button before it
                var beforeLength = html.Length;
                html = InjectButtonBeforeContainer(html, asset.AssetId, shareButton);
                var afterLength = html.Length;

                _logger.LogInformation("📏 [INJECTION-DEBUG] HTML size change: {Before} → {After} (Δ={Delta})",
                    beforeLength, afterLength, afterLength - beforeLength);

                _logger.LogDebug("[SHARE-BUTTON-INJECTION] Injected SHARE button for asset {AssetId} ({AssetType})",
                    asset.AssetId, asset.AssetType);
            }

            return html;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SHARE-BUTTON-INJECTION] Failed to inject share buttons");
            return html;
        }
    }

    /// <summary>
    /// Generate share button HTML for an asset with unique ID attribute.
    /// ID format: share-btn-{assetType}-{assetId}
    /// </summary>
    private string GenerateShareButton(long assetId, string assetType)
    {
        var buildTimestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
        _logger.LogInformation("🏗️ [BUILD-TRACKER] GenerateShareButton executing - Build Time: {BuildTime} UTC", buildTimestamp);

        // HTML-encode asset type for safety
        var escapedAssetType = System.Web.HttpUtility.HtmlEncode(assetType);

        // Generate unique button ID: share-btn-{assetType}-{assetId}
        var buttonId = $"share-btn-{assetType.ToLowerInvariant().Replace(" ", "-")}-{assetId}";

        _logger.LogDebug("[SHARE-BUTTON-INJECTION] Generated button ID: {ButtonId} for AssetId: {AssetId}, Type: {AssetType}",
            buttonId, assetId, assetType);

        var buttonHtml = $@"<button id=""{buttonId}"" data-share-button=""asset"" data-asset-id=""{assetId}"" data-asset-type=""{escapedAssetType}"" class=""ks-share-btn"" type=""button"" aria-label=""Share {escapedAssetType} asset #{assetId}"">SHARE</button>";

        _logger.LogInformation("✅ [BUTTON-GENERATED] Button HTML: {Html}", buttonHtml);

        return buttonHtml;
    }

    /// <summary>
    /// Inject button HTML before a container with specified data-asset-id.
    /// Wraps the asset container in a wrapper div (similar to H2 section wrapper pattern).
    /// Pattern: shareButton + wrapperDiv(assetContainer)
    /// </summary>
    private string InjectButtonBeforeContainer(string html, long assetId, string shareButtonHtml)
    {
        try
        {
            _logger.LogInformation("🔍 [CONTAINER-SEARCH] Looking for container with data-asset-id=\"{AssetId}\"", assetId);

            // Find the complete asset container element (opening tag to closing tag)
            var containerPattern = $@"<[^>]*data-asset-id=""{assetId}""[^>]*>";
            var openingTagMatch = System.Text.RegularExpressions.Regex.Match(html, containerPattern);

            if (!openingTagMatch.Success)
            {
                _logger.LogWarning("❌ [CONTAINER-NOT-FOUND] No container found with data-asset-id=\"{AssetId}\"", assetId);
                return html;
            }

            _logger.LogInformation("✅ [CONTAINER-FOUND] Match at index {Index}, matched: {Matched}",
                openingTagMatch.Index, openingTagMatch.Value.Substring(0, Math.Min(100, openingTagMatch.Value.Length)));

            // Extract tag name from opening tag to find matching closing tag
            var tagNameMatch = System.Text.RegularExpressions.Regex.Match(openingTagMatch.Value, @"<(\w+)");
            if (!tagNameMatch.Success)
            {
                _logger.LogWarning("❌ [TAG-PARSE-FAILED] Could not extract tag name from: {Tag}", openingTagMatch.Value);
                return html;
            }

            var tagName = tagNameMatch.Groups[1].Value;
            _logger.LogDebug("[WRAPPER-INJECTION] Asset tag name: {TagName}", tagName);

            // Find the matching closing tag for this element
            var closingTag = $"</{tagName}>";
            var openingTagEnd = openingTagMatch.Index + openingTagMatch.Length;
            
            // Simple approach: find the next occurrence of the closing tag
            // Note: This assumes assets don't have nested elements with same tag name
            var closingTagIndex = html.IndexOf(closingTag, openingTagEnd);
            
            if (closingTagIndex == -1)
            {
                _logger.LogWarning("❌ [CLOSING-TAG-NOT-FOUND] Could not find closing tag </{TagName}> for asset {AssetId}", 
                    tagName, assetId);
                // Fallback: just inject button before opening tag without wrapping
                html = html.Insert(openingTagMatch.Index, shareButtonHtml);
                _logger.LogInformation("⚠️ [BUTTON-INJECTED-NO-WRAP] Injected button without wrapper for asset {AssetId}", assetId);
                return html;
            }

            var closingTagEnd = closingTagIndex + closingTag.Length;

            // Extract the complete asset HTML (opening tag + content + closing tag)
            var assetHtml = html.Substring(openingTagMatch.Index, closingTagEnd - openingTagMatch.Index);
            
            _logger.LogDebug("[WRAPPER-INJECTION] Extracted asset HTML: {Length} chars", assetHtml.Length);

            // Create wrapper div with unique ID (pattern: asset-wrapper-{assetId})
            var wrapperId = $"asset-wrapper-{assetId}";
            var wrapperOpening = $@"<div id=""{wrapperId}"" class=""asset-share-wrapper"" data-wrapped-asset-id=""{assetId}"">";
            var wrapperClosing = "</div>";

            // Build the complete replacement: shareButton + wrapper(asset)
            var replacement = shareButtonHtml + wrapperOpening + assetHtml + wrapperClosing;

            // Replace the original asset HTML with the wrapped version
            html = html.Remove(openingTagMatch.Index, closingTagEnd - openingTagMatch.Index);
            html = html.Insert(openingTagMatch.Index, replacement);

            _logger.LogInformation("✅ [WRAPPER-INJECTED] Successfully wrapped asset {AssetId} in div#{WrapperId} with share button", 
                assetId, wrapperId);

            return html;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SHARE-BUTTON-INJECTION] Failed to inject button for asset {AssetId}", assetId);
            return html;
        }
    }

    /// <summary>
    /// Inject data-asset-id attribute into an HTML opening tag.
    /// </summary>
    private string InjectDataAssetId(string openingTag, long assetId)
    {
        var tagEndIndex = openingTag.IndexOf('>');
        if (tagEndIndex == -1) return openingTag;

        var attributeToInsert = $" data-asset-id=\"{assetId}\"";
        return openingTag.Insert(tagEndIndex, attributeToInsert);
    }

    // DTO classes for API responses
    public class SessionAssetDto
    {
        public long AssetId { get; set; }
        public string AssetType { get; set; } = string.Empty;
        public string AssetSelector { get; set; } = string.Empty;
        public int? Position { get; set; }
    }

    public class SessionAssetsResponse
    {
        public List<SessionAssetDto> Assets { get; set; } = new();
    }
}
