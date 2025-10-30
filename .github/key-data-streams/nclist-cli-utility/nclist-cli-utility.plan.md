# NCList CLI Utility - Implementation Plan

**Key**: `nclist-cli-utility`  
**Created**: 2025-10-26  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Branch**: `development`

---

## Executive Summary

Convert list.prompt.md functionality into a standalone .NET 8 CLI utility (`nclist.exe`) that provides fast workspace resource discovery with glob filtering, fuzzy search, git integration, and multiple output formats. Configuration externalized to `nclist.config.json` for easy customization.

## User Decisions (Enhancements Selected)

**High Priority Enhancements - ALL SELECTED:**
- **A. Single-file executable publish** - Chosen for easy distribution
  - Rationale: No dependencies, easy to copy/share, instant execution
  - Implementation: Phase 7, dotnet publish with --self-contained -p:PublishSingleFile=true
  
- **B. Colorized console output** - Chosen for better UX
  - Rationale: Visual hierarchy, easier scanning, professional appearance
  - Implementation: Phase 5, ANSI color codes via System.Console

- **C. Performance benchmarking** - Chosen for validation
  - Rationale: Measure cache effectiveness, validate 5-min TTL benefit
  - Implementation: Phase 7, BenchmarkDotNet integration tests

## Assumptions Validated

### @workspace Evidence
- **Existing CLI Pattern**: `Tools/HostProvisioner/HostProvisioner/HostProvisioner.csproj`
  - Uses System.CommandLine v2.0.0-beta4.22272.1
  - Target framework: net8.0
  - Configuration: appsettings.json + app.config
  
- **Configuration Pattern**: `HostProvisioner.Shared/HostProvisionerConfig.cs`
  - Shared config class for multiple apps
  - Environment detection via app.config
  - DI with Microsoft.Extensions.DependencyInjection

- **Project Structure**: `Tools/HostProvisioner/`
  - Proven pattern: CLI tool in separate Tools/ folder
  - Self-contained deployment capability
  - Project references to main NoorCanvas project when needed

- **Functional Requirements**: `.github/prompts/list.prompt.md` (2082 lines)
  - Complete specification with algorithms
  - Glob pattern filtering with chaining
  - Fuzzy search (Levenshtein distance ≤ 2)
  - Git integration, workspace stats, caching

## Architecture Overview

### Technology Stack
- **Framework**: .NET 8.0 Console Application
- **CLI Parsing**: System.CommandLine 2.0.0-beta4
- **Configuration**: Microsoft.Extensions.Configuration (JSON)
- **Git Integration**: LibGit2Sharp 0.29.0
- **Caching**: File-based JSON cache with TTL
- **Testing**: xUnit + FluentAssertions + BenchmarkDotNet

### Project Structure
```
Tools/
└── NCList/
    ├── NCList/                          # Main CLI project
    │   ├── Program.cs                   # Entry point, command registration
    │   ├── Commands/
    │   │   ├── ListKeysCommand.cs       # -k implementation
    │   │   ├── ListPromptsCommand.cs    # -p implementation
    │   │   ├── ListInstructionsCommand.cs # -i
    │   │   ├── ListDictionaryCommand.cs # -d
    │   │   ├── GitCommitsCommand.cs     # -g
    │   │   └── WorkspaceStatsCommand.cs # -w
    │   ├── Services/
    │   │   ├── ListingService.cs        # Core listing logic
    │   │   ├── FilteringService.cs      # Glob + fuzzy search
    │   │   ├── GitService.cs            # Git operations
    │   │   ├── CacheService.cs          # Cache management
    │   │   └── OutputFormatters/
    │   │       ├── IOutputFormatter.cs
    │   │       ├── DefaultFormatter.cs
    │   │       ├── JsonFormatter.cs
    │   │       ├── TableFormatter.cs
    │   │       └── CompactFormatter.cs
    │   ├── Models/
    │   │   ├── NCListConfig.cs          # Configuration model
    │   │   ├── ListResult.cs            # Generic result
    │   │   ├── GitCommitInfo.cs         # Git commit data
    │   │   └── CacheEntry.cs            # Cache metadata
    │   ├── Utilities/
    │   │   ├── NaturalSortComparer.cs   # Natural sorting
    │   │   ├── LevenshteinDistance.cs   # Fuzzy matching
    │   │   ├── GlobMatcher.cs           # Glob patterns
    │   │   └── ColorConsole.cs          # ANSI colors
    │   ├── nclist.config.json           # Default config
    │   └── NCList.csproj
    │
    └── NCList.Tests/                    # Test project
        ├── Integration/
        ├── Unit/
        ├── Benchmarks/
        └── NCList.Tests.csproj
```

### Configuration File: `nclist.config.json`
```json
{
  "workspaceRoot": "D:\\PROJECTS\\NOOR CANVAS",
  "cacheDuration": 300,
  "searchPaths": {
    "keys": ".github/key-data-streams",
    "prompts": ".github/prompts",
    "instructions": ".github/instructions",
    "dictionary": ".github/prompts/shared/UserDictionary.md"
  },
  "outputFormats": {
    "default": {
      "useColors": true,
      "showCounts": true,
      "numberedList": true
    },
    "json": {
      "indent": true,
      "camelCase": false
    },
    "table": {
      "border": "markdown",
      "alignLeft": true
    },
    "compact": {
      "separator": ", ",
      "maxLineLength": 120
    }
  },
  "fuzzyMatchThreshold": 2,
  "gitLogFormat": "%h %s - %an (%ar)",
  "cacheDirectory": ".nclist-cache"
}
```

---

## Phase 1: Core CLI Framework

### Objectives
- Create .NET 8 console application structure
- Implement System.CommandLine integration
- Build configuration system with JSON support
- Set up dependency injection container
- Implement colorized console output utilities

### Tasks

#### 1.1 Project Creation
```bash
cd Tools
mkdir NCList
cd NCList
dotnet new console -n NCList -f net8.0
dotnet new xunit -n NCList.Tests -f net8.0
```

#### 1.2 NuGet Package Installation
```xml
<PackageReference Include="System.CommandLine" Version="2.0.0-beta4.22272.1" />
<PackageReference Include="Microsoft.Extensions.Configuration" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.Configuration.Json" Version="8.0.0" />
<PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.1" />
<PackageReference Include="LibGit2Sharp" Version="0.29.0" />
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```

