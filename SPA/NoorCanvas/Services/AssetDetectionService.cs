using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models.Simplified;
using System.Text.RegularExpressions;

namespace NoorCanvas.Services;

/// <summary>
/// Service for detecting Islamic content assets in session transcripts
/// and storing them in SessionAssets lookup table for efficient retrieval.
/// </summary>
public class AssetDetectionService
{
    private readonly SimplifiedCanvasDbContext _context;
    private readonly ILogger<AssetDetectionService> _logger;

    public AssetDetectionService(SimplifiedCanvasDbContext context, ILogger<AssetDetectionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Detect and store all assets found in a session transcript using flexible class-based detection
    /// Replaces existing assets for the session to ensure consistency.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<int> DetectAndStoreAssetsAsync(long sessionId, string transcriptHtml)
    {
        try
        {
            _logger.LogInformation("ASSET-DETECTION: Starting flexible asset detection for session {SessionId}, HTML length: {Length}",
                sessionId, transcriptHtml?.Length ?? 0);

            if (string.IsNullOrEmpty(transcriptHtml))
            {
                _logger.LogWarning("ASSET-DETECTION: Empty transcript HTML for session {SessionId}", sessionId);
                return 0;
            }

            // Remove existing assets for this session (clean slate approach)
            await ClearExistingAssetsAsync(sessionId);

            // Detect all asset classes using flexible matching
            var detectedAssets = await DetectAssetsFlexibleAsync(sessionId, transcriptHtml);

            _logger.LogInformation("ASSET-DETECTION: Detected {Count} asset classes for session {SessionId}",
                detectedAssets.Count, sessionId);

            // DISABLED: SessionAssets table was dropped - replaced by simplified AssetLookup approach  
            // Store consolidated assets in database
            // if (detectedAssets.Count > 0)
            // {
            //     await _context.SessionAssets.AddRangeAsync(detectedAssets);
            //     await _context.SaveChangesAsync();
            //     _logger.LogInformation("ASSET-DETECTION: Successfully stored {Count} consolidated asset classes for session {SessionId}",
            //         detectedAssets.Count, sessionId);
            // }
            _logger.LogWarning("ASSET-DETECTION: Service disabled - asset detection now handled by simplified AssetLookup approach");

            return detectedAssets.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ASSET-DETECTION-ERROR: Failed to detect assets for session {SessionId}", sessionId);
            throw;
        }
    }

    /// <summary>
    /// Flexible asset detection using class intersection analysis
    /// Groups assets by primary class and counts instances.
    /// </summary>
    private Task<List<SessionAsset>> DetectAssetsFlexibleAsync(long sessionId, string transcriptHtml)
    {
        var consolidatedAssets = new List<SessionAsset>();
        var position = 1;

        // Define target class groups for detection - based on Session 212 analysis
        var assetClassGroups = new Dictionary<string, string[]>
        {
            // Existing asset types (already in database)
            { "ayah-card", new[] { "ayah-card" } },
            { "inserted-hadees", new[] { "inserted-hadees", "ahadees-content" } },
            
            // Missing asset types from analysis (need to be added)
            { "etymology-card", new[] { "etymology-card" } },
            { "etymology-derivative-card", new[] { "etymology-derivative-card" } },
            { "esotericBlock", new[] { "esotericBlock" } },
            { "verse-container", new[] { "verse-container" } },
            { "table", new[] { "table" } }, // For table[style="width: 100%"]
            { "imgResponsive", new[] { "imgResponsive", "fr-fic", "fr-dib", "fr-bordered" } }
        };

        foreach (var classGroup in assetClassGroups)
        {
            var primaryClass = classGroup.Key;
            var searchClasses = classGroup.Value;

            // Find elements with any combination of these classes
            var elements = FindElementsWithClassIntersection(transcriptHtml, searchClasses);

            if (elements.Count > 0)
            {
                // Calculate class intersection score
                var classScore = CalculateClassScore(elements[0].Classes, searchClasses);
                var alternateClasses = string.Join(",", elements[0].Classes.Where(c => c != primaryClass).OrderBy(c => c));

                var asset = new SessionAsset
                {
                    SessionId = sessionId,
                    AssetClass = primaryClass,
                    AlternateClasses = string.IsNullOrEmpty(alternateClasses) ? null : alternateClasses,
                    InstanceCount = elements.Count,
                    ClassScore = classScore,
                    Position = position++,
                    CssPattern = $"[class*='{primaryClass}']", // Flexible CSS selector
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "AssetDetectionService",
                    IsActive = true
                };

                consolidatedAssets.Add(asset);

                _logger.LogDebug("ASSET-DETECTION: Found {Count} instances of {PrimaryClass} (score: {Score}, alternates: {Alternates})",
                    elements.Count, primaryClass, classScore, alternateClasses ?? "none");
            }
        }

        return Task.FromResult(consolidatedAssets);
    }

    /// <summary>
    /// Find HTML elements that contain any of the specified CSS classes.
    /// </summary>
    private List<(List<string> Classes, string Html)> FindElementsWithClassIntersection(string html, string[] targetClasses)
    {
        var elements = new List<(List<string> Classes, string Html)>();

        // Look for any element with class attribute containing target classes
        var classPattern = @"<(\w+)[^>]*\s+class=[""']([^""']*)[""'][^>]*>";
        var regex = new Regex(classPattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
        var matches = regex.Matches(html);

        foreach (Match match in matches)
        {
            var classAttribute = match.Groups[2].Value;
            var elementClasses = classAttribute.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).ToList();

            // Check if any target class exists in this element
            var hasIntersection = targetClasses.Any(targetClass =>
                elementClasses.Any(elementClass =>
                    string.Equals(elementClass, targetClass, StringComparison.OrdinalIgnoreCase)));

            if (hasIntersection)
            {
                elements.Add((elementClasses, match.Value));
            }
        }

        return elements;
    }

    /// <summary>
    /// Calculate confidence score based on class intersection
    /// Higher scores indicate better matches.
    /// </summary>
    private int CalculateClassScore(List<string> elementClasses, string[] targetClasses)
    {
        var intersectionCount = targetClasses.Count(targetClass =>
            elementClasses.Any(elementClass =>
                string.Equals(elementClass, targetClass, StringComparison.OrdinalIgnoreCase)));

        // Score: 1-5 based on class match percentage
        var matchPercentage = (double)intersectionCount / targetClasses.Length;
        return Math.Max(1, (int)Math.Ceiling(matchPercentage * 5));
    }

    /// <summary>
    /// Legacy method - detect assets of a specific type in the transcript HTML.
    /// </summary>
    private (List<SessionAsset> Assets, int NewPosition) DetectAssetType(long sessionId, string html, string assetType, int globalPosition)
    {
        var assets = new List<SessionAsset>();

        if (!AssetTypes.DetectionPatterns.TryGetValue(assetType, out var pattern))
        {
            _logger.LogWarning("ASSET-DETECTION: No pattern defined for asset type: {AssetType}", assetType);
            return (assets, globalPosition);
        }

        try
        {
            var regex = new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
            var matches = regex.Matches(html);

            _logger.LogDebug("ASSET-DETECTION: Found {Count} matches for {AssetType} in session {SessionId}",
                matches.Count, assetType, sessionId);

            int typePosition = 1;
            foreach (Match match in matches)
            {
                var asset = new SessionAsset
                {
                    SessionId = sessionId,
                    AssetClass = assetType,
                    AlternateClasses = null, // Legacy detection - no alternates
                    InstanceCount = 1,
                    ClassScore = 3, // Medium confidence for legacy patterns
                    Position = globalPosition++,
                    CssPattern = pattern,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "AssetDetectionService-Legacy",
                    IsActive = true
                };

                assets.Add(asset);
                typePosition++;

                _logger.LogDebug("ASSET-DETECTION: Created asset {AssetClass}-{Position} with {InstanceCount} instances",
                    assetType, asset.Position, asset.InstanceCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ASSET-DETECTION-ERROR: Failed to detect {AssetType} assets", assetType);
        }

        return (assets, globalPosition);
    }

    /// <summary>
    /// Generate a unique selector for an asset based on its type and content.
    /// </summary>
    private string GenerateAssetSelector(string assetType, int position, string htmlContent)
    {
        try
        {
            return assetType switch
            {
                AssetTypes.AyahCard => ExtractAyahSelector(htmlContent) ?? $"ayah-{position}",
                AssetTypes.InsertedHadees => ExtractHadeesSelector(htmlContent) ?? $"hadees-{position}",
                AssetTypes.EtymologyCard => ExtractEtymologySelector(htmlContent) ?? $"etymology-{position}",
                AssetTypes.ImageResponsive => ExtractImageSelector(htmlContent) ?? $"image-{position}",
                AssetTypes.TableAsset => ExtractTableSelector(htmlContent) ?? $"table-{position}",
                _ => $"{assetType}-{position}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ASSET-DETECTION: Failed to extract specific selector for {AssetType}, using generic", assetType);
            return $"{assetType}-{position}";
        }
    }

    /// <summary>
    /// Extract Ayah-specific selector (e.g., "ayah-2-255" for Surah 2, Ayah 255).
    /// </summary>
    private string? ExtractAyahSelector(string html)
    {
        // Look for data-surah and data-ayah attributes
        var surahMatch = Regex.Match(html, @"data-surah=""(\d+)""", RegexOptions.IgnoreCase);
        var ayahMatch = Regex.Match(html, @"data-ayah=""(\d+)""", RegexOptions.IgnoreCase);

        if (surahMatch.Success && ayahMatch.Success)
        {
            return $"ayah-{surahMatch.Groups[1].Value}-{ayahMatch.Groups[1].Value}";
        }

        // Fallback: look for class patterns like "ayah-2-255"
        var classMatch = Regex.Match(html, @"ayah-(\d+)-(\d+)", RegexOptions.IgnoreCase);
        if (classMatch.Success)
        {
            return classMatch.Value;
        }

        return null;
    }

    /// <summary>
    /// Extract Hadees-specific selector (e.g., "hadees-bukhari-123").
    /// </summary>
    private string? ExtractHadeesSelector(string html)
    {
        // Look for data-collection and data-number attributes
        var collectionMatch = Regex.Match(html, @"data-collection=""([^""]+)""", RegexOptions.IgnoreCase);
        var numberMatch = Regex.Match(html, @"data-(?:number|hadith-id)=""(\d+)""", RegexOptions.IgnoreCase);

        if (collectionMatch.Success && numberMatch.Success)
        {
            return $"hadees-{collectionMatch.Groups[1].Value}-{numberMatch.Groups[1].Value}";
        }

        // Fallback: look for ID patterns
        var idMatch = Regex.Match(html, @"id=""hadees-([^""]+)""", RegexOptions.IgnoreCase);
        if (idMatch.Success)
        {
            return $"hadees-{idMatch.Groups[1].Value}";
        }

        return null;
    }

    /// <summary>
    /// Extract Etymology-specific selector (e.g., "etymology-rasul-rsl").
    /// </summary>
    private string? ExtractEtymologySelector(string html)
    {
        // Look for data-word and data-root attributes
        var wordMatch = Regex.Match(html, @"data-word=""([^""]+)""", RegexOptions.IgnoreCase);
        var rootMatch = Regex.Match(html, @"data-root=""([^""]+)""", RegexOptions.IgnoreCase);

        if (wordMatch.Success && rootMatch.Success)
        {
            var word = wordMatch.Groups[1].Value.Replace(" ", "-").ToLower();
            var root = rootMatch.Groups[1].Value.Replace("-", "").Replace(" ", "").ToLower();
            return $"etymology-{word}-{root}";
        }

        // Fallback: look for class patterns
        var classMatch = Regex.Match(html, @"etymology-([^""\s]+)", RegexOptions.IgnoreCase);
        if (classMatch.Success)
        {
            return classMatch.Value;
        }

        return null;
    }

    /// <summary>
    /// Extract Image-specific selector.
    /// </summary>
    private string? ExtractImageSelector(string html)
    {
        // Look for src attribute to create meaningful selector
        var srcMatch = Regex.Match(html, @"src=""([^""]+)""", RegexOptions.IgnoreCase);
        if (srcMatch.Success)
        {
            var filename = Path.GetFileNameWithoutExtension(srcMatch.Groups[1].Value);
            return $"image-{filename.Replace(" ", "-").ToLower()}";
        }

        return null;
    }

    /// <summary>
    /// Extract Table-specific selector.
    /// </summary>
    private string? ExtractTableSelector(string html)
    {
        // Look for class or id attributes
        var classMatch = Regex.Match(html, @"class=""([^""]*(?:islamic-table|content-table|comparison-table)[^""]*)""", RegexOptions.IgnoreCase);
        if (classMatch.Success)
        {
            var classes = classMatch.Groups[1].Value.Split(' ');
            var relevantClass = classes.FirstOrDefault(c => c.Contains("table"));
            if (relevantClass != null)
            {
                return $"table-{relevantClass.Replace("table", "").Trim('-')}";
            }
        }

        return null;
    }

    /// <summary>
    /// Filter out nested assets to keep only outermost containers.
    /// </summary>
    private List<SessionAsset> FilterOutermostAssets(List<SessionAsset> allAssets, string html)
    {
        try
        {
            var outermost = new List<SessionAsset>();

            // Sort by position to process in order
            var sortedAssets = allAssets.OrderBy(a => a.Position).ToList();

            foreach (var asset in sortedAssets)
            {
                // Find this asset's HTML position using its pattern
                var matches = Regex.Matches(html, asset.CssPattern ?? "", RegexOptions.IgnoreCase);
                bool isNested = false;

                foreach (Match match in matches)
                {
                    // Check if this match is inside any already-accepted asset
                    foreach (var outerAsset in outermost)
                    {
                        var outerMatches = Regex.Matches(html, outerAsset.CssPattern ?? "", RegexOptions.IgnoreCase);
                        foreach (Match outerMatch in outerMatches)
                        {
                            // If current match is inside an outer match, it's nested
                            if (match.Index > outerMatch.Index &&
                                match.Index < (outerMatch.Index + outerMatch.Length))
                            {
                                isNested = true;
                                break;
                            }
                        }
                        if (isNested) break;
                    }
                    if (!isNested)
                    {
                        outermost.Add(asset);
                        break; // Only need to add once per asset
                    }
                }
            }

            _logger.LogInformation("ASSET-FILTERING: Filtered {Original} assets to {Filtered} outermost containers",
                allAssets.Count, outermost.Count);

            return outermost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ASSET-FILTERING-ERROR: Failed to filter nested assets, returning all");
            return allAssets; // Fallback to all assets if filtering fails
        }
    }

    /// <summary>
    /// DISABLED: Remove existing assets for a session before detecting new ones.
    /// </summary>
    private async Task ClearExistingAssetsAsync(long sessionId)
    {
        // DISABLED: SessionAssets table was dropped - replaced by simplified AssetLookup approach
        _logger.LogWarning("ASSET-DETECTION: ClearExistingAssetsAsync disabled - using simplified AssetLookup approach");
        await Task.CompletedTask;
    }

    /// <summary>
    /// Get asset statistics for a session.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public Task<Dictionary<string, int>> GetAssetStatsAsync(long sessionId)
    {
        try
        {
            // DISABLED: SessionAssets table was dropped - replaced by simplified AssetLookup approach
            _logger.LogWarning("ASSET-DETECTION: GetAssetStatsAsync disabled - using simplified AssetLookup approach");
            return Task.FromResult(new Dictionary<string, int>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get asset stats for session {SessionId}", sessionId);
            return Task.FromResult(new Dictionary<string, int>());
        }
    }
}