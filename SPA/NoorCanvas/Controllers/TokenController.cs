using Microsoft.AspNetCore.Mvc;
using NoorCanvas.Services;
using NoorCanvas.Models;

namespace NoorCanvas.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TokenController : ControllerBase
{
    private readonly SecureTokenService _tokenService;
    private readonly ILogger<TokenController> _logger;

    public TokenController(SecureTokenService tokenService, ILogger<TokenController> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Validate a friendly token (host or user)
    /// </summary>
    [HttpGet("validate/{token}")]
    public async Task<IActionResult> ValidateToken(string token, [FromQuery] bool isHost = false)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();

        _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Validation request started", requestId);
        _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Token: {Token}, IsHost: {IsHost}, ClientIP: {ClientIp}",
            requestId, token, isHost, clientIp);
        _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] UserAgent: {UserAgent}", requestId, userAgent);
        _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Request URL: {Scheme}://{Host}{Path}{Query}",
            requestId, Request.Scheme, Request.Host, Request.Path, Request.QueryString);

        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("NOOR-TOKEN-DEBUG: [{RequestId}] Token is null or empty", requestId);
                return BadRequest(new { error = "Invalid token format", message = "Token cannot be empty", requestId });
            }

            if (token.Length != 8)
            {
                _logger.LogWarning("NOOR-TOKEN-DEBUG: [{RequestId}] Invalid token length: {Length}, expected 8 characters",
                    requestId, token.Length);
                return BadRequest(new
                {
                    error = "Invalid token format",
                    message = "Token must be 8 characters",
                    actualLength = token.Length,
                    requestId
                });
            }

            _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Calling SecureTokenService.ValidateTokenAsync", requestId);
            var secureToken = await _tokenService.ValidateTokenAsync(token, isHost);
            _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] SecureTokenService returned: {Result}",
                requestId, secureToken != null ? "Valid token object" : "null");

            if (secureToken == null)
            {
                _logger.LogWarning("NOOR-TOKEN-DEBUG: [{RequestId}] Token validation failed for {TokenType} token: {Token}",
                    requestId, isHost ? "HOST" : "USER", token);
                return NotFound(new
                {
                    error = "Invalid or expired token",
                    token,
                    tokenType = isHost ? "host" : "user",
                    requestId
                });
            }

            _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Successful {TokenType} token validation: {Token} → Session {SessionId}",
                requestId, isHost ? "HOST" : "USER", token, secureToken.SessionId);

            var response = new
            {
                valid = true,
                sessionId = secureToken.SessionId,
                tokenType = isHost ? "host" : "user",
                expiresAt = secureToken.ExpiresAt,
                accessCount = secureToken.AccessCount,
                session = new
                {
                    sessionId = secureToken.Session?.SessionId,
                    title = secureToken.Session?.Title,
                    description = secureToken.Session?.Description,
                    status = secureToken.Session?.Status,
                    createdAt = secureToken.Session?.CreatedAt
                }
            };

            _logger.LogInformation("NOOR-TOKEN-DEBUG: [{RequestId}] Returning successful response", requestId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError("NOOR-TOKEN-DEBUG: [{RequestId}] Exception during token validation: {Error}",
                requestId, ex.Message);
            _logger.LogError("NOOR-TOKEN-DEBUG: [{RequestId}] Stack trace: {StackTrace}", requestId, ex.StackTrace);
            return StatusCode(500, new
            {
                error = "Internal server error",
                message = ex.Message,
                requestId
            });
        }
    }

    /// <summary>
    /// Generate friendly token pair for a session (for testing)
    /// </summary>
    [HttpPost("generate/{sessionId}")]
    public async Task<IActionResult> GenerateTokenPair(long sessionId, [FromQuery] int validHours = 24)
    {
        try
        {
            var (hostToken, userToken) = await _tokenService.GenerateTokenPairAsync(
                sessionId,
                validHours,
                HttpContext.Connection.RemoteIpAddress?.ToString());

            _logger.LogInformation("NOOR-TOKEN: Generated token pair for Session {SessionId}", sessionId);

            return Ok(new
            {
                sessionId,
                hostToken,
                userToken,
                validHours,
                expiresAt = DateTime.UtcNow.AddHours(validHours),
                urls = new
                {
                    hostUrl = $"/host/{hostToken}",
                    userUrl = $"/session/{userToken}"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-TOKEN: Error generating token pair for session: {SessionId}", sessionId);
            return StatusCode(500, new { error = "Failed to generate tokens", message = ex.Message });
        }
    }

    /// <summary>
    /// Get token information for a session
    /// </summary>
    [HttpGet("session/{sessionId}")]
    public async Task<IActionResult> GetSessionToken(long sessionId)
    {
        try
        {
            var token = await _tokenService.GetTokenBySessionIdAsync(sessionId);

            if (token == null)
            {
                return NotFound(new { error = "No active tokens found for session", sessionId });
            }

            return Ok(new
            {
                sessionId = token.SessionId,
                hostToken = token.HostToken,
                userToken = token.UserToken,
                expiresAt = token.ExpiresAt,
                isActive = token.IsActive,
                accessCount = token.AccessCount,
                createdAt = token.CreatedAt,
                urls = new
                {
                    hostUrl = $"/host/{token.HostToken}",
                    userUrl = $"/session/{token.UserToken}"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-TOKEN: Error retrieving session token: {SessionId}", sessionId);
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Expire a specific user token (for ending sessions)
    /// </summary>
    [HttpPost("expire/{userToken}")]
    public async Task<IActionResult> ExpireUserToken(string userToken)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        _logger.LogInformation("NOOR-TOKEN-EXPIRE: [{RequestId}] Token expiration request started", requestId);
        _logger.LogInformation("NOOR-TOKEN-EXPIRE: [{RequestId}] UserToken: {UserToken}, ClientIP: {ClientIp}",
            requestId, userToken, clientIp);

        try
        {
            if (string.IsNullOrWhiteSpace(userToken))
            {
                _logger.LogWarning("NOOR-TOKEN-EXPIRE: [{RequestId}] Token is null or empty", requestId);
                return BadRequest(new { error = "Invalid token format", message = "Token cannot be empty", requestId });
            }

            if (userToken.Length != 8)
            {
                _logger.LogWarning("NOOR-TOKEN-EXPIRE: [{RequestId}] Invalid token length: {Length}, expected 8 characters",
                    requestId, userToken.Length);
                return BadRequest(new { 
                    error = "Invalid token format", 
                    message = "Token must be 8 characters", 
                    requestId 
                });
            }

            var success = await _tokenService.ExpireUserTokenAsync(userToken);
            
            if (!success)
            {
                _logger.LogWarning("NOOR-TOKEN-EXPIRE: [{RequestId}] Token not found or already expired: {UserToken}",
                    requestId, userToken);
                return NotFound(new { 
                    error = "Token not found or already expired", 
                    userToken,
                    requestId 
                });
            }

            _logger.LogInformation("NOOR-TOKEN-EXPIRE: [{RequestId}] Successfully expired user token: {UserToken}",
                requestId, userToken);

            return Ok(new
            {
                message = "User token expired successfully",
                userToken,
                expiredAt = DateTime.UtcNow,
                requestId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-TOKEN-EXPIRE: [{RequestId}] Error expiring user token: {UserToken}", 
                requestId, userToken);
            return StatusCode(500, new { 
                error = "Internal server error", 
                message = "Failed to expire token", 
                requestId 
            });
        }
    }
}
