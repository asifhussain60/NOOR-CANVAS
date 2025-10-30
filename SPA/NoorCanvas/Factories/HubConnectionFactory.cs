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

        public HubConnectionFactory(ILogger<HubConnectionFactory> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Create a configured hub connection with automatic reconnection policy
        /// </summary>
        /// <param name="hubUrl">Hub endpoint URL</param>
        /// <returns>Configured HubConnection (not started)</returns>
        public Task<HubConnection> CreateConnectionAsync(string hubUrl)
        {
            _logger.LogInformation("[HubConnectionFactory] Creating connection for {HubUrl}", hubUrl);

            var connection = new HubConnectionBuilder()
                .WithUrl(hubUrl)
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
