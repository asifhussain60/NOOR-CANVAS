using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace NoorCanvas.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> ReceiveBrowserLog([FromBody] JsonElement logEntry)
    {
        try
        {
            var timestamp = logEntry.GetProperty("timestamp").GetString();
            var level = logEntry.GetProperty("level").GetString();
            var component = logEntry.GetProperty("component").GetString();
            var message = logEntry.GetProperty("message").GetString();
            var sessionId = logEntry.TryGetProperty("sessionId", out var sessionProp) ? sessionProp.GetString() : null;
            var userId = logEntry.TryGetProperty("userId", out var userProp) ? userProp.GetString() : null;
            var url = logEntry.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
            var data = logEntry.TryGetProperty("data", out var dataProp) ? dataProp.GetRawText() : null;

            // Log with structured data
            using (_logger.BeginScope(new Dictionary<string, object>
            {
                ["SessionId"] = sessionId ?? "unknown",
                ["UserId"] = userId ?? "unknown",
                ["Url"] = url ?? "unknown",
                ["Component"] = component ?? "unknown",
                ["BrowserLog"] = true
            }))
            {
                var logMessage = $"BROWSER-{level}: {message}";
                
                switch (level?.ToUpperInvariant())
                {
                    case "DEBUG":
                        _logger.LogDebug("{LogMessage} {Data}", logMessage, data);
                        break;
                    case "INFO":
                        _logger.LogInformation("{LogMessage} {Data}", logMessage, data);
                        break;
                    case "WARN":
                        _logger.LogWarning("{LogMessage} {Data}", logMessage, data);
                        break;
                    case "ERROR":
                        _logger.LogError("{LogMessage} {Data}", logMessage, data);
                        break;
                    case "FATAL":
                        _logger.LogCritical("{LogMessage} {Data}", logMessage, data);
                        break;
                    default:
                        _logger.LogInformation("{LogMessage} {Data}", logMessage, data);
                        break;
                }
            }

            return Ok(new { status = "logged", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ERROR: Failed to process browser log");
            return StatusCode(500, new { error = "Failed to process log" });
        }
    }
}
