using Microsoft.JSInterop;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Secure session state persistence service using browser localStorage
    /// Handles session information sharing between components without exposing sensitive data.
    /// </summary>
    public class SessionStateService
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly ILogger<SessionStateService> _logger;

        private const string SESSION_STATE_KEY = "noorCanvas_sessionState";
        private const string HOST_SESSION_KEY = "noorCanvas_hostSession";

        public SessionStateService(IJSRuntime jsRuntime, ILogger<SessionStateService> logger)
        {
            _jsRuntime = jsRuntime;
            _logger = logger;
        }

        /// <summary>
        /// Session state model - contains only non-sensitive session information.
        /// </summary>
        public class SessionState
        {
            public int SessionId { get; set; }
            public string SessionName { get; set; } = string.Empty;
            public string SessionDescription { get; set; } = string.Empty;
            public string SessionStatus { get; set; } = string.Empty;
            public DateTime? StartedAt { get; set; }
            public DateTime? ExpiresAt { get; set; }
            public int ParticipantCount { get; set; }
            public string Topic { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            // Security note: Tokens are NOT stored in localStorage for security reasons
            // Components must use their parameter tokens for API calls
        }

        /// <summary>
        /// Save session state to localStorage (non-sensitive data only).
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<bool> SaveSessionStateAsync(SessionState sessionState)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(sessionState);
                await _jsRuntime.InvokeVoidAsync("localStorage.setItem", SESSION_STATE_KEY, json);

                _logger.LogInformation("SESSION-STATE: Session state saved for SessionId {SessionId}", sessionState.SessionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SESSION-STATE: Failed to save session state");
                return false;
            }
        }

        /// <summary>
        /// Load session state from localStorage.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<SessionState?> LoadSessionStateAsync()
        {
            try
            {
                var json = await _jsRuntime.InvokeAsync<string?>("localStorage.getItem", SESSION_STATE_KEY);

                if (string.IsNullOrEmpty(json))
                {
                    _logger.LogInformation("SESSION-STATE: No session state found in localStorage");
                    return null;
                }

                var sessionState = System.Text.Json.JsonSerializer.Deserialize<SessionState>(json);
                _logger.LogInformation("SESSION-STATE: Session state loaded for SessionId {SessionId}", sessionState?.SessionId);

                return sessionState;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SESSION-STATE: Failed to load session state");
                return null;
            }
        }

        /// <summary>
        /// Clear session state from localStorage.
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task ClearSessionStateAsync()
        {
            try
            {
                await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", SESSION_STATE_KEY);
                _logger.LogInformation("SESSION-STATE: Session state cleared");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SESSION-STATE: Failed to clear session state");
            }
        }

        /// <summary>
        /// Check if current session state is still valid (not expired).
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<bool> IsSessionStateValidAsync()
        {
            try
            {
                var sessionState = await LoadSessionStateAsync();

                if (sessionState == null)
                    return false;

                if (sessionState.ExpiresAt.HasValue && sessionState.ExpiresAt.Value < DateTime.UtcNow)
                {
                    _logger.LogWarning("SESSION-STATE: Session state expired for SessionId {SessionId}", sessionState.SessionId);
                    await ClearSessionStateAsync();
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SESSION-STATE: Failed to validate session state");
                return false;
            }
        }

        /// <summary>
        /// Get SessionId from persisted state (for components that need it during initialization).
        /// </summary>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        public async Task<int?> GetSessionIdAsync()
        {
            try
            {
                var sessionState = await LoadSessionStateAsync();
                return sessionState?.SessionId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SESSION-STATE: Failed to get SessionId");
                return null;
            }
        }
    }
}