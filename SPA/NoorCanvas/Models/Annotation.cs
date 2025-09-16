using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Annotations", Schema = "canvas")]
public class Annotation
{
    [Key]
    public long AnnotationId { get; set; }

    [Required]
    public long SessionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "nvarchar(max)")]
    public string? AnnotationData { get; set; }

    [MaxLength(128)]
    public string? CreatedBy { get; set; }

    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
