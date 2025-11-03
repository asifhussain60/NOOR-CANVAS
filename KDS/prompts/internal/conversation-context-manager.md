# Conversation Context Manager

**Purpose:** Track recent user messages to provide conversational continuity in KDS interactions

**Version:** 1.0  
**Architecture:** BRAIN system component

---

## 🎯 Responsibility

Maintain a rolling window of recent conversation history so KDS can understand follow-up messages in context.

**Problem this solves:**
```
Without conversation memory:
  User: "I want to add a FAB button"
  KDS: Creates plan
  
  User: "Make it purple"
  KDS: ❌ What should be purple? (no context)

With conversation memory:
  User: "I want to add a FAB button"
  KDS: Creates plan + Logs to conversation-context.jsonl
  
  User: "Make it purple"
  KDS: ✅ Sees previous "FAB button" message → "Update FAB button to purple"
```

---

## 📊 Data Structure

**File:** `KDS/kds-brain/conversation-context.jsonl`

**Format:** JSON Lines (one JSON object per line)

```jsonl
{"timestamp":"2025-11-03T14:23:45Z","user_message":"I want to add a FAB button","intent":"PLAN","session_id":"fab-button-20251103"}
{"timestamp":"2025-11-03T14:24:12Z","user_message":"Make it purple","intent":"EXECUTE","session_id":"fab-button-20251103","context_ref":"FAB button"}
{"timestamp":"2025-11-03T14:25:01Z","user_message":"Add a pulse animation","intent":"PLAN","session_id":"fab-button-20251103","context_ref":"FAB button"}
```

**Fields:**
- `timestamp` (ISO 8601) - When message was sent
- `user_message` (string) - Exact user message
- `intent` (string) - Detected intent (PLAN, EXECUTE, etc.)
- `session_id` (string) - Active session ID (if any)
- `context_ref` (string, optional) - Entity referenced from previous messages

---

## 🔄 Automatic Logging

Every time the Intent Router processes a user message, it MUST:

1. **Read last 10 messages** from conversation-context.jsonl
2. **Analyze current message** in context of previous messages
3. **Log current message** with detected intent and context references
4. **Rotate if needed** - Keep only last 10 messages, delete older

**Pseudocode:**
```python
def process_user_message(user_message):
    # Step 1: Load recent context
    recent_context = load_last_n_messages(n=10)
    
    # Step 2: Analyze with context
    intent = detect_intent(user_message, recent_context)
    context_refs = extract_context_references(user_message, recent_context)
    
    # Step 3: Log this message
    log_conversation_entry({
        "timestamp": now(),
        "user_message": user_message,
        "intent": intent,
        "session_id": current_session_id,
        "context_ref": context_refs
    })
    
    # Step 4: Rotate (keep only last 10)
    rotate_conversation_context(max_entries=10)
    
    # Step 5: Route with context
    route_to_agent(intent, context=recent_context)
```

---

## 🧩 Context Reference Extraction

**Goal:** Identify when user references something from previous messages

**Patterns to detect:**

```yaml
pronouns:
  - "it" → most recent noun entity
  - "that" → most recent feature/file/component
  - "the button" → most recent button mentioned
  - "the file" → most recent file mentioned

demonstratives:
  - "this" → current/most recent entity
  - "these" → plural of most recent entity

implicit_references:
  - "Make it purple" → "it" refers to last entity
  - "Add tests for that" → "that" refers to last feature
  - "Change the color" → "the" implies specific entity from context
```

**Algorithm:**
```python
def extract_context_references(message, recent_context):
    refs = []
    
    # Check for pronouns
    if "it" in message or "that" in message or "this" in message:
        # Find most recent entity in context
        for prev_msg in reversed(recent_context):
            entities = extract_entities(prev_msg["user_message"])
            if entities:
                refs.append(entities[0])  # Most recent entity
                break
    
    # Check for "the X" patterns (implies specific X from context)
    the_patterns = re.findall(r"\bthe ([\w\s]+)", message)
    for pattern in the_patterns:
        # Search recent context for this entity
        for prev_msg in reversed(recent_context):
            if pattern in prev_msg["user_message"]:
                refs.append(pattern)
                break
    
    return refs
```

