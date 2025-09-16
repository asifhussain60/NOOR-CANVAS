using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Registrations", Schema = "canvas")]
public class Registration
{
    [Key]
    public long RegistrationId { get; set; }

    [Required]
    public long SessionId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    public DateTime JoinTime { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;
}
