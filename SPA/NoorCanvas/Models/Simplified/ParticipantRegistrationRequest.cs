using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Models.Simplified;

public class ParticipantRegistrationRequest
{
    [Required]
    [StringLength(8, MinimumLength = 8)]
    public string Token { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Country { get; set; } = string.Empty;
}