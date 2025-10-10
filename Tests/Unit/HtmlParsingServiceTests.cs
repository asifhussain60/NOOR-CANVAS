using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Services;
using Xunit;

namespace Tests.Unit
{
    /// <summary>
    /// Unit tests for HtmlParsingService transformation functions
    /// Focus: Hadees subject token removal
    /// </summary>
    public class HtmlParsingServiceTests
    {
        private readonly HtmlParsingService _service;
        private readonly Mock<ILogger<HtmlParsingService>> _loggerMock;

        public HtmlParsingServiceTests()
        {
            _loggerMock = new Mock<ILogger<HtmlParsingService>>();
            _service = new HtmlParsingService(_loggerMock.Object);
        }

        [Fact]
        public void TransformHtml_ShouldRemoveHadeesSubjectTokens_FromInlineStyleH4()
        {
            // Arrange - Real HTML from session212.html
            var inputHtml = @"<div>
                <h4 style=""margin: 0; font-size: 1.2em; display: flex; align-items: center; color: #007bff; font-weight: 700;"">
                    <i class=""fa fa-comment"" style=""margin-right: 0.5em; color: #007bff;"" aria-hidden=""true""></i>Ali Ibn Abu Talib<span style=""font-size: 0.8em; font-weight: 400; color: #9ca3af; margin-left: 0.5rem;"">- Duniya, Akhira, Worldly Life, Hereafter</span>
                </h4>
            </div>";

            var expectedOutput = @"<div>
                <h4 style=""margin: 0; font-size: 1.2em; display: flex; align-items: center; color: #007bff; font-weight: 700;"">
                    <i class=""fa fa-comment"" style=""margin-right: 0.5em; color: #007bff;"" aria-hidden=""true""></i>Ali Ibn Abu Talib
                </h4>
            </div>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Verify the span with subject tokens is removed
            Assert.DoesNotContain("- Duniya, Akhira, Worldly Life, Hereafter", result.Content);
            Assert.Contains("Ali Ibn Abu Talib", result.Content);
            Assert.DoesNotContain("<span", result.Content); // Span should be completely removed
        }

        [Fact]
        public void TransformHtml_ShouldRemoveHadeesSubjectTokens_FromSimpleH4()
        {
            // Arrange - Simplified structure
            var inputHtml = @"<h4><i class=""fa fa-comment""></i>Muhammad Ibn Abdullah (SWS) - Accountability, Deeds</h4>";
            
            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            Assert.DoesNotContain("- Accountability, Deeds", result.Content);
            Assert.Contains("Muhammad Ibn Abdullah (SWS)", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldRemoveHadeesSubjectTokens_MultipleFormats()
        {
            // Arrange - Multiple hadees with different token formats
            var inputHtml = @"
                <h4><i></i>Abu Huraira - Faith, Charity</h4>
                <h4><i></i>Ali Ibn Abu Talib - Wisdom, Knowledge, Patience</h4>
                <h4><i></i>Aisha (RA) - Marriage, Family Life</h4>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Verify all tokens removed
            Assert.DoesNotContain("- Faith, Charity", result.Content);
            Assert.DoesNotContain("- Wisdom, Knowledge, Patience", result.Content);
            Assert.DoesNotContain("- Marriage, Family Life", result.Content);
            
            // Verify narrators preserved
            Assert.Contains("Abu Huraira", result.Content);
            Assert.Contains("Ali Ibn Abu Talib", result.Content);
            Assert.Contains("Aisha (RA)", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldNotRemoveHyphensInNarratorNames()
        {
            // Arrange - Narrator name contains hyphens
            var inputHtml = @"<h4><i></i>Al-Bukhari - Collection, Authenticity</h4>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Should remove subject tokens but preserve narrator name
            Assert.DoesNotContain("- Collection, Authenticity", result.Content);
            Assert.Contains("Al-Bukhari", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldHandleComplexSpanStructure()
        {
            // Arrange - Real structure with span inside h4
            var inputHtml = @"<h4>
                <i class=""fa fa-comment ks-ahadees-header-icon""></i>
                Ali Ibn Abu Talib
                <span class=""ks-ahadees-subject"">- Human Potential, Universe, Macrocosm</span>
            </h4>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            Assert.DoesNotContain("- Human Potential, Universe, Macrocosm", result.Content);
            Assert.DoesNotContain("ks-ahadees-subject", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldPreserveOtherH4Elements()
        {
            // Arrange - Mix of hadees and non-hadees h4 elements
            var inputHtml = @"
                <h4>Regular Heading</h4>
                <h4><i></i>Abu Huraira - Faith, Prayer</h4>
                <h4>Another Regular Heading</h4>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Regular headings should be preserved
            Assert.Contains("Regular Heading", result.Content);
            Assert.Contains("Another Regular Heading", result.Content);
            
            // Hadees tokens removed
            Assert.DoesNotContain("- Faith, Prayer", result.Content);
            Assert.Contains("Abu Huraira", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldRemoveDeleteButtons()
        {
            // Arrange
            var inputHtml = @"<div>
                <button data-ahadees-id=""test-123"" title=""Delete this hadees"">✕</button>
                <h4><i></i>Test Narrator - Test Topics</h4>
            </div>";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Delete button should be removed
            Assert.DoesNotContain("<button", result.Content);
            Assert.DoesNotContain("Delete this hadees", result.Content);
            
            // Hadees tokens should also be removed
            Assert.DoesNotContain("- Test Topics", result.Content);
        }

        [Fact]
        public void TransformHtml_ShouldAddDataIslamicContentAttribute()
        {
            // Arrange
            var inputHtml = @"
                <div class=""example"">Example content</div>
                <p class=""quote"">Quote content</p>
                <img class=""imgResponsive"" src=""test.jpg"" />";

            // Act
            var result = _service.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(result.IsValid);
            Assert.NotNull(result.Content);
            
            // Should have data-islamic-content added
            Assert.Contains("data-islamic-content", result.Content);
        }
    }
}
