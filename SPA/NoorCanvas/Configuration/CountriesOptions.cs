namespace NoorCanvas.Configuration
{
    /// <summary>
    /// Configuration options for countries dropdown behavior
    /// </summary>
    public class CountriesOptions
    {
        public const string SectionName = "Countries";
        
        /// <summary>
        /// When true, only returns countries where IsShortListed = 1
        /// When false, returns all active countries
        /// Default: true
        /// </summary>
        public bool UseShortlistedCountries { get; set; } = true;
    }
}