#### 1.3 Program.cs Structure
```csharp
using System.CommandLine;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NCList.Services;
using NCList.Models;
using NCList.Utilities;

namespace NCList;

class Program
{
    static async Task<int> Main(string[] args)
    {
        // Load configuration
        var config = LoadConfiguration();
        
        // Setup DI
        var services = ConfigureServices(config);
        var serviceProvider = services.BuildServiceProvider();
        
        // Build command tree
        var rootCommand = BuildRootCommand(serviceProvider);
        
        // Execute
        return await rootCommand.InvokeAsync(args);
    }
    
    static NCListConfig LoadConfiguration()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("nclist.config.json", optional: false)
            .Build();
            
        return configuration.Get<NCListConfig>() 
            ?? throw new InvalidOperationException("Failed to load configuration");
    }
    
    static IServiceCollection ConfigureServices(NCListConfig config)
    {
        var services = new ServiceCollection();
        services.AddSingleton(config);
        services.AddSingleton<IListingService, ListingService>();
        services.AddSingleton<IFilteringService, FilteringService>();
        services.AddSingleton<IGitService, GitService>();
        services.AddSingleton<ICacheService, CacheService>();
        services.AddSingleton<ColorConsole>();
        
        // Register formatters
        services.AddTransient<IOutputFormatter, DefaultFormatter>();
        services.AddTransient<IOutputFormatter, JsonFormatter>();
        services.AddTransient<IOutputFormatter, TableFormatter>();
        services.AddTransient<IOutputFormatter, CompactFormatter>();
        
        return services;
    }
    
    static RootCommand BuildRootCommand(ServiceProvider serviceProvider)
    {
        var rootCommand = new RootCommand("NCList - NOOR Canvas List Utility");
        
        // Add commands (Phase 2)
        // rootCommand.AddCommand(new ListKeysCommand(serviceProvider));
        // ... etc
        
        return rootCommand;
    }
}
```

#### 1.4 ColorConsole Utility (Enhancement B)
```csharp
namespace NCList.Utilities;

public class ColorConsole
{
    public void WriteTitle(string text)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine($"\n{text}");
        Console.WriteLine(new string('=', text.Length));
        Console.ResetColor();
    }
    
    public void WriteSuccess(string text)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"✅ {text}");
        Console.ResetColor();
    }
    
    public void WriteError(string text)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"❌ {text}");
        Console.ResetColor();
    }
    
    public void WriteInfo(string text)
    {
        Console.ForegroundColor = ConsoleColor.Gray;
        Console.WriteLine($"ℹ️  {text}");
        Console.ResetColor();
    }
    
    public void WriteHighlight(string text)
    {
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.Write(text);
        Console.ResetColor();
    }
}
```

#### 1.5 Configuration Model
```csharp
namespace NCList.Models;

public class NCListConfig
{
    public string WorkspaceRoot { get; set; } = string.Empty;
    public int CacheDuration { get; set; } = 300;
    public SearchPaths SearchPaths { get; set; } = new();
    public OutputFormats OutputFormats { get; set; } = new();
    public int FuzzyMatchThreshold { get; set; } = 2;
    public string GitLogFormat { get; set; } = "%h %s - %an (%ar)";
    public string CacheDirectory { get; set; } = ".nclist-cache";
}

public class SearchPaths
{
    public string Keys { get; set; } = ".github/key-data-streams";
    public string Prompts { get; set; } = ".github/prompts";
    public string Instructions { get; set; } = ".github/instructions";
    public string Dictionary { get; set; } = ".github/prompts/shared/UserDictionary.md";
}

public class OutputFormats
{
    public DefaultFormatConfig Default { get; set; } = new();
    public JsonFormatConfig Json { get; set; } = new();
    public TableFormatConfig Table { get; set; } = new();
    public CompactFormatConfig Compact { get; set; } = new();
}

// ... format config classes
```

### Test Specifications
- Unit tests for configuration loading
- Test invalid config handling
- Test DI container resolution
- Test ColorConsole output (capture console output)

### Acceptance Criteria
- ✅ `nclist --version` displays version
- ✅ `nclist --help` shows usage
- ✅ Configuration loads from nclist.config.json
- ✅ ColorConsole renders ANSI colors correctly
- ✅ All DI services resolve without errors

---

## Phase 2: List Operations

### Objectives
- Implement -k (list keys)
- Implement -p (list prompts)
- Implement -i (list instructions)
- Implement -d (list dictionary)
- Natural sorting algorithm
- Default output formatting

### Tasks

#### 2.1 ListingService Core
```csharp
namespace NCList.Services;

public interface IListingService
{
    Task<ListResult> ListKeysAsync(string? searchTerm = null, string[]? globPatterns = null);
    Task<ListResult> ListPromptsAsync(string? searchTerm = null, string[]? globPatterns = null);
    Task<ListResult> ListInstructionsAsync(string? searchTerm = null, string[]? globPatterns = null);
    Task<ListResult> ListDictionaryAsync(string? searchTerm = null, string[]? globPatterns = null);
}

public class ListingService : IListingService
{
    private readonly NCListConfig _config;
    private readonly IFilteringService _filteringService;
    
    public async Task<ListResult> ListKeysAsync(string? searchTerm, string[]? globPatterns)
    {
        var baseDir = Path.Combine(_config.WorkspaceRoot, _config.SearchPaths.Keys);
        
        // Read all directories
        var allDirs = Directory.GetDirectories(baseDir)
            .Select(Path.GetFileName)
            .Where(name => !string.IsNullOrEmpty(name) && name != "_ARCHIVE")
            .ToList();
        
        // Apply filtering
        var filtered = await _filteringService.ApplyFiltersAsync(
            allDirs, 
            searchTerm, 
            globPatterns
        );
        
        // Natural sort
        var sorted = NaturalSort(filtered);
        
        return new ListResult
        {
            Items = sorted,
            TotalCount = sorted.Count,
            FilterDescription = BuildFilterDescription(searchTerm, globPatterns)
        };
    }
    
    private List<string> NaturalSort(List<string> items)
    {
        return items.OrderBy(x => x, new NaturalSortComparer()).ToList();
    }
}
```

