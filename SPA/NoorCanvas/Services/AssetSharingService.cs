using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using HtmlAgilityPack;

namespace NoorCanvas.Services;

/// <summary>
/// [PHASE-5:hcp] Asset sharing service - extracted from HostControlPanel.razor
/// Handles asset HTML extraction, processing, and SignalR broadcasting
/// </summary>
public interface IAssetSharingService
{
    Task<bool> ShareAssetAsync(
        int sessionId,
        string shareId,
        string assetType,
        int instanceNumber,
        string sessionTranscript,
        HubConnection hubConnection);
}

public class AssetSharingService : IAssetSharingService
{
    private readonly ILogger<AssetSharingService> _logger;
    private readonly UnifiedHtmlTransformService _htmlTransform;
    private readonly IMediaUrlTransformService _mediaUrlTransform;

    public AssetSharingService(
        ILogger<AssetSharingService> logger,
        UnifiedHtmlTransformService htmlTransform,
        IMediaUrlTransformService mediaUrlTransform)
    {
        _logger = logger;
        _htmlTransform = htmlTransform;
        _mediaUrlTransform = mediaUrlTransform;
    }

    /// <summary>
    /// Share an asset via SignalR using KSESSIONS-style direct content broadcasting
    /// </summary>
    public async Task<bool> ShareAssetAsync(
        int sessionId,
        string shareId,
        string assetType,
        int instanceNumber,
        string sessionTranscript,
        HubConnection hubConnection)
    {
        var broadcastId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[ASSET-SHARING-SERVICE] ShareAsset initiated: {ShareId} {AssetType} #{InstanceNumber}, broadcastId={BroadcastId}",
            shareId, assetType, instanceNumber, broadcastId);

        // Validate inputs
        if (string.IsNullOrEmpty(sessionTranscript))
        {
            _logger.LogError("[ASSET-SHARING-SERVICE] SessionTranscript is null or empty, broadcastId={BroadcastId}", broadcastId);
            return false;
        }

        if (hubConnection?.State != HubConnectionState.Connected)
        {
            _logger.LogError("[ASSET-SHARING-SERVICE] SignalR not connected: State={State}, broadcastId={BroadcastId}",
                hubConnection?.State, broadcastId);
            return false;
        }

