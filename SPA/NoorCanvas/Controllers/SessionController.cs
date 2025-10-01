using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionController : ControllerBase
    {
        private readonly CanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly ILogger<SessionController> _logger;

        public SessionController(CanvasDbContext context, KSessionsDbContext kSessionsContext, ILogger<SessionController> logger)
        {
            _context = context;
            _kSessionsContext = kSessionsContext;
            _logger = logger;
        }

        /// <summary>
        /// Get current session state for late-joining participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        [HttpGet("{sessionId}/state")]
        public async Task<IActionResult> GetSessionState(long sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Getting session state for session: {SessionId}", sessionId);

                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                if (session.EndedAt != null)
                {
                    return BadRequest(new { error = "Session has ended" });
                }

                if (session.StartedAt == null)
                {
                    return BadRequest(new { error = "Session has not started yet" });
                }

                // Get current annotations for this session
                var annotations = await _context.Annotations
                    .Where(a => a.SessionId == sessionId && !a.IsDeleted)
                    .OrderBy(a => a.CreatedAt)
                    .Select(a => new
                    {
                        annotationId = a.AnnotationId,
                        sessionId = a.SessionId,
                        createdBy = a.CreatedBy,
                        createdAt = a.CreatedAt,
                        annotationData = a.AnnotationData
                    })
                    .ToListAsync();

                // Get current participants
                var participants = await _context.SessionParticipants
                    .Where(sp => sp.SessionId == sessionId && sp.JoinedAt != null && sp.LeftAt == null)
                    .Select(sp => new
                    {
                        userId = sp.UserId,
                        displayName = sp.DisplayName,
                        joinedAt = sp.JoinedAt
                    })
                    .ToListAsync();

                var sessionState = new
                {
                    sessionId = session.SessionId,
                    groupId = session.AlbumId,
                    status = "Active",
                    startedAt = session.StartedAt,
                    expiresAt = session.ExpiresAt,
                    participantCount = participants.Count,
                    maxParticipants = session.MaxParticipants,
                    participants = participants,
                    annotations = annotations,
                    timestamp = DateTime.UtcNow
                };

                _logger.LogInformation("NOOR-SUCCESS: Session state retrieved for session {SessionId} with {AnnotationCount} annotations and {ParticipantCount} participants",
                    sessionId, annotations.Count, participants.Count);

                return Ok(sessionState);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to get session state for session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to get session state" });
            }
        }

        /// <summary>
        /// Get basic session information by session ID.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        [HttpGet("{sessionId}")]
        public async Task<IActionResult> GetSessionInfo(int sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Getting session info for session: {SessionId}", sessionId);

                var session = await _context.Sessions
                    .FirstOrDefaultAsync(s => s.SessionId == sessionId);

                if (session == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                // Fetch session title and description from KSESSIONS database
                string sessionTitle = "HOST SESSION";
                string sessionDescription = "Manage Islamic learning sessions with interactive tools";
                try
                {
                    var kSession = await _kSessionsContext.Sessions
                        .FirstOrDefaultAsync(ks => ks.SessionId == (int)session.SessionId);

                    sessionTitle = kSession?.SessionName ?? "HOST SESSION";
                    sessionDescription = kSession?.Description ?? "Manage Islamic learning sessions with interactive tools";

                    _logger.LogInformation("COPILOT-DEBUG: Retrieved from KSESSIONS - Title: '{Title}', Description: '{Description}' for SessionId {SessionId}",
                        sessionTitle, sessionDescription, session.SessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NOOR-SESSION-INFO: Failed to retrieve session title/description from KSESSIONS for SessionId {SessionId}", session.SessionId);
                }

                var sessionInfo = new
                {
                    sessionId = session.SessionId,
                    title = sessionTitle,
                    description = sessionDescription,
                    status = session.Status,
                    participantCount = session.ParticipantCount ?? 0,
                    maxParticipants = session.MaxParticipants,
                    startedAt = session.StartedAt,
                    createdAt = session.CreatedAt
                };

                _logger.LogInformation("NOOR-SUCCESS: Session info retrieved for session {SessionId}", sessionId);

                return Ok(sessionInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to get session info for session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to get session info" });
            }
        }

        /// <summary>
        /// Get session state by session GUID for participants.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        [HttpGet("guid/{sessionGuid}/state")]
        public async Task<IActionResult> GetSessionStateByGuid(string sessionGuid)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Getting session state for session GUID: {SessionGuid}", sessionGuid);

                if (!Guid.TryParse(sessionGuid, out Guid guid))
                {
                    return BadRequest(new { error = "Invalid session GUID" });
                }

                var sessionLink = await _context.SessionLinks
                    .Include(sl => sl.Session)
                    .FirstOrDefaultAsync(sl => sl.Guid == guid && sl.State == 1);

                if (sessionLink?.Session == null)
                {
                    return NotFound(new { error = "Session not found or inactive" });
                }

                // Use the existing GetSessionState method by redirecting to it
                return await GetSessionState(sessionLink.Session.SessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to get session state for GUID {SessionGuid}", sessionGuid);
                return StatusCode(500, new { error = "Failed to get session state" });
            }
        }
    }
}
