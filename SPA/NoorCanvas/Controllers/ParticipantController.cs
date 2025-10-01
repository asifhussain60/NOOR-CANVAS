using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Models.DTOs;
using NoorCanvas.Services;
using NoorCanvas.Models.Simplified;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    /// <summary>
    /// Handles participant registration, validation, and session management operations.
    /// </summary>
    public class ParticipantController : ControllerBase
    {
        private readonly SimplifiedCanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly ILogger<ParticipantController> _logger;
        private readonly SimplifiedTokenService _tokenService;
        private readonly IHubContext<SessionHub> _sessionHub;
        private readonly IHttpClientFactory _httpClientFactory;

        /// <summary>
        /// Initializes a new instance of the <see cref="ParticipantController"/> class.
        /// </summary>
        /// <param name="context">The simplified canvas database context.</param>
        /// <param name="kSessionsContext">The KSESSIONS database context.</param>
        /// <param name="logger">The logger instance.</param>
        /// <param name="tokenService">The token service for session validation.</param>
        /// <param name="sessionHub">The SignalR session hub.</param>
        /// <param name="httpClientFactory">The HTTP client factory for API calls.</param>
        public ParticipantController(
            SimplifiedCanvasDbContext context,
            KSessionsDbContext kSessionsContext,
            ILogger<ParticipantController> logger,
            SimplifiedTokenService tokenService,
            IHubContext<SessionHub> sessionHub,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
            _tokenService = tokenService;
            _sessionHub = sessionHub;
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Validates a session token and returns session details if valid.
        /// </summary>
        /// <param name="token">The session token to validate.</param>
        /// <returns>Session validation result with details.</returns>
        [HttpGet("session/{token}/validate")]
        public async Task<IActionResult> ValidateSessionToken(string token)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";

            _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Session validation request started", requestId);
            _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Token: {Token}, ClientIP: {ClientIp}, UserAgent: {UserAgent}",
                requestId, token, clientIp, userAgent);
            _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Request URL: {Scheme}://{Host}{Path}{Query}",
                requestId, Request.Scheme, Request.Host, Request.Path, Request.QueryString);

            try
            {
                if (string.IsNullOrWhiteSpace(token))
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Token is null or empty", requestId);
                    return BadRequest(new { Error = "Token cannot be empty", RequestId = requestId });
                }

                if (token.Length != 8)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Invalid token length: {Length}, expected 8 characters",
                        requestId, token.Length);
                    return BadRequest(new { Error = "Invalid token format - must be 8 characters", ActualLength = token.Length, RequestId = requestId });
                }

                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Calling SimplifiedTokenService.ValidateTokenAsync for USER token", requestId);
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] SimplifiedTokenService returned: {Result}",
                    requestId, session != null ? $"Session {session.SessionId}" : "null");

                if (session == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Session not found for token: {Token}",
                        requestId, token);
                    return NotFound(new { Error = "Invalid or expired session token", Valid = false, RequestId = requestId });
                }

                // Fetch session title from KSESSIONS database
                string sessionTitle = "Session " + session.SessionId; // Fallback
                try
                {
                    var ksessionInfo = await _kSessionsContext.Sessions
                        .Where(s => s.SessionId == session.SessionId)
                        .Select(s => s.SessionName)
                        .FirstOrDefaultAsync();

                    if (!string.IsNullOrEmpty(ksessionInfo))
                    {
                        sessionTitle = ksessionInfo;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Failed to fetch session title from KSESSIONS: {Error}", requestId, ex.Message);
                }

                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Session found: SessionId={SessionId} (KSESSIONS_ID), Title={Title}, Status={Status}",
                    requestId, session.SessionId, sessionTitle, session.Status);

                // Get participant count from simplified schema
                var participantCount = await _context.Participants
                    .Where(p => p.SessionId == session.SessionId)
                    .CountAsync();

                // Get speaker information, session timing, and description from KSESSIONS database
                string? speakerName = null;
                DateTime? realSessionDate = null;
                string? sessionDescription = null;
                try
                {
                    var sessionWithSpeaker = await _kSessionsContext.Sessions
                        .Include(s => s.Speaker)
                        .FirstOrDefaultAsync(s => s.SessionId == (int)session.SessionId);

                    speakerName = sessionWithSpeaker?.Speaker?.SpeakerName;
                    realSessionDate = sessionWithSpeaker?.SessionDate;
                    sessionDescription = sessionWithSpeaker?.Description;

                    _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Retrieved from KSESSIONS - Speaker: {SpeakerName}, SessionDate: {SessionDate}, Description: {Description}",
                        requestId, speakerName ?? "null", realSessionDate?.ToString() ?? "null", sessionDescription ?? "null");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Failed to retrieve speaker/session information from KSESSIONS", requestId);
                }

                var response = new
                {
                    Valid = true,
                    SessionId = session.SessionId,
                    Token = token,
                    ExpiresAt = session.ExpiresAt,
                    Session = new
                    {
                        SessionId = session.SessionId,
                        Title = sessionTitle,
                        Description = sessionDescription ?? "Session description not available",
                        Status = session.Status,
                        ParticipantCount = participantCount,
                        MaxParticipants = (int?)null, // Not stored in simplified schema
                        StartedAt = realSessionDate ?? session.CreatedAt, // Use real KSESSIONS SessionDate or fallback to CreatedAt
                        CreatedAt = session.CreatedAt,
                        InstructorName = speakerName, // Database-driven instructor name from KSESSIONS.Speakers
                        // Real session timing from KSESSIONS database
                        StartTime = realSessionDate ?? session.CreatedAt.AddMinutes(5), // Use real scheduled date or fallback
                        Duration = TimeSpan.FromHours(1), // Keep 1 hour default for now - can be enhanced later

                        // Host Session Opener custom scheduling fields - Issue sessionopener
                        // These make the host form data (Date: 09/28/2025, Time: 6:00 AM, Duration: 60) accessible to SessionWaiting.razor
                        ScheduledDate = session.ScheduledDate,    // Custom date from Host Session Opener form
                        ScheduledTime = session.ScheduledTime,    // Custom time from Host Session Opener form  
                        ScheduledDuration = session.ScheduledDuration // Custom duration from Host Session Opener form
                    },
                    Participant = new
                    {
                        JoinUrl = $"/session/waiting/{token}",
                        AccessCount = 0,
                        LastAccessedAt = (DateTime?)null
                    },
                    RequestId = requestId
                };

                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Validation successful! Returning response", requestId);
                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Response: Valid=true, SessionId={SessionId}, Title={Title}, Status={Status}, ExpiresAt={ExpiresAt}",
                    requestId, session.SessionId, sessionTitle, session.Status, session.ExpiresAt);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT-VALIDATE: [{RequestId}] EXCEPTION during token validation for token: {Token}",
                    requestId, token);
                _logger.LogError("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Exception Type: {ExceptionType}, Message: {Message}",
                    requestId, ex.GetType().Name, ex.Message);
                _logger.LogError("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Stack Trace: {StackTrace}",
                    requestId, ex.StackTrace);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        [HttpPost("register-with-token")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> RegisterWithToken([FromBody] ParticipantRegistrationRequest request)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Registration request for token: {Token}, Name: {Name}",
                requestId, request?.Token, request?.Name);

            try
            {
                if (request == null)
                {
                    return BadRequest(new { Error = "Invalid request body", RequestId = requestId });
                }

                if (string.IsNullOrWhiteSpace(request.Token) ||
                    string.IsNullOrWhiteSpace(request.Name) ||
                    string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Country))
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Missing required fields", requestId);
                    return BadRequest(new { Error = "All fields are required", RequestId = requestId });
                }

                if (request.Token.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid token format", RequestId = requestId });
                }

                // Validate the session token
                var session = await _tokenService.ValidateTokenAsync(request.Token, isHostToken: false);
                if (session == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Invalid session token: {Token}",
                        requestId, request.Token);
                    return BadRequest(new { Error = "Invalid or expired session token", RequestId = requestId });
                }

                // Check if participant already exists
                var existingParticipant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId &&
                                            (p.Email == request.Email || p.Name == request.Name));

                if (existingParticipant != null)
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Participant already exists, updating info", requestId);

                    // Update existing participant with token relationship
                    existingParticipant.UserToken = session.UserToken; // Ensure token is always current
                    existingParticipant.Name = request.Name;
                    existingParticipant.Email = request.Email;
                    existingParticipant.Country = request.Country;
                    existingParticipant.JoinedAt = DateTime.UtcNow;
                }
                else
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Creating new participant", requestId);

                    // Create new participant with direct UserToken relationship
                    var participant = new Participant
                    {
                        SessionId = session.SessionId,
                        UserToken = session.UserToken, // DIRECT TOKEN GROUPING: Store the 8-char friendly token
                        UserGuid = Guid.NewGuid().ToString(),
                        Name = request.Name,
                        Email = request.Email,
                        Country = request.Country,
                        JoinedAt = DateTime.UtcNow
                    };

                    _context.Participants.Add(participant);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Registration successful for {Name}",
                    requestId, request.Name);

                // ISSUE-1 FIX: Use token-based SignalR groups instead of session-based groups
                // Only users with the same user token should see each other
                var tokenGroup = $"usertoken_{session.UserToken}";
                _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX - Broadcasting ParticipantJoined to token-specific group: '{TokenGroup}' for participant '{Name}'",
                    requestId, tokenGroup, request.Name);

                // Get current participant count for debugging
                var currentParticipantCount = await _context.Participants
                    .Where(p => p.UserToken == session.UserToken)
                    .CountAsync();
                _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] SIGNALR SYNC FIX - Total participants for token '{UserToken}': {Count}",
                    requestId, session.UserToken, currentParticipantCount);

                // Broadcast SignalR event to notify users sharing the same user token
                try
                {
                    await _sessionHub.Clients.Group(tokenGroup)
                        .SendAsync("ParticipantJoined", new
                        {
                            sessionId = session.SessionId,
                            participantId = existingParticipant?.UserGuid ?? request.Name, // Use UserGuid if available, fallback to name
                            displayName = request.Name,
                            country = request.Country,
                            joinedAt = DateTime.UtcNow,
                            timestamp = DateTime.UtcNow,
                            userToken = session.UserToken // Token for validation
                        });

                    _logger.LogInformation("NOOR-SIGNALR: [{RequestId}] ParticipantJoined broadcast sent to token group '{TokenGroup}', participant {Name}",
                        requestId, tokenGroup, request.Name);
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning(signalREx, "NOOR-SIGNALR: [{RequestId}] Failed to broadcast ParticipantJoined event for session {SessionId}",
                        requestId, session.SessionId);
                    // Don't fail the registration if SignalR fails
                }

                // Get the final participant record to return consistent UserGuid
                var finalParticipant = existingParticipant ?? await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.Email == request.Email);

                return Ok(new
                {
                    success = true,
                    sessionId = session.SessionId,
                    userGuid = finalParticipant?.UserGuid,
                    waitingRoomUrl = $"/session/waiting/{request.Token}",
                    requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Registration error for token {Token}",
                    requestId, request?.Token);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        [HttpGet("session/{token}/user-guid")]
        public async Task<IActionResult> GetUserGuid(string token)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-QA-USERGUID: [{RequestId}] UserGuid request for token: {Token}",
                requestId, token);

            try
            {
                if (string.IsNullOrWhiteSpace(token) || token.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid token format", RequestId = requestId });
                }

                // First validate the token
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                if (session == null)
                {
                    _logger.LogWarning("NOOR-QA-USERGUID: [{RequestId}] Invalid session token: {Token}", requestId, token);
                    return NotFound(new { Error = "Invalid or expired session token", RequestId = requestId });
                }

                // Find the participant for this session and token
                var participant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserToken == token);

                if (participant == null)
                {
                    _logger.LogWarning("NOOR-QA-USERGUID: [{RequestId}] No participant found for token: {Token}", requestId, token);
                    return NotFound(new { Error = "Participant not found for this session", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-QA-USERGUID: [{RequestId}] UserGuid found: {UserGuid} for participant: {Name}",
                    requestId, participant.UserGuid, participant.Name);

                return Ok(new
                {
                    UserGuid = participant.UserGuid,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-QA-USERGUID: [{RequestId}] Error retrieving UserGuid for token: {Token}", requestId, token);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        /// <summary>
        /// Gets the current participant's information based on token and optional UserGuid - eliminates need for localStorage/sessionStorage.
        /// This replaces hash-based participant selection with direct API-based identification using unique UserGuid.
        /// </summary>
        /// <param name="token">The session token to get current participant for.</param>
        /// <param name="userGuid">Optional UserGuid to identify specific participant when multiple participants share same token.</param>
        /// <returns>Current participant information including name, country, etc.</returns>
        [HttpGet("session/{token}/me")]
        public async Task<IActionResult> GetCurrentParticipant(string token, [FromQuery] string? userGuid = null)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-PARTICIPANT-ME: [{RequestId}] Current participant request for token: {Token}, UserGuid: {UserGuid}",
                requestId, token, userGuid ?? "NULL");

            try
            {
                if (string.IsNullOrWhiteSpace(token) || token.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid token format", RequestId = requestId });
                }

                // First validate the token
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                if (session == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-ME: [{RequestId}] Invalid session token: {Token}", requestId, token);
                    return NotFound(new { Error = "Invalid or expired session token", RequestId = requestId });
                }

                // USERGUID-BASED LOOKUP: Find specific participant using UserGuid when provided
                Participant? participant = null;
                
                if (!string.IsNullOrWhiteSpace(userGuid))
                {
                    // Primary lookup: Use UserGuid for exact participant identification (multi-browser isolation)
                    participant = await _context.Participants
                        .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && 
                                                 p.UserToken == token && 
                                                 p.UserGuid == userGuid);
                                                 
                    _logger.LogInformation("NOOR-PARTICIPANT-ME: [{RequestId}] UserGuid-based lookup for token: {Token}, UserGuid: {UserGuid}, Found: {Found}",
                        requestId, token, userGuid, participant != null);
                }
                
                if (participant == null)
                {
                    // Fallback lookup: Use token only (backward compatibility or first-time access)
                    participant = await _context.Participants
                        .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && p.UserToken == token);
                        
                    _logger.LogInformation("NOOR-PARTICIPANT-ME: [{RequestId}] Fallback token-only lookup for token: {Token}, Found: {Found}",
                        requestId, token, participant != null);
                }

                if (participant == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-ME: [{RequestId}] No participant found for token: {Token}, UserGuid: {UserGuid}", 
                        requestId, token, userGuid ?? "NULL");
                    return NotFound(new { Error = "Participant not found for this session", RequestId = requestId });
                }

                _logger.LogInformation("NOOR-PARTICIPANT-ME: [{RequestId}] Current participant found: {Name} (UserGuid: {UserGuid})",
                    requestId, participant.Name, participant.UserGuid);

                return Ok(new
                {
                    UserGuid = participant.UserGuid,
                    Name = participant.Name,
                    Email = participant.Email,
                    Country = participant.Country,
                    JoinedAt = participant.JoinedAt,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT-ME: [{RequestId}] Error retrieving current participant for token: {Token}", requestId, token);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        [HttpGet("session/{token}/participants")]
        public async Task<IActionResult> GetSessionParticipants(string token)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-DEBUG-UI: [{RequestId}] Participants request for token: {Token}",
                requestId, token);

            try
            {
                if (string.IsNullOrWhiteSpace(token) || token.Length != 8)
                {
                    return BadRequest(new { Error = "Invalid token format", RequestId = requestId });
                }

                // First validate the token
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                if (session == null)
                {
                    return NotFound(new { Error = "Session not found", RequestId = requestId });
                }

                // Token filtering analysis complete

                // DIRECT TOKEN GROUPING: Filter participants directly by UserToken (no complex joins needed)
                var participantsData = await _context.Participants
                    .Where(p => p.UserToken == session.UserToken)
                    .ToListAsync();

                _logger.LogInformation("NOOR-PARTICIPANT-GROUPING: [{RequestId}] Direct UserToken filtering returned {Count} participants for token '{UserToken}'",
                    requestId, participantsData.Count, session.UserToken);

                // COPILOT-DEBUG: Log participant countries for debugging
                var participantCountries = participantsData.Select(p => p.Country).Distinct().ToList();
                _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] Participant countries in database: {Countries}",
                    requestId, string.Join(", ", participantCountries.Select(c => $"'{c}'")));

                // [DEBUG-WORKITEM:api:impl:09291900-api] Get country flags from KSESSIONS API instead of direct database access
                var countryFlags = await GetCountryFlagsFromApiAsync(participantCountries.Where(c => !string.IsNullOrEmpty(c)).Cast<string>().ToArray(), requestId);

                // COPILOT-DEBUG: Log country mapping results
                _logger.LogInformation("COPILOT-DEBUG: [{RequestId}] Country flag mappings found via API: {Mappings}",
                    requestId, string.Join(", ", countryFlags.Select(kv => $"'{kv.Key}' -> '{kv.Value}'")));

                // Combine participant data with flag codes
                var participants = participantsData.Select(p => new
                {
                    UserId = p.UserGuid ?? p.ParticipantId.ToString(),
                    DisplayName = p.Name ?? "Anonymous Participant",
                    JoinedAt = p.JoinedAt,
                    Role = "participant",
                    City = p.City,
                    Country = p.Country,
                    CountryFlag = countryFlags.GetValueOrDefault(p.Country ?? "", "un") // Database-driven flag code
                }).ToList();

                _logger.LogInformation("NOOR-DEBUG-UI: [{RequestId}] Found {Count} participants for session {SessionId}",
                    requestId, participants.Count, session.SessionId);

                var response = new
                {
                    SessionId = session.SessionId,
                    Token = token,
                    ParticipantCount = participants.Count,
                    Participants = participants,
                    RequestId = requestId
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-DEBUG-UI: [{RequestId}] Error loading participants for token {Token}",
                    requestId, token);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        /// <summary>
        /// Delete all participants for a specific UserToken when host opens session.
        /// <summary>
        /// This clears the waiting room participants for a fresh session start.
        /// </summary>
        /// <param name="userToken">The user token for authentication.</param>
        /// <returns>The result of the delete operation.</returns>
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        [HttpDelete("session/{userToken}/participants")]
        public async Task<IActionResult> DeleteParticipantsByToken(string userToken)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];

            _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] Delete participants request for UserToken: {UserToken}",
                requestId, userToken);

            try
            {
                if (string.IsNullOrWhiteSpace(userToken))
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-DELETE: [{RequestId}] UserToken is null or empty", requestId);
                    return BadRequest(new { Error = "UserToken cannot be empty", RequestId = requestId });
                }

                if (userToken.Length != 8)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-DELETE: [{RequestId}] Invalid token length: {Length}, expected 8 characters",
                        requestId, userToken.Length);
                    return BadRequest(new { Error = "Invalid token format - must be 8 characters", ActualLength = userToken.Length, RequestId = requestId });
                }

                // Find and delete all participants with this UserToken
                var participantsToDelete = await _context.Participants
                    .Where(p => p.UserToken == userToken)
                    .ToListAsync();

                if (participantsToDelete.Count == 0)
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] No participants found for UserToken: {UserToken}",
                        requestId, userToken);
                    return Ok(new
                    {
                        Message = "No participants found for this token",
                        DeletedCount = 0,
                        UserToken = userToken,
                        RequestId = requestId
                    });
                }

                _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] Found {Count} participants to delete for UserToken: {UserToken}",
                    requestId, participantsToDelete.Count, userToken);

                // Log participant details for audit trail
                foreach (var participant in participantsToDelete)
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] Deleting participant: Id={ParticipantId}, Name={Name}, UserToken={UserToken}",
                        requestId, participant.ParticipantId, participant.Name, participant.UserToken);
                }

                // Remove participants from database
                _context.Participants.RemoveRange(participantsToDelete);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] Successfully deleted {Count} participants for UserToken: {UserToken}",
                    requestId, participantsToDelete.Count, userToken);

                // Notify all connected clients about participants being cleared (session reset)
                await _sessionHub.Clients.Group($"session_{userToken}").SendAsync("ParticipantListCleared", new
                {
                    UserToken = userToken,
                    Message = "Host has opened the session - participants list cleared",
                    Timestamp = DateTime.UtcNow
                });

                _logger.LogInformation("NOOR-PARTICIPANT-DELETE: [{RequestId}] SignalR notification sent to session group: session_{UserToken}",
                    requestId, userToken);

                return Ok(new
                {
                    Message = "Participants deleted successfully",
                    DeletedCount = participantsToDelete.Count,
                    UserToken = userToken,
                    RequestId = requestId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT-DELETE: [{RequestId}] Error deleting participants for UserToken: {UserToken}",
                    requestId, userToken);
                return StatusCode(500, new { Error = "Internal server error", RequestId = requestId });
            }
        }

        /// <summary>
        /// [DEBUG-WORKITEM:api:impl:09291900-api] Get country flags from KSESSIONS API instead of direct database access.
        /// </summary>
        /// <param name="countryCodes">Array of ISO2 country codes to get flags for.</param>
        /// <param name="requestId">Request ID for logging.</param>
        /// <returns>Dictionary mapping ISO2 codes to lowercase flag codes.</returns>
        private async Task<Dictionary<string, string>> GetCountryFlagsFromApiAsync(string[] countryCodes, string requestId)
        {
            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:api:impl:{RequestId}] [COUNTRY-FLAGS-API] Calling country flags API for {Count} countries: {Countries} ;CLEANUP_OK",
                    requestId, countryCodes.Length, string.Join(", ", countryCodes));

                using var httpClient = _httpClientFactory.CreateClient();

                // Build query string for country codes
                var queryParams = string.Join("&", countryCodes.Select(c => $"countryCodes={Uri.EscapeDataString(c)}"));
                var response = await httpClient.GetAsync($"/api/host/ksessions/countries/flags?{queryParams}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("[DEBUG-WORKITEM:api:impl:{RequestId}] [COUNTRY-FLAGS-API] API call failed with status: {StatusCode} ;CLEANUP_OK",
                        requestId, response.StatusCode);
                    return new Dictionary<string, string>();
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<CountryFlagsResponse>();

                if (apiResponse?.Success == true && apiResponse.CountryFlags != null)
                {
                    _logger.LogInformation("[DEBUG-WORKITEM:api:impl:{RequestId}] [COUNTRY-FLAGS-API] Successfully retrieved {Count} country flag mappings from API ;CLEANUP_OK",
                        requestId, apiResponse.CountryFlags.Count);
                    return apiResponse.CountryFlags;
                }
                else
                {
                    _logger.LogWarning("[DEBUG-WORKITEM:api:impl:{RequestId}] [COUNTRY-FLAGS-API] API response was null or unsuccessful - Message: {Message} ;CLEANUP_OK",
                        requestId, apiResponse?.Message);
                    return new Dictionary<string, string>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:api:impl:{RequestId}] [COUNTRY-FLAGS-API] Exception calling country flags API ;CLEANUP_OK", requestId);
                return new Dictionary<string, string>();
            }
        }
    }
}
