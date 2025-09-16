using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("AuditLog", Schema = "canvas")]
public class AuditLog
{
    [Key]
    public long EventId { get; set; }

    public DateTime At { get; set; } = DateTime.UtcNow;

    [MaxLength(64)]
    public string? Actor { get; set; }

    public long? SessionId { get; set; }

    public Guid? UserId { get; set; }

    [MaxLength(100)]
    public string? Action { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Details { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session? Session { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }
}
