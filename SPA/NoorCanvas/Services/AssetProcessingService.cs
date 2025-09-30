using Microsoft.Extensions.Logging;
using System.Text.Json;
using AngleSharp.Html.Parser;
using AngleSharp.Dom;
using NoorCanvas.Models;
using NoorCanvas.Controllers;

namespace NoorCanvas.Services;

/// <summary>
/// Service for processing assets in transcript HTML content
/// Extracted from HostControlPanel for separation of concerns.
/// </summary>
public class AssetProcessingService
{
    private readonly ILogger<AssetProcessingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    /// <summary>
    /// Initializes a new instance of the <see cref="AssetProcessingService"/> class.
    /// </summary>
    /// <param name="logger">The logger instance.</param>
    /// <param name="httpClientFactory">The HTTP client factory.</param>
    public AssetProcessingService(ILogger<AssetProcessingService> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Transforms transcript HTML by removing delete buttons and adding share buttons for assets.
    /// Share buttons are only injected when session status is "Active" or "Waiting".
    /// </summary>
    /// <param name="originalHtml">The original HTML transcript content to transform.</param>
    /// <param name="sessionId">The session ID for asset processing.</param>
    /// <param name="sessionStatus">The current session status for injection control.</param>
    /// <returns>The transformed HTML with injected share buttons and data attributes.</returns>
    public async Task<string> TransformTranscriptHtmlAsync(string originalHtml, long? sessionId, string? sessionStatus)
    {
        if (string.IsNullOrEmpty(originalHtml))
        {
            return originalHtml ?? string.Empty;
        }

        try
        {
            _logger.LogDebug("Starting HTML transformation for SessionId {SessionId}, SessionStatus: {SessionStatus}", 
                sessionId, sessionStatus);
            
            // Remove buttons that have 'delete' in their id or class attributes
            var htmlWithoutDeletes = RemoveDeleteButtons(originalHtml);
            
            // Sanitize incoming HTML to remove dangerous elements/attributes
            var sanitizedInput = SanitizeHtml(htmlWithoutDeletes);

            // Inject share buttons when session has transcript and is in appropriate status
            bool shouldInjectButtons = !string.IsNullOrEmpty(sanitizedInput) && sessionId.HasValue && 
                                     (sessionStatus == "Active" || sessionStatus == "Waiting");
            
            var transformRunId = DateTime.Now.ToString("HHmmss") + "-" + Random.Shared.Next(1000, 9999);
            
            _logger.LogInformation("TRANSFORM DECISION: SessionId={SessionId}, Status='{SessionStatus}', HasHTML={HasHTML}chars, ShouldInject={ShouldInject}", 
                sessionId, sessionStatus, sanitizedInput?.Length ?? 0, shouldInjectButtons);
            
            string finalHtml;
            if (shouldInjectButtons)
            {
                _logger.LogInformation("✅ Calling InjectAssetShareButtonsAsync - Session {SessionId} status '{SessionStatus}'", 
                    sessionId, sessionStatus);
                
                finalHtml = await InjectAssetShareButtonsAsync(sanitizedInput ?? string.Empty, transformRunId);
                
                _logger.LogInformation("✅ InjectAssetShareButtonsAsync completed - Output length: {OutputLength}", 
                    finalHtml?.Length ?? 0);
            }
            else
            {
                _logger.LogWarning("❌ Skipping share button injection - Session {SessionId} status '{SessionStatus}' (HTML: {HasHTML}chars)", 
                    sessionId, sessionStatus, sanitizedInput?.Length ?? 0);
                finalHtml = sanitizedInput ?? string.Empty;
            }
            
            _logger.LogDebug("Transformation completed. Original: {OriginalLength}, Final: {FinalLength}", 
                originalHtml?.Length ?? 0, finalHtml?.Length ?? 0);

            // Validate HTML structure before returning
            if (finalHtml != null)
            {
                ValidateHtmlStructure(finalHtml);
            }

            // Wrap final HTML in a root scoping div if not already wrapped
            return WrapInTranscriptContainer(finalHtml ?? string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HTML transformation failed: {Message}", ex.Message);
            return originalHtml ?? string.Empty;
        }
    }

    /// <summary>
    /// Database-driven asset detection using AssetLookup table
    /// Detects assets based on CSS selectors and injects share buttons.
    /// </summary>
    private async Task<string> InjectAssetShareButtonsAsync(string html, string runId)
    {
        try
        {
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Starting asset detection using AssetLookup table", runId);
            
            if (string.IsNullOrEmpty(html))
            {
                _logger.LogWarning("[ASSETSHARE-DB:{RunId}] Empty HTML provided, skipping injection", runId);
                return html;
            }
            
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Input HTML length: {Length} characters", runId, html.Length);
            
            // Get active asset types from AssetLookup API
            var assetLookups = await GetAssetLookupsFromApiAsync(runId);

            if (!assetLookups.Any())
            {
                _logger.LogWarning("[ASSETSHARE-DB:{RunId}] No active asset lookups found from API", runId);
                return html;
            }

            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Found {Count} active asset types", runId, assetLookups.Count);
            
            foreach (var lookup in assetLookups)
            {
                _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Asset Type: {Identifier} - Selector: '{Selector}' - Display: '{Display}'", 
                    runId, lookup.AssetIdentifier, lookup.CssSelector, lookup.DisplayName);
            }

            // Parse HTML document for CSS selector matching
            var parser = new HtmlParser();
            var document = parser.ParseDocument(html);
            var totalMatches = 0;

            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Document parsed - Body length: {BodyLength}", 
                runId, document.Body?.InnerHtml?.Length ?? 0);

            // Process each asset type from database (reverse order to maintain positions)
            foreach (var assetLookup in assetLookups.AsEnumerable().Reverse())
            {
                totalMatches += await ProcessAssetType(document, assetLookup, runId, parser);
            }
            
            var finalHtml = document.Body?.InnerHtml ?? html;
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Asset detection complete - injected {TotalMatches} share buttons", 
                runId, totalMatches);
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Final HTML length: {FinalLength} (was {OriginalLength})", 
                runId, finalHtml.Length, html.Length);
                
