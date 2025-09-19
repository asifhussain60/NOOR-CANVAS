using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Xunit;

namespace NoorCanvas.Tests.Infrastructure
{
    /// <summary>
    /// Test collection for application health tests to ensure proper test isolation
    /// and resource management during Issue-26 regression testing
    /// </summary>
    [CollectionDefinition("Application Health Tests")]
    public class ApplicationHealthTestCollection : ICollectionFixture<ApplicationTestFixture>
    {
        // This class has no code, and is never created. Its purpose is simply
        // to be the place to apply [CollectionDefinition] and all the
        // ICollectionFixture<> interfaces.
    }

    /// <summary>
    /// Test fixture for application health tests providing shared resources
    /// </summary>
    public class ApplicationTestFixture : IDisposable
    {
        public IServiceProvider ServiceProvider { get; }
        public ILogger<ApplicationTestFixture> Logger { get; }

        public ApplicationTestFixture()
        {
            var services = new ServiceCollection();
            services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));

            ServiceProvider = services.BuildServiceProvider();
            Logger = ServiceProvider.GetRequiredService<ILogger<ApplicationTestFixture>>();

            Logger.LogInformation("ApplicationTestFixture initialized for Issue-26 testing");
        }

        public void Dispose()
        {
            Logger.LogInformation("ApplicationTestFixture disposing");
            if (ServiceProvider is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
    }
}
