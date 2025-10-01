using Microsoft.Extensions.Logging;
using NoorCanvas.Services;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for managing host session state and persistence
    /// Extracted from HostControlPanel.razor for better separation of concerns
    /// </summary>
    public class HostSessionStateService
    {
        private readonly SessionStateService _sessionStateService;
        private readonly ILogger<HostSessionStateService> _logger;

        public HostSessionStateService(
            SessionStateService sessionStateService,
            ILogger<HostSessionStateService> logger)
        {
            _sessionStateService = sessionStateService;
            _logger = logger;
        }

        /// <summary>
        /// Save current session state to localStorage
        /// </summary>
        public async Task<bool> SaveHostSessionStateAsync(HostSessionState sessionState)
        {
            try
            {
                if (sessionState.SessionId <= 0)
                {
                    _logger.LogWarning("[HostSessionStateService:SaveState] Invalid SessionId: {SessionId}", sessionState.SessionId);
                    return false;
                }

                var baseSessionState = new SessionStateService.SessionState
                {
                    SessionId = sessionState.SessionId,
                    SessionName = sessionState.SessionName ?? "Unknown Session",
                    SessionDescription = sessionState.SessionDescription ?? "",
                    SessionStatus = sessionState.SessionStatus ?? "Unknown",
                    Topic = sessionState.Topic ?? "Session Content",
                    ParticipantCount = sessionState.ParticipantCount,
                    CreatedAt = DateTime.UtcNow
                };

                var saved = await _sessionStateService.SaveSessionStateAsync(baseSessionState);
                
                _logger.LogInformation("[HostSessionStateService:SaveState] Session state saved: {Success} for SessionId: {SessionId}", 
                    saved, sessionState.SessionId);

                return saved;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HostSessionStateService:SaveState] Error saving session state for SessionId: {SessionId}", 
                    sessionState.SessionId);
                return false;
            }
        }

        /// <summary>
        /// Load persisted session state from localStorage
        /// </summary>
        public async Task<HostSessionState?> LoadHostSessionStateAsync(string requestId)
        {
            try
            {
                _logger.LogInformation("[HostSessionStateService:LoadState] [{RequestId}] Loading persisted session state from localStorage", requestId);
                
                var sessionState = await _sessionStateService.LoadSessionStateAsync();
                
                if (sessionState != null)
                {
                    _logger.LogInformation("[HostSessionStateService:LoadState] [{RequestId}] Found persisted SessionId: {SessionId}", 
                        requestId, sessionState.SessionId);

                    return new HostSessionState
                    {
                        SessionId = sessionState.SessionId,
                        SessionName = sessionState.SessionName,
                        SessionDescription = sessionState.SessionDescription,
                        SessionStatus = sessionState.SessionStatus,
                        Topic = sessionState.Topic,
                        ParticipantCount = sessionState.ParticipantCount,
                        CreatedAt = sessionState.CreatedAt
                    };
                }
                else
                {
                    _logger.LogInformation("[HostSessionStateService:LoadState] [{RequestId}] No persisted session state found", requestId);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HostSessionStateService:LoadState] [{RequestId}] Error loading persisted session state", requestId);
                return null;
            }
        }

        /// <summary>
        /// Clear persisted session state
        /// </summary>
        public async Task<bool> ClearHostSessionStateAsync()
        {
            try
            {
                // Use the base service to clear state
                await _sessionStateService.ClearSessionStateAsync();
                _logger.LogInformation("[HostSessionStateService:ClearState] Session state cleared successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[HostSessionStateService:ClearState] Error clearing session state");
                return false;
            }
        }
    }

    /// <summary>
    /// Host-specific session state model
    /// </summary>
    public class HostSessionState
    {
        public int SessionId { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string SessionDescription { get; set; } = string.Empty;
        public string SessionStatus { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public int ParticipantCount { get; set; }
        public DateTime CreatedAt { get; set; }

        // Host-specific properties
        public string? HostToken { get; set; }
        public string? UserToken { get; set; }
        public string? ScheduledDate { get; set; }
        public string? ScheduledTime { get; set; }
        public string? ScheduledDuration { get; set; }
        public bool IsSignalRConnected { get; set; }
        public DateTime? LastActivity { get; set; }
    }
}