using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Services;
using Xunit;

namespace NoorCanvas.Tests.Unit
{
    /// <summary>
    /// Tests for MediaUrlTransformService CDN URL transformation.
    /// Verifies that all environments (dev and prod) use CDN URLs instead of file:// protocol.
    /// Related: .github/instructions/CDN-Architecture.md
    /// </summary>
    public class MediaUrlTransformService_CDN_Tests
    {
        private readonly Mock<IWebHostEnvironment> _mockEnvironment;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ILogger<MediaUrlTransformService>> _mockLogger;
        private readonly IMemoryCache _cache;

        public MediaUrlTransformService_CDN_Tests()
        {
            _mockEnvironment = new Mock<IWebHostEnvironment>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockLogger = new Mock<ILogger<MediaUrlTransformService>>();
            _cache = new MemoryCache(new MemoryCacheOptions());
        }

        [Fact]
        public async Task TransformMediaUrls_Development_UsesCDN_NotFileProtocol()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            var html = @"<img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" />";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg", result);
            Assert.DoesNotContain("file://", result);
        }

        [Fact]
        public async Task TransformMediaUrls_Production_UsesCDN()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Production");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            var html = @"<img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" />";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg", result);
            Assert.DoesNotContain("file://", result);
        }

        [Fact]
        public async Task TransformMediaUrls_Session2343_TransformsAllImages()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            // Sample HTML from Session 2343 with both images
            var html = @"
                <img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" />
                <img src=""Resources/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg"" />
            ";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg", result);
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg", result);
            Assert.DoesNotContain("Resources/IMAGES", result); // All relative paths should be transformed
            Assert.DoesNotContain("file://", result);
        }

        [Fact]
        public async Task TransformMediaUrls_FileProtocolURL_TransformedToCDN()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            var html = @"<img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/2343/test.jpg"" />";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/test.jpg", result);
            Assert.DoesNotContain("file://", result);
        }

        [Fact]
        public async Task TransformMediaUrls_AlreadyCDN_Unchanged()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            var html = @"<img src=""https://resources.kashkole.com/IMAGES/2343/test.jpg"" />";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Equal(html, result); // Should remain unchanged
        }

        [Fact]
        public async Task TransformMediaUrls_KSessionsDomain_TransformedToCDN()
        {
            // Arrange
            _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Development");
            _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"]).Returns("https://resources.kashkole.com");

            var service = new MediaUrlTransformService(
                _mockEnvironment.Object,
                _mockConfiguration.Object,
                _mockLogger.Object,
                _cache);

            var html = @"<img src=""https://kashkole.com/Resources/IMAGES/2343/test.jpg"" />";

            // Act
            var result = await service.TransformMediaUrlsAsync(html, 2343);

            // Assert
            Assert.Contains("https://resources.kashkole.com/IMAGES/2343/test.jpg", result);
            Assert.DoesNotContain("kashkole.com/Resources", result);
        }
    }
}
