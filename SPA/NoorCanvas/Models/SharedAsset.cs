using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("SharedAssets", Schema = "canvas")]
public class SharedAsset
{
    [Key]
    public long AssetId { get; set; }

    [Required]
    public long SessionId { get; set; }

    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? AssetType { get; set; }

    // Legacy full HTML storage (being phased out)
    [Column(TypeName = "nvarchar(max)")]
    public string? AssetData { get; set; }

    // New selector-based approach (efficient storage)
    [MaxLength(500)]
    public string? AssetSelector { get; set; }

    public int? AssetPosition { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? AssetMetadata { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
