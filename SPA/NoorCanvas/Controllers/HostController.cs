using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Models;
using NoorCanvas.Models.KSESSIONS;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly CanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly ILogger<HostController> _logger;
        private readonly IHubContext<SessionHub> _sessionHub;

        public HostController(CanvasDbContext context, KSessionsDbContext kSessionsContext, ILogger<HostController> logger, IHubContext<SessionHub> sessionHub)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
            _sessionHub = sessionHub;
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> AuthenticateHost([FromBody] HostAuthRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Host authentication attempt for GUID: {HostGuid}",
                    request.HostGuid?.Substring(0, 8) + "...");

                if (string.IsNullOrWhiteSpace(request.HostGuid))
                {
                    _logger.LogWarning("NOOR-WARNING: Empty Host GUID");
                    return BadRequest(new { error = "Host GUID is required" });
                }

                // Check if it's a standard GUID format or a base64 hash
                bool isStandardGuid = Guid.TryParse(request.HostGuid, out Guid hostGuid);
                bool isBase64Hash = IsBase64String(request.HostGuid);

                if (!isStandardGuid && !isBase64Hash)
                {
                    _logger.LogWarning("NOOR-WARNING: Invalid Host GUID format - not GUID or base64");
                    return BadRequest(new { error = "Invalid GUID format" });
                }

                // If it's a base64 hash, look it up in the database
                if (isBase64Hash)
                {
                    _logger.LogInformation("NOOR-INFO: Authenticating with base64 hash from database");
                    var session = await _context.Sessions.FirstOrDefaultAsync(s => s.HostGuid == request.HostGuid);
                    if (session == null)
                    {
                        _logger.LogWarning("NOOR-WARNING: Host GUID hash not found in database");
                        return BadRequest(new { error = "Invalid Host GUID" });
                    }

                    _logger.LogInformation("NOOR-SUCCESS: Host authenticated with hash for Session {SessionId}", session.SessionId);
                    var sessionTokenHash = Guid.NewGuid().ToString();

                    return Ok(new HostAuthResponse
                    {
                        Success = true,
                        SessionToken = sessionTokenHash,
                        ExpiresAt = DateTime.UtcNow.AddHours(8),
                        HostGuid = request.HostGuid,
                        SessionId = (int)session.SessionId,
                        Session = new HostSessionInfo
                        {
                            SessionId = (int)session.SessionId,
                            Title = session.Title,
                            Description = session.Description,
                            Status = session.Status,
                            ParticipantCount = session.ParticipantCount ?? 0,
                            MaxParticipants = session.MaxParticipants,
                            StartedAt = session.StartedAt,
                            CreatedAt = session.CreatedAt
                        }
                    });
                }

                // For Phase 2, accept any valid GUID format as proof of concept
                _logger.LogInformation("NOOR-SUCCESS: Host GUID format validated");

                var sessionToken = Guid.NewGuid().ToString();

                return Ok(new HostAuthResponse
                {
                    Success = true,
                    SessionToken = sessionToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(8),
                    HostGuid = hostGuid.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Host authentication failed");
                return StatusCode(500, new { error = "Authentication failed" });
            }
        }

        [HttpGet("session/{hostGuid}/validate")]
        public async Task<IActionResult> ValidateHostSession(string hostGuid)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("NOOR-HOST-VALIDATE: [{RequestId}] Validating session for Host GUID: {HostGuid}", 
                    requestId, hostGuid?.Substring(0, Math.Min(8, hostGuid?.Length ?? 0)) + "...");

                if (string.IsNullOrWhiteSpace(hostGuid))
                {
                    _logger.LogWarning("NOOR-HOST-VALIDATE: [{RequestId}] Empty Host GUID provided", requestId);
                    return BadRequest(new { error = "Host GUID is required", valid = false, requestId });
                }

                // Always check database for exact match - token must exist in database to be valid
                _logger.LogInformation("NOOR-HOST-VALIDATE: [{RequestId}] Looking up session for HostGuid: {HostGuid}", requestId, hostGuid);
                
                var session = await _context.Sessions.FirstOrDefaultAsync(s => s.HostGuid == hostGuid);
                if (session != null)
                {
                    _logger.LogInformation("NOOR-HOST-VALIDATE: [{RequestId}] Found session {SessionId} with title: {Title}", 
                        requestId, session.SessionId, session.Title);
                    
                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = true,
                        SessionId = (int)session.SessionId,
                        HostGuid = hostGuid,
                        Session = new HostSessionInfo
                        {
                            SessionId = (int)session.SessionId,
                            Title = session.Title,
                            Description = session.Description,
                            Status = session.Status,
                            ParticipantCount = session.ParticipantCount ?? 0,
                            MaxParticipants = session.MaxParticipants,
                            StartedAt = session.StartedAt,
                            CreatedAt = session.CreatedAt
                        },
                        RequestId = requestId
                    });
                }
                else
                {
                    _logger.LogWarning("NOOR-HOST-VALIDATE: [{RequestId}] No session found for HostGuid: {HostGuid} - treating as invalid", requestId, hostGuid);
                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = false,
                        SessionId = 0,
                        HostGuid = hostGuid,
                        RequestId = requestId
                    });
                }
            }
            catch (Exception ex)
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogError(ex, "NOOR-HOST-VALIDATE: [{RequestId}] Error during host session validation for GUID: {HostGuid}", 
                    requestId, hostGuid?.Substring(0, Math.Min(8, hostGuid?.Length ?? 0)) + "...");
                
                return StatusCode(500, new { 
                    error = "Validation failed", 
                    valid = false, 
                    requestId,
                    details = ex.Message 
                });
            }
        }

        [HttpGet("token/{friendlyToken}/validate")]
        public async Task<IActionResult> ValidateHostToken(string friendlyToken)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Validating friendly token: {Token}", 
                    requestId, friendlyToken);

                if (string.IsNullOrWhiteSpace(friendlyToken))
                {
                    _logger.LogWarning("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Empty token provided", requestId);
                    return BadRequest(new { error = "Token is required", valid = false, requestId });
                }

                // Check if token format is valid (8 characters, alphanumeric)
                if (friendlyToken.Length != 8 || !friendlyToken.All(c => char.IsLetterOrDigit(c)))
                {
                    _logger.LogWarning("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Invalid token format: {Token}", 
                        requestId, friendlyToken);
                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = false,
                        SessionId = 0,
                        HostGuid = friendlyToken,
                        RequestId = requestId
                    });
                }

                // Look up friendly token in SecureTokens table
                _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Looking up friendly token in database", requestId);
                
                var secureToken = await _context.SecureTokens
                    .Include(st => st.Session)
                    .Where(st => st.HostToken == friendlyToken && st.IsActive && st.ExpiresAt > DateTime.UtcNow)
                    .FirstOrDefaultAsync();

                if (secureToken != null)
                {
                    _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Found session {SessionId} with title: {Title}", 
                        requestId, secureToken.Session.SessionId, secureToken.Session.Title);
                    
                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = true,
                        SessionId = (int)secureToken.SessionId,
                        HostGuid = friendlyToken, // Return the friendly token
                        Session = new HostSessionInfo
                        {
                            SessionId = (int)secureToken.Session.SessionId,
                            Title = secureToken.Session.Title,
                            Description = secureToken.Session.Description,
                            Status = secureToken.Session.Status,
                            ParticipantCount = secureToken.Session.ParticipantCount ?? 0,
                            MaxParticipants = secureToken.Session.MaxParticipants,
                            StartedAt = secureToken.Session.StartedAt,
                            CreatedAt = secureToken.Session.CreatedAt
                        },
                        RequestId = requestId
                    });
                }
                else
                {
                    _logger.LogWarning("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] No session found for friendly token: {Token}", 
                        requestId, friendlyToken);
                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = false,
                        SessionId = 0,
                        HostGuid = friendlyToken,
                        RequestId = requestId
                    });
                }
            }
            catch (Exception ex)
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogError(ex, "NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Error during token validation: {Token}", 
                    requestId, friendlyToken);
                
                return StatusCode(500, new { 
                    error = "Token validation failed", 
                    valid = false, 
                    requestId,
                    details = ex.Message 
                });
            }
        }

        // Host Dashboard removed - Phase 4 update: Hosts go directly to CreateSession after authentication

        [HttpPost("session/create")]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Creating new session for Host GUID: {HostGuid}, Album: {AlbumId}, Category: {CategoryId}, Session: {SessionId}",
                    request.HostGuid?.Substring(0, 8) + "...", request.AlbumId, request.CategoryId, request.SessionId);

                // Validate required fields
                if (string.IsNullOrEmpty(request.HostGuid))
                {
                    return BadRequest(new { error = "HostGuid is required" });
                }

                if (request.SessionId <= 0 || request.AlbumId <= 0 || request.CategoryId <= 0)
                {
                    return BadRequest(new { error = "Valid SessionId, AlbumId, and CategoryId are required" });
                }

                // Create session in Canvas database
                var session = new Session
                {
                    GroupId = Guid.NewGuid(),
                    HostGuid = request.HostGuid,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(3),
                    MaxParticipants = request.MaxParticipants
                };

                _context.Sessions.Add(session);
                await _context.SaveChangesAsync();

                // Create session link for participants to join
                var sessionLink = new SessionLink
                {
                    SessionId = session.SessionId,
                    Guid = Guid.NewGuid(),
                    State = 1, // Active
                    CreatedAt = DateTime.UtcNow
                };

                _context.SessionLinks.Add(sessionLink);
                await _context.SaveChangesAsync();

                var joinLink = $"https://localhost:9091/session/{sessionLink.Guid}";

                _logger.LogInformation("NOOR-SUCCESS: Session created with ID: {SessionId}, Join Link: {JoinLink}",
                    session.SessionId, joinLink);

                return Ok(new CreateSessionResponse
                {
                    SessionId = session.SessionId,
                    Status = "Success",
                    JoinLink = joinLink,
                    SessionGuid = sessionLink.Guid.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to create session");
                return StatusCode(500, new { error = "Failed to create session" });
            }
        }

        [HttpPost("session/{sessionId}/start")]
        public async Task<IActionResult> StartSession(long sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Starting session: {SessionId}", sessionId);

                var session = await _context.Sessions.FindAsync(sessionId);
                if (session == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                session.StartedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Broadcast SessionBegan event via SignalR
                var sessionData = new
                {
                    sessionId = session.SessionId,
                    groupId = session.GroupId,
                    startedAt = session.StartedAt,
                    expiresAt = session.ExpiresAt,
                    maxParticipants = session.MaxParticipants
                };

                var groupName = $"session_{sessionId}";
                await _sessionHub.Clients.Group(groupName).SendAsync("SessionBegan", sessionData);

                _logger.LogInformation("NOOR-SUCCESS: Session started and SessionBegan event broadcasted: {SessionId}", sessionId);
                return Ok(new { success = true, status = "Active" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to start session");
                return StatusCode(500, new { error = "Failed to start session" });
            }
        }

        [HttpPost("session/{sessionId}/end")]
        public async Task<IActionResult> EndSession(long sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Ending session: {SessionId}", sessionId);

                var session = await _context.Sessions.FindAsync(sessionId);
                if (session == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                session.EndedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Broadcast SessionEnded event via SignalR
                var sessionEndData = new
                {
                    sessionId = session.SessionId,
                    endedAt = session.EndedAt,
                    reason = "Host ended session"
                };

                var groupName = $"session_{sessionId}";
                await _sessionHub.Clients.Group(groupName).SendAsync("SessionEnded", sessionEndData);

                _logger.LogInformation("NOOR-SUCCESS: Session ended and SessionEnded event broadcasted: {SessionId}", sessionId);
                return Ok(new { success = true, status = "Completed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to end session");
                return StatusCode(500, new { error = "Failed to end session" });
            }
        }

        // NEW: Cascading Dropdown API Endpoints for Issue-17 Implementation

        [HttpGet("albums")]
        public async Task<IActionResult> GetAlbums([FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading albums from KSESSIONS database for host GUID: {Guid}", guid?.Substring(0, 8) + "...");

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                // Query KSESSIONS database for active Groups (Albums)
                var albums = await _kSessionsContext.Groups
                    .Where(g => g.IsActive == true || g.IsActive == null) // Include groups where IsActive is true or null
                    .OrderBy(g => g.GroupName)
                    .Select(g => new AlbumData
                    {
                        GroupId = g.GroupId,
                        GroupName = g.GroupName
                    })
                    .ToListAsync();

                _logger.LogInformation("NOOR-SUCCESS: Loaded {AlbumCount} albums from KSESSIONS database", albums.Count);
                return Ok(albums);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to load albums from KSESSIONS database");
                return StatusCode(500, new { error = "Failed to load albums" });
            }
        }

        [HttpGet("categories/{albumId}")]
        public async Task<IActionResult> GetCategories(int albumId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading categories from KSESSIONS database for album: {AlbumId}", albumId);

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                // Query KSESSIONS database for Categories within the specified Group
                var categories = await _kSessionsContext.Categories
                    .Where(c => c.GroupId == albumId && (c.IsActive == true || c.IsActive == null))
                    .OrderBy(c => c.SortOrder ?? c.CategoryId) // Sort by SortOrder if available, fallback to CategoryId
                    .Select(c => new CategoryData
                    {
                        CategoryId = c.CategoryId,
                        CategoryName = c.CategoryName
                    })
                    .ToListAsync();

                _logger.LogInformation("NOOR-SUCCESS: Loaded {CategoryCount} categories from KSESSIONS database for album {AlbumId}", categories.Count, albumId);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to load categories from KSESSIONS database for album {AlbumId}", albumId);
                return StatusCode(500, new { error = "Failed to load categories" });
            }
        }

        [HttpGet("sessions/{categoryId}")]
        public async Task<IActionResult> GetSessions(int categoryId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading sessions from KSESSIONS database for category: {CategoryId}", categoryId);

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                // Query KSESSIONS database for Sessions within the specified Category
                var sessions = await _kSessionsContext.Sessions
                    .Where(s => s.CategoryId == categoryId && (s.IsActive == true || s.IsActive == null))
                    .OrderBy(s => s.Sequence ?? s.SessionId) // Sort by Sequence if available, fallback to SessionId
                    .Select(s => new SessionData
                    {
                        SessionId = s.SessionId,
                        SessionName = s.SessionName
                    })
                    .ToListAsync();

                _logger.LogInformation("NOOR-SUCCESS: Loaded {SessionCount} sessions from KSESSIONS database for category {CategoryId}", sessions.Count, categoryId);
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to load sessions from KSESSIONS database for category {CategoryId}", categoryId);
                return StatusCode(500, new { error = "Failed to load sessions" });
            }
        }

        [HttpPost("generate-token")]
        public IActionResult GenerateSessionToken([FromQuery] int sessionId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Generating session token for session: {SessionId}", sessionId);

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                var sessionToken = Guid.NewGuid();
                var expiresAt = DateTime.UtcNow.AddHours(3); // 3-hour session duration

                // TODO Phase 4: Store session token in database with session association

                _logger.LogInformation("NOOR-SUCCESS: Session token generated for session {SessionId}", sessionId);
                return Ok(new
                {
                    sessionToken = sessionToken.ToString(),
                    sessionId = sessionId,
                    expiresAt = expiresAt,
                    joinLink = $"https://localhost:9091/session/{sessionToken}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to generate session token for session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to generate session token" });
            }
        }

        [HttpPost("sessions/{sessionId}/begin")]
        public async Task<IActionResult> BeginSession(int sessionId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Starting session: {SessionId}", sessionId);

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                // Find existing session or create a placeholder for the KSESSIONS sessionId
                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.HostGuid == guid && s.EndedAt == null)
                    ?? new Session
                    {
                        GroupId = Guid.NewGuid(),
                        HostGuid = guid,
                        CreatedAt = DateTime.UtcNow,
                        StartedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddHours(3)
                    };

                if (session.SessionId == 0)
                {
                    _context.Sessions.Add(session);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    session.StartedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Broadcast SessionBegan event via SignalR
                var sessionData = new
                {
                    sessionId = session.SessionId,
                    ksessionId = sessionId, // KSESSIONS database session ID
                    groupId = session.GroupId,
                    startedAt = session.StartedAt,
                    expiresAt = session.ExpiresAt,
                    hostGuid = guid
                };

                var groupName = $"session_{session.SessionId}";
                await _sessionHub.Clients.Group(groupName).SendAsync("SessionBegan", sessionData);

                _logger.LogInformation("NOOR-SUCCESS: Session {SessionId} started successfully and SessionBegan event broadcasted", sessionId);
                return Ok(new
                {
                    status = "Live",
                    sessionId = session.SessionId,
                    ksessionId = sessionId,
                    startedAt = session.StartedAt,
                    message = "Session started successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to start session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to start session" });
            }
        }

        [HttpGet("session-status")]
        public IActionResult GetSessionStatus([FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading current session status");

                if (string.IsNullOrWhiteSpace(guid) || !Guid.TryParse(guid, out Guid hostGuid))
                {
                    return BadRequest(new { error = "Invalid host GUID" });
                }

                // TODO Phase 4: Query actual active session from database
                // For now, return null (no active session)

                _logger.LogInformation("NOOR-INFO: No active session found");
                return Ok((object?)null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to load session status");
                return StatusCode(500, new { error = "Failed to load session status" });
            }
        }

        private static bool IsBase64String(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return false;

            try
            {
                // Check if it's a valid base64 string
                Convert.FromBase64String(s);
                // Additional check: base64 strings typically end with = or == for padding
                return s.Length % 4 == 0 && System.Text.RegularExpressions.Regex.IsMatch(s, @"^[a-zA-Z0-9+/]*={0,3}$");
            }
            catch
            {
                return false;
            }
        }
    }

    // Request/Response Models
    public class HostAuthRequest
    {
        public string HostGuid { get; set; } = string.Empty;
    }

    public class HostAuthResponse
    {
        public bool Success { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string HostGuid { get; set; } = string.Empty;
        public int SessionId { get; set; }
        public HostSessionInfo? Session { get; set; }
    }

    public class HostSessionInfo
    {
        public int SessionId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public int ParticipantCount { get; set; }
        public int? MaxParticipants { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class HostSessionValidationResponse
    {
        public bool Valid { get; set; }
        public int SessionId { get; set; }
        public string? HostGuid { get; set; }
        public HostSessionInfo? Session { get; set; }
        public string? RequestId { get; set; }
    }

    public class CreateSessionRequest
    {
        public string HostGuid { get; set; } = string.Empty;
        public int SessionId { get; set; }
        public int AlbumId { get; set; }
        public int CategoryId { get; set; }

        // Optional properties for session customization
        public string Title { get; set; } = "New Session";
        public string Description { get; set; } = string.Empty;
        public int? MaxParticipants { get; set; }
    }

    public class SessionResponse
    {
        public Guid SessionId { get; set; }
        public string SessionGuid { get; set; } = string.Empty;
        public string JoinLink { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class CreateSessionResponse
    {
        public long SessionId { get; set; }
        public string Status { get; set; } = "Success";
        public string JoinLink { get; set; } = string.Empty;
        public string SessionGuid { get; set; } = string.Empty;
    }

    // HostDashboardResponse and SessionSummaryResponse removed - Phase 4 update

    // Issue-17 Cascading Dropdown Models
    public class AlbumData
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; } = string.Empty;
    }

    public class CategoryData
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    public class SessionData
    {
        public int SessionId { get; set; }
        public string SessionName { get; set; } = string.Empty;
    }

    public class SessionStatusData
    {
        public string SessionName { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public DateTime? StartedAt { get; set; }
    }
}
