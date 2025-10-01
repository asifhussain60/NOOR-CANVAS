using NoorCanvas.Services;
using System.Diagnostics;

namespace NoorCanvas.Middleware
{
    /// <summary>
    /// Debug middleware for comprehensive request/response tracking
    /// Automatically logs all HTTP requests with performance metrics.
    /// </summary>
    public class DebugMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<DebugMiddleware> _logger;

        public DebugMiddleware(RequestDelegate next, ILogger<DebugMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Resolve DebugService from the request scope
            var debugService = context.RequestServices.GetRequiredService<DebugService>();

            if (!debugService.IsDebugEnabled)
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();
            var correlationId = Guid.NewGuid().ToString("N")[..8];

            // Add correlation ID to response headers
            context.Response.Headers.Append("X-Debug-CorrelationId", correlationId);

            try
            {
                // Log incoming request
                debugService.LogDebugAdvanced("HTTP_MIDDLEWARE", "Request Started", new
                {
                    Method = context.Request.Method,
                    Path = context.Request.Path,
                    QueryString = context.Request.QueryString.Value,
                    UserAgent = context.Request.Headers.UserAgent.ToString(),
                    RemoteIP = context.Connection.RemoteIpAddress?.ToString(),
                    ContentType = context.Request.ContentType,
                    ContentLength = context.Request.ContentLength
                }, correlationId);

                // Execute the next middleware in the pipeline
                await _next(context);

                stopwatch.Stop();

                // Log successful response
                debugService.LogDebugAdvanced("HTTP_MIDDLEWARE", "Request Completed", new
                {
                    StatusCode = context.Response.StatusCode,
                    ContentType = context.Response.ContentType,
                    ContentLength = context.Response.ContentLength,
                    DurationMs = stopwatch.ElapsedMilliseconds
                }, correlationId);

                // Log performance metrics
                debugService.LogPerformanceMetric($"HTTP_{context.Request.Method}_{context.Request.Path}",
                    stopwatch.Elapsed, "HTTP_MIDDLEWARE");
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // Log error response
                debugService.LogDebugAdvanced("HTTP_MIDDLEWARE", "Request Failed", new
                {
                    StatusCode = context.Response.StatusCode,
                    Error = ex.Message,
                    StackTrace = ex.StackTrace,
                    DurationMs = stopwatch.ElapsedMilliseconds
                }, correlationId);

                _logger.LogError(ex, "NOOR_DEBUG: Request failed for {Method} {Path} (CorrelationId: {CorrelationId})",
                    context.Request.Method, context.Request.Path, correlationId);

                throw; // Re-throw to maintain error handling behavior
            }
        }
    }

    /// <summary>
    /// Extension method to register Debug Middleware.
    /// </summary>
    public static class DebugMiddlewareExtensions
    {
        /// <summary>
        /// Add debug middleware to the pipeline (only in development).
        /// </summary>
        /// <returns></returns>
        public static IApplicationBuilder UseDebugMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<DebugMiddleware>();
        }
    }
}
