using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Services;

namespace NoorCanvas.Controllers;

/// <summary>
/// Simplified Token Controller - Works with 3-table schema using adapter pattern
/// Demonstrates how controllers adapt to the simplified architecture
/// </summary>
[ApiController]
[Route("api/simplified/[controller]")]
public class SimplifiedTokenController : ControllerBase
{
    private readonly SchemaTransitionAdapter _adapter;
    private readonly ILogger<SimplifiedTokenController> _logger;

    public SimplifiedTokenController(
        SchemaTransitionAdapter adapter,
        ILogger<SimplifiedTokenController> logger)
    {
        _adapter = adapter;
        _logger = logger;
    }

    /// <summary>
    /// Validate a token using the unified adapter (works with both schemas)
    /// </summary>
    [HttpGet("validate/{token}")]
    public async Task<IActionResult> ValidateToken(string token, [FromQuery] bool isHost = false)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Validating {TokenType} token: {Token}",
            requestId, isHost ? "HOST" : "USER", token);

        try
        {
            if (string.IsNullOrWhiteSpace(token) || token.Length != 8)
            {
                return BadRequest(new 
                { 
                    error = "Invalid token format", 
                    message = "Token must be 8 characters",
                    requestId 
                });
            }

            var result = await _adapter.ValidateTokenAsync(token, isHost);

            if (!result.IsValid)
            {
                _logger.LogWarning("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Token validation failed for {TokenType} token: {Token}",
                    requestId, isHost ? "HOST" : "USER", token);
                
                return NotFound(new
                {
                    error = "Invalid or expired token",
                    token,
                    isHost,
                    requestId
                });
            }

            _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Token validation successful using {Schema} schema - Session {SessionId}",
                requestId, result.Schema, result.SessionId);

            return Ok(new
            {
                valid = true,
                sessionId = result.SessionId,
                sessionTitle = result.SessionTitle,
                sessionStatus = result.SessionStatus,
                expiresAt = result.ExpiresAt,
                accessCount = result.AccessCount,
                schema = result.Schema,
                requestId,
                urls = new
                {
                    hostUrl = $"/host/control-panel/{token}",
                    userUrl = $"/user/landing/{token}"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Exception during token validation", requestId);
            return StatusCode(500, new 
            { 
                error = "Token validation failed", 
                requestId,
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Get session information using the unified adapter
    /// </summary>
    [HttpGet("session/{sessionId}")]
    public async Task<IActionResult> GetSessionInfo(long sessionId)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Getting session info for Session {SessionId}",
            requestId, sessionId);

        try
        {
            var sessionInfo = await _adapter.GetSessionInfoAsync(sessionId);

            if (sessionInfo == null)
            {
                return NotFound(new 
                { 
                    error = "Session not found", 
                    sessionId, 
                    requestId 
                });
            }

            _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Session info retrieved using {Schema} schema",
                requestId, sessionInfo.Schema);

            return Ok(new
            {
                sessionId = sessionInfo.SessionId,
                title = sessionInfo.Title,
                description = sessionInfo.Description,
                status = sessionInfo.Status,
                kSessionsId = sessionInfo.KSessionsId,
                participantCount = sessionInfo.ParticipantCount,
                hostToken = sessionInfo.HostToken,
                userToken = sessionInfo.UserToken,
                schema = sessionInfo.Schema,
                requestId,
                urls = new
                {
                    hostUrl = sessionInfo.HostToken != null ? $"/host/control-panel/{sessionInfo.HostToken}" : null,
                    userUrl = sessionInfo.UserToken != null ? $"/user/landing/{sessionInfo.UserToken}" : null
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Exception getting session info", requestId);
            return StatusCode(500, new 
            { 
                error = "Failed to get session info", 
                requestId,
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Get participants for a session using the unified adapter
    /// </summary>
    [HttpGet("session/{sessionId}/participants")]
    public async Task<IActionResult> GetSessionParticipants(long sessionId)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Getting participants for Session {SessionId}",
            requestId, sessionId);

        try
        {
            var participants = await _adapter.GetSessionParticipantsAsync(sessionId);

            _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Retrieved {Count} participants using {Schema} schema",
                requestId, participants.Count, participants.FirstOrDefault()?.Schema ?? "Unknown");

            return Ok(new
            {
                sessionId,
                participants = participants.Select(p => new
                {
                    userGuid = p.UserGuid,
                    displayName = p.DisplayName,
                    email = p.Email,
                    country = p.Country,
                    joinedAt = p.JoinedAt,
                    isHost = p.IsHost,
                    schema = p.Schema
                }),
                totalCount = participants.Count,
                requestId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-SIMPLIFIED-TOKEN: [{RequestId}] Exception getting session participants", requestId);
            return StatusCode(500, new 
            { 
                error = "Failed to get session participants", 
                requestId,
                message = ex.Message 
            });
        }
    }

    /// <summary>
    /// Schema information endpoint - shows which schema is currently active
    /// </summary>
    [HttpGet("schema-info")]
    public IActionResult GetSchemaInfo()
    {
        return Ok(new
        {
            message = "Simplified Token Controller using Schema Transition Adapter",
            features = new
            {
                unifiedTokenValidation = true,
                schemaAdaptability = true,
                compatibilityBridge = true,
                jsonContentStorage = true
            },
            architecture = new
            {
                tables = 3,
                reductionPercentage = 80,
                originalTables = 15,
                approach = "Embedded tokens + JSON content storage"
            }
        });
    }
}