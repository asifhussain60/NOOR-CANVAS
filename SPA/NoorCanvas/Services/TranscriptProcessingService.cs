using System.Text.Json;
using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NoorCanvas.Controllers;
using NoorCanvas.Data;
using NoorCanvas.Models;
using NoorCanvas.Models.DTOs;

namespace NoorCanvas.Services;

/// <summary>
/// [PHASE-1:hcp-cleanup] Service for processing transcript HTML content
/// Extracted from HostControlPanel.razor to separate business logic from UI layer
/// Provides API-consumable methods for transcript transformation and asset detection
/// </summary>
public class TranscriptProcessingService
{
    private readonly ILogger<TranscriptProcessingService> _logger;
    private readonly KSessionsDbContext _kSessionsContext;
    private readonly IHttpClientFactory _httpClientFactory;

    public TranscriptProcessingService(
        ILogger<TranscriptProcessingService> logger,
        KSessionsDbContext kSessionsContext,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _kSessionsContext = kSessionsContext;
        _httpClientFactory = httpClientFactory;
    }

    #region Transcript Retrieval

    /// <summary>
    /// Get transcript HTML from KSESSIONS database by session ID
    /// </summary>
    /// <param name="sessionId">Session ID to retrieve transcript for</param>
    /// <returns>Transcript response with HTML content and metadata</returns>
    public async Task<TranscriptResponse?> GetTranscriptAsync(long sessionId)
    {
        try
        {
            _logger.LogInformation("[PHASE-1:hcp-cleanup] Getting transcript for session {SessionId}", sessionId);

            var transcript = await _kSessionsContext.SessionTranscripts
                .Where(st => st.SessionId == sessionId)
                .Select(st => new
                {
                    st.SessionId,
                    st.Transcript,
                    st.ChangedDate
                })
                .FirstOrDefaultAsync();

            if (transcript == null)
            {
                _logger.LogWarning("[PHASE-1:hcp-cleanup] No transcript found for session {SessionId}", sessionId);
                return null;
            }

            return new TranscriptResponse
            {
                SessionId = transcript.SessionId,
                Transcript = transcript.Transcript ?? string.Empty,
                LastUpdated = transcript.ChangedDate ?? DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PHASE-1:hcp-cleanup] Failed to retrieve transcript for session {SessionId}", sessionId);
            throw;
        }
    }

    #endregion

    #region Transcript Transformation

    /// <summary>
    /// Transform transcript HTML by removing delete buttons, share buttons, and asset attributes
    /// Consolidates logic previously scattered across HostControlPanel.razor
    /// </summary>
    /// <param name="sessionId">Session ID for logging</param>
    /// <param name="html">HTML content to transform</param>
    /// <param name="transformationType">Type of transformation to apply</param>
    /// <returns>Transformed HTML content</returns>
    public Task<TransformTranscriptResponse> TransformTranscriptAsync(
        long sessionId,
        string html,
        TransformationType transformationType)
    {
        try
        {
            if (string.IsNullOrEmpty(html))
            {
                throw new ArgumentException("HTML content cannot be empty", nameof(html));
            }

            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] Transforming transcript for session {SessionId}, type: {TransformationType}, length: {Length}",
                sessionId, transformationType, html.Length);

            var transformedHtml = transformationType switch
            {
                TransformationType.RemoveDeleteButtons => RemoveDeleteButtons(html),
                TransformationType.RemoveShareButtons => RemoveShareButtons(html),
                TransformationType.RemoveAssetAttributes => RemoveAssetAttributes(html),
                TransformationType.Full => ApplyFullTransformation(html),
                _ => throw new ArgumentException($"Unknown transformation type: {transformationType}", nameof(transformationType))
            };

