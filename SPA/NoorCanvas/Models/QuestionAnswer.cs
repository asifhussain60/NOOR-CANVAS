using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("QuestionAnswers", Schema = "canvas")]
public class QuestionAnswer
{
    [Key]
    public long AnswerId { get; set; }

    [Required]
    public long QuestionId { get; set; }

    [Required]
    [MaxLength(64)]
    public string PostedBy { get; set; } = string.Empty;

    public DateTime PostedAt { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "nvarchar(max)")]
    public string? AnswerText { get; set; }

    // Navigation properties
    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;
}
