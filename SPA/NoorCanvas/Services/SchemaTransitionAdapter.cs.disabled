using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using NoorCanvas.Models.Simplified;

namespace NoorCanvas.Services;

/// <summary>
/// Migration Adapter Service - Provides compatibility bridge during schema transition
/// Allows gradual migration from complex 15-table schema to simplified 3-table schema
/// </summary>
public class SchemaTransitionAdapter
{
    private readonly CanvasDbContext _legacyContext;
    private readonly SimplifiedCanvasDbContext _simplifiedContext;
    private readonly SimplifiedTokenService _simplifiedTokenService;
    private readonly SecureTokenService _legacyTokenService;
    private readonly ILogger<SchemaTransitionAdapter> _logger;
    private readonly bool _useSimplifiedSchema;

    public SchemaTransitionAdapter(
        CanvasDbContext legacyContext,
        SimplifiedCanvasDbContext simplifiedContext,
        SimplifiedTokenService simplifiedTokenService,
        SecureTokenService legacyTokenService,
        ILogger<SchemaTransitionAdapter> logger,
        IConfiguration configuration)
    {
        _legacyContext = legacyContext;
        _simplifiedContext = simplifiedContext;
        _simplifiedTokenService = simplifiedTokenService;
        _legacyTokenService = legacyTokenService;
        _logger = logger;
        
        // Feature flag to control which schema to use
        _useSimplifiedSchema = configuration.GetValue<bool>("Features:UseSimplifiedSchema", false);
        
        _logger.LogInformation("NOOR-ADAPTER: Initialized with {Schema} schema", 
            _useSimplifiedSchema ? "SIMPLIFIED" : "LEGACY");
    }

    /// <summary>
    /// Unified token validation that works with both schemas
    /// </summary>
    public async Task<SessionValidationResult> ValidateTokenAsync(string token, bool isHostToken)
    {
        if (_useSimplifiedSchema)
        {
            var simplifiedSession = await _simplifiedTokenService.ValidateTokenAsync(token, isHostToken);
            if (simplifiedSession != null)
            {
                return new SessionValidationResult
                {
                    IsValid = true,
                    SessionId = simplifiedSession.SessionId,
                    SessionTitle = simplifiedSession.Title,
                    SessionStatus = simplifiedSession.Status,
                    ExpiresAt = simplifiedSession.TokenExpiresAt,
                    AccessCount = simplifiedSession.TokenAccessCount,
                    Schema = "Simplified"
                };
            }
        }
        else
        {
            var legacySecureToken = await _legacyTokenService.ValidateTokenAsync(token, isHostToken);
            if (legacySecureToken?.Session != null)
            {
                return new SessionValidationResult
                {
                    IsValid = true,
                    SessionId = legacySecureToken.SessionId,
                    SessionTitle = legacySecureToken.Session.Title,
                    SessionStatus = legacySecureToken.Session.Status,
                    ExpiresAt = legacySecureToken.ExpiresAt,
                    AccessCount = legacySecureToken.AccessCount,
                    Schema = "Legacy"
                };
            }
        }

        return new SessionValidationResult { IsValid = false };
    }

    /// <summary>
    /// Get participants using the active schema
    /// </summary>
    public async Task<List<ParticipantInfo>> GetSessionParticipantsAsync(long sessionId)
    {
        if (_useSimplifiedSchema)
        {
            return await _simplifiedContext.Participants
                .Where(p => p.SessionId == sessionId && !p.IsDeleted)
                .Select(p => new ParticipantInfo
                {
                    UserGuid = p.UserGuid,
                    DisplayName = p.DisplayName,
                    Email = p.Email,
                    Country = p.Country,
                    JoinedAt = p.JoinedAt,
                    IsHost = p.IsHost,
                    Schema = "Simplified"
                })
                .ToListAsync();
        }
        else
        {
            // Legacy schema participant lookup
            return await _legacyContext.SessionParticipants
                .Where(sp => sp.SessionId == sessionId)
                .Join(_legacyContext.Users,
                    sp => sp.UserGuid,
                    u => u.UserGuid,
                    (sp, u) => new ParticipantInfo
                    {
                        UserGuid = u.UserGuid,
                        DisplayName = u.DisplayName,
                        Email = u.Email,
                        Country = u.Country,
                        JoinedAt = sp.JoinedAt,
                        IsHost = false, // Legacy determination logic
                        Schema = "Legacy"
                    })
                .ToListAsync();
        }
    }

