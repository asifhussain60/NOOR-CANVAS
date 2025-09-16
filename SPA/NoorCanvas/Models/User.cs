using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Users", Schema = "canvas")]
public class User
{
    [Key]
    public Guid UserId { get; set; } = Guid.NewGuid();

    [MaxLength(256)]
    public string? Name { get; set; }

    [MaxLength(128)]
    public string? City { get; set; }

    [MaxLength(128)]
    public string? Country { get; set; }

    public DateTime FirstJoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime LastJoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    public DateTime? LastSeenAt { get; set; }

    [MaxLength(256)]
    public string UserGuid { get; set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<Registration> Registrations { get; set; } = new List<Registration>();
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    public virtual ICollection<QuestionVote> QuestionVotes { get; set; } = new List<QuestionVote>();
}
