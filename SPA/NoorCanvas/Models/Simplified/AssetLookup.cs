using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

/// <summary>
/// AssetLookup table for simple global asset definitions.
/// Replaces the complex SessionAssetsLookup with a simple lookup approach.
/// Contains the exact 8 asset types from the current detection system.
/// </summary>
[Table("AssetLookup", Schema = "canvas")]
public class AssetLookup
{
    /// <summary>
    /// Gets or sets primary key - unique asset identifier.
    /// </summary>
    [Key]
    public long AssetId { get; set; }

    /// <summary>
    /// Gets or sets asset identifier matching the exact class names from detection system
    /// (e.g., 'ayah-card', 'inserted-hadees', 'etymology-card', etc.)
    /// </summary>
    [Required, MaxLength(100)]
    public string AssetIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets asset category type (e.g., 'islamic-content', 'media', 'content').
    /// </summary>
    [Required, MaxLength(50)]
    public string AssetType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets cSS selector used for detection in HTML transcripts
    /// (e.g., '.ayah-card', '.inserted-hadees.ks-ahadees-container').
    /// </summary>
    [MaxLength(200)]
    public string? CssSelector { get; set; }

    /// <summary>
    /// Gets or sets human-readable display name for SHARE buttons
    /// (e.g., 'Ayah Card', 'Inserted Hadees', 'Table').
    /// </summary>
    [MaxLength(100)]
    public string? DisplayName { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether active flag - allows disabling asset types without deletion.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Gets or sets when this asset definition was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}