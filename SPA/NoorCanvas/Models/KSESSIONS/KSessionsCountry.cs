using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Models.KSESSIONS
{
    /// <summary>
    /// Country reference data from KSESSIONS database
    /// Used for registration form country selection
    /// </summary>
    public class KSessionsCountry
    {
        [Key]
        public int CountryId { get; set; }

        [Required]
        [StringLength(100)]
        public string CountryName { get; set; } = string.Empty;

        [StringLength(2)]
        public string? ISO2 { get; set; }

        [StringLength(3)]
        public string? ISO3 { get; set; }

        public bool IsActive { get; set; } = true;
        
        public bool IsShortListed { get; set; } = false;
    }
}