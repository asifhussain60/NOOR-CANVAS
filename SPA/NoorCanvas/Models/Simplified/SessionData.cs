using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models.Simplified;

[Table("SessionData", Schema = "canvas")]
public class SessionData
{
    [Key]
    public int DataId { get; set; }
    
    [Required]
    public long SessionId { get; set; }
    
    [Required, MaxLength(20)]
    public string DataType { get; set; } = string.Empty; // 'SharedAsset', 'Annotation', 'Question', 'QuestionAnswer'
    
    [Column(TypeName = "nvarchar(max)")]
    public string? Content { get; set; }  // JSON blob for flexible storage
    
    [MaxLength(100)]
    public string? CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    
    // Aliases for compatibility with existing code
    [NotMapped]
    public string? JsonContent 
    { 
        get => Content; 
        set => Content = value; 
    }
    
    [NotMapped]
    public string? CreatedByUserGuid 
    { 
        get => CreatedBy; 
        set => CreatedBy = value; 
    }
    
    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session Session { get; set; } = null!;
}

// Helper class for typed content access
public static class SessionDataTypes
{
    public const string SharedAsset = "SharedAsset";
    public const string Annotation = "Annotation"; 
    public const string Question = "Question";
    public const string QuestionAnswer = "QuestionAnswer";
    public const string QuestionVote = "QuestionVote";
}