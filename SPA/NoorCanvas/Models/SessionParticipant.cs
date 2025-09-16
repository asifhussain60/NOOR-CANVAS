using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("SessionParticipants", Schema = "canvas")]
public class SessionParticipant
{
    [Key]
    public long Id { get; set; }

    [Required]
    public long SessionId { get; set; }

    [Required]
    [MaxLength(128)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? DisplayName { get; set; }

    public DateTime? JoinedAt { get; set; }

    public DateTime? LeftAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}
