# KDS Dashboard - Health Check Integration Guide

**Version:** 1.0  
**Last Updated:** 2025-11-03  
**Status:** ✅ COMPLETE

---

## 🎯 Overview

The KDS Dashboard can run health checks in **two modes**:

1. **🔗 Live Mode (API Server)** - Real health checks via PowerShell scripts
2. **🎮 Demo Mode (Fallback)** - Simulated checks for demonstration

The dashboard automatically detects if the API server is running and falls back to demo mode if not available.

---

## 🚀 Quick Start (Live Mode)

### Step 1: Start the API Server

**Option A: VS Code Task**
```
Ctrl+Shift+P → Tasks: Run Task → "kds: start api server"
```

**Option B: PowerShell**
```powershell
.\KDS\scripts\dashboard-api-server.ps1

# Custom port
.\KDS\scripts\dashboard-api-server.ps1 -Port 9000
```

### Step 2: Open the Dashboard

```
Ctrl+Shift+P → Tasks: Run Task → "kds: health dashboard"
```

### Step 3: Run Health Checks

1. Click "🔄 Refresh" button in header
2. Or switch to "❤️ Health Checks" tab
3. Dashboard will automatically call API server
4. Watch real checks run with live results

**Status Indicator:**
- Header shows "🔗 Live" when API server is connected
- Header shows "🎮 Demo" when in fallback mode

---

## 📡 API Server

### What It Does

The API server (`dashboard-api-server.ps1`) provides HTTP endpoints that execute PowerShell health check scripts and return JSON results.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Server status check |
| `/api/health` | GET | Run all health checks |
| `/api/health/infrastructure` | GET | Run infrastructure checks only |
| `/api/health/agents` | GET | Run agents & prompts checks |
| `/api/health/brain` | GET | Run BRAIN system checks |
| `/api/health/sessions` | GET | Run session state checks |
| `/api/health/knowledge` | GET | Run knowledge base checks |
| `/api/health/scripts` | GET | Run scripts & tools checks |
| `/api/health/performance` | GET | Run performance checks |

### Example Request

```bash
# Check server status
curl http://localhost:8765/api/status

# Run all health checks
curl http://localhost:8765/api/health

# Run specific category
curl http://localhost:8765/api/health/brain
```

### Example Response

```json
{
  "timestamp": "2025-11-03T14:30:00",
  "overallStatus": "HEALTHY",
  "stats": {
    "totalChecks": 39,
    "passed": 35,
    "warnings": 3,
    "critical": 1
  },
  "categories": [
    {
      "id": "infrastructure",
      "name": "Infrastructure",
      "icon": "🏗️",
      "checks": [
        {
          "name": "Directory Structure",
          "status": "passed",
          "message": "All required directories exist",
          "timestamp": "2025-11-03T14:30:01"
        }
      ]
    }
  ],
  "recommendations": [
    {
      "category": "BRAIN System",
      "check": "Anomaly Queue",
      "action": "Run: .\\KDS\\scripts\\manage-anomalies.ps1 -Mode review"
    }
  ]
}
```

---

## 🔧 Health Check Script

### What It Does

The health check script (`run-health-checks.ps1`) executes comprehensive system validation across 7 categories and 39+ individual checks.

### Usage

```powershell
# Run all checks (JSON output)
.\KDS\scripts\run-health-checks.ps1

# Run specific category
.\KDS\scripts\run-health-checks.ps1 -Category brain

# Text output for humans
.\KDS\scripts\run-health-checks.ps1 -OutputFormat text

# Verbose mode
.\KDS\scripts\run-health-checks.ps1 -Verbose
```

### Categories & Checks

#### 1. 🏗️ Infrastructure (6 checks)
- **Directory Structure** - Verifies all KDS directories exist
- **Core Files Present** - Checks essential files (README, DESIGN, dashboard)
- **Config Validation** - Validates `kds.config.json` if present
- **Permissions Check** - Tests read/write permissions
- **Git Integration** - Checks git repository status
- **PowerShell Version** - Verifies PowerShell ≥ 7.0