#### 2.2 NaturalSortComparer
```csharp
namespace NCList.Utilities;

public class NaturalSortComparer : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        if (x == y) return 0;
        if (x == null) return -1;
        if (y == null) return 1;
        
        var xSegments = SplitIntoSegments(x);
        var ySegments = SplitIntoSegments(y);
        
        for (int i = 0; i < Math.Max(xSegments.Count, ySegments.Count); i++)
        {
            if (i >= xSegments.Count) return -1;
            if (i >= ySegments.Count) return 1;
            
            var xSeg = xSegments[i];
            var ySeg = ySegments[i];
            
            if (xSeg.IsNumeric && ySeg.IsNumeric)
            {
                var cmp = xSeg.NumericValue.CompareTo(ySeg.NumericValue);
                if (cmp != 0) return cmp;
            }
            else if (!xSeg.IsNumeric && !ySeg.IsNumeric)
            {
                var cmp = string.Compare(xSeg.Value, ySeg.Value, StringComparison.OrdinalIgnoreCase);
                if (cmp != 0) return cmp;
            }
            else
            {
                return xSeg.IsNumeric ? 1 : -1;
            }
        }
        
        return 0;
    }
    
    private List<Segment> SplitIntoSegments(string text)
    {
        // Split into text and numeric segments
        // Example: "test123abc" → [text:"test", num:123, text:"abc"]
    }
}
```

#### 2.3 ListKeysCommand
```csharp
namespace NCList.Commands;

public class ListKeysCommand : Command
{
    public ListKeysCommand(IServiceProvider services) : base("-k", "List all keys")
    {
        var searchArg = new Argument<string?>("search", () => null, "Search term for fuzzy matching");
        var globOptions = new Option<string[]>("--glob", "Glob patterns for filtering") 
        { 
            AllowMultipleArgumentsPerToken = true 
        };
        var formatOption = new Option<OutputFormat>("--format", () => OutputFormat.Default);
        var freshOption = new Option<bool>("--fresh", "Bypass cache");
        
        AddArgument(searchArg);
        AddOption(globOptions);
        AddOption(formatOption);
        AddOption(freshOption);
        
        this.SetHandler(async (search, globs, format, fresh) =>
        {
            var listingService = services.GetRequiredService<IListingService>();
            var formatter = GetFormatter(services, format);
            var colorConsole = services.GetRequiredService<ColorConsole>();
            
            var result = await listingService.ListKeysAsync(search, globs);
            
            formatter.Format(result, colorConsole);
            
        }, searchArg, globOptions, formatOption, freshOption);
    }
}
```

### Test Specifications
- Unit test natural sort with mixed alphanumeric
- Test key listing with _ARCHIVE exclusion
- Test prompt listing with .prompt.md extraction
- Test dictionary parsing with reference extraction
- Integration test end-to-end listing

### Acceptance Criteria
- ✅ `nclist -k` lists all keys alphabetically
- ✅ `nclist -p` lists all prompts
- ✅ `nclist -i` lists all instructions
- ✅ `nclist -d` lists dictionary entries
- ✅ Natural sort handles "key1, key2, key10" correctly
- ✅ Excludes _ARCHIVE and special directories

---

## Phase 3: Filtering & Search

### Objectives
- Implement glob pattern matching with chaining
- Implement fuzzy search (Levenshtein distance ≤ 2)
- Prioritize matches by quality
- Support combined glob + fuzzy filters

### Tasks

#### 3.1 GlobMatcher Utility
```csharp
namespace NCList.Utilities;

public class GlobMatcher
{
    public bool Match(string input, string pattern)
    {
        // Convert glob pattern to regex
        // * → .*
        // ? → .
        // Escape other special chars
        
        var regexPattern = "^" + Regex.Escape(pattern)
            .Replace("\\*", ".*")
            .Replace("\\?", ".") + "$";
            
        return Regex.IsMatch(input, regexPattern, RegexOptions.IgnoreCase);
    }
    
    public bool MatchAll(string input, string[] patterns)
    {
        // AND operation - all patterns must match
        return patterns.All(pattern => Match(input, pattern));
    }
}
```

#### 3.2 LevenshteinDistance Utility
```csharp
namespace NCList.Utilities;

public class LevenshteinDistance
{
    public static int Calculate(string source, string target)
    {
        if (string.IsNullOrEmpty(source))
            return target?.Length ?? 0;
            
        if (string.IsNullOrEmpty(target))
            return source.Length;
            
        var matrix = new int[source.Length + 1, target.Length + 1];
        
        for (int i = 0; i <= source.Length; i++)
            matrix[i, 0] = i;
            
        for (int j = 0; j <= target.Length; j++)
            matrix[0, j] = j;
            
        for (int i = 1; i <= source.Length; i++)
        {
            for (int j = 1; j <= target.Length; j++)
            {
                int cost = (target[j - 1] == source[i - 1]) ? 0 : 1;
                
                matrix[i, j] = Math.Min(
                    Math.Min(
                        matrix[i - 1, j] + 1,      // deletion
                        matrix[i, j - 1] + 1),     // insertion
                    matrix[i - 1, j - 1] + cost);  // substitution
            }
        }
        
        return matrix[source.Length, target.Length];
    }
}
```