        try
        {
            // Step 1: Extract raw asset HTML
            var rawAssetHtml = await ExtractRawAssetHtmlAsync(shareId, assetType, instanceNumber, sessionTranscript, broadcastId);

            if (string.IsNullOrEmpty(rawAssetHtml))
            {
                _logger.LogError("[ASSET-SHARING-SERVICE] No HTML content found for shareId: {ShareId}, broadcastId={BroadcastId}",
                    shareId, broadcastId);
                return false;
            }

            _logger.LogInformation("[ASSET-SHARING-SERVICE] ✅ STEP 2/5: Raw asset HTML extracted, length={Length} chars, broadcastId={BroadcastId}",
                rawAssetHtml.Length, broadcastId);

            // Step 2: Process HTML for participant view
            var participantReadyHtml = await ProcessAssetForSharingAsync(rawAssetHtml, assetType, broadcastId);

            if (string.IsNullOrEmpty(participantReadyHtml))
            {
                _logger.LogError("[ASSET-SHARING-SERVICE] Processed HTML empty after transformation, shareId={ShareId}, broadcastId={BroadcastId}",
                    shareId, broadcastId);
                return false;
            }

            _logger.LogInformation("[ASSET-SHARING-SERVICE] 🔄 STEP 3/5: Asset HTML transformed for participant view, final length={Length} chars, broadcastId={BroadcastId}",
                participantReadyHtml.Length, broadcastId);

            // Step 3: Broadcast via SignalR
            _logger.LogInformation("[ASSET-SHARING-SERVICE] 🚀 STEP 4/5: Broadcasting asset via PublishAssetContent, target=session_{SessionId}, broadcastId={BroadcastId}",
                sessionId, broadcastId);

            var shareTask = hubConnection.InvokeAsync("PublishAssetContent", sessionId, participantReadyHtml);
            var timeoutTask = Task.Delay(5000);

            var completedTask = await Task.WhenAny(shareTask, timeoutTask);

            if (completedTask == timeoutTask)
            {
                _logger.LogError("[ASSET-SHARING-SERVICE] ❌ SignalR timeout after 5s, broadcastId={BroadcastId}", broadcastId);
                return false;
            }

            await shareTask; // Await to catch exceptions

            _logger.LogInformation("[ASSET-SHARING-SERVICE] ✅ STEP 5/5: PublishAssetContent completed successfully, SessionId={SessionId}, broadcastId={BroadcastId}",
                sessionId, broadcastId);
            _logger.LogInformation("[ASSET-SHARING-SERVICE] 🎉 SHARE COMPLETE: Asset broadcasted - AssetType={AssetType}, Instance={InstanceNumber}, broadcastId={BroadcastId}",
                assetType, instanceNumber, broadcastId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARING-SERVICE] ❌ Error in asset sharing: {ShareId}, broadcastId={BroadcastId}",
                shareId, broadcastId);
            return false;
        }
    }

    /// <summary>
    /// Extract raw asset HTML using asset-type-specific pattern matching
    /// </summary>
    private Task<string> ExtractRawAssetHtmlAsync(
        string shareId,
        string assetType,
        int instanceNumber,
        string sessionTranscript,
        string broadcastId)
    {
        try
        {
            _logger.LogInformation("[ASSET-SHARING-SERVICE] Extracting raw asset HTML using asset-type-specific pattern matching: {AssetType}, broadcastId={BroadcastId}",
                assetType, broadcastId);

            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(sessionTranscript);

            // Prefer explicit data-asset-id lookup
            var targetElement = htmlDoc.DocumentNode.SelectSingleNode($"//*[@data-asset-id='{shareId}']");
            if (targetElement != null)
            {
                var directHtml = targetElement.OuterHtml;
                _logger.LogInformation("[ASSET-SHARING-SERVICE] Direct match found for {ShareId}: {Length} chars, broadcastId={BroadcastId}",
                    shareId, directHtml.Length, broadcastId);
                return Task.FromResult(directHtml);
            }

            // Asset-type-specific XPath queries
            HtmlNodeCollection? assetElements = assetType.ToLowerInvariant() switch
            {
                "ayah-card" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'ayah-card')]"),
                "inserted-hadees" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'inserted-hadees') and contains(@class, 'ks-ahadees-container')]"),
                "verse-container" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'verse-container')]"),
                "etymology-card" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'etymology-card')]"),
                "etymology-derivative-card" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'etymology-derivative-card')]"),
                "esotericblock" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'esotericBlock')]"),
                "table" => htmlDoc.DocumentNode.SelectNodes("//table[@style='width: 100%;']"),
                "imgresponsive" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'imgResponsive')] | //img[contains(@class, 'imgResponsive')]"),
                "example" => htmlDoc.DocumentNode.SelectNodes("//p[contains(@class, 'example')]"),
                "poetry-wrapper" => htmlDoc.DocumentNode.SelectNodes("//div[contains(@class, 'poetry-wrapper')]"),
                "quote" => htmlDoc.DocumentNode.SelectNodes("//p[contains(@class, 'quote')]"),
                _ => htmlDoc.DocumentNode.SelectNodes($"//*[@data-asset-id='{shareId}']")
                    ?? htmlDoc.DocumentNode.SelectNodes($"//*[contains(@class, '{assetType}')]")
            };

            if (assetElements != null && assetElements.Count > 0)
            {
                // Try exact match by data-asset-id
                targetElement = assetElements.FirstOrDefault(node =>
                    string.Equals(node.GetAttributeValue("data-asset-id", string.Empty), shareId, StringComparison.OrdinalIgnoreCase));

                // Fallback to instance number
                if (targetElement == null && assetElements.Count >= instanceNumber)
                {
                    targetElement = assetElements[instanceNumber - 1];
                }

                if (targetElement != null)
                {
                    var rawHtml = targetElement.OuterHtml;
                    _logger.LogInformation("[ASSET-SHARING-SERVICE] Successfully extracted raw asset HTML for {AssetType} instance {Instance}: {Length} chars, broadcastId={BroadcastId}",
                        assetType, instanceNumber, rawHtml.Length, broadcastId);
                    return Task.FromResult(rawHtml);
                }
            }

            _logger.LogWarning("[ASSET-SHARING-SERVICE] Asset element not found: {AssetType} instance {Instance}. Found {Count} elements of this type, broadcastId={BroadcastId}",
                assetType, instanceNumber, assetElements?.Count ?? 0, broadcastId);

            return Task.FromResult(string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARING-SERVICE] Error extracting raw asset HTML: {ShareId}, broadcastId={BroadcastId}",
                shareId, broadcastId);
            return Task.FromResult(string.Empty);
        }
    }

    /// <summary>
    /// Process asset HTML for sharing - transform for participant view and normalize media URLs.
    /// </summary>
    private async Task<string> ProcessAssetForSharingAsync(string assetHtml, string assetType, string broadcastId)
    {
        try
        {
            _logger.LogInformation("[ASSET-SHARING-SERVICE] Processing asset HTML for participant view: {AssetType}, length={Length} chars, broadcastId={BroadcastId}",
                assetType, assetHtml.Length, broadcastId);

            // Transform for participant using UnifiedHtmlTransformService
            var participantHtml = _htmlTransform.TransformForParticipant(assetHtml);

            if (string.IsNullOrWhiteSpace(participantHtml))
            {
                _logger.LogWarning("[ASSET-SHARING-SERVICE] TransformForParticipant returned empty, broadcastId={BroadcastId}", broadcastId);
                return assetHtml; // Fallback to raw HTML
            }

            // Normalize media URLs for participants
            var mediaSafeHtml = await _mediaUrlTransform.TransformMediaUrlsAsync(participantHtml, null);

            _logger.LogInformation("[ASSET-SHARING-SERVICE] Asset processing complete, final length={Length} chars, broadcastId={BroadcastId}",
                mediaSafeHtml?.Length ?? participantHtml.Length, broadcastId);

            return mediaSafeHtml ?? participantHtml;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARING-SERVICE] Error processing asset HTML, broadcastId={BroadcastId}", broadcastId);
            return assetHtml; // Fallback to raw HTML on error
        }
    }
}
