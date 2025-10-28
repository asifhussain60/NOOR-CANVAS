# Invocation Parser Algorithm

**Purpose:** Parse user invocation to extract target, request, and parameters

**Used by:** route.prompt.md (Step -1)

---

## Algorithm

**Input:** raw_user_input (string)

**Output:** { target, request, key, context, auto_execute }

**Supported Formats:**

1. **Positional target:** `/route plan "request text"`
2. **Named parameters:** `/route target=plan request="text" key=my-key`
3. **Default (intelligent routing):** `/route "request text"`
4. **Mixed:** `/route plan key=my-key "request text"`

---

## Parsing Rules

**Step 1: Extract command**
- Remove `/route` or `@workspace /route` prefix
- Trim whitespace

**Step 2: Detect format**
- If first word matches valid target → positional
- If contains `=` → named parameters
- Otherwise → default (intelligent routing)

**Step 3: Extract target**
- Positional: first word after `/route`
- Named: value after `target=`
- Default: null (triggers intelligent routing)

**Valid targets:**
- plan, task, todo, test, ask, healthcheck, drift, cohesion

**Step 4: Extract request**
- Positional: text in quotes or after target
- Named: value after `request=`
- Default: entire input after `/route`

**Step 5: Extract optional parameters**
- key: `key=value`
- context: `context="value"`
- auto-execute: `auto-execute=true` (default: false)

---

## Examples

**Input:** `/route plan "Fix share button"`
**Output:** 
```
target: plan
request: Fix share button
key: null
context: null
auto_execute: false
```

**Input:** `/route "Why is share button missing?"`
**Output:**
```
target: null (intelligent routing)
request: Why is share button missing?
key: null
context: null
auto_execute: false
```

**Input:** `/route task key=my-feature "Add validation"`
**Output:**
```
target: task
request: Add validation
key: my-feature
context: null
auto_execute: false
```

**Input:** `/route target=plan request="Fix bug" auto-execute=true`
**Output:**
```
target: plan
request: Fix bug
key: null
context: null
auto_execute: true
```

---

## Error Handling

**Invalid target:**
- Show valid targets list
- Suggest closest match
- Default to `plan`

**Missing request:**
- Return error
- Require user to provide request text

**Malformed parameters:**
- Show correct format
- Parse best-effort
- Continue with defaults

---

## See Also

- `../route.prompt.md` - Step -1 implementation
- `work-classifier.md` - Intelligent routing logic
