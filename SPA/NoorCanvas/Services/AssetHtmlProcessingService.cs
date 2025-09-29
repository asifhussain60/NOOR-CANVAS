using Microsoft.AspNetCore.Components;
using HtmlAgilityPack;
using System.Text;
using System.Text.Json;

namespace NoorCanvas.Services
{
    /// <summary>
    /// [DEBUG-WORKITEM:assetshare:impl:09291233-as1] Dedicated HTML processing service for asset sharing ;CLEANUP_OK
    /// Extends beyond SafeHtmlRenderingService with specific asset detection, extraction, and transformation capabilities.
    /// Uses HtmlAgilityPack for robust HTML parsing and manipulation for host-to-participant asset sharing.
    /// </summary>
    public class AssetHtmlProcessingService
    {
        private readonly ILogger<AssetHtmlProcessingService> _logger;
        private readonly SafeHtmlRenderingService _safeHtmlRenderer;

        // Asset type patterns for content identification
        private readonly Dictionary<string, AssetTypeDefinition> _assetTypeDefinitions = new()
        {
            {
                "ayah-card",
                new AssetTypeDefinition
                {
                    Type = "ayah-card",
                    DisplayName = "Quranic Verse",
                    CssSelector = ".ayah-card",
                    HtmlPattern = @"<div[^>]*class=""[^""]*ayah-card[^""]*""[^>]*>",
                    Priority = 1,
                    Description = "Quranic verse cards with Arabic text and translation"
                }
            },
            {
                "ahadees-content",
                new AssetTypeDefinition
                {
                    Type = "ahadees-content",
                    DisplayName = "Hadith Content",
                    CssSelector = "[class*='ahadees'], [id*='ahadees']",
                    HtmlPattern = @"<[^>]*(?:class=""[^""]*ahadees[^""]*""|id=""[^""]*ahadees[^""]*"")[^>]*>",
                    Priority = 1,
                    Description = "Hadith content blocks and containers"
                }
            },
            {
                "inline-arabic",
                new AssetTypeDefinition
                {
                    Type = "inline-arabic",
                    DisplayName = "Arabic Text",
                    CssSelector = ".inlineArabic, .arabic-text",
                    HtmlPattern = @"<[^>]*class=""[^""]*(?:inlineArabic|arabic-text)[^""]*""[^>]*>",
                    Priority = 2,
                    Description = "Inline Arabic text spans and elements"
                }
            },
            {
                "islamic-table",
                new AssetTypeDefinition
                {
                    Type = "islamic-table",
                    DisplayName = "Islamic Table",
                    CssSelector = ".islamic-table, .content-table, .comparison-table",
                    HtmlPattern = @"<table[^>]*class=""[^""]*(?:islamic-table|content-table|comparison-table)[^""]*""[^>]*>",
                    Priority = 1,
                    Description = "Islamic content tables and comparisons"
                }
            },
            {
                "image-asset",
                new AssetTypeDefinition
                {
                    Type = "image-asset",
                    DisplayName = "Image Asset",
                    CssSelector = "img",
                    HtmlPattern = @"<img[^>]*(?:src=""[^""]*""[^>]*|[^>]*)",
                    Priority = 3,
                    Description = "Images and visual content"
                }
            }
        };

        public AssetHtmlProcessingService(
            ILogger<AssetHtmlProcessingService> logger,
            SafeHtmlRenderingService safeHtmlRenderer)
        {
            _logger = logger;
            _safeHtmlRenderer = safeHtmlRenderer;
        }

        /// <summary>
        /// Process HTML content to identify and prepare assets for sharing, with optional share button injection
        /// </summary>
        /// <param name="htmlContent">Raw HTML content from session transcripts</param>
        /// <param name="sessionId">Session ID for asset tracking</param>
        /// <param name="sessionStatus">Session status - share buttons only injected if "Active"</param>
        /// <param name="injectShareButtons">Whether to inject share buttons during processing</param>
        /// <returns>Processed HTML with asset identifiers, optional share buttons, and metadata</returns>
        public AssetProcessingResult ProcessHtmlForAssetSharingWithButtons(string htmlContent, long sessionId, string sessionStatus, bool injectShareButtons = true)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Processing HTML for asset sharing with buttons - SessionId: {SessionId}, Status: {Status}, InjectButtons: {InjectButtons}, ContentLength: {Length} ;CLEANUP_OK",
                    sessionId, sessionStatus, injectShareButtons, htmlContent?.Length ?? 0);

