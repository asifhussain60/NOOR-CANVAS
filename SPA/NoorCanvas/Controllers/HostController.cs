using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HostController : ControllerBase
    {
        private readonly CanvasDbContext _context;
        private readonly ILogger<HostController> _logger;

        public HostController(CanvasDbContext context, ILogger<HostController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> AuthenticateHost([FromBody] HostAuthRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Host authentication attempt for GUID: {HostGuid}", 
                    request.HostGuid?.Substring(0, 8) + "...");

                if (string.IsNullOrWhiteSpace(request.HostGuid) || !Guid.TryParse(request.HostGuid, out Guid hostGuid))
                {
                    _logger.LogWarning("NOOR-WARNING: Invalid Host GUID format");
                    return BadRequest(new { error = "Invalid GUID format" });
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

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData([FromQuery] string sessionToken)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Dashboard data requested");

                if (string.IsNullOrWhiteSpace(sessionToken) || !Guid.TryParse(sessionToken, out Guid token))
                {
                    return BadRequest(new { error = "Invalid session token" });
                }

                var activeSessions = await _context.Sessions
                    .Where(s => s.StartedAt != null && s.EndedAt == null)
                    .CountAsync();

                var totalParticipants = await _context.Registrations.CountAsync();

                var recentSessions = await _context.Sessions
                    .Include(s => s.SessionLinks)
                    .OrderByDescending(s => s.CreatedAt)
                    .Take(5)
                    .Select(s => new SessionSummaryResponse
                    {
                        SessionId = s.SessionId,
                        GroupId = s.GroupId,
                        Status = s.StartedAt == null ? "Created" : (s.EndedAt == null ? "Active" : "Completed"),
                        CreatedAt = s.CreatedAt,
                        ParticipantCount = s.Registrations.Count(),
                        SessionGuid = s.SessionLinks.FirstOrDefault() != null ? s.SessionLinks.First().Guid.ToString() : ""
                    })
                    .ToListAsync();

                var dashboardData = new HostDashboardResponse
                {
                    HostName = "Host User",
                    ActiveSessions = activeSessions,
                    TotalParticipants = totalParticipants,
                    RecentSessions = recentSessions
                };

                _logger.LogInformation("NOOR-SUCCESS: Dashboard data prepared");
                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to load dashboard data");
                return StatusCode(500, new { error = "Failed to load dashboard data" });
            }
        }

        [HttpPost("session/create")]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Creating new session");

                var session = new Session
                {
                    GroupId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(3)
                };

                _context.Sessions.Add(session);
                await _context.SaveChangesAsync();

                var sessionLink = new SessionLink
                {
                    SessionId = session.SessionId,
                    Guid = Guid.NewGuid(),
                    State = 1,
                    CreatedAt = DateTime.UtcNow
                };

                _context.SessionLinks.Add(sessionLink);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-SUCCESS: Session created with ID: {SessionId}", session.SessionId);

                return Ok(new SessionResponse
                {
                    SessionId = session.GroupId,
                    SessionGuid = sessionLink.Guid.ToString(),
                    JoinLink = $"https://localhost:9091/session/{sessionLink.Guid}",
                    CreatedAt = session.CreatedAt,
                    ExpiresAt = session.ExpiresAt ?? DateTime.UtcNow.AddHours(3)
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

                _logger.LogInformation("NOOR-SUCCESS: Session started: {SessionId}", sessionId);
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

                _logger.LogInformation("NOOR-SUCCESS: Session ended: {SessionId}", sessionId);
                return Ok(new { success = true, status = "Completed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to end session");
                return StatusCode(500, new { error = "Failed to end session" });
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
    }

    public class CreateSessionRequest
    {
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

    public class HostDashboardResponse
    {
        public string HostName { get; set; } = string.Empty;
        public int ActiveSessions { get; set; }
        public int TotalParticipants { get; set; }
        public List<SessionSummaryResponse> RecentSessions { get; set; } = new();
    }

    public class SessionSummaryResponse
    {
        public long SessionId { get; set; }
        public Guid GroupId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ParticipantCount { get; set; }
        public string SessionGuid { get; set; } = string.Empty;
    }
}
