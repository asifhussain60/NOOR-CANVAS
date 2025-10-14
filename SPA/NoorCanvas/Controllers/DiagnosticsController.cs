using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace NoorCanvas.Controllers
{
    /// <summary>
    /// Diagnostics API for automated browser diagnostics.
    /// Receives diagnostic reports from automated tests or client-side reporting.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly ILogger<DiagnosticsController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="DiagnosticsController"/> class.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        public DiagnosticsController(ILogger<DiagnosticsController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Client-side diagnostic reporting endpoint.
        /// Receives automated diagnostic data from browser.
        /// </summary>
        /// <param name="report">Diagnostic report from client.</param>
        /// <returns>Request ID for tracking.</returns>
        [HttpPost("report")]
        public IActionResult SubmitDiagnosticReport([FromBody] ClientDiagnosticReport report)
        {
            var requestId = Guid.NewGuid().ToString("N").Substring(0, 8);
            
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] ========== CLIENT DIAGNOSTIC REPORT ==========", requestId);
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] URL: {Url}", requestId, report.Url);
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] User Agent: {UserAgent}", requestId, report.UserAgent);
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] Timestamp: {Timestamp}", requestId, report.Timestamp);
            
            // Log console errors
            if (report.ConsoleErrors?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] CONSOLE ERRORS ({Count}):", requestId, report.ConsoleErrors.Count);
                foreach (var error in report.ConsoleErrors)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Error}", requestId, error);
                }
            }
            else
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] CONSOLE ERRORS: None", requestId);
            }
            
            // Log library availability
            if (report.LibrariesLoaded != null)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] LIBRARIES:", requestId);
                foreach (var lib in report.LibrariesLoaded)
                {
                    var status = lib.Value ? "✅ LOADED" : "❌ NOT LOADED";
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   {Library}: {Status}", 
                        requestId, lib.Key, status);
                }
            }
            
            // Log failed resources
            if (report.FailedResources?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] FAILED RESOURCES ({Count}):", requestId, report.FailedResources.Count);
                foreach (var resource in report.FailedResources)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Resource}", requestId, resource);
                }
            }
            else
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] FAILED RESOURCES: None", requestId);
            }
            
            // Log missing DOM elements
            if (report.MissingElements?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] MISSING ELEMENTS ({Count}):", requestId, report.MissingElements.Count);
                foreach (var element in report.MissingElements)
                {
                    _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   - {Element}", requestId, element);
                }
            }
            else
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] MISSING ELEMENTS: None", requestId);
            }
            
            // Log computed styles summary
            if (report.ComputedStyles?.Any() == true)
            {
                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] COMPUTED STYLES: {Count} elements analyzed", 
                    requestId, report.ComputedStyles.Count);
                
                // Log any concerning styles (hidden elements, low z-index)
                foreach (var style in report.ComputedStyles)
                {
                    if (style.Value is Dictionary<string, object> styleDict)
                    {
                        if (styleDict.TryGetValue("display", out var display) && display?.ToString() == "none")
                        {
                            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   ⚠️  {Selector}: display:none", 
                                requestId, style.Key);
                        }
                        if (styleDict.TryGetValue("visibility", out var visibility) && visibility?.ToString() == "hidden")
                        {
                            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   ⚠️  {Selector}: visibility:hidden", 
                                requestId, style.Key);
                        }
                        if (styleDict.TryGetValue("zIndex", out var zIndex))
                        {
                            var zIndexStr = zIndex?.ToString();
                            if (zIndexStr == "auto" || zIndexStr == "0" || (int.TryParse(zIndexStr, out var zIndexInt) && zIndexInt < 1000))
                            {
                                _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}]   💡 {Selector}: low z-index ({ZIndex})", 
                                    requestId, style.Key, zIndexStr);
                            }
                        }
                    }
                }
            }
            
            _logger.LogCritical("[DIAGNOSTIC:client-report] [{RequestId}] ========== REPORT COMPLETE ==========", requestId);
            
            return Ok(new { requestId, message = "Diagnostic report received and logged" });
        }

        /// <summary>
        /// Health check endpoint.
        /// </summary>
        /// <returns>Health status.</returns>
        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
    }

    /// <summary>
    /// Client diagnostic report model.
    /// </summary>
    public class ClientDiagnosticReport
    {
        /// <summary>
        /// Gets or sets the URL being diagnosed.
        /// </summary>
        public string Url { get; set; } = "";
        
        /// <summary>
        /// Gets or sets the user agent string.
        /// </summary>
        public string UserAgent { get; set; } = "";
        
        /// <summary>
        /// Gets or sets the timestamp of the report.
        /// </summary>
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
        
        /// <summary>
        /// Gets or sets the list of console errors.
        /// </summary>
        public List<string> ConsoleErrors { get; set; } = new();
        
        /// <summary>
        /// Gets or sets the library loading status.
        /// </summary>
        public Dictionary<string, bool> LibrariesLoaded { get; set; } = new();
        
        /// <summary>
        /// Gets or sets the list of failed resources.
        /// </summary>
        public List<string> FailedResources { get; set; } = new();
        
        /// <summary>
        /// Gets or sets the list of missing DOM elements.
        /// </summary>
        public List<string> MissingElements { get; set; } = new();
        
        /// <summary>
        /// Gets or sets the computed styles for elements.
        /// </summary>
        public Dictionary<string, object> ComputedStyles { get; set; } = new();
    }
}
