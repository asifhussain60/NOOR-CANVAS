# KDS Monitoring Dashboard - User Guide

**Purpose:** Simple, visual monitoring for KDS development  
**Type:** HTML dashboard with auto-refresh  
**Perfect for:** Solo developers actively working on KDS

---

## 🚀 Quick Start

### Method 1: VS Code Task (Recommended)

1. Press `Ctrl+Shift+P` (Command Palette)
2. Type: `Tasks: Run Task`
3. Select: `kds: monitoring dashboard`
4. Dashboard opens in your browser automatically!

### Method 2: PowerShell Script

```powershell
# From project root
.\KDS\scripts\generate-monitoring-dashboard.ps1 -Open
```

### Method 3: Manual

```powershell
# Generate dashboard
.\KDS\scripts\generate-monitoring-dashboard.ps1

# Open manually
Start-Process "D:\PROJECTS\NOOR CANVAS\KDS\reports\monitoring\dashboard.html"
```

---

## 📊 What You'll See

### System Status
- ✅ **HEALTHY** - Everything working correctly
- ⚠️ **WARNING** - Some warnings but functional
- ❌ **CRITICAL** - Integration failures detected

### Conversation Tracking
- Active conversation (if any)
- Messages in context buffer
- Total conversations (X / 20 max)
- Last message timestamp

### BRAIN Health
- Knowledge graph entries
- Commits analyzed (dev context)
- Code velocity metrics
- Pending events count

### Integration Health
- Router integration status
- File existence checks
- Configuration validation

### Recent Conversations
- Last 5 conversations
- Message counts
- Duration
- Completion status

---

## 🔄 Auto-Refresh

Dashboard **auto-refreshes every 30 seconds** by default.

**To change refresh rate:**
```powershell
.\KDS\scripts\generate-monitoring-dashboard.ps1 -RefreshSeconds 60 -Open
```

---

## 📍 Dashboard Location

**File:** `KDS/reports/monitoring/dashboard.html`

**URL:** `file:///D:/PROJECTS/NOOR CANVAS/KDS/reports/monitoring/dashboard.html`

You can bookmark this URL in your browser for quick access!

---

## 🎨 Features

### Visual Design
- Dark theme (VS Code style)
- Color-coded status indicators
- Clean, readable layout
- Responsive design

### Metrics Displayed
- **Conversation tracking stats**
  - Active conversation
  - Message buffer size
  - FIFO queue status (X/20)
  - Last activity timestamp

- **BRAIN health**
  - Knowledge graph size
  - Development context metrics
  - Event processing backlog

- **Integration validation**
  - Router integration check
  - File existence verification
  - Configuration validation

- **Recent activity**
  - Last 5 conversations
  - Message counts and duration
  - Completion outcomes

### Alerts
- ❌ **Errors** - Critical failures (red background)
- ⚠️ **Warnings** - Issues to be aware of (yellow background)

---

## 🛠️ Customization

### Change Refresh Rate

Edit the task in `.vscode/tasks.json`:

```json
{
    "label": "kds: monitoring dashboard",
    "args": [
        ...
        "-RefreshSeconds", "60"  // Change to 60 seconds
    ]
}
```

Or run script directly:
```powershell
.\KDS\scripts\generate-monitoring-dashboard.ps1 -RefreshSeconds 60 -Open
```

### Keep Dashboard Open

The dashboard auto-refreshes! Just leave the browser tab open and it updates every 30 seconds automatically.

---

## 🔍 Troubleshooting

### Dashboard Shows "No Data"

**Cause:** BRAIN files don't exist yet  
**Fix:** Use KDS to create some conversations first

```powershell
#file:KDS/prompts/user/kds.md
test message
```

### Integration Shows "Missing"

**Cause:** intent-router.md doesn't have PowerShell integration  
**Fix:** This was just fixed! Verify the file has `conversation-stm.ps1` calls

### Old Data Displayed

**Cause:** Dashboard hasn't refreshed yet  
**Fix:** 
- Wait 30 seconds for auto-refresh
- Or manually re-run the task
- Or press F5 in browser

---

## 📈 Usage Patterns

### Daily Development

1. **Morning:** Open dashboard to see overnight activity
2. **During work:** Leave tab open, glance occasionally
3. **After changes:** Check integration health
4. **End of day:** Verify conversations finalized

### After Code Changes

1. Make KDS changes
2. Run dashboard task
3. Verify integration health shows ✅
4. Check for warnings

### Debugging Issues

1. Open dashboard
2. Check integration health section
3. Look for errors/warnings
4. Review recent conversations for clues

---

## 🎯 Best Practices

### ✅ DO:
- Keep dashboard tab open while working
- Check after KDS changes
- Monitor conversation count (should stay ≤ 20)
- Review warnings periodically

### ❌ DON'T:
- Leave too many browser tabs open (one is enough)
- Worry about refresh rate (30s is fine)
- Manually refresh (auto-refresh handles it)

---

## 🔗 Related Files

**Script:** `KDS/scripts/generate-monitoring-dashboard.ps1`  
**Output:** `KDS/reports/monitoring/dashboard.html`  
**Task:** `.vscode/tasks.json` - `kds: monitoring dashboard`

**Data Sources:**
- `KDS/kds-brain/conversation-history.jsonl`
- `KDS/kds-brain/conversation-context.jsonl`
- `KDS/kds-brain/conversation-active.json`
- `KDS/kds-brain/knowledge-graph.yaml`
- `KDS/kds-brain/development-context.yaml`
- `KDS/kds-brain/events.jsonl`

---

## 💡 Tips

### Bookmark the Dashboard
Add the file:/// URL to your browser bookmarks for instant access

### Keep It Simple
This dashboard is intentionally simple - just the essentials for development monitoring

### No Service Needed
Unlike Windows Service, this only runs when you explicitly trigger it. Perfect for development!

### Lightweight
The dashboard is a static HTML file - minimal resources, fast loading

---

## 🆘 Need Help?

**Dashboard not opening?**
- Check file exists: `Test-Path "KDS/reports/monitoring/dashboard.html"`
- Run script manually to see errors

**Data looks wrong?**
- BRAIN files might be stale
- Try running a KDS command to generate activity

**Integration shows failed?**
- Re-run Tier 1 fixes
- Check intent-router.md has PowerShell code

---

**Created:** 2025-11-03  
**Purpose:** Development monitoring (not production)  
**Maintenance:** None required (runs on-demand)
