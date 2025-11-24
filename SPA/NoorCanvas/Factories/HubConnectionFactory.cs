using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace NoorCanvas.Factories
{
    /// <summary>
    /// Factory for creating configured SignalR hub connections with automatic reconnection
    /// [hcp-refactor:phase2] Extracted from HostControlPanel.razor - Infrastructure separation
    /// </summary>
    public class HubConnectionFactory : IHubConnectionFactory
    {
        private readonly ILogger<HubConnectionFactory> _logger;
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor? _httpContextAccessor;

        public HubConnectionFactory(
            ILogger<HubConnectionFactory> logger,
            Microsoft.AspNetCore.Http.IHttpContextAccessor? httpContextAccessor = null)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Create a configured hub connection with automatic reconnection policy
        /// </summary>
        /// <param name="hubUrl">Hub endpoint URL (can be relative like /hub/session)</param>
        /// <returns>Configured HubConnection (not started)</returns>
        public Task<HubConnection> CreateConnectionAsync(string hubUrl)
        {
            // Convert relative URLs to absolute using current request context
            string absoluteUrl = hubUrl;
            if (hubUrl.StartsWith("/") && _httpContextAccessor?.HttpContext != null)
            {
                var request = _httpContextAccessor.HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}";
                absoluteUrl = $"{baseUrl}{hubUrl}";
                _logger.LogInformation("[HubConnectionFactory] Converted relative URL '{HubUrl}' to absolute '{AbsoluteUrl}'", 
                    hubUrl, absoluteUrl);
            }

            _logger.LogInformation("[HubConnectionFactory] Creating connection for {HubUrl}", absoluteUrl);

            var connection = new HubConnectionBuilder()
                .WithUrl(absoluteUrl)
                .WithAutomaticReconnect(new ExponentialBackoffRetryPolicy())
                .Build();

            _logger.LogInformation("[HubConnectionFactory] ✅ Connection created with automatic reconnect policy");

            return Task.FromResult(connection);
        }
    }

    /// <summary>
    /// Custom retry policy with exponential backoff
    /// Delays: 2s, 4s, 8s, 16s, 32s, 32s... (max 32s)
    /// [hcp-refactor:phase2] Extracted connection resilience logic
    /// </summary>
    public class ExponentialBackoffRetryPolicy : IRetryPolicy
    {
        private readonly TimeSpan[] _backoffSequence = new[]
        {
            TimeSpan.FromSeconds(2),
            TimeSpan.FromSeconds(4),
            TimeSpan.FromSeconds(8),
            TimeSpan.FromSeconds(16),
            TimeSpan.FromSeconds(32)
        };

        public TimeSpan? NextRetryDelay(RetryContext retryContext)
        {
            // After max attempts, continue with 32s delay
            if (retryContext.PreviousRetryCount >= _backoffSequence.Length)
            {
                return TimeSpan.FromSeconds(32);
            }

            return _backoffSequence[retryContext.PreviousRetryCount];
        }
    }
}
