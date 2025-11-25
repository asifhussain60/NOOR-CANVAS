using System.Diagnostics;
using Microsoft.Extensions.Logging;
using NoorCanvas.Constants;

namespace NoorCanvas.Services.SignalR;

/// <summary>
/// [REFACTOR:Phase2] Context for standardized SignalR event handling
/// Provides consistent logging, error handling, and metrics for all event handlers
/// </summary>
public class SignalREventContext : IAsyncDisposable
{
    private readonly string _requestId;
    private readonly string _eventName;
    private readonly ILogger _logger;
    private readonly Stopwatch _stopwatch;
    private bool _disposed;
    
    public string RequestId => _requestId;
    public string EventName => _eventName;
    
    public SignalREventContext(string eventName, ILogger logger)
    {
        _requestId = LoggingConstants.CreateRequestId();
        _eventName = eventName;
        _logger = logger;
        _stopwatch = Stopwatch.StartNew();
        
        LogEventStart();
    }
    
    /// <summary>
    /// Deserialize SignalR event data to strongly typed object
    /// </summary>
    public T Deserialize<T>(object data)
    {
        try
        {
            var json = data.ToString();
            if (string.IsNullOrEmpty(json))
            {
                throw new ArgumentException("Data cannot be serialized to null or empty string", nameof(data));
            }
            var result = System.Text.Json.JsonSerializer.Deserialize<T>(json);
            
            if (result == null)
            {
                _logger.LogWarning(
                    "[SIGNALR-EVENT:{RequestId}] Deserialization returned null for {EventName}",
                    _requestId, _eventName);
            }
            
            return result!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[SIGNALR-EVENT:{RequestId}] Failed to deserialize {EventName} data",
                _requestId, _eventName);
            throw;
        }
    }
    
    /// <summary>
    /// Log informational message with context
    /// </summary>
    public void LogInfo(string message, params object[] args)
    {
        var formattedArgs = new object[] { _requestId, _eventName }.Concat(args).ToArray();
        _logger.LogInformation(
            $"[SIGNALR-EVENT:{{RequestId}}] {{EventName}} - {message}",
            formattedArgs);
    }
    
    /// <summary>
    /// Log warning message with context
    /// </summary>
    public void LogWarning(string message, params object[] args)
    {
        var formattedArgs = new object[] { _requestId, _eventName }.Concat(args).ToArray();
        _logger.LogWarning(
            $"[SIGNALR-EVENT:{{RequestId}}] {{EventName}} - {message}",
            formattedArgs);
    }
    
    /// <summary>
    /// Log error with context
    /// </summary>
    public void LogError(Exception ex, string message, params object[] args)
    {
        var formattedArgs = new object[] { _requestId, _eventName }.Concat(args).ToArray();
        _logger.LogError(ex,
            $"[SIGNALR-EVENT:{{RequestId}}] {{EventName}} - {message}",
            formattedArgs);
    }
    
    private void LogEventStart()
    {
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] ════════════════════════════════════════════════════════════════",
            _requestId);
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] {EventName} SIGNALR EVENT START",
            _requestId, _eventName);
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] ════════════════════════════════════════════════════════════════",
            _requestId);
    }
    
    private void LogEventComplete()
    {
        _stopwatch.Stop();
        
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] ════════════════════════════════════════════════════════════════",
            _requestId);
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] {EventName} COMPLETE - Duration: {Duration}ms",
            _requestId, _eventName, _stopwatch.ElapsedMilliseconds);
        _logger.LogInformation(
            "[SIGNALR-EVENT:{RequestId}] ════════════════════════════════════════════════════════════════",
            _requestId);
    }
    
    public async ValueTask DisposeAsync()
    {
        if (_disposed)
            return;
        
        LogEventComplete();
        _disposed = true;
        
        await Task.CompletedTask;
    }
}