---

## 🎯 Integration with Intent Router

**Intent Router MUST query conversation context before routing:**

```markdown
# In intent-router.md

## Step 1: Load Conversation Context

Before analyzing intent, load recent conversation history:

#file:KDS/prompts/internal/conversation-context-manager.md load

This returns last 10 user messages with detected intents and entities.

## Step 2: Analyze Current Message with Context

If current message contains:
- Pronouns (it, that, this)
- Demonstratives (the X, that X)
- Implicit references

→ Resolve references from conversation context
→ Expand message with explicit references

Example:
  User: "Make it purple"
  Context: Last message was "I want to add a FAB button"
  Expanded: "Make the FAB button purple"
  
## Step 3: Detect Intent with Expanded Message

Use expanded message for intent detection (more accurate).

## Step 4: Log to Conversation Context

After routing, log this message:

#file:KDS/prompts/internal/conversation-context-manager.md log \
  --message "Make it purple" \
  --intent "EXECUTE" \
  --context-ref "FAB button"
```

---

## 📋 Operations

### Load Recent Context

```bash
# PowerShell
#file:KDS/prompts/internal/conversation-context-manager.md load

Returns:
[
  {
    "timestamp": "2025-11-03T14:23:45Z",
    "user_message": "I want to add a FAB button",
    "intent": "PLAN",
    "session_id": "fab-button-20251103"
  },
  # ... up to 10 most recent messages
]
```

### Log New Message

```bash
# PowerShell
#file:KDS/prompts/internal/conversation-context-manager.md log \
  --message "Make it purple" \
  --intent "EXECUTE" \
  --session-id "fab-button-20251103" \
  --context-ref "FAB button"
```

### Clear Context (Manual Reset)

```bash
# PowerShell
#file:KDS/prompts/internal/conversation-context-manager.md clear

Output: ✅ Conversation context cleared (all messages removed)
```

### Auto-Expire (Automatic Cleanup)

**Triggered automatically by Intent Router:**

```python
def auto_expire_context():
    """Remove messages older than 2 hours"""
    cutoff_time = now() - timedelta(hours=2)
    
    messages = load_all_messages()
    recent_messages = [
        msg for msg in messages 
        if parse_timestamp(msg["timestamp"]) > cutoff_time
    ]
    
    save_messages(recent_messages)
```

**When it runs:**
- ✅ Before every intent detection (automatic)
- ✅ After 2 hours of inactivity (automatic)
- ✅ When conversation-context.jsonl is read (automatic)

---

## 🔄 Conversation Flow Examples

### Example 1: Follow-up Questions

```
User: "I want to add a FAB button"
Context: []

Router:
  - Detects PLAN intent
  - Logs: {"message": "I want to add a FAB button", "intent": "PLAN"}
  - Routes to: work-planner.md

User: "Make it purple"
Context: [{"message": "I want to add a FAB button", "intent": "PLAN"}]

Router:
  - Detects pronoun "it"
  - Resolves: "it" = "FAB button" (from context)
  - Expands: "Make the FAB button purple"
  - Detects EXECUTE intent (modify existing feature)
  - Logs: {"message": "Make it purple", "intent": "EXECUTE", "context_ref": "FAB button"}
  - Routes to: code-executor.md with context

Executor receives:
  - Original: "Make it purple"
  - Expanded: "Make the FAB button purple"
  - Context: User is refining the FAB button feature
  - Action: Update FAB button color to purple
```

### Example 2: Multi-step Refinement

```
User: "I want to add dark mode"
Context: []
Intent: PLAN → work-planner.md
Logged: {"message": "I want to add dark mode", "intent": "PLAN", "session_id": "dark-mode-123"}

User: "Use toggle switch, not button"
Context: [{"message": "I want to add dark mode", ...}]
Intent: CORRECT (refinement of plan)
Expanded: "Use toggle switch for dark mode, not button"
Logged: {"message": "Use toggle switch, not button", "intent": "CORRECT", "context_ref": "dark mode"}

User: "Put it in the header"
Context: [
  {"message": "I want to add dark mode", ...},
  {"message": "Use toggle switch, not button", ...}
]
Intent: EXECUTE (placement detail)
Expanded: "Put the dark mode toggle in the header"
Logged: {"message": "Put it in the header", "intent": "EXECUTE", "context_ref": "dark mode toggle"}
```

