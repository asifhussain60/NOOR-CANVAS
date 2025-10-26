using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Services;

namespace NoorCanvas.Tests.Unit;

/// <summary>
/// Unit tests for MediaUrlTransformService.
/// Validates URL pattern detection and environment-aware transformations.
/// </summary>
public class MediaUrlTransformServiceTests
{
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly Mock<ILogger<MediaUrlTransformService>> _mockLogger;
    private readonly IMemoryCache _cache;

    public MediaUrlTransformServiceTests()
    {
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<MediaUrlTransformService>>();
        _cache = new MemoryCache(new MemoryCacheOptions());
    }

    private MediaUrlTransformService CreateService(bool isProduction)
    {
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns(isProduction ? "Production" : "Development");
        _mockEnvironment.Setup(e => e.IsProduction()).Returns(isProduction);
        
        _mockConfiguration.Setup(c => c["Resources:Development:BaseUrl"])
            .Returns("file:///D:/Websites/KSESSIONS/Resources");
        _mockConfiguration.Setup(c => c["Resources:Production:BaseUrl"])
            .Returns("https://resources.kashkole.com");
        
        return new MediaUrlTransformService(
            _mockEnvironment.Object,
            _mockConfiguration.Object,
            _mockLogger.Object,
            _cache);
    }

    [Fact]
    public async Task TransformMediaUrls_RelativePathWithLeadingSlash_Production_ReturnsCdnUrl()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_RelativePathWithoutLeadingSlash_Production_ReturnsCdnUrl()
    {
        // Arrange - THIS IS THE BUG: Resources/IMAGES/... pattern not handled
        var service = CreateService(isProduction: true);
        var html = @"<img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_RelativePath_Development_ReturnsFileUrl()
    {
        // Arrange
        var service = CreateService(isProduction: false);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_FileProtocol_Production_ConvertsToCdn()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_FileProtocol_Development_Unchanged()
    {
        // Arrange
        var service = CreateService(isProduction: false);
        var html = @"<img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_KSessionsDomain_Production_ConvertsToCdn()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""https://kashkole.com/Resources/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_AlreadyCdn_Unchanged()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""https://resources.kashkole.com/IMAGES/117/test.jpg"" />";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
        result.Should().Be(html); // No changes
    }

    [Fact]
    public async Task TransformMediaUrls_MultipleImages_AllTransformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"
            <img src=""/IMAGES/117/image1.jpg"" />
            <img src=""Resources/IMAGES/117/image2.png"" />
            <img src=""file:///D:/Websites/KSESSIONS/Resources/IMAGES/117/image3.gif"" />
        ";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image1.jpg");
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image2.png");
        result.Should().Contain("https://resources.kashkole.com/IMAGES/117/image3.gif");
    }

    [Fact]
    public async Task TransformMediaUrls_AudioTags_Transformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<audio src=""/MP3/recitation.mp3""></audio>";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/MP3/recitation.mp3");
    }

    [Fact]
    public async Task TransformMediaUrls_VideoTags_Transformed()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<video src=""/MEDIA/lecture.mp4""></video>";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/MEDIA/lecture.mp4");
    }

    [Fact]
    public async Task TransformMediaUrls_EmptyHtml_ReturnsEmpty()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        
        // Act
        var result = await service.TransformMediaUrlsAsync("", sessionId: 2343);
        
        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task TransformMediaUrls_NullHtml_ReturnsEmpty()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        
        // Act
        var result = await service.TransformMediaUrlsAsync(null!, sessionId: 2343);
        
        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task TransformMediaUrls_CacheHit_ReturnsCachedResult()
    {
        // Arrange
        var service = CreateService(isProduction: true);
        var html = @"<img src=""/IMAGES/117/test.jpg"" />";
        
        // Act - First call (cache miss)
        var result1 = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Act - Second call (cache hit)
        var result2 = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result1.Should().Be(result2);
        result1.Should().Contain("https://resources.kashkole.com/IMAGES/117/test.jpg");
    }

    [Fact]
    public async Task TransformMediaUrls_Session2343RealContent_TransformsCorrectly()
    {
        // Arrange - Real content from Session 2343
        var service = CreateService(isProduction: true);
        var html = @"<p><img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" 
            style=""width: 988px;"" class=""fr-fic fr-dib imgResponsive fr-bordered"" 
            data-type=""image"" data-image-id=""6cfa2ba3-9ae1-44d1-b38d-357ae051450c"" 
            data-session-id=""2343""></p>";
        
        // Act
        var result = await service.TransformMediaUrlsAsync(html, sessionId: 2343);
        
        // Assert
        result.Should().Contain("https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg");
        result.Should().NotContain("Resources/IMAGES/"); // Original path should be replaced
    }
}
