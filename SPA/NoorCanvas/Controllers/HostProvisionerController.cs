using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HostProvisionerController : ControllerBase
    {
        private readonly ILogger<HostProvisionerController> _logger;
        private static readonly string AppSecret = "NOOR-CANVAS-HOST-SECRET-2025";

        public HostProvisionerController(ILogger<HostProvisionerController> logger)
        {
            _logger = logger;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateHostToken([FromBody] GenerateTokenRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-HOSTPROV: Generating host token for session {SessionId}", request.SessionId);

                var hostGuid = Guid.NewGuid();
                var hostGuidHash = ComputeHash(hostGuid.ToString());

                var response = new GenerateTokenResponse
                {
                    HostGuid = hostGuid.ToString(),
                    SessionId = request.SessionId,
                    CreatedBy = request.CreatedBy ?? "Testing Suite",
                    CreatedAt = DateTime.UtcNow,
                    Hash = hostGuidHash.Substring(0, 16) + "..."
                };

                _logger.LogInformation("NOOR-HOSTPROV: Host token generated successfully for session {SessionId}", request.SessionId);

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
    }
}
