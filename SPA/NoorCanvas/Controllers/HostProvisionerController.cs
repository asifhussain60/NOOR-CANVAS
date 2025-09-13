using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using NoorCanvas.Data;
using NoorCanvas.Models;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HostProvisionerController : ControllerBase
    {
        private readonly ILogger<HostProvisionerController> _logger;
        private readonly CanvasDbContext _context;
        private static readonly string AppSecret = "NOOR-CANVAS-HOST-SECRET-2025";

        public HostProvisionerController(ILogger<HostProvisionerController> logger, CanvasDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateHostToken([FromBody] GenerateTokenRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-HOSTPROV: Generating host token for session {SessionId}", request.SessionId);

                var hostGuid = Guid.NewGuid();
                var hostGuidHash = ComputeHash(hostGuid.ToString());

                // Create and save Host Session record to database
                var hostSession = new HostSession
                {
                    SessionId = request.SessionId,
                    HostGuidHash = hostGuidHash,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = request.CreatedBy ?? "API User",
                    IsActive = true
                };

                _context.HostSessions.Add(hostSession);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-HOSTPROV: Host token generated and saved to database - Session {SessionId}, HostSessionId {HostSessionId}", 
                    request.SessionId, hostSession.HostSessionId);

                var response = new GenerateTokenResponse
                {
                    HostGuid = hostGuid.ToString(),
                    SessionId = request.SessionId,
                    CreatedBy = request.CreatedBy ?? "API User",
                    CreatedAt = DateTime.UtcNow,
                    Hash = hostGuidHash.Substring(0, 16) + "...",
                    HostSessionId = hostSession.HostSessionId
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOSTPROV: Failed to generate host token");
                return StatusCode(500, new { error = "Failed to generate host token" });
            }
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok(new 
            { 
                status = "operational", 
                service = "HostProvisioner API",
                timestamp = DateTime.UtcNow 
            });
        }

        private static string ComputeHash(string input)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(AppSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToBase64String(hashBytes);
        }
    }

    public class GenerateTokenRequest
    {
        public int SessionId { get; set; }
        public string? CreatedBy { get; set; }
    }

    public class GenerateTokenResponse
    {
        public string HostGuid { get; set; } = string.Empty;
        public int SessionId { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string Hash { get; set; } = string.Empty;
        public long HostSessionId { get; set; }
    }
}