#### 3.3 FilteringService
```csharp
namespace NCList.Services;

public interface IFilteringService
{
    Task<List<string>> ApplyFiltersAsync(
        List<string> items, 
        string? searchTerm, 
        string[]? globPatterns);
}

public class FilteringService : IFilteringService
{
    private readonly NCListConfig _config;
    private readonly GlobMatcher _globMatcher;
    
    public async Task<List<string>> ApplyFiltersAsync(
        List<string> items, 
        string? searchTerm, 
        string[]? globPatterns)
    {
        var results = new List<MatchResult>();
        
        foreach (var item in items)
        {
            // Check glob patterns first (if provided)
            if (globPatterns?.Length > 0)
            {
                if (!_globMatcher.MatchAll(item, globPatterns))
                    continue;
            }
            
            // Then fuzzy search (if provided)
            if (!string.IsNullOrEmpty(searchTerm))
            {
                var matchResult = EvaluateFuzzyMatch(item, searchTerm);
                if (matchResult != null)
                    results.Add(matchResult);
            }
            else
            {
                results.Add(new MatchResult 
                { 
                    Item = item, 
                    MatchType = MatchType.NoFilter,
                    Score = 0 
                });
            }
        }
        
        // Sort by match quality
        return results
            .OrderByDescending(r => r.Priority)
            .ThenBy(r => r.Score)
            .ThenBy(r => r.Item)
            .Select(r => r.Item)
            .ToList();
    }
    
    private MatchResult? EvaluateFuzzyMatch(string item, string searchTerm)
    {
        var itemLower = item.ToLowerInvariant();
        var searchLower = searchTerm.ToLowerInvariant();
        
        // Exact match (highest priority)
        if (itemLower == searchLower)
            return new MatchResult 
            { 
                Item = item, 
                MatchType = MatchType.Exact, 
                Score = 0, 
                Priority = 4 
            };
        
        // Fuzzy match (Levenshtein ≤ threshold)
        var distance = LevenshteinDistance.Calculate(itemLower, searchLower);
        if (distance <= _config.FuzzyMatchThreshold)
            return new MatchResult 
            { 
                Item = item, 
                MatchType = MatchType.Fuzzy, 
                Score = distance, 
                Priority = 3 
            };
        
        // Partial match (contains)
        if (itemLower.Contains(searchLower))
        {
            var position = itemLower.IndexOf(searchLower);
            return new MatchResult 
            { 
                Item = item, 
                MatchType = MatchType.Partial, 
                Score = position, 
                Priority = 2 
            };
        }
        
        // Word boundary match
        if (HasWordBoundaryMatch(itemLower, searchLower))
            return new MatchResult 
            { 
                Item = item, 
                MatchType = MatchType.WordBoundary, 
                Score = 0.5, 
                Priority = 1 
            };
        
        return null; // No match
    }
}
```

### Test Specifications
- Unit test glob patterns: `*mcp*`, `/mcp*`, `*test/`
- Unit test glob chaining: `/mcp* /*run*` (AND operation)
- Unit test Levenshtein: "test" vs "tset" = 2
- Unit test fuzzy match prioritization
- Test combined glob + fuzzy filters

### Acceptance Criteria
- ✅ `nclist -k /mcp*` filters keys starting with "mcp"
- ✅ `nclist -k /*mcp*` filters keys containing "mcp"
- ✅ `nclist -k /mcp* /*run*` filters with both patterns
- ✅ `nclist -k zoom` finds "zoom-integration" (fuzzy match)
- ✅ Exact matches appear before fuzzy matches

---

## Phase 4: Git Integration & Workspace Stats

### Objectives
- Implement git commit listing (-g)
- Parse commit messages for key extraction
- Implement workspace statistics (-w)
- Filter commits by key

### Tasks

#### 4.1 GitService
```csharp
namespace NCList.Services;

public interface IGitService
{
    Task<List<GitCommitInfo>> GetRecentCommitsAsync(int count, string? filterKey = null);
}

public class GitService : IGitService
{
    private readonly NCListConfig _config;
    
    public async Task<List<GitCommitInfo>> GetRecentCommitsAsync(int count, string? filterKey)
    {
        using var repo = new Repository(_config.WorkspaceRoot);
        
        var commits = repo.Commits
            .Take(count * 3) // Get extra to account for filtering
            .Select(commit => ParseCommit(commit))
            .Where(info => string.IsNullOrEmpty(filterKey) || info.Key == filterKey)
            .Take(count)
            .ToList();
            
        return commits;
    }
    
    private GitCommitInfo ParseCommit(Commit commit)
    {
        var message = commit.MessageShort;
        
        // Parse patterns: plan(key):, task(key):, drift(key):, ckpt(key):
        var keyMatch = Regex.Match(message, @"^(plan|task|drift|ckpt|todo)\(([^)]+)\):");
        
        return new GitCommitInfo
        {
            Hash = commit.Sha[..7],
            Message = message,
            Author = commit.Author.Name,
            Date = commit.Author.When,
            Key = keyMatch.Success ? keyMatch.Groups[2].Value : null,
            CommitType = keyMatch.Success ? keyMatch.Groups[1].Value : "other"
        };
    }
}
```

#### 4.2 GitCommitsCommand
```csharp
namespace NCList.Commands;

public class GitCommitsCommand : Command
{
    public GitCommitsCommand(IServiceProvider services) : base("-g", "Show git commits")
    {
        var countArg = new Argument<int>("count", () => 10, "Number of commits");
        var keyOption = new Option<string?>("--key", "Filter by key");
        var formatOption = new Option<OutputFormat>("--format");
        
        AddArgument(countArg);
        AddOption(keyOption);
        AddOption(formatOption);
        
        this.SetHandler(async (count, key, format) =>
        {
            var gitService = services.GetRequiredService<IGitService>();
            var formatter = GetFormatter(services, format);
            var colorConsole = services.GetRequiredService<ColorConsole>();
            
            var commits = await gitService.GetRecentCommitsAsync(count, key);
            
            // Format and display
            colorConsole.WriteTitle($"Git Commits (last {count})");
            foreach (var commit in commits)
            {
                colorConsole.WriteHighlight($"{commit.Hash} ");
                Console.Write($"{commit.Message} - {commit.Author} ({commit.Date:yyyy-MM-dd})\n");
            }
            
        }, countArg, keyOption, formatOption);
    }
}
```

