using Xunit;
using NoorCanvas.Models;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;

namespace NoorCanvas.Core.Tests
{
    public class AnnotationTests
    {
        private DbContextOptions<CanvasDbContext> GetInMemoryDbOptions()
        {
            return new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public void Annotation_Creation_Should_Have_Valid_Properties()
        {
            // Arrange & Act
            var annotation = new Annotation
            {
                AnnotationId = 1,
                SessionId = 12345,
                AnnotationData = @"{""type"":""highlight"",""coordinates"":[{""x"":100,""y"":200}]}",
                CreatedBy = "TestUser",
                CreatedAt = DateTime.UtcNow
            };

            // Assert
            Assert.True(annotation.AnnotationId > 0);
            Assert.True(annotation.SessionId > 0);
            Assert.NotNull(annotation.AnnotationData);
            Assert.NotNull(annotation.CreatedBy);
            Assert.True(annotation.CreatedAt > DateTime.MinValue);
        }

        [Fact]
        public async Task AnnotationService_Should_Create_And_Persist_Annotation()
        {
            // Arrange
            var options = GetInMemoryDbOptions();
            using var context = new CanvasDbContext(options);
            await context.Database.EnsureCreatedAsync();

            var sessionId = 12345L;
            var createdBy = "TestUser";
            var annotationData = @"{""type"":""highlight"",""text"":""Test annotation""}";

            // Act
            var annotation = new Annotation
            {
                SessionId = sessionId,
                CreatedBy = createdBy,
                AnnotationData = annotationData,
                CreatedAt = DateTime.UtcNow
            };

            context.Annotations.Add(annotation);
            await context.SaveChangesAsync();

            // Assert
            var savedAnnotation = await context.Annotations.FirstOrDefaultAsync(a => a.AnnotationId == annotation.AnnotationId);
            Assert.NotNull(savedAnnotation);
            Assert.Equal(sessionId, savedAnnotation.SessionId);
            Assert.Equal(createdBy, savedAnnotation.CreatedBy);
            Assert.Equal(annotationData, savedAnnotation.AnnotationData);
        }

        [Fact]
        public void AnnotationData_Should_Support_Valid_JSON_Structure()
        {
            // Arrange
            var highlightAnnotation = @"{
                ""type"": ""highlight"",
                ""coordinates"": [
                    {""x"": 100, ""y"": 200},
                    {""x"": 150, ""y"": 250}
                ],
                ""text"": ""Selected text for highlighting"",
                ""color"": ""#ffff00""
            }";

            var drawingAnnotation = @"{
                ""type"": ""drawing"",
                ""path"": ""M100,200 L150,250 L200,200"",
                ""strokeColor"": ""#ff0000"",
                ""strokeWidth"": 2
            }";

            var noteAnnotation = @"{
                ""type"": ""note"",
                ""position"": {""x"": 300, ""y"": 400},
                ""text"": ""This is a note annotation"",
                ""backgroundColor"": ""#fff2cc""
            }";

            // Act & Assert
            Assert.DoesNotContain("\"\"", highlightAnnotation);
            Assert.Contains("highlight", highlightAnnotation);
            Assert.Contains("coordinates", highlightAnnotation);

            Assert.DoesNotContain("\"\"", drawingAnnotation);
            Assert.Contains("drawing", drawingAnnotation);
            Assert.Contains("path", drawingAnnotation);

            Assert.DoesNotContain("\"\"", noteAnnotation);
            Assert.Contains("note", noteAnnotation);
            Assert.Contains("position", noteAnnotation);
        }
    }
}
