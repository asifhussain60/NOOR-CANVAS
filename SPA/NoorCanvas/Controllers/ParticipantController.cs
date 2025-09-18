using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using NoorCanvas.Services;
using System.Security.Cryptography;
using System.Text;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParticipantController : ControllerBase
    {
        private readonly CanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly ILogger<ParticipantController> _logger;
        private readonly SecureTokenService _tokenService;

        public ParticipantController(CanvasDbContext context, KSessionsDbContext kSessionsContext, ILogger<ParticipantController> logger, SecureTokenService tokenService)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
            _tokenService = tokenService;
        }

        /// <summary>
        /// Validate a session token for participant access (Phase 3.6 - Friendly Tokens)
        /// </summary>
        [HttpGet("session/{token}/validate")]
        public async Task<IActionResult> ValidateSessionToken(string token)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Session token validation request for token: {Token} from {ClientIp}",
                requestId, token, clientIp);

            try
            {
                if (string.IsNullOrWhiteSpace(token) || token.Length != 8)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT: [{RequestId}] Invalid token format: {Token}", requestId, token);
                    return BadRequest(new { error = "Invalid token format", message = "Token must be 8 characters", requestId });
                }

                // Validate as user token (isHostToken = false)
                var secureToken = await _tokenService.ValidateTokenAsync(token, isHostToken: false);

                if (secureToken == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT: [{RequestId}] Token validation failed for participant token: {Token}",
                        requestId, token);
                    return NotFound(new
                    {
                        error = "Invalid or expired session token",
                        token,
                        message = "The session token is invalid, expired, or has been revoked",
                        requestId
                    });
                }

                // Fetch fresh session title from KSESSIONS database instead of using stale stored title
                string sessionTitle = secureToken.Session?.Title ?? "Session " + secureToken.SessionId;
                string sessionDescription = secureToken.Session?.Description ?? "Session description not available";

                if (secureToken.Session?.KSessionsId.HasValue == true)
                {
                    var ksessionInfo = await _kSessionsContext.Sessions
                        .Where(s => s.SessionId == secureToken.Session.KSessionsId.Value)
                        .Select(s => new { s.SessionName, s.Description })
                        .FirstOrDefaultAsync();

                    if (ksessionInfo != null)
                    {
                        if (!string.IsNullOrEmpty(ksessionInfo.SessionName))
                        {
                            sessionTitle = ksessionInfo.SessionName;
                        }

                        if (!string.IsNullOrEmpty(ksessionInfo.Description))
                        {
                            sessionDescription = ksessionInfo.Description;
                        }

                        _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Updated session info from KSESSIONS: Title='{Title}', Description='{Description}' for session {SessionId}",
                            requestId, sessionTitle, sessionDescription, secureToken.SessionId);
                    }
                }

                _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Successful participant token validation: {Token} → Session {SessionId} - '{Title}'",
                    requestId, token, secureToken.SessionId, sessionTitle);

                // Return participant-specific session information
                return Ok(new
                {
                    valid = true,
                    sessionId = secureToken.SessionId,
                    token = token,
                    expiresAt = secureToken.ExpiresAt,
                    session = new
                    {
                        sessionId = secureToken.Session?.SessionId,
                        title = sessionTitle, // Use fresh title from KSESSIONS
                        description = sessionDescription,
                        status = secureToken.Session?.Status,
                        participantCount = secureToken.Session?.ParticipantCount,
                        maxParticipants = secureToken.Session?.MaxParticipants,
                        startedAt = secureToken.Session?.StartedAt,
                        createdAt = secureToken.Session?.CreatedAt
                    },
                    participant = new
                    {
                        joinUrl = $"/session/{token}",
                        accessCount = secureToken.AccessCount,
                        lastAccessedAt = secureToken.LastAccessedAt
                    },
                    requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("NOOR-PARTICIPANT: [{RequestId}] Exception during participant token validation: {Error}",
                    requestId, ex.Message);
                return StatusCode(500, new
                {
                    error = "Internal server error",
                    message = "Unable to validate session token",
                    requestId
                });
            }
        }

        /// <summary>
        /// Validate session using GUID (Legacy - Phase 1-3 compatibility)
        /// </summary>
        [HttpGet("session/{sessionGuid:guid}/validate")]
        public async Task<IActionResult> ValidateSession(string sessionGuid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Validating session: {SessionGuid}", sessionGuid);

                if (!Guid.TryParse(sessionGuid, out Guid guid))
                {
                    return BadRequest(new { error = "Invalid session GUID format" });
                }

                var sessionLink = await _context.SessionLinks
                    .Include(sl => sl.Session)
                    .FirstOrDefaultAsync(sl => sl.Guid == guid);

                if (sessionLink == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                if (sessionLink.State == 0)
                {
                    return BadRequest(new { error = "Session link is expired" });
                }

                var session = sessionLink.Session;
                if (session.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest(new { error = "Session has expired" });
                }

                var participantCount = await _context.Registrations
                    .CountAsync(r => r.SessionId == session.SessionId);

                _logger.LogInformation("NOOR-SUCCESS: Session validated: {SessionGuid}", sessionGuid);

                return Ok(new SessionValidationResponse
                {
                    Valid = true,
                    SessionId = session.SessionId,
                    GroupId = session.GroupId,
                    Status = session.StartedAt == null ? "Created" : (session.EndedAt == null ? "Active" : "Completed"),
                    ParticipantCount = participantCount,
                    MaxParticipants = 100, // Default for now
                    ExpiresAt = session.ExpiresAt ?? DateTime.UtcNow.AddHours(3),
                    CanJoin = participantCount < 100 && session.EndedAt == null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to validate session");
                return StatusCode(500, new { error = "Failed to validate session" });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterParticipant([FromBody] ParticipantRegistrationRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Participant registration: {Name}", request.Name);

                if (string.IsNullOrWhiteSpace(request.Name) ||
                    string.IsNullOrWhiteSpace(request.City) ||
                    string.IsNullOrWhiteSpace(request.Country))
                {
                    return BadRequest(new { error = "Name, city, and country are required" });
                }

                if (!Guid.TryParse(request.SessionGuid, out Guid sessionGuid))
                {
                    return BadRequest(new { error = "Invalid session GUID" });
                }

                var sessionLink = await _context.SessionLinks
                    .Include(sl => sl.Session)
                    .FirstOrDefaultAsync(sl => sl.Guid == sessionGuid);

                if (sessionLink == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                var session = sessionLink.Session;
                if (session.ExpiresAt < DateTime.UtcNow || session.EndedAt != null)
                {
                    return BadRequest(new { error = "Session is no longer available" });
                }

                // Create or find user
                Guid userId = string.IsNullOrEmpty(request.UserId) ? Guid.NewGuid() : Guid.Parse(request.UserId);

                var existingUser = await _context.Users.FindAsync(userId);
                if (existingUser == null)
                {
                    var newUser = new User
                    {
                        UserId = userId,
                        Name = request.Name.Trim(),
                        City = request.City.Trim(),
                        Country = request.Country.Trim(),
                        FirstJoinedAt = DateTime.UtcNow,
                        LastJoinedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(newUser);
                }
                else
                {
                    // Update user info
                    existingUser.Name = request.Name.Trim();
                    existingUser.City = request.City.Trim();
                    existingUser.Country = request.Country.Trim();
                    existingUser.LastJoinedAt = DateTime.UtcNow;
                }

                // Create registration
                var registration = new Registration
                {
                    SessionId = session.SessionId,
                    UserId = userId,
                    JoinTime = DateTime.UtcNow
                };

                _context.Registrations.Add(registration);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-SUCCESS: Participant registered: {Name} (ID: {UserId})",
                    request.Name, userId);

                return Ok(new ParticipantRegistrationResponse
                {
                    Success = true,
                    UserId = userId.ToString(),
                    RegistrationId = registration.RegistrationId,
                    WaitingRoomUrl = $"/session/{sessionGuid}/waiting",
                    JoinTime = registration.JoinTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to register participant");
                return StatusCode(500, new { error = "Registration failed" });
            }
        }

        /// <summary>
        /// Get participants for a session using token (Phase 3.6 - Friendly Tokens)
        /// </summary>
        [HttpGet("session/{token}/participants")]
        public async Task<IActionResult> GetSessionParticipants(string token)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Getting participants for session token: {Token}",
                requestId, token);

            try
            {
                if (string.IsNullOrWhiteSpace(token))
                {
                    return BadRequest(new { error = "Invalid token format", message = "Token is required", requestId });
                }

                // Handle mock tokens for testing/demo purposes
                if (token.Equals("MOCK", StringComparison.OrdinalIgnoreCase) ||
                    token.Equals("DEMO", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Returning mock participants for token: {Token}",
                        requestId, token);

                    var mockParticipants = new[]
                    {
                        new { userId = "1", displayName = "Dr. Fatima Al-Zahra", joinedAt = DateTime.UtcNow.AddMinutes(-15), role = "participant", city = "Cairo", country = "Egypt" },
                        new { userId = "2", displayName = "Ali Ibn Rashid", joinedAt = DateTime.UtcNow.AddMinutes(-12), role = "participant", city = "Dubai", country = "UAE" },
                        new { userId = "3", displayName = "Zainab Qureshi", joinedAt = DateTime.UtcNow.AddMinutes(-10), role = "participant", city = "Karachi", country = "Pakistan" },
                        new { userId = "4", displayName = "Omar Hassan", joinedAt = DateTime.UtcNow.AddMinutes(-8), role = "participant", city = "Tunis", country = "Tunisia" },
                        new { userId = "5", displayName = "Aisha Rahman", joinedAt = DateTime.UtcNow.AddMinutes(-6), role = "participant", city = "Dhaka", country = "Bangladesh" },
                        new { userId = "6", displayName = "Yusuf Al-Maghribi", joinedAt = DateTime.UtcNow.AddMinutes(-5), role = "participant", city = "Casablanca", country = "Morocco" },
                        new { userId = "7", displayName = "Mariam Khoury", joinedAt = DateTime.UtcNow.AddMinutes(-4), role = "participant", city = "Beirut", country = "Lebanon" },
                        new { userId = "8", displayName = "Ahmed El-Sayed", joinedAt = DateTime.UtcNow.AddMinutes(-3), role = "participant", city = "Alexandria", country = "Egypt" },
                        new { userId = "9", displayName = "Hafsa Nasir", joinedAt = DateTime.UtcNow.AddMinutes(-2), role = "participant", city = "Lahore", country = "Pakistan" },
                        new { userId = "10", displayName = "Ibrahim Maliki", joinedAt = DateTime.UtcNow.AddMinutes(-1), role = "participant", city = "Rabat", country = "Morocco" },
                        new { userId = "11", displayName = "Khadija Touré", joinedAt = DateTime.UtcNow.AddMinutes(-1), role = "participant", city = "Dakar", country = "Senegal" },
                        new { userId = "12", displayName = "Bilal Osman", joinedAt = DateTime.UtcNow, role = "participant", city = "Istanbul", country = "Turkey" }
                    };

                    return Ok(new
                    {
                        sessionId = "mock-session-123",
                        token,
                        participantCount = mockParticipants.Length,
                        participants = mockParticipants,
                        requestId
                    });
                }

                if (token.Length != 8)
                {
                    return BadRequest(new { error = "Invalid token format", message = "Token must be 8 characters", requestId });
                }

                // Validate the token first
                var secureToken = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                if (secureToken?.Session == null)
                {
                    return NotFound(new { error = "Session not found or token invalid", requestId });
                }

                var sessionId = secureToken.Session.SessionId;

                // Get participants from SessionParticipants table (active participants)
                var participants = await _context.SessionParticipants
                    .Where(sp => sp.SessionId == sessionId && sp.JoinedAt != null && sp.LeftAt == null)
                    .Select(sp => new
                    {
                        userId = sp.UserId,
                        displayName = sp.DisplayName ?? "Anonymous",
                        joinedAt = sp.JoinedAt ?? DateTime.UtcNow,
                        role = "participant",
                        city = (string?)null,
                        country = (string?)null
                    })
                    .ToListAsync();

                // Also get registered participants from Registrations table
                var registrations = await _context.Registrations
                    .Include(r => r.User)
                    .Where(r => r.SessionId == sessionId)
                    .Select(r => new
                    {
                        userId = r.UserId.ToString(), // Convert Guid to string to match SessionParticipant.UserId
                        displayName = (r.User != null ? r.User.Name : null) ?? "Unknown User", // Ensure non-null
                        joinedAt = r.JoinTime,
                        role = "registered",
                        city = r.User != null ? r.User.City : null,
                        country = r.User != null ? r.User.Country : null
                    })
                    .ToListAsync();

                // Combine and deduplicate participants
                var allParticipants = participants
                    .Union(registrations)
                    .GroupBy(p => p.userId)
                    .Select(g => g.OrderBy(p => p.role == "participant" ? 0 : 1).First()) // Prefer active participants
                    .OrderBy(p => p.joinedAt)
                    .ToList();

                _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Found {Count} participants for session {SessionId}",
                    requestId, allParticipants.Count, sessionId);

                return Ok(new
                {
                    sessionId,
                    token,
                    participantCount = allParticipants.Count,
                    participants = allParticipants,
                    requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT: [{RequestId}] Failed to get participants for token: {Token}",
                    requestId, token);
                return StatusCode(500, new { error = "Failed to get participants", requestId });
            }
        }

        [HttpGet("session/{sessionGuid}/status")]
        public async Task<IActionResult> GetSessionStatus(string sessionGuid, [FromQuery] string? userId)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Getting session status");

                if (!Guid.TryParse(sessionGuid, out Guid guid))
                {
                    return BadRequest(new { error = "Invalid session GUID" });
                }

                var sessionLink = await _context.SessionLinks
                    .Include(sl => sl.Session)
                    .FirstOrDefaultAsync(sl => sl.Guid == guid);

                if (sessionLink == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                var session = sessionLink.Session;
                Registration? userRegistration = null;

                if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out Guid userGuid))
                {
                    userRegistration = await _context.Registrations
                        .Include(r => r.User)
                        .FirstOrDefaultAsync(r => r.SessionId == session.SessionId && r.UserId == userGuid);
                }

                var participantCount = await _context.Registrations
                    .CountAsync(r => r.SessionId == session.SessionId);

                return Ok(new SessionStatusResponse
                {
                    SessionId = session.SessionId,
                    GroupId = session.GroupId,
                    Status = session.StartedAt == null ? "Created" : (session.EndedAt == null ? "Active" : "Completed"),
                    ParticipantCount = participantCount,
                    IsUserRegistered = userRegistration != null,
                    UserRegistration = userRegistration?.User?.Name,
                    StartedAt = session.StartedAt,
                    CanJoin = session.StartedAt != null && session.EndedAt == null && userRegistration != null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to get session status");
                return StatusCode(500, new { error = "Failed to get session status" });
            }
        }
    }

    // Request/Response Models
    public class ParticipantRegistrationRequest
    {
        public string SessionGuid { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Fingerprint { get; set; }
    }

    public class ParticipantRegistrationResponse
    {
        public bool Success { get; set; }
        public string UserId { get; set; } = string.Empty;
        public long RegistrationId { get; set; }
        public string WaitingRoomUrl { get; set; } = string.Empty;
        public DateTime JoinTime { get; set; }
    }

    public class SessionValidationResponse
    {
        public bool Valid { get; set; }
        public long SessionId { get; set; }
        public Guid GroupId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public int MaxParticipants { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool CanJoin { get; set; }
    }

    public class SessionStatusResponse
    {
        public long SessionId { get; set; }
        public Guid GroupId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public bool IsUserRegistered { get; set; }
        public string? UserRegistration { get; set; }
        public DateTime? StartedAt { get; set; }
        public bool CanJoin { get; set; }
    }
}