#### 4.3 WorkspaceStatsCommand
```csharp
namespace NCList.Commands;

public class WorkspaceStatsCommand : Command
{
    public WorkspaceStatsCommand(IServiceProvider services) : base("-w", "Show workspace statistics")
    {
        this.SetHandler(async () =>
        {
            var listingService = services.GetRequiredService<IListingService>();
            var gitService = services.GetRequiredService<IGitService>();
            var colorConsole = services.GetRequiredService<ColorConsole>();
            
            colorConsole.WriteTitle("Workspace Statistics");
            
            var keys = await listingService.ListKeysAsync();
            var prompts = await listingService.ListPromptsAsync();
            var instructions = await listingService.ListInstructionsAsync();
            var dictionary = await listingService.ListDictionaryAsync();
            var recentCommits = await gitService.GetRecentCommitsAsync(100);
            
            Console.WriteLine($"📁 Keys: {keys.TotalCount}");
            Console.WriteLine($"📝 Prompts: {prompts.TotalCount}");
            Console.WriteLine($"📋 Instructions: {instructions.TotalCount}");
            Console.WriteLine($"📖 Dictionary Entries: {dictionary.TotalCount}");
            Console.WriteLine($"🔀 Recent Commits (100): {recentCommits.Count}");
            
            var commitsByType = recentCommits
                .GroupBy(c => c.CommitType)
                .OrderByDescending(g => g.Count())
                .Take(5);
                
            Console.WriteLine("\nTop Commit Types:");
            foreach (var group in commitsByType)
            {
                Console.WriteLine($"  {group.Key}: {group.Count()}");
            }
        });
    }
}
```

### Test Specifications
- Unit test commit message parsing
- Test key extraction from various patterns
- Test git log retrieval
- Integration test with real git repository

### Acceptance Criteria
- ✅ `nclist -g 10` shows last 10 commits
- ✅ `nclist -g 20 --key=nclist-cli-utility` filters by key
- ✅ Commit messages parsed correctly
- ✅ `nclist -w` shows workspace statistics
- ✅ Statistics include keys, prompts, instructions, dictionary, commits

---

## Phase 5: Output Formatters

### Objectives
- Implement JSON formatter
- Implement table formatter (markdown tables)
- Implement compact formatter
- Apply colorization to default formatter (Enhancement B)

### Tasks

#### 5.1 IOutputFormatter Interface
```csharp
namespace NCList.Services.OutputFormatters;

public interface IOutputFormatter
{
    OutputFormat Format { get; }
    void Format(ListResult result, ColorConsole console);
}
```

#### 5.2 DefaultFormatter (with colors)
```csharp
public class DefaultFormatter : IOutputFormatter
{
    public OutputFormat Format => OutputFormat.Default;
    
    public void Format(ListResult result, ColorConsole console)
    {
        var title = $"{result.Category}";
        if (!string.IsNullOrEmpty(result.FilterDescription))
            title += $" (filtered by {result.FilterDescription})";
            
        console.WriteTitle(title);
        
        if (result.Items.Count == 0)
        {
            console.WriteInfo("No items found");
            return;
        }
        
        console.WriteInfo($"Total: {result.TotalCount}");
        Console.WriteLine();
        
        for (int i = 0; i < result.Items.Count; i++)
        {
            console.WriteHighlight($"{i + 1}. ");
            Console.WriteLine(result.Items[i]);
        }
    }
}
```

#### 5.3 JsonFormatter
```csharp
public class JsonFormatter : IOutputFormatter
{
    public OutputFormat Format => OutputFormat.Json;
    
    public void Format(ListResult result, ColorConsole console)
    {
        var json = JsonConvert.SerializeObject(result, Formatting.Indented);
        Console.WriteLine(json);
    }
}
```

#### 5.4 TableFormatter
```csharp
public class TableFormatter : IOutputFormatter
{
    public OutputFormat Format => OutputFormat.Table;
    
    public void Format(ListResult result, ColorConsole console)
    {
        console.WriteTitle(result.Category);
        
        // Markdown table
        Console.WriteLine("| # | Item |");
        Console.WriteLine("|---|------|");
        
        for (int i = 0; i < result.Items.Count; i++)
        {
            Console.WriteLine($"| {i + 1} | {result.Items[i]} |");
        }
        
        Console.WriteLine();
        console.WriteInfo($"Total: {result.TotalCount}");
    }
}
```

#### 5.5 CompactFormatter
```csharp
public class CompactFormatter : IOutputFormatter
{
    public OutputFormat Format => OutputFormat.Compact;
    
    public void Format(ListResult result, ColorConsole console)
    {
        console.WriteTitle($"{result.Category} ({result.TotalCount})");
        
        var line = string.Join(", ", result.Items);
        
        // Wrap at maxLineLength
        var maxLen = 120;
        for (int i = 0; i < line.Length; i += maxLen)
        {
            var chunk = line.Substring(i, Math.Min(maxLen, line.Length - i));
            Console.WriteLine(chunk);
        }
    }
}
```

### Test Specifications
- Unit test each formatter with sample data
- Test JSON serialization
- Test table markdown generation
- Test compact line wrapping
- Validate color output (manual visual test)

### Acceptance Criteria
- ✅ `nclist -k --format json` outputs JSON
- ✅ `nclist -k --format table` outputs markdown table
- ✅ `nclist -k --format compact` outputs comma-separated
- ✅ Default format uses ANSI colors correctly
- ✅ All formatters handle empty results gracefully

---

## Phase 6: Caching System

### Objectives
- Implement file-based JSON cache
- TTL-based cache invalidation (5 minutes default)
- --fresh option to bypass cache
- Cache key generation from parameters

### Tasks

#### 6.1 CacheService
```csharp
namespace NCList.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string cacheKey);
    Task SetAsync<T>(string cacheKey, T value, int ttlSeconds);
    Task ClearAsync(string? pattern = null);
}

public class CacheService : ICacheService
{
    private readonly NCListConfig _config;
    private readonly string _cacheDir;
    
    public CacheService(NCListConfig config)
    {
        _config = config;
        _cacheDir = Path.Combine(
            _config.WorkspaceRoot, 
            _config.CacheDirectory
        );
        Directory.CreateDirectory(_cacheDir);
    }
    
    public async Task<T?> GetAsync<T>(string cacheKey)
    {
        var filePath = GetCachePath(cacheKey);
        
        if (!File.Exists(filePath))
            return default;
        
        var json = await File.ReadAllTextAsync(filePath);
        var entry = JsonConvert.DeserializeObject<CacheEntry<T>>(json);
        
        if (entry == null || entry.ExpiresAt < DateTime.UtcNow)
        {
            File.Delete(filePath);
            return default;
        }
        
        return entry.Value;
    }
    
    public async Task SetAsync<T>(string cacheKey, T value, int ttlSeconds)
    {
        var entry = new CacheEntry<T>
        {
            Value = value,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddSeconds(ttlSeconds)
        };
        
        var json = JsonConvert.SerializeObject(entry, Formatting.Indented);
        var filePath = GetCachePath(cacheKey);
        
        await File.WriteAllTextAsync(filePath, json);
    }
    
    public async Task ClearAsync(string? pattern = null)
    {
        if (string.IsNullOrEmpty(pattern))
        {
            // Clear all cache
            Directory.Delete(_cacheDir, recursive: true);
            Directory.CreateDirectory(_cacheDir);
        }
        else
        {
            // Clear matching files
            var files = Directory.GetFiles(_cacheDir, $"{pattern}*.json");
            foreach (var file in files)
                File.Delete(file);
        }
    }
    
    private string GetCachePath(string cacheKey)
    {
        var safeKey = string.Join("_", cacheKey.Split(Path.GetInvalidFileNameChars()));
        return Path.Combine(_cacheDir, $"{safeKey}.json");
    }
}
```

