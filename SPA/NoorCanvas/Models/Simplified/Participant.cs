using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

[Table("Participants", Schema = "canvas")]
public class Participant
{
    [Key]
    public int ParticipantId { get; set; }
    
    [Required]
    public long SessionId { get; set; }
    
    [MaxLength(256)]
    public string? UserGuid { get; set; }
    
    [MaxLength(100)]
    public string? Name { get; set; }
    
    [MaxLength(255)]
    public string? Email { get; set; }
    
    [MaxLength(100)]
    public string? Country { get; set; }
    
    [MaxLength(100)]
    public string? City { get; set; }
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}