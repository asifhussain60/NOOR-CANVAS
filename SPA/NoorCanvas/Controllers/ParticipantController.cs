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
        private readonly ILogger<ParticipantController> _logger;
        private readonly SecureTokenService _tokenService;

        public ParticipantController(CanvasDbContext context, ILogger<ParticipantController> logger, SecureTokenService tokenService)
        {
            _context = context;
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
                    return NotFound(new { 
                        error = "Invalid or expired session token", 
                        token,
                        message = "The session token is invalid, expired, or has been revoked",
                        requestId 
                    });
                }

                _logger.LogInformation("NOOR-PARTICIPANT: [{RequestId}] Successful participant token validation: {Token} → Session {SessionId}", 
                    requestId, token, secureToken.SessionId);

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
                        title = secureToken.Session?.Title,
                        description = secureToken.Session?.Description,
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
                return StatusCode(500, new { 
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
