# 🧠 KDS Dashboard - Quick Reference

## 🚀 Launch Dashboard

```powershell
# VS Code Task (Fastest)
Ctrl+Shift+P → Tasks: Run Task → "kds: health dashboard"

# PowerShell
.\KDS\scripts\open-dashboard.ps1

# Direct
Double-click: KDS/kds-dashboard.html
```

## 📊 Tabs

| Tab | Purpose | Key Info |
|-----|---------|----------|
| 📊 **Overview** | System status at a glance | 6 clickable cards |
| ❤️ **Health Checks** | Detailed health validation | 7 categories, 39+ checks |
| 🧠 **BRAIN System** | BRAIN metrics & analytics | Events, patterns, anomalies |
| 📝 **Activity Log** | Recent system activity | Timestamped events |

## 🎨 Status Indicators

| Symbol | Status | Color | Animation |
|--------|--------|-------|-----------|
| ○ | Pending | Gray | None |
| ◐ | Running | Blue | Spinning border |
| ● | Passed | Green | None |
| ● | Warning | Orange | Slow pulse (2s) |
| ● | Critical | Red | Fast pulse (1s) |

## 🔍 Health Check Categories

1. 🏗️ **Infrastructure** (6 checks) - Files, config, permissions
2. 🤖 **Agents & Prompts** (7 checks) - All KDS agents
3. 🧠 **BRAIN System** (6 checks) - Knowledge, events, protection
4. 📊 **Session State** (5 checks) - Sessions, history, resumption
5. 📚 **Knowledge Base** (5 checks) - Patterns, mappings, workflows
6. 🔧 **Scripts & Tools** (5 checks) - PowerShell scripts
7. ⚡ **Performance** (5 checks) - Speed, size, memory

## 🎯 Quick Actions

```javascript
// Run all health checks
Click "🔄 Refresh" button

// Drill into category
Click overview card OR expand category in Health tab

// Export report
Click "📊 Export Report" button

// Auto-refresh
Already enabled (30s default)
```

## 📁 Files

```
KDS/kds-dashboard.html           # The dashboard (single file)
KDS/scripts/open-dashboard.ps1   # Launcher script
KDS/dashboard/README.md          # Full documentation
```

## 🛠️ Customization

```javascript
// Edit kds-dashboard.html

// Change refresh interval
state.refreshInterval = 60000;  // 60 seconds

// Disable auto-refresh
state.autoRefresh = false;

// Add custom check category
healthCheckCategories.push({
  id: 'custom',
  icon: '🔥',
  name: 'Custom',
  checks: [...]
});
```

## 💡 Tips

- **Pin the tab** for continuous monitoring
- **Click cards** in overview to drill down
- **Expand categories** to see individual checks
- **Export reports** for offline analysis
- **Check recommendations** when status is yellow/red

---

**File Size:** ~50KB  
**Dependencies:** None  
**Browser:** Any modern browser  
**Status:** ✅ Production Ready
