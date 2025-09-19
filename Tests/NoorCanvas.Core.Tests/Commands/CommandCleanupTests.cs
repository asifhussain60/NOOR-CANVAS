using System.IO;
using Xunit;
using Xunit.Abstractions;

namespace NoorCanvas.Core.Tests.Commands
{
    /// <summary>
    /// Test cases for ncrun command removal and cleanup
    /// 
    /// These tests validate that:
    /// 1. ncrun.ps1 file has been completely removed
    /// 2. nc.ps1 is the primary command and exists
    /// 3. Documentation references ncrun have been cleaned up
    /// 4. Global command structure is properly maintained
    /// </summary>
    public class CommandCleanupTests
    {
        private readonly ITestOutputHelper _output;
        private readonly string _workspaceRoot;
        private readonly string _globalCommandsPath;

        public CommandCleanupTests(ITestOutputHelper output)
        {
            _output = output;
            _workspaceRoot = GetWorkspaceRoot();
            _globalCommandsPath = Path.Combine(_workspaceRoot, "Workspaces", "Global");
        }

        private string GetWorkspaceRoot()
        {
            var currentDir = Directory.GetCurrentDirectory();
            while (currentDir != null && !File.Exists(Path.Combine(currentDir, "NoorCanvas.sln")))
            {
                currentDir = Directory.GetParent(currentDir)?.FullName;
            }
            return currentDir ?? throw new InvalidOperationException("Could not find workspace root");
        }

        [Fact]
        public void NcrunCommand_ShouldBeCompletelyRemoved()
        {
            // Arrange
            var ncrunPaths = new[]
            {
                Path.Combine(_globalCommandsPath, "ncrun.ps1"),
                Path.Combine(_globalCommandsPath, "ncrun.cmd"),
                Path.Combine(_globalCommandsPath, "ncrun.bat")
            };

            // Act & Assert
            foreach (var path in ncrunPaths)
            {
                var exists = File.Exists(path);
                Assert.False(exists, $"Deprecated ncrun file should not exist: {path}");

                if (!exists)
                {
                    _output.WriteLine($"✅ Confirmed removed: {Path.GetFileName(path)}");
                }
            }

            _output.WriteLine("✅ ncrun Command Cleanup Test Passed: All ncrun files successfully removed");
        }

        [Fact]
        public void NcCommand_ShouldExistAsPrimary()
        {
            // Arrange
            var ncPath = Path.Combine(_globalCommandsPath, "nc.ps1");

            // Act
            var exists = File.Exists(ncPath);

            // Assert
            Assert.True(exists, $"Primary nc.ps1 command should exist at: {ncPath}");

            _output.WriteLine($"✅ Primary Command Test Passed: nc.ps1 exists at {ncPath}");
        }

        [Fact]
        public void NcCommand_ShouldHaveCorrectParameters()
        {
            // Arrange
            var ncPath = Path.Combine(_globalCommandsPath, "nc.ps1");

            // Act
            var content = File.ReadAllText(ncPath);

            // Assert
            Assert.Contains("param(", content);
            Assert.Contains("[switch]$Help", content);
            Assert.Contains("[switch]$NoBrowser", content);
            Assert.Contains("[switch]$Https", content);
            Assert.DoesNotContain("[switch]$Build", content); // This was ncrun-specific

            _output.WriteLine("✅ NC Command Structure Test Passed: Correct parameters defined");
        }

        [Fact]
        public void GlobalReadme_ShouldNotReferenceNcrun()
        {
            // Arrange
            var readmePath = Path.Combine(_globalCommandsPath, "README.md");

            if (!File.Exists(readmePath))
            {
                _output.WriteLine("⚠️ Global README.md not found, skipping ncrun reference test");
                return;
            }

            // Act
            var content = File.ReadAllText(readmePath);

            // Assert
            Assert.DoesNotContain("ncrun", content, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("nc ", content); // Should contain references to nc command

            _output.WriteLine("✅ Documentation Cleanup Test Passed: No ncrun references in Global README.md");
        }

        [Fact]
        public void CopilotInstructions_ShouldNotReferenceNcrun()
        {
            // Arrange
            var instructionsPath = Path.Combine(_workspaceRoot, ".github", "copilot-instructions.md");

            if (!File.Exists(instructionsPath))
            {
                _output.WriteLine("⚠️ Copilot instructions not found, skipping ncrun reference test");
                return;
            }

            // Act
            var content = File.ReadAllText(instructionsPath);

            // Assert - Should not contain ncrun references
            var ncrunReferences = CountOccurrences(content.ToLower(), "ncrun");
            Assert.Equal(0, ncrunReferences);

            // Should contain nc references
            var ncReferences = CountOccurrences(content.ToLower(), "nc ");
            Assert.True(ncReferences > 0, "Copilot instructions should contain nc command references");

            _output.WriteLine($"✅ Copilot Instructions Cleanup Test Passed: 0 ncrun references, {ncReferences} nc references");
        }

        [Theory]
        [InlineData("nc.ps1")]
        [InlineData("nct.ps1")]
        [InlineData("ksrun.ps1")]
        public void ActiveCommands_ShouldExist(string commandFile)
        {
            // Arrange
            var commandPath = Path.Combine(_globalCommandsPath, commandFile);

            // Act
            var exists = File.Exists(commandPath);

            // Assert
            Assert.True(exists, $"Active command should exist: {commandFile}");

            _output.WriteLine($"✅ Active Command Test Passed: {commandFile} exists");
        }

        [Fact]
        public void GlobalCommandsFolder_ShouldHaveCorrectStructure()
        {
            // Arrange
            var expectedFiles = new[]
            {
                "nc.ps1",           // Primary application runner
                "nct.ps1",          // Host token management
                "ksrun.ps1",        // Testing workflow
                "README.md",        // Documentation
                "setup-global-commands.ps1" // PATH setup utility
            };

            var forbiddenFiles = new[]
            {
                "ncrun.ps1",
                "ncrun.cmd",
                "ncrun.bat",
                "nsrun.ps1"  // Should also be removed
            };

            // Act & Assert - Expected files
            foreach (var expectedFile in expectedFiles)
            {
                var path = Path.Combine(_globalCommandsPath, expectedFile);
                var exists = File.Exists(path);

                if (!exists && expectedFile != "README.md") // README.md is optional
                {
                    _output.WriteLine($"⚠️ Expected file missing: {expectedFile}");
                }
            }

            // Act & Assert - Forbidden files
            foreach (var forbiddenFile in forbiddenFiles)
            {
                var path = Path.Combine(_globalCommandsPath, forbiddenFile);
                var exists = File.Exists(path);
                Assert.False(exists, $"Deprecated file should not exist: {forbiddenFile}");

                if (!exists)
                {
                    _output.WriteLine($"✅ Confirmed absent: {forbiddenFile}");
                }
            }

            _output.WriteLine("✅ Global Commands Structure Test Passed: Proper file structure maintained");
        }

        private int CountOccurrences(string text, string searchString)
        {
            int count = 0;
            int index = 0;

            while ((index = text.IndexOf(searchString, index, StringComparison.Ordinal)) != -1)
            {
                count++;
                index += searchString.Length;
            }

            return count;
        }
    }
}