            return Task.FromResult(new TransformTranscriptResponse
            {
                SessionId = sessionId,
                TransformedHtml = transformedHtml,
                TransformationType = transformationType.ToString(),
                OriginalLength = html.Length,
                TransformedLength = transformedHtml.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[PHASE-1:hcp-cleanup] Failed to transform transcript for session {SessionId}",
                sessionId);
            throw;
        }
    }

    /// <summary>
    /// Remove delete buttons from HTML using regex
    /// Pattern: button elements with 'delete' in class attribute
    /// </summary>
    private string RemoveDeleteButtons(string html)
    {
        _logger.LogDebug("[PHASE-1:hcp-cleanup] Removing delete buttons");

        var result = Regex.Replace(
            html,
            @"<button[^>]*class\s*=\s*[""'][^""']*delete[^""']*[""'][^>]*>.*?</button>",
            string.Empty,
            RegexOptions.Singleline | RegexOptions.IgnoreCase);

        return result;
    }

    /// <summary>
    /// Remove individual asset share buttons from HTML using regex
    /// Pattern: button elements with onclick='shareIndividualAsset(...)'
    /// </summary>
    private string RemoveShareButtons(string html)
    {
        _logger.LogDebug("[PHASE-1:hcp-cleanup] Removing share buttons");

        var result = Regex.Replace(
            html,
            @"<button[^>]*onclick\s*=\s*[""']shareIndividualAsset\([^)]*\)[""'][^>]*>.*?</button>",
            string.Empty,
            RegexOptions.Singleline | RegexOptions.IgnoreCase);

        return result;
    }

    /// <summary>
    /// Remove data-asset-id attributes from HTML using regex
    /// Cleans up markup for broadcast to participants
    /// </summary>
    private string RemoveAssetAttributes(string html)
    {
        _logger.LogDebug("[PHASE-1:hcp-cleanup] Removing asset attributes");

        var result = Regex.Replace(
            html,
            @"\s+data-asset-id\s*=\s*[""'][^""']*[""']",
            string.Empty,
            RegexOptions.IgnoreCase);

        return result;
    }

    /// <summary>
    /// Apply all transformations sequentially
    /// This matches the existing behavior in HostControlPanel.TransformTranscriptForBroadcastAsync
    /// </summary>
    private string ApplyFullTransformation(string html)
    {
        _logger.LogDebug("[PHASE-1:hcp-cleanup] Applying full transformation");

        var result = html;
        result = RemoveDeleteButtons(result);
        result = RemoveShareButtons(result);
        result = RemoveAssetAttributes(result);

        return result;
    }

    #endregion

    #region Asset Detection

    /// <summary>
    /// Detect sharable assets in transcript HTML using AssetLookup definitions
    /// Uses AngleSharp for CSS selector-based detection
    /// </summary>
    /// <param name="sessionId">Session ID for logging</param>
    /// <param name="html">HTML content to analyze</param>
    /// <returns>Asset detection results with breakdown by type</returns>
    public async Task<AssetDetectionResponse> DetectAssetsAsync(long sessionId, string html)
    {
        try
        {
            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] Detecting assets for session {SessionId}, HTML length: {Length}",
                sessionId, html.Length);

            // Get AssetLookup definitions from API (or database)
            var assetLookups = await GetAssetLookupDefinitionsAsync();

            // Parse HTML with AngleSharp
            var parser = new HtmlParser();
            var document = parser.ParseDocument(html);

            var assetBreakdown = new List<AssetBreakdownItem>();
            var totalAssets = 0;

            foreach (var lookup in assetLookups.Where(a => a.IsActive && !string.IsNullOrEmpty(a.CssSelector)))
            {
                var elements = document.QuerySelectorAll(lookup.CssSelector ?? string.Empty);
                var count = elements.Length;

                if (count > 0)
                {
                    totalAssets += count;
                    assetBreakdown.Add(new AssetBreakdownItem
                    {
                        AssetType = lookup.AssetIdentifier ?? "Unknown",
                        Count = count,
                        Selector = lookup.CssSelector ?? string.Empty,
                        DisplayName = lookup.DisplayName ?? lookup.AssetIdentifier ?? "Unknown"
                    });

                    _logger.LogDebug(
                        "[PHASE-1:hcp-cleanup] Found {Count} instances of {AssetType} using selector '{Selector}'",
                        count, lookup.AssetIdentifier, lookup.CssSelector);
                }
            }

            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] Asset detection complete for session {SessionId}: {TotalAssets} total assets",
                sessionId, totalAssets);

            return new AssetDetectionResponse
            {
                SessionId = sessionId,
                TotalAssets = totalAssets,
                AssetBreakdown = assetBreakdown
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[PHASE-1:hcp-cleanup] Failed to detect assets for session {SessionId}",
                sessionId);
            throw;
        }
    }

    /// <summary>
    /// Get AssetLookup definitions from API or database
    /// TODO: Replace with actual API call to /api/host/asset-lookup
    /// </summary>
    private async Task<List<AssetLookupDto>> GetAssetLookupDefinitionsAsync()
    {
        try
        {
            // For Phase 1, use HTTP client to call existing API
            using var httpClient = _httpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync("/api/host/asset-lookup");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "[PHASE-1:hcp-cleanup] Failed to get AssetLookup data: {StatusCode}",
                    response.StatusCode);
                return new List<AssetLookupDto>();
            }

            var content = await response.Content.ReadAsStringAsync();
            var assetLookups = JsonSerializer.Deserialize<List<AssetLookupDto>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<AssetLookupDto>();

            _logger.LogDebug(
                "[PHASE-1:hcp-cleanup] Loaded {Count} asset lookup definitions",
                assetLookups.Count);

            return assetLookups;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[PHASE-1:hcp-cleanup] Failed to load AssetLookup definitions");
            return new List<AssetLookupDto>();
        }
    }

    #endregion
}

