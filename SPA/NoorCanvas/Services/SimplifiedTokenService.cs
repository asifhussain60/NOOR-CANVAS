using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models.Simplified;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace NoorCanvas.Services;

/// <summary>
/// Simplified Token Service - Works with ultra-minimal 3-table schema
/// Handles tokens that are embedded directly in Session model.
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
    /// Generate token pair embedded directly in Session (no separate table).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<(string hostToken, string userToken)> GenerateTokenPairForSessionAsync(
        int sessionId,
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
    /// Validate token using simplified schema (no SecureTokens table).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<Session?> ValidateTokenAsync(string token, bool isHostToken)
    {
        var validationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Validating {TokenType} token: {Token} ;CLEANUP_OK",
            validationId, isHostToken ? "HOST" : "USER", token);

        try
        {
            // First, check if any sessions exist at all
            var totalSessions = await _context.Sessions.CountAsync();
            _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Total sessions in database: {Count} ;CLEANUP_OK",
                validationId, totalSessions);

            // Check for sessions with this specific token (without filters)
            var allMatchingTokenSessions = await _context.Sessions
                .Where(s => isHostToken ? s.HostToken == token : s.UserToken == token)
                .ToListAsync();
            _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Sessions matching token '{Token}': {Count} ;CLEANUP_OK",
                validationId, token, allMatchingTokenSessions.Count);

            // Log details of matching sessions
            foreach (var ms in allMatchingTokenSessions)
            {
                _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Matching session - ID: {SessionId}, Status: {Status}, ExpiresAt: {ExpiresAt}, HostToken: {HostToken}, UserToken: {UserToken} ;CLEANUP_OK",
                    validationId, ms.SessionId, ms.Status, ms.ExpiresAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "NULL", ms.HostToken, ms.UserToken);
            }

            // Log current UTC time for comparison
            var currentUtc = DateTime.UtcNow;
            _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Current UTC time: {UtcNow} ;CLEANUP_OK",
                validationId, currentUtc.ToString("yyyy-MM-dd HH:mm:ss"));

            // Apply the original filters and see what happens
            var session = await _context.Sessions
                .Where(s => (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow) && s.Status != "Expired")
                .Where(s => isHostToken ? s.HostToken == token : s.UserToken == token)
                .FirstOrDefaultAsync();

            if (session != null)
            {
                _logger.LogInformation("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] ✓ Token validation SUCCESSFUL - SessionId: {SessionId}, Status: {Status}, ExpiresAt: {ExpiresAt} ;CLEANUP_OK",
                    validationId, session.SessionId, session.Status, session.ExpiresAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "NULL");
            }
            else
            {
                _logger.LogWarning("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] ✗ Token validation FAILED - {TokenType} token: {Token} ;CLEANUP_OK",
                    validationId, isHostToken ? "HOST" : "USER", token);

                // Enhanced diagnostic: Check each filter condition separately
                if (allMatchingTokenSessions.Any())
                {
                    var firstMatch = allMatchingTokenSessions.First();
                    var expiresAtCheck = firstMatch.ExpiresAt == null || firstMatch.ExpiresAt > currentUtc;
                    var statusCheck = firstMatch.Status != "Expired";
                    
                    _logger.LogWarning("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Filter analysis for SessionId {SessionId}: ExpiresAt check: {ExpiresAtPass} (ExpiresAt={ExpiresAt}, CurrentUTC={CurrentUTC}), Status check: {StatusPass} (Status={Status}) ;CLEANUP_OK",
                        validationId, firstMatch.SessionId, expiresAtCheck, 
                        firstMatch.ExpiresAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "NULL", 
                        currentUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                        statusCheck, firstMatch.Status);
                }
            }

            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Exception during token validation: {Error} ;CLEANUP_OK",
                validationId, ex.Message);
            _logger.LogError("[DEBUG-WORKITEM:host-session-opener-fix:phase1] [{ValidationId}] Stack trace: {StackTrace} ;CLEANUP_OK",
                validationId, ex.StackTrace);
            throw;
        }
    }

    /// <summary>
    /// Get session by token (unified lookup).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<Session?> GetSessionByTokenAsync(string token)
    {
        return await _context.Sessions
            .Where(s => s.ExpiresAt > DateTime.UtcNow && s.Status != "Expired")
            .Where(s => s.HostToken == token || s.UserToken == token)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get session tokens by SessionId.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<(string? hostToken, string? userToken)?> GetTokensBySessionIdAsync(int sessionId)
    {
        var session = await _context.Sessions
            .Where(s => s.SessionId == sessionId && s.ExpiresAt > DateTime.UtcNow)
            .Select(s => new { s.HostToken, s.UserToken })
            .FirstOrDefaultAsync();

        if (session == null) return null;
        return (session.HostToken, session.UserToken);
    }

    /// <summary>
    /// Expire tokens for a session (set expiry to past).
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<bool> ExpireTokensAsync(int sessionId)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null) return false;

        session.ExpiresAt = DateTime.UtcNow.AddMinutes(-1); // Expire immediately
        await _context.SaveChangesAsync();

        _logger.LogInformation("NOOR-SIMPLIFIED: Expired tokens for Session {SessionId}", sessionId);
        return true;
    }

    /// <summary>
    /// Store annotation data in SessionData table using JSON.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<int> StoreAnnotationAsync(int sessionId, object annotationData, string? userGuid = null)
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
    /// Store question data in SessionData table using JSON.
    /// </summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<int> StoreQuestionAsync(int sessionId, object questionData, string? userGuid = null)
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
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public async Task<List<T>> GetSessionDataAsync<T>(int sessionId, string dataType) where T : class
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
            {
                _logger.LogError("NOOR-SIMPLIFIED-TOKEN: Failed to generate unique token after {MaxAttempts} attempts. Database may be saturated.", maxAttempts);
                throw new InvalidOperationException($"Unable to generate unique token after {maxAttempts} attempts. Consider increasing token length or cleaning expired tokens.");
            }

            // Add exponential backoff for collision retries
            if (attempts > 10)
            {
                var delayMs = Math.Min(1000, attempts * 10);
                await Task.Delay(delayMs);
                _logger.LogWarning("NOOR-SIMPLIFIED-TOKEN: Token collision detected, attempt {Attempt}/{MaxAttempts}, backing off {DelayMs}ms",
                    attempts, maxAttempts, delayMs);
            }

        } while (await TokenExistsAsync(token));

        if (attempts > 1)
        {
            _logger.LogInformation("NOOR-SIMPLIFIED-TOKEN: Generated unique token after {Attempts} attempts", attempts);
        }

        return token;
    }

    private static string GenerateRandomToken()
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
        // Check for global uniqueness across both host and user tokens
        // including expired sessions to prevent immediate reuse
        var hostTokenExists = await _context.Sessions
            .AnyAsync(s => s.HostToken == token);

        var userTokenExists = await _context.Sessions
            .AnyAsync(s => s.UserToken == token);

        var tokenExists = hostTokenExists || userTokenExists;

        if (tokenExists)
        {
            _logger.LogDebug("NOOR-SIMPLIFIED-TOKEN: Token collision detected - Token: {Token}, HostToken: {HostExists}, UserToken: {UserExists}",
                token, hostTokenExists, userTokenExists);
        }

        return tokenExists;
    }
}
