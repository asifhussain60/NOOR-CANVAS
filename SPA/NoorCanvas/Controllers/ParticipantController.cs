using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
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
        private readonly IHubContext<SessionHub> _sessionHub;

        public ParticipantController(CanvasDbContext context, KSessionsDbContext kSessionsContext, ILogger<ParticipantController> logger, SecureTokenService tokenService, IHubContext<SessionHub> sessionHub)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
            _tokenService = tokenService;
            _sessionHub = sessionHub;
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
                _logger.LogInformation("NOOR-DEBUG-REG: Name='{Name}', Country='{Country}'", 
                    request.Name ?? "NULL", request.Country ?? "NULL");

                if (string.IsNullOrWhiteSpace(request.Name) ||
                    string.IsNullOrWhiteSpace(request.Country))
                {
                    _logger.LogWarning("NOOR-DEBUG-REG: Validation failed - Name: '{Name}', Country: '{Country}'", 
                        request.Name ?? "NULL", request.Country ?? "NULL");
                    return BadRequest(new { error = "Name and country are required" });
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

                // Get the UserToken for this session to use in the waiting room URL
                var secureToken = await _context.SecureTokens
                    .FirstOrDefaultAsync(st => st.SessionId == session.SessionId && st.IsActive);

                if (secureToken == null)
                {
                    _logger.LogError("NOOR-ERROR: No active secure token found for session {SessionId}", session.SessionId);
                    return NotFound(new { error = "Session token not found" });
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

                // Debug logging for registration
                _logger.LogInformation("NOOR-DEBUG-REGISTRATION: User registered successfully");
                _logger.LogInformation("NOOR-DEBUG-REGISTRATION: Name: {Name}, UserId: {UserId}", request.Name, userId);
                _logger.LogInformation("NOOR-DEBUG-REGISTRATION: SessionId: {SessionId}, UserToken: {UserToken}", session.SessionId, secureToken.UserToken);
                _logger.LogInformation("NOOR-DEBUG-REGISTRATION: RegistrationId: {RegistrationId}, JoinTime: {JoinTime}", registration.RegistrationId, registration.JoinTime);
                _logger.LogInformation("NOOR-DEBUG-REGISTRATION: WaitingRoomUrl: /session/waiting/{UserToken}", secureToken.UserToken);

                _logger.LogInformation("NOOR-SUCCESS: Participant registered: {Name} (ID: {UserId}) for session token: {UserToken}",
                    request.Name, userId, secureToken.UserToken);

                // Broadcast participant joined event to session group for real-time updates
                try
                {
                    await _sessionHub.Clients.Group($"session_{session.SessionId}")
                        .SendAsync("ParticipantJoined", new
                        {
                            sessionId = session.SessionId,
                            participantId = userId.ToString(),
                            displayName = request.Name,
                            country = request.Country,
                            joinedAt = registration.JoinTime,
                            timestamp = DateTime.UtcNow
                        });
                    
                    _logger.LogInformation("NOOR-SIGNALR: [{UserId}] Broadcasted ParticipantJoined event for session {SessionId}", 
                        userId, session.SessionId);
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning(signalREx, "NOOR-SIGNALR: Failed to broadcast ParticipantJoined event for session {SessionId}", session.SessionId);
                    // Don't fail the registration if SignalR broadcasting fails
                }

                return Ok(new ParticipantRegistrationResponse
                {
                    Success = true,
                    UserId = userId.ToString(),
                    RegistrationId = registration.RegistrationId,
                    WaitingRoomUrl = $"/session/waiting/{secureToken.UserToken}",
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
        /// Register participant using token directly (for UserLanding.razor)
        /// </summary>
        [HttpPost("register-with-token")]
        public async Task<IActionResult> RegisterParticipantWithToken([FromBody] TokenBasedRegistrationRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            
            try
            {
                _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Token-based registration for {Name}", requestId, request.Name);

                if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Country) || string.IsNullOrWhiteSpace(request.Token))
                {
                    return BadRequest(new { error = "Name, country, and token are required", requestId });
                }

                // Validate the token first
                var secureToken = await _tokenService.ValidateTokenAsync(request.Token, isHostToken: false);
                if (secureToken?.Session == null)
                {
                    return NotFound(new { error = "Invalid token or session not found", requestId });
                }

                var session = secureToken.Session;

                // Check if user already registered for this session (prevent duplicates)
                var existingRegistration = await _context.Registrations
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.SessionId == session.SessionId && 
                                            r.User != null &&
                                            r.User.Name != null && r.User.Name.Trim().ToLower() == request.Name.Trim().ToLower() &&
                                            r.User.Country != null && r.User.Country.Trim().ToLower() == request.Country.Trim().ToLower());

                if (existingRegistration != null)
                {
                    _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] User {Name} from {Country} already registered for session {SessionId}", 
                        requestId, request.Name, request.Country, session.SessionId);
                    
                    return Ok(new
                    {
                        success = true,
                        userId = existingRegistration.UserId.ToString(),
                        registrationId = existingRegistration.RegistrationId,
                        waitingRoomUrl = $"/session/waiting/{request.Token}",
                        joinTime = existingRegistration.JoinTime,
                        requestId,
                        message = "Already registered"
                    });
                }

                // Create or find user
                var userId = Guid.NewGuid();
                var newUser = new User
                {
                    UserId = userId,
                    Name = request.Name.Trim(),
                    Country = request.Country.Trim(),
                    FirstJoinedAt = DateTime.UtcNow,
                    LastJoinedAt = DateTime.UtcNow
                };
                _context.Users.Add(newUser);

                // Create registration
                var registration = new Registration
                {
                    SessionId = session.SessionId,
                    UserId = userId,
                    JoinTime = DateTime.UtcNow
                };
                _context.Registrations.Add(registration);

                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Registration successful - Name: {Name}, UserId: {UserId}, SessionId: {SessionId}", 
                    requestId, request.Name, userId, session.SessionId);

                // Broadcast participant joined event to session group for real-time updates
                try
                {
                    await _sessionHub.Clients.Group($"session_{session.SessionId}")
                        .SendAsync("ParticipantJoined", new
                        {
                            sessionId = session.SessionId,
                            participantId = userId.ToString(),
                            displayName = request.Name,
                            country = request.Country,
                            joinedAt = registration.JoinTime,
                            timestamp = DateTime.UtcNow
                        });
                    
                    _logger.LogInformation("NOOR-SIGNALR: [{RequestId}] Broadcasted ParticipantJoined event for session {SessionId}", 
                        requestId, session.SessionId);
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning(signalREx, "NOOR-SIGNALR: [{RequestId}] Failed to broadcast ParticipantJoined event for session {SessionId}", 
                        requestId, session.SessionId);
                    // Don't fail the registration if SignalR broadcasting fails
                }

                return Ok(new
                {
                    success = true,
                    userId = userId.ToString(),
                    registrationId = registration.RegistrationId,
                    waitingRoomUrl = $"/session/waiting/{request.Token}",
                    joinTime = registration.JoinTime,
                    requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT: [{RequestId}] Failed to register participant with token: {Token}", requestId, request.Token);
                return StatusCode(500, new { error = "Registration failed", requestId });
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
                    _logger.LogError("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Token is null or empty", requestId);
                    return BadRequest(new { error = "Invalid token format", message = "Token is required", requestId });
                }

                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Token received: '{Token}', Length: {Length}", 
                    requestId, token, token.Length);

                // Only handle real tokens - no mock/demo data

                if (token.Length != 8)
                {
                    _logger.LogError("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Invalid token length: {Length}, Expected: 8", 
                        requestId, token.Length);
                    return BadRequest(new { error = "Invalid token format", message = "Token must be 8 characters", requestId });
                }

                // Validate the token first
                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Validating token with TokenService...", requestId);
                var secureToken = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                
                if (secureToken?.Session == null)
                {
                    _logger.LogError("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Token validation failed - no session found", requestId);
                    return NotFound(new { error = "Session not found or token invalid", requestId });
                }

                var sessionId = secureToken.Session.SessionId;
                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Token validation successful - SessionId: {SessionId}", 
                    requestId, sessionId);

                // Get participants from SessionParticipants table (active participants)
                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Querying SessionParticipants for SessionId: {SessionId}", 
                    requestId, sessionId);
                
                var participants = await _context.SessionParticipants
                    .Where(sp => sp.SessionId == sessionId && sp.JoinedAt != null && sp.LeftAt == null)
                    .Select(sp => new
                    {
                        userId = sp.UserId,
                        displayName = sp.DisplayName ?? "Anonymous",
                        joinedAt = sp.JoinedAt ?? DateTime.UtcNow,
                        role = "participant",
                        country = (string?)null
                    })
                    .ToListAsync();

                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Found {Count} active participants in SessionParticipants", 
                    requestId, participants.Count);

                // Also get registered participants from Registrations table
                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Querying Registrations for SessionId: {SessionId}", 
                    requestId, sessionId);
                
                var registrations = await _context.Registrations
                    .Include(r => r.User)
                    .Where(r => r.SessionId == sessionId)
                    .Select(r => new
                    {
                        userId = r.UserId.ToString(), // Convert Guid to string to match SessionParticipant.UserId
                        displayName = (r.User != null ? r.User.Name : null) ?? "Unknown User", // Ensure non-null
                        joinedAt = r.JoinTime,
                        role = "registered",
                        country = r.User != null ? r.User.Country : null
                    })
                    .ToListAsync();

                _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Found {Count} registered participants in Registrations", 
                    requestId, registrations.Count);

                // Log each registration for debugging
                foreach (var reg in registrations)
                {
                    _logger.LogInformation("NOOR-DEBUG-PARTICIPANTS: [{RequestId}] Registration - UserId: {UserId}, Name: {Name}, Country: {Country}, JoinTime: {JoinTime}", 
                        requestId, reg.userId, reg.displayName, reg.country, reg.joinedAt);
                }

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

        /// <summary>
        /// Test-only endpoint for creating token pairs for E2E testing
        /// Only available in development environment
        /// </summary>
        [HttpPost("test/create-token-pair")]
        public async Task<IActionResult> CreateTestTokenPair([FromBody] TestTokenCreationRequest request)
        {
            #if !DEBUG
            return NotFound();
            #endif
            
            var requestId = Guid.NewGuid().ToString("N")[..8];
            
            try
            {
                _logger.LogInformation("NOOR-TEST: [{RequestId}] Creating test token pair for SessionId {SessionId}", 
                    requestId, request.SessionId);

                var (hostToken, userToken) = await _tokenService.GenerateTokenPairAsync(
                    request.SessionId, 
                    request.ValidHours ?? 24,
                    HttpContext.Connection.RemoteIpAddress?.ToString());

                _logger.LogInformation("NOOR-TEST: [{RequestId}] Test token pair created - Host: {HostToken}, User: {UserToken}", 
                    requestId, hostToken, userToken);

                return Ok(new
                {
                    hostToken,
                    userToken,
                    sessionId = request.SessionId,
                    expiresAt = DateTime.UtcNow.AddHours(request.ValidHours ?? 24),
                    requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-TEST: [{RequestId}] Failed to create test token pair for SessionId {SessionId}", 
                    requestId, request.SessionId);
                return StatusCode(500, new { error = "Failed to create test token pair", requestId });
            }
        }
    }

    // Request/Response Models
    public class ParticipantRegistrationRequest
    {
        public string SessionGuid { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
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

    public class TokenBasedRegistrationRequest
    {
        public string Token { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Country { get; set; } = string.Empty;
    }

    public class TestTokenCreationRequest
    {
        public long SessionId { get; set; }
        public string? HostToken { get; set; }
        public string? UserToken { get; set; }
        public int? ValidHours { get; set; }
    }
}
