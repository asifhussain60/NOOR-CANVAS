using NoorCanvas.Services;

namespace NoorCanvas.Extensions
{
    /// <summary>
    /// Debug extension methods for easy integration throughout the application
    /// Usage: Component can use fluent debug API - this.Debug().LogComponent("Action", data)
    /// </summary>
    public static class DebugExtensions
    {
        /// <summary>
        /// Extension method to add debug capabilities to any object
        /// </summary>
        public static DebugContext Debug(this object source, DebugService debugService)
        {
            return new DebugContext(debugService, source.GetType().Name);
        }

        /// <summary>
        /// Extension for Blazor components to easily add debug logging
        /// </summary>
        public static async Task DebugLifecycleAsync(this Microsoft.AspNetCore.Components.ComponentBase component,
            DebugService debugService, string lifecycleEvent, object? parameters = null)
        {
            await debugService.LogComponentLifecycle(component.GetType().Name, lifecycleEvent, parameters);
        }

        /// <summary>
        /// Extension for controllers to easily add debug logging
        /// </summary>
        public static void DebugAction(this Microsoft.AspNetCore.Mvc.ControllerBase controller,
            DebugService debugService, string actionName, object? parameters = null)
        {
            debugService.LogDebugAdvanced("CONTROLLER", $"{controller.GetType().Name}.{actionName}", parameters);
        }

        /// <summary>
        /// Extension for SignalR hubs to easily add debug logging
        /// </summary>
        public static void DebugHubMethod(this Microsoft.AspNetCore.SignalR.Hub hub,
            DebugService debugService, string methodName, object? parameters = null)
        {
            debugService.LogSignalREvent(hub.GetType().Name, methodName, parameters);
        }
    }

    /// <summary>
    /// Debug context for fluent API
    /// </summary>
    public class DebugContext
    {
        private readonly DebugService _debugService;
        private readonly string _componentName;

        public DebugContext(DebugService debugService, string componentName)
        {
            _debugService = debugService;
            _componentName = componentName;
        }

        public DebugContext LogComponent(string action, object? data = null)
        {
            _debugService.LogDebug(_componentName, action, data);
            return this;
        }

        public async Task<DebugContext> LogComponentAsync(string action, object? data = null)
        {
            await _debugService.ConsoleLogAsync(_componentName, action, data);
            return this;
        }

        public DebugContext LogPerformance(string operation, TimeSpan duration)
        {
            _debugService.LogPerformanceMetric(operation, duration, _componentName);
            return this;
        }

        public DebugTimer StartTimer(string operationName)
        {
            return _debugService.StartTimer($"{_componentName}.{operationName}", _componentName);
        }

        public DebugContext LogHttp(string endpoint, string method, object? request = null, object? response = null)
        {
            _debugService.LogHttpRequest(endpoint, method, request, response);
            return this;
        }

        public DebugContext LogDatabase(string operation, string table, object? parameters = null, TimeSpan? duration = null)
        {
            _debugService.LogDatabaseOperation(operation, table, parameters, duration);
            return this;
        }
    }
}