#region Response DTOs

/// <summary>
/// Response model for GetTranscriptAsync
/// </summary>
public class TranscriptResponse
{
    /// <summary>
    /// Session ID
    /// </summary>
    public long SessionId { get; set; }

    /// <summary>
    /// Transcript HTML content
    /// </summary>
    public string Transcript { get; set; } = string.Empty;

    /// <summary>
    /// Last updated timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Response model for TransformTranscriptAsync
/// </summary>
public class TransformTranscriptResponse
{
    /// <summary>
    /// Session ID
    /// </summary>
    public long SessionId { get; set; }

    /// <summary>
    /// Transformed HTML content
    /// </summary>
    public string TransformedHtml { get; set; } = string.Empty;

    /// <summary>
    /// Type of transformation applied
    /// </summary>
    public string TransformationType { get; set; } = string.Empty;

    /// <summary>
    /// Original HTML length in characters
    /// </summary>
    public int OriginalLength { get; set; }

    /// <summary>
    /// Transformed HTML length in characters
    /// </summary>
    public int TransformedLength { get; set; }
}

/// <summary>
/// Response model for DetectAssetsAsync
/// </summary>
public class AssetDetectionResponse
{
    /// <summary>
    /// Session ID
    /// </summary>
    public long SessionId { get; set; }

    /// <summary>
    /// Total number of detected assets
    /// </summary>
    public int TotalAssets { get; set; }

    /// <summary>
    /// Asset breakdown by type
    /// </summary>
    public List<AssetBreakdownItem> AssetBreakdown { get; set; } = new();
}

/// <summary>
/// Asset breakdown by type
/// </summary>
public class AssetBreakdownItem
{
    /// <summary>
    /// Asset type identifier
    /// </summary>
    public string AssetType { get; set; } = string.Empty;

    /// <summary>
    /// Number of assets found of this type
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// CSS selector used for detection
    /// </summary>
    public string Selector { get; set; } = string.Empty;

    /// <summary>
    /// Display name for this asset type
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
}

/// <summary>
/// Transformation type enumeration
/// </summary>
public enum TransformationType
{
    /// <summary>
    /// Remove delete buttons from HTML
    /// </summary>
    RemoveDeleteButtons,

    /// <summary>
    /// Remove share buttons from HTML
    /// </summary>
    RemoveShareButtons,

    /// <summary>
    /// Remove data-asset-id attributes from HTML
    /// </summary>
    RemoveAssetAttributes,

    /// <summary>
    /// Apply all transformations
    /// </summary>
    Full
}

#endregion
