namespace NoorCanvas.Models.DTOs;

/// <summary>
/// DTO for country flag mappings from KSESSIONS database
/// Maps ISO2 codes to lowercase flag codes for frontend display.
/// </summary>
public class CountryFlagDto
{
    public string ISO2 { get; set; } = string.Empty;
    public string FlagCode { get; set; } = string.Empty;
    public string? CountryName { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Response wrapper for country flags API.
/// </summary>
public class CountryFlagsResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public Dictionary<string, string> CountryFlags { get; set; } = new();
    public List<CountryFlagDto>? Countries { get; set; }
    public int TotalCount { get; set; } = 0;
}