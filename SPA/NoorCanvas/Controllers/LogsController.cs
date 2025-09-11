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
    public IActionResult ReceiveBrowserLog([FromBody] JsonElement logEntry)
    {
        try
        {
            // Safe property extraction with null checks
            var timestamp = logEntry.TryGetProperty("timestamp", out var timestampProp) ? 
                timestampProp.GetString() : DateTime.UtcNow.ToString();
            
            var level = logEntry.TryGetProperty("level", out var levelProp) ? 
                (levelProp.ValueKind == JsonValueKind.String ? levelProp.GetString() : levelProp.ToString()) : "INFO";
            
            var component = logEntry.TryGetProperty("component", out var componentProp) ? 
                (componentProp.ValueKind == JsonValueKind.String ? componentProp.GetString() : componentProp.ToString()) : "UNKNOWN";
            
            var message = logEntry.TryGetProperty("message", out var messageProp) ? 
                (messageProp.ValueKind == JsonValueKind.String ? messageProp.GetString() : messageProp.ToString()) : "No message";
            
            var sessionId = logEntry.TryGetProperty("sessionId", out var sessionProp) ? 
                (sessionProp.ValueKind == JsonValueKind.String ? sessionProp.GetString() : sessionProp.ToString()) : null;
            
            var userId = logEntry.TryGetProperty("userId", out var userProp) ? 
                (userProp.ValueKind == JsonValueKind.String ? userProp.GetString() : userProp.ToString()) : null;
            
            var url = logEntry.TryGetProperty("url", out var urlProp) ? 
                (urlProp.ValueKind == JsonValueKind.String ? urlProp.GetString() : urlProp.ToString()) : null;
            
            // Handle data property which can be object or string
            string? data = null;
            if (logEntry.TryGetProperty("data", out var dataProp))
            {
                data = dataProp.ValueKind == JsonValueKind.String ? dataProp.GetString() : dataProp.GetRawText();
            }

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
