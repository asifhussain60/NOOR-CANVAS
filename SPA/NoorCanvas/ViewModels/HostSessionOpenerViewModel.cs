using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.ViewModels
{
    /// <summary>
    /// ViewModel for the Host Session Opener component
    /// Manages state for session creation and form validation
    /// </summary>
    public class HostSessionOpenerViewModel
    {
        // UI Display Properties
        public string? LogoText { get; set; } = "NOOR Canvas";
        
        // Authentication
        public string? HostFriendlyToken { get; set; }
        
        // Form Fields
        [Required(ErrorMessage = "Album is required")]
        public string? SelectedAlbum { get; set; }
        
        [Required(ErrorMessage = "Category is required")]
        public string? SelectedCategory { get; set; }
        
        [Required(ErrorMessage = "Session is required")]
        public string? SelectedSession { get; set; }
        
        [Required(ErrorMessage = "Session date is required")]
        public DateTime SessionDate { get; set; } = DateTime.Today;
        
        [Required(ErrorMessage = "Session time is required")]
        public string SessionTime { get; set; } = "6:00 AM";
        
        [Required(ErrorMessage = "Duration is required")]
        [Range(1, 480, ErrorMessage = "Duration must be between 1 and 480 minutes")]
        public int? SessionDuration { get; set; } = 60;
        
        // Form State
        public string ErrorMessage { get; set; } = "";
        public bool IsFormValid { get; set; }
        public bool HasAttemptedSubmit { get; set; } = false;
        
        // Loading States
        public bool IsLoadingAlbums { get; set; }
        public bool IsLoadingCategories { get; set; }
        public bool IsLoadingSessions { get; set; }
        public bool IsProcessingSession { get; set; }
        
        // Session Management
        public bool HasGeneratedToken { get; set; } = false;
        public bool ShowSessionUrlPanel { get; set; } = false;
        public string SessionUrl { get; set; } = string.Empty;
        public string UserLandingUrl { get; set; } = string.Empty;
        
        // UI Interaction State
        public bool UserCopied { get; set; } = false;
        
        /// <summary>
        /// Validates all required form fields
        /// </summary>
        /// <returns>True if all required fields are filled and valid</returns>
        public bool ValidateRequiredFields()
        {
            return !string.IsNullOrEmpty(SelectedAlbum) &&
                   !string.IsNullOrEmpty(SelectedCategory) &&
                   !string.IsNullOrEmpty(SelectedSession) &&
                   SessionDate != default &&
                   !string.IsNullOrEmpty(SessionTime) &&
                   SessionDuration.HasValue &&
                   SessionDuration.Value > 0;
        }
        
        /// <summary>
        /// Resets form state when user changes form values
        /// </summary>
        public void ResetFormState()
        {
            HasGeneratedToken = false;
            if (!IsProcessingSession)
            {
                HasAttemptedSubmit = false;
            }
            ShowSessionUrlPanel = false;
            SessionUrl = "";
            UserLandingUrl = "";
            UserCopied = false;
        }
        
        /// <summary>
        /// Resets all loading states
        /// </summary>
        public void ResetLoadingStates()
        {
            IsLoadingAlbums = false;
            IsLoadingCategories = false;
            IsLoadingSessions = false;
        }
        
        /// <summary>
        /// Checks if any loading operation is in progress
        /// </summary>
        /// <returns>True if any loading state is active</returns>
        public bool IsAnyLoadingActive()
        {
            return IsLoadingAlbums || IsLoadingCategories || IsLoadingSessions || IsProcessingSession;
        }
    }
}