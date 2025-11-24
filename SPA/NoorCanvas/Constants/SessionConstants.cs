namespace NoorCanvas.Constants;

/// <summary>
/// [REFACTOR:Phase1] Constants for session management
/// Extracted from HostControlPanel.razor to eliminate magic strings
/// </summary>
public static class SessionConstants
{
    /// <summary>
    /// Session status values
    /// </summary>
    public static class Status
    {
        public const string Active = "Active";
        public const string Ended = "Ended";
        public const string Waiting = "Waiting";
        public const string Scheduled = "Scheduled";
    }
    
    /// <summary>
    /// SignalR group naming patterns
    /// </summary>
    public static class SignalRGroups
    {
        /// <summary>
        /// Get SignalR group name for a session
        /// Format: session_{sessionId}
        /// </summary>
        public static string GetSessionGroup(int sessionId) => $"session_{sessionId}";
        
        /// <summary>
        /// Get SignalR group name for a host
        /// Format: host_{hostToken}
        /// </summary>
        public static string GetHostGroup(string hostToken) => $"host_{hostToken}";
    }
    
    /// <summary>
    /// Canvas types for participant routing
    /// </summary>
    public static class CanvasTypes
    {
        public const string Asset = "asset";
        public const string Transcript = "transcript";
    }
    
    /// <summary>
    /// Session duration limits (in minutes)
    /// </summary>
    public static class Durations
    {
        public const int MinimumMinutes = 15;
        public const int MaximumMinutes = 180;
        public const int DefaultMinutes = 60;
    }
}
