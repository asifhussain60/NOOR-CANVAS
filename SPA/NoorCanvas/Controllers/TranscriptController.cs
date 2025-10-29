using Microsoft.AspNetCore.Mvc;
using NoorCanvas.Services;

namespace NoorCanvas.Controllers;

/// <summary>
/// [PHASE-1:hcp-cleanup] API controller for transcript processing operations
/// Extracted from HostControlPanel.razor to provide proper API layer separation
/// Provides RESTful endpoints for transcript retrieval, transformation, and asset detection
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class TranscriptController : ControllerBase
{
    private readonly TranscriptProcessingService _transcriptService;
    private readonly ILogger<TranscriptController> _logger;

    public TranscriptController(
        TranscriptProcessingService transcriptService,
        ILogger<TranscriptController> logger)
    {
        _transcriptService = transcriptService;
        _logger = logger;
    }

    /// <summary>
    /// Get transcript HTML content for a session
    /// </summary>
    /// <param name="sessionId">Session ID to retrieve transcript for</param>
    /// <returns>Transcript HTML with metadata</returns>
    /// <response code="200">Transcript retrieved successfully</response>
    /// <response code="404">Session not found or no transcript available</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("{sessionId}")]
    [ProducesResponseType(typeof(TranscriptResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTranscript(long sessionId)
    {
        try
        {
            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] GET /api/transcript/{SessionId} - Retrieving transcript",
                sessionId);

            var transcript = await _transcriptService.GetTranscriptAsync(sessionId);

            if (transcript == null)
            {
                _logger.LogWarning(
                    "[PHASE-1:hcp-cleanup] Transcript not found for session {SessionId}",
                    sessionId);
                return NotFound(new { error = "Transcript not found for this session" });
            }

            return Ok(new
            {
                sessionId = transcript.SessionId,
                transcript = transcript.Transcript,
                lastUpdated = transcript.LastUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[PHASE-1:hcp-cleanup] Failed to get transcript for session {SessionId}",
                sessionId);
            return StatusCode(500, new { error = "Failed to retrieve transcript" });
        }
    }

    /// <summary>
    /// Transform transcript HTML by removing buttons and attributes
    /// </summary>
    /// <param name="sessionId">Session ID for logging</param>
    /// <param name="request">Transformation request with HTML content and transformation type</param>
    /// <returns>Transformed HTML content</returns>
    /// <response code="200">Transformation completed successfully</response>
    /// <response code="400">Invalid request (empty HTML or unknown transformation type)</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("{sessionId}/transform")]
    [ProducesResponseType(typeof(TransformTranscriptResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> TransformTranscript(
        long sessionId,
        [FromBody] TransformTranscriptRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Html))
            {
                return BadRequest(new { error = "HTML content cannot be empty" });
            }

            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] POST /api/transcript/{SessionId}/transform - Type: {TransformationType}",
                sessionId, request.TransformationType);

            // Parse transformation type from string
            if (!Enum.TryParse<TransformationType>(request.TransformationType, true, out var transformationType))
            {
                return BadRequest(new { error = $"Unknown transformation type: {request.TransformationType}" });
            }

            var result = await _transcriptService.TransformTranscriptAsync(
                sessionId,
                request.Html,
                transformationType);

            return Ok(new
            {
                sessionId = result.SessionId,
                transformedHtml = result.TransformedHtml,
                transformationType = result.TransformationType,
                originalLength = result.OriginalLength,
                transformedLength = result.TransformedLength
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex,
                "[PHASE-1:hcp-cleanup] Invalid transformation request for session {SessionId}",
                sessionId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[PHASE-1:hcp-cleanup] Failed to transform transcript for session {SessionId}",
                sessionId);
            return StatusCode(500, new { error = "Failed to transform transcript" });
        }
    }

    /// <summary>
    /// Detect sharable assets in transcript HTML
    /// </summary>
    /// <param name="sessionId">Session ID for logging</param>
    /// <param name="request">Asset detection request with HTML content</param>
    /// <returns>Asset detection results with breakdown by type</returns>
    /// <response code="200">Asset detection completed successfully</response>
    /// <response code="400">Invalid request (empty HTML)</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("{sessionId}/detect-assets")]
    [ProducesResponseType(typeof(AssetDetectionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DetectAssets(
        long sessionId,
        [FromBody] DetectAssetsRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Html))
            {
                return BadRequest(new { error = "HTML content cannot be empty" });
            }

            _logger.LogInformation(
                "[PHASE-1:hcp-cleanup] POST /api/transcript/{SessionId}/detect-assets",
                sessionId);

            var result = await _transcriptService.DetectAssetsAsync(sessionId, request.Html);

            return Ok(new
            {
                sessionId = result.SessionId,
                totalAssets = result.TotalAssets,
                assetBreakdown = result.AssetBreakdown.Select(ab => new
                {
                    assetType = ab.AssetType,
                    count = ab.Count,
                    selector = ab.Selector,
                    displayName = ab.DisplayName
                })
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex,
                "[PHASE-1:hcp-cleanup] Invalid asset detection request for session {SessionId}",
                sessionId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[PHASE-1:hcp-cleanup] Failed to detect assets for session {SessionId}",
                sessionId);
            return StatusCode(500, new { error = "Failed to detect assets" });
        }
    }
}

#region Request DTOs

/// <summary>
/// Request model for POST /api/transcript/{sessionId}/transform
/// </summary>
public class TransformTranscriptRequest
{
    /// <summary>
    /// HTML content to transform
    /// </summary>
    public string Html { get; set; } = string.Empty;

    /// <summary>
    /// Type of transformation to apply: "remove-delete-buttons", "remove-share-buttons", "remove-asset-attributes", "full"
    /// </summary>
    public string TransformationType { get; set; } = "full";
}

/// <summary>
/// Request model for POST /api/transcript/{sessionId}/detect-assets
/// </summary>
public class DetectAssetsRequest
{
    /// <summary>
    /// HTML content to analyze for assets
    /// </summary>
    public string Html { get; set; } = string.Empty;
}

#endregion