#### 6.2 Cache Integration in ListingService
```csharp
public async Task<ListResult> ListKeysAsync(
    string? searchTerm, 
    string[]? globPatterns,
    bool bypassCache = false)
{
    var cacheKey = GenerateCacheKey("keys", searchTerm, globPatterns);
    
    if (!bypassCache)
    {
        var cached = await _cacheService.GetAsync<ListResult>(cacheKey);
        if (cached != null)
            return cached;
    }
    
    // Execute query
    var result = await ExecuteListKeysQuery(searchTerm, globPatterns);
    
    // Cache result
    await _cacheService.SetAsync(cacheKey, result, _config.CacheDuration);
    
    return result;
}

private string GenerateCacheKey(string category, string? searchTerm, string[]? globPatterns)
{
    var parts = new List<string> { category };
    
    if (!string.IsNullOrEmpty(searchTerm))
        parts.Add($"search={searchTerm}");
        
    if (globPatterns?.Length > 0)
        parts.Add($"glob={string.Join("|", globPatterns)}");
        
    return string.Join("_", parts);
}
```

#### 6.3 ClearCacheCommand
```csharp
public class ClearCacheCommand : Command
{
    public ClearCacheCommand(IServiceProvider services) : base("clear-cache", "Clear cache")
    {
        var patternOption = new Option<string?>("--pattern", "Pattern to match");
        AddOption(patternOption);
        
        this.SetHandler(async (pattern) =>
        {
            var cacheService = services.GetRequiredService<ICacheService>();
            var colorConsole = services.GetRequiredService<ColorConsole>();
            
            await cacheService.ClearAsync(pattern);
            
            colorConsole.WriteSuccess(
                string.IsNullOrEmpty(pattern) 
                    ? "Cache cleared" 
                    : $"Cache cleared (pattern: {pattern})"
            );
            
        }, patternOption);
    }
}
```

### Test Specifications
- Unit test cache CRUD operations
- Test TTL expiration
- Test cache key generation
- Test --fresh bypass
- Integration test cache hit/miss performance

### Acceptance Criteria
- ✅ First run caches results
- ✅ Second run retrieves from cache (within 5 min)
- ✅ After 5 min, cache expires and refreshes
- ✅ `nclist -k --fresh` bypasses cache
- ✅ `nclist clear-cache` clears all cache
- ✅ `nclist clear-cache --pattern=keys` clears specific cache

---

## Phase 7: Testing, Documentation & Publishing

### Objectives
- Create comprehensive test suite
- Performance benchmarking (Enhancement C)
- Single-file executable publishing (Enhancement A)
- README documentation
- Build/publish scripts

### Tasks

#### 7.1 Unit Tests
```csharp
// NCList.Tests/Unit/NaturalSortComparerTests.cs
public class NaturalSortComparerTests
{
    [Theory]
    [InlineData(new[] { "key1", "key10", "key2" }, new[] { "key1", "key2", "key10" })]
    [InlineData(new[] { "test-123", "test-12", "test-2" }, new[] { "test-2", "test-12", "test-123" })]
    public void SortNaturally_MixedAlphanumeric_SortsCorrectly(string[] input, string[] expected)
    {
        var comparer = new NaturalSortComparer();
        var result = input.OrderBy(x => x, comparer).ToArray();
        
        result.Should().Equal(expected);
    }
}

// NCList.Tests/Unit/LevenshteinDistanceTests.cs
public class LevenshteinDistanceTests
{
    [Theory]
    [InlineData("test", "test", 0)]
    [InlineData("test", "tset", 2)]
    [InlineData("zoom", "room", 1)]
    public void Calculate_ReturnsCorrectDistance(string a, string b, int expected)
    {
        var distance = LevenshteinDistance.Calculate(a, b);
        distance.Should().Be(expected);
    }
}

// NCList.Tests/Unit/GlobMatcherTests.cs
public class GlobMatcherTests
{
    [Theory]
    [InlineData("mcp-test", "/mcp*", true)]
    [InlineData("test-mcp", "/*mcp*", true)]
    [InlineData("mcp-run", "/mcp* /*run*", true)]
    [InlineData("mcp-test", "/*run*", false)]
    public void Match_GlobPatterns_WorksCorrectly(string input, string pattern, bool expected)
    {
        var matcher = new GlobMatcher();
        var patterns = pattern.Split(' ');
        
        var result = matcher.MatchAll(input, patterns);
        result.Should().Be(expected);
    }
}
```

#### 7.2 Integration Tests
```csharp
// NCList.Tests/Integration/EndToEndTests.cs
public class EndToEndTests
{
    [Fact]
    public async Task ListKeys_NoFilters_ReturnsAllKeys()
    {
        // Arrange
        var services = BuildTestServices();
        var listingService = services.GetRequiredService<IListingService>();
        
        // Act
        var result = await listingService.ListKeysAsync();
        
        // Assert
        result.Items.Should().NotBeEmpty();
        result.Items.Should().BeInAscendingOrder(new NaturalSortComparer());
    }
    
    [Fact]
    public async Task ListKeys_WithGlobFilter_FiltersCorrectly()
    {
        var services = BuildTestServices();
        var listingService = services.GetRequiredService<IListingService>();
        
        var result = await listingService.ListKeysAsync(
            searchTerm: null, 
            globPatterns: new[] { "/mcp*" }
        );
        
        result.Items.Should().OnlyContain(k => k.StartsWith("mcp"));
    }
}
```

