using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("QuestionVotes", Schema = "canvas")]
public class QuestionVote
{
    [Key]
    public long VoteId { get; set; }
    
    [Required]
    public long QuestionId { get; set; }
    
    public Guid? UserId { get; set; }
    
    public byte VoteValue { get; set; } = 0; // 0 or 1
    
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;
    
    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }
}