### Example 3: Context Switching

```
User: "I want to add a FAB button"
Context: []
Intent: PLAN
Session: fab-button-20251103

User: "Actually, let's work on dark mode first"
Context: [{"message": "I want to add a FAB button", "session_id": "fab-button-20251103"}]
Intent: PLAN (new feature, context switch detected)
Logged: {"message": "Actually, let's work on dark mode first", "intent": "PLAN", "session_id": null}

Router detects:
  - "Actually" = correction/change of direction
  - "dark mode" = new entity (not in context)
  - Creates NEW session: dark-mode-20251103
  - Context cleared (new focus)
```

---

## 🧹 Maintenance

### Automatic Rotation (No User Action)

**Happens automatically:**
- ✅ After every 10th message logged
- ✅ Keeps only most recent 10 messages
- ✅ Older messages deleted

**File size stays small:**
- 10 messages × ~200 bytes = ~2 KB
- Minimal disk usage
- Fast to read/parse

### Manual Clear (User-Initiated)

**When to clear:**
- 🔄 Starting fresh conversation about different topic
- 🧹 Context is polluted with unrelated messages
- 🔧 Testing intent detection without prior context

**How to clear:**
```bash
#file:KDS/prompts/internal/conversation-context-manager.md clear
```

---

## 🔒 Privacy & Security

**What's stored:**
- ✅ User messages (last 10 only)
- ✅ Detected intents (PLAN, EXECUTE, etc.)
- ✅ Session IDs (for correlation)
- ✅ Context references (extracted entities)

**What's NOT stored:**
- ❌ Full chat history (only last 10 messages)
- ❌ Copilot responses (only user messages)
- ❌ Code snippets (only metadata)
- ❌ Sensitive data (credentials, tokens, etc.)

**Auto-expiration:**
- ⏰ Messages older than 2 hours deleted automatically
- 🧹 Context cleared on manual reset
- 📦 File size capped at 10 messages

**Local storage:**
- 🏠 Stored in `KDS/kds-brain/conversation-context.jsonl`
- 🔒 Never sent to external services
- 💻 Stays on your machine

---

## ✅ Integration Checklist

To enable conversation context in KDS:

**Step 1: Update Intent Router**
- [ ] Load conversation context before intent detection
- [ ] Resolve pronoun/demonstrative references
- [ ] Expand message with explicit references
- [ ] Log message after routing

**Step 2: Create Context File**
- [ ] Create `KDS/kds-brain/conversation-context.jsonl` (empty initially)
- [ ] Set file permissions (read/write for KDS)

**Step 3: Update All Agents**
- [ ] Agents receive expanded message (not just original)
- [ ] Agents aware of conversation context for better decisions

**Step 4: Test Conversation Flow**
- [ ] Test follow-up questions ("Make it purple")
- [ ] Test multi-step refinement ("Put it in header")
- [ ] Test context switching ("Actually, let's do dark mode")
- [ ] Test auto-expiration (wait 2 hours, verify clear)

---

## 🎓 Summary

**Conversation Context Manager:**
- 📝 Logs last 10 user messages automatically
- 🔄 Resolves pronouns and references
- 🧩 Provides continuity between messages
- ⏰ Auto-expires after 2 hours
- 🏠 100% local storage
- 🧹 Manual clear available

**Benefits:**
- ✅ Natural follow-ups ("Make it purple" understands "it")
- ✅ Less repetition (no need to restate context)
- ✅ Better intent detection (context improves accuracy)
- ✅ Smarter routing (knows conversation flow)

**Zero maintenance:**
- ✅ Logs automatically
- ✅ Rotates automatically
- ✅ Expires automatically
- ✅ Just works!

---

**See Also:**
- `#file:KDS/prompts/internal/intent-router.md` - Uses conversation context
- `#file:KDS/kds-brain/README.md` - BRAIN system overview
- `#file:KDS/prompts/internal/clear-conversation.md` - Manual context reset