#### 7.3 Performance Benchmarks (Enhancement C)
```csharp
// NCList.Tests/Benchmarks/CacheBenchmarks.cs
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]
public class CacheBenchmarks
{
    private IServiceProvider _services;
    private IListingService _listingService;
    
    [GlobalSetup]
    public void Setup()
    {
        _services = BuildTestServices();
        _listingService = _services.GetRequiredService<IListingService>();
    }
    
    [Benchmark]
    public async Task ListKeys_CacheMiss()
    {
        await _listingService.ListKeysAsync(bypassCache: true);
    }
    
    [Benchmark]
    public async Task ListKeys_CacheHit()
    {
        await _listingService.ListKeysAsync(bypassCache: false);
    }
}

// Expected results:
// CacheMiss: ~50-100ms (file system I/O)
// CacheHit: ~1-5ms (JSON deserialize)
// 10-20x performance improvement
```

#### 7.4 Single-File Executable Publishing (Enhancement A)
```powershell
# Tools/NCList/publish.ps1
param(
    [string]$Runtime = "win-x64",
    [string]$OutputDir = "publish"
)

Write-Host "Publishing NCList for $Runtime..." -ForegroundColor Cyan

dotnet publish NCList/NCList.csproj `
    -c Release `
    -r $Runtime `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o $OutputDir/$Runtime

Write-Host "✅ Published to $OutputDir/$Runtime/nclist.exe" -ForegroundColor Green

# Copy config
Copy-Item "NCList/nclist.config.json" "$OutputDir/$Runtime/"

Write-Host "
📦 Distribution Package:
   - nclist.exe (single-file, ~15MB)
   - nclist.config.json (configuration)
   
🚀 Usage:
   .\nclist.exe -k
   .\nclist.exe -p /plan*
   .\nclist.exe -g 10
" -ForegroundColor Cyan
```

#### 7.5 README.md
```markdown
# NCList - NOOR Canvas List Utility

Fast CLI tool for workspace resource discovery with glob filtering, fuzzy search, and git integration.

## Installation

### Option 1: Single-File Executable (Recommended)
1. Download `nclist.exe` from releases
2. Copy `nclist.config.json` to same directory
3. Edit `workspaceRoot` in config to point to your workspace

### Option 2: Build from Source
```powershell
cd Tools/NCList
dotnet build -c Release
```

## Configuration

Edit `nclist.config.json`:
```json
{
  "workspaceRoot": "D:\\PROJECTS\\NOOR CANVAS",
  "cacheDuration": 300,
  ...
}
```

## Usage

### List Keys
```bash
nclist -k                  # All keys
nclist -k zoom             # Fuzzy search
nclist -k /mcp*            # Glob filter
nclist -k /mcp* /*run*     # Multiple globs (AND)
```

### List Prompts
```bash
nclist -p                  # All prompts
nclist -p /plan*           # Starting with "plan"
nclist -p /*task*          # Containing "task"
```

### List Instructions
```bash
nclist -i                  # All instructions
```

### List Dictionary
```bash
nclist -d                  # All entries
nclist -d host             # Search for "host"
```

### Git Commits
```bash
nclist -g 10               # Last 10 commits
nclist -g 20 --key=nclist  # Filter by key
```

### Workspace Statistics
```bash
nclist -w                  # Show stats
```

### Output Formats
```bash
nclist -k --format json    # JSON output
nclist -k --format table   # Markdown table
nclist -k --format compact # Compact comma-separated
```

### Cache Control
```bash
nclist -k --fresh          # Bypass cache
nclist clear-cache         # Clear all cache
nclist clear-cache --pattern=keys  # Clear specific
```

## Features

✅ Natural sorting (key1, key2, key10)  
✅ Glob pattern filtering with chaining  
✅ Fuzzy search (Levenshtein distance ≤ 2)  
✅ Git integration with commit parsing  
✅ File-based caching (5-min TTL)  
✅ Multiple output formats  
✅ Colorized console output  
✅ Single-file executable  

## Performance

- **Without cache**: ~50-100ms (file system I/O)
- **With cache**: ~1-5ms (JSON deserialize)
- **10-20x speedup** for repeated queries

## Testing

```powershell
# Unit tests
dotnet test NCList.Tests

# Benchmarks
dotnet run -p NCList.Tests/Benchmarks --configuration Release
```

## Build Scripts

```powershell
# Publish single-file executable
.\publish.ps1 -Runtime win-x64

# Cross-platform
.\publish.ps1 -Runtime linux-x64
.\publish.ps1 -Runtime osx-x64
```
```

#### 7.6 Build Task for VS Code
```json
// .vscode/tasks.json (add to existing)
{
  "label": "build-nclist",
  "type": "shell",
  "command": "dotnet",
  "args": [
    "build",
    "${workspaceFolder}/Tools/NCList/NCList/NCList.csproj",
    "/property:GenerateFullPaths=true"
  ],
  "group": "build"
},
{
  "label": "publish-nclist",
  "type": "shell",
  "command": "powershell.exe",
  "args": [
    "-File",
    "${workspaceFolder}/Tools/NCList/publish.ps1"
  ],
  "group": "build"
}
```

### Test Specifications
- All unit tests passing
- All integration tests passing
- Performance benchmarks show 10x+ cache improvement
- Single-file exe < 20MB
- README examples all work

### Acceptance Criteria
- ✅ Complete test suite with >80% coverage
- ✅ Performance benchmarks documented
- ✅ Single-file executable publishes successfully
- ✅ README complete with all examples
- ✅ Build scripts functional
- ✅ All functionality from list.prompt.md implemented

---

## Rollback Plan

### Phase-by-Phase Rollback
Each phase is independent - rollback by:
1. Revert commits for that phase
2. Remove added files
3. Restore previous state

### Complete Rollback
```powershell
# Delete project
Remove-Item -Recurse "Tools/NCList"

