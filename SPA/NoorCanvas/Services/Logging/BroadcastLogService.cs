using System.Text.Json;
using System.Collections.Concurrent;

namespace NoorCanvas.Services.Logging;

/// <summary>
/// Centralized logging service for SignalR broadcast operations.
/// Captures structured broadcast events for debugging, monitoring, and Cortex integration.
/// </summary>
public class BroadcastLogService
{
    private readonly ILogger<BroadcastLogService> _logger;
    private readonly string _cortexLogPath;
    private readonly ConcurrentQueue<BroadcastLogEntry> _recentBroadcasts;
    private const int MaxRecentBroadcasts = 100;

    public BroadcastLogService(ILogger<BroadcastLogService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _cortexLogPath = configuration["Logging:CortexLogPath"] ?? Path.Combine("logs", "cortex-broadcast.jsonl");
        _recentBroadcasts = new ConcurrentQueue<BroadcastLogEntry>();
        
        // Ensure Cortex log directory exists
        var logDir = Path.GetDirectoryName(_cortexLogPath);
        if (!string.IsNullOrEmpty(logDir) && !Directory.Exists(logDir))
        {
            Directory.CreateDirectory(logDir);
        }
    }

    /// <summary>
    /// Log broadcast initiation from host control panel.
    /// </summary>
    public void LogBroadcastInitiated(string trackingId, string sessionId, string shareId, string assetType, int instanceNumber)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            TrackingId = trackingId,
            EventType = "BroadcastInitiated",
            SessionId = sessionId,
            ShareId = shareId,
            AssetType = assetType,
            InstanceNumber = instanceNumber,
            Phase = "Host"
        };

        LogEntry(entry);
        _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] HOST: Broadcast initiated - SessionId={SessionId}, ShareId={ShareId}, AssetType={AssetType}, Instance={InstanceNumber}",
            trackingId, sessionId, shareId, assetType, instanceNumber);
    }

    /// <summary>
    /// Log hub method invocation.
    /// </summary>
    public void LogHubInvoked(string trackingId, string sessionId, string groupName, int contentLength)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            TrackingId = trackingId,
            EventType = "HubInvoked",
            SessionId = sessionId,
            GroupName = groupName,
            ContentLength = contentLength,
            Phase = "Hub"
        };

        LogEntry(entry);
        _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] HUB: PublishAssetContent invoked - SessionId={SessionId}, GroupName={GroupName}, ContentLength={ContentLength}",
            trackingId, sessionId, groupName, contentLength);
    }

    /// <summary>
    /// Log broadcast sent to SignalR group.
    /// </summary>
    public void LogBroadcastSent(string trackingId, string groupName, int participantCount)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            TrackingId = trackingId,
            EventType = "BroadcastSent",
            GroupName = groupName,
            ParticipantCount = participantCount,
            Phase = "Hub"
        };

        LogEntry(entry);
        _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] HUB: SendAsync completed - GroupName={GroupName}, ParticipantCount={ParticipantCount}",
            trackingId, groupName, participantCount);
    }

    /// <summary>
    /// Log broadcast received by participant.
    /// </summary>
    public void LogBroadcastReceived(string trackingId, string canvasType, string connectionId)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            TrackingId = trackingId,
            EventType = "BroadcastReceived",
            CanvasType = canvasType,
            ConnectionId = connectionId,
            Phase = "Participant"
        };

        LogEntry(entry);
        _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] {CanvasType}: AssetContentReceived EVENT FIRED - ConnectionId={ConnectionId}",
            trackingId, canvasType.ToUpperInvariant(), connectionId);
    }

    /// <summary>
    /// Log content processing in SignalR service.
    /// </summary>
    public void LogContentProcessing(string trackingId, int contentLength, bool success, string? error = null)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            TrackingId = trackingId,
            EventType = success ? "ContentProcessed" : "ContentProcessingFailed",
            ContentLength = contentLength,
            Phase = "Service",
            Error = error
        };

        LogEntry(entry);
        
        if (success)
        {
            _logger.LogInformation("[DEBUG-BROADCAST:{TrackingId}] SERVICE: HandleAssetContentReceivedAsync completed - ContentLength={ContentLength}",
                trackingId, contentLength);
        }
        else
        {
            _logger.LogError("[DEBUG-BROADCAST:{TrackingId}] SERVICE: HandleAssetContentReceivedAsync FAILED - ContentLength={ContentLength}, Error={Error}",
                trackingId, contentLength, error);
        }
    }

    /// <summary>
    /// Log group membership information.
    /// </summary>
    public void LogGroupMembership(string sessionId, string groupName, int participantCount, IEnumerable<string> connectionIds)
    {
        var entry = new BroadcastLogEntry
        {
            Timestamp = DateTime.UtcNow,
            EventType = "GroupMembership",
            SessionId = sessionId,
            GroupName = groupName,
            ParticipantCount = participantCount,
            Phase = "Hub",
            Metadata = new Dictionary<string, object>
            {
                ["ConnectionIds"] = connectionIds.ToList()
            }
        };

        LogEntry(entry);
        _logger.LogInformation("[DEBUG-BROADCAST:GROUP] SessionId={SessionId}, GroupName={GroupName}, ParticipantCount={ParticipantCount}, ConnectionIds={ConnectionIds}",
            sessionId, groupName, participantCount, string.Join(", ", connectionIds));
    }

    /// <summary>
    /// Get recent broadcast logs for diagnostics.
    /// </summary>
    public IEnumerable<BroadcastLogEntry> GetRecentBroadcasts() => _recentBroadcasts.ToArray();

    /// <summary>
    /// Write log entry to both Serilog and Cortex format.
    /// </summary>
    private void LogEntry(BroadcastLogEntry entry)
    {
        // Add to in-memory queue
        _recentBroadcasts.Enqueue(entry);
        while (_recentBroadcasts.Count > MaxRecentBroadcasts)
        {
            _recentBroadcasts.TryDequeue(out _);
        }

        // Write to Cortex log file (JSON Lines format for easy parsing)
        try
        {
            var json = JsonSerializer.Serialize(entry, new JsonSerializerOptions
            {
                WriteIndented = false,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            File.AppendAllText(_cortexLogPath, json + Environment.NewLine);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[BROADCAST-LOG] Failed to write to Cortex log file: {Path}", _cortexLogPath);
        }
    }
}

/// <summary>
/// Structured log entry for broadcast events.
/// </summary>
public class BroadcastLogEntry
{
    public DateTime Timestamp { get; set; }
    public string? TrackingId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string? ShareId { get; set; }
    public string? AssetType { get; set; }
    public int? InstanceNumber { get; set; }
    public string? GroupName { get; set; }
    public int? ContentLength { get; set; }
    public int? ParticipantCount { get; set; }
    public string? CanvasType { get; set; }
    public string? ConnectionId { get; set; }
    public string Phase { get; set; } = string.Empty;
    public string? Error { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
