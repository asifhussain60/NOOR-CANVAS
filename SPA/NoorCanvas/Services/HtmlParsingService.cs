using System.Text.RegularExpressions;
using System.Web;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Advanced HTML parsing service to replace/enhance Blazor's DOM parser limitations
    /// Provides robust HTML validation, sanitization, and safe rendering for broadcast content.
    /// Uses centralized HtmlTransformPatterns for consistent transformation behavior.
    /// </summary>
    public partial class HtmlParsingService
    {
        private readonly ILogger<HtmlParsingService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="HtmlParsingService"/> class.
        /// </summary>
        /// <param name="logger">Logger instance for diagnostic logging.</param>
        public HtmlParsingService(ILogger<HtmlParsingService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Parse and validate HTML content with advanced error recovery.
        /// This replaces the basic Blazor MarkupString approach with robust parsing.
        /// </summary>
        /// <param name="htmlContent">The HTML content to parse and validate.</param>
        /// <param name="mode">The parsing mode to use (Safe, Strict, or Permissive).</param>
        /// <returns>A SafeHtmlResult containing the parsed HTML or error information.</returns>
        public SafeHtmlResult ParseHtml(string? htmlContent, ParseMode mode = ParseMode.Safe)
        {
            if (string.IsNullOrEmpty(htmlContent))
                return SafeHtmlResult.Empty();

            try
            {
                _logger.LogInformation("Starting HTML parsing, mode: {Mode}, length: {Length}",
                    mode, htmlContent.Length);

                // Phase 1: Security validation
                var securityResult = ValidateSecurity(htmlContent);
                if (!securityResult.IsValid)
                {
                    return SafeHtmlResult.Error(securityResult.ErrorMessage ?? "Security validation failed");
                }

                // Phase 2: Blazor compatibility analysis
                var compatibilityResult = AnalyzeBlazorCompatibility(htmlContent);
                if (!compatibilityResult.IsValid && mode == ParseMode.Strict)
                {
                    return SafeHtmlResult.Error(compatibilityResult.ErrorMessage ?? "Blazor compatibility validation failed");
                }

                // Phase 3: CSS processing and simplification
                var processedHtml = ProcessCssForBlazorCompatibility(htmlContent);

                // Phase 3.5: Transform HTML - remove unwanted elements and add Islamic content attributes
                var transformedHtml = TransformHtml(processedHtml);

                // Phase 4: Quote normalization
                var normalizedHtml = NormalizeQuotes(transformedHtml);

                // Phase 5: Final validation
                var finalValidation = ValidateFinalHtml(normalizedHtml);
                if (!finalValidation.IsValid)
                {
                    return SafeHtmlResult.Error(finalValidation.ErrorMessage ?? "Final HTML validation failed");
                }

                _logger.LogInformation("[DEBUG-WORKITEM:signalcomm:PARSER] HTML parsing successful, output length: {Length} ;CLEANUP_OK",
                    normalizedHtml.Length);

                return SafeHtmlResult.Success(normalizedHtml, compatibilityResult.Warnings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HTML parsing failed");
                return SafeHtmlResult.Error($"Parser error: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate HTML for security issues (XSS prevention).
        /// </summary>
        private static ValidationResult ValidateSecurity(string html)
        {
            // [DEBUG-MARKER:hcp-canvas:security-validation] Fixed regex to match event handlers specifically ;CLEANUP_OK
            var dangerousPatterns = new[]
            {
                @"<script[^>]*>.*?</script>",
                @"javascript:",
                @"vbscript:",
                @"\s+on\w+\s*=",  // Fixed: Must have leading whitespace to match event attributes like ' onclick='
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
        /// Analyze HTML for Blazor DOM parser compatibility issues.
        /// </summary>
        private static ValidationResult AnalyzeBlazorCompatibility(string html)
        {
            var warnings = new List<string>();
            var errors = new List<string>();

            // Check for complex gradients
            if (HtmlTransformPatterns.ComplexGradientPattern().IsMatch(html))
            {
                warnings.Add("Complex CSS gradients detected - may cause parsing issues");
            }

            // Check for RGBA with decimals
            if (HtmlTransformPatterns.RgbaPattern().IsMatch(html))
            {
                warnings.Add("RGBA colors detected - may cause parsing issues");
            }

            // Check for complex font-family declarations
            if (HtmlTransformPatterns.ComplexFontFamilyPattern().IsMatch(html))
            {
                warnings.Add("Complex font-family declarations detected");
            }

            // Check for nested quotes in style attributes
            if (HtmlTransformPatterns.NestedQuotePattern().IsMatch(html))
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
        /// This is the core replacement logic for problematic CSS patterns.
        /// Uses centralized patterns from HtmlTransformPatterns.
        /// </summary>
        private string ProcessCssForBlazorCompatibility(string html)
        {
            var processed = html;

            // Replace complex gradients with simple backgrounds
            processed = HtmlTransformPatterns.ComplexGradientPattern().Replace(processed, match =>
            {
                _logger.LogDebug("[DEBUG-WORKITEM:signalcomm:PARSER] Replacing complex gradient: {Gradient} ;CLEANUP_OK", match.Value);
                return "background-color: #f0f0f0"; // Safe fallback
            });

            // Replace RGBA with solid colors
            processed = HtmlTransformPatterns.RgbaPattern().Replace(processed, match =>
            {
                _logger.LogDebug("[DEBUG-WORKITEM:signalcomm:PARSER] Replacing RGBA color: {Color} ;CLEANUP_OK", match.Value);
                // Extract RGB values and use solid color
                var rgbaMatch = RgbaExtractionPattern().Match(match.Value);
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
            processed = HtmlTransformPatterns.ComplexFontFamilyPattern().Replace(processed, "font-family: sans-serif");

            return processed;
        }

        /// <summary>
        /// Transform HTML to remove unwanted elements and add Islamic content attributes.
        /// Uses centralized patterns from HtmlTransformPatterns for consistency across services.
        /// This replicates the transformHtml function from session-transcript-styling.html.
        /// </summary>
        private string TransformHtml(string html)
        {
            if (string.IsNullOrEmpty(html))
            {
                _logger.LogWarning("TransformHtml: Empty HTML provided");
                return string.Empty;
            }

            var startTime = DateTime.Now;

            // Apply transformations in sequence using centralized patterns
            var cleaned = HtmlTransformPatterns.DeleteButtonPattern().Replace(html, string.Empty);
            var afterDeleteButtons = cleaned.Length;

            cleaned = HtmlTransformPatterns.PlainTextButtonPattern().Replace(cleaned, string.Empty);
            var afterPlainTextButtons = cleaned.Length;

            // Remove inline width and height styles from images (imgResponsive class)
            var imageStylesRemoved = 0;
            cleaned = HtmlTransformPatterns.ImgResponsiveStylePattern().Replace(cleaned, match =>
            {
                // Check if this image has a style attribute
                if (!match.Value.Contains("style="))
                {
                    return match.Value; // No style attribute, return as-is
                }

                imageStylesRemoved++;

                // Remove width and height properties from style attribute
                var result = StyleAttributePattern().Replace(match.Value, styleMatch =>
                {
                    var styleContent = styleMatch.Groups[1].Value;

                    // Remove width and height declarations using centralized pattern
                    var cleanedStyle = HtmlTransformPatterns.StyleWidthHeightPattern().Replace(styleContent, string.Empty);

                    // Clean up extra semicolons and whitespace
                    cleanedStyle = MultipleSemicolonPattern().Replace(cleanedStyle, ";");
                    cleanedStyle = cleanedStyle.Trim().TrimEnd(';');

                    return string.IsNullOrWhiteSpace(cleanedStyle) ? string.Empty : $"style=\"{cleanedStyle}\"";
                });

                // Remove empty style attributes
                result = EmptyStylePattern().Replace(result, string.Empty);

                return result;
            });

            var afterImageStyles = cleaned.Length;

            // Add data-islamic-content attribute to .example elements (if not already present)
            var exampleCount = 0;
            cleaned = HtmlTransformPatterns.ExampleAttributePattern().Replace(cleaned, match =>
            {
                var attrs = match.Groups[1].Value;
                exampleCount++;
                return $"<div{attrs} data-islamic-content>";
            });

            // Add data-islamic-content attribute to .quote elements (if not already present)
            var quoteCount = 0;
            cleaned = HtmlTransformPatterns.QuoteAttributePattern().Replace(cleaned, match =>
            {
                var tag = match.Groups[1].Value;
                var attrs = match.Groups[2].Value;
                quoteCount++;
                return $"<{tag}{attrs} data-islamic-content>";
            });

            // Add data-islamic-content attribute to .imgResponsive elements (if not already present)
            var imgCount = 0;
            cleaned = HtmlTransformPatterns.ImgResponsiveAttributePattern().Replace(cleaned, match =>
            {
                var attrs = match.Groups[1].Value;
                imgCount++;
                return $"<img{attrs} data-islamic-content>";
            });

            // Remove subject tokens from hadees headers (e.g., " - Accountability, Deeds")
            // PATTERN 1: Remove <span> tags containing tokens (production HTML format)
            // Uses centralized HadeesTokenSpanPattern
            var hadeesTokensRemoved = 0;
            cleaned = HtmlTransformPatterns.HadeesTokenSpanPattern().Replace(cleaned, match =>
            {
                // Only count if it's actually a token pattern (starts with " - ")
                if (match.Groups[1].Value.TrimStart().StartsWith("-"))
                {
                    hadeesTokensRemoved++;
                }
                return string.Empty; // Remove the entire span
            });
            
            // PATTERN 2: Remove plain text tokens (legacy HTML format for backwards compatibility)
            // Uses centralized HadeesTokenPlainPattern
            cleaned = HtmlTransformPatterns.HadeesTokenPlainPattern().Replace(cleaned, match =>
            {
                hadeesTokensRemoved++;
                // Keep everything except the " - Topics" part (group 3)
                return $"{match.Groups[1].Value}{match.Groups[2].Value}{match.Groups[4].Value}";
            });

            // Calculate metrics
            var originalLength = html.Length;
            var cleanedLength = cleaned.Length;
            var totalRemovedBytes = originalLength - cleanedLength;
            var deleteBytesRemoved = originalLength - afterDeleteButtons;
            var plainTextBytesRemoved = afterDeleteButtons - afterPlainTextButtons;
            var imageStyleBytesRemoved = afterPlainTextButtons - afterImageStyles;
            var duration = (DateTime.Now - startTime).TotalMilliseconds;

            // Log transformation results
            _logger.LogInformation(
                "[DEBUG-WORKITEM:canvas:transform] HTML transformation completed: " +
                "originalBytes={OriginalBytes}, cleanedBytes={CleanedBytes}, " +
                "totalRemovedBytes={TotalRemovedBytes}, deleteButtonBytesRemoved={DeleteBytesRemoved}, " +
                "plainTextButtonBytesRemoved={PlainTextBytesRemoved}, imageStyleBytesRemoved={ImageStyleBytesRemoved}, " +
                "imageStylesRemoved={ImageStylesRemoved}, exampleElementsMarked={ExampleCount}, " +
                "quoteElementsMarked={QuoteCount}, imgElementsMarked={ImgCount}, " +
                "hadeesTokensRemoved={HadeesTokensRemoved}, durationMs={Duration} ;CLEANUP_OK",
                originalLength, cleanedLength, totalRemovedBytes, deleteBytesRemoved,
                plainTextBytesRemoved, imageStyleBytesRemoved, imageStylesRemoved,
                exampleCount, quoteCount, imgCount, hadeesTokensRemoved, duration);

            return cleaned;
        }

        /// <summary>
        /// Normalize quotes to prevent Blazor parsing issues
        /// This addresses the core quote escaping problems.
        /// </summary>
        private static string NormalizeQuotes(string html)
        {
            // Strategy: Use consistent single quotes for style attributes
            var normalized = html;

            // Find style attributes and normalize their quotes
            normalized = StyleNormalizationPattern().Replace(normalized,
                match =>
                {
                    var styleContent = match.Groups[1].Value;
                    // Replace any internal double quotes with single quotes
                    var cleanStyle = styleContent.Replace("\"", "'");
                    return $"style=\"{cleanStyle}\"";
                });

            return normalized;
        }

        /// <summary>
        /// Final validation of processed HTML.
        /// </summary>
        private static ValidationResult ValidateFinalHtml(string html)
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

        // Generated Regex patterns for HtmlParsingService
        [GeneratedRegex(@"rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)", RegexOptions.IgnoreCase)]
        private static partial Regex RgbaExtractionPattern();

        [GeneratedRegex(@"style\s*=\s*""([^""]*)""", RegexOptions.IgnoreCase)]
        private static partial Regex StyleAttributePattern();

        [GeneratedRegex(@";+")]
        private static partial Regex MultipleSemicolonPattern();

        [GeneratedRegex(@"\s*style\s*=\s*""""")]
        private static partial Regex EmptyStylePattern();

        [GeneratedRegex(@"style\s*=\s*""([^""]*)""\s*", RegexOptions.IgnoreCase)]
        private static partial Regex StyleNormalizationPattern();
    }

    /// <summary>
    /// Parsing modes for different use cases.
    /// </summary>
    public enum ParseMode
    {
        /// <summary>Safe mode - apply all compatibility fixes.</summary>
        Safe,

        /// <summary>Strict mode - fail if compatibility issues found.</summary>
        Strict,

        /// <summary>Permissive mode - allow most content through.</summary>
        Permissive
    }

    /// <summary>
    /// Result of HTML parsing operation.
    /// </summary>
    public class SafeHtmlResult
    {
        /// <summary>
        /// Gets a value indicating whether the parsing was successful.
        /// </summary>
        public bool IsValid { get; init; }

        /// <summary>
        /// Gets the parsed HTML content (null if parsing failed).
        /// </summary>
        public string? Content { get; init; }

        /// <summary>
        /// Gets the error message if parsing failed.
        /// </summary>
        public string? ErrorMessage { get; init; }

        /// <summary>
        /// Gets list of warnings encountered during parsing.
        /// </summary>
        public List<string> Warnings { get; init; } = new();

        /// <summary>
        /// Creates a successful parsing result.
        /// </summary>
        /// <param name="content">The parsed HTML content.</param>
        /// <param name="warnings">Optional list of warnings encountered.</param>
        /// <returns>A successful SafeHtmlResult instance.</returns>
        public static SafeHtmlResult Success(string content, List<string>? warnings = null)
        {
            return new SafeHtmlResult
            {
                IsValid = true,
                Content = content,
                Warnings = warnings ?? new List<string>()
            };
        }

        /// <summary>
        /// Creates a failed parsing result with an error message.
        /// </summary>
        /// <param name="errorMessage">The error message describing the failure.</param>
        /// <returns>A failed SafeHtmlResult instance.</returns>
        public static SafeHtmlResult Error(string errorMessage)
        {
            return new SafeHtmlResult
            {
                IsValid = false,
                ErrorMessage = errorMessage
            };
        }

        /// <summary>
        /// Creates an empty but valid parsing result.
        /// </summary>
        /// <returns>An empty SafeHtmlResult instance.</returns>
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
    /// Validation result helper.
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// Gets a value indicating whether the validation passed.
        /// </summary>
        public bool IsValid { get; init; }

        /// <summary>
        /// Gets the error message if validation failed.
        /// </summary>
        public string? ErrorMessage { get; init; }

        /// <summary>
        /// Gets list of warnings encountered during validation.
        /// </summary>
        public List<string> Warnings { get; init; } = new();

        /// <summary>
        /// Creates a valid ValidationResult.
        /// </summary>
        /// <param name="warnings">Optional list of warnings encountered.</param>
        /// <returns>A valid ValidationResult instance.</returns>
        public static ValidationResult Valid(List<string>? warnings = null)
        {
            return new ValidationResult
            {
                IsValid = true,
                Warnings = warnings ?? new List<string>()
            };
        }

        /// <summary>
        /// Creates an invalid ValidationResult with an error message.
        /// </summary>
        /// <param name="errorMessage">The error message describing the validation failure.</param>
        /// <returns>An invalid ValidationResult instance.</returns>
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
