using System.Text.RegularExpressions;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Centralized HTML transformation regex patterns used across multiple services.
    /// Single source of truth for HTML transformation logic to prevent pattern drift.
    /// </summary>
    public static partial class HtmlTransformPatterns
    {
        /// <summary>
        /// Pattern to match delete buttons (matching AssetProcessingService.cs RemoveDeleteButtons() logic).
        /// Matches buttons with "delete" in id or class attributes.
        /// </summary>
        [GeneratedRegex(@"<button[^>]*(?:id[^=]*=[^""\s]*""[^""]*delete[^""]*""|class[^=]*=[^""\s]*""[^""]*delete[^""]*"")[^>]*>.*?</button>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
        public static partial Regex DeleteButtonPattern();

        /// <summary>
        /// Pattern to match "Plain Text" buttons (poetry-restore-btn, froala-only-btn classes).
        /// </summary>
        [GeneratedRegex(@"<button[^>]*class[^=]*=[^""]*""[^""]*(?:poetry-restore-btn|froala-only-btn)[^""]*""[^>]*>.*?</button>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
        public static partial Regex PlainTextButtonPattern();

        /// <summary>
        /// Pattern to remove hadees subject tokens from span tags (production HTML format).
        /// Matches: &lt;span ...&gt;- Topics, Subtopics&lt;/span&gt;.
        /// </summary>
        [GeneratedRegex(@"<span[^>]*>(\s*-\s*[^<]+?)</span>", RegexOptions.IgnoreCase)]
        public static partial Regex HadeesTokenSpanPattern();

        /// <summary>
        /// Pattern to remove hadees subject tokens from plain text (legacy HTML format).
        /// Matches: &lt;h4&gt;...&lt;i&gt;&lt;/i&gt;Narrator - Topics&lt;/h4&gt;
        /// Preserves everything except the " - Topics" suffix.
        /// </summary>
        [GeneratedRegex(@"(<h4[^>]*>[^<]*<i[^>]*></i>\s*)([^<]+?)(\s-\s[A-Za-z,\s]+)(</h4>)", RegexOptions.IgnoreCase)]
        public static partial Regex HadeesTokenPlainPattern();

        /// <summary>
        /// Pattern to detect and match inline styles in imgResponsive images for removal.
        /// </summary>
        [GeneratedRegex(@"<img([^>]*imgResponsive[^>]*)>", RegexOptions.IgnoreCase)]
        public static partial Regex ImgResponsiveStylePattern();

        /// <summary>
        /// Pattern to remove width and height from style attributes.
        /// </summary>
        [GeneratedRegex(@"\s*(width|height)\s*:\s*[^;]+;?", RegexOptions.IgnoreCase)]
        public static partial Regex StyleWidthHeightPattern();

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .example elements.
        /// </summary>
        [GeneratedRegex(@"<div([^>]*class[^=]*=[^""]*""[^""]*example[^""]*""[^>]*)(?!.*data-islamic-content)>", RegexOptions.IgnoreCase)]
        public static partial Regex ExampleAttributePattern();

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .quote elements.
        /// </summary>
        [GeneratedRegex(@"<(p|div)([^>]*class[^=]*=[^""]*""[^""]*quote[^""]*""[^>]*)(?!.*data-islamic-content)>", RegexOptions.IgnoreCase)]
        public static partial Regex QuoteAttributePattern();

        /// <summary>
        /// Pattern to add data-islamic-content attribute to .imgResponsive elements.
        /// </summary>
        [GeneratedRegex(@"<img([^>]*class[^=]*=[^""]*""[^""]*imgResponsive[^""]*""[^>]*)(?!.*data-islamic-content)>", RegexOptions.IgnoreCase)]
        public static partial Regex ImgResponsiveAttributePattern();

        /// <summary>
        /// Pattern for complex CSS gradients that may cause Blazor parsing issues.
        /// </summary>
        [GeneratedRegex(@"linear-gradient\([^)]*\)", RegexOptions.IgnoreCase)]
        public static partial Regex ComplexGradientPattern();

        /// <summary>
        /// Pattern for RGBA color values that may cause Blazor parsing issues.
        /// </summary>
        [GeneratedRegex(@"rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)", RegexOptions.IgnoreCase)]
        public static partial Regex RgbaPattern();

        /// <summary>
        /// Pattern for complex font-family declarations that may cause Blazor parsing issues.
        /// </summary>
        [GeneratedRegex(@"font-family:\s*[""'][^""']*[""']\s*,\s*[""'][^""']*[""']", RegexOptions.IgnoreCase)]
        public static partial Regex ComplexFontFamilyPattern();

        /// <summary>
        /// Pattern for nested quotes in style attributes that may cause parsing failures.
        /// </summary>
        [GeneratedRegex(@"style\s*=\s*[""'][^""']*[""'][^""']*[""'][^""']*[""']", RegexOptions.IgnoreCase)]
        public static partial Regex NestedQuotePattern();
    }
}
