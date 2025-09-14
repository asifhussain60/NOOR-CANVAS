using Microsoft.JSInterop;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Enhanced comprehensive debugging service with infrastructure-level capabilities
    /// Usage: Clean debug code by searching for "NOOR_DEBUG" or "DebugService"
    /// Version: 2.0 Enhanced - All Phases Support
    /// </summary>
    public class DebugService
    {
        private readonly ILogger<DebugService> _logger;
        private readonly IJSRuntime _jsRuntime;
        private readonly IConfiguration _configuration;
        private readonly bool _isDebugEnabled;
        private readonly Dictionary<string, bool> _componentDebugSettings;
        private readonly Dictionary<string, int> _performanceThresholds;
        private readonly DebugMetrics _metrics;

        public DebugService(ILogger<DebugService> logger, IJSRuntime jsRuntime, IConfiguration configuration)
        {
            _logger = logger;
            _jsRuntime = jsRuntime;
            _configuration = configuration;
            _metrics = new DebugMetrics();
            
            // Enhanced debug configuration with component-level control
            _isDebugEnabled = _configuration.GetValue<bool>("DebugConfiguration:EnableDebugMode", false) || 
                            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
            
            // Load component-specific debug settings
            _componentDebugSettings = new Dictionary<string, bool>
            {
                ["Authentication"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:Authentication", true),
                ["SessionManagement"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:SessionManagement", true),
                ["DatabaseOperations"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:DatabaseOperations", true),
                ["SignalRHubs"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:SignalRHubs", true),
                ["HttpClient"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:HttpClient", true),
                ["ComponentLifecycle"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:ComponentLifecycle", true),
                ["Performance"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:Performance", true),
                ["McBeatch"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:McBeatch", true),
                ["Branding"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:Branding", true),
                ["Assets"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:Assets", true),
                ["RTL"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:RTL", true),
                ["CrossApp"] = _configuration.GetValue<bool>("DebugConfiguration:DebugComponents:CrossApp", true)
            };
            
            // Load performance thresholds
            _performanceThresholds = new Dictionary<string, int>
            {
                ["SlowOperationMs"] = _configuration.GetValue<int>("DebugConfiguration:PerformanceThresholds:SlowOperationMs", 1000),
                ["VerySlowOperationMs"] = _configuration.GetValue<int>("DebugConfiguration:PerformanceThresholds:VerySlowOperationMs", 5000),
                ["DatabaseQueryMs"] = _configuration.GetValue<int>("DebugConfiguration:PerformanceThresholds:DatabaseQueryMs", 500)
            };
        }

        /// <summary>
        /// Log debug information with NOOR_DEBUG prefix for easy identification
        /// </summary>
        public void LogDebug(string component, string action, object? data = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled(component)) return;

            _metrics.TotalDebugMessages++;
            _metrics.ComponentMessageCounts[component] = _metrics.ComponentMessageCounts.GetValueOrDefault(component) + 1;
            _metrics.LastActivity = DateTime.UtcNow;

            var debugMessage = $"NOOR_DEBUG: [{component}] {action}";
            if (data != null)
            {
                debugMessage += $" | Data: {System.Text.Json.JsonSerializer.Serialize(data)}";
            }

            _logger.LogInformation(debugMessage);
        }

        /// <summary>
        /// Enhanced debug logging with component-level control
        /// </summary>
        public void LogDebugAdvanced(string component, string action, object? data = null, string? correlationId = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled(component)) return;

            _metrics.TotalDebugMessages++;
            _metrics.ComponentMessageCounts[component] = _metrics.ComponentMessageCounts.GetValueOrDefault(component) + 1;
            _metrics.LastActivity = DateTime.UtcNow;

            var debugMessage = $"NOOR_DEBUG: [{component}] {action}";
            if (correlationId != null)
            {
                debugMessage += $" | CorrelationId: {correlationId}";
            }
            if (data != null)
            {
                debugMessage += $" | Data: {System.Text.Json.JsonSerializer.Serialize(data)}";
            }

            _logger.LogInformation(debugMessage);
        }

        /// <summary>
        /// Log to browser console for frontend debugging
        /// </summary>
        public async Task ConsoleLogAsync(string component, string message, object? data = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled(component)) return;

            try
            {
                var debugObj = new
                {
                    timestamp = DateTime.UtcNow.ToString("HH:mm:ss.fff"),
                    component = component,
                    message = message,
                    data = data
                };

                await _jsRuntime.InvokeVoidAsync("console.group", $"🔍 NOOR_DEBUG: {component}");
                await _jsRuntime.InvokeVoidAsync("console.log", message);
                if (data != null)
                {
                    await _jsRuntime.InvokeVoidAsync("console.log", "Data:", data);
                }
                await _jsRuntime.InvokeVoidAsync("console.groupEnd");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR_DEBUG: Failed to log to browser console");
            }
        }

        /// <summary>
        /// Enhanced browser console logging with grouping and colors
        /// </summary>
        public async Task ConsoleLogAdvancedAsync(string component, string message, object? data = null, string logLevel = "log")
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled(component)) return;

            try
            {
                var debugObj = new
                {
                    timestamp = DateTime.UtcNow.ToString("HH:mm:ss.fff"),
                    component = component,
                    message = message,
                    data = data
                };

                var groupStyle = GetComponentGroupStyle(component);
                await _jsRuntime.InvokeVoidAsync("console.group", $"%c🔍 NOOR_DEBUG: {component}", groupStyle);
                
                var messageStyle = GetLogLevelStyle(logLevel);
                await _jsRuntime.InvokeVoidAsync($"console.{logLevel}", $"%c{message}", messageStyle);
                
                if (data != null)
                {
                    await _jsRuntime.InvokeVoidAsync("console.log", "Data:", data);
                }
                await _jsRuntime.InvokeVoidAsync("console.groupEnd");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR_DEBUG: Failed to log to browser console");
            }
        }

        /// <summary>
        /// Log HTTP request/response for API debugging
        /// </summary>
        public void LogHttpRequest(string endpoint, string method, object? requestData = null, object? responseData = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled("HttpClient")) return;

            var httpDebug = new
            {
                endpoint,
                method,
                timestamp = DateTime.UtcNow,
                requestData,
                responseData
            };

            _logger.LogInformation("NOOR_DEBUG: [HTTP] {Method} {Endpoint} | Request: {@RequestData} | Response: {@ResponseData}", 
                method, endpoint, requestData, responseData);
        }

        /// <summary>
        /// Log component lifecycle events
        /// </summary>
        public async Task LogComponentLifecycle(string componentName, string lifecycleEvent, object? parameters = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled("ComponentLifecycle")) return;

            LogDebug("COMPONENT", $"{componentName}.{lifecycleEvent}", parameters);
            await ConsoleLogAsync("COMPONENT", $"{componentName} → {lifecycleEvent}", parameters);
        }

        /// <summary>
        /// Track SignalR hub events
        /// </summary>
        public void LogSignalREvent(string hubName, string eventName, object? eventData = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled("SignalRHubs")) return;

            LogDebug("SIGNALR", $"{hubName}.{eventName}", eventData);
        }

        /// <summary>
        /// Log database operations
        /// </summary>
        public void LogDatabaseOperation(string operation, string table, object? parameters = null, TimeSpan? duration = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled("DatabaseOperations")) return;

            var dbDebug = new
            {
                operation,
                table,
                parameters,
                duration = duration?.TotalMilliseconds
            };

            LogDebug("DATABASE", $"{operation} on {table}", dbDebug);
        }

        /// <summary>
        /// Track performance with automatic slow operation detection
        /// </summary>
        public void LogPerformanceMetric(string operation, TimeSpan duration, string? component = null)
        {
            if (!_isDebugEnabled || !IsComponentDebugEnabled("Performance")) return;

            var durationMs = duration.TotalMilliseconds;
            var componentKey = component ?? "General";
            
            // Update metrics
            if (!_metrics.AverageOperationTimes.ContainsKey(operation))
            {
                _metrics.AverageOperationTimes[operation] = durationMs;
            }
            else
            {
                _metrics.AverageOperationTimes[operation] = 
                    (_metrics.AverageOperationTimes[operation] + durationMs) / 2;
            }
            
            // Check for slow operations
            if (durationMs > _performanceThresholds["VerySlowOperationMs"])
            {
                _metrics.SlowOperations.Add(new PerformanceAlert
                {
                    Operation = operation,
                    DurationMs = durationMs,
                    Threshold = _performanceThresholds["VerySlowOperationMs"],
                    Timestamp = DateTime.UtcNow,
                    Severity = "Critical"
                });
                
                LogDebugAdvanced("PERFORMANCE", $"CRITICAL SLOW OPERATION: {operation}", new { 
                    DurationMs = durationMs,
                    ThresholdMs = _performanceThresholds["VerySlowOperationMs"],
                    Component = componentKey
                });
            }
            else if (durationMs > _performanceThresholds["SlowOperationMs"])
            {
                _metrics.SlowOperations.Add(new PerformanceAlert
                {
                    Operation = operation,
                    DurationMs = durationMs,
                    Threshold = _performanceThresholds["SlowOperationMs"],
                    Timestamp = DateTime.UtcNow,
                    Severity = "Warning"
                });
                
                LogDebugAdvanced("PERFORMANCE", $"Slow Operation: {operation}", new { 
                    DurationMs = durationMs,
                    ThresholdMs = _performanceThresholds["SlowOperationMs"],
                    Component = componentKey
                });
            }
            else
            {
                LogDebugAdvanced("PERFORMANCE", $"Operation Completed: {operation}", new { 
                    DurationMs = durationMs,
                    Component = componentKey
                });
            }
        }

        /// <summary>
        /// Performance timing helper
        /// </summary>
        public DebugTimer StartTimer(string operationName, string? component = null)
        {
            return new DebugTimer(this, operationName, _isDebugEnabled, component);
        }

        /// <summary>
        /// Check if debug mode is enabled
        /// </summary>
        public bool IsDebugEnabled => _isDebugEnabled;

        /// <summary>
        /// Check if debug is enabled for specific component
        /// </summary>
        public bool IsComponentDebugEnabled(string component)
        {
            return _componentDebugSettings.GetValueOrDefault(component, true);
        }
        
        /// <summary>
        /// Get debug metrics for monitoring
        /// </summary>
        public DebugMetrics GetMetrics() => _metrics;
        
        /// <summary>
        /// Get component-specific console styling
        /// </summary>
        private string GetComponentGroupStyle(string component)
        {
            return component switch
            {
                "Authentication" => "color: #e74c3c; font-weight: bold;",
                "SessionManagement" => "color: #3498db; font-weight: bold;",
                "DatabaseOperations" => "color: #2ecc71; font-weight: bold;",
                "SignalRHubs" => "color: #9b59b6; font-weight: bold;",
                "HttpClient" => "color: #f39c12; font-weight: bold;",
                "Performance" => "color: #e67e22; font-weight: bold;",
                "McBeatch" => "color: #1abc9c; font-weight: bold;",
                "Branding" => "color: #34495e; font-weight: bold;",
                _ => "color: #7f8c8d; font-weight: bold;"
            };
        }
        
        /// <summary>
        /// Get log level specific styling
        /// </summary>
        private string GetLogLevelStyle(string logLevel)
        {
            return logLevel switch
            {
                "error" => "color: #e74c3c;",
                "warn" => "color: #f39c12;",
                "info" => "color: #3498db;",
                _ => "color: #2c3e50;"
            };
        }
    }

    /// <summary>
    /// Enhanced debug timer for performance tracking with automatic metrics collection
    /// </summary>
    public class DebugTimer : IDisposable
    {
        private readonly DebugService _debugService;
        private readonly string _operationName;
        private readonly string? _component;
        private readonly DateTime _startTime;
        private readonly bool _isEnabled;

        public DebugTimer(DebugService debugService, string operationName, bool isEnabled, string? component = null)
        {
            _debugService = debugService;
            _operationName = operationName;
            _component = component;
            _startTime = DateTime.UtcNow;
            _isEnabled = isEnabled;

            if (_isEnabled)
            {
                _debugService.LogDebugAdvanced("PERFORMANCE", $"Starting: {operationName}", null);
            }
        }

        public TimeSpan ElapsedTime => DateTime.UtcNow - _startTime;
        
        public double ElapsedMilliseconds => ElapsedTime.TotalMilliseconds;

        public void Dispose()
        {
            if (_isEnabled)
            {
                var duration = DateTime.UtcNow - _startTime;
                _debugService.LogPerformanceMetric(_operationName, duration, _component);
            }
        }
    }
    
    /// <summary>
    /// Debug metrics collection class
    /// </summary>
    public class DebugMetrics
    {
        public int TotalDebugMessages { get; set; }
        public Dictionary<string, int> ComponentMessageCounts { get; set; } = new();
        public Dictionary<string, double> AverageOperationTimes { get; set; } = new();
        public List<PerformanceAlert> SlowOperations { get; set; } = new();
        public int ErrorCount { get; set; }
        public DateTime LastActivity { get; set; }
        
        public double AverageResponseTime => AverageOperationTimes.Values.Any() ? AverageOperationTimes.Values.Average() : 0;
        public int SlowOperationCount => SlowOperations.Count;
        public string MostActiveComponent => ComponentMessageCounts.Any() ? 
            ComponentMessageCounts.OrderByDescending(x => x.Value).First().Key : "None";
    }
    
    /// <summary>
    /// Performance alert for monitoring slow operations
    /// </summary>
    public class PerformanceAlert
    {
        public string Operation { get; set; } = string.Empty;
        public double DurationMs { get; set; }
        public int Threshold { get; set; }
        public DateTime Timestamp { get; set; }
        public string Severity { get; set; } = string.Empty;
    }
}
