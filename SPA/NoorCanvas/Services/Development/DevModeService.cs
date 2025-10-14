using Microsoft.AspNetCore.Hosting;

namespace NoorCanvas.Services.Development
{
    /// <summary>
    /// Service to determine if development features should be enabled
    /// Provides compile-time and runtime checks for development-only functionality.
    /// </summary>
    public interface IDevModeService
    {
        /// <summary>
        /// Gets a value indicating whether indicates if the application is running in development mode.
        /// </summary>
        bool IsDevelopmentMode { get; }

        /// <summary>
        /// Gets a value indicating whether indicates if development panels should be visible.
        /// </summary>
        bool ShowDevPanels { get; }

        /// <summary>
        /// Gets a value indicating whether indicates if debug features should be available.
        /// </summary>
        bool EnableDebugFeatures { get; }
    }

    /// <summary>
    /// Implementation of development mode service
    /// Uses both compile-time and runtime checks for maximum security.
    /// </summary>
    public class DevModeService : IDevModeService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public DevModeService(IWebHostEnvironment environment, IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
        }

        /// <inheritdoc/>
        public bool IsDevelopmentMode =>
#if DEBUG
            // [DEBUG-WORKITEM:debug-panel:devmode:TRACE] Force enable in DEBUG builds for development ;CLEANUP_OK
            // During development (DEBUG build), always return true
            // This ensures debug panels work even if ASPNETCORE_ENVIRONMENT isn't set
            // Production deployment (ncdeploy.ps1) uses Release build, so this will be false
            true;
#else
            // [DEBUG-WORKITEM:debug-panel:devmode:TRACE] Production mode (RELEASE build) ;CLEANUP_OK
            // In Release builds, only enable if explicitly running in Development environment
            // This provides an override for testing Release builds locally
            _environment.IsDevelopment();
#endif

        /// <inheritdoc/>
        public bool ShowDevPanels =>
            IsDevelopmentMode &&
            _configuration.GetValue<bool>("Development:ShowDevPanels", true);

        /// <inheritdoc/>
        public bool EnableDebugFeatures =>
            IsDevelopmentMode &&
            _configuration.GetValue<bool>("Development:EnableDebugFeatures", true);
    }
}
