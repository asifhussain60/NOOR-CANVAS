namespace NoorCanvas.Constants;

/// <summary>
/// [REFACTOR:Phase1] Constants and utilities for logging
/// Extracted from HostControlPanel.razor to standardize request ID generation
/// </summary>
public static class LoggingConstants
{
    /// <summary>
    /// Generate a short request ID for correlation logging
    /// Format: 8-character hexadecimal string from GUID
    /// Example: "a3f7b2c1"
    /// </summary>
    public static string CreateRequestId() => Guid.NewGuid().ToString("N")[..8];
    
    /// <summary>
    /// Generate a full correlation ID for distributed tracing
    /// Format: Full GUID without hyphens
    /// Example: "a3f7b2c14d8e4f9b8c3d1e5f6a7b8c9d"
    /// </summary>
    public static string CreateCorrelationId() => Guid.NewGuid().ToString("N");
    
    /// <summary>
    /// Diagnostic marker prefixes for cleanup tracking
    /// </summary>
    public static class Markers
    {
        public const string DebugWorkitem = "[DEBUG-WORKITEM:";
        public const string Trace = "[TRACE:";
        public const string Diagnostic = "[DIAGNOSTIC:";
        public const string CleanupOk = ";CLEANUP_OK";
    }
    
    /// <summary>
    /// Log event categories for structured logging
    /// </summary>
    public static class EventCategories
    {
        public const string SignalR = "SignalR";
        public const string Session = "Session";
        public const string Asset = "Asset";
        public const string Question = "Question";
        public const string Transcript = "Transcript";
    }
}
