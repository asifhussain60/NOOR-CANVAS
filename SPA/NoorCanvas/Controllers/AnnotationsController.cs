using Microsoft.AspNetCore.Mvc;
using NoorCanvas.Services;
using System.ComponentModel.DataAnnotations;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnotationsController : ControllerBase
    {
        private readonly IAnnotationService _annotationService;
        private readonly ILogger<AnnotationsController> _logger;

        public AnnotationsController(IAnnotationService annotationService, ILogger<AnnotationsController> logger)
        {
            _annotationService = annotationService;
            _logger = logger;
        }

        /// <summary>
        /// Get all annotations for a specific session
        /// </summary>
        [HttpGet("session/{sessionId}")]
        public async Task<IActionResult> GetSessionAnnotations(long sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Getting annotations for session {SessionId}", sessionId);

                if (sessionId <= 0)
                {
                    return BadRequest(new { error = "Invalid session ID" });
                }

                var annotations = await _annotationService.GetSessionAnnotationsAsync(sessionId);

                _logger.LogInformation("NOOR-API: Retrieved {Count} annotations for session {SessionId}",
                    annotations.Count(), sessionId);

                return Ok(new
                {
                    sessionId = sessionId,
                    annotations = annotations,
                    count = annotations.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error getting annotations for session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to retrieve annotations" });
            }
        }

        /// <summary>
        /// Create a new annotation
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateAnnotation([FromBody] CreateAnnotationRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Creating annotation for session {SessionId} by user {UserId}",
                    request.SessionId, request.CreatedBy);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var annotation = await _annotationService.CreateAnnotationAsync(
                    request.SessionId,
                    request.CreatedBy,
                    request.AnnotationData);

                _logger.LogInformation("NOOR-API: Created annotation {AnnotationId}", annotation.AnnotationId);

                return CreatedAtAction(
                    nameof(GetAnnotation),
                    new { id = annotation.AnnotationId },
                    new
                    {
                        annotationId = annotation.AnnotationId,
                        sessionId = annotation.SessionId,
                        createdBy = annotation.CreatedBy,
                        createdAt = annotation.CreatedAt,
                        annotationData = annotation.AnnotationData
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error creating annotation for session {SessionId}", request.SessionId);
                return StatusCode(500, new { error = "Failed to create annotation" });
            }
        }

        /// <summary>
        /// Get a specific annotation by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAnnotation(long id)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Getting annotation {AnnotationId}", id);

                if (id <= 0)
                {
                    return BadRequest(new { error = "Invalid annotation ID" });
                }

                var annotations = await _annotationService.GetSessionAnnotationsAsync(0); // Get all for now
                var annotation = annotations.FirstOrDefault(a => a.AnnotationId == id);

                if (annotation == null)
                {
                    return NotFound(new { error = "Annotation not found" });
                }

                return Ok(annotation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error getting annotation {AnnotationId}", id);
                return StatusCode(500, new { error = "Failed to retrieve annotation" });
            }
        }

        /// <summary>
        /// Update an existing annotation
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAnnotation(long id, [FromBody] UpdateAnnotationRequest request)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Updating annotation {AnnotationId} by user {UserId}",
                    id, request.UserId);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (id <= 0)
                {
                    return BadRequest(new { error = "Invalid annotation ID" });
                }

                var success = await _annotationService.UpdateAnnotationAsync(id, request.UserId, request.AnnotationData);

                if (!success)
                {
                    return NotFound(new { error = "Annotation not found or access denied" });
                }

                _logger.LogInformation("NOOR-API: Updated annotation {AnnotationId}", id);
                return Ok(new { message = "Annotation updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error updating annotation {AnnotationId}", id);
                return StatusCode(500, new { error = "Failed to update annotation" });
            }
        }

        /// <summary>
        /// Delete an annotation
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnotation(long id, [FromQuery] string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Deleting annotation {AnnotationId} by user {UserId}", id, userId);

                if (id <= 0)
                {
                    return BadRequest(new { error = "Invalid annotation ID" });
                }

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return BadRequest(new { error = "User ID is required" });
                }

                var success = await _annotationService.DeleteAnnotationAsync(id, userId);

                if (!success)
                {
                    return NotFound(new { error = "Annotation not found or access denied" });
                }

                _logger.LogInformation("NOOR-API: Deleted annotation {AnnotationId}", id);
                return Ok(new { message = "Annotation deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error deleting annotation {AnnotationId}", id);
                return StatusCode(500, new { error = "Failed to delete annotation" });
            }
        }

        /// <summary>
        /// Clear all annotations for a session by a specific user
        /// </summary>
        [HttpDelete("session/{sessionId}/clear")]
        public async Task<IActionResult> ClearSessionAnnotations(long sessionId, [FromQuery] string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-API: Clearing annotations for session {SessionId} by user {UserId}",
                    sessionId, userId);

                if (sessionId <= 0)
                {
                    return BadRequest(new { error = "Invalid session ID" });
                }

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return BadRequest(new { error = "User ID is required" });
                }

                await _annotationService.ClearSessionAnnotationsAsync(sessionId, userId);

                _logger.LogInformation("NOOR-API: Cleared annotations for session {SessionId}", sessionId);
                return Ok(new { message = "Annotations cleared successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-API: Error clearing annotations for session {SessionId}", sessionId);
                return StatusCode(500, new { error = "Failed to clear annotations" });
            }
        }
    }

    public class CreateAnnotationRequest
    {
        [Required]
        [Range(1, long.MaxValue)]
        public long SessionId { get; set; }

        [Required]
        [MaxLength(128)]
        public string CreatedBy { get; set; } = "";

        [Required]
        public object AnnotationData { get; set; } = new { };
    }

    public class UpdateAnnotationRequest
    {
        [Required]
        [MaxLength(128)]
        public string UserId { get; set; } = "";

        [Required]
        public object AnnotationData { get; set; } = new { };
    }
}
