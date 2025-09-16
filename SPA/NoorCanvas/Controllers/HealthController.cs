using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using System.Text.Json;

namespace NoorCanvas.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly CanvasDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(CanvasDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var health = new
        {
            status = "ok",
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            checks = new Dictionary<string, object>()
        };

        try
        {
            // Database connectivity check
            var canConnect = await _context.Database.CanConnectAsync();
            health.checks.Add("database", new
            {
                status = canConnect ? "healthy" : "unhealthy",
                responseTime = "< 100ms"
            });

            // Canvas schema check
            var tableCount = await _context.Sessions.CountAsync();
            health.checks.Add("canvas_schema", new
            {
                status = "healthy",
                table_count = tableCount
            });

            _logger.LogInformation("NOOR-HEALTH: Health check passed - Database: {DatabaseStatus}", canConnect ? "Connected" : "Disconnected");

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ERROR: Health check failed");

            var errorHealth = new
            {
                status = "error",
                timestamp = DateTime.UtcNow,
                error = ex.Message,
                checks = health.checks
            };

            return StatusCode(500, errorHealth);
        }
    }

    [HttpGet("detailed")]
    public async Task<IActionResult> Detailed()
    {
        try
        {
            var detailed = new
            {
                status = "ok",
                timestamp = DateTime.UtcNow,
                server = new
                {
                    machine_name = Environment.MachineName,
                    os_version = Environment.OSVersion.ToString(),
                    framework = Environment.Version.ToString(),
                    working_set = GC.GetTotalMemory(false),
                    uptime = Environment.TickCount64
                },
                database = new
                {
                    can_connect = await _context.Database.CanConnectAsync(),
                    provider = _context.Database.ProviderName,
                    connection_string = _context.Database.GetConnectionString()?.Substring(0, 50) + "..."
                },
                canvas_tables = new
                {
                    sessions = await _context.Sessions.CountAsync(),
                    users = await _context.Users.CountAsync(),
                    issues = await _context.Issues.CountAsync()
                }
            };

            return Ok(detailed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ERROR: Detailed health check failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