            return finalHtml;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSETSHARE-DB:{RunId}] Failed to inject share buttons, returning original HTML", runId);
            return html;
        }
    }

    /// <summary>
    /// Process a single asset type from AssetLookup table.
    /// </summary>
    private Task<int> ProcessAssetType(IDocument document, AssetLookupDto assetLookup, string runId, HtmlParser parser)
    {
        try
        {
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Processing asset type '{AssetType}' with CSS selector '{Selector}'", 
                runId, assetLookup.AssetIdentifier, assetLookup.CssSelector);
            
            // Use CSS selector to find matching elements
            var elements = document.QuerySelectorAll(assetLookup.CssSelector ?? string.Empty);
            
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] CSS Query completed - found {ElementCount} elements for selector '{Selector}'", 
                runId, elements.Length, assetLookup.CssSelector);
            
            if (elements.Length > 0)
            {
                _logger.LogInformation("[ASSETSHARE-DB:{RunId}] ✅ FOUND {Count} instances of {AssetType} using selector '{Selector}'", 
                    runId, elements.Length, assetLookup.AssetIdentifier, assetLookup.CssSelector);
                
                // Process elements in reverse order to preserve positions
                for (int i = elements.Length - 1; i >= 0; i--)
                {
                    ProcessAssetElement(elements[i], assetLookup, i + 1, runId, parser);
                }
                
                return Task.FromResult(elements.Length);
            }
            else
            {
                _logger.LogWarning("[ASSETSHARE-DB:{RunId}] ❌ NO MATCHES found for {AssetType} with selector '{Selector}'", 
                    runId, assetLookup.AssetIdentifier, assetLookup.CssSelector);
                return Task.FromResult(0);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSETSHARE-DB:{RunId}] Failed to process asset type {AssetType} with selector '{Selector}'", 
                runId, assetLookup.AssetIdentifier, assetLookup.CssSelector);
            return Task.FromResult(0);
        }
    }

    /// <summary>
    /// Process individual asset element and inject share button.
    /// </summary>
    private void ProcessAssetElement(IElement element, AssetLookupDto assetLookup, int instanceNumber, string runId, HtmlParser parser)
    {
        var shareId = $"asset-{assetLookup.AssetIdentifier}-{instanceNumber}";
        
        _logger.LogDebug("[ASSETSHARE-DB:{RunId}] Injecting share button for element {Instance} with shareId: {ShareId}", 
            runId, instanceNumber, shareId);
        
        // Add data-asset-id to the element for JavaScript matching
        element.SetAttribute("data-asset-id", shareId);
        
        // Create share button HTML
        var shareButton = CreateShareButtonHtml(
            assetLookup.AssetIdentifier,
            assetLookup.DisplayName ?? assetLookup.AssetIdentifier,
            shareId,
            instanceNumber);
        
        // Parse share button and insert before the asset element
        if (element.ParentElement != null)
        {
            var buttonDoc = parser.ParseFragment(shareButton, element.ParentElement);
            foreach (var buttonNode in buttonDoc)
            {
                element.ParentElement.InsertBefore(buttonNode, element);
            }
            _logger.LogDebug("[ASSETSHARE-DB:{RunId}] Share button injected successfully for {ShareId}", 
                runId, shareId);
        }
        else
        {
            _logger.LogWarning("[ASSETSHARE-DB:{RunId}] Element has no parent - cannot inject button for {ShareId}", 
                runId, shareId);
        }
    }

    /// <summary>
    /// Get asset lookups from API.
    /// </summary>
    /// <param name="runId">The run identifier for logging purposes.</param>
    /// <returns>List of AssetLookupDto objects from the API.</returns>
    public async Task<List<AssetLookupDto>> GetAssetLookupsFromApiAsync(string runId)
    {
        try
        {
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync("/api/host/asset-lookup");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[ASSETSHARE-API:{RunId}] Failed to load asset lookups from API, status: {StatusCode}", 
                    runId, response.StatusCode);
                return new List<AssetLookupDto>();
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var assetLookupResponse = JsonSerializer.Deserialize<AssetLookupResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (assetLookupResponse?.Success == true)
            {
                _logger.LogInformation("[ASSETSHARE-API:{RunId}] Successfully loaded {Count} asset lookups from API", 
                    runId, assetLookupResponse.AssetLookups.Count);
                return assetLookupResponse.AssetLookups;
            }
            else
            {
                _logger.LogWarning("[ASSETSHARE-API:{RunId}] API response indicated failure", runId);
                return new List<AssetLookupDto>();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSETSHARE-API:{RunId}] Exception loading asset lookups from API", runId);
            return new List<AssetLookupDto>();
        }
    }

    /// <summary>
    /// Create HTML for a share button based on AssetLookup data.
    /// </summary>
    private static string CreateShareButtonHtml(string assetType, string displayName, string shareId, int instanceNumber)
    {
        // HTML-encode all user-provided values to prevent parsing errors
        var encodedAssetType = System.Web.HttpUtility.HtmlEncode(assetType);
        var encodedDisplayName = System.Web.HttpUtility.HtmlEncode(displayName);
        var encodedShareId = System.Web.HttpUtility.HtmlEncode(shareId);
        
        return $@"<div class=""ks-share-wrapper"">" +
               $@"<button class=""ks-share-button ks-share-red"" data-share-button=""asset"" data-share-id=""{encodedShareId}"" data-asset-type=""{encodedAssetType}"" data-instance-number=""{instanceNumber}"" type=""button"" style=""background-color: #dc3545; color: white; border: 1px solid #dc3545; padding: 4px 8px; font-size: 12px; border-radius: 3px; cursor: pointer;"">📤 SHARE {encodedDisplayName.ToUpper()} #{instanceNumber}</button></div>";
    }

    /// <summary>
    /// Removes any button elements that have 'delete' in their id or class attributes.
    /// </summary>
    private static string RemoveDeleteButtons(string html)
    {
        var deleteButtonPattern = @"<button[^>]*(?:id[^=]*=[^""\s]*""[^""]*delete[^""]*""|class[^=]*=[^""\s]*""[^""]*delete[^""]*"")[^>]*>.*?</button>";
        return System.Text.RegularExpressions.Regex.Replace(html, deleteButtonPattern, "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    /// <summary>
    /// Basic HTML sanitization to remove dangerous elements and attributes.
    /// </summary>
    private string SanitizeHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;

        try
        {
            var parser = new HtmlParser();
            var document = parser.ParseDocument(html);

            // Remove hazardous elements entirely
            var removeSelectors = new[] { "script", "style", "iframe", "object", "embed", "link" };
            foreach (var sel in removeSelectors)
            {
                var nodes = document.QuerySelectorAll(sel).ToArray();
                foreach (var n in nodes) n.Remove();
            }

            // Sanitize attributes on all elements
            foreach (var element in document.All)
            {
                SanitizeElementAttributes(element);
            }

            // Return sanitized HTML
            var body = document.Body;
            if (body != null)
            {
                return string.Concat(body.ChildNodes.Select(n => n is IElement el ? el.OuterHtml : n.TextContent));
            }

            return document.DocumentElement?.OuterHtml ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SanitizeHtml failed, returning original HTML as fallback");
            return html;
        }
    }

    /// <summary>
    /// Sanitize attributes on a single element.
    /// </summary>
    private static void SanitizeElementAttributes(IElement element)
    {
        var toRemove = new List<string>();
        foreach (var attr in element.Attributes)
        {
            var name = attr.Name ?? string.Empty;
            
            // Remove event handlers (onclick, onerror, etc.)
            if (name.StartsWith("on", StringComparison.OrdinalIgnoreCase))
            {
                toRemove.Add(name);
                continue;
            }

            // Remove style attribute to avoid inline CSS attacks
            if (string.Equals(name, "style", StringComparison.OrdinalIgnoreCase))
            {
                toRemove.Add(name);
                continue;
            }

            // Ensure href/src do not use javascript: pseudo-protocol
            if (string.Equals(name, "href", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(name, "src", StringComparison.OrdinalIgnoreCase))
            {
                var val = attr.Value ?? string.Empty;
                if (val.TrimStart().StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                {
                    toRemove.Add(name);
                }
            }
        }

        foreach (var a in toRemove) 
        {
            element.RemoveAttribute(a);
        }
    }

    /// <summary>
    /// Validate HTML structure for potential issues.
    /// </summary>
    private void ValidateHtmlStructure(string html)
    {
        try
        {
            // Basic validation - check for unclosed tags that might cause issues
            if (html?.Contains("<button") == true && !html.Contains("</button>"))
            {
                _logger.LogError("Detected unclosed button tags in transformed HTML");
            }
            
            if (html?.Contains("<div") == true && (html.Split("<div").Length - 1) != (html.Split("</div>").Length - 1))
            {
                _logger.LogWarning("Potential unclosed div tags detected");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HTML validation failed: {Error}", ex.Message);
        }
    }

    /// <summary>
    /// Wrap HTML in transcript container if not already wrapped.
    /// </summary>
    private string WrapInTranscriptContainer(string html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;

        var trimmed = html.TrimStart();
        if (trimmed.StartsWith("<div class=\"ks-transcript\"") || trimmed.StartsWith("<div class='ks-transcript'"))
        {
            return html;
        }

        return $"<div class=\"ks-transcript\">{html}</div>";
    }
}