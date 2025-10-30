using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using NoorCanvas.Factories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace NoorCanvas.Middleware
{
    /// <summary>
    /// Middleware for managing SignalR hub connections with automatic reconnection and health monitoring.
    /// [hcp-refactor:phase2] Extracted from HostControlPanel.razor - Infrastructure separation.
    /// </summary>
    public class SignalRMiddleware : IAsyncDisposable
    {
        private readonly ILogger<SignalRMiddleware> _logger;
        private readonly IHubConnectionFactory _hubConnectionFactory;
        private HubConnection? _hubConnection;
        private Timer? _healthCheckTimer;
        private DateTime? _lastHealthCheck;
        private int _reconnectAttempts = 0;
        private const int MaxReconnectAttempts = 10;
        private const int HealthCheckIntervalMs = 30000; // 30 seconds
        private bool _disposed = false;

        /// <summary>
        /// Initializes a new instance of the <see cref="SignalRMiddleware"/> class.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        /// <param name="hubConnectionFactory">Factory for creating hub connections.</param>
        public SignalRMiddleware(
            ILogger<SignalRMiddleware> logger,
            IHubConnectionFactory hubConnectionFactory)
        {
            _logger = logger;
            _hubConnectionFactory = hubConnectionFactory;
        }

        /// <summary>
        /// Gets the current hub connection state.
        /// </summary>
        public HubConnectionState ConnectionState => _hubConnection?.State ?? HubConnectionState.Disconnected;

        /// <summary>
        /// Gets a value indicating whether the connection is currently active.
        /// </summary>
        public bool IsConnected => _hubConnection?.State == HubConnectionState.Connected;

        /// <summary>
        /// Event raised when connection state changes.
        /// </summary>
        public event EventHandler<HubConnectionState>? ConnectionStateChanged;

        /// <summary>
        /// Event raised when health check fails.
        /// </summary>
        public event EventHandler<string>? HealthCheckFailed;

        /// <summary>
        /// Initialize SignalR connection with automatic reconnection.
        /// </summary>
        /// <param name="hubUrl">Hub endpoint URL.</param>
        /// <returns>Connected hub instance.</returns>
        public async Task<HubConnection> InitializeConnectionAsync(string hubUrl)
        {
            _logger.LogInformation("[SignalRMiddleware] Initializing connection to {HubUrl}", hubUrl);

            try
            {
                // Create connection using factory
                _hubConnection = await _hubConnectionFactory.CreateConnectionAsync(hubUrl);

                // Register reconnection handlers
                RegisterReconnectionHandlers();

                // Start connection
                await _hubConnection.StartAsync();
                _reconnectAttempts = 0;

                _logger.LogInformation("[SignalRMiddleware] ✅ Connection established - ConnectionId: {ConnectionId}", 
                    _hubConnection.ConnectionId);

                // Start health monitoring
                StartHealthMonitoring();

                ConnectionStateChanged?.Invoke(this, HubConnectionState.Connected);

                return _hubConnection;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SignalRMiddleware] ❌ Failed to initialize connection");
                throw;
            }
        }

        /// <summary>
        /// Get or create the hub connection (convenience method).
        /// </summary>
        /// <param name="hubUrl">Hub endpoint URL.</param>
        /// <returns>The active hub connection.</returns>
        public async Task<HubConnection> GetOrCreateConnectionAsync(string hubUrl)
        {
            if (_hubConnection != null && _hubConnection.State == HubConnectionState.Connected)
            {
                _logger.LogDebug("[SignalRMiddleware] Returning existing connection - ConnectionId: {ConnectionId}",
                    _hubConnection.ConnectionId);
                return _hubConnection;
            }

            return await InitializeConnectionAsync(hubUrl);
        }

        /// <summary>
        /// Register a SignalR event handler with single parameter.
        /// </summary>
        /// <typeparam name="T">Type of the event parameter.</typeparam>
        /// <param name="eventName">Name of the SignalR event.</param>
        /// <param name="handler">Handler function.</param>
        public void RegisterHandler<T>(string eventName, Func<T, Task> handler)
        {
            if (_hubConnection == null)
            {
                _logger.LogWarning("[SignalRMiddleware] Cannot register handler '{EventName}' - connection not initialized", eventName);
                return;
            }

            _logger.LogInformation("[SignalRMiddleware] Registering handler for event: {EventName}", eventName);
            _hubConnection.On(eventName, handler);
        }

        /// <summary>
        /// Register a SignalR event handler with two parameters.
        /// </summary>
        /// <typeparam name="T1">Type of the first event parameter.</typeparam>
        /// <typeparam name="T2">Type of the second event parameter.</typeparam>
        /// <param name="eventName">Name of the SignalR event.</param>
        /// <param name="handler">Handler function.</param>
        public void RegisterHandler<T1, T2>(string eventName, Func<T1, T2, Task> handler)
        {
            if (_hubConnection == null)
            {
                _logger.LogWarning("[SignalRMiddleware] Cannot register handler '{EventName}' - connection not initialized", eventName);
                return;
            }

            _logger.LogInformation("[SignalRMiddleware] Registering handler for event: {EventName} (2 params)", eventName);
            _hubConnection.On(eventName, handler);
        }

        /// <summary>
        /// Register a SignalR event handler with three parameters.
        /// [hcp-refactor:phase2] Added for SessionCanvas AssetShared event.
        /// </summary>
        /// <typeparam name="T1">Type of the first event parameter.</typeparam>
        /// <typeparam name="T2">Type of the second event parameter.</typeparam>
        /// <typeparam name="T3">Type of the third event parameter.</typeparam>
        /// <param name="eventName">Name of the SignalR event.</param>
        /// <param name="handler">Handler function.</param>
        public Task RegisterHandler<T1, T2, T3>(string eventName, Func<T1, T2, T3, Task> handler)
        {
            if (_hubConnection == null)
            {
                _logger.LogWarning("[SignalRMiddleware] Cannot register handler '{EventName}' - connection not initialized", eventName);
                return Task.CompletedTask;
            }

            _logger.LogInformation("[SignalRMiddleware] Registering handler for event: {EventName} (3 params)", eventName);
            _hubConnection.On(eventName, handler);
            return Task.CompletedTask;
        }

        /// <summary>
        /// Get the current hub connection instance.
        /// </summary>
        /// <returns>The active hub connection or null if not initialized.</returns>
        public HubConnection? GetConnection()
        {
            return _hubConnection;
        }

        /// <summary>
        /// Manually trigger reconnection.
        /// </summary>
        /// <returns>A task representing the asynchronous reconnection operation.</returns>
        public async Task ReconnectAsync()
        {
            if (_hubConnection == null)
            {
                _logger.LogWarning("[SignalRMiddleware] Cannot reconnect - no connection instance");
                return;
            }

            _logger.LogInformation("[SignalRMiddleware] Manual reconnection requested");

            try
            {
                await _hubConnection.StopAsync();
                await Task.Delay(1000); // Brief delay before reconnect
                await _hubConnection.StartAsync();
                
                _reconnectAttempts = 0;
                _logger.LogInformation("[SignalRMiddleware] ✅ Manual reconnection successful");
                
                ConnectionStateChanged?.Invoke(this, HubConnectionState.Connected);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SignalRMiddleware] ❌ Manual reconnection failed");
                throw;
            }
        }

        private void RegisterReconnectionHandlers()
        {
            if (_hubConnection == null) return;

            _hubConnection.Closed += async (error) =>
            {
                _logger.LogWarning("[SignalRMiddleware] Connection closed - Error: {Error}", error?.Message ?? "none");
                ConnectionStateChanged?.Invoke(this, HubConnectionState.Disconnected);

                // Attempt automatic reconnection with exponential backoff
                await AttemptReconnectionAsync();
            };

            _hubConnection.Reconnecting += (error) =>
            {
                _logger.LogInformation("[SignalRMiddleware] Reconnecting... Error: {Error}", error?.Message ?? "none");
                ConnectionStateChanged?.Invoke(this, HubConnectionState.Reconnecting);
                return Task.CompletedTask;
            };

            _hubConnection.Reconnected += (connectionId) =>
            {
                _logger.LogInformation("[SignalRMiddleware] ✅ Reconnected - ConnectionId: {ConnectionId}", connectionId);
                _reconnectAttempts = 0;
                ConnectionStateChanged?.Invoke(this, HubConnectionState.Connected);
                return Task.CompletedTask;
            };
        }

        private async Task AttemptReconnectionAsync()
        {
            while (_reconnectAttempts < MaxReconnectAttempts && !_disposed)
            {
                _reconnectAttempts++;
                
                // Exponential backoff: 2^attempts seconds (max 60s)
                var delaySeconds = Math.Min(Math.Pow(2, _reconnectAttempts), 60);
                
                _logger.LogInformation("[SignalRMiddleware] Reconnection attempt {Attempt}/{Max} in {Delay}s",
                    _reconnectAttempts, MaxReconnectAttempts, delaySeconds);

                await Task.Delay(TimeSpan.FromSeconds(delaySeconds));

                try
                {
                    if (_hubConnection != null)
                    {
                        await _hubConnection.StartAsync();
                        _reconnectAttempts = 0;
                        _logger.LogInformation("[SignalRMiddleware] ✅ Automatic reconnection successful");
                        ConnectionStateChanged?.Invoke(this, HubConnectionState.Connected);
                        return;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[SignalRMiddleware] Reconnection attempt {Attempt} failed", _reconnectAttempts);
                }
            }

            if (_reconnectAttempts >= MaxReconnectAttempts)
            {
                _logger.LogError("[SignalRMiddleware] ❌ Max reconnection attempts ({Max}) exceeded", MaxReconnectAttempts);
                HealthCheckFailed?.Invoke(this, $"Failed to reconnect after {MaxReconnectAttempts} attempts");
            }
        }

        private void StartHealthMonitoring()
        {
            _healthCheckTimer = new Timer(async _ => await PerformHealthCheckAsync(), 
                null, 
                TimeSpan.FromMilliseconds(HealthCheckIntervalMs), 
                TimeSpan.FromMilliseconds(HealthCheckIntervalMs));

            _logger.LogInformation("[SignalRMiddleware] Health monitoring started - Interval: {Interval}ms", HealthCheckIntervalMs);
        }

        private Task PerformHealthCheckAsync()
        {
            if (_hubConnection == null || _disposed)
            {
                return Task.CompletedTask;
            }

            try
            {
                if (_hubConnection.State == HubConnectionState.Connected)
                {
                    // Simple ping to verify connection is alive
                    // Hub should have a "Ping" method that returns immediately
                    // await _hubConnection.InvokeAsync("Ping");
                    
                    _lastHealthCheck = DateTime.UtcNow;
                    _logger.LogDebug("[SignalRMiddleware] Health check passed - ConnectionId: {ConnectionId}", 
                        _hubConnection.ConnectionId);
                }
                else
                {
                    _logger.LogWarning("[SignalRMiddleware] Health check - Connection not in Connected state: {State}", 
                        _hubConnection.State);
                    
                    HealthCheckFailed?.Invoke(this, $"Connection state: {_hubConnection.State}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[SignalRMiddleware] Health check failed: {Message}", ex.Message);
                HealthCheckFailed?.Invoke(this, ex.Message);
            }

            return Task.CompletedTask;
        }

        /// <summary>
        /// Asynchronously disposes the middleware and releases all resources.
        /// </summary>
        /// <returns>A task representing the asynchronous dispose operation.</returns>
        public async ValueTask DisposeAsync()
        {
            if (_disposed)
            {
                return;
            }

            _logger.LogInformation("[SignalRMiddleware] Disposing middleware");

            _disposed = true;

            // Stop health monitoring
            _healthCheckTimer?.Dispose();
            _healthCheckTimer = null;

            // Close hub connection
            if (_hubConnection != null)
            {
                try
                {
                    await _hubConnection.StopAsync();
                    await _hubConnection.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[SignalRMiddleware] Error disposing hub connection");
                }

                _hubConnection = null;
            }

            _logger.LogInformation("[SignalRMiddleware] ✅ Middleware disposed");
        }
    }
}
