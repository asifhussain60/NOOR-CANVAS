using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Services;
using NoorCanvas.Models.Simplified;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParticipantController : ControllerBase
    {
        private readonly SimplifiedCanvasDbContext _context;
        private readonly ILogger<ParticipantController> _logger;
        private readonly SimplifiedTokenService _tokenService;

        public ParticipantController(
            SimplifiedCanvasDbContext context, 
            ILogger<ParticipantController> logger, 
            SimplifiedTokenService tokenService)
        {
            _context = context;
            _logger = logger;
            _tokenService = tokenService;
        }

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
                    return BadRequest(new { error = "Token cannot be empty", requestId });
                }

                if (token.Length != 8)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Invalid token length: {Length}, expected 8 characters", 
                        requestId, token.Length);
                    return BadRequest(new { error = "Invalid token format - must be 8 characters", actualLength = token.Length, requestId });
                }

                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Calling SimplifiedTokenService.ValidateTokenAsync for USER token", requestId);
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] SimplifiedTokenService returned: {Result}", 
                    requestId, session != null ? $"Session {session.SessionId}" : "null");

                if (session == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Session not found for token: {Token}", 
                        requestId, token);
                    return NotFound(new { error = "Invalid or expired session token", valid = false, requestId });
                }

                _logger.LogInformation("NOOR-PARTICIPANT-VALIDATE: [{RequestId}] Session found: SessionId={SessionId} (KSESSIONS_ID), Title={Title}, Status={Status}", 
                    requestId, session.SessionId, session.Title, session.Status);

                // Get participant count from simplified schema
                var participantCount = await _context.Participants
                    .Where(p => p.SessionId == session.SessionId)
                    .CountAsync();

                var response = new
                {
                    Valid = true,
                    SessionId = session.SessionId,
                    Token = token,
                    ExpiresAt = session.ExpiresAt,
                    Session = new
                    {
                        SessionId = session.SessionId,
                        Title = session.Title ?? $"Session {session.SessionId}",
                        Description = session.Description,
                        Status = session.Status,
                        ParticipantCount = participantCount,
                        MaxParticipants = (int?)null, // Not stored in simplified schema
                        StartedAt = session.CreatedAt, // Using CreatedAt as StartedAt for now
                        CreatedAt = session.CreatedAt,
                        // Compatibility properties for SessionWaiting component
                        StartTime = session.CreatedAt.AddMinutes(5), // Default to 5 minutes from creation
                        Duration = TimeSpan.FromHours(1) // Default duration
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
                    requestId, session.SessionId, session.Title, session.Status, session.ExpiresAt);

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
                return StatusCode(500, new { error = "Internal server error", requestId });
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
                    return BadRequest(new { error = "Invalid request body", requestId });
                }

                if (string.IsNullOrWhiteSpace(request.Token) || 
                    string.IsNullOrWhiteSpace(request.Name) || 
                    string.IsNullOrWhiteSpace(request.Email) || 
                    string.IsNullOrWhiteSpace(request.Country))
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Missing required fields", requestId);
                    return BadRequest(new { error = "All fields are required", requestId });
                }

                if (request.Token.Length != 8)
                {
                    return BadRequest(new { error = "Invalid token format", requestId });
                }

                // Validate the session token
                var session = await _tokenService.ValidateTokenAsync(request.Token, isHostToken: false);
                if (session == null)
                {
                    _logger.LogWarning("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Invalid session token: {Token}", 
                        requestId, request.Token);
                    return BadRequest(new { error = "Invalid or expired session token", requestId });
                }

                // Check if participant already exists
                var existingParticipant = await _context.Participants
                    .FirstOrDefaultAsync(p => p.SessionId == session.SessionId && 
                                            (p.Email == request.Email || p.Name == request.Name));

                if (existingParticipant != null)
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Participant already exists, updating info", requestId);
                    
                    // Update existing participant
                    existingParticipant.Name = request.Name;
                    existingParticipant.Email = request.Email;
                    existingParticipant.Country = request.Country;
                    existingParticipant.JoinedAt = DateTime.UtcNow;
                }
                else
                {
                    _logger.LogInformation("NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Creating new participant", requestId);
                    
                    // Create new participant
                    var participant = new Participant
                    {
                        SessionId = session.SessionId,
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

                return Ok(new 
                { 
                    success = true,
                    sessionId = session.SessionId,
                    waitingRoomUrl = $"/session/waiting/{request.Token}",
                    requestId 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-PARTICIPANT-REGISTRATION: [{RequestId}] Registration error for token {Token}", 
                    requestId, request?.Token);
                return StatusCode(500, new { error = "Internal server error", requestId });
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
                    return BadRequest(new { error = "Invalid token format", requestId });
                }

                // First validate the token
                var session = await _tokenService.ValidateTokenAsync(token, isHostToken: false);
                if (session == null)
                {
                    return NotFound(new { error = "Session not found", requestId });
                }

                // Get participants from simplified schema
                var participants = await _context.Participants
                    .Where(p => p.SessionId == session.SessionId)
                    .Select(p => new
                    {
                        UserId = p.UserGuid ?? p.ParticipantId.ToString(),
                        DisplayName = p.Name ?? "Anonymous Participant",
                        JoinedAt = p.JoinedAt,
                        Role = "participant",
                        City = p.City,
                        Country = p.Country
                    })
                    .ToListAsync();

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
                return StatusCode(500, new { error = "Internal server error", requestId });
            }
        }
    }
}