                if (string.IsNullOrEmpty(htmlContent))
                {
                    return new AssetProcessingResult
                    {
                        ProcessedHtml = string.Empty,
                        DetectedAssets = new List<DetectedAsset>(),
                        ProcessingMetadata = new ProcessingMetadata { Success = false, Message = "Empty HTML content" }
                    };
                }

                // Parse HTML using HtmlAgilityPack
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(htmlContent);

                // Detect assets in the HTML
                var detectedAssets = DetectAssetsInHtml(htmlDoc, sessionId);
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Detected {AssetCount} assets in HTML ;CLEANUP_OK", detectedAssets.Count);

                // Add asset identifiers to HTML elements
                AddAssetIdentifiersToHtmlDocument(htmlDoc, detectedAssets);

                // Inject share buttons if requested and session is active
                var shareButtonsInjected = 0;
                if (injectShareButtons && sessionStatus == "Active" && detectedAssets.Count > 0)
                {
                    shareButtonsInjected = InjectShareButtonsIntoHtmlDocument(htmlDoc, detectedAssets);
                    _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Injected {ButtonCount} share buttons into HTML ;CLEANUP_OK", shareButtonsInjected);
                }

                // Get processed HTML
                var processedHtml = htmlDoc.DocumentNode.OuterHtml;

                // Sanitize the HTML using the existing SafeHtmlRenderingService
                var safeProcessedHtml = _safeHtmlRenderer.RenderSafeHtml(processedHtml);

                return new AssetProcessingResult
                {
                    ProcessedHtml = safeProcessedHtml.Value,
                    DetectedAssets = detectedAssets,
                    ProcessingMetadata = new ProcessingMetadata 
                    { 
                        Success = true, 
                        Message = $"Successfully processed {detectedAssets.Count} assets, injected {shareButtonsInjected} share buttons",
                        SessionId = sessionId,
                        ProcessedAt = DateTime.UtcNow
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error processing HTML for asset sharing with buttons - SessionId: {SessionId} ;CLEANUP_OK", sessionId);
                
                return new AssetProcessingResult
                {
                    ProcessedHtml = htmlContent, // Return original content as fallback
                    DetectedAssets = new List<DetectedAsset>(),
                    ProcessingMetadata = new ProcessingMetadata 
                    { 
                        Success = false, 
                        Message = $"Processing error: {ex.Message}",
                        SessionId = sessionId,
                        ProcessedAt = DateTime.UtcNow
                    }
                };
            }
        }

