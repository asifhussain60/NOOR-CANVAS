using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Text.Json;

namespace NoorCanvas.Services
{
    public interface IAnnotationService
    {
        Task<IEnumerable<Annotation>> GetSessionAnnotationsAsync(long sessionId);
        Task<Annotation> CreateAnnotationAsync(long sessionId, string createdBy, object annotationData);
        Task<bool> DeleteAnnotationAsync(long annotationId, string userId);
        Task<bool> UpdateAnnotationAsync(long annotationId, string userId, object annotationData);
        Task ClearSessionAnnotationsAsync(long sessionId, string userId);
    }

    public class AnnotationService : IAnnotationService
    {
        private readonly CanvasDbContext _context;
        private readonly ILogger<AnnotationService> _logger;

        public AnnotationService(CanvasDbContext context, ILogger<AnnotationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<Annotation>> GetSessionAnnotationsAsync(long sessionId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION: Loading annotations for session {SessionId}", sessionId);

                var annotations = await _context.Annotations
                    .Where(a => a.SessionId == sessionId)
                    .OrderBy(a => a.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("NOOR-ANNOTATION: Loaded {Count} annotations for session {SessionId}", 
                    annotations.Count, sessionId);

                return annotations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION: Error loading annotations for session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task<Annotation> CreateAnnotationAsync(long sessionId, string createdBy, object annotationData)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION: Creating annotation for session {SessionId} by {CreatedBy}", 
                    sessionId, createdBy);

                var annotation = new Annotation
                {
                    SessionId = sessionId,
                    CreatedBy = createdBy,
                    AnnotationData = JsonSerializer.Serialize(annotationData),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Annotations.Add(annotation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ANNOTATION: Created annotation {AnnotationId} for session {SessionId}", 
                    annotation.AnnotationId, sessionId);

                return annotation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION: Error creating annotation for session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task<bool> DeleteAnnotationAsync(long annotationId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION: Deleting annotation {AnnotationId} by user {UserId}", 
                    annotationId, userId);

                var annotation = await _context.Annotations
                    .FirstOrDefaultAsync(a => a.AnnotationId == annotationId);

                if (annotation == null)
                {
                    _logger.LogWarning("NOOR-ANNOTATION: Annotation {AnnotationId} not found for deletion", annotationId);
                    return false;
                }

                // Check if user has permission to delete (owner or admin)
                if (annotation.CreatedBy != userId)
                {
                    _logger.LogWarning("NOOR-ANNOTATION: User {UserId} attempted to delete annotation {AnnotationId} owned by {CreatedBy}", 
                        userId, annotationId, annotation.CreatedBy);
                    return false;
                }

                _context.Annotations.Remove(annotation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ANNOTATION: Deleted annotation {AnnotationId}", annotationId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION: Error deleting annotation {AnnotationId}", annotationId);
                throw;
            }
        }

        public async Task<bool> UpdateAnnotationAsync(long annotationId, string userId, object annotationData)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION: Updating annotation {AnnotationId} by user {UserId}", 
                    annotationId, userId);

                var annotation = await _context.Annotations
                    .FirstOrDefaultAsync(a => a.AnnotationId == annotationId);

                if (annotation == null)
                {
                    _logger.LogWarning("NOOR-ANNOTATION: Annotation {AnnotationId} not found for update", annotationId);
                    return false;
                }

                // Check if user has permission to update (owner or admin)
                if (annotation.CreatedBy != userId)
                {
                    _logger.LogWarning("NOOR-ANNOTATION: User {UserId} attempted to update annotation {AnnotationId} owned by {CreatedBy}", 
                        userId, annotationId, annotation.CreatedBy);
                    return false;
                }

                annotation.AnnotationData = JsonSerializer.Serialize(annotationData);
                await _context.SaveChangesAsync();

                _logger.LogInformation("NOOR-ANNOTATION: Updated annotation {AnnotationId}", annotationId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION: Error updating annotation {AnnotationId}", annotationId);
                throw;
            }
        }

        public async Task ClearSessionAnnotationsAsync(long sessionId, string userId)
        {
            try
            {
                _logger.LogInformation("NOOR-ANNOTATION: Clearing annotations for session {SessionId} by user {UserId}", 
                    sessionId, userId);

                // For now, allow any user to clear their own annotations
                // In production, this might be restricted to session hosts/admins
                var userAnnotations = await _context.Annotations
                    .Where(a => a.SessionId == sessionId && a.CreatedBy == userId)
                    .ToListAsync();

                if (userAnnotations.Any())
                {
                    _context.Annotations.RemoveRange(userAnnotations);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("NOOR-ANNOTATION: Cleared {Count} annotations for session {SessionId} by user {UserId}", 
                        userAnnotations.Count, sessionId, userId);
                }
                else
                {
                    _logger.LogInformation("NOOR-ANNOTATION: No annotations found to clear for session {SessionId} by user {UserId}", 
                        sessionId, userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-ANNOTATION: Error clearing annotations for session {SessionId}", sessionId);
                throw;
            }
        }
    }
}
