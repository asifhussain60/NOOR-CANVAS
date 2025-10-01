using Microsoft.Extensions.Logging;
using NoorCanvas.Controllers;
using System.Text.Json;
using AngleSharp.Html.Parser;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for handling host asset operations including detection, processing, and sharing
    /// Extracted from HostControlPanel.razor for better separation of concerns.
    /// </summary>
    public class HostAssetService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<HostAssetService> _logger;
        private readonly AssetProcessingService _assetProcessor;

        public HostAssetService(
            IHttpClientFactory httpClientFactory,
            ILogger<HostAssetService> logger,
            AssetProcessingService assetProcessor)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _assetProcessor = assetProcessor;
        }

        /// <summary>
        /// Detect shareable assets using AssetLookup API and SessionTranscripts.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<string> DetectShareableAssetsAsync(int sessionId)
        {
            try
            {
                _logger.LogInformation("[HostAssetService:DetectShareableAssets] Starting asset detection for session {SessionId}", sessionId);

                // Get AssetLookup definitions from API
                using var httpClient = _httpClientFactory.CreateClient("default");
                var assetLookupResponse = await httpClient.GetAsync("/api/host/asset-lookup");

                if (!assetLookupResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[HostAssetService:DetectShareableAssets] Failed to get AssetLookup data: {StatusCode}", assetLookupResponse.StatusCode);
                    return "AssetLookup API Error";
                }

                var assetLookupContent = await assetLookupResponse.Content.ReadAsStringAsync();
                var assetLookups = JsonSerializer.Deserialize<List<AssetLookupDto>>(assetLookupContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<AssetLookupDto>();

                _logger.LogInformation("[HostAssetService:DetectShareableAssets] Loaded {Count} asset lookup definitions", assetLookups.Count);

                // Get SessionTranscripts for the session
                var sessionDetailsResponse = await httpClient.GetAsync($"/api/host/session-details/{sessionId}?guid=asset-detection");

                if (!sessionDetailsResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[HostAssetService:DetectShareableAssets] Failed to get session {SessionId} details: {StatusCode}", sessionId, sessionDetailsResponse.StatusCode);
                    return "Session API Error";
                }

                var sessionDetailsContent = await sessionDetailsResponse.Content.ReadAsStringAsync();
                var sessionDetails = JsonSerializer.Deserialize<EnhancedSessionDetailsApiResponse>(sessionDetailsContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (sessionDetails?.Session == null)
                {
                    _logger.LogWarning("[HostAssetService:DetectShareableAssets] No session details found for session {SessionId}", sessionId);
                    return "Session Not Found";
                }

                var transcript = sessionDetails.Session.Transcript ?? "";
                _logger.LogInformation("[HostAssetService:DetectShareableAssets] Retrieved transcript, length: {Length} chars", transcript.Length);

                // Count assets found in transcript using AssetLookup CSS selectors
                var parser = new HtmlParser();
                var document = parser.ParseDocument(transcript);
                int totalAssetsFound = 0;
                var assetCounts = new List<string>();

                foreach (var lookup in assetLookups.Where(a => a.IsActive && !string.IsNullOrEmpty(a.CssSelector)))
                {
                    var elements = document.QuerySelectorAll(lookup.CssSelector ?? "");
                    if (elements.Length > 0)
                    {
                        totalAssetsFound += elements.Length;
                        assetCounts.Add($"{lookup.DisplayName ?? lookup.AssetIdentifier}: {elements.Length}");

                        _logger.LogInformation("[HostAssetService:DetectShareableAssets] Found {Count} instances of {AssetType} using selector '{Selector}'",
                            elements.Length, lookup.AssetIdentifier, lookup.CssSelector);
                    }
                }

                _logger.LogInformation("[HostAssetService:DetectShareableAssets] Asset detection complete: {Total} total assets found in session {SessionId}", totalAssetsFound, sessionId);

                if (totalAssetsFound == 0)
                {
                    return $"No sharable assets found in session {sessionId}";
                }

                return $"Found {totalAssetsFound} sharable assets in session {sessionId}: {string.Join(", ", assetCounts)}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HostAssetService:DetectShareableAssets] Exception during asset detection for session {SessionId}", sessionId);
                return $"Asset detection failed: {ex.Message}";
            }
        }

        /// <summary>
        /// Load session assets from the SessionAssets API.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<List<SessionAssetDto>?> LoadSessionAssetsAsync(long sessionId)
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient("default");
                var response = await httpClient.GetAsync($"/api/host/sessions/{sessionId}/assets");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[HostAssetService:LoadSessionAssets] Failed to load assets from API, status: {StatusCode}", response.StatusCode);
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
                _logger.LogError(ex, "[HostAssetService:LoadSessionAssets] Exception loading assets from API for session {SessionId}", sessionId);
                return new List<SessionAssetDto>();
            }
        }

        /// <summary>
        /// Extract raw asset HTML directly from transcript using simple pattern matching.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public Task<string> ExtractRawAssetHtml(string? sessionTranscript, string shareId, string assetType, int instanceNumber)
        {
            try
            {
                if (string.IsNullOrEmpty(sessionTranscript))
                {
                    _logger.LogError("[HostAssetService:ExtractRawAssetHtml] SessionTranscript is null or empty");
                    return Task.FromResult(string.Empty);
                }

                _logger.LogInformation("[HostAssetService:ExtractRawAssetHtml] Extracting raw asset HTML using simple pattern matching: {AssetType}", assetType);

                // Use simple HTML parsing to extract asset content directly from original transcript
                var htmlDoc = new HtmlAgilityPack.HtmlDocument();
                htmlDoc.LoadHtml(sessionTranscript);

                // Find ayah-card elements (or other asset types) directly
                var assetElements = htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'ayah-card')]");

                if (assetElements != null && assetElements.Count > instanceNumber - 1)
                {
                    var targetElement = assetElements[instanceNumber - 1];
                    var rawHtml = targetElement.OuterHtml;

                    _logger.LogInformation("[HostAssetService:ExtractRawAssetHtml] Successfully extracted raw asset HTML: {Length} chars", rawHtml.Length);
                    return Task.FromResult(rawHtml);
                }
                else
                {
                    _logger.LogWarning("[HostAssetService:ExtractRawAssetHtml] Asset element not found: {AssetType} instance {Instance}", assetType, instanceNumber);
                    return Task.FromResult(string.Empty);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HostAssetService:ExtractRawAssetHtml] Error extracting raw asset HTML: {AssetType}", assetType);
                return Task.FromResult(string.Empty);
            }
        }

        // DTO classes for asset operations
        public class SessionAssetDto
        {
            public long AssetId { get; set; }
            public string AssetType { get; set; } = string.Empty;
            public string AssetSelector { get; set; } = string.Empty;
            public int? Position { get; set; }
            public bool IsShared { get; set; }
            public DateTime? SharedAt { get; set; }
        }

        public class SessionAssetsResponse
        {
            public long SessionId { get; set; }
            public int TotalAssets { get; set; }
            public int SharedAssets { get; set; }
            public Dictionary<string, int> AssetsByType { get; set; } = new();
            public List<SessionAssetDto> Assets { get; set; } = new();
            public string? RequestId { get; set; }
        }

        public class AssetLookupDto
        {
            public long AssetId { get; set; }
            public string AssetIdentifier { get; set; } = "";
            public string? CssSelector { get; set; }
            public string? DisplayName { get; set; }
            public string AssetType { get; set; } = "";
            public bool IsActive { get; set; }
        }

        public class EnhancedSessionDetailsApiResponse
        {
            public bool Success { get; set; }
            public string? Message { get; set; }
            public SessionDetailsDto? Session { get; set; }
            public int TotalCount { get; set; }
        }

        public class SessionDetailsDto
        {
            public int SessionId { get; set; }
            public string SessionName { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? Transcript { get; set; }
            public int GroupId { get; set; }
            public int CategoryId { get; set; }
            public DateTime? SessionDate { get; set; }
            public string? MediaPath { get; set; }
            public int? SpeakerId { get; set; }
            public bool? IsActive { get; set; }
            public DateTime? CreatedDate { get; set; }
            public DateTime? ChangedDate { get; set; }
            public string? GroupName { get; set; }
            public string? CategoryName { get; set; }
            public string? SpeakerName { get; set; }
        }
    }
}