#### 2. 🤖 Agents & Prompts (7 checks)
- **Intent Router** - `intent-router.md` accessible
- **Work Planner** - `work-planner.md` valid
- **Code Executor** - `code-executor.md` valid
- **Test Generator** - `test-generator.md` valid
- **Health Validator** - `health-validator.md` valid
- **Change Governor** - `change-governor.md` valid
- **Shared Modules** - All shared/*.md files loadable

#### 3. 🧠 BRAIN System (6 checks)
- **Knowledge Graph** - `knowledge-graph.yaml` exists & valid
- **Event Stream** - `events.jsonl` integrity check
- **Pattern Recognition** - Counts learned patterns
- **Protection Scripts** - All 3 protection scripts present
- **Anomaly Queue** - Pending anomalies < 10
- **Update Freshness** - Last update < 24 hours

#### 4. 📊 Session State (5 checks)
- **Current Session** - `current-session.json` valid
- **Session History** - `session-history.json` valid
- **Resumption Guide** - `resumption-guide.md` current
- **No Orphaned Sessions** - Validates session states
- **Session Limit** - Active sessions < 20

#### 5. 📚 Knowledge Base (5 checks)
- **Test Patterns** - Test pattern directory accessible
- **UI Mappings** - UI element mappings complete
- **Published Workflows** - Workflow patterns valid
- **Update Requests** - Pending requests < 5
- **Cross-References** - All references resolved

#### 6. 🔧 Scripts & Tools (5 checks)
- **PowerShell Executable** - Scripts have execute permissions
- **Conversation STM** - `conversation-stm.ps1` working
- **BRAIN Updater** - `brain-updater.md` accessible
- **Monitoring Scripts** - Dashboard scripts runnable
- **Maintenance Tools** - Maintenance scripts tested

#### 7. ⚡ Performance (5 checks)
- **BRAIN Query Time** - Average query < 500ms
- **Session Load Time** - Session loading < 200ms
- **Event Log Size** - `events.jsonl` < 10MB
- **Knowledge Graph Size** - `knowledge-graph.yaml` < 5MB
- **Memory Usage** - No memory leaks detected

---

## 🎨 Dashboard Integration

### How It Works

```javascript
// 1. Dashboard tries to connect to API server
const response = await fetch('http://localhost:8765/api/health');

// 2. If successful, parse and display real results
const data = await response.json();
updateUI(data);

// 3. If failed, fall back to demo mode
state.apiMode = 'demo';
runDemoChecks();
```

### Auto-Detection

The dashboard automatically detects the API mode:

```javascript
// Dashboard startup
if (state.apiMode === 'server') {
  try {
    await fetch(`${state.apiUrl}/api/status`);
    // API available - use live mode
  } catch (error) {
    // API not available - use demo mode
    state.apiMode = 'demo';
  }
}
```

### Mode Indicator

The header shows the current mode:
- **🔗 Live** - Connected to API server, real health checks
- **🎮 Demo** - Fallback mode, simulated checks

---

## 📊 Status Codes

### Check Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| `pending` | Gray | ○ | Check not started |
| `running` | Blue | ◐ | Check in progress |
| `passed` | Green | ● | Check successful |
| `warning` | Orange | ● | Check passed with warnings |
| `critical` | Red | ● | Check failed |

### Overall Status

| Status | Condition |
|--------|-----------|
| `HEALTHY` | No warnings or critical issues |
| `DEGRADED` | One or more warnings |
| `CRITICAL` | One or more critical failures |

---

## 🛠️ Troubleshooting

### Problem: Dashboard Shows "🎮 Demo Mode"

**Cause:** API server is not running

**Solution:**
```powershell
# Start API server
.\KDS\scripts\dashboard-api-server.ps1

# Or use VS Code task
Ctrl+Shift+P → "kds: start api server"
```

### Problem: API Server Won't Start

**Error:** `Port 8765 already in use`

**Solution:**
```powershell
# Use different port
.\KDS\scripts\dashboard-api-server.ps1 -Port 9000

# Update dashboard apiUrl in kds-dashboard.html:
state.apiUrl = 'http://localhost:9000'
```

### Problem: CORS Errors in Browser Console

**Cause:** Browser security restrictions

**Solution:**
- API server already includes CORS headers
- Make sure you're accessing dashboard via file:// or localhost
- Check browser console for specific error

### Problem: Health Checks Timeout

**Cause:** Large knowledge graph or slow disk

**Solution:**
```powershell
# Run checks manually to diagnose
.\KDS\scripts\run-health-checks.ps1 -Verbose

# Check specific slow category
.\KDS\scripts\run-health-checks.ps1 -Category performance -Verbose
```

---

## 🔒 Security

### API Server Security

**⚠️ IMPORTANT:** The API server is designed for **local development only**.

**Security Features:**
- ✅ Binds to `localhost` only (not accessible from network)
- ✅ No authentication (local access only)
- ✅ Read-only operations (GET endpoints only)
- ✅ CORS enabled for local files

**Do NOT:**
- ❌ Expose to network (bind to 0.0.0.0)
- ❌ Open firewall for this port
- ❌ Use in production environments
- ❌ Share the port publicly

### Health Check Security

**What Checks Access:**
- ✅ Local file system (read operations)
- ✅ Git status (via git command)
- ✅ Process memory (current process only)

**What Checks Do NOT Access:**
- ❌ Network resources
- ❌ External APIs
- ❌ User credentials
- ❌ Sensitive file contents

---

## 📝 Example Workflows

### Daily Health Check

```powershell
# Morning routine

# 1. Start API server (in terminal 1)
.\KDS\scripts\dashboard-api-server.ps1

# 2. Open dashboard (in browser)
start KDS\kds-dashboard.html

# 3. Run checks
# Click "Refresh" button in dashboard

# 4. Review recommendations
# Check recommendations panel for any warnings
```

### CI/CD Integration

```powershell
# In your build pipeline

# Run health checks and save results
.\KDS\scripts\run-health-checks.ps1 -OutputFormat json | Out-File health-report.json

# Parse results
$report = Get-Content health-report.json | ConvertFrom-Json

# Fail build if critical issues
if ($report.overallStatus -eq 'CRITICAL') {
    Write-Error "Health check failed: $($report.stats.critical) critical issues"
    exit 1
}

# Warn on degraded
if ($report.overallStatus -eq 'DEGRADED') {
    Write-Warning "Health check degraded: $($report.stats.warnings) warnings"
}
```

### Automated Monitoring

```powershell
# Schedule this script to run periodically

# Run checks and email results
$report = .\KDS\scripts\run-health-checks.ps1 -OutputFormat json | ConvertFrom-Json

if ($report.overallStatus -ne 'HEALTHY') {
    # Send email alert
    $body = "KDS Health Status: $($report.overallStatus)`n"
    $body += "Passed: $($report.stats.passed)`n"
    $body += "Warnings: $($report.stats.warnings)`n"
    $body += "Critical: $($report.stats.critical)`n"
    
    Send-MailMessage -To "team@example.com" -Subject "KDS Health Alert" -Body $body
}
```

---

## 🚀 Advanced Usage

### Custom Health Checks

Add your own checks to `run-health-checks.ps1`:

```powershell
# In the script, add a new function:

function Test-CustomCategory {
    $checks = @()
    
    # Your custom check logic
    $result = if (Test-Path "MyCustomFile.txt") {
        @{ status = 'passed'; message = "Custom check passed" }
    } else {
        @{ status = 'critical'; message = "Custom file missing" }
    }
    
    $checks += Add-Check -CategoryName 'Custom' -CheckName 'My Check' -Result $result
    
    return @{
        id = 'custom'
        name = 'Custom Checks'
        icon = '🔥'
        checks = $checks
    }
}

# Add to main execution
'custom' { Test-CustomCategory }
```

### Custom API Endpoints

Add to `dashboard-api-server.ps1`:

```powershell
elseif ($path -eq "/api/custom") {
    # Your custom endpoint logic
    $responseData = @{
        customData = "Hello from custom endpoint"
    } | ConvertTo-Json
}
```

---

## 📚 Files Reference

| File | Purpose | Size |
|------|---------|------|
| `KDS/kds-dashboard.html` | Dashboard UI | ~60KB |
| `KDS/scripts/run-health-checks.ps1` | Health check engine | ~25KB |
| `KDS/scripts/dashboard-api-server.ps1` | API server | ~5KB |
| `KDS/scripts/open-dashboard.ps1` | Dashboard launcher | ~1KB |

---

## 🎉 Summary

**You Now Have:**
- ✅ **Comprehensive health check system** (39+ checks across 7 categories)
- ✅ **Local API server** (HTTP endpoints for dashboard)
- ✅ **Auto-detection** (Live mode with demo fallback)
- ✅ **Real-time results** (Watch checks run live)
- ✅ **Actionable recommendations** (Auto-generated from failures)
- ✅ **Multiple access methods** (API, PowerShell, dashboard)
- ✅ **CI/CD ready** (JSON output for automation)

**Next Steps:**
1. Start the API server
2. Open the dashboard
3. Click "Refresh" to run real health checks
4. Review recommendations and address any issues

---

**Questions?** Check the troubleshooting section or run health checks manually with `-Verbose` flag for detailed output.
