using Microsoft.AspNetCore.Components;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Extended Loading Service with configuration options.
    /// </summary>
    public class ConfigurableLoadingService : LoadingService
    {
        private SpinnerTheme _theme = SpinnerTheme.Default;
        private SpinnerSize _size = SpinnerSize.Medium;
        private bool _showLogo = true;

        public enum SpinnerTheme
        {
            Default,
            Green,
            Blue,
            Dark,
            Minimal
        }

        public enum SpinnerSize
        {
            Small,
            Medium,
            Large
        }

        /// <summary>
        /// Gets the current spinner theme.
        /// </summary>
        public SpinnerTheme Theme => _theme;

        /// <summary>
        /// Gets the current spinner size.
        /// </summary>
        public SpinnerSize Size => _size;

        /// <summary>
        /// Gets a value indicating whether gets whether logo is shown.
        /// </summary>
        public bool ShowLogo => _showLogo;

        /// <summary>
        /// Configure the spinner appearance.
        /// </summary>
        /// <param name="theme">Visual theme.</param>
        /// <param name="size">Size variant.</param>
        /// <param name="showLogo">Whether to show NOOR Canvas logo.</param>
        public void Configure(SpinnerTheme theme = SpinnerTheme.Default, SpinnerSize size = SpinnerSize.Medium, bool showLogo = true)
        {
            _theme = theme;
            _size = size;
            _showLogo = showLogo;
            // Trigger state change to update UI if currently loading
            if (IsLoading)
            {
                NotifyStateChanged();
            }
        }

        /// <summary>
        /// Get CSS class for current configuration.
        /// </summary>
        /// <returns></returns>
        public string GetCssClass()
        {
            var classes = new List<string> { "noor-loading-overlay" };

            switch (_theme)
            {
                case SpinnerTheme.Green:
                    classes.Add("brand-green");
                    break;
                case SpinnerTheme.Blue:
                    classes.Add("brand-blue");
                    break;
                case SpinnerTheme.Dark:
                    classes.Add("dark-theme");
                    break;
                case SpinnerTheme.Minimal:
                    classes.Add("minimal-theme");
                    break;
            }

            switch (_size)
            {
                case SpinnerSize.Small:
                    classes.Add("size-small");
                    break;
                case SpinnerSize.Large:
                    classes.Add("size-large");
                    break;
            }

            return string.Join(" ", classes);
        }

        /// <summary>
        /// Show loading with specific configuration.
        /// </summary>
        /// <param name="message">Loading message.</param>
        /// <param name="subMessage">Sub message.</param>
        /// <param name="theme">Temporary theme override.</param>
        /// <param name="showLogo">Temporary logo override.</param>
        public void ShowWithConfig(string message = "Loading...", string subMessage = "Please wait",
            SpinnerTheme? theme = null, bool? showLogo = null)
        {
            if (theme.HasValue) _theme = theme.Value;
            if (showLogo.HasValue) _showLogo = showLogo.Value;

            Show(message, subMessage);
        }
    }
}