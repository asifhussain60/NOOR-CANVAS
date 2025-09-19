using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using Xunit.Abstractions;

namespace NoorCanvas.Core.Tests.Infrastructure
{
    /// <summary>
    /// SSL Configuration Test Harness
    /// Validates SSL certificate bypass configuration for development environment
    /// Tests database connectivity with TrustServerCertificate and Encrypt parameters
    /// </summary>
    public class SslConfigurationTestHarness
    {
        private readonly ITestOutputHelper _output;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SslConfigurationTestHarness> _logger;

        public SslConfigurationTestHarness(ITestOutputHelper output)
        {
            _output = output;

            // Build configuration matching application setup
            _configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            _logger = loggerFactory.CreateLogger<SslConfigurationTestHarness>();
        }

        [Fact(DisplayName = "SSL-01: DefaultConnection SSL Bypass Configuration Validation")]
        public void DefaultConnection_SslBypassConfiguration_ShouldConnectSuccessfully()
        {
            // Arrange
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            _output.WriteLine($"Testing connection string: {MaskPassword(connectionString)}");

            // Act & Assert
            ValidateSslBypassConnection(connectionString, "DefaultConnection (Canvas Schema)");
        }

        [Fact(DisplayName = "SSL-02: KSessionsDb SSL Bypass Configuration Validation")]
        public void KSessionsDb_SslBypassConfiguration_ShouldConnectSuccessfully()
        {
            // Arrange
            var connectionString = _configuration.GetConnectionString("KSessionsDb") ??
                                 _configuration.GetConnectionString("DefaultConnection");
            _output.WriteLine($"Testing KSessionsDb connection: {MaskPassword(connectionString)}");

            // Act & Assert
            ValidateSslBypassConnection(connectionString, "KSessionsDb (Albums/Categories)");
        }

        [Fact(DisplayName = "SSL-03: KQurDb SSL Bypass Configuration Validation")]
        public void KQurDb_SslBypassConfiguration_ShouldConnectSuccessfully()
        {
            // Arrange
            var connectionString = _configuration.GetConnectionString("KQurDb") ??
                                 _configuration.GetConnectionString("DefaultConnection");
            _output.WriteLine($"Testing KQurDb connection: {MaskPassword(connectionString)}");

            // Act & Assert
            ValidateSslBypassConnection(connectionString, "KQurDb (Quranic Content)");
        }

        [Fact(DisplayName = "SSL-04: SSL Certificate Bypass Parameters Present")]
        public void ConnectionStrings_SslBypassParameters_ShouldBePresentInConfiguration()
        {
            // Arrange
            var connections = new Dictionary<string, string>
            {
                ["DefaultConnection"] = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty,
                ["KSessionsDb"] = _configuration.GetConnectionString("KSessionsDb") ?? string.Empty,
                ["KQurDb"] = _configuration.GetConnectionString("KQurDb") ?? string.Empty
            };

            // Act & Assert
            foreach (var connection in connections)
            {
                if (!string.IsNullOrEmpty(connection.Value))
                {
                    _output.WriteLine($"Validating {connection.Key}: {MaskPassword(connection.Value)}");

                    // Check for SSL bypass parameters
                    Assert.Contains("TrustServerCertificate=true", connection.Value,
                        StringComparison.OrdinalIgnoreCase);
                    Assert.Contains("Encrypt=false", connection.Value,
                        StringComparison.OrdinalIgnoreCase);

                    _output.WriteLine($"✅ {connection.Key} contains required SSL bypass parameters");
                }
            }
        }

        [Fact(DisplayName = "SSL-05: Development Environment Configuration Override")]
        public void DevelopmentConfiguration_SslBypass_ShouldOverrideBaseConfiguration()
        {
            // Arrange
            var baseConfig = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            var devConfig = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            // Act
            var baseConnectionString = baseConfig.GetConnectionString("DefaultConnection");
            var devConnectionString = devConfig.GetConnectionString("DefaultConnection");

            // Assert
            _output.WriteLine($"Base connection: {MaskPassword(baseConnectionString)}");
            _output.WriteLine($"Dev connection: {MaskPassword(devConnectionString)}");

            // Development should have SSL bypass parameters
            Assert.Contains("TrustServerCertificate=true", devConnectionString ?? string.Empty,
                StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Encrypt=false", devConnectionString ?? string.Empty,
                StringComparison.OrdinalIgnoreCase);

            _output.WriteLine("✅ Development configuration properly overrides SSL settings");
        }

