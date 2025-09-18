using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Security.Cryptography;
using System.Text;

namespace NoorCanvas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly CanvasDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(CanvasDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> AuthenticateAdmin([FromBody] AdminAuthRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-ADMIN-AUTH: Admin authentication attempt for GUID: {AdminGuid}", request.AdminGuid);

                // Validate admin GUID using HMAC-SHA256 (same security as host)
                if (!IsValidAdminGuid(request.AdminGuid))
                {
                    _logger.LogWarning("NOOR-ADMIN-AUTH: Invalid admin GUID: {AdminGuid}", request.AdminGuid);
                    return Unauthorized(new { error = "Invalid admin credentials" });
                }

                // Generate session token
                var sessionToken = GenerateSessionToken();
                var adminSession = new AdminSession
                {
                    AdminGuid = request.AdminGuid,
                    SessionToken = sessionToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(12), // Admin sessions last 12 hours
                    IsActive = true
                };

                // Store session in database
                _context.AdminSessions.Add(adminSession);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ADMIN-AUTH: Admin authenticated successfully. SessionToken: {SessionToken}", sessionToken);

                return Ok(new AdminAuthResponse
                {
                    Success = true,
                    SessionToken = sessionToken,
                    ExpiresAt = adminSession.ExpiresAt,
                    AdminGuid = request.AdminGuid
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Admin authentication failed");
                return StatusCode(500, new { error = "Authentication failed" });
            }
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetAllSessions([FromQuery] string sessionToken, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Validate admin session
                if (!await IsValidAdminSession(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid or expired session" });
                }

                var query = _context.Sessions
                    .Include(s => s.HostSessions)
                    .OrderByDescending(s => s.CreatedAt);

                var totalCount = await query.CountAsync();
                var sessions = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new AdminSessionDetails
                    {
                        SessionId = s.SessionId,
                        Title = s.Title ?? "Untitled Session",
                        Description = s.Description ?? string.Empty,
                        Status = s.Status ?? "Unknown",
                        ParticipantCount = s.ParticipantCount ?? 0,
                        MaxParticipants = s.MaxParticipants,
                        CreatedAt = s.CreatedAt,
                        StartedAt = s.StartedAt,
                        EndedAt = s.EndedAt,
                        ExpiresAt = s.ExpiresAt ?? DateTime.UtcNow.AddHours(3),
                        HostName = s.HostSessions.Any() ? s.HostSessions.First().CreatedBy ?? "Host" : "Unknown Host",
                        HostGuid = s.HostGuid
                    })
                    .ToListAsync();

                return Ok(new AdminSessionListResponse
                {
                    Sessions = sessions,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Admin session list retrieval failed");
                return StatusCode(500, new { error = "Failed to retrieve sessions" });
            }
        }

        [HttpPost("session/{sessionId}/terminate")]
        public async Task<IActionResult> TerminateSession(long sessionId, [FromQuery] string sessionToken)
        {
            try
            {
                // Validate admin session
                if (!await IsValidAdminSession(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid or expired session" });
                }

                var session = await _context.Sessions.FindAsync(sessionId);
                if (session == null)
                {
                    return NotFound(new { error = "Session not found" });
                }

                // Update session status
                session.Status = "Terminated";
                session.EndedAt = DateTime.UtcNow;
                session.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ADMIN-ACTION: Session {SessionId} terminated by admin", sessionId);
                return Ok(new { message = "Session terminated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Admin session termination failed");
                return StatusCode(500, new { error = "Failed to terminate session" });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] string sessionToken, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Validate admin session
                if (!await IsValidAdminSession(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid or expired session" });
                }

                var query = _context.Users
                    .OrderByDescending(u => u.CreatedAt);

                var totalCount = await query.CountAsync();
                var users = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new AdminUserDetails
                    {
                        UserId = u.UserId.ToString(),
                        UserGuid = u.UserGuid,
                        Name = u.Name ?? "Unknown",
                        City = u.City ?? "Unknown",
                        Country = u.Country ?? "Unknown",
                        CreatedAt = u.CreatedAt,
                        ModifiedAt = u.ModifiedAt,
                        IsActive = u.IsActive,
                        LastSeenAt = u.LastSeenAt
                    })
                    .ToListAsync();

                return Ok(new AdminUserListResponse
                {
                    Users = users,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Admin user list retrieval failed");
                return StatusCode(500, new { error = "Failed to retrieve users" });
            }
        }

        [HttpPost("user/{userId}/deactivate")]
        public async Task<IActionResult> DeactivateUser(string userId, [FromQuery] string sessionToken)
        {
            try
            {
                // Validate admin session
                if (!await IsValidAdminSession(sessionToken))
                {
                    return Unauthorized(new { error = "Invalid or expired session" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserGuid == userId);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // Deactivate user
                user.IsActive = false;
                user.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ADMIN-ACTION: User {UserId} deactivated by admin", userId);
                return Ok(new { message = "User deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Admin user deactivation failed");
                return StatusCode(500, new { error = "Failed to deactivate user" });
            }
        }

        // Private helper methods
        private bool IsValidAdminGuid(string adminGuid)
        {
            // Use same validation as HostProvisioner for consistency
            var expectedGuids = new[]
            {
                "admin-noor-canvas-2025", // Primary admin GUID
                "super-admin-noor-2025"   // Super admin GUID
            };

            return expectedGuids.Contains(adminGuid);
        }

        private async Task<bool> IsValidAdminSession(string sessionToken)
        {
            var adminSession = await _context.AdminSessions
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken &&
                                        s.IsActive &&
                                        s.ExpiresAt > DateTime.UtcNow);
            return adminSession != null;
        }

        private string GenerateSessionToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }

        private string GetSystemUptime()
        {
            var uptime = DateTime.Now - System.Diagnostics.Process.GetCurrentProcess().StartTime;
            return $"{uptime.Days}d {uptime.Hours}h {uptime.Minutes}m";
        }
    }

    // Request/Response Models
    public class AdminAuthRequest
    {
        public string AdminGuid { get; set; } = string.Empty;
    }

    public class AdminAuthResponse
    {
        public bool Success { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string AdminGuid { get; set; } = string.Empty;
    }

    public class AdminSessionSummary
    {
        public long SessionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string HostName { get; set; } = string.Empty;
    }

    public class AdminUserSummary
    {
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminSessionDetails
    {
        public long SessionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public int? MaxParticipants { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string HostName { get; set; } = string.Empty;
        public string HostGuid { get; set; } = string.Empty;
    }

    public class AdminUserDetails
    {
        public string UserId { get; set; } = string.Empty;
        public string UserGuid { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ModifiedAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastSeenAt { get; set; }
    }

    public class AdminSessionListResponse
    {
        public List<AdminSessionDetails> Sessions { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class AdminUserListResponse
    {
        public List<AdminUserDetails> Users { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
