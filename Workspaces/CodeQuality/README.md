# Code Quality Analysis - Roslynator Configuration

This folder contains all Roslynator code analysis data, keeping the repository root clean and organized.

## 📁 Folder Structure

```
Workspaces/CodeQuality/
├── Roslynator/
│   ├── Config/               # Configuration files
│   │   └── roslynator.config # Main Roslynator configuration
│   ├── Reports/              # Analysis reports
│   │   ├── latest-analysis.json    # Most recent analysis (GitLab format)
│   │   └── analysis_YYYY-MM-DD_HH-mm-ss.json  # Timestamped reports
│   └── Logs/                 # Detailed execution logs
│       ├── latest-analysis.log     # Most recent log
│       └── analysis_YYYY-MM-DD_HH-mm-ss.log   # Timestamped logs
├── run-roslynator.ps1        # Analysis execution script
└── README.md                 # This documentation
```

## 🚀 Quick Start

### Run Analysis
```powershell
# From repository root
.\Workspaces\CodeQuality\run-roslynator.ps1

# With report auto-open
.\Workspaces\CodeQuality\run-roslynator.ps1 -OpenReport

# Custom severity level
.\Workspaces\CodeQuality\run-roslynator.ps1 -SeverityLevel "warning"
```

### View Latest Results
```powershell
# Open latest report in VS Code
code .\Workspaces\CodeQuality\Roslynator\Reports\latest-analysis.json

# View latest log
code .\Workspaces\CodeQuality\Roslynator\Logs\latest-analysis.log
```

## 📊 Report Formats

### GitLab Code Climate Format (JSON)
- **File**: `Reports/latest-analysis.json`
- **Use**: CI/CD integration, detailed issue tracking
- **Features**: Issue fingerprinting, severity levels, file locations

### Log Files
- **File**: `Logs/latest-analysis.log`
- **Use**: Debugging, performance analysis
- **Features**: Detailed execution information, timing metrics

## 🔧 Configuration

### Main Config File
- **Location**: `Config/roslynator.config`
- **Features**: 
  - Output paths configured to use Workspaces folder
  - GitLab format for structured reporting
  - Detailed logging enabled
  - Execution time metrics included

### Script Parameters
The `run-roslynator.ps1` script accepts:
- `-SeverityLevel`: info, warning, error (default: info)
- `-OutputFormat`: gitlab, xml (default: gitlab)
- `-OpenReport`: Automatically open report in VS Code
- `-ExecutionTime`: Include timing metrics (default: true)

## 📈 Health Metrics Available

1. **Issue Counts**: Total, by severity, by category
2. **File Hotspots**: Files with most issues
3. **Rule Violations**: Most common rule violations
4. **Trend Analysis**: Compare reports over time
5. **Performance**: Analysis execution time and memory usage

## 🎯 Integration with VS Code

### Tasks
Add to `.vscode/tasks.json`:
```json
{
    "label": "Run Roslynator Analysis",
    "type": "shell",
    "command": "powershell.exe",
    "args": [
        "-ExecutionPolicy", "Bypass", 
        "-File", "${workspaceFolder}/Workspaces/CodeQuality/run-roslynator.ps1"
    ],
    "group": "test",
    "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
    }
}
```

### Settings
Add to `.vscode/settings.json`:
```json
{
    "roslynator.analysisLevel": "complete",
    "roslynator.suppressAnalysisResults": false
}
```

## 🧹 Cleanup

### Automatic Cleanup
The script maintains:
- Latest report and log (always available)
- Historical reports with timestamps (manual cleanup)

### Manual Cleanup
```powershell
# Remove old reports (keep last 10)
Get-ChildItem .\Workspaces\CodeQuality\Roslynator\Reports\analysis_*.json | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 10 | 
    Remove-Item

# Remove old logs (keep last 10)  
Get-ChildItem .\Workspaces\CodeQuality\Roslynator\Logs\analysis_*.log | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 10 | 
    Remove-Item
```

## 💡 Best Practices

1. **Regular Analysis**: Run before commits and PRs
2. **Trend Tracking**: Compare reports to track improvement
3. **CI Integration**: Use GitLab format for automated quality gates
4. **Issue Prioritization**: Focus on critical/major issues first
5. **Documentation**: Keep this README updated with configuration changes

## 📝 Notes

- All Roslynator data is now isolated to `Workspaces/CodeQuality/`
- No Roslynator files should appear in the repository root
- Reports use GitLab Code Climate format for maximum compatibility
- Logs include detailed timing and execution information for performance analysis