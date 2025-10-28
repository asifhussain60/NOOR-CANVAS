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
    /// Transforms transcript HTML by removing delete buttons and adding share buttons for assets
    /// Share buttons are only injected when session status is "Active" or "Waiting".
    /// </summary>
    /// <param name="originalHtml">The original HTML content to transform.</param>
    /// <param name="sessionId">The session ID for logging and processing.</param>
    /// <param name="sessionStatus">The session status to determine if share buttons should be injected.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<string> TransformTranscriptHtmlAsync(string originalHtml, int? sessionId, string? sessionStatus)
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
                _logger.LogInformation("G�� Calling InjectAssetShareButtonsAsync - Session {SessionId} status '{SessionStatus}'",
                    sessionId, sessionStatus);

                finalHtml = await InjectAssetShareButtonsAsync(sanitizedInput ?? string.Empty, transformRunId);

                _logger.LogInformation("G�� InjectAssetShareButtonsAsync completed - Output length: {OutputLength}",
                    finalHtml?.Length ?? 0);
            }
            else
            {
                _logger.LogWarning("G�� Skipping share button injection - Session {SessionId} status '{SessionStatus}' (HTML: {HasHTML}chars)",
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
    /// <param name="html">The HTML content to process for asset detection.</param>
    /// <param name="runId">The unique identifier for this transformation run.</param>
    /// <returns>The transformed HTML with share buttons injected for detected assets.</returns>
    public async Task<string> InjectAssetShareButtonsAsync(string html, string runId)
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
            _logger.LogInformation("[ASSETSHARE-DB:{RunId}] Asset grouping complete - created {TotalMatches} asset containers",
                runId, totalMatches);
            _logger.LogInformation("[ASSET-SHARE-TIMING:{RunId}] ?? DOM WRAPPING COMPLETE: {ContainerCount} asset containers created at {Time}",
                runId, totalMatches, DateTime.Now.ToString("HH:mm:ss.fff"));
            _logger.LogInformation("[ASSET-SHARE-TIMING:{RunId}] ? NOTE: JavaScript menu handlers will be attached separately - watch for timing gaps",
                runId);
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
                _logger.LogInformation("[ASSETSHARE-DB:{RunId}] G�� FOUND {Count} instances of {AssetType} using selector '{Selector}'",
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
                _logger.LogWarning("[ASSETSHARE-DB:{RunId}] G�� NO MATCHES found for {AssetType} with selector '{Selector}'",
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
    /// Process individual asset element and wrap it in a grouped container with header and menu.
    /// </summary>
    private void ProcessAssetElement(IElement element, AssetLookupDto assetLookup, int instanceNumber, string runId, HtmlParser parser)
    {
        // Use AssetType for consistent share ID generation (e.g., asset-inserted-hadees-1)
        var shareId = $"asset-{assetLookup.AssetType}-{instanceNumber}";

        var buttonCreateTime = DateTime.Now;
        _logger.LogDebug("[ASSETSHARE-DB:{RunId}] Wrapping asset element {Instance} with grouped container, shareId: {ShareId}",
            runId, instanceNumber, shareId);
        _logger.LogInformation("[ASSET-SHARE-TIMING:{RunId}] ?? CONTAINER CREATION START: shareId={ShareId}, assetType={AssetType}, time={Time}",
            runId, shareId, assetLookup.AssetType, buttonCreateTime.ToString("HH:mm:ss.fff"));

        // Add data-asset-id to the element for JavaScript matching
        element.SetAttribute("data-asset-id", shareId);

        // Create container header with title and kebab menu
        var containerHeader = CreateAssetContainerHeaderHtml(
            assetLookup.AssetType,
            assetLookup.DisplayName ?? assetLookup.AssetType,
            shareId,
            instanceNumber);

        // Create container footer
        var containerFooter = CreateAssetContainerFooterHtml();

        // Wrap the asset element with the container
        if (element.ParentElement != null)
        {
            // Parse and insert header before the asset element
            var headerDoc = parser.ParseFragment(containerHeader, element.ParentElement);
            var headerNodes = headerDoc.ToList();
            foreach (var headerNode in headerNodes)
            {
                // Insert header before the element
                element.ParentElement.InsertBefore(headerNode, element);
                
                // Find the .asset-content-wrapper div that was just inserted
                if (headerNode is IElement headerElement)
                {
                    var contentWrapper = headerElement.QuerySelector(".asset-content-wrapper");
                    if (contentWrapper != null)
                    {
                        // CRITICAL FIX: Move the element INSIDE the .asset-content-wrapper
                        element.Remove();  // Remove from current position
                        contentWrapper.AppendChild(element);  // Move inside wrapper
                        
                        _logger.LogInformation("[INSERTED-HADEES-DEBUG:{RunId}] MOVED element inside .asset-content-wrapper for {ShareId}",
                            runId, shareId);
                    }
                    else
                    {
                        _logger.LogWarning("[INSERTED-HADEES-DEBUG:{RunId}] .asset-content-wrapper not found in header for {ShareId}",
                            runId, shareId);
                    }
                }
            }

            // Parse and insert footer after the header (header now contains the element)
            var footerDoc = parser.ParseFragment(containerFooter, element.ParentElement);
            var footerNodes = footerDoc.ToList();
            
            // Insert footer after the header container
            var headerContainer = element.ParentElement?.ParentElement;  // The .asset-group-container
            if (headerContainer?.ParentElement != null)
            {
                var nextSibling = headerContainer.NextSibling;
                foreach (var footerNode in footerNodes)
                {
                    if (nextSibling != null)
                    {
                        headerContainer.ParentElement.InsertBefore(footerNode, nextSibling);
                    }
                    else
                    {
                        headerContainer.ParentElement.AppendChild(footerNode);
                    }
                }
            }

            _logger.LogDebug("[ASSETSHARE-DB:{RunId}] Asset wrapped successfully in grouped container for {ShareId}",
                runId, shareId);
            
            // Log completion timing for DOM debugging
            var containerCompleteTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            _logger.LogInformation("[DOM-TIMING] Asset container creation completed at {ContainerCompleteTime}ms for asset {ShareId}",
                containerCompleteTime, shareId);
        }
        else
        {
            _logger.LogWarning("[ASSETSHARE-DB:{RunId}] Element has no parent - cannot wrap in container for {ShareId}",
                runId, shareId);
        }
    }

    /// <summary>
    /// Get asset lookups from API.
    /// </summary>
    /// <param name="runId">The run ID for logging and tracking.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
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
    /// Create HTML for asset grouping container with header and kebab menu.
    /// Container wraps around the asset content with title, menu, and visual grouping.
    /// </summary>
    private static string CreateAssetContainerHeaderHtml(string assetType, string displayName, string shareId, int instanceNumber)
    {
        // HTML-encode all user-provided values to prevent parsing errors
        var encodedAssetType = System.Web.HttpUtility.HtmlEncode(assetType);
        var encodedDisplayName = System.Web.HttpUtility.HtmlEncode(displayName);
        var encodedShareId = System.Web.HttpUtility.HtmlEncode(shareId);

        // [WORKITEM:hcp-fab-button] Blue Share Asset bar + Golden wrapper (both elements preserved) ;CLEANUP_OK
        // Blue action bar with Share Asset button (broadcasts via SignalR)
        var blueShareBar = CreateShareButtonHtml(encodedAssetType, encodedDisplayName, encodedShareId, instanceNumber);
        
        // Asset grouping container with header (golden wrapper from HCP-Fab Button.txt)
        // [DEBUG-WORKITEM:hcp-fab-button] Added right-aligned FAB button to asset header with data attributes for sharing ;CLEANUP_OK
        return blueShareBar +
               $@"<div class=""asset-group-container"" data-noor-asset-group=""true"" data-share-id=""{encodedShareId}"" data-asset-type=""{encodedAssetType}"" style=""background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #0056b3; border-radius: 12px; padding: 20px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); position: relative; transition: all 0.3s ease;"" onmouseover=""this.style.boxShadow='0 8px 12px rgba(0, 0, 0, 0.15)'; this.style.borderColor='#003d82';"" onmouseout=""this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'; this.style.borderColor='#0056b3';"">" +
               $@"<div class=""asset-header"" style=""display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #0056b3;"">" +
               $@"<h3 class=""asset-title"" style=""margin: 0; color: #0056b3; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center;""><i class=""fas fa-cube"" style=""margin-right: 8px; color: #007bff;""></i>{encodedDisplayName}</h3>" +
               $@"<button type=""button"" class=""asset-header-fab-button"" data-share-id=""{encodedShareId}"" data-asset-type=""{encodedAssetType}"" data-instance-number=""{instanceNumber}"" aria-label=""Share asset"" style=""width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background-color: #E9D5FF; color: #6B21A8; border: 1px solid #6B21A8; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 4px rgba(107, 33, 168, 0.2); transition: all 0.2s ease;"" onmouseover=""this.style.backgroundColor='#DDD6FE'; this.style.transform='scale(1.05)';"" onmouseout=""this.style.backgroundColor='#E9D5FF'; this.style.transform='scale(1)';""><i class=""fa-solid fa-ellipsis-vertical"" style=""font-size: 1.5rem;""></i></button>" +
               $@"</div>" +
               $@"<div class=""asset-content-wrapper"" style=""padding: 16px 0;"">";
    }

    /// <summary>
    /// Create blue Share Asset button bar with SignalR broadcast functionality.
    /// </summary>
    private static string CreateShareButtonHtml(string assetType, string displayName, string shareId, int instanceNumber)
    {
        return $@"<div class=""action-wrapper"" style=""background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 12px 20px; border-radius: 8px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);"">" +
               $@"<div style=""color: white; font-weight: 600; font-size: 0.95rem;"">" +
               $@"<i class=""fas fa-cube"" style=""margin-right: 8px;""></i>{displayName}" +
               $@"</div>" +
               $@"<button class=""ks-share-button"" data-share-id=""{shareId}"" data-asset-type=""{assetType}"" data-instance-number=""{instanceNumber}"" type=""button"" style=""background: white; color: #1e40af; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"" onmouseover=""this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"" onmouseout=""this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"">" +
               $@"<i class=""fas fa-share-nodes"" style=""margin-right: 6px;""></i>Share Asset" +
               $@"</button>" +
               $@"</div>";
    }

    /// <summary>
    /// Create closing HTML for asset grouping container.
    /// </summary>
    private static string CreateAssetContainerFooterHtml()
    {
        return @"</div></div>";
    }

    /// <summary>
    /// Removes any button elements that have 'delete' in their id or class attributes.
    /// Uses centralized pattern from HtmlTransformPatterns for consistency.
    /// </summary>
    private static string RemoveDeleteButtons(string html)
    {
        return HtmlTransformPatterns.DeleteButtonPattern().Replace(html, string.Empty);
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
    private static string WrapInTranscriptContainer(string html)
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