        /// <summary>
        /// Process HTML content to identify and prepare assets for sharing
        /// </summary>
        /// <param name="htmlContent">Raw HTML content from session transcripts</param>
        /// <param name="sessionId">Session ID for asset tracking</param>
        /// <returns>Processed HTML with asset identifiers and metadata</returns>
        public AssetProcessingResult ProcessHtmlForAssetSharing(string htmlContent, long sessionId)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Processing HTML for asset sharing - SessionId: {SessionId}, ContentLength: {Length} ;CLEANUP_OK",
                    sessionId, htmlContent?.Length ?? 0);

                if (string.IsNullOrEmpty(htmlContent))
                {
                    return new AssetProcessingResult
                    {
                        ProcessedHtml = string.Empty,
                        DetectedAssets = new List<DetectedAsset>(),
                        ProcessingMetadata = new ProcessingMetadata { Success = false, Message = "Empty HTML content" }
                    };
                }

                // Parse HTML using HtmlAgilityPack
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(htmlContent);

                // Detect assets in the HTML
                var detectedAssets = DetectAssetsInHtml(htmlDoc, sessionId);
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Detected {AssetCount} assets in HTML ;CLEANUP_OK", detectedAssets.Count);

                // Add asset identifiers to HTML elements
                var processedHtml = AddAssetIdentifiersToHtml(htmlDoc, detectedAssets);

                // Sanitize the HTML using the existing SafeHtmlRenderingService
                var safeProcessedHtml = _safeHtmlRenderer.RenderSafeHtml(processedHtml);

                return new AssetProcessingResult
                {
                    ProcessedHtml = safeProcessedHtml.Value,
                    DetectedAssets = detectedAssets,
                    ProcessingMetadata = new ProcessingMetadata 
                    { 
                        Success = true, 
                        Message = $"Successfully processed {detectedAssets.Count} assets",
                        SessionId = sessionId,
                        ProcessedAt = DateTime.UtcNow
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error processing HTML for asset sharing - SessionId: {SessionId} ;CLEANUP_OK", sessionId);
                
                return new AssetProcessingResult
                {
                    ProcessedHtml = htmlContent, // Return original content as fallback
                    DetectedAssets = new List<DetectedAsset>(),
                    ProcessingMetadata = new ProcessingMetadata 
                    { 
                        Success = false, 
                        Message = $"Processing error: {ex.Message}",
                        SessionId = sessionId,
                        ProcessedAt = DateTime.UtcNow
                    }
                };
            }
        }

        /// <summary>
        /// Extract a specific asset from HTML content by asset ID
        /// </summary>
        /// <param name="htmlContent">HTML content containing the asset</param>
        /// <param name="assetId">Unique asset identifier</param>
        /// <returns>Extracted asset HTML with metadata</returns>
        public ExtractedAsset? ExtractAssetById(string htmlContent, string assetId)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Extracting asset by ID: {AssetId} ;CLEANUP_OK", assetId);

                if (string.IsNullOrEmpty(htmlContent) || string.IsNullOrEmpty(assetId))
                {
                    return null;
                }

                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(htmlContent);

                // Find element with the specified data-asset-id
                var assetElement = htmlDoc.DocumentNode.SelectSingleNode($"//*[@data-asset-id='{assetId}']");
                if (assetElement == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Asset element not found for ID: {AssetId} ;CLEANUP_OK", assetId);
                    return null;
                }

                // Extract asset content and metadata
                var extractedAsset = new ExtractedAsset
                {
                    AssetId = assetId,
                    HtmlContent = assetElement.OuterHtml,
                    TextContent = assetElement.InnerText?.Trim() ?? string.Empty,
                    AssetType = assetElement.GetAttributeValue("data-asset-type", "unknown"),
                    Metadata = ExtractElementMetadata(assetElement),
                    ExtractedAt = DateTime.UtcNow
                };

                // Sanitize the extracted HTML
                extractedAsset.SafeHtmlContent = _safeHtmlRenderer.RenderSafeHtml(extractedAsset.HtmlContent);

                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Successfully extracted asset: {AssetId}, Type: {AssetType}, ContentLength: {Length} ;CLEANUP_OK",
                    assetId, extractedAsset.AssetType, extractedAsset.HtmlContent.Length);

                return extractedAsset;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error extracting asset by ID: {AssetId} ;CLEANUP_OK", assetId);
                return null;
            }
        }

        /// <summary>
        /// Detect assets in HTML document using predefined patterns
        /// </summary>
        private List<DetectedAsset> DetectAssetsInHtml(HtmlDocument htmlDoc, long sessionId)
        {
            var detectedAssets = new List<DetectedAsset>();
            var assetIdCounter = 1;

            foreach (var assetTypeDef in _assetTypeDefinitions.Values.OrderBy(a => a.Priority))
            {
                try
                {
                    var elements = htmlDoc.DocumentNode.SelectNodes(assetTypeDef.CssSelector);
                    if (elements != null)
                    {
                        foreach (var element in elements)
                        {
                            var assetId = $"{sessionId}-{assetTypeDef.Type}-{assetIdCounter++}";
                            
                            var detectedAsset = new DetectedAsset
                            {
                                AssetId = assetId,
                                AssetType = assetTypeDef.Type,
                                DisplayName = assetTypeDef.DisplayName,
                                CssSelector = assetTypeDef.CssSelector,
                                HtmlElement = element,
                                Position = GetElementPosition(element),
                                Metadata = ExtractElementMetadata(element),
                                DetectedAt = DateTime.UtcNow
                            };

                            detectedAssets.Add(detectedAsset);
                            
                            _logger.LogDebug("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Detected asset: {AssetId}, Type: {AssetType}, Position: {Position} ;CLEANUP_OK",
                                assetId, assetTypeDef.Type, detectedAsset.Position);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error detecting assets of type: {AssetType} ;CLEANUP_OK", assetTypeDef.Type);
                }
            }

            return detectedAssets;
        }

        /// <summary>
        /// Add data-asset-id attributes to HTML elements for identified assets.
        /// </summary>
        private void AddAssetIdentifiersToHtmlDocument(HtmlDocument htmlDoc, List<DetectedAsset> assets)
        {
            foreach (var asset in assets)
            {
                try
                {
                    // Add data attributes for asset identification and sharing
                    asset.HtmlElement.SetAttributeValue("data-asset-id", asset.AssetId);
                    asset.HtmlElement.SetAttributeValue("data-asset-type", asset.AssetType);
                    asset.HtmlElement.SetAttributeValue("data-asset-position", asset.Position.ToString());
                    
                    // Add CSS class for styling
                    var existingClass = asset.HtmlElement.GetAttributeValue("class", string.Empty);
                    var newClass = string.IsNullOrEmpty(existingClass) 
                        ? "noor-shareable-asset" 
                        : $"{existingClass} noor-shareable-asset";
                    asset.HtmlElement.SetAttributeValue("class", newClass);

                    _logger.LogDebug("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Added identifiers to asset: {AssetId} ;CLEANUP_OK", asset.AssetId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error adding identifiers to asset: {AssetId} ;CLEANUP_OK", asset.AssetId);
                }
            }
        }

        /// <summary>
        /// Inject share buttons directly into HTML document before each asset.
        /// </summary>
        private int InjectShareButtonsIntoHtmlDocument(HtmlDocument htmlDoc, List<DetectedAsset> assets)
        {
            var injectedCount = 0;
            
            // Process assets in reverse order to maintain positions during HTML insertion
            var sortedAssets = assets.OrderByDescending(a => a.Position).ToList();
            
            foreach (var asset in sortedAssets)
            {
                try
                {
                    // Generate share button HTML
                    var shareId = GenerateShareId();
                    var shareButtonHtml = CreateShareButtonHtml(asset.AssetType, asset.DisplayName, shareId);
                    
                    // Parse share button HTML and create node
                    var shareButtonDoc = new HtmlDocument();
                    shareButtonDoc.LoadHtml(shareButtonHtml);
                    var shareButtonNode = shareButtonDoc.DocumentNode.FirstChild;
                    
                    if (shareButtonNode != null && asset.HtmlElement.ParentNode != null)
                    {
                        // Create a new button element in the main document
                        var buttonElement = htmlDoc.CreateElement("button");
                        buttonElement.SetAttributeValue("class", "ks-share-btn");
                        buttonElement.SetAttributeValue("data-share-id", shareId);
                        buttonElement.SetAttributeValue("data-asset-type", asset.AssetType);
                        buttonElement.SetAttributeValue("onclick", $"shareAsset('{shareId}', '{asset.AssetType}')");
                        buttonElement.InnerHtml = $"Share {asset.DisplayName}";
                        
                        // Insert share button before the asset element
                        asset.HtmlElement.ParentNode.InsertBefore(buttonElement, asset.HtmlElement);
                        injectedCount++;
                        
                        _logger.LogDebug("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Injected share button for asset: {AssetId} ({AssetType}) ;CLEANUP_OK", 
                            asset.AssetId, asset.AssetType);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error injecting share button for asset: {AssetId} ;CLEANUP_OK", asset.AssetId);
                }
            }
            
            return injectedCount;
        }

        /// <summary>
        /// Generate a unique share ID for asset sharing.
        /// </summary>
        private string GenerateShareId()
        {
            return Guid.NewGuid().ToString("N")[..8].ToUpper();
        }

        /// <summary>
        /// Create share button HTML for an asset.
        /// </summary>
        private string CreateShareButtonHtml(string assetType, string displayName, string shareId)
        {
            var buttonText = $"Share {displayName}";
            return $@"<button class=""ks-share-btn"" data-share-id=""{shareId}"" data-asset-type=""{assetType}"" onclick=""shareAsset('{shareId}', '{assetType}')"">{buttonText}</button>";
        }

        /// <summary>
        /// Add data-asset-id attributes to HTML elements for identified assets.
        /// </summary>
        private string AddAssetIdentifiersToHtml(HtmlDocument htmlDoc, List<DetectedAsset> assets)
        {
            AddAssetIdentifiersToHtmlDocument(htmlDoc, assets);
            return htmlDoc.DocumentNode.OuterHtml;
        }

        /// <summary>
        /// Extract metadata from HTML element
        /// </summary>
        private Dictionary<string, object> ExtractElementMetadata(HtmlNode element)
        {
            var metadata = new Dictionary<string, object>();

            try
            {
                // Basic element information
                metadata["tagName"] = element.Name;
                metadata["textContent"] = element.InnerText?.Trim()?.Substring(0, Math.Min(200, element.InnerText?.Trim()?.Length ?? 0)) ?? string.Empty;
                
                // CSS classes and IDs
                var cssClass = element.GetAttributeValue("class", string.Empty);
                if (!string.IsNullOrEmpty(cssClass))
                {
                    metadata["cssClass"] = cssClass;
                }

                var id = element.GetAttributeValue("id", string.Empty);
                if (!string.IsNullOrEmpty(id))
                {
                    metadata["id"] = id;
                }

                // Image-specific metadata
                if (element.Name.Equals("img", StringComparison.OrdinalIgnoreCase))
                {
                    var src = element.GetAttributeValue("src", string.Empty);
                    var alt = element.GetAttributeValue("alt", string.Empty);
                    
                    if (!string.IsNullOrEmpty(src)) metadata["src"] = src;
                    if (!string.IsNullOrEmpty(alt)) metadata["alt"] = alt;
                }

                // Table-specific metadata
                if (element.Name.Equals("table", StringComparison.OrdinalIgnoreCase))
                {
                    var rows = element.SelectNodes(".//tr");
                    var cells = element.SelectNodes(".//td | .//th");
                    
                    metadata["rowCount"] = rows?.Count ?? 0;
                    metadata["cellCount"] = cells?.Count ?? 0;
                }

                metadata["extractedAt"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error extracting element metadata ;CLEANUP_OK");
                metadata["metadataError"] = ex.Message;
            }

            return metadata;
        }

        /// <summary>
        /// Get the position of an element in the document
        /// </summary>
        private int GetElementPosition(HtmlNode element)
        {
            var position = 0;
            var current = element.ParentNode?.FirstChild;
            
            while (current != null && current != element)
            {
                if (current.NodeType == HtmlNodeType.Element)
                {
                    position++;
                }
                current = current.NextSibling;
            }

            return position;
        }

        /// <summary>
        /// Get asset type definitions for external reference
        /// </summary>
        public IReadOnlyDictionary<string, AssetTypeDefinition> GetAssetTypeDefinitions()
        {
            return _assetTypeDefinitions.AsReadOnly();
        }

        /// <summary>
        /// Validate if HTML content is suitable for asset processing
        /// </summary>
        public bool ValidateHtmlForAssetProcessing(string htmlContent)
        {
            if (string.IsNullOrWhiteSpace(htmlContent))
            {
                return false;
            }

            try
            {
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(htmlContent);
                
                // Check if the HTML contains potentially shareable assets
                foreach (var assetTypeDef in _assetTypeDefinitions.Values)
                {
                    var elements = htmlDoc.DocumentNode.SelectNodes(assetTypeDef.CssSelector);
                    if (elements != null && elements.Count > 0)
                    {
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error validating HTML for asset processing ;CLEANUP_OK");
                return false;
            }
        }
    }

    // Supporting classes and models
    public class AssetTypeDefinition
    {
        public string Type { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string CssSelector { get; set; } = string.Empty;
        public string HtmlPattern { get; set; } = string.Empty;
        public int Priority { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class AssetProcessingResult
    {
        public string ProcessedHtml { get; set; } = string.Empty;
        public List<DetectedAsset> DetectedAssets { get; set; } = new();
        public ProcessingMetadata ProcessingMetadata { get; set; } = new();
    }

    public class DetectedAsset
    {
        public string AssetId { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string CssSelector { get; set; } = string.Empty;
        public HtmlNode HtmlElement { get; set; } = null!;
        public int Position { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public DateTime DetectedAt { get; set; }
    }

    public class ExtractedAsset
    {
        public string AssetId { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string HtmlContent { get; set; } = string.Empty;
        public string TextContent { get; set; } = string.Empty;
        public MarkupString SafeHtmlContent { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public DateTime ExtractedAt { get; set; }
    }

    public class ProcessingMetadata
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public long SessionId { get; set; }
        public DateTime ProcessedAt { get; set; }
        public int AssetCount { get; set; }
        public Dictionary<string, int> AssetTypeBreakdown { get; set; } = new();
    }
}