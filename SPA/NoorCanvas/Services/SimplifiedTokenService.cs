using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models.Simplified;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace NoorCanvas.Services;

/// <summary>
/// Simplified Token Service - Works with ultra-minimal 3-table schema
/// Handles tokens that are embedded directly in Session model
/// </summary>
public class SimplifiedTokenService
{
    private const string CHARSET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"; // Exclude 0/O, 1/I
    private const int TOKEN_LENGTH = 8;
    private readonly SimplifiedCanvasDbContext _context;
    private readonly ILogger<SimplifiedTokenService> _logger;

    public SimplifiedTokenService(SimplifiedCanvasDbContext context, ILogger<SimplifiedTokenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generate token pair embedded directly in Session (no separate table)
    /// </summary>
    public async Task<(string hostToken, string userToken)> GenerateTokenPairForSessionAsync(
        long sessionId,
        int validHours = 24,
        string? clientIp = null)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null)
            throw new InvalidOperationException($"Session {sessionId} not found");

        var hostToken = await GenerateUniqueTokenAsync();
        var userToken = await GenerateUniqueTokenAsync();

        // Embed tokens directly in Session
        session.HostToken = hostToken;
        session.UserToken = userToken;
        session.ExpiresAt = DateTime.UtcNow.AddHours(validHours);

        await _context.SaveChangesAsync();

        _logger.LogInformation("NOOR-SIMPLIFIED: Generated embedded tokens for Session {SessionId}: Host={HostToken}, User={UserToken}",
            sessionId, hostToken, userToken);