        [Fact(DisplayName = "SSL-06: Database Connection Resilience Test")]
        public async Task DatabaseConnection_SslBypass_ShouldHandleMultipleConnections()
        {
            // Arrange
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            var tasks = new List<Task>();

            // Act - Create multiple concurrent connections
            for (int i = 0; i < 5; i++)
            {
                int connectionId = i + 1;
                tasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        using var connection = new SqlConnection(connectionString);
                        await connection.OpenAsync();

                        var command = new SqlCommand("SELECT 1 AS TestValue", connection);
                        var result = await command.ExecuteScalarAsync();

                        _output.WriteLine($"✅ Connection {connectionId}: Successfully executed test query, result: {result}");
                    }
                    catch (Exception ex)
                    {
                        _output.WriteLine($"❌ Connection {connectionId} failed: {ex.Message}");
                        throw;
                    }
                }));
            }

            // Assert - All connections should succeed
            await Task.WhenAll(tasks);
            _output.WriteLine("✅ All concurrent connections succeeded with SSL bypass configuration");
        }

        [Theory(DisplayName = "SSL-07: SQL Server Version Compatibility Test")]
        [InlineData("SELECT @@VERSION AS ServerVersion")]
        [InlineData("SELECT SERVERPROPERTY('ProductVersion') AS Version")]
        public void SqlServer_VersionCompatibility_ShouldWorkWithSslBypass(string versionQuery)
        {
            // Arrange
            var connectionString = _configuration.GetConnectionString("DefaultConnection");

            // Act & Assert
            using var connection = new SqlConnection(connectionString);
            connection.Open();

            var command = new SqlCommand(versionQuery, connection);
            var version = command.ExecuteScalar()?.ToString();

            _output.WriteLine($"SQL Server Version: {version}");
            Assert.NotNull(version);
            Assert.NotEmpty(version);

            _output.WriteLine($"✅ SQL Server version query successful with SSL bypass");
        }

        private void ValidateSslBypassConnection(string? connectionString, string contextName)
        {
            // Arrange
            Assert.NotNull(connectionString);
            Assert.NotEmpty(connectionString);

            _logger.LogInformation("NOOR-TEST: Testing SSL bypass connection for {Context}", contextName);

            try
            {
                // Act - Attempt database connection
                using var connection = new SqlConnection(connectionString);
                connection.Open();

                // Verify connection is actually open
                Assert.Equal(System.Data.ConnectionState.Open, connection.State);

                // Execute a simple query to verify functionality
                var command = new SqlCommand("SELECT GETDATE() AS CurrentTime", connection);
                var result = command.ExecuteScalar();

                // Assert
                Assert.NotNull(result);
                _output.WriteLine($"✅ {contextName}: Connection successful, server time: {result}");
                _logger.LogInformation("NOOR-SUCCESS: SSL bypass connection validated for {Context}", contextName);
            }
            catch (SqlException ex)
            {
                _output.WriteLine($"❌ {contextName}: SQL Exception - {ex.Message}");
                _logger.LogError(ex, "NOOR-ERROR: SSL bypass connection failed for {Context}", contextName);

                // Check if this is an SSL-related error
                if (ex.Message.Contains("certificate") || ex.Message.Contains("SSL") || ex.Message.Contains("trust"))
                {
                    Assert.Fail($"SSL certificate error detected for {contextName}. Ensure TrustServerCertificate=true and Encrypt=false are configured.");
                }

                throw;
            }
            catch (Exception ex)
            {
                _output.WriteLine($"❌ {contextName}: General Exception - {ex.Message}");
                _logger.LogError(ex, "NOOR-ERROR: Unexpected error during SSL bypass connection test for {Context}", contextName);
                throw;
            }
        }

        private static string MaskPassword(string? connectionString)
        {
            if (string.IsNullOrEmpty(connectionString))
                return "NULL or EMPTY";

            // Mask password for logging
            return System.Text.RegularExpressions.Regex.Replace(
                connectionString,
                @"Password=([^;]+)",
                "Password=***",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }
    }
}
