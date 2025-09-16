using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Questions", Schema = "canvas")]
public class Question
{
    [Key]
    public long QuestionId { get; set; }

    [Required]
    public long SessionId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(280)]
    public string QuestionText { get; set; } = string.Empty;

    public DateTime QueuedAt { get; set; } = DateTime.UtcNow;

    public DateTime? AnsweredAt { get; set; }

    public int VoteCount { get; set; } = 0;

    [MaxLength(50)]
    public string Status { get; set; } = "Queued"; // Queued, Selected, Answered, Hidden

    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<QuestionAnswer> QuestionAnswers { get; set; } = new List<QuestionAnswer>();
    public virtual ICollection<QuestionVote> QuestionVotes { get; set; } = new List<QuestionVote>();
}