# Revert all commits
git revert <commit-range>
```

---

## Post-Implementation Validation

### Functional Testing
- [ ] All commands execute without errors
- [ ] Glob filtering works as documented
- [ ] Fuzzy search finds similar terms
- [ ] Git integration parses commits correctly
- [ ] Cache improves performance measurably
- [ ] Output formatters produce correct output
- [ ] Configuration loads from JSON

### Performance Testing
- [ ] Cache benchmarks show >10x improvement
- [ ] Large workspaces (1000+ keys) perform well
- [ ] Memory usage stays reasonable (<100MB)

### Integration Testing
- [ ] Works with actual NOOR CANVAS workspace
- [ ] Handles missing directories gracefully
- [ ] Invalid config produces helpful errors
- [ ] Cross-platform compatibility (if applicable)

---

## File Inventory

### Core Application
- `Tools/NCList/NCList/Program.cs`
- `Tools/NCList/NCList/NCList.csproj`
- `Tools/NCList/NCList/nclist.config.json`

### Commands
- `Tools/NCList/NCList/Commands/ListKeysCommand.cs`
- `Tools/NCList/NCList/Commands/ListPromptsCommand.cs`
- `Tools/NCList/NCList/Commands/ListInstructionsCommand.cs`
- `Tools/NCList/NCList/Commands/ListDictionaryCommand.cs`
- `Tools/NCList/NCList/Commands/GitCommitsCommand.cs`
- `Tools/NCList/NCList/Commands/WorkspaceStatsCommand.cs`
- `Tools/NCList/NCList/Commands/ClearCacheCommand.cs`

### Services
- `Tools/NCList/NCList/Services/IListingService.cs`
- `Tools/NCList/NCList/Services/ListingService.cs`
- `Tools/NCList/NCList/Services/IFilteringService.cs`
- `Tools/NCList/NCList/Services/FilteringService.cs`
- `Tools/NCList/NCList/Services/IGitService.cs`
- `Tools/NCList/NCList/Services/GitService.cs`
- `Tools/NCList/NCList/Services/ICacheService.cs`
- `Tools/NCList/NCList/Services/CacheService.cs`

### Output Formatters
- `Tools/NCList/NCList/Services/OutputFormatters/IOutputFormatter.cs`
- `Tools/NCList/NCList/Services/OutputFormatters/DefaultFormatter.cs`
- `Tools/NCList/NCList/Services/OutputFormatters/JsonFormatter.cs`
- `Tools/NCList/NCList/Services/OutputFormatters/TableFormatter.cs`
- `Tools/NCList/NCList/Services/OutputFormatters/CompactFormatter.cs`

### Utilities
- `Tools/NCList/NCList/Utilities/NaturalSortComparer.cs`
- `Tools/NCList/NCList/Utilities/LevenshteinDistance.cs`
- `Tools/NCList/NCList/Utilities/GlobMatcher.cs`
- `Tools/NCList/NCList/Utilities/ColorConsole.cs`

### Models
- `Tools/NCList/NCList/Models/NCListConfig.cs`
- `Tools/NCList/NCList/Models/ListResult.cs`
- `Tools/NCList/NCList/Models/GitCommitInfo.cs`
- `Tools/NCList/NCList/Models/CacheEntry.cs`
- `Tools/NCList/NCList/Models/MatchResult.cs`
- `Tools/NCList/NCList/Models/Segment.cs`

### Tests
- `Tools/NCList/NCList.Tests/Unit/NaturalSortComparerTests.cs`
- `Tools/NCList/NCList.Tests/Unit/LevenshteinDistanceTests.cs`
- `Tools/NCList/NCList.Tests/Unit/GlobMatcherTests.cs`
- `Tools/NCList/NCList.Tests/Unit/FilteringServiceTests.cs`
- `Tools/NCList/NCList.Tests/Integration/EndToEndTests.cs`
- `Tools/NCList/NCList.Tests/Integration/CacheTests.cs`
- `Tools/NCList/NCList.Tests/Benchmarks/CacheBenchmarks.cs`
- `Tools/NCList/NCList.Tests/NCList.Tests.csproj`

### Scripts & Documentation
- `Tools/NCList/publish.ps1`
- `Tools/NCList/README.md`
- `.vscode/tasks.json` (additions)

---

## Success Metrics

### Functional
- ✅ All list.prompt.md functionality replicated
- ✅ <5ms response time with cache
- ✅ <100ms response time without cache
- ✅ 100% feature parity with list.prompt.md

### Quality
- ✅ >80% code coverage
- ✅ All tests passing
- ✅ Zero critical bugs
- ✅ Clean code (no warnings)

### Usability
- ✅ Single-file executable <20MB
- ✅ Configuration externalized
- ✅ Colorized output for better UX
- ✅ Comprehensive README

---

## Dependencies

### NuGet Packages
- System.CommandLine (2.0.0-beta4.22272.1)
- Microsoft.Extensions.Configuration (8.0.0)
- Microsoft.Extensions.Configuration.Json (8.0.0)
- Microsoft.Extensions.DependencyInjection (8.0.1)
- LibGit2Sharp (0.29.0)
- Newtonsoft.Json (13.0.3)
- xUnit (2.4.2) - Testing
- FluentAssertions (6.12.0) - Testing
- BenchmarkDotNet (0.13.10) - Benchmarking

### System Requirements
- .NET 8.0 Runtime
- Windows 10+ (for win-x64 build)
- Git repository (for -g command)

---

## Timeline Estimate

- **Phase 1**: 4-6 hours (Core framework + config)
- **Phase 2**: 6-8 hours (List operations + natural sort)
- **Phase 3**: 8-10 hours (Filtering + fuzzy search)
- **Phase 4**: 4-6 hours (Git integration + stats)
- **Phase 5**: 4-6 hours (Output formatters)
- **Phase 6**: 6-8 hours (Caching system)
- **Phase 7**: 8-10 hours (Testing + docs + publishing)

**Total**: 40-54 hours (~5-7 days for one developer)

---

## Plan Version History

### v1.0 (2025-10-26)
- Initial plan created
- 7 phases defined
- Enhancements A, B, C selected (single-file exe, colors, benchmarks)
- Complete technical specifications
- Test strategies defined
