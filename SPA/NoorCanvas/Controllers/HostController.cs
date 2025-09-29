using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NoorCanvas.Configuration;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Models;
using NoorCanvas.Models.DTOs;
using NoorCanvas.Models.KSESSIONS;
using NoorCanvas.Services;
using System.Text.Json;
using SimplifiedSession = NoorCanvas.Models.Simplified.Session;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly SimplifiedCanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly ILogger<HostController> _logger;
        private readonly IHubContext<SessionHub> _sessionHub;
        private readonly SimplifiedTokenService _simplifiedTokenService;
        private readonly CountriesOptions _countriesOptions;
        private readonly AssetHtmlProcessingService _assetHtmlProcessingService; // [DEBUG-WORKITEM:assetshare:impl:09291233-as1] HtmlAgilityPack asset processing ;CLEANUP_OK

        public HostController(SimplifiedCanvasDbContext context, KSessionsDbContext kSessionsContext, ILogger<HostController> logger, IHubContext<SessionHub> sessionHub, SimplifiedTokenService simplifiedTokenService, IOptions<CountriesOptions> countriesOptions, AssetHtmlProcessingService assetHtmlProcessingService)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
            _sessionHub = sessionHub;
            _simplifiedTokenService = simplifiedTokenService;
            _countriesOptions = countriesOptions.Value;
            _assetHtmlProcessingService = assetHtmlProcessingService; // [DEBUG-WORKITEM:assetshare:impl:09291233-as1] Initialize asset processing service ;CLEANUP_OK
        }

        [HttpPost("authenticate")]
    public IActionResult AuthenticateHost([FromBody] HostAuthRequest request)
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

                // Legacy HostAuthToken (base64 hash) flows have been removed.
                // If a base64 hash is provided, return a deprecation response pointing callers to the friendly token endpoints.
                if (isBase64Hash)
                {
                    _logger.LogWarning("NOOR-WARNING: Legacy HostAuthToken (base64 hash) authentication attempted and is deprecated");
                    return BadRequest(new { error = "Legacy HostAuthToken authentication is deprecated. Please use the friendly host token endpoints (POST /api/host/authenticate for GUIDs or GET /api/host/token/{friendlyToken}/validate)." });
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
    public IActionResult ValidateHostSession(string hostGuid)
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
                // HostAuthToken-based DB lookup removed. Recommend using the friendly host token endpoint instead.
                _logger.LogWarning("NOOR-HOST-VALIDATE: [{RequestId}] HostAuthToken lookup removed - received HostGuid: {HostGuid}", requestId, hostGuid);
                return Ok(new HostSessionValidationResponse
                {
                    Valid = false,
                    SessionId = 0,
                    HostGuid = hostGuid,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogError(ex, "NOOR-HOST-VALIDATE: [{RequestId}] Error during host session validation for GUID: {HostGuid}",
                    requestId, hostGuid?.Substring(0, Math.Min(8, hostGuid?.Length ?? 0)) + "...");

                return StatusCode(500, new
                {
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

                // Look up friendly token in simplified Sessions table
                _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Looking up friendly token in database", requestId);

                var session = await _simplifiedTokenService.ValidateTokenAsync(friendlyToken, isHostToken: true);

                if (session != null)
                {
                    // Fetch fresh session info (title and description) from KSESSIONS database instead of using stale stored data
                    string sessionTitle = "Session " + session.SessionId; // Default fallback, will be overridden from KSESSIONS
                    string sessionDescription = "Session description not available";

                    if (session.SessionId > 0) // SessionId now contains the KSESSIONS ID
                    {
                        var ksessionInfo = await _kSessionsContext.Sessions
                            .Where(s => s.SessionId == session.SessionId) // Use SessionId directly
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

                            _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Updated session info from KSESSIONS: Title='{Title}', Description='{Description}' for session {SessionId}",
                                requestId, sessionTitle, sessionDescription, session.SessionId);
                        }
                    }

                    _logger.LogInformation("NOOR-HOST-TOKEN-VALIDATE: [{RequestId}] Found session {SessionId} with title: {Title}",
                        requestId, session.SessionId, sessionTitle);

                    return Ok(new HostSessionValidationResponse
                    {
                        Valid = true,
                        SessionId = (int)session.SessionId,
                        HostGuid = friendlyToken, // Return the friendly token
                        Session = new HostSessionInfo
                        {
                            SessionId = (int)session.SessionId,
                            KSessionsId = session.SessionId,  // SessionId now contains the KSESSIONS ID
                            Title = sessionTitle, // Use fresh title from KSESSIONS
                            Description = sessionDescription,
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

                return StatusCode(500, new
                {
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
            // [RUN_ID:1229-1712-304] Add validation debugging for workitem sessionopener  
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("NOOR-WORKITEM-DEBUG[1229-1712-304]: Model validation failed. Errors: {ValidationErrors}", 
                    string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return BadRequest(ModelState);
            }
            
            _logger.LogInformation("NOOR-WORKITEM-DEBUG[1229-1712-304]: Received CreateSession request: {RequestData}", 
                System.Text.Json.JsonSerializer.Serialize(request));
                
            try
            {
                _logger.LogInformation("NOOR-INFO: Creating new session for Host GUID: {HostGuid}, Album: {AlbumId}, Category: {CategoryId}, Session: {SessionId}",
                    request.HostGuid?.Length > 8 ? request.HostGuid.Substring(0, 8) + "..." : request.HostGuid ?? "null", request.AlbumId, request.CategoryId, request.SessionId);

                // Validate required fields
                if (string.IsNullOrEmpty(request.HostGuid))
                {
                    return BadRequest(new { error = "HostGuid is required" });
                }

                if (request.SessionId <= 0 || request.AlbumId <= 0 || request.CategoryId <= 0)
                {
                    return BadRequest(new { error = "Valid SessionId, AlbumId, and CategoryId are required" });
                }

                // Host Provisioner has already created session record - FETCH not CREATE
                _logger.LogInformation("NOOR-HOST-CREATE: Fetching existing session with SessionId: {SessionId} created by Host Provisioner", request.SessionId);

                // FETCH existing session from Canvas database (created by Host Provisioner)
                var session = await _context.Sessions.FirstOrDefaultAsync(s => s.SessionId == request.SessionId);
                
                if (session == null)
                {
                    _logger.LogError("NOOR-HOST-CREATE: Session {SessionId} not found - Host Provisioner should have created it", request.SessionId);
                    return BadRequest(new { error = $"Session {request.SessionId} not found. Ensure Host Provisioner has created the session first." });
                }

                // Validate session belongs to this HostGuid
                if (session.HostToken != request.HostGuid)
                {
                    _logger.LogError("NOOR-HOST-CREATE: Session {SessionId} HostToken mismatch. Expected: {ExpectedHost}, Found: {ActualHost}", 
                        request.SessionId, request.HostGuid, session.HostToken);
                    return BadRequest(new { error = "Session does not belong to the specified HostGuid" });
                }

                _logger.LogInformation("NOOR-HOST-CREATE: Found existing session - SessionId: {SessionId}, HostToken: {HostToken}, UserToken: {UserToken}", 
                    session.SessionId, session.HostToken, session.UserToken);

                // Validate UserToken exists (should be populated by Host Provisioner)
                if (string.IsNullOrEmpty(session.UserToken))
                {
                    _logger.LogError("NOOR-HOST-CREATE: Session {SessionId} missing UserToken - Host Provisioner issue", request.SessionId);
                    return BadRequest(new { error = "Session found but UserToken is missing. Host Provisioner configuration issue." });
                }

                // Store Host Session Opener scheduling information - Issue sessionopener
                // This makes the custom date/time/duration accessible to SessionWaiting.razor
                if (!string.IsNullOrEmpty(request.SessionDate))
                {
                    session.ScheduledDate = request.SessionDate;
                    _logger.LogInformation("NOOR-HOST-CREATE: Updated scheduled date: {ScheduledDate}", request.SessionDate);
                }

                if (!string.IsNullOrEmpty(request.SessionTime))
                {
                    session.ScheduledTime = request.SessionTime;
                    _logger.LogInformation("NOOR-HOST-CREATE: Updated scheduled time: {ScheduledTime}", request.SessionTime);
                }

                if (!string.IsNullOrEmpty(request.SessionDuration))
                {
                    session.ScheduledDuration = request.SessionDuration;
                    _logger.LogInformation("NOOR-HOST-CREATE: Updated scheduled duration: {ScheduledDuration}", request.SessionDuration);
                }

                // Save scheduling information changes to database
                session.ModifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("NOOR-HOST-CREATE: Saved scheduling information to database for session {SessionId}", request.SessionId);

                var joinLink = $"https://localhost:9091/user/landing/{session.UserToken}";

                _logger.LogInformation("NOOR-SUCCESS: Session updated with scheduling info - SessionId: {SessionId}, Date: {Date}, Time: {Time}, Duration: {Duration}, Join Link: {JoinLink}",
                    session.SessionId, request.SessionDate, request.SessionTime, request.SessionDuration, joinLink);

                return Ok(new CreateSessionResponse
                {
                    SessionId = session.SessionId,
                    Status = "Success",
                    JoinLink = joinLink,
                    SessionGuid = session.HostToken
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
                session.Status = "Active";
                await _context.SaveChangesAsync();

                // Broadcast SessionBegan event via SignalR
                var sessionData = new
                {
                    sessionId = session.SessionId,
                    groupId = session.AlbumId, // Renamed from GroupId to AlbumId
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
        public async Task<IActionResult> GetAlbums([FromQuery] string? guid = null)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading albums from KSESSIONS database for host token: {Token}", guid?.Substring(0, Math.Min(8, guid?.Length ?? 0)) + "...");

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required for albums
                // All authenticated hosts can access Islamic content albums

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required
                // Groups (Albums) are Islamic content available to all authenticated hosts

                // Use stored procedure to get all groups (albums)
                var albums = await _kSessionsContext.Database
                    .SqlQuery<AlbumData>($"EXEC dbo.GetAllGroups")
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
        public async Task<IActionResult> GetCategories(int albumId, [FromQuery] string? guid = null)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading categories from KSESSIONS database for album: {AlbumId}, host token: {Token}", albumId, guid?.Substring(0, Math.Min(8, guid?.Length ?? 0)) + "...");

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required for categories
                // All authenticated hosts can access Islamic content categories

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required

                // Use stored procedure to get categories for the specified group
                var categories = await _kSessionsContext.Database
                    .SqlQuery<CategoryData>($"EXEC dbo.GetCategoriesForGroup {albumId}")
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
        public async Task<IActionResult> GetSessions(int categoryId, [FromQuery] string? guid = null)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Loading sessions from KSESSIONS database for category: {CategoryId}, host token: {Token}", categoryId, guid?.Substring(0, Math.Min(8, guid?.Length ?? 0)) + "...");

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required for sessions
                // All authenticated hosts can access Islamic content sessions

                // KSESSIONS data is read-only and publicly accessible - no GUID validation required

                // Query sessions for the specified category directly (no stored procedure needed)
                var sessions = await _kSessionsContext.Sessions
                    .Where(s => s.CategoryId == categoryId && s.IsActive == true)
                    .Select(s => new HostSessionData
                    {
                        SessionID = s.SessionId,
                        SessionName = s.SessionName,
                        Description = s.Description ?? string.Empty,
                        CategoryID = s.CategoryId,
                        IsActive = s.IsActive ?? false
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

        [HttpGet("countries")]
        public async Task<IActionResult> GetCountries([FromQuery] string guid)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";

            try
            {
                _logger.LogInformation("[API-CLEANED:09291900-api] [{RequestId}] Countries request started for token: {Token}", requestId, guid);

                if (string.IsNullOrWhiteSpace(guid))
                {
                    _logger.LogWarning("[API-CLEANED:09291900-api] [{RequestId}] Missing guid parameter", requestId);
                    return BadRequest(new { error = "Host token is required", requestId });
                }

                _logger.LogDebug("[API-CLEANED:09291900-api] [{RequestId}] UseShortlistedCountries setting: {UseShortlisted}", requestId, _countriesOptions.UseShortlistedCountries);

                // Query countries from KSESSIONS database using DbSet
                // Apply IsShortListed filter based on configuration
                var countriesQuery = _kSessionsContext.Countries
                    .Where(c => c.IsActive);

                if (_countriesOptions.UseShortlistedCountries)
                {
                    countriesQuery = countriesQuery.Where(c => c.IsShortListed);
                    _logger.LogDebug("[API-CLEANED:09291900-api] [{RequestId}] Applying IsShortListed filter", requestId);
                }
                else
                {
                    _logger.LogDebug("[API-CLEANED:09291900-api] [{RequestId}] Returning all active countries", requestId);
                }

                countriesQuery = countriesQuery
                    .OrderBy(c => c.CountryName)
                    .AsNoTracking();

                var countries = await countriesQuery
                    .Select(c => new CountryData
                    {
                        CountryID = c.CountryId,
                        CountryName = c.CountryName,
                        ISO2 = c.ISO2 ?? string.Empty,
                        ISO3 = c.ISO3 ?? string.Empty,
                        IsActive = c.IsActive,
                        IsShortListed = c.IsShortListed
                    })
                    .ToListAsync();

                _logger.LogInformation("[API-CLEANED:09291900-api] [{RequestId}] Countries loaded successfully: {CountryCount} countries", requestId, countries.Count);

                return Ok(countries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[API-CLEANED:09291900-api] [{RequestId}] Error loading countries", requestId);
                return StatusCode(500, new { error = "Failed to load countries", requestId });
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

        /*
        // DEPRECATED: Duplicate of CreateSession - use POST /api/host/session/create instead
        // Commented out per hostcanvas duplicate elimination - can be restored if KSESSIONS-specific begin behavior needed
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
                    .FirstOrDefaultAsync(s => s.HostToken == guid && s.ExpiresAt > DateTime.UtcNow)
                    ?? new NoorCanvas.Models.Simplified.Session
                    {
                        // Title removed - will be fetched from KSESSIONS_DEV.dbo.Sessions.SessionName via SessionId
                        // Description removed - will be fetched from KSESSIONS_DEV.dbo.Sessions.Description via SessionId
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow,
                        StartedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddHours(3),
                        HostToken = guid
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
                    groupId = session.AlbumId, // Renamed from GroupId to AlbumId
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
        */

        [HttpGet("session-details/{sessionId}")]
        public async Task<IActionResult> GetSessionDetails(int sessionId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-ISSUE-121-DEBUG: Getting session details for sessionId: {SessionId} with guid: {Guid}",
                    sessionId, guid?.Substring(0, Math.Min(8, guid.Length)) + "...");

                if (string.IsNullOrWhiteSpace(guid))
                {
                    return BadRequest(new { error = "Host token is required" });
                }

                // Query KSESSIONS database to get session details including transcript
                // ISSUE-121 FIX: JOIN with SessionTranscripts to include transcript content
                var sessionDetails = await (from session in _kSessionsContext.Sessions
                                            join transcript in _kSessionsContext.SessionTranscripts
                                            on session.SessionId equals transcript.SessionId into transcripts
                                            from t in transcripts.DefaultIfEmpty()
                                            where session.SessionId == sessionId
                                            select new
                                            {
                                                SessionId = session.SessionId,
                                                GroupId = session.GroupId,      // This is the Album ID (from KSESSIONS table)
                                                CategoryId = session.CategoryId,
                                                SessionName = session.SessionName,
                                                Description = session.Description,
                                                Transcript = t.Transcript ?? string.Empty // ✅ ISSUE-121: Include transcript content
                                            }).FirstOrDefaultAsync();

                if (sessionDetails == null)
                {
                    _logger.LogWarning("NOOR-ISSUE-121-ERROR: Session not found for SessionId: {SessionId}", sessionId);
                    return NotFound(new { error = "Session not found" });
                }

                // ISSUE-121 DEBUG: Log transcript details
                var transcriptLength = sessionDetails.Transcript?.Length ?? 0;
                var transcriptPreview = transcriptLength > 0 && !string.IsNullOrEmpty(sessionDetails.Transcript)
                    ? sessionDetails.Transcript.Substring(0, Math.Min(100, transcriptLength))
                    : "NULL";

                _logger.LogInformation("NOOR-ISSUE-121-SUCCESS: Found session details - SessionId: {SessionId}, GroupId: {GroupId}, CategoryId: {CategoryId}, TranscriptLength: {TranscriptLength}, Preview: {Preview}",
                    sessionDetails.SessionId, sessionDetails.GroupId, sessionDetails.CategoryId, transcriptLength, transcriptPreview);

                return Ok(sessionDetails);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to get session details for SessionId: {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to get session details" });
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

        [HttpGet("asset-patterns/{sessionId}")]
        public IActionResult GetAssetPatterns(int sessionId, [FromQuery] string guid)
        {
            try
            {
                _logger.LogInformation("NOOR-ASSET-API: Getting asset patterns for SessionId: {SessionId} with guid: {Guid}",
                    sessionId, guid?.Substring(0, Math.Min(8, guid?.Length ?? 0)) + "...");

                if (string.IsNullOrWhiteSpace(guid))
                {
                    return BadRequest(new { error = "Host token is required" });
                }

                // TODO: Add host token validation if needed
                // For now, return predefined asset patterns based on the content we see in transcripts

                var assetPatterns = new
                {
                    sessionId = sessionId,
                    patterns = new[]
                    {
                        new
                        {
                            type = "ayah-card",
                            selector = ".ayah-card",
                            description = "Quranic verse cards with Arabic text and translation",
                            priority = 1
                        },
                        new
                        {
                            type = "inline-arabic",
                            selector = ".inlineArabic",
                            description = "Inline Arabic text spans within content",
                            priority = 2
                        },
                        new
                        {
                            type = "ahadees-content",
                            selector = "[id*='ahadees-']",
                            description = "Hadith content blocks",
                            priority = 1
                        },
                        new
                        {
                            type = "ayah-header",
                            selector = ".clickable-ayah-header",
                            description = "Clickable Quranic verse headers",
                            priority = 3
                        }
                    }
                };

                _logger.LogInformation("NOOR-ASSET-API: Returning {PatternCount} asset patterns for session {SessionId}",
                    assetPatterns.patterns.Length, sessionId);

                return Ok(assetPatterns);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ASSET-API-ERROR: Failed to get asset patterns for SessionId: {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to get asset patterns" });
            }
        }

        /// <summary>
        /// Get all active AssetLookup definitions for asset detection
        /// Used by HostControlPanel for database-driven asset detection
        /// </summary>
        [HttpGet("asset-lookup")]
        public async Task<IActionResult> GetAssetLookup([FromQuery] string? hostToken = null)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:api] GetAssetLookup called with hostToken: {Token}", 
                    hostToken?.Substring(0, Math.Min(8, hostToken?.Length ?? 0)) + "...");

                // Get all active asset lookup definitions
                var assetLookups = await _context.AssetLookup
                    .Where(a => a.IsActive)
                    .OrderBy(a => a.AssetIdentifier)
                    .Select(a => new AssetLookupDto
                    {
                        AssetId = a.AssetId,
                        AssetIdentifier = a.AssetIdentifier,
                        AssetType = a.AssetType,
                        CssSelector = a.CssSelector,
                        DisplayName = a.DisplayName,
                        IsActive = a.IsActive,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:api] Found {Count} active asset lookup definitions", 
                    assetLookups.Count);

                var response = new AssetLookupResponse
                {
                    Success = true,
                    AssetLookups = assetLookups,
                    TotalCount = assetLookups.Count,
                    RequestId = HttpContext.TraceIdentifier
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:api] Failed to get AssetLookup data");
                return StatusCode(500, new { error = "Failed to get asset lookup data", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// [DEBUG-WORKITEM:api:impl:09291900-api] Get enhanced session details with transcript from KSESSIONS database
        /// Used by HostControlPanel to replace direct database access with API calls
        /// </summary>
        [HttpGet("ksessions/session/{sessionId}/details")]
        public async Task<IActionResult> GetKSessionsSessionDetails(int sessionId, [FromQuery] string? hostToken = null)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:api:impl:09291900-api] GetKSessionsSessionDetails called for sessionId: {SessionId} with hostToken: {Token}",
                    sessionId, hostToken?.Substring(0, Math.Min(8, hostToken?.Length ?? 0)) + "...");

                // Query KSESSIONS database to get complete session details including transcript and navigation data
                var session = await _kSessionsContext.Sessions
                    .Include(s => s.Group)
                    .Include(s => s.Category)
                    .Include(s => s.Speaker)
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:api:impl:09291900-api] Session not found for SessionId: {SessionId}", sessionId);
                    return NotFound(new EnhancedSessionDetailsResponse
                    {
                        Success = false,
                        Message = $"Session with ID {sessionId} not found",
                        Session = null,
                        TotalCount = 0
                    });
                }

                // Get transcript separately to avoid complex joins
                var transcript = await _kSessionsContext.SessionTranscripts
                    .FirstOrDefaultAsync(t => t.SessionId == sessionId);

                var sessionDetails = new SessionDetailsDto
                {
                    SessionId = session.SessionId,
                    GroupId = session.GroupId,
                    CategoryId = session.CategoryId,
                    SessionName = session.SessionName,
                    Description = session.Description,
                    SessionDate = session.SessionDate,
                    MediaPath = session.MediaPath,
                    SpeakerId = session.SpeakerId,
                    IsActive = session.IsActive,
                    Transcript = transcript?.Transcript,
                    CreatedDate = session.CreatedDate,
                    ChangedDate = session.ChangedDate,
                    GroupName = session.Group?.GroupName,
                    CategoryName = session.Category?.CategoryName,
                    SpeakerName = session.Speaker?.SpeakerName
                };



                // Log transcript details for debugging
                var transcriptLength = sessionDetails.Transcript?.Length ?? 0;
                _logger.LogInformation("[DEBUG-WORKITEM:api:impl:09291900-api] Found session details - SessionId: {SessionId}, SessionName: {SessionName}, GroupName: {GroupName}, TranscriptLength: {TranscriptLength}",
                    sessionDetails.SessionId, sessionDetails.SessionName, sessionDetails.GroupName, transcriptLength);

                var response = new EnhancedSessionDetailsResponse
                {
                    Success = true,
                    Message = "Session details retrieved successfully",
                    Session = sessionDetails,
                    TotalCount = 1
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:api:impl:09291900-api] Failed to get session details for SessionId: {SessionId}", sessionId);
                return StatusCode(500, new EnhancedSessionDetailsResponse
                {
                    Success = false,
                    Message = $"Failed to get session details: {ex.Message}",
                    Session = null,
                    TotalCount = 0
                });
            }
        }

        /// <summary>
        /// [DEBUG-WORKITEM:api:impl:09291900-api] Get country flag mappings from KSESSIONS database
        /// Used by ParticipantController to replace direct database access with API calls
        /// </summary>
        [HttpGet("ksessions/countries/flags")]
        public async Task<IActionResult> GetKSessionsCountryFlags([FromQuery] string[]? countryCodes = null)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:api:impl:09291900-api] GetKSessionsCountryFlags called for countries: {Countries}",
                    countryCodes != null ? string.Join(", ", countryCodes) : "ALL");

                // Query KSESSIONS database for country flag mappings
                var countryQuery = _kSessionsContext.Countries.AsQueryable();
                
                // Filter by specific country codes if provided
                if (countryCodes != null && countryCodes.Length > 0)
                {
                    countryQuery = countryQuery.Where(c => c.ISO2 != null && countryCodes.Contains(c.ISO2));
                }
                else
                {
                    // Get all active countries if no filter provided
                    countryQuery = countryQuery.Where(c => c.ISO2 != null && c.IsActive == true);
                }

                var countries = await countryQuery
                    .Select(c => new CountryFlagDto
                    {
                        ISO2 = c.ISO2!,
                        FlagCode = (c.ISO2 ?? "UN").ToLower(),
                        CountryName = c.CountryName,
                        IsActive = c.IsActive
                    })
                    .ToListAsync();

                // Create dictionary for quick lookup (matches original ParticipantController pattern)
                var countryFlags = countries.ToDictionary(c => c.ISO2, c => c.FlagCode);

                _logger.LogInformation("[DEBUG-WORKITEM:api:impl:09291900-api] Found {Count} country flag mappings: {Mappings}",
                    countries.Count, string.Join(", ", countryFlags.Select(kv => $"'{kv.Key}' -> '{kv.Value}'")));

                var response = new CountryFlagsResponse
                {
                    Success = true,
                    Message = "Country flags retrieved successfully",
                    CountryFlags = countryFlags,
                    Countries = countries,
                    TotalCount = countries.Count
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:api:impl:09291900-api] Failed to get country flags");
                return StatusCode(500, new CountryFlagsResponse
                {
                    Success = false,
                    Message = $"Failed to get country flags: {ex.Message}",
                    CountryFlags = new Dictionary<string, string>(),
                    Countries = null,
                    TotalCount = 0
                });
            }
        }

        /// <summary>
        /// Get all assets for a session from the SessionAssets lookup table
        /// Used by HostControlPanel transform function to inject share buttons
        /// </summary>
        [HttpGet("sessions/{sessionId}/assets")]
        public IActionResult GetSessionAssets(long sessionId, [FromQuery] string? type = null, [FromQuery] bool sharedOnly = false)
        {
            // LEGACY API - SessionAssets table was replaced by simplified AssetLookup approach
            // Asset detection is now handled directly in HostControlPanel.razor using AssetLookup table
            // Return empty response for backward compatibility

            _logger.LogInformation("LEGACY-ASSETS-API: GetSessionAssets called for session {SessionId} - returning empty response (replaced by simplified approach)", sessionId);

            var response = new NoorCanvas.Models.Simplified.SessionAssetsResponse
            {
                SessionId = sessionId,
                TotalAssets = 0,
                SharedAssets = 0,
                AssetsByType = new Dictionary<string, int>(),
                Assets = new List<NoorCanvas.Models.Simplified.SessionAssetDto>(),
                RequestId = HttpContext.TraceIdentifier
            };

            return Ok(response);
        }

        [HttpPost("share-asset")]
        public async Task<IActionResult> ShareAsset([FromBody] ShareAssetRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-SHARE-ASSET: Processing asset share request for session {SessionId}, asset type: {AssetType}",
                    request.SessionId, request.AssetPayload?.Type);

                if (request.SessionId <= 0)
                {
                    return BadRequest(new { error = "Valid session ID is required" });
                }

                if (request.AssetPayload == null)
                {
                    return BadRequest(new { error = "Asset payload is required" });
                }

                if (string.IsNullOrEmpty(request.AssetPayload.Type) || string.IsNullOrEmpty(request.AssetPayload.Selector))
                {
                    return BadRequest(new { error = "Asset type and selector are required" });
                }

                // TODO: Add host token validation if needed

                // Store asset in SessionData table (simplified schema)
                var assetData = new
                {
                    AssetType = request.AssetPayload.Type,
                    Selector = request.AssetPayload.Selector,
                    Metadata = request.AssetPayload.Metadata,
                    SharedAt = DateTime.UtcNow
                };

                var dataId = await _simplifiedTokenService.StoreAnnotationAsync(request.SessionId, assetData);

                _logger.LogInformation("NOOR-SHARE-ASSET: Asset stored with DataId {DataId} for session {SessionId}",
                    dataId, request.SessionId);

                // Broadcast to session participants via SessionHub (UC-L1 workflow)
                // COMPLIANCE FIX: Use consistent group naming with SessionHub.ShareAsset (session_{id})
                var sessionGroupName = $"session_{request.SessionId}";
                await _sessionHub.Clients.Group(sessionGroupName).SendAsync("AssetShared", new
                {
                    assetId = dataId,
                    sessionId = request.SessionId,
                    assetType = request.AssetPayload.Type,
                    selector = request.AssetPayload.Selector,
                    metadata = request.AssetPayload.Metadata,
                    sharedAt = assetData.SharedAt
                });

                _logger.LogInformation("NOOR-SHARE-ASSET: Asset broadcast completed for session group {SessionGroup}", sessionGroupName);

                return Ok(new
                {
                    success = true,
                    assetId = dataId,
                    message = "Asset shared successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-SHARE-ASSET-ERROR: Failed to share asset for session {SessionId}", request?.SessionId);
                return StatusCode(500, new { error = "Failed to share asset" });
            }
        }

        /// <summary>
        /// [DEBUG-WORKITEM:assetshare:impl:09291233-as1] Process HTML content for asset sharing using HtmlAgilityPack ;CLEANUP_OK
        /// </summary>
        /// <param name="request">HTML processing request containing content and session information</param>
        /// <returns>Processed HTML with detected assets and metadata</returns>
        [HttpPost("process-html-assets")]
        public IActionResult ProcessHtmlAssets([FromBody] ProcessHtmlAssetsRequest request)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Processing HTML assets for session {SessionId}, content length: {Length} ;CLEANUP_OK",
                    request.SessionId, request.HtmlContent?.Length ?? 0);

                if (request.SessionId <= 0)
                {
                    return BadRequest(new { error = "Valid session ID is required" });
                }

                if (string.IsNullOrWhiteSpace(request.HtmlContent))
                {
                    return BadRequest(new { error = "HTML content is required" });
                }

                // Validate HTML is suitable for asset processing
                if (!_assetHtmlProcessingService.ValidateHtmlForAssetProcessing(request.HtmlContent))
                {
                    _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] No shareable assets found in HTML content for session {SessionId} ;CLEANUP_OK", request.SessionId);
                    return Ok(new ProcessHtmlAssetsResponse
                    {
                        Success = true,
                        ProcessedHtml = request.HtmlContent,
                        DetectedAssets = new List<ProcessedAssetInfo>(),
                        AssetCount = 0,
                        Message = "HTML processed but no shareable assets detected"
                    });
                }

                // Process HTML using AssetHtmlProcessingService
                var processingResult = _assetHtmlProcessingService.ProcessHtmlForAssetSharing(request.HtmlContent, request.SessionId);

                if (!processingResult.ProcessingMetadata.Success)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] HTML processing failed for session {SessionId}: {Message} ;CLEANUP_OK",
                        request.SessionId, processingResult.ProcessingMetadata.Message);
                    return BadRequest(new { error = processingResult.ProcessingMetadata.Message });
                }

                // Convert detected assets to API response format
                var processedAssets = processingResult.DetectedAssets.Select(asset => new ProcessedAssetInfo
                {
                    AssetId = asset.AssetId,
                    AssetType = asset.AssetType,
                    DisplayName = asset.DisplayName,
                    CssSelector = asset.CssSelector,
                    Position = asset.Position,
                    TextContent = asset.Metadata.TryGetValue("textContent", out var textContent) 
                        ? textContent.ToString() ?? string.Empty 
                        : string.Empty,
                    Metadata = asset.Metadata
                }).ToList();

                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Successfully processed {AssetCount} assets for session {SessionId} ;CLEANUP_OK",
                    processedAssets.Count, request.SessionId);

                return Ok(new ProcessHtmlAssetsResponse
                {
                    Success = true,
                    ProcessedHtml = processingResult.ProcessedHtml,
                    DetectedAssets = processedAssets,
                    AssetCount = processedAssets.Count,
                    Message = $"Successfully processed {processedAssets.Count} shareable assets"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error processing HTML assets for session {SessionId} ;CLEANUP_OK", request?.SessionId);
                return StatusCode(500, new { error = "Failed to process HTML assets", details = ex.Message });
            }
        }

        /// <summary>
        /// [DEBUG-WORKITEM:assetshare:impl:09291233-as1] Extract specific asset content by asset ID ;CLEANUP_OK
        /// </summary>
        /// <param name="request">Asset extraction request with HTML content and asset ID</param>
        /// <returns>Extracted asset content with metadata</returns>
        [HttpPost("extract-asset")]
        public IActionResult ExtractAsset([FromBody] ExtractAssetRequest request)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Extracting asset {AssetId} for session {SessionId} ;CLEANUP_OK",
                    request.AssetId, request.SessionId);

                if (request.SessionId <= 0 || string.IsNullOrWhiteSpace(request.AssetId))
                {
                    return BadRequest(new { error = "Valid session ID and asset ID are required" });
                }

                if (string.IsNullOrWhiteSpace(request.HtmlContent))
                {
                    return BadRequest(new { error = "HTML content is required" });
                }

                // Extract asset using AssetHtmlProcessingService
                var extractedAsset = _assetHtmlProcessingService.ExtractAssetById(request.HtmlContent, request.AssetId);

                if (extractedAsset == null)
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Asset {AssetId} not found in HTML content for session {SessionId} ;CLEANUP_OK",
                        request.AssetId, request.SessionId);
                    return NotFound(new { error = $"Asset {request.AssetId} not found in the provided HTML content" });
                }

                _logger.LogInformation("[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Successfully extracted asset {AssetId}, type: {AssetType}, content length: {Length} ;CLEANUP_OK",
                    request.AssetId, extractedAsset.AssetType, extractedAsset.HtmlContent.Length);

                return Ok(new ExtractAssetResponse
                {
                    Success = true,
                    AssetId = extractedAsset.AssetId,
                    AssetType = extractedAsset.AssetType,
                    HtmlContent = extractedAsset.HtmlContent,
                    SafeHtmlContent = extractedAsset.SafeHtmlContent.Value,
                    TextContent = extractedAsset.TextContent,
                    Metadata = extractedAsset.Metadata,
                    ExtractedAt = extractedAsset.ExtractedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:assetshare:impl:09291233-as1] Error extracting asset {AssetId} for session {SessionId} ;CLEANUP_OK", 
                    request?.AssetId, request?.SessionId);
                return StatusCode(500, new { error = "Failed to extract asset", details = ex.Message });
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

        /// <summary>
        /// [API-MIGRATION:09291900-api] Get all sessions with token information for HostControlPanel token validation
        /// </summary>
        [HttpGet("sessions/list")]
        public async Task<IActionResult> GetSessionsList(string? hostToken = null)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Sessions list request started. HostToken: {HostToken}",
                    requestId, hostToken ?? "NULL");

                var sessionsQuery = _context.Sessions.AsQueryable();

                if (!string.IsNullOrEmpty(hostToken))
                {
                    sessionsQuery = sessionsQuery.Where(s => s.HostToken == hostToken);
                }

                var sessions = await sessionsQuery
                    .Select(s => new { s.SessionId, s.HostToken, s.UserToken, s.Status, s.ExpiresAt })
                    .ToListAsync();

                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Found {SessionCount} sessions",
                    requestId, sessions.Count);

                return Ok(new
                {
                    Success = true,
                    Sessions = sessions,
                    TotalCount = sessions.Count,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[API-MIGRATION:09291900-api] Error retrieving sessions list");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// [API-MIGRATION:09291900-api] Get session with scheduling information by session ID
        /// </summary>
        [HttpGet("sessions/{sessionId}/details")]
        public async Task<IActionResult> GetSessionWithScheduling(long sessionId)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Session details request for SessionId: {SessionId}",
                    requestId, sessionId);

                var session = await _context.Sessions
                    .Where(s => s.SessionId == sessionId)
                    .Select(s => new { s.ScheduledDate, s.ScheduledTime, s.ScheduledDuration, s.SessionId, s.HostToken, s.UserToken, s.Status })
                    .FirstOrDefaultAsync();

                if (session == null)
                {
                    _logger.LogWarning("[API-MIGRATION:09291900-api] [{RequestId}] Session not found: {SessionId}", requestId, sessionId);
                    return NotFound(new { error = "Session not found", sessionId });
                }

                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Session details retrieved successfully", requestId);

                return Ok(new
                {
                    Success = true,
                    Session = session,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[API-MIGRATION:09291900-api] Error retrieving session details for SessionId: {SessionId}", sessionId);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// [API-MIGRATION:09291900-api] Map host token to session ID
        /// </summary>
        [HttpGet("token/{hostToken}/session-id")]
        public async Task<IActionResult> GetSessionIdByToken(string hostToken)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Token mapping request for HostToken: {HostToken}",
                    requestId, hostToken);

                var session = await _context.Sessions
                    .Where(s => s.HostToken == hostToken)
                    .Select(s => new { s.SessionId, s.HostToken })
                    .FirstOrDefaultAsync();

                if (session == null)
                {
                    _logger.LogWarning("[API-MIGRATION:09291900-api] [{RequestId}] No session mapping found for token: {HostToken}", requestId, hostToken);
                    return NotFound(new { error = "No session mapping found for token", hostToken });
                }

                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Token mapped successfully: {HostToken} -> SessionId {SessionId}",
                    requestId, hostToken, session.SessionId);

                return Ok(new
                {
                    Success = true,
                    SessionId = session.SessionId.ToString(),
                    HostToken = session.HostToken,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[API-MIGRATION:09291900-api] Error mapping token to session ID for HostToken: {HostToken}", hostToken);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// [API-MIGRATION:09291900-api] Quick session ID extraction from host token
        /// </summary>
        [HttpGet("sessions/by-token/{hostToken}")]
        public async Task<IActionResult> GetSessionByToken(string hostToken)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString("N")[..8];
                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Session lookup by token: {HostToken}",
                    requestId, hostToken);

                var sessionId = await _context.Sessions
                    .Where(s => s.HostToken == hostToken)
                    .Select(s => s.SessionId)
                    .FirstOrDefaultAsync();

                if (sessionId == 0)
                {
                    _logger.LogWarning("[API-MIGRATION:09291900-api] [{RequestId}] Session not found for token: {HostToken}", requestId, hostToken);
                    return NotFound(new { error = "Session not found for token", hostToken });
                }

                _logger.LogInformation("[API-MIGRATION:09291900-api] [{RequestId}] Session found: {HostToken} -> SessionId {SessionId}",
                    requestId, hostToken, sessionId);

                return Ok(new
                {
                    Success = true,
                    SessionId = sessionId,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[API-MIGRATION:09291900-api] Error retrieving session by token: {HostToken}", hostToken);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
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
        public long? KSessionsId { get; set; }     // NEW: For session tracing
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

        // Host Session Opener scheduling fields
        public string SessionDate { get; set; } = string.Empty;    // Date: 09/28/2025
        public string SessionTime { get; set; } = string.Empty;    // Time: 6:00 AM  
        public string SessionDuration { get; set; } = string.Empty; // Duration: 60 (minutes)
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
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? SpeakerID { get; set; }
        public bool IsActive { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class CategoryData
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int GroupID { get; set; }
        public int SortOrder { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    public class CountryData
    {
        public int CountryID { get; set; }
        public string CountryName { get; set; } = string.Empty;
        public string ISO2 { get; set; } = string.Empty;
        public string? ISO3 { get; set; }
        public bool IsActive { get; set; }
        public bool IsShortListed { get; set; }
    }

    public class SessionStatusData
    {
        public string SessionName { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public DateTime? StartedAt { get; set; }
    }

    // Asset sharing models for UC-L1 workflow
    public class ShareAssetRequest
    {
        public int SessionId { get; set; }
        public string? HostToken { get; set; }
        public AssetPayloadDto? AssetPayload { get; set; }
    }

    public class AssetPayloadDto
    {
        public string Type { get; set; } = string.Empty;
        public string Selector { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    // [DEBUG-WORKITEM:assetshare:impl:09291233-as1] HtmlAgilityPack asset processing models ;CLEANUP_OK
    public class ProcessHtmlAssetsRequest
    {
        public long SessionId { get; set; }
        public string HtmlContent { get; set; } = string.Empty;
        public string? HostToken { get; set; }
    }

    public class ProcessHtmlAssetsResponse
    {
        public bool Success { get; set; }
        public string ProcessedHtml { get; set; } = string.Empty;
        public List<ProcessedAssetInfo> DetectedAssets { get; set; } = new();
        public int AssetCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ProcessedAssetInfo
    {
        public string AssetId { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string CssSelector { get; set; } = string.Empty;
        public int Position { get; set; }
        public string TextContent { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class ExtractAssetRequest
    {
        public long SessionId { get; set; }
        public string AssetId { get; set; } = string.Empty;
        public string HtmlContent { get; set; } = string.Empty;
        public string? HostToken { get; set; }
    }

    public class ExtractAssetResponse
    {
        public bool Success { get; set; }
        public string AssetId { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string HtmlContent { get; set; } = string.Empty;
        public string SafeHtmlContent { get; set; } = string.Empty;
        public string TextContent { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
        public DateTime ExtractedAt { get; set; }
    }

    // AssetLookup API models
    public class AssetLookupDto
    {
        public long AssetId { get; set; }
        public string AssetIdentifier { get; set; } = string.Empty;
        public string AssetType { get; set; } = string.Empty;
        public string? CssSelector { get; set; }
        public string? DisplayName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }



    public class AssetLookupResponse
    {
        public bool Success { get; set; }
        public List<AssetLookupDto> AssetLookups { get; set; } = new();
        public int TotalCount { get; set; }
        public string RequestId { get; set; } = string.Empty;
    }
}
