using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IssueController : ControllerBase
{
    private readonly CanvasDbContext _context;
    private readonly ILogger<IssueController> _logger;

    public IssueController(CanvasDbContext context, ILogger<IssueController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create a new issue report
    /// </summary>
    /// <param name="request">Issue creation request</param>
    /// <returns>Created issue with ID</returns>
    [HttpPost]
    public async Task<IActionResult> CreateIssue([FromBody] CreateIssueRequest request)
    {
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["Action"] = nameof(CreateIssue),
            ["RequestTitle"] = request.Title
        }))
        {
            try
            {
                _logger.LogInformation("NOOR-INFO: Creating new issue with title '{Title}'", request.Title);

                // Validate request
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("NOOR-WARN: Invalid issue creation request: {Errors}",
                        string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                    return BadRequest(ModelState);
                }

                // Create new issue
                var issue = new Issue
                {
                    Title = request.Title,
                    Description = request.Description,
                    Priority = request.Priority ?? "Medium",
                    Category = request.Category ?? "Bug",
                    Status = "Pending",
                    ReportedAt = DateTime.UtcNow,
                    SessionId = request.SessionId,
                    UserId = request.UserId,
                    ReportedBy = request.ReportedBy
                };

                _context.Issues.Add(issue);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-SUCCESS: Issue {IssueId} created successfully with title '{Title}'",
                    issue.IssueId, issue.Title);

                var response = new IssueResponse
                {
                    IssueId = issue.IssueId,
                    Title = issue.Title,
                    Description = issue.Description,
                    Priority = issue.Priority,
                    Category = issue.Category,
                    Status = issue.Status,
                    ReportedAt = issue.ReportedAt
                };

                return CreatedAtAction(nameof(GetIssue), new { id = issue.IssueId }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ERROR: Failed to create issue with title '{Title}'", request.Title);
                return StatusCode(500, new { error = "Failed to create issue", details = ex.Message });
            }
        }
    }

    /// <summary>
    /// Get issue by ID
    /// </summary>
    /// <param name="id">Issue ID</param>
    /// <returns>Issue details</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetIssue(long id)
    {
        try
        {
            _logger.LogInformation("NOOR-INFO: Retrieving issue {IssueId}", id);

            var issue = await _context.Issues
                .Where(i => i.IssueId == id)
                .Select(i => new IssueResponse
                {
                    IssueId = i.IssueId,
                    Title = i.Title,
                    Description = i.Description,
                    Priority = i.Priority,
                    Category = i.Category,
                    Status = i.Status,
                    ReportedAt = i.ReportedAt
                })
                .FirstOrDefaultAsync();

            if (issue == null)
            {
                _logger.LogWarning("NOOR-WARN: Issue {IssueId} not found", id);
                return NotFound(new { error = $"Issue {id} not found" });
            }

            return Ok(issue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ERROR: Failed to retrieve issue {IssueId}", id);
            return StatusCode(500, new { error = "Failed to retrieve issue" });
        }
    }

    /// <summary>
    /// Get all issues with optional filtering
    /// </summary>
    /// <param name="status">Filter by status</param>
    /// <param name="priority">Filter by priority</param>
    /// <param name="category">Filter by category</param>
    /// <returns>List of issues</returns>
    [HttpGet]
    public async Task<IActionResult> GetIssues(
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? category = null)
    {
        try
        {
            _logger.LogInformation("NOOR-INFO: Retrieving issues with filters - Status: {Status}, Priority: {Priority}, Category: {Category}",
                status, priority, category);

            var query = _context.Issues.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(i => i.Status == status);

            if (!string.IsNullOrEmpty(priority))
                query = query.Where(i => i.Priority == priority);

            if (!string.IsNullOrEmpty(category))
                query = query.Where(i => i.Category == category);

            var issues = await query
                .OrderByDescending(i => i.ReportedAt)
                .Select(i => new IssueResponse
                {
                    IssueId = i.IssueId,
                    Title = i.Title,
                    Description = i.Description,
                    Priority = i.Priority,
                    Category = i.Category,
                    Status = i.Status,
                    ReportedAt = i.ReportedAt
                })
                .ToListAsync();

            _logger.LogInformation("NOOR-INFO: Retrieved {Count} issues", issues.Count);

            return Ok(new { count = issues.Count, issues });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NOOR-ERROR: Failed to retrieve issues");
            return StatusCode(500, new { error = "Failed to retrieve issues" });
        }
    }
}

/// <summary>
/// Request model for creating a new issue
/// </summary>
public class CreateIssueRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Priority { get; set; } // High, Medium, Low

    [MaxLength(50)]
    public string? Category { get; set; } // Bug, Feature, Enhancement, Documentation

    public long? SessionId { get; set; }

    public Guid? UserId { get; set; }

    [MaxLength(128)]
    public string? ReportedBy { get; set; }
}

/// <summary>
/// Response model for issue data
/// </summary>
public class IssueResponse
{
    public long IssueId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
}