        return (hostToken, userToken);
    }

    /// <summary>
    /// Validate token using simplified schema (no SecureTokens table)
    /// </summary>
    public async Task<Session?> ValidateTokenAsync(string token, bool isHostToken)
    {
        var validationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Validating {TokenType} token: {Token}",
            validationId, isHostToken ? "HOST" : "USER", token);

        try
        {
            // First, check if any sessions exist at all
            var totalSessions = await _context.Sessions.CountAsync();
            _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Total sessions in database: {Count}",
                validationId, totalSessions);

            // Check for sessions with this specific token (without filters)
            var allMatchingTokenSessions = await _context.Sessions
                .Where(s => isHostToken ? s.HostToken == token : s.UserToken == token)
                .ToListAsync();
            _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Sessions matching token '{Token}': {Count}",
                validationId, token, allMatchingTokenSessions.Count);

            // Log details of matching sessions
            foreach (var ms in allMatchingTokenSessions)
            {
                _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Matching session - ID: {SessionId} (KSESSIONS_ID), Status: {Status}, ExpiresAt: {ExpiresAt}, HostToken: {HostToken}, UserToken: {UserToken}",
                    validationId, ms.SessionId, ms.Status, ms.ExpiresAt?.ToString() ?? "NULL", ms.HostToken, ms.UserToken);
            }

            // Apply the original filters and see what happens
            var session = await _context.Sessions
                .Where(s => (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow) && s.Status != "Expired")
                .Where(s => isHostToken ? s.HostToken == token : s.UserToken == token)
                .FirstOrDefaultAsync();

            if (session != null)
            {
                _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Token validation successful - Session {SessionId}",
                    validationId, session.SessionId);
            }
            else
            {
                _logger.LogWarning("NOOR-SIMPLIFIED: [{ValidationId}] Token validation failed - {TokenType} token not found or expired: {Token}",
                    validationId, isHostToken ? "HOST" : "USER", token);

                // Debug: Check what the current UTC time is
                _logger.LogInformation("NOOR-SIMPLIFIED: [{ValidationId}] Current UTC time: {UtcNow}",
                    validationId, DateTime.UtcNow);
            }

            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError("NOOR-SIMPLIFIED: [{ValidationId}] Exception during token validation: {Error}",
                validationId, ex.Message);
            _logger.LogError("NOOR-SIMPLIFIED: [{ValidationId}] Stack trace: {StackTrace}",
                validationId, ex.StackTrace);
            throw;
        }
    }

    /// <summary>
    /// Get session by token (unified lookup)
    /// </summary>
    public async Task<Session?> GetSessionByTokenAsync(string token)
    {
        return await _context.Sessions
            .Where(s => s.ExpiresAt > DateTime.UtcNow && s.Status != "Expired")
            .Where(s => s.HostToken == token || s.UserToken == token)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get session tokens by SessionId
    /// </summary>
    public async Task<(string? hostToken, string? userToken)?> GetTokensBySessionIdAsync(long sessionId)
    {
        var session = await _context.Sessions
            .Where(s => s.SessionId == sessionId && s.ExpiresAt > DateTime.UtcNow)
            .Select(s => new { s.HostToken, s.UserToken })
            .FirstOrDefaultAsync();

        if (session == null) return null;
        return (session.HostToken, session.UserToken);
    }

    /// <summary>
    /// Expire tokens for a session (set expiry to past)
    /// </summary>
    public async Task<bool> ExpireTokensAsync(long sessionId)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null) return false;

        session.ExpiresAt = DateTime.UtcNow.AddMinutes(-1); // Expire immediately
        await _context.SaveChangesAsync();

        _logger.LogInformation("NOOR-SIMPLIFIED: Expired tokens for Session {SessionId}", sessionId);
        return true;
    }

    /// <summary>
    /// Store annotation data in SessionData table using JSON
    /// </summary>
    public async Task<int> StoreAnnotationAsync(long sessionId, object annotationData, string? userGuid = null)
    {
        var sessionData = new SessionData
        {
            SessionId = (int)sessionId,
            DataType = "Annotation",
            Content = JsonSerializer.Serialize(annotationData),
            CreatedBy = userGuid?.ToString(),
            IsDeleted = false
        };

        _context.SessionData.Add(sessionData);
        await _context.SaveChangesAsync();

        _logger.LogInformation("NOOR-SIMPLIFIED: Stored annotation for Session {SessionId} - DataId {DataId}",
            sessionId, sessionData.DataId);

        return sessionData.DataId;
    }

    /// <summary>
    /// Store question data in SessionData table using JSON
    /// </summary>
    public async Task<int> StoreQuestionAsync(long sessionId, object questionData, string? userGuid = null)
    {
        var sessionData = new SessionData
        {
            SessionId = (int)sessionId,
            DataType = "Question",
            Content = JsonSerializer.Serialize(questionData),
            CreatedBy = userGuid?.ToString(),
            IsDeleted = false
        };

        _context.SessionData.Add(sessionData);
        await _context.SaveChangesAsync();

        _logger.LogInformation("NOOR-SIMPLIFIED: Stored question for Session {SessionId} - DataId {DataId}",
            sessionId, sessionData.DataId);

        return sessionData.DataId;
    }

    /// <summary>
    /// Get all session data by type (annotations, questions, etc.)
    /// </summary>
    public async Task<List<T>> GetSessionDataAsync<T>(long sessionId, string dataType) where T : class
    {
        var sessionDataList = await _context.SessionData
            .Where(sd => sd.SessionId == sessionId && sd.DataType == dataType && !sd.IsDeleted)
            .OrderBy(sd => sd.CreatedAt)
            .ToListAsync();

        var results = new List<T>();
        foreach (var data in sessionDataList)
        {
            try
            {
                var deserializedData = JsonSerializer.Deserialize<T>(data.Content ?? "{}");
                if (deserializedData != null)
                    results.Add(deserializedData);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("NOOR-SIMPLIFIED: Failed to deserialize SessionData {DataId}: {Error}",
                    data.DataId, ex.Message);
            }
        }

        return results;
    }

    private async Task<string> GenerateUniqueTokenAsync()
    {
        string token;
        int attempts = 0;
        const int maxAttempts = 100;

        do
        {
            token = GenerateRandomToken();
            attempts++;

            if (attempts > maxAttempts)
                throw new InvalidOperationException("Unable to generate unique token after maximum attempts");

        } while (await TokenExistsAsync(token));

        return token;
    }

    private string GenerateRandomToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var result = new StringBuilder(TOKEN_LENGTH);

        for (int i = 0; i < TOKEN_LENGTH; i++)
        {
            var randomByte = new byte[1];
            rng.GetBytes(randomByte);
            result.Append(CHARSET[randomByte[0] % CHARSET.Length]);
        }

        return result.ToString();
    }

    private async Task<bool> TokenExistsAsync(string token)
    {
        return await _context.Sessions
            .AnyAsync(s => s.HostToken == token || s.UserToken == token);
    }
}