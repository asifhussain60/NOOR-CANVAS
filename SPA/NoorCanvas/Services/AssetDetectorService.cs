using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace NoorCanvas.Services;

/// <summary>
/// Service for detecting and handling shareable assets in transcript content.
/// Implements UC-L1 Detect & Share Asset workflow from NOOR-CANVAS-DESIGN.MD
/// </summary>
public class AssetDetectorService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AssetDetectorService> _logger;

    public AssetDetectorService(HttpClient httpClient, ILogger<AssetDetectorService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Gets asset detection patterns from the API for a specific session
    /// </summary>
    public async Task<AssetPatternsResponse?> GetAssetPatternsAsync(int sessionId, string hostToken)
    {
        try
        {
            _logger.LogInformation("NOOR-ASSET-DETECTOR: Getting asset patterns for session {SessionId}", sessionId);

            var response = await _httpClient.GetAsync($"/api/host/asset-patterns/{sessionId}?guid={hostToken}");
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var patterns = JsonSerializer.Deserialize<AssetPatternsResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("NOOR-ASSET-DETECTOR: Retrieved {PatternCount} patterns for session {SessionId}", 
                    patterns?.Patterns?.Length ?? 0, sessionId);

                return patterns;
            }

            _logger.LogWarning("NOOR-ASSET-DETECTOR: Failed to get asset patterns. Status: {StatusCode}", response.StatusCode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ASSET-DETECTOR: Error getting asset patterns for session {SessionId}", sessionId);
            return null;
        }
    }

    /// <summary>
    /// Detects assets in transcript content using the provided patterns.
    /// Returns asset payloads ready for sharing via UC-L1 workflow.
    /// </summary>
    public List<AssetPayload> DetectAssetsInContent(string transcriptContent, AssetPattern[] patterns)
    {
        var detectedAssets = new List<AssetPayload>();

        try
        {
            _logger.LogInformation("NOOR-ASSET-DETECTOR: Scanning content of {ContentLength} characters with {PatternCount} patterns", 
                transcriptContent?.Length ?? 0, patterns?.Length ?? 0);

            if (string.IsNullOrEmpty(transcriptContent) || patterns == null || patterns.Length == 0)
            {
                return detectedAssets;
            }

            foreach (var pattern in patterns.OrderBy(p => p.Priority))
            {
                var assets = DetectAssetsByPattern(transcriptContent, pattern);
                detectedAssets.AddRange(assets);
            }

            _logger.LogInformation("NOOR-ASSET-DETECTOR: Detected {AssetCount} assets in content", detectedAssets.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ASSET-DETECTOR: Error detecting assets in content");
        }

        return detectedAssets;
    }

    /// <summary>
    /// Detects assets matching a specific pattern in the transcript content
    /// </summary>
    private List<AssetPayload> DetectAssetsByPattern(string content, AssetPattern pattern)
    {
        var assets = new List<AssetPayload>();

        try
        {
            // For this implementation, we'll use simple string detection
            // In a more sophisticated version, this could use HTML parsing
            
            switch (pattern.Type)
            {
                case "ayah-card":
                    assets.AddRange(DetectAyahCards(content));
                    break;
                
                case "inline-arabic":
                    assets.AddRange(DetectInlineArabic(content));
                    break;
                
                case "ahadees-content":
                    assets.AddRange(DetectAhadeesContent(content));
                    break;
                
                case "ayah-header":
                    assets.AddRange(DetectAyahHeaders(content));
                    break;
            }

            _logger.LogDebug("NOOR-ASSET-DETECTOR: Pattern '{PatternType}' detected {AssetCount} assets", 
                pattern.Type, assets.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ASSET-DETECTOR: Error detecting assets for pattern {PatternType}", pattern.Type);
        }

        return assets;
    }

    private List<AssetPayload> DetectAyahCards(string content)
    {
        var assets = new List<AssetPayload>();
        
        // Look for ayah-card divs in the content
        var cardPattern = @"<div class=""ayah-card""[^>]*id=""([^""]*)"">.*?</div>";
        var matches = System.Text.RegularExpressions.Regex.Matches(content, cardPattern, 
            System.Text.RegularExpressions.RegexOptions.Singleline);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var cardId = match.Groups[1].Value;
            assets.Add(new AssetPayload
            {
                Type = "ayah-card",
                Selector = $"#{cardId}",
                Metadata = new Dictionary<string, object>
                {
                    ["cardId"] = cardId,
                    ["contentLength"] = match.Value.Length,
                    ["detected"] = DateTime.UtcNow
                }
            });
        }

        return assets;
    }

    private List<AssetPayload> DetectInlineArabic(string content)
    {
        var assets = new List<AssetPayload>();
        
        // Look for inline Arabic spans
        var arabicPattern = @"<span class=""inlineArabic"">([^<]*)</span>";
        var matches = System.Text.RegularExpressions.Regex.Matches(content, arabicPattern);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var arabicText = match.Groups[1].Value;
            assets.Add(new AssetPayload
            {
                Type = "inline-arabic",
                Selector = ".inlineArabic",
                Metadata = new Dictionary<string, object>
                {
                    ["arabicText"] = arabicText,
                    ["position"] = match.Index,
                    ["detected"] = DateTime.UtcNow
                }
            });
        }

        return assets;
    }

    private List<AssetPayload> DetectAhadeesContent(string content)
    {
        var assets = new List<AssetPayload>();
        
        // Look for ahadees elements with ids
        var ahadeesPattern = @"id=""(ahadees-[^""]*)""|data-ahadees-id=""([^""]*)""";
        var matches = System.Text.RegularExpressions.Regex.Matches(content, ahadeesPattern);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var ahadeesId = match.Groups[1].Value ?? match.Groups[2].Value;
            if (!string.IsNullOrEmpty(ahadeesId))
            {
                assets.Add(new AssetPayload
                {
                    Type = "ahadees-content",
                    Selector = $"[id='{ahadeesId}'], [data-ahadees-id='{ahadeesId}']",
                    Metadata = new Dictionary<string, object>
                    {
                        ["ahadeesId"] = ahadeesId,
                        ["detected"] = DateTime.UtcNow
                    }
                });
            }
        }

        return assets;
    }

    private List<AssetPayload> DetectAyahHeaders(string content)
    {
        var assets = new List<AssetPayload>();
        
        // Look for clickable ayah headers
        var headerPattern = @"<div class=""[^""]*clickable-ayah-header[^""]*""[^>]*id=""([^""]*)"">.*?</div>";
        var matches = System.Text.RegularExpressions.Regex.Matches(content, headerPattern, 
            System.Text.RegularExpressions.RegexOptions.Singleline);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            var headerId = match.Groups[1].Value;
            assets.Add(new AssetPayload
            {
                Type = "ayah-header",
                Selector = $"#{headerId}",
                Metadata = new Dictionary<string, object>
                {
                    ["headerId"] = headerId,
                    ["detected"] = DateTime.UtcNow
                }
            });
        }

        return assets;
    }
}

/// <summary>
/// Response model for asset patterns API
/// </summary>
public class AssetPatternsResponse
{
    public int SessionId { get; set; }
    public AssetPattern[] Patterns { get; set; } = Array.Empty<AssetPattern>();
}

/// <summary>
/// Asset detection pattern configuration
/// </summary>
public class AssetPattern
{
    public string Type { get; set; } = string.Empty;
    public string Selector { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
}

/// <summary>
/// Asset payload for UC-L1 workflow: AssetDetector constructs payload (type, selector, metadata)
/// </summary>
public class AssetPayload
{
    public string Type { get; set; } = string.Empty;
    public string Selector { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}