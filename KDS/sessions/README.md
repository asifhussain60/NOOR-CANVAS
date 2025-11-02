# Session State - Multi-Chat Continuity

**Purpose:** Enable seamless work resumption across multiple Copilot chat sessions  
**Version:** 1.0  
**Governed By:** Rule #2 (Live Design Document)

---

## 🎯 Problem Statement

**GitHub Copilot cannot access previous chat histories.** Each new chat starts fresh, forcing users to:
- ❌ Re-explain entire context
- ❌ Describe what was already done
- ❌ Manually track where they left off
- ❌ Lose momentum between sessions

**KDS Solution:** Persistent session state files that Copilot can read in ANY chat.

---

## 📂 Structure

### `current-session.json`
**Active work-in-progress** for the current feature/task.

**Updated:**
- After every task completion (Rule #16 Step 6)
- When switching features
- When pausing work

**Contains:**
- Session ID and timestamps
- Feature being worked on
- Current phase/task
- Completed tasks with artifacts
- Next task with suggested command
- Context (decisions, issues, blockers)
- Resumption guide

### `session-history.json`
**Archive of completed sessions** for historical reference.

**Updated:**
- When session marked complete
- Moved from `current-session.json`

**Contains:**
- Array of past sessions
- Completion timestamps
- Final artifacts
- Lessons learned

### `resumption-guide.md`
**Human-readable quick start** for new chats.

**Updated:**
- Every time `current-session.json` changes
- Auto-generated from session state

**Contains:**
- "What was I working on?" summary
- "Where did I leave off?" status
- "What should I do next?" command
- Key context files to read

---

## 🚀 Usage

### Starting a New Chat Session

**Option 1: Resume Command (Recommended)**
```
@workspace /resume
```

**What happens:**
1. Copilot reads `sessions/current-session.json`
2. Shows session summary (feature, phase, last task, next task)
3. Provides exact command to continue

**Option 2: Ask-KDS**
```
@workspace I have a question about KDS: What was I working on?
```

**What happens:**
1. Copilot reads `KDS-DESIGN.md`, `sessions/current-session.json`, git log
2. Synthesizes answer with context
3. Shows recent work and next steps

**Option 3: Manual Read**
```
@workspace Read KDS/sessions/resumption-guide.md
```

---

## 📋 Session State Schema

### `current-session.json` Format

```json
{
  "sessionId": "YYYY-MM-DD-{feature-slug}",
  "createdAt": "ISO 8601 timestamp",
  "lastUpdated": "ISO 8601 timestamp",
  "status": "ACTIVE | PAUSED | BLOCKED | COMPLETE",
  "feature": "Human-readable feature name",
  "branch": "Git branch name",
  "currentPhase": "Phase/milestone name",
  "completedTasks": [
    {
      "taskId": "unique-task-id",
      "description": "What was done",
      "completedAt": "ISO 8601 timestamp",
      "artifact": "file/path or array of file paths"
    }
  ],
  "nextTask": {
    "taskId": "unique-task-id",
    "description": "What to do next",
    "estimatedDuration": "Human estimate",
    "dependencies": ["List of dependencies"],
    "suggestedCommand": "Exact command to run"
  },
  "context": {
    "lastUserQuestion": "Most recent user question",
    "keyDecisions": ["Important decisions made"],
    "openIssues": ["Known issues to address"],
    "blockers": ["Blockers preventing progress"]
  },
  "resumptionGuide": {
    "quickStart": "Command to resume work",
    "contextFiles": ["Files to read for context"],
    "recentCommits": ["Recent git commits"]
  }
}
```

---

## 🔄 Automatic Updates (Rule #16)

**When:** After EVERY task completion  
**Triggered By:** Rule #16 Step 6 (Living Docs Update)

**Updates:**
1. Mark current task as complete
2. Add artifact paths
3. Update `lastUpdated` timestamp
4. Set next task from plan
5. Update resumption guide
6. Archive to `session-history.json` if feature complete

---

## 📊 Example Workflow

### Day 1 - Start Feature
```
User: @workspace /plan "Add anti-bloat guardrails to KDS"
Copilot: [Creates plan, updates current-session.json]

Session State:
- sessionId: "2025-11-02-v4.3-guardrails"
- status: ACTIVE
- currentPhase: "Planning"
- nextTask: "Document anti-patterns from v2.1.0"
```

### Day 1 - Complete Task 1
```
User: @workspace /execute #file:KDS/keys/v4.3/handoffs/task-1.json
Copilot: [Completes task, updates session]

Session State:
- completedTasks: ["v4.3-anti-patterns"]
- nextTask: "Implement publishing guardrails"
```

### Day 2 - Resume Work (NEW CHAT)
```
User: @workspace /resume
Copilot: 
📊 Session Resume - 2025-11-02-v4.3-guardrails

Feature: KDS v4.3 - Anti-Bloat Guardrails
Branch: features/fab-button
Status: ACTIVE
Last Updated: 2025-11-02 (yesterday)

Completed:
✅ v4.3-anti-patterns (KDS-ANTI-PATTERNS.md)

Next Task:
🔄 Implement publishing guardrails
   Duration: ~30 minutes
   Command: @workspace /execute #file:KDS/keys/v4.3/handoffs/task-2.json

Context Files:
- KDS/KDS-DESIGN.md (v4.3.0)
- KDS/docs/KDS-ANTI-PATTERNS.md
```

---

## 🛡️ Best Practices

### 1. Update Session State After Every Task
Rule #16 Step 6 does this automatically.

### 2. Commit Session State With Changes
```bash
git add KDS/sessions/current-session.json
git commit -m "Update session state - task XYZ complete"
```

### 3. Archive Completed Sessions
When feature complete:
```bash
# Manual archive (or automated via Rule #16)
mv sessions/current-session.json sessions/archive/2025-11-02-v4.3-complete.json
```

### 4. Keep Resumption Guide Short
Max 200 lines - just enough to resume, not full history.

---

## 🔗 Related Documentation

- **KDS-DESIGN.md:** Single source of truth for KDS architecture
- **governance/rules.md:** Rule #16 (automatic session updates)
- **prompts/user/resume.md:** Resume command implementation
- **prompts/user/ask-kds.md:** Query KDS design and session state

---

## 📝 Maintenance

### Weekly Cleanup
- Archive sessions older than 30 days (move to `session-history.json`)
- Delete sessions older than 90 days (trust git history)

### Monthly Review
- Review session patterns (which features take longest?)
- Identify common blockers
- Update resumption guide template if needed

---

**Last Updated:** 2025-11-02  
**Version:** 1.0  
**Governed By:** Rule #2 (Live Design Document), Rule #16 (Mandatory Post-Task)

