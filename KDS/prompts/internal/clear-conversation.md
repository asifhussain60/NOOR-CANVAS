# Clear Conversation Context

**Purpose:** Manually reset conversation context when starting a fresh discussion

**Version:** 1.0

---

## 🎯 When to Use

Clear conversation context when:
- 🔄 Starting a completely different topic/project
- 🧹 Context feels polluted with unrelated messages
- 🔧 Testing intent detection without prior context
- 🚀 Beginning a new work session after a long break

**Note:** Context auto-expires after 2 hours, so manual clearing is rarely needed!

---

## 🔧 Usage

```bash
#file:KDS/prompts/internal/clear-conversation.md
```

---

## ⚙️ What It Does

1. ✅ Deletes all messages from `KDS/kds-brain/conversation-context.jsonl`
2. ✅ Resets conversation state to empty
3. ✅ Next message will have no prior context

**Effect:**
```
Before clear:
  Context: [
    "I want to add FAB button",
    "Make it purple",
    "Add pulse animation"
  ]
  
  You: "Change the color"
  KDS: Knows you mean FAB button color

After clear:
  Context: []
  
  You: "Change the color"
  KDS: What color? Of what? (no context)
```

---

## 🚨 Implementation

```powershell
# PowerShell implementation

# Clear conversation context file
$contextFile = "D:\PROJECTS\NOOR CANVAS\KDS\kds-brain\conversation-context.jsonl"

if (Test-Path $contextFile) {
    # Delete file content (keep file for next write)
    Clear-Content $contextFile
    Write-Host "✅ Conversation context cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No conversation context file found (already empty)" -ForegroundColor Yellow
}
```

---

## ✅ Confirmation

**Output:**
```
✅ Conversation context cleared

All prior messages removed. Next message will have fresh context.
```

---

## 🔄 Alternative: Wait for Auto-Expiration

**Instead of manual clear, you can:**
- ⏰ Wait 2 hours of inactivity → Context auto-expires
- 🔄 Start a new feature → Context switch detected automatically

**Manual clear is OPTIONAL - auto-expiration handles most cases!**
