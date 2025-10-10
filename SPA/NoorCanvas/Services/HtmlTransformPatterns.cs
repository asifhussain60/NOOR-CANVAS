using System.Text.RegularExpressions;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Centralized HTML transformation regex patterns used across multiple services.
    /// Single source of truth for HTML transformation logic to prevent pattern drift.
    /// </summary>
    public static class HtmlTransformPatterns
    {
        /// <summary>
        /// Pattern to match delete buttons (matching AssetProcessingService.cs RemoveDeleteButtons() logic).
        /// Matches buttons with "delete" in id or class attributes.
        /// </summary>
        public static readonly Regex DeleteButtonPattern = new(
            @"<button[^>]*(?:id[^=]*=[^""\s]*""[^""]*delete[^""]*""|class[^=]*=[^""\s]*""[^""]*delete[^""]*"")[^>]*>.*?</button>",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to match "Plain Text" buttons (poetry-restore-btn, froala-only-btn classes).
        /// </summary>
        public static readonly Regex PlainTextButtonPattern = new(
            @"<button[^>]*class[^=]*=[^""]*""[^""]*(?:poetry-restore-btn|froala-only-btn)[^""]*""[^>]*>.*?</button>",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to remove hadees subject tokens from span tags (production HTML format).
        /// Matches: &lt;span ...&gt;- Topics, Subtopics&lt;/span&gt;.
        /// </summary>
        public static readonly Regex HadeesTokenSpanPattern = new(
            @"<span[^>]*>(\s*-\s*[^<]+?)</span>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to remove hadees subject tokens from plain text (legacy HTML format).
        /// Matches: &lt;h4&gt;...&lt;i&gt;&lt;/i&gt;Narrator - Topics&lt;/h4&gt;
        /// Preserves everything except the " - Topics" suffix.
        /// </summary>
        public static readonly Regex HadeesTokenPlainPattern = new(
            @"(<h4[^>]*>[^<]*<i[^>]*></i>\s*)([^<]+?)(\s-\s[A-Za-z,\s]+)(</h4>)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to detect and match inline styles in imgResponsive images for removal.
        /// </summary>
        public static readonly Regex ImgResponsiveStylePattern = new(
            @"<img([^>]*imgResponsive[^>]*)>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to remove width and height from style attributes.
        /// </summary>
        public static readonly Regex StyleWidthHeightPattern = new(
            @"\s*(width|height)\s*:\s*[^;]+;?",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .example elements.
        /// </summary>
        public static readonly Regex ExampleAttributePattern = new(
            @"<div([^>]*class[^=]*=[^""]*""[^""]*example[^""]*""[^>]*)(?!.*data-islamic-content)>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .quote elements.
        /// </summary>
        public static readonly Regex QuoteAttributePattern = new(
            @"<(p|div)([^>]*class[^=]*=[^""]*""[^""]*quote[^""]*""[^>]*)(?!.*data-islamic-content)>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .imgResponsive elements.
        /// </summary>
        public static readonly Regex ImgResponsiveAttributePattern = new(
            @"<img([^>]*class[^=]*=[^""]*""[^""]*imgResponsive[^""]*""[^>]*)(?!.*data-islamic-content)>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern for complex CSS gradients that may cause Blazor parsing issues.
        /// </summary>
        public static readonly Regex ComplexGradientPattern = new(
            @"linear-gradient\([^)]*\)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern for RGBA color values that may cause Blazor parsing issues.
        /// </summary>
        public static readonly Regex RgbaPattern = new(
            @"rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern for complex font-family declarations that may cause Blazor parsing issues.
        /// </summary>
        public static readonly Regex ComplexFontFamilyPattern = new(
            @"font-family:\s*[""'][^""']*[""']\s*,\s*[""'][^""']*[""']",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Pattern for nested quotes in style attributes that may cause parsing failures.
        /// </summary>
        public static readonly Regex NestedQuotePattern = new(
            @"style\s*=\s*[""'][^""']*[""'][^""']*[""'][^""']*[""']",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
    }
}
