using System.Text.RegularExpressions;
using System.Web;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Advanced HTML parsing service to replace/enhance Blazor's DOM parser limitations
    /// Provides robust HTML validation, sanitization, and safe rendering for broadcast content
    /// </summary>
    public class HtmlParsingService
    {
        private readonly ILogger<HtmlParsingService> _logger;
        
        // Regex patterns for problematic CSS detection
        private static readonly Regex ComplexGradientPattern = new(@"linear-gradient\([^)]*\)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex RgbaPattern = new(@"rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex ComplexFontFamilyPattern = new(@"font-family:\s*[""'][^""']*[""']\s*,\s*[""'][^""']*[""']", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex NestedQuotePattern = new(@"style\s*=\s*[""'][^""']*[""'][^""']*[""'][^""']*[""']", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        
        public HtmlParsingService(ILogger<HtmlParsingService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Parse and validate HTML content with advanced error recovery
        /// This replaces the basic Blazor MarkupString approach with robust parsing
        /// </summary>
        public SafeHtmlResult ParseHtml(string? htmlContent, ParseMode mode = ParseMode.Safe)
        {
            if (string.IsNullOrEmpty(htmlContent))
                return SafeHtmlResult.Empty();

            try
            {
                _logger.LogInformation("[DEBUG-WORKITEM:signalcomm:PARSER] Starting HTML parsing, mode: {Mode}, length: {Length} ;CLEANUP_OK", 
                    mode, htmlContent.Length);

                // Phase 1: Security validation
                var securityResult = ValidateSecurity(htmlContent);
                if (!securityResult.IsValid)
                {
                    return SafeHtmlResult.Error(securityResult.ErrorMessage);
                }

                // Phase 2: Blazor compatibility analysis
                var compatibilityResult = AnalyzeBlazorCompatibility(htmlContent);
                if (!compatibilityResult.IsValid && mode == ParseMode.Strict)
                {
                    return SafeHtmlResult.Error(compatibilityResult.ErrorMessage);
                }

                // Phase 3: CSS processing and simplification
                var processedHtml = ProcessCssForBlazorCompatibility(htmlContent);
                
                // Phase 4: Quote normalization
                var normalizedHtml = NormalizeQuotes(processedHtml);

                // Phase 5: Final validation
                var finalValidation = ValidateFinalHtml(normalizedHtml);
                if (!finalValidation.IsValid)
                {
                    return SafeHtmlResult.Error(finalValidation.ErrorMessage);
                }

                _logger.LogInformation("[DEBUG-WORKITEM:signalcomm:PARSER] HTML parsing successful, output length: {Length} ;CLEANUP_OK", 
                    normalizedHtml.Length);

                return SafeHtmlResult.Success(normalizedHtml, compatibilityResult.Warnings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DEBUG-WORKITEM:signalcomm:PARSER] HTML parsing failed ;CLEANUP_OK");
                return SafeHtmlResult.Error($"Parser error: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate HTML for security issues (XSS prevention)
        /// </summary>
        private ValidationResult ValidateSecurity(string html)
        {
            var dangerousPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"on\w+\s*=",
                @"<iframe[^>]*>",
                @"<object[^>]*>",
                @"<embed[^>]*>"
            };

            foreach (var pattern in dangerousPatterns)
            {
                if (Regex.IsMatch(html, pattern, RegexOptions.IgnoreCase))
                {
                    return ValidationResult.Invalid($"Potentially unsafe content detected: {pattern}");
                }
            }

            return ValidationResult.Valid();
        }

        /// <summary>
        /// Analyze HTML for Blazor DOM parser compatibility issues
        /// </summary>
        private ValidationResult AnalyzeBlazorCompatibility(string html)
        {
            var warnings = new List<string>();
            var errors = new List<string>();

            // Check for complex gradients
            if (ComplexGradientPattern.IsMatch(html))
            {
                warnings.Add("Complex CSS gradients detected - may cause parsing issues");
            }

            // Check for RGBA with decimals
            if (RgbaPattern.IsMatch(html))
            {
                warnings.Add("RGBA colors detected - may cause parsing issues");
            }

            // Check for complex font-family declarations
            if (ComplexFontFamilyPattern.IsMatch(html))
            {
                warnings.Add("Complex font-family declarations detected");
            }

            // Check for nested quotes in style attributes
            if (NestedQuotePattern.IsMatch(html))
            {
                errors.Add("Nested quotes in style attributes detected - likely to cause parsing failure");
            }

            // Check for unmatched quotes
            var singleQuotes = html.Count(c => c == '\'');
            var doubleQuotes = html.Count(c => c == '"');
            
            if (singleQuotes % 2 != 0)
            {
                errors.Add("Unmatched single quotes detected");
            }
            
            if (doubleQuotes % 2 != 0)
            {
                errors.Add("Unmatched double quotes detected");
            }

            if (errors.Any())
            {
                return ValidationResult.Invalid(string.Join("; ", errors));
            }

            return ValidationResult.Valid(warnings);
        }

        /// <summary>
        /// Process CSS to make it compatible with Blazor's DOM parser
        /// This is the core replacement logic for problematic CSS patterns
        /// </summary>
        private string ProcessCssForBlazorCompatibility(string html)
        {
            var processed = html;

            // Replace complex gradients with simple backgrounds
            processed = ComplexGradientPattern.Replace(processed, match =>
            {
                _logger.LogDebug("[DEBUG-WORKITEM:signalcomm:PARSER] Replacing complex gradient: {Gradient} ;CLEANUP_OK", match.Value);
                return "background-color: #f0f0f0"; // Safe fallback
            });

            // Replace RGBA with solid colors
            processed = RgbaPattern.Replace(processed, match =>
            {
                _logger.LogDebug("[DEBUG-WORKITEM:signalcomm:PARSER] Replacing RGBA color: {Color} ;CLEANUP_OK", match.Value);
                // Extract RGB values and use solid color
                var rgbaMatch = Regex.Match(match.Value, @"rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)");
                if (rgbaMatch.Success)
                {
                    var r = rgbaMatch.Groups[1].Value;
                    var g = rgbaMatch.Groups[2].Value;
                    var b = rgbaMatch.Groups[3].Value;
                    return $"rgb({r}, {g}, {b})";
                }
                return "#888888"; // Safe fallback
            });

            // Simplify complex font-family declarations
            processed = ComplexFontFamilyPattern.Replace(processed, "font-family: sans-serif");

            return processed;
        }

        /// <summary>
        /// Normalize quotes to prevent Blazor parsing issues
        /// This addresses the core quote escaping problems
        /// </summary>
        private string NormalizeQuotes(string html)
        {
            // Strategy: Use consistent single quotes for style attributes
            var normalized = html;

            // Find style attributes and normalize their quotes
            normalized = Regex.Replace(normalized, 
                @"style\s*=\s*""([^""]*)""\s*", 
                match =>
                {
                    var styleContent = match.Groups[1].Value;
                    // Replace any internal double quotes with single quotes
                    var cleanStyle = styleContent.Replace("\"", "'");
                    return $"style=\"{cleanStyle}\"";
                },
                RegexOptions.IgnoreCase);

            return normalized;
        }

        /// <summary>
        /// Final validation of processed HTML
        /// </summary>
        private ValidationResult ValidateFinalHtml(string html)
        {
            try
            {
                // Basic structure validation
                if (string.IsNullOrWhiteSpace(html))
                {
                    return ValidationResult.Invalid("HTML is empty after processing");
                }

                // Check for basic HTML structure
                if (!html.Trim().StartsWith("<") || !html.Trim().EndsWith(">"))
                {
                    return ValidationResult.Invalid("HTML does not have proper structure");
                }

                return ValidationResult.Valid();
            }
            catch (Exception ex)
            {
                return ValidationResult.Invalid($"Final validation failed: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Parsing modes for different use cases
    /// </summary>
    public enum ParseMode
    {
        /// <summary>Safe mode - apply all compatibility fixes</summary>
        Safe,
        /// <summary>Strict mode - fail if compatibility issues found</summary>
        Strict,
        /// <summary>Permissive mode - allow most content through</summary>
        Permissive
    }

    /// <summary>
    /// Result of HTML parsing operation
    /// </summary>
    public class SafeHtmlResult
    {
        public bool IsValid { get; init; }
        public string? Content { get; init; }
        public string? ErrorMessage { get; init; }
        public List<string> Warnings { get; init; } = new();

        public static SafeHtmlResult Success(string content, List<string>? warnings = null)
        {
            return new SafeHtmlResult
            {
                IsValid = true,
                Content = content,
                Warnings = warnings ?? new List<string>()
            };
        }

        public static SafeHtmlResult Error(string errorMessage)
        {
            return new SafeHtmlResult
            {
                IsValid = false,
                ErrorMessage = errorMessage
            };
        }

        public static SafeHtmlResult Empty()
        {
            return new SafeHtmlResult
            {
                IsValid = true,
                Content = string.Empty
            };
        }
    }

    /// <summary>
    /// Validation result helper
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; init; }
        public string? ErrorMessage { get; init; }
        public List<string> Warnings { get; init; } = new();

        public static ValidationResult Valid(List<string>? warnings = null)
        {
            return new ValidationResult
            {
                IsValid = true,
                Warnings = warnings ?? new List<string>()
            };
        }

        public static ValidationResult Invalid(string errorMessage)
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorMessage = errorMessage
            };
        }
    }
}