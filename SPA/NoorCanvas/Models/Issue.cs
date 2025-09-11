using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NoorCanvas.Models;

[Table("Issues", Schema = "canvas")]
public class Issue
{
    [Key]
    public long IssueId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(max)")]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    public string Priority { get; set; } = "Medium"; // High, Medium, Low
    
    [MaxLength(50)]
    public string Category { get; set; } = "Bug"; // Bug, Feature, Enhancement, Documentation
    
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed
    
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    
    public long? SessionId { get; set; }
    
    public Guid? UserId { get; set; }
    
    [MaxLength(128)]
    public string? ReportedBy { get; set; }
    
    [Column(TypeName = "nvarchar(max)")]
    public string? Context { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(SessionId))]
    public virtual Session? Session { get; set; }
    
    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }
}
