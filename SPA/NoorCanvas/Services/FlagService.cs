using Microsoft.JSInterop;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for managing country flag images with multiple CDN fallbacks for reliability.
    /// Provides flag URL generation and validation functionality.
    /// </summary>
    public class FlagService
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly ILogger<FlagService> _logger;

        // Primary and fallback CDN endpoints
        private readonly List<string> _flagCdnUrls = new()
        {
            "https://flagcdn.com/w20/{0}.png",           // Primary - flagcdn.com
            "https://flagsapi.com/{0}/flat/32.png",      // Fallback 1 - flagsapi.com (uppercase ISO)
            "https://countryflagsapi.com/png/{0}",       // Fallback 2 - countryflagsapi.com (lowercase ISO)
            "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/{0}.svg" // Fallback 3 - GitHub flags
        };

        /// <summary>
        /// Initializes a new instance of the <see cref="FlagService"/> class.
        /// Initializes a new instance of the FlagService with required dependencies.
        /// </summary>
        /// <param name="jsRuntime">JavaScript runtime for client-side operations.</param>
        /// <param name="logger">Logger instance for tracking flag service operations.</param>
        public FlagService(IJSRuntime jsRuntime, ILogger<FlagService> logger)
        {
            _jsRuntime = jsRuntime;
            _logger = logger;
        }

        /// <summary>
        /// Gets the flag URL for a country ISO2 code with fallback CDN support.
        /// </summary>
        /// <param name="countryIso2">Two-letter country code (e.g., "us", "ca", "gb").</param>
        /// <returns>Primary CDN URL with JavaScript fallback handling.</returns>
        public string GetFlagUrl(string? countryIso2)
        {
            _logger.LogInformation("COPILOT-DEBUG: FlagService.GetFlagUrl called with countryIso2='{CountryIso2}'", countryIso2 ?? "NULL");

            if (string.IsNullOrEmpty(countryIso2))
            {
                var defaultUrl = GetDefaultFlagUrl();
                _logger.LogInformation("COPILOT-DEBUG: FlagService returning default flag URL: '{DefaultUrl}'", defaultUrl);
                return defaultUrl;
            }

            var iso2Lower = countryIso2.ToLowerInvariant();

            // Return primary CDN URL - JavaScript will handle fallbacks
            var primaryUrl = string.Format(_flagCdnUrls[0], iso2Lower);
            _logger.LogInformation("COPILOT-DEBUG: FlagService returning primary CDN URL: '{PrimaryUrl}' for country '{CountryIso2}'", primaryUrl, countryIso2);
            return primaryUrl;
        }

        /// <summary>
        /// Gets all fallback URLs for a country ISO2 code (for JavaScript fallback).
        /// </summary>
        /// <returns></returns>
        public List<string> GetAllFlagUrls(string? countryIso2)
        {
            if (string.IsNullOrEmpty(countryIso2))
            {
                return new List<string> { GetDefaultFlagUrl() };
            }

            var iso2Lower = countryIso2.ToLowerInvariant();
            var iso2Upper = countryIso2.ToUpperInvariant();

            return new List<string>
            {
                string.Format(_flagCdnUrls[0], iso2Lower),  // flagcdn.com
                string.Format(_flagCdnUrls[1], iso2Upper),  // flagsapi.com (needs uppercase)
                string.Format(_flagCdnUrls[2], iso2Lower),  // countryflagsapi.com
                string.Format(_flagCdnUrls[3], iso2Lower)   // GitHub flags
            };
        }

        /// <summary>
        /// Returns a default flag URL for unknown countries.
        /// </summary>
        private string GetDefaultFlagUrl()
        {
            // Return a simple 1x1 transparent PNG or UN flag as default
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        }

        /// <summary>
        /// Generates JavaScript code for handling image load failures with CDN fallbacks.
        /// </summary>
        /// <returns></returns>
        public string GetFallbackScript(string countryIso2)
        {
            var fallbackUrls = GetAllFlagUrls(countryIso2);
            var jsUrls = string.Join(",", fallbackUrls.Skip(1).Select(url => $"'{url}'"));

            return $@"
                let fallbacks_{countryIso2?.Replace("-", "_")} = [{jsUrls}];
                let currentIndex_{countryIso2?.Replace("-", "_")} = 0;
                
                function tryNextFlag_{countryIso2?.Replace("-", "_")}(img) {{
                    if (currentIndex_{countryIso2?.Replace("-", "_")} < fallbacks_{countryIso2?.Replace("-", "_")}.length) {{
                        img.src = fallbacks_{countryIso2?.Replace("-", "_")}[currentIndex_{countryIso2?.Replace("-", "_")}];
                        currentIndex_{countryIso2?.Replace("-", "_")}++;
                    }} else {{
                        img.style.display = 'none'; // Hide if all CDNs fail
                    }}
                }}
            ";
        }
    }
}