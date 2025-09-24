using Microsoft.AspNetCore.Hosting;

namespace NoorCanvas.Services.Development
{
    /// <summary>
    /// Service to determine if development features should be enabled
    /// Provides compile-time and runtime checks for development-only functionality
    /// </summary>
    public interface IDevModeService
    {
        /// <summary>
        /// Indicates if the application is running in development mode
        /// </summary>
        bool IsDevelopmentMode { get; }
        
        /// <summary>
        /// Indicates if development panels should be visible
        /// </summary>
        bool ShowDevPanels { get; }
        
        /// <summary>
        /// Indicates if debug features should be available
        /// </summary>
        bool EnableDebugFeatures { get; }
    }
    
    /// <summary>
    /// Implementation of development mode service
    /// Uses both compile-time and runtime checks for maximum security
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
        
        public bool IsDevelopmentMode => 
#if DEBUG
            _environment.IsDevelopment();
#else
            false;
#endif
        
        public bool ShowDevPanels => 
            IsDevelopmentMode && 
            _configuration.GetValue<bool>("Development:ShowDevPanels", true);
        
        public bool EnableDebugFeatures => 
            IsDevelopmentMode && 
            _configuration.GetValue<bool>("Development:EnableDebugFeatures", true);
    }
}