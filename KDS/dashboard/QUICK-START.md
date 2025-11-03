# KDS Dashboard - Quick Start Guide

**Get up and running in 2 minutes!**

---

## 🚀 **RECOMMENDED: All-in-One Command**

### Single Command - Does Everything!
```
Ctrl+Shift+P → Tasks: Run Task → "kds: launch dashboard (all-in-one)"
```

**What it does:**
1. ✅ Starts API server in background
2. ✅ Opens dashboard in your browser
3. ✅ Ready for live health checks immediately

**Then:** Click the **"🔄 Refresh"** button to run real health checks!

**Status:** Dashboard will show **🔗 Live** mode

**To Stop:** Press `Ctrl+C` in the terminal (dashboard stays open)

---

## 🔧 Alternative: Manual Control

If you want separate control over API server and dashboard:

### Step 1: Start API Server
```
Ctrl+Shift+P → Tasks: Run Task → "kds: start api server"
```

### Step 2: Open Dashboard
```
Ctrl+Shift+P → Tasks: Run Task → "kds: health dashboard"
```

---

## 🎮 Demo Mode (No API Server)

Want to try the dashboard without live checks?

### Open Dashboard Only
```
Ctrl+Shift+P → Tasks: Run Task → "kds: health dashboard"
```

Click **"🔄 Refresh"** to see simulated checks.

**Status:** Dashboard will show **🎮 Demo** mode

---

## 📊 What You'll See

### Header Stats
- **Overall Status** - HEALTHY / DEGRADED / CRITICAL
- **Mode** - 🔗 Live or 🎮 Demo
- **Components** - Passed / Total checks
- **Warnings** - Count of warnings

### Tabs

| Tab | What It Shows |
|-----|---------------|
| 📊 **Overview** | System status at a glance (6 cards) |
| ❤️ **Health Checks** | Detailed checks (7 categories, 39+ checks) |
| 🧠 **BRAIN System** | BRAIN metrics and statistics |
| 📝 **Activity Log** | Recent system events |

---

## 🔍 How to Use Health Checks

1. Switch to **"❤️ Health Checks"** tab
2. Click any category header to expand
3. Watch checks run with animated status circles:
   - ○ Pending (gray)
   - ◐ Running (blue, spinning)
   - ● Passed (green)
   - ● Warning (orange)
   - ● Critical (red)
4. Review recommendations at the bottom (if any issues found)

---

## 💡 Pro Tips

### Continuous Monitoring
- **Pin the browser tab** to keep it visible
- Dashboard auto-refreshes every 30 seconds
- Glance at overview cards for quick status

### Drill Down
- **Click overview cards** to jump to specific health checks
- **Expand categories** to see individual check details
- **Read recommendations** for actionable next steps

### Export Reports
- Click **"📊 Export Report"** button
- Saves JSON file with timestamp
- Use for offline analysis or CI/CD

---

## 🛠️ Troubleshooting

### Dashboard Shows "🎮 Demo Mode" (and I want live checks)

**Problem:** API server not running

**Solution:**
```
Ctrl+Shift+P → Tasks: Run Task → "kds: start api server"
```

### Health Checks Are Slow

**Problem:** Large files or slow disk

**Solution:**
```powershell
# Run checks manually to diagnose
.\KDS\scripts\run-health-checks.ps1 -VerboseOutput
```

### Want to Run Checks from Command Line

```powershell
# All checks (JSON)
.\KDS\scripts\run-health-checks.ps1

# Specific category
.\KDS\scripts\run-health-checks.ps1 -Category brain

# Human-readable output
.\KDS\scripts\run-health-checks.ps1 -OutputFormat text
```

---

## 📚 Learn More

- **Full Documentation** - See `HEALTHCHECK-INTEGRATION.md`
- **Dashboard Features** - See `README.md`
- **Quick Reference** - See `QUICK-REFERENCE.md`

---

**Ready?** Open the dashboard and click Refresh! 🎉