    /// <summary>
    /// Add participant using the active schema
    /// </summary>
    public async Task<string> AddParticipantAsync(long sessionId, ParticipantRegistrationData registration)
    {
        var userGuid = Guid.NewGuid().ToString();

        if (_useSimplifiedSchema)
        {
            var participant = new NoorCanvas.Models.Simplified.Participant
            {
                SessionId = sessionId,
                UserGuid = userGuid,
                DisplayName = registration.DisplayName,
                Email = registration.Email,
                Country = registration.Country,
                IsHost = false,
                IsDeleted = false
            };

            _simplifiedContext.Participants.Add(participant);
            await _simplifiedContext.SaveChangesAsync();

            _logger.LogInformation("NOOR-ADAPTER: Added participant to simplified schema - Session {SessionId}, User {UserGuid}",
                sessionId, userGuid);
        }
        else
        {
            // Legacy schema - create User and SessionParticipant records
            var user = new User
            {
                UserGuid = userGuid,
                DisplayName = registration.DisplayName,
                Email = registration.Email,
                Country = registration.Country
            };

            var sessionParticipant = new SessionParticipant
            {
                SessionId = sessionId,
                UserGuid = userGuid
            };

            _legacyContext.Users.Add(user);
            _legacyContext.SessionParticipants.Add(sessionParticipant);
            await _legacyContext.SaveChangesAsync();

            _logger.LogInformation("NOOR-ADAPTER: Added participant to legacy schema - Session {SessionId}, User {UserGuid}",
                sessionId, userGuid);
        }

        return userGuid;
    }

    /// <summary>
    /// Store annotation using the active schema
    /// </summary>
    public async Task<int> StoreAnnotationAsync(long sessionId, object annotationData, string? userGuid = null)
    {
        if (_useSimplifiedSchema)
        {
            return await _simplifiedTokenService.StoreAnnotationAsync(sessionId, annotationData, userGuid);
        }
        else
        {
            // Legacy schema - use Annotations table
            var annotation = new Annotation
            {
                SessionId = sessionId,
                UserGuid = userGuid ?? "system",
                Content = System.Text.Json.JsonSerializer.Serialize(annotationData),
                CreatedAt = DateTime.UtcNow
            };

            _legacyContext.Annotations.Add(annotation);
            await _legacyContext.SaveChangesAsync();

            _logger.LogInformation("NOOR-ADAPTER: Stored annotation in legacy schema - Session {SessionId}, Annotation {AnnotationId}",
                sessionId, annotation.AnnotationId);

            return annotation.AnnotationId;
        }
    }

    /// <summary>
    /// Get session info using the active schema
    /// </summary>
    public async Task<SessionInfo?> GetSessionInfoAsync(long sessionId)
    {
        if (_useSimplifiedSchema)
        {
            var session = await _simplifiedContext.Sessions.FindAsync(sessionId);
            if (session == null) return null;

            return new SessionInfo
            {
                SessionId = session.SessionId,
                Title = session.Title,
                Description = session.Description,
                Status = session.Status,
                KSessionsId = session.KSessionsId,
                ParticipantCount = session.ParticipantCount,
                HostToken = session.HostToken,
                UserToken = session.UserToken,
                Schema = "Simplified"
            };
        }
        else
        {
            var session = await _legacyContext.Sessions.FindAsync(sessionId);
            if (session == null) return null;

            // Get tokens from SecureTokens table
            var tokens = await _legacyTokenService.GetTokenBySessionIdAsync(sessionId);

            return new SessionInfo
            {
                SessionId = session.SessionId,
                Title = session.Title,
                Description = session.Description,
                Status = session.Status,
                KSessionsId = session.KSessionsId,
                ParticipantCount = session.ParticipantCount,
                HostToken = tokens?.HostToken,
                UserToken = tokens?.UserToken,
                Schema = "Legacy"
            };
        }
    }
}

/// <summary>
/// Unified session validation result
/// </summary>
public class SessionValidationResult
{
    public bool IsValid { get; set; }
    public long SessionId { get; set; }
    public string? SessionTitle { get; set; }
    public string? SessionStatus { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int AccessCount { get; set; }
    public string Schema { get; set; } = "Unknown";
}

/// <summary>
/// Unified participant information
/// </summary>
public class ParticipantInfo
{
    public string UserGuid { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Country { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsHost { get; set; }
    public string Schema { get; set; } = "Unknown";
}

/// <summary>
/// Unified session information
/// </summary>
public class SessionInfo
{
    public long SessionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? KSessionsId { get; set; }
    public int ParticipantCount { get; set; }
    public string? HostToken { get; set; }
    public string? UserToken { get; set; }
    public string Schema { get; set; } = "Unknown";
}

/// <summary>
/// Participant registration data
/// </summary>
public class ParticipantRegistrationData
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Country { get; set; }